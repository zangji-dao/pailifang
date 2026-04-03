import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, rmSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// 强制使用 Node.js 运行时
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Marker {
  id: string;
  documentId: string;
  variableKey?: string;
  status: 'pending' | 'bound' | 'error';
  position: {
    beforeText: string;
    afterText: string;
    textOffset: number;
  };
  displayText?: string;
}

interface TemplateVariable {
  id: string;
  name: string;
  key: string;
  type: string;
  category: string;
}

interface Attachment {
  id: string;
  url: string;
  html: string;
  name?: string;
}

interface DraftData {
  markers: Marker[];
  selectedVariables: TemplateVariable[];
  editedHtml?: string;
  attachments?: Attachment[];
}

// LibreOffice 用户配置目录
const LIBREOFFICE_PROFILE = '/tmp/libreoffice-profile';

// LibreOffice 预热状态
let libreOfficeWarmedUp = false;
let warmupPromise: Promise<void> | null = null;

/**
 * 预热 LibreOffice - 执行一次空转换，加速后续转换
 */
async function ensureLibreOfficeWarmedUp(): Promise<void> {
  if (libreOfficeWarmedUp) return;
  
  // 如果正在预热，等待完成
  if (warmupPromise) {
    return warmupPromise;
  }
  
  // 开始预热
  warmupPromise = (async () => {
    console.log('预热 LibreOffice...');
    const tmpDir = join('/tmp', `libreoffice-warmup-${Date.now()}`);
    
    try {
      mkdirSync(tmpDir, { recursive: true });
      
      // 确保用户配置目录存在
      if (!existsSync(LIBREOFFICE_PROFILE)) {
        mkdirSync(LIBREOFFICE_PROFILE, { recursive: true });
      }
      
      // 创建一个简单的测试 HTML
      const testHtml = '<!DOCTYPE html><html><body><p>test</p></body></html>';
      const htmlFile = join(tmpDir, 'test.html');
      writeFileSync(htmlFile, testHtml, 'utf-8');
      
      // 执行一次快速转换来预热（转换为 txt 更快）
      execSync(
        `libreoffice --headless --nologo --nofirststartwizard --norestore ` +
        `--infilter="HTML" --convert-to txt --outdir "${tmpDir}" "${htmlFile}" ` +
        `-env:UserInstallation=file://${LIBREOFFICE_PROFILE}`,
        {
          timeout: 60000,
          env: { ...process.env, HOME: '/tmp' },
        }
      );
      libreOfficeWarmedUp = true;
      console.log('LibreOffice 预热完成');
    } catch (e) {
      console.error('LibreOffice 预热失败:', e);
      warmupPromise = null; // 允许重试
    } finally {
      // 清理
      try {
        rmSync(tmpDir, { recursive: true, force: true });
      } catch {}
    }
  })();
  
  return warmupPromise;
}

// 模块加载时启动后台预热（不阻塞）
ensureLibreOfficeWarmedUp();

/**
 * 使用 LibreOffice 将 HTML 转换为 Word 文档
 * 直接从 HTML → DOCX，避免中间步骤
 */
async function convertHtmlToDocxWithLibreOffice(html: string, outputDir: string): Promise<Buffer> {
  const startTime = Date.now();
  
  // 等待预热完成
  await ensureLibreOfficeWarmedUp();
  
  // 确保用户配置目录存在
  if (!existsSync(LIBREOFFICE_PROFILE)) {
    mkdirSync(LIBREOFFICE_PROFILE, { recursive: true });
  }

  // 保存 HTML 文件
  const htmlFile = join(outputDir, 'document.html');
  writeFileSync(htmlFile, html, 'utf-8');

  // 直接 HTML → DOCX（一步转换）
  console.log('LibreOffice: HTML → DOCX');
  const convertStartTime = Date.now();
  execSync(
    `libreoffice --headless --nologo --nofirststartwizard --norestore ` +
    `--infilter="HTML" --convert-to docx --outdir "${outputDir}" "${htmlFile}" ` +
    `-env:UserInstallation=file://${LIBREOFFICE_PROFILE}`,
    {
      timeout: 60000,
      env: { ...process.env, HOME: '/tmp' },
    }
  );
  console.log(`LibreOffice 转换耗时: ${Date.now() - convertStartTime}ms`);

  const docxFile = join(outputDir, 'document.docx');
  if (!existsSync(docxFile)) {
    throw new Error('DOCX 文件生成失败');
  }

  console.log(`LibreOffice 总耗时: ${Date.now() - startTime}ms`);
  return readFileSync(docxFile);
}

/**
 * 处理变量替换和 HTML 清理
 */
function processVariables(html: string, draftData: DraftData, variableValues?: Record<string, string>): string {
  let result = html;

  // 如果提供了 variableValues，替换变量值
  if (variableValues && Object.keys(variableValues).length > 0) {
    for (const [key, value] of Object.entries(variableValues)) {
      const varPattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(varPattern, value);
    }
  }

  // 将变量标记从 {{variableKey}} 转换为 {{变量名}}
  if (draftData.selectedVariables) {
    for (const variable of draftData.selectedVariables) {
      const keyPattern = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g');
      result = result.replace(keyPattern, `{{${variable.name}}}`);
    }
  }

  // 清理 marker 相关的 HTML 属性
  result = result.replace(/\s*data-marker-id="[^"]*"/g, '');
  result = result.replace(/\s*data-document-id="[^"]*"/g, '');
  result = result.replace(/\s*class="variable-marker[^"]*"/g, '');
  result = result.replace(/<span\s+[^>]*style="[^"]*"[^>]*>(\{\{[^}]+\}\})<\/span>/g, '$1');

  // 清理带分页样式的空段落（这些会导致表格前出现大片空白）
  // 只清理带 page-break-before: always 的空段落
  result = result.replace(/<p[^>]*page-break-before:\s*always[^>]*>\s*<br\s*\/?>\s*<\/p>/gi, '');
  
  // 清理非空段落中的 page-break-before: always 样式（保留内容，只移除分页样式）
  result = result.replace(/(<p[^>]*style="[^"]*?)page-break-before:\s*always;?\s*/gi, '$1');
  
  // 清理空的 style 属性
  result = result.replace(/\s*style="\s*"/g, '');
  
  // 清理文档末尾连续的空段落（超过5个连续空段落才清理，保留正常的段落间距）
  // 匹配 </table> 或 </p> 后面连续超过5个空段落的情况
  result = result.replace(/(<\/table>|<\/p>)((?:\s*<p[^>]*>\s*<br\s*\/?>\s*<\/p>\s*){5,})$/gi, '$1');
  result = result.replace(/(<\/table>|<\/p>)((?:\s*<p[^>]*>\s*<\/p>\s*){5,})$/gi, '$1');

  return result;
}

/**
 * 清理内联字体样式，确保字体一致性
 * 移除所有 font-family 和 font-size 内联样式，使用全局样式控制
 */
function normalizeFontStyles(html: string): string {
  let result = html;
  
  // 移除内联的 font-family 样式
  result = result.replace(/\s*font-family:\s*[^;"]+;?/gi, '');
  
  // 移除内联的 font-size 样式（统一使用全局字号，确保一致性）
  result = result.replace(/\s*font-size:\s*[^;"]+;?/gi, '');
  
  // 移除内联的 line-height 样式（统一使用全局行高）
  result = result.replace(/\s*line-height:\s*[^;"]+;?/gi, '');
  
  // 清理空的 style 属性
  result = result.replace(/\s*style="\s*"/g, '');
  
  // 清理只有空格的 style 属性
  result = result.replace(/\s*style="\s+"/g, '');
  
  return result;
}

/**
 * 合并多个 HTML 内容，用分页符分隔
 * 使用 LibreOffice 能识别的分页方式
 */
function mergeHtmlParts(parts: string[], debugMode = false): string {
  // 提取第一个文档的样式（避免重复）
  const firstPart = parts[0];
  const styleMatch = firstPart.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  const styles = styleMatch ? styleMatch.join('\n') : '';

  // 提取每个部分的内容
  const bodyContents = parts.map((part, index) => {
    // 尝试提取 body 内容
    const bodyMatch = part.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let content: string;
    
    if (bodyMatch) {
      // 有 body 标签，提取内容
      content = bodyMatch[1];
    } else {
      // 没有 body 标签，移除 style 和 head 标签后使用剩余内容
      content = part
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
        .replace(/<!DOCTYPE[^>]*>/gi, '')
        .replace(/<html[^>]*>/gi, '')
        .replace(/<\/html>/gi, '')
        .replace(/<body[^>]*>/gi, '')
        .replace(/<\/body>/gi, '')
        .trim();
    }

    // 调试模式：输出每个部分的内容片段
    if (debugMode) {
      console.log(`\n=== HTML Part ${index} (前500字符) ===`);
      console.log(content.substring(0, 500));
    }

    // 如果不是第一个部分，在前面添加分页符
    // 使用 p 标签 + page-break-before，LibreOffice 对此支持最好
    if (index > 0) {
      content = `<p style="page-break-before: always"></p>${content}`;
    }

    return content;
  });

  // 构建完整的 HTML
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
${styles}
<style>
/* 全局字体设置 - 确保所有文本使用统一字体和字号 */
body { 
  font-family: "SimSun", "宋体", serif; 
  font-size: 12pt;
  line-height: 1.5;
}

p, td, th, span, div, li { 
  font-family: "SimSun", "宋体", serif; 
  font-size: 12pt;
  line-height: 1.5;
}

/* 标题字号 */
h1 { font-size: 16pt; }
h2 { font-size: 14pt; }
h3 { font-size: 12pt; font-weight: bold; }

/* 确保表格边框显示 */
table { border-collapse: collapse; }
td, th { border: 1px solid black; }
</style>
</head>
<body>
${bodyContents.join('\n')}
</body>
</html>`;
}

/**
 * POST /api/contract-templates/export-word
 * 使用 LibreOffice 双向转换导出 Word 文档
 * 支持 debug=true 参数，返回处理后的 HTML 而非 Word 文件
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { templateId, variableValues, debug } = body;

    if (!templateId) {
      return NextResponse.json({ success: false, error: '缺少模板ID' }, { status: 400 });
    }

    const { data: template, error: fetchError } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (fetchError || !template) {
      return NextResponse.json({ success: false, error: '模板不存在' }, { status: 404 });
    }

    const draftData = (template as any).draft_data as DraftData | null;

    if (!draftData) {
      // 调试：输出模板数据，帮助排查 draft_data 为空的原因
      console.log('模板数据:', JSON.stringify({
        id: template.id,
        name: template.name,
        status: template.status,
        hasDraftData: false,
        source_file_url: (template as any).source_file_url,
      }, null, 2));
      return NextResponse.json({ success: false, error: '没有找到草稿数据，请先保存模板' }, { status: 400 });
    }

    console.log('开始导出 Word 文档（LibreOffice 双向转换）...');
    console.log('附件数量:', draftData.attachments?.length || 0);
    console.log('editedHtml 长度:', draftData.editedHtml?.length || 0);
    console.log('markers 数量:', draftData.markers?.length || 0);
    console.log('selectedVariables 数量:', draftData.selectedVariables?.length || 0);

    // 准备所有 HTML 内容
    const htmlParts: string[] = [];

    // 主文档
    if (draftData.editedHtml) {
      // 调试模式：输出原始 HTML
      if (debug) {
        console.log('\n=== 原始 editedHtml (前1000字符) ===');
        console.log(draftData.editedHtml.substring(0, 1000));
      }
      
      // 处理变量替换，然后清理内联字体样式确保一致性
      const processedHtml = processVariables(draftData.editedHtml, draftData, variableValues);
      const normalizedHtml = normalizeFontStyles(processedHtml);
      
      // 调试模式：输出处理后的 HTML
      if (debug) {
        console.log('\n=== 处理后 HTML (前1000字符) ===');
        console.log(normalizedHtml.substring(0, 1000));
      }
      
      htmlParts.push(normalizedHtml);
    }

    // 附件
    if (draftData.attachments && draftData.attachments.length > 0) {
      for (const attachment of draftData.attachments) {
        if (attachment.html) {
          // 处理变量替换，然后清理内联字体样式确保一致性
          const processedHtml = processVariables(attachment.html, draftData, variableValues);
          htmlParts.push(normalizeFontStyles(processedHtml));
        }
      }
    }

    if (htmlParts.length === 0) {
      return NextResponse.json({ success: false, error: '没有找到文档内容' }, { status: 400 });
    }

    // 合并所有 HTML 内容
    const mergedHtml = mergeHtmlParts(htmlParts, debug);
    console.log('合并后 HTML 大小:', mergedHtml.length);

    // 调试模式：返回 HTML 内容而非 Word 文件
    if (debug) {
      return new NextResponse(mergedHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    // 创建临时目录
    const tmpDir = join('/tmp', `word-export-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });

    try {
      // 使用 LibreOffice 转换
      const docxBuffer = await convertHtmlToDocxWithLibreOffice(mergedHtml, tmpDir);

      console.log('Word 文档生成成功，大小:', docxBuffer.length);

      // 清理临时目录
      rmSync(tmpDir, { recursive: true, force: true });

      return new NextResponse(new Uint8Array(docxBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(template.name || '合同模板')}.docx"`,
        },
      });
    } catch (convertError) {
      console.error('LibreOffice 转换失败:', convertError);
      rmSync(tmpDir, { recursive: true, force: true });
      throw convertError;
    }
  } catch (error) {
    console.error('导出 Word 失败:', error);
    return NextResponse.json(
      { success: false, error: '导出失败: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    );
  }
}
