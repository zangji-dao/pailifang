"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Plus,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSiteDetail } from "./useSiteDetail";
import { StatsCards } from "./_components/StatsCards";
import { MeterCard } from "./_components/MeterCard";
import { MeterDetailPanel } from "./_components/MeterDetailPanel";

export default function BaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const baseId = params.id as string;

  const {
    baseDetail,
    loading,
    expandedMeter,
    setExpandedMeter,
    showDeleteDialog,
    setShowDeleteDialog,
    deleting,
    stats,
    selectedMeter,
    handleDeleteBase,
  } = useSiteDetail(baseId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" style={{ background: "linear-gradient(180deg, #FDFBF7 0%, #F8F5F0 100%)" }}>
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!baseDetail) {
    return (
      <div className="text-center py-20" style={{ background: "linear-gradient(180deg, #FDFBF7 0%, #F8F5F0 100%)" }}>
        <p style={{ color: "#78716C" }}>基地不存在</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push("/dashboard/base/sites")}>
          返回列表
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #FDFBF7 0%, #F8F5F0 100%)" }}>
      <div className="p-8 max-w-7xl mx-auto">
        {/* 页面头部 */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard/base/sites")}
            className="inline-flex items-center gap-2 text-sm font-medium mb-4 px-3 py-1.5 rounded-lg hover:bg-white/60 transition-colors"
            style={{ color: "#78716C" }}
          >
            <ArrowLeft className="h-4 w-4" />
            返回基地列表
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 flex items-center justify-center shadow-inner">
                <Building2 className="h-7 w-7 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1C1917" }}>
                    {baseDetail.name}
                  </h1>
                  <span className={`w-2.5 h-2.5 rounded-full ${baseDetail.status === "active" ? "bg-emerald-400" : "bg-slate-300"}`} />
                </div>
                {baseDetail.address && (
                  <p className="text-sm flex items-center gap-1.5 mt-1" style={{ color: "#78716C" }}>
                    <MapPin className="h-3.5 w-3.5" />
                    {baseDetail.address}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button className="h-11 px-5 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white rounded-xl shadow-lg shadow-slate-900/10 font-medium">
                <Plus className="h-4 w-4 mr-2" />
                新增物业
              </Button>
              <Button
                variant="outline"
                className="h-11 px-5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl font-medium"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除基地
              </Button>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <StatsCards stats={stats} />

        {/* 物业卡片网格 */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold" style={{ color: "#1C1917" }}>物业信息监控</h2>
          <p className="text-sm mt-0.5" style={{ color: "#A8A29E" }}>点击物业卡片查看详细信息</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {baseDetail.meters.map((meter) => (
            <MeterCard
              key={meter.id}
              meter={meter}
              isExpanded={expandedMeter === meter.id}
              onClick={() => setExpandedMeter(expandedMeter === meter.id ? null : meter.id)}
            />
          ))}
        </div>
      </div>

      {/* 展开的物业详情面板 */}
      {expandedMeter && selectedMeter && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" onClick={() => setExpandedMeter(null)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <MeterDetailPanel
              meter={selectedMeter}
              onClose={() => setExpandedMeter(null)}
            />
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除基地</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除基地「{baseDetail?.name}」吗？此操作不可撤销，基地下的所有物业信息将被一并删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBase}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  删除中...
                </>
              ) : (
                '确认删除'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
