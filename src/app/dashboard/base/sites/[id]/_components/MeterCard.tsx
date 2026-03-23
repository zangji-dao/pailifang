"use client";

import { useRouter } from "next/navigation";
import { Zap, Droplets, Flame, Wifi, DoorOpen, Hash, ChevronRight, Plus } from "lucide-react";
import type { Meter } from "../types";

interface MeterCardProps {
  meter: Meter;
  baseId: string;
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
          {/* 电 */}
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-amber-50/50">
            <Zap className={`h-5 w-5 ${meter.electricityStatus === 'normal' ? 'text-amber-500' : 'text-red-500'}`} />
            <span className="text-xs mt-1" style={{ color: "#78716C" }}>电</span>
            <span className={`text-xs font-medium mt-0.5 ${meter.electricityStatus === 'normal' ? 'text-emerald-600' : 'text-red-500'}`}>
              {meter.electricityStatus === 'normal' ? '正常' : '异常'}
            </span>
          </div>

          {/* 水 */}
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-sky-50/50">
            <Droplets className={`h-5 w-5 ${meter.waterStatus === 'normal' ? 'text-sky-500' : 'text-red-500'}`} />
            <span className="text-xs mt-1" style={{ color: "#78716C" }}>水</span>
            <span className={`text-xs font-medium mt-0.5 ${meter.waterStatus === 'normal' ? 'text-emerald-600' : 'text-red-500'}`}>
              {meter.waterStatus === 'normal' ? '正常' : '异常'}
            </span>
          </div>

          {/* 暖 */}
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-orange-50/50">
            <Flame className={`h-5 w-5 ${meter.heatingStatus === 'normal' ? 'text-orange-500' : 'text-red-500'}`} />
            <span className="text-xs mt-1" style={{ color: "#78716C" }}>暖</span>
            <span className={`text-xs font-medium mt-0.5 ${meter.heatingStatus === 'normal' ? 'text-emerald-600' : 'text-red-500'}`}>
              {meter.heatingStatus === 'normal' ? '正常' : '异常'}
            </span>
          </div>

          {/* 网 */}
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-violet-50/50">
            <Wifi className={`h-5 w-5 ${meter.networkStatus === 'normal' ? 'text-violet-500' : 'text-red-500'}`} />
            <span className="text-xs mt-1" style={{ color: "#78716C" }}>网</span>
            <span className={`text-xs font-medium mt-0.5 ${meter.networkStatus === 'normal' ? 'text-emerald-600' : 'text-red-500'}`}>
              {meter.networkStatus === 'normal' ? '正常' : '异常'}
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Hash className="h-4 w-4" style={{ color: "#A8A29E" }} />
              <span className="text-sm font-medium" style={{ color: "#57534E" }}>{allocatedRegNumbers}/{totalRegNumbers}</span>
              <span className="text-sm" style={{ color: "#A8A29E" }}>工位号已分配</span>
            </div>
          </div>
          <span className="text-xs" style={{ color: "#A8A29E" }}>点击查看详情 →</span>
        </div>
      </div>
    </div>
  );
}
