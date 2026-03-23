"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Plus,
  Loader2,
  Search,
  Eye,
  Edit,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// 企业类型 Tab
type EnterpriseType = "tenant" | "non_tenant";

// 流程状态
type ProcessStatus = 
  | "new" 
  | "pending_address" 
  | "pending_registration" 
  | "pending_change"
  | "pending_contract" 
  | "pending_payment" 
  | "active" 
  | "moved_out"
  | "terminated";

interface Enterprise {
  id: string;
  name: string;
  enterpriseCode?: string;
  creditCode?: string;
  legalPerson?: string;
  phone?: string;
  industry?: string;
  status: string;
  type?: string;
  processStatus?: ProcessStatus;
  registeredAddress?: string;
  settledDate?: string;
  createdAt: string;
}

// 入驻企业流程状态配置（不包含new）
const tenantStatusConfig: Record<string, { 
  label: string; 
  color: string; 
  bgColor: string;
  borderColor: string;
  dotColor: string;
}> = {
  pending_address: { 
    label: "待分配地址", 
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    dotColor: "bg-orange-500",
  },
  pending_registration: { 
    label: "待工商注册", 
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-300",
    dotColor: "bg-purple-500",
  },
  pending_contract: { 
    label: "待签合同", 
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-300",
    dotColor: "bg-cyan-500",
  },
  pending_payment: { 
    label: "待缴费", 
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    dotColor: "bg-amber-500",
  },
  active: { 
    label: "入驻中", 
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
    dotColor: "bg-emerald-500",
  },
  moved_out: { 
    label: "已迁出", 
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-300",
    dotColor: "bg-slate-500",
  },
};

// 服务企业状态配置
const nonTenantStatusConfig: Record<string, { 
  label: string; 
  color: string; 
  bgColor: string;
  borderColor: string;
  dotColor: string;
}> = {
  new: { 
    label: "洽谈中", 
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    dotColor: "bg-blue-500",
  },
  pending_change: { 
    label: "待工商变更", 
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-300",
    dotColor: "bg-violet-500",
  },
  active: { 
    label: "服务中", 
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
    dotColor: "bg-emerald-500",
  },
  terminated: { 
    label: "服务终止", 
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-300",
    dotColor: "bg-slate-500",
  },
};

export default function EnterpriseListPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<EnterpriseType>("tenant");
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // 获取企业列表
  const fetchEnterprises = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/enterprises");
      const result = await response.json();
      if (result.success) {
        setEnterprises(result.data || []);
      } else {
        toast({
          title: "获取企业列表失败",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("获取企业列表失败:", err);
      toast({
        title: "获取企业列表失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnterprises();
  }, []);

  // 根据当前 Tab 过滤企业
  const tabEnterprises = enterprises.filter((e) => e.type === activeTab);

  // 过滤企业列表
  const filteredEnterprises = tabEnterprises.filter((e) => {
    // 状态过滤
    const matchStatus = statusFilter === null || e.processStatus === statusFilter;
    // 关键词过滤
    if (!searchKeyword) return matchStatus;
    const keyword = searchKeyword.toLowerCase();
    const matchKeyword = 
      e.name?.toLowerCase().includes(keyword) ||
      e.enterpriseCode?.toLowerCase().includes(keyword) ||
      e.creditCode?.includes(keyword) ||
      e.legalPerson?.toLowerCase().includes(keyword) ||
      e.phone?.includes(keyword);
    return matchStatus && matchKeyword;
  });

  // 入驻企业统计
  const tenantStats = {
    total: enterprises.filter((e) => e.type === "tenant").length,
    pending_address: enterprises.filter((e) => e.type === "tenant" && e.processStatus === "pending_address").length,
    pending_registration: enterprises.filter((e) => e.type === "tenant" && e.processStatus === "pending_registration").length,
    pending_contract: enterprises.filter((e) => e.type === "tenant" && e.processStatus === "pending_contract").length,
    pending_payment: enterprises.filter((e) => e.type === "tenant" && e.processStatus === "pending_payment").length,
    active: enterprises.filter((e) => e.type === "tenant" && e.processStatus === "active").length,
    moved_out: enterprises.filter((e) => e.type === "tenant" && e.processStatus === "moved_out").length,
  };

  // 服务企业统计
  const nonTenantStats = {
    total: enterprises.filter((e) => e.type === "non_tenant").length,
    new: enterprises.filter((e) => e.type === "non_tenant" && (e.processStatus === "new" || e.processStatus === undefined)).length,
    pending_change: enterprises.filter((e) => e.type === "non_tenant" && e.processStatus === "pending_change").length,
    active: enterprises.filter((e) => e.type === "non_tenant" && e.processStatus === "active").length,
    terminated: enterprises.filter((e) => e.type === "non_tenant" && e.processStatus === "terminated").length,
  };

  // 切换 Tab 时重置过滤条件
  const handleTabChange = (tab: EnterpriseType) => {
    setActiveTab(tab);
    setStatusFilter(null);
    setSearchKeyword("");
  };

  // 加载状态
  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* 页面标题和操作按钮 */}
      <div className="py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">企业管理</h1>
          <p className="text-sm text-slate-500 mt-1">
            管理入驻企业和服务企业
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/base/tenants/create")}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          新建企业
        </Button>
      </div>

      {/* 分割线 */}
      <div className="border-b" />

      {/* Tab 切换 */}
      <div className="py-4">
        <div className="flex gap-2">
          <button
            onClick={() => handleTabChange("tenant")}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2.5 transition-all",
              activeTab === "tenant"
                ? "border-blue-400 bg-blue-50 text-blue-600"
                : "border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50/50"
            )}
          >
            <Building2 className="h-4 w-4" />
            <span className="font-medium">入驻企业</span>
            <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700 hover:bg-blue-100">{tenantStats.total}</Badge>
          </button>
          <button
            onClick={() => handleTabChange("non_tenant")}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2.5 transition-all",
              activeTab === "non_tenant"
                ? "border-emerald-400 bg-emerald-50 text-emerald-600"
                : "border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50"
            )}
          >
            <Store className="h-4 w-4" />
            <span className="font-medium">服务企业</span>
            <Badge variant="secondary" className="ml-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{nonTenantStats.total}</Badge>
          </button>
        </div>
      </div>

      {/* 入驻企业 - 状态卡片 */}
      {activeTab === "tenant" && (
        <div className="pb-4">
          <div className="grid grid-cols-6 gap-2">
            {Object.entries(tenantStatusConfig).map(([key, config]) => {
              const count = tenantStats[key as keyof typeof tenantStats];
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(statusFilter === key ? null : key)}
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-2 py-2 transition-all",
                    statusFilter === key 
                      ? `${config.borderColor} ${config.bgColor}` 
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  )}
                >
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">{config.label}</div>
                    <div className={cn("text-lg font-semibold", statusFilter === key ? config.color : "text-foreground")}>
                      {count}
                    </div>
                  </div>
                  <div className={cn("w-2 h-2 rounded-full", config.dotColor)} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 服务企业 - 状态卡片 */}
      {activeTab === "non_tenant" && (
        <div className="pb-4">
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(nonTenantStatusConfig).map(([key, config]) => {
              const count = nonTenantStats[key as keyof typeof nonTenantStats];
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
                    <div className={cn("text-xl font-semibold", statusFilter === key ? config.color : "text-foreground")}>
                      {count}
                    </div>
                  </div>
                  <div className={cn("w-2 h-2 rounded-full", config.dotColor)} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 分割线 */}
      <div className="border-b" />

      {/* 搜索栏 */}
      <div className="py-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索企业名称、编号、法人..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* 空状态引导页 */}
      {filteredEnterprises.length === 0 && statusFilter === null && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <div className="text-muted-foreground mb-2">
            暂无{activeTab === "tenant" ? "入驻企业" : "服务企业"}
          </div>
          <div className="text-sm text-muted-foreground">点击右上角「新建企业」创建</div>
        </div>
      )}

      {/* 有过滤条件但无结果 */}
      {filteredEnterprises.length === 0 && statusFilter !== null && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-muted-foreground mb-2">该状态下暂无企业</div>
          <Button variant="link" onClick={() => setStatusFilter(null)}>
            查看全部
          </Button>
        </div>
      )}

      {/* 企业列表 */}
      {filteredEnterprises.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">企业编号</th>
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">企业名称</th>
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">法人/电话</th>
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">行业</th>
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">状态</th>
                <th className="p-4 text-right text-sm font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnterprises.map((enterprise) => {
                const processStatus = enterprise.processStatus || (activeTab === "tenant" ? "pending_address" : "new");
                const statusInfo = activeTab === "tenant" 
                  ? tenantStatusConfig[processStatus] || tenantStatusConfig.pending_address
                  : nonTenantStatusConfig[processStatus] || nonTenantStatusConfig.new;
                
                return (
                  <tr key={enterprise.id} className="border-b last:border-b-0 hover:bg-muted/50">
                    <td className="p-4">
                      <span className="text-sm font-mono text-primary">{enterprise.enterpriseCode || "-"}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {activeTab === "tenant" ? (
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Store className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium">{enterprise.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      <div>{enterprise.legalPerson || "-"}</div>
                      <div className="text-muted-foreground">{enterprise.phone || "-"}</div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {enterprise.industry || "-"}
                    </td>
                    <td className="p-4">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium",
                        statusInfo.bgColor, statusInfo.color
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", statusInfo.dotColor)} />
                        {statusInfo.label}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/dashboard/base/tenants/${enterprise.id}`)}
                          className="gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          查看
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/dashboard/base/tenants/${enterprise.id}/edit`)}
                          className="gap-1"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          编辑
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
