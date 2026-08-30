"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  FilePenLine,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  UsersRound,
  XCircle,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { User } from "../../types";

interface MetricEnterprise {
  id: string;
  name: string;
  creditCode: string | null;
  baseId: string | null;
  baseName: string | null;
}

interface MetricBase {
  id: string;
  name: string;
}

interface MetricOptions {
  bases: MetricBase[];
  enterprises: MetricEnterprise[];
}

interface MetricReport {
  id: string;
  enterpriseId: string;
  enterpriseName: string;
  baseId: string;
  baseName: string;
  reportingPeriod: string;
  revenue: string;
  taxTotal: string;
  taxLocal: string;
  employees: number;
  localEmployees: number;
  investment: string;
  status: "draft" | "submitted" | "confirmed" | "rejected";
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewComment: string | null;
}

interface MetricForm {
  enterpriseId: string;
  reportingPeriod: string;
  revenue: string;
  taxTotal: string;
  taxLocal: string;
  employees: string;
  localEmployees: string;
  investment: string;
}

const ALL = "all";
const now = new Date();
const CURRENT_PERIOD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const EMPTY_FORM: MetricForm = {
  enterpriseId: "",
  reportingPeriod: CURRENT_PERIOD,
  revenue: "",
  taxTotal: "",
  taxLocal: "",
  employees: "",
  localEmployees: "",
  investment: "",
};

const STATUS_CONFIG = {
  draft: { label: "草稿", className: "border-slate-200 bg-slate-50 text-slate-600" },
  submitted: { label: "待审核", className: "border-amber-200 bg-amber-50 text-amber-700" },
  confirmed: { label: "已确认", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  rejected: { label: "已驳回", className: "border-red-200 bg-red-50 text-red-700" },
} as const;

function formatMoney(value: string | number) {
  return Number(value || 0).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}

function formatPeriod(value: string) {
  const [year, month] = value.slice(0, 7).split("-");
  return `${year}年${month}月`;
}

function readUser() {
  try {
    const value = localStorage.getItem("user");
    return value ? JSON.parse(value) as User : null;
  } catch {
    return null;
  }
}

export default function BusinessMetricsPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [options, setOptions] = useState<MetricOptions>({ bases: [], enterprises: [] });
  const [reports, setReports] = useState<MetricReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MetricForm>(EMPTY_FORM);
  const [baseFilter, setBaseFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [periodFilter, setPeriodFilter] = useState(ALL);

  const permissions = user?.permissions ?? [];
  const canSubmit = permissions.includes("platform.manage") || permissions.includes("metrics.manage") || permissions.includes("metrics.submit");
  const canReview = permissions.includes("platform.manage") || permissions.includes("metrics.manage") || permissions.includes("metrics.review");

  const loadData = useCallback(async () => {
    setLoading(true);
    const [optionsResponse, reportsResponse] = await Promise.all([
      apiClient.get<MetricOptions>("/api/business-metrics/options"),
      apiClient.get<MetricReport[]>("/api/business-metrics"),
    ]);

    if (!optionsResponse.success || !optionsResponse.data || !reportsResponse.success || !reportsResponse.data) {
      toast({
        title: "经营数据加载失败",
        description: optionsResponse.error || reportsResponse.error || "请稍后重试",
        variant: "destructive",
      });
    } else {
      setOptions(optionsResponse.data);
      setReports(reportsResponse.data);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    const userTimer = window.setTimeout(() => {
      setUser(readUser());
      void loadData();
    }, 0);
    return () => window.clearTimeout(userTimer);
  }, [loadData]);

  const filteredReports = useMemo(() => reports.filter((report) => (
    (baseFilter === ALL || report.baseId === baseFilter)
    && (statusFilter === ALL || report.status === statusFilter)
    && (periodFilter === ALL || report.reportingPeriod.startsWith(periodFilter))
  )), [baseFilter, periodFilter, reports, statusFilter]);

  const overview = useMemo(() => filteredReports.reduce((total, report) => ({
    revenue: total.revenue + Number(report.revenue),
    taxTotal: total.taxTotal + Number(report.taxTotal),
    employees: total.employees + report.employees,
    pending: total.pending + Number(report.status === "submitted"),
  }), { revenue: 0, taxTotal: 0, employees: 0, pending: 0 }), [filteredReports]);

  const periods = useMemo(() => Array.from(new Set(reports.map((report) => report.reportingPeriod.slice(0, 7)))).sort().reverse(), [reports]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, enterpriseId: options.enterprises[0]?.id ?? "" });
    setDialogOpen(true);
  };

  const openEdit = (report: MetricReport) => {
    setEditingId(report.id);
    setForm({
      enterpriseId: report.enterpriseId,
      reportingPeriod: report.reportingPeriod.slice(0, 7),
      revenue: report.revenue,
      taxTotal: report.taxTotal,
      taxLocal: report.taxLocal,
      employees: String(report.employees),
      localEmployees: String(report.localEmployees),
      investment: report.investment,
    });
    setDialogOpen(true);
  };

  const saveDraft = async () => {
    if (!form.enterpriseId || !form.reportingPeriod) {
      toast({ title: "请先选择企业和填报月份", variant: "destructive" });
      return;
    }

    setSaving(true);
    const response = await apiClient.post<MetricReport>("/api/business-metrics", form);
    setSaving(false);
    if (!response.success) {
      toast({ title: "保存失败", description: response.error, variant: "destructive" });
      return;
    }

    setDialogOpen(false);
    toast({ title: editingId ? "经营数据已更新" : "经营数据草稿已保存" });
    await loadData();
  };

  const submitReport = async (report: MetricReport) => {
    const response = await apiClient.post<MetricReport>(`/api/business-metrics/${report.id}/submit`);
    if (!response.success) {
      toast({ title: "提交失败", description: response.error, variant: "destructive" });
      return;
    }
    toast({ title: "已提交审核" });
    await loadData();
  };

  const reviewReport = async (report: MetricReport, approved: boolean) => {
    const comment = approved ? "" : window.prompt("请输入驳回原因")?.trim();
    if (!approved && !comment) return;

    const response = await apiClient.post<MetricReport>(`/api/business-metrics/${report.id}/review`, { approved, comment });
    if (!response.success) {
      toast({ title: "审核失败", description: response.error, variant: "destructive" });
      return;
    }
    toast({ title: approved ? "数据已确认并计入看板" : "数据已驳回" });
    await loadData();
  };

  if (loading) {
    return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-white shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
        <div className="relative px-5 py-6 sm:px-7 sm:py-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.14),transparent_30%)]" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                <BarChart3 className="h-3.5 w-3.5 text-cyan-300" />
                经营数据中心
              </div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">企业经营数据填报</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">按企业、基地和月份沉淀销售收入、税收、投资与就业数据，审核确认后自动进入工作台汇总。</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void loadData()} className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <RefreshCw className="mr-2 h-4 w-4" />刷新
              </Button>
              {canSubmit && (
                <Button onClick={openCreate} disabled={options.enterprises.length === 0} className="bg-amber-400 text-slate-950 hover:bg-amber-300">
                  <Plus className="mr-2 h-4 w-4" />新增填报
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "填报销售收入", value: `${formatMoney(overview.revenue)} 万`, icon: CircleDollarSign, tone: "text-cyan-700 bg-cyan-50" },
          { label: "填报税收", value: `${formatMoney(overview.taxTotal)} 万`, icon: ClipboardCheck, tone: "text-amber-700 bg-amber-50" },
          { label: "带动就业", value: `${overview.employees.toLocaleString("zh-CN")} 人`, icon: UsersRound, tone: "text-emerald-700 bg-emerald-50" },
          { label: "待审核", value: `${overview.pending} 条`, icon: FilePenLine, tone: "text-violet-700 bg-violet-50" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className={cn("mb-4 flex h-9 w-9 items-center justify-center rounded-xl", item.tone)}><item.icon className="h-4 w-4" /></div>
            <p className="text-xs text-slate-400">{item.label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-slate-950 sm:text-2xl">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
            <Select value={baseFilter} onValueChange={setBaseFilter}>
              <SelectTrigger><SelectValue placeholder="全部基地" /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>全部基地</SelectItem>{options.bases.map((base) => <SelectItem key={base.id} value={base.id}>{base.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger><SelectValue placeholder="全部月份" /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>全部月份</SelectItem>{periods.map((period) => <SelectItem key={period} value={period}>{formatPeriod(period)}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="全部状态" /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>全部状态</SelectItem>{Object.entries(STATUS_CONFIG).map(([value, config]) => <SelectItem key={value} value={value}>{config.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <p className="shrink-0 text-xs text-slate-400">共 {filteredReports.length} 条记录</p>
        </div>

        {filteredReports.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
            <Building2 className="h-10 w-10 text-slate-300" />
            <p className="mt-4 font-medium text-slate-700">当前范围暂无经营数据</p>
            <p className="mt-1 text-sm text-slate-400">由企业或园区填报员创建草稿，审核确认后进入首页看板。</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredReports.map((report) => (
                <article key={report.id} className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><h2 className="truncate font-medium text-slate-900">{report.enterpriseName}</h2><p className="mt-1 text-xs text-slate-400">{report.baseName} · {formatPeriod(report.reportingPeriod)}</p></div>
                    <Badge variant="outline" className={STATUS_CONFIG[report.status].className}>{STATUS_CONFIG[report.status].label}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">销售收入</p><p className="mt-1 font-semibold tabular-nums text-slate-800">{formatMoney(report.revenue)} 万</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">税收合计</p><p className="mt-1 font-semibold tabular-nums text-slate-800">{formatMoney(report.taxTotal)} 万</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">就业人数</p><p className="mt-1 font-semibold tabular-nums text-slate-800">{report.employees} 人</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">固定资产投资</p><p className="mt-1 font-semibold tabular-nums text-slate-800">{formatMoney(report.investment)} 万</p></div>
                  </div>
                  <ReportActions report={report} canSubmit={canSubmit} canReview={canReview} onEdit={openEdit} onSubmit={submitReport} onReview={reviewReport} />
                  {report.reviewComment && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">审核意见：{report.reviewComment}</p>}
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1080px] text-sm">
                <thead><tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-medium text-slate-400"><th className="px-5 py-3">企业 / 基地</th><th className="px-4 py-3">月份</th><th className="px-4 py-3 text-right">销售收入</th><th className="px-4 py-3 text-right">税收合计</th><th className="px-4 py-3 text-right">地方留成</th><th className="px-4 py-3 text-right">就业</th><th className="px-4 py-3 text-right">投资</th><th className="px-4 py-3">状态</th><th className="px-5 py-3 text-right">操作</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-4"><p className="font-medium text-slate-900">{report.enterpriseName}</p><p className="mt-1 text-xs text-slate-400">{report.baseName}</p></td>
                      <td className="px-4 py-4 text-slate-600">{formatPeriod(report.reportingPeriod)}</td>
                      <td className="px-4 py-4 text-right tabular-nums text-slate-700">{formatMoney(report.revenue)} 万</td>
                      <td className="px-4 py-4 text-right font-medium tabular-nums text-slate-900">{formatMoney(report.taxTotal)} 万</td>
                      <td className="px-4 py-4 text-right tabular-nums text-slate-600">{formatMoney(report.taxLocal)} 万</td>
                      <td className="px-4 py-4 text-right tabular-nums text-slate-600">{report.employees} 人</td>
                      <td className="px-4 py-4 text-right tabular-nums text-slate-600">{formatMoney(report.investment)} 万</td>
                      <td className="px-4 py-4"><Badge variant="outline" className={STATUS_CONFIG[report.status].className}>{STATUS_CONFIG[report.status].label}</Badge></td>
                      <td className="px-5 py-4"><ReportActions report={report} canSubmit={canSubmit} canReview={canReview} onEdit={openEdit} onSubmit={submitReport} onReview={reviewReport} compact /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editingId ? "编辑经营数据" : "新增经营数据"}</DialogTitle><DialogDescription>金额单位统一为万元，人员数量按月末在岗口径填报。</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label>企业</Label><Select value={form.enterpriseId} onValueChange={(enterpriseId) => setForm((current) => ({ ...current, enterpriseId }))} disabled={Boolean(editingId)}><SelectTrigger><SelectValue placeholder="选择企业" /></SelectTrigger><SelectContent>{options.enterprises.map((enterprise) => <SelectItem key={enterprise.id} value={enterprise.id}>{enterprise.name}{enterprise.baseName ? ` · ${enterprise.baseName}` : ""}</SelectItem>)}</SelectContent></Select></div>
            <MetricInput label="填报月份" type="month" value={form.reportingPeriod} onChange={(value) => setForm((current) => ({ ...current, reportingPeriod: value }))} disabled={Boolean(editingId)} />
            <MetricInput label="销售收入（万元）" value={form.revenue} onChange={(value) => setForm((current) => ({ ...current, revenue: value }))} />
            <MetricInput label="税收合计（万元）" value={form.taxTotal} onChange={(value) => setForm((current) => ({ ...current, taxTotal: value }))} />
            <MetricInput label="地方留成（万元）" value={form.taxLocal} onChange={(value) => setForm((current) => ({ ...current, taxLocal: value }))} />
            <MetricInput label="就业人数（人）" step="1" value={form.employees} onChange={(value) => setForm((current) => ({ ...current, employees: value }))} />
            <MetricInput label="本地就业（人）" step="1" value={form.localEmployees} onChange={(value) => setForm((current) => ({ ...current, localEmployees: value }))} />
            <MetricInput label="固定资产投资（万元）" value={form.investment} onChange={(value) => setForm((current) => ({ ...current, investment: value }))} />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button><Button onClick={() => void saveDraft()} disabled={saving} className="bg-slate-950 text-white hover:bg-slate-800">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}保存草稿</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricInput({ label, value, onChange, type = "number", step = "0.01", disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; step?: string; disabled?: boolean }) {
  return <div className="space-y-2"><Label>{label}</Label><Input type={type} min={type === "number" ? "0" : undefined} step={type === "number" ? step : undefined} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} /></div>;
}

function ReportActions({ report, canSubmit, canReview, onEdit, onSubmit, onReview, compact = false }: { report: MetricReport; canSubmit: boolean; canReview: boolean; onEdit: (report: MetricReport) => void; onSubmit: (report: MetricReport) => Promise<void>; onReview: (report: MetricReport, approved: boolean) => Promise<void>; compact?: boolean }) {
  return (
    <div className={cn("flex flex-wrap gap-2", compact && "justify-end")}>
      {canSubmit && ["draft", "rejected"].includes(report.status) && <Button size="sm" variant="outline" onClick={() => onEdit(report)}><FilePenLine className="mr-1.5 h-3.5 w-3.5" />编辑</Button>}
      {canSubmit && ["draft", "rejected"].includes(report.status) && <Button size="sm" onClick={() => void onSubmit(report)} className="bg-slate-900 text-white hover:bg-slate-800"><Send className="mr-1.5 h-3.5 w-3.5" />提交</Button>}
      {canReview && report.status === "submitted" && <Button size="sm" onClick={() => void onReview(report, true)} className="bg-emerald-600 text-white hover:bg-emerald-500"><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />通过</Button>}
      {canReview && report.status === "submitted" && <Button size="sm" variant="outline" onClick={() => void onReview(report, false)} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"><XCircle className="mr-1.5 h-3.5 w-3.5" />驳回</Button>}
    </div>
  );
}
