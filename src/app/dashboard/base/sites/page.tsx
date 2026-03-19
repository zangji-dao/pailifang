"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Home,
  Plus,
  Loader2,
  Zap,
  Droplets,
  Flame,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  Wrench,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ServiceStatus {
  name: string;
  icon: React.ReactNode;
  normal: number;
  warning: number;
  error: number;
  color: string;
  bgColor: string;
}

interface Base {
  id: string;
  name: string;
  address: string | null;
  status: string;
  meterCount: number;
  createdAt: string;
}

export default function BaseListPage() {
  const router = useRouter();
  const [bases, setBases] = useState<Base[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceStats, setServiceStats] = useState<ServiceStatus[]>([
    { name: "供电", icon: <Zap className="h-5 w-5" />, normal: 0, warning: 0, error: 0, color: "text-amber-500", bgColor: "bg-amber-50" },
    { name: "供水", icon: <Droplets className="h-5 w-5" />, normal: 0, warning: 0, error: 0, color: "text-blue-500", bgColor: "bg-blue-50" },
    { name: "供暖", icon: <Flame className="h-5 w-5" />, normal: 0, warning: 0, error: 0, color: "text-orange-500", bgColor: "bg-orange-50" },
    { name: "网络", icon: <Wifi className="h-5 w-5" />, normal: 0, warning: 0, error: 0, color: "text-violet-500", bgColor: "bg-violet-50" },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取基地列表
        const basesResponse = await fetch("/api/bases");
        const basesResult = await basesResponse.json();
        if (basesResult.success) {
          setBases(basesResult.data);
          
          // 获取每个基地的详细数据统计服务状态
          let totalStats = {
            electricity: { normal: 0, warning: 0, error: 0 },
            water: { normal: 0, warning: 0, error: 0 },
            heating: { normal: 0, warning: 0, error: 0 },
            network: { normal: 0, warning: 0, error: 0 },
          };
          
          for (const base of basesResult.data) {
            try {
              const detailResponse = await fetch(`/api/bases/${base.id}`);
              const detailResult = await detailResponse.json();
              if (detailResult.success && detailResult.data.meters) {
                detailResult.data.meters.forEach((meter: any) => {
                  // 电
                  if (meter.electricityStatus === "normal") totalStats.electricity.normal++;
                  else if (meter.electricityStatus === "warning") totalStats.electricity.warning++;
                  else if (meter.electricityStatus === "error") totalStats.electricity.error++;
                  
                  // 水
                  if (meter.waterStatus === "normal") totalStats.water.normal++;
                  else if (meter.waterStatus === "warning") totalStats.water.warning++;
                  else if (meter.waterStatus === "error") totalStats.water.error++;
                  
                  // 暖
                  if (meter.heatingStatus === "normal") totalStats.heating.normal++;
                  else if (meter.heatingStatus === "warning") totalStats.heating.warning++;
                  else if (meter.heatingStatus === "error") totalStats.heating.error++;
                  
                  // 网络
                  if (meter.networkStatus === "normal") totalStats.network.normal++;
                  else if (meter.networkStatus === "warning") totalStats.network.warning++;
                  else if (meter.networkStatus === "error") totalStats.network.error++;
                });
              }
            } catch (e) {
              console.error("获取基地详情失败:", e);
            }
          }
          
          setServiceStats([
            { name: "供电", icon: <Zap className="h-5 w-5" />, normal: totalStats.electricity.normal, warning: totalStats.electricity.warning, error: totalStats.electricity.error, color: "text-amber-500", bgColor: "bg-amber-50" },
            { name: "供水", icon: <Droplets className="h-5 w-5" />, normal: totalStats.water.normal, warning: totalStats.water.warning, error: totalStats.water.error, color: "text-blue-500", bgColor: "bg-blue-50" },
            { name: "供暖", icon: <Flame className="h-5 w-5" />, normal: totalStats.heating.normal, warning: totalStats.heating.warning, error: totalStats.heating.error, color: "text-orange-500", bgColor: "bg-orange-50" },
            { name: "网络", icon: <Wifi className="h-5 w-5" />, normal: totalStats.network.normal, warning: totalStats.network.warning, error: totalStats.network.error, color: "text-violet-500", bgColor: "bg-violet-50" },
          ]);
        }
      } catch (error) {
        console.error("获取基地列表失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleBaseClick = (baseId: string) => {
    router.push(`/dashboard/base/sites/${baseId}`);
  };

  const totalMeters = bases.reduce((sum, b) => sum + b.meterCount, 0);
  const totalErrors = serviceStats.reduce((sum, s) => sum + s.error, 0);
  const totalWarnings = serviceStats.reduce((sum, s) => sum + s.warning, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">物业运营中心</h1>
            <p className="text-sm text-slate-500 mt-1">实时监控各基地服务状态</p>
          </div>
          <Button 
            className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            新增基地
          </Button>
        </div>

        {/* 核心指标卡片 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {/* 基地总数 */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-slate-600" />
              </div>
              <span className="text-sm text-slate-500">基地总数</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{bases.length}</p>
          </div>

          {/* 物业总数 */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Home className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-sm text-slate-500">物业总数</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{totalMeters}</p>
          </div>

          {/* 异常告警 */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <span className="text-sm text-slate-500">异常告警</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-red-500">{totalErrors}</p>
              {totalErrors > 0 && <span className="text-xs text-red-400">需立即处理</span>}
            </div>
          </div>

          {/* 预警提醒 */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <span className="text-sm text-slate-500">预警提醒</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-amber-500">{totalWarnings}</p>
              {totalWarnings > 0 && <span className="text-xs text-amber-400">需关注</span>}
            </div>
          </div>
        </div>

        {/* 服务状态概览 - 核心监控区 */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm mb-6">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-slate-400" />
                <h2 className="font-semibold text-slate-900">基础设施服务状态</h2>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-500">正常</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-slate-500">预警</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-slate-500">异常</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-5">
            <div className="grid grid-cols-4 gap-4">
              {serviceStats.map((service) => {
                const total = service.normal + service.warning + service.error;
                const normalPercent = total > 0 ? (service.normal / total) * 100 : 0;
                const hasIssue = service.error > 0 || service.warning > 0;
                
                return (
                  <div 
                    key={service.name}
                    className={cn(
                      "relative p-4 rounded-xl border-2 transition-all",
                      service.error > 0 ? "border-red-200 bg-red-50/50" :
                      service.warning > 0 ? "border-amber-200 bg-amber-50/50" :
                      "border-slate-100 bg-slate-50/50"
                    )}
                  >
                    {/* 状态指示灯 */}
                    <div className="absolute top-3 right-3">
                      {service.error > 0 ? (
                        <span className="flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                      ) : service.warning > 0 ? (
                        <span className="w-3 h-3 rounded-full bg-amber-400" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      )}
                    </div>

                    {/* 服务图标和名称 */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", service.bgColor)}>
                        <span className={service.color}>{service.icon}</span>
                      </div>
                      <span className="font-medium text-slate-700">{service.name}</span>
                    </div>

                    {/* 进度条 */}
                    <div className="mb-3">
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            service.error > 0 ? "bg-red-400" :
                            service.warning > 0 ? "bg-amber-400" :
                            "bg-emerald-400"
                          )}
                          style={{ width: `${normalPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* 统计数字 */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-slate-600">{service.normal}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-amber-600 font-medium">{service.warning}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="text-red-600 font-medium">{service.error}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 基地列表 */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">基地列表</h2>
              <span className="text-sm text-slate-500">共 {bases.length} 个基地</span>
            </div>
          </div>
          
          {bases.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="h-12 w-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500">暂无基地</p>
              <p className="text-sm text-slate-400 mt-1">点击上方"新增基地"开始添加</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {bases.map((base) => (
                <div
                  key={base.id}
                  onClick={() => handleBaseClick(base.id)}
                  className="flex items-center justify-between p-5 hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border border-slate-200">
                      <Building2 className="h-6 w-6 text-slate-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-900 group-hover:text-slate-700">{base.name}</h3>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          base.status === "active" 
                            ? "bg-emerald-50 text-emerald-600" 
                            : "bg-slate-100 text-slate-500"
                        )}>
                          {base.status === "active" ? "运营中" : "已停用"}
                        </span>
                      </div>
                      {base.address && (
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{base.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* 服务状态快速预览 */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-4 w-4 text-amber-400" />
                        <span className="text-sm text-slate-600">--</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Droplets className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-slate-600">--</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Flame className="h-4 w-4 text-orange-400" />
                        <span className="text-sm text-slate-600">--</span>
                      </div>
                    </div>

                    {/* 物业数量 */}
                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-900">{base.meterCount}</p>
                      <p className="text-xs text-slate-500">物业</p>
                    </div>

                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
