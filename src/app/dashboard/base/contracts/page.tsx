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
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// 类型定义
type ContractStatus = "draft" | "pending" | "signed" | "expired" | "terminated";

interface Contract {
  id: string;
  enterpriseName: string | null;
  contractNo: string | null;
  contractName: string | null;
  startDate: string | null;
  endDate: string | null;
  status: ContractStatus;
  createdAt: string;
}

// 状态配置
const statusConfig: Record<ContractStatus, { label: string; className: string }> = {
  draft: { label: "草稿", className: "bg-slate-50 text-slate-600 border-slate-200" },
  pending: { label: "待签", className: "bg-amber-50 text-amber-600 border-amber-200" },
  signed: { label: "已签", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  expired: { label: "已到期", className: "bg-red-50 text-red-600 border-red-200" },
  terminated: { label: "已终止", className: "bg-slate-50 text-slate-600 border-slate-200" },
};

export default function ContractsPage() {
  const router = useRouter();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "all">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // 删除确认弹窗状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);

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
      setContracts(result.data || []);
      setError(null);
    } catch (err) {
      console.error("获取合同列表失败:", err);
      setError(err instanceof Error ? err.message : "获取合同列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 打开删除确认弹窗
  const openDeleteDialog = (e: React.MouseEvent, contract: Contract) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发查看详情
    setContractToDelete(contract);
    setDeleteDialogOpen(true);
  };

  // 确认删除
  const confirmDelete = async () => {
    if (!contractToDelete) return;

    setDeletingId(contractToDelete.id);
    try {
      const response = await fetch(`/api/settlement/contracts/${contractToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("删除失败");

      toast.success("合同已删除");
      // 从列表中移除
      setContracts((prev) => prev.filter((c) => c.id !== contractToDelete.id));
      setDeleteDialogOpen(false);
      setContractToDelete(null);
    } catch (error) {
      console.error("删除失败:", error);
      toast.error("删除失败");
    } finally {
      setDeletingId(null);
    }
  };

  // 过滤合同列表
  const filteredContracts = contracts.filter((c) => {
    // 状态过滤
    if (statusFilter !== "all" && c.status !== statusFilter) {
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
    total: contracts.length,
    draft: contracts.filter((c) => c.status === "draft").length,
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
      <div className="grid grid-cols-5 gap-4">
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
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={cn(
            "cursor-pointer hover:shadow-md transition-shadow",
            statusFilter === "draft" && "ring-2 ring-primary"
          )}
          onClick={() => setStatusFilter("draft")}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">草稿</p>
                <p className="text-2xl font-semibold">{stats.draft}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-slate-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={cn(
            "cursor-pointer hover:shadow-md transition-shadow",
            statusFilter === "pending" && "ring-2 ring-primary"
          )}
          onClick={() => setStatusFilter("pending")}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">待签</p>
                <p className="text-2xl font-semibold">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={cn(
            "cursor-pointer hover:shadow-md transition-shadow",
            statusFilter === "signed" && "ring-2 ring-primary"
          )}
          onClick={() => setStatusFilter("signed")}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已签</p>
                <p className="text-2xl font-semibold">{stats.signed}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={cn(
            "cursor-pointer hover:shadow-md transition-shadow",
            statusFilter === "expired" && "ring-2 ring-primary"
          )}
          onClick={() => setStatusFilter("expired")}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已到期</p>
                <p className="text-2xl font-semibold">{stats.expired}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-500" />
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
        {/* 显示当前过滤条件 */}
        {(statusFilter !== "all" || searchKeyword) && (
          <div className="flex items-center gap-2">
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
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
          <FileText className="h-12 w-12 mb-4" />
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
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{contract.contractName || contract.enterpriseName || "未命名合同"}</span>
                      <Badge variant="outline" className={cn("font-normal", statusInfo.className)}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="font-mono">{contract.contractNo || "-"}</span>
                      {contract.enterpriseName && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {contract.enterpriseName}
                        </span>
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
                {/* 操作区 */}
                <div className="flex items-center gap-2">
                  {contract.status === "draft" && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => openDeleteDialog(e, contract)}
                      disabled={deletingId === contract.id}
                    >
                      {deletingId === contract.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
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

      {/* 删除确认弹窗 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除合同「{contractToDelete?.contractName || contractToDelete?.contractNo || "未命名合同"}」吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={!!deletingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  删除中...
                </>
              ) : (
                "确认删除"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
