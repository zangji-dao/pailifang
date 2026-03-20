"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Loader2,
  AlertCircle,
  Building2,
  Phone,
  User,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  FileText,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// 类型定义
type ApprovalStatus = "draft" | "pending" | "approved" | "rejected";
type ApplicationType = "new" | "migration";

interface Application {
  id: string;
  applicationNo: string;
  applicationDate: string | null;
  enterpriseName: string;
  enterpriseNameBackups: string[] | null;
  applicationType: ApplicationType;
  approvalStatus: ApprovalStatus;
  approvedAt: string | null;
  rejectionReason: string | null;
  assignedAddress: string | null;
  legalPersonName: string | null;
  legalPersonPhone: string | null;
  contactPersonName: string | null;
  contactPersonPhone: string | null;
  registeredCapital: string | null;
  businessScope: string | null;
  businessTerm: string | null;
  createdAt: string;
  status: string;
}

// 状态配置
const statusConfig: Record<ApprovalStatus, { label: string; className: string }> = {
  draft: { label: "草稿", className: "bg-gray-50 text-gray-600 border-gray-200" },
  pending: { label: "待审批", className: "bg-amber-50 text-amber-600 border-amber-200" },
  approved: { label: "已通过", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  rejected: { label: "已驳回", className: "bg-red-50 text-red-600 border-red-200" },
};

const applicationTypeConfig: Record<ApplicationType, { label: string; className: string }> = {
  new: { label: "新建企业", className: "bg-purple-50 text-purple-600 border-purple-200" },
  migration: { label: "迁移企业", className: "bg-orange-50 text-orange-600 border-orange-200" },
};

export default function ApprovalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending"); // 默认显示待审批

  // 详情和审批相关状态
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // 驳回弹窗
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // 获取申请列表
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settlement/applications");
      if (!response.ok) {
        throw new Error("获取申请列表失败");
      }
      const result = await response.json();
      setApplications(result.data || []);
      setError(null);
    } catch (err) {
      console.error("获取申请列表失败:", err);
      setError(err instanceof Error ? err.message : "获取申请列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // 过滤申请列表
  const filteredApplications = applications.filter((app) => {
    const matchStatus = statusFilter === "all" || app.approvalStatus === statusFilter;
    const matchKeyword =
      !searchKeyword ||
      app.enterpriseName.includes(searchKeyword) ||
      app.applicationNo.includes(searchKeyword) ||
      (app.legalPersonName && app.legalPersonName.includes(searchKeyword));
    return matchStatus && matchKeyword;
  });

  // 统计数据
  const stats = {
    pending: applications.filter((a) => a.approvalStatus === "pending").length,
    approved: applications.filter((a) => a.approvalStatus === "approved").length,
    rejected: applications.filter((a) => a.approvalStatus === "rejected").length,
  };

  // 查看申请详情
  const handleViewDetail = (app: Application) => {
    setSelectedApp(app);
  };

  // 审批通过
  const handleApprove = async () => {
    if (!selectedApp) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/applications/${selectedApp.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("审批通过");
        setSelectedApp(null);
        fetchApplications();
      } else {
        toast.error(result.error || "审批失败");
      }
    } catch (err) {
      console.error("审批失败:", err);
      toast.error("审批失败");
    } finally {
      setActionLoading(false);
    }
  };

  // 驳回申请
  const handleReject = async () => {
    if (!selectedApp || !rejectReason.trim()) {
      toast.error("请填写驳回原因");
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/applications/${selectedApp.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: rejectReason }),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("已驳回申请");
        setRejectDialogOpen(false);
        setRejectReason("");
        setSelectedApp(null);
        fetchApplications();
      } else {
        toast.error(result.error || "驳回失败");
      }
    } catch (err) {
      console.error("驳回失败:", err);
      toast.error("驳回失败");
    } finally {
      setActionLoading(false);
    }
  };

  // 加载状态
  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
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
        <Button variant="outline" onClick={fetchApplications}>
          重新加载
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      {/* 左侧：申请列表 */}
      <div className="w-1/2 flex flex-col border rounded-lg bg-card overflow-hidden">
        {/* 标题和筛选 */}
        <div className="shrink-0 p-4 border-b space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">入驻审批</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                审批企业入驻申请
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-amber-600 font-medium">{stats.pending}</span>
              <span className="text-muted-foreground">待审批</span>
            </div>
          </div>

          {/* 筛选器 */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索企业名称、编号..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-center gap-1">
              {[
                { value: "pending", label: "待审批", count: stats.pending },
                { value: "approved", label: "已通过", count: stats.approved },
                { value: "rejected", label: "已驳回", count: stats.rejected },
              ].map((item) => (
                <Button
                  key={item.value}
                  size="sm"
                  variant={statusFilter === item.value ? "default" : "ghost"}
                  onClick={() => setStatusFilter(item.value)}
                  className="gap-1"
                >
                  {item.label}
                  {item.count > 0 && (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-xs",
                      statusFilter === item.value ? "bg-primary-foreground/20" : "bg-muted"
                    )}>
                      {item.count}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* 申请列表 */}
        <div className="flex-1 overflow-y-auto">
          {filteredApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                {statusFilter === "pending" ? "暂无待审批申请" : "暂无申请记录"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredApplications.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleViewDetail(app)}
                  className={cn(
                    "w-full p-4 text-left hover:bg-muted/50 transition-colors",
                    selectedApp?.id === app.id && "bg-muted/50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{app.enterpriseName}</span>
                        <Badge variant="outline" className={cn("font-normal shrink-0", applicationTypeConfig[app.applicationType].className)}>
                          {applicationTypeConfig[app.applicationType].label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-mono">{app.applicationNo}</span>
                        {app.legalPersonName && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {app.legalPersonName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("font-normal", statusConfig[app.approvalStatus].className)}>
                        {statusConfig[app.approvalStatus].label}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 右侧：详情和审批 */}
      <div className="w-1/2 border rounded-lg bg-card overflow-hidden">
        {selectedApp ? (
          <div className="h-full flex flex-col">
            {/* 详情头部 */}
            <div className="shrink-0 p-4 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{selectedApp.enterpriseName}</h2>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span className="font-mono">{selectedApp.applicationNo}</span>
                    <Badge variant="outline" className={cn("font-normal", statusConfig[selectedApp.approvalStatus].className)}>
                      {statusConfig[selectedApp.approvalStatus].label}
                    </Badge>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(selectedApp.createdAt).toLocaleDateString("zh-CN")}
                  </div>
                </div>
              </div>
            </div>

            {/* 详情内容 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* 基本信息 */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">基本信息</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">类型：</span>
                    <span>{applicationTypeConfig[selectedApp.applicationType].label}</span>
                  </div>
                  {selectedApp.registeredCapital && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">注册资本：</span>
                      <span>{selectedApp.registeredCapital} 万元</span>
                    </div>
                  )}
                  {selectedApp.businessTerm && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">经营期限：</span>
                      <span>{selectedApp.businessTerm}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 联系信息 */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">联系信息</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {selectedApp.legalPersonName && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">法人：</span>
                      <span>{selectedApp.legalPersonName}</span>
                    </div>
                  )}
                  {selectedApp.legalPersonPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">电话：</span>
                      <span>{selectedApp.legalPersonPhone}</span>
                    </div>
                  )}
                  {selectedApp.contactPersonName && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">联系人：</span>
                      <span>{selectedApp.contactPersonName}</span>
                    </div>
                  )}
                  {selectedApp.contactPersonPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">联系电话：</span>
                      <span>{selectedApp.contactPersonPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 经营范围 */}
              {selectedApp.businessScope && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">经营范围</h3>
                  <p className="text-sm">{selectedApp.businessScope}</p>
                </div>
              )}

              {/* 驳回原因 */}
              {selectedApp.approvalStatus === "rejected" && selectedApp.rejectionReason && (
                <div className="space-y-2 p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                    <XCircle className="h-4 w-4" />
                    驳回原因
                  </div>
                  <p className="text-sm text-red-700">{selectedApp.rejectionReason}</p>
                </div>
              )}

              {/* 审批通过信息 */}
              {selectedApp.approvalStatus === "approved" && selectedApp.approvedAt && (
                <div className="space-y-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                    <CheckCircle className="h-4 w-4" />
                    审批通过
                  </div>
                  <p className="text-sm text-emerald-700">
                    {new Date(selectedApp.approvedAt).toLocaleString("zh-CN")}
                  </p>
                </div>
              )}
            </div>

            {/* 审批操作 */}
            {selectedApp.approvalStatus === "pending" && (
              <div className="shrink-0 p-4 border-t bg-muted/30">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setRejectDialogOpen(true)}
                    disabled={actionLoading}
                  >
                    <XCircle className="h-4 w-4" />
                    驳回
                  </Button>
                  <Button
                    className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleApprove}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    审批通过
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <ChevronRight className="h-12 w-12 mb-3 opacity-50" />
            <p>选择一个申请查看详情</p>
          </div>
        )}
      </div>

      {/* 驳回弹窗 */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>驳回申请</DialogTitle>
            <DialogDescription>
              请填写驳回原因，申请人将看到此信息并可以修改后重新提交。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="请输入驳回原因..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason("");
              }}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              确认驳回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
