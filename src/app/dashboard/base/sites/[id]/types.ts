// 表号类型
export type MeterType = "base" | "customer";

// 网络状态
export type NetworkStatus = "normal" | "arrears" | "not_applicable";

// 取暖状态
export type HeatingStatus = "full" | "base" | "arrears" | "not_applicable";

// 企业信息
export interface Enterprise {
  id: string;
  name: string;
}

export interface BaseEnterprise extends Enterprise {
  relationId: string;
  relationType: "tenant" | "service";
  relationStatus: string;
  source: string;
  startedAt: string | null;
  endedAt: string | null;
  enterpriseCode: string | null;
  creditCode: string | null;
  legalPerson: string | null;
  phone: string | null;
  adminName: string | null;
  adminPhone: string | null;
  processStatus: string;
  type: string;
  status: string;
  industry: string | null;
  registeredAddress: string | null;
  businessAddress: string | null;
  settledDate: string | null;
  assignedWorkstationCount: number;
  locations: string[];
}

export interface UtilityPayment {
  id: string;
  meterId: string;
  utilityType: "electricity" | "water" | "heating" | "network" | "property_fee" | string;
  billingPeriod: string;
  provider: string | null;
  accountNumber: string | null;
  chargeType: string | null;
  quantity: number | string | null;
  quantityUnit: string | null;
  unitPrice: number | string | null;
  amount: number | string;
  status: "pending" | "paid" | "arrears" | "cancelled" | string;
  paidAt: string | null;
  paymentMethod: string | null;
  receiptNumber: string | null;
}

// 工位号信息
export interface RegNumber {
  id: string;
  code: string; // 系统编号（KJ 开头）
  manualCode: string | null; // 人工编号
  spaceId: string;
  enterpriseId: string | null;
  available: boolean; // 是否可用（false = 已分配）
  propertyOwner: string | null; // 产权单位
  managementCompany: string | null; // 管理单位
  assignedEnterpriseName: string | null; // 预分配企业名称
  enterprise?: Enterprise | null;
}

// 物理空间
export interface Space {
  id: string;
  meterId: string;
  code: string;
  name: string;
  area: number | null;
  regNumbers: RegNumber[];
}

// 物业信息
export interface Meter {
  id: string;
  baseId: string;
  code: string;
  name: string;
  sortOrder: number; // 排序号
  // 电表
  electricityEnabled: boolean;
  electricityNumber: string | null;
  electricityProvider: string | null;
  electricityChargeInst: string | null;
  electricityType: MeterType;
  electricityBalance: number | string | null; // 余额
  electricityBalanceUpdatedAt: string | null; // 余额更新时间
  electricityEnterpriseId: string | null;
  // 水表
  waterEnabled: boolean;
  waterNumber: string | null;
  waterProvider: string | null;
  waterChargeInst: string | null;
  waterType: MeterType;
  waterBalance: number | string | null; // 余额
  waterBalanceUpdatedAt: string | null; // 余额更新时间
  waterEnterpriseId: string | null;
  // 取暖
  heatingEnabled: boolean;
  heatingNumber: string | null;
  heatingType: MeterType;
  heatingStatus: HeatingStatus;
  heatingEnterpriseId: string | null;
  propertyFeeEnabled: boolean;
  // 网络
  networkEnabled: boolean;
  networkNumber: string | null;
  networkType: MeterType;
  networkStatus: NetworkStatus;
  // 面积
  area: number | string | null;
  spaces: Space[];
  utilityPayments: UtilityPayment[];
}

export interface BaseOrganization {
  id: string;
  name: string;
  type: string;
  status: string;
  metadata: Record<string, unknown> | null;
}

// 基地详情
export interface BaseDetail {
  id: string;
  name: string;
  address: string | null;
  addressTemplate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  organizationId: string | null;
  organization: BaseOrganization | null;
  managementCompanyName: string | null;
  managementCompanyCreditCode: string | null;
  managementCompanyLegalPerson: string | null;
  managementCompanyAddress: string | null;
  managementCompanyPhone: string | null;
  propertyFeeMode: "charged" | "free";
  propertyFeeBillingCycle: "annual";
  tenantEnterprises: BaseEnterprise[];
  serviceEnterprises: BaseEnterprise[];
  serviceEnterpriseCount: number;
  meters: Meter[];
}

// 统计信息
export interface StatsInfo {
  totalMeters: number;
  totalSpaces: number;
  totalRegNumbers: number;
  allocatedRegNumbers: number;
  tenantEnterpriseCount: number;
  serviceEnterpriseCount: number;
  totalArea: number;
  occupancyRate: number;
  utilityAlertCount: number;
  paidUtilityAmount: number;
}
