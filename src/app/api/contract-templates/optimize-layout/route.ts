import { NextRequest } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

// 强制使用Node.js运行时
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/contract-templates/optimize-layout
 * 使用LLM优化合同文档排版（统一优化主合同和所有附件）
 * 注意：只优化排版样式，不修改文字内容
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documents, variables = [] } = body as {
      documents?: Array<{ id: string; name: string; html: string }>;
      html?: string; // 兼容旧的单文档模式
      variables?: { key: string; name: string; value?: string }[];
    };

    // 兼容旧的单文档模式
    const docsToProcess = documents || (body.html ? [{ id: 'main', name: '主合同', html: body.html }] : []);
    
    if (docsToProcess.length === 0) {
      return new Response(JSON.stringify({ success: false, error: '缺少HTML内容' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const config = new Config();
    const client = new LLMClient(config);

    const systemPrompt = `你是专业的中文文档排版专家。你需要为HTML标签添加内联style属性来优化排版。

## 核心规则
【禁止】修改、删除、增加任何文字内容！必须完整输出所有原始内容！
【必须】为每个标签添加合适的style属性，优化后内容应该比原来更长（因为添加了style属性）。

## 样式规则（通过内联style属性实现）

标题样式：
- h1: style="font-size:22px;font-weight:bold;text-align:center;margin:20px 0"
- h2: style="font-size:18px;font-weight:bold;margin:18px 0 10px 0"
- h3: style="font-size:16px;font-weight:bold;margin:15px 0 10px 0"

段落样式：
- p标签: style="font-size:14px;line-height:2;margin:12px 0;text-indent:2em;text-align:justify"

表格样式：
- table: style="width:100%;border-collapse:collapse"
- td/th: style="border:1px solid #000;padding:8px"

列表样式：
- ul/ol: style="margin:12px 0;padding-left:2em"
- li: style="margin:6px 0;line-height:1.8"

## 重要提示
1. 变量标记 {{xxx}} 必须完整保留
2. 只输出HTML片段，不要html/head/body标签
3. 必须保留所有原始标签和文字，一个都不能少
4. 每个标签都要添加style属性`;

    // 创建一个 TransformStream 用于流式输出
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        const sendEvent = (event: string, data: Record<string, unknown>) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        sendEvent('start', { total: docsToProcess.length });

        const results: Array<{ id: string; name: string; html: string; warning?: string; error?: string }> = [];

        // 串行处理每个文档
        for (let i = 0; i < docsToProcess.length; i++) {
          const doc = docsToProcess[i];
          
          sendEvent('progress', {
            current: i + 1,
            total: docsToProcess.length,
            documentName: doc.name,
            documentId: doc.id
          });

          // 分块处理大文档 - 按合理的HTML片段分割
          const MAX_CHUNK_SIZE = 20000; // 约20KB一块，确保不超过LLM上下文限制
          const chunks: string[] = [];
          
          if (doc.html.length > MAX_CHUNK_SIZE) {
            // 按闭合标签分割，尽量保持HTML结构完整
            const splitPatterns = ['</p>', '</div>', '</table>', '</tr>', '</section>', '</article>'];
            let remaining = doc.html;
            let currentChunk = '';
            
            while (remaining.length > 0) {
              if (currentChunk.length >= MAX_CHUNK_SIZE) {
                // 找到最近的分割点
                let bestSplitIndex = -1;
                for (const pattern of splitPatterns) {
                  const idx = currentChunk.lastIndexOf(pattern);
                  if (idx > bestSplitIndex) {
                    bestSplitIndex = idx + pattern.length;
                  }
                }
                
                if (bestSplitIndex > 0) {
                  chunks.push(currentChunk.substring(0, bestSplitIndex));
                  remaining = currentChunk.substring(bestSplitIndex) + remaining;
                  currentChunk = '';
                } else {
                  // 没找到合适的分割点，强制分割
                  chunks.push(currentChunk);
                  currentChunk = '';
                }
              }
              
              if (remaining.length <= MAX_CHUNK_SIZE - currentChunk.length) {
                currentChunk += remaining;
                remaining = '';
              } else {
                const takeSize = MAX_CHUNK_SIZE - currentChunk.length;
                currentChunk += remaining.substring(0, takeSize);
                remaining = remaining.substring(takeSize);
              }
            }
            
            if (currentChunk) {
              chunks.push(currentChunk);
            }
            
            console.log(`文档 ${doc.name} (${doc.html.length} 字符) 分为 ${chunks.length} 块处理`);
          } else {
            chunks.push(doc.html);
          }

          let optimizedHtml = '';
          let allChunksSuccess = true;

          for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            const chunk = chunks[chunkIndex];
            const chunkStartLen = chunk.length;
            
            sendEvent('progress', {
              current: i + 1,
              total: docsToProcess.length,
              documentName: `${doc.name} (块 ${chunkIndex + 1}/${chunks.length})`,
              documentId: doc.id
            });
            
            const userPrompt = `为以下HTML添加内联style属性优化排版。

【变量标记】${variables.map(v => `{{${v.name}}}`).join(', ') || '无'}

【HTML内容 - 必须完整输出，不能遗漏】
${chunk}

【要求】
1. 不修改任何文字内容
2. 为每个标签添加style属性
3. 必须完整输出所有内容，不能省略任何部分`;

            const messages = [
              { role: 'system' as const, content: systemPrompt },
              { role: 'user' as const, content: userPrompt }
            ];

            try {
              const response = await client.invoke(messages, {
                model: 'doubao-seed-2-0-pro-260215',
                temperature: 0.1,
              });

              let result = response.content;
              result = result.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
              
              // 检查分块结果 - 优化后应该更长（添加了style属性）
              // 如果变短太多，说明内容丢失
              const minExpectedLength = chunkStartLen * 0.8; // 至少保留80%内容（允许少量格式调整）
              
              if (result.length < minExpectedLength) {
                console.warn(`文档 ${doc.name} 第 ${chunkIndex + 1}/${chunks.length} 块优化后内容过少，使用原内容。原长度: ${chunkStartLen}, 新长度: ${result.length}`);
                optimizedHtml += chunk; // 使用原内容
                allChunksSuccess = false;
              } else {
                optimizedHtml += result;
                console.log(`文档 ${doc.name} 第 ${chunkIndex + 1}/${chunks.length} 块优化成功。原长度: ${chunkStartLen}, 新长度: ${result.length}`);
              }
            } catch (err) {
              console.error(`处理文档 ${doc.name} 第 ${chunkIndex + 1}/${chunks.length} 块失败:`, err);
              optimizedHtml += chunk; // 使用原内容
              allChunksSuccess = false;
            }
          }

          // 最终内容检查
          const originalLength = doc.html.length;
          const resultLength = optimizedHtml.length;
          
          // 优化后应该至少和原内容一样长（因为添加了style属性）
          // 如果短于90%，说明有问题
          if (resultLength < originalLength * 0.9) {
            console.warn(`文档 ${doc.name} 最终优化后内容过少，保留原内容。原长度: ${originalLength}, 新长度: ${resultLength}`);
            results.push({
              id: doc.id,
              name: doc.name,
              html: doc.html,
              warning: '优化后内容不完整，已保留原内容',
            });
            sendEvent('warning', { documentName: doc.name, message: '优化后内容不完整，已保留原内容' });
          } else {
            results.push({
              id: doc.id,
              name: doc.name,
              html: optimizedHtml,
            });
            sendEvent('complete', { documentName: doc.name });
            console.log(`文档 ${doc.name} 优化完成。原长度: ${originalLength}, 新长度: ${resultLength}`);
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
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : '优化排版失败' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
