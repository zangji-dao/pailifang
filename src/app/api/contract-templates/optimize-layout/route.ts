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

    const systemPrompt = `你是一个专业的合同文档排版专家，精通中文合同格式规范。

## 核心原则
【绝对重要】必须100%保留所有变量标记 {{变量名}}，包括其所在的span标签，不能删除、修改、移动或改变其任何属性！

## 合同排版优化重点

### 1. 签字盖章区域优化（最重要）
- 识别签字盖章相关内容（甲方签章、乙方签章、日期、盖章处等）
- 将签字区域整理为清晰的表格结构或左右分栏布局
- 签章区域应包含：签章人名称、签字/盖章空白处、日期栏
- 多个签章方应左右并排或上下排列整齐
- 确保签章区域有足够的空白空间供手写签署

### 2. 行间距优化
- 正文段落行间距统一，段落之间有明显间隔
- 标题与正文之间增加适当间距
- 签章区域行间距可适当加大，便于填写
- 避免行间距过大导致内容松散，或过小导致拥挤

### 3. 标题层级规范
- 合同标题使用 h1，居中显示
- 章节标题使用 h2，如"第一条"、"第二条"
- 小节标题使用 h3 或加粗段落开头
- 编号保持一致（一、（一）、1.、(1)等）

### 4. 段落与条款
- 每个条款独立成段，首行可缩进2字符
- 重要条款、金额数字、关键日期使用 <strong> 加粗强调
- 条款编号与内容之间保持适当间距

### 5. 表格优化
- 合同表格确保边框完整、对齐整齐
- 表头加粗或使用深色背景
- 表格内容居中或左对齐统一
- 金额列右对齐

### 6. 页面整体布局
- 内容紧凑但不拥挤
- 重要信息突出显示
- 结尾签字区域居中或规范排列

## 输出要求
1. 只输出优化后的HTML代码，不要有任何解释
2. 使用语义化HTML标签（h1-h3, p, table, ul/ol, strong等）
3. 保持变量标记完整不变
4. 允许使用必要的行间距样式（line-height），例如：style="line-height: 1.8"
5. 允许使用必要的间距样式（margin、padding），让文档更美观
6. 签章区域可使用表格实现左右并排布局`;

    const userPrompt = `请优化以下合同文档的排版，特别注意签字盖章区域和行间距的优化。

【变量列表（必须保留）】：${variables.map(v => `{{${v.name}}}`).join(', ')}

【HTML内容】：
${html}

请输出优化后的HTML（变量标记必须原样保留）：`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    const response = await client.invoke(messages, {
      model: 'doubao-seed-2-0-250115',
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
