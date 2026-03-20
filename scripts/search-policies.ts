import { SearchClient, Config } from "coze-coding-dev-sdk";

async function searchPolicies() {
  const config = new Config();
  const client = new SearchClient(config);

  console.log("=".repeat(80));
  console.log("搜索1: 市场监管总局 经营范围登记 政策文件");
  console.log("=".repeat(80));

  const response1 = await client.webSearch(
    "市场监管总局 经营范围登记规范化 政策文件 通知",
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
  console.log("搜索2: 企业经营范围登记管理规定 总局令");
  console.log("=".repeat(80));

  const response2 = await client.webSearch(
    "企业经营范围登记管理规定 总局令 国家市场监督管理总局",
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
  console.log("搜索3: 证照分离 经营范围 市场监管总局");
  console.log("=".repeat(80));

  const response3 = await client.webSearch(
    "证照分离 经营范围登记规范化 市场监管总局 国发",
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
  console.log("搜索4: 经营范围规范表述目录 官方发布");
  console.log("=".repeat(80));

  const response4 = await client.webSearch(
    "经营范围规范表述目录 市场监管总局 发布 2023",
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

searchPolicies().catch(console.error);
