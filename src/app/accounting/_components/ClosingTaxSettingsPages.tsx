"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  FileSpreadsheet,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AccountingModule, AccountingState } from "../_lib/accounting-store";
import { InfoItem, Metric, PageHeader } from "./AccountingCommon";

export function ClosingPage({
  state,
  onNavigate,
  onClosePeriod,
  onReopenPeriod,
}: {
  state: AccountingState;
  onNavigate: (module: AccountingModule) => void;
  onClosePeriod: () => void;
  onReopenPeriod: (period: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"closing" | "reopen">("closing");
  const checks = [
    {
      label: "凭证全部审核过账",
      count: state.vouchers.filter((voucher) => voucher.status === "draft" || voucher.status === "pending").length,
      target: "vouchers" as AccountingModule,
    },
    {
      label: "发票全部完成入账",
      count: state.invoices.filter((invoice) => invoice.status !== "booked").length,
      target: "invoices" as AccountingModule,
    },
    {
      label: "工资表完成制证",
      count: state.payrolls.filter((payroll) => payroll.status !== "booked").length,
      target: "payroll" as AccountingModule,
    },
    {
      label: "固定资产完成折旧",
      count: state.assets.filter((asset) => asset.status === "active" && asset.depreciatedMonths === 0).length,
      target: "assets" as AccountingModule,
    },
  ];
  const blockers = checks.reduce((sum, item) => sum + item.count, 0);
  const closed = state.closedPeriods.includes(state.company.period);
  const [year, month] = state.company.period.split("-").map(Number);
  const periods = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(year, month - 1 - index, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
  const groupedPeriods = periods.reduce<Record<string, string[]>>((groups, period) => {
    const periodYear = period.slice(0, 4);
    groups[periodYear] = [...(groups[periodYear] || []), period];
    return groups;
  }, {});

  return (
    <div className="space-y-3">
      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <div className="flex border-b border-slate-200 bg-white px-4 pt-3">
          <button onClick={() => setActiveTab("closing")} className={cn("border-b-2 px-4 py-3 text-sm font-medium", activeTab === "closing" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500")}>期末处理</button>
          <button onClick={() => setActiveTab("reopen")} className={cn("border-b-2 px-4 py-3 text-sm font-medium", activeTab === "reopen" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500")}>反结账</button>
        </div>

        {activeTab === "closing" ? (
          <div className="p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />未结转损益、未结账</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-400" />已结转损益、未结账</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />已结转损益、已结账</span>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              {Object.entries(groupedPeriods).map(([periodYear, yearPeriods]) => (
                <div key={periodYear} className="flex items-center gap-3">
                  <span className="w-12 text-sm font-semibold text-slate-700">{periodYear}</span>
                  <div className="flex flex-wrap gap-2">
                    {yearPeriods.map((period) => {
                      const itemClosed = state.closedPeriods.includes(period);
                      const current = period === state.company.period;
                      return <span key={period} className={cn("flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold", itemClosed ? "bg-emerald-500 text-white" : current && blockers === 0 ? "bg-blue-500 text-white" : current ? "bg-amber-400 text-slate-950" : "border border-slate-200 bg-white text-slate-400")}>{Number(period.slice(5))}</span>;
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="grid gap-2 sm:grid-cols-2">
                {checks.map((item) => (
                  <button key={item.label} onClick={() => item.count > 0 && onNavigate(item.target)} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-300">
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", item.count === 0 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>{item.count === 0 ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}</div>
                    <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold text-slate-900">{item.label}</h3><p className="mt-1 text-xs text-slate-500">{item.count === 0 ? "检查通过" : `还有 ${item.count} 项待处理`}</p></div>
                    {item.count > 0 && <ChevronRight className="h-4 w-4 text-slate-300" />}
                  </button>
                ))}
              </div>
              <div className="rounded-xl bg-slate-950 p-5 text-white">
                <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", closed ? "bg-emerald-500" : blockers ? "bg-amber-400 text-slate-950" : "bg-blue-500")}>{closed ? "已结账" : blockers ? "待处理" : "可结账"}</span>
                <h2 className="mt-4 text-xl font-bold">{state.company.period} 会计期间</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">先完成业务检查，再结转损益并锁定本期账簿。</p>
                <Button disabled={closed} onClick={() => { if (blockers > 0) { toast.error(`还有 ${blockers} 项事项未处理`); return; } onClosePeriod(); toast.success("本期损益已结转并完成结账"); }} className="mt-5 h-11 w-full rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:bg-emerald-700">
                  <ShieldCheck className="mr-2 h-4 w-4" /> {closed ? "本期已结账" : "结转损益并结账"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5">
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">反结账会重新开放对应期间，之后可以补录、修改和审核凭证。本机演示账簿会立即更新状态。</div>
            {state.closedPeriods.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[...state.closedPeriods].sort((a, b) => b.localeCompare(a)).map((period) => (
                  <div key={period} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><LockKeyhole className="h-5 w-5" /></div>
                    <div className="flex-1"><p className="font-semibold text-slate-900">{period.replace("-", "年")}月</p><p className="mt-1 text-xs text-slate-500">损益已结转、账簿已锁定</p></div>
                    <Button variant="outline" onClick={() => { onReopenPeriod(period); toast.success(`${period} 已反结账`); }} className="h-9 rounded-lg"><Undo2 className="mr-1.5 h-4 w-4" />反结账</Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 py-14 text-center text-sm text-slate-500">当前没有已结账期间</div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

export function TaxPage({ state }: { state: AccountingState }) {
  const outputTax = state.invoices.filter((invoice) => invoice.type === "sales").reduce((sum, invoice) => sum + invoice.taxAmount, 0);
  const inputTax = state.invoices.filter((invoice) => invoice.type === "purchase" && invoice.status !== "pending").reduce((sum, invoice) => sum + invoice.taxAmount, 0);
  const payable = Math.max(0, outputTax - inputTax);
  const checklist = [
    { label: "销项发票已归集", done: state.invoices.filter((item) => item.type === "sales" && item.status === "pending").length === 0 },
    { label: "进项发票已认证", done: state.invoices.filter((item) => item.type === "purchase" && item.status === "pending").length === 0 },
    { label: "本期凭证已全部过账", done: state.vouchers.every((item) => item.status === "posted" || item.status === "void") },
    { label: "财务报表已生成", done: state.vouchers.some((item) => item.status === "posted") },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="税务工作台"
        description="汇总申报数据并检查报税前置事项；正式申报仍需对接电子税务局。"
        actions={<Button disabled={!checklist.every((item) => item.done)} className="h-11 rounded-xl"><FileSpreadsheet className="mr-2 h-4 w-4" /> 生成申报数据</Button>}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric label="销项税额" value={outputTax} icon={TrendingUp} tone="amber" />
        <Metric label="可抵扣进项" value={inputTax} icon={TrendingDown} tone="blue" />
        <Metric label="预计应纳增值税" value={payable} icon={CircleDollarSign} tone="red" />
      </div>
      <Card className="rounded-2xl border-slate-200/70 shadow-sm">
        <CardHeader><CardTitle className="text-base">申报前检查</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", item.done ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600")}>
                {item.done ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </div>
              <span className="flex-1 text-sm font-medium text-slate-700">{item.label}</span>
              <span className={cn("text-sm font-semibold", item.done ? "text-emerald-600" : "text-amber-600")}>{item.done ? "已完成" : "待处理"}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function LedgerSettingsPage({
  state,
  onReset,
}: {
  state: AccountingState;
  onReset: () => void;
}) {
  return (
    <div className="space-y-5">
      <PageHeader title="账套设置" description="查看当前账套配置并管理本机演示数据。" />
      <Card className="rounded-2xl border-slate-200/70 shadow-sm">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem label="账套名称" value={state.company.name} />
          <InfoItem label="当前期间" value={state.company.period} />
          <InfoItem label="会计准则" value={state.company.accountingStandard} />
          <InfoItem label="纳税人类型" value={state.company.taxpayerType} />
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-red-200 bg-red-50/50 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="font-semibold text-red-900">重置本机演示账簿</h3><p className="mt-1 text-sm text-red-700/70">清除当前浏览器中的记账数据，并恢复初始示例。</p></div>
          <Button
            variant="outline"
            onClick={onReset}
            className="h-11 rounded-xl border-red-200 text-red-600 hover:bg-red-100"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> 重置数据
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
