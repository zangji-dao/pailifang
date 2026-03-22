// 表号类型
export type MeterType = "base" | "customer";

// 表号状态
export type MeterStatus = "normal" | "abnormal";

// 账单查询结果类型
export interface BillResult {
  billKey: string;
  billDate: string;
  billAmount: string;
  billStatus: string;
  ownerName?: string;
  address?: string;
}

// 查询状态类型
export interface QueryState {
  loading: boolean;
  result: BillResult | null;
  error: string | null;
  needAuth?: boolean;
}

// 授权状态类型
export interface AuthStatus {
  hasAuth: boolean;
  status: 'active' | 'expired' | 'needs_refresh' | 'revoked';
  expiresAt?: Date;
  refreshExpiresAt?: Date;
}

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
  electricityNumber: string | null;
  electricityType: MeterType;
  electricityStatus: MeterStatus;
  electricityEnterpriseId: string | null;
  waterNumber: string | null;
  waterType: MeterType;
  waterStatus: MeterStatus;
  waterEnterpriseId: string | null;
  heatingNumber: string | null;
  heatingType: MeterType;
  heatingStatus: MeterStatus;
  heatingEnterpriseId: string | null;
  networkNumber: string | null;
  networkType: MeterType;
  networkStatus: MeterStatus;
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
