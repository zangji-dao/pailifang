"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  FileText,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Building2,
  Phone,
  User,
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
type ApprovalStatus = "pending" | "submitted" | "approved" | "rejected";
type ApplicationType = "new" | "migration";
type SettlementType = "free" | "paid" | "tax_commitment";

interface Application {
  id: string;
  enterpriseName: string;
  contactPerson: string | null;
  contactPhone: string | null;
  applicationType: ApplicationType;
  settlementType: SettlementType;
  approvalStatus: ApprovalStatus;
  approvalDate: string | null;
  addressId: string | null;
  addressCode: string | null;
  enterpriseId: string | null;
  remarks: string | null;
  createdAt: string;
}

// 状态配置
const statusConfig: Record<ApprovalStatus, { label: string; className: string }> = {
  pending: { label: "待提交", className: "bg-gray-50 text-gray-600 border-gray-200" },
  submitted: { label: "审批中", className: "bg-blue-50 text-blue-600 border-blue-200" },
  approved: { label: "已通过", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  rejected: { label: "已驳回", className: "bg-red-50 text-red-600 border-red-200" },
};

const applicationTypeConfig: Record<ApplicationType, { label: string; className: string }> = {
  new: { label: "新建企业", className: "bg-purple-50 text-purple-600 border-purple-200" },
  migration: { label: "迁移企业", className: "bg-orange-50 text-orange-600 border-orange-200" },
};

const settlementTypeConfig: Record<SettlementType, { label: string; className: string }> = {
  free: { label: "免费入驻", className: "text-green-600" },
  paid: { label: "付费入驻", className: "text-blue-600" },
  tax_commitment: { label: "承诺税收", className: "text-amber-600" },
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
  useEffect(() => {
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

    fetchApplications();
  }, []);

  // 过滤申请列表
  const filteredApplications = applications.filter((a) => {
    const matchSearch =
      !searchKeyword ||
      a.enterpriseName.includes(searchKeyword) ||
      (a.contactPerson && a.contactPerson.includes(searchKeyword));
    const matchStatus = statusFilter === "all" || a.approvalStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  // 统计数据
  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.approvalStatus === "pending").length,
    submitted: applications.filter((a) => a.approvalStatus === "submitted").length,
    approved: applications.filter((a) => a.approvalStatus === "approved").length,
    rejected: applications.filter((a) => a.approvalStatus === "rejected").length,
  };

  // 打开新增申请标签页
  const handleAdd = () => {
    if (tabsContext) {
      tabsContext.openTab({
        id: "application-create",
        label: "新增入驻申请",
        path: "/dashboard/base/applications/create",
      });
    } else {
      router.push("/dashboard/base/applications/create");
    }
  };

  // 打开申请详情标签页
  const handleView = (application: Application) => {
    if (tabsContext) {
      tabsContext.openTab({
        id: `application-${application.id}`,
        label: application.enterpriseName,
        path: `/dashboard/base/applications/${application.id}`,
      });
    } else {
      router.push(`/dashboard/base/applications/${application.id}`);
    }
  };

  // 提交审批
  const handleSubmit = async (application: Application) => {
    if (!confirm(`确定要提交「${application.enterpriseName}」的审批申请吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/settlement/applications/${application.id}/submit`, {
        method: "POST",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "提交失败");
      }

      // 刷新列表
      setApplications((prev) =>
        prev.map((a) => (a.id === application.id ? { ...a, approvalStatus: "submitted" } : a))
      );
    } catch (err) {
      console.error("提交失败:", err);
      alert(err instanceof Error ? err.message : "提交失败");
    }
  };

  // 加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-600">加载中...</span>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          重新加载
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white">
      {/* 操作栏 */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            onClick={handleAdd}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            新增申请
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-5 gap-4 px-6 py-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">申请总数</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-slate-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">待提交</p>
              <p className="text-2xl font-semibold text-gray-700 mt-1">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
              <FileText className="h-5 w-5 text-gray-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-blue-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">审批中</p>
              <p className="text-2xl font-semibold text-blue-700 mt-1">{stats.submitted}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-emerald-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-600">已通过</p>
              <p className="text-2xl font-semibold text-emerald-700 mt-1">{stats.approved}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-red-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">已驳回</p>
              <p className="text-2xl font-semibold text-red-700 mt-1">{stats.rejected}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="px-6 py-3 flex items-center gap-3 border-b border-slate-100 bg-white">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索企业名称、联系人..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-9 text-sm">
            <SelectValue placeholder="审批状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待提交</SelectItem>
            <SelectItem value="submitted">审批中</SelectItem>
            <SelectItem value="approved">已通过</SelectItem>
            <SelectItem value="rejected">已驳回</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 申请列表 */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  企业名称
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  联系人
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  联系电话
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  申请类型
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  入驻类型
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  审批状态
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  分配地址
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  申请时间
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p>暂无申请数据</p>
                  </td>
                </tr>
              ) : (
                filteredApplications.map((application) => (
                  <tr
                    key={application.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-amber-600" />
                        </div>
                        <span className="font-medium text-slate-900">
                          {application.enterpriseName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {application.contactPerson || "-"}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {application.contactPhone || "-"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-medium",
                          applicationTypeConfig[application.applicationType].className
                        )}
                      >
                        {applicationTypeConfig[application.applicationType].label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          settlementTypeConfig[application.settlementType].className
                        )}
                      >
                        {settlementTypeConfig[application.settlementType].label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-medium",
                          statusConfig[application.approvalStatus].className
                        )}
                      >
                        {statusConfig[application.approvalStatus].label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {application.addressCode || "-"}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                          onClick={() => handleView(application)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {application.approvalStatus === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600"
                            onClick={() => handleSubmit(application)}
                          >
                            <Send className="h-4 w-4" />
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
    </div>
  );
}
