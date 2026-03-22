"use client";

import { Zap, Droplets, Flame, Wifi, DoorOpen, Hash, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Meter } from "../types";

interface MeterCardProps {
  meter: Meter;
  isExpanded: boolean;
  onClick: () => void;
}

export function MeterCard({ meter, isExpanded, onClick }: MeterCardProps) {
  return (
    <div onClick={onClick} className="group cursor-pointer">
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

        {/* 底部统计 */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <DoorOpen className="h-4 w-4" style={{ color: "#A8A29E" }} />
            <span className="text-sm font-medium" style={{ color: "#57534E" }}>{meter.spaces?.length || 0}</span>
            <span className="text-sm" style={{ color: "#A8A29E" }}>空间</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Hash className="h-4 w-4" style={{ color: "#A8A29E" }} />
            <span className="text-sm font-medium" style={{ color: "#57534E" }}>
              {meter.spaces?.reduce((s, sp) => s + (sp.regNumbers?.length || 0), 0) || 0}
            </span>
            <span className="text-sm" style={{ color: "#A8A29E" }}>工位号</span>
          </div>
        </div>
      </div>
    </div>
  );
}
