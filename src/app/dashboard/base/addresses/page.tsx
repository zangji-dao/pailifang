"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Hash,
  Plus,
  Loader2,
  RefreshCw,
  Building2,
  Home,
  DoorOpen,
  Pencil,
  Download,
  Printer,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// 类型定义
interface Space {
  id: string;
  code: string;
  name: string;
  area: number | null;
  status: string;
  isOccupied: boolean;
  regNumbers: RegNumber[];
}

interface Meter {
  id: string;
  code: string;
  name: string;
  area: number | null;
  status: string;
  spaces: Space[];
}

interface Base {
  id: string;
  name: string;
  address: string | null;
  status: string;
  meters: Meter[];
}

// 工位号类型
interface RegNumber {
  id: string;
  code: string;
  manual_code: string | null;
  property_owner: string | null;
  management_company: string | null;
  assigned_enterprise_name: string | null;
  available: boolean;
  enterprise_id: string | null;
  created_at: string;
  space: {
    id: string;
    code: string;
    name: string;
    meter: {
      id: string;
      code: string;
      name: string;
      base: {
        id: string;
        name: string;
        address: string | null;
      };
    };
  };
}

// 入驻申请企业类型
interface FillingApplication {
  id: string;
  enterprise_name: string;
  application_no: string;
  legal_person_name: string | null;
  contact_person_phone: string | null;
}

// 状态配置
const statusConfig = {
  all: {
    label: "全部",
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-300",
    dotColor: "bg-slate-500",
  },
  available: {
    label: "待使用",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    dotColor: "bg-amber-500",
  },
  used: {
    label: "已使用",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
    dotColor: "bg-emerald-500",
  },
};

export default function AddressManagementPage() {
  const [cascadeData, setCascadeData] = useState<Base[]>([]);
  const [regNumbers, setRegNumbers] = useState<RegNumber[]>([]);
  const [fillingApplications, setFillingApplications] = useState<FillingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // 下载/打印状态
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);

  // 三级联动选择状态
  const [selectedBaseId, setSelectedBaseId] = useState<string>("");
  const [selectedMeterId, setSelectedMeterId] = useState<string>("");
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>("");
  const [assignedEnterpriseName, setAssignedEnterpriseName] = useState<string>("");

  // 行内编辑人工编号状态
  const [editingManualCodeId, setEditingManualCodeId] = useState<string | null>(null);
  const [editingManualCodeValue, setEditingManualCodeValue] = useState<string>("");
  const [savingManualCode, setSavingManualCode] = useState(false);

  // 行内编辑预分配企业状态
  const [editingEnterpriseId, setEditingEnterpriseId] = useState<string | null>(null);
  const [editingEnterpriseValue, setEditingEnterpriseValue] = useState<string>("");
  const [savingEnterprise, setSavingEnterprise] = useState(false);

  // 编辑弹窗状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRegNumber, setEditingRegNumber] = useState<RegNumber | null>(null);
  const [editForm, setEditForm] = useState({
    manual_code: "",
    property_owner: "",
    management_company: "",
    assigned_enterprise_name: "",
  });
  const [saving, setSaving] = useState(false);

  // 获取级联数据
  const fetchCascadeData = async () => {
    try {
      const res = await fetch("/api/bases/cascade");
      const result = await res.json();
      if (result.success) {
        setCascadeData(result.data || []);
      }
    } catch (error) {
      console.error("获取级联数据失败:", error);
      toast.error("获取数据失败");
    }
  };

  // 获取工位号列表
  const fetchRegNumbers = async () => {
    try {
      const res = await fetch("/api/registration-numbers");
      const result = await res.json();
      if (result.success) {
        setRegNumbers(result.data || []);
      }
    } catch (error) {
      console.error("获取工位号失败:", error);
    }
  };

  // 获取填报中的入驻申请企业
  const fetchFillingApplications = async () => {
    try {
      setLoadingApplications(true);
      const res = await fetch("/api/settlement/applications");
      const result = await res.json();
      if (result.success || result.data) {
        // 过滤出填报中状态的企业
        const fillingApps = (result.data || []).filter(
          (app: any) => app.approvalStatus === "filling"
        );
        setFillingApplications(fillingApps);
      }
    } catch (error) {
      console.error("获取入驻申请失败:", error);
    } finally {
      setLoadingApplications(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchCascadeData(), fetchRegNumbers(), fetchFillingApplications()]);
      setLoading(false);
    };
    init();
  }, []);

  // 基地变化时，重置物业和空间
  const handleBaseChange = (baseId: string) => {
    setSelectedBaseId(baseId);
    setSelectedMeterId("");
    setSelectedSpaceId("");
  };

  // 物业变化时，重置空间
  const handleMeterChange = (meterId: string) => {
    setSelectedMeterId(meterId);
    setSelectedSpaceId("");
  };

  // 获取当前选中的基地
  const selectedBase = cascadeData.find((b) => b.id === selectedBaseId);
  const selectedMeter = selectedBase?.meters.find((m) => m.id === selectedMeterId);
  const selectedSpace = selectedMeter?.spaces.find((s) => s.id === selectedSpaceId);

  // 生成工位号
  const generateRegNumber = async () => {
    if (!selectedSpaceId) {
      toast.error("请选择物理空间");
      return;
    }

    if (!assignedEnterpriseName.trim()) {
      toast.error("请输入预分配企业名称");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/registration-numbers/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          space_id: selectedSpaceId,
          assigned_enterprise_name: assignedEnterpriseName || null
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("工位号生成成功");
        setSelectedSpaceId("");
        setAssignedEnterpriseName("");
        await Promise.all([fetchCascadeData(), fetchRegNumbers()]);
      } else {
        toast.error(result.error || "生成失败");
      }
    } catch (error) {
      console.error("生成工位号失败:", error);
      toast.error("生成失败");
    } finally {
      setGenerating(false);
    }
  };

  // 打开编辑弹窗
  const openEditDialog = (reg: RegNumber) => {
    setEditingRegNumber(reg);
    setEditForm({
      manual_code: reg.manual_code || "",
      property_owner: reg.property_owner || "",
      management_company: reg.management_company || "",
      assigned_enterprise_name: reg.assigned_enterprise_name || "",
    });
    setEditDialogOpen(true);
  };

  // 保存编辑
  const saveEdit = async () => {
    if (!editingRegNumber) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/registration-numbers/${editingRegNumber.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("保存成功");
        setEditDialogOpen(false);
        await fetchRegNumbers();
      } else {
        toast.error(result.error || "保存失败");
      }
    } catch (error) {
      console.error("保存失败:", error);
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  // 开始编辑人工编号
  const startEditManualCode = (reg: RegNumber) => {
    setEditingManualCodeId(reg.id);
    setEditingManualCodeValue(reg.manual_code || "");
  };

  // 保存人工编号
  const saveManualCode = async (regId: string) => {
    setSavingManualCode(true);
    try {
      const res = await fetch(`/api/registration-numbers/${regId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manual_code: editingManualCodeValue || null }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("保存成功");
        setEditingManualCodeId(null);
        await fetchRegNumbers();
      } else {
        toast.error(result.error || "保存失败");
      }
    } catch (error) {
      console.error("保存失败:", error);
      toast.error("保存失败");
    } finally {
      setSavingManualCode(false);
    }
  };

  // 取消编辑人工编号
  const cancelEditManualCode = () => {
    setEditingManualCodeId(null);
    setEditingManualCodeValue("");
  };

  // 开始编辑预分配企业
  const startEditEnterprise = (reg: RegNumber) => {
    setEditingEnterpriseId(reg.id);
    setEditingEnterpriseValue(reg.assigned_enterprise_name || "");
  };

  // 保存预分配企业
  const saveEnterprise = async (regId: string) => {
    setSavingEnterprise(true);
    try {
      const res = await fetch(`/api/registration-numbers/${regId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_enterprise_name: editingEnterpriseValue || null }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("保存成功");
        setEditingEnterpriseId(null);
        await fetchRegNumbers();
      } else {
        toast.error(result.error || "保存失败");
      }
    } catch (error) {
      console.error("保存失败:", error);
      toast.error("保存失败");
    } finally {
      setSavingEnterprise(false);
    }
  };

  // 取消编辑预分配企业
  const cancelEditEnterprise = () => {
    setEditingEnterpriseId(null);
    setEditingEnterpriseValue("");
  };

  // 获取显示的工位号（优先人工编号）
  const getDisplayCode = (reg: RegNumber) => reg.manual_code || reg.code;

  // 获取地址显示名称
  // 格式：松原市宁江区建华路义乌城小区1号楼XXX号（XXX是工位号）
  const getAddressName = (reg: RegNumber) => {
    const space = reg.space;
    const meter = space?.meter;
    const base = meter?.base;
    
    // 从基地地址提取完整信息
    const baseAddress = base?.address || ''; // 如：吉林省松原市宁江区建华路义乌城
    
    // 去掉省份前缀
    const addressWithoutProvince = baseAddress.replace(/^.+省/, '');
    
    // 显示编号（优先人工编号）
    const displayCode = reg.manual_code || reg.code;
    
    // 物业名如"1号楼106室"，提取"1号楼"
    const meterName = meter?.name || meter?.code || '';
    const buildingMatch = meterName.match(/(\d+号楼)/);
    const buildingPart = buildingMatch ? buildingMatch[1] : meterName;
    
    // 格式：松原市宁江区建华路义乌城小区1号楼XXX号
    return `${addressWithoutProvince}小区${buildingPart}${displayCode}号`;
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, "0")}月${String(date.getDate()).padStart(2, "0")}日`;
  };

  // 过滤列表
  const filteredRegNumbers = regNumbers.filter((r) => {
    if (statusFilter === "all" || !statusFilter) return true;
    if (statusFilter === "available") return r.available;
    if (statusFilter === "used") return !r.available;
    return true;
  });

  // 分类统计
  const stats = {
    all: regNumbers.length,
    available: regNumbers.filter((r) => r.available).length,
    used: regNumbers.filter((r) => !r.available).length,
  };

  // 下载授权函（导出为PDF）
  const handleDownload = async (reg: RegNumber) => {
    setDownloadingId(reg.id);
    try {
      // 1. 获取授权函HTML
      const res = await fetch(`/api/registration-numbers/${reg.id}/authorization-letter`);
      const result = await res.json();
      
      if (!result.success || !result.data?.html) {
        toast.error(result.error || "生成授权函失败");
        return;
      }

      // 2. 创建隐藏的iframe来隔离渲染
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.left = "-9999px";
      iframe.style.top = "0";
      iframe.style.width = "800px";
      iframe.style.height = "600px";
      iframe.style.border = "none";
      iframe.style.zIndex = "-9999";
      document.body.appendChild(iframe);

      // 3. 写入HTML内容
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error("无法创建iframe文档");
      }
      iframeDoc.open();
      iframeDoc.write(result.data.html);
      iframeDoc.close();

      // 4. 等待内容加载完成
      await new Promise(resolve => setTimeout(resolve, 100));

      // 5. 使用 html2canvas 生成图片
      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      // 6. 移除iframe
      document.body.removeChild(iframe);

      // 7. 生成 PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // 8. 下载 PDF
      const displayCode = reg.manual_code || reg.code;
      const enterpriseName = reg.assigned_enterprise_name || displayCode;
      pdf.save(`房屋产权证明_${enterpriseName}.pdf`);
      
      toast.success("PDF 已下载");
    } catch (error) {
      console.error("下载失败:", error);
      toast.error("下载失败");
    } finally {
      setDownloadingId(null);
    }
  };

  // 打印授权函
  const handlePrint = async (reg: RegNumber) => {
    setPrintingId(reg.id);
    try {
      const res = await fetch(`/api/registration-numbers/${reg.id}/authorization-letter`);
      const result = await res.json();
      if (result.success && result.data?.url) {
        const printWindow = window.open(result.data.url, "_blank");
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      } else {
        toast.error(result.error || "生成授权函失败");
      }
    } catch (error) {
      console.error("打印失败:", error);
      toast.error("打印失败");
    } finally {
      setPrintingId(null);
    }
  };

  // 加载状态
  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* 页面标题 */}
      <div className="py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">地址管理</h1>
          <p className="text-sm text-slate-500 mt-1">管理注册地址和工位号</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchCascadeData();
            fetchRegNumbers();
          }}
        >
          <RefreshCw className="h-4 w-4 mr-1.5" />
          刷新
        </Button>
      </div>

      {/* 分割线 */}
      <div className="border-b" />

      {/* 状态卡片 */}
      <div className="py-4">
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(statusConfig).map(([key, config]) => {
            const count = stats[key as keyof typeof stats];
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(statusFilter === key ? null : key)}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3 py-2.5 transition-all",
                  statusFilter === key
                    ? `${config.borderColor} ${config.bgColor}`
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                )}
              >
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">{config.label}</div>
                  <div
                    className={cn(
                      "text-xl font-semibold",
                      statusFilter === key ? config.color : "text-foreground"
                    )}
                  >
                    {count}
                  </div>
                </div>
                <div className={cn("w-2 h-2 rounded-full", config.dotColor)} />
              </button>
            );
          })}
        </div>
      </div>

      {/* 分割线 */}
      <div className="border-b" />

      {/* 生成新地址 */}
      <div className="py-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">生成新地址</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 items-end">
              {/* 第一列：选择基地（三级联动） */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  选择基地
                </Label>
                <div className="flex gap-2">
                  <Select value={selectedBaseId} onValueChange={handleBaseChange}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="基地" />
                    </SelectTrigger>
                    <SelectContent>
                      {cascadeData.map((base) => (
                        <SelectItem key={base.id} value={base.id}>
                          {base.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedMeterId}
                    onValueChange={handleMeterChange}
                    disabled={!selectedBaseId}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={selectedBaseId ? "物业" : "-"} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedBase?.meters.map((meter) => (
                        <SelectItem key={meter.id} value={meter.id}>
                          {meter.name || meter.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedSpaceId}
                    onValueChange={setSelectedSpaceId}
                    disabled={!selectedMeterId}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={selectedMeterId ? "空间" : "-"} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedMeter?.spaces.map((space) => (
                        <SelectItem key={space.id} value={space.id}>
                          {space.name || space.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 第二列：预分配企业 */}
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-3">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    预分配企业 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={assignedEnterpriseName}
                    onValueChange={setAssignedEnterpriseName}
                    disabled={loadingApplications}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingApplications ? "加载中..." : "选择企业（从入驻申请）"} />
                    </SelectTrigger>
                    <SelectContent>
                      {fillingApplications.length === 0 ? (
                        <SelectItem value="_empty" disabled>
                          暂无填报中的企业
                        </SelectItem>
                      ) : (
                        fillingApplications.map((app) => (
                          <SelectItem key={app.id} value={app.enterprise_name}>
                            <div className="flex items-center gap-2">
                              <span>{app.enterprise_name}</span>
                              {app.legal_person_name && (
                                <span className="text-muted-foreground text-xs">
                                  ({app.legal_person_name})
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={generateRegNumber}
                  disabled={generating || !selectedSpaceId || !assignedEnterpriseName}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1.5" />
                      生成工位号
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 分割线 */}
      <div className="border-b" />

      {/* 工位号列表 */}
      <div className="py-4">
        {filteredRegNumbers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Hash className="h-12 w-12 text-slate-300 mb-3" />
            <p>暂无数据</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full min-w-[800px]">
              {/* 表头 */}
              <thead>
                <tr className="bg-slate-50 border-b text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3 text-left w-[140px]">工位号</th>
                  <th className="px-4 py-3 text-left w-[100px]">人工编号</th>
                  <th className="px-4 py-3 text-left w-[240px]">地址</th>
                  <th className="px-4 py-3 text-left w-[140px]">预分配企业</th>
                  <th className="px-4 py-3 text-left w-[90px]">生成日期</th>
                  <th className="px-4 py-3 text-left w-[70px]">状态</th>
                  <th className="px-4 py-3 text-right w-[100px]">操作</th>
                </tr>
              </thead>
              {/* 表体 */}
              <tbody>
                {filteredRegNumbers.map((reg) => (
                  <tr key={reg.id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-sm">
                      {reg.code}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingManualCodeId === reg.id ? (
                        <Input
                          autoFocus
                          value={editingManualCodeValue}
                          onChange={(e) => setEditingManualCodeValue(e.target.value)}
                          onBlur={() => saveManualCode(reg.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveManualCode(reg.id);
                            if (e.key === "Escape") cancelEditManualCode();
                          }}
                          disabled={savingManualCode}
                          className="h-7 text-sm"
                          placeholder="输入编号"
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:text-cyan-600 transition-colors"
                          onClick={() => startEditManualCode(reg)}
                          title="点击编辑"
                        >
                          {reg.manual_code || <span className="text-muted-foreground/50 italic text-xs">点击设置</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-[240px]" title={getAddressName(reg)}>
                      {getAddressName(reg)}
                    </td>
                    <td className="px-4 py-3 text-sm truncate max-w-[140px]" title={reg.assigned_enterprise_name || "-"}>
                      {editingEnterpriseId === reg.id ? (
                        <Input
                          autoFocus
                          value={editingEnterpriseValue}
                          onChange={(e) => setEditingEnterpriseValue(e.target.value)}
                          onBlur={() => saveEnterprise(reg.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEnterprise(reg.id);
                            if (e.key === "Escape") cancelEditEnterprise();
                          }}
                          disabled={savingEnterprise}
                          className="h-7 text-sm"
                          placeholder="输入企业名称"
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:text-cyan-600 transition-colors"
                          onClick={() => startEditEnterprise(reg)}
                          title="点击编辑"
                        >
                          {reg.assigned_enterprise_name || <span className="text-muted-foreground/50 italic text-xs">点击设置</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(reg.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={
                          reg.available
                            ? "bg-amber-50 text-amber-600"
                            : "bg-emerald-50 text-emerald-600"
                        }
                      >
                        {reg.available ? "待使用" : "已使用"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditDialog(reg)}
                          title="编辑"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDownload(reg)}
                          disabled={downloadingId === reg.id}
                          title="下载授权函"
                        >
                          {downloadingId === reg.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handlePrint(reg)}
                          disabled={printingId === reg.id}
                          title="打印授权函"
                        >
                          {printingId === reg.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Printer className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 编辑弹窗 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑工位号</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>系统工位号</Label>
              <Input value={editingRegNumber?.code || ""} disabled className="bg-slate-50" />
            </div>
            <div className="space-y-2">
              <Label>人工编号</Label>
              <Input
                value={editForm.manual_code}
                onChange={(e) => setEditForm({ ...editForm, manual_code: e.target.value })}
                placeholder="输入后将优先显示此编号"
              />
            </div>
            <div className="space-y-2">
              <Label>预分配企业</Label>
              <Input
                value={editForm.assigned_enterprise_name}
                onChange={(e) => setEditForm({ ...editForm, assigned_enterprise_name: e.target.value })}
                placeholder="用于生成产权证明授权函"
              />
            </div>
            <div className="space-y-2">
              <Label>产权单位</Label>
              <Input
                value={editForm.property_owner}
                onChange={(e) => setEditForm({ ...editForm, property_owner: e.target.value })}
                placeholder="如：吉林省恒松物业管理有限公司"
              />
            </div>
            <div className="space-y-2">
              <Label>管理单位</Label>
              <Input
                value={editForm.management_company}
                onChange={(e) => setEditForm({ ...editForm, management_company: e.target.value })}
                placeholder="如：吉林省天之企业管理咨询有限公司"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
