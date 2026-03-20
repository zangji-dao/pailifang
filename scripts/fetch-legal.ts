import { FetchClient, Config } from 'coze-coding-dev-sdk';

async function fetchLegalDocuments() {
  const config = new Config();
  const client = new FetchClient(config);

  console.log("=".repeat(80));
  console.log("获取《市场主体登记管理条例》全文");
  console.log("=".repeat(80));

  const url = 'https://www.gov.cn/zhengce/content/2021-08/24/content_5632964.htm';
  
  try {
    const response = await client.fetch(url);
    
    console.log(`\n标题: ${response.title}`);
    console.log(`状态: ${response.status_code === 0 ? '成功' : '失败'}`);
    
    // 提取文本内容
    const textContent = response.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');
    
    console.log('\n内容:');
    console.log(textContent);
  } catch (error) {
    console.error('获取失败:', error);
  }
}

fetchLegalDocuments().catch(console.error);
