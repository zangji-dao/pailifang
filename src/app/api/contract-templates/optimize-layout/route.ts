import { NextRequest } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

// 强制使用Node.js运行时
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 统计字符串中的汉字数量
 */
function countChineseChars(str: string): number {
  const matches = str.match(/[\u4e00-\u9fa5]/g);
  return matches ? matches.length : 0;
}

/**
 * 提取所有变量标记 {{xxx}}
 */
function extractVariableMarkers(str: string): string[] {
  const matches = str.match(/\{\{[^}]+\}\}/g);
  return matches ? matches : [];
}

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
【绝对禁止】修改、删除、增加任何文字内容！必须完整输出所有原始内容！
【必须】为每个标签添加合适的style属性来优化排版效果。

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
          const originalChineseCount = countChineseChars(doc.html);
          
          sendEvent('progress', {
            current: i + 1,
            total: docsToProcess.length,
            documentName: doc.name,
            documentId: doc.id
          });

          // 按段落分块处理大文档
          const MAX_CHUNK_CHARS = 8000; // 约8000汉字一块
          const chunks: string[] = [];
          
          if (originalChineseCount > MAX_CHUNK_CHARS) {
            // 按段落分割
            const paragraphs = doc.html.split(/(<\/p>)/g);
            let currentChunk = '';
            let currentChars = 0;
            
            for (let j = 0; j < paragraphs.length; j += 2) {
              const para = j + 1 < paragraphs.length ? paragraphs[j] + paragraphs[j + 1] : paragraphs[j];
              const paraChars = countChineseChars(para);
              
              if (currentChars + paraChars > MAX_CHUNK_CHARS && currentChunk) {
                chunks.push(currentChunk);
                currentChunk = para;
                currentChars = paraChars;
              } else {
                currentChunk += para;
                currentChars += paraChars;
              }
            }
            if (currentChunk) {
              chunks.push(currentChunk);
            }
            
            console.log(`文档 ${doc.name} (${originalChineseCount} 汉字) 分为 ${chunks.length} 块处理`);
          } else {
            chunks.push(doc.html);
          }

          let optimizedHtml = '';

          for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            const chunk = chunks[chunkIndex];
            const chunkChineseCount = countChineseChars(chunk);
            
            if (chunks.length > 1) {
              sendEvent('progress', {
                current: i + 1,
                total: docsToProcess.length,
                documentName: `${doc.name} (块 ${chunkIndex + 1}/${chunks.length})`,
                documentId: doc.id
              });
            }
            
            const userPrompt = `为以下HTML添加内联style属性优化排版。

【变量标记】${variables.map(v => `{{${v.name}}}`).join(', ') || '无'}

【HTML内容 - 必须完整输出，不能遗漏任何文字】
${chunk}

【要求】
1. 不修改任何文字内容（汉字数量必须保持不变）
2. 为标签添加style属性优化排版
3. 必须完整输出所有内容`;

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
              
              // 检查内容完整性：汉字数量 + 变量标记
              const resultChineseCount = countChineseChars(result);
              const chineseRatio = resultChineseCount / chunkChineseCount;
              
              const originalVars = extractVariableMarkers(chunk);
              const resultVars = extractVariableMarkers(result);
              const varsMissing = originalVars.filter(v => !resultVars.includes(v));
              
              if (chineseRatio < 0.95 || varsMissing.length > 0) {
                console.warn(`文档 ${doc.name} 第 ${chunkIndex + 1}/${chunks.length} 块内容不完整，使用原内容。原汉字: ${chunkChineseCount}, 新汉字: ${resultChineseCount}${varsMissing.length > 0 ? `, 缺失变量: ${varsMissing.join(', ')}` : ''}`);
                optimizedHtml += chunk; // 使用原内容
              } else {
                optimizedHtml += result;
                console.log(`文档 ${doc.name} 第 ${chunkIndex + 1}/${chunks.length} 块优化成功。原汉字: ${chunkChineseCount}, 新汉字: ${resultChineseCount}`);
              }
            } catch (err) {
              console.error(`处理文档 ${doc.name} 第 ${chunkIndex + 1}/${chunks.length} 块失败:`, err);
              optimizedHtml += chunk; // 使用原内容
            }
          }

          // 最终完整性检查：汉字数量 + 变量标记
          const resultChineseCount = countChineseChars(optimizedHtml);
          const finalRatio = resultChineseCount / originalChineseCount;
          
          const finalOriginalVars = extractVariableMarkers(doc.html);
          const finalResultVars = extractVariableMarkers(optimizedHtml);
          const finalVarsMissing = finalOriginalVars.filter(v => !finalResultVars.includes(v));
          
          if (finalRatio < 0.95 || finalVarsMissing.length > 0) {
            console.warn(`文档 ${doc.name} 最终内容不完整，保留原内容。原汉字: ${originalChineseCount}, 新汉字: ${resultChineseCount}${finalVarsMissing.length > 0 ? `, 缺失变量: ${finalVarsMissing.join(', ')}` : ''}`);
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
            console.log(`文档 ${doc.name} 优化完成。汉字: ${originalChineseCount}→${resultChineseCount}, 变量: ${finalOriginalVars.length}→${finalResultVars.length}`);
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
