import { NextRequest, NextResponse } from 'next/server';
import { invokeAi } from '@/lib/ai-client';
import { fetchRemoteDocument } from '@/lib/document-fetch';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { url?: string; parseStyle?: boolean };

    if (!body.url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 },
      );
    }

    const document = await fetchRemoteDocument(body.url);

    if (!body.parseStyle) {
      return NextResponse.json({
        success: true,
        data: { text: document.text },
      });
    }

    const prompt = `你是一个专业的PDF文档分析专家。请分析以下合同文本内容，提取其结构和格式信息，输出一个可以用于生成HTML的JSON结构。

合同文本内容：
${document.text.substring(0, 8000)}

请输出以下JSON格式（只输出JSON，不要其他内容）：
{
  "coverPage": {
    "title": "封面标题",
    "fields": ["入驻企业:", "合同编号:", "签订日期:"]
  },
  "mainTitle": "合同正文标题",
  "sections": [
    {
      "number": "第一条",
      "title": "合同主体",
      "subsections": [
        {
          "title": "甲方(服务方):",
          "fields": ["企业名称:", "统一社会信用代码:"]
        }
      ]
    }
  ],
  "signatureArea": {
    "parties": ["甲方签章处", "乙方签章处"],
    "fields": ["法定代表人签字:", "日期:"]
  }
}`;

    const responseContent = await invokeAi(
      [{ role: 'user', content: prompt }],
      {
        model: process.env.AI_TEXT_MODEL || '',
        temperature: 0.1,
      },
    );

    let structure: unknown;
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      structure = JSON.parse(jsonMatch[0]);
    }

    return NextResponse.json({
      success: true,
      data: {
        text: document.text,
        structure,
      },
    });
  } catch (error) {
    console.error('Parse contract template error:', error);
    const message = error instanceof Error ? error.message : 'Failed to parse contract template';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
