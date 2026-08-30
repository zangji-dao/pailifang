"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, Settings, DoorOpen, Plus, ChevronRight, Loader2, Save, Pencil, Trash2, Zap, Droplets, Flame, Wifi, CircleAlert, BadgeCheck, ReceiptText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Meter, Space, Enterprise, RegNumber, MeterType, NetworkStatus, HeatingStatus, UtilityPayment } from "../../types";

interface AlipayConfiguration {
  configured: boolean;
  appIdMasked: string | null;
  redirectUri: string | null;
  utilityBilling?: {
    enabled: boolean;
    status: "enabled" | "pending_authorization";
    mode: "institution_bill_query";
    requiresInstitutionAgreement: boolean;
    message: string;
  };
}

type UtilityBillType = "electricity" | "water";

const createUtilityBillForm = () => ({
  billingPeriod: new Date().toISOString().slice(0, 7),
  amount: "",
  quantity: "",
  unitPrice: "",
  status: "pending",
  paymentMethod: "",
  receiptNumber: "",
});

function getLatestPayment(meter: Meter, utilityType: "electricity" | "water") {
  return [...(meter.utilityPayments || [])]
    .filter(payment => payment.utilityType === utilityType)
    .sort((first, second) => second.billingPeriod.localeCompare(first.billingPeriod))[0] || null;
}

function formatBillAmount(payment: UtilityPayment | null) {
  if (!payment) return "--";
  return Number(payment.amount || 0).toLocaleString("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
  });
}

function formatBalance(balance: number | string | null) {
  if (balance === null || balance === "") return "--";
  const value = Number(balance);
  if (!Number.isFinite(value)) return "--";
  return value.toLocaleString("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
  });
}

function formatBalanceUpdatedAt(value: string | null) {
  if (!value) return "尚未从收费机构同步";
  return `更新于 ${new Date(value).toLocaleString("zh-CN", { hour12: false })}`;
}

function getPaymentStatus(payment: UtilityPayment | null) {
  if (!payment) return { label: "暂无账单", className: "bg-slate-100 text-slate-500" };
  if (payment.status === "paid") return { label: "已缴", className: "bg-emerald-100 text-emerald-700" };
  if (payment.status === "arrears") return { label: "欠费", className: "bg-rose-100 text-rose-700" };
  return { label: "待缴", className: "bg-amber-100 text-amber-700" };
}

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

  const [alipayConfiguration, setAlipayConfiguration] = useState<AlipayConfiguration | null>(null);
  const [syncingBalance, setSyncingBalance] = useState<UtilityBillType | null>(null);
  const [billDialogType, setBillDialogType] = useState<UtilityBillType | null>(null);
  const [savingBill, setSavingBill] = useState(false);
  const [utilityBillForm, setUtilityBillForm] = useState(createUtilityBillForm);

  // 删除物业确认
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 表单数据
  const [form, setForm] = useState({
    code: "",
    name: "",
    area: "",
    // 电表
    electricityEnabled: true,
    electricityNumber: "",
    electricityProvider: "",
    electricityChargeInst: "",
    electricityType: "base" as MeterType,
    electricityEnterpriseId: "",
    // 水表
    waterEnabled: true,
    waterNumber: "",
    waterProvider: "",
    waterChargeInst: "",
    waterType: "base" as MeterType,
    waterEnterpriseId: "",
    // 取暖
    heatingEnabled: true,
    heatingNumber: "",
    heatingType: "base" as MeterType,
    heatingStatus: "full" as HeatingStatus,
    heatingEnterpriseId: "",
    propertyFeeEnabled: true,
    // 网络
    networkEnabled: false,
    networkNumber: "",
    networkType: "base" as MeterType,
    networkStatus: "normal" as NetworkStatus,
  });

  // 新增空间表单
  const [spaceForm, setSpaceForm] = useState({ name: "" });

  // 新增工位号表单
  const [regNumberForm, setRegNumberForm] = useState({ code: "" });

  // 企业列表
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);

  // 获取物业详情
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchMeter = async () => {
      try {
        const res = await fetch(`/api/bases/${baseId}`, { signal: controller.signal });
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
              electricityEnabled: foundMeter.electricityEnabled ?? Boolean(foundMeter.electricityNumber),
              electricityNumber: foundMeter.electricityNumber || "",
              electricityProvider: foundMeter.electricityProvider || "",
              electricityChargeInst: foundMeter.electricityChargeInst || "",
              electricityType: foundMeter.electricityType || "base",
              electricityEnterpriseId: foundMeter.electricityEnterpriseId || "",
              waterEnabled: foundMeter.waterEnabled ?? Boolean(foundMeter.waterNumber),
              waterNumber: foundMeter.waterNumber || "",
              waterProvider: foundMeter.waterProvider || "",
              waterChargeInst: foundMeter.waterChargeInst || "",
              waterType: foundMeter.waterType || "base",
              waterEnterpriseId: foundMeter.waterEnterpriseId || "",
              heatingEnabled: foundMeter.heatingEnabled ?? Boolean(foundMeter.heatingNumber),
              heatingNumber: foundMeter.heatingNumber || "",
              heatingType: foundMeter.heatingType || "base",
              heatingStatus: foundMeter.heatingStatus || "full",
              heatingEnterpriseId: foundMeter.heatingEnterpriseId || "",
              propertyFeeEnabled: foundMeter.propertyFeeEnabled ?? true,
              networkEnabled: foundMeter.networkEnabled ?? Boolean(foundMeter.networkNumber),
              networkNumber: foundMeter.networkNumber || "",
              networkType: foundMeter.networkType || "base",
              networkStatus: foundMeter.networkStatus || "normal",
            });
          }
        }
      } catch (error) {
        // 忽略 AbortError
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("获取物业详情失败:", error);
      } finally {
        setLoading(false);
      }
    };

    if (baseId && meterId) {
      fetchMeter();
    }
    
    return () => controller.abort();
  }, [baseId, meterId]);

  // 获取入驻企业列表
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchEnterprises = async () => {
      try {
        const res = await fetch("/api/enterprises?type=tenant", { signal: controller.signal });
        const result = await res.json();
        if (result.success) {
          setEnterprises(result.data || []);
        }
      } catch (error) {
        // 忽略 AbortError
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("获取企业列表失败:", error);
      }
    };

    fetchEnterprises();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/alipay/configuration", { signal: controller.signal, cache: "no-store" })
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          setAlipayConfiguration(result.data);
        }
      })
      .catch(error => {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("获取支付宝配置状态失败:", error);
        }
      });
    return () => controller.abort();
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
    if (![form.electricityEnabled, form.waterEnabled, form.heatingEnabled, form.propertyFeeEnabled, form.networkEnabled].some(Boolean)) {
      toast.error("请至少选择一项物业费用");
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
          electricityEnabled: form.electricityEnabled,
          electricityNumber: form.electricityNumber || null,
          electricityProvider: form.electricityProvider || null,
          electricityChargeInst: form.electricityChargeInst || null,
          electricityType: form.electricityType,
          electricityEnterpriseId: form.electricityEnterpriseId || null,
          waterEnabled: form.waterEnabled,
          waterNumber: form.waterNumber || null,
          waterProvider: form.waterProvider || null,
          waterChargeInst: form.waterChargeInst || null,
          waterType: form.waterType,
          waterEnterpriseId: form.waterEnterpriseId || null,
          heatingEnabled: form.heatingEnabled,
          heatingNumber: form.heatingNumber || null,
          heatingType: form.heatingType,
          heatingStatus: form.heatingStatus,
          heatingEnterpriseId: form.heatingEnterpriseId || null,
          propertyFeeEnabled: form.propertyFeeEnabled,
          networkEnabled: form.networkEnabled,
          networkNumber: form.networkNumber || null,
          networkType: form.networkType,
          networkStatus: form.networkStatus,
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

  const openUtilityBillDialog = (utilityType: UtilityBillType) => {
    setUtilityBillForm(createUtilityBillForm());
    setBillDialogType(utilityType);
  };

  const handleSyncBalance = async (utilityType: UtilityBillType) => {
    if (!meter) return;

    const isElectricity = utilityType === "electricity";
    const accountNumber = isElectricity ? form.electricityNumber : form.waterNumber;
    const chargeInst = isElectricity ? form.electricityChargeInst : form.waterChargeInst;
    const savedAccountNumber = isElectricity ? meter.electricityNumber : meter.waterNumber;
    const savedChargeInst = isElectricity ? meter.electricityChargeInst : meter.waterChargeInst;

    if (!accountNumber.trim()) {
      toast.error(`请先填写${isElectricity ? "电费" : "水费"}户号`);
      return;
    }
    if (!chargeInst.trim()) {
      toast.error("请先填写支付宝生活缴费收费机构编码");
      return;
    }
    if (accountNumber !== (savedAccountNumber || "") || chargeInst !== (savedChargeInst || "")) {
      toast.error("户号或收费机构编码有修改，请先保存物业信息再同步");
      return;
    }

    setSyncingBalance(utilityType);
    try {
      const response = await fetch(`/api/meters/${meterId}/sync-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: utilityType }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        toast.error(result.error || "余额同步失败");
        return;
      }

      if (result.data?.balance === null || result.data?.balance === undefined) {
        toast.info(result.message || "收费机构本次未返回余额");
      } else {
        toast.success(`${isElectricity ? "电费" : "水费"}余额已同步：${formatBalance(result.data.balance)}`);
      }
      await refreshMeter();
    } catch (error) {
      console.error("同步水电余额失败:", error);
      toast.error("余额同步失败");
    } finally {
      setSyncingBalance(null);
    }
  };

  const handleSaveUtilityBill = async () => {
    if (!billDialogType) return;
    if (!/^\d{4}-\d{2}$/.test(utilityBillForm.billingPeriod)) {
      toast.error("请选择正确的账期");
      return;
    }
    if (utilityBillForm.amount === "" || Number(utilityBillForm.amount) < 0) {
      toast.error("请输入正确的账单金额");
      return;
    }

    setSavingBill(true);
    try {
      const isElectricity = billDialogType === "electricity";
      const response = await fetch(`/api/meters/${meterId}/utility-payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utilityType: billDialogType,
          billingPeriod: utilityBillForm.billingPeriod,
          amount: utilityBillForm.amount,
          quantity: utilityBillForm.quantity,
          unitPrice: utilityBillForm.unitPrice,
          status: utilityBillForm.status,
          paymentMethod: utilityBillForm.paymentMethod,
          receiptNumber: utilityBillForm.receiptNumber,
          provider: isElectricity ? form.electricityProvider : form.waterProvider,
          accountNumber: isElectricity ? form.electricityNumber : form.waterNumber,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        toast.error(result.error || "保存账单失败");
        return;
      }

      toast.success(`${isElectricity ? "电费" : "水费"}账单已保存`);
      setBillDialogType(null);
      await refreshMeter();
    } catch (error) {
      toast.error("保存账单失败，请稍后重试");
    } finally {
      setSavingBill(false);
    }
  };

  // 检查物业是否可以删除
  const canDeleteMeter = () => {
    if (!meter) return false;
    // 不能有已分配的工位号（available = false 表示已分配）
    const hasAllocatedRegNumbers = meter.spaces?.some(space => 
      space.regNumbers?.some(reg => reg.available === false)
    );
    if (hasAllocatedRegNumbers) return false;
    return true;
  };

  // 获取不可删除原因
  const getDeleteDisabledReason = () => {
    if (!meter) return "物业不存在";
    const hasAllocatedRegNumbers = meter.spaces?.some(space => 
      space.regNumbers?.some(reg => reg.available === false)
    );
    if (hasAllocatedRegNumbers) return "该物业有已分配的工位号";
    return "";
  };

  // 删除物业
  const handleDeleteMeter = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/meters/${meterId}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (result.success) {
        toast.success("物业删除成功");
        router.push(`/dashboard/base/sites/${baseId}`);
      } else {
        toast.error(result.error || "删除失败");
      }
    } catch (error) {
      toast.error("删除失败");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
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

  const electricityPayment = getLatestPayment(meter, "electricity");
  const waterPayment = getLatestPayment(meter, "water");
  const electricityPaymentStatus = getPaymentStatus(electricityPayment);
  const waterPaymentStatus = getPaymentStatus(waterPayment);
  const alipayUtilityEnabled = !!(alipayConfiguration?.configured && alipayConfiguration.utilityBilling?.enabled);

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
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(true)} 
                disabled={!canDeleteMeter()}
                className="h-10 px-4 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 disabled:text-slate-400 disabled:border-slate-200 disabled:hover:bg-transparent"
                title={!canDeleteMeter() ? getDeleteDisabledReason() : "删除物业"}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </Button>
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
            水电账户与账单
          </h2>

          <div className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${alipayUtilityEnabled ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
            {alipayUtilityEnabled ? (
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            )}
            <div>
              <p className={`text-sm font-semibold ${alipayUtilityEnabled ? "text-emerald-800" : "text-amber-800"}`}>
                {alipayUtilityEnabled
                  ? "支付宝生活缴费查询已启用"
                  : alipayConfiguration?.configured
                    ? "支付宝生活缴费查询待开通"
                    : "支付宝开放平台尚未配置"}
              </p>
              <p className={`mt-1 text-xs leading-5 ${alipayUtilityEnabled ? "text-emerald-700" : "text-amber-700"}`}>
                {alipayConfiguration?.configured
                  ? `应用 ${alipayConfiguration.appIdMasked || "已接入"} 已完成密钥配置。${alipayConfiguration.utilityBilling?.message || "户号查询代码已就绪。"}`
                  : "配置支付宝应用密钥后，可继续开通生活缴费户号查询能力。"}
              </p>
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-3">
              <p className="text-sm font-semibold text-slate-800">适用费用</p>
              <p className="mt-1 text-xs text-slate-400">只有启用的费用会显示对应账户配置，并进入基地物业缴费看板。</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[
                { field: "electricityEnabled" as const, label: "电费", icon: Zap, className: "text-amber-600" },
                { field: "waterEnabled" as const, label: "水费", icon: Droplets, className: "text-sky-600" },
                { field: "heatingEnabled" as const, label: "取暖费", icon: Flame, className: "text-orange-600" },
                { field: "propertyFeeEnabled" as const, label: "物业费", icon: ReceiptText, className: "text-emerald-600" },
                { field: "networkEnabled" as const, label: "网络费", icon: Wifi, className: "text-violet-600" },
              ].map(item => (
                <label key={item.field} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm font-medium transition ${form[item.field] ? "border-cyan-300 bg-cyan-50" : "border-slate-200 bg-white"}`}>
                  <Checkbox
                    checked={form[item.field]}
                    onCheckedChange={checked => setForm(current => ({ ...current, [item.field]: checked === true }))}
                  />
                  <item.icon className={`h-4 w-4 ${item.className}`} />
                  {item.label}
                </label>
              ))}
            </div>
            {form.propertyFeeEnabled && (
              <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-700">
                物业费按基地政策管理；Π立方企业服务中心当前为年度免收。
              </p>
            )}
          </div>

          <div className="space-y-8">
            {/* 电表 - 显示余额（只读） */}
            {form.electricityEnabled && <div>
              <h3 className="text-sm font-medium mb-4 pb-2 border-b border-slate-100 flex items-center gap-2" style={{ color: "#78716C" }}>
                <Zap className="h-4 w-4 text-amber-500" />
                电费账单
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <Label>电费户号</Label>
                  <Input
                    value={form.electricityNumber}
                    onChange={(e) => setForm({ ...form, electricityNumber: e.target.value })}
                    placeholder="输入供电机构登记的电费户号"
                  />
                </div>
                <div className="space-y-2">
                  <Label>收费机构名称</Label>
                  <Input
                    value={form.electricityProvider}
                    onChange={(e) => setForm({ ...form, electricityProvider: e.target.value })}
                    placeholder="例如：国网吉林省电力有限公司"
                  />
                </div>
                <div className="space-y-2">
                  <Label>支付宝收费机构编码</Label>
                  <Input
                    value={form.electricityChargeInst}
                    onChange={(e) => setForm({ ...form, electricityChargeInst: e.target.value })}
                    placeholder="例如生活缴费平台分配的 charge_inst"
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
              <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <ReceiptText className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-medium text-amber-700">账户余额</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${electricityPaymentStatus.className}`}>{electricityPaymentStatus.label}</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-amber-700">{formatBalance(meter.electricityBalance)}</p>
                    <p className="mt-1 text-xs text-amber-700/70">
                      {formatBalanceUpdatedAt(meter.electricityBalanceUpdatedAt)}
                      {electricityPayment ? ` · 最近账单 ${formatBillAmount(electricityPayment)}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 border-amber-200 hover:bg-amber-100 hover:border-amber-300"
                      onClick={() => handleSyncBalance("electricity")}
                      disabled={syncingBalance !== null}
                    >
                      {syncingBalance === "electricity" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      同步余额
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 border-amber-200 hover:bg-amber-100 hover:border-amber-300"
                      onClick={() => openUtilityBillDialog("electricity")}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      录入账单
                    </Button>
                  </div>
                </div>
              </div>
            </div>}

            {/* 水表 - 显示余额（只读） */}
            {form.waterEnabled && <div>
              <h3 className="text-sm font-medium mb-4 pb-2 border-b border-slate-100 flex items-center gap-2" style={{ color: "#78716C" }}>
                <Droplets className="h-4 w-4 text-sky-500" />
                水费账单
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <Label>水费户号</Label>
                  <Input
                    value={form.waterNumber}
                    onChange={(e) => setForm({ ...form, waterNumber: e.target.value })}
                    placeholder="输入供水机构登记的水费户号"
                  />
                </div>
                <div className="space-y-2">
                  <Label>收费机构名称</Label>
                  <Input
                    value={form.waterProvider}
                    onChange={(e) => setForm({ ...form, waterProvider: e.target.value })}
                    placeholder="例如：松原市自来水公司"
                  />
                </div>
                <div className="space-y-2">
                  <Label>支付宝收费机构编码</Label>
                  <Input
                    value={form.waterChargeInst}
                    onChange={(e) => setForm({ ...form, waterChargeInst: e.target.value })}
                    placeholder="例如生活缴费平台分配的 charge_inst"
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
              <div className="mt-4 p-4 bg-gradient-to-r from-sky-50 to-cyan-50 rounded-xl border border-sky-100">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <ReceiptText className="h-4 w-4 text-sky-600" />
                      <span className="text-xs font-medium text-sky-700">账户余额</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${waterPaymentStatus.className}`}>{waterPaymentStatus.label}</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-sky-700">{formatBalance(meter.waterBalance)}</p>
                    <p className="mt-1 text-xs text-sky-700/70">
                      {formatBalanceUpdatedAt(meter.waterBalanceUpdatedAt)}
                      {waterPayment ? ` · 最近账单 ${formatBillAmount(waterPayment)}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 border-sky-200 hover:bg-sky-100 hover:border-sky-300"
                      onClick={() => handleSyncBalance("water")}
                      disabled={syncingBalance !== null}
                    >
                      {syncingBalance === "water" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      同步余额
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 border-sky-200 hover:bg-sky-100 hover:border-sky-300"
                      onClick={() => openUtilityBillDialog("water")}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      录入账单
                    </Button>
                  </div>
                </div>
              </div>
            </div>}

            {/* 取暖 - 状态选择 */}
            {form.heatingEnabled && <div>
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
              {/* 状态选择 */}
              <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium" style={{ color: "#1C1917" }}>缴费状态</span>
                    <p className="text-xs mt-0.5" style={{ color: "#78716C" }}>手动设置取暖费缴纳状态</p>
                  </div>
                  <Select value={form.heatingStatus} onValueChange={(v) => setForm({ ...form, heatingStatus: v as HeatingStatus })}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">全额</SelectItem>
                      <SelectItem value="base">基础</SelectItem>
                      <SelectItem value="arrears">欠费</SelectItem>
                      <SelectItem value="not_applicable">不涉及</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>}

            {/* 网络 - 状态选择 */}
            {form.networkEnabled && <div>
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
              {/* 状态选择 */}
              <div className="mt-4 p-4 bg-violet-50 rounded-xl border border-violet-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium" style={{ color: "#1C1917" }}>缴费状态</span>
                    <p className="text-xs mt-0.5" style={{ color: "#78716C" }}>手动设置网络费状态</p>
                  </div>
                  <Select value={form.networkStatus} onValueChange={(v) => setForm({ ...form, networkStatus: v as NetworkStatus })}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">正常</SelectItem>
                      <SelectItem value="arrears">欠费</SelectItem>
                      <SelectItem value="not_applicable">不涉及</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>}
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
                      <div className="text-xs px-2.5 py-1 rounded-full" style={{ background: (space.regNumbers?.filter((r: RegNumber) => r.available === false)?.length || 0) > 0 ? "#DCFCE7" : "#F5F5F4", color: (space.regNumbers?.filter((r: RegNumber) => r.available === false)?.length || 0) > 0 ? "#15803D" : "#78716C" }}>
                        {(space.regNumbers?.filter((r: RegNumber) => r.available === false)?.length || 0)}/{space.regNumbers?.length || 0} 已分配
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
                              {space.regNumbers?.map((reg: RegNumber) => {
                                // 优先显示人工编号
                                const displayCode = reg.manualCode || reg.code;
                                const displayName = reg.enterprise?.name || reg.assignedEnterpriseName;
                                
                                return (
                                  <div
                                    key={reg.id}
                                    className={`px-3 py-2.5 rounded-lg border text-center ${
                                      reg.available === false
                                        ? "bg-emerald-50 border-emerald-200"
                                        : "bg-white border-slate-200"
                                    }`}
                                  >
                                    <span className="font-mono text-sm font-medium" style={{ color: "#1C1917" }}>{displayCode}</span>
                                    {displayName && (
                                      <p className="text-xs mt-0.5 truncate" style={{ color: "#A8A29E" }}>{displayName}</p>
                                    )}
                                  </div>
                                );
                              })}
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

      <Dialog
        open={billDialogType !== null}
        onOpenChange={(open) => {
          if (!open && !savingBill) setBillDialogType(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>录入{billDialogType === "electricity" ? "电费" : "水费"}账单</DialogTitle>
            <DialogDescription>
              录入收费机构账单或历史缴费记录。同一账期再次保存会更新原记录。
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>账期</Label>
              <Input
                type="month"
                value={utilityBillForm.billingPeriod}
                onChange={(event) => setUtilityBillForm({ ...utilityBillForm, billingPeriod: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>应缴金额（元）</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={utilityBillForm.amount}
                onChange={(event) => setUtilityBillForm({ ...utilityBillForm, amount: event.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>用量（可选）</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={utilityBillForm.quantity}
                onChange={(event) => setUtilityBillForm({ ...utilityBillForm, quantity: event.target.value })}
                placeholder={billDialogType === "electricity" ? "单位：kWh" : "单位：m³"}
              />
            </div>
            <div className="space-y-2">
              <Label>单价（可选）</Label>
              <Input
                type="number"
                min="0"
                step="0.0001"
                value={utilityBillForm.unitPrice}
                onChange={(event) => setUtilityBillForm({ ...utilityBillForm, unitPrice: event.target.value })}
                placeholder="0.0000"
              />
            </div>
            <div className="space-y-2">
              <Label>账单状态</Label>
              <Select
                value={utilityBillForm.status}
                onValueChange={(value) => setUtilityBillForm({ ...utilityBillForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">待缴</SelectItem>
                  <SelectItem value="arrears">欠费</SelectItem>
                  <SelectItem value="paid">已缴</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>支付方式（可选）</Label>
              <Input
                value={utilityBillForm.paymentMethod}
                onChange={(event) => setUtilityBillForm({ ...utilityBillForm, paymentMethod: event.target.value })}
                placeholder="例如：支付宝、银行转账"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>回执号（可选）</Label>
              <Input
                value={utilityBillForm.receiptNumber}
                onChange={(event) => setUtilityBillForm({ ...utilityBillForm, receiptNumber: event.target.value })}
                placeholder="缴费回执或收费机构流水号"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBillDialogType(null)} disabled={savingBill}>
              取消
            </Button>
            <Button onClick={handleSaveUtilityBill} disabled={savingBill}>
              {savingBill && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存账单
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* 删除物业确认对话框 */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除物业</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除物业 <strong>{meter?.code}</strong> 吗？删除后不可恢复。
              {!canDeleteMeter() && (
                <span className="block mt-2 text-red-600 font-medium">
                  {getDeleteDisabledReason()}，无法删除。
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMeter}
              disabled={deleting || !canDeleteMeter()}
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
