import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

// 强制使用Node.js运行时
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/contract-templates/optimize-layout
 * 使用LLM优化合同文档排版（用于最终输出）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { html, variables = [] } = body as {
      html: string;
      variables?: { key: string; name: string; value?: string }[];
    };

    if (!html) {
      return NextResponse.json(
        { success: false, error: '缺少HTML内容' },
        { status: 400 }
      );
    }

    const config = new Config();
    const client = new LLMClient(config);

    const systemPrompt = `你是一个专业的文档排版专家。你的任务是优化合同文档的HTML格式。

## 输入说明：
- 这是一个已经绑定了变量的合同文档HTML
- 变量标记格式：{{变量名}} 或包含 {{变量名}} 的span标签
- 你必须100%保留所有变量标记，不能删除、修改或移动它们的位置

## 输出要求：
1. 【重要】保持所有 {{变量名}} 格式的变量标记原样不变
2. 优化段落结构，确保段落清晰分明
3. 正确识别并标记标题层级（h1主标题/h2副标题/h3小标题）
4. 表格确保结构完整，th/td正确使用
5. 重要条款或关键数字用<strong>加粗
6. 列表使用正确的ul/ol/li标签
7. 不要添加任何style属性或CSS（由外部样式控制）
8. 只输出优化后的HTML代码，不要有任何解释文字`;

    const userPrompt = `请优化以下合同文档的排版。

【变量列表】：${variables.map(v => `{{${v.name}}}`).join(', ')}

【HTML内容】：
${html}

请直接输出优化后的HTML（必须保留所有变量标记）：`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    const response = await client.invoke(messages, {
      model: 'doubao-seed-2-0-lite-260215',
      temperature: 0.2,
    });

    let result = response.content;
    
    // 清理可能的markdown代码块标记
    result = result.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    return NextResponse.json({
      success: true,
      data: { html: result }
    });
  } catch (error) {
    console.error('优化排版失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '优化排版失败' },
      { status: 500 }
    );
  }
}
