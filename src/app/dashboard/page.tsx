"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Landmark,
  Loader2,
  MapPin,
  RefreshCw,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { User } from "./types";

interface MetricBase {
  id: string;
  name: string;
}

interface MetricEnterprise {
  id: string;
  name: string;
  baseId: string | null;
  baseName: string | null;
}

interface MetricOptions {
  bases: MetricBase[];
  enterprises: MetricEnterprise[];
}

interface MetricSummary {
  year: string;
  totals: {
    revenue?: string;
    taxTotal?: string;
    taxLocal?: string;
    investment?: string;
    enterpriseCount?: number;
    reportCount?: number;
    employees?: number;
    localEmployees?: number;
  };
  monthly: Array<{
    period: string;
    revenue: string;
    taxTotal: string;
    taxLocal: string;
    employees: number;
    localEmployees: number;
    investment: string;
  }>;
}

interface MetricReport {
  id: string;
  enterpriseId: string;
  baseId: string;
  status: "draft" | "submitted" | "confirmed" | "rejected";
}

const ALL_BASES = "all";
const now = new Date();
const CURRENT_YEAR = String(now.getFullYear());
const CURRENT_PERIOD = `${CURRENT_YEAR}-${String(now.getMonth() + 1).padStart(2, "0")}`;

function formatMoney(value: string | number | undefined) {
  return Number(value || 0).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}

function readUser() {
  try {
    const value = localStorage.getItem("user");
    return value ? JSON.parse(value) as User : null;
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [options, setOptions] = useState<MetricOptions>({ bases: [], enterprises: [] });
  const [summary, setSummary] = useState<MetricSummary>({ year: CURRENT_YEAR, totals: {}, monthly: [] });
  const [currentReports, setCurrentReports] = useState<MetricReport[]>([]);
  const [selectedBaseId, setSelectedBaseId] = useState(ALL_BASES);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadOverview = useCallback(async (baseId: string) => {
    setLoading(true);
    setLoadError("");
    const baseQuery = baseId === ALL_BASES ? "" : `&baseId=${encodeURIComponent(baseId)}`;
    const [summaryResponse, reportResponse] = await Promise.all([
      apiClient.get<MetricSummary>(`/api/business-metrics/summary?year=${CURRENT_YEAR}${baseQuery}`),
      apiClient.get<MetricReport[]>(`/api/business-metrics?period=${CURRENT_PERIOD}${baseQuery}`),
    ]);

    if (!summaryResponse.success || !summaryResponse.data || !reportResponse.success || !reportResponse.data) {
      setLoadError(summaryResponse.error || reportResponse.error || "经营数据加载失败");
    } else {
      setSummary(summaryResponse.data);
      setCurrentReports(reportResponse.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const userTimer = window.setTimeout(() => {
      setUser(readUser());
      void loadOverview(ALL_BASES);
    }, 0);
    void apiClient.get<MetricOptions>("/api/business-metrics/options").then((response) => {
      if (response.success && response.data) setOptions(response.data);
    });
    return () => window.clearTimeout(userTimer);
  }, [loadOverview]);

  const selectedBase = options.bases.find((base) => base.id === selectedBaseId);
  const scopeName = selectedBase?.name ?? "全部基地";
  const scopedEnterprises = useMemo(() => options.enterprises.filter((enterprise) => (
    selectedBaseId === ALL_BASES || enterprise.baseId === selectedBaseId
  )), [options.enterprises, selectedBaseId]);

  const reportProgress = useMemo(() => {
    const uniqueReports = new Set(currentReports.map((report) => report.enterpriseId)).size;
    const confirmed = new Set(currentReports.filter((report) => report.status === "confirmed").map((report) => report.enterpriseId)).size;
    const submitted = currentReports.filter((report) => report.status === "submitted").length;
    const rejected = currentReports.filter((report) => report.status === "rejected").length;
    const total = scopedEnterprises.length;
    return {
      total,
      reported: uniqueReports,
      confirmed,
      submitted,
      rejected,
      missing: Math.max(total - uniqueReports, 0),
      rate: total > 0 ? Math.round((confirmed / total) * 100) : 0,
    };
  }, [currentReports, scopedEnterprises.length]);

  const totals = summary.totals;
  const localEmploymentRate = Number(totals.employees || 0) > 0
    ? Math.round((Number(totals.localEmployees || 0) / Number(totals.employees || 0)) * 1000) / 10
    : 0;
  const localTaxRate = Number(totals.taxTotal || 0) > 0
    ? Math.round((Number(totals.taxLocal || 0) / Number(totals.taxTotal || 0)) * 1000) / 10
    : 0;
  const chartMax = Math.max(...summary.monthly.flatMap((item) => [Number(item.revenue), Number(item.taxTotal)]), 1);
  const canSubmit = user?.permissions?.some((permission) => ["platform.manage", "metrics.manage", "metrics.submit"].includes(permission));
  const canReview = user?.permissions?.some((permission) => ["platform.manage", "metrics.manage", "metrics.review"].includes(permission));

  const changeBase = (baseId: string) => {
    setSelectedBaseId(baseId);
    void loadOverview(baseId);
  };

  return (
    <div className="mx-auto max-w-[1580px] space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 px-5 py-6 text-white shadow-[0_22px_65px_rgba(15,23,42,0.2)] sm:px-8 sm:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_12%,rgba(34,211,238,0.2),transparent_28%),radial-gradient(circle_at_12%_100%,rgba(251,191,36,0.13),transparent_28%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              <Landmark className="h-3.5 w-3.5 text-amber-300" />
              政府园区经营管理
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">基地企业经营数据</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">以基地为统计口径，汇总已审核确认的企业销售收入、税收贡献、固定资产投资和就业带动成果。</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={selectedBaseId} onValueChange={changeBase}>
              <SelectTrigger className="h-10 min-w-52 border-white/15 bg-white/5 text-white [&_svg]:text-slate-400"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={ALL_BASES}>汇总全部基地</SelectItem>{options.bases.map((base) => <SelectItem key={base.id} value={base.id}>{base.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button asChild className="h-10 bg-amber-400 text-slate-950 hover:bg-amber-300">
              <Link href="/dashboard/base/metrics">{canSubmit ? "经营数据填报" : "查看经营数据"}<ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
        <div className="relative mt-7 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-5 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-cyan-300" />统计范围：{scopeName}</span>
          <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-cyan-300" />纳入企业：{scopedEnterprises.length} 家</span>
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />数据口径：审核确认</span>
        </div>
      </section>

      {loadError && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{loadError}</span><Button size="sm" variant="outline" onClick={() => void loadOverview(selectedBaseId)}><RefreshCw className="mr-2 h-3.5 w-3.5" />重试</Button>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-slate-400" /></div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-6">
            {[
              { label: "税收合计", value: `${formatMoney(totals.taxTotal)} 万`, detail: `地方留成 ${formatMoney(totals.taxLocal)} 万`, icon: Landmark, tone: "bg-amber-50 text-amber-700" },
              { label: "销售收入", value: `${formatMoney(totals.revenue)} 万`, detail: `${summary.year} 年审核口径`, icon: TrendingUp, tone: "bg-cyan-50 text-cyan-700" },
              { label: "地方留成占比", value: `${localTaxRate}%`, detail: "地方留成 / 税收合计", icon: CircleDollarSign, tone: "bg-orange-50 text-orange-700" },
              { label: "带动就业", value: `${Number(totals.employees || 0).toLocaleString("zh-CN")} 人`, detail: `本地就业 ${Number(totals.localEmployees || 0).toLocaleString("zh-CN")} 人`, icon: UsersRound, tone: "bg-emerald-50 text-emerald-700" },
              { label: "固定资产投资", value: `${formatMoney(totals.investment)} 万`, detail: `${summary.year} 年累计`, icon: BriefcaseBusiness, tone: "bg-violet-50 text-violet-700" },
              { label: "纳入统计企业", value: `${Number(totals.enterpriseCount || 0)} 家`, detail: `累计确认 ${Number(totals.reportCount || 0)} 条月报`, icon: Building2, tone: "bg-slate-100 text-slate-700" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className={cn("mb-4 flex h-9 w-9 items-center justify-center rounded-xl", item.tone)}><item.icon className="h-4 w-4" /></div>
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-slate-950">{item.value}</p>
                <p className="mt-2 text-[11px] text-slate-400">{item.detail}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-12">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div><h2 className="font-semibold text-slate-950">月度经营走势</h2><p className="mt-1 text-xs text-slate-400">销售收入与税收合计，金额单位：万元</p></div>
                <div className="flex gap-4 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-cyan-500" />销售收入</span><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-amber-400" />税收合计</span></div>
              </div>
              {summary.monthly.length === 0 ? (
                <div className="flex h-72 flex-col items-center justify-center text-center"><BarChart3 className="h-10 w-10 text-slate-300" /><p className="mt-4 font-medium text-slate-600">暂无已确认的月度经营数据</p><p className="mt-1 text-sm text-slate-400">完成填报和审核后，趋势图会自动生成。</p></div>
              ) : (
                <div className="mt-8 flex h-72 items-end gap-3 overflow-x-auto pb-2 sm:gap-5">
                  {summary.monthly.map((item) => {
                    const revenueHeight = Math.max((Number(item.revenue) / chartMax) * 210, 4);
                    const taxHeight = Math.max((Number(item.taxTotal) / chartMax) * 210, 4);
                    return (
                      <div key={item.period} className="flex min-w-14 flex-1 flex-col items-center">
                        <div className="flex h-[220px] items-end gap-1.5">
                          <div title={`销售收入 ${formatMoney(item.revenue)} 万`} className="w-4 rounded-t-md bg-cyan-500/90 sm:w-6" style={{ height: revenueHeight }} />
                          <div title={`税收 ${formatMoney(item.taxTotal)} 万`} className="w-4 rounded-t-md bg-amber-400 sm:w-6" style={{ height: taxHeight }} />
                        </div>
                        <span className="mt-3 text-[11px] text-slate-400">{Number(item.period.slice(5, 7))}月</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-5 xl:col-span-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-950">{CURRENT_PERIOD.replace("-", "年")}月报送进度</h2><p className="mt-1 text-xs text-slate-400">按当前基地范围统计</p></div><span className="text-2xl font-semibold text-slate-950">{reportProgress.rate}%</span></div>
                <Progress value={reportProgress.rate} className="mt-5 h-2 bg-slate-100" />
                <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
                  <ProgressCell label="已确认" value={reportProgress.confirmed} tone="text-emerald-700 bg-emerald-50" />
                  <ProgressCell label="待审核" value={reportProgress.submitted} tone="text-amber-700 bg-amber-50" />
                  <ProgressCell label="未报送" value={reportProgress.missing} tone="text-slate-700 bg-slate-50" />
                  <ProgressCell label="已驳回" value={reportProgress.rejected} tone="text-red-700 bg-red-50" />
                </div>
                {canReview && reportProgress.submitted > 0 && <Button asChild variant="outline" className="mt-4 w-full"><Link href="/dashboard/base/metrics">处理待审核数据<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-2"><UsersRound className="h-4 w-4 text-emerald-600" /><h2 className="font-semibold text-slate-950">就业带动情况</h2></div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">就业人数</p><p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{Number(totals.employees || 0).toLocaleString("zh-CN")}</p><p className="text-[11px] text-slate-400">人</p></div>
                  <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs text-emerald-600">本地就业</p><p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-900">{Number(totals.localEmployees || 0).toLocaleString("zh-CN")}</p><p className="text-[11px] text-emerald-600">人</p></div>
                </div>
                <div className="mt-5"><div className="mb-2 flex items-center justify-between text-xs"><span className="text-slate-500">本地用工占比</span><span className="font-semibold text-slate-700">{localEmploymentRate}%</span></div><Progress value={localEmploymentRate} className="h-2 bg-slate-100" /></div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function ProgressCell({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className={cn("rounded-xl p-3", tone)}><p className="text-xs opacity-75">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums">{value}<span className="ml-1 text-xs font-normal">家</span></p></div>;
}
