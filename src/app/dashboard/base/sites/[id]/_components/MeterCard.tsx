"use client";

import { useRouter } from "next/navigation";
import { Zap, Droplets, Flame, Wifi, DoorOpen, Hash, ChevronRight } from "lucide-react";
import type { Meter, NetworkStatus, HeatingStatus } from "../types";

interface MeterCardProps {
  meter: Meter;
  baseId: string;
}

// 格式化余额显示（数据库返回的可能是字符串或数字）
function formatBalance(balance: number | string | null): string {
  if (balance === null || balance === undefined) return "--";
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  if (isNaN(num)) return "--";
  return `¥${num.toFixed(2)}`;
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

// 网络状态显示 - 带图标和徽章样式
function getNetworkStatusDisplay(status: NetworkStatus) {
  const statusMap = {
    normal: { 
      text: "正常", 
      dotColor: "bg-emerald-500",
      textColor: "text-emerald-700",
      bgColor: "bg-emerald-100 border-emerald-200"
    },
    arrears: { 
      text: "欠费", 
      dotColor: "bg-red-500 animate-pulse",
      textColor: "text-red-700",
      bgColor: "bg-red-100 border-red-200"
    },
    unused: { 
      text: "未使用", 
      dotColor: "bg-slate-400",
      textColor: "text-slate-600",
      bgColor: "bg-slate-100 border-slate-200"
    },
  };
  return statusMap[status] || statusMap.normal;
}

// 取暖状态显示 - 带图标和徽章样式
function getHeatingStatusDisplay(status: HeatingStatus) {
  const statusMap = {
    full_paid: { 
      text: "全额缴纳", 
      dotColor: "bg-emerald-500",
      textColor: "text-emerald-700",
      bgColor: "bg-emerald-100 border-emerald-200"
    },
    base_paid: { 
      text: "基础缴纳", 
      dotColor: "bg-amber-500",
      textColor: "text-amber-700",
      bgColor: "bg-amber-100 border-amber-200"
    },
    arrears: { 
      text: "欠费", 
      dotColor: "bg-red-500 animate-pulse",
      textColor: "text-red-700",
      bgColor: "bg-red-100 border-red-200"
    },
    off_season: { 
      text: "未到取暖季", 
      dotColor: "bg-slate-400",
      textColor: "text-slate-600",
      bgColor: "bg-slate-100 border-slate-200"
    },
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
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-gradient-to-b from-amber-50 to-amber-100/50 border border-amber-100">
            <Zap className="h-5 w-5 text-amber-500" />
            <span className="text-xs mt-1 font-medium text-amber-700">电</span>
            <span className={`text-sm font-bold mt-0.5 ${parseFloat(String(meter.electricityBalance ?? 0)) < 50 ? 'text-red-500' : 'text-emerald-600'}`}>
              {formatBalance(meter.electricityBalance)}
            </span>
            {meter.electricityBalanceUpdatedAt && (
              <span className="text-[10px] text-amber-600/60">
                {formatUpdateTime(meter.electricityBalanceUpdatedAt)}
              </span>
            )}
          </div>

          {/* 水 - 显示余额 */}
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-gradient-to-b from-sky-50 to-sky-100/50 border border-sky-100">
            <Droplets className="h-5 w-5 text-sky-500" />
            <span className="text-xs mt-1 font-medium text-sky-700">水</span>
            <span className={`text-sm font-bold mt-0.5 ${parseFloat(String(meter.waterBalance ?? 0)) < 50 ? 'text-red-500' : 'text-emerald-600'}`}>
              {formatBalance(meter.waterBalance)}
            </span>
            {meter.waterBalanceUpdatedAt && (
              <span className="text-[10px] text-sky-600/60">
                {formatUpdateTime(meter.waterBalanceUpdatedAt)}
              </span>
            )}
          </div>

          {/* 暖 - 显示状态徽章 */}
          <div className={`flex flex-col items-center p-2.5 rounded-xl border ${heatingDisplay.bgColor}`}>
            <Flame className={`h-5 w-5 ${heatingDisplay.textColor}`} />
            <span className="text-xs mt-1 font-medium text-orange-700">暖</span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 ${heatingDisplay.bgColor} ${heatingDisplay.textColor}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${heatingDisplay.dotColor}`}></span>
              {heatingDisplay.text}
            </span>
          </div>

          {/* 网 - 显示状态徽章 */}
          <div className={`flex flex-col items-center p-2.5 rounded-xl border ${networkDisplay.bgColor}`}>
            <Wifi className={`h-5 w-5 ${networkDisplay.textColor}`} />
            <span className="text-xs mt-1 font-medium text-violet-700">网</span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 ${networkDisplay.bgColor} ${networkDisplay.textColor}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${networkDisplay.dotColor}`}></span>
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
