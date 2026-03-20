import { SearchClient, Config } from "coze-coding-dev-sdk";

async function searchDirectory() {
  const config = new Config();
  const client = new SearchClient(config);

  console.log("=".repeat(80));
  console.log("搜索1: 经营范围规范表述目录 附件 下载 官方");
  console.log("=".repeat(80));

  const response1 = await client.webSearch(
    "经营范围规范表述目录 附件 下载 市场监管总局 2021",
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
  console.log("搜索2: 经营范围规范表述目录 PDF Excel");
  console.log("=".repeat(80));

  const response2 = await client.webSearch(
    "经营范围规范表述目录 PDF Excel 下载 文件",
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
  console.log("搜索3: samr.gov.cn 经营范围规范表述目录 附件");
  console.log("=".repeat(80));

  const response3 = await client.webSearch(
    "site:samr.gov.cn 经营范围规范表述目录",
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
  console.log("搜索4: 经营范围规范表述目录 完整版 全文");
  console.log("=".repeat(80));

  const response4 = await client.webSearch(
    "经营范围规范表述目录 完整版 全文 内容",
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

searchDirectory().catch(console.error);
