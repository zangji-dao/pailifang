import { NextRequest, NextResponse } from 'next/server';
import { FetchClient, Config, HeaderUtils, LLMClient } from 'coze-coding-dev-sdk';

/**
 * POST /api/parse-contract-template
 * 解析合同范本PDF文件，提取结构和样式
 */
export async function POST(request: NextRequest) {
  try {
    const { url, parseStyle } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    
    // 1. 先获取PDF文本内容
    const fetchClient = new FetchClient(config, customHeaders);
    const fetchResponse = await fetchClient.fetch(url);

    if (fetchResponse.status_code !== 0) {
      return NextResponse.json(
        { success: false, error: fetchResponse.status_message || 'Failed to fetch PDF' },
        { status: 500 }
      );
    }

    const textContent = fetchResponse.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');

    // 2. 如果需要解析样式，使用LLM分析
    if (parseStyle) {
      const llmClient = new LLMClient(config, customHeaders);
      
      const prompt = `你是一个专业的PDF文档分析专家。请分析以下合同文本内容，提取其结构和格式信息，输出一个可以用于生成HTML的JSON结构。

合同文本内容：
${textContent.substring(0, 8000)}

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

      const llmResponse = await llmClient.invoke([
        { role: 'user', content: prompt }
      ], {
        model: 'doubao-seed-1-6-flash-250828',
        temperature: 0.1,
      });

      let structure;
      try {
        const jsonMatch = llmResponse.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          structure = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Failed to parse LLM response:', e);
      }

      return NextResponse.json({
        success: true,
        data: {
          text: textContent,
          structure,
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        text: textContent,
      }
    });
  } catch (error) {
    console.error('Parse contract template error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to parse contract template' },
      { status: 500 }
    );
  }
}
