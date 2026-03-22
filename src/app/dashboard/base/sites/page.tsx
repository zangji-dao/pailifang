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
  X,
  Briefcase,
  MapPinned,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTabs } from "../../tabs-context";
import { provinces, Province, City } from "@/lib/cities";

interface Base {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  city_code: string | null;
  status: string;
  meterCount: number;
  createdAt: string;
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

export default function BaseListPage() {
  const router = useRouter();
  const tabs = useTabs();
  const [bases, setBases] = useState<Base[]>([]);
  const [baseStats, setBaseStats] = useState<Record<string, BaseStats>>({});
  const [enterpriseStats, setEnterpriseStats] = useState<EnterpriseStats>({ total: 0, tenant: 0, service: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  
  // 新增基地弹窗状态
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city_code: "",
    status: "active",
  });
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
              const meters: Meter[] = detailResult.data.meters;
              stats[base.id] = {
                totalSpaces: meters.reduce((sum: number, m: Meter) => sum + (m.spaces?.length || 0), 0),
                totalRegNumbers: meters.reduce((sum: number, m: Meter) => 
                  sum + (m.spaces?.reduce((s: number, sp: Space) => s + (sp.regNumbers?.length || 0), 0) || 0), 0),
                allocatedRegNumbers: meters.reduce((sum: number, m: Meter) => 
                  sum + (m.spaces?.reduce((s: number, sp: Space) => 
                    s + (sp.regNumbers?.filter((r: RegNumber) => r.status === "allocated")?.length || 0), 0) || 0), 0),
              };
            }
          } catch (e) {
            console.error("获取基地详情失败:", e);
          }
        }
        setBaseStats(stats);
      }

      // 获取企业统计
      try {
        const enterpriseResponse = await fetch('/api/enterprises/stats');
        const enterpriseResult = await enterpriseResponse.json();
        if (enterpriseResult.success) {
          setEnterpriseStats(enterpriseResult.data);
        }
      } catch (e) {
        console.error("获取企业统计失败:", e);
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
        body: JSON.stringify({
          ...formData,
          city: selectedCity?.name || null,
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        setShowAddDialog(false);
        setFormData({ name: "", address: "", city_code: "", status: "active" });
        setSelectedProvince(null);
        setSelectedCity(null);
        // 刷新列表
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

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* 操作栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Button 
          className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium shrink-0 sm:ml-auto"
          onClick={() => setShowAddDialog(true)}
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
          <p className="text-xs text-slate-400 mt-1">基地外注册</p>
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
                  onClick={() => handleBaseClick(base.id, base.name)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-slate-50 cursor-pointer transition-colors group gap-4"
                >
                  {/* 左侧：基地信息 */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border border-slate-200 shrink-0">
                      <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-slate-900 group-hover:text-slate-700 truncate">{base.name}</h3>
                        {base.city && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600 shrink-0 flex items-center gap-1">
                            <MapPinned className="h-3 w-3" />
                            {base.city}
                          </span>
                        )}
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
                  <div className="hidden lg:flex items-center gap-8">
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

                  {/* 右侧：快捷入口 */}
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    {/* 小屏幕：显示统计标签 */}
                    <div className="flex sm:hidden items-center gap-2 text-xs text-slate-500">
                      <span className="px-2 py-1 bg-slate-100 rounded">{base.meterCount} 物业</span>
                      <span className="px-2 py-1 bg-violet-50 text-violet-600 rounded">{stats.allocatedRegNumbers} 企业</span>
                    </div>
                    
                    {/* 大屏幕：快捷按钮 */}
                    <div className="hidden sm:flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBaseClick(base.id, base.name);
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
                          handleBaseClick(base.id, base.name);
                        }}
                      >
                        <Users className="h-4 w-4 mr-1.5" />
                        入驻企业
                      </Button>
                    </div>
                    
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 新增基地弹窗 */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 遮罩 */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddDialog(false)}
          />
          
          {/* 弹窗内容 */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* 头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">新增基地</h3>
              <button
                onClick={() => setShowAddDialog(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* 表单 */}
            <div className="p-6 space-y-4">
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
              
              {/* 所在城市 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  所在城市
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* 省份选择 */}
                  <select
                    value={selectedProvince?.code || ""}
                    onChange={(e) => {
                      const province = provinces.find(p => p.code === e.target.value);
                      setSelectedProvince(province || null);
                      setSelectedCity(null);
                      setFormData({ ...formData, city_code: "" });
                    }}
                    className="h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 bg-white"
                  >
                    <option value="">选择省份</option>
                    {provinces.map((province) => (
                      <option key={province.code} value={province.code}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                  
                  {/* 城市选择 */}
                  <select
                    value={selectedCity?.code || ""}
                    onChange={(e) => {
                      const city = selectedProvince?.cities.find(c => c.code === e.target.value);
                      setSelectedCity(city || null);
                      setFormData({ ...formData, city_code: e.target.value });
                    }}
                    disabled={!selectedProvince}
                    className="h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">选择城市</option>
                    {selectedProvince?.cities.map((city) => (
                      <option key={city.code} value={city.code}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* 基地地址 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  详细地址
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="请输入详细地址"
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
              
              {/* 状态 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  状态
                </label>
                <div className="flex gap-3">
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
            </div>
            
            {/* 底部按钮 */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                disabled={submitting}
              >
                取消
              </Button>
              <Button
                onClick={handleCreateBase}
                disabled={submitting}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    创建基地
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
