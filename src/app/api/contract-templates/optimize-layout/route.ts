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

    const systemPrompt = `你是一个专业的中文文档排版专家。你的任务是对HTML进行全面的排版优化。

## 核心原则
【绝对禁止】修改、删除、增加任何文字内容！文字必须原封不动保留。
【允许且必须】优化所有样式属性，让文档更专业、更美观。

## 输出格式要求
- 只输出body内的HTML内容，不要输出<!DOCTYPE>、<html>、<head>、<body>等标签
- 使用内联style属性（style="..."）来定义样式
- 不要使用<style>标签或class属性

## 你需要优化的样式（通过内联style属性）

### 1. 字体与字号
- 合同标题（h1）：style="font-size: 22px; font-weight: bold; text-align: center; margin: 20px 0"
- 章标题（如"第一章"）：style="font-size: 16px; font-weight: bold; margin: 20px 0 10px 0"
- 节标题（如"第一节"）：style="font-size: 14px; font-weight: bold; margin: 15px 0 10px 0"
- 正文段落：style="font-size: 14px; line-height: 2; margin: 12px 0; text-indent: 2em"
- 条款编号（如"1.1"）：用<strong>包裹或加 font-weight: bold

### 2. 行距与间距
- 正文：line-height: 2（双倍行距）
- 段落间距：margin: 12px 0
- 标题上方间距：margin-top: 20px
- 标题下方间距：margin-bottom: 10px

### 3. 缩进
- 正文首行缩进：text-indent: 2em

### 4. 对齐
- 合同标题：text-align: center
- 正文：text-align: justify（两端对齐）

### 5. 表格优化
- 表格：style="width: 100%; border-collapse: collapse"
- 单元格：style="border: 1px solid #000; padding: 8px"

### 6. 特殊内容
- 金额、日期等重要信息：加<strong>或 style="font-weight: bold"
- 变量标记 {{xxx}}：保持原样

## 变量标记处理
必须完整保留所有 {{变量名}} 格式的变量标记及其所在的HTML标签。

## 输出要求
只输出优化后的HTML片段（body内容），使用内联style属性。`;

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

          const userPrompt = `请对以下HTML进行排版优化。

【文档名称】${doc.name}

【变量标记（必须完整保留）】
${variables.map(v => `{{${v.name}}}`).join(', ') || '无'}

【原始HTML】
${doc.html}

【优化要求】
1. 不修改任何文字内容
2. 优化字体大小、粗细、行距、缩进、对齐等样式
3. 让标题层级更清晰
4. 让正文更易读
5. 完整保留所有变量标记`;

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
            
            if (resultLength < originalLength * 0.7) {
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
