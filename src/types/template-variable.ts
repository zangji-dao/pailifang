/**
 * 合同模板变量系统类型定义
 */

// ============ 变量类型 ============

/** 变量数据类型 */
export type VariableType = 'text' | 'number' | 'date' | 'money' | 'select' | 'computed';

/** 变量分类 */
export type VariableCategory = 'enterprise' | 'contract' | 'location' | 'date' | 'custom';

/** 变量分类标签 */
export const VariableCategoryLabels: Record<VariableCategory, string> = {
  enterprise: '企业信息',
  contract: '合同信息',
  location: '场地信息',
  date: '日期时间',
  custom: '自定义变量',
};

/** 变量类型标签 */
export const VariableTypeLabels: Record<VariableType, string> = {
  text: '文本',
  number: '数字',
  date: '日期',
  money: '金额',
  select: '选择',
  computed: '计算值',
};

// ============ 变量定义 ============

/** 选择项 */
export interface SelectOption {
  value: string;
  label: string;
}

// ============ 计算型变量 ============

/** 计算公式类型 */
export type ComputedFormula = 
  | 'years_between'    // 两个日期间的年数
  | 'months_between'   // 两个日期间的月数
  | 'days_between'     // 两个日期间的天数
  | 'date_range_text'  // 日期范围文本（如：2024年1月1日至2025年12月31日）
  | 'lease_term_text'; // 租赁期限文本（如：共计2年）

/** 计算型变量配置 */
export interface ComputedConfig {
  formula: ComputedFormula;     // 计算公式
  dependsOn: string[];          // 依赖的变量key
  unit?: string;                // 单位（年、月、天）
  format?: string;              // 格式化模板
}

/** 模板变量定义 */
export interface TemplateVariable {
  id: string;
  name: string;              // 显示名称：企业名称
  key: string;               // 变量标识：company_name
  type: VariableType;        // 数据类型
  category: VariableCategory; // 分类
  defaultValue?: string;     // 默认值
  options?: SelectOption[];  // 选择型变量的选项
  placeholder?: string;      // 输入提示
  required?: boolean;        // 是否必填
  computed?: ComputedConfig; // 计算型变量配置（仅 type=computed 时有效）
}

/** 变量绑定位置 */
export interface VariableBinding {
  id: string;                // 绑定ID
  variableKey: string;       // 变量标识
  position: {
    anchorText: string;      // 锚点文本（变量前面的文字）
    offset: number;          // 在锚点后的偏移量
  };
  displayFormat?: string;    // 显示格式（如日期格式）
}

// ============ 预设变量库 ============

/** 预设变量库 */
export const PresetVariables: TemplateVariable[] = [
  // ===== 甲方信息 =====
  {
    id: 'var_party_a_name',
    name: '甲方名称',
    key: 'party_a_name',
    type: 'text',
    category: 'enterprise',
    placeholder: '甲方企业全称',
  },
  {
    id: 'var_party_a_credit_code',
    name: '甲方统一社会信用代码',
    key: 'party_a_credit_code',
    type: 'text',
    category: 'enterprise',
    placeholder: '甲方18位信用代码',
  },
  {
    id: 'var_party_a_legal_person',
    name: '甲方法定代表人',
    key: 'party_a_legal_person',
    type: 'text',
    category: 'enterprise',
    placeholder: '甲方法人姓名',
  },
  {
    id: 'var_party_a_address',
    name: '甲方地址',
    key: 'party_a_address',
    type: 'text',
    category: 'enterprise',
    placeholder: '甲方注册地址',
  },
  {
    id: 'var_party_a_contact',
    name: '甲方联系人',
    key: 'party_a_contact',
    type: 'text',
    category: 'enterprise',
    placeholder: '甲方联系人姓名',
  },
  {
    id: 'var_party_a_phone',
    name: '甲方联系电话',
    key: 'party_a_phone',
    type: 'text',
    category: 'enterprise',
    placeholder: '甲方联系电话',
  },
  {
    id: 'var_party_a_bank',
    name: '甲方开户银行',
    key: 'party_a_bank',
    type: 'text',
    category: 'enterprise',
    placeholder: '甲方开户银行',
  },
  {
    id: 'var_party_a_account',
    name: '甲方银行账号',
    key: 'party_a_account',
    type: 'text',
    category: 'enterprise',
    placeholder: '甲方银行账号',
  },

  // ===== 乙方信息 =====
  {
    id: 'var_party_b_name',
    name: '乙方名称',
    key: 'party_b_name',
    type: 'text',
    category: 'enterprise',
    placeholder: '乙方企业全称',
    required: true,
  },
  {
    id: 'var_party_b_credit_code',
    name: '乙方统一社会信用代码',
    key: 'party_b_credit_code',
    type: 'text',
    category: 'enterprise',
    placeholder: '乙方18位信用代码',
    required: true,
  },
  {
    id: 'var_party_b_legal_person',
    name: '乙方法定代表人',
    key: 'party_b_legal_person',
    type: 'text',
    category: 'enterprise',
    placeholder: '乙方法人姓名',
  },
  {
    id: 'var_party_b_address',
    name: '乙方地址',
    key: 'party_b_address',
    type: 'text',
    category: 'enterprise',
    placeholder: '乙方注册地址',
  },
  {
    id: 'var_party_b_contact',
    name: '乙方联系人',
    key: 'party_b_contact',
    type: 'text',
    category: 'enterprise',
    placeholder: '乙方联系人姓名',
  },
  {
    id: 'var_party_b_phone',
    name: '乙方联系电话',
    key: 'party_b_phone',
    type: 'text',
    category: 'enterprise',
    placeholder: '乙方联系电话',
  },
  {
    id: 'var_party_b_bank',
    name: '乙方开户银行',
    key: 'party_b_bank',
    type: 'text',
    category: 'enterprise',
    placeholder: '乙方开户银行',
  },
  {
    id: 'var_party_b_account',
    name: '乙方银行账号',
    key: 'party_b_account',
    type: 'text',
    category: 'enterprise',
    placeholder: '乙方银行账号',
  },

  // ===== 合同信息 =====
  {
    id: 'var_contract_number',
    name: '合同编号',
    key: 'contract_number',
    type: 'text',
    category: 'contract',
    placeholder: '合同编号',
  },
  {
    id: 'var_contract_amount',
    name: '合同金额',
    key: 'contract_amount',
    type: 'money',
    category: 'contract',
    placeholder: '合同总金额',
    required: true,
  },
  {
    id: 'var_contract_amount_cn',
    name: '合同金额（大写）',
    key: 'contract_amount_cn',
    type: 'text',
    category: 'contract',
    placeholder: '金额大写（自动转换）',
  },
  {
    id: 'var_rent',
    name: '租金',
    key: 'rent',
    type: 'money',
    category: 'contract',
    placeholder: '月租金/年租金',
  },
  {
    id: 'var_deposit',
    name: '押金',
    key: 'deposit',
    type: 'money',
    category: 'contract',
    placeholder: '履约保证金',
  },
  {
    id: 'var_service_fee',
    name: '服务费',
    key: 'service_fee',
    type: 'money',
    category: 'contract',
    placeholder: '服务费用',
  },
  {
    id: 'var_payment_method',
    name: '付款方式',
    key: 'payment_method',
    type: 'select',
    category: 'contract',
    options: [
      { value: 'monthly', label: '按月支付' },
      { value: 'quarterly', label: '按季支付' },
      { value: 'yearly', label: '按年支付' },
      { value: 'once', label: '一次性支付' },
    ],
  },

  // ===== 场地信息 =====
  {
    id: 'var_room_number',
    name: '房间号',
    key: 'room_number',
    type: 'text',
    category: 'location',
    placeholder: '如：A栋301室',
  },
  {
    id: 'var_building_area',
    name: '建筑面积',
    key: 'building_area',
    type: 'number',
    category: 'location',
    placeholder: '平方米',
  },
  {
    id: 'var_use_area',
    name: '使用面积',
    key: 'use_area',
    type: 'number',
    category: 'location',
    placeholder: '实际使用面积',
  },
  {
    id: 'var_address',
    name: '详细地址',
    key: 'address',
    type: 'text',
    category: 'location',
    placeholder: '完整地址',
  },

  // ===== 日期时间 =====
  {
    id: 'var_sign_date',
    name: '签订日期',
    key: 'sign_date',
    type: 'date',
    category: 'date',
    placeholder: '合同签署日期',
    required: true,
  },
  {
    id: 'var_start_date',
    name: '开始日期',
    key: 'start_date',
    type: 'date',
    category: 'date',
    placeholder: '合同生效日期',
  },
  {
    id: 'var_end_date',
    name: '结束日期',
    key: 'end_date',
    type: 'date',
    category: 'date',
    placeholder: '合同到期日期',
  },
  {
    id: 'var_lease_term',
    name: '租赁期限',
    key: 'lease_term',
    type: 'text',
    category: 'date',
    placeholder: '如：2024年1月1日至2025年12月31日',
  },
  {
    id: 'var_payment_day',
    name: '付款日',
    key: 'payment_day',
    type: 'text',
    category: 'date',
    placeholder: '如：每月5日前',
  },

  // ===== 计算型变量 =====
  {
    id: 'var_lease_years',
    name: '租赁年限',
    key: 'lease_years',
    type: 'computed',
    category: 'date',
    placeholder: '根据开始/结束日期自动计算',
    computed: {
      formula: 'years_between',
      dependsOn: ['start_date', 'end_date'],
      unit: '年',
    },
  },
  {
    id: 'var_lease_months',
    name: '租赁月数',
    key: 'lease_months',
    type: 'computed',
    category: 'date',
    placeholder: '根据开始/结束日期自动计算',
    computed: {
      formula: 'months_between',
      dependsOn: ['start_date', 'end_date'],
      unit: '个月',
    },
  },
  {
    id: 'var_lease_days',
    name: '租赁天数',
    key: 'lease_days',
    type: 'computed',
    category: 'date',
    placeholder: '根据开始/结束日期自动计算',
    computed: {
      formula: 'days_between',
      dependsOn: ['start_date', 'end_date'],
      unit: '天',
    },
  },
  {
    id: 'var_lease_term_auto',
    name: '租赁期限（自动）',
    key: 'lease_term_auto',
    type: 'computed',
    category: 'date',
    placeholder: '自动生成：2024年1月1日至2025年12月31日',
    computed: {
      formula: 'date_range_text',
      dependsOn: ['start_date', 'end_date'],
    },
  },
  {
    id: 'var_lease_summary',
    name: '租赁期限摘要',
    key: 'lease_summary',
    type: 'computed',
    category: 'date',
    placeholder: '自动生成：共计2年',
    computed: {
      formula: 'lease_term_text',
      dependsOn: ['start_date', 'end_date'],
    },
  },
];

/** 按分类获取预设变量 */
export function getVariablesByCategory(category: VariableCategory): TemplateVariable[] {
  return PresetVariables.filter(v => v.category === category);
}

/** 根据key获取变量 */
export function getVariableByKey(key: string): TemplateVariable | undefined {
  return PresetVariables.find(v => v.key === key);
}

// ============ 计算型变量工具函数 ============

/**
 * 计算两个日期之间的年数
 */
export function calculateYearsBetween(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  
  let years = end.getFullYear() - start.getFullYear();
  
  // 如果结束日期的月份小于开始日期的月份，或者月份相同但日期小于开始日期，则减去1年
  if (
    end.getMonth() < start.getMonth() || 
    (end.getMonth() === start.getMonth() && end.getDate() < start.getDate())
  ) {
    years--;
  }
  
  return Math.max(0, years);
}

/**
 * 计算两个日期之间的月数
 */
export function calculateMonthsBetween(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  
  let months = (end.getFullYear() - start.getFullYear()) * 12;
  months += end.getMonth() - start.getMonth();
  
  // 如果结束日期的日期小于开始日期的日期，则减去1个月
  if (end.getDate() < start.getDate()) {
    months--;
  }
  
  return Math.max(0, months);
}

/**
 * 计算两个日期之间的天数
 */
export function calculateDaysBetween(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * 格式化日期为中文格式
 */
function formatDateChinese(dateStr: string): string {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

/**
 * 计算租赁期限文本（如：2024年1月1日至2025年12月31日）
 */
export function calculateDateRangeText(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return '';
  
  const start = formatDateChinese(startDate);
  const end = formatDateChinese(endDate);
  
  if (!start || !end) return '';
  
  return `${start}至${end}`;
}

/**
 * 计算租赁期限摘要（如：共计2年）
 */
export function calculateLeaseTermText(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return '';
  
  const years = calculateYearsBetween(startDate, endDate);
  const months = calculateMonthsBetween(startDate, endDate);
  
  if (years > 0) {
    const remainingMonths = months % 12;
    if (remainingMonths > 0) {
      return `共计${years}年${remainingMonths}个月`;
    }
    return `共计${years}年`;
  }
  
  if (months > 0) {
    return `共计${months}个月`;
  }
  
  const days = calculateDaysBetween(startDate, endDate);
  if (days > 0) {
    return `共计${days}天`;
  }
  
  return '';
}

/**
 * 计算型变量的计算函数
 * @param variable 变量定义
 * @param values 所有变量的值（key-value 对象）
 * @returns 计算结果
 */
export function computeVariableValue(
  variable: TemplateVariable, 
  values: Record<string, string>
): string {
  if (variable.type !== 'computed' || !variable.computed) {
    return values[variable.key] || '';
  }
  
  const { formula, dependsOn } = variable.computed;
  
  // 获取依赖变量的值
  const depValues = dependsOn.map(key => values[key] || '');
  
  // 如果有任何依赖变量为空，返回空字符串
  if (depValues.some(v => !v)) {
    return '';
  }
  
  switch (formula) {
    case 'years_between':
      return String(calculateYearsBetween(depValues[0], depValues[1]));
    
    case 'months_between':
      return String(calculateMonthsBetween(depValues[0], depValues[1]));
    
    case 'days_between':
      return String(calculateDaysBetween(depValues[0], depValues[1]));
    
    case 'date_range_text':
      return calculateDateRangeText(depValues[0], depValues[1]);
    
    case 'lease_term_text':
      return calculateLeaseTermText(depValues[0], depValues[1]);
    
    default:
      return '';
  }
}
