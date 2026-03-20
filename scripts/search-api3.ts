import { SearchClient, Config } from "coze-coding-dev-sdk";

async function searchAPI() {
  const config = new Config();
  const client = new SearchClient(config);

  console.log("=".repeat(80));
  console.log("搜索: jyfwywcx 经营范围 规范表述 查询系统");
  console.log("=".repeat(80));

  const response1 = await client.webSearch(
    "jyfwywcx 经营范围 规范表述 查询系统",
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
  console.log("搜索: 经营范围规范表述查询系统 全国统一");
  console.log("=".repeat(80));

  const response2 = await client.webSearch(
    "经营范围规范表述查询系统 全国统一 市场监管",
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
  console.log("搜索: 经营范围 选择器 第三方 API");
  console.log("=".repeat(80));

  const response3 = await client.webSearch(
    "经营范围 选择器 第三方 API 开源数据",
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
  console.log("搜索: 经营范围规范表述 GitHub 数据");
  console.log("=".repeat(80));

  const response4 = await client.webSearch(
    "经营范围规范表述 GitHub JSON 数据",
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
