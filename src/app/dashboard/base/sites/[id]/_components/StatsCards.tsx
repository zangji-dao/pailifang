"use client";

import {
  AlertTriangle,
  Armchair,
  Building2,
  LandPlot,
  ReceiptText,
  Users,
} from "lucide-react";
import type { StatsInfo } from "../types";

interface StatsCardsProps {
  stats: StatsInfo;
}

function formatCurrency(value: number) {
  if (value >= 10000) return `¥${(value / 10000).toFixed(2)}万`;
  return `¥${value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      icon: Building2,
      value: stats.totalMeters.toString(),
      label: "物业数量",
      note: `${stats.totalSpaces} 个物理空间`,
      iconClassName: "bg-cyan-50 text-cyan-700",
    },
    {
      icon: LandPlot,
      value: stats.totalArea.toLocaleString("zh-CN", { maximumFractionDigits: 2 }),
      label: "物业总面积（㎡）",
      note: "按独立水电表划分",
      iconClassName: "bg-blue-50 text-blue-700",
    },
    {
      icon: Users,
      value: stats.tenantEnterpriseCount.toString(),
      label: "入驻企业",
      note: `${stats.serviceEnterpriseCount} 家服务企业`,
      iconClassName: "bg-violet-50 text-violet-700",
    },
    {
      icon: Armchair,
      value: `${stats.occupancyRate}%`,
      label: "工位使用率",
      note: `${stats.allocatedRegNumbers}/${stats.totalRegNumbers} 已分配`,
      iconClassName: "bg-emerald-50 text-emerald-700",
    },
    {
      icon: ReceiptText,
      value: formatCurrency(stats.paidUtilityAmount),
      label: "已登记缴费",
      note: "物业缴费流水合计",
      iconClassName: "bg-amber-50 text-amber-700",
    },
    {
      icon: AlertTriangle,
      value: stats.utilityAlertCount.toString(),
      label: "费用预警",
      note: stats.utilityAlertCount > 0 ? "需要及时跟进" : "当前状态正常",
      iconClassName: stats.utilityAlertCount > 0 ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map(card => (
        <div key={card.label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/20 sm:p-5">
          <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ${card.iconClassName}`}>
            <card.icon className="h-5 w-5" />
          </div>
          <p className="truncate text-xl font-semibold tabular-nums tracking-tight text-slate-950 sm:text-2xl">{card.value}</p>
          <p className="mt-1 text-sm font-medium text-slate-600">{card.label}</p>
          <p className="mt-2 truncate text-xs text-slate-400">{card.note}</p>
        </div>
      ))}
    </div>
  );
}
