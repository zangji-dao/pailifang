/**
 * 获取完整的企业会计准则科目表
 */

import { FetchClient, Config } from "coze-coding-dev-sdk";

async function fetchEnterpriseSubjects() {
  const config = new Config();
  const fetchClient = new FetchClient(config);

  console.log("=".repeat(80));
  console.log("获取企业会计准则完整科目表");
  console.log("=".repeat(80));

  const enterpriseUrl = "http://www.canet.com.cn/kemu/596034.html";
  const result = await fetchClient.fetch(enterpriseUrl);
  
  console.log(`标题: ${result.title}`);
  console.log(`URL: ${result.url}`);
  
  // 提取所有文本内容
  const textContent = result.content
    .filter(item => item.type === 'text')
    .map(item => item.text)
    .join('\n');
  
  console.log("\n完整内容:\n");
  console.log(textContent);
}

fetchEnterpriseSubjects().catch(console.error);
