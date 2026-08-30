"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  Users,
  Zap,
  Droplets,
  Flame,
  Gift,
  Wifi,
} from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSiteDetail } from "./useSiteDetail";
import { StatsCards } from "./_components/StatsCards";
import { DraggableMeterCard } from "./_components/DraggableMeterCard";
import {
  BaseProfileCard,
  EnterprisePanel,
  PropertyPaymentPanel,
} from "./_components/BaseDetailPanels";

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

  const [showAddMeterDialog, setShowAddMeterDialog] = useState(false);
  const [addingMeter, setAddingMeter] = useState(false);
  const [meterForm, setMeterForm] = useState({
    code: "",
    name: "",
    area: "",
    electricityEnabled: true,
    electricityNumber: "",
    electricityProvider: "",
    electricityChargeInst: "",
    waterEnabled: true,
    waterNumber: "",
    waterProvider: "",
    waterChargeInst: "",
    heatingEnabled: true,
    heatingNumber: "",
    propertyFeeEnabled: true,
    networkEnabled: false,
    networkNumber: "",
  });
  const [meterIds, setMeterIds] = useState<string[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    const sortedMeters = [...(baseDetail?.meters || [])].sort(
      (first, second) => (first.sortOrder || 0) - (second.sortOrder || 0)
    );
    setMeterIds(sortedMeters.map(meter => meter.id));
  }, [baseDetail?.meters]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = meterIds.indexOf(active.id as string);
    const newIndex = meterIds.indexOf(over.id as string);
    const reorderedIds = arrayMove(meterIds, oldIndex, newIndex);
    setMeterIds(reorderedIds);
    setSavingOrder(true);

    try {
      const response = await fetch("/api/meters/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseId, meterIds: reorderedIds }),
      });
      const result = await response.json();
      if (!result.success) {
        setMeterIds(meterIds);
        toast.error(result.error || "保存排序失败");
      } else {
        toast.success("物业顺序已保存");
      }
    } catch {
      setMeterIds(meterIds);
      toast.error("保存排序失败");
    } finally {
      setSavingOrder(false);
    }
  }, [baseId, meterIds]);

  const handleAddMeter = async () => {
    if (!meterForm.code.trim()) {
      toast.error("请输入物业编号");
      return;
    }
    if (![meterForm.electricityEnabled, meterForm.waterEnabled, meterForm.heatingEnabled, meterForm.propertyFeeEnabled, meterForm.networkEnabled].some(Boolean)) {
      toast.error("请至少选择一项物业费用");
      return;
    }

    setAddingMeter(true);
    try {
      const response = await fetch("/api/meters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_id: baseId,
          code: meterForm.code.trim(),
          name: meterForm.name.trim() || meterForm.code.trim(),
          area: meterForm.area ? Number(meterForm.area) : null,
          electricityEnabled: meterForm.electricityEnabled,
          electricityNumber: meterForm.electricityNumber.trim() || null,
          electricityProvider: meterForm.electricityProvider.trim() || null,
          electricityChargeInst: meterForm.electricityChargeInst.trim() || null,
          waterEnabled: meterForm.waterEnabled,
          waterNumber: meterForm.waterNumber.trim() || null,
          waterProvider: meterForm.waterProvider.trim() || null,
          waterChargeInst: meterForm.waterChargeInst.trim() || null,
          heatingEnabled: meterForm.heatingEnabled,
          heatingNumber: meterForm.heatingNumber.trim() || null,
          propertyFeeEnabled: meterForm.propertyFeeEnabled,
          networkEnabled: meterForm.networkEnabled,
          networkNumber: meterForm.networkNumber.trim() || null,
        }),
      });
      const result = await response.json();
      if (!result.success) {
        toast.error(result.error || "创建失败");
        return;
      }
      toast.success("物业创建成功");
      setShowAddMeterDialog(false);
      setMeterForm({
        code: "",
        name: "",
        area: "",
        electricityEnabled: true,
        electricityNumber: "",
        electricityProvider: "",
        electricityChargeInst: "",
        waterEnabled: true,
        waterNumber: "",
        waterProvider: "",
        waterChargeInst: "",
        heatingEnabled: true,
        heatingNumber: "",
        propertyFeeEnabled: true,
        networkEnabled: false,
        networkNumber: "",
      });
      await refreshBaseDetail();
    } catch {
      toast.error("创建失败");
    } finally {
      setAddingMeter(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50/60">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!baseDetail) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-slate-50/60 px-6 text-center">
        <Building2 className="mb-4 h-10 w-10 text-slate-300" />
        <p className="font-medium text-slate-700">基地不存在或已被删除</p>
        <Button variant="outline" className="mt-5" onClick={() => router.push("/dashboard/base/sites")}>返回基地列表</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-10">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <button
          onClick={() => router.push("/dashboard/base/sites")}
          className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition hover:bg-white hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          返回基地列表
        </button>

        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-5 py-6 text-white shadow-xl shadow-slate-900/10 sm:px-7 sm:py-7 lg:px-9">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-cyan-100 ring-1 ring-white/10">
                  <span className={`h-2 w-2 rounded-full ${baseDetail.status === "active" ? "bg-emerald-400" : "bg-slate-400"}`} />
                  {baseDetail.status === "active" ? "运营中" : "已停用"}
                </span>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300 ring-1 ring-white/10">基地业务档案</span>
              </div>
              <div className="flex items-start gap-4">
                <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 sm:flex">
                  <Building2 className="h-7 w-7 text-cyan-200" />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{baseDetail.name}</h1>
                  <p className="mt-2 flex max-w-3xl items-start gap-2 text-sm leading-6 text-slate-300">
                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-cyan-300" />
                    <span>{baseDetail.address || "基地地址尚未完善"}</span>
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                    <BriefcaseBusiness className="h-4 w-4 text-cyan-300" />
                    {baseDetail.organization?.name || baseDetail.managementCompanyName || "运营机构尚未登记"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                variant="outline"
                className="border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                onClick={() => router.push(`/dashboard/base/sites/${baseId}/edit`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                编辑基地
              </Button>
              <Button
                variant="outline"
                className="border-rose-300/20 bg-rose-400/10 text-rose-100 hover:bg-rose-400/20 hover:text-white"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </Button>
            </div>
          </div>
        </section>

        <div className="mt-5">
          <StatsCards stats={stats} />
        </div>

        <Tabs defaultValue="overview" className="mt-6 gap-5">
          <div className="overflow-x-auto pb-1">
            <TabsList className="h-12 min-w-max rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              <TabsTrigger value="overview" className="rounded-xl px-4 data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                <LayoutDashboard /> 综合概览
              </TabsTrigger>
              <TabsTrigger value="enterprises" className="rounded-xl px-4 data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                <Users /> 企业信息
              </TabsTrigger>
              <TabsTrigger value="payments" className="rounded-xl px-4 data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                <ReceiptText /> 物业缴费
              </TabsTrigger>
              <TabsTrigger value="resources" className="rounded-xl px-4 data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                <Building2 /> 空间资源
              </TabsTrigger>
              <TabsTrigger value="profile" className="rounded-xl px-4 data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                <FileText /> 基地档案
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-0">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.8fr)]">
              <div className="space-y-5">
                <EnterprisePanel
                  enterprises={baseDetail.tenantEnterprises}
                  title="入驻企业概览"
                  description="展示已建立基地关系的企业及其工位分配情况"
                  compact
                />
                <PropertyPaymentPanel base={baseDetail} compact onRefresh={refreshBaseDetail} />
              </div>
              <div className="space-y-5">
                <BaseProfileCard base={baseDetail} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="enterprises" className="mt-0 space-y-5">
            <EnterprisePanel
              enterprises={baseDetail.tenantEnterprises}
              title="入驻企业"
              description="注册在本基地并可分配物业、空间和工位的企业"
            />
            <EnterprisePanel
              enterprises={baseDetail.serviceEnterprises}
              title="服务企业"
              description="未注册在本基地，但使用基地服务的外部企业"
            />
          </TabsContent>

          <TabsContent value="payments" className="mt-0">
            <PropertyPaymentPanel base={baseDetail} onRefresh={refreshBaseDetail} />
          </TabsContent>

          <TabsContent value="resources" className="mt-0">
            <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/30 sm:p-6">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">物业与空间资源</h2>
                  <p className="mt-1 text-sm text-slate-500">物业按独立水、电表划分；进入物业后维护房间与工位</p>
                </div>
                <div className="flex items-center gap-3">
                  {savingOrder && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-cyan-700">
                      <Loader2 className="h-4 w-4 animate-spin" /> 保存排序
                    </span>
                  )}
                  <Button onClick={() => setShowAddMeterDialog(true)} className="bg-slate-950 text-white hover:bg-slate-800">
                    <Plus className="mr-2 h-4 w-4" /> 新增物业
                  </Button>
                </div>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={meterIds} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {meterIds.map(meterId => {
                      const meter = baseDetail.meters.find(item => item.id === meterId);
                      return meter ? <DraggableMeterCard key={meter.id} meter={meter} baseId={baseId} /> : null;
                    })}
                    <button
                      type="button"
                      onClick={() => setShowAddMeterDialog(true)}
                      className="group min-h-56 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-6 text-center transition hover:border-cyan-300 hover:bg-cyan-50/50"
                    >
                      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 transition group-hover:text-cyan-700 group-hover:ring-cyan-200">
                        <Plus className="h-5 w-5" />
                      </span>
                      <span className="mt-4 block font-semibold text-slate-700">新增物业</span>
                      <span className="mt-1 block text-sm text-slate-400">录入独立计量单元及水电暖网信息</span>
                    </button>
                  </div>
                </SortableContext>
              </DndContext>
            </section>
          </TabsContent>

          <TabsContent value="profile" className="mt-0">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
              <BaseProfileCard base={baseDetail} />
              <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30 sm:p-6">
                <h2 className="text-lg font-semibold text-slate-950">基地详细信息</h2>
                <p className="mt-1 text-sm text-slate-500">用于工商登记、企业入驻和物业管理的基础资料</p>
                <div className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-100">
                  {[
                    ["基地名称", baseDetail.name],
                    ["基地地址", baseDetail.address || "未登记"],
                    ["地址模板", baseDetail.addressTemplate || "未登记"],
                    ["运营状态", baseDetail.status === "active" ? "运营中" : "已停用"],
                    ["物业数量", `${stats.totalMeters} 个`],
                    ["物理空间", `${stats.totalSpaces} 个`],
                    ["工位资源", `${stats.allocatedRegNumbers}/${stats.totalRegNumbers} 已分配`],
                  ].map(([label, value]) => (
                    <div key={label} className="grid gap-1 px-4 py-4 sm:grid-cols-[130px_1fr] sm:gap-5">
                      <span className="text-sm text-slate-400">{label}</span>
                      <span className="break-words text-sm font-medium leading-6 text-slate-700">{value}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="mt-5 w-full justify-between" onClick={() => router.push(`/dashboard/base/sites/${baseId}/edit`)}>
                  完善基地资料 <ChevronRight className="h-4 w-4" />
                </Button>
              </section>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除基地？</AlertDialogTitle>
            <AlertDialogDescription>
              删除“{baseDetail.name}”会同时删除其物业、空间和工位数据，此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBase} disabled={deleting} className="bg-rose-600 hover:bg-rose-700">
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showAddMeterDialog} onOpenChange={setShowAddMeterDialog}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>新增物业</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">物业编号 <span className="text-rose-500">*</span></label>
              <Input value={meterForm.code} onChange={event => setMeterForm(current => ({ ...current, code: event.target.value }))} placeholder="例如：1号楼102门" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">物业名称</label>
              <Input value={meterForm.name} onChange={event => setMeterForm(current => ({ ...current, name: event.target.value }))} placeholder="例如：义乌城1号楼102门" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">建筑面积（㎡）</label>
              <Input type="number" min="0" step="0.01" value={meterForm.area} onChange={event => setMeterForm(current => ({ ...current, area: event.target.value }))} placeholder="0.00" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">适用费用 <span className="text-rose-500">*</span></label>
              <p className="mb-3 text-xs text-slate-400">勾选后录入对应账户，只有启用的费用会进入物业缴费看板。</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {[
                  { field: "electricityEnabled" as const, label: "电费", icon: Zap, className: "text-amber-600" },
                  { field: "waterEnabled" as const, label: "水费", icon: Droplets, className: "text-sky-600" },
                  { field: "heatingEnabled" as const, label: "取暖费", icon: Flame, className: "text-orange-600" },
                  { field: "propertyFeeEnabled" as const, label: "物业费", icon: Gift, className: "text-emerald-600" },
                  { field: "networkEnabled" as const, label: "网络费", icon: Wifi, className: "text-slate-600" },
                ].map(item => (
                  <label key={item.field} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm font-medium transition ${meterForm[item.field] ? "border-cyan-300 bg-cyan-50" : "border-slate-200 bg-white"}`}>
                    <Checkbox
                      checked={meterForm[item.field]}
                      onCheckedChange={checked => setMeterForm(current => ({ ...current, [item.field]: checked === true }))}
                    />
                    <item.icon className={`h-4 w-4 ${item.className}`} />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            {meterForm.electricityEnabled && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-800"><Zap className="h-4 w-4" />电费账户</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input value={meterForm.electricityNumber} onChange={event => setMeterForm(current => ({ ...current, electricityNumber: event.target.value }))} placeholder="电费户号" />
                  <Input value={meterForm.electricityProvider} onChange={event => setMeterForm(current => ({ ...current, electricityProvider: event.target.value }))} placeholder="收费机构名称" />
                  <Input className="sm:col-span-2" value={meterForm.electricityChargeInst} onChange={event => setMeterForm(current => ({ ...current, electricityChargeInst: event.target.value }))} placeholder="支付宝收费机构编码（可后补）" />
                </div>
              </div>
            )}

            {meterForm.waterEnabled && (
              <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-sky-800"><Droplets className="h-4 w-4" />水费账户</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input value={meterForm.waterNumber} onChange={event => setMeterForm(current => ({ ...current, waterNumber: event.target.value }))} placeholder="水费户号" />
                  <Input value={meterForm.waterProvider} onChange={event => setMeterForm(current => ({ ...current, waterProvider: event.target.value }))} placeholder="收费机构名称" />
                  <Input className="sm:col-span-2" value={meterForm.waterChargeInst} onChange={event => setMeterForm(current => ({ ...current, waterChargeInst: event.target.value }))} placeholder="支付宝收费机构编码（可后补）" />
                </div>
              </div>
            )}

            {meterForm.heatingEnabled && (
              <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-orange-800"><Flame className="h-4 w-4" />取暖费账户</p>
                <Input value={meterForm.heatingNumber} onChange={event => setMeterForm(current => ({ ...current, heatingNumber: event.target.value }))} placeholder="取暖户号" />
              </div>
            )}

            {meterForm.propertyFeeEnabled && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm text-emerald-800">
                <p className="font-semibold">物业费</p>
                <p className="mt-1 text-xs leading-5 text-emerald-700">
                  {baseDetail.propertyFeeMode === "free" ? "当前基地实行免物业费政策，启用后看板将显示年度免收状态。" : "当前基地按年度管理物业费，后续可建立每年账单。"}
                </p>
              </div>
            )}

            {meterForm.networkEnabled && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><Wifi className="h-4 w-4" />网络费用账户</p>
                <Input value={meterForm.networkNumber} onChange={event => setMeterForm(current => ({ ...current, networkNumber: event.target.value }))} placeholder="宽带或网络账号" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMeterDialog(false)} disabled={addingMeter}>取消</Button>
            <Button onClick={handleAddMeter} disabled={addingMeter} className="bg-slate-950 hover:bg-slate-800">
              {addingMeter && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              创建物业
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
