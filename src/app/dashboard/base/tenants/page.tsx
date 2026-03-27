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
  Trash2,
  Store,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTabs } from "../../tabs-context";

// 企业类型 Tab
type EnterpriseType = "tenant" | "non_tenant";

// 流程状态
type ProcessStatus = 
  | "draft"
  | "new" 
  | "pending_address" 
  | "pending_registration" 
  | "pending_contract" 
  | "pending_payment" 
  | "active" 
  | "completed"
  | "moved_out"
  | "established";

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

// 入驻企业流程状态配置（从待工商注册开始）
const tenantStatusConfig: Record<string, { 
  label: string; 
  color: string; 
  bgColor: string;
  borderColor: string;
  dotColor: string;
}> = {
  pending_address: { 
    label: "待分配地址", 
    color: "text-sky-600",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-300",
    dotColor: "bg-sky-500",
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
  completed: { 
    label: "已完成", 
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
    dotColor: "bg-emerald-500",
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
  established: { 
    label: "已建交", 
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-300",
    dotColor: "bg-teal-500",
  },
  active: { 
    label: "服务中", 
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
    dotColor: "bg-emerald-500",
  },
};

export default function EnterpriseListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const tabs = useTabs();

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

  // 根据当前 Tab 过滤企业（入驻企业排除草稿状态）
  const tabEnterprises = enterprises.filter((e) => {
    if (e.type !== activeTab) return false;
    // 入驻企业排除草稿状态
    if (activeTab === "tenant" && (e.processStatus === "draft" || e.status === "draft")) return false;
    return true;
  });

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

  // 入驻企业统计（排除草稿状态）
  const tenantStats = {
    total: enterprises.filter((e) => e.type === "tenant" && e.processStatus !== "draft" && e.status !== "draft").length,
    pending_registration: enterprises.filter((e) => e.type === "tenant" && e.processStatus === "pending_registration").length,
    pending_contract: enterprises.filter((e) => e.type === "tenant" && e.processStatus === "pending_contract").length,
    pending_payment: enterprises.filter((e) => e.type === "tenant" && e.processStatus === "pending_payment").length,
    active: enterprises.filter((e) => e.type === "tenant" && e.processStatus === "active").length,
    completed: enterprises.filter((e) => e.type === "tenant" && e.processStatus === "completed").length,
    moved_out: enterprises.filter((e) => e.type === "tenant" && e.processStatus === "moved_out").length,
  };

  // 服务企业统计
  const nonTenantStats = {
    total: enterprises.filter((e) => e.type === "non_tenant").length,
    new: enterprises.filter((e) => e.type === "non_tenant" && (e.processStatus === "new" || e.processStatus === undefined)).length,
    established: enterprises.filter((e) => e.type === "non_tenant" && e.processStatus === "established").length,
    active: enterprises.filter((e) => e.type === "non_tenant" && e.processStatus === "active").length,
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
          onClick={() => {
            if (tabs) {
              tabs.openTab({
                id: "new-enterprise",
                label: "新建企业",
                path: "/dashboard/base/tenants/create?new=true",
                icon: <Plus className="h-3.5 w-3.5" />,
              });
            } else {
              router.push("/dashboard/base/tenants/create?new=true");
            }
          }}
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
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(tenantStatusConfig).map(([key, config]) => {
              const count = tenantStats[key as keyof typeof tenantStats] || 0;
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
                      <span className="text-sm font-mono text-cyan-600">{enterprise.enterpriseCode || "-"}</span>
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
                        {/* 入驻企业 - 继续注册按钮 */}
                        {activeTab === "tenant" && ['pending_registration', 'pending_contract', 'pending_payment'].includes(processStatus) && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              if (tabs) {
                                tabs.openTab({
                                  id: `continue-${enterprise.id}`,
                                  label: `继续注册-${enterprise.name}`,
                                  path: `/dashboard/base/tenants/create?continue=${enterprise.id}`,
                                  icon: <ArrowRight className="h-3.5 w-3.5" />,
                                });
                              } else {
                                router.push(`/dashboard/base/tenants/create?continue=${enterprise.id}`);
                              }
                            }}
                            className="gap-1 bg-primary hover:bg-primary/90"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                            继续注册
                          </Button>
                        )}
                        {/* 服务企业状态切换按钮 */}
                        {activeTab === "non_tenant" && (
                          <>
                            {/* 洽谈中 → 继续注册 + 删除 */}
                            {(processStatus === "new" || processStatus === undefined) && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    if (tabs) {
                                      tabs.openTab({
                                        id: `continue-${enterprise.id}`,
                                        label: `继续注册-${enterprise.name}`,
                                        path: `/dashboard/base/tenants/create?continue=${enterprise.id}`,
                                        icon: <ArrowRight className="h-3.5 w-3.5" />,
                                      });
                                    } else {
                                      router.push(`/dashboard/base/tenants/create?continue=${enterprise.id}`);
                                    }
                                  }}
                                  className="gap-1 bg-primary hover:bg-primary/90"
                                >
                                  <ArrowRight className="h-3.5 w-3.5" />
                                  继续注册
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={async () => {
                                    if (!confirm(`确定要删除「${enterprise.name}」吗？此操作不可撤销。`)) return;
                                    try {
                                      const response = await fetch(`/api/enterprises/${enterprise.id}`, {
                                        method: "DELETE",
                                      });
                                      const result = await response.json();
                                      if (result.success) {
                                        toast({ title: "删除成功" });
                                        fetchEnterprises();
                                      } else {
                                        toast({ title: "删除失败", variant: "destructive" });
                                      }
                                    } catch (err) {
                                      toast({ title: "删除失败", variant: "destructive" });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  删除
                                </Button>
                              </>
                            )}
                            {/* 已建交 - 提示去合同管理 */}
                            {processStatus === "established" && (
                              <span className="text-xs text-muted-foreground px-2">
                                请到合同管理创建合同
                              </span>
                            )}
                            {/* 服务中 - 显示合同状态提示 */}
                            {processStatus === "active" && (
                              <span className="text-xs text-emerald-600 px-2">
                                合同执行中
                              </span>
                            )}
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (tabs) {
                              tabs.openTab({
                                id: `enterprise-${enterprise.id}`,
                                label: enterprise.name,
                                path: `/dashboard/base/tenants/${enterprise.id}`,
                                icon: <Building2 className="h-3.5 w-3.5" />,
                              });
                            } else {
                              router.push(`/dashboard/base/tenants/${enterprise.id}`);
                            }
                          }}
                          className="gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          查看
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
