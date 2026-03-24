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
  Building2,
  Calendar,
  X,
  FileSignature,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// 类型定义
type ContractStatus = "pending" | "signed" | "expired" | "terminated";

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

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "all">("all");

  // 获取合同列表
  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settlement/contracts");
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
      console.error("获取合同列表失败:", err);
      setError(err instanceof Error ? err.message : "获取合同列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 过滤合同列表
  const filteredContracts = contracts.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) {
      return false;
    }
    if (!searchKeyword) return true;
    return (
      (c.enterpriseName && c.enterpriseName.includes(searchKeyword)) ||
      (c.contractNo && c.contractNo.includes(searchKeyword)) ||
      (c.contractName && c.contractName.includes(searchKeyword))
    );
  });

  // 统计数据
  const stats = {
    total: contracts.length,
    pending: contracts.filter((c) => c.status === "pending").length,
    signed: contracts.filter((c) => c.status === "signed").length,
    expired: contracts.filter((c) => c.status === "expired").length,
  };

  // 清除过滤条件
  const clearFilters = () => {
    setSearchKeyword("");
    setStatusFilter("all");
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
        <Button onClick={() => router.push("/dashboard/base/contracts/new")}>
          <Plus className="h-4 w-4 mr-2" />
          新建合同
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card 
          className={cn(
            "cursor-pointer hover:shadow-md transition-shadow", 
            statusFilter === "all" && "ring-2 ring-primary"
          )}
          onClick={() => setStatusFilter("all")}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">合同总数</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", "bg-muted")}>
                <FileSignature className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        
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
        {(statusFilter !== "all" || searchKeyword) && (
          <div className="flex items-center gap-2">
            {statusFilter !== "all" && (
              <Badge className={cn("gap-1 border", statusConfig[statusFilter].bgColor, statusConfig[statusFilter].color, statusConfig[statusFilter].borderColor)}>
                状态: {statusConfig[statusFilter].label}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatusFilter("all");
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
          <p>{statusFilter !== "all" ? `暂无${statusConfig[statusFilter].label}状态的合同` : "暂无合同"}</p>
          {statusFilter === "all" && (
            <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/base/contracts/new")}>
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
                onClick={() => router.push(`/dashboard/base/contracts/${contract.id}`)}
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
