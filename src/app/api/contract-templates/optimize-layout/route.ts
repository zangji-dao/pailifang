import { NextRequest } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

// 强制使用Node.js运行时
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/contract-templates/optimize-layout
 * 使用LLM优化合同文档排版（统一优化主合同和所有附件）
 * 注意：只优化排版样式，不添加、删除或修改任何内容
 * 支持SSE流式返回进度
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

    const systemPrompt = `你是一个HTML排版助手。你的唯一任务是为现有HTML标签添加内联style属性来优化排版。

## 绝对禁止事项
1. 【禁止】添加任何新内容、新标签、新文本
2. 【禁止】删除任何现有内容、标签、文本
3. 【禁止】修改任何文本内容
4. 【禁止】改变HTML结构（标签嵌套关系）
5. 【禁止】添加签章区域表格等任何新元素

## 你只能做的事
只给现有HTML标签添加style属性，例如：
- <p>文字</p> → <p style="line-height: 2; margin: 1em 0; text-indent: 2em">文字</p>
- <h1>标题</h1> → <h1 style="text-align: center; font-size: 24px; margin: 30px 0">标题</h1>

## 排版样式规范
- 正文段落：line-height: 2; margin: 1em 0; text-indent: 2em
- 标题：text-align: center; font-size: 24px (h1); font-weight: bold (h2)
- 表格：保持原有结构，只添加适当的padding和border样式

## 变量标记
必须完整保留所有 {{变量名}} 格式的变量标记。

## 输出
只输出处理后的HTML，不要任何解释。`;

    // 创建一个 TransformStream 用于流式输出
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        // 发送进度事件的函数
        const sendEvent = (event: string, data: Record<string, unknown>) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        // 发送初始信息
        sendEvent('start', { total: docsToProcess.length });

        const results: Array<{ id: string; name: string; html: string; warning?: string; error?: string }> = [];

        // 串行处理每个文档
        for (let i = 0; i < docsToProcess.length; i++) {
          const doc = docsToProcess[i];
          
          // 发送正在处理的文档进度
          sendEvent('progress', {
            current: i + 1,
            total: docsToProcess.length,
            documentName: doc.name,
            documentId: doc.id
          });

          const userPrompt = `给以下HTML的所有标签添加内联style属性优化排版。不要改变任何内容。

变量标记（必须保留）：${variables.map(v => `{{${v.name}}}`).join(', ') || '无'}

HTML：
${doc.html}`;

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
            
            // 清理可能的markdown代码块标记
            result = result.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
            
            // 内容长度检查
            const originalLength = doc.html.length;
            const resultLength = result.length;
            
            if (resultLength < originalLength * 0.8) {
              console.warn(`文档 ${doc.name} 优化后内容过少，保留原内容。原长度: ${originalLength}, 新长度: ${resultLength}`);
              const warningResult = {
                id: doc.id,
                name: doc.name,
                html: doc.html,
                warning: '优化后内容不完整，已保留原内容',
              };
              results.push(warningResult);
              sendEvent('warning', { documentName: doc.name, message: '优化后内容不完整，已保留原内容' });
            } else {
              const successResult = {
                id: doc.id,
                name: doc.name,
                html: result,
              };
              results.push(successResult);
              sendEvent('complete', { documentName: doc.name });
            }
          } catch (docError) {
            console.error(`优化文档 ${doc.name} 失败:`, docError);
            const errorResult = {
              id: doc.id,
              name: doc.name,
              html: doc.html,
              error: docError instanceof Error ? docError.message : '优化失败',
            };
            results.push(errorResult);
            sendEvent('error', { documentName: doc.name, message: docError instanceof Error ? docError.message : '优化失败' });
          }
        }

        // 发送最终结果
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
