/**
 * 搜索财政部最新会计准则科目表
 */

import { SearchClient, Config } from "coze-coding-dev-sdk";

async function searchAccountingStandards() {
  const config = new Config();
  const client = new SearchClient(config);

  console.log("=".repeat(80));
  console.log("搜索财政部最新会计准则科目表");
  console.log("=".repeat(80));

  // 1. 搜索小企业会计准则最新版本
  console.log("\n【1】小企业会计准则");
  console.log("-".repeat(40));
  const smallEnterpriseResult = await client.advancedSearch("财政部 小企业会计准则 科目表 最新 2024", {
    sites: "mof.gov.cn,kjs.mof.gov.cn",
    count: 5,
    needSummary: true,
  });
  
  console.log("AI摘要:", smallEnterpriseResult.summary);
  smallEnterpriseResult.web_items?.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   摘要: ${item.snippet?.substring(0, 200)}...`);
  });

  // 2. 搜索企业会计准则科目表
  console.log("\n\n【2】企业会计准则");
  console.log("-".repeat(40));
  const enterpriseResult = await client.advancedSearch("财政部 企业会计准则 科目表 最新", {
    sites: "mof.gov.cn,kjs.mof.gov.cn",
    count: 5,
    needSummary: true,
  });
  
  console.log("AI摘要:", enterpriseResult.summary);
  enterpriseResult.web_items?.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   摘要: ${item.snippet?.substring(0, 200)}...`);
  });

  // 3. 搜索民间非营利组织会计制度
  console.log("\n\n【3】民间非营利组织会计制度");
  console.log("-".repeat(40));
  const nonProfitResult = await client.advancedSearch("财政部 民间非营利组织会计制度 科目表", {
    sites: "mof.gov.cn,kjs.mof.gov.cn",
    count: 5,
    needSummary: true,
  });
  
  console.log("AI摘要:", nonProfitResult.summary);
  nonProfitResult.web_items?.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   摘要: ${item.snippet?.substring(0, 200)}...`);
  });

  // 4. 搜索农民专业合作社财务会计制度
  console.log("\n\n【4】农民专业合作社财务会计制度");
  console.log("-".repeat(40));
  const farmerCoopResult = await client.advancedSearch("财政部 农民专业合作社 财务会计制度 科目表", {
    sites: "mof.gov.cn,kjs.mof.gov.cn",
    count: 5,
    needSummary: true,
  });
  
  console.log("AI摘要:", farmerCoopResult.summary);
  farmerCoopResult.web_items?.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   摘要: ${item.snippet?.substring(0, 200)}...`);
  });

  // 5. 搜索工会会计制度
  console.log("\n\n【5】工会会计制度");
  console.log("-".repeat(40));
  const unionResult = await client.advancedSearch("财政部 工会会计制度 科目表 最新", {
    sites: "mof.gov.cn,kjs.mof.gov.cn",
    count: 5,
    needSummary: true,
  });
  
  console.log("AI摘要:", unionResult.summary);
  unionResult.web_items?.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   摘要: ${item.snippet?.substring(0, 200)}...`);
  });

  // 6. 搜索农村集体经济组织会计制度
  console.log("\n\n【6】农村集体经济组织会计制度");
  console.log("-".repeat(40));
  const ruralCollectiveResult = await client.advancedSearch("财政部 农村集体经济组织 会计制度 科目表", {
    sites: "mof.gov.cn,kjs.mof.gov.cn",
    count: 5,
    needSummary: true,
  });
  
  console.log("AI摘要:", ruralCollectiveResult.summary);
  ruralCollectiveResult.web_items?.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   摘要: ${item.snippet?.substring(0, 200)}...`);
  });

  // 7. 额外搜索：会计准则科目编码规则
  console.log("\n\n【7】会计准则科目编码规则");
  console.log("-".repeat(40));
  const codingResult = await client.advancedSearch("企业会计准则 会计科目编码规则 一级科目编码", {
    count: 5,
    needSummary: true,
  });
  
  console.log("AI摘要:", codingResult.summary);
  codingResult.web_items?.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   摘要: ${item.snippet?.substring(0, 200)}...`);
  });

  console.log("\n" + "=".repeat(80));
  console.log("搜索完成");
  console.log("=".repeat(80));
}

searchAccountingStandards().catch(console.error);
