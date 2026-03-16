/**
 * 获取农民专业合作社和工会会计制度详细科目表
 */

import { FetchClient, Config, SearchClient } from "coze-coding-dev-sdk";

async function fetchSpecificStandards() {
  const config = new Config();
  const fetchClient = new FetchClient(config);
  const searchClient = new SearchClient(config);

  // 1. 农民专业合作社财务会计制度 - 日照市农业农村局
  console.log("=".repeat(80));
  console.log("【1】农民专业合作社财务会计制度科目表");
  console.log("=".repeat(80));
  
  try {
    const farmerUrl = "http://nyncj.rizhao.gov.cn/art/2013/3/7/art_358814_2678412.html";
    const result = await fetchClient.fetch(farmerUrl);
    
    const textContent = result.content
      .filter((i: any) => i.type === 'text')
      .map((i: any) => i.text)
      .join('\n');
    
    console.log(textContent);
  } catch (e) {
    console.error("获取失败:", e);
  }

  // 2. 搜索小企业会计准则详细科目
  console.log("\n" + "=".repeat(80));
  console.log("【2】小企业会计准则科目表");
  console.log("=".repeat(80));
  
  try {
    const smallResult = await searchClient.webSearch("小企业会计准则 一级科目 1001库存现金 1002银行存款 完整科目表", 10);
    
    for (const item of smallResult.web_items || []) {
      console.log(`\n${item.title}`);
      console.log(`URL: ${item.url}`);
      console.log(`摘要: ${item.snippet?.substring(0, 500)}...`);
    }
  } catch (e) {
    console.error("搜索失败:", e);
  }

  // 3. 搜索工会会计制度详细科目
  console.log("\n" + "=".repeat(80));
  console.log("【3】工会会计制度科目表");
  console.log("=".repeat(80));
  
  try {
    const unionResult = await searchClient.webSearch("工会会计制度 会计科目 1001库存现金 1002银行存款 净资产", 10);
    
    for (const item of unionResult.web_items || []) {
      console.log(`\n${item.title}`);
      console.log(`URL: ${item.url}`);
      console.log(`摘要: ${item.snippet?.substring(0, 500)}...`);
    }
  } catch (e) {
    console.error("搜索失败:", e);
  }

  // 4. 搜索民间非营利组织会计制度
  console.log("\n" + "=".repeat(80));
  console.log("【4】民间非营利组织会计制度科目表");
  console.log("=".repeat(80));
  
  try {
    const nonProfitResult = await searchClient.webSearch("民间非营利组织会计制度 一级科目 1001库存现金 1002银行存款 净资产", 10);
    
    for (const item of nonProfitResult.web_items || []) {
      console.log(`\n${item.title}`);
      console.log(`URL: ${item.url}`);
      console.log(`摘要: ${item.snippet?.substring(0, 500)}...`);
    }
  } catch (e) {
    console.error("搜索失败:", e);
  }

  // 5. 搜索农村集体经济组织会计制度
  console.log("\n" + "=".repeat(80));
  console.log("【5】农村集体经济组织会计制度科目表");
  console.log("=".repeat(80));
  
  try {
    const ruralResult = await searchClient.webSearch("农村集体经济组织会计制度 一级科目 101库存现金 102银行存款", 10);
    
    for (const item of ruralResult.web_items || []) {
      console.log(`\n${item.title}`);
      console.log(`URL: ${item.url}`);
      console.log(`摘要: ${item.snippet?.substring(0, 500)}...`);
    }
  } catch (e) {
    console.error("搜索失败:", e);
  }
}

fetchSpecificStandards().catch(console.error);
