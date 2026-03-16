/**
 * 搜索民间非营利组织、工会、农村集体经济组织的会计科目表
 */

import { FetchClient, Config, SearchClient } from "coze-coding-dev-sdk";

async function fetchRemainingStandards() {
  const config = new Config();
  const fetchClient = new FetchClient(config);
  const searchClient = new SearchClient(config);

  // 1. 民间非营利组织会计制度
  console.log("=".repeat(80));
  console.log("【1】民间非营利组织会计制度科目表");
  console.log("=".repeat(80));
  
  try {
    const nonProfitResult = await searchClient.webSearch(
      "民间非营利组织会计制度 会计科目表 1001库存现金 1002银行存款 净资产 捐赠收入 完整列表",
      10
    );
    
    for (const item of nonProfitResult.web_items || []) {
      console.log(`\n${item.title}`);
      console.log(`URL: ${item.url}`);
      console.log(`摘要: ${item.snippet?.substring(0, 800)}...`);
      
      // 尝试获取详细内容
      if (item.url?.includes('canet') || item.url?.includes('mof.gov') || item.url?.includes('chinaacc')) {
        try {
          const fetchResult = await fetchClient.fetch(item.url);
          const textContent = fetchResult.content
            .filter((i: any) => i.type === 'text')
            .map((i: any) => i.text)
            .join('\n');
          
          if (textContent.includes("1001") || textContent.includes("库存现金")) {
            console.log("\n详细内容:\n");
            console.log(textContent.substring(0, 5000));
            break;
          }
        } catch (e) {
          console.log("获取失败");
        }
      }
    }
  } catch (e) {
    console.error("搜索失败:", e);
  }

  // 2. 工会会计制度
  console.log("\n" + "=".repeat(80));
  console.log("【2】工会会计制度科目表");
  console.log("=".repeat(80));
  
  try {
    const unionResult = await searchClient.webSearch(
      "工会会计制度 会计科目表 1001库存现金 1002银行存款 资产基金 净资产 完整列表",
      10
    );
    
    for (const item of unionResult.web_items || []) {
      console.log(`\n${item.title}`);
      console.log(`URL: ${item.url}`);
      console.log(`摘要: ${item.snippet?.substring(0, 800)}...`);
    }
  } catch (e) {
    console.error("搜索失败:", e);
  }

  // 3. 农村集体经济组织会计制度
  console.log("\n" + "=".repeat(80));
  console.log("【3】农村集体经济组织会计制度科目表");
  console.log("=".repeat(80));
  
  try {
    const ruralResult = await searchClient.webSearch(
      "农村集体经济组织会计制度 会计科目表 101现金 102银行存款 公积公益金 资本 完整列表",
      10
    );
    
    for (const item of ruralResult.web_items || []) {
      console.log(`\n${item.title}`);
      console.log(`URL: ${item.url}`);
      console.log(`摘要: ${item.snippet?.substring(0, 800)}...`);
      
      if (item.url?.includes('mayiwenku') || item.url?.includes('doc88') || item.url?.includes('book118')) {
        try {
          const fetchResult = await fetchClient.fetch(item.url);
          const textContent = fetchResult.content
            .filter((i: any) => i.type === 'text')
            .map((i: any) => i.text)
            .join('\n');
          
          console.log("\n详细内容:\n");
          console.log(textContent.substring(0, 5000));
          break;
        } catch (e) {
          console.log("获取失败");
        }
      }
    }
  } catch (e) {
    console.error("搜索失败:", e);
  }
}

fetchRemainingStandards().catch(console.error);
