import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ParseResult, ContractFieldDefinition, ParsedPage } from '@/types/contract-template';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// 强制使用Node.js运行时
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AttachmentInfo {
  id: string;
  name: string;
  url: string;
  fileType: string;
}

/**
 * 使用LibreOffice将Word文档转换为HTML
 * 比mammoth保留更多的格式信息
 */
async function convertWordToHtmlWithLibreOffice(
  buffer: Buffer,
  fileName: string
): Promise<{ html: string; fullText: string }> {
  const tmpDir = '/tmp/contract-convert';
  const timestamp = Date.now();
  const inputPath = path.join(tmpDir, `${timestamp}_${fileName}`);
  const outputDir = path.join(tmpDir, `output_${timestamp}`);
  
  try {
    // 创建临时目录
    await fs.mkdir(tmpDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });
    
    // 写入临时Word文件
    await fs.writeFile(inputPath, buffer);
    
    // 使用LibreOffice转换为HTML
    const { stdout, stderr } = await execAsync(
      `libreoffice --headless --convert-to html --outdir "${outputDir}" "${inputPath}"`,
      { timeout: 30000 }
    );
    
    if (stderr && !stderr.includes('Warning')) {
      console.log('LibreOffice stderr:', stderr);
    }
    
    // 读取生成的HTML文件
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    const htmlPath = path.join(outputDir, `${baseName}.html`);
    
    let html = '';
    try {
      html = await fs.readFile(htmlPath, 'utf-8');
    } catch (readError) {
      console.error('读取HTML文件失败:', readError);
      // 如果LibreOffice转换失败，回退到mammoth
      return await convertWordToHtmlWithMammoth(buffer, fileName);
    }
    
    // 后处理HTML
    html = postProcessLibreOfficeHtml(html);
    
    // 提取纯文本
    const fullText = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
    
    return { html, fullText };
  } catch (error) {
    console.error('LibreOffice转换失败，回退到mammoth:', error);
    return await convertWordToHtmlWithMammoth(buffer, fileName);
  } finally {
    // 清理临时文件
    try {
      await fs.rm(inputPath, { force: true });
      await fs.rm(outputDir, { recursive: true, force: true });
    } catch (cleanupError) {
      // 忽略清理错误
    }
  }
}

/**
 * 使用mammoth转换Word文档（备用方案）
 */
async function convertWordToHtmlWithMammoth(
  buffer: Buffer,
  fileName: string
): Promise<{ html: string; fullText: string }> {
  const mammoth = await import('mammoth');
  
  const textResult = await mammoth.extractRawText({ buffer });
  const fullText = textResult.value;
  
  const htmlResult = await mammoth.convertToHtml({ buffer });
  let html = htmlResult.value;
  
  html = postProcessLibreOfficeHtml(html);
  
  return { html, fullText };
}

/**
 * 后处理LibreOffice生成的HTML
 */
function postProcessLibreOfficeHtml(html: string): string {
  return html
    // 移除内联的字体样式（使用CSS代替）
    .replace(/font-family:[^;"]*;?/gi, '')
    // 保留颜色
    // 移除过长的style属性
    .replace(/ style="[^"]{500,}"/g, '')
    // 确保表格有边框
    .replace(/<table/gi, '<table style="border-collapse: collapse; width: 100%;"')
    .replace(/<td/gi, '<td style="border: 1px solid #333; padding: 4px 8px; vertical-align: top;"')
    .replace(/<th/gi, '<th style="border: 1px solid #333; padding: 4px 8px; background: #f5f5f5;"')
    // 清理空段落
    .replace(/<p[^>]*>\s*<\/p>/gi, '')
    .replace(/<p[^>]*>&nbsp;<\/p>/gi, '<p style="margin: 0.5em 0;">&nbsp;</p>');
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
      // 1. 解析主文档（使用LibreOffice）
      const mainResponse = await fetch(fileUrl);
      if (!mainResponse.ok) {
        throw new Error('下载主文档失败');
      }
      
      const mainArrayBuffer = await mainResponse.arrayBuffer();
      const mainBuffer = Buffer.from(mainArrayBuffer);
      const mainParseResult = await convertWordToHtmlWithLibreOffice(mainBuffer, fileName);

      // 2. 解析所有附件
      const attachmentResults: { name: string; html: string; text: string }[] = [];
      
      for (const attachment of attachments) {
        try {
          const attResponse = await fetch(attachment.url);
          if (!attResponse.ok) continue;
          
          const attArrayBuffer = await attResponse.arrayBuffer();
          const attBuffer = Buffer.from(attArrayBuffer);
          const attParseResult = await convertWordToHtmlWithLibreOffice(attBuffer, attachment.name);
          
          attachmentResults.push({
            name: attachment.name,
            html: attParseResult.html || '',
            text: attParseResult.fullText,
          });
        } catch (attError) {
          console.error(`解析附件 ${attachment.name} 失败:`, attError);
        }
      }

      // 3. 构建附件数据（不合并到主文档）
      const parsedAttachments = attachmentResults.map((att, index) => ({
        id: `att-${index}`,
        name: att.name,
        displayName: att.name.replace(/\.[^/.]+$/, ''),
        html: att.html,
        text: att.text,
        order: index,
      }));

      // 4. 合并文本（用于搜索等场景）
      let fullText = mainParseResult.fullText;
      for (const att of attachmentResults) {
        fullText += `\n\n【${att.name}】\n${att.text}`;
      }

      // 5. 更新解析结果
      const parseResult: ParseResult = {
        success: true,
        totalPages: 1,
        fileName,
        fileType: fileType as 'docx' | 'doc',
        pages: [{
          pageNumber: 1,
          text: mainParseResult.fullText,
          html: mainParseResult.html || '',
          hasTables: detectTables(mainParseResult.fullText),
          hasImages: false,
        }],
        fullText,
        html: mainParseResult.html || '',
        attachments: parsedAttachments,
        detectedAttachments: [],
        detectedFields: [],
        mainContract: {
          startPage: 1,
          endPage: 1,
          pageRange: '1',
          content: mainParseResult.fullText,
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
 * 合并主文档和附件 HTML
 */
function mergeDocuments(mainHtml: string, attachments: { name: string; html: string; text: string }[]): string {
  let result = mainHtml;
  
  // 为每个附件添加分隔和标题
  for (const att of attachments) {
    if (att.html) {
      result += `
        <div class="document-separator" style="margin: 40px 0; padding: 20px 0; border-top: 2px dashed #d1d5db; page-break-before: always;">
          <h2 style="text-align: center; color: #374151; font-size: 18px; margin-bottom: 20px; padding: 10px; background: #f3f4f6; border-radius: 4px;">
            📎 ${att.name.replace(/\.[^/.]+$/, '')}
          </h2>
          ${att.html}
        </div>
      `;
    }
  }
  
  return result;
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
