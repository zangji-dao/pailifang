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

    const systemPrompt = `你是一个专业的合同文档排版专家。你的任务是为HTML添加内联样式，优化排版效果。

## 【最重要规则】
1. **绝对不能删除、修改或遗漏任何原始内容**
2. **只添加内联style属性，不改变HTML结构和内容**
3. **必须保留所有文本内容和HTML标签**

## 排版样式规则

### 行间距
- 正文段落：line-height: 2（双倍行距）
- 段落间距：margin: 1em 0
- 首行缩进：text-indent: 2em

### 标题
- h1：text-align: center; font-size: 24px; margin: 30px 0; line-height: 1.5
- h2：font-weight: bold; margin: 20px 0 10px; line-height: 1.6

### 签章区域
如果文档末尾有甲方、乙方签章区域，使用表格布局：
<table style="width: 100%; border-collapse: collapse; margin-top: 40px; page-break-inside: avoid;">
  <tr>
    <td style="width: 50%; padding: 20px; vertical-align: top;">
      <!-- 甲方内容 -->
    </td>
    <td style="width: 50%; padding: 20px; vertical-align: top;">
      <!-- 乙方内容 -->
    </td>
  </tr>
</table>

### 变量标记
必须完整保留所有 {{变量名}} 格式的变量标记及其所在标签。

## 输出要求
只输出优化后的HTML代码，不要任何解释或说明。`;

    // 处理单个文档的函数
    const processDocument = async (doc: { id: string; name: string; html: string }) => {
      const userPrompt = `请为以下HTML添加内联样式，优化排版效果。

【文档名称】${doc.name}

【变量标记（必须保留）】
${variables.map(v => `{{${v.name}}}`).join(', ')}

【原始HTML】
${doc.html}

【输出要求】
1. 保留所有原始内容，一个字都不能少
2. 只添加内联style属性
3. 变量标记完整保留`;

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userPrompt }
      ];

      try {
        // 使用更强大的模型（pro版本更适合处理大量内容）
        const response = await client.invoke(messages, {
          model: 'doubao-seed-2-0-pro-260215',  // 使用pro版本，更适合处理大量内容
          temperature: 0.1,  // 降低随机性
        });

        let result = response.content;
        
        // 清理可能的markdown代码块标记
        result = result.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
        
        // 内容长度检查：如果优化后内容少于原来的70%，认为优化失败，返回原内容
        const originalLength = doc.html.length;
        const resultLength = result.length;
        
        if (resultLength < originalLength * 0.7) {
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
        // 如果某个文档优化失败，保留原内容
        return {
          id: doc.id,
          name: doc.name,
          html: doc.html,
          error: docError instanceof Error ? docError.message : '优化失败',
        };
      }
    };

    // 串行处理每个文档，避免并行问题
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
