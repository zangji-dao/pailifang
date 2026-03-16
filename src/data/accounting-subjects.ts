/**
 * 会计准则科目数据
 * 数据来源：财政部官方文件
 * 
 * 企业会计准则 - 中国会计网2026版 (含2026年最新更新)
 *   - 2026年更新：新增"补偿性资产"科目（财会〔2025〕32号）
 *   - 2019年更新：新增"使用权资产""租赁负债"科目（财会〔2018〕35号）
 *   - 2018年更新：新增"合同资产""合同负债"科目（财会〔2017〕22号）
 * 小企业会计准则 - 财政部财会[2011]17号 (66个科目)
 *   - 发布日期：2011年10月18日
 *   - 施行日期：2013年1月1日
 *   - 当前状态：现行有效（截至2025年未修订）
 *   - 说明：小企业会计准则中的"营业税金及附加"科目名称未变更，
 *          与企业会计准则的"税金及附加"不同
 * 民间非营利组织会计制度 - 财政部财会[2023]7号 (48个科目)
 * 农民专业合作社财务会计制度 - 财政部财会〔2021〕37号 (37个科目)
 * 工会会计制度 - 最新版
 * 农村集体经济组织会计制度 - 财政部2023年修订 (34个科目)
 */

export type AccountingStandard = 
  | "small_enterprise" 
  | "enterprise" 
  | "non_profit_2026"
  | "farmer_coop_2023"
  | "union"
  | "rural_collective";

export interface Subject {
  code: string;
  name: string;
  mnemonic?: string;
  direction: "借" | "贷";
  auxiliary?: string;
  status: "启用" | "停用";
  scope?: string; // 适用范围
  remark?: string; // 科目来源说明（如新增科目的政策依据）
}

export interface SubjectCategory {
  name: string;
  subjects: Subject[];
}

// 会计准则配置
export const ACCOUNTING_STANDARDS: Record<AccountingStandard, { name: string; description: string }> = {
  small_enterprise: { name: "小企业会计准则", description: "适用于小型企业" },
  enterprise: { name: "企业会计准则", description: "适用于大中型企业" },
  non_profit_2026: { name: "民间非营利组织会计制度", description: "2026版" },
  farmer_coop_2023: { name: "农民专业合作社财务制度", description: "2023版" },
  union: { name: "工会会计制度", description: "适用于工会组织" },
  rural_collective: { name: "农村集体经济组织核算制度", description: "适用于农村集体经济组织" },
};

// ============================================================
// 一、企业会计准则科目表（2026版）- 含历年新增科目
// 数据来源：中国会计网 http://www.canet.com.cn/kemu/596034.html
// 历年更新：
//   - 2026年：新增"补偿性资产"（财会〔2025〕32号）
//   - 2019年：新增"使用权资产""租赁负债"（财会〔2018〕35号）
//   - 2018年：新增"合同资产""合同负债"（财会〔2017〕22号）
// ============================================================
export const ENTERPRISE_SUBJECTS: SubjectCategory[] = [
  {
    name: "资产类",
    subjects: [
      { code: "1001", name: "库存现金", direction: "借", status: "启用" },
      { code: "1002", name: "银行存款", direction: "借", status: "启用" },
      { code: "1003", name: "存放中央银行款项", direction: "借", status: "启用", scope: "银行专用" },
      { code: "1011", name: "存放同业", direction: "借", status: "启用", scope: "银行专用" },
      { code: "1015", name: "其他货币资金", direction: "借", status: "启用" },
      { code: "1021", name: "结算备付金", direction: "借", status: "启用", scope: "证券专用" },
      { code: "1031", name: "存出保证金", direction: "借", status: "启用", scope: "金融共用" },
      { code: "1051", name: "拆出资金", direction: "借", status: "启用", scope: "金融共用" },
      { code: "1101", name: "交易性金融资产", direction: "借", status: "启用" },
      { code: "1111", name: "买入返售金融资产", direction: "借", status: "启用", scope: "金融共用" },
      { code: "1121", name: "应收票据", direction: "借", status: "启用" },
      { code: "1122", name: "应收账款", direction: "借", status: "启用" },
      { code: "1123", name: "预付账款", direction: "借", status: "启用" },
      { code: "1131", name: "应收股利", direction: "借", status: "启用" },
      { code: "1132", name: "应收利息", direction: "借", status: "启用" },
      { code: "1211", name: "应收保护储金", direction: "借", status: "启用", scope: "保险专用" },
      { code: "1221", name: "应收代位追偿款", direction: "借", status: "启用", scope: "保险专用" },
      { code: "1222", name: "应收分保账款", direction: "借", status: "启用", scope: "保险专用" },
      { code: "1223", name: "应收分保未到期责任准备金", direction: "借", status: "启用", scope: "保险专用" },
      { code: "1224", name: "应收分保保险责任准备金", direction: "借", status: "启用", scope: "保险专用" },
      { code: "1231", name: "其他应收款", direction: "借", status: "启用" },
      { code: "1241", name: "坏账准备", direction: "贷", status: "启用" },
      { code: "1251", name: "贴现资产", direction: "借", status: "启用", scope: "银行专用" },
      { code: "1301", name: "贷款", direction: "借", status: "启用", scope: "银行和保险共用" },
      { code: "1302", name: "贷款损失准备", direction: "贷", status: "启用", scope: "银行和保险共用" },
      { code: "1311", name: "代理兑付证券", direction: "借", status: "启用", scope: "银行和保险共用" },
      { code: "1321", name: "代理业务资产", direction: "借", status: "启用" },
      { code: "1401", name: "材料采购", direction: "借", status: "启用" },
      { code: "1402", name: "在途物资", direction: "借", status: "启用" },
      { code: "1403", name: "原材料", direction: "借", status: "启用" },
      { code: "1404", name: "材料成本差异", direction: "借", status: "启用" },
      { code: "1406", name: "库存商品", direction: "借", status: "启用" },
      { code: "1407", name: "发出商品", direction: "借", status: "启用" },
      { code: "1410", name: "商品进销差价", direction: "贷", status: "启用" },
      { code: "1411", name: "委托加工物资", direction: "借", status: "启用" },
      { code: "1412", name: "包装物及低值易耗品", direction: "借", status: "启用" },
      { code: "1421", name: "消耗性生物资产", direction: "借", status: "启用", scope: "农业专用" },
      { code: "1431", name: "周转材料", direction: "借", status: "启用", scope: "建造承包商专用" },
      { code: "1441", name: "贵金属", direction: "借", status: "启用", scope: "银行专用" },
      { code: "1442", name: "抵债资产", direction: "借", status: "启用", scope: "金融共用" },
      { code: "1451", name: "损余物资", direction: "借", status: "启用", scope: "保险专用" },
      { code: "1461", name: "存货跌价准备", direction: "贷", status: "启用" },
      { code: "1471", name: "合同资产", direction: "借", status: "启用" },
      { code: "1472", name: "合同资产减值准备", direction: "贷", status: "启用" },
      { code: "1473", name: "合同履约成本", direction: "借", status: "启用" },
      { code: "1474", name: "合同履约成本减值准备", direction: "贷", status: "启用" },
      { code: "1475", name: "合同取得成本", direction: "借", status: "启用" },
      { code: "1501", name: "待摊费用", direction: "借", status: "启用" },
      { code: "1511", name: "独立账户资产", direction: "借", status: "启用", scope: "保险专用" },
      { code: "1521", name: "持有至到期投资", direction: "借", status: "启用" },
      { code: "1522", name: "持有至到期投资减值准备", direction: "贷", status: "启用" },
      { code: "1523", name: "可供出售金融资产", direction: "借", status: "启用" },
      { code: "1524", name: "长期股权投资", direction: "借", status: "启用" },
      { code: "1525", name: "长期股权投资减值准备", direction: "贷", status: "启用" },
      { code: "1526", name: "投资性房地产", direction: "借", status: "启用" },
      { code: "1531", name: "长期应收款", direction: "借", status: "启用" },
      { code: "1541", name: "未实现融资收益", direction: "贷", status: "启用" },
      { code: "1551", name: "存出资本保证金", direction: "借", status: "启用", scope: "保险专用" },
      { code: "1601", name: "固定资产", direction: "借", status: "启用" },
      { code: "1602", name: "累计折旧", direction: "贷", status: "启用" },
      { code: "1603", name: "固定资产减值准备", direction: "贷", status: "启用" },
      { code: "1604", name: "在建工程", direction: "借", status: "启用" },
      { code: "1605", name: "工程物资", direction: "借", status: "启用" },
      { code: "1606", name: "固定资产清理", direction: "借", status: "启用" },
      { code: "1611", name: "融资租赁资产", direction: "借", status: "启用", scope: "租赁专用" },
      { code: "1612", name: "未担保余值", direction: "借", status: "启用", scope: "租赁专用" },
      { code: "1621", name: "生产性生物资产", direction: "借", status: "启用", scope: "农业专用" },
      { code: "1622", name: "生产性生物资产累计折旧", direction: "贷", status: "启用", scope: "农业专用" },
      { code: "1623", name: "公益性生物资产", direction: "借", status: "启用", scope: "农业专用" },
      { code: "1631", name: "油气资产", direction: "借", status: "启用", scope: "石油天然气开采专用" },
      { code: "1632", name: "累计折耗", direction: "贷", status: "启用", scope: "石油天然气开采专用" },
      // 使用权资产科目（租赁准则2018修订，2019年实施）
      { code: "1641", name: "使用权资产", direction: "借", status: "启用", remark: "财会〔2018〕35号" },
      { code: "1642", name: "使用权资产累计折旧", direction: "贷", status: "启用", remark: "财会〔2018〕35号" },
      { code: "1643", name: "使用权资产减值准备", direction: "贷", status: "启用", remark: "财会〔2018〕35号" },
      // 补偿性资产科目（解释第19号，2026年新增）
      { code: "1651", name: "补偿性资产", direction: "借", status: "启用", remark: "财会〔2025〕32号" },
      { code: "1701", name: "无形资产", direction: "借", status: "启用" },
      { code: "1702", name: "累计摊销", direction: "贷", status: "启用" },
      { code: "1703", name: "无形资产减值准备", direction: "贷", status: "启用" },
      { code: "1711", name: "商誉", direction: "借", status: "启用" },
      { code: "1801", name: "长期待摊费用", direction: "借", status: "启用" },
      { code: "1811", name: "递延所得税资产", direction: "借", status: "启用" },
      { code: "1901", name: "待处理财产损溢", direction: "借", status: "启用" },
    ],
  },
  {
    name: "负债类",
    subjects: [
      { code: "2001", name: "短期借款", direction: "贷", status: "启用" },
      { code: "2002", name: "存入保证金", direction: "贷", status: "启用", scope: "金融共用" },
      { code: "2003", name: "拆入资金", direction: "贷", status: "启用", scope: "金融共用" },
      { code: "2004", name: "向中央银行借款", direction: "贷", status: "启用", scope: "银行专用" },
      { code: "2011", name: "同业存放", direction: "贷", status: "启用", scope: "银行专用" },
      { code: "2012", name: "吸收存款", direction: "贷", status: "启用", scope: "银行专用" },
      { code: "2021", name: "贴现负债", direction: "贷", status: "启用", scope: "银行专用" },
      { code: "2101", name: "交易性金融负债", direction: "贷", status: "启用" },
      { code: "2111", name: "卖出回购金融资产款", direction: "贷", status: "启用", scope: "金融共用" },
      { code: "2201", name: "应付票据", direction: "贷", status: "启用" },
      { code: "2202", name: "应付账款", direction: "贷", status: "启用" },
      { code: "2203", name: "预收账款", direction: "贷", status: "启用" },
      { code: "2205", name: "合同负债", direction: "贷", status: "启用" },
      { code: "2211", name: "应付职工薪酬", direction: "贷", status: "启用" },
      { code: "2221", name: "应交税费", direction: "贷", status: "启用" },
      { code: "2231", name: "应付股利", direction: "贷", status: "启用" },
      { code: "2232", name: "应付利息", direction: "贷", status: "启用" },
      { code: "2241", name: "其他应付款", direction: "贷", status: "启用" },
      { code: "2251", name: "应付保户红利", direction: "贷", status: "启用", scope: "保险专用" },
      { code: "2261", name: "应付分保账款", direction: "贷", status: "启用", scope: "保险专用" },
      { code: "2311", name: "代理买卖证券款", direction: "贷", status: "启用", scope: "证券专用" },
      { code: "2312", name: "代理承销证券款", direction: "贷", status: "启用", scope: "证券和银行共用" },
      { code: "2313", name: "代理兑付证券款", direction: "贷", status: "启用", scope: "证券和银行共用" },
      { code: "2314", name: "代理业务负债", direction: "贷", status: "启用" },
      { code: "2401", name: "预提费用", direction: "贷", status: "启用" },
      { code: "2411", name: "预计负债", direction: "贷", status: "启用" },
      { code: "2501", name: "递延收益", direction: "贷", status: "启用" },
      { code: "2601", name: "长期借款", direction: "贷", status: "启用" },
      { code: "2602", name: "应付债券", direction: "贷", status: "启用" },
      { code: "2701", name: "未到期责任准备金", direction: "贷", status: "启用", scope: "保险专用" },
      { code: "2702", name: "保险责任准备金", direction: "贷", status: "启用", scope: "保险专用" },
      { code: "2711", name: "保户储金", direction: "贷", status: "启用", scope: "保险专用" },
      { code: "2721", name: "独立账户负债", direction: "贷", status: "启用", scope: "保险专用" },
      { code: "2801", name: "长期应付款", direction: "贷", status: "启用" },
      { code: "2802", name: "未确认融资费用", direction: "借", status: "启用" },
      // 租赁负债科目（租赁准则2018修订，2019年实施）
      { code: "2803", name: "租赁负债", direction: "贷", status: "启用", remark: "财会〔2018〕35号" },
      { code: "2811", name: "专项应付款", direction: "贷", status: "启用" },
      { code: "2901", name: "递延所得税负债", direction: "贷", status: "启用" },
    ],
  },
  {
    name: "共同类",
    subjects: [
      { code: "3001", name: "清算资金往来", direction: "借", status: "启用", scope: "银行专用" },
      { code: "3002", name: "外汇买卖", direction: "借", status: "启用", scope: "金融共用" },
      { code: "3101", name: "衍生工具", direction: "借", status: "启用" },
      { code: "3201", name: "套期工具", direction: "借", status: "启用" },
      { code: "3202", name: "被套期项目", direction: "借", status: "启用" },
    ],
  },
  {
    name: "所有者权益类",
    subjects: [
      { code: "4001", name: "实收资本", direction: "贷", status: "启用" },
      { code: "4002", name: "资本公积", direction: "贷", status: "启用" },
      { code: "4101", name: "盈余公积", direction: "贷", status: "启用" },
      { code: "4102", name: "一般风险准备", direction: "贷", status: "启用", scope: "金融共用" },
      { code: "4103", name: "本年利润", direction: "贷", status: "启用" },
      { code: "4104", name: "利润分配", direction: "贷", status: "启用" },
      { code: "4201", name: "库存股", direction: "借", status: "启用" },
    ],
  },
  {
    name: "成本类",
    subjects: [
      { code: "5001", name: "生产成本", direction: "借", status: "启用" },
      { code: "5101", name: "制造费用", direction: "借", status: "启用" },
      { code: "5201", name: "劳务成本", direction: "借", status: "启用" },
      { code: "5301", name: "研发支出", direction: "借", status: "启用" },
      { code: "5401", name: "工程施工", direction: "借", status: "启用", scope: "建造承包商专用" },
      { code: "5402", name: "工程结算", direction: "贷", status: "启用", scope: "建造承包商专用" },
      { code: "5403", name: "机械作业", direction: "借", status: "启用", scope: "建造承包商专用" },
    ],
  },
  {
    name: "损益类",
    subjects: [
      { code: "6001", name: "主营业务收入", direction: "贷", status: "启用" },
      { code: "6011", name: "利息收入", direction: "贷", status: "启用", scope: "金融共用" },
      { code: "6021", name: "手续费收入", direction: "贷", status: "启用", scope: "金融共用" },
      { code: "6031", name: "保费收入", direction: "贷", status: "启用", scope: "保险专用" },
      { code: "6032", name: "分保费收入", direction: "贷", status: "启用", scope: "保险专用" },
      { code: "6041", name: "租赁收入", direction: "贷", status: "启用", scope: "租赁专用" },
      { code: "6051", name: "其他业务收入", direction: "贷", status: "启用" },
      { code: "6061", name: "汇兑损益", direction: "贷", status: "启用", scope: "金融专用" },
      { code: "6101", name: "公允价值变动损益", direction: "贷", status: "启用" },
      { code: "6111", name: "投资收益", direction: "贷", status: "启用" },
      { code: "6201", name: "摊回保险责任准备金", direction: "贷", status: "启用", scope: "保险专用" },
      { code: "6202", name: "摊回赔付支出", direction: "贷", status: "启用", scope: "保险专用" },
      { code: "6203", name: "摊回分保费用", direction: "贷", status: "启用", scope: "保险专用" },
      { code: "6301", name: "营业外收入", direction: "贷", status: "启用" },
      { code: "6401", name: "主营业务成本", direction: "借", status: "启用" },
      { code: "6402", name: "其他业务成本", direction: "借", status: "启用" },
      { code: "6405", name: "营业税金及附加", direction: "借", status: "启用" },
      { code: "6411", name: "利息支出", direction: "借", status: "启用", scope: "金融共用" },
      { code: "6421", name: "手续费支出", direction: "借", status: "启用", scope: "金融共用" },
      { code: "6501", name: "提取未到期责任准备金", direction: "借", status: "启用", scope: "保险专用" },
      { code: "6502", name: "提取保险责任准备金", direction: "借", status: "启用", scope: "保险专用" },
      { code: "6511", name: "赔付支出", direction: "借", status: "启用", scope: "保险专用" },
      { code: "6521", name: "保户红利支出", direction: "借", status: "启用", scope: "保险专用" },
      { code: "6531", name: "退保金", direction: "借", status: "启用", scope: "保险专用" },
      { code: "6541", name: "分出保费", direction: "借", status: "启用", scope: "保险专用" },
      { code: "6542", name: "分保费用", direction: "借", status: "启用", scope: "保险专用" },
      { code: "6601", name: "销售费用", direction: "借", status: "启用" },
      { code: "6602", name: "管理费用", direction: "借", status: "启用" },
      { code: "6603", name: "财务费用", direction: "借", status: "启用" },
      { code: "6604", name: "勘探费用", direction: "借", status: "启用" },
      { code: "6701", name: "资产减值损失", direction: "借", status: "启用" },
      { code: "6711", name: "营业外支出", direction: "借", status: "启用" },
      { code: "6801", name: "所得税费用", direction: "借", status: "启用" },
      { code: "6901", name: "以前年度损益调整", direction: "借", status: "启用" },
    ],
  },
];

// ============================================================
// 二、小企业会计准则科目表 - 66个科目
// 数据来源：财政部财会[2011]17号
// ============================================================
export const SMALL_ENTERPRISE_SUBJECTS: SubjectCategory[] = [
  {
    name: "资产类",
    subjects: [
      { code: "1001", name: "库存现金", direction: "借", status: "启用" },
      { code: "1002", name: "银行存款", direction: "借", status: "启用" },
      { code: "1012", name: "其他货币资金", direction: "借", status: "启用" },
      { code: "1101", name: "短期投资", direction: "借", status: "启用" },
      { code: "1121", name: "应收票据", direction: "借", status: "启用" },
      { code: "1122", name: "应收账款", direction: "借", status: "启用" },
      { code: "1123", name: "预付账款", direction: "借", status: "启用" },
      { code: "1131", name: "应收股利", direction: "借", status: "启用" },
      { code: "1132", name: "应收利息", direction: "借", status: "启用" },
      { code: "1221", name: "其他应收款", direction: "借", status: "启用" },
      { code: "1401", name: "材料采购", direction: "借", status: "启用" },
      { code: "1402", name: "在途物资", direction: "借", status: "启用" },
      { code: "1403", name: "原材料", direction: "借", status: "启用" },
      { code: "1404", name: "材料成本差异", direction: "借", status: "启用" },
      { code: "1405", name: "库存商品", direction: "借", status: "启用" },
      { code: "1407", name: "商品进销差价", direction: "贷", status: "启用" },
      { code: "1408", name: "委托加工物资", direction: "借", status: "启用" },
      { code: "1411", name: "周转材料", direction: "借", status: "启用" },
      { code: "1421", name: "消耗性生物资产", direction: "借", status: "启用" },
      { code: "1501", name: "长期债券投资", direction: "借", status: "启用" },
      { code: "1511", name: "长期股权投资", direction: "借", status: "启用" },
      { code: "1601", name: "固定资产", direction: "借", status: "启用" },
      { code: "1602", name: "累计折旧", direction: "贷", status: "启用" },
      { code: "1604", name: "在建工程", direction: "借", status: "启用" },
      { code: "1605", name: "工程物资", direction: "借", status: "启用" },
      { code: "1606", name: "固定资产清理", direction: "借", status: "启用" },
      { code: "1621", name: "生产性生物资产", direction: "借", status: "启用" },
      { code: "1622", name: "生产性生物资产累计折旧", direction: "贷", status: "启用" },
      { code: "1701", name: "无形资产", direction: "借", status: "启用" },
      { code: "1702", name: "累计摊销", direction: "贷", status: "启用" },
      { code: "1801", name: "长期待摊费用", direction: "借", status: "启用" },
      { code: "1901", name: "待处理财产损溢", direction: "借", status: "启用" },
    ],
  },
  {
    name: "负债类",
    subjects: [
      { code: "2001", name: "短期借款", direction: "贷", status: "启用" },
      { code: "2201", name: "应付票据", direction: "贷", status: "启用" },
      { code: "2202", name: "应付账款", direction: "贷", status: "启用" },
      { code: "2203", name: "预收账款", direction: "贷", status: "启用" },
      { code: "2211", name: "应付职工薪酬", direction: "贷", status: "启用" },
      { code: "2221", name: "应交税费", direction: "贷", status: "启用" },
      { code: "2231", name: "应付利息", direction: "贷", status: "启用" },
      { code: "2232", name: "应付利润", direction: "贷", status: "启用" },
      { code: "2241", name: "其他应付款", direction: "贷", status: "启用" },
      { code: "2401", name: "递延收益", direction: "贷", status: "启用" },
      { code: "2501", name: "长期借款", direction: "贷", status: "启用" },
      { code: "2701", name: "长期应付款", direction: "贷", status: "启用" },
    ],
  },
  {
    name: "所有者权益类",
    subjects: [
      { code: "3001", name: "实收资本", direction: "贷", status: "启用" },
      { code: "3002", name: "资本公积", direction: "贷", status: "启用" },
      { code: "3101", name: "盈余公积", direction: "贷", status: "启用" },
      { code: "3103", name: "本年利润", direction: "贷", status: "启用" },
      { code: "3104", name: "利润分配", direction: "贷", status: "启用" },
    ],
  },
  {
    name: "成本类",
    subjects: [
      { code: "4001", name: "生产成本", direction: "借", status: "启用" },
      { code: "4101", name: "制造费用", direction: "借", status: "启用" },
      { code: "4301", name: "研发支出", direction: "借", status: "启用" },
      { code: "4401", name: "工程施工", direction: "借", status: "启用" },
      { code: "4403", name: "机械作业", direction: "借", status: "启用" },
    ],
  },
  {
    name: "损益类",
    subjects: [
      { code: "5001", name: "主营业务收入", direction: "贷", status: "启用" },
      { code: "5051", name: "其他业务收入", direction: "贷", status: "启用" },
      { code: "5111", name: "投资收益", direction: "贷", status: "启用" },
      { code: "5301", name: "营业外收入", direction: "贷", status: "启用" },
      { code: "5401", name: "主营业务成本", direction: "借", status: "启用" },
      { code: "5402", name: "其他业务成本", direction: "借", status: "启用" },
      { code: "5403", name: "营业税金及附加", direction: "借", status: "启用" },
      { code: "5601", name: "销售费用", direction: "借", status: "启用" },
      { code: "5602", name: "管理费用", direction: "借", status: "启用" },
      { code: "5603", name: "财务费用", direction: "借", status: "启用" },
      { code: "5711", name: "营业外支出", direction: "借", status: "启用" },
      { code: "5801", name: "所得税费用", direction: "借", status: "启用" },
    ],
  },
];

// ============================================================
// 三、民间非营利组织会计制度科目表 - 48个科目
// 数据来源：财政部财会[2023]7号
// ============================================================
export const NON_PROFIT_SUBJECTS: SubjectCategory[] = [
  {
    name: "资产类",
    subjects: [
      { code: "1001", name: "现金", direction: "借", status: "启用" },
      { code: "1002", name: "银行存款", direction: "借", status: "启用" },
      { code: "1009", name: "其他货币资金", direction: "借", status: "启用" },
      { code: "1101", name: "短期投资", direction: "借", status: "启用" },
      { code: "1102", name: "短期投资跌价准备", direction: "贷", status: "启用" },
      { code: "1111", name: "应收票据", direction: "借", status: "启用" },
      { code: "1121", name: "应收账款", direction: "借", status: "启用" },
      { code: "1122", name: "其他应收款", direction: "借", status: "启用" },
      { code: "1131", name: "坏账准备", direction: "贷", status: "启用" },
      { code: "1141", name: "预付账款", direction: "借", status: "启用" },
      { code: "1201", name: "存货", direction: "借", status: "启用" },
      { code: "1202", name: "存货跌价准备", direction: "贷", status: "启用" },
      { code: "1301", name: "待摊费用", direction: "借", status: "启用" },
      { code: "1401", name: "长期股权投资", direction: "借", status: "启用" },
      { code: "1402", name: "长期债权投资", direction: "借", status: "启用" },
      { code: "1421", name: "长期投资减值准备", direction: "贷", status: "启用" },
      { code: "1501", name: "固定资产", direction: "借", status: "启用" },
      { code: "1502", name: "累计折旧", direction: "贷", status: "启用" },
      { code: "1505", name: "在建工程", direction: "借", status: "启用" },
      { code: "1506", name: "文物文化资产", direction: "借", status: "启用" },
      { code: "1509", name: "固定资产清理", direction: "借", status: "启用" },
      { code: "1601", name: "无形资产", direction: "借", status: "启用" },
      { code: "1701", name: "受托代理资产", direction: "借", status: "启用" },
    ],
  },
  {
    name: "负债类",
    subjects: [
      { code: "2101", name: "短期借款", direction: "贷", status: "启用" },
      { code: "2201", name: "应付票据", direction: "贷", status: "启用" },
      { code: "2202", name: "应付账款", direction: "贷", status: "启用" },
      { code: "2203", name: "预收账款", direction: "贷", status: "启用" },
      { code: "2204", name: "应付工资", direction: "贷", status: "启用" },
      { code: "2206", name: "应交税金", direction: "贷", status: "启用" },
      { code: "2209", name: "其他应付款", direction: "贷", status: "启用" },
      { code: "2301", name: "预提费用", direction: "贷", status: "启用" },
      { code: "2401", name: "预计负债", direction: "贷", status: "启用" },
      { code: "2501", name: "长期借款", direction: "贷", status: "启用" },
      { code: "2502", name: "长期应付款", direction: "贷", status: "启用" },
      { code: "2601", name: "受托代理负债", direction: "贷", status: "启用" },
    ],
  },
  {
    name: "净资产类",
    subjects: [
      { code: "3101", name: "非限定性净资产", direction: "贷", status: "启用" },
      { code: "3102", name: "限定性净资产", direction: "贷", status: "启用" },
    ],
  },
  {
    name: "收入费用类",
    subjects: [
      { code: "4101", name: "捐赠收入", direction: "贷", status: "启用" },
      { code: "4201", name: "会费收入", direction: "贷", status: "启用" },
      { code: "4301", name: "提供服务收入", direction: "贷", status: "启用" },
      { code: "4401", name: "政府补助收入", direction: "贷", status: "启用" },
      { code: "4501", name: "商品销售收入", direction: "贷", status: "启用" },
      { code: "4601", name: "投资收益", direction: "贷", status: "启用" },
      { code: "4901", name: "其他收入", direction: "贷", status: "启用" },
      { code: "5101", name: "业务活动成本", direction: "借", status: "启用" },
      { code: "5201", name: "管理费用", direction: "借", status: "启用" },
      { code: "5301", name: "筹资费用", direction: "借", status: "启用" },
      { code: "5401", name: "其他费用", direction: "借", status: "启用" },
    ],
  },
];

// ============================================================
// 四、农民专业合作社财务会计制度科目表 - 37个科目
// 数据来源：财政部财会〔2021〕37号
// ============================================================
export const FARMER_COOP_SUBJECTS: SubjectCategory[] = [
  {
    name: "资产类",
    subjects: [
      { code: "101", name: "库存现金", direction: "借", status: "启用" },
      { code: "102", name: "银行存款", direction: "借", status: "启用" },
      { code: "113", name: "应收款", direction: "借", status: "启用" },
      { code: "114", name: "成员往来", direction: "借", status: "启用" },
      { code: "121", name: "产品物资", direction: "借", status: "启用" },
      { code: "124", name: "委托加工物资", direction: "借", status: "启用" },
      { code: "125", name: "委托代销商品", direction: "借", status: "启用" },
      { code: "127", name: "受托代购商品", direction: "借", status: "启用" },
      { code: "128", name: "受托代销商品", direction: "借", status: "启用" },
      { code: "131", name: "对外投资", direction: "借", status: "启用" },
      { code: "141", name: "牲畜（禽）资产", direction: "借", status: "启用" },
      { code: "142", name: "林木资产", direction: "借", status: "启用" },
      { code: "151", name: "固定资产", direction: "借", status: "启用" },
      { code: "152", name: "累计折旧", direction: "贷", status: "启用" },
      { code: "153", name: "在建工程", direction: "借", status: "启用" },
      { code: "154", name: "固定资产清理", direction: "借", status: "启用" },
      { code: "161", name: "无形资产", direction: "借", status: "启用" },
    ],
  },
  {
    name: "负债类",
    subjects: [
      { code: "201", name: "短期借款", direction: "贷", status: "启用" },
      { code: "211", name: "应付款", direction: "贷", status: "启用" },
      { code: "212", name: "应付工资", direction: "贷", status: "启用" },
      { code: "221", name: "应付盈余返还", direction: "贷", status: "启用" },
      { code: "222", name: "应付剩余盈余", direction: "贷", status: "启用" },
      { code: "231", name: "长期借款", direction: "贷", status: "启用" },
      { code: "235", name: "专项应付款", direction: "贷", status: "启用" },
    ],
  },
  {
    name: "所有者权益类",
    subjects: [
      { code: "301", name: "股金", direction: "贷", status: "启用" },
      { code: "311", name: "专项基金", direction: "贷", status: "启用" },
      { code: "321", name: "资本公积", direction: "贷", status: "启用" },
      { code: "322", name: "盈余公积", direction: "贷", status: "启用" },
      { code: "331", name: "本年盈余", direction: "贷", status: "启用" },
      { code: "332", name: "盈余分配", direction: "贷", status: "启用" },
    ],
  },
  {
    name: "成本类",
    subjects: [
      { code: "401", name: "生产成本", direction: "借", status: "启用" },
    ],
  },
  {
    name: "损益类",
    subjects: [
      { code: "501", name: "经营收入", direction: "贷", status: "启用" },
      { code: "502", name: "其他收入", direction: "贷", status: "启用" },
      { code: "511", name: "投资收益", direction: "贷", status: "启用" },
      { code: "521", name: "经营支出", direction: "借", status: "启用" },
      { code: "522", name: "管理费用", direction: "借", status: "启用" },
      { code: "529", name: "其他支出", direction: "借", status: "启用" },
    ],
  },
];

// ============================================================
// 五、工会会计制度科目表
// 数据来源：最新版工会会计制度
// ============================================================
export const UNION_SUBJECTS: SubjectCategory[] = [
  {
    name: "资产类",
    subjects: [
      { code: "101", name: "库存现金", direction: "借", status: "启用" },
      { code: "102", name: "银行存款", direction: "借", status: "启用" },
      { code: "103", name: "经费集中户存款", direction: "借", status: "启用" },
      { code: "104", name: "有价证券", direction: "借", status: "启用" },
      { code: "105", name: "暂付款", direction: "借", status: "启用" },
      { code: "106", name: "借出款", direction: "借", status: "启用" },
      { code: "107", name: "库存材料", direction: "借", status: "启用" },
      { code: "108", name: "投资", direction: "借", status: "启用" },
      { code: "109", name: "专项资金占用", direction: "借", status: "启用" },
      { code: "110", name: "应收上解经费", direction: "借", status: "启用" },
      { code: "111", name: "应收上级补助", direction: "借", status: "启用" },
      { code: "112", name: "拨出经费", direction: "借", status: "启用" },
      { code: "114", name: "固定资产", direction: "借", status: "启用" },
    ],
  },
  {
    name: "负债类",
    subjects: [
      { code: "201", name: "应付上解经费", direction: "贷", status: "启用" },
      { code: "202", name: "应付补助下级经费", direction: "贷", status: "启用" },
      { code: "203", name: "暂存款", direction: "贷", status: "启用" },
      { code: "204", name: "借入款", direction: "贷", status: "启用" },
      { code: "205", name: "代管经费", direction: "贷", status: "启用" },
      { code: "206", name: "拨入经费", direction: "贷", status: "启用" },
      { code: "207", name: "拨入专项资金", direction: "贷", status: "启用" },
    ],
  },
  {
    name: "净资产类",
    subjects: [
      { code: "301", name: "固定基金", direction: "贷", status: "启用" },
      { code: "302", name: "专用基金", direction: "贷", status: "启用" },
      { code: "303", name: "投资基金", direction: "贷", status: "启用" },
      { code: "304", name: "经费结余", direction: "贷", status: "启用" },
      { code: "305", name: "预算周转金", direction: "贷", status: "启用" },
      { code: "306", name: "后备基金", direction: "贷", status: "启用" },
    ],
  },
  {
    name: "收入类",
    subjects: [
      { code: "401", name: "会费收入", direction: "贷", status: "启用" },
      { code: "402", name: "拨交经费收入", direction: "贷", status: "启用" },
      { code: "403", name: "事业收入", direction: "贷", status: "启用" },
      { code: "404", name: "上级补助收入", direction: "贷", status: "启用" },
      { code: "405", name: "政府或行政补助收入", direction: "贷", status: "启用" },
      { code: "406", name: "投资收益", direction: "贷", status: "启用" },
      { code: "407", name: "其他收入", direction: "贷", status: "启用" },
    ],
  },
  {
    name: "支出类",
    subjects: [
      { code: "501", name: "会员活动费", direction: "借", status: "启用" },
      { code: "502", name: "职工活动费", direction: "借", status: "启用" },
      { code: "503", name: "事业支出", direction: "借", status: "启用" },
      { code: "504", name: "工会业务费", direction: "借", status: "启用" },
      { code: "505", name: "工会行政费", direction: "借", status: "启用" },
      { code: "506", name: "专项资金支出", direction: "借", status: "启用" },
      { code: "507", name: "补助下级支出", direction: "借", status: "启用" },
      { code: "508", name: "其他支出", direction: "借", status: "启用" },
      { code: "509", name: "上解经费支出", direction: "借", status: "启用" },
    ],
  },
];

// ============================================================
// 六、农村集体经济组织会计制度科目表 - 34个科目
// 数据来源：财政部2023年修订
// ============================================================
export const RURAL_COLLECTIVE_SUBJECTS: SubjectCategory[] = [
  {
    name: "资产类",
    subjects: [
      { code: "101", name: "现金", direction: "借", status: "启用" },
      { code: "102", name: "银行存款", direction: "借", status: "启用" },
      { code: "111", name: "短期投资", direction: "借", status: "启用" },
      { code: "112", name: "应收款", direction: "借", status: "启用" },
      { code: "113", name: "内部往来", direction: "借", status: "启用" },
      { code: "121", name: "库存物资", direction: "借", status: "启用" },
      { code: "131", name: "牲畜（禽）资产", direction: "借", status: "启用" },
      { code: "132", name: "林业资产", direction: "借", status: "启用" },
      { code: "141", name: "长期投资", direction: "借", status: "启用" },
      { code: "151", name: "固定资产", direction: "借", status: "启用" },
      { code: "152", name: "累计折旧", direction: "贷", status: "启用" },
      { code: "153", name: "固定资产清理", direction: "借", status: "启用" },
      { code: "154", name: "在建工程", direction: "借", status: "启用" },
    ],
  },
  {
    name: "负债类",
    subjects: [
      { code: "201", name: "短期借款", direction: "贷", status: "启用" },
      { code: "202", name: "应付款", direction: "贷", status: "启用" },
      { code: "211", name: "应付工资", direction: "贷", status: "启用" },
      { code: "212", name: "应付福利费", direction: "贷", status: "启用" },
      { code: "221", name: "长期借款及应付款", direction: "贷", status: "启用" },
      { code: "231", name: "一事一议资金", direction: "贷", status: "启用" },
      { code: "241", name: "专项应付款", direction: "贷", status: "启用" },
    ],
  },
  {
    name: "所有者权益类",
    subjects: [
      { code: "301", name: "资本", direction: "贷", status: "启用" },
      { code: "311", name: "公积公益金", direction: "贷", status: "启用" },
      { code: "321", name: "本年收益", direction: "贷", status: "启用" },
      { code: "322", name: "收益分配", direction: "贷", status: "启用" },
    ],
  },
  {
    name: "成本类",
    subjects: [
      { code: "401", name: "生产（劳务）成本", direction: "借", status: "启用" },
    ],
  },
  {
    name: "损益类",
    subjects: [
      { code: "501", name: "经营收入", direction: "贷", status: "启用" },
      { code: "502", name: "经营支出", direction: "借", status: "启用" },
      { code: "511", name: "发包及上交收入", direction: "贷", status: "启用" },
      { code: "521", name: "农业税附加返还收入", direction: "贷", status: "启用" },
      { code: "522", name: "补助收入", direction: "贷", status: "启用" },
      { code: "531", name: "其他收入", direction: "贷", status: "启用" },
      { code: "541", name: "管理费用", direction: "借", status: "启用" },
      { code: "551", name: "其他支出", direction: "借", status: "启用" },
      { code: "561", name: "投资收益", direction: "贷", status: "启用" },
    ],
  },
];

// 获取指定准则的科目数据
export function getSubjectsByStandard(standard: AccountingStandard): SubjectCategory[] {
  switch (standard) {
    case "enterprise":
      return ENTERPRISE_SUBJECTS;
    case "small_enterprise":
      return SMALL_ENTERPRISE_SUBJECTS;
    case "non_profit_2026":
      return NON_PROFIT_SUBJECTS;
    case "farmer_coop_2023":
      return FARMER_COOP_SUBJECTS;
    case "union":
      return UNION_SUBJECTS;
    case "rural_collective":
      return RURAL_COLLECTIVE_SUBJECTS;
    default:
      return [];
  }
}

// 获取指定准则指定分类的科目
export function getSubjectsByCategory(
  standard: AccountingStandard,
  categoryName: string
): Subject[] {
  const categories = getSubjectsByStandard(standard);
  const category = categories.find(c => c.name === categoryName);
  return category?.subjects || [];
}

// ============================================================
// 辅助核算智能推荐
// 根据科目编码自动判断适用的辅助核算类型
// ============================================================

export interface AuxiliaryType {
  id: string;
  name: string;
  code: string;
  description: string;
  isRecommended: boolean; // 是否推荐
  isApplicable: boolean;  // 是否适用
}

/**
 * 根据科目编码获取适用的辅助核算类型
 * 
 * 业务规则：
 * 1. 数量核算：适用于存货类科目（140x原材料、1406库存商品等）、固定资产类（160x）
 * 2. 客户核算：适用于应收类科目（112x应收账款、1122等）
 * 3. 供应商核算：适用于应付类科目（220x应付账款、2202等）
 * 4. 部门核算：适用于费用类科目（560x管理费用、500x生产成本等）
 * 5. 职员核算：适用于应付职工薪酬（2211）、其他应收款-备用金（1221）等
 * 6. 项目核算：适用于在建工程（1604）、研发支出（5301）等
 * 7. 外币核算：适用于银行存款-外币户（1002）、应收/应付外汇账款等
 * 
 * @param accountCode 科目编码
 * @returns 适用的辅助核算类型列表
 */
export function getApplicableAuxiliaryTypes(accountCode: string): AuxiliaryType[] {
  const code = accountCode.padEnd(4, '0').substring(0, 4); // 取前4位作为一级科目编码
  const allTypes: AuxiliaryType[] = [
    { id: 'quantity', name: '数量核算', code: 'quantity', description: '启用数量金额式核算', isRecommended: false, isApplicable: false },
    { id: 'customer', name: '客户核算', code: 'customer', description: '按客户进行明细核算', isRecommended: false, isApplicable: false },
    { id: 'supplier', name: '供应商核算', code: 'supplier', description: '按供应商进行明细核算', isRecommended: false, isApplicable: false },
    { id: 'department', name: '部门核算', code: 'department', description: '按部门进行明细核算', isRecommended: false, isApplicable: false },
    { id: 'employee', name: '职员核算', code: 'employee', description: '按职员进行明细核算', isRecommended: false, isApplicable: false },
    { id: 'project', name: '项目核算', code: 'project', description: '按项目进行明细核算', isRecommended: false, isApplicable: false },
    { id: 'inventory', name: '存货核算', code: 'inventory', description: '按存货档案进行明细核算', isRecommended: false, isApplicable: false },
    { id: 'fixed_asset', name: '固定资产核算', code: 'fixed_asset', description: '按固定资产卡片进行明细核算', isRecommended: false, isApplicable: false },
    { id: 'foreign_currency', name: '外币核算', code: 'foreign_currency', description: '启用外币金额核算', isRecommended: false, isApplicable: false },
  ];

  // 判断各辅助核算类型的适用性
  
  // 1. 数量核算：存货类、固定资产类
  const quantityCodes = ['1401', '1402', '1403', '1404', '1405', '1406', '1407', '1408', '1411', '1412', '1421', '1601', '1602'];
  const isQuantity = quantityCodes.some(c => code.startsWith(c.substring(0, 3)));
  if (isQuantity) {
    const idx = allTypes.findIndex(t => t.id === 'quantity');
    if (idx >= 0) {
      allTypes[idx].isApplicable = true;
      allTypes[idx].isRecommended = true;
    }
  }

  // 2. 存货核算：原材料、库存商品、周转材料等
  const inventoryCodes = ['1401', '1402', '1403', '1404', '1405', '1406', '1407', '1408'];
  const isInventory = inventoryCodes.some(c => code.startsWith(c.substring(0, 3)));
  if (isInventory) {
    const idx = allTypes.findIndex(t => t.id === 'inventory');
    if (idx >= 0) {
      allTypes[idx].isApplicable = true;
      allTypes[idx].isRecommended = true;
    }
  }

  // 3. 固定资产核算
  const fixedAssetCodes = ['1601', '1602', '1603', '1604', '1605', '1606'];
  const isFixedAsset = fixedAssetCodes.some(c => code.startsWith(c.substring(0, 4)));
  if (isFixedAsset) {
    const idx = allTypes.findIndex(t => t.id === 'fixed_asset');
    if (idx >= 0) {
      allTypes[idx].isApplicable = true;
      allTypes[idx].isRecommended = true;
    }
  }

  // 4. 客户核算：应收类
  const customerCodes = ['1121', '1122', '1123', '1124', '1125'];
  const isCustomer = customerCodes.some(c => code.startsWith(c.substring(0, 4))) || 
                     code.startsWith('112');
  if (isCustomer) {
    const idx = allTypes.findIndex(t => t.id === 'customer');
    if (idx >= 0) {
      allTypes[idx].isApplicable = true;
      allTypes[idx].isRecommended = true;
    }
  }

  // 5. 供应商核算：应付类
  const supplierCodes = ['2201', '2202', '2203', '2204', '2205'];
  const isSupplier = supplierCodes.some(c => code.startsWith(c.substring(0, 4))) || 
                     code.startsWith('220');
  if (isSupplier) {
    const idx = allTypes.findIndex(t => t.id === 'supplier');
    if (idx >= 0) {
      allTypes[idx].isApplicable = true;
      allTypes[idx].isRecommended = true;
    }
  }

  // 6. 部门核算：费用类
  const departmentCodes = ['5001', '5101', '5201', '5301', '5401', '5601', '5602', '5603', '6401', '6402', '6403'];
  const isDepartment = departmentCodes.some(c => code.startsWith(c.substring(0, 4))) ||
                       code.startsWith('56') || // 费用类
                       code.startsWith('640');  // 税金及附加等
  if (isDepartment) {
    const idx = allTypes.findIndex(t => t.id === 'department');
    if (idx >= 0) {
      allTypes[idx].isApplicable = true;
      allTypes[idx].isRecommended = true;
    }
  }

  // 7. 职员核算：应付职工薪酬、其他应收款-备用金
  const employeeCodes = ['2211', '1221'];
  const isEmployee = employeeCodes.some(c => code.startsWith(c.substring(0, 4)));
  if (isEmployee) {
    const idx = allTypes.findIndex(t => t.id === 'employee');
    if (idx >= 0) {
      allTypes[idx].isApplicable = true;
      allTypes[idx].isRecommended = true;
    }
  }

  // 8. 项目核算：在建工程、研发支出
  const projectCodes = ['1604', '1605', '1606', '5301'];
  const isProject = projectCodes.some(c => code.startsWith(c.substring(0, 4)));
  if (isProject) {
    const idx = allTypes.findIndex(t => t.id === 'project');
    if (idx >= 0) {
      allTypes[idx].isApplicable = true;
      allTypes[idx].isRecommended = true;
    }
  }

  // 9. 外币核算：银行存款-外币户、应收/应付外汇账款
  // 注意：外币核算通常是在科目明细中设置的，这里不自动推荐，但标记为可用
  const foreignCurrencyCodes = ['1002', '1122', '2202'];
  const isForeignCurrency = foreignCurrencyCodes.some(c => code.startsWith(c.substring(0, 4)));
  if (isForeignCurrency) {
    const idx = allTypes.findIndex(t => t.id === 'foreign_currency');
    if (idx >= 0) {
      allTypes[idx].isApplicable = true;
      allTypes[idx].isRecommended = false; // 外币核算不自动推荐
    }
  }

  // 返回适用的辅助核算类型（包含推荐和适用的）
  return allTypes.filter(t => t.isApplicable || t.isRecommended);
}

/**
 * 获取科目的默认余额方向
 * 
 * 规则：
 * - 资产类（1开头）：借方余额
 * - 负债类（2开头）：贷方余额
 * - 所有者权益类（3开头）：贷方余额
 * - 成本类（4开头）：借方余额
 * - 损益类（5-6开头）：视具体科目而定
 * 
 * @param accountCode 科目编码
 * @returns 余额方向
 */
export function getDirectionByCode(accountCode: string): "借" | "贷" {
  if (!accountCode || accountCode.length < 1) return "借";
  
  const firstChar = accountCode[0];
  
  // 根据会计科目编码规则判断
  switch (firstChar) {
    case '1': // 资产类
      return "借";
    case '2': // 负债类
      return "贷";
    case '3': // 所有者权益类
      return "贷";
    case '4': // 成本类
      return "借";
    case '5': // 损益类
      // 损益类科目需要细分
      // 收入类（5开头，部分科目）：贷方
      // 费用类（5开头，部分科目）：借方
      // 这里简化处理，返回借方，实际使用时应该从科目数据中获取
      return "借";
    case '6': // 损益类
      return "借";
    default:
      return "借";
  }
}

/**
 * 根据科目类别获取余额方向
 * 
 * @param category 科目类别名称
 * @returns 余额方向
 */
export function getDirectionByCategory(category: string): "借" | "贷" {
  switch (category) {
    case '资产类':
      return "借";
    case '负债类':
      return "贷";
    case '所有者权益类':
      return "贷";
    case '成本类':
      return "借";
    case '损益类':
      return "借"; // 损益类科目需细分，默认借方
    default:
      return "借";
  }
}
