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
  Calendar,
  FileText,
  Eye,
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
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
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
    total: applications.filter((a) => a.approvalStatus !== "draft").length,
    pending: applications.filter((a) => a.approvalStatus === "pending").length,
    approved: applications.filter((a) => a.approvalStatus === "approved").length,
    rejected: applications.filter((a) => a.approvalStatus === "rejected").length,
  };

  // 查看申请详情
  const handleViewDetail = (app: Application) => {
    setSelectedApp(app);
    setDetailDialogOpen(true);
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
        setDetailDialogOpen(false);
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

  // 打开驳回弹窗
  const handleOpenReject = () => {
    setDetailDialogOpen(false);
    setRejectDialogOpen(true);
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
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            入驻审批
          </h1>
          <p className="text-slate-500 mt-1.5">
            审批企业入驻申请
          </p>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full border border-amber-100">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-sm font-semibold text-amber-700">{stats.pending}</span>
          <span className="text-sm text-amber-600/80">待审批</span>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border-0 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-md hover:shadow-lg transition-shadow">
          <div className="text-sm font-medium text-slate-500">总计</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</div>
        </div>
        <div className="rounded-xl border-0 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-md hover:shadow-lg transition-shadow">
          <div className="text-sm font-medium text-amber-600">待审批</div>
          <div className="text-3xl font-bold text-amber-700 mt-2">{stats.pending}</div>
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

      {/* 申请列表 */}
      <div className="rounded-2xl border-0 bg-white shadow-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/50">
              <th className="p-4 text-left text-sm font-semibold text-slate-700">申请编号</th>
              <th className="p-4 text-left text-sm font-semibold text-slate-700">企业名称</th>
              <th className="p-4 text-left text-sm font-semibold text-slate-700">申请类型</th>
              <th className="p-4 text-left text-sm font-semibold text-slate-700">法人/电话</th>
              <th className="p-4 text-left text-sm font-semibold text-slate-700">状态</th>
              <th className="p-4 text-left text-sm font-semibold text-slate-700">申请时间</th>
              <th className="p-4 text-right text-sm font-semibold text-slate-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">
                      {statusFilter === "pending" ? "暂无待审批申请" : "暂无申请记录"}
                    </p>
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
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetail(app)}
                        className="gap-1.5 hover:bg-slate-100"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        查看
                      </Button>
                      {app.approvalStatus === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedApp(app);
                              setRejectDialogOpen(true);
                            }}
                            className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            驳回
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={async () => {
                              setSelectedApp(app);
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
                            }}
                            disabled={actionLoading}
                            className="gap-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-sm"
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

      {/* 详情弹窗 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">申请详情</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-6 py-4">
              {/* 基本信息 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-1 h-4 bg-blue-500 rounded-full" />
                  基本信息
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 rounded-xl p-4">
                  <div>
                    <span className="text-slate-500">企业名称</span>
                    <p className="font-semibold text-slate-900 mt-1">{selectedApp.enterpriseName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">申请编号</span>
                    <p className="font-mono text-slate-900 mt-1">{selectedApp.applicationNo}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">申请类型</span>
                    <p className="mt-1">
                      <Badge variant="outline" className={cn("font-medium border", applicationTypeConfig[selectedApp.applicationType].className)}>
                        {applicationTypeConfig[selectedApp.applicationType].label}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">审批状态</span>
                    <p className="mt-1">
                      <Badge variant="outline" className={cn("font-medium border", statusConfig[selectedApp.approvalStatus].className)}>
                        {statusConfig[selectedApp.approvalStatus].label}
                      </Badge>
                    </p>
                  </div>
                  {selectedApp.registeredCapital && (
                    <div>
                      <span className="text-slate-500">注册资本</span>
                      <p className="font-semibold text-blue-600 mt-1">{selectedApp.registeredCapital} 万元</p>
                    </div>
                  )}
                  {selectedApp.businessTerm && (
                    <div>
                      <span className="text-slate-500">经营期限</span>
                      <p className="font-medium text-slate-900 mt-1">{selectedApp.businessTerm}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-slate-500">申请时间</span>
                    <p className="font-medium text-slate-900 mt-1">
                      {new Date(selectedApp.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                </div>
              </div>

              {/* 联系信息 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                  联系信息
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 rounded-xl p-4">
                  {selectedApp.legalPersonName && (
                    <div>
                      <span className="text-slate-500">法人代表</span>
                      <p className="font-medium text-slate-900 mt-1">{selectedApp.legalPersonName}</p>
                    </div>
                  )}
                  {selectedApp.legalPersonPhone && (
                    <div>
                      <span className="text-slate-500">法人电话</span>
                      <p className="font-mono text-slate-900 mt-1">{selectedApp.legalPersonPhone}</p>
                    </div>
                  )}
                  {selectedApp.contactPersonName && (
                    <div>
                      <span className="text-slate-500">联系人</span>
                      <p className="font-medium text-slate-900 mt-1">{selectedApp.contactPersonName}</p>
                    </div>
                  )}
                  {selectedApp.contactPersonPhone && (
                    <div>
                      <span className="text-slate-500">联系电话</span>
                      <p className="font-mono text-slate-900 mt-1">{selectedApp.contactPersonPhone}</p>
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
                  <div className="text-sm bg-slate-50 rounded-xl p-4 leading-relaxed text-slate-700">
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
          )}
          <DialogFooter className="gap-2">
            {selectedApp?.approvalStatus === "pending" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setDetailDialogOpen(false)}
                >
                  关闭
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOpenReject}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  驳回
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  审批通过
                </Button>
              </>
            )}
            {selectedApp?.approvalStatus !== "pending" && (
              <Button onClick={() => setDetailDialogOpen(false)}>
                关闭
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              确认驳回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
