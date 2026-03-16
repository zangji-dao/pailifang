/**
 * 获取农村集体经济组织会计制度完整科目表
 */

import { FetchClient, Config, SearchClient } from "coze-coding-dev-sdk";

async function fetchRuralComplete() {
  const config = new Config();
  const fetchClient = new FetchClient(config);
  const searchClient = new SearchClient(config);

  console.log("=".repeat(80));
  console.log("获取农村集体经济组织会计制度完整科目表");
  console.log("=".repeat(80));

  // 搜索并获取详细内容
  const searchResult = await searchClient.webSearch(
    "农村集体经济组织会计制度 会计科目表 101现金 102银行存款 301资本 311公积公益金 完整列表",
    10
  );

  for (const item of searchResult.web_items || []) {
    console.log(`\n${item.title}`);
    console.log(`URL: ${item.url}`);
    console.log(`摘要: ${item.snippet?.substring(0, 500)}...`);
    
    // 尝试获取详细内容
    if (item.url && (item.url.includes('mayiwenku') || item.url.includes('jzx7788') || item.url.includes('docin'))) {
      try {
        const result = await fetchClient.fetch(item.url);
        const textContent = result.content
          .filter((i: any) => i.type === 'text')
          .map((i: any) => i.text)
          .join('\n');
        
        console.log("\n详细内容:\n");
        console.log(textContent.substring(0, 8000));
        break;
      } catch (e) {
        console.log("获取失败");
      }
    }
  }

  // 搜索最新版工会会计制度
  console.log("\n" + "=".repeat(80));
  console.log("搜索最新版工会会计制度");
  console.log("=".repeat(80));

  const unionResult = await searchClient.webSearch(
    "工会会计制度 2024 2025 最新版 会计科目表 库存现金 银行存款 资产基金",
    10
  );

  for (const item of unionResult.web_items || []) {
    console.log(`\n${item.title}`);
    console.log(`URL: ${item.url}`);
    console.log(`摘要: ${item.snippet?.substring(0, 500)}...`);
  }
}

fetchRuralComplete().catch(console.error);
