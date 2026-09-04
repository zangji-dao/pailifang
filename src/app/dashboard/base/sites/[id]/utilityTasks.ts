import type {
  BaseFeeType,
  FeeBillingCycle,
  Meter,
  MeterFeeConfig,
  UtilityPayment,
} from "./types";

export type ManagedUtilityType = string;
export type UtilityTaskStatus = "missing" | "pending" | "arrears" | "paid" | "exempt";
export type InvoiceTaskStatus = "waiting" | "pending" | "issued" | "not_required";

export interface UtilityTask {
  meter: Meter;
  utilityType: ManagedUtilityType;
  billingPeriod: string;
  payment: UtilityPayment | null;
  status: UtilityTaskStatus;
  invoiceStatus: InvoiceTaskStatus;
}

export const managedUtilityTypes: ManagedUtilityType[] = [
  "electricity",
  "water",
  "heating",
  "property_fee",
  "rent",
  "telephone",
  "network",
];

export const utilityTaskLabels: Record<string, string> = {
  electricity: "电费",
  water: "水费",
  heating: "取暖费",
  property_fee: "物业费",
  rent: "租金",
  telephone: "电话费",
  network: "宽带费",
};

export const utilityTaskCycles: Record<string, FeeBillingCycle> = {
  electricity: "monthly",
  water: "monthly",
  heating: "annual",
  property_fee: "annual",
  rent: "monthly",
  telephone: "monthly",
  network: "monthly",
};

function twoDigits(value: number) {
  return String(value).padStart(2, "0");
}

function getMeterFeeConfig(meter: Meter, type: ManagedUtilityType): MeterFeeConfig | null {
  return meter.feeConfigs?.find(config => config.feeType?.code === type) || null;
}

export function getUtilityLabel(type: ManagedUtilityType, feeTypes: BaseFeeType[] = []) {
  return feeTypes.find(feeType => feeType.code === type)?.name || utilityTaskLabels[type] || type;
}

export function getUtilityCycle(type: ManagedUtilityType, feeTypes: BaseFeeType[] = []): FeeBillingCycle {
  return feeTypes.find(feeType => feeType.code === type)?.billingCycle || utilityTaskCycles[type] || "monthly";
}

export function getUtilityBillingPeriod(
  type: ManagedUtilityType,
  date = new Date(),
  feeTypes: BaseFeeType[] = [],
) {
  const year = date.getFullYear();
  if (getUtilityCycle(type, feeTypes) === "monthly") {
    return `${year}-${twoDigits(date.getMonth() + 1)}`;
  }
  if (type === "heating") {
    return date.getMonth() >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  }
  return String(year);
}

export function isUtilityEnabled(meter: Meter, type: ManagedUtilityType) {
  const feeConfig = getMeterFeeConfig(meter, type);
  if (feeConfig) return feeConfig.enabled && feeConfig.feeType.isActive;
  if (type === "electricity") return meter.electricityEnabled;
  if (type === "water") return meter.waterEnabled;
  if (type === "network") return meter.networkEnabled;
  if (type === "heating") return meter.heatingEnabled;
  if (type === "property_fee") return meter.propertyFeeEnabled;
  return false;
}

export function getUtilityResponsibility(meter: Meter, type: ManagedUtilityType) {
  const feeConfig = getMeterFeeConfig(meter, type);
  if (feeConfig) {
    return { type: feeConfig.responsibilityType, enterpriseId: feeConfig.enterpriseId };
  }
  if (type === "electricity") {
    return { type: meter.electricityType, enterpriseId: meter.electricityEnterpriseId };
  }
  if (type === "water") {
    return { type: meter.waterType, enterpriseId: meter.waterEnterpriseId };
  }
  if (type === "heating") {
    return { type: meter.heatingType, enterpriseId: meter.heatingEnterpriseId };
  }
  if (type === "network") {
    return { type: meter.networkType, enterpriseId: meter.networkEnterpriseId };
  }
  return { type: meter.propertyFeeType, enterpriseId: meter.propertyFeeEnterpriseId };
}

export function getUtilityAccount(meter: Meter, type: ManagedUtilityType) {
  const feeConfig = getMeterFeeConfig(meter, type);
  if (feeConfig) {
    return { accountNumber: feeConfig.accountNumber, provider: feeConfig.provider };
  }
  if (type === "electricity") return { accountNumber: meter.electricityNumber, provider: meter.electricityProvider };
  if (type === "water") return { accountNumber: meter.waterNumber, provider: meter.waterProvider };
  if (type === "heating") return { accountNumber: meter.heatingNumber, provider: null };
  if (type === "network") return { accountNumber: meter.networkNumber, provider: null };
  return { accountNumber: null, provider: null };
}

export function getPaymentForPeriod(
  meter: Meter,
  type: ManagedUtilityType,
  billingPeriod = getUtilityBillingPeriod(type),
) {
  return meter.utilityPayments.find(payment => (
    payment.utilityType === type && payment.billingPeriod === billingPeriod
  )) || null;
}

function getTaskStatus(
  meter: Meter,
  type: ManagedUtilityType,
  payment: UtilityPayment | null,
  propertyFeeMode: "charged" | "free",
): UtilityTaskStatus {
  if (type === "property_fee" && propertyFeeMode === "free") return "exempt";
  if (payment?.status === "paid") return "paid";
  if (payment?.status === "arrears") return "arrears";
  if (payment) return "pending";
  if (type === "network" && meter.networkStatus === "arrears") return "arrears";
  if (type === "heating" && meter.heatingStatus === "arrears") return "arrears";
  return "missing";
}

function getInvoiceStatus(payment: UtilityPayment | null, status: UtilityTaskStatus): InvoiceTaskStatus {
  if (status === "exempt") return "not_required";
  if (status !== "paid" || !payment) return "waiting";
  if (payment.metadata?.invoiceStatus === "issued") return "issued";
  if (payment.metadata?.invoiceStatus === "not_required") return "not_required";
  return "pending";
}

export function buildUtilityTask(
  meter: Meter,
  type: ManagedUtilityType,
  propertyFeeMode: "charged" | "free",
  date = new Date(),
  billingPeriod = getUtilityBillingPeriod(type, date),
): UtilityTask | null {
  if (!isUtilityEnabled(meter, type)) return null;
  const payment = getPaymentForPeriod(meter, type, billingPeriod);
  const status = getTaskStatus(meter, type, payment, propertyFeeMode);
  return {
    meter,
    utilityType: type,
    billingPeriod,
    payment,
    status,
    invoiceStatus: getInvoiceStatus(payment, status),
  };
}

export function buildMeterUtilityTasks(
  meter: Meter,
  propertyFeeMode: "charged" | "free",
  date = new Date(),
  billingPeriods: Partial<Record<ManagedUtilityType, string>> = {},
  feeTypes: BaseFeeType[] = [],
) {
  const effectiveFeeTypes = feeTypes.length > 0
    ? feeTypes
    : meter.feeConfigs?.map(config => config.feeType).filter(Boolean) || [];
  const configuredTypes = meter.feeConfigs
    ?.filter(config => config.feeType?.isActive)
    .map(config => config.feeType.code) || [];
  const availableTypes = configuredTypes.length > 0 ? configuredTypes : managedUtilityTypes;
  return Array.from(new Set(availableTypes))
    .map(type => buildUtilityTask(
      meter,
      type,
      propertyFeeMode,
      date,
      billingPeriods[type] || getUtilityBillingPeriod(type, date, effectiveFeeTypes),
    ))
    .filter((task): task is UtilityTask => task !== null);
}
