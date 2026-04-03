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

/**
 * 使用 LibreOffice 将 HTML 转换为 Word 文档
 * 采用 HTML → ODT → DOCX 两步转换，确保样式完整保留
 */
function convertHtmlToDocxWithLibreOffice(html: string, outputDir: string): Buffer {
  // 确保用户配置目录存在
  if (!existsSync(LIBREOFFICE_PROFILE)) {
    mkdirSync(LIBREOFFICE_PROFILE, { recursive: true });
  }

  // 保存 HTML 文件
  const htmlFile = join(outputDir, 'document.html');
  writeFileSync(htmlFile, html, 'utf-8');

  // 第一步：HTML → ODT
  console.log('LibreOffice: HTML → ODT');
  execSync(
    `libreoffice --headless --nologo --nofirststartwizard --norestore ` +
    `--infilter="HTML" --convert-to odt --outdir "${outputDir}" "${htmlFile}" ` +
    `-env:UserInstallation=file://${LIBREOFFICE_PROFILE}`,
    {
      timeout: 60000,
      env: { ...process.env, HOME: '/tmp' },
    }
  );

  const odtFile = join(outputDir, 'document.odt');
  if (!existsSync(odtFile)) {
    throw new Error('ODT 文件生成失败');
  }

  // 第二步：ODT → DOCX
  console.log('LibreOffice: ODT → DOCX');
  execSync(
    `libreoffice --headless --nologo --nofirststartwizard --norestore ` +
    `--convert-to docx --outdir "${outputDir}" "${odtFile}" ` +
    `-env:UserInstallation=file://${LIBREOFFICE_PROFILE}`,
    {
      timeout: 60000,
      env: { ...process.env, HOME: '/tmp' },
    }
  );

  const docxFile = join(outputDir, 'document.docx');
  if (!existsSync(docxFile)) {
    throw new Error('DOCX 文件生成失败');
  }

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
 * 合并多个 HTML 内容，用分页符分隔
 * 使用 LibreOffice 能识别的分页方式
 */
function mergeHtmlParts(parts: string[]): string {
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
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { templateId, variableValues } = body;

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
      return NextResponse.json({ success: false, error: '没有找到草稿数据' }, { status: 400 });
    }

    console.log('开始导出 Word 文档（LibreOffice 双向转换）...');
    console.log('附件数量:', draftData.attachments?.length || 0);

    // 准备所有 HTML 内容
    const htmlParts: string[] = [];

    // 主文档
    if (draftData.editedHtml) {
      htmlParts.push(processVariables(draftData.editedHtml, draftData, variableValues));
    }

    // 附件
    if (draftData.attachments && draftData.attachments.length > 0) {
      for (const attachment of draftData.attachments) {
        if (attachment.html) {
          htmlParts.push(processVariables(attachment.html, draftData, variableValues));
        }
      }
    }

    if (htmlParts.length === 0) {
      return NextResponse.json({ success: false, error: '没有找到文档内容' }, { status: 400 });
    }

    // 合并所有 HTML 内容
    const mergedHtml = mergeHtmlParts(htmlParts);
    console.log('合并后 HTML 大小:', mergedHtml.length);

    // 创建临时目录
    const tmpDir = join('/tmp', `word-export-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });

    try {
      // 使用 LibreOffice 转换
      const docxBuffer = convertHtmlToDocxWithLibreOffice(mergedHtml, tmpDir);

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
