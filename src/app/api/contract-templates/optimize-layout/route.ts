import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

// 强制使用Node.js运行时
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/contract-templates/optimize-layout
 * 使用LLM优化合同文档排版（统一优化主合同和所有附件）
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

    const systemPrompt = `你是一个专业的合同文档排版专家，精通中文合同格式规范。

## 核心原则
【绝对重要】必须100%保留所有变量标记 {{变量名}}，包括其所在的span标签，不能删除、修改、移动或改变其任何属性！

## 签字盖章区域优化（最重要！）

### 标准签章区域布局
签章区域必须使用表格实现左右并排布局，参考以下标准格式：

甲方乙方左右并排示例：
<table style="width: 100%; border-collapse: collapse; margin-top: 40px; page-break-inside: avoid;">
  <tr>
    <td style="width: 50%; padding: 20px; vertical-align: top;">
      <p style="font-weight: bold; margin-bottom: 15px;">甲方（签章）：</p>
      <p style="min-height: 80px;">&nbsp;</p>
      <p style="margin-top: 20px;">法定代表人/授权代表：</p>
      <p style="min-height: 40px;">&nbsp;</p>
      <p>日期：______年______月______日</p>
    </td>
    <td style="width: 50%; padding: 20px; vertical-align: top;">
      <p style="font-weight: bold; margin-bottom: 15px;">乙方（签章）：</p>
      <p style="min-height: 80px;">&nbsp;</p>
      <p style="margin-top: 20px;">法定代表人/授权代表：</p>
      <p style="min-height: 40px;">&nbsp;</p>
      <p>日期：______年______月______日</p>
    </td>
  </tr>
</table>

### 签章区域排版要点
1. 必须使用无边框表格（border-collapse: collapse）实现左右并排
2. 每个签章方占50%宽度，垂直顶部对齐（vertical-align: top）
3. 盖章区域至少80px高度，签字区域至少40px
4. 签章区域与正文之间至少40px间距（margin-top: 40px）
5. 添加 page-break-inside: avoid 防止签章区域被分页
6. 如果有变量标记，保留在对应位置

### 多方签章处理
- 三方合同：第一行两个，第二行一个居中
- 四方合同：两行两列对称排列
- 每个签章方格式保持一致

## 行间距优化

### 正文行间距标准
- 正文段落：line-height: 2（双倍行距）
- 条款编号：line-height: 1.8
- 标题：line-height: 1.5
- 段落间距：margin: 1em 0
- 首行缩进：text-indent: 2em

### 行间距示例
<p style="line-height: 2; text-indent: 2em; margin: 1em 0;">条款内容...</p>

## 标题层级规范
- h1：合同标题，居中，字号最大
- h2：章节标题（第一条、第二条），加粗
- h3：小节标题，加粗

## 段落与条款
- 每个条款独立成段
- 重要内容用 <strong> 加粗
- 金额、日期等关键信息加粗

## 输出要求
1. 只输出优化后的HTML代码
2. 必须使用内联style属性控制样式
3. 签章区域必须使用表格布局，左右并排
4. 变量标记完整保留
5. 确保签章区域整齐美观、间距合理`;

    // 处理单个文档的函数
    const processDocument = async (doc: { id: string; name: string; html: string }) => {
      const userPrompt = `请优化以下合同文档的排版。

【特别要求】
1. 签字盖章区域必须使用表格实现左右并排布局，确保整齐美观
2. 签章区域要有足够的空白空间（盖章处至少80px高）
3. 正文使用双倍行距（line-height: 2）
4. 段落首行缩进2字符

【文档名称】：${doc.name}
【变量列表（必须保留）】：${variables.map(v => `{{${v.name}}}`).join(', ')}

【HTML内容】：
${doc.html}

请输出优化后的HTML（变量标记必须原样保留）：`;

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userPrompt }
      ];

      try {
        const response = await client.invoke(messages, {
          model: 'doubao-seed-2-0-lite-260215',
          temperature: 0.2,
        });

        let result = response.content;
        
        // 清理可能的markdown代码块标记
        result = result.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

        return {
          id: doc.id,
          name: doc.name,
          html: result,
        };
      } catch (docError) {
        console.error(`优化文档 ${doc.name} 失败:`, docError);
        // 如果某个文档优化失败，保留原内容
        return {
          id: doc.id,
          name: doc.name,
          html: doc.html,
          error: docError instanceof Error ? docError.message : '优化失败',
        };
      }
    };

    // 并行处理所有文档
    const results = await Promise.all(docsToProcess.map(processDocument));

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
