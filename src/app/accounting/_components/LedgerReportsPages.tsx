"use client";

import { useState } from "react";
import { Banknote, Download, Landmark, Package, Printer, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  AccountingState,
  SubjectBalanceRow,
  calculateOverview,
  formatMoney,
} from "../_lib/accounting-store";
import { DataTable, Metric, PageHeader, SmallMetric, downloadCsv } from "./AccountingCommon";

interface LedgerPageProps {
  state: AccountingState;
  subjectBalances: SubjectBalanceRow[];
  pageLabel?: string;
}

export function LedgersPage({ state, subjectBalances, pageLabel = "科目余额表" }: LedgerPageProps) {
  const initialView = pageLabel.includes("明细") || pageLabel.includes("序时") || pageLabel.includes("账龄")
    ? "detail"
    : pageLabel === "总账"
      ? "general"
      : "balance";
  const [view, setView] = useState<"balance" | "general" | "detail">(initialView);
  const [keyword, setKeyword] = useState("");
  const rows = subjectBalances.filter((row) => !keyword || `${row.code}${row.name}`.includes(keyword));

  return (
    <div className="space-y-5">
      <PageHeader
        title={pageLabel}
        description="查询科目余额表、总账和明细账。"
        actions={
          <>
            <Button variant="outline" onClick={() => window.print()} className="h-11 rounded-xl"><Printer className="mr-2 h-4 w-4" /> 打印</Button>
            <Button
              variant="outline"
              onClick={() => downloadCsv(`科目余额表-${state.company.period}.csv`, [
                ["科目编码", "科目名称", "借方发生额", "贷方发生额", "余额方向", "期末余额"],
                ...rows.map((row) => [row.code, row.name, row.debit, row.credit, row.direction, row.balance]),
              ])}
              className="h-11 rounded-xl"
            >
              <Download className="mr-2 h-4 w-4" /> 导出
            </Button>
          </>
        }
      />
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200/70 bg-white p-2 shadow-sm">
        {([['balance', '科目余额表'], ['general', '总账'], ['detail', '明细账']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setView(key)} className={cn("shrink-0 rounded-xl px-4 py-2 text-sm font-medium", view === key ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100")}>{label}</button>
        ))}
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索科目编码或名称" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-amber-400" />
      </div>
      {view === "balance" ? (
        <DataTable
          headers={["科目编码", "科目名称", "借方发生额", "贷方发生额", "方向", "期末余额"]}
          rows={rows.map((row) => [row.code, row.name, formatMoney(row.debit), formatMoney(row.credit), row.direction, formatMoney(row.balance)])}
        />
      ) : view === "general" ? (
        <GeneralLedger state={state} rows={rows} />
      ) : (
        <DetailLedger state={state} rows={rows} />
      )}
    </div>
  );
}

function GeneralLedger({ state, rows }: { state: AccountingState; rows: SubjectBalanceRow[] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {rows.map((row) => (
        <Card key={row.code} className="rounded-2xl border-slate-200/70 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div><p className="font-mono text-xs text-slate-400">{row.code}</p><h3 className="mt-1 font-semibold text-slate-900">{row.name}</h3></div>
              <Badge variant="outline" className="rounded-full">{row.direction}方余额</Badge>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-sm">
              <SmallMetric label="借方发生" value={row.debit} />
              <SmallMetric label="贷方发生" value={row.credit} />
              <SmallMetric label="期末余额" value={row.balance} />
            </div>
            <p className="mt-3 text-xs text-slate-400">期间：{state.company.period}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DetailLedger({ state, rows }: { state: AccountingState; rows: SubjectBalanceRow[] }) {
  const subjectCodes = new Set(rows.map((row) => row.code));
  const details = state.vouchers
    .filter((voucher) => voucher.status === "posted")
    .flatMap((voucher) =>
      voucher.entries
        .filter((item) => subjectCodes.has(item.subjectCode))
        .map((item) => [
          voucher.voucherDate,
          voucher.voucherNo,
          `${item.subjectCode} ${item.subjectName}`,
          item.summary,
          item.debit ? formatMoney(item.debit) : "-",
          item.credit ? formatMoney(item.credit) : "-",
        ])
    );
  return <DataTable headers={["日期", "凭证号", "会计科目", "摘要", "借方", "贷方"]} rows={details} />;
}

export function ReportsPage({ state, subjectBalances, pageLabel = "资产负债表" }: LedgerPageProps) {
  const initialReport = pageLabel.includes("利润") || pageLabel.includes("费用")
    ? "income"
    : pageLabel.includes("现金流量")
      ? "cashFlow"
      : "balanceSheet";
  const [report, setReport] = useState<"balanceSheet" | "income" | "cashFlow">(initialReport);
  const overview = calculateOverview(state.vouchers);
  const assets = subjectBalances.filter((row) => row.code.startsWith("1"));
  const liabilities = subjectBalances.filter((row) => row.code.startsWith("2"));
  const equity = subjectBalances.filter((row) => row.code.startsWith("4"));

  const exportReport = () => {
    const rows: Array<Array<string | number>> = report === "balanceSheet"
      ? [
          ["项目", "期末余额"],
          ...assets.map((row) => [row.name, row.direction === "借" ? row.balance : -row.balance]),
          ["资产合计", overview.assets],
          ...liabilities.map((row) => [row.name, row.direction === "贷" ? row.balance : -row.balance]),
          ["负债合计", overview.liabilities],
          ...equity.map((row) => [row.name, row.direction === "贷" ? row.balance : -row.balance]),
          ["所有者权益合计", overview.equity],
        ]
      : report === "income"
        ? [["项目", "本期金额"], ["营业收入", overview.revenue], ["营业成本及费用", overview.expense], ["利润总额", overview.profit]]
        : [["项目", "本期金额"], ["经营活动现金净额", overview.revenue - overview.expense], ["投资活动现金净额", 0], ["筹资活动现金净额", 100000]];
    downloadCsv(`${report}-${state.company.period}.csv`, rows);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={pageLabel}
        description="凭证过账后自动生成资产负债表、利润表和现金流量概览。"
        actions={
          <>
            <Button variant="outline" onClick={() => window.print()} className="h-11 rounded-xl"><Printer className="mr-2 h-4 w-4" /> 打印</Button>
            <Button onClick={exportReport} className="h-11 rounded-xl"><Download className="mr-2 h-4 w-4" /> 导出报表</Button>
          </>
        }
      />
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200/70 bg-white p-2 shadow-sm">
        {([['balanceSheet', '资产负债表'], ['income', '利润表'], ['cashFlow', '现金流量概览']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setReport(key)} className={cn("shrink-0 rounded-xl px-4 py-2 text-sm font-medium", report === key ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100")}>{label}</button>
        ))}
      </div>
      {report === "balanceSheet" ? (
        <BalanceSheet assets={assets} liabilities={liabilities} equity={equity} overview={overview} />
      ) : report === "income" ? (
        <IncomeStatement overview={overview} />
      ) : (
        <CashFlowOverview overview={overview} />
      )}
    </div>
  );
}

function BalanceSheet({
  assets,
  liabilities,
  equity,
  overview,
}: {
  assets: SubjectBalanceRow[];
  liabilities: SubjectBalanceRow[];
  equity: SubjectBalanceRow[];
  overview: ReturnType<typeof calculateOverview>;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ReportSection title="资产" rows={assets.map((row) => [row.name, row.direction === "借" ? row.balance : -row.balance])} totalLabel="资产合计" total={overview.assets} />
      <div className="space-y-4">
        <ReportSection title="负债" rows={liabilities.map((row) => [row.name, row.direction === "贷" ? row.balance : -row.balance])} totalLabel="负债合计" total={overview.liabilities} />
        <ReportSection title="所有者权益" rows={equity.map((row) => [row.name, row.direction === "贷" ? row.balance : -row.balance])} totalLabel="所有者权益合计" total={overview.equity} />
      </div>
    </div>
  );
}

function IncomeStatement({ overview }: { overview: ReturnType<typeof calculateOverview> }) {
  return (
    <ReportSection
      title="利润表"
      rows={[
        ["一、营业收入", overview.revenue],
        ["减：营业成本及期间费用", overview.expense],
        ["二、营业利润", overview.profit],
        ["三、利润总额", overview.profit],
        ["四、净利润", overview.profit],
      ]}
      totalLabel="本期净利润"
      total={overview.profit}
    />
  );
}

function CashFlowOverview({ overview }: { overview: ReturnType<typeof calculateOverview> }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Metric label="经营活动现金净额" value={overview.revenue - overview.expense} icon={Banknote} tone="emerald" />
      <Metric label="投资活动现金净额" value={0} icon={Package} tone="blue" />
      <Metric label="筹资活动现金净额" value={100000} icon={Landmark} tone="amber" />
    </div>
  );
}

function ReportSection({
  title,
  rows,
  totalLabel,
  total,
}: {
  title: string;
  rows: Array<[string, number]>;
  totalLabel: string;
  total: number;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200/70 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/70 py-4"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {rows.length ? rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between px-5 py-3 text-sm"><span className="text-slate-600">{label}</span><span className="font-mono text-slate-900">{formatMoney(value)}</span></div>
          )) : <div className="px-5 py-8 text-center text-sm text-slate-400">暂无数据</div>}
          <div className="flex items-center justify-between bg-slate-950 px-5 py-4 text-sm text-white"><strong>{totalLabel}</strong><strong className="font-mono">{formatMoney(total)}</strong></div>
        </div>
      </CardContent>
    </Card>
  );
}
