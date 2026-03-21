"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Trash2,
  Plus,
  X,
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

interface Attachment {
  name: string;
  url: string;
  type?: string;
  uploadedAt?: string;
}

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
  attachments?: Attachment[];
}

// 状态配置
const statusConfig: Record<ApprovalStatus, { label: string; className: string }> = {
  draft: { label: "草稿", className: "bg-slate-50 text-slate-600 border-slate-200" },
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null); // 默认不选中，显示引导页

  // 审批相关状态
  const [actionLoading, setActionLoading] = useState(false);

  // 驳回弹窗
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingApp, setRejectingApp] = useState<Application | null>(null);

  // 上传附件弹窗
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadingApp, setUploadingApp] = useState<Application | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [deletingAttachment, setDeletingAttachment] = useState<string | null>(null);

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

  // 从 URL 参数恢复筛选状态（从详情页返回时）
  useEffect(() => {
    const status = searchParams.get("status");
    if (status && ["pending", "rejected", "approved"].includes(status)) {
      setStatusFilter(status);
    }
  }, [searchParams]);

  // 过滤申请列表（只显示非草稿）
  const filteredApplications = applications.filter((app) => {
    const matchStatus = statusFilter === null || app.approvalStatus === statusFilter;
    const matchKeyword =
      !searchKeyword ||
      app.enterpriseName.includes(searchKeyword) ||
      app.applicationNo.includes(searchKeyword) ||
      (app.legalPersonName && app.legalPersonName.includes(searchKeyword));
    return matchStatus && matchKeyword && app.approvalStatus !== "draft";
  });

  // 统计数据（不含草稿）
  const stats = {
    total: applications.filter((a) => a.approvalStatus !== "draft").length,
    pending: applications.filter((a) => a.approvalStatus === "pending").length,
    approved: applications.filter((a) => a.approvalStatus === "approved").length,
    rejected: applications.filter((a) => a.approvalStatus === "rejected").length,
  };

  // 查看申请详情（跳转到入驻申请详情页）
  const handleViewDetail = (app: Application) => {
    router.push(`/dashboard/base/applications/${app.id}?from=approval&status=${statusFilter}`);
  };

  // 审批通过
  const handleApprove = async (app: Application) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/applications/${app.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("审批通过");
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

  // 打开驳回弹窗
  const handleOpenReject = (app: Application) => {
    setRejectingApp(app);
    setRejectDialogOpen(true);
  };

  // 驳回申请
  const handleReject = async () => {
    if (!rejectingApp || !rejectReason.trim()) {
      toast.error("请填写驳回原因");
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/applications/${rejectingApp.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: rejectReason }),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("已驳回申请");
        setRejectDialogOpen(false);
        setRejectReason("");
        setRejectingApp(null);
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

  // 打开上传附件弹窗
  const handleOpenUpload = async (app: Application) => {
    setUploadingApp(app);
    setSelectedFiles([]);
    setExistingAttachments([]);
    setUploadDialogOpen(true);

    // 加载已有附件
    setLoadingAttachments(true);
    try {
      const response = await fetch(`/api/applications/${app.id}/attachments`);
      const result = await response.json();
      if (result.success) {
        setExistingAttachments(result.data || []);
      }
    } catch (err) {
      console.error("加载附件失败:", err);
    } finally {
      setLoadingAttachments(false);
    }
  };

  // 选择文件
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 过滤只允许图片
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length !== files.length) {
      toast.warning("只支持图片格式文件");
    }

    setSelectedFiles((prev) => [...prev, ...imageFiles]);

    // 清空 input 以便再次选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 移除文件
  const handleRemovePreview = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 上传附件
  const handleUpload = async () => {
    if (!uploadingApp || selectedFiles.length === 0) {
      toast.error("请选择要上传的文件");
      return;
    }

    try {
      setUploadingFiles(true);
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(`/api/applications/${uploadingApp.id}/attachments`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (result.success) {
        toast.success(`成功上传 ${result.data.length} 个附件`);
        setSelectedFiles([]);
        // 更新已有附件列表
        setExistingAttachments((prev) => [...prev, ...result.data]);
        fetchApplications();
      } else {
        toast.error(result.error || "上传失败");
      }
    } catch (err) {
      console.error("上传失败:", err);
      toast.error("上传失败");
    } finally {
      setUploadingFiles(false);
    }
  };

  // 删除附件
  const handleDeleteAttachment = async (attachmentName: string) => {
    if (!uploadingApp) return;

    try {
      setDeletingAttachment(attachmentName);
      const response = await fetch(`/api/applications/${uploadingApp.id}/attachments?name=${encodeURIComponent(attachmentName)}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        toast.success("删除成功");
        setExistingAttachments((prev) => prev.filter((a) => a.name !== attachmentName));
        fetchApplications();
      } else {
        toast.error(result.error || "删除失败");
      }
    } catch (err) {
      console.error("删除失败:", err);
      toast.error("删除失败");
    } finally {
      setDeletingAttachment(null);
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
    <div className="space-y-0">
      {/* 页面标题 */}
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          入驻审批
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          审批企业入驻申请
        </p>
      </div>

      {/* 分割线 */}
      <div className="border-b" />

      {/* 统计卡片区域 */}
      <div className="py-6">
        <div className="flex items-center gap-4">
          {/* 状态统计 */}
          <div className="flex-1">
            <div className="text-sm font-medium text-muted-foreground mb-3">审批状态</div>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setStatusFilter(statusFilter === "pending" ? null : "pending")}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3 py-2.5 transition-all",
                  statusFilter === "pending" 
                    ? "border-amber-500 bg-amber-50" 
                    : "border-border hover:border-amber-300 hover:bg-amber-50/50"
                )}
              >
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">待审批</div>
                  <div className={cn("text-xl font-semibold", statusFilter === "pending" ? "text-amber-600" : "text-foreground")}>{stats.pending}</div>
                </div>
                <div className="w-2 h-2 rounded-full bg-amber-500" />
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === "rejected" ? null : "rejected")}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3 py-2.5 transition-all",
                  statusFilter === "rejected" 
                    ? "border-red-500 bg-red-50" 
                    : "border-border hover:border-red-300 hover:bg-red-50/50"
                )}
              >
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">已驳回</div>
                  <div className={cn("text-xl font-semibold", statusFilter === "rejected" ? "text-red-600" : "text-foreground")}>{stats.rejected}</div>
                </div>
                <XCircle className="w-4 h-4 text-red-400" />
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === "approved" ? null : "approved")}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3 py-2.5 transition-all",
                  statusFilter === "approved" 
                    ? "border-emerald-500 bg-emerald-50" 
                    : "border-border hover:border-emerald-300 hover:bg-emerald-50/50"
                )}
              >
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">已通过</div>
                  <div className={cn("text-xl font-semibold", statusFilter === "approved" ? "text-emerald-600" : "text-foreground")}>{stats.approved}</div>
                </div>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 分割线 */}
      <div className="border-b" />

      {/* 空状态引导页 - 默认显示 */}
      {statusFilter === null && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-muted-foreground mb-2">点击上方状态卡片查看对应申请</div>
          <div className="text-sm text-muted-foreground">待审批申请将显示在列表中供您审批</div>
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
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">申请编号</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">企业名称</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">申请类型</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">法人/电话</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">状态</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">附件</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">申请时间</th>
                  <th className="p-4 text-right text-sm font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      {statusFilter === "pending" ? "暂无待审批申请" : "暂无申请记录"}
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
                        <Badge variant="outline" className={cn("font-normal", statusConfig[app.approvalStatus].className)}>
                          {statusConfig[app.approvalStatus].label}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          <span className={cn(
                            "text-sm",
                            app.attachments && app.attachments.length > 0 ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {app.attachments?.length || 0} 个
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(app.createdAt).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetail(app)}
                            className="gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            查看
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenUpload(app)}
                            className="gap-1"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            附件
                          </Button>
                          {statusFilter === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenReject(app)}
                                className="gap-1 text-destructive hover:text-destructive"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                驳回
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(app)}
                                disabled={actionLoading}
                                className="gap-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                              >
                                {actionLoading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                )}
                                通过
                              </Button>
                            </>
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
                setRejectingApp(null);
              }}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              确认驳回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 上传附件弹窗 */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>附件管理</DialogTitle>
            <DialogDescription>
              管理签字表扫描件，支持多张图片上传。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* 已上传附件列表 */}
            <div>
              <h4 className="text-sm font-medium mb-2">已上传附件</h4>
              {loadingAttachments ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  加载中...
                </div>
              ) : existingAttachments.length > 0 ? (
                <div className="border rounded-lg divide-y">
                  {existingAttachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{attachment.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(attachment.url, "_blank")}
                          className="gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          查看
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteAttachment(attachment.name)}
                          disabled={deletingAttachment === attachment.name}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          {deletingAttachment === attachment.name ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          删除
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                  暂无附件
                </div>
              )}
            </div>

            {/* 分隔线 */}
            <div className="border-t" />

            {/* 选择文件按钮 */}
            <div>
              <h4 className="text-sm font-medium mb-2">添加新附件</h4>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                multiple
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-16 border-dashed"
              >
                <Plus className="h-5 w-5 mr-2" />
                选择图片文件
              </Button>
            </div>

            {/* 待上传文件列表 */}
            {selectedFiles.length > 0 && (
              <div className="border rounded-lg divide-y">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const url = URL.createObjectURL(file);
                          window.open(url, "_blank");
                        }}
                        className="gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        查看
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemovePreview(index)}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 提示信息 */}
            <p className="text-xs text-muted-foreground">
              支持 JPG、PNG 格式图片，建议上传清晰完整的扫描件。
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setSelectedFiles([]);
                setUploadingApp(null);
                setExistingAttachments([]);
              }}
            >
              关闭
            </Button>
            {selectedFiles.length > 0 && (
              <Button
                onClick={handleUpload}
                disabled={uploadingFiles}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                {uploadingFiles && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                上传 ({selectedFiles.length} 个文件)
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
