import { SearchClient, Config } from "coze-coding-dev-sdk";

async function searchPolicies() {
  const config = new Config();
  const client = new SearchClient(config);

  console.log("=".repeat(80));
  console.log("搜索: 经营范围规范表述目录 官方下载");
  console.log("=".repeat(80));

  const response1 = await client.webSearch(
    "经营范围规范表述目录 Excel 下载 市场监管总局",
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
  console.log("搜索: 经营范围规范化登记 指导目录");
  console.log("=".repeat(80));

  const response2 = await client.webSearch(
    "经营范围规范化登记 指导目录 GB/T 4754-2017",
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
  console.log("搜索: 国民经济行业分类 GB/T 4754-2017 下载");
  console.log("=".repeat(80));

  const response3 = await client.webSearch(
    "国民经济行业分类 GB/T 4754-2017 PDF 下载 国标",
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
}

searchPolicies().catch(console.error);
