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
 * 使用LLM分析文档结构并生成格式化HTML
 */
async function convertWithLLM(
  text: string,
  docTitle: string
): Promise<{ html: string }> {
  const config = new Config();
  const client = new LLMClient(config);
  
  const systemPrompt = `你是一个专业的文档排版专家。你的任务是将原始文档文本转换为格式优美的HTML。

## 输出要求：
1. 保持原文档的段落结构，不要合并或拆分段落
2. 正确识别并标记标题（h1/h2/h3）
3. 表格使用table标签，保持原有结构
4. 重要条款或关键词用<strong>加粗
5. 数字编号列表用<ol>，符号列表用<ul>
6. 每个段落用<p>包裹
7. 保持合理的间距，段落之间不要有多余空行

## 样式要求：
- 不要添加任何CSS样式或内联style
- 只输出纯净的HTML结构
- 不要输出任何解释或说明文字
- 直接从第一个HTML标签开始输出`;

  const userPrompt = `请将以下文档内容转换为格式化的HTML：

【文档标题】：${docTitle}

【文档内容】：
${text}

请直接输出HTML代码，不要有任何其他文字。`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt }
  ];
  
  try {
    const response = await client.invoke(messages, {
      model: 'doubao-seed-2-0-lite-260215', // 使用轻量模型，速度快成本低
      temperature: 0.3, // 低温度保证输出稳定
    });
    
    let html = response.content;
    
    // 清理可能的markdown代码块标记
    html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
    
    return { html };
  } catch (error) {
    console.error('LLM转换失败:', error);
    // 回退到简单转换
    return { html: simpleTextToHtml(text, docTitle) };
  }
}

/**
 * 简单文本转HTML（备用方案）
 */
function simpleTextToHtml(text: string, title: string): string {
  const paragraphs = text.split(/\n\n+/);
  const htmlParts = paragraphs.map(p => {
    const trimmed = p.trim();
    if (!trimmed) return '';
    
    // 检测标题（通常较短且可能是数字编号开头）
    if (trimmed.length < 50 && /^[\d一二三四五六七八九十]+[、.]/.test(trimmed)) {
      return `<h2>${trimmed}</h2>`;
    }
    
    // 普通段落
    return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
  }).filter(Boolean);
  
  return `<h1>${title}</h1>\n${htmlParts.join('\n')}`;
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
      
      // 2. 提取纯文本（使用mammoth）
      const mammoth = await import('mammoth');
      const textResult = await mammoth.extractRawText({ buffer: mainBuffer });
      const fullText = textResult.value;
      
      // 3. 使用LLM生成格式化HTML
      console.log('正在使用LLM转换文档...');
      const llmResult = await convertWithLLM(fullText, fileName.replace(/\.[^/.]+$/, ''));
      
      // 4. 处理附件
      const attachmentResults: { id: string; name: string; url: string; html: string; text: string }[] = [];
      
      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];
        try {
          const attResponse = await fetch(attachment.url);
          if (!attResponse.ok) continue;
          
          const attArrayBuffer = await attResponse.arrayBuffer();
          const attBuffer = Buffer.from(attArrayBuffer);
          const attTextResult = await mammoth.extractRawText({ buffer: attBuffer });
          
          // 附件也用LLM转换
          const attHtmlResult = await convertWithLLM(attTextResult.value, attachment.name.replace(/\.[^/.]+$/, ''));
          
          attachmentResults.push({
            id: `att-${i}`,
            name: attachment.name,
            url: attachment.url,
            html: attHtmlResult.html,
            text: attTextResult.value,
          });
        } catch (attError) {
          console.error(`解析附件 ${attachment.name} 失败:`, attError);
        }
      }

      // 5. 构建附件数据
      const parsedAttachments = attachmentResults.map((att, index) => ({
        id: att.id,
        name: att.name,
        displayName: att.name.replace(/\.[^/.]+$/, ''),
        url: att.url,
        html: att.html,
        text: att.text,
        order: index,
      }));

      // 6. 更新解析结果
      const parseResult: ParseResult = {
        success: true,
        totalPages: 1,
        fileName,
        fileType: fileType as 'docx' | 'doc',
        fileUrl, // 保留原始文件URL
        pages: [{
          pageNumber: 1,
          text: fullText,
          html: llmResult.html,
          hasTables: detectTables(fullText),
          hasImages: false,
        }],
        fullText,
        html: llmResult.html,
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
