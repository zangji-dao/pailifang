/**
 * 获取小企业会计准则详细科目表
 */

import { FetchClient, Config, SearchClient } from "coze-coding-dev-sdk";

async function fetchSmallEnterpriseSubjects() {
  const config = new Config();
  const fetchClient = new FetchClient(config);
  const searchClient = new SearchClient(config);

  console.log("=".repeat(80));
  console.log("获取小企业会计准则详细科目表");
  console.log("=".repeat(80));

  // 尝试获取高顿教育的小企业科目汇总
  const urls = [
    "https://m.gaodun.com/wenda/zhongji/29027.html",
    "https://cas.xmu.edu.cn/info/2523/5374.htm",
  ];

  for (const url of urls) {
    console.log(`\n尝试获取: ${url}`);
    try {
      const result = await fetchClient.fetch(url);
      const textContent = result.content
        .filter((i: any) => i.type === 'text')
        .map((i: any) => i.text)
        .join('\n');
      
      console.log("\n内容:\n");
      console.log(textContent.substring(0, 8000));
      console.log("\n" + "-".repeat(40));
    } catch (e) {
      console.log("获取失败:", e);
    }
  }

  // 搜索更详细的小企业会计准则科目
  console.log("\n" + "=".repeat(80));
  console.log("搜索小企业会计准则科目详情");
  console.log("=".repeat(80));

  const searchResult = await searchClient.webSearch(
    "小企业会计准则 会计科目 1001库存现金 1002银行存款 1012其他货币资金 完整列表",
    10
  );

  for (const item of searchResult.web_items || []) {
    if (item.snippet && item.snippet.includes("1001")) {
      console.log(`\n${item.title}`);
      console.log(`URL: ${item.url}`);
      console.log(`内容: ${item.snippet?.substring(0, 1000)}...`);
    }
  }
}

fetchSmallEnterpriseSubjects().catch(console.error);
