"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  Download,
  FileCheck2,
  Landmark,
  Package,
  Plus,
  Receipt,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AccountingState, formatMoney } from "../_lib/accounting-store";
import { DataTable, Metric, PageHeader, SmallMetric, downloadCsv } from "./AccountingCommon";

interface BusinessPageProps {
  state: AccountingState;
  pageLabel?: string;
  onCreateInvoiceVoucher: (invoiceId: string) => void;
  onCreatePayrollVoucher: (payrollId: string) => void;
  onDepreciate: () => void;
}

export function FundsPage({ state, pageLabel = "现金日记账" }: { state: AccountingState; pageLabel?: string }) {
  const transactions = useMemo(
    () =>
      state.vouchers
        .filter((voucher) => voucher.status === "posted")
        .flatMap((voucher) =>
          voucher.entries
            .filter((item) => {
              if (pageLabel === "现金日记账") return item.subjectCode === "1001";
              if (pageLabel === "银行日记账") return item.subjectCode === "1002";
              return item.subjectCode === "1001" || item.subjectCode === "1002";
            })
            .map((item) => ({
              id: `${voucher.id}-${item.id}`,
              date: voucher.voucherDate,
              voucherNo: voucher.voucherNo,
              summary: item.summary || voucher.summary,
              account: item.subjectName,
              income: item.debit,
              expense: item.credit,
            }))
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [pageLabel, state.vouchers]
  );
  const balance = transactions.reduce((sum, item) => sum + item.income - item.expense, 0);
  const income = transactions.reduce((sum, item) => sum + item.income, 0);
  const expense = transactions.reduce((sum, item) => sum + item.expense, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title={pageLabel}
        description={pageLabel === "内部转账" ? "核对现金与银行账户之间的内部划转记录。" : "查看现金、银行存款的收支流水和账面余额。"}
        actions={
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv("资金日记账.csv", [
                ["日期", "凭证号", "账户", "摘要", "收入", "支出"],
                ...transactions.map((item) => [item.date, item.voucherNo, item.account, item.summary, item.income, item.expense]),
              ])
            }
            className="h-11 rounded-xl"
          >
            <Download className="mr-2 h-4 w-4" /> 导出流水
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric label="资金余额" value={balance} icon={WalletCards} tone="amber" />
        <Metric label="本期流入" value={income} icon={TrendingUp} tone="emerald" />
        <Metric label="本期流出" value={expense} icon={TrendingDown} tone="red" />
      </div>
      <DataTable
        headers={["日期", "凭证号", "账户", "摘要", "收入", "支出"]}
        rows={transactions.map((item) => [
          item.date,
          item.voucherNo,
          item.account,
          item.summary,
          item.income ? formatMoney(item.income) : "-",
          item.expense ? formatMoney(item.expense) : "-",
        ])}
      />
    </div>
  );
}

export function InvoicesPage({ state, pageLabel = "销项发票", onCreateInvoiceVoucher }: BusinessPageProps) {
  const salesTotal = state.invoices
    .filter((item) => item.type === "sales")
    .reduce((sum, item) => sum + item.amount + item.taxAmount, 0);
  const purchaseTotal = state.invoices
    .filter((item) => item.type === "purchase")
    .reduce((sum, item) => sum + item.amount + item.taxAmount, 0);
  const statusMap = { pending: "待认证", verified: "已认证", booked: "已入账" } as const;
  const invoices = pageLabel === "销项发票"
    ? state.invoices.filter((item) => item.type === "sales")
    : pageLabel === "进项发票"
      ? state.invoices.filter((item) => item.type === "purchase")
      : state.invoices;

  return (
    <div className="space-y-5">
      <PageHeader title={pageLabel} description="归集销项、进项发票，并按业务单据生成记账凭证。" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="销项价税合计" value={salesTotal} icon={Receipt} tone="amber" />
        <Metric label="进项价税合计" value={purchaseTotal} icon={FileCheck2} tone="blue" />
        <Metric
          label="待入账发票"
          rawValue={`${state.invoices.filter((item) => item.status !== "booked").length} 张`}
          icon={AlertTriangle}
          tone="red"
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>
      <div className="grid gap-3">
        {invoices.map((invoice) => (
          <Card key={invoice.id} className="rounded-2xl border-slate-200/70 shadow-sm">
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
              <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", invoice.type === "sales" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600")}>
                <Receipt className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{invoice.counterparty}</h3>
                  <Badge variant="outline" className="rounded-full">{invoice.type === "sales" ? "销项" : "进项"}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">发票号 {invoice.number} · {invoice.invoiceDate}</p>
              </div>
              <div className="sm:text-right">
                <p className="font-mono text-lg font-bold text-slate-950">{formatMoney(invoice.amount + invoice.taxAmount)}</p>
                <p className="mt-1 text-xs text-slate-500">税额 {formatMoney(invoice.taxAmount)}</p>
              </div>
              <div className="flex items-center gap-2 sm:w-32 sm:justify-end">
                {invoice.status === "booked" ? (
                  <Badge className="rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{statusMap[invoice.status]}</Badge>
                ) : (
                  <Button size="sm" onClick={() => onCreateInvoiceVoucher(invoice.id)} className="w-full rounded-xl">生成凭证</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function PayrollPage({ state, pageLabel = "工资管理", onCreatePayrollVoucher }: BusinessPageProps) {
  return (
    <div className="space-y-5">
      <PageHeader
        title={pageLabel}
        description="计算工资、社保与个税，并生成工资计提凭证。"
        actions={<Button variant="outline" className="h-11 rounded-xl"><Plus className="mr-2 h-4 w-4" /> 新增工资表</Button>}
      />
      {state.payrolls.map((payroll) => (
        <Card key={payroll.id} className="rounded-2xl border-slate-200/70 shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><Users className="h-6 w-6" /></div>
                <div><h3 className="font-semibold text-slate-900">{payroll.period} 工资表</h3><p className="mt-1 text-sm text-slate-500">{payroll.employees} 名员工</p></div>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
                <SmallMetric label="应发工资" value={payroll.grossAmount} />
                <SmallMetric label="社保公积金" value={payroll.socialInsurance} />
                <SmallMetric label="个人所得税" value={payroll.individualTax} />
                <SmallMetric label="实发工资" value={payroll.netAmount} />
              </div>
              <div>
                {payroll.status === "booked" ? (
                  <Badge className="rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100">已生成凭证</Badge>
                ) : (
                  <Button onClick={() => onCreatePayrollVoucher(payroll.id)} className="h-11 w-full rounded-xl lg:w-auto">生成工资凭证</Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AssetsPage({ state, pageLabel = "资产管理", onDepreciate }: BusinessPageProps) {
  const original = state.assets.reduce((sum, asset) => sum + asset.originalValue, 0);
  const depreciation = state.assets.reduce((sum, asset) => sum + asset.accumulatedDepreciation, 0);
  return (
    <div className="space-y-5">
      <PageHeader
        title={pageLabel}
        description="管理资产卡片、折旧年限和每月计提。"
        actions={
          <>
            <Button variant="outline" className="h-11 rounded-xl"><Plus className="mr-2 h-4 w-4" /> 新增资产</Button>
            <Button onClick={onDepreciate} className="h-11 rounded-xl"><RefreshCw className="mr-2 h-4 w-4" /> 计提本月折旧</Button>
          </>
        }
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric label="资产原值" value={original} icon={Package} tone="blue" />
        <Metric label="累计折旧" value={depreciation} icon={TrendingDown} tone="red" />
        <Metric label="资产净值" value={original - depreciation} icon={Landmark} tone="emerald" />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {state.assets.map((asset) => {
          const monthly = (asset.originalValue * (1 - asset.residualRate / 100)) / asset.usefulMonths;
          return (
            <Card key={asset.id} className="rounded-2xl border-slate-200/70 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Package className="h-5 w-5" /></div>
                    <div><h3 className="font-semibold text-slate-900">{asset.name}</h3><p className="mt-1 text-xs text-slate-500">{asset.code} · {asset.category}</p></div>
                  </div>
                  <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700">使用中</Badge>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
                  <SmallMetric label="资产原值" value={asset.originalValue} />
                  <SmallMetric label="资产净值" value={asset.originalValue - asset.accumulatedDepreciation} />
                  <SmallMetric label="月折旧额" value={monthly} />
                  <div><p className="text-xs text-slate-400">已折旧月份</p><p className="mt-1 font-semibold text-slate-800">{asset.depreciatedMonths} / {asset.usefulMonths} 月</p></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
