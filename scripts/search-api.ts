import { SearchClient, Config } from "coze-coding-dev-sdk";

async function searchAPI() {
  const config = new Config();
  const client = new SearchClient(config);

  console.log("=".repeat(80));
  console.log("搜索1: 北京e窗通 经营范围 API 接口");
  console.log("=".repeat(80));

  const response1 = await client.webSearch(
    "北京e窗通 经营范围 API接口 开放平台",
    10,
    true
  );

  console.log("\n搜索结果:");
  response1.web_items?.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   来源: ${item.site_name}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   摘要: ${item.snippet?.substring(0, 300)}`);
  });

  console.log("\n" + "=".repeat(80));
  console.log("搜索2: 北京市企业开办一窗通 API");
  console.log("=".repeat(80));

  const response2 = await client.webSearch(
    "北京市企业开办一窗通 接口对接 开发者 API",
    10,
    true
  );

  console.log("\n搜索结果:");
  response2.web_items?.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   来源: ${item.site_name}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   摘要: ${item.snippet?.substring(0, 300)}`);
  });

  console.log("\n" + "=".repeat(80));
  console.log("搜索3: 北京政务服务网 企业登记 API");
  console.log("=".repeat(80));

  const response3 = await client.webSearch(
    "北京政务服务网 企业登记 API 开放接口",
    10,
    true
  );

  console.log("\n搜索结果:");
  response3.web_items?.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   来源: ${item.site_name}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   摘要: ${item.snippet?.substring(0, 300)}`);
  });

  console.log("\n" + "=".repeat(80));
  console.log("搜索4: e窗通 经营范围 数据接口");
  console.log("=".repeat(80));

  const response4 = await client.webSearch(
    "e窗通 经营范围选择 数据来源 接口地址",
    10,
    true
  );

  console.log("\n搜索结果:");
  response4.web_items?.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   来源: ${item.site_name}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   摘要: ${item.snippet?.substring(0, 300)}`);
  });
}

searchAPI().catch(console.error);
