"use client";

import { useState, useEffect } from "react";
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
  Building2,
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
  draft: { label: "草稿", className: "bg-gray-50 text-gray-600 border-gray-200" },
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

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
    if (!confirm("确认提交此申请进行审批？")) return;

    try {
      const response = await fetch(`/api/settlement/applications/${id}/submit`, {
        method: "POST",
      });
      const result = await response.json();
      if (result.success) {
        fetchApplications();
        alert("申请已提交审批");
      } else {
        alert(result.error || "提交失败");
      }
    } catch (err) {
      console.error("提交审批失败:", err);
      alert("提交审批失败");
    }
  };

  // 删除申请
  const handleDelete = async (id: string) => {
    if (!confirm("确认删除此申请？删除后无法恢复。")) return;

    try {
      const response = await fetch(`/api/settlement/applications/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        fetchApplications();
        alert("申请已删除");
      } else {
        alert(result.error || "删除失败");
      }
    } catch (err) {
      console.error("删除申请失败:", err);
      alert("删除申请失败");
    }
  };

  // 查看流程
  const handleViewProcess = (application: Application) => {
    router.push(`/dashboard/base/processes?applicationId=${application.id}`);
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
          <h1 className="text-2xl font-semibold">入驻申请</h1>
          <p className="text-muted-foreground mt-1">
            填写入园审批表，管理企业入驻申请
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          填写申请表
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-5 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">总计</div>
          <div className="text-2xl font-semibold">{stats.total}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">草稿</div>
          <div className="text-2xl font-semibold text-gray-600">{stats.draft}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">待审批</div>
          <div className="text-2xl font-semibold text-blue-600">{stats.pending}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">已通过</div>
          <div className="text-2xl font-semibold text-emerald-600">{stats.approved}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">已驳回</div>
          <div className="text-2xl font-semibold text-red-600">{stats.rejected}</div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索企业名称、编号或法人..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
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
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left text-sm font-medium">申请编号</th>
              <th className="p-4 text-left text-sm font-medium">企业名称</th>
              <th className="p-4 text-left text-sm font-medium">申请类型</th>
              <th className="p-4 text-left text-sm font-medium">法人/电话</th>
              <th className="p-4 text-left text-sm font-medium">状态</th>
              <th className="p-4 text-left text-sm font-medium">创建时间</th>
              <th className="p-4 text-right text-sm font-medium">操作</th>
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
                    <div className="font-medium">{app.enterpriseName}</div>
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
                            variant="default"
                            onClick={() => handleSubmit(app.id)}
                            className="gap-1"
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
                            variant="default"
                            onClick={() => handleSubmit(app.id)}
                            className="gap-1"
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
  );
}
