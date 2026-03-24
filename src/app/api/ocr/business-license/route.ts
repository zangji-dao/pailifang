import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";

/**
 * POST /api/ocr/business-license
 * 识别营业执照图片，提取关键信息
 */
export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ 
        success: false, 
        error: "请提供图片URL" 
      }, { status: 400 });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建识别请求
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string | Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string; detail?: "high" | "low" } }>;
    }> = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `请识别这张营业执照图片，提取以下信息并以JSON格式返回：
{
  "enterpriseName": "企业名称",
  "creditCode": "统一社会信用代码（18位）",
  "legalPerson": "法定代表人姓名",
  "registeredCapital": "注册资本（只保留数字和单位，如：100万元）",
  "businessScope": "经营范围",
  "establishDate": "成立日期（格式：YYYY-MM-DD）",
  "address": "住所/经营地址"
}

注意：
1. 只返回JSON，不要有其他文字
2. 如果某个字段无法识别，返回空字符串""
3. 确保信用代码准确无误，这是18位代码
4. 法定代表人只要姓名，不要其他信息`,
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
              detail: "high",
            },
          },
        ],
      },
    ];

    const response = await client.invoke(messages, {
      model: "doubao-seed-1-6-vision-250815",
      temperature: 0.1, // 低温度确保输出稳定
    });

    // 解析返回的JSON
    let result;
    try {
      // 尝试提取JSON部分
      const content = response.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = JSON.parse(content);
      }
    } catch (parseError) {
      console.error("解析OCR结果失败:", response.content);
      return NextResponse.json({
        success: false,
        error: "识别结果解析失败，请重试",
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("营业执照识别失败:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "识别失败",
    }, { status: 500 });
  }
}
