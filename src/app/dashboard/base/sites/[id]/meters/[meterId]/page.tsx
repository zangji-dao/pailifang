"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Building2, Settings, DoorOpen, Plus, ChevronRight, Loader2, Save, Pencil, Trash2, Zap, Droplets, Flame, Wifi, ReceiptText } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { BaseFeeType, Meter, Space, Enterprise, RegNumber, MeterType, NetworkStatus, HeatingStatus, UtilityPayment } from "../../types";
import { getUtilityBillingPeriod, getUtilityCycle, getUtilityLabel, type ManagedUtilityType } from "../../utilityTasks";
import { UtilityResponsibilityFields } from "../../_components/UtilityResponsibilityFields";

type UtilityBillType = ManagedUtilityType;

interface FeeConfigForm {
  enabled: boolean;
  responsibilityType: MeterType;
  enterpriseId: string;
  accountNumber: string;
  provider: string;
  notes: string;
}

const fixedFeeCodes = new Set(["electricity", "water", "heating", "property_fee", "network"]);

const createUtilityBillForm = (
  utilityType: UtilityBillType = "electricity",
  billingPeriod = getUtilityBillingPeriod(utilityType),
) => ({
  billingPeriod,
  amount: "",
  quantity: "",
  unitPrice: "",
  status: "pending",
  dueDate: "",
  paymentMethod: "",
  receiptNumber: "",
  invoiceStatus: "pending",
  invoiceNumber: "",
});

function getLatestPayment(meter: Meter, utilityType: UtilityBillType) {
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

function getPaymentStatus(payment: UtilityPayment | null) {
  if (!payment) return { label: "暂无账单", className: "bg-slate-100 text-slate-500" };
  if (payment.status === "paid") return { label: "已缴", className: "bg-emerald-100 text-emerald-700" };
  if (payment.status === "arrears") return { label: "欠费", className: "bg-rose-100 text-rose-700" };
  return { label: "待缴", className: "bg-amber-100 text-amber-700" };
}

function getFeeIcon(utilityType: string) {
  if (utilityType === "electricity") return Zap;
  if (utilityType === "water") return Droplets;
  if (utilityType === "heating") return Flame;
  if (utilityType === "network") return Wifi;
  return ReceiptText;
}

function createFeeConfigForms(feeTypes: BaseFeeType[], meter: Meter | null) {
  return Object.fromEntries(feeTypes.map(feeType => {
    const config = meter?.feeConfigs?.find(item => item.feeTypeId === feeType.id);
    return [feeType.id, {
      enabled: config?.enabled ?? false,
      responsibilityType: config?.responsibilityType || "base",
      enterpriseId: config?.enterpriseId || "",
      accountNumber: config?.accountNumber || "",
      provider: config?.provider || "",
      notes: config?.notes || "",
    } satisfies FeeConfigForm];
  }));
}

export default function MeterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const baseId = params.id as string;
  const meterId = params.meterId as string;
  const requestedFee = searchParams.get("fee") as UtilityBillType | null;
  const requestedPeriod = searchParams.get("period");
  const returnToResources = () => router.push(`/dashboard/base/sites/${baseId}?tab=resources`);

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

  const [billDialogType, setBillDialogType] = useState<UtilityBillType | null>(null);
  const [savingBill, setSavingBill] = useState(false);
  const [utilityBillForm, setUtilityBillForm] = useState(createUtilityBillForm);
  const [feeTypes, setFeeTypes] = useState<BaseFeeType[]>([]);
  const [feeConfigForms, setFeeConfigForms] = useState<Record<string, FeeConfigForm>>({});
  const [baseContext, setBaseContext] = useState({
    managementCompanyName: "管理公司",
    propertyFeeMode: "charged" as "charged" | "free",
  });

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
    electricityType: "base" as MeterType,
    electricityEnterpriseId: "",
    // 水表
    waterEnabled: true,
    waterNumber: "",
    waterProvider: "",
    waterType: "base" as MeterType,
    waterEnterpriseId: "",
    // 取暖
    heatingEnabled: true,
    heatingNumber: "",
    heatingType: "base" as MeterType,
    heatingStatus: "full" as HeatingStatus,
    heatingEnterpriseId: "",
    propertyFeeEnabled: true,
    propertyFeeType: "base" as MeterType,
    propertyFeeEnterpriseId: "",
    // 网络
    networkEnabled: false,
    networkNumber: "",
    networkType: "base" as MeterType,
    networkStatus: "normal" as NetworkStatus,
    networkEnterpriseId: "",
  });
  const extraFeeTypes = feeTypes.filter(feeType => feeType.isActive && !fixedFeeCodes.has(feeType.code));

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
          const nextFeeTypes = (result.data.feeTypes || []) as BaseFeeType[];
          setFeeTypes(nextFeeTypes);
          setFeeConfigForms(createFeeConfigForms(nextFeeTypes, foundMeter || null));
          setEnterprises((result.data.tenantEnterprises || []).map((enterprise: Enterprise) => ({
            id: enterprise.id,
            name: enterprise.name,
          })));
          setBaseContext({
            managementCompanyName: result.data.organization?.name || result.data.managementCompanyName || "管理公司",
            propertyFeeMode: result.data.propertyFeeMode === "free" ? "free" : "charged",
          });
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
              electricityType: foundMeter.electricityType || "base",
              electricityEnterpriseId: foundMeter.electricityEnterpriseId || "",
              waterEnabled: foundMeter.waterEnabled ?? Boolean(foundMeter.waterNumber),
              waterNumber: foundMeter.waterNumber || "",
              waterProvider: foundMeter.waterProvider || "",
              waterType: foundMeter.waterType || "base",
              waterEnterpriseId: foundMeter.waterEnterpriseId || "",
              heatingEnabled: foundMeter.heatingEnabled ?? Boolean(foundMeter.heatingNumber),
              heatingNumber: foundMeter.heatingNumber || "",
              heatingType: foundMeter.heatingType || "base",
              heatingStatus: foundMeter.heatingStatus || "full",
              heatingEnterpriseId: foundMeter.heatingEnterpriseId || "",
              propertyFeeEnabled: foundMeter.propertyFeeEnabled ?? true,
              propertyFeeType: foundMeter.propertyFeeType || "base",
              propertyFeeEnterpriseId: foundMeter.propertyFeeEnterpriseId || "",
              networkEnabled: foundMeter.networkEnabled ?? Boolean(foundMeter.networkNumber),
              networkNumber: foundMeter.networkNumber || "",
              networkType: foundMeter.networkType || "base",
              networkStatus: foundMeter.networkStatus || "normal",
              networkEnterpriseId: foundMeter.networkEnterpriseId || "",
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

  // 刷新数据
  const refreshMeter = async () => {
    try {
      const res = await fetch(`/api/bases/${baseId}`);
      const result = await res.json();
      if (result.success) {
        const foundMeter = result.data.meters?.find((m: Meter) => m.id === meterId);
        const nextFeeTypes = (result.data.feeTypes || []) as BaseFeeType[];
        setFeeTypes(nextFeeTypes);
        setFeeConfigForms(createFeeConfigForms(nextFeeTypes, foundMeter || null));
        setEnterprises((result.data.tenantEnterprises || []).map((enterprise: Enterprise) => ({
          id: enterprise.id,
          name: enterprise.name,
        })));
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
    const fixedConfigByCode: Record<string, FeeConfigForm> = {
      electricity: { enabled: form.electricityEnabled, responsibilityType: form.electricityType, enterpriseId: form.electricityEnterpriseId, accountNumber: form.electricityNumber, provider: form.electricityProvider, notes: "" },
      water: { enabled: form.waterEnabled, responsibilityType: form.waterType, enterpriseId: form.waterEnterpriseId, accountNumber: form.waterNumber, provider: form.waterProvider, notes: "" },
      heating: { enabled: form.heatingEnabled, responsibilityType: form.heatingType, enterpriseId: form.heatingEnterpriseId, accountNumber: form.heatingNumber, provider: "", notes: "" },
      property_fee: { enabled: form.propertyFeeEnabled, responsibilityType: baseContext.propertyFeeMode === "free" ? "base" : form.propertyFeeType, enterpriseId: baseContext.propertyFeeMode === "free" ? "" : form.propertyFeeEnterpriseId, accountNumber: "", provider: "", notes: "" },
      network: { enabled: form.networkEnabled, responsibilityType: form.networkType, enterpriseId: form.networkEnterpriseId, accountNumber: form.networkNumber, provider: "", notes: "" },
    };
    const submittedFeeConfigs = feeTypes.map(feeType => ({
      feeTypeId: feeType.id,
      ...(fixedConfigByCode[feeType.code] || feeConfigForms[feeType.id] || {
        enabled: false,
        responsibilityType: "base" as MeterType,
        enterpriseId: "",
        accountNumber: "",
        provider: "",
        notes: "",
      }),
    }));
    if (!submittedFeeConfigs.some(config => config.enabled)) {
      toast.error("请至少选择一项物业费用");
      return;
    }
    const missingResponsibility = submittedFeeConfigs.find(config => (
      config.enabled && config.responsibilityType === "customer" && !config.enterpriseId
    ));
    if (missingResponsibility) {
      toast.error(`请选择承担${feeTypes.find(feeType => feeType.id === missingResponsibility.feeTypeId)?.name || "该费用"}的入驻企业`);
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
          electricityType: form.electricityType,
          electricityEnterpriseId: form.electricityEnterpriseId || null,
          waterEnabled: form.waterEnabled,
          waterNumber: form.waterNumber || null,
          waterProvider: form.waterProvider || null,
          waterType: form.waterType,
          waterEnterpriseId: form.waterEnterpriseId || null,
          heatingEnabled: form.heatingEnabled,
          heatingNumber: form.heatingNumber || null,
          heatingType: form.heatingType,
          heatingStatus: form.heatingStatus,
          heatingEnterpriseId: form.heatingEnterpriseId || null,
          propertyFeeEnabled: form.propertyFeeEnabled,
          propertyFeeType: baseContext.propertyFeeMode === "free" ? "base" : form.propertyFeeType,
          propertyFeeEnterpriseId: baseContext.propertyFeeMode === "free" ? null : form.propertyFeeEnterpriseId || null,
          networkEnabled: form.networkEnabled,
          networkNumber: form.networkNumber || null,
          networkType: form.networkType,
          networkStatus: form.networkStatus,
          networkEnterpriseId: form.networkEnterpriseId || null,
          feeConfigs: submittedFeeConfigs,
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

  const openUtilityBillDialog = (utilityType: UtilityBillType, billingPeriod?: string | null) => {
    setUtilityBillForm(createUtilityBillForm(utilityType, billingPeriod || getUtilityBillingPeriod(utilityType, new Date(), feeTypes)));
    setBillDialogType(utilityType);
  };

  useEffect(() => {
    if (!meter || !requestedFee || !feeTypes.some(feeType => feeType.code === requestedFee)) return;
    setUtilityBillForm(createUtilityBillForm(
      requestedFee,
      requestedPeriod || getUtilityBillingPeriod(requestedFee, new Date(), feeTypes),
    ));
    setBillDialogType(requestedFee);
  }, [feeTypes, meter, requestedFee, requestedPeriod]);

  const handleSaveUtilityBill = async () => {
    if (!billDialogType) return;
    const monthlyUtility = getUtilityCycle(billDialogType, feeTypes) === "monthly";
    const validBillingPeriod = monthlyUtility
      ? /^\d{4}-\d{2}$/.test(utilityBillForm.billingPeriod)
      : /^\d{4}(?:-\d{4})?$/.test(utilityBillForm.billingPeriod);
    if (!validBillingPeriod) {
      toast.error(monthlyUtility ? "请选择正确的月份" : "请输入正确的年度或供暖周期");
      return;
    }
    if (utilityBillForm.amount === "" || Number(utilityBillForm.amount) < 0) {
      toast.error("请输入正确的账单金额");
      return;
    }

    setSavingBill(true);
    try {
      const isElectricity = billDialogType === "electricity";
      const isWater = billDialogType === "water";
      const dynamicFeeType = feeTypes.find(feeType => feeType.code === billDialogType);
      const dynamicConfig = dynamicFeeType ? feeConfigForms[dynamicFeeType.id] : null;
      const provider = isElectricity ? form.electricityProvider : isWater ? form.waterProvider : dynamicConfig?.provider || "";
      const accountNumber = isElectricity
        ? form.electricityNumber
        : isWater
          ? form.waterNumber
          : billDialogType === "network"
            ? form.networkNumber
            : billDialogType === "heating"
              ? form.heatingNumber
              : dynamicConfig?.accountNumber || "";
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
          dueDate: utilityBillForm.dueDate,
          paymentMethod: utilityBillForm.paymentMethod,
          receiptNumber: utilityBillForm.receiptNumber,
          invoiceStatus: utilityBillForm.invoiceStatus,
          invoiceNumber: utilityBillForm.invoiceNumber,
          provider,
          accountNumber,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        toast.error(result.error || "保存账单失败");
        return;
      }

      toast.success(`${getUtilityLabel(billDialogType, feeTypes)}${getUtilityCycle(billDialogType, feeTypes) === "monthly" ? "消费记录" : "费用记录"}已保存`);
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

  const billIsMonthly = billDialogType ? getUtilityCycle(billDialogType, feeTypes) === "monthly" : true;
  const billSupportsUsage = billDialogType === "electricity" || billDialogType === "water";
  const enabledFeeConfigs = meter.feeConfigs.filter(config => config.enabled);
  const totalWorkstations = meter.spaces.reduce((total, space) => total + (space.regNumbers?.length || 0), 0);
  const allocatedWorkstations = meter.spaces.reduce(
    (total, space) => total + (space.regNumbers?.filter(regNumber => regNumber.available === false).length || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 border-b border-slate-200 pb-5">
          <button
            onClick={returnToResources}
            className="mb-4 inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-white hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            返回空间资源
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white sm:h-12 sm:w-12">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">物业资源详情 · {meter.code}</p>
                <h1 className="mt-1 break-words text-xl font-semibold text-slate-950 sm:text-2xl">
                  {meter.name || meter.code}
                </h1>
              </div>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(true)} 
                disabled={!canDeleteMeter()}
                className="h-10 flex-1 border-red-200 px-4 text-red-600 hover:border-red-300 hover:bg-red-50 disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent sm:flex-none"
                title={!canDeleteMeter() ? getDeleteDisabledReason() : "删除物业"}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </Button>
              <Button onClick={handleSave} disabled={saving} className="h-10 flex-1 px-6 sm:flex-none">
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

        <div className="mb-6 grid grid-cols-2 overflow-hidden rounded-lg border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-slate-100">
          {[
            ["建筑面积", `${Number(meter.area || 0).toLocaleString("zh-CN")} ㎡`],
            ["物理空间", `${meter.spaces.length} 个`],
            ["工位资源", `${allocatedWorkstations}/${totalWorkstations}`],
            ["适用费用", `${enabledFeeConfigs.length} 类`],
          ].map(([label, value], index) => (
            <div key={label} className={`px-4 py-3.5 ${index < 2 ? "border-b border-slate-100 sm:border-b-0" : ""}`}>
              <p className="text-xs text-slate-400">{label}</p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue={requestedFee ? "billing" : "resources"} className="space-y-5">
          <div className="overflow-x-auto pb-1">
            <TabsList className="h-10 min-w-max rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
              <TabsTrigger value="resources" className="rounded-md px-3 data-[state=active]:bg-slate-950 data-[state=active]:text-white">空间与工位</TabsTrigger>
              <TabsTrigger value="fees" className="rounded-md px-3 data-[state=active]:bg-slate-950 data-[state=active]:text-white">费用配置</TabsTrigger>
              <TabsTrigger value="billing" className="rounded-md px-3 data-[state=active]:bg-slate-950 data-[state=active]:text-white">费用录入</TabsTrigger>
              <TabsTrigger value="profile" className="rounded-md px-3 data-[state=active]:bg-slate-950 data-[state=active]:text-white">物业资料</TabsTrigger>
            </TabsList>
          </div>

        <TabsContent value="profile" className="mt-0">
        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-base font-semibold mb-5" style={{ color: "#1C1917" }}>基本信息</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
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
        </TabsContent>

        <TabsContent value="fees" className="mt-0">
        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-base font-semibold mb-5 flex items-center gap-2" style={{ color: "#1C1917" }}>
            <Settings className="h-5 w-5" style={{ color: "#A8A29E" }} />
            费用账户与责任
          </h2>

          <div className="mb-8">
            <div className="mb-3">
              <p className="text-sm font-semibold text-slate-800">适用费用</p>
              <p className="mt-1 text-xs text-slate-400">只有启用的费用会进入物业缴费看板，并可分别指定费用承担方。</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[
                { field: "electricityEnabled" as const, label: "电费", icon: Zap, className: "text-amber-600" },
                { field: "waterEnabled" as const, label: "水费", icon: Droplets, className: "text-sky-600" },
                { field: "heatingEnabled" as const, label: "取暖费", icon: Flame, className: "text-orange-600" },
                { field: "propertyFeeEnabled" as const, label: "物业费", icon: ReceiptText, className: "text-emerald-600" },
                { field: "networkEnabled" as const, label: "宽带费", icon: Wifi, className: "text-violet-600" },
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
              {extraFeeTypes.map(feeType => {
                const config = feeConfigForms[feeType.id];
                return (
                  <label key={feeType.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm font-medium transition ${config?.enabled ? "border-cyan-300 bg-cyan-50" : "border-slate-200 bg-white"}`}>
                    <Checkbox
                      checked={config?.enabled || false}
                      onCheckedChange={checked => setFeeConfigForms(current => ({
                        ...current,
                        [feeType.id]: {
                          ...(current[feeType.id] || { responsibilityType: "base", enterpriseId: "", accountNumber: "", provider: "", notes: "" }),
                          enabled: checked === true,
                        },
                      }))}
                    />
                    <ReceiptText className="h-4 w-4 text-slate-500" />
                    <span className="min-w-0 truncate">{feeType.name}</span>
                  </label>
                );
              })}
            </div>
            {form.propertyFeeEnabled && (
              <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-700">
                物业费按基地政策管理；Π立方企业服务中心当前为年度免收。
              </p>
            )}
          </div>

          <div className="space-y-8">
            {/* 电表 */}
            {form.electricityEnabled && <div>
              <h3 className="text-sm font-medium mb-4 pb-2 border-b border-slate-100 flex items-center gap-2" style={{ color: "#78716C" }}>
                <Zap className="h-4 w-4 text-amber-500" />
                电费账户
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
              </div>
              <UtilityResponsibilityFields
                responsibilityType={form.electricityType}
                enterpriseId={form.electricityEnterpriseId}
                enterprises={enterprises}
                managementCompanyName={baseContext.managementCompanyName}
                onResponsibilityTypeChange={electricityType => setForm(current => ({ ...current, electricityType }))}
                onEnterpriseChange={electricityEnterpriseId => setForm(current => ({ ...current, electricityEnterpriseId }))}
              />
            </div>}

            {/* 水表 */}
            {form.waterEnabled && <div>
              <h3 className="text-sm font-medium mb-4 pb-2 border-b border-slate-100 flex items-center gap-2" style={{ color: "#78716C" }}>
                <Droplets className="h-4 w-4 text-sky-500" />
                水费账户
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
              </div>
              <UtilityResponsibilityFields
                responsibilityType={form.waterType}
                enterpriseId={form.waterEnterpriseId}
                enterprises={enterprises}
                managementCompanyName={baseContext.managementCompanyName}
                onResponsibilityTypeChange={waterType => setForm(current => ({ ...current, waterType }))}
                onEnterpriseChange={waterEnterpriseId => setForm(current => ({ ...current, waterEnterpriseId }))}
              />
            </div>}

            {/* 取暖 - 状态选择 */}
            {form.heatingEnabled && <div>
              <h3 className="text-sm font-medium mb-4 pb-2 border-b border-slate-100 flex items-center gap-2" style={{ color: "#78716C" }}>
                <Flame className="h-4 w-4 text-orange-500" />
                取暖号
              </h3>
              <div className="grid grid-cols-1 gap-4 md:max-w-md">
                <div className="space-y-2">
                  <Label>取暖号</Label>
                  <Input
                    value={form.heatingNumber}
                    onChange={(e) => setForm({ ...form, heatingNumber: e.target.value })}
                    placeholder="输入取暖号"
                  />
                </div>
              </div>
              <UtilityResponsibilityFields
                responsibilityType={form.heatingType}
                enterpriseId={form.heatingEnterpriseId}
                enterprises={enterprises}
                managementCompanyName={baseContext.managementCompanyName}
                onResponsibilityTypeChange={heatingType => setForm(current => ({ ...current, heatingType }))}
                onEnterpriseChange={heatingEnterpriseId => setForm(current => ({ ...current, heatingEnterpriseId }))}
              />
              <div className="mt-4 rounded-lg border border-orange-100 bg-orange-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-sm font-medium text-slate-800">供暖状态</span>
                    <p className="mt-0.5 text-xs text-slate-500">费用记录在“费用录入”中统一维护。</p>
                  </div>
                  <div>
                    <Select value={form.heatingStatus} onValueChange={(v) => setForm({ ...form, heatingStatus: v as HeatingStatus })}>
                      <SelectTrigger className="w-32 bg-white">
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
              </div>
            </div>}

            {form.propertyFeeEnabled && <div>
              <h3 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-2 text-sm font-medium" style={{ color: "#78716C" }}>
                <ReceiptText className="h-4 w-4 text-emerald-600" />
                物业费
              </h3>
              {baseContext.propertyFeeMode === "free" ? (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                  当前基地免收物业费，无需指定费用承担方。
                </div>
              ) : (
                <>
                  <UtilityResponsibilityFields
                    responsibilityType={form.propertyFeeType}
                    enterpriseId={form.propertyFeeEnterpriseId}
                    enterprises={enterprises}
                    managementCompanyName={baseContext.managementCompanyName}
                    onResponsibilityTypeChange={propertyFeeType => setForm(current => ({ ...current, propertyFeeType }))}
                    onEnterpriseChange={propertyFeeEnterpriseId => setForm(current => ({ ...current, propertyFeeEnterpriseId }))}
                  />
                </>
              )}
            </div>}

            {/* 网络 - 状态选择 */}
            {form.networkEnabled && <div>
              <h3 className="text-sm font-medium mb-4 pb-2 border-b border-slate-100 flex items-center gap-2" style={{ color: "#78716C" }}>
                <Wifi className="h-4 w-4 text-violet-500" />
                宽带费
              </h3>
              <div className="grid grid-cols-1 gap-4 md:max-w-md">
                <div className="space-y-2">
                  <Label>宽带账号</Label>
                  <Input
                    value={form.networkNumber}
                    onChange={(e) => setForm({ ...form, networkNumber: e.target.value })}
                    placeholder="输入宽带账号"
                  />
                </div>
              </div>
              <UtilityResponsibilityFields
                responsibilityType={form.networkType}
                enterpriseId={form.networkEnterpriseId}
                enterprises={enterprises}
                managementCompanyName={baseContext.managementCompanyName}
                onResponsibilityTypeChange={networkType => setForm(current => ({ ...current, networkType }))}
                onEnterpriseChange={networkEnterpriseId => setForm(current => ({ ...current, networkEnterpriseId }))}
              />
              <div className="mt-4 rounded-lg border border-violet-100 bg-violet-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-sm font-medium text-slate-800">宽带状态</span>
                    <p className="mt-0.5 text-xs text-slate-500">费用记录在“费用录入”中统一维护。</p>
                  </div>
                  <div>
                    <Select value={form.networkStatus} onValueChange={(v) => setForm({ ...form, networkStatus: v as NetworkStatus })}>
                      <SelectTrigger className="w-32 bg-white">
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
              </div>
            </div>}

            {extraFeeTypes.map(feeType => {
              const config = feeConfigForms[feeType.id];
              if (!config?.enabled) return null;
              return (
                <div key={feeType.id}>
                  <h3 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-2 text-sm font-medium text-slate-600">
                    <ReceiptText className="h-4 w-4 text-slate-500" />
                    {feeType.name}
                    <span className="ml-auto text-xs font-normal text-slate-400">{feeType.billingCycle === "monthly" ? "按月" : "按年"}</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>费用账户/合同号</Label>
                      <Input
                        value={config.accountNumber}
                        onChange={event => setFeeConfigForms(current => ({
                          ...current,
                          [feeType.id]: { ...current[feeType.id], accountNumber: event.target.value },
                        }))}
                        placeholder="选填"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>收费方</Label>
                      <Input
                        value={config.provider}
                        onChange={event => setFeeConfigForms(current => ({
                          ...current,
                          [feeType.id]: { ...current[feeType.id], provider: event.target.value },
                        }))}
                        placeholder="选填"
                      />
                    </div>
                  </div>
                  <UtilityResponsibilityFields
                    responsibilityType={config.responsibilityType}
                    enterpriseId={config.enterpriseId}
                    enterprises={enterprises}
                    managementCompanyName={baseContext.managementCompanyName}
                    onResponsibilityTypeChange={responsibilityType => setFeeConfigForms(current => ({
                      ...current,
                      [feeType.id]: { ...current[feeType.id], responsibilityType },
                    }))}
                    onEnterpriseChange={enterpriseId => setFeeConfigForms(current => ({
                      ...current,
                      [feeType.id]: { ...current[feeType.id], enterpriseId },
                    }))}
                  />
                </div>
              );
            })}
          </div>
        </div>
        </TabsContent>

        <TabsContent value="billing" className="mt-0">
          <section>
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">费用录入</h2>
                <p className="mt-1 text-sm text-slate-500">按费用类型登记当前物业的月度消费或年度费用。</p>
              </div>
              <span className="text-sm text-slate-400">{enabledFeeConfigs.length} 类适用费用</span>
            </div>

            {enabledFeeConfigs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-400">
                请先在“费用配置”中启用适用费用。
              </div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {enabledFeeConfigs.map(config => {
                  const feeType = config.feeType;
                  const latestPayment = getLatestPayment(meter, feeType.code);
                  const paymentStatus = getPaymentStatus(latestPayment);
                  const FeeIcon = getFeeIcon(feeType.code);
                  const cycleLabel = feeType.billingCycle === "monthly" ? "月度" : "年度";
                  return (
                    <article key={config.id} className="flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                            <FeeIcon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900">{feeType.name}</h3>
                            <p className="mt-0.5 text-xs text-slate-400">{cycleLabel}记录 · {config.accountNumber || "未登记账户"}</p>
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${paymentStatus.className}`}>
                          {paymentStatus.label}
                        </span>
                      </div>
                      <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
                        <div className="min-w-0">
                          <p className="text-xs text-slate-400">最近记录</p>
                          <p className="mt-1 truncate text-sm font-medium tabular-nums text-slate-700">
                            {latestPayment ? `${latestPayment.billingPeriod} · ${formatBillAmount(latestPayment)}` : "暂无记录"}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => openUtilityBillDialog(feeType.code as UtilityBillType)}>
                          <Plus className="mr-1.5 h-3.5 w-3.5" />录入
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="resources" className="mt-0">
        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <DoorOpen className="h-5 w-5 text-slate-500" />
                物理空间与工位
              </h2>
              <p className="mt-1 text-xs text-slate-400">按房间规划空间，并在空间内维护工位资源。</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAddSpace(true)}>
              <Plus className="h-4 w-4 mr-1" />
              新增空间
            </Button>
          </div>

          {/* 新增空间表单 */}
          {showAddSpace && (
            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
                <div key={space.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <button
                    type="button"
                    className="flex w-full flex-col gap-3 p-4 text-left transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                    onClick={() => setExpandedSpace(expandedSpace === space.id ? null : space.id)}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                        <DoorOpen className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-slate-900">{space.name}</p>
                        <p className="mt-1 text-xs text-slate-400">空间编号 {space.code}{space.area ? ` · ${space.area} ㎡` : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className={`rounded-full px-2.5 py-1 text-xs font-medium ${(space.regNumbers?.filter((r: RegNumber) => r.available === false).length || 0) > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {(space.regNumbers?.filter((r: RegNumber) => r.available === false)?.length || 0)}/{space.regNumbers?.length || 0} 已分配
                      </div>
                      <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${expandedSpace === space.id ? "rotate-90" : ""}`} />
                    </div>
                  </button>

                  {/* 展开内容 */}
                  {expandedSpace === space.id && (
                    <div className="border-t border-slate-100 bg-slate-50/60 px-4 pb-4">
                      {/* 空间编辑表单 */}
                      {editingSpace === space.id ? (
                        <div className="bg-white rounded-lg p-4 mt-3 border border-slate-200">
                          <h4 className="text-sm font-medium mb-3" style={{ color: "#1C1917" }}>编辑空间信息</h4>
                          <div className="grid gap-4 sm:grid-cols-2">
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
                          <div className="mb-3 mt-3 flex items-center gap-2">
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
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">工位号</span>
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
                            <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                                <div className="flex-1">
                                  <label className="mb-1 block text-xs font-medium text-slate-500">工位号 *</label>
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
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                              {space.regNumbers?.map((reg: RegNumber) => {
                                // 优先显示人工编号
                                const displayCode = reg.manualCode || reg.code;
                                const displayName = reg.enterprise?.name || reg.assignedEnterpriseName;
                                
                                return (
                                  <div
                                    key={reg.id}
                                    className={`rounded-md border px-3 py-2.5 text-center ${
                                      reg.available === false
                                        ? "bg-emerald-50 border-emerald-200"
                                        : "bg-white border-slate-200"
                                    }`}
                                  >
                                    <span className="font-mono text-sm font-medium text-slate-900">{displayCode}</span>
                                    {displayName && (
                                      <p className="mt-0.5 truncate text-xs text-slate-400">{displayName}</p>
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
        </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={billDialogType !== null}
        onOpenChange={(open) => {
          if (!open && !savingBill) setBillDialogType(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>录入{billDialogType ? getUtilityLabel(billDialogType, feeTypes) : "费用"}{billIsMonthly ? "消费" : "记录"}</DialogTitle>
            <DialogDescription>
              {billIsMonthly
                ? "登记当月消费金额与用量。同一月份再次保存会更新原记录。"
                : "登记本期费用、缴费状态和发票进度。同一周期再次保存会更新原记录。"}
              该记录由管理公司统一维护。
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{billIsMonthly ? "账期" : "年度/周期"}</Label>
              <Input
                type={billIsMonthly ? "month" : "text"}
                value={utilityBillForm.billingPeriod}
                onChange={(event) => setUtilityBillForm({ ...utilityBillForm, billingPeriod: event.target.value })}
                placeholder={billDialogType === "heating" ? "例如：2025-2026" : "例如：2026"}
              />
            </div>
            <div className="space-y-2">
              <Label>{billIsMonthly ? "消费金额（元）" : "应缴金额（元）"}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={utilityBillForm.amount}
                onChange={(event) => setUtilityBillForm({ ...utilityBillForm, amount: event.target.value })}
                placeholder="0.00"
              />
            </div>
            {billSupportsUsage && <div className="space-y-2">
              <Label>用量（可选）</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={utilityBillForm.quantity}
                onChange={(event) => setUtilityBillForm({ ...utilityBillForm, quantity: event.target.value })}
                placeholder={billDialogType === "electricity" ? "单位：kWh" : "单位：m³"}
              />
            </div>}
            {billSupportsUsage && <div className="space-y-2">
              <Label>单价（可选）</Label>
              <Input
                type="number"
                min="0"
                step="0.0001"
                value={utilityBillForm.unitPrice}
                onChange={(event) => setUtilityBillForm({ ...utilityBillForm, unitPrice: event.target.value })}
                placeholder="0.0000"
              />
            </div>}
            {!billIsMonthly && <>
              <div className="space-y-2">
                <Label>缴费截止日（可选）</Label>
                <Input
                  type="date"
                  value={utilityBillForm.dueDate}
                  onChange={(event) => setUtilityBillForm({ ...utilityBillForm, dueDate: event.target.value })}
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
                <Label>缴费回执号（可选）</Label>
                <Input
                  value={utilityBillForm.receiptNumber}
                  onChange={(event) => setUtilityBillForm({ ...utilityBillForm, receiptNumber: event.target.value })}
                  placeholder="缴费回执或收费机构流水号"
                />
              </div>
              <div className="space-y-2">
                <Label>发票状态</Label>
                <Select
                  value={utilityBillForm.invoiceStatus}
                  onValueChange={(value) => setUtilityBillForm({ ...utilityBillForm, invoiceStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">待开票</SelectItem>
                    <SelectItem value="issued">已开票</SelectItem>
                    <SelectItem value="not_required">无需开票</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>发票号码（可选）</Label>
                <Input
                  value={utilityBillForm.invoiceNumber}
                  onChange={(event) => setUtilityBillForm({ ...utilityBillForm, invoiceNumber: event.target.value })}
                  placeholder="登记发票号码"
                />
              </div>
            </>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBillDialogType(null)} disabled={savingBill}>
              取消
            </Button>
            <Button onClick={handleSaveUtilityBill} disabled={savingBill}>
              {savingBill && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {billIsMonthly ? "保存消费记录" : "保存费用记录"}
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
