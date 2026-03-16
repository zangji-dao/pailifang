/**
 * 获取民间非营利组织会计制度详细科目表
 */

import { FetchClient, Config, SearchClient } from "coze-coding-dev-sdk";

async function fetchNonProfitSubjects() {
  const config = new Config();
  const fetchClient = new FetchClient(config);
  const searchClient = new SearchClient(config);

  console.log("=".repeat(80));
  console.log("获取民间非营利组织会计制度详细科目表");
  console.log("=".repeat(80));

  // 尝试获取淘文档的民间非营利组织会计科目
  const urls = [
    "https://m.taodocs.com/p-211831281.html",
    "https://m.51wendang.com/doc/18ae02d85e09067d692a43ef01d675926970cb08",
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
      console.log(textContent.substring(0, 6000));
      console.log("\n" + "-".repeat(40));
    } catch (e) {
      console.log("获取失败:", e);
    }
  }

  // 搜索工会会计制度
  console.log("\n" + "=".repeat(80));
  console.log("搜索工会会计制度详细科目");
  console.log("=".repeat(80));

  const unionResult = await searchClient.webSearch(
    "工会会计制度 会计科目表 101库存现金 102银行存款 201资产基金 完整科目",
    10
  );

  for (const item of unionResult.web_items || []) {
    console.log(`\n${item.title}`);
    console.log(`URL: ${item.url}`);
    console.log(`摘要: ${item.snippet?.substring(0, 500)}...`);
  }

  // 搜索农村集体经济组织会计制度
  console.log("\n" + "=".repeat(80));
  console.log("搜索农村集体经济组织会计制度详细科目");
  console.log("=".repeat(80));

  const ruralResult = await searchClient.webSearch(
    "农村集体经济组织会计制度 会计科目表 101库存现金 102银行存款 301资本 完整科目",
    10
  );

  for (const item of ruralResult.web_items || []) {
    console.log(`\n${item.title}`);
    console.log(`URL: ${item.url}`);
    console.log(`摘要: ${item.snippet?.substring(0, 500)}...`);
  }
}

fetchNonProfitSubjects().catch(console.error);
