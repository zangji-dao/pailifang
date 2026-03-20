import { SearchClient, Config } from "coze-coding-dev-sdk";

async function searchAPI() {
  const config = new Config();
  const client = new SearchClient(config);

  console.log("=".repeat(80));
  console.log("搜索: e窗通 经营范围 接口地址 scjgj.beijing.gov.cn");
  console.log("=".repeat(80));

  const response1 = await client.webSearch(
    "site:scjgj.beijing.gov.cn 经营范围 接口",
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
  console.log("搜索: 市场监管总局 经营范围规范表述 API");
  console.log("=".repeat(80));

  const response2 = await client.webSearch(
    "市场监管总局 经营范围规范表述 API接口 开放数据",
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
  console.log("搜索: 经营范围规范表述查询接口");
  console.log("=".repeat(80));

  const response3 = await client.webSearch(
    "经营范围规范表述查询 接口 http api json",
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
  console.log("搜索: 全国经营范围规范表述系统");
  console.log("=".repeat(80));

  const response4 = await client.webSearch(
    "全国经营范围规范表述系统 jyfw samr gov cn",
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
