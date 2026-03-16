"use client";

import { createContext, useContext } from "react";

// 账套配置接口
export interface LedgerConfig {
  id: string;
  name: string;
  year: number;
  startMonth: number;
  accountingStandard: string;
  taxpayerType: "general" | "small";
  currencyCode: string;
  amountDecimal: number;
  quantityDecimal: number;
  priceDecimal: number;
}

// 账套上下文
interface LedgerContextType {
  ledgerId: string;
  ledgerInfo: LedgerConfig | null;
}

export const LedgerContext = createContext<LedgerContextType | null>(null);

export const useLedger = () => {
  const context = useContext(LedgerContext);
  return context;
};

// 默认账套配置（用于开发/测试）
export const DEFAULT_LEDGER_CONFIG: LedgerConfig = {
  id: "default",
  name: "演示账套",
  year: new Date().getFullYear(),
  startMonth: 1,
  accountingStandard: "small_enterprise",
  taxpayerType: "small",
  currencyCode: "CNY",
  amountDecimal: 2,
  quantityDecimal: 2,
  priceDecimal: 2,
};
