// 申请类型
export type ApplicationType = "new" | "migration";

// 纳税人类型
export type TaxType = "general" | "small_scale";

// 股东类型
export type ShareholderType = "natural" | "enterprise";

// 股东信息
export interface Shareholder {
  type: ShareholderType;
  name: string;
  investment: string;
  phone: string;
  // 自然人股东 - 身份证
  idCardFrontKey?: string;
  idCardFrontUrl?: string;
  idCardBackKey?: string;
  idCardBackUrl?: string;
  // 企业股东 - 营业执照
  licenseOriginalKey?: string;
  licenseOriginalUrl?: string;
  licenseCopyKey?: string;
  licenseCopyUrl?: string;
}

// 人员信息
export interface Personnel {
  name: string;
  phone: string;
  email: string;
  address: string;
  roles: string[];
  idCardFrontKey: string;
  idCardFrontUrl: string;
  idCardBackKey: string;
  idCardBackUrl: string;
}

// 表单数据
export interface FormData {
  id: string;
  applicationNo: string;
  enterpriseName: string;
  enterpriseNameBackups: string[];
  registeredCapital: string;
  currencyType: string;
  taxType: TaxType | "";
  expectedAnnualRevenue: string;
  expectedAnnualTax: string;
  originalRegisteredAddress: string;
  mailingAddress: string;
  businessAddress: string;
  personnel: Personnel[];
  shareholders: Shareholder[];
  ewtContactName: string;
  ewtContactPhone: string;
  intermediaryDepartment: string;
  intermediaryName: string;
  intermediaryPhone: string;
  businessScope: string;
  applicationType: ApplicationType | "";
  remarks: string;
}

// 职务配置
export const roleConfig: Record<string, { label: string; description: string }> = {
  legal_person: { label: "法人代表", description: "公司法定代表人" },
  supervisor: { label: "监事", description: "负责监督公司运营" },
  finance_manager: { label: "财务负责人", description: "负责公司财务管理" },
  ewt_contact: { label: "e窗通登录联系人", description: "负责登录e窗通办理业务" },
};

// 必填职务
export const requiredRoles = [
  { key: "legal_person", label: "法人代表" },
  { key: "supervisor", label: "监事" },
  { key: "finance_manager", label: "财务负责人" },
  { key: "ewt_contact", label: "e窗通登录联系人" },
];

// 步骤配置
export const formSteps = [
  { id: "basic", title: "基本信息", description: "企业名称、注册信息等" },
  { id: "address", title: "地址信息", description: "注册地址、邮寄地址等" },
  { id: "personnel", title: "人员信息", description: "法人、监事、财务等" },
  { id: "shareholder", title: "股东信息", description: "股东及出资情况" },
  { id: "business", title: "经营信息", description: "经营范围、中介等" },
] as const;

// 货币选项
export const currencyOptions = [
  { value: "CNY", label: "人民币" },
  { value: "USD", label: "美元" },
  { value: "EUR", label: "欧元" },
];

// 纳税人类型选项
export const taxTypeOptions = [
  { value: "general", label: "一般纳税人" },
  { value: "small_scale", label: "小规模纳税人" },
];

// 申请类型选项
export const applicationTypeOptions = [
  { value: "new", label: "新注册" },
  { value: "migration", label: "迁移" },
];

// 初始表单数据
export const initialFormData: FormData = {
  id: "",
  applicationNo: "",
  enterpriseName: "",
  enterpriseNameBackups: [],
  registeredCapital: "",
  currencyType: "CNY",
  taxType: "",
  expectedAnnualRevenue: "",
  expectedAnnualTax: "",
  originalRegisteredAddress: "",
  mailingAddress: "",
  businessAddress: "",
  personnel: [
    {
      name: "",
      phone: "",
      email: "",
      address: "",
      roles: ["legal_person", "finance_manager"],
      idCardFrontKey: "",
      idCardFrontUrl: "",
      idCardBackKey: "",
      idCardBackUrl: "",
    },
    {
      name: "",
      phone: "",
      email: "",
      address: "",
      roles: ["supervisor"],
      idCardFrontKey: "",
      idCardFrontUrl: "",
      idCardBackKey: "",
      idCardBackUrl: "",
    },
  ],
  shareholders: [
    {
      type: "natural",
      name: "",
      investment: "",
      phone: "",
      idCardFrontKey: "",
      idCardFrontUrl: "",
      idCardBackKey: "",
      idCardBackUrl: "",
      licenseOriginalKey: "",
      licenseOriginalUrl: "",
      licenseCopyKey: "",
      licenseCopyUrl: "",
    },
  ],
  ewtContactName: "",
  ewtContactPhone: "",
  intermediaryDepartment: "",
  intermediaryName: "",
  intermediaryPhone: "",
  businessScope: "",
  applicationType: "",
  remarks: "",
};
