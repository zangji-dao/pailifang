"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Building2,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Filter,
  Calendar,
  AlertCircle,
  Loader2,
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

// 企业状态
type EnterpriseStatus = "active" | "inactive" | "pending";

// 企业类型
type EnterpriseType = "tenant" | "service";

// 企业信息接口
interface Enterprise {
  id: string;
  name: string;
  creditCode: string;
  legalPerson: string;
  phone: string;
  registeredAddress: string;
  businessAddress: string;
  industry: string;
  入驻Date: string;
  status: EnterpriseStatus;
  type: EnterpriseType;
  remarks: string;
}

// 状态配置
const statusConfig: Record<EnterpriseStatus, { label: string; className: string }> = {
  active: { label: "入驻中", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  inactive: { label: "已迁出", className: "bg-gray-50 text-gray-600 border-gray-200" },
  pending: { label: "待入驻", className: "bg-amber-50 text-amber-600 border-amber-200" },
};

// 企业类型配置
const typeConfig: Record<EnterpriseType, { label: string; description: string; className: string }> = {
  tenant: {
    label: "入驻企业",
    description: "在基地内注册的企业",
    className: "bg-blue-50 text-blue-600 border-blue-200",
  },
  service: {
    label: "服务企业",
    description: "不在基地内注册的企业",
    className: "bg-purple-50 text-purple-600 border-purple-200",
  },
};

// 行业选项
const INDUSTRIES = [
  "制造业",
  "批发和零售业",
  "信息技术服务业",
  "科学研究和技术服务业",
  "租赁和商务服务业",
  "建筑业",
  "交通运输业",
  "住宿和餐饮业",
  "金融业",
  "教育",
  "卫生和社会工作",
  "文化、体育和娱乐业",
  "其他",
];

// API响应类型
interface ApiEnterprise {
  id: string;
  name: string;
  creditCode: string | null;
  legalPerson: string | null;
  phone: string | null;
  registeredAddress: string | null;
  businessAddress: string | null;
  industry: string | null;
  settledDate: string | null;
  status: string;
  type: string;
  remarks: string | null;
}

// 转换API数据到前端格式
function transformEnterprise(api: ApiEnterprise): Enterprise {
  return {
    id: api.id,
    name: api.name,
    creditCode: api.creditCode || "",
    legalPerson: api.legalPerson || "",
    phone: api.phone || "",
    registeredAddress: api.registeredAddress || "",
    businessAddress: api.businessAddress || "",
    industry: api.industry || "",
    入驻Date: api.settledDate || "",
    status: api.status as EnterpriseStatus,
    type: api.type as EnterpriseType,
    remarks: api.remarks || "",
  };
}

export default function TenantsPage() {
  const router = useRouter();
  const tabsContext = useTabs();

  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");

  // 获取企业数据
  useEffect(() => {
    const fetchEnterprises = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/enterprises");
        if (!response.ok) {
          throw new Error("获取企业数据失败");
        }
        const result = await response.json();
        const data: ApiEnterprise[] = result.data || [];
        setEnterprises(data.map(transformEnterprise));
        setError(null);
      } catch (err) {
        console.error("获取企业数据失败:", err);
        setError(err instanceof Error ? err.message : "获取企业数据失败");
      } finally {
        setLoading(false);
      }
    };

    fetchEnterprises();
  }, []);

  // 过滤企业列表
  const filteredEnterprises = enterprises.filter((e) => {
    const matchSearch =
      !searchKeyword ||
      e.name.includes(searchKeyword) ||
      e.creditCode.includes(searchKeyword) ||
      e.legalPerson.includes(searchKeyword);
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    const matchIndustry = industryFilter === "all" || e.industry === industryFilter;
    return matchSearch && matchStatus && matchIndustry;
  });

  // 统计数据
  const stats = {
    total: enterprises.length,
    tenant: enterprises.filter((e) => e.type === "tenant").length,
    service: enterprises.filter((e) => e.type === "service").length,
    active: enterprises.filter((e) => e.status === "active").length,
    inactive: enterprises.filter((e) => e.status === "inactive").length,
    pending: enterprises.filter((e) => e.status === "pending").length,
  };

  // 打开新增企业标签页
  const handleAdd = () => {
    if (tabsContext) {
      tabsContext.openTab({
        id: "enterprise-create",
        label: "新增企业",
        path: "/dashboard/base/tenants/create",
      });
    } else {
      router.push("/dashboard/base/tenants/create");
    }
  };

  // 打开企业详情标签页
  const handleView = (enterprise: Enterprise) => {
    if (tabsContext) {
      tabsContext.openTab({
        id: `enterprise-${enterprise.id}`,
        label: enterprise.name,
        path: `/dashboard/base/tenants/${enterprise.id}`,
      });
    } else {
      router.push(`/dashboard/base/tenants/${enterprise.id}`);
    }
  };

  // 打开企业编辑标签页
  const handleEdit = (enterprise: Enterprise) => {
    if (tabsContext) {
      tabsContext.openTab({
        id: `enterprise-edit-${enterprise.id}`,
        label: `编辑 - ${enterprise.name}`,
        path: `/dashboard/base/tenants/${enterprise.id}/edit`,
      });
    } else {
      router.push(`/dashboard/base/tenants/${enterprise.id}/edit`);
    }
  };

  // 删除企业
  const handleDelete = async (enterprise: Enterprise) => {
    if (!confirm(`确定要删除企业「${enterprise.name}」吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/enterprises/${enterprise.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "删除失败");
      }

      // 刷新列表
      setEnterprises((prev) => prev.filter((e) => e.id !== enterprise.id));
    } catch (err) {
      console.error("删除失败:", err);
      toast.error(err instanceof Error ? err.message : "删除失败");
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
          <Button variant="outline" size="sm" className="text-slate-600">
            <Download className="h-4 w-4 mr-1.5" />
            导出
          </Button>
          <Button variant="outline" size="sm" className="text-slate-600">
            <Upload className="h-4 w-4 mr-1.5" />
            导入
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            onClick={handleAdd}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            新增企业
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-5 gap-4 px-6 py-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">企业总数</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-slate-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-blue-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">入驻企业</p>
              <p className="text-2xl font-semibold text-blue-700 mt-1">{stats.tenant}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">基地内注册</p>
        </div>
        <div className="bg-white rounded-xl border border-purple-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">服务企业</p>
              <p className="text-2xl font-semibold text-purple-700 mt-1">{stats.service}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-purple-500" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">基地外注册</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">待入驻</p>
              <p className="text-2xl font-semibold text-amber-600 mt-1">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">已迁出</p>
              <p className="text-2xl font-semibold text-gray-500 mt-1">{stats.inactive}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-gray-400" />
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
            placeholder="搜索企业名称、信用代码、法人..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-9 text-sm">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">入驻中</SelectItem>
            <SelectItem value="pending">待入驻</SelectItem>
            <SelectItem value="inactive">已迁出</SelectItem>
          </SelectContent>
        </Select>

        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue placeholder="行业" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部行业</SelectItem>
            {INDUSTRIES.map((industry) => (
              <SelectItem key={industry} value={industry}>
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="ghost" size="sm" className="text-slate-500">
          <Filter className="h-4 w-4 mr-1.5" />
          更多筛选
        </Button>
      </div>

      {/* 企业列表 */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  企业名称
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  统一社会信用代码
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  法定代表人
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  联系电话
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  所属行业
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  企业类型
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  入驻日期
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">状态</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnterprises.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p>暂无企业数据</p>
                  </td>
                </tr>
              ) : (
                filteredEnterprises.map((enterprise) => (
                  <tr
                    key={enterprise.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            enterprise.type === "tenant" ? "bg-blue-100" : "bg-purple-100"
                          )}
                        >
                          <Building2
                            className={cn(
                              "h-4 w-4",
                              enterprise.type === "tenant" ? "text-blue-600" : "text-purple-600"
                            )}
                          />
                        </div>
                        <span className="font-medium text-slate-900">{enterprise.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 font-mono">
                      {enterprise.creditCode}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {enterprise.legalPerson}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{enterprise.phone}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{enterprise.industry}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={cn("text-xs font-medium", typeConfig[enterprise.type].className)}
                      >
                        {typeConfig[enterprise.type].label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {enterprise.入驻Date}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-medium",
                          statusConfig[enterprise.status].className
                        )}
                      >
                        {statusConfig[enterprise.status].label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                          onClick={() => handleView(enterprise)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-amber-600"
                          onClick={() => handleEdit(enterprise)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                          onClick={() => handleDelete(enterprise)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
