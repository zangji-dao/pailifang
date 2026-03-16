/**
 * 搜索各会计准则详细科目表
 */

import { SearchClient, Config } from "coze-coding-dev-sdk";

async function searchDetailedSubjects() {
  const config = new Config();
  const client = new SearchClient(config);

  console.log("=".repeat(80));
  console.log("搜索各会计准则详细科目表");
  console.log("=".repeat(80));

  // 1. 搜索企业会计准则科目表（最完整版本）
  console.log("\n【1】企业会计准则科目表（完整版）");
  console.log("-".repeat(40));
  const enterpriseResult = await client.webSearch("企业会计准则 会计科目表 一级科目完整列表 1001 1002", 10, true);
  
  console.log("AI摘要:", enterpriseResult.summary);
  enterpriseResult.web_items?.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   来源: ${item.site_name}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   内容: ${item.snippet?.substring(0, 300)}...`);
  });

  // 2. 搜索小企业会计准则最新版
  console.log("\n\n【2】小企业会计准则科目表");
  console.log("-".repeat(40));
  const smallResult = await client.webSearch("小企业会计准则 会计科目表 一级科目完整 财政部", 10, true);
  
  console.log("AI摘要:", smallResult.summary);
  smallResult.web_items?.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   来源: ${item.site_name}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   内容: ${item.snippet?.substring(0, 300)}...`);
  });

  // 3. 搜索民间非营利组织会计制度
  console.log("\n\n【3】民间非营利组织会计制度科目表");
  console.log("-".repeat(40));
  const nonProfitResult = await client.webSearch("民间非营利组织会计制度 会计科目表 一级科目", 10, true);
  
  console.log("AI摘要:", nonProfitResult.summary);
  nonProfitResult.web_items?.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   来源: ${item.site_name}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   内容: ${item.snippet?.substring(0, 300)}...`);
  });

  // 4. 搜索农民专业合作社财务会计制度
  console.log("\n\n【4】农民专业合作社财务会计制度科目表");
  console.log("-".repeat(40));
  const farmerResult = await client.webSearch("农民专业合作社财务会计制度 会计科目表 一级科目", 10, true);
  
  console.log("AI摘要:", farmerResult.summary);
  farmerResult.web_items?.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   来源: ${item.site_name}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   内容: ${item.snippet?.substring(0, 300)}...`);
  });

  // 5. 搜索工会会计制度最新版
  console.log("\n\n【5】工会会计制度科目表");
  console.log("-".repeat(40));
  const unionResult = await client.webSearch("工会会计制度 会计科目表 最新版 2024", 10, true);
  
  console.log("AI摘要:", unionResult.summary);
  unionResult.web_items?.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   来源: ${item.site_name}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   内容: ${item.snippet?.substring(0, 300)}...`);
  });

  // 6. 搜索农村集体经济组织会计制度
  console.log("\n\n【6】农村集体经济组织会计制度科目表");
  console.log("-".repeat(40));
  const ruralResult = await client.webSearch("农村集体经济组织会计制度 会计科目表 一级科目", 10, true);
  
  console.log("AI摘要:", ruralResult.summary);
  ruralResult.web_items?.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   来源: ${item.site_name}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   内容: ${item.snippet?.substring(0, 300)}...`);
  });

  console.log("\n" + "=".repeat(80));
  console.log("搜索完成");
  console.log("=".repeat(80));
}

searchDetailedSubjects().catch(console.error);
