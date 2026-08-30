"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type AccountingModule =
  | "home"
  | "vouchers"
  | "funds"
  | "invoices"
  | "payroll"
  | "assets"
  | "closing"
  | "ledgers"
  | "reports"
  | "tax"
  | "subjects"
  | "auxiliary"
  | "currency"
  | "opening"
  | "ledgerSettings";

export type VoucherStatus = "draft" | "pending" | "posted" | "void";

export interface VoucherEntry {
  id: string;
  summary: string;
  subjectCode: string;
  subjectName: string;
  debit: number;
  credit: number;
}

export interface Voucher {
  id: string;
  voucherNo: string;
  voucherDate: string;
  period: string;
  summary: string;
  attachmentCount: number;
  status: VoucherStatus;
  createdBy: string;
  reviewedBy?: string;
  entries: VoucherEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceRecord {
  id: string;
  type: "sales" | "purchase";
  number: string;
  counterparty: string;
  invoiceDate: string;
  amount: number;
  taxAmount: number;
  status: "pending" | "verified" | "booked";
}

export interface PayrollRecord {
  id: string;
  period: string;
  employees: number;
  grossAmount: number;
  socialInsurance: number;
  individualTax: number;
  netAmount: number;
  status: "draft" | "calculated" | "booked";
}

export interface AssetRecord {
  id: string;
  code: string;
  name: string;
  category: string;
  purchaseDate: string;
  originalValue: number;
  residualRate: number;
  usefulMonths: number;
  depreciatedMonths: number;
  accumulatedDepreciation: number;
  status: "active" | "disposed";
}

export interface AccountingCompany {
  name: string;
  period: string;
  accountingStandard: string;
  taxpayerType: string;
}

export interface AccountingState {
  version: number;
  company: AccountingCompany;
  vouchers: Voucher[];
  invoices: InvoiceRecord[];
  payrolls: PayrollRecord[];
  assets: AssetRecord[];
  closedPeriods: string[];
}

export interface VoucherDraft {
  id?: string;
  voucherDate: string;
  summary: string;
  attachmentCount: number;
  status: VoucherStatus;
  entries: Array<Omit<VoucherEntry, "id"> & { id?: string }>;
}

export const ACCOUNTING_STORAGE_KEY = "pi-cube-accounting-workbench-v2";
export const ACCOUNTING_TODAY = "2026-08-25";

export const SUBJECT_OPTIONS = [
  { code: "1001", name: "库存现金" },
  { code: "1002", name: "银行存款" },
  { code: "1122", name: "应收账款" },
  { code: "1131", name: "应收股利" },
  { code: "1221", name: "其他应收款" },
  { code: "1405", name: "库存商品" },
  { code: "1601", name: "固定资产" },
  { code: "1602", name: "累计折旧" },
  { code: "1701", name: "无形资产" },
  { code: "2001", name: "短期借款" },
  { code: "2202", name: "应付账款" },
  { code: "2211", name: "应付职工薪酬" },
  { code: "2221", name: "应交税费" },
  { code: "2241", name: "其他应付款" },
  { code: "4001", name: "实收资本" },
  { code: "4103", name: "本年利润" },
  { code: "6001", name: "主营业务收入" },
  { code: "6051", name: "其他业务收入" },
  { code: "6401", name: "主营业务成本" },
  { code: "6403", name: "税金及附加" },
  { code: "6601", name: "销售费用" },
  { code: "6602", name: "管理费用" },
  { code: "6603", name: "财务费用" },
  { code: "6801", name: "所得税费用" },
];

function id(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function currentPeriod() {
  return ACCOUNTING_TODAY.slice(0, 7);
}

function dateInPeriod(day: number) {
  return `${currentPeriod()}-${String(day).padStart(2, "0")}`;
}

function entry(
  summary: string,
  subjectCode: string,
  subjectName: string,
  debit = 0,
  credit = 0
): VoucherEntry {
  return { id: id("entry"), summary, subjectCode, subjectName, debit, credit };
}

function seedVoucher(
  voucherNo: string,
  day: number,
  summary: string,
  status: VoucherStatus,
  entries: VoucherEntry[],
  attachmentCount = 0
): Voucher {
  const now = new Date().toISOString();
  return {
    id: id("voucher"),
    voucherNo,
    voucherDate: dateInPeriod(day),
    period: currentPeriod(),
    summary,
    attachmentCount,
    status,
    createdBy: "本地管理员",
    reviewedBy: status === "posted" ? "本地管理员" : undefined,
    entries,
    createdAt: now,
    updatedAt: now,
  };
}

export function createInitialAccountingState(): AccountingState {
  const period = currentPeriod();
  return {
    version: 2,
    company: {
      name: "松原市宇鑫化工有限公司",
      period,
      accountingStandard: "小企业会计准则",
      taxpayerType: "小规模纳税人",
    },
    vouchers: [
      seedVoucher(
        "记-0001",
        2,
        "收到客户技术服务款",
        "posted",
        [
          entry("收到客户技术服务款", "1002", "银行存款", 35700, 0),
          entry("确认技术服务收入", "6001", "主营业务收入", 0, 31592.92),
          entry("确认销项税额", "2221", "应交税费", 0, 4107.08),
        ],
        1
      ),
      seedVoucher(
        "记-0002",
        5,
        "支付办公用品费用",
        "posted",
        [
          entry("采购办公用品", "6602", "管理费用", 3396.23, 0),
          entry("进项税额", "2221", "应交税费", 203.77, 0),
          entry("银行付款", "1002", "银行存款", 0, 3600),
        ],
        2
      ),
      seedVoucher(
        "记-0003",
        10,
        "计提本月职工薪酬",
        "pending",
        [
          entry("计提工资", "6602", "管理费用", 15000, 0),
          entry("应付职工薪酬", "2211", "应付职工薪酬", 0, 15000),
        ]
      ),
      seedVoucher(
        "记-0004",
        12,
        "收到股东投资款",
        "posted",
        [
          entry("收到投资款", "1002", "银行存款", 100000, 0),
          entry("确认实收资本", "4001", "实收资本", 0, 100000),
        ],
        1
      ),
      seedVoucher(
        "记-0005",
        18,
        "支付办公场地租金",
        "draft",
        [
          entry("办公场地租金", "6602", "管理费用", 18000, 0),
          entry("银行付款", "1002", "银行存款", 0, 18000),
        ],
        1
      ),
    ],
    invoices: [
      {
        id: id("invoice"),
        type: "sales",
        number: "260820000001",
        counterparty: "松原市启航科技有限公司",
        invoiceDate: dateInPeriod(2),
        amount: 31592.92,
        taxAmount: 4107.08,
        status: "booked",
      },
      {
        id: id("invoice"),
        type: "purchase",
        number: "260820000032",
        counterparty: "松原市文汇办公用品商行",
        invoiceDate: dateInPeriod(5),
        amount: 3396.23,
        taxAmount: 203.77,
        status: "verified",
      },
      {
        id: id("invoice"),
        type: "purchase",
        number: "260820000117",
        counterparty: "松原市和悦物业有限公司",
        invoiceDate: dateInPeriod(18),
        amount: 18000,
        taxAmount: 0,
        status: "pending",
      },
    ],
    payrolls: [
      {
        id: id("payroll"),
        period,
        employees: 3,
        grossAmount: 15000,
        socialInsurance: 1820,
        individualTax: 0,
        netAmount: 13180,
        status: "calculated",
      },
    ],
    assets: [
      {
        id: id("asset"),
        code: "ZC-0001",
        name: "办公电脑",
        category: "电子设备",
        purchaseDate: `${period}-01`,
        originalValue: 12000,
        residualRate: 5,
        usefulMonths: 36,
        depreciatedMonths: 0,
        accumulatedDepreciation: 0,
        status: "active",
      },
      {
        id: id("asset"),
        code: "ZC-0002",
        name: "办公家具",
        category: "办公设备",
        purchaseDate: `${period}-03`,
        originalValue: 36000,
        residualRate: 5,
        usefulMonths: 60,
        depreciatedMonths: 0,
        accumulatedDepreciation: 0,
        status: "active",
      },
    ],
    closedPeriods: [],
  };
}

function voucherSequence(vouchers: Voucher[]) {
  const max = vouchers.reduce((value, voucher) => {
    const sequence = Number(voucher.voucherNo.split("-").at(-1));
    return Number.isFinite(sequence) ? Math.max(value, sequence) : value;
  }, 0);
  return `记-${String(max + 1).padStart(4, "0")}`;
}

export function voucherTotals(voucher: Pick<Voucher, "entries">) {
  const debit = voucher.entries.reduce((sum, item) => sum + Number(item.debit || 0), 0);
  const credit = voucher.entries.reduce((sum, item) => sum + Number(item.credit || 0), 0);
  return { debit, credit, difference: Number((debit - credit).toFixed(2)) };
}

export interface SubjectBalanceRow {
  code: string;
  name: string;
  debit: number;
  credit: number;
  balance: number;
  direction: "借" | "贷" | "平";
}

export function buildSubjectBalances(vouchers: Voucher[]): SubjectBalanceRow[] {
  const rows = new Map<string, SubjectBalanceRow>();
  vouchers
    .filter((voucher) => voucher.status === "posted")
    .flatMap((voucher) => voucher.entries)
    .forEach((item) => {
      const current = rows.get(item.subjectCode) || {
        code: item.subjectCode,
        name: item.subjectName,
        debit: 0,
        credit: 0,
        balance: 0,
        direction: "平" as const,
      };
      current.debit += Number(item.debit || 0);
      current.credit += Number(item.credit || 0);
      const net = current.debit - current.credit;
      current.balance = Math.abs(net);
      current.direction = net > 0 ? "借" : net < 0 ? "贷" : "平";
      rows.set(item.subjectCode, current);
    });
  return Array.from(rows.values()).sort((a, b) => a.code.localeCompare(b.code));
}

export function calculateOverview(vouchers: Voucher[]) {
  const rows = buildSubjectBalances(vouchers);
  const asset = rows
    .filter((row) => row.code.startsWith("1"))
    .reduce((sum, row) => sum + (row.direction === "借" ? row.balance : -row.balance), 0);
  const liability = rows
    .filter((row) => row.code.startsWith("2"))
    .reduce((sum, row) => sum + (row.direction === "贷" ? row.balance : -row.balance), 0);
  const equity = rows
    .filter((row) => row.code.startsWith("4"))
    .reduce((sum, row) => sum + (row.direction === "贷" ? row.balance : -row.balance), 0);
  const revenue = rows
    .filter((row) => row.code.startsWith("6") && Number(row.code) < 6400)
    .reduce((sum, row) => sum + row.credit - row.debit, 0);
  const expense = rows
    .filter((row) => Number(row.code) >= 6400)
    .reduce((sum, row) => sum + row.debit - row.credit, 0);
  return {
    assets: Number(asset.toFixed(2)),
    liabilities: Number(liability.toFixed(2)),
    equity: Number(equity.toFixed(2)),
    revenue: Number(revenue.toFixed(2)),
    expense: Number(expense.toFixed(2)),
    profit: Number((revenue - expense).toFixed(2)),
  };
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

export function useAccountingStore() {
  const [state, setState] = useState<AccountingState>(() => createInitialAccountingState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ACCOUNTING_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AccountingState;
        if (parsed.version === 2) setState(parsed);
      }
    } catch (error) {
      console.warn("读取本地账簿失败，将使用演示账簿", error);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(ACCOUNTING_STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  const saveVoucher = useCallback((draft: VoucherDraft) => {
    setState((current) => {
      const now = new Date().toISOString();
      const existing = draft.id
        ? current.vouchers.find((voucher) => voucher.id === draft.id)
        : undefined;
      const voucher: Voucher = {
        id: existing?.id || id("voucher"),
        voucherNo: existing?.voucherNo || voucherSequence(current.vouchers),
        voucherDate: draft.voucherDate,
        period: draft.voucherDate.slice(0, 7),
        summary: draft.summary,
        attachmentCount: draft.attachmentCount,
        status: draft.status,
        createdBy: existing?.createdBy || "本地管理员",
        reviewedBy: draft.status === "posted" ? "本地管理员" : undefined,
        entries: draft.entries.map((item) => ({
          ...item,
          id: item.id || id("entry"),
          debit: Number(item.debit || 0),
          credit: Number(item.credit || 0),
        })),
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };
      return {
        ...current,
        vouchers: existing
          ? current.vouchers.map((item) => (item.id === voucher.id ? voucher : item))
          : [voucher, ...current.vouchers],
      };
    });
  }, []);

  const setVoucherStatus = useCallback((voucherId: string, status: VoucherStatus) => {
    setState((current) => ({
      ...current,
      vouchers: current.vouchers.map((voucher) =>
        voucher.id === voucherId
          ? {
              ...voucher,
              status,
              reviewedBy: status === "posted" ? "本地管理员" : voucher.reviewedBy,
              updatedAt: new Date().toISOString(),
            }
          : voucher
      ),
    }));
  }, []);

  const deleteVoucher = useCallback((voucherId: string) => {
    setState((current) => ({
      ...current,
      vouchers: current.vouchers.filter((voucher) => voucher.id !== voucherId),
    }));
  }, []);

  const bookInvoice = useCallback((invoiceId: string) => {
    setState((current) => ({
      ...current,
      invoices: current.invoices.map((invoice) =>
        invoice.id === invoiceId ? { ...invoice, status: "booked" } : invoice
      ),
    }));
  }, []);

  const bookPayroll = useCallback((payrollId: string) => {
    setState((current) => ({
      ...current,
      payrolls: current.payrolls.map((payroll) =>
        payroll.id === payrollId ? { ...payroll, status: "booked" } : payroll
      ),
    }));
  }, []);

  const depreciateAssets = useCallback(() => {
    setState((current) => ({
      ...current,
      assets: current.assets.map((asset) => {
        if (asset.status !== "active" || asset.depreciatedMonths >= asset.usefulMonths) return asset;
        const monthly = (asset.originalValue * (1 - asset.residualRate / 100)) / asset.usefulMonths;
        return {
          ...asset,
          depreciatedMonths: asset.depreciatedMonths + 1,
          accumulatedDepreciation: Number((asset.accumulatedDepreciation + monthly).toFixed(2)),
        };
      }),
    }));
  }, []);

  const closePeriod = useCallback(() => {
    setState((current) => ({
      ...current,
      closedPeriods: current.closedPeriods.includes(current.company.period)
        ? current.closedPeriods
        : [...current.closedPeriods, current.company.period],
    }));
  }, []);

  const reopenPeriod = useCallback((period: string) => {
    setState((current) => ({
      ...current,
      closedPeriods: current.closedPeriods.filter((item) => item !== period),
    }));
  }, []);

  const setPeriod = useCallback((period: string) => {
    setState((current) => ({
      ...current,
      company: {
        ...current.company,
        period,
      },
    }));
  }, []);

  const resetDemo = useCallback(() => {
    setState(createInitialAccountingState());
  }, []);

  const overview = useMemo(() => calculateOverview(state.vouchers), [state.vouchers]);
  const subjectBalances = useMemo(() => buildSubjectBalances(state.vouchers), [state.vouchers]);

  return {
    state,
    ready,
    overview,
    subjectBalances,
    saveVoucher,
    setVoucherStatus,
    deleteVoucher,
    bookInvoice,
    bookPayroll,
    depreciateAssets,
    closePeriod,
    reopenPeriod,
    setPeriod,
    resetDemo,
  };
}
