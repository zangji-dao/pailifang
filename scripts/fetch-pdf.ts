import { FetchClient, Config } from 'coze-coding-dev-sdk';

async function fetchPDF() {
  const config = new Config();
  const client = new FetchClient(config);

  console.log("=".repeat(80));
  console.log("获取《经营范围规范表述目录》PDF文件");
  console.log("=".repeat(80));

  const url = 'https://www.samr.gov.cn/cms_files/filemanager/1647978232/attach/20233/P020210316361615430877.pdf';
  
  try {
    const response = await client.fetch(url);
    
    console.log(`\n标题: ${response.title}`);
    console.log(`文件类型: ${response.filetype}`);
    console.log(`状态: ${response.status_code === 0 ? '成功' : '失败'}`);
    console.log(`状态消息: ${response.status_message}`);
    
    // 提取文本内容
    const textContent = response.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');
    
    console.log('\n内容 (前5000字符):');
    console.log(textContent.substring(0, 5000));
    
    console.log('\n\n... 内容总长度:', textContent.length, '字符');
  } catch (error) {
    console.error('获取失败:', error);
  }
}

fetchPDF().catch(console.error);
