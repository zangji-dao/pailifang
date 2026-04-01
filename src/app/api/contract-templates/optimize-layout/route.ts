import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

// 强制使用Node.js运行时
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/contract-templates/optimize-layout
 * 使用LLM优化合同文档排版（统一优化主合同和所有附件）
 * 注意：只优化排版样式，不添加、删除或修改任何内容
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
      return NextResponse.json(
        { success: false, error: '缺少HTML内容' },
        { status: 400 }
      );
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

    // 处理单个文档的函数
    const processDocument = async (doc: { id: string; name: string; html: string }) => {
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
        
        // 内容长度检查：如果优化后内容长度差异过大，保留原内容
        const originalLength = doc.html.length;
        const resultLength = result.length;
        
        // 允许20%的差异（因为添加了style属性，长度会增加）
        if (resultLength < originalLength * 0.8) {
          console.warn(`文档 ${doc.name} 优化后内容过少，保留原内容。原长度: ${originalLength}, 新长度: ${resultLength}`);
          return {
            id: doc.id,
            name: doc.name,
            html: doc.html,
            warning: '优化后内容不完整，已保留原内容',
          };
        }

        return {
          id: doc.id,
          name: doc.name,
          html: result,
        };
      } catch (docError) {
        console.error(`优化文档 ${doc.name} 失败:`, docError);
        return {
          id: doc.id,
          name: doc.name,
          html: doc.html,
          error: docError instanceof Error ? docError.message : '优化失败',
        };
      }
    };

    // 串行处理每个文档
    const results = [];
    for (const doc of docsToProcess) {
      const result = await processDocument(doc);
      results.push(result);
    }

    return NextResponse.json({
      success: true,
      data: { results }
    });
  } catch (error) {
    console.error('优化排版失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '优化排版失败' },
      { status: 500 }
    );
  }
}
