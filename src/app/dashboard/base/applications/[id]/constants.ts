import type { 
  ApprovalStatus, 
  ApplicationFormData, 
  NewApplicationFormData,
  StatusConfigItem, 
  RoleConfigItem 
} from "./types";

// 状态配置
export const statusConfig: Record<ApprovalStatus, StatusConfigItem> = {
  draft: { label: "草稿", className: "bg-gray-50 text-gray-600 border-gray-200" },
  pending: { label: "待审批", className: "bg-blue-50 text-blue-600 border-blue-200" },
  approved: { label: "已通过", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  rejected: { label: "已驳回", className: "bg-red-50 text-red-600 border-red-200" },
};

// 职务配置
export const roleConfig: Record<string, RoleConfigItem> = {
  legal_person: { label: "法人代表", description: "公司法定代表人" },
  supervisor: { label: "监事", description: "负责监督公司运营" },
  finance_manager: { label: "财务负责人", description: "负责公司财务管理" },
  ewt_contact: { label: "e窗通登录联系人", description: "负责登录e窗通办理业务" },
};

// 步骤配置
export const formSteps = [
  { id: "basic", title: "基本信息", description: "企业名称、注册信息等" },
  { id: "address", title: "地址信息", description: "注册地址、邮寄地址等" },
  { id: "personnel", title: "人员信息", description: "法人、监事、财务等" },
  { id: "shareholder", title: "股东信息", description: "股东及出资情况" },
  { id: "business", title: "经营信息", description: "经营范围、中介等" },
] as const;

// 必填职务
export const requiredRoles = [
  { key: "legal_person", label: "法人代表" },
  { key: "supervisor", label: "监事" },
  { key: "finance_manager", label: "财务负责人" },
  { key: "ewt_contact", label: "e窗通登录联系人" },
];

// 初始表单数据
export const initialFormData: ApplicationFormData = {
  applicationNo: "",
  applicationDate: "",
  approvalStatus: "draft",
  enterpriseName: "",
  enterpriseNameBackups: [],
  registeredCapital: "",
  currencyType: "CNY",
  taxType: "",
  expectedAnnualRevenue: "",
  expectedAnnualTax: "",
  introducerName: "",
  introducerPhone: "",
  originalRegisteredAddress: "",
  mailingAddress: "",
  businessAddress: "",
  personnel: [
    { 
      name: "", phone: "", email: "", address: "", 
      roles: ["legal_person", "finance_manager"],
      idCardFrontKey: "", idCardFrontUrl: "", 
      idCardBackKey: "", idCardBackUrl: "",
    },
    { 
      name: "", phone: "", email: "", address: "", 
      roles: ["supervisor"],
      idCardFrontKey: "", idCardFrontUrl: "", 
      idCardBackKey: "", idCardBackUrl: "",
    },
  ],
  shareholders: [{ 
    type: "natural", name: "", investment: "", phone: "",
    idCardFrontKey: "", idCardFrontUrl: "", 
    idCardBackKey: "", idCardBackUrl: "",
    licenseOriginalKey: "", licenseOriginalUrl: "", 
    licenseCopyKey: "", licenseCopyUrl: "",
  }],
  ewtContactName: "",
  ewtContactPhone: "",
  intermediaryDepartment: "",
  intermediaryName: "",
  intermediaryPhone: "",
  businessScope: "",
  businessScopeIds: [],
  applicationType: "new",
  remarks: "",
};

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
  { value: "new", label: "新建企业" },
  { value: "migration", label: "迁移企业" },
];

// 新建申请初始数据（不含申请编号、日期、状态）
export const initialNewFormData: NewApplicationFormData = {
  enterpriseName: "",
  enterpriseNameBackups: [],
  registeredCapital: "",
  currencyType: "CNY",
  taxType: "",
  expectedAnnualRevenue: "",
  expectedAnnualTax: "",
  introducerName: "",
  introducerPhone: "",
  originalRegisteredAddress: "",
  mailingAddress: "",
  businessAddress: "",
  personnel: [
    { 
      name: "", phone: "", email: "", address: "", 
      roles: ["legal_person", "finance_manager"],
      idCardFrontKey: "", idCardFrontUrl: "", 
      idCardBackKey: "", idCardBackUrl: "",
    },
    { 
      name: "", phone: "", email: "", address: "", 
      roles: ["supervisor"],
      idCardFrontKey: "", idCardFrontUrl: "", 
      idCardBackKey: "", idCardBackUrl: "",
    },
  ],
  shareholders: [{ 
    type: "natural", name: "", investment: "", phone: "",
    idCardFrontKey: "", idCardFrontUrl: "", 
    idCardBackKey: "", idCardBackUrl: "",
    licenseOriginalKey: "", licenseOriginalUrl: "", 
    licenseCopyKey: "", licenseCopyUrl: "",
  }],
  ewtContactName: "",
  ewtContactPhone: "",
  intermediaryDepartment: "",
  intermediaryName: "",
  intermediaryPhone: "",
  businessScope: "",
  businessScopeIds: [],
  applicationType: "new",
  remarks: "",
};
