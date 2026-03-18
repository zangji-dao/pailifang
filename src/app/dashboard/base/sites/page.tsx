"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Home,
  Plus,
  Loader2,
  Sparkles,
  Layers,
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

export default function BaseListPage() {
  const router = useRouter();
  const [bases, setBases] = useState<Base[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBases = async () => {
      try {
        const response = await fetch("/api/bases");
        const result = await response.json();
        if (result.success) {
          setBases(result.data);
        }
      } catch (error) {
        console.error("获取基地列表失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBases();
  }, []);

  const handleBaseClick = (baseId: string) => {
    router.push(`/dashboard/base/sites/${baseId}`);
  };

  const totalMeters = bases.reduce((sum, b) => sum + b.meterCount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #FDFBF7 0%, #F8F5F0 100%)" }}>
      <div className="p-8 max-w-7xl mx-auto">
        {/* 页面头部 */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#1C1917" }}>
              基地管理
            </h1>
          </div>
          <p className="text-base ml-4" style={{ color: "#78716C" }}>
            管理所有基地及其物业分配，追踪水电取暖费用
          </p>
        </div>

        {/* 统计区域 - 优雅的数字展示 */}
        <div className="flex items-center gap-8 mb-10 ml-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center shadow-sm">
              <Building2 className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums" style={{ color: "#1C1917" }}>
                {bases.length}
              </p>
              <p className="text-sm" style={{ color: "#A8A29E" }}>基地</p>
            </div>
          </div>

          <div className="w-px h-10 bg-slate-200" />

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center shadow-sm">
              <Home className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums" style={{ color: "#1C1917" }}>
                {totalMeters}
              </p>
              <p className="text-sm" style={{ color: "#A8A29E" }}>物业</p>
            </div>
          </div>

          <div className="w-px h-10 bg-slate-200" />

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center shadow-sm">
              <Sparkles className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums" style={{ color: "#1C1917" }}>
                0
              </p>
              <p className="text-sm" style={{ color: "#A8A29E" }}>入驻企业</p>
            </div>
          </div>

          <div className="ml-auto">
            <Button 
              className="h-12 px-6 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white rounded-xl shadow-lg shadow-slate-900/10 font-medium transition-all hover:shadow-xl hover:shadow-slate-900/20"
            >
              <Plus className="h-5 w-5 mr-2" />
              新增基地
            </Button>
          </div>
        </div>

        {/* 基地卡片网格 */}
        {bases.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
            <Building2 className="h-16 w-16 text-slate-200 mx-auto mb-4" />
            <p className="text-lg font-medium" style={{ color: "#57534E" }}>暂无基地</p>
            <p className="text-sm mt-1" style={{ color: "#A8A29E" }}>点击上方"新增基地"开始添加</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {bases.map((base, index) => (
              <div
                key={base.id}
                onClick={() => handleBaseClick(base.id)}
                className="group cursor-pointer"
              >
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-300 hover:-translate-y-1">
                  {/* 卡片头部 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 via-amber-100 to-orange-100 flex items-center justify-center shadow-inner">
                        <Layers className="h-7 w-7 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold group-hover:text-amber-700 transition-colors" style={{ color: "#1C1917" }}>
                          {base.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`w-2 h-2 rounded-full ${base.status === "active" ? "bg-emerald-400" : "bg-slate-300"}`} />
                          <span className="text-xs" style={{ color: "#A8A29E" }}>
                            {base.status === "active" ? "运营中" : "已停用"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 地址信息 */}
                  {base.address && (
                    <div className="flex items-center gap-2 py-3 px-3 rounded-xl mb-4" style={{ background: "#FAFAF9" }}>
                      <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: "#A8A29E" }} />
                      <span className="text-sm truncate" style={{ color: "#57534E" }}>
                        {base.address}
                      </span>
                    </div>
                  )}

                  {/* 底部统计 */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
                          <Home className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-lg font-bold tabular-nums" style={{ color: "#1C1917" }}>
                            {base.meterCount}
                          </p>
                          <p className="text-xs" style={{ color: "#A8A29E" }}>物业</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm font-medium text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      查看详情
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
