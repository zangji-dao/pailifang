/**
 * 获取详细的会计科目表内容
 */

import { FetchClient, Config, SearchClient } from "coze-coding-dev-sdk";

async function fetchAccountingSubjects() {
  const config = new Config();
  const fetchClient = new FetchClient(config);
  const searchClient = new SearchClient(config);

  console.log("=".repeat(80));
  console.log("获取各会计准则详细科目表内容");
  console.log("=".repeat(80));

  // 1. 获取企业会计准则科目表（中国会计网 2026版）
  console.log("\n【1】企业会计准则科目表（2026版）");
  console.log("-".repeat(40));
  
  try {
    const enterpriseUrl = "http://www.canet.com.cn/kemu/596034.html";
    const enterpriseResult = await fetchClient.fetch(enterpriseUrl);
    
    console.log(`标题: ${enterpriseResult.title}`);
    console.log(`URL: ${enterpriseResult.url}`);
    
    // 提取文本内容
    const textContent = enterpriseResult.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');
    
    console.log("\n内容预览:");
    console.log(textContent.substring(0, 3000));
  } catch (error) {
    console.error("获取企业会计准则科目表失败:", error);
  }

  // 2. 搜索并获取小企业会计准则详细科目
  console.log("\n\n【2】小企业会计准则科目表");
  console.log("-".repeat(40));
  
  try {
    const smallResult = await searchClient.webSearch("小企业会计准则 科目表 库存现金 银行存款 一级科目列表", 5);
    
    for (const item of smallResult.web_items || []) {
      if (item.url && item.url.includes('chinaacc') || item.url?.includes('dongao')) {
        console.log(`\n尝试获取: ${item.title}`);
        console.log(`URL: ${item.url}`);
        
        try {
          const fetchResult = await fetchClient.fetch(item.url);
          const textContent = fetchResult.content
            .filter((i: any) => i.type === 'text')
            .map((i: any) => i.text)
            .join('\n');
          
          console.log("内容预览:");
          console.log(textContent.substring(0, 2000));
          break;
        } catch (e) {
          console.log("获取失败，尝试下一个...");
        }
      }
    }
  } catch (error) {
    console.error("搜索小企业会计准则失败:", error);
  }

  // 3. 搜索民间非营利组织会计制度
  console.log("\n\n【3】民间非营利组织会计制度科目表");
  console.log("-".repeat(40));
  
  try {
    const nonProfitResult = await searchClient.webSearch("民间非营利组织会计制度 会计科目表 资产类 负债类", 5);
    
    for (const item of nonProfitResult.web_items || []) {
      console.log(`\n${item.title}`);
      console.log(`URL: ${item.url}`);
      console.log(`摘要: ${item.snippet?.substring(0, 300)}...`);
    }
  } catch (error) {
    console.error("搜索民间非营利组织会计制度失败:", error);
  }

  // 4. 搜索农民专业合作社财务会计制度
  console.log("\n\n【4】农民专业合作社财务会计制度科目表");
  console.log("-".repeat(40));
  
  try {
    const farmerResult = await searchClient.webSearch("农民专业合作社财务会计制度 会计科目表 一级科目", 5);
    
    for (const item of farmerResult.web_items || []) {
      console.log(`\n${item.title}`);
      console.log(`URL: ${item.url}`);
      console.log(`摘要: ${item.snippet?.substring(0, 300)}...`);
    }
  } catch (error) {
    console.error("搜索农民专业合作社财务会计制度失败:", error);
  }

  // 5. 搜索工会会计制度
  console.log("\n\n【5】工会会计制度科目表");
  console.log("-".repeat(40));
  
  try {
    const unionResult = await searchClient.webSearch("工会会计制度 会计科目表 资产类 负债类 净资产", 5);
    
    for (const item of unionResult.web_items || []) {
      console.log(`\n${item.title}`);
      console.log(`URL: ${item.url}`);
      console.log(`摘要: ${item.snippet?.substring(0, 300)}...`);
    }
  } catch (error) {
    console.error("搜索工会会计制度失败:", error);
  }

  // 6. 搜索农村集体经济组织会计制度
  console.log("\n\n【6】农村集体经济组织会计制度科目表");
  console.log("-".repeat(40));
  
  try {
    const ruralResult = await searchClient.webSearch("农村集体经济组织会计制度 会计科目表 一级科目", 5);
    
    for (const item of ruralResult.web_items || []) {
      console.log(`\n${item.title}`);
      console.log(`URL: ${item.url}`);
      console.log(`摘要: ${item.snippet?.substring(0, 300)}...`);
    }
  } catch (error) {
    console.error("搜索农村集体经济组织会计制度失败:", error);
  }

  console.log("\n" + "=".repeat(80));
  console.log("获取完成");
  console.log("=".repeat(80));
}

fetchAccountingSubjects().catch(console.error);
