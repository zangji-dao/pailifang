import { SearchClient, Config } from "coze-coding-dev-sdk";

async function searchMore() {
  const config = new Config();
  const client = new SearchClient(config);

  console.log("=".repeat(80));
  console.log("搜索1: 经营范围规范表述目录 完整下载");
  console.log("=".repeat(80));

  const response1 = await client.webSearch(
    "经营范围规范表述目录 excel 下载 完整版",
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
  console.log("搜索2: 国民经济行业分类 1380小类 完整列表");
  console.log("=".repeat(80));

  const response2 = await client.webSearch(
    "国民经济行业分类 1380小类 完整列表 excel 下载",
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
  console.log("搜索3: 国家统计局 国民经济行业分类 官方下载");
  console.log("=".repeat(80));

  const response3 = await client.webSearch(
    "国家统计局 国民经济行业分类 GB/T 4754-2017 官方下载",
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
  console.log("搜索4: GB/T 4754 是否有新版本 2024");
  console.log("=".repeat(80));

  const response4 = await client.webSearch(
    "GB/T 4754 新版本 2024 国民经济行业分类 修订",
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

searchMore().catch(console.error);
