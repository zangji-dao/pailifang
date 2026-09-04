"use client";

import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronRight,
  DoorOpen,
  Droplets,
  Flame,
  Gift,
  Hash,
  PhoneCall,
  ReceiptText,
  Wifi,
  Zap,
} from "lucide-react";
import type { Meter } from "../types";
import { buildMeterUtilityTasks, getUtilityLabel, type UtilityTask } from "../utilityTasks";

interface MeterCardProps {
  meter: Meter;
  baseId: string;
  propertyFeeMode: "charged" | "free";
}

function getTaskStatus(task: UtilityTask) {
  if (task.status === "exempt") return { label: "免收", className: "bg-emerald-50 text-emerald-700" };
  if (task.status === "paid") {
    return task.invoiceStatus === "pending"
      ? { label: "待开票", className: "bg-cyan-50 text-cyan-700" }
      : { label: "已缴", className: "bg-emerald-50 text-emerald-700" };
  }
  if (task.status === "arrears") return { label: "欠费", className: "bg-rose-50 text-rose-700" };
  return { label: task.status === "missing" ? "待录入" : "待缴", className: "bg-amber-50 text-amber-700" };
}

function getTaskIcon(type: string) {
  if (type === "electricity") return Zap;
  if (type === "water") return Droplets;
  if (type === "heating") return Flame;
  if (type === "property_fee") return Gift;
  if (type === "telephone") return PhoneCall;
  if (type === "network") return Wifi;
  return ReceiptText;
}

export function MeterCard({ meter, baseId, propertyFeeMode }: MeterCardProps) {
  const router = useRouter();
  const allocatedRegNumbers = meter.spaces?.reduce(
    (sum, space) => sum + (space.regNumbers?.filter(regNumber => regNumber.available === false)?.length || 0),
    0,
  ) || 0;
  const totalRegNumbers = meter.spaces?.reduce(
    (sum, space) => sum + (space.regNumbers?.length || 0),
    0,
  ) || 0;
  const utilityTasks = buildMeterUtilityTasks(meter, propertyFeeMode);
  const feeTypes = meter.feeConfigs?.map(config => config.feeType) || [];
  const arrearsCount = utilityTasks.filter(task => task.status === "arrears").length;
  const pendingCount = utilityTasks.filter(task => task.status === "missing" || task.status === "pending").length;
  const invoicePendingCount = utilityTasks.filter(task => task.invoiceStatus === "pending").length;
  const feeOverview = arrearsCount > 0
    ? { label: `${arrearsCount} 项欠费`, className: "bg-rose-50 text-rose-700 ring-rose-600/15" }
    : pendingCount > 0
      ? { label: `${pendingCount} 项待处理`, className: "bg-amber-50 text-amber-700 ring-amber-600/15" }
      : invoicePendingCount > 0
        ? { label: `${invoicePendingCount} 项待开票`, className: "bg-cyan-50 text-cyan-700 ring-cyan-600/15" }
        : { label: "费用正常", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/15" };

  return (
    <button
      type="button"
      onClick={() => router.push(`/dashboard/base/sites/${baseId}/meters/${meter.id}?from=resources`)}
      className="group flex h-full w-full flex-col rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-cyan-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
    >
      <div className="flex flex-col gap-3 pl-7 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Building2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="break-words font-semibold leading-5 text-slate-950">{meter.name || meter.code}</h3>
            <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">物业编号 {meter.code}</p>
          </div>
        </div>
        <span className={`self-start rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${feeOverview.className}`}>
          {feeOverview.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 border-y border-slate-100 py-3">
        <div className="pr-3">
          <p className="text-[11px] text-slate-400">建筑面积</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-slate-800">{Number(meter.area || 0).toLocaleString("zh-CN")} ㎡</p>
        </div>
        <div className="px-3">
          <p className="flex items-center gap-1 text-[11px] text-slate-400"><DoorOpen className="h-3 w-3" />物理空间</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-slate-800">{meter.spaces?.length || 0} 个</p>
        </div>
        <div className="pl-3">
          <p className="flex items-center gap-1 text-[11px] text-slate-400"><Hash className="h-3 w-3" />工位使用</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-slate-800">{allocatedRegNumbers}/{totalRegNumbers}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-slate-500">适用费用</p>
          <span className="text-[11px] text-slate-400">{utilityTasks.length} 类</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {utilityTasks.length === 0 ? (
            <span className="text-xs text-slate-400">尚未配置费用类型</span>
          ) : utilityTasks.map(task => {
            const Icon = getTaskIcon(task.utilityType);
            const status = getTaskStatus(task);
            return (
              <span key={task.utilityType} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-600">
                <Icon className="h-3.5 w-3.5 text-slate-400" />
                {getUtilityLabel(task.utilityType, feeTypes)}
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${status.className}`}>{status.label}</span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
        <span>管理费用、空间与工位</span>
        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:text-cyan-700" />
      </div>
    </button>
  );
}
