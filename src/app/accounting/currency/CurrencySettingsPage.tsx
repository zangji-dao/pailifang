"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmModal, AlertModal } from "@/components/ui/confirm-modal";
import {
  Plus,
  Edit2,
  Trash2,
  Star,
  Search,
  ChevronUp,
  Globe,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 币别设置页面
 * 采用页面内展开方式，不使用弹窗选择
 * 使用自定义确认弹窗替代原生 confirm/alert
 */

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isBase: boolean;
  decimalPlaces: number;
  status: "启用" | "停用";
  sortOrder: number;
}

// 全球币种库（按洲分类）
const ALL_CURRENCY_PRESETS = [
  // 亚洲
  { code: "CNY", name: "人民币", symbol: "¥", decimalPlaces: 2, country: "中国" },
  { code: "HKD", name: "港币", symbol: "HK$", decimalPlaces: 2, country: "香港" },
  { code: "MOP", name: "澳门元", symbol: "MOP$", decimalPlaces: 2, country: "澳门" },
  { code: "TWD", name: "新台币", symbol: "NT$", decimalPlaces: 2, country: "台湾" },
  { code: "JPY", name: "日元", symbol: "¥", decimalPlaces: 0, country: "日本" },
  { code: "KRW", name: "韩元", symbol: "₩", decimalPlaces: 0, country: "韩国" },
  { code: "KPW", name: "朝鲜元", symbol: "₩", decimalPlaces: 2, country: "朝鲜" },
  { code: "MNT", name: "图格里克", symbol: "₮", decimalPlaces: 2, country: "蒙古" },
  { code: "VND", name: "越南盾", symbol: "₫", decimalPlaces: 0, country: "越南" },
  { code: "LAK", name: "基普", symbol: "₭", decimalPlaces: 2, country: "老挝" },
  { code: "KHR", name: "瑞尔", symbol: "៛", decimalPlaces: 2, country: "柬埔寨" },
  { code: "THB", name: "泰铢", symbol: "฿", decimalPlaces: 2, country: "泰国" },
  { code: "MMK", name: "缅元", symbol: "K", decimalPlaces: 2, country: "缅甸" },
  { code: "MYR", name: "林吉特", symbol: "RM", decimalPlaces: 2, country: "马来西亚" },
  { code: "SGD", name: "新加坡元", symbol: "S$", decimalPlaces: 2, country: "新加坡" },
  { code: "BND", name: "文莱元", symbol: "B$", decimalPlaces: 2, country: "文莱" },
  { code: "PHP", name: "比索", symbol: "₱", decimalPlaces: 2, country: "菲律宾" },
  { code: "IDR", name: "卢比", symbol: "Rp", decimalPlaces: 0, country: "印度尼西亚" },
  { code: "INR", name: "卢比", symbol: "₹", decimalPlaces: 2, country: "印度" },
  { code: "PKR", name: "卢比", symbol: "₨", decimalPlaces: 2, country: "巴基斯坦" },
  { code: "LKR", name: "卢比", symbol: "₨", decimalPlaces: 2, country: "斯里兰卡" },
  { code: "NPR", name: "卢比", symbol: "₨", decimalPlaces: 2, country: "尼泊尔" },
  { code: "BDT", name: "塔卡", symbol: "৳", decimalPlaces: 2, country: "孟加拉国" },
  { code: "BTN", name: "努尔特鲁姆", symbol: "Nu.", decimalPlaces: 2, country: "不丹" },
  { code: "MVR", name: "拉菲亚", symbol: "Rf", decimalPlaces: 2, country: "马尔代夫" },
  { code: "AFN", name: "阿富汗尼", symbol: "؋", decimalPlaces: 2, country: "阿富汗" },
  { code: "IRR", name: "里亚尔", symbol: "﷼", decimalPlaces: 2, country: "伊朗" },
  { code: "IQD", name: "第纳尔", symbol: "ع.د", decimalPlaces: 3, country: "伊拉克" },
  { code: "SYP", name: "镑", symbol: "£", decimalPlaces: 2, country: "叙利亚" },
  { code: "LBP", name: "镑", symbol: "ل.ل", decimalPlaces: 2, country: "黎巴嫩" },
  { code: "JOD", name: "第纳尔", symbol: "د.ا", decimalPlaces: 3, country: "约旦" },
  { code: "ILS", name: "新谢克尔", symbol: "₪", decimalPlaces: 2, country: "以色列" },
  { code: "SAR", name: "里亚尔", symbol: "﷼", decimalPlaces: 2, country: "沙特阿拉伯" },
  { code: "AED", name: "迪拉姆", symbol: "د.إ", decimalPlaces: 2, country: "阿联酋" },
  { code: "QAR", name: "里亚尔", symbol: "﷼", decimalPlaces: 2, country: "卡塔尔" },
  { code: "KWD", name: "第纳尔", symbol: "د.ك", decimalPlaces: 3, country: "科威特" },
  { code: "BHD", name: "第纳尔", symbol: "د.ب", decimalPlaces: 3, country: "巴林" },
  { code: "OMR", name: "里亚尔", symbol: "﷼", decimalPlaces: 3, country: "阿曼" },
  { code: "YER", name: "里亚尔", symbol: "﷼", decimalPlaces: 2, country: "也门" },
  
  // 欧洲
  { code: "EUR", name: "欧元", symbol: "€", decimalPlaces: 2, country: "欧元区" },
  { code: "GBP", name: "英镑", symbol: "£", decimalPlaces: 2, country: "英国" },
  { code: "CHF", name: "瑞士法郎", symbol: "Fr", decimalPlaces: 2, country: "瑞士" },
  { code: "NOK", name: "克朗", symbol: "kr", decimalPlaces: 2, country: "挪威" },
  { code: "SEK", name: "克朗", symbol: "kr", decimalPlaces: 2, country: "瑞典" },
  { code: "DKK", name: "克朗", symbol: "kr", decimalPlaces: 2, country: "丹麦" },
  { code: "ISK", name: "克朗", symbol: "kr", decimalPlaces: 0, country: "冰岛" },
  { code: "PLN", name: "兹罗提", symbol: "zł", decimalPlaces: 2, country: "波兰" },
  { code: "CZK", name: "克朗", symbol: "Kč", decimalPlaces: 2, country: "捷克" },
  { code: "HUF", name: "福林", symbol: "Ft", decimalPlaces: 2, country: "匈牙利" },
  { code: "RON", name: "列伊", symbol: "lei", decimalPlaces: 2, country: "罗马尼亚" },
  { code: "BGN", name: "列弗", symbol: "лв", decimalPlaces: 2, country: "保加利亚" },
  { code: "HRK", name: "库纳", symbol: "kn", decimalPlaces: 2, country: "克罗地亚" },
  { code: "RSD", name: "第纳尔", symbol: "дин.", decimalPlaces: 2, country: "塞尔维亚" },
  { code: "MKD", name: "第纳尔", symbol: "ден", decimalPlaces: 2, country: "北马其顿" },
  { code: "ALL", name: "列克", symbol: "L", decimalPlaces: 2, country: "阿尔巴尼亚" },
  { code: "BAM", name: "马克", symbol: "KM", decimalPlaces: 2, country: "波黑" },
  { code: "TRY", name: "里拉", symbol: "₺", decimalPlaces: 2, country: "土耳其" },
  { code: "RUB", name: "卢布", symbol: "₽", decimalPlaces: 2, country: "俄罗斯" },
  { code: "UAH", name: "格里夫纳", symbol: "₴", decimalPlaces: 2, country: "乌克兰" },
  { code: "BYN", name: "卢布", symbol: "Br", decimalPlaces: 2, country: "白俄罗斯" },
  { code: "MDL", name: "列伊", symbol: "L", decimalPlaces: 2, country: "摩尔多瓦" },
  { code: "GEL", name: "拉里", symbol: "₾", decimalPlaces: 2, country: "格鲁吉亚" },
  { code: "AMD", name: "德拉姆", symbol: "֏", decimalPlaces: 2, country: "亚美尼亚" },
  { code: "AZN", name: "马纳特", symbol: "₼", decimalPlaces: 2, country: "阿塞拜疆" },
  
  // 非洲
  { code: "EGP", name: "镑", symbol: "£", decimalPlaces: 2, country: "埃及" },
  { code: "LYD", name: "第纳尔", symbol: "ل.د", decimalPlaces: 3, country: "利比亚" },
  { code: "TND", name: "第纳尔", symbol: "د.ت", decimalPlaces: 3, country: "突尼斯" },
  { code: "DZD", name: "第纳尔", symbol: "د.ج", decimalPlaces: 2, country: "阿尔及利亚" },
  { code: "MAD", name: "迪拉姆", symbol: "د.م.", decimalPlaces: 2, country: "摩洛哥" },
  { code: "MUR", name: "卢比", symbol: "₨", decimalPlaces: 2, country: "毛里求斯" },
  { code: "ZAR", name: "兰特", symbol: "R", decimalPlaces: 2, country: "南非" },
  { code: "NAD", name: "元", symbol: "N$", decimalPlaces: 2, country: "纳米比亚" },
  { code: "BWP", name: "普拉", symbol: "P", decimalPlaces: 2, country: "博茨瓦纳" },
  { code: "ZWL", name: "元", symbol: "Z$", decimalPlaces: 2, country: "津巴布韦" },
  { code: "ZMW", name: "克瓦查", symbol: "ZK", decimalPlaces: 2, country: "赞比亚" },
  { code: "MWK", name: "克瓦查", symbol: "MK", decimalPlaces: 2, country: "马拉维" },
  { code: "MZN", name: "梅蒂卡尔", symbol: "MT", decimalPlaces: 2, country: "莫桑比克" },
  { code: "TZS", name: "先令", symbol: "TSh", decimalPlaces: 2, country: "坦桑尼亚" },
  { code: "KES", name: "先令", symbol: "KSh", decimalPlaces: 2, country: "肯尼亚" },
  { code: "UGX", name: "先令", symbol: "USh", decimalPlaces: 0, country: "乌干达" },
  { code: "RWF", name: "法郎", symbol: "FRw", decimalPlaces: 0, country: "卢旺达" },
  { code: "BIF", name: "法郎", symbol: "FBu", decimalPlaces: 0, country: "布隆迪" },
  { code: "ETB", name: "比尔", symbol: "Br", decimalPlaces: 2, country: "埃塞俄比亚" },
  { code: "SOS", name: "先令", symbol: "Sh.so.", decimalPlaces: 2, country: "索马里" },
  { code: "DJF", name: "法郎", symbol: "Fdj", decimalPlaces: 0, country: "吉布提" },
  { code: "ERN", name: "纳克法", symbol: "Nfk", decimalPlaces: 2, country: "厄立特里亚" },
  { code: "SDG", name: "镑", symbol: "ج.س.", decimalPlaces: 2, country: "苏丹" },
  { code: "SSP", name: "镑", symbol: "£", decimalPlaces: 2, country: "南苏丹" },
  { code: "NGN", name: "奈拉", symbol: "₦", decimalPlaces: 2, country: "尼日利亚" },
  { code: "GHS", name: "塞地", symbol: "₵", decimalPlaces: 2, country: "加纳" },
  { code: "XOF", name: "西非法郎", symbol: "CFA", decimalPlaces: 0, country: "西非经货联盟" },
  { code: "XAF", name: "中非法郎", symbol: "FCFA", decimalPlaces: 0, country: "中非经货共同体" },
  { code: "AOA", name: "宽扎", symbol: "Kz", decimalPlaces: 2, country: "安哥拉" },
  { code: "CDF", name: "法郎", symbol: "FC", decimalPlaces: 2, country: "刚果(金)" },
  { code: "GMD", name: "达拉西", symbol: "D", decimalPlaces: 2, country: "冈比亚" },
  { code: "GNF", name: "法郎", symbol: "FG", decimalPlaces: 0, country: "几内亚" },
  { code: "SLL", name: "利昂", symbol: "Le", decimalPlaces: 2, country: "塞拉利昂" },
  { code: "LRD", name: "元", symbol: "L$", decimalPlaces: 2, country: "利比里亚" },
  { code: "CVE", name: "埃斯库多", symbol: "Esc", decimalPlaces: 2, country: "佛得角" },
  
  // 北美洲
  { code: "USD", name: "美元", symbol: "$", decimalPlaces: 2, country: "美国" },
  { code: "CAD", name: "加元", symbol: "C$", decimalPlaces: 2, country: "加拿大" },
  { code: "MXN", name: "比索", symbol: "$", decimalPlaces: 2, country: "墨西哥" },
  { code: "GTQ", name: "格查尔", symbol: "Q", decimalPlaces: 2, country: "危地马拉" },
  { code: "BZD", name: "元", symbol: "BZ$", decimalPlaces: 2, country: "伯利兹" },
  { code: "HNL", name: "伦皮拉", symbol: "L", decimalPlaces: 2, country: "洪都拉斯" },
  { code: "NIO", name: "科多巴", symbol: "C$", decimalPlaces: 2, country: "尼加拉瓜" },
  { code: "CRC", name: "科朗", symbol: "₡", decimalPlaces: 2, country: "哥斯达黎加" },
  { code: "PAB", name: "巴波亚", symbol: "B/.", decimalPlaces: 2, country: "巴拿马" },
  { code: "JMD", name: "元", symbol: "J$", decimalPlaces: 2, country: "牙买加" },
  { code: "HTG", name: "古德", symbol: "G", decimalPlaces: 2, country: "海地" },
  { code: "DOP", name: "比索", symbol: "RD$", decimalPlaces: 2, country: "多米尼加" },
  { code: "CUP", name: "比索", symbol: "$MN", decimalPlaces: 2, country: "古巴" },
  { code: "TTD", name: "元", symbol: "TT$", decimalPlaces: 2, country: "特立尼达和多巴哥" },
  { code: "BBD", name: "元", symbol: "Bds$", decimalPlaces: 2, country: "巴巴多斯" },
  { code: "XCD", name: "东加勒比元", symbol: "EC$", decimalPlaces: 2, country: "东加勒比" },
  
  // 南美洲
  { code: "BRL", name: "雷亚尔", symbol: "R$", decimalPlaces: 2, country: "巴西" },
  { code: "ARS", name: "比索", symbol: "$", decimalPlaces: 2, country: "阿根廷" },
  { code: "CLP", name: "比索", symbol: "$", decimalPlaces: 0, country: "智利" },
  { code: "PEN", name: "索尔", symbol: "S/", decimalPlaces: 2, country: "秘鲁" },
  { code: "BOB", name: "玻利维亚诺", symbol: "Bs.", decimalPlaces: 2, country: "玻利维亚" },
  { code: "PYG", name: "瓜拉尼", symbol: "₲", decimalPlaces: 0, country: "巴拉圭" },
  { code: "UYU", name: "比索", symbol: "$U", decimalPlaces: 2, country: "乌拉圭" },
  { code: "COP", name: "比索", symbol: "$", decimalPlaces: 2, country: "哥伦比亚" },
  { code: "VEF", name: "玻利瓦尔", symbol: "Bs.", decimalPlaces: 2, country: "委内瑞拉" },
  { code: "GYD", name: "元", symbol: "G$", decimalPlaces: 2, country: "圭亚那" },
  { code: "SRD", name: "元", symbol: "Sr$", decimalPlaces: 2, country: "苏里南" },
  
  // 大洋洲
  { code: "AUD", name: "澳大利亚元", symbol: "A$", decimalPlaces: 2, country: "澳大利亚" },
  { code: "NZD", name: "新西兰元", symbol: "NZ$", decimalPlaces: 2, country: "新西兰" },
  { code: "FJD", name: "元", symbol: "FJ$", decimalPlaces: 2, country: "斐济" },
  { code: "PGK", name: "基那", symbol: "K", decimalPlaces: 2, country: "巴布亚新几内亚" },
  { code: "SBD", name: "元", symbol: "SI$", decimalPlaces: 2, country: "所罗门群岛" },
  { code: "VUV", name: "瓦图", symbol: "VT", decimalPlaces: 0, country: "瓦努阿图" },
  { code: "TOP", name: "潘加", symbol: "T$", decimalPlaces: 2, country: "汤加" },
  { code: "WST", name: "塔拉", symbol: "WS$", decimalPlaces: 2, country: "萨摩亚" },
  { code: "KID", name: "基里巴斯元", symbol: "$", decimalPlaces: 2, country: "基里巴斯" },
  { code: "TVD", name: "图瓦卢元", symbol: "$", decimalPlaces: 2, country: "图瓦卢" },
];

// 预设币种数据
const DEFAULT_CURRENCIES: Currency[] = [
  { id: "1", code: "CNY", name: "人民币", symbol: "¥", exchangeRate: 1.000000, isBase: true, decimalPlaces: 2, status: "启用", sortOrder: 1 },
  { id: "2", code: "USD", name: "美元", symbol: "$", exchangeRate: 7.250000, isBase: false, decimalPlaces: 2, status: "启用", sortOrder: 2 },
  { id: "3", code: "EUR", name: "欧元", symbol: "€", exchangeRate: 7.850000, isBase: false, decimalPlaces: 2, status: "启用", sortOrder: 3 },
  { id: "4", code: "GBP", name: "英镑", symbol: "£", exchangeRate: 9.150000, isBase: false, decimalPlaces: 2, status: "启用", sortOrder: 4 },
  { id: "5", code: "JPY", name: "日元", symbol: "¥", exchangeRate: 0.048000, isBase: false, decimalPlaces: 0, status: "启用", sortOrder: 5 },
  { id: "6", code: "HKD", name: "港币", symbol: "HK$", exchangeRate: 0.930000, isBase: false, decimalPlaces: 2, status: "启用", sortOrder: 6 },
  { id: "7", code: "TWD", name: "新台币", symbol: "NT$", exchangeRate: 0.220000, isBase: false, decimalPlaces: 2, status: "启用", sortOrder: 7 },
  { id: "8", code: "KRW", name: "韩元", symbol: "₩", exchangeRate: 0.005400, isBase: false, decimalPlaces: 0, status: "启用", sortOrder: 8 },
];

export function CurrencySettingsPage() {
  const [currencies, setCurrencies] = useState<Currency[]>(DEFAULT_CURRENCIES);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Currency>>({});
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<typeof ALL_CURRENCY_PRESETS[0] | null>(null);
  const [newExchangeRate, setNewExchangeRate] = useState<string>("");

  // 确认弹窗状态
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: "setBase" | "delete" | "toggleStatus";
    data?: Currency;
  }>({ open: false, type: "setBase" });

  // 提示弹窗状态
  const [alertModal, setAlertModal] = useState<{
    open: boolean;
    title: string;
    description?: string;
    type: "warning" | "info" | "error";
  }>({ open: false, title: "", type: "info" });

  // 过滤已添加的币种代码
  const addedCodes = currencies.map(c => c.code);
  
  // 判断币种是否已添加
  const isCurrencyAdded = (code: string) => addedCodes.includes(code);

  // 过滤预设币种（搜索）
  const filteredPresets = ALL_CURRENCY_PRESETS.filter(preset => {
    if (!pickerSearch) return true;
    const search = pickerSearch.toLowerCase();
    return (
      preset.code.toLowerCase().includes(search) ||
      preset.name.toLowerCase().includes(search) ||
      preset.country.toLowerCase().includes(search)
    );
  });

  // 按洲分组
  const asiaCodes = ["CNY", "HKD", "MOP", "TWD", "JPY", "KRW", "KPW", "MNT", "VND", "LAK", "KHR", "THB", "MMK", "MYR", "SGD", "BND", "PHP", "IDR", "INR", "PKR", "LKR", "NPR", "BDT", "BTN", "MVR", "AFN", "IRR", "IQD", "SYP", "LBP", "JOD", "ILS", "SAR", "AED", "QAR", "KWD", "BHD", "OMR", "YER"];
  const europeCodes = ["EUR", "GBP", "CHF", "NOK", "SEK", "DKK", "ISK", "PLN", "CZK", "HUF", "RON", "BGN", "HRK", "RSD", "MKD", "ALL", "BAM", "TRY", "RUB", "UAH", "BYN", "MDL", "GEL", "AMD", "AZN"];
  const africaCodes = ["EGP", "LYD", "TND", "DZD", "MAD", "MUR", "ZAR", "NAD", "BWP", "ZWL", "ZMW", "MWK", "MZN", "TZS", "KES", "UGX", "RWF", "BIF", "ETB", "SOS", "DJF", "ERN", "SDG", "SSP", "NGN", "GHS", "XOF", "XAF", "AOA", "CDF", "GMD", "GNF", "SLL", "LRD", "CVE"];
  const northAmericaCodes = ["USD", "CAD", "MXN", "GTQ", "BZD", "HNL", "NIO", "CRC", "PAB", "JMD", "HTG", "DOP", "CUP", "TTD", "BBD", "XCD"];
  const southAmericaCodes = ["BRL", "ARS", "CLP", "PEN", "BOB", "PYG", "UYU", "COP", "VEF", "GYD", "SRD"];
  const oceaniaCodes = ["AUD", "NZD", "FJD", "PGK", "SBD", "VUV", "TOP", "WST", "KID", "TVD"];

  const groupedPresets = [
    { name: "亚洲", codes: asiaCodes, items: filteredPresets.filter(p => asiaCodes.includes(p.code)) },
    { name: "欧洲", codes: europeCodes, items: filteredPresets.filter(p => europeCodes.includes(p.code)) },
    { name: "非洲", codes: africaCodes, items: filteredPresets.filter(p => africaCodes.includes(p.code)) },
    { name: "北美洲", codes: northAmericaCodes, items: filteredPresets.filter(p => northAmericaCodes.includes(p.code)) },
    { name: "南美洲", codes: southAmericaCodes, items: filteredPresets.filter(p => southAmericaCodes.includes(p.code)) },
    { name: "大洋洲", codes: oceaniaCodes, items: filteredPresets.filter(p => oceaniaCodes.includes(p.code)) },
  ].filter(g => g.items.length > 0);

  const baseCurrency = currencies.find(c => c.isBase);

  // 过滤表格数据
  const filteredCurrencies = currencies.filter(c => 
    c.code.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    c.name.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  // 设为本位币
  const handleSetBase = (currency: Currency) => {
    setConfirmModal({
      open: true,
      type: "setBase",
      data: currency,
    });
  };

  const confirmSetBase = () => {
    if (!confirmModal.data) return;
    setCurrencies(prev => prev.map(c => ({
      ...c,
      isBase: c.id === confirmModal.data!.id,
      exchangeRate: c.id === confirmModal.data!.id ? 1 : c.exchangeRate,
    })));
    setConfirmModal({ open: false, type: "setBase" });
  };

  // 切换状态
  const handleToggleStatus = (currency: Currency) => {
    if (currency.isBase) {
      setAlertModal({
        open: true,
        title: "操作失败",
        description: "本位币不能停用",
        type: "warning",
      });
      return;
    }
    setCurrencies(prev => prev.map(c => 
      c.id === currency.id ? { ...c, status: c.status === "启用" ? "停用" : "启用" } : c
    ));
  };

  // 删除
  const handleDelete = (currency: Currency) => {
    if (currency.isBase) {
      setAlertModal({
        open: true,
        title: "操作失败",
        description: "本位币不能删除",
        type: "warning",
      });
      return;
    }
    setConfirmModal({
      open: true,
      type: "delete",
      data: currency,
    });
  };

  const confirmDelete = () => {
    if (!confirmModal.data) return;
    setCurrencies(prev => prev.filter(c => c.id !== confirmModal.data!.id));
    setConfirmModal({ open: false, type: "delete" });
  };

  // 编辑
  const handleEdit = (currency: Currency) => {
    setEditingId(currency.id);
    setEditForm({ ...currency });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    setCurrencies(prev => prev.map(c => 
      c.id === editingId ? { ...c, ...editForm } as Currency : c
    ));
    setEditingId(null);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // 新增
  const handleSelectCurrency = (preset: typeof ALL_CURRENCY_PRESETS[0]) => {
    setSelectedCurrency(preset);
    setNewExchangeRate("1");
    setShowPicker(false);
    setPickerSearch("");
  };

  const handleConfirmAdd = () => {
    if (!selectedCurrency) return;
    const id = Date.now().toString();
    setCurrencies(prev => [...prev, {
      id,
      code: selectedCurrency.code,
      name: selectedCurrency.name,
      symbol: selectedCurrency.symbol,
      exchangeRate: parseFloat(newExchangeRate) || 1,
      isBase: false,
      decimalPlaces: selectedCurrency.decimalPlaces,
      status: "启用",
      sortOrder: prev.length + 1,
    }]);
    setSelectedCurrency(null);
    setNewExchangeRate("");
  };

  const handleCancelSelect = () => {
    setSelectedCurrency(null);
    setNewExchangeRate("");
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 页面头部 */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">币别设置</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              本位币：{baseCurrency?.name}（{baseCurrency?.code}）
            </p>
          </div>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white h-8"
            size="sm"
            onClick={() => setShowPicker(!showPicker)}
          >
            {showPicker ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1.5" />
                收起选择
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1.5" />
                新增币种
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 币种选择面板 - 页面内展开 */}
      {showPicker && (
        <div className="border-b border-amber-200 bg-gradient-to-b from-amber-50/50 to-white animate-in slide-in-from-top-2 duration-200">
          {/* 搜索栏 */}
          <div className="px-6 py-3 border-b border-amber-100">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索国家、币种名称或代码..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                autoFocus
              />
            </div>
          </div>

          {/* 币种列表 */}
          <div className="max-h-80 overflow-y-auto px-6 py-3">
            {filteredPresets.length === 0 ? (
              <div className="py-8 text-center">
                <Globe className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">未找到匹配的币种</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedPresets.map(group => (
                  <div key={group.name}>
                    <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-2">
                      <span>{group.name}</span>
                      <span className="text-slate-400">({group.items.length})</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                      {group.items.map(preset => {
                        const added = isCurrencyAdded(preset.code);
                        return (
                          <button
                            key={preset.code}
                            onClick={() => !added && handleSelectCurrency(preset)}
                            disabled={added}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all",
                              added
                                ? "bg-slate-50 cursor-not-allowed opacity-50"
                                : "bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 cursor-pointer"
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded flex items-center justify-center text-sm font-medium shrink-0",
                              added ? "bg-slate-100 text-slate-400" : "bg-amber-50 text-amber-600"
                            )}>
                              {preset.symbol}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={cn(
                                "text-xs font-medium truncate",
                                added ? "text-slate-400" : "text-slate-700"
                              )}>
                                {preset.country}
                              </div>
                              <div className="text-xs text-slate-400 truncate">
                                {preset.code}
                              </div>
                            </div>
                            {added && (
                              <Check className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 选中币种后的确认面板 - 页面内展开 */}
      {selectedCurrency && (
        <div className="border-b border-amber-200 bg-gradient-to-b from-amber-50 to-white animate-in slide-in-from-top-2 duration-200">
          <div className="px-6 py-4">
            <div className="flex items-center gap-6">
              {/* 币种信息 */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-medium bg-amber-100 text-amber-600">
                  {selectedCurrency.symbol}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700">{selectedCurrency.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {selectedCurrency.code} · {selectedCurrency.country} · {selectedCurrency.decimalPlaces}位小数
                  </div>
                </div>
              </div>

              {/* 汇率输入 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">1 {selectedCurrency.code} =</span>
                <input
                  type="number"
                  step="0.000001"
                  value={newExchangeRate}
                  onChange={(e) => setNewExchangeRate(e.target.value)}
                  className="w-28 h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  placeholder="汇率"
                />
                <span className="text-sm text-slate-500">{baseCurrency?.code}</span>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-slate-600 hover:bg-slate-100"
                  onClick={handleCancelSelect}
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  className="h-8 bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={handleConfirmAdd}
                >
                  <Check className="h-4 w-4 mr-1" />
                  确认添加
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 工具栏 */}
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索币种..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="h-8 pl-8 pr-3 w-48 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
          </div>
          <div className="text-xs text-slate-500">
            共 {filteredCurrencies.length} 种币种
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-6">
        <Card className="border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 w-16">序号</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 w-20">币种代码</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">币种名称</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 w-16">符号</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 w-32">汇率</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 w-20">本位币</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 w-20">小数位</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 w-20">状态</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 w-28">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredCurrencies.map((currency, index) => (
                  <tr
                    key={currency.id}
                    className={cn(
                      "border-b border-slate-100 hover:bg-amber-50/50 transition-colors",
                      currency.isBase && "bg-amber-50/30"
                    )}
                  >
                    <td className="py-3 px-4 text-sm text-slate-500">{index + 1}</td>
                    <td className="py-3 px-4">
                      {editingId === currency.id ? (
                        <input
                          type="text"
                          value={editForm.code || ""}
                          onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                          className="w-16 h-8 px-2 text-sm border border-amber-400 rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                          maxLength={3}
                        />
                      ) : (
                        <span className="text-sm font-mono font-medium text-slate-700">{currency.code}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingId === currency.id ? (
                        <input
                          type="text"
                          value={editForm.name || ""}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-32 h-8 px-2 text-sm border border-amber-400 rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      ) : (
                        <span className="text-sm text-slate-700">{currency.name}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingId === currency.id ? (
                        <input
                          type="text"
                          value={editForm.symbol || ""}
                          onChange={(e) => setEditForm({ ...editForm, symbol: e.target.value })}
                          className="w-16 h-8 px-2 text-sm border border-amber-400 rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      ) : (
                        <span className="text-sm text-slate-600">{currency.symbol}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {editingId === currency.id ? (
                        <input
                          type="number"
                          step="0.000001"
                          value={editForm.exchangeRate || ""}
                          onChange={(e) => setEditForm({ ...editForm, exchangeRate: parseFloat(e.target.value) })}
                          className="w-24 h-8 px-2 text-sm text-right border border-amber-400 rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                          disabled={editForm.isBase}
                        />
                      ) : (
                        <span className="text-sm text-slate-700 font-mono">
                          {currency.exchangeRate.toFixed(6)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => !currency.isBase && handleSetBase(currency)}
                        disabled={currency.isBase}
                        className={cn(
                          "inline-flex items-center justify-center w-6 h-6 rounded transition-colors",
                          currency.isBase
                            ? "text-amber-500 cursor-default"
                            : "text-slate-300 hover:text-amber-400 hover:bg-amber-50 cursor-pointer"
                        )}
                        title={currency.isBase ? "当前本位币" : "设为本位币"}
                      >
                        <Star className="h-4 w-4 fill-current" />
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {editingId === currency.id ? (
                        <input
                          type="number"
                          min={0}
                          max={4}
                          value={editForm.decimalPlaces ?? 2}
                          onChange={(e) => setEditForm({ ...editForm, decimalPlaces: parseInt(e.target.value) || 0 })}
                          className="w-12 h-8 px-2 text-sm text-center border border-amber-400 rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      ) : (
                        <span className="text-sm text-slate-600">{currency.decimalPlaces}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(currency)}
                        disabled={currency.isBase}
                        className={cn(
                          "relative inline-flex h-4 w-7 items-center rounded-full transition-colors",
                          currency.status === "启用"
                            ? "bg-green-500"
                            : "bg-slate-300",
                          currency.isBase && "opacity-50 cursor-not-allowed"
                        )}
                        title={currency.isBase ? "本位币不能停用" : "点击切换状态"}
                      >
                        <span
                          className={cn(
                            "inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform",
                            currency.status === "启用" ? "translate-x-3.5" : "translate-x-0.5"
                          )}
                        />
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {editingId === currency.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-amber-600 hover:bg-amber-50"
                              onClick={handleSaveEdit}
                            >
                              保存
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-slate-500 hover:bg-slate-50"
                              onClick={handleCancelEdit}
                            >
                              取消
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                              onClick={() => handleEdit(currency)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(currency)}
                              disabled={currency.isBase}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* 确认弹窗 */}
      <ConfirmModal
        open={confirmModal.open}
        onOpenChange={(open) => setConfirmModal(prev => ({ ...prev, open }))}
        title={
          confirmModal.type === "setBase"
            ? "设为本位币"
            : "删除币种"
        }
        description={
          confirmModal.type === "setBase"
            ? `确定要将「${confirmModal.data?.name}」设为本位币吗？设置后该币种汇率将变为1。`
            : `确定要删除「${confirmModal.data?.name}」吗？删除后不可恢复。`
        }
        type={confirmModal.type === "delete" ? "danger" : "warning"}
        confirmText={confirmModal.type === "delete" ? "确认删除" : "确认"}
        onConfirm={confirmModal.type === "delete" ? confirmDelete : confirmSetBase}
      />

      {/* 提示弹窗 */}
      <AlertModal
        open={alertModal.open}
        onOpenChange={(open) => setAlertModal(prev => ({ ...prev, open }))}
        title={alertModal.title}
        description={alertModal.description}
        type={alertModal.type}
      />
    </div>
  );
}

export default CurrencySettingsPage;
