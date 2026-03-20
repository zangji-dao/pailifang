import { SearchClient, Config } from "coze-coding-dev-sdk";

async function searchAPI() {
  const config = new Config();
  const client = new SearchClient(config);

  console.log("=".repeat(80));
  console.log("搜索: gsxt.gov.cn 经营范围 查询接口");
  console.log("=".repeat(80));

  const response1 = await client.webSearch(
    "site:gsxt.gov.cn 经营范围",
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
  console.log("搜索: 经营范围规范表述 小程序 API");
  console.log("=".repeat(80));

  const response2 = await client.webSearch(
    "经营范围规范表述查询 小程序 API 接口地址",
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
  console.log("搜索: 经营范围 数据文件 下载");
  console.log("=".repeat(80));

  const response3 = await client.webSearch(
    "经营范围规范表述目录 数据文件 Excel 下载 官方",
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

searchAPI().catch(console.error);
