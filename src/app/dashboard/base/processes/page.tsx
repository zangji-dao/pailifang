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
    <div className="flex h-[calc(100vh-7rem)] gap-6">
      {/* 左侧：申请列表 */}
      <div className="w-[55%] flex flex-col border-0 rounded-2xl bg-gradient-to-br from-white to-slate-50/50 shadow-lg overflow-hidden">
        {/* 标题和筛选 */}
        <div className="shrink-0 p-6 border-b border-slate-100 space-y-5 bg-gradient-to-r from-slate-50/80 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                入驻审批
              </h1>
              <p className="text-sm text-slate-500 mt-1.5">
                审批企业入驻申请
              </p>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full border border-amber-100">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm font-semibold text-amber-700">{stats.pending}</span>
              <span className="text-sm text-amber-600/80">待审批</span>
            </div>
          </div>

          {/* 筛选器 */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
              <input
                type="text"
                placeholder="搜索企业名称、编号..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent transition-all"
              />
            </div>
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
              {[
                { value: "pending", label: "待审批", count: stats.pending, color: "amber" },
                { value: "approved", label: "已通过", count: stats.approved, color: "emerald" },
                { value: "rejected", label: "已驳回", count: stats.rejected, color: "red" },
              ].map((item) => (
                <Button
                  key={item.value}
                  size="sm"
                  variant={statusFilter === item.value ? "default" : "ghost"}
                  onClick={() => setStatusFilter(item.value)}
                  className={cn(
                    "gap-1.5 px-4 rounded-lg transition-all",
                    statusFilter === item.value && "shadow-md"
                  )}
                >
                  {item.label}
                  {item.count > 0 && (
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-semibold",
                      statusFilter === item.value 
                        ? "bg-white/20 text-white" 
                        : item.color === "amber" 
                          ? "bg-amber-100 text-amber-700"
                          : item.color === "emerald"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
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
        <div className="flex-1 overflow-y-auto p-4">
          {filteredApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">
                {statusFilter === "pending" ? "暂无待审批申请" : "暂无申请记录"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApplications.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleViewDetail(app)}
                  className={cn(
                    "w-full p-5 text-left rounded-xl border-2 transition-all duration-200",
                    selectedApp?.id === app.id 
                      ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md" 
                      : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-slate-900 truncate text-base">{app.enterpriseName}</span>
                        <Badge variant="outline" className={cn("font-medium shrink-0 border", applicationTypeConfig[app.applicationType].className)}>
                          {applicationTypeConfig[app.applicationType].label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{app.applicationNo}</span>
                        {app.legalPersonName && (
                          <span className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            {app.legalPersonName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("font-medium border", statusConfig[app.approvalStatus].className)}>
                        {statusConfig[app.approvalStatus].label}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 右侧：详情和审批 */}
      <div className="w-[45%] border-0 rounded-2xl bg-gradient-to-br from-white to-slate-50/50 shadow-lg overflow-hidden">
        {selectedApp ? (
          <div className="h-full flex flex-col">
            {/* 详情头部 */}
            <div className="shrink-0 p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-transparent">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      {selectedApp.enterpriseName}
                    </h2>
                    <Badge variant="outline" className={cn("font-medium border", statusConfig[selectedApp.approvalStatus].className)}>
                      {statusConfig[selectedApp.approvalStatus].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{selectedApp.applicationNo}</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(selectedApp.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 详情内容 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 基本信息 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-1 h-4 bg-blue-500 rounded-full" />
                  基本信息
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm bg-white rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">类型</span>
                    <span className="font-medium text-slate-900">{applicationTypeConfig[selectedApp.applicationType].label}</span>
                  </div>
                  {selectedApp.registeredCapital && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">注册资本</span>
                      <span className="font-semibold text-blue-600">{selectedApp.registeredCapital} 万元</span>
                    </div>
                  )}
                  {selectedApp.businessTerm && (
                    <div className="flex items-center gap-2 col-span-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-500">经营期限</span>
                      <span className="font-medium text-slate-900">{selectedApp.businessTerm}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 联系信息 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                  联系信息
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm bg-white rounded-xl p-4 border border-slate-100">
                  {selectedApp.legalPersonName && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-500">法人</span>
                      <span className="font-medium text-slate-900">{selectedApp.legalPersonName}</span>
                    </div>
                  )}
                  {selectedApp.legalPersonPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-500">电话</span>
                      <span className="font-mono text-slate-900">{selectedApp.legalPersonPhone}</span>
                    </div>
                  )}
                  {selectedApp.contactPersonName && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-500">联系人</span>
                      <span className="font-medium text-slate-900">{selectedApp.contactPersonName}</span>
                    </div>
                  )}
                  {selectedApp.contactPersonPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-500">联系电话</span>
                      <span className="font-mono text-slate-900">{selectedApp.contactPersonPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 经营范围 */}
              {selectedApp.businessScope && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <div className="w-1 h-4 bg-violet-500 rounded-full" />
                    经营范围
                  </h3>
                  <div className="text-sm bg-white rounded-xl p-4 border border-slate-100 leading-relaxed text-slate-700">
                    {selectedApp.businessScope}
                  </div>
                </div>
              )}

              {/* 驳回原因 */}
              {selectedApp.approvalStatus === "rejected" && selectedApp.rejectionReason && (
                <div className="space-y-3 p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200">
                  <div className="flex items-center gap-2 text-red-600 text-sm font-semibold">
                    <XCircle className="h-4 w-4" />
                    驳回原因
                  </div>
                  <p className="text-sm text-red-700 leading-relaxed">{selectedApp.rejectionReason}</p>
                </div>
              )}

              {/* 审批通过信息 */}
              {selectedApp.approvalStatus === "approved" && selectedApp.approvedAt && (
                <div className="space-y-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
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
              <div className="shrink-0 p-5 border-t border-slate-100 bg-gradient-to-r from-slate-50/80 to-transparent">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 shadow-sm"
                    onClick={() => setRejectDialogOpen(true)}
                    disabled={actionLoading}
                  >
                    <XCircle className="h-4 w-4" />
                    驳回
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-md"
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
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <ChevronRight className="h-10 w-10 text-slate-300" />
            </div>
            <p className="text-sm font-medium">选择一个申请查看详情</p>
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
