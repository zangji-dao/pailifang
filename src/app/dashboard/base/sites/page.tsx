"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  ArrowLeft,
  Briefcase,
  Pencil,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTabs } from "../../tabs-context";
import { MapPicker } from "@/components/map/MapPicker";

interface Base {
  id: string;
  name: string;
  address: string | null;
  status: string;
  meterCount: number;
  createdAt: string;
  // 管理公司信息（甲方）
  management_company_name?: string | null;
  management_company_credit_code?: string | null;
  management_company_legal_person?: string | null;
  management_company_address?: string | null;
  management_company_phone?: string | null;
}

interface BaseStats {
  totalSpaces: number;
  totalRegNumbers: number;
  allocatedRegNumbers: number;
}

interface EnterpriseStats {
  total: number;
  tenant: number;
  service: number;
  active: number;
}

// 数据库返回的原始类型
interface Meter {
  spaces?: Space[];
}

interface Space {
  regNumbers?: RegNumber[];
}

interface RegNumber {
  status: string;
}

interface BaseDetail {
  meters?: Meter[];
}

// 视图模式类型
type ViewMode = "list" | "add" | "edit";

export default function BaseListPage() {
  const router = useRouter();
  const tabs = useTabs();
  const [bases, setBases] = useState<Base[]>([]);
  const [baseStats, setBaseStats] = useState<Record<string, BaseStats>>({});
  const [enterpriseStats, setEnterpriseStats] = useState<EnterpriseStats>({ total: 0, tenant: 0, service: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  
  // 视图模式：列表、新增或编辑
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  
  // 正在编辑的基地
  const [editingBase, setEditingBase] = useState<Base | null>(null);
  
  // 表单数据
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    status: "active",
    // 管理公司信息（甲方）
    management_company_name: "",
    management_company_credit_code: "",
    management_company_legal_person: "",
    management_company_address: "",
    management_company_phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  
  // 删除确认弹窗
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; base: Base | null }>({
    open: false,
    base: null,
  });
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      // 并行获取所有数据
      const [basesResponse, enterpriseResponse] = await Promise.all([
        fetch("/api/bases"),
        fetch('/api/enterprises/stats').catch(() => null),
      ]);
      
      const basesResult = await basesResponse.json();
      
      if (basesResult.success) {
        setBases(basesResult.data);
        
        // 并行获取所有基地的详细统计（而不是串行）
        const stats: Record<string, BaseStats> = {};
        const detailPromises = basesResult.data.map(async (base: Base) => {
          try {
            const detailResponse = await fetch(`/api/bases/${base.id}`);
            const detailResult = await detailResponse.json();
            if (detailResult.success && detailResult.data.meters) {
              const meters: Meter[] = detailResult.data.meters;
              return {
                id: base.id,
                stats: {
                  totalSpaces: meters.reduce((sum: number, m: Meter) => sum + (m.spaces?.length || 0), 0),
                  totalRegNumbers: meters.reduce((sum: number, m: Meter) => 
                    sum + (m.spaces?.reduce((s: number, sp: Space) => s + (sp.regNumbers?.length || 0), 0) || 0), 0),
                  allocatedRegNumbers: meters.reduce((sum: number, m: Meter) => 
                    sum + (m.spaces?.reduce((s: number, sp: Space) => 
                      s + (sp.regNumbers?.filter((r: RegNumber) => r.status === "allocated")?.length || 0), 0) || 0), 0),
                },
              };
            }
          } catch (e) {
            console.error("获取基地详情失败:", e);
          }
          return null;
        });
        
        const detailResults = await Promise.all(detailPromises);
        detailResults.forEach((result) => {
          if (result) {
            stats[result.id] = result.stats;
          }
        });
        setBaseStats(stats);
      }

      // 处理企业统计
      if (enterpriseResponse) {
        try {
          const enterpriseResult = await enterpriseResponse.json();
          if (enterpriseResult.success) {
            setEnterpriseStats(enterpriseResult.data);
          }
        } catch (e) {
          console.error("获取企业统计失败:", e);
        }
      }
    } catch (error) {
      console.error("获取基地列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 打开编辑视图
  const handleEditBase = (base: Base) => {
    setEditingBase(base);
    setFormData({
      name: base.name,
      address: base.address || "",
      status: base.status,
      // 管理公司信息
      management_company_name: base.management_company_name || "",
      management_company_credit_code: base.management_company_credit_code || "",
      management_company_legal_person: base.management_company_legal_person || "",
      management_company_address: base.management_company_address || "",
      management_company_phone: base.management_company_phone || "",
    });
    
    setViewMode("edit");
  };

  // 创建基地
  const handleCreateBase = async () => {
    if (!formData.name.trim()) {
      toast.error("请输入基地名称");
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch("/api/bases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      if (result.success) {
        toast.success("基地创建成功");
        resetForm();
        setViewMode("list");
        fetchData();
      } else {
        toast.error(result.error || "创建失败");
      }
    } catch (error) {
      console.error("创建基地失败:", error);
      toast.error("创建失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  // 更新基地
  const handleUpdateBase = async () => {
    if (!editingBase || !formData.name.trim()) {
      toast.error("请输入基地名称");
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/bases/${editingBase.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      if (result.success) {
        toast.success("基地更新成功");
        resetForm();
        setViewMode("list");
        fetchData();
      } else {
        toast.error(result.error || "更新失败");
      }
    } catch (error) {
      console.error("更新基地失败:", error);
      toast.error("更新失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  // 删除基地
  const handleDeleteBase = async () => {
    if (!deleteConfirm.base) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/bases/${deleteConfirm.base.id}`, {
        method: "DELETE",
      });
      
      const result = await response.json();
      if (result.success) {
        toast.success("基地删除成功");
        setDeleteConfirm({ open: false, base: null });
        fetchData();
      } else {
        toast.error(result.error || "删除失败");
      }
    } catch (error) {
      console.error("删除基地失败:", error);
      toast.error("删除失败，请重试");
    } finally {
      setDeleting(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      status: "active",
      management_company_name: "",
      management_company_credit_code: "",
      management_company_legal_person: "",
      management_company_address: "",
      management_company_phone: "",
    });
    setEditingBase(null);
  };

  const handleBaseClick = (baseId: string, baseName: string) => {
    if (tabs) {
      tabs.openTab({
        id: `base-${baseId}`,
        label: baseName,
        path: `/dashboard/base/sites/${baseId}`,
        icon: <Home className="h-3.5 w-3.5" />,
      });
    } else {
      router.push(`/dashboard/base/sites/${baseId}`);
    }
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

  // 表单视图（新增或编辑）
  if (viewMode === "add" || viewMode === "edit") {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setViewMode("list");
              resetForm();
            }}
            className="text-slate-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
        </div>

        {/* 表单卡片 */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm">
          {/* 头部 */}
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">
              {viewMode === "add" ? "新增基地" : "编辑基地"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">填写基地基本信息</p>
          </div>
          
          {/* 表单内容 */}
          <div className="p-6 space-y-5">
            {/* 基地名称 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                基地名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入基地名称"
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              />
            </div>
            
            {/* 基地地址 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                基地地址
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="请输入基地详细地址"
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              />
            </div>
            
            {/* 地图选点 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                在地图上选择位置
              </label>
              <MapPicker
                value={
                  formData.address
                    ? {
                        lng: 0,
                        lat: 0,
                        address: formData.address,
                      }
                    : undefined
                }
                onChange={(location) => {
                  setFormData({
                    ...formData,
                    address: location.address || formData.address,
                  });
                }}
                placeholder="点击在地图上选择基地位置"
              />
            </div>
            
            {/* 状态 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                状态
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={formData.status === "active"}
                    onChange={() => setFormData({ ...formData, status: "active" })}
                    className="w-4 h-4 text-amber-500 border-slate-300 focus:ring-amber-500"
                  />
                  <span className="text-sm text-slate-700">运营中</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={formData.status === "inactive"}
                    onChange={() => setFormData({ ...formData, status: "inactive" })}
                    className="w-4 h-4 text-amber-500 border-slate-300 focus:ring-amber-500"
                  />
                  <span className="text-sm text-slate-700">已停用</span>
                </label>
              </div>
            </div>
            
            {/* 分隔线 */}
            <div className="border-t border-slate-200 pt-5 mt-5">
              <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-amber-500" />
                管理公司信息（合同甲方）
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                填写该基地的管理公司信息，用于生成入驻合同时作为甲方信息
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {/* 管理公司名称 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    管理公司名称
                  </label>
                  <input
                    type="text"
                    value={formData.management_company_name}
                    onChange={(e) => setFormData({ ...formData, management_company_name: e.target.value })}
                    placeholder="例如：XX企业服务中心"
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                  />
                </div>
                
                {/* 统一社会信用代码 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    统一社会信用代码
                  </label>
                  <input
                    type="text"
                    value={formData.management_company_credit_code}
                    onChange={(e) => setFormData({ ...formData, management_company_credit_code: e.target.value })}
                    placeholder="18位信用代码"
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 font-mono"
                  />
                </div>
                
                {/* 法定代表人 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    法定代表人
                  </label>
                  <input
                    type="text"
                    value={formData.management_company_legal_person}
                    onChange={(e) => setFormData({ ...formData, management_company_legal_person: e.target.value })}
                    placeholder="法人姓名"
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                  />
                </div>
                
                {/* 联系电话 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    联系电话
                  </label>
                  <input
                    type="text"
                    value={formData.management_company_phone}
                    onChange={(e) => setFormData({ ...formData, management_company_phone: e.target.value })}
                    placeholder="联系电话"
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                  />
                </div>
                
                {/* 公司地址 */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    公司地址
                  </label>
                  <input
                    type="text"
                    value={formData.management_company_address}
                    onChange={(e) => setFormData({ ...formData, management_company_address: e.target.value })}
                    placeholder="详细地址"
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* 底部按钮 */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-xl">
            <Button
              variant="outline"
              onClick={() => {
                setViewMode("list");
                resetForm();
              }}
              disabled={submitting}
            >
              取消
            </Button>
            <Button
              onClick={viewMode === "add" ? handleCreateBase : handleUpdateBase}
              disabled={submitting}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {viewMode === "add" ? "创建中..." : "保存中..."}
                </>
              ) : (
                <>
                  {viewMode === "add" ? (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      创建基地
                    </>
                  ) : (
                    <>
                      保存修改
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 列表视图
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* 操作栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Button 
          className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium shrink-0 sm:ml-auto"
          onClick={() => setViewMode("add")}
        >
          <Plus className="h-4 w-4 mr-2" />
          新增基地
        </Button>
      </div>

      {/* 核心指标卡片 - 响应式网格 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        {/* 基地总数 */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
            </div>
            <span className="text-xs sm:text-sm text-slate-500">基地总数</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{bases.length}</p>
        </div>

        {/* 物业总数 */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <Home className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            </div>
            <span className="text-xs sm:text-sm text-slate-500">物业总数</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{totalMeters}</p>
        </div>

        {/* 物理空间 */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <DoorOpen className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
            </div>
            <span className="text-xs sm:text-sm text-slate-500">物理空间</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{totalSpaces}</p>
        </div>

        {/* 工位号 */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <span className="text-xs sm:text-sm text-slate-500">工位号</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{totalRegNumbers}</p>
        </div>

        {/* 入驻企业 */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-blue-100 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <span className="text-xs sm:text-sm text-blue-600">入驻企业</span>
          </div>
          <p className="text-2xl font-semibold text-blue-700">{enterpriseStats.tenant}</p>
          <p className="text-xs text-slate-400 mt-1">基地内注册</p>
        </div>

        {/* 服务企业 */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-purple-100 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
              <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            </div>
            <span className="text-xs sm:text-sm text-purple-600">服务企业</span>
          </div>
          <p className="text-2xl font-semibold text-purple-700">{enterpriseStats.service}</p>
          <p className="text-xs text-slate-400 mt-1">使用园区服务</p>
        </div>
      </div>

      {/* 基地列表 */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-100">
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-slate-50 transition-colors gap-4"
                >
                  {/* 左侧：基地信息 */}
                  <div 
                    className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 cursor-pointer"
                    onClick={() => handleBaseClick(base.id, base.name)}
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border border-slate-200 shrink-0">
                      <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-slate-900 truncate">{base.name}</h3>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium shrink-0",
                          base.status === "active" 
                            ? "bg-emerald-50 text-emerald-600" 
                            : "bg-slate-100 text-slate-500"
                        )}>
                          {base.status === "active" ? "运营中" : "已停用"}
                        </span>
                      </div>
                      {base.address && (
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500 truncate">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{base.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 中间：统计数据 - 小屏幕隐藏，大屏幕显示 */}
                  <div className="hidden lg:flex items-center gap-8 shrink-0">
                    {/* 物业 */}
                    <div className="text-center min-w-[60px]">
                      <p className="text-2xl font-semibold text-slate-900">{base.meterCount}</p>
                      <p className="text-xs text-slate-500">物业</p>
                    </div>
                    
                    {/* 物理空间 */}
                    <div className="text-center min-w-[60px]">
                      <p className="text-2xl font-semibold text-slate-900">{stats.totalSpaces}</p>
                      <p className="text-xs text-slate-500">空间</p>
                    </div>
                    
                    {/* 工位号 */}
                    <div className="text-center min-w-[60px]">
                      <p className="text-2xl font-semibold text-slate-900">{stats.totalRegNumbers}</p>
                      <p className="text-xs text-slate-500">工位号</p>
                    </div>
                    
                    {/* 入驻企业 */}
                    <div className="text-center min-w-[80px]">
                      <p className="text-2xl font-semibold text-violet-600">{stats.allocatedRegNumbers}</p>
                      <p className="text-xs text-slate-500">入驻企业</p>
                    </div>
                  </div>

                  {/* 右侧：操作区 */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    {/* 小屏幕：显示统计标签 */}
                    <div className="flex sm:hidden items-center gap-2 text-xs text-slate-500">
                      <span className="px-2 py-1 bg-slate-100 rounded">{base.meterCount} 物业</span>
                      <span className="px-2 py-1 bg-violet-50 text-violet-600 rounded">{stats.allocatedRegNumbers} 企业</span>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditBase(base);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-1.5" />
                        编辑
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ open: true, base });
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 删除确认弹窗 */}
      {deleteConfirm.open && deleteConfirm.base && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 遮罩 */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteConfirm({ open: false, base: null })}
          />
          
          {/* 弹窗内容 */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            {(() => {
              const base = deleteConfirm.base;
              const stats = baseStats[base.id] || { totalSpaces: 0, totalRegNumbers: 0, allocatedRegNumbers: 0 };
              const hasMeters = base.meterCount > 0;
              const hasEnterprises = stats.allocatedRegNumbers > 0;
              const canDelete = !hasMeters && !hasEnterprises;
              
              if (!canDelete) {
                // 有关联数据，禁止删除
                return (
                  <>
                    <div className="p-6">
                      <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-amber-100 rounded-full">
                        <Trash2 className="h-6 w-6 text-amber-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-center text-slate-900 mb-2">
                        无法删除
                      </h3>
                      <p className="text-center text-slate-500 text-sm">
                        基地「{base.name}」下存在关联数据，无法删除。
                      </p>
                      <div className="mt-4 bg-amber-50 rounded-lg p-3 space-y-2">
                        {hasMeters && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">物业数量</span>
                            <span className="font-medium text-amber-700">{base.meterCount} 个</span>
                          </div>
                        )}
                        {hasEnterprises && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">入驻企业</span>
                            <span className="font-medium text-amber-700">{stats.allocatedRegNumbers} 家</span>
                          </div>
                        )}
                      </div>
                      <p className="text-center text-slate-400 text-xs mt-4">
                        请先删除或迁移相关数据后再操作
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-center px-6 py-4 bg-slate-50 border-t border-slate-100">
                      <Button
                        className="px-8"
                        onClick={() => setDeleteConfirm({ open: false, base: null })}
                      >
                        我知道了
                      </Button>
                    </div>
                  </>
                );
              }
              
              // 无关联数据，可以删除
              return (
                <>
                  <div className="p-6">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                      <Trash2 className="h-6 w-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-center text-slate-900 mb-2">
                      确认删除
                    </h3>
                    <p className="text-center text-slate-500 text-sm">
                      确定要删除基地「{base.name}」吗？此操作不可恢复。
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setDeleteConfirm({ open: false, base: null })}
                      disabled={deleting}
                    >
                      取消
                    </Button>
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      onClick={handleDeleteBase}
                      disabled={deleting}
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          删除中...
                        </>
                      ) : (
                        "确认删除"
                      )}
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
