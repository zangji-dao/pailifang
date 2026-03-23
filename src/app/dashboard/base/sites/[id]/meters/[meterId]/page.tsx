"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, Settings, DoorOpen, Plus, ChevronRight, Loader2, Save, Pencil, Trash2, Zap, Droplets, Flame, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Meter, Space, Enterprise, RegNumber, MeterType } from "../../types";

export default function MeterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const baseId = params.id as string;
  const meterId = params.meterId as string;

  const [meter, setMeter] = useState<Meter | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSpace, setExpandedSpace] = useState<string | null>(null);
  const [showAddSpace, setShowAddSpace] = useState(false);
  const [showAddRegNumber, setShowAddRegNumber] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 空间编辑状态
  const [editingSpace, setEditingSpace] = useState<string | null>(null);
  const [spaceEditForm, setSpaceEditForm] = useState({ name: "", area: "" });

  // 删除空间确认
  const [deleteSpaceId, setDeleteSpaceId] = useState<string | null>(null);

  // 表单数据
  const [form, setForm] = useState({
    code: "",
    name: "",
    area: "",
    // 电表
    electricityNumber: "",
    electricityType: "base" as MeterType,
    electricityEnterpriseId: "",
    // 水表
    waterNumber: "",
    waterType: "base" as MeterType,
    waterEnterpriseId: "",
    // 取暖
    heatingNumber: "",
    heatingType: "base" as MeterType,
    heatingArrears: false,
    heatingEnterpriseId: "",
    // 网络
    networkNumber: "",
    networkType: "base" as MeterType,
    networkArrears: false,
  });

  // 新增空间表单
  const [spaceForm, setSpaceForm] = useState({ name: "" });

  // 新增工位号表单
  const [regNumberForm, setRegNumberForm] = useState({ code: "" });

  // 企业列表
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);

  // 获取物业详情
  useEffect(() => {
    const fetchMeter = async () => {
      try {
        const res = await fetch(`/api/bases/${baseId}`);
        const result = await res.json();
        if (result.success) {
          const foundMeter = result.data.meters?.find((m: Meter) => m.id === meterId);
          setMeter(foundMeter || null);
          // 初始化表单
          if (foundMeter) {
            setForm({
              code: foundMeter.code || "",
              name: foundMeter.name || "",
              area: foundMeter.area?.toString() || "",
              electricityNumber: foundMeter.electricityNumber || "",
              electricityType: foundMeter.electricityType || "base",
              electricityEnterpriseId: foundMeter.electricityEnterpriseId || "",
              waterNumber: foundMeter.waterNumber || "",
              waterType: foundMeter.waterType || "base",
              waterEnterpriseId: foundMeter.waterEnterpriseId || "",
              heatingNumber: foundMeter.heatingNumber || "",
              heatingType: foundMeter.heatingType || "base",
              heatingArrears: foundMeter.heatingArrears || false,
              heatingEnterpriseId: foundMeter.heatingEnterpriseId || "",
              networkNumber: foundMeter.networkNumber || "",
              networkType: foundMeter.networkType || "base",
              networkArrears: foundMeter.networkArrears || false,
            });
          }
        }
      } catch (error) {
        console.error("获取物业详情失败:", error);
      } finally {
        setLoading(false);
      }
    };

    if (baseId && meterId) {
      fetchMeter();
    }
  }, [baseId, meterId]);

  // 获取入驻企业列表
  useEffect(() => {
    const fetchEnterprises = async () => {
      try {
        const res = await fetch("/api/enterprises?type=tenant");
        const result = await res.json();
        if (result.success) {
          setEnterprises(result.data || []);
        }
      } catch (error) {
        console.error("获取企业列表失败:", error);
      }
    };

    fetchEnterprises();
  }, []);

  // 刷新数据
  const refreshMeter = async () => {
    try {
      const res = await fetch(`/api/bases/${baseId}`);
      const result = await res.json();
      if (result.success) {
        const foundMeter = result.data.meters?.find((m: Meter) => m.id === meterId);
        setMeter(foundMeter || null);
      }
    } catch (error) {
      console.error("刷新物业详情失败:", error);
    }
  };

  // 保存物业信息
  const handleSave = async () => {
    if (!form.code.trim()) {
      toast.error("请输入物业编号");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/meters/${meterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          name: form.name || form.code,
          area: form.area ? parseFloat(form.area) : null,
          electricityNumber: form.electricityNumber || null,
          electricityType: form.electricityType,
          electricityEnterpriseId: form.electricityEnterpriseId || null,
          waterNumber: form.waterNumber || null,
          waterType: form.waterType,
          waterEnterpriseId: form.waterEnterpriseId || null,
          heatingNumber: form.heatingNumber || null,
          heatingType: form.heatingType,
          heatingArrears: form.heatingArrears,
          heatingEnterpriseId: form.heatingEnterpriseId || null,
          networkNumber: form.networkNumber || null,
          networkType: form.networkType,
          networkArrears: form.networkArrears,
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success("保存成功");
        refreshMeter();
      } else {
        toast.error(result.error || "保存失败");
      }
    } catch (error) {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  // 新增空间
  const handleAddSpace = async () => {
    if (!spaceForm.name.trim()) {
      toast.error("请输入空间名称");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meter_id: meterId,
          name: spaceForm.name,
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success("空间创建成功");
        setShowAddSpace(false);
        setSpaceForm({ name: "" });
        refreshMeter();
      } else {
        toast.error(result.error || "创建失败");
      }
    } catch (error) {
      toast.error("创建失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 更新空间
  const handleUpdateSpace = async (spaceId: string) => {
    if (!spaceEditForm.name.trim()) {
      toast.error("请输入空间名称");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/spaces/${spaceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: spaceEditForm.name,
          area: spaceEditForm.area ? parseFloat(spaceEditForm.area) : null,
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success("空间更新成功");
        setEditingSpace(null);
        refreshMeter();
      } else {
        toast.error(result.error || "更新失败");
      }
    } catch (error) {
      toast.error("更新失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 删除空间
  const handleDeleteSpace = async () => {
    if (!deleteSpaceId) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/spaces/${deleteSpaceId}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (result.success) {
        toast.success("空间删除成功");
        setDeleteSpaceId(null);
        setExpandedSpace(null);
        refreshMeter();
      } else {
        toast.error(result.error || "删除失败");
      }
    } catch (error) {
      toast.error("删除失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 新增工位号
  const handleAddRegNumber = async (spaceId: string) => {
    if (!regNumberForm.code.trim()) {
      toast.error("请输入工位号");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/registration-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          space_id: spaceId,
          code: regNumberForm.code,
          available: true,
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success("工位号创建成功");
        setShowAddRegNumber(null);
        setRegNumberForm({ code: "" });
        refreshMeter();
      } else {
        toast.error(result.error || "创建失败");
      }
    } catch (error) {
      toast.error("创建失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 开始编辑空间
  const startEditSpace = (space: Space) => {
    setEditingSpace(space.id);
    setSpaceEditForm({
      name: space.name,
      area: space.area?.toString() || "",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" style={{ background: "linear-gradient(180deg, #FDFBF7 0%, #F8F5F0 100%)" }}>
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!meter) {
    return (
      <div className="text-center py-20" style={{ background: "linear-gradient(180deg, #FDFBF7 0%, #F8F5F0 100%)" }}>
        <p style={{ color: "#78716C" }}>物业不存在</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push(`/dashboard/base/sites/${baseId}`)}>
          返回基地详情
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #FDFBF7 0%, #F8F5F0 100%)" }}>
      <div className="p-8 max-w-4xl mx-auto">
        {/* 页面头部 */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/dashboard/base/sites/${baseId}`)}
            className="inline-flex items-center gap-2 text-sm font-medium mb-4 px-3 py-1.5 rounded-lg hover:bg-white/60 transition-colors"
            style={{ color: "#78716C" }}
          >
            <ArrowLeft className="h-4 w-4" />
            返回基地详情
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 flex items-center justify-center shadow-inner">
                <Building2 className="h-7 w-7 text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1C1917" }}>
                  物业信息
                </h1>
                <p className="text-sm" style={{ color: "#78716C" }}>编辑物业基本信息和表号</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="h-10 px-6">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  保存
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 基本信息表单 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="text-base font-semibold mb-5" style={{ color: "#1C1917" }}>基本信息</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="code">物业编号 *</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="如：1-101"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">物业名称</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="如：1号楼101室"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area">建筑面积（㎡）</Label>
              <Input
                id="area"
                type="number"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                placeholder="如：100.5"
              />
            </div>
          </div>
        </div>

        {/* 表号信息表单 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="text-base font-semibold mb-5 flex items-center gap-2" style={{ color: "#1C1917" }}>
            <Settings className="h-5 w-5" style={{ color: "#A8A29E" }} />
            表号信息
          </h2>
          
          <div className="space-y-8">
            {/* 电表 - 显示余额（只读） */}
            <div>
              <h3 className="text-sm font-medium mb-4 pb-2 border-b border-slate-100 flex items-center gap-2" style={{ color: "#78716C" }}>
                <Zap className="h-4 w-4 text-amber-500" />
                电表
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>电表号</Label>
                  <Input
                    value={form.electricityNumber}
                    onChange={(e) => setForm({ ...form, electricityNumber: e.target.value })}
                    placeholder="输入电表号"
                  />
                </div>
                <div className="space-y-2">
                  <Label>类型</Label>
                  <Select value={form.electricityType} onValueChange={(v) => setForm({ ...form, electricityType: v as MeterType })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="base">基地电表</SelectItem>
                      <SelectItem value="customer">客户电表</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>负责公司</Label>
                  <Select value={form.electricityEnterpriseId || "none"} onValueChange={(v) => setForm({ ...form, electricityEnterpriseId: v === "none" ? "" : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择负责公司" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">无</SelectItem>
                      {enterprises.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* 余额显示 */}
              <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs" style={{ color: "#78716C" }}>当前余额（支付宝同步）</span>
                    <p className={`text-2xl font-bold mt-1 ${meter.electricityBalance !== null && meter.electricityBalance < 50 ? 'text-red-500' : 'text-amber-600'}`}>
                      ¥{meter.electricityBalance?.toFixed(2) || '--'}
                    </p>
                  </div>
                  {meter.electricityBalanceUpdatedAt && (
                    <span className="text-xs" style={{ color: "#A8A29E" }}>
                      更新于 {new Date(meter.electricityBalanceUpdatedAt).toLocaleString("zh-CN")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 水表 - 显示余额（只读） */}
            <div>
              <h3 className="text-sm font-medium mb-4 pb-2 border-b border-slate-100 flex items-center gap-2" style={{ color: "#78716C" }}>
                <Droplets className="h-4 w-4 text-sky-500" />
                水表
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>水表号</Label>
                  <Input
                    value={form.waterNumber}
                    onChange={(e) => setForm({ ...form, waterNumber: e.target.value })}
                    placeholder="输入水表号"
                  />
                </div>
                <div className="space-y-2">
                  <Label>类型</Label>
                  <Select value={form.waterType} onValueChange={(v) => setForm({ ...form, waterType: v as MeterType })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="base">基地水表</SelectItem>
                      <SelectItem value="customer">客户水表</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>负责公司</Label>
                  <Select value={form.waterEnterpriseId || "none"} onValueChange={(v) => setForm({ ...form, waterEnterpriseId: v === "none" ? "" : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择负责公司" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">无</SelectItem>
                      {enterprises.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* 余额显示 */}
              <div className="mt-4 p-4 bg-sky-50 rounded-xl border border-sky-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs" style={{ color: "#78716C" }}>当前余额（支付宝同步）</span>
                    <p className={`text-2xl font-bold mt-1 ${meter.waterBalance !== null && meter.waterBalance < 50 ? 'text-red-500' : 'text-sky-600'}`}>
                      ¥{meter.waterBalance?.toFixed(2) || '--'}
                    </p>
                  </div>
                  {meter.waterBalanceUpdatedAt && (
                    <span className="text-xs" style={{ color: "#A8A29E" }}>
                      更新于 {new Date(meter.waterBalanceUpdatedAt).toLocaleString("zh-CN")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 取暖 - 是否欠费开关 */}
            <div>
              <h3 className="text-sm font-medium mb-4 pb-2 border-b border-slate-100 flex items-center gap-2" style={{ color: "#78716C" }}>
                <Flame className="h-4 w-4 text-orange-500" />
                取暖号
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>取暖号</Label>
                  <Input
                    value={form.heatingNumber}
                    onChange={(e) => setForm({ ...form, heatingNumber: e.target.value })}
                    placeholder="输入取暖号"
                  />
                </div>
                <div className="space-y-2">
                  <Label>类型</Label>
                  <Select value={form.heatingType} onValueChange={(v) => setForm({ ...form, heatingType: v as MeterType })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="base">基地取暖号</SelectItem>
                      <SelectItem value="customer">客户取暖号</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>负责公司</Label>
                  <Select value={form.heatingEnterpriseId || "none"} onValueChange={(v) => setForm({ ...form, heatingEnterpriseId: v === "none" ? "" : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择负责公司" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">无</SelectItem>
                      {enterprises.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* 是否欠费开关 */}
              <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium" style={{ color: "#1C1917" }}>缴费状态</span>
                    <p className="text-xs mt-0.5" style={{ color: "#78716C" }}>手动设置取暖费是否欠费</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${form.heatingArrears ? 'text-red-500' : 'text-emerald-600'}`}>
                      {form.heatingArrears ? '欠费' : '正常'}
                    </span>
                    <Switch
                      checked={form.heatingArrears}
                      onCheckedChange={(checked) => setForm({ ...form, heatingArrears: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 网络 - 是否欠费开关 */}
            <div>
              <h3 className="text-sm font-medium mb-4 pb-2 border-b border-slate-100 flex items-center gap-2" style={{ color: "#78716C" }}>
                <Wifi className="h-4 w-4 text-violet-500" />
                网络
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>网络账号</Label>
                  <Input
                    value={form.networkNumber}
                    onChange={(e) => setForm({ ...form, networkNumber: e.target.value })}
                    placeholder="输入网络账号"
                  />
                </div>
                <div className="space-y-2">
                  <Label>类型</Label>
                  <Select value={form.networkType} onValueChange={(v) => setForm({ ...form, networkType: v as MeterType })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="base">基地网络</SelectItem>
                      <SelectItem value="customer">客户网络</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div></div>
              </div>
              {/* 是否欠费开关 */}
              <div className="mt-4 p-4 bg-violet-50 rounded-xl border border-violet-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium" style={{ color: "#1C1917" }}>缴费状态</span>
                    <p className="text-xs mt-0.5" style={{ color: "#78716C" }}>手动设置网络费是否欠费</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${form.networkArrears ? 'text-red-500' : 'text-emerald-600'}`}>
                      {form.networkArrears ? '欠费' : '正常'}
                    </span>
                    <Switch
                      checked={form.networkArrears}
                      onCheckedChange={(checked) => setForm({ ...form, networkArrears: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 物理空间 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: "#1C1917" }}>
              <DoorOpen className="h-5 w-5" style={{ color: "#A8A29E" }} />
              物理空间
            </h2>
            <Button variant="outline" size="sm" onClick={() => setShowAddSpace(true)}>
              <Plus className="h-4 w-4 mr-1" />
              新增空间
            </Button>
          </div>

          {/* 新增空间表单 */}
          {showAddSpace && (
            <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200">
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-2">
                  <Label>空间名称 *</Label>
                  <Input
                    value={spaceForm.name}
                    onChange={(e) => setSpaceForm({ ...spaceForm, name: e.target.value })}
                    placeholder="如：主办公区、会议室"
                  />
                </div>
                <Button variant="outline" onClick={() => setShowAddSpace(false)}>取消</Button>
                <Button onClick={handleAddSpace} disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  确认
                </Button>
              </div>
            </div>
          )}

          {(meter.spaces?.length || 0) === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
              <DoorOpen className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm" style={{ color: "#A8A29E" }}>暂无物理空间，点击上方按钮新增</p>
            </div>
          ) : (
            <div className="space-y-3">
              {meter.spaces?.map((space: Space) => (
                <div key={space.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  {/* 空间头部 */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedSpace(expandedSpace === space.id ? null : space.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
                        <DoorOpen className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <span className="font-medium" style={{ color: "#1C1917" }}>{space.code}</span>
                        <span className="text-sm ml-2" style={{ color: "#78716C" }}>{space.name}</span>
                        {space.area && (
                          <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-slate-100" style={{ color: "#A8A29E" }}>
                            {space.area}㎡
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs px-2.5 py-1 rounded-full" style={{ background: (space.regNumbers?.filter((r: RegNumber) => r.status === "allocated")?.length || 0) > 0 ? "#DCFCE7" : "#F5F5F4", color: (space.regNumbers?.filter((r: RegNumber) => r.status === "allocated")?.length || 0) > 0 ? "#15803D" : "#78716C" }}>
                        {(space.regNumbers?.filter((r: RegNumber) => r.status === "allocated")?.length || 0)}/{space.regNumbers?.length || 0} 已分配
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-transform ${expandedSpace === space.id ? "rotate-90" : ""}`} style={{ color: "#A8A29E" }} />
                    </div>
                  </div>

                  {/* 展开内容 */}
                  {expandedSpace === space.id && (
                    <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                      {/* 空间编辑表单 */}
                      {editingSpace === space.id ? (
                        <div className="bg-white rounded-lg p-4 mt-3 border border-slate-200">
                          <h4 className="text-sm font-medium mb-3" style={{ color: "#1C1917" }}>编辑空间信息</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>空间名称 *</Label>
                              <Input
                                value={spaceEditForm.name}
                                onChange={(e) => setSpaceEditForm({ ...spaceEditForm, name: e.target.value })}
                                placeholder="如：主办公区"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>面积（㎡）</Label>
                              <Input
                                type="number"
                                value={spaceEditForm.area}
                                onChange={(e) => setSpaceEditForm({ ...spaceEditForm, area: e.target.value })}
                                placeholder="如：50"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" size="sm" onClick={() => setEditingSpace(null)}>取消</Button>
                            <Button size="sm" onClick={() => handleUpdateSpace(space.id)} disabled={submitting}>
                              {submitting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                              保存
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* 操作按钮 */}
                          <div className="flex items-center gap-2 mt-3 mb-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditSpace(space);
                              }}
                            >
                              <Pencil className="h-3 w-3 mr-1" />编辑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteSpaceId(space.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />删除
                            </Button>
                          </div>

                          {/* 工位号 */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium" style={{ color: "#78716C" }}>工位号</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowAddRegNumber(space.id);
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />新增
                            </Button>
                          </div>

                          {/* 新增工位号表单 */}
                          {showAddRegNumber === space.id && (
                            <div className="bg-white rounded-lg p-3 mb-3 border border-slate-200">
                              <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                  <label className="text-xs font-medium mb-1 block" style={{ color: "#78716C" }}>工位号 *</label>
                                  <Input
                                    value={regNumberForm.code}
                                    onChange={(e) => setRegNumberForm({ code: e.target.value })}
                                    placeholder="如：101-1"
                                    className="h-8"
                                  />
                                </div>
                                <Button variant="outline" size="sm" className="h-8" onClick={() => setShowAddRegNumber(null)}>取消</Button>
                                <Button size="sm" className="h-8" onClick={() => handleAddRegNumber(space.id)} disabled={submitting}>
                                  {submitting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                  确认
                                </Button>
                              </div>
                            </div>
                          )}

                          {(space.regNumbers?.length || 0) === 0 ? (
                            <p className="text-xs text-center py-6" style={{ color: "#A8A29E" }}>暂无工位号</p>
                          ) : (
                            <div className="grid grid-cols-3 gap-2">
                              {space.regNumbers?.map((reg: RegNumber) => (
                                <div
                                  key={reg.id}
                                  className={`px-3 py-2.5 rounded-lg border text-center ${
                                    reg.status === "allocated"
                                      ? "bg-emerald-50 border-emerald-200"
                                      : "bg-white border-slate-200"
                                  }`}
                                >
                                  <span className="font-mono text-sm font-medium" style={{ color: "#1C1917" }}>{reg.code}</span>
                                  {reg.enterprise && (
                                    <p className="text-xs mt-0.5 truncate" style={{ color: "#A8A29E" }}>{reg.enterprise.name}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 删除空间确认对话框 */}
      <AlertDialog open={!!deleteSpaceId} onOpenChange={(open) => !open && setDeleteSpaceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除空间</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除该空间吗？如果空间下有工位号将无法删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSpace}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {submitting ? (
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
