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
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSiteDetail } from "./useSiteDetail";
import { StatsCards } from "./_components/StatsCards";
import { DraggableMeterCard } from "./_components/DraggableMeterCard";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

export default function BaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const baseId = params.id as string;

  const {
    baseDetail,
    loading,
    showDeleteDialog,
    setShowDeleteDialog,
    deleting,
    stats,
    handleDeleteBase,
    refreshBaseDetail,
  } = useSiteDetail(baseId);

  // 新增物业状态
  const [showAddMeterDialog, setShowAddMeterDialog] = useState(false);
  const [addingMeter, setAddingMeter] = useState(false);
  const [meterForm, setMeterForm] = useState({
    code: "",
    name: "",
    area: "",
  });

  // 拖拽排序状态
  const [meterIds, setMeterIds] = useState<string[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);

  // 当 baseDetail 变化时更新 meterIds
  useEffect(() => {
    if (baseDetail?.meters && baseDetail.meters.length > 0) {
      // 按 sortOrder 排序后再生成 ID 列表
      const sortedMeters = [...baseDetail.meters].sort((a, b) => 
        (a.sortOrder || 0) - (b.sortOrder || 0)
      );
      setMeterIds(sortedMeters.map((m) => m.id));
    }
  }, [baseDetail?.meters]);

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 需要移动 8px 才开始拖拽
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 拖拽结束处理
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = meterIds.indexOf(active.id as string);
      const newIndex = meterIds.indexOf(over.id as string);
      
      const newMeterIds = arrayMove(meterIds, oldIndex, newIndex);
      setMeterIds(newMeterIds);

      // 保存新顺序到服务器
      setSavingOrder(true);
      try {
        const res = await fetch("/api/meters/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            baseId,
            meterIds: newMeterIds,
          }),
        });

        const result = await res.json();
        if (result.success) {
          toast.success("排序已保存");
        } else {
          toast.error(result.error || "保存排序失败");
          // 恢复原顺序
          setMeterIds(meterIds);
        }
      } catch (error) {
        toast.error("保存排序失败");
        setMeterIds(meterIds);
      } finally {
        setSavingOrder(false);
      }
    }
  }, [meterIds, baseId]);

  // 新增物业
  const handleAddMeter = async () => {
    if (!meterForm.code.trim()) {
      toast.error("请输入物业编号");
      return;
    }

    setAddingMeter(true);
    try {
      const res = await fetch("/api/meters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_id: baseId,
          code: meterForm.code,
          name: meterForm.name || meterForm.code,
          area: meterForm.area ? parseFloat(meterForm.area) : null,
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success("物业创建成功");
        setShowAddMeterDialog(false);
        setMeterForm({ code: "", name: "", area: "" });
        refreshBaseDetail?.();
      } else {
        toast.error(result.error || "创建失败");
      }
    } catch (error) {
      toast.error("创建失败");
    } finally {
      setAddingMeter(false);
    }
  };

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
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "#1C1917" }}>物业信息监控</h2>
            <p className="text-sm mt-0.5" style={{ color: "#A8A29E" }}>拖拽卡片可调整顺序，点击查看详细信息</p>
          </div>
          {savingOrder && (
            <span className="text-sm text-amber-600 flex items-center gap-1.5">
              <Loader2 className="h-4 w-4 animate-spin" />
              保存中...
            </span>
          )}
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={meterIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meterIds.map((meterId) => {
                const meter = baseDetail.meters.find((m) => m.id === meterId);
                if (!meter) return null;
                return (
                  <DraggableMeterCard
                    key={meter.id}
                    meter={meter}
                    baseId={baseId}
                  />
                );
              })}
              
              {/* 新增物业卡片 */}
              <div
                onClick={() => setShowAddMeterDialog(true)}
                className="group cursor-pointer"
              >
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-5 shadow-sm hover:shadow-xl hover:border-amber-300 transition-all duration-300 hover:-translate-y-0.5 flex flex-col items-center justify-center min-h-[180px]">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-3 group-hover:bg-amber-100 transition-colors">
                    <Plus className="h-6 w-6 text-amber-500" />
                  </div>
                  <span className="text-sm font-medium" style={{ color: "#78716C" }}>新增物业</span>
                  <span className="text-xs mt-1" style={{ color: "#A8A29E" }}>添加新的物业空间</span>
                </div>
              </div>
            </div>
          </SortableContext>
        </DndContext>
      </div>

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

      {/* 新增物业对话框 */}
      <Dialog open={showAddMeterDialog} onOpenChange={setShowAddMeterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增物业</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "#1C1917" }}>物业编号 *</label>
              <Input
                value={meterForm.code}
                onChange={(e) => setMeterForm({ ...meterForm, code: e.target.value })}
                placeholder="如：1-101"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "#1C1917" }}>物业名称</label>
              <Input
                value={meterForm.name}
                onChange={(e) => setMeterForm({ ...meterForm, name: e.target.value })}
                placeholder="如：1号楼101室"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "#1C1917" }}>建筑面积（㎡）</label>
              <Input
                type="number"
                value={meterForm.area}
                onChange={(e) => setMeterForm({ ...meterForm, area: e.target.value })}
                placeholder="如：100.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMeterDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAddMeter} disabled={addingMeter}>
              {addingMeter && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              确认添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
