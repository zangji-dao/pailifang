/**
 * 获取工会会计制度和农村集体经济组织会计制度完整科目表
 */

import { FetchClient, Config, SearchClient } from "coze-coding-dev-sdk";

async function fetchUnionAndRural() {
  const config = new Config();
  const fetchClient = new FetchClient(config);
  const searchClient = new SearchClient(config);

  // 1. 工会会计制度
  console.log("=".repeat(80));
  console.log("【1】工会会计制度科目表");
  console.log("=".repeat(80));

  const unionUrls = [
    "https://gonghui.csuft.edu.cn/zcwj/cjjs/201007/t20100705_26233.html",
    "https://www.hzgh.org/newsview11265.htm",
  ];

  for (const url of unionUrls) {
    console.log(`\n尝试获取: ${url}`);
    try {
      const result = await fetchClient.fetch(url);
      const textContent = result.content
        .filter((i: any) => i.type === 'text')
        .map((i: any) => i.text)
        .join('\n');
      
      if (textContent.includes("科目") || textContent.includes("101") || textContent.includes("现金")) {
        console.log("\n内容:\n");
        console.log(textContent.substring(0, 8000));
        console.log("\n" + "-".repeat(40));
      }
    } catch (e) {
      console.log("获取失败:", e);
    }
  }

  // 2. 农村集体经济组织会计制度
  console.log("\n" + "=".repeat(80));
  console.log("【2】农村集体经济组织会计制度科目表");
  console.log("=".repeat(80));

  const ruralUrls = [
    "http://www.jzx7788.com/html/zhishiku110/231378.html",
    "https://m.mayiwenku.com/p-55014782.html",
  ];

  for (const url of ruralUrls) {
    console.log(`\n尝试获取: ${url}`);
    try {
      const result = await fetchClient.fetch(url);
      const textContent = result.content
        .filter((i: any) => i.type === 'text')
        .map((i: any) => i.text)
        .join('\n');
      
      console.log("\n内容:\n");
      console.log(textContent.substring(0, 8000));
      console.log("\n" + "-".repeat(40));
    } catch (e) {
      console.log("获取失败:", e);
    }
  }
}

fetchUnionAndRural().catch(console.error);
