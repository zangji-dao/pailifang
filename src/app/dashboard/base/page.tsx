"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  FileCheck2,
  FilePenLine,
  FileSignature,
  GitBranch,
  Loader2,
  MapPin,
  Plus,
  Route,
  Warehouse,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Application {
  id: string;
  applicationNo: string;
  applicationDate: string | null;
  enterpriseName: string;
  applicationType: "new" | "migration";
  approvalStatus: "filling" | "pending" | "approved" | "rejected";
  approvedAt: string | null;
  assignedAddress: string | null;
  createdAt: string;
}

interface Contract {
  id: string;
  enterpriseId: string;
  status: string;
  createdAt: string;
}

interface EnterpriseStats {
  total: number;
  tenant: number;
  service: number;
  active: number;
}

interface RegistrationNumber {
  id: string;
  available: boolean;
  enterprise_id?: string | null;
}

interface Space {
  id: string;
  isOccupied: boolean;
  regNumbers?: RegistrationNumber[];
}

interface Meter {
  id: string;
  spaces?: Space[];
}

interface BaseResource {
  id: string;
  name: string;
  meters?: Meter[];
}

interface DashboardData {
  applications: Application[];
  contracts: Contract[];
  enterpriseStats: EnterpriseStats;
  bases: BaseResource[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

const EMPTY_DATA: DashboardData = {
  applications: [],
  contracts: [],
  enterpriseStats: { total: 0, tenant: 0, service: 0, active: 0 },
  bases: [],
};

const STATUS_CONFIG: Record<Application["approvalStatus"], { label: string; className: string }> = {
  filling: { label: "填报中", className: "border-cyan-200 bg-cyan-50 text-cyan-700" },
  pending: { label: "待审批", className: "border-blue-200 bg-blue-50 text-blue-700" },
  approved: { label: "已通过", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  rejected: { label: "已驳回", className: "border-red-200 bg-red-50 text-red-700" },
};

async function requestData<T>(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal });
  const result = await response.json() as ApiResponse<T>;
  if (!response.ok || !result.success) throw new Error(result.error || "数据加载失败");
  return result.data;
}

function formatPercent(value: number) {
  return value.toLocaleString("zh-CN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatDate(value: string | null) {
  if (!value) return "未填写";
  return value.slice(0, 10).replaceAll("-", ".");
}

export default function BaseBusinessDashboardPage() {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      const results = await Promise.allSettled([
        requestData<Application[]>("/api/applications/list", controller.signal),
        requestData<Contract[]>("/api/contracts", controller.signal),
        requestData<EnterpriseStats>("/api/enterprises/stats", controller.signal),
        requestData<BaseResource[]>("/api/bases/cascade", controller.signal),
      ]);

      if (controller.signal.aborted) return;

      const errors: string[] = [];
      const getResult = <T,>(result: PromiseSettledResult<T>, fallback: T, label: string) => {
        if (result.status === "fulfilled") return result.value;
        errors.push(label);
        return fallback;
      };

      setData({
        applications: getResult(results[0], [], "入驻申请"),
        contracts: getResult(results[1], [], "合同数据"),
        enterpriseStats: getResult(results[2], EMPTY_DATA.enterpriseStats, "企业统计"),
        bases: getResult(results[3], [], "基地资源"),
      });
      setLoadErrors(errors);
      setLoading(false);
    };

    void loadData();
    return () => controller.abort();
  }, []);

  const overview = useMemo(() => {
    const statusCounts = {
      filling: data.applications.filter((item) => item.approvalStatus === "filling").length,
      pending: data.applications.filter((item) => item.approvalStatus === "pending").length,
      approved: data.applications.filter((item) => item.approvalStatus === "approved").length,
      rejected: data.applications.filter((item) => item.approvalStatus === "rejected").length,
    };
    const submitted = data.applications.length - statusCounts.filling;
    const decided = statusCounts.approved + statusCounts.rejected;
    const signedContracts = data.contracts.filter((contract) => contract.status === "signed").length;
    const meters = data.bases.flatMap((base) => base.meters || []);
    const spaces = meters.flatMap((meter) => meter.spaces || []);
    const registrationNumbers = spaces.flatMap((space) => space.regNumbers || []);
    const occupiedRegistrationNumbers = registrationNumbers.filter((item) => item.available === false || Boolean(item.enterprise_id)).length;
    const availableRegistrationNumbers = Math.max(registrationNumbers.length - occupiedRegistrationNumbers, 0);
    const monthlyApplications = data.applications.filter((application) => (application.createdAt || application.applicationDate || "").startsWith("2026-08")).length;
    const approvalRate = decided > 0 ? (statusCounts.approved / decided) * 100 : 0;
    const occupancyRate = registrationNumbers.length > 0 ? (occupiedRegistrationNumbers / registrationNumbers.length) * 100 : 0;
    const processCompletionRate = data.applications.length > 0 ? Math.min((data.enterpriseStats.tenant / data.applications.length) * 100, 100) : 0;
    const approvedWithoutContract = Math.max(statusCounts.approved - signedContracts, 0);
    const approvedWithoutAddress = data.applications.filter((application) => application.approvalStatus === "approved" && !application.assignedAddress).length;

    return {
      statusCounts,
      submitted,
      signedContracts,
      meters: meters.length,
      spaces: spaces.length,
      registrationNumbers: registrationNumbers.length,
      occupiedRegistrationNumbers,
      availableRegistrationNumbers,
      monthlyApplications,
      approvalRate,
      occupancyRate,
      processCompletionRate,
      approvedWithoutContract,
      approvedWithoutAddress,
      pendingTasks: statusCounts.filling + statusCounts.pending + approvedWithoutContract + approvedWithoutAddress,
    };
  }, [data]);

  const flowStages = [
    { label: "申请创建", description: "已建立入驻申请", value: data.applications.length, icon: FilePenLine, tone: "slate" },
    { label: "提交审批", description: "进入审批流程", value: overview.submitted, icon: GitBranch, tone: "blue" },
    { label: "审批通过", description: "具备办理条件", value: overview.statusCounts.approved, icon: FileCheck2, tone: "emerald" },
    { label: "合同签署", description: "完成入驻签约", value: overview.signedContracts, icon: FileSignature, tone: "amber" },
    { label: "完成入驻", description: "企业地址已落位", value: data.enterpriseStats.tenant, icon: Building2, tone: "violet" },
  ] as const;

  const recentApplications = useMemo(() => {
    return [...data.applications]
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
      .slice(0, 5);
  }, [data.applications]);

  if (loading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <div className="text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-500" /><p className="mt-3 text-sm text-slate-400">正在汇总基地入驻业务</p></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0f172a] p-5 text-white shadow-[0_18px_50px_-32px_rgba(15,23,42,0.8)] sm:p-7">
        <div className="absolute -right-16 -top-28 h-72 w-72 rounded-full border border-amber-300/10 bg-amber-300/[0.04]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400"><CalendarDays className="h-3.5 w-3.5" /><span>业务数据实时汇总</span></div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">Base Settlement Operations</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[30px]">基地入驻业务看板</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">聚焦企业从申请填报、审批、合同签署、地址分配到正式入驻的业务进度与待办事项。</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-slate-300">{data.bases.length} 个运营基地</span>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-slate-300">流程完成率 {formatPercent(overview.processCompletionRate)}%</span>
              <span className="rounded-full border border-amber-300/15 bg-amber-300/10 px-3 py-1.5 text-amber-200">{overview.pendingTasks} 项业务待办</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row xl:justify-end">
            <Link href="/dashboard/base/applications/new?new=true" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300"><Plus className="h-4 w-4" />新建入驻申请</Link>
            <Link href="/dashboard/base/applications" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 text-sm font-medium text-white transition-colors hover:bg-white/10">查看申请列表<ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {loadErrors.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /><span>{loadErrors.join("、")}暂时加载失败，其余看板数据仍可正常查看。</span></div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="本月新增申请" value={overview.monthlyApplications} unit="件" note={`累计申请 ${data.applications.length} 件`} icon={FilePenLine} tone="blue" />
        <MetricCard label="待审批申请" value={overview.statusCounts.pending} unit="件" note={`另有 ${overview.statusCounts.filling} 件填报中`} icon={ClipboardCheck} tone="amber" />
        <MetricCard label="审批通过率" value={formatPercent(overview.approvalRate)} unit="%" note={`已通过 ${overview.statusCounts.approved} · 已驳回 ${overview.statusCounts.rejected}`} icon={CheckCircle2} tone="emerald" />
        <MetricCard label="已入驻企业" value={data.enterpriseStats.tenant} unit="家" note={`企业档案共 ${data.enterpriseStats.total} 家`} icon={Building2} tone="violet" />
      </section>

      <section className="grid gap-5 xl:grid-cols-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div><div className="flex items-center gap-2"><Route className="h-4 w-4 text-amber-700" /><h2 className="font-semibold text-slate-950">企业入驻流程进度</h2></div><p className="mt-1 text-xs text-slate-400">按业务阶段汇总当前办理数量</p></div>
            <span className="w-fit rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">全流程完成 {data.enterpriseStats.tenant} 家</span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {flowStages.map((stage, index) => {
              const progress = data.applications.length > 0 ? Math.min((stage.value / data.applications.length) * 100, 100) : 0;
              return <FlowStage key={stage.label} index={index + 1} {...stage} progress={progress} />;
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-4">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" /><h2 className="font-semibold text-slate-950">业务待办</h2></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{overview.pendingTasks}</span></div>
          <div className="mt-5 space-y-2.5">
            <TodoLink label="待完善申请" value={overview.statusCounts.filling} description="企业资料仍在填报中" href="/dashboard/base/applications" tone="cyan" />
            <TodoLink label="待完成审批" value={overview.statusCounts.pending} description="等待管理人员审核" href="/dashboard/base/processes" tone="blue" />
            <TodoLink label="待签署合同" value={overview.approvedWithoutContract} description="审批通过后尚未完成签约" href="/dashboard/base/contracts" tone="amber" />
            <TodoLink label="待分配地址" value={overview.approvedWithoutAddress} description="已通过但尚未完成地址落位" href="/dashboard/base/addresses" tone="red" />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-12">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-8">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 className="font-semibold text-slate-950">近期入驻申请</h2><p className="mt-0.5 text-xs text-slate-400">最近创建的企业入驻业务</p></div><Link href="/dashboard/base/applications" className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-950">全部申请<ArrowRight className="h-3.5 w-3.5" /></Link></div>
          {recentApplications.length > 0 ? (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-left"><thead><tr className="border-b border-slate-100 bg-slate-50/70 text-xs text-slate-400"><th className="px-6 py-3 font-medium">申请编号</th><th className="px-4 py-3 font-medium">企业名称</th><th className="px-4 py-3 font-medium">申请类型</th><th className="px-4 py-3 font-medium">当前状态</th><th className="px-6 py-3 text-right font-medium">申请日期</th></tr></thead><tbody className="divide-y divide-slate-100">{recentApplications.map((application) => <ApplicationRow key={application.id} application={application} />)}</tbody></table>
              </div>
              <div className="divide-y divide-slate-100 md:hidden">{recentApplications.map((application) => <ApplicationMobileCard key={application.id} application={application} />)}</div>
            </>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><FilePenLine className="h-5 w-5" /></div><h3 className="mt-4 font-semibold text-slate-900">暂无入驻申请</h3><p className="mt-1 max-w-sm text-sm text-slate-400">创建第一条入驻申请后，审批进度和业务待办会自动汇总到这里。</p><Link href="/dashboard/base/applications/new?new=true" className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800"><Plus className="h-4 w-4" />新建申请</Link></div>
          )}
        </div>

        <div className="space-y-5 xl:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2"><Warehouse className="h-4 w-4 text-amber-700" /><h2 className="font-semibold text-slate-950">基地载体资源</h2></div>
            <div className="mt-5 grid grid-cols-2 gap-3"><ResourceBox label="运营基地" value={data.bases.length} unit="个" /><ResourceBox label="物业载体" value={overview.meters} unit="个" /><ResourceBox label="物理空间" value={overview.spaces} unit="个" /><ResourceBox label="可用工位" value={overview.availableRegistrationNumbers} unit="个" emphasize /></div>
            <div className="mt-5"><div className="mb-2 flex items-center justify-between text-xs"><span className="text-slate-500">工位分配率</span><span className="font-semibold tabular-nums text-slate-700">{formatPercent(overview.occupancyRate)}%</span></div><Progress value={overview.occupancyRate} className="h-1.5 bg-slate-100" /><p className="mt-3 text-xs text-slate-400">共 {overview.registrationNumbers} 个工位，已分配 {overview.occupiedRegistrationNumbers} 个。</p></div>
            <Link href="/dashboard/base/sites" className="mt-5 flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"><MapPin className="h-4 w-4" />查看基地资源</Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-emerald-600" /><h2 className="font-semibold text-slate-950">申请状态构成</h2></div>
            <div className="mt-5 space-y-4">{(["filling", "pending", "approved", "rejected"] as const).map((status) => { const value = overview.statusCounts[status]; const percentage = data.applications.length > 0 ? (value / data.applications.length) * 100 : 0; return <div key={status}><div className="mb-1.5 flex items-center justify-between text-sm"><span className="text-slate-600">{STATUS_CONFIG[status].label}</span><span className="font-medium tabular-nums text-slate-500">{value} 件 · {formatPercent(percentage)}%</span></div><Progress value={percentage} className="h-1.5 bg-slate-100" /></div>; })}</div>
          </div>
        </div>
      </section>

    </div>
  );
}

function MetricCard({ label, value, unit, note, icon: Icon, tone }: { label: string; value: number | string; unit: string; note: string; icon: LucideIcon; tone: "blue" | "amber" | "emerald" | "violet" }) {
  const tones = { blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700", emerald: "bg-emerald-50 text-emerald-700", violet: "bg-violet-50 text-violet-700" };
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-slate-400">{label}</p><div className="mt-2 flex items-end gap-1.5"><p className="text-2xl font-semibold tracking-tight tabular-nums text-slate-950 sm:text-[28px]">{value}</p><span className="pb-0.5 text-xs text-slate-400">{unit}</span></div></div><div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", tones[tone])}><Icon className="h-4 w-4" /></div></div><p className="mt-3 text-xs text-slate-400">{note}</p></div>;
}

function FlowStage({ index, label, description, value, progress, icon: Icon, tone }: { index: number; label: string; description: string; value: number; progress: number; icon: LucideIcon; tone: "slate" | "blue" | "emerald" | "amber" | "violet" }) {
  const tones = { slate: "bg-slate-100 text-slate-700", blue: "bg-blue-50 text-blue-700", emerald: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", violet: "bg-violet-50 text-violet-700" };
  return <div className="relative rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", tones[tone])}><Icon className="h-4 w-4" /></div><span className="text-[10px] font-semibold text-slate-300">0{index}</span></div><p className="mt-4 text-sm font-semibold text-slate-900">{label}</p><p className="mt-1 text-[11px] text-slate-400">{description}</p><div className="mt-4 flex items-end justify-between"><span className="text-2xl font-semibold tabular-nums text-slate-950">{value}</span><span className="text-[10px] text-slate-400">{formatPercent(progress)}%</span></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-800" style={{ width: `${progress}%` }} /></div></div>;
}

function TodoLink({ label, value, description, href, tone }: { label: string; value: number; description: string; href: string; tone: "cyan" | "blue" | "amber" | "red" }) {
  const tones = { cyan: "bg-cyan-50 text-cyan-700", blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700", red: "bg-red-50 text-red-700" };
  return <Link href={href} className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-colors hover:border-slate-200 hover:bg-slate-50"><span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold tabular-nums", tones[tone])}>{value}</span><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-slate-700">{label}</span><span className="mt-0.5 block truncate text-[11px] text-slate-400">{description}</span></span><ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600" /></Link>;
}

function ApplicationRow({ application }: { application: Application }) {
  const status = STATUS_CONFIG[application.approvalStatus];
  return <tr className="text-sm transition-colors hover:bg-slate-50/70"><td className="px-6 py-4"><Link href={`/dashboard/base/applications/${application.id}`} className="font-medium text-slate-700 hover:text-slate-950">{application.applicationNo}</Link></td><td className="px-4 py-4 font-medium text-slate-800">{application.enterpriseName}</td><td className="px-4 py-4 text-slate-500">{application.applicationType === "migration" ? "迁移企业" : "新建企业"}</td><td className="px-4 py-4"><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", status.className)}>{status.label}</span></td><td className="px-6 py-4 text-right text-slate-400">{formatDate(application.applicationDate || application.createdAt)}</td></tr>;
}

function ApplicationMobileCard({ application }: { application: Application }) {
  const status = STATUS_CONFIG[application.approvalStatus];
  return <Link href={`/dashboard/base/applications/${application.id}`} className="block p-4 hover:bg-slate-50"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{application.enterpriseName}</p><p className="mt-1 text-xs text-slate-400">{application.applicationNo} · {formatDate(application.applicationDate || application.createdAt)}</p></div><span className={cn("inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium", status.className)}>{status.label}</span></div></Link>;
}

function ResourceBox({ label, value, unit, emphasize = false }: { label: string; value: number; unit: string; emphasize?: boolean }) {
  return <div className={cn("rounded-xl p-3", emphasize ? "bg-amber-50" : "bg-slate-50")}><p className={cn("text-[11px]", emphasize ? "text-amber-700" : "text-slate-400")}>{label}</p><div className="mt-1.5 flex items-end gap-1"><span className={cn("text-xl font-semibold tabular-nums", emphasize ? "text-amber-900" : "text-slate-900")}>{value}</span><span className="pb-0.5 text-[10px] text-slate-400">{unit}</span></div></div>;
}
