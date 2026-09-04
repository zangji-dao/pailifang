"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Building2,
  CalendarDays,
  Droplets,
  Flame,
  Gift,
  House,
  MapPin,
  PencilLine,
  Phone,
  PhoneCall,
  ReceiptText,
  UserRound,
  WalletCards,
  Wifi,
  Zap,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { BaseDetail, BaseEnterprise, Meter } from "../types";
import {
  buildUtilityTask,
  buildMeterUtilityTasks,
  getUtilityAccount,
  getUtilityBillingPeriod,
  getUtilityCycle,
  getUtilityResponsibility,
  type ManagedUtilityType,
  type UtilityTask,
} from "../utilityTasks";

const processStatusMap: Record<string, string> = {
  new: "新建",
  draft: "资料准备",
  pending_registration: "工商办理",
  pending_change: "信息变更",
  pending_contract: "合同办理",
  pending_payment: "待缴费",
  active: "正常经营",
  completed: "已入驻",
  terminated: "已终止",
};

function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center">
      <Building2 className="mb-3 h-8 w-8 text-slate-300" />
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

export function EnterprisePanel({
  enterprises,
  title,
  description,
  compact = false,
}: {
  enterprises: BaseEnterprise[];
  title: string;
  description: string;
  compact?: boolean;
}) {
  const visibleEnterprises = compact ? enterprises.slice(0, 4) : enterprises;

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/30">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {enterprises.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {visibleEnterprises.length === 0 ? (
          <EmptyState text="当前基地暂未登记相关企业" />
        ) : (
          <div className="space-y-3">
            {visibleEnterprises.map(enterprise => (
              <Link
                key={`${enterprise.relationType}-${enterprise.id}`}
                href={`/dashboard/base/tenants/${enterprise.id}`}
                className="group grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-cyan-200 hover:bg-cyan-50/40 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] md:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-slate-900">{enterprise.name}</span>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
                      {processStatusMap[enterprise.processStatus] || enterprise.processStatus || "未设置"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-400">
                    {enterprise.enterpriseCode || enterprise.creditCode || "尚未生成企业编号"}
                  </p>
                </div>

                <div className="space-y-1 text-sm text-slate-500">
                  <p className="flex items-center gap-2">
                    <UserRound className="h-3.5 w-3.5 text-slate-400" />
                    {enterprise.legalPerson || enterprise.adminName || "负责人未登记"}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">
                      {enterprise.locations[0] || enterprise.businessAddress || enterprise.registeredAddress || "尚未分配空间"}
                    </span>
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 md:justify-end">
                  <div className="text-left md:text-right">
                    <p className="text-lg font-semibold tabular-nums text-slate-900">{enterprise.assignedWorkstationCount}</p>
                    <p className="text-xs text-slate-400">已分配工位</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-600" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {compact && enterprises.length > visibleEnterprises.length && (
          <p className="mt-4 text-center text-xs text-slate-400">另有 {enterprises.length - visibleEnterprises.length} 家企业，请在“企业信息”标签查看</p>
        )}
      </div>
    </section>
  );
}

type PaymentCategory = ManagedUtilityType;

function getCategoryVisual(code: string, propertyFeeFree: boolean) {
  if (code === "electricity") return { icon: Zap, className: "bg-amber-50 text-amber-700" };
  if (code === "water") return { icon: Droplets, className: "bg-sky-50 text-sky-700" };
  if (code === "heating") return { icon: Flame, className: "bg-orange-50 text-orange-700" };
  if (code === "property_fee") {
    return { icon: Gift, className: propertyFeeFree ? "bg-emerald-50 text-emerald-700" : "bg-teal-50 text-teal-700" };
  }
  if (code === "rent") return { icon: House, className: "bg-rose-50 text-rose-700" };
  if (code === "telephone") return { icon: PhoneCall, className: "bg-indigo-50 text-indigo-700" };
  if (code === "network") return { icon: Wifi, className: "bg-violet-50 text-violet-700" };
  return { icon: ReceiptText, className: "bg-slate-100 text-slate-700" };
}

function getMonthlyPeriodAtOffset(offset: number, date = new Date()) {
  const targetDate = new Date(date.getFullYear(), date.getMonth() + offset, 1);
  return `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;
}

function MonthPeriodSelect({
  value,
  onChange,
  label,
  years,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  years: number[];
}) {
  const [yearValue, monthValue] = value.split("-");
  const year = Number(yearValue);
  const month = Number(monthValue);
  const selectClassName = "h-10 min-w-0 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";
  const updateYear = (nextYear: number) => onChange(`${nextYear}-${String(month).padStart(2, "0")}`);
  const updateMonth = (nextMonth: number) => onChange(`${year}-${String(nextMonth).padStart(2, "0")}`);

  return (
    <label className="block min-w-0">
      <span className="text-[11px] font-medium text-slate-400">{label}</span>
      <span className="mt-1.5 grid grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] gap-2">
        <select aria-label={`${label}年份`} value={year} onChange={event => updateYear(Number(event.target.value))} className={selectClassName}>
          {years.map(item => <option key={item} value={item}>{item} 年</option>)}
        </select>
        <select aria-label={`${label}月份`} value={month} onChange={event => updateMonth(Number(event.target.value))} className={selectClassName}>
          {Array.from({ length: 12 }, (_, index) => index + 1).map(item => (
            <option key={item} value={item}>{String(item).padStart(2, "0")} 月</option>
          ))}
        </select>
      </span>
    </label>
  );
}

function getMonthlyPeriodsInRange(start: string, end: string) {
  const [startYear, startMonth] = start.split("-").map(Number);
  const [endYear, endMonth] = end.split("-").map(Number);
  const hasValidStart = Number.isInteger(startYear) && Number.isInteger(startMonth) && startMonth >= 1 && startMonth <= 12;
  const hasValidEnd = Number.isInteger(endYear) && Number.isInteger(endMonth) && endMonth >= 1 && endMonth <= 12;
  if (!hasValidStart || !hasValidEnd) return [];

  const first = new Date(startYear, startMonth - 1, 1);
  const last = new Date(endYear, endMonth - 1, 1);
  const rangeStart = first <= last ? first : last;
  const rangeEnd = first <= last ? last : first;
  const periods: string[] = [];

  for (const date = new Date(rangeStart); date <= rangeEnd; date.setMonth(date.getMonth() + 1)) {
    periods.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  }

  return periods;
}

function getAnnualPeriodsInRange(type: ManagedUtilityType, startYear: number, endYear: number) {
  const firstYear = Math.min(startYear, endYear);
  const lastYear = Math.max(startYear, endYear);
  return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => {
    const year = firstYear + index;
    return type === "heating" ? `${year}-${year + 1}` : String(year);
  });
}

function getStatisticsRangeLabel(periods: string[], cycle: "monthly" | "annual") {
  if (periods.length === 0) return "未选择时间范围";
  const first = periods[0];
  const last = periods[periods.length - 1];
  if (first === last) return cycle === "monthly" ? `${first.replace("-", " 年 ")} 月` : first;
  return cycle === "monthly"
    ? `${first.replace("-", " 年 ")} 月 至 ${last.replace("-", " 年 ")} 月`
    : `${first} 至 ${last}`;
}

const consumptionChartConfig = {
  amount: {
    label: "消费金额",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function PropertyPaymentPanel({
  base,
  compact = false,
}: {
  base: BaseDetail;
  compact?: boolean;
}) {
  const [activeCategory, setActiveCategory] = useState<PaymentCategory>("electricity");
  const [selectedMeterId, setSelectedMeterId] = useState("all");
  const [monthlyRangeStart, setMonthlyRangeStart] = useState(() => getMonthlyPeriodAtOffset(-5));
  const [monthlyRangeEnd, setMonthlyRangeEnd] = useState(() => getUtilityBillingPeriod("electricity"));
  const [annualRangeStartYear, setAnnualRangeStartYear] = useState(() => Number(getUtilityBillingPeriod("heating").slice(0, 4)));
  const [annualRangeEndYear, setAnnualRangeEndYear] = useState(() => Number(getUtilityBillingPeriod("heating").slice(0, 4)));
  const currentDate = new Date();
  const propertyFeeFree = base.propertyFeeMode === "free";
  const activeFeeTypes = base.feeTypes.filter(feeType => feeType.isActive);
  const recordedMonthlyYears = base.meters.flatMap(meter => meter.utilityPayments)
    .filter(payment => getUtilityCycle(payment.utilityType, base.feeTypes) === "monthly")
    .map(payment => Number(payment.billingPeriod.slice(0, 4)))
    .filter(year => Number.isInteger(year) && year >= 2000 && year <= 2100);
  const availableMonthlyYears = Array.from(new Set([
    Number(monthlyRangeStart.slice(0, 4)),
    Number(monthlyRangeEnd.slice(0, 4)),
    ...Array.from({ length: 7 }, (_, index) => currentDate.getFullYear() + 1 - index),
    ...recordedMonthlyYears,
  ])).sort((first, second) => second - first);
  const recordedAnnualYears = base.meters.flatMap(meter => meter.utilityPayments)
    .map(payment => Number(payment.billingPeriod.slice(0, 4)))
    .filter(year => Number.isInteger(year) && year >= 2000 && year <= 2100);
  const availableAnnualYears = Array.from(new Set([
    annualRangeStartYear,
    annualRangeEndYear,
    currentDate.getFullYear(),
    currentDate.getFullYear() - 1,
    ...recordedAnnualYears,
  ])).sort((first, second) => second - first);
  const selectedBillingPeriods: Partial<Record<ManagedUtilityType, string>> = Object.fromEntries(
    activeFeeTypes.map(feeType => [
      feeType.code,
      feeType.billingCycle === "monthly"
        ? monthlyRangeEnd
        : feeType.code === "heating"
          ? `${annualRangeEndYear}-${annualRangeEndYear + 1}`
          : String(annualRangeEndYear),
    ]),
  );
  const rows = [...base.meters]
    .sort((first, second) => (first.sortOrder || 0) - (second.sortOrder || 0))
    .map(meter => {
      const tasks = buildMeterUtilityTasks(meter, base.propertyFeeMode, currentDate, selectedBillingPeriods, base.feeTypes);
      return { meter, tasks };
    });
  const taskAmount = (task: UtilityTask) => Number(task.payment?.amount || 0);
  const categoryTasks: Record<PaymentCategory, UtilityTask[]> = Object.fromEntries(
    activeFeeTypes.map(feeType => [
      feeType.code,
      rows.flatMap(row => row.tasks.filter(task => task.utilityType === feeType.code)),
    ]),
  );
  const categoryRows: Record<PaymentCategory, typeof rows> = Object.fromEntries(
    activeFeeTypes.map(feeType => [
      feeType.code,
      rows.filter(row => row.tasks.some(task => task.utilityType === feeType.code)),
    ]),
  );
  const summaryItems = activeFeeTypes
    .map(feeType => {
      const tasks = categoryTasks[feeType.code] || [];
      const period = tasks[0]?.billingPeriod || getUtilityBillingPeriod(feeType.code, currentDate, base.feeTypes);
      return {
        key: feeType.code,
        ...getCategoryVisual(feeType.code, propertyFeeFree),
        label: feeType.name,
        billingPeriod: period,
        billingCycle: feeType.billingCycle,
        cycleLabel: feeType.billingCycle === "monthly" ? "月度数据" : "年度数据",
        count: tasks.length,
      };
    })
    .filter(item => item.count > 0);
  const effectiveCategory = summaryItems.some(item => item.key === activeCategory)
    ? activeCategory
    : summaryItems[0]?.key;
  const activeSummary = summaryItems.find(item => item.key === effectiveCategory) || null;
  const activeCycle = activeSummary?.billingCycle || "monthly";
  const selectedMeter = selectedMeterId === "all"
    ? null
    : base.meters.find(meter => meter.id === selectedMeterId) || null;
  const scopedMeters = selectedMeter ? [selectedMeter] : base.meters;
  const statisticsPeriods = activeSummary
    ? activeCycle === "monthly"
      ? getMonthlyPeriodsInRange(monthlyRangeStart, monthlyRangeEnd)
      : getAnnualPeriodsInRange(activeSummary.key, annualRangeStartYear, annualRangeEndYear)
    : [];
  const statisticsTasks = activeSummary
    ? scopedMeters.flatMap(meter => statisticsPeriods
      .map(period => buildUtilityTask(meter, activeSummary.key, base.propertyFeeMode, currentDate, period))
      .filter((task): task is UtilityTask => task !== null))
    : [];
  const statisticsRequiredTasks = statisticsTasks.filter(task => task.status !== "exempt");
  const billedAmount = statisticsRequiredTasks.reduce((total, task) => total + taskAmount(task), 0);
  const recordedTaskCount = statisticsRequiredTasks.filter(task => task.payment).length;
  const statisticsRangeLabel = getStatisticsRangeLabel(statisticsPeriods, activeCycle);
  const chartData = statisticsPeriods.map(period => {
    const periodTasks = statisticsRequiredTasks.filter(task => task.billingPeriod === period && task.payment);
    return {
      period,
      label: activeCycle === "monthly" ? `${period.slice(5)} 月` : period,
      amount: periodTasks.reduce((total, task) => total + taskAmount(task), 0),
      recordCount: periodTasks.length,
    };
  });
  const recordedPeriodCount = chartData.filter(item => item.recordCount > 0).length;
  const averagePeriodAmount = recordedPeriodCount > 0 ? billedAmount / recordedPeriodCount : 0;
  const statisticsTasksByMeter = new Map<string, UtilityTask[]>();
  statisticsTasks.forEach(task => {
    const tasks = statisticsTasksByMeter.get(task.meter.id) || [];
    tasks.push(task);
    statisticsTasksByMeter.set(task.meter.id, tasks);
  });
  const selectedRows = activeSummary
    ? categoryRows[activeSummary.key].filter(row => selectedMeterId === "all" || row.meter.id === selectedMeterId)
    : [];
  const visibleRows = compact ? selectedRows.slice(0, 4) : selectedRows;
  const entryPeriod = statisticsPeriods[statisticsPeriods.length - 1] || activeSummary?.billingPeriod;
  const getEntryHref = (meterId: string) => {
    const parameters = new URLSearchParams({
      from: "resources",
      fee: activeSummary?.key || "",
      period: entryPeriod || "",
    });
    return `/dashboard/base/sites/${base.id}/meters/${meterId}?${parameters.toString()}`;
  };
  const getRangeTasks = (meterId: string) => statisticsTasksByMeter.get(meterId) || [];
  const isRangeExempt = (meterId: string) => {
    const tasks = getRangeTasks(meterId);
    return tasks.length > 0 && tasks.every(task => task.status === "exempt");
  };
  const getMeterConsumptionSummary = (meterId: string) => {
    const tasks = getRangeTasks(meterId).filter(task => task.status !== "exempt");
    const recordedTasks = tasks.filter(task => task.payment);
    const quantity = recordedTasks.reduce((total, task) => total + Number(task.payment?.quantity || 0), 0);
    return {
      amount: recordedTasks.reduce((total, task) => total + taskAmount(task), 0),
      quantity,
      quantityUnit: recordedTasks.find(task => task.payment?.quantityUnit)?.payment?.quantityUnit || null,
      recordedCount: recordedTasks.length,
      expectedCount: tasks.length,
    };
  };
  const summaryGridClass = summaryItems.length >= 5
    ? "lg:grid-cols-5"
    : summaryItems.length === 4
      ? "lg:grid-cols-4"
      : summaryItems.length === 3
        ? "lg:grid-cols-3"
        : "lg:grid-cols-2";

  const updateMonthlyRangeStart = (value: string) => {
    if (!value) return;
    setMonthlyRangeStart(value);
    if (value > monthlyRangeEnd) setMonthlyRangeEnd(value);
  };

  const updateMonthlyRangeEnd = (value: string) => {
    if (!value) return;
    setMonthlyRangeEnd(value);
    if (value < monthlyRangeStart) setMonthlyRangeStart(value);
  };

  const updateAnnualRangeStart = (value: number) => {
    setAnnualRangeStartYear(value);
    if (value > annualRangeEndYear) setAnnualRangeEndYear(value);
  };

  const updateAnnualRangeEnd = (value: number) => {
    setAnnualRangeEndYear(value);
    if (value < annualRangeStartYear) setAnnualRangeStartYear(value);
  };

  const renderActiveFee = (row: typeof rows[number]) => {
    const { meter } = row;
    const summary = getMeterConsumptionSummary(meter.id);
    if (summary.expectedCount === 0) return <p className="text-sm text-slate-400">该物业未启用此费用</p>;

    if (isRangeExempt(meter.id)) {
      return (
        <div>
          <p className="font-semibold text-emerald-700">统计范围内免收</p>
          <p className="mt-2 text-xs text-slate-400">按基地物业费政策执行，无需建立消费记录</p>
        </div>
      );
    }

    return (
      <div>
        <p className={`font-semibold tabular-nums ${summary.recordedCount > 0 ? "text-slate-950" : "text-slate-400"}`}>
          {summary.recordedCount > 0 ? formatCurrency(summary.amount) : "未录入"}
        </p>
        {summary.quantity > 0 && (
          <p className="mt-1 text-xs font-medium tabular-nums text-slate-500">
            用量 {summary.quantity.toLocaleString("zh-CN")} {summary.quantityUnit || ""}
          </p>
        )}
      </div>
    );
  };

  const getAccountDetails = (meter: Meter) => {
    if (!effectiveCategory) return { label: "费用账户", value: "未登记", note: null };
    if (effectiveCategory === "property_fee") {
      return {
        label: "计费方式",
        value: propertyFeeFree ? "免收物业费" : "按年度计费",
        note: "按基地物业费政策执行",
      };
    }
    const account = getUtilityAccount(meter, effectiveCategory);
    const accountLabels: Record<string, string> = {
      electricity: "电力户号",
      water: "水费户号",
      heating: "取暖号",
      rent: "租赁合同/房号",
      telephone: "电话号码",
      network: "宽带账号",
    };
    return {
      label: accountLabels[effectiveCategory] || "费用账户",
      value: account.accountNumber || "未登记",
      note: account.provider,
    };
  };

  const renderAccountDetails = (meter: Meter) => {
    const account = getAccountDetails(meter);
    return (
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-400">{account.label}</p>
        <p className={`mt-1 truncate text-sm font-medium tabular-nums ${account.value === "未登记" ? "text-slate-400" : "text-slate-700"}`}>
          {account.value}
        </p>
        {account.note && <p className="mt-1 truncate text-xs text-slate-400">{account.note}</p>}
      </div>
    );
  };

  const getResponsibilityDetails = (meter: Meter, utilityType = effectiveCategory) => {
    if (!utilityType) {
      return { typeLabel: "未配置", responsibleName: "未指定", missing: true };
    }
    const responsibility = getUtilityResponsibility(meter, utilityType);
    if (responsibility.type === "customer") {
      const enterprise = base.tenantEnterprises.find(item => item.id === responsibility.enterpriseId);
      return {
        typeLabel: "使用方承担",
        responsibleName: enterprise?.name || "未指定入驻企业",
        missing: !enterprise,
      };
    }
    return {
      typeLabel: "管理方承担",
      responsibleName: base.organization?.name || base.managementCompanyName || "管理公司",
      missing: false,
    };
  };

  const renderResponsibilityDetails = (meter: Meter) => {
    const responsibility = getResponsibilityDetails(meter);
    return (
      <div className="min-w-0">
        <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${responsibility.missing ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
          {responsibility.typeLabel}
        </span>
        <p className={`mt-1.5 truncate text-sm font-medium ${responsibility.missing ? "text-rose-700" : "text-slate-700"}`}>
          {responsibility.responsibleName}
        </p>
        <p className="mt-1 text-[11px] text-slate-400">管理公司录入</p>
      </div>
    );
  };

  const renderEntryProgress = (meterId: string) => {
    const summary = getMeterConsumptionSummary(meterId);
    if (summary.recordedCount === 0) {
      return (
        <div>
          <p className="text-sm font-medium text-slate-500">暂无记录</p>
          <p className="mt-1 text-xs text-slate-400">所选范围 {summary.expectedCount} 期</p>
        </div>
      );
    }
    const progress = summary.expectedCount > 0
      ? Math.round((summary.recordedCount / summary.expectedCount) * 100)
      : 0;
    return (
      <div className="min-w-28 max-w-48">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium tabular-nums text-slate-700">已录入 {summary.recordedCount} 期</p>
          <span className="text-[11px] tabular-nums text-slate-400">{progress}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-cyan-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
    );
  };
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_18px_45px_-38px_rgba(15,23,42,0.7)]">
      <div className="px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-950">物业缴费</h2>
                <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">{rows.length} 个物业</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">查看各物业费用趋势、账户信息与数据完整度</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start">
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-500">
              <WalletCards className="h-3.5 w-3.5 text-slate-400" />
              只读分析 · 配置与录入在空间资源中完成
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-slate-500">费用类型</p>
            {activeSummary && <span className="text-xs text-slate-400">当前：{activeSummary.label}</span>}
          </div>
          <div className={`grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1.5 ${summaryGridClass}`}>
            {summaryItems.map(item => (
              <button
                type="button"
                key={item.key}
                onClick={() => setActiveCategory(item.key)}
                className={`flex min-h-16 items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left transition ${effectiveCategory === item.key ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-white/80"}`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${item.className}`}>
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                  <span className={`text-sm font-semibold ${effectiveCategory === item.key ? "text-white" : "text-slate-700"}`}>{item.label}</span>
                </span>
                <span className={`shrink-0 text-[11px] ${effectiveCategory === item.key ? "text-white/70" : "text-slate-400"}`}>{item.cycleLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {activeSummary && (
          <div className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 lg:grid-cols-[minmax(180px,0.65fr)_minmax(0,1.35fr)]">
            <label className="block">
              <span className="text-xs font-medium text-slate-500">物业范围</span>
              <select
                aria-label="选择物业"
                value={selectedMeterId}
                onChange={event => setSelectedMeterId(event.target.value)}
                className="mt-1.5 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="all">全部物业</option>
                {rows.map(row => (
                  <option key={row.meter.id} value={row.meter.id}>{row.meter.name || row.meter.code}</option>
                ))}
              </select>
            </label>

            <div>
              <div className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-md ${activeSummary.className}`}>
                  <activeSummary.icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">统计时间范围</p>
                  <p className="text-xs text-slate-400">{statisticsRangeLabel}</p>
                </div>
              </div>

              {activeCycle === "monthly" ? (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <MonthPeriodSelect
                    value={monthlyRangeStart}
                    onChange={updateMonthlyRangeStart}
                    label="开始月份"
                    years={availableMonthlyYears}
                  />
                  <MonthPeriodSelect
                    value={monthlyRangeEnd}
                    onChange={updateMonthlyRangeEnd}
                    label="结束月份"
                    years={availableMonthlyYears}
                  />
                </div>
              ) : (
                <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                  <select
                    aria-label="统计开始年度"
                    value={annualRangeStartYear}
                    onChange={event => updateAnnualRangeStart(Number(event.target.value))}
                    className="h-10 min-w-0 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  >
                    {availableAnnualYears.map(year => <option key={year} value={year}>{year} 年</option>)}
                  </select>
                  <span className="hidden shrink-0 text-xs text-slate-400 sm:inline">至</span>
                  <select
                    aria-label="统计结束年度"
                    value={annualRangeEndYear}
                    onChange={event => updateAnnualRangeEnd(Number(event.target.value))}
                    className="h-10 min-w-0 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  >
                    {availableAnnualYears.map(year => <option key={year} value={year}>{year} 年</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-5 border-t border-slate-100 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-cyan-700" />
                <h3 className="font-semibold text-slate-900">{selectedMeter?.name || "全部物业"}{activeSummary?.label || "费用"}变化</h3>
              </div>
              <p className="mt-1 text-xs text-slate-400">{statisticsRangeLabel}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-left sm:text-right">
              <div>
                <p className="text-[11px] text-slate-400">区间总额</p>
                <p className="mt-1 whitespace-nowrap text-sm font-semibold tabular-nums text-slate-900">{formatCurrency(billedAmount)}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">已录入记录</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">{recordedTaskCount} 条</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">期间平均</p>
                <p className="mt-1 whitespace-nowrap text-sm font-semibold tabular-nums text-slate-900">{formatCurrency(averagePeriodAmount)}</p>
              </div>
            </div>
          </div>

          {recordedTaskCount > 0 ? (
            <ChartContainer config={consumptionChartConfig} className="mt-4 h-56 w-full aspect-auto sm:h-64">
              <BarChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={20} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  domain={[0, (maximum: number) => maximum > 0 ? Math.ceil(maximum * 1.1) : 1]}
                  tickFormatter={value => `¥${Number(value).toLocaleString("zh-CN", { notation: "compact" })}`}
                />
                <ChartTooltip
                  cursor={{ fill: "var(--muted)" }}
                  content={<ChartTooltipContent
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.period || ""}
                    formatter={value => formatCurrency(Number(value))}
                  />}
                />
                <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="mt-4 flex h-56 flex-col items-center justify-center border-y border-dashed border-slate-200 text-center sm:h-64">
              <BarChart3 className="h-6 w-6 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-600">所选范围暂无消费记录</p>
              <p className="mt-1 text-xs text-slate-400">在空间资源的物业详情中录入后自动生成费用趋势</p>
            </div>
          )}
        </div>
      </div>

      {!activeSummary || visibleRows.length === 0 ? (
        <div className="p-5">
          <EmptyState text={rows.length === 0 ? "当前基地还没有物业" : "当前基地尚未为物业启用任何费用"} />
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-2 border-y border-slate-200 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${activeSummary.className}`}>
                <activeSummary.icon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{activeSummary.label}物业明细</h3>
                <p className="text-xs text-slate-400">逐物业查看费用账户、责任主体、区间消费与数据完整度</p>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {compact ? `显示 ${visibleRows.length} / 共 ${selectedRows.length} 个物业` : `共 ${visibleRows.length} 个物业`}
            </span>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1040px] table-fixed text-left text-sm">
              <thead className="border-b border-slate-200 bg-white text-xs text-slate-400">
                <tr>
                  <th className="w-[19%] px-5 py-3 font-medium">物业</th>
                  <th className="w-[17%] px-5 py-3 font-medium">费用账户</th>
                  <th className="w-[18%] px-5 py-3 font-medium">费用承担方</th>
                  <th className="w-[14%] px-5 py-3 font-medium">区间消费</th>
                  <th className="w-[20%] px-5 py-3 font-medium">数据完整度</th>
                  <th className="w-[12%] px-5 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRows.map(row => {
                  const rangeExempt = isRangeExempt(row.meter.id);
                  return (
                  <tr key={row.meter.id} className="align-middle transition hover:bg-slate-50/80">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{row.meter.name || row.meter.code}</p>
                      <p className="mt-1 text-xs text-slate-400">{row.meter.code} · {Number(row.meter.area || 0).toLocaleString("zh-CN")}㎡</p>
                    </td>
                    <td className="px-5 py-4">{renderAccountDetails(row.meter)}</td>
                    <td className="px-5 py-4">{renderResponsibilityDetails(row.meter)}</td>
                    <td className="px-5 py-4">{renderActiveFee(row)}</td>
                    <td className="px-5 py-4">
                      {rangeExempt ? <p className="text-sm font-medium text-emerald-700">无需录入</p> : renderEntryProgress(row.meter.id)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {rangeExempt ? (
                        <span className="text-xs font-medium text-emerald-700">无需录入</span>
                      ) : (
                        <Link
                          href={getEntryHref(row.meter.id)}
                          className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
                        >
                          录入 <PencilLine className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 lg:hidden">
            {visibleRows.map(row => {
              const rangeExempt = isRangeExempt(row.meter.id);
              const summary = getMeterConsumptionSummary(row.meter.id);
              return (
              <div key={row.meter.id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{row.meter.name || row.meter.code}</p>
                    <p className="mt-1 text-xs text-slate-400">{row.meter.code} · {Number(row.meter.area || 0).toLocaleString("zh-CN")}㎡</p>
                  </div>
                  {rangeExempt ? (
                    <span className="shrink-0 text-xs font-medium text-emerald-700">无需录入</span>
                  ) : (
                    <Link
                      href={getEntryHref(row.meter.id)}
                      className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-cyan-700"
                    >
                      录入 <PencilLine className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-slate-100 pt-4">
                  <div>
                    <p className="mb-2 text-[11px] font-medium text-slate-400">区间{activeSummary.label}消费</p>
                    {renderActiveFee(row)}
                  </div>
                  <div>
                    <p className="mb-2 text-[11px] font-medium text-slate-400">数据完整度</p>
                    {rangeExempt
                      ? <p className="text-sm font-medium text-emerald-700">无需录入</p>
                      : summary.expectedCount > 0
                        ? renderEntryProgress(row.meter.id)
                        : <p className="text-sm text-slate-400">未启用</p>}
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    {renderAccountDetails(row.meter)}
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    <p className="mb-2 text-[11px] font-medium text-slate-400">费用承担方</p>
                    {renderResponsibilityDetails(row.meter)}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </>
      )}

      {compact && selectedRows.length > visibleRows.length && (
        <div className="border-t border-slate-100 px-5 py-3 text-center text-xs text-slate-400">
          另有 {selectedRows.length - visibleRows.length} 个物业，请在“物业缴费”标签查看
        </div>
      )}

    </section>
  );
}

export function BaseProfileCard({ base }: { base: BaseDetail }) {
  const profileItems = [
    { icon: Building2, label: "运营机构", value: base.organization?.name || base.managementCompanyName || "未登记" },
    { icon: BadgeCheck, label: "统一社会信用代码", value: base.managementCompanyCreditCode || "未登记" },
    { icon: UserRound, label: "法定代表人", value: base.managementCompanyLegalPerson || "未登记" },
    { icon: Phone, label: "联系电话", value: base.managementCompanyPhone || "未登记" },
    { icon: MapPin, label: "管理方地址", value: base.managementCompanyAddress || "未登记" },
    { icon: Gift, label: "物业费政策", value: base.propertyFeeMode === "free" ? "免收物业费" : "按年度收取物业费" },
    { icon: CalendarDays, label: "基地建档时间", value: formatDate(base.createdAt) },
  ];

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <ReceiptText className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-950">基地档案</h2>
          <p className="text-xs text-slate-400">运营主体与基础登记信息</p>
        </div>
      </div>

      <div className="space-y-4">
        {profileItems.map(item => (
          <div key={item.label} className="flex gap-3">
            <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">{item.label}</p>
              <p className="mt-1 break-words text-sm font-medium leading-6 text-slate-700">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
