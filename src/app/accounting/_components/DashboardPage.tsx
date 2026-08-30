"use client";

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  FileText,
  Landmark,
  Package,
  Plus,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  AccountingModule,
  AccountingState,
  calculateOverview,
  formatMoney,
  voucherTotals,
} from "../_lib/accounting-store";
import { Metric, VoucherStatusBadge } from "./AccountingCommon";

interface DashboardPageProps {
  state: AccountingState;
  onNavigate: (module: AccountingModule) => void;
  onNewVoucher: () => void;
}

export function DashboardPage({ state, onNavigate, onNewVoucher }: DashboardPageProps) {
  const overview = calculateOverview(state.vouchers);
  const pendingVouchers = state.vouchers.filter((voucher) => voucher.status === "pending").length;
  const draftVouchers = state.vouchers.filter((voucher) => voucher.status === "draft").length;
  const pendingInvoices = state.invoices.filter((invoice) => invoice.status !== "booked").length;
  const isClosed = state.closedPeriods.includes(state.company.period);
  const postedCount = state.vouchers.filter((voucher) => voucher.status === "posted").length;
  const totalCount = state.vouchers.filter((voucher) => voucher.status !== "void").length;
  const completion = totalCount ? Math.round((postedCount / totalCount) * 100) : 0;
  const latest = [...state.vouchers]
    .sort((a, b) => b.voucherDate.localeCompare(a.voucherDate))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl shadow-slate-900/10">
        <div className="grid gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1fr)_18rem] lg:px-8 lg:py-8">
          <div>
            <Badge className="border-white/10 bg-white/10 text-white hover:bg-white/10">
              {state.company.period} 会计期间
            </Badge>
            <h1 className="mt-4 text-2xl font-bold sm:text-3xl">今天的账，今天记清楚</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              从业务单据生成凭证，审核过账后自动形成账簿与财务报表。当前账套数据保存在本机浏览器中。
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button onClick={onNewVoucher} className="h-11 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400">
                <Plus className="mr-2 h-4 w-4" /> 新增凭证
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate("closing")}
                className="h-11 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <CalendarClock className="mr-2 h-4 w-4" /> 月末检查
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">本期记账进度</span>
              <span className="text-lg font-semibold">{completion}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${completion}%` }} />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <ProgressBox value={postedCount} label="已过账" />
              <ProgressBox value={pendingVouchers} label="待审核" />
              <ProgressBox value={draftVouchers} label="草稿" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="资产总额" value={overview.assets} icon={Landmark} tone="blue" />
        <Metric label="负债总额" value={overview.liabilities} icon={WalletCards} tone="violet" />
        <Metric label="本期收入" value={overview.revenue} icon={TrendingUp} tone="emerald" />
        <Metric label="本期利润" value={overview.profit} icon={overview.profit >= 0 ? TrendingUp : TrendingDown} tone={overview.profit >= 0 ? "amber" : "red"} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.6fr)]">
        <Card className="rounded-2xl border-slate-200/70 shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">最近凭证</CardTitle>
              <p className="mt-1 text-xs text-slate-500">最新录入与过账记录</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("vouchers")} className="rounded-xl">
              全部凭证 <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {latest.map((voucher) => {
                const totals = voucherTotals(voucher);
                return (
                  <button
                    key={voucher.id}
                    onClick={() => onNavigate("vouchers")}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 sm:px-6"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{voucher.voucherNo}</span>
                        <VoucherStatusBadge status={voucher.status} />
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">{voucher.summary}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold text-slate-900">{formatMoney(totals.debit)}</p>
                      <p className="mt-1 text-xs text-slate-400">{voucher.voucherDate.slice(5)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/70 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">月末待办</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <TodoButton label="待审核凭证" value={pendingVouchers} target="vouchers" icon={FileCheck2} onNavigate={onNavigate} />
            <TodoButton label="未入账发票" value={pendingInvoices} target="invoices" icon={AlertTriangle} onNavigate={onNavigate} />
            <TodoButton label="资产计提折旧" value={state.assets.filter((asset) => asset.status === "active" && asset.depreciatedMonths === 0).length} target="assets" icon={Package} onNavigate={onNavigate} />
            <TodoButton label="本期结账" value={isClosed ? "已完成" : "未完成"} target="closing" icon={RotateCcw} onNavigate={onNavigate} done={isClosed} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function ProgressBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <strong className="block text-xl">{value}</strong>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}

function TodoButton({
  label,
  value,
  target,
  icon: Icon,
  onNavigate,
  done = false,
}: {
  label: string;
  value: number | string;
  target: AccountingModule;
  icon: React.ComponentType<{ className?: string }>;
  onNavigate: (module: AccountingModule) => void;
  done?: boolean;
}) {
  const hasWarning = !done && value !== 0;
  return (
    <button
      onClick={() => onNavigate(target)}
      className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-left hover:border-amber-200 hover:bg-amber-50/50"
    >
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", hasWarning ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600")}>
        {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </div>
      <span className="flex-1 text-sm font-medium text-slate-700">{label}</span>
      <span className={cn("text-sm font-semibold", hasWarning ? "text-amber-700" : "text-emerald-700")}>{value}</span>
      <ChevronRight className="h-4 w-4 text-slate-300" />
    </button>
  );
}
