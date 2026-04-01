import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ParseResult, ParsedPage } from '@/types/contract-template';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, mkdirSync, rmSync } from 'fs';
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

/**
 * 使用 LibreOffice 转换 Word 文档为 HTML
 * 样式保留度比 mammoth 高很多
 */
function convertWithLibreOffice(buffer: Buffer, fileName: string): string {
  // 创建临时目录
  const tmpDir = join('/tmp', `libreoffice-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });
  
  try {
    // 保存输入文件
    const inputFile = join(tmpDir, fileName);
    writeFileSync(inputFile, buffer);
    
    // 调用 LibreOffice 转换
    const cmd = `libreoffice --headless --convert-to html --outdir "${tmpDir}" "${inputFile}"`;
    execSync(cmd, { timeout: 30000 }); // 30秒超时
    
    // 读取生成的 HTML 文件
    const htmlFileName = fileName.replace(/\.[^/.]+$/, '.html');
    const htmlFile = join(tmpDir, htmlFileName);
    
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
 * HTML后处理 - 添加打印约束和文档样式
 */
function postProcessHtml(html: string): string {
  // 添加打印样式和文档基础样式
  const styles = `
    <style>
      /* 文档基础样式 */
      body {
        font-family: "Times New Roman", "宋体", SimSun, serif;
        font-size: 12pt;
        line-height: 1.5;
        color: #000;
        margin: 0;
        padding: 0;
      }
      
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
    </style>
  `;
  
  // 在 </head> 或 <body> 前插入样式
  if (html.includes('</head>')) {
    html = html.replace('</head>', `${styles}</head>`);
  } else if (html.includes('<body')) {
    html = html.replace('<body', `${styles}<body`);
  } else {
    html = styles + html;
  }
  
  return html;
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
      let html = convertWithLibreOffice(mainBuffer, fileName);
      const fullText = extractTextFromHtml(html);
      
      // 后处理：添加打印样式
      html = postProcessHtml(html);
      
      // 3. 处理附件
      const attachmentResults: { id: string; name: string; url: string; html: string; text: string }[] = [];
      
      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];
        try {
          const attResponse = await fetch(attachment.url);
          if (!attResponse.ok) continue;
          
          const attArrayBuffer = await attResponse.arrayBuffer();
          const attBuffer = Buffer.from(attArrayBuffer);
          
          // 使用 LibreOffice 转换附件
          const attHtml = convertWithLibreOffice(attBuffer, attachment.name);
          const attText = extractTextFromHtml(attHtml);
          
          attachmentResults.push({
            id: `att-${i}`,
            name: attachment.name,
            url: attachment.url,
            html: postProcessHtml(attHtml),
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
        pages: [{
          pageNumber: 1,
          text: fullText,
          html: html,
          hasTables: detectTables(fullText),
          hasImages: false,
        }],
        fullText,
        html: html,
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
