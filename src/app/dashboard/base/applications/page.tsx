"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Eye,
  Send,
  Edit,
  Trash2,
  GitBranch,
  Loader2,
  AlertCircle,
  Share2,
  MessageSquareWarning,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTabs } from "@/app/dashboard/tabs-context";
import { useConfirm } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { ShareDialog } from "./_components/ShareDialog";

// 检测是否在微信内
const isWechat = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes("micromessenger");
};

// 检测是否支持 Web Share API
const canWebShare = (): boolean => {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
};

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
  status: string;
  createdAt: string;
}

// 状态配置
const statusConfig: Record<ApprovalStatus, { label: string; className: string }> = {
  draft: { label: "草稿", className: "bg-slate-50 text-slate-600 border-slate-200" },
  pending: { label: "待审批", className: "bg-blue-50 text-blue-600 border-blue-200" },
  approved: { label: "已通过", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  rejected: { label: "已驳回", className: "bg-red-50 text-red-600 border-red-200" },
};

const applicationTypeConfig: Record<ApplicationType, { label: string; className: string }> = {
  new: { label: "新建企业", className: "bg-purple-50 text-purple-600 border-purple-200" },
  migration: { label: "迁移企业", className: "bg-orange-50 text-orange-600 border-orange-200" },
};

export default function ApplicationsPage() {
  const router = useRouter();
  const tabsContext = useTabs();
  const confirm = useConfirm();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null); // 默认不选中，显示引导页

  // 分享相关状态
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [creatingShare, setCreatingShare] = useState(false);
  const [sharingAppId, setSharingAppId] = useState<string | null>(null);

  // 驳回原因弹窗状态
  const [rejectReasonDialogOpen, setRejectReasonDialogOpen] = useState(false);
  const [selectedRejectApp, setSelectedRejectApp] = useState<Application | null>(null);

  // 查看驳回原因
  const handleViewRejectReason = (app: Application) => {
    setSelectedRejectApp(app);
    setRejectReasonDialogOpen(true);
  };

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

  // 打开新建表单（新标签页）
  const handleCreate = () => {
    router.push("/dashboard/base/applications/new");
  };

  // 打开编辑表单（新标签页）
  const handleEdit = (application: Application) => {
    router.push(`/dashboard/base/applications/${application.id}`);
  };

  // 提交审批
  const handleSubmit = async (id: string) => {
    const confirmed = await confirm({
      title: "提交审批",
      description: "确认提交此申请进行审批？",
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/settlement/applications/${id}/submit`, {
        method: "POST",
      });
      const result = await response.json();
      if (result.success) {
        fetchApplications();
        toast.success("申请已提交审批");
      } else {
        toast.error(result.error || "提交失败");
      }
    } catch (err) {
      console.error("提交审批失败:", err);
      toast.error("提交审批失败");
    }
  };

  // 删除申请
  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "删除申请",
      description: "确认删除此申请？删除后无法恢复。",
      variant: "destructive",
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/settlement/applications/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        fetchApplications();
        toast.success("申请已删除");
      } else {
        toast.error(result.error || "删除失败");
      }
    } catch (err) {
      console.error("删除申请失败:", err);
      toast.error("删除申请失败");
    }
  };

  // 查看流程
  const handleViewProcess = (application: Application) => {
    router.push(`/dashboard/base/processes?applicationId=${application.id}`);
  };

  // 转发分享
  const handleShare = async (application: Application) => {
    setCreatingShare(true);
    setSharingAppId(application.id);
    try {
      const response = await fetch("/api/applications/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: application.id }),
      });
      const result = await response.json();

      if (result.success) {
        setShareUrl(result.data.shareUrl);
        setShareDialogOpen(true);
      } else {
        toast.error(result.error || "创建分享链接失败");
      }
    } catch (err) {
      console.error("创建分享链接失败:", err);
      toast.error("创建分享链接失败");
    } finally {
      setCreatingShare(false);
      setSharingAppId(null);
    }
  };

  // 复制分享链接
  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("链接已复制到剪贴板");
  };

  // 过滤申请列表
  const filteredApplications = applications.filter((app) => {
    const matchStatus = statusFilter === "all" || statusFilter === null || app.approvalStatus === statusFilter;
    const matchKeyword =
      !searchKeyword ||
      app.enterpriseName.includes(searchKeyword) ||
      app.applicationNo.includes(searchKeyword) ||
      (app.legalPersonName && app.legalPersonName.includes(searchKeyword));
    return matchStatus && matchKeyword;
  });

  // 统计数据
  const stats = {
    total: applications.length,
    draft: applications.filter((a) => a.approvalStatus === "draft").length,
    pending: applications.filter((a) => a.approvalStatus === "pending").length,
    approved: applications.filter((a) => a.approvalStatus === "approved").length,
    rejected: applications.filter((a) => a.approvalStatus === "rejected").length,
  };

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
          入驻申请
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          填写入园审批表，管理企业入驻申请
        </p>
      </div>

      {/* 分割线 */}
      <div className="border-b" />

      {/* 统计卡片区域 */}
      <div className="py-6">
        <div className="text-sm font-medium text-muted-foreground mb-4">申请状态概览</div>
        <div className="grid grid-cols-4 gap-4">
          <button
            onClick={() => setStatusFilter(statusFilter === "draft" ? null : "draft")}
            className={cn(
              "group flex items-center justify-between rounded-lg px-4 py-3 transition-all",
              "hover:bg-muted/50",
              statusFilter === "draft" && "bg-muted/50"
            )}
          >
            <div className="text-left">
              <div className="text-sm text-muted-foreground">草稿</div>
              <div className="text-2xl font-semibold mt-0.5 text-slate-700">{stats.draft}</div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === "pending" ? null : "pending")}
            className={cn(
              "group flex items-center justify-between rounded-lg px-4 py-3 transition-all",
              "hover:bg-amber-50/50",
              statusFilter === "pending" && "bg-amber-50/50"
            )}
          >
            <div className="text-left">
              <div className="text-sm text-amber-600">待审批</div>
              <div className="text-2xl font-semibold mt-0.5 text-amber-600">{stats.pending}</div>
            </div>
            <ChevronRight className="h-5 w-5 text-amber-400/50 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-500" />
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === "rejected" ? null : "rejected")}
            className={cn(
              "group flex items-center justify-between rounded-lg px-4 py-3 transition-all",
              "hover:bg-red-50/50",
              statusFilter === "rejected" && "bg-red-50/50"
            )}
          >
            <div className="text-left">
              <div className="text-sm text-muted-foreground">已驳回</div>
              <div className="text-2xl font-semibold mt-0.5 text-red-600">{stats.rejected}</div>
            </div>
            <ChevronRight className="h-5 w-5 text-red-400/50 transition-transform group-hover:translate-x-0.5 group-hover:text-red-500" />
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === "approved" ? null : "approved")}
            className={cn(
              "group flex items-center justify-between rounded-lg px-4 py-3 transition-all",
              "hover:bg-emerald-50/50",
              statusFilter === "approved" && "bg-emerald-50/50"
            )}
          >
            <div className="text-left">
              <div className="text-sm text-muted-foreground">已通过</div>
              <div className="text-2xl font-semibold mt-0.5 text-emerald-600">{stats.approved}</div>
            </div>
            <ChevronRight className="h-5 w-5 text-emerald-400/50 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-500" />
          </button>
        </div>
      </div>

      {/* 分割线 */}
      <div className="border-b" />

      {/* 空状态引导页 - 默认显示，垂直居中 */}
      {statusFilter === null && (
        <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
          <button
            onClick={handleCreate}
            className="group flex flex-col items-center gap-5 rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-16 py-10 transition-all hover:border-amber-400 hover:bg-amber-50/50"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600 transition-transform group-hover:scale-110">
              <Plus className="h-10 w-10" />
            </div>
            <div className="text-center">
              <div className="text-lg font-medium text-foreground">填写入驻申请表</div>
              <div className="text-sm text-muted-foreground mt-1">点击创建新的企业入驻申请</div>
            </div>
          </button>
          <p className="mt-6 text-sm text-muted-foreground">
            或点击上方状态卡片查看已有申请
          </p>
        </div>
      )}

      {/* 列表区域 - 点击卡片后显示 */}
      {statusFilter !== null && (
        <div className="py-6">
          {/* 标题栏 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter(null)}
                className="text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                返回
              </Button>
              <span className="text-sm font-medium text-foreground">
                {statusFilter === "draft" && "草稿申请"}
                {statusFilter === "pending" && "待审批申请"}
                {statusFilter === "rejected" && "已驳回申请"}
                {statusFilter === "approved" && "已通过申请"}
              </span>
              <span className="text-sm text-muted-foreground">({filteredApplications.length})</span>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索企业名称、编号..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* 申请列表 */}
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-destructive mb-4">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">申请编号</th>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">企业名称</th>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">申请类型</th>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">法人/电话</th>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">状态</th>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">创建时间</th>
              <th className="p-4 text-right text-sm font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  暂无申请记录，点击"填写申请表"开始
                </td>
              </tr>
            ) : (
              filteredApplications.map((app) => (
                <tr key={app.id} className="border-b last:border-b-0 hover:bg-muted/50">
                  <td className="p-4 text-sm font-mono">{app.applicationNo}</td>
                  <td className="p-4">
                    <div className="text-sm font-medium">{app.enterpriseName}</div>
                    {app.enterpriseNameBackups && app.enterpriseNameBackups.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        备用名: {app.enterpriseNameBackups.join("、")}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className={cn("font-normal", applicationTypeConfig[app.applicationType].className)}>
                      {applicationTypeConfig[app.applicationType].label}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm">
                    <div>{app.legalPersonName || "-"}</div>
                    <div className="text-muted-foreground">{app.legalPersonPhone || "-"}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("font-normal", statusConfig[app.approvalStatus].className)}>
                        {statusConfig[app.approvalStatus].label}
                      </Badge>
                      {app.approvalStatus === "rejected" && app.rejectionReason && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewRejectReason(app)}
                          className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                        >
                          <MessageSquareWarning className="h-3 w-3" />
                          查看原因
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(app.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      {app.approvalStatus === "draft" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(app)}
                            className="gap-1"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleShare(app)}
                            disabled={creatingShare && sharingAppId === app.id}
                            className="gap-1 text-amber-600 hover:text-amber-700"
                          >
                            {creatingShare && sharingAppId === app.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Share2 className="h-3.5 w-3.5" />
                            )}
                            转发
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSubmit(app.id)}
                            className="gap-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                          >
                            <Send className="h-3.5 w-3.5" />
                            提交
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(app.id)}
                            className="gap-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {app.approvalStatus === "rejected" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(app)}
                            className="gap-1"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            修改
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleShare(app)}
                            disabled={creatingShare && sharingAppId === app.id}
                            className="gap-1 text-amber-600 hover:text-amber-700"
                          >
                            {creatingShare && sharingAppId === app.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Share2 className="h-3.5 w-3.5" />
                            )}
                            转发
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSubmit(app.id)}
                            className="gap-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                          >
                            <Send className="h-3.5 w-3.5" />
                            重新提交
                          </Button>
                        </>
                      )}
                      {app.approvalStatus === "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(app)}
                          className="gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          查看
                        </Button>
                      )}
                      {app.approvalStatus === "approved" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewProcess(app)}
                          className="gap-1"
                        >
                          <GitBranch className="h-3.5 w-3.5" />
                          查看流程
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
          </div>
        </div>
      )}

      {/* 分享弹窗 */}
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        shareUrl={shareUrl}
        onCopy={copyShareUrl}
      />

      {/* 驳回原因弹窗 */}
      <Dialog open={rejectReasonDialogOpen} onOpenChange={setRejectReasonDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <MessageSquareWarning className="h-5 w-5" />
              驳回原因
            </DialogTitle>
            <DialogDescription>
              申请编号：{selectedRejectApp?.applicationNo}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700 leading-relaxed whitespace-pre-wrap">
                {selectedRejectApp?.rejectionReason}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setRejectReasonDialogOpen(false)}
            >
              我知道了
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
