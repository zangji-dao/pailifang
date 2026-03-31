import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ParseResult, ParsedPage } from '@/types/contract-template';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

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
 * 简单HTML后处理
 */
function postProcessHtml(html: string): string {
  return html
    // 确保表格有边框
    .replace(/<table/gi, '<table style="border-collapse: collapse; width: 100%;"')
    .replace(/<td/gi, '<td style="border: 1px solid #333; padding: 4px 8px; vertical-align: top;"')
    .replace(/<th/gi, '<th style="border: 1px solid #333; padding: 4px 8px; background: #f5f5f5; font-weight: bold;"')
    // 清理空段落
    .replace(/<p[^>]*>\s*<\/p>/gi, '');
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
      
      // 2. 使用mammoth转换为HTML（简单转换，用于编辑绑定变量）
      const mammoth = await import('mammoth');
      const textResult = await mammoth.extractRawText({ buffer: mainBuffer });
      const htmlResult = await mammoth.convertToHtml({ buffer: mainBuffer });
      const fullText = textResult.value;
      let html = htmlResult.value;
      
      // 简单后处理
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
          const attTextResult = await mammoth.extractRawText({ buffer: attBuffer });
          const attHtmlResult = await mammoth.convertToHtml({ buffer: attBuffer });
          
          attachmentResults.push({
            id: `att-${i}`,
            name: attachment.name,
            url: attachment.url,
            html: postProcessHtml(attHtmlResult.value),
            text: attTextResult.value,
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
