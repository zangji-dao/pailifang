import { FetchClient, Config } from 'coze-coding-dev-sdk';

async function fetchDirectory() {
  const config = new Config();
  const client = new FetchClient(config);

  console.log("=".repeat(80));
  console.log("获取《经营范围规范表述目录》征求意见通知");
  console.log("=".repeat(80));

  const url = 'https://www.samr.gov.cn/hd/zjdc/art/2023/art_45c400468e9a45caa2254defd2ef074b.html';
  
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
    
    // 提取链接
    const links = response.content
      .filter(item => item.type === 'link')
      .map(item => item.url);
    
    if (links.length > 0) {
      console.log('\n\n发现链接:');
      links.forEach((link, i) => {
        console.log(`${i + 1}. ${link}`);
      });
    }
  } catch (error) {
    console.error('获取失败:', error);
  }
}

fetchDirectory().catch(console.error);
