"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  FileText,
  Eye,
  Edit,
  Loader2,
  AlertCircle,
  Building2,
  Calendar,
  DollarSign,
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
type ContractStatus = "draft" | "pending" | "signed" | "expired" | "terminated";
type ContractType = "free" | "paid" | "tax_commitment";

interface Contract {
  id: string;
  enterpriseId: string;
  enterpriseName: string | null;
  applicationId: string | null;
  contractNo: string | null;
  contractType: ContractType;
  rentAmount: string | null;
  depositAmount: string | null;
  taxCommitment: string | null;
  startDate: string | null;
  endDate: string | null;
  signedDate: string | null;
  status: ContractStatus;
  remarks: string | null;
  createdAt: string;
}

// 状态配置
const statusConfig: Record<ContractStatus, { label: string; className: string }> = {
  draft: { label: "草稿", className: "bg-gray-50 text-gray-600 border-gray-200" },
  pending: { label: "待签", className: "bg-amber-50 text-amber-600 border-amber-200" },
  signed: { label: "已签", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  expired: { label: "已到期", className: "bg-red-50 text-red-600 border-red-200" },
  terminated: { label: "已终止", className: "bg-slate-50 text-slate-600 border-slate-200" },
};

const contractTypeConfig: Record<ContractType, { label: string; className: string }> = {
  free: { label: "免费入驻", className: "text-green-600" },
  paid: { label: "付费入驻", className: "text-blue-600" },
  tax_commitment: { label: "承诺税收", className: "text-amber-600" },
};

export default function ContractsPage() {
  const router = useRouter();
  const tabsContext = useTabs();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // 获取合同列表
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/settlement/contracts");
        if (!response.ok) {
          throw new Error("获取合同列表失败");
        }
        const result = await response.json();
        setContracts(result.data || []);
        setError(null);
      } catch (err) {
        console.error("获取合同列表失败:", err);
        setError(err instanceof Error ? err.message : "获取合同列表失败");
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  // 过滤合同列表
  const filteredContracts = contracts.filter((c) => {
    const matchSearch =
      !searchKeyword ||
      (c.enterpriseName && c.enterpriseName.includes(searchKeyword)) ||
      (c.contractNo && c.contractNo.includes(searchKeyword));
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // 统计数据
  const stats = {
    total: contracts.length,
    draft: contracts.filter((c) => c.status === "draft").length,
    pending: contracts.filter((c) => c.status === "pending").length,
    signed: contracts.filter((c) => c.status === "signed").length,
    expired: contracts.filter((c) => c.status === "expired").length,
  };

  // 打开新增合同标签页
  const handleAdd = () => {
    if (tabsContext) {
      tabsContext.openTab({
        id: "contract-create",
        label: "新增合同",
        path: "/dashboard/base/contracts/create",
      });
    } else {
      router.push("/dashboard/base/contracts/create");
    }
  };

  // 打开合同详情标签页
  const handleView = (contract: Contract) => {
    if (tabsContext) {
      tabsContext.openTab({
        id: `contract-${contract.id}`,
        label: contract.contractNo || "合同详情",
        path: `/dashboard/base/contracts/${contract.id}`,
      });
    } else {
      router.push(`/dashboard/base/contracts/${contract.id}`);
    }
  };

  // 格式化金额
  const formatAmount = (amount: string | null) => {
    if (!amount) return "-";
    return `¥${parseFloat(amount).toLocaleString()}`;
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
            新增合同
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-5 gap-4 px-6 py-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">合同总数</p>
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
              <p className="text-sm text-gray-600">草稿</p>
              <p className="text-2xl font-semibold text-gray-700 mt-1">{stats.draft}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
              <FileText className="h-5 w-5 text-gray-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-amber-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600">待签</p>
              <p className="text-2xl font-semibold text-amber-700 mt-1">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-emerald-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-600">已签</p>
              <p className="text-2xl font-semibold text-emerald-700 mt-1">{stats.signed}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <FileText className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-red-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">已到期</p>
              <p className="text-2xl font-semibold text-red-700 mt-1">{stats.expired}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-500" />
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
            placeholder="搜索企业名称、合同编号..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-9 text-sm">
            <SelectValue placeholder="合同状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
            <SelectItem value="pending">待签</SelectItem>
            <SelectItem value="signed">已签</SelectItem>
            <SelectItem value="expired">已到期</SelectItem>
            <SelectItem value="terminated">已终止</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 合同列表 */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  合同编号
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  企业名称
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  合同类型
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  租金金额
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  押金金额
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  合同期限
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">状态</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p>暂无合同数据</p>
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900 font-mono">
                        {contract.contractNo || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-slate-900">
                          {contract.enterpriseName || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          contractTypeConfig[contract.contractType].className
                        )}
                      >
                        {contractTypeConfig[contract.contractType].label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {formatAmount(contract.rentAmount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {formatAmount(contract.depositAmount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {contract.startDate && contract.endDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {contract.startDate} ~ {contract.endDate}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-medium",
                          statusConfig[contract.status].className
                        )}
                      >
                        {statusConfig[contract.status].label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                          onClick={() => handleView(contract)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {contract.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-amber-600"
                          >
                            <Edit className="h-4 w-4" />
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
