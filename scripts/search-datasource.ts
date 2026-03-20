import { SearchClient, Config } from "coze-coding-dev-sdk";

async function searchDataSource() {
  const config = new Config();
  const client = new SearchClient(config);

  console.log("=".repeat(80));
  console.log("搜索1: 经营范围规范表述系统 官方平台");
  console.log("=".repeat(80));

  const response1 = await client.webSearch(
    "经营范围规范表述系统 官方平台 查询入口",
    10,
    true
  );

  console.log("\n搜索结果:");
  response1.web_items?.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   来源: ${item.site_name}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   摘要: ${item.snippet?.substring(0, 500)}`);
  });

  console.log("\n" + "=".repeat(80));
  console.log("搜索2: jyfwywcx 经营范围 规范表述 查询");
  console.log("=".repeat(80));

  const response2 = await client.webSearch(
    "jyfwywcx 经营范围规范表述查询 系统",
    10,
    true
  );

  console.log("\n搜索结果:");
  response2.web_items?.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   来源: ${item.site_name}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   摘要: ${item.snippet?.substring(0, 500)}`);
  });

  console.log("\n" + "=".repeat(80));
  console.log("搜索3: 经营范围规范表述数据 全量 下载");
  console.log("=".repeat(80));

  const response3 = await client.webSearch(
    "经营范围规范表述数据 全量下载 JSON Excel 完整",
    10,
    true
  );

  console.log("\n搜索结果:");
  response3.web_items?.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   来源: ${item.site_name}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   摘要: ${item.snippet?.substring(0, 500)}`);
  });

  console.log("\n" + "=".repeat(80));
  console.log("搜索4: 市场监管总局 经营范围规范表述 2023 2024 发布");
  console.log("=".repeat(80));

  const response4 = await client.webSearch(
    "市场监管总局 经营范围规范表述 2023年 2024年 发布 更新",
    10,
    true
  );

  console.log("\n搜索结果:");
  response4.web_items?.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   来源: ${item.site_name}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   摘要: ${item.snippet?.substring(0, 500)}`);
  });
}

searchDataSource().catch(console.error);
