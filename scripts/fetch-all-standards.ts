/**
 * 搜索小企业会计准则和其他准则的详细科目表
 */

import { FetchClient, Config, SearchClient } from "coze-coding-dev-sdk";

async function fetchAllStandards() {
  const config = new Config();
  const fetchClient = new FetchClient(config);
  const searchClient = new SearchClient(config);

  console.log("=".repeat(80));
  console.log("搜索所有会计准则详细科目表");
  console.log("=".repeat(80));

  // 1. 小企业会计准则
  console.log("\n【1】小企业会计准则科目表");
  console.log("-".repeat(40));
  
  const smallResult = await searchClient.webSearch("小企业会计准则 会计科目表 库存现金 银行存款 应收账款 完整列表", 10);
  
  for (const item of smallResult.web_items || []) {
    if (item.url?.includes('canet.com.cn') || item.url?.includes('dongao') || item.url?.includes('chinaacc')) {
      console.log(`\n尝试获取: ${item.title}`);
      console.log(`URL: ${item.url}`);
      
      try {
        const fetchResult = await fetchClient.fetch(item.url);
        const textContent = fetchResult.content
          .filter((i: any) => i.type === 'text')
          .map((i: any) => i.text)
          .join('\n');
        
        console.log("\n内容:\n");
        console.log(textContent.substring(0, 5000));
        break;
      } catch (e) {
        console.log("获取失败，尝试下一个...");
      }
    }
  }

  // 2. 民间非营利组织会计制度
  console.log("\n\n【2】民间非营利组织会计制度科目表");
  console.log("-".repeat(40));
  
  const nonProfitResult = await searchClient.webSearch("民间非营利组织会计制度 会计科目表 库存现金 银行存款 捐赠收入", 10);
  
  for (const item of nonProfitResult.web_items || []) {
    console.log(`\n${item.title}`);
    console.log(`URL: ${item.url}`);
    
    if (item.url?.includes('canet') || item.url?.includes('chinaacc') || item.url?.includes('mof.gov')) {
      try {
        const fetchResult = await fetchClient.fetch(item.url);
        const textContent = fetchResult.content
          .filter((i: any) => i.type === 'text')
          .map((i: any) => i.text)
          .join('\n');
        
        console.log("\n内容:\n");
        console.log(textContent.substring(0, 3000));
        break;
      } catch (e) {
        console.log("获取失败");
      }
    }
  }

  // 3. 农民专业合作社
  console.log("\n\n【3】农民专业合作社会计制度科目表");
  console.log("-".repeat(40));
  
  const farmerResult = await searchClient.webSearch("农民专业合作社会计制度 会计科目表 股金 成员往来", 10);
  
  for (const item of farmerResult.web_items || []) {
    console.log(`\n${item.title}`);
    console.log(`URL: ${item.url}`);
    console.log(`摘要: ${item.snippet?.substring(0, 200)}...`);
  }

  // 4. 工会会计制度
  console.log("\n\n【4】工会会计制度科目表");
  console.log("-".repeat(40));
  
  const unionResult = await searchClient.webSearch("工会会计制度 会计科目表 资产基金 工会资金结转", 10);
  
  for (const item of unionResult.web_items || []) {
    console.log(`\n${item.title}`);
    console.log(`URL: ${item.url}`);
    console.log(`摘要: ${item.snippet?.substring(0, 200)}...`);
  }

  // 5. 农村集体经济组织
  console.log("\n\n【5】农村集体经济组织会计制度科目表");
  console.log("-".repeat(40));
  
  const ruralResult = await searchClient.webSearch("农村集体经济组织会计制度 会计科目表 公积公益金 资本", 10);
  
  for (const item of ruralResult.web_items || []) {
    console.log(`\n${item.title}`);
    console.log(`URL: ${item.url}`);
    console.log(`摘要: ${item.snippet?.substring(0, 200)}...`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("搜索完成");
  console.log("=".repeat(80));
}

fetchAllStandards().catch(console.error);
