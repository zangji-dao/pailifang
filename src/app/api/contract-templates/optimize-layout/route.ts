import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

// 强制使用Node.js运行时
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 从HTML中提取纯文本（保留换行结构）
 */
function extractTextFromHtml(html: string): string {
  // 先把块级元素换成换行
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>/gi, ' | ')
    .replace(/<table[^>]*>/gi, '\n[表格]\n')
    .replace(/<\/table>/gi, '\n[/表格]\n');
  
  // 移除所有HTML标签
  text = text.replace(/<[^>]+>/g, '');
  
  // 解码HTML实体
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');
  
  // 清理多余空行
  return text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

/**
 * 将LLM返回的样式应用到原HTML
 * 通过文本匹配，找到对应位置添加样式
 */
function applyStylesToHtml(html: string, styledText: string): string {
  // 解析styledText中的样式标记
  // 格式：【章】第一章 总则 / 【节】第一节 xxx / 【条】第一条 xxx
  const styledLines = styledText.split('\n');
  const styleMap = new Map<string, string>();
  
  for (const line of styledLines) {
    // 匹配样式标记
    const match = line.match(/^【(章|节|条|款|标题|签章)】(.+)$/);
    if (match) {
      const type = match[1];
      const content = match[2].trim();
      styleMap.set(content, type);
    }
  }
  
  console.log(`解析到 ${styleMap.size} 条样式标记`);
  
  let result = html;
  
  // 应用基础样式
  const addStyle = (html: string, tag: string, style: string): string => {
    const regex = new RegExp(`<${tag}([^>]*)>`, 'gi');
    return html.replace(regex, (match, attrs) => {
      if (/style\s*=/i.test(attrs)) return match;
      return `<${tag} style="${style}"${attrs}>`;
    });
  };
  
  result = addStyle(result, 'h1', 'font-size:22px;font-weight:bold;text-align:center;margin:20px 0');
  result = addStyle(result, 'h2', 'font-size:18px;font-weight:bold;margin:18px 0 10px 0');
  result = addStyle(result, 'h3', 'font-size:16px;font-weight:bold;margin:15px 0 10px 0');
  result = addStyle(result, 'p', 'font-size:14px;line-height:2;margin:12px 0;text-indent:2em;text-align:justify');
  result = addStyle(result, 'table', 'width:100%;border-collapse:collapse;margin:16px 0');
  result = addStyle(result, 'td', 'border:1px solid #333;padding:8px;vertical-align:top');
  result = addStyle(result, 'th', 'border:1px solid #333;padding:8px;font-weight:bold;background:#f5f5f5');
  result = addStyle(result, 'ul', 'margin:12px 0;padding-left:2em');
  result = addStyle(result, 'ol', 'margin:12px 0;padding-left:2em');
  result = addStyle(result, 'li', 'margin:6px 0;line-height:1.8');
  
  // 根据样式标记为特定段落添加特殊样式
  for (const [content, type] of styleMap) {
    const escapedContent = content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pRegex = new RegExp(`(<p[^>]*>)([^<]*${escapedContent.substring(0, 30)}[^<]*)(</p>)`, 'gi');
    
    switch (type) {
      case '章':
      case '标题':
        result = result.replace(pRegex, (match, openTag, text, closeTag) => {
          return `<p style="font-size:16px;font-weight:bold;margin:20px 0 10px 0;text-indent:0">${text}</p>`;
        });
        break;
      case '节':
        result = result.replace(pRegex, (match, openTag, text, closeTag) => {
          return `<p style="font-size:14px;font-weight:bold;margin:15px 0 8px 0;text-indent:0">${text}</p>`;
        });
        break;
      case '条':
      case '款':
        // 条款编号加粗
        const clauseMatch = content.match(/^(\d+\.\d+|\d+\.|第[一二三四五六七八九十]+条)/);
        if (clauseMatch) {
          const clauseNum = clauseMatch[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const numRegex = new RegExp(`(${clauseNum})`, 'g');
          result = result.replace(numRegex, '<strong>$1</strong>');
        }
        break;
      case '签章':
        result = result.replace(pRegex, (match, openTag, text, closeTag) => {
          return `<p style="font-size:14px;margin:12px 0;text-align:left">${text}</p>`;
        });
        break;
    }
  }
  
  return result;
}

/**
 * POST /api/contract-templates/optimize-layout
 * 发送纯文本给LLM，让LLM标注结构，然后应用到HTML
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documents } = body as {
      documents?: Array<{ id: string; name: string; html: string }>;
      html?: string;
    };

    const docsToProcess = documents || (body.html ? [{ id: 'main', name: '主合同', html: body.html }] : []);
    
    if (docsToProcess.length === 0) {
      return NextResponse.json({ success: false, error: '缺少HTML内容' }, { status: 400 });
    }

    const config = new Config();
    const client = new LLMClient(config);

    const systemPrompt = `你是专业的中文合同排版专家。

我会发给你合同的纯文本内容，请你识别结构并标注。

标注规则：
- 章标题（如"第一章 总则"）前面加【章】
- 节标题（如"第一节 入驻流程"）前面加【节】
- 条款（如"第一条 xxx"、"1.1 xxx"）前面加【条】
- 签章区域（甲方、乙方签章相关）前面加【签章】
- 其他普通内容不需要标注

直接输出标注后的文本，不要解释。`;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        const sendEvent = (event: string, data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        sendEvent('start', { total: docsToProcess.length });
        const results: Array<{ id: string; name: string; html: string }> = [];

        for (let i = 0; i < docsToProcess.length; i++) {
          const doc = docsToProcess[i];
          
          sendEvent('progress', {
            current: i + 1,
            total: docsToProcess.length,
            documentName: doc.name,
            documentId: doc.id
          });

          try {
            // 1. 提取纯文本
            const plainText = extractTextFromHtml(doc.html);
            
            console.log(`文档 ${doc.name} 提取文本 ${plainText.length} 字符`);
            
            // 2. 发送给LLM标注结构
            const llmResponse = await client.invoke([
              { role: 'system', content: systemPrompt },
              { role: 'user', content: plainText }
            ], {
              model: 'doubao-seed-2-0-lite-260215',
              temperature: 0.1,
            });
            
            console.log(`文档 ${doc.name} LLM返回 ${llmResponse.content.length} 字符`);
            
            // 3. 将标注应用到原HTML
            const optimizedHtml = applyStylesToHtml(doc.html, llmResponse.content);
            
            results.push({ id: doc.id, name: doc.name, html: optimizedHtml });
            sendEvent('complete', { documentName: doc.name });
            console.log(`文档 ${doc.name} 排版优化完成`);
            
          } catch (error) {
            console.error(`处理文档 ${doc.name} 失败:`, error);
            // 失败时应用基础样式
            const fallbackHtml = applyStylesToHtml(doc.html, '');
            results.push({ id: doc.id, name: doc.name, html: fallbackHtml });
            sendEvent('warning', { documentName: doc.name, message: '智能分析失败，已应用基础样式' });
          }
        }

        sendEvent('done', { results });
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('优化排版失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '优化排版失败' },
      { status: 500 }
    );
  }
}
