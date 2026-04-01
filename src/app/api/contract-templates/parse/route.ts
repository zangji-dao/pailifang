import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ParseResult, ParsedPage } from '@/types/contract-template';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

// 强制使用Node.js运行时
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AttachmentInfo {
  id: string;
  name: string;
  url: string;
  fileType: string;
}

// LibreOffice 用户配置目录（避免每次创建新配置）
const LIBREOFFICE_PROFILE = '/tmp/libreoffice-profile';

/**
 * 解析结果接口（包含分离的样式和内容）
 */
interface ParsedHtml {
  styles: string;      // 提取的 CSS 样式
  content: string;     // body 内容（不含 body 标签）
  fullHtml: string;    // 完整 HTML（用于预览/打印）
}

/**
 * 使用 LibreOffice 转换 Word 文档为 HTML
 * 样式保留度比 mammoth 高很多
 */
function convertWithLibreOffice(buffer: Buffer, fileName: string): string {
  // 创建临时目录
  const tmpDir = join('/tmp', `libreoffice-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });
  
  // 确保用户配置目录存在
  if (!existsSync(LIBREOFFICE_PROFILE)) {
    mkdirSync(LIBREOFFICE_PROFILE, { recursive: true });
  }
  
  try {
    // 保存输入文件
    const inputFile = join(tmpDir, fileName);
    writeFileSync(inputFile, buffer);
    
    // 调用 LibreOffice 转换（优化参数：跳过启动向导、使用缓存配置）
    const cmd = `libreoffice --headless --nologo --nofirststartwizard --norestore --infilter="Microsoft Word 2007-2019 XML" --convert-to html --outdir "${tmpDir}" "${inputFile}" -env:UserInstallation=file://${LIBREOFFICE_PROFILE}`;
    execSync(cmd, { 
      timeout: 60000, // 60秒超时
      env: { ...process.env, HOME: '/tmp' } // 设置 HOME 环境变量
    });
    
    // 读取生成的 HTML 文件
    const htmlFileName = fileName.replace(/\.[^/.]+$/, '.html');
    const htmlFile = join(tmpDir, htmlFileName);
    
    if (!existsSync(htmlFile)) {
      throw new Error(`HTML 文件未生成: ${htmlFileName}`);
    }
    
    const html = readFileSync(htmlFile, 'utf-8');
    
    return html;
  } finally {
    // 清理临时目录
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {
      console.error('清理临时目录失败:', e);
    }
  }
}

/**
 * 从完整 HTML 中提取样式和内容
 * 返回分离的样式、内容，方便前端正确渲染
 */
function parseLibreOfficeHtml(html: string): ParsedHtml {
  // 提取所有 <style> 标签内容
  const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
  const styles = styleMatches
    .map(s => s.replace(/<\/?style[^>]*>/gi, ''))
    .join('\n');
  
  // 提取 body 内容（可能包含 body 的属性如 bgcolor 等）
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let content = bodyMatch ? bodyMatch[1] : html;
  
  // 如果提取失败，尝试移除 head 部分
  if (!bodyMatch) {
    content = html
      .replace(/<!DOCTYPE[^>]*>/i, '')
      .replace(/<html[^>]*>/i, '')
      .replace(/<\/html>/i, '')
      .replace(/<head[\s\S]*?<\/head>/i, '')
      .replace(/<body[^>]*>/i, '')
      .replace(/<\/body>/i, '')
      .trim();
  }
  
  // 添加打印样式
  const printStyles = `
    /* 打印样式 */
    @media print {
      body {
        background: white !important;
      }
      .contract-content {
        width: 210mm !important;
        padding: 2.54cm 3.17cm !important;
        box-sizing: border-box !important;
      }
      @page {
        size: A4;
        margin: 0;
      }
    }
  `;
  
  return {
    styles: styles + '\n' + printStyles,
    content: content,
    fullHtml: html,
  };
}

/**
 * 提取 HTML 中的纯文本
 */
function extractTextFromHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // 移除样式
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // 移除脚本
    .replace(/<[^>]+>/g, ' ') // 移除标签
    .replace(/\s+/g, ' ') // 合并空白
    .trim();
}

/**
 * POST /api/contract-templates/parse
 * 解析已上传的合同文档和附件（仅 Word 文档）
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { templateId, fileUrl, fileName, fileType, attachments = [] } = body as {
      templateId: string;
      fileUrl: string;
      fileName: string;
      fileType: string;
      attachments?: AttachmentInfo[];
    };

    if (!templateId || !fileUrl) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (fileType !== 'docx' && fileType !== 'doc') {
      return NextResponse.json(
        { success: false, error: '仅支持 Word 文档解析' },
        { status: 400 }
      );
    }

    // 更新解析状态
    await supabase
      .from('contract_templates')
      .update({ parse_status: 'parsing', updated_at: new Date().toISOString() })
      .eq('id', templateId);

    try {
      // 1. 下载主文档
      const mainResponse = await fetch(fileUrl);
      if (!mainResponse.ok) {
        throw new Error('下载主文档失败');
      }
      
      const mainArrayBuffer = await mainResponse.arrayBuffer();
      const mainBuffer = Buffer.from(mainArrayBuffer);
      
      // 2. 使用 LibreOffice 转换为 HTML（样式保留度高）
      const rawHtml = convertWithLibreOffice(mainBuffer, fileName);
      const parsed = parseLibreOfficeHtml(rawHtml);
      const fullText = extractTextFromHtml(rawHtml);
      
      // 3. 处理附件
      const attachmentResults: { id: string; name: string; url: string; html: string; styles: string; text: string }[] = [];
      
      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];
        try {
          const attResponse = await fetch(attachment.url);
          if (!attResponse.ok) continue;
          
          const attArrayBuffer = await attResponse.arrayBuffer();
          const attBuffer = Buffer.from(attArrayBuffer);
          
          // 使用 LibreOffice 转换附件
          const attRawHtml = convertWithLibreOffice(attBuffer, attachment.name);
          const attParsed = parseLibreOfficeHtml(attRawHtml);
          const attText = extractTextFromHtml(attRawHtml);
          
          attachmentResults.push({
            id: `att-${i}`,
            name: attachment.name,
            url: attachment.url,
            html: attParsed.content,
            styles: attParsed.styles,
            text: attText,
          });
        } catch (attError) {
          console.error(`解析附件 ${attachment.name} 失败:`, attError);
        }
      }

      // 4. 构建附件数据
      const parsedAttachments = attachmentResults.map((att, index) => ({
        id: att.id,
        name: att.name,
        displayName: att.name.replace(/\.[^/.]+$/, ''),
        url: att.url,
        html: att.html,
        styles: att.styles,
        text: att.text,
        order: index,
      }));

      // 5. 更新解析结果
      const parseResult: ParseResult = {
        success: true,
        totalPages: 1,
        fileName,
        fileType: fileType as 'docx' | 'doc',
        fileUrl, // 保留原始文件URL，供后续使用
        styles: parsed.styles,  // LibreOffice 生成的样式
        pages: [{
          pageNumber: 1,
          text: fullText,
          html: parsed.content,
          hasTables: detectTables(fullText),
          hasImages: false,
        }],
        fullText,
        html: parsed.content,
        attachments: parsedAttachments,
        detectedAttachments: [],
        detectedFields: [],
        mainContract: {
          startPage: 1,
          endPage: 1,
          pageRange: '1',
          content: fullText,
        },
      };

      // 更新解析状态为完成
      await supabase
        .from('contract_templates')
        .update({ 
          parse_status: 'completed',
          updated_at: new Date().toISOString() 
        })
        .eq('id', templateId);

      return NextResponse.json({
        success: true,
        data: parseResult,
      });
    } catch (parseError) {
      console.error('解析文档失败:', parseError);
      
      // 更新解析状态为失败
      await supabase
        .from('contract_templates')
        .update({ 
          parse_status: 'failed',
          parse_error: parseError instanceof Error ? parseError.message : '解析失败',
          updated_at: new Date().toISOString() 
        })
        .eq('id', templateId);

      return NextResponse.json(
        { success: false, error: parseError instanceof Error ? parseError.message : '解析文档失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('解析请求失败:', error);
    return NextResponse.json(
      { success: false, error: '解析请求失败' },
      { status: 500 }
    );
  }
}

/**
 * 检测表格
 */
function detectTables(text: string): boolean {
  const tablePatterns = [
    /\|.*\|.*\|/,
    /\t.*\t.*\t/,
    /─{3,}/,
  ];
  
  return tablePatterns.some(pattern => pattern.test(text));
}
