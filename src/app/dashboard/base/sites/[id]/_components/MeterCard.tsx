"use client";

import { useRouter } from "next/navigation";
import { Zap, Droplets, Flame, Wifi, DoorOpen, Hash, ChevronRight } from "lucide-react";
import type { Meter, NetworkStatus, HeatingStatus } from "../types";

interface MeterCardProps {
  meter: Meter;
  baseId: string;
}

// 格式化余额显示
function formatBalance(balance: number | null): string {
  if (balance === null || balance === undefined) return "--";
  return `¥${balance.toFixed(2)}`;
}

// 格式化时间
function formatUpdateTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "刚刚";
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString("zh-CN");
}

// 网络状态显示
function getNetworkStatusDisplay(status: NetworkStatus) {
  const statusMap = {
    normal: { text: "正常", color: "text-emerald-600", bg: "bg-emerald-50" },
    arrears: { text: "欠费", color: "text-red-500", bg: "bg-red-50" },
    unused: { text: "未使用", color: "text-slate-400", bg: "bg-slate-50" },
  };
  return statusMap[status] || statusMap.normal;
}

// 取暖状态显示
function getHeatingStatusDisplay(status: HeatingStatus) {
  const statusMap = {
    full_paid: { text: "全额缴纳", color: "text-emerald-600", bg: "bg-emerald-50" },
    base_paid: { text: "基础缴纳", color: "text-amber-600", bg: "bg-amber-50" },
    arrears: { text: "欠费", color: "text-red-500", bg: "bg-red-50" },
    off_season: { text: "未到取暖季", color: "text-slate-400", bg: "bg-slate-50" },
  };
  return statusMap[status] || statusMap.full_paid;
}

export function MeterCard({ meter, baseId }: MeterCardProps) {
  const router = useRouter();

  // 点击卡片跳转到物业详情页
  const handleClick = () => {
    router.push(`/dashboard/base/sites/${baseId}/meters/${meter.id}`);
  };

  // 计算已分配工位号数量
  const allocatedRegNumbers = meter.spaces?.reduce(
    (sum, sp) => sum + (sp.regNumbers?.filter(r => r.status === "allocated")?.length || 0),
    0
  ) || 0;

  const totalRegNumbers = meter.spaces?.reduce(
    (sum, sp) => sum + (sp.regNumbers?.length || 0),
    0
  ) || 0;

  const networkDisplay = getNetworkStatusDisplay(meter.networkStatus);
  const heatingDisplay = getHeatingStatusDisplay(meter.heatingStatus);

  return (
    <div onClick={handleClick} className="group cursor-pointer">
      <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-300 hover:-translate-y-0.5">
        {/* 物业编号和面积 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-semibold text-slate-900">{meter.code}</h3>
            {meter.area && (
              <p className="text-sm mt-0.5" style={{ color: "#78716C" }}>{meter.area} ㎡</p>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
        </div>

        {/* 水电暖网状态 */}
        <div className="grid grid-cols-4 gap-2">
          {/* 电 - 显示余额 */}
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-amber-50/50">
            <Zap className="h-5 w-5 text-amber-500" />
            <span className="text-xs mt-1" style={{ color: "#78716C" }}>电</span>
            <span className={`text-xs font-medium mt-0.5 ${(meter.electricityBalance ?? 0) < 50 ? 'text-red-500' : 'text-emerald-600'}`}>
              {formatBalance(meter.electricityBalance)}
            </span>
            {meter.electricityBalanceUpdatedAt && (
              <span className="text-[10px]" style={{ color: "#A8A29E" }}>
                {formatUpdateTime(meter.electricityBalanceUpdatedAt)}
              </span>
            )}
          </div>

          {/* 水 - 显示余额 */}
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-sky-50/50">
            <Droplets className="h-5 w-5 text-sky-500" />
            <span className="text-xs mt-1" style={{ color: "#78716C" }}>水</span>
            <span className={`text-xs font-medium mt-0.5 ${(meter.waterBalance ?? 0) < 50 ? 'text-red-500' : 'text-emerald-600'}`}>
              {formatBalance(meter.waterBalance)}
            </span>
            {meter.waterBalanceUpdatedAt && (
              <span className="text-[10px]" style={{ color: "#A8A29E" }}>
                {formatUpdateTime(meter.waterBalanceUpdatedAt)}
              </span>
            )}
          </div>

          {/* 暖 - 显示状态 */}
          <div className={`flex flex-col items-center p-2.5 rounded-xl ${heatingDisplay.bg}`}>
            <Flame className={`h-5 w-5 ${heatingDisplay.color}`} />
            <span className="text-xs mt-1" style={{ color: "#78716C" }}>暖</span>
            <span className={`text-xs font-medium mt-0.5 ${heatingDisplay.color}`}>
              {heatingDisplay.text}
            </span>
          </div>

          {/* 网 - 显示状态 */}
          <div className={`flex flex-col items-center p-2.5 rounded-xl ${networkDisplay.bg}`}>
            <Wifi className={`h-5 w-5 ${networkDisplay.color}`} />
            <span className="text-xs mt-1" style={{ color: "#78716C" }}>网</span>
            <span className={`text-xs font-medium mt-0.5 ${networkDisplay.color}`}>
              {networkDisplay.text}
            </span>
          </div>
        </div>

        {/* 空间列表 */}
        {meter.spaces && meter.spaces.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-2">
              <DoorOpen className="h-4 w-4" style={{ color: "#A8A29E" }} />
              <span className="text-xs font-medium" style={{ color: "#78716C" }}>空间 ({meter.spaces.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {meter.spaces.map((space) => {
                // 计算该空间的工位号分配情况
                const spaceTotal = space.regNumbers?.length || 0;
                const spaceAllocated = space.regNumbers?.filter(r => r.status === "allocated")?.length || 0;
                
                return (
                  <span
                    key={space.id}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 text-xs"
                    style={{ color: "#57534E" }}
                  >
                    {space.name}
                    {spaceTotal > 0 && (
                      <span className={spaceAllocated > 0 ? "text-emerald-600" : "text-slate-400"}>
                        {spaceAllocated}/{spaceTotal}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* 底部统计 */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <Hash className="h-4 w-4" style={{ color: "#A8A29E" }} />
            <span className="text-sm font-medium" style={{ color: "#57534E" }}>{allocatedRegNumbers}/{totalRegNumbers}</span>
            <span className="text-sm" style={{ color: "#A8A29E" }}>工位号已分配</span>
          </div>
        </div>
      </div>
    </div>
  );
}
