import { NextRequest, NextResponse } from 'next/server';
import { FetchClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

/**
 * GET /api/contract-template
 * 获取合同范本内容
 */
export async function GET(request: NextRequest) {
  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new FetchClient(config, customHeaders);

    // 合同范本URL
    const templateUrl = 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%CE%A0%E7%AB%8B%E6%96%B9%E4%BC%81%E6%9C%8D%E4%B8%AD%E5%BF%83%E5%85%A5%E9%A9%BB%E5%90%88%E5%90%8C%E8%8C%83%E6%9C%ACv1.2.pdf&nonce=5a06da13-38e2-485e-ad20-e7494247e3ea&project_id=7616705093815009322&sign=063298eb662d705a9c690aaf2f09bd629a81aedecafd0e9e1f2e2547a14fd15c';

    const response = await client.fetch(templateUrl);

    // 提取文本内容
    const textContent = response.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');

    return NextResponse.json({
      success: true,
      data: {
        title: response.title,
        content: textContent,
        filetype: response.filetype,
      }
    });
  } catch (error) {
    console.error('获取合同范本失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取合同范本失败'
    }, { status: 500 });
  }
}
