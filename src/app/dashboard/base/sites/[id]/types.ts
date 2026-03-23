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

// 工位号信息
export interface RegNumber {
  id: string;
  code: string;
  status: "available" | "allocated" | "reserved";
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
  enterpriseId: string | null; // 入驻企业ID
  // 电表
  electricityNumber: string | null;
  electricityType: MeterType;
  electricityBalance: number | null; // 余额
  electricityBalanceUpdatedAt: string | null; // 余额更新时间
  electricityEnterpriseId: string | null;
  // 水表
  waterNumber: string | null;
  waterType: MeterType;
  waterBalance: number | null; // 余额
  waterBalanceUpdatedAt: string | null; // 余额更新时间
  waterEnterpriseId: string | null;
  // 取暖
  heatingNumber: string | null;
  heatingType: MeterType;
  heatingStatus: HeatingStatus;
  heatingEnterpriseId: string | null;
  // 网络
  networkNumber: string | null;
  networkType: MeterType;
  networkStatus: NetworkStatus;
  // 面积
  area: number | null;
  spaces: Space[];
}

// 基地详情
export interface BaseDetail {
  id: string;
  name: string;
  address: string | null;
  status: string;
  meters: Meter[];
}

// 统计信息
export interface StatsInfo {
  totalMeters: number;
  totalSpaces: number;
  totalRegNumbers: number;
  allocatedRegNumbers: number;
}
