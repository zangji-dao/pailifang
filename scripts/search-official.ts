import { SearchClient, Config } from "coze-coding-dev-sdk";

async function searchOfficialVersion() {
  const config = new Config();
  const client = new SearchClient(config);

  console.log("=".repeat(80));
  console.log("搜索1: 经营范围规范表述目录 正式版 发布");
  console.log("=".repeat(80));

  const response1 = await client.webSearch(
    "经营范围规范表述目录 正式版 发布 2022 2023 2024",
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
  console.log("搜索2: 经营范围规范表述目录 最新版");
  console.log("=".repeat(80));

  const response2 = await client.webSearch(
    "经营范围规范表述目录 最新版 2036条 完整版",
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
  console.log("搜索3: e窗通 经营范围 数据 接口");
  console.log("=".repeat(80));

  const response3 = await client.webSearch(
    "e窗通 经营范围 数据 2036条 全部",
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
  console.log("搜索4: 经营范围规范表述目录 更新 版本");
  console.log("=".repeat(80));

  const response4 = await client.webSearch(
    "经营范围规范表述目录 更新 修订 版本 市场监管总局",
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

searchOfficialVersion().catch(console.error);
