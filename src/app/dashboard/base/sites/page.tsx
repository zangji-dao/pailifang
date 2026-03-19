"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Home,
  Plus,
  Loader2,
  ChevronRight,
  Users,
  Hash,
  DoorOpen,
  Wrench,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Base {
  id: string;
  name: string;
  address: string | null;
  status: string;
  meterCount: number;
  createdAt: string;
}

interface BaseStats {
  totalSpaces: number;
  totalRegNumbers: number;
  allocatedRegNumbers: number;
}

export default function BaseListPage() {
  const router = useRouter();
  const [bases, setBases] = useState<Base[]>([]);
  const [baseStats, setBaseStats] = useState<Record<string, BaseStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取基地列表
        const basesResponse = await fetch("/api/bases");
        const basesResult = await basesResponse.json();
        if (basesResult.success) {
          setBases(basesResult.data);
          
          // 获取每个基地的详细统计
          const stats: Record<string, BaseStats> = {};
          for (const base of basesResult.data) {
            try {
              const detailResponse = await fetch(`/api/bases/${base.id}`);
              const detailResult = await detailResponse.json();
              if (detailResult.success && detailResult.data.meters) {
                const meters = detailResult.data.meters;
                stats[base.id] = {
                  totalSpaces: meters.reduce((sum: number, m: any) => sum + (m.spaces?.length || 0), 0),
                  totalRegNumbers: meters.reduce((sum: number, m: any) => 
                    sum + (m.spaces?.reduce((s: number, sp: any) => s + (sp.regNumbers?.length || 0), 0) || 0), 0),
                  allocatedRegNumbers: meters.reduce((sum: number, m: any) => 
                    sum + (m.spaces?.reduce((s: number, sp: any) => 
                      s + (sp.regNumbers?.filter((r: any) => r.status === "allocated")?.length || 0), 0) || 0), 0),
                };
              }
            } catch (e) {
              console.error("获取基地详情失败:", e);
            }
          }
          setBaseStats(stats);
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
  const totalSpaces = Object.values(baseStats).reduce((sum, s) => sum + s.totalSpaces, 0);
  const totalRegNumbers = Object.values(baseStats).reduce((sum, s) => sum + s.totalRegNumbers, 0);
  const totalAllocated = Object.values(baseStats).reduce((sum, s) => sum + s.allocatedRegNumbers, 0);

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
            <p className="text-sm text-slate-500 mt-1">管理和监控所有基地运营状况</p>
          </div>
          <Button 
            className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            新增基地
          </Button>
        </div>

        {/* 核心指标卡片 */}
        <div className="grid grid-cols-5 gap-4 mb-6">
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
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Home className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-sm text-slate-500">物业总数</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{totalMeters}</p>
          </div>

          {/* 物理空间 */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <DoorOpen className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-sm text-slate-500">物理空间</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{totalSpaces}</p>
          </div>

          {/* 注册号 */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Hash className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm text-slate-500">注册号</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{totalRegNumbers}</p>
          </div>

          {/* 入驻企业 */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
              <span className="text-sm text-slate-500">入驻企业</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{totalAllocated}</p>
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
              {bases.map((base) => {
                const stats = baseStats[base.id] || { totalSpaces: 0, totalRegNumbers: 0, allocatedRegNumbers: 0 };
                
                return (
                  <div
                    key={base.id}
                    onClick={() => handleBaseClick(base.id)}
                    className="flex items-center justify-between p-5 hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    {/* 左侧：基地信息 */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border border-slate-200">
                        <Building2 className="h-7 w-7 text-slate-500" />
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

                    {/* 中间：统计数据 */}
                    <div className="flex items-center gap-8">
                      {/* 物业 */}
                      <div className="text-center">
                        <p className="text-xl font-bold text-slate-900">{base.meterCount}</p>
                        <p className="text-xs text-slate-500">物业</p>
                      </div>
                      
                      {/* 物理空间 */}
                      <div className="text-center">
                        <p className="text-xl font-bold text-slate-900">{stats.totalSpaces}</p>
                        <p className="text-xs text-slate-500">空间</p>
                      </div>
                      
                      {/* 注册号 */}
                      <div className="text-center">
                        <p className="text-xl font-bold text-slate-900">{stats.totalRegNumbers}</p>
                        <p className="text-xs text-slate-500">注册号</p>
                      </div>
                      
                      {/* 入驻企业 */}
                      <div className="text-center">
                        <p className="text-xl font-bold text-violet-600">{stats.allocatedRegNumbers}</p>
                        <p className="text-xs text-slate-500">入驻企业</p>
                      </div>
                    </div>

                    {/* 右侧：快捷入口 */}
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/base/sites/${base.id}?tab=meters`);
                          }}
                        >
                          <Home className="h-4 w-4 mr-1.5" />
                          物业管理
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/base/sites/${base.id}?tab=enterprises`);
                          }}
                        >
                          <Users className="h-4 w-4 mr-1.5" />
                          入驻企业
                        </Button>
                      </div>
                      
                      <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
