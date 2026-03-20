// 申请审批状态
export type ApprovalStatus = "draft" | "pending" | "approved" | "rejected";

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

// 申请表单数据
export interface ApplicationFormData {
  applicationNo: string;
  applicationDate: string;
  approvalStatus: ApprovalStatus;
  enterpriseName: string;
  enterpriseNameBackups: string[];
  registeredCapital: string;
  currencyType: string;
  taxType: TaxType | "";
  expectedAnnualRevenue: string;
  expectedAnnualTax: string;
  introducerName: string;
  introducerPhone: string;
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

// 状态配置
export interface StatusConfigItem {
  label: string;
  className: string;
}

// 职务配置
export interface RoleConfigItem {
  label: string;
  description: string;
}
