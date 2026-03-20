import { SearchClient, Config } from "coze-coding-dev-sdk";

async function searchLegalBasis() {
  const config = new Config();
  const client = new SearchClient(config);

  console.log("=".repeat(80));
  console.log("搜索1: 证照分离 全覆盖 国发2021 7号");
  console.log("=".repeat(80));

  const response1 = await client.webSearch(
    "证照分离 全覆盖改革 国发2021 7号 国务院",
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
  console.log("搜索2: 市场主体登记管理条例 第十四条 经营范围条文");
  console.log("=".repeat(80));

  const response2 = await client.webSearch(
    "市场主体登记管理条例 第十四条 经营范围 许经营项目 一般经营项目",
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
  console.log("搜索3: 市监注2019 66号 经营范围规范化");
  console.log("=".repeat(80));

  const response3 = await client.webSearch(
    "市监注2019 66号 经营范围规范化 自贸区",
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
  console.log("搜索4: 经营范围规范化登记 政策依据 文件");
  console.log("=".repeat(80));

  const response4 = await client.webSearch(
    "经营范围规范化登记 政策依据 市场监管总局 通知",
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

searchLegalBasis().catch(console.error);
