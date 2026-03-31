/**
 * 合同模板变量系统类型定义
 */

// ============ 变量类型 ============

/** 变量数据类型 */
export type VariableType = 'text' | 'number' | 'date' | 'money' | 'select';

/** 变量分类 */
export type VariableCategory = 'enterprise' | 'contract' | 'contact' | 'location' | 'date' | 'custom';

/** 变量分类标签 */
export const VariableCategoryLabels: Record<VariableCategory, string> = {
  enterprise: '企业信息',
  contract: '合同信息',
  contact: '联系方式',
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
};

// ============ 变量定义 ============

/** 选择项 */
export interface SelectOption {
  value: string;
  label: string;
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
  // ===== 企业信息 =====
  {
    id: 'var_company_name',
    name: '企业名称',
    key: 'company_name',
    type: 'text',
    category: 'enterprise',
    placeholder: '请输入企业全称',
    required: true,
  },
  {
    id: 'var_company_name_a',
    name: '甲方名称',
    key: 'party_a_name',
    type: 'text',
    category: 'enterprise',
    placeholder: '甲方企业全称',
  },
  {
    id: 'var_company_name_b',
    name: '乙方名称',
    key: 'party_b_name',
    type: 'text',
    category: 'enterprise',
    placeholder: '乙方企业全称',
  },
  {
    id: 'var_credit_code',
    name: '统一社会信用代码',
    key: 'credit_code',
    type: 'text',
    category: 'enterprise',
    placeholder: '18位信用代码',
    required: true,
  },
  {
    id: 'var_legal_person',
    name: '法定代表人',
    key: 'legal_person',
    type: 'text',
    category: 'enterprise',
    placeholder: '法人姓名',
  },
  {
    id: 'var_registered_address',
    name: '注册地址',
    key: 'registered_address',
    type: 'text',
    category: 'enterprise',
    placeholder: '营业执照注册地址',
  },
  {
    id: 'var_bank_name',
    name: '开户银行',
    key: 'bank_name',
    type: 'text',
    category: 'enterprise',
    placeholder: '如：中国工商银行',
  },
  {
    id: 'var_bank_account',
    name: '银行账号',
    key: 'bank_account',
    type: 'text',
    category: 'enterprise',
    placeholder: '银行账号',
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

  // ===== 联系方式 =====
  {
    id: 'var_contact_person',
    name: '联系人',
    key: 'contact_person',
    type: 'text',
    category: 'contact',
    placeholder: '联系人姓名',
  },
  {
    id: 'var_contact_phone',
    name: '联系电话',
    key: 'contact_phone',
    type: 'text',
    category: 'contact',
    placeholder: '手机/座机',
  },
  {
    id: 'var_email',
    name: '电子邮箱',
    key: 'email',
    type: 'text',
    category: 'contact',
    placeholder: '邮箱地址',
  },
  {
    id: 'var_id_card',
    name: '身份证号',
    key: 'id_card',
    type: 'text',
    category: 'contact',
    placeholder: '18位身份证号',
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
];

/** 按分类获取预设变量 */
export function getVariablesByCategory(category: VariableCategory): TemplateVariable[] {
  return PresetVariables.filter(v => v.category === category);
}

/** 根据key获取变量 */
export function getVariableByKey(key: string): TemplateVariable | undefined {
  return PresetVariables.find(v => v.key === key);
}
