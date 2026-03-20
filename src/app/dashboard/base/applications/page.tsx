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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // 分享相关状态
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [creatingShare, setCreatingShare] = useState(false);
  const [sharingAppId, setSharingAppId] = useState<string | null>(null);

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
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            入驻申请
          </h1>
          <p className="text-slate-500 mt-1.5">
            填写入园审批表，管理企业入驻申请
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md">
          <Plus className="h-4 w-4" />
          填写申请表
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-5 gap-4">
        <div className="rounded-xl border-0 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-md hover:shadow-lg transition-shadow">
          <div className="text-sm font-medium text-slate-500">总计</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</div>
        </div>
        <div className="rounded-xl border-0 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-md hover:shadow-lg transition-shadow">
          <div className="text-sm font-medium text-slate-500">草稿</div>
          <div className="text-3xl font-bold text-slate-600 mt-2">{stats.draft}</div>
        </div>
        <div className="rounded-xl border-0 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-md hover:shadow-lg transition-shadow">
          <div className="text-sm font-medium text-blue-600">待审批</div>
          <div className="text-3xl font-bold text-blue-700 mt-2">{stats.pending}</div>
        </div>
        <div className="rounded-xl border-0 bg-gradient-to-br from-emerald-50 to-green-50 p-5 shadow-md hover:shadow-lg transition-shadow">
          <div className="text-sm font-medium text-emerald-600">已通过</div>
          <div className="text-3xl font-bold text-emerald-700 mt-2">{stats.approved}</div>
        </div>
        <div className="rounded-xl border-0 bg-gradient-to-br from-red-50 to-orange-50 p-5 shadow-md hover:shadow-lg transition-shadow">
          <div className="text-sm font-medium text-red-600">已驳回</div>
          <div className="text-3xl font-bold text-red-700 mt-2">{stats.rejected}</div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm group">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
          <input
            type="text"
            placeholder="搜索企业名称、编号或法人..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent transition-all"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] rounded-xl border-slate-200">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
            <SelectItem value="pending">待审批</SelectItem>
            <SelectItem value="approved">已通过</SelectItem>
            <SelectItem value="rejected">已驳回</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 申请列表 */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-4 text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="rounded-2xl border-0 bg-white shadow-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/50">
              <th className="p-4 text-left text-sm font-semibold text-slate-700">申请编号</th>
              <th className="p-4 text-left text-sm font-semibold text-slate-700">企业名称</th>
              <th className="p-4 text-left text-sm font-semibold text-slate-700">申请类型</th>
              <th className="p-4 text-left text-sm font-semibold text-slate-700">法人/电话</th>
              <th className="p-4 text-left text-sm font-semibold text-slate-700">状态</th>
              <th className="p-4 text-left text-sm font-semibold text-slate-700">创建时间</th>
              <th className="p-4 text-right text-sm font-semibold text-slate-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <AlertCircle className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">暂无申请记录</p>
                    <p className="text-slate-400 text-sm mt-1">点击"填写申请表"开始</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredApplications.map((app) => (
                <tr key={app.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-sm font-mono text-slate-600">{app.applicationNo}</td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-900">{app.enterpriseName}</div>
                    {app.enterpriseNameBackups && app.enterpriseNameBackups.length > 0 && (
                      <div className="text-xs text-slate-400 mt-1">
                        备用名: {app.enterpriseNameBackups.join("、")}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className={cn("font-medium border", applicationTypeConfig[app.applicationType].className)}>
                      {applicationTypeConfig[app.applicationType].label}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm">
                    <div className="font-medium text-slate-900">{app.legalPersonName || "-"}</div>
                    <div className="text-slate-500">{app.legalPersonPhone || "-"}</div>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className={cn("font-medium border", statusConfig[app.approvalStatus].className)}>
                      {statusConfig[app.approvalStatus].label}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-slate-500">
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
                            className="gap-1.5 hover:bg-slate-100"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleShare(app)}
                            disabled={creatingShare && sharingAppId === app.id}
                            className="gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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
                            variant="default"
                            onClick={() => handleSubmit(app.id)}
                            className="gap-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-sm"
                          >
                            <Send className="h-3.5 w-3.5" />
                            提交
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(app.id)}
                            className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
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
                            className="gap-1.5 hover:bg-slate-100"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            修改
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleSubmit(app.id)}
                            className="gap-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-sm"
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
                          className="gap-1.5 hover:bg-slate-100"
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
                          className="gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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

      {/* 分享弹窗 */}
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        shareUrl={shareUrl}
        onCopy={copyShareUrl}
      />
    </div>
  );
}
