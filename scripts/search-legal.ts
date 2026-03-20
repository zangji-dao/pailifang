import { SearchClient, Config } from "coze-coding-dev-sdk";

async function searchLegalBasis() {
  const config = new Config();
  const client = new SearchClient(config);

  console.log("=".repeat(80));
  console.log("搜索1: 市场主体登记管理条例 经营范围 法律依据");
  console.log("=".repeat(80));

  const response1 = await client.webSearch(
    "市场主体登记管理条例 经营范围 第十四条 法律条文",
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
  console.log("搜索2: 企业经营范围登记管理规定 全文");
  console.log("=".repeat(80));

  const response2 = await client.webSearch(
    "企业经营范围登记管理规定 全文 总局令第76号 条款",
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
  console.log("搜索3: 证照分离 经营范围规范化 政策依据");
  console.log("=".repeat(80));

  const response3 = await client.webSearch(
    "证照分离 经营范围规范化登记 国发 政策文件",
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
  console.log("搜索4: 优化营商环境条例 经营范围");
  console.log("=".repeat(80));

  const response4 = await client.webSearch(
    "优化营商环境条例 经营范围 规范化登记 国务院",
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
