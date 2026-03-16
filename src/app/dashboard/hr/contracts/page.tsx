"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Filter,
  Download,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Edit,
  Send,
  RefreshCw,
} from "lucide-react";

// 合同状态
const CONTRACT_STATUS = {
  draft: { label: "草稿", color: "bg-slate-100 text-slate-700", icon: FileText },
  pending: { label: "待签", color: "bg-amber-100 text-amber-700", icon: Clock },
  active: { label: "生效中", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  expired: { label: "已到期", color: "bg-red-100 text-red-700", icon: XCircle },
  terminated: { label: "已终止", color: "bg-slate-100 text-slate-500", icon: XCircle },
};

// 合同类型
const CONTRACT_TYPES = {
  labor: "劳动合同",
  dispatch: "派遣协议",
};

// 模拟合同数据
const MOCK_CONTRACTS = [
  {
    id: "1",
    employeeName: "张三",
    type: "labor",
    startDate: "2023-06-15",
    endDate: "2025-06-14",
    status: "active",
    projectName: null,
    remainingDays: 150,
  },
  {
    id: "2",
    employeeName: "李四",
    type: "labor",
    startDate: "2023-03-01",
    endDate: "2025-02-28",
    status: "active",
    projectName: null,
    remainingDays: 44,
  },
  {
    id: "3",
    employeeName: "王五",
    type: "dispatch",
    startDate: "2023-08-20",
    endDate: "2025-08-19",
    status: "active",
    projectName: "阿里巴巴客服项目",
    remainingDays: 216,
  },
  {
    id: "4",
    employeeName: "赵六",
    type: "labor",
    startDate: "2024-01-20",
    endDate: "2026-01-19",
    status: "pending",
    projectName: null,
    remainingDays: null,
  },
  {
    id: "5",
    employeeName: "钱七",
    type: "labor",
    startDate: "2022-05-10",
    endDate: "2024-05-09",
    status: "terminated",
    projectName: null,
    remainingDays: null,
  },
];

// 即将到期提醒
const EXPIRING_CONTRACTS = MOCK_CONTRACTS.filter(
  (c) => c.status === "active" && c.remainingDays && c.remainingDays <= 60
);

export default function ContractsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredContracts = MOCK_CONTRACTS.filter((contract) => {
    const matchesSearch = contract.employeeName.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
    const matchesType = typeFilter === "all" || contract.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">合同管理</h1>
          <p className="text-sm text-slate-500 mt-1">管理劳动合同和派遣协议</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <Plus className="h-4 w-4" />
            新增合同
          </Button>
        </div>
      </div>

      {/* 到期提醒 */}
      {EXPIRING_CONTRACTS.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">
                  有 {EXPIRING_CONTRACTS.length} 份合同即将到期
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  {EXPIRING_CONTRACTS.map((c) => c.employeeName).join("、")} 的合同将在60天内到期，请及时处理续签。
                </p>
                <Button variant="link" className="h-auto p-0 mt-2 text-amber-700">
                  查看详情 →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-slate-200/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">{MOCK_CONTRACTS.length}</p>
                <p className="text-xs text-slate-500">合同总数</p>
              </div>
              <FileText className="h-8 w-8 text-slate-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {MOCK_CONTRACTS.filter((c) => c.status === "active").length}
                </p>
                <p className="text-xs text-slate-500">生效中</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {MOCK_CONTRACTS.filter((c) => c.status === "pending").length}
                </p>
                <p className="text-xs text-slate-500">待签订</p>
              </div>
              <Clock className="h-8 w-8 text-amber-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {EXPIRING_CONTRACTS.length}
                </p>
                <p className="text-xs text-slate-500">即将到期</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-600">
                  {MOCK_CONTRACTS.filter((c) => c.status === "expired" || c.status === "terminated").length}
                </p>
                <p className="text-xs text-slate-500">已结束</p>
              </div>
              <XCircle className="h-8 w-8 text-slate-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card className="border-slate-200/60">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="搜索员工姓名..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="合同状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="pending">待签</SelectItem>
                <SelectItem value="active">生效中</SelectItem>
                <SelectItem value="expired">已到期</SelectItem>
                <SelectItem value="terminated">已终止</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="合同类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="labor">劳动合同</SelectItem>
                <SelectItem value="dispatch">派遣协议</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 合同列表 */}
      <Card className="border-slate-200/60">
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {filteredContracts.map((contract) => {
              const statusConfig = CONTRACT_STATUS[contract.status as keyof typeof CONTRACT_STATUS];
              return (
                <div
                  key={contract.id}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                >
                  {/* 合同图标 */}
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-slate-500" />
                  </div>

                  {/* 合同信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900">{contract.employeeName}</span>
                      <Badge variant="outline" className="text-xs">
                        {CONTRACT_TYPES[contract.type as keyof typeof CONTRACT_TYPES]}
                      </Badge>
                      {contract.projectName && (
                        <Badge variant="secondary" className="text-xs">
                          {contract.projectName}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {contract.startDate} ~ {contract.endDate}
                      </span>
                    </div>
                  </div>

                  {/* 状态和剩余天数 */}
                  <div className="text-right">
                    <Badge className={statusConfig.color}>
                      {statusConfig.label}
                    </Badge>
                    {contract.remainingDays !== null && contract.status === "active" && (
                      <p className={`text-xs mt-1 ${contract.remainingDays <= 30 ? "text-red-500" : contract.remainingDays <= 60 ? "text-amber-500" : "text-slate-500"}`}>
                        剩余 {contract.remainingDays} 天
                      </p>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1">
                    {contract.status === "pending" && (
                      <Button variant="outline" size="sm" className="gap-1">
                        <Send className="h-3.5 w-3.5" />
                        发送签署
                      </Button>
                    )}
                    {contract.status === "active" && contract.remainingDays && contract.remainingDays <= 60 && (
                      <Button variant="outline" size="sm" className="gap-1">
                        <RefreshCw className="h-3.5 w-3.5" />
                        续签
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
