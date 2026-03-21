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
  MapPin,
  FileText,
  PenTool,
  CreditCard,
  CheckCircle,
  LogOut,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// 企业流程状态
type ProcessStatus = 
  | "new" // 新建
  | "pending_address" // 待分配地址
  | "pending_business" // 待工商注册及变更完成
  | "pending_contract" // 待签合同
  | "pending_payment" // 待缴费
  | "active" // 入驻中
  | "moved_out"; // 已迁出

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

// 流程状态配置
const processStatusConfig: Record<ProcessStatus, { 
  label: string; 
  color: string; 
  bgColor: string;
  borderColor: string;
  dotColor: string;
  icon: React.ElementType;
}> = {
  new: { 
    label: "新建", 
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    dotColor: "bg-blue-500",
    icon: Plus,
  },
  pending_address: { 
    label: "待分配地址", 
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    dotColor: "bg-orange-500",
    icon: MapPin,
  },
  pending_business: { 
    label: "待工商注册", 
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-300",
    dotColor: "bg-purple-500",
    icon: FileText,
  },
  pending_contract: { 
    label: "待签合同", 
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-300",
    dotColor: "bg-cyan-500",
    icon: PenTool,
  },
  pending_payment: { 
    label: "待缴费", 
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    dotColor: "bg-amber-500",
    icon: CreditCard,
  },
  active: { 
    label: "入驻中", 
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
    dotColor: "bg-emerald-500",
    icon: CheckCircle,
  },
  moved_out: { 
    label: "已迁出", 
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-300",
    dotColor: "bg-slate-500",
    icon: LogOut,
  },
};

// 企业状态配置（用于兼容旧数据）
const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "正常", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  inactive: { label: "注销", className: "bg-slate-50 text-slate-600 border-slate-200" },
  pending: { label: "待审核", className: "bg-amber-50 text-amber-600 border-amber-200" },
};

export default function EnterpriseListPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProcessStatus | null>(null);

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

  // 过滤企业列表
  const filteredEnterprises = enterprises.filter((e) => {
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

  // 统计各状态数量
  const stats = {
    total: enterprises.length,
    new: enterprises.filter((e) => e.processStatus === "new" || (!e.processStatus && e.type === "non_tenant")).length,
    pending_address: enterprises.filter((e) => e.processStatus === "pending_address").length,
    pending_business: enterprises.filter((e) => e.processStatus === "pending_business").length,
    pending_contract: enterprises.filter((e) => e.processStatus === "pending_contract").length,
    pending_payment: enterprises.filter((e) => e.processStatus === "pending_payment").length,
    active: enterprises.filter((e) => e.processStatus === "active" || (!e.processStatus && e.status === "active")).length,
    moved_out: enterprises.filter((e) => e.processStatus === "moved_out").length,
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
      {/* 页面标题 */}
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          企业管理
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          管理入驻企业和非入驻企业
        </p>
      </div>

      {/* 分割线 */}
      <div className="border-b" />

      {/* 统计卡片区域 */}
      <div className="py-6">
        <div className="flex gap-4">
          {/* 新建企业按钮 */}
          <button
            onClick={() => router.push("/dashboard/base/tenants/create")}
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary px-6 py-4 transition-all hover:bg-primary/5 min-w-[140px]"
          >
            <Plus className="h-8 w-8 text-primary mb-2" />
            <span className="text-sm font-medium text-primary">新建企业</span>
          </button>

          {/* 流程状态统计 */}
          <div className="flex-1">
            <div className="text-sm font-medium text-muted-foreground mb-3">流程状态</div>
            <div className="grid grid-cols-7 gap-2">
              {/* 新建 */}
              <button
                onClick={() => setStatusFilter(statusFilter === "new" ? null : "new")}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-2 py-2 transition-all",
                  statusFilter === "new" 
                    ? `${processStatusConfig.new.borderColor} ${processStatusConfig.new.bgColor}` 
                    : "border-border hover:border-blue-300 hover:bg-blue-50/50"
                )}
              >
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">新建</div>
                  <div className={cn("text-lg font-semibold", statusFilter === "new" ? processStatusConfig.new.color : "text-foreground")}>{stats.new}</div>
                </div>
                <div className={cn("w-2 h-2 rounded-full", processStatusConfig.new.dotColor)} />
              </button>

              {/* 待分配地址 */}
              <button
                onClick={() => setStatusFilter(statusFilter === "pending_address" ? null : "pending_address")}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-2 py-2 transition-all",
                  statusFilter === "pending_address" 
                    ? `${processStatusConfig.pending_address.borderColor} ${processStatusConfig.pending_address.bgColor}` 
                    : "border-border hover:border-orange-300 hover:bg-orange-50/50"
                )}
              >
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">待分配</div>
                  <div className={cn("text-lg font-semibold", statusFilter === "pending_address" ? processStatusConfig.pending_address.color : "text-foreground")}>{stats.pending_address}</div>
                </div>
                <div className={cn("w-2 h-2 rounded-full", processStatusConfig.pending_address.dotColor)} />
              </button>

              {/* 待工商注册 */}
              <button
                onClick={() => setStatusFilter(statusFilter === "pending_business" ? null : "pending_business")}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-2 py-2 transition-all",
                  statusFilter === "pending_business" 
                    ? `${processStatusConfig.pending_business.borderColor} ${processStatusConfig.pending_business.bgColor}` 
                    : "border-border hover:border-purple-300 hover:bg-purple-50/50"
                )}
              >
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">待工商</div>
                  <div className={cn("text-lg font-semibold", statusFilter === "pending_business" ? processStatusConfig.pending_business.color : "text-foreground")}>{stats.pending_business}</div>
                </div>
                <div className={cn("w-2 h-2 rounded-full", processStatusConfig.pending_business.dotColor)} />
              </button>

              {/* 待签合同 */}
              <button
                onClick={() => setStatusFilter(statusFilter === "pending_contract" ? null : "pending_contract")}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-2 py-2 transition-all",
                  statusFilter === "pending_contract" 
                    ? `${processStatusConfig.pending_contract.borderColor} ${processStatusConfig.pending_contract.bgColor}` 
                    : "border-border hover:border-cyan-300 hover:bg-cyan-50/50"
                )}
              >
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">待签合同</div>
                  <div className={cn("text-lg font-semibold", statusFilter === "pending_contract" ? processStatusConfig.pending_contract.color : "text-foreground")}>{stats.pending_contract}</div>
                </div>
                <div className={cn("w-2 h-2 rounded-full", processStatusConfig.pending_contract.dotColor)} />
              </button>

              {/* 待缴费 */}
              <button
                onClick={() => setStatusFilter(statusFilter === "pending_payment" ? null : "pending_payment")}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-2 py-2 transition-all",
                  statusFilter === "pending_payment" 
                    ? `${processStatusConfig.pending_payment.borderColor} ${processStatusConfig.pending_payment.bgColor}` 
                    : "border-border hover:border-amber-300 hover:bg-amber-50/50"
                )}
              >
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">待缴费</div>
                  <div className={cn("text-lg font-semibold", statusFilter === "pending_payment" ? processStatusConfig.pending_payment.color : "text-foreground")}>{stats.pending_payment}</div>
                </div>
                <div className={cn("w-2 h-2 rounded-full", processStatusConfig.pending_payment.dotColor)} />
              </button>

              {/* 入驻中 */}
              <button
                onClick={() => setStatusFilter(statusFilter === "active" ? null : "active")}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-2 py-2 transition-all",
                  statusFilter === "active" 
                    ? `${processStatusConfig.active.borderColor} ${processStatusConfig.active.bgColor}` 
                    : "border-border hover:border-emerald-300 hover:bg-emerald-50/50"
                )}
              >
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">入驻中</div>
                  <div className={cn("text-lg font-semibold", statusFilter === "active" ? processStatusConfig.active.color : "text-foreground")}>{stats.active}</div>
                </div>
                <CheckCircle className={cn("w-4 h-4", processStatusConfig.active.dotColor.replace('bg-', 'text-'))} />
              </button>

              {/* 已迁出 */}
              <button
                onClick={() => setStatusFilter(statusFilter === "moved_out" ? null : "moved_out")}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-2 py-2 transition-all",
                  statusFilter === "moved_out" 
                    ? `${processStatusConfig.moved_out.borderColor} ${processStatusConfig.moved_out.bgColor}` 
                    : "border-border hover:border-slate-300 hover:bg-slate-50/50"
                )}
              >
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">已迁出</div>
                  <div className={cn("text-lg font-semibold", statusFilter === "moved_out" ? processStatusConfig.moved_out.color : "text-foreground")}>{stats.moved_out}</div>
                </div>
                <LogOut className={cn("w-4 h-4 text-slate-400")} />
              </button>
            </div>
          </div>
        </div>
      </div>

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

      {/* 空状态引导页 - 默认显示 */}
      {statusFilter === null && filteredEnterprises.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <div className="text-muted-foreground mb-2">点击上方「新建企业」创建企业</div>
          <div className="text-sm text-muted-foreground">或点击状态卡片查看已有企业</div>
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
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">类型</th>
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">法人/电话</th>
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">行业</th>
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">流程状态</th>
                <th className="p-4 text-right text-sm font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnterprises.map((enterprise) => {
                const processStatus = enterprise.processStatus || (enterprise.type === "non_tenant" ? "new" : "active");
                const statusInfo = processStatusConfig[processStatus] || processStatusConfig.new;
                const StatusIcon = statusInfo.icon;
                
                return (
                  <tr key={enterprise.id} className="border-b last:border-b-0 hover:bg-muted/50">
                    <td className="p-4">
                      <span className="text-sm font-mono text-primary">{enterprise.enterpriseCode || "-"}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{enterprise.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className={cn(
                        "font-normal",
                        enterprise.type === "tenant" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-green-50 text-green-600 border-green-200"
                      )}>
                        {enterprise.type === "tenant" ? "入驻企业" : "非入驻企业"}
                      </Badge>
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
                        <StatusIcon className="h-3.5 w-3.5" />
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

      {/* 有过滤条件但无结果 */}
      {statusFilter !== null && filteredEnterprises.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-muted-foreground mb-2">该状态下暂无企业</div>
          <Button variant="link" onClick={() => setStatusFilter(null)}>
            查看全部企业
          </Button>
        </div>
      )}
    </div>
  );
}
