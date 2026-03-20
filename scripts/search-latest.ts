import { SearchClient, Config } from "coze-coding-dev-sdk";

async function searchLatestVersion() {
  const config = new Config();
  const client = new SearchClient(config);

  console.log("=".repeat(80));
  console.log("搜索: 经营范围规范表述目录 2023 2024 正式发布 完整版");
  console.log("=".repeat(80));

  const response = await client.webSearch(
    "经营范围规范表述目录 2023年 2024年 正式发布 完整版 附件下载",
    15,
    true
  );

  console.log("\n搜索结果:");
  response.web_items?.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   来源: ${item.site_name}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   摘要: ${item.snippet?.substring(0, 500)}`);
  });

  // 搜索是否有正式文件
  console.log("\n" + "=".repeat(80));
  console.log("搜索: 市场监管总局公告 经营范围规范表述 正式实施");
  console.log("=".repeat(80));

  const response2 = await client.webSearch(
    "市场监管总局公告 经营范围规范表述 正式实施 施行",
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
}

searchLatestVersion().catch(console.error);
