"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  FileText,
  Eye,
  Loader2,
  AlertCircle,
  Calendar,
  X,
  FileSignature,
  CheckCircle2,
  Clock,
  Timer,
  Palette,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTabs } from "@/app/dashboard/tabs-context";

// 类型定义
type ContractStatus = "pending" | "signed" | "expired" | "terminated";
type FilterType = ContractStatus | "expiring_soon";

interface Contract {
  id: string;
  enterpriseName: string | null;
  contractNo: string | null;
  contractName: string | null;
  contractType?: string | null;
  startDate: string | null;
  endDate: string | null;
  status: ContractStatus;
  createdAt: string;
}

// 检查合同是否即将到期（30天内）
const isExpiringSoon = (contract: Contract): boolean => {
  // 只有已签状态的合同才判断即将到期
  if (contract.status !== "signed") return false;
  if (!contract.endDate) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(contract.endDate);
  endDate.setHours(0, 0, 0, 0);
  
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // 0-30天内到期（包括今天）
  return diffDays >= 0 && diffDays <= 30;
};

// 状态配置 - 使用统一的七彩配色风格
const statusConfig: Record<ContractStatus, { 
  label: string; 
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
}> = {
  pending: { 
    label: "待签", 
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    dotColor: "bg-amber-500",
  },
  signed: { 
    label: "已签", 
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
    dotColor: "bg-emerald-500",
  },
  expired: { 
    label: "已到期", 
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-300",
    dotColor: "bg-rose-500",
  },
  terminated: { 
    label: "已终止", 
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-300",
    dotColor: "bg-slate-500",
  },
};

// 兼容后端可能返回的 draft 状态
const normalizeStatus = (status: string): ContractStatus => {
  if (status === "draft") return "pending"; // 草稿视为待签
  return status as ContractStatus;
};

export default function ContractsPage() {
  const router = useRouter();
  const tabs = useTabs();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterType>("pending"); // 默认显示待签

  // 获取合同列表
  useEffect(() => {
    const controller = new AbortController();
    fetchContracts(controller.signal);
    return () => controller.abort();
  }, []);

  const fetchContracts = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await fetch("/api/settlement/contracts", { signal });
      if (!response.ok) throw new Error("获取合同列表失败");
      const result = await response.json();
      // 标准化状态
      const normalizedData = (result.data || []).map((c: Contract) => ({
        ...c,
        status: normalizeStatus(c.status),
      }));
      setContracts(normalizedData);
      setError(null);
    } catch (err) {
      // 忽略 AbortError
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.error("获取合同列表失败:", err);
      setError(err instanceof Error ? err.message : "获取合同列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 过滤合同列表
  const filteredContracts = contracts.filter((c) => {
    // 即将到期筛选
    if (statusFilter === "expiring_soon") {
      return isExpiringSoon(c);
    }
    // 状态筛选
    if (c.status !== statusFilter) {
      return false;
    }
    // 关键词搜索
    if (!searchKeyword) return true;
    return (
      (c.enterpriseName && c.enterpriseName.includes(searchKeyword)) ||
      (c.contractNo && c.contractNo.includes(searchKeyword)) ||
      (c.contractName && c.contractName.includes(searchKeyword))
    );
  });

  // 统计数据
  const stats = {
    pending: contracts.filter((c) => c.status === "pending").length,
    signed: contracts.filter((c) => c.status === "signed").length,
    expired: contracts.filter((c) => c.status === "expired").length,
    expiringSoon: contracts.filter((c) => isExpiringSoon(c)).length,
  };

  // 清除过滤条件
  const clearFilters = () => {
    setSearchKeyword("");
    setStatusFilter("pending");
  };

  // 加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          重新加载
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">合同管理</h1>
          <p className="text-muted-foreground mt-1">管理企业入驻合同</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => {
              if (tabs) {
                tabs.openTab({
                  id: "contract-templates",
                  label: "模板配置",
                  path: "/dashboard/base/contracts/templates",
                  icon: <Palette className="h-3.5 w-3.5" />,
                });
              } else {
                router.push("/dashboard/base/contracts/templates");
              }
            }}
          >
            <Palette className="h-4 w-4 mr-2" />
            模板配置
          </Button>
          <Button onClick={() => {
            if (tabs) {
              tabs.openTab({
                id: "new-contract",
                label: "新建合同",
                path: "/dashboard/base/contracts/new",
                icon: <Plus className="h-3.5 w-3.5" />,
              });
            } else {
              router.push("/dashboard/base/contracts/new");
            }
          }}>
            <Plus className="h-4 w-4 mr-2" />
            新建合同
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {/* 待签 */}
        <Card 
          className={cn(
            "cursor-pointer hover:shadow-md transition-shadow",
            statusFilter === "pending" && "ring-2 ring-amber-400"
          )}
          onClick={() => setStatusFilter("pending")}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">待签</p>
                <p className={cn("text-2xl font-semibold", statusConfig.pending.color)}>{stats.pending}</p>
              </div>
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", statusConfig.pending.bgColor)}>
                <Clock className={cn("h-5 w-5", statusConfig.pending.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 已签 */}
        <Card 
          className={cn(
            "cursor-pointer hover:shadow-md transition-shadow",
            statusFilter === "signed" && "ring-2 ring-emerald-400"
          )}
          onClick={() => setStatusFilter("signed")}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已签</p>
                <p className={cn("text-2xl font-semibold", statusConfig.signed.color)}>{stats.signed}</p>
              </div>
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", statusConfig.signed.bgColor)}>
                <CheckCircle2 className={cn("h-5 w-5", statusConfig.signed.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 即将到期 */}
        <Card 
          className={cn(
            "cursor-pointer hover:shadow-md transition-shadow",
            statusFilter === "expiring_soon" && "ring-2 ring-orange-400"
          )}
          onClick={() => setStatusFilter("expiring_soon")}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">即将到期</p>
                <p className="text-2xl font-semibold text-orange-600">{stats.expiringSoon}</p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-50">
                <Timer className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 已到期 */}
        <Card 
          className={cn(
            "cursor-pointer hover:shadow-md transition-shadow",
            statusFilter === "expired" && "ring-2 ring-rose-400"
          )}
          onClick={() => setStatusFilter("expired")}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已到期</p>
                <p className={cn("text-2xl font-semibold", statusConfig.expired.color)}>{stats.expired}</p>
              </div>
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", statusConfig.expired.bgColor)}>
                <AlertCircle className={cn("h-5 w-5", statusConfig.expired.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索栏和过滤状态 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索合同编号、企业名称..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-9"
          />
        </div>
        {(statusFilter !== "pending" || searchKeyword) && (
          <div className="flex items-center gap-2">
            {statusFilter !== "pending" && (
              <Badge className={cn(
                "gap-1 border",
                statusFilter === "expiring_soon" 
                  ? "bg-orange-50 text-orange-600 border-orange-200" 
                  : cn(statusConfig[statusFilter as ContractStatus].bgColor, statusConfig[statusFilter as ContractStatus].color, statusConfig[statusFilter as ContractStatus].borderColor)
              )}>
                {statusFilter === "expiring_soon" ? "即将到期 (30天内)" : `${statusConfig[statusFilter as ContractStatus].label}`}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatusFilter("pending");
                  }}
                />
              </Badge>
            )}
            {searchKeyword && (
              <Badge variant="secondary" className="gap-1">
                搜索: {searchKeyword}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchKeyword("");
                  }}
                />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              清除筛选
            </Button>
          </div>
        )}
      </div>

      {/* 合同列表 */}
      {filteredContracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <FileSignature className="h-12 w-12 mb-4" />
          <p>
            {statusFilter === "expiring_soon" 
              ? "暂无30天内即将到期的合同" 
              : `暂无${statusConfig[statusFilter as ContractStatus].label}状态的合同`}
          </p>
          {statusFilter === "pending" && (
            <Button variant="outline" className="mt-4" onClick={() => {
              if (tabs) {
                tabs.openTab({
                  id: "new-contract",
                  label: "新建合同",
                  path: "/dashboard/base/contracts/new",
                  icon: <Plus className="h-3.5 w-3.5" />,
                });
              } else {
                router.push("/dashboard/base/contracts/new");
              }
            }}>
              <Plus className="h-4 w-4 mr-2" />
              新建合同
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {filteredContracts.map((contract) => {
            const statusInfo = statusConfig[contract.status];
            return (
              <div
                key={contract.id}
                className="p-4 hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-between"
                onClick={() => {
                  if (tabs) {
                    tabs.openTab({
                      id: `contract-${contract.id}`,
                      label: contract.contractName || contract.enterpriseName || "合同详情",
                      path: `/dashboard/base/contracts/${contract.id}`,
                      icon: <Eye className="h-3.5 w-3.5" />,
                    });
                  } else {
                    router.push(`/dashboard/base/contracts/${contract.id}`);
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", statusInfo.bgColor)}>
                    <FileText className={cn("h-6 w-6", statusInfo.color)} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{contract.contractName || contract.enterpriseName || "未命名合同"}</span>
                      <Badge className={cn("font-normal border", statusInfo.bgColor, statusInfo.color, statusInfo.borderColor)}>
                        {statusInfo.label}
                      </Badge>
                      {isExpiringSoon(contract) && (
                        <Badge className="font-normal border bg-orange-50 text-orange-600 border-orange-200">
                          <Timer className="h-3 w-3 mr-1" />
                          即将到期
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="font-mono">{contract.contractNo || "-"}</span>
                      {contract.contractType && (
                        <span className="text-amber-600">{contract.contractType}</span>
                      )}
                      {contract.startDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {contract.startDate} ~ {contract.endDate || "长期"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    查看
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
