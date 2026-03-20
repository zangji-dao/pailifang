/**
 * 标准经营范围数据
 * 基于《国民经济行业分类》(GB/T 4754) 和市场监督管理局标准表述
 */

export type LicenseType = "general" | "post" | "pre";

export interface BusinessScopeItem {
  id: string;
  name: string;           // 经营范围表述
  category: string;       // 国民经济行业分类
  categoryCode: string;   // 分类代码
  licenseType: LicenseType; // 许可情况
}

// 许可类型标签
export const licenseTypeLabels: Record<LicenseType, { label: string; color: string }> = {
  general: { label: "一般事项", color: "bg-green-100 text-green-700 border-green-200" },
  post: { label: "后置事项", color: "bg-blue-100 text-blue-700 border-blue-200" },
  pre: { label: "前置事项", color: "bg-orange-100 text-orange-700 border-orange-200" },
};

// 常见经营范围数据（部分示例）
export const businessScopes: BusinessScopeItem[] = [
  // 农、林、牧、渔业
  { id: "001", name: "谷物种植", category: "谷物种植", categoryCode: "011", licenseType: "general" },
  { id: "002", name: "豆类种植", category: "豆类种植", categoryCode: "0121", licenseType: "general" },
  { id: "003", name: "油料种植", category: "油料种植", categoryCode: "0122", licenseType: "general" },
  { id: "004", name: "薯类种植", category: "薯类种植", categoryCode: "0123", licenseType: "general" },
  { id: "005", name: "棉花种植", category: "棉花种植", categoryCode: "0131", licenseType: "general" },
  { id: "006", name: "蔬菜种植", category: "蔬菜种植", categoryCode: "0141", licenseType: "general" },
  { id: "007", name: "食用菌种植", category: "食用菌种植", categoryCode: "0142", licenseType: "general" },
  { id: "008", name: "水果种植", category: "水果种植", categoryCode: "015", licenseType: "general" },
  { id: "009", name: "坚果种植", category: "坚果种植", categoryCode: "0153", licenseType: "general" },
  { id: "010", name: "茶叶种植", category: "茶叶种植", categoryCode: "0161", licenseType: "general" },
  { id: "011", name: "林木育种", category: "林木育种", categoryCode: "0211", licenseType: "general" },
  { id: "012", name: "林木育苗", category: "林木育苗", categoryCode: "0212", licenseType: "general" },
  { id: "013", name: "牲畜饲养", category: "牲畜饲养", categoryCode: "031", licenseType: "general" },
  { id: "014", name: "猪的饲养", category: "猪的饲养", categoryCode: "0313", licenseType: "general" },
  { id: "015", name: "家禽饲养", category: "家禽饲养", categoryCode: "032", licenseType: "general" },
  { id: "016", name: "水产养殖", category: "水产养殖", categoryCode: "0411", licenseType: "general" },
  
  // 制造业
  { id: "017", name: "谷物磨制", category: "谷物磨制", categoryCode: "131", licenseType: "general" },
  { id: "018", name: "饲料加工", category: "饲料加工", categoryCode: "132", licenseType: "post" },
  { id: "019", name: "食用植物油加工", category: "食用植物油加工", categoryCode: "1331", licenseType: "post" },
  { id: "020", name: "制糖业", category: "制糖业", categoryCode: "134", licenseType: "general" },
  { id: "021", name: "屠宰及肉类加工", category: "屠宰及肉类加工", categoryCode: "135", licenseType: "pre" },
  { id: "022", name: "水产品加工", category: "水产品加工", categoryCode: "136", licenseType: "post" },
  { id: "023", name: "蔬菜加工", category: "蔬菜加工", categoryCode: "137", licenseType: "post" },
  { id: "024", name: "乳制品制造", category: "乳制品制造", categoryCode: "144", licenseType: "pre" },
  { id: "025", name: "调味品发酵制品制造", category: "调味品发酵制品制造", categoryCode: "146", licenseType: "post" },
  { id: "026", name: "酒类制造", category: "酒类制造", categoryCode: "151", licenseType: "pre" },
  { id: "027", name: "软饮料制造", category: "软饮料制造", categoryCode: "152", licenseType: "post" },
  { id: "028", name: "精制茶加工", category: "精制茶加工", categoryCode: "153", licenseType: "post" },
  { id: "029", name: "纺织业", category: "纺织业", categoryCode: "17", licenseType: "general" },
  { id: "030", name: "针织或钩针编织物织造", category: "针织或钩针编织物织造", categoryCode: "175", licenseType: "general" },
  { id: "031", name: "服装制造", category: "服装制造", categoryCode: "18", licenseType: "general" },
  { id: "032", name: "鞋帽制造", category: "鞋帽制造", categoryCode: "195", licenseType: "general" },
  { id: "033", name: "木材加工", category: "木材加工", categoryCode: "20", licenseType: "general" },
  { id: "034", name: "家具制造", category: "家具制造", categoryCode: "21", licenseType: "general" },
  { id: "035", name: "造纸和纸制品业", category: "造纸和纸制品业", categoryCode: "22", licenseType: "general" },
  { id: "036", name: "印刷", category: "印刷", categoryCode: "231", licenseType: "post" },
  { id: "037", name: "文教办公用品制造", category: "文教办公用品制造", categoryCode: "241", licenseType: "general" },
  { id: "038", name: "体育用品制造", category: "体育用品制造", categoryCode: "244", licenseType: "general" },
  { id: "039", name: "玩具制造", category: "玩具制造", categoryCode: "245", licenseType: "general" },
  { id: "040", name: "化学原料和化学制品制造业", category: "化学原料和化学制品制造业", categoryCode: "26", licenseType: "pre" },
  { id: "041", name: "医药制造业", category: "医药制造业", categoryCode: "27", licenseType: "pre" },
  { id: "042", name: "橡胶和塑料制品业", category: "橡胶和塑料制品业", categoryCode: "29", licenseType: "general" },
  { id: "043", name: "非金属矿物制品业", category: "非金属矿物制品业", categoryCode: "30", licenseType: "post" },
  { id: "044", name: "黑色金属冶炼和压延加工业", category: "黑色金属冶炼和压延加工业", categoryCode: "31", licenseType: "post" },
  { id: "045", name: "有色金属冶炼和压延加工业", category: "有色金属冶炼和压延加工业", categoryCode: "32", licenseType: "post" },
  { id: "046", name: "金属制品业", category: "金属制品业", categoryCode: "33", licenseType: "general" },
  { id: "047", name: "通用设备制造业", category: "通用设备制造业", categoryCode: "34", licenseType: "general" },
  { id: "048", name: "专用设备制造业", category: "专用设备制造业", categoryCode: "35", licenseType: "general" },
  { id: "049", name: "汽车制造业", category: "汽车制造业", categoryCode: "36", licenseType: "general" },
  { id: "050", name: "铁路、船舶、航空航天和其他运输设备制造业", category: "运输设备制造业", categoryCode: "37", licenseType: "general" },
  { id: "051", name: "电气机械和器材制造业", category: "电气机械和器材制造业", categoryCode: "38", licenseType: "general" },
  { id: "052", name: "计算机、通信和其他电子设备制造业", category: "电子设备制造业", categoryCode: "39", licenseType: "general" },
  { id: "053", name: "仪器仪表制造业", category: "仪器仪表制造业", categoryCode: "40", licenseType: "general" },
  
  // 建筑业
  { id: "054", name: "房屋建筑", category: "房屋建筑", categoryCode: "47", licenseType: "post" },
  { id: "055", name: "土木工程建筑", category: "土木工程建筑", categoryCode: "48", licenseType: "post" },
  { id: "056", name: "建筑安装", category: "建筑安装", categoryCode: "49", licenseType: "post" },
  { id: "057", name: "建筑装饰和装修", category: "建筑装饰和装修", categoryCode: "501", licenseType: "general" },
  { id: "058", name: "建筑物拆除活动", category: "建筑物拆除活动", categoryCode: "502", licenseType: "post" },
  
  // 批发和零售业
  { id: "059", name: "贸易代理", category: "贸易代理", categoryCode: "5181", licenseType: "general" },
  { id: "060", name: "货物进出口", category: "货物进出口", categoryCode: "5182", licenseType: "post" },
  { id: "061", name: "技术进出口", category: "技术进出口", categoryCode: "5183", licenseType: "post" },
  { id: "062", name: "食品销售", category: "食品销售", categoryCode: "522", licenseType: "post" },
  { id: "063", name: "烟草制品零售", category: "烟草制品零售", categoryCode: "5226", licenseType: "pre" },
  { id: "064", name: "纺织、服装及日用品销售", category: "纺织、服装及日用品销售", categoryCode: "523", licenseType: "general" },
  { id: "065", name: "文化、体育用品及器材销售", category: "文化、体育用品及器材销售", categoryCode: "524", licenseType: "general" },
  { id: "066", name: "医药及医疗器材销售", category: "医药及医疗器材销售", categoryCode: "525", licenseType: "post" },
  { id: "067", name: "汽车、摩托车、零配件销售", category: "汽车、摩托车、零配件销售", categoryCode: "526", licenseType: "general" },
  { id: "068", name: "家用电器及电子产品销售", category: "家用电器及电子产品销售", categoryCode: "527", licenseType: "general" },
  { id: "069", name: "五金、家具及室内装饰材料销售", category: "五金、家具及室内装饰材料销售", categoryCode: "528", licenseType: "general" },
  { id: "070", name: "货摊、无店铺及其他零售业", category: "货摊、无店铺及其他零售业", categoryCode: "529", licenseType: "general" },
  
  // 交通运输、仓储和邮政业
  { id: "071", name: "道路货物运输", category: "道路货物运输", categoryCode: "543", licenseType: "post" },
  { id: "072", name: "水上货物运输", category: "水上货物运输", categoryCode: "552", licenseType: "post" },
  { id: "073", name: "航空货物运输", category: "航空货物运输", categoryCode: "561", licenseType: "post" },
  { id: "074", name: "管道运输业", category: "管道运输业", categoryCode: "57", licenseType: "post" },
  { id: "075", name: "装卸搬运", category: "装卸搬运", categoryCode: "581", licenseType: "general" },
  { id: "076", name: "仓储业", category: "仓储业", categoryCode: "582", licenseType: "general" },
  { id: "077", name: "邮政基本服务", category: "邮政基本服务", categoryCode: "591", licenseType: "post" },
  { id: "078", name: "快递服务", category: "快递服务", categoryCode: "592", licenseType: "post" },
  
  // 住宿和餐饮业
  { id: "079", name: "旅游饭店", category: "旅游饭店", categoryCode: "611", licenseType: "post" },
  { id: "080", name: "一般旅馆", category: "一般旅馆", categoryCode: "612", licenseType: "post" },
  { id: "081", name: "民宿服务", category: "民宿服务", categoryCode: "613", licenseType: "post" },
  { id: "082", name: "正餐服务", category: "正餐服务", categoryCode: "621", licenseType: "post" },
  { id: "083", name: "快餐服务", category: "快餐服务", categoryCode: "622", licenseType: "post" },
  { id: "084", name: "饮料及冷饮服务", category: "饮料及冷饮服务", categoryCode: "623", licenseType: "post" },
  { id: "085", name: "餐饮配送服务", category: "餐饮配送服务", categoryCode: "624", licenseType: "post" },
  
  // 信息传输、软件和信息技术服务业
  { id: "086", name: "固定电信服务", category: "固定电信服务", categoryCode: "6311", licenseType: "pre" },
  { id: "087", name: "移动电信服务", category: "移动电信服务", categoryCode: "6312", licenseType: "pre" },
  { id: "088", name: "互联网接入及相关服务", category: "互联网接入及相关服务", categoryCode: "642", licenseType: "post" },
  { id: "089", name: "互联网信息服务", category: "互联网信息服务", categoryCode: "6421", licenseType: "post" },
  { id: "090", name: "软件开发", category: "软件开发", categoryCode: "651", licenseType: "general" },
  { id: "091", name: "信息系统集成服务", category: "信息系统集成服务", categoryCode: "652", licenseType: "general" },
  { id: "092", name: "信息技术咨询服务", category: "信息技术咨询服务", categoryCode: "653", licenseType: "general" },
  { id: "093", name: "数据处理和存储服务", category: "数据处理和存储服务", categoryCode: "654", licenseType: "general" },
  { id: "094", name: "集成电路设计", category: "集成电路设计", categoryCode: "655", licenseType: "general" },
  
  // 金融业
  { id: "095", name: "货币银行服务", category: "货币银行服务", categoryCode: "662", licenseType: "pre" },
  { id: "096", name: "非货币银行服务", category: "非货币银行服务", categoryCode: "663", licenseType: "pre" },
  { id: "097", name: "保险业", category: "保险业", categoryCode: "68", licenseType: "pre" },
  { id: "098", name: "资本市场服务", category: "资本市场服务", categoryCode: "67", licenseType: "pre" },
  
  // 房地产业
  { id: "099", name: "房地产开发经营", category: "房地产开发经营", categoryCode: "701", licenseType: "post" },
  { id: "100", name: "物业管理", category: "物业管理", categoryCode: "702", licenseType: "general" },
  { id: "101", name: "房地产中介服务", category: "房地产中介服务", categoryCode: "703", licenseType: "post" },
  { id: "102", name: "房地产租赁经营", category: "房地产租赁经营", categoryCode: "704", licenseType: "general" },
  
  // 租赁和商务服务业
  { id: "103", name: "机械设备租赁", category: "机械设备租赁", categoryCode: "711", licenseType: "general" },
  { id: "104", name: "汽车租赁", category: "汽车租赁", categoryCode: "7111", licenseType: "general" },
  { id: "105", name: "计算机及通讯设备租赁", category: "计算机及通讯设备租赁", categoryCode: "7112", licenseType: "general" },
  { id: "106", name: "企业管理服务", category: "企业管理服务", categoryCode: "721", licenseType: "general" },
  { id: "107", name: "法律服务", category: "法律服务", categoryCode: "722", licenseType: "post" },
  { id: "108", name: "会计、审计及税务服务", category: "会计、审计及税务服务", categoryCode: "723", licenseType: "post" },
  { id: "109", name: "咨询与调查", category: "咨询与调查", categoryCode: "724", licenseType: "general" },
  { id: "110", name: "广告业", category: "广告业", categoryCode: "725", licenseType: "general" },
  { id: "111", name: "知识产权服务", category: "知识产权服务", categoryCode: "726", licenseType: "general" },
  { id: "112", name: "人力资源服务", category: "人力资源服务", categoryCode: "7262", licenseType: "post" },
  { id: "113", name: "旅行社及相关服务", category: "旅行社及相关服务", categoryCode: "729", licenseType: "post" },
  { id: "114", name: "会议、展览及相关服务", category: "会议、展览及相关服务", categoryCode: "7292", licenseType: "general" },
  
  // 科学研究和技术服务业
  { id: "115", name: "研究与试验发展", category: "研究与试验发展", categoryCode: "73", licenseType: "general" },
  { id: "116", name: "专业技术服务业", category: "专业技术服务业", categoryCode: "74", licenseType: "post" },
  { id: "117", name: "科技推广和应用服务业", category: "科技推广和应用服务业", categoryCode: "75", licenseType: "general" },
  
  // 水利、环境和公共设施管理业
  { id: "118", name: "水利管理业", category: "水利管理业", categoryCode: "76", licenseType: "post" },
  { id: "119", name: "生态保护和环境治理业", category: "生态保护和环境治理业", categoryCode: "77", licenseType: "post" },
  { id: "120", name: "公共设施管理业", category: "公共设施管理业", categoryCode: "78", licenseType: "post" },
  
  // 居民服务、修理和其他服务业
  { id: "121", name: "家庭服务", category: "家庭服务", categoryCode: "8021", licenseType: "general" },
  { id: "122", name: "托儿所服务", category: "托儿所服务", categoryCode: "8022", licenseType: "post" },
  { id: "123", name: "洗染服务", category: "洗染服务", categoryCode: "803", licenseType: "general" },
  { id: "124", name: "理发及美容服务", category: "理发及美容服务", categoryCode: "804", licenseType: "post" },
  { id: "125", name: "洗浴服务", category: "洗浴服务", categoryCode: "805", licenseType: "post" },
  { id: "126", name: "保健服务", category: "保健服务", categoryCode: "806", licenseType: "post" },
  { id: "127", name: "婚姻服务", category: "婚姻服务", categoryCode: "807", licenseType: "general" },
  { id: "128", name: "殡葬服务", category: "殡葬服务", categoryCode: "808", licenseType: "post" },
  { id: "129", name: "摄影扩印服务", category: "摄影扩印服务", categoryCode: "809", licenseType: "general" },
  { id: "130", name: "汽车、摩托车修理与维护", category: "汽车、摩托车修理与维护", categoryCode: "811", licenseType: "general" },
  { id: "131", name: "计算机和辅助设备修理", category: "计算机和辅助设备修理", categoryCode: "812", licenseType: "general" },
  { id: "132", name: "通讯设备修理", category: "通讯设备修理", categoryCode: "813", licenseType: "general" },
  { id: "133", name: "日用家电修理", category: "日用家电修理", categoryCode: "814", licenseType: "general" },
  { id: "134", name: "其他日用品修理", category: "其他日用品修理", categoryCode: "819", licenseType: "general" },
  
  // 教育
  { id: "135", name: "学前教育", category: "学前教育", categoryCode: "831", licenseType: "pre" },
  { id: "136", name: "初等教育", category: "初等教育", categoryCode: "832", licenseType: "pre" },
  { id: "137", name: "中等教育", category: "中等教育", categoryCode: "833", licenseType: "pre" },
  { id: "138", name: "高等教育", category: "高等教育", categoryCode: "834", licenseType: "pre" },
  { id: "139", name: "技能培训、教育辅助及其他教育", category: "技能培训、教育辅助及其他教育", categoryCode: "839", licenseType: "post" },
  
  // 卫生和社会工作
  { id: "140", name: "医院", category: "医院", categoryCode: "841", licenseType: "pre" },
  { id: "141", name: "社区卫生服务中心（站）", category: "社区卫生服务中心（站）", categoryCode: "842", licenseType: "pre" },
  { id: "142", name: "门诊部（所）", category: "门诊部（所）", categoryCode: "843", licenseType: "pre" },
  { id: "143", name: "诊所", category: "诊所", categoryCode: "8432", licenseType: "pre" },
  { id: "144", name: "专业护理服务", category: "专业护理服务", categoryCode: "852", licenseType: "post" },
  
  // 文化、体育和娱乐业
  { id: "145", name: "文艺创作与表演", category: "文艺创作与表演", categoryCode: "881", licenseType: "general" },
  { id: "146", name: "艺术表演场馆", category: "艺术表演场馆", categoryCode: "882", licenseType: "post" },
  { id: "147", name: "图书馆", category: "图书馆", categoryCode: "883", licenseType: "post" },
  { id: "148", name: "档案馆", category: "档案馆", categoryCode: "884", licenseType: "post" },
  { id: "149", name: "博物馆", category: "博物馆", categoryCode: "885", licenseType: "post" },
  { id: "150", name: "游乐园", category: "游乐园", categoryCode: "902", licenseType: "post" },
  { id: "151", name: "休闲观光活动", category: "休闲观光活动", categoryCode: "903", licenseType: "general" },
  { id: "152", name: "健身休闲活动", category: "健身休闲活动", categoryCode: "883", licenseType: "post" },
  { id: "153", name: "电影放映", category: "电影放映", categoryCode: "875", licenseType: "post" },
  { id: "154", name: "歌舞厅娱乐活动", category: "歌舞厅娱乐活动", categoryCode: "901", licenseType: "post" },
  { id: "155", name: "电子游艺厅娱乐活动", category: "电子游艺厅娱乐活动", categoryCode: "9012", licenseType: "post" },
  { id: "156", name: "网吧活动", category: "网吧活动", categoryCode: "891", licenseType: "post" },
  
  // 公共管理、社会保障和社会组织
  { id: "157", name: "社会工作", category: "社会工作", categoryCode: "85", licenseType: "post" },
  
  // 国际组织
  { id: "158", name: "国际组织", category: "国际组织", categoryCode: "96", licenseType: "general" },
];

/**
 * 搜索经营范围
 */
export function searchBusinessScopes(keyword: string, page: number = 1, pageSize: number = 10): {
  items: BusinessScopeItem[];
  total: number;
  page: number;
  pageSize: number;
} {
  const lowerKeyword = keyword.toLowerCase().trim();
  
  let filtered = businessScopes;
  if (lowerKeyword) {
    filtered = businessScopes.filter(
      item => 
        item.name.toLowerCase().includes(lowerKeyword) ||
        item.category.toLowerCase().includes(lowerKeyword) ||
        item.categoryCode.includes(lowerKeyword)
    );
  }
  
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);
  
  return { items, total, page, pageSize };
}

/**
 * 根据 ID 获取经营范围
 */
export function getBusinessScopeById(id: string): BusinessScopeItem | undefined {
  return businessScopes.find(item => item.id === id);
}

/**
 * 根据多个 ID 获取经营范围列表
 */
export function getBusinessScopesByIds(ids: string[]): BusinessScopeItem[] {
  return businessScopes.filter(item => ids.includes(item.id));
}
