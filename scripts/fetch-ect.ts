import { FetchClient, Config } from 'coze-coding-dev-sdk';

async function fetchEChuangTongAPI() {
  const config = new Config();
  const client = new FetchClient(config);

  // 尝试获取e窗通经营范围接口
  const urls = [
    'https://ect.scjgj.beijing.gov.cn/api/industry/list',
    'https://ect.scjgj.beijing.gov.cn/api/businessScope/list',
    'https://ect.scjgj.beijing.gov.cn/api/jyfw/list',
    'https://jyfwywcx.gsxt.gov.cn/',
    'https://jyfwywcx.gsxt.gov.cn/api/list',
  ];

  for (const url of urls) {
    console.log(`\n尝试获取: ${url}`);
    try {
      const response = await client.fetch(url);
      console.log(`状态: ${response.status_code}`);
      console.log(`消息: ${response.status_message}`);
      if (response.content) {
        const text = response.content
          .filter(item => item.type === 'text')
          .map(item => item.text)
          .join('\n');
        console.log(`内容: ${text.substring(0, 500)}`);
      }
    } catch (error) {
      console.log(`错误: ${error}`);
    }
  }
}

fetchEChuangTongAPI().catch(console.error);
