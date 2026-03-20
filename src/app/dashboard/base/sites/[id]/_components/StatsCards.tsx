"use client";

import { Home, DoorOpen, Hash, Users } from "lucide-react";
import type { StatsInfo } from "../types";

interface StatsCardsProps {
  stats: StatsInfo;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      icon: Home,
      value: stats.totalMeters,
      label: "物业",
      gradient: "from-amber-100 to-amber-50",
      iconColor: "text-amber-600",
    },
    {
      icon: DoorOpen,
      value: stats.totalSpaces,
      label: "物理空间",
      gradient: "from-emerald-100 to-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      icon: Hash,
      value: stats.totalRegNumbers,
      label: "注册号",
      gradient: "from-blue-100 to-blue-50",
      iconColor: "text-blue-600",
    },
    {
      icon: Users,
      value: stats.allocatedRegNumbers,
      label: "入驻企业",
      gradient: "from-violet-100 to-violet-50",
      iconColor: "text-violet-600",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
              <card.icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums" style={{ color: "#1C1917" }}>{card.value}</p>
              <p className="text-sm" style={{ color: "#A8A29E" }}>{card.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
