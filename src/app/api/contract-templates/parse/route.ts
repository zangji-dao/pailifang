import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ParseResult, ContractFieldDefinition, ParsedPage } from '@/types/contract-template';

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
      // 1. 解析主文档
      const mainResponse = await fetch(fileUrl);
      if (!mainResponse.ok) {
        throw new Error('下载主文档失败');
      }
      
      const mainArrayBuffer = await mainResponse.arrayBuffer();
      const mainBuffer = Buffer.from(mainArrayBuffer);
      const mainParseResult = await parseWord(mainBuffer, fileName, fileType, '主合同');

      // 2. 解析所有附件
      const attachmentResults: { name: string; html: string; text: string }[] = [];
      
      for (const attachment of attachments) {
        try {
          const attResponse = await fetch(attachment.url);
          if (!attResponse.ok) continue;
          
          const attArrayBuffer = await attResponse.arrayBuffer();
          const attBuffer = Buffer.from(attArrayBuffer);
          const attParseResult = await parseWord(attBuffer, attachment.name, attachment.fileType, attachment.name);
          
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
 * 解析Word文档 - 同时返回文本和HTML
 */
async function parseWord(buffer: Buffer, fileName: string, fileType: string, docTitle?: string): Promise<{ 
  html: string; 
  fullText: string;
}> {
  // 动态导入mammoth
  const mammoth = await import('mammoth');
  
  // 提取纯文本
  const textResult = await mammoth.extractRawText({ buffer });
  const fullText = textResult.value;
  
  // 提取HTML（保留格式）
  const htmlResult = await mammoth.convertToHtml({ buffer });
  let html = htmlResult.value;

  return {
    html,
    fullText,
  };
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
