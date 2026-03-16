"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Calendar,
  Users,
  MoreHorizontal,
  Calculator,
  LayoutGrid,
  List,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export interface Ledger {
  id: string;
  name: string;
  customerId: string;
  accountantId: string;
  year: number;
  status: string;
  standard: string;
  description?: string;
  createdAt: string;
}

// 模拟数据
const mockLedgers: Ledger[] = [
  {
    id: "ledger-001",
    name: "杭州某某科技有限公司",
    customerId: "cust-001",
    accountantId: "user-001",
    year: 2024,
    status: "active",
    standard: "小企业会计准则",
    createdAt: "2024-01-01",
  },
  {
    id: "ledger-002",
    name: "浙江某某贸易公司",
    customerId: "cust-002",
    accountantId: "user-002",
    year: 2024,
    status: "active",
    standard: "企业会计准则",
    createdAt: "2024-02-15",
  },
  {
    id: "ledger-003",
    name: "杭州某某餐饮有限公司",
    customerId: "cust-003",
    accountantId: "user-001",
    year: 2023,
    status: "closed",
    standard: "小企业会计准则",
    createdAt: "2023-01-01",
  },
];

const mockCustomers = [
  { id: "cust-001", name: "杭州某某科技有限公司" },
  { id: "cust-002", name: "浙江某某贸易公司" },
  { id: "cust-003", name: "杭州某某餐饮有限公司" },
];

const mockAccountants = [
  { id: "user-001", name: "张会计" },
  { id: "user-002", name: "李会计" },
];

interface LedgerListProps {
  title?: string;
  description?: string;
  onCreateClick?: () => void;
  onSwitchClick?: (ledger: Ledger) => void;
  showSwitchButton?: boolean;
  defaultView?: "list" | "card";
}

export function LedgerList({
  title = "我的账套",
  description = "管理您的所有账套，点击切换当前操作的账套",
  onCreateClick,
  onSwitchClick,
  showSwitchButton = true,
  defaultView = "list",
}: LedgerListProps) {
  const router = useRouter();
  const [ledgers] = useState<Ledger[]>(mockLedgers);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "card">(defaultView);

  // 过滤账套
  const filteredLedgers = ledgers.filter((ledger) => {
    if (statusFilter !== "all" && ledger.status !== statusFilter) return false;
    if (searchTerm && !ledger.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; bg: string }> = {
      active: { text: "进行中", bg: "bg-green-100 text-green-800" },
      closed: { text: "已结账", bg: "bg-blue-100 text-blue-800" },
      archived: { text: "已归档", bg: "bg-gray-100 text-gray-800" },
    };
    const s = statusMap[status] || { text: status, bg: "bg-gray-100 text-gray-800" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.bg}`}>
        {s.text}
      </span>
    );
  };

  const getCustomerName = (customerId: string) => {
    const customer = mockCustomers.find((c) => c.id === customerId);
    return customer?.name || "-";
  };

  const getAccountantName = (accountantId: string) => {
    const accountant = mockAccountants.find((a) => a.id === accountantId);
    return accountant?.name || "-";
  };

  const handleCreateClick = () => {
    if (onCreateClick) {
      onCreateClick();
    } else {
      router.push("/dashboard/ledgers/create");
    }
  };

  const handleSwitchClick = (ledger: Ledger) => {
    if (onSwitchClick) {
      onSwitchClick(ledger);
    } else {
      // 默认跳转到会计页面
      router.push(`/accounting?ledger=${ledger.id}`);
    }
  };

  // 卡片视图组件
  const CardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredLedgers.map((ledger) => (
        <Card
          key={ledger.id}
          className="border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 line-clamp-1">{ledger.name}</h3>
                  <p className="text-xs text-slate-500">{ledger.year}年度</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>操作</DropdownMenuLabel>
                  <DropdownMenuItem>编辑</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">删除</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <span className="truncate">{getCustomerName(ledger.customerId)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>负责会计：{getAccountantName(ledger.accountantId)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Calculator className="h-3.5 w-3.5 text-slate-400" />
                <span className="truncate">{ledger.standard}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
              {getStatusBadge(ledger.status)}
              {showSwitchButton && (
                <Button
                  size="sm"
                  className="h-7 bg-amber-500 hover:bg-amber-600 text-white text-xs"
                  onClick={() => handleSwitchClick(ledger)}
                >
                  切换
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // 列表视图组件
  const ListView = () => (
    <Card>
      <CardHeader>
        <CardTitle>账套列表</CardTitle>
        <CardDescription>共 {filteredLedgers.length} 个账套</CardDescription>
      </CardHeader>
      <CardContent>
        {filteredLedgers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无账套数据</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>账套名称</TableHead>
                <TableHead>所属客户</TableHead>
                <TableHead>负责会计</TableHead>
                <TableHead>年度</TableHead>
                <TableHead>会计准则</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLedgers.map((ledger) => (
                <TableRow key={ledger.id}>
                  <TableCell className="font-medium">{ledger.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-gray-400" />
                      <span>{getCustomerName(ledger.customerId)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getAccountantName(ledger.accountantId)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span>{ledger.year}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-500">{ledger.standard}</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(ledger.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {showSwitchButton && (
                        <Button
                          size="sm"
                          className="h-8 bg-amber-500 hover:bg-amber-600 text-white"
                          onClick={() => handleSwitchClick(ledger)}
                        >
                          <Calculator className="mr-1.5 h-3.5 w-3.5" />
                          切换
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>操作</DropdownMenuLabel>
                          <DropdownMenuItem>编辑</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">删除</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="text-slate-500 mt-1">{description}</p>
        </div>
        <Button onClick={handleCreateClick} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="mr-2 h-4 w-4" />
          创建账套
        </Button>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索账套名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <span className="text-slate-400">筛选状态</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">进行中</SelectItem>
                <SelectItem value="closed">已结账</SelectItem>
                <SelectItem value="archived">已归档</SelectItem>
              </SelectContent>
            </Select>
            {/* 视图切换 */}
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as "list" | "card")}
              className="border rounded-md"
            >
              <ToggleGroupItem value="list" className="px-3" aria-label="列表视图">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="card" className="px-3" aria-label="卡片视图">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>

      {/* 账套列表/卡片 */}
      {viewMode === "list" ? <ListView /> : <CardView />}
    </div>
  );
}
