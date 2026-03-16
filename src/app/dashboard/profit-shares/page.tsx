"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import {
  Plus,
  Calculator,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  MoreHorizontal,
  Edit,
  Trash2,
  XCircle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProfitShare {
  id: string;
  customerId?: string;
  ledgerId?: string;
  salesId?: string;
  accountantId?: string;
  profitRuleId: string;
  totalAmount: number;
  salesAmount: number;
  accountantAmount: number;
  period: string;
  status: string;
  notes?: string;
  createdAt: string;
  paidAt?: string;
}

interface ProfitRule {
  id: string;
  name: string;
  salesRate: number;
  accountantRate: number;
}

interface User {
  id: string;
  name: string;
  role: string;
}

interface Customer {
  id: string;
  name: string;
}

interface Ledger {
  id: string;
  name: string;
  customerId: string;
}

export default function ProfitSharesPage() {
  const [profitShares, setProfitShares] = useState<ProfitShare[]>([]);
  const [profitRules, setProfitRules] = useState<ProfitRule[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formData, setFormData] = useState({
    customerId: "",
    ledgerId: "",
    salesId: "",
    accountantId: "",
    profitRuleId: "",
    totalAmount: "",
    period: new Date().toISOString().slice(0, 7),
    notes: "",
  });

  useEffect(() => {
    fetchProfitShares();
    fetchProfitRules();
    fetchUsers();
    fetchCustomers();
    fetchLedgers();
  }, [searchTerm, statusFilter]);

  const fetchProfitShares = async () => {
    try {
      setLoading(true);
      const client = getSupabaseClient();

      let query = client
        .from("profit_shares")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (searchTerm) {
        query = query.ilike("period", `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProfitShares(data || []);
    } catch (error) {
      console.error("获取分润列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfitRules = async () => {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("profit_rules")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      setProfitRules(data || []);
    } catch (error) {
      console.error("获取分润规则失败:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("users")
        .select("id, name, role")
        .eq("is_active", true);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("获取用户列表失败:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("customers")
        .select("id, name");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("获取客户列表失败:", error);
    }
  };

  const fetchLedgers = async () => {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("ledgers")
        .select("id, name, customer_id");

      if (error) throw error;
      const ledgers = (data || []).map((ledger: any) => ({
        id: ledger.id,
        name: ledger.name,
        customerId: ledger.customer_id,
      }));
      setLedgers(ledgers);
    } catch (error) {
      console.error("获取账套列表失败:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const client = getSupabaseClient();
      const rule = profitRules.find((r) => r.id === formData.profitRuleId);

      if (!rule) {
        alert("请选择分润规则");
        return;
      }

      const totalAmount = parseInt(formData.totalAmount) * 100; // 转换为分
      const salesAmount = Math.floor(totalAmount * rule.salesRate / 1000);
      const accountantAmount = Math.floor(totalAmount * rule.accountantRate / 1000);

      const { error } = await client.from("profit_shares").insert({
        customerId: formData.customerId || null,
        ledgerId: formData.ledgerId || null,
        salesId: formData.salesId || null,
        accountantId: formData.accountantId || null,
        profitRuleId: formData.profitRuleId,
        totalAmount,
        salesAmount,
        accountantAmount,
        period: formData.period,
        notes: formData.notes,
      });

      if (error) throw error;

      setDialogOpen(false);
      setFormData({
        customerId: "",
        ledgerId: "",
        salesId: "",
        accountantId: "",
        profitRuleId: "",
        totalAmount: "",
        period: new Date().toISOString().slice(0, 7),
        notes: "",
      });
      fetchProfitShares();
    } catch (error) {
      console.error("创建分润记录失败:", error);
      alert("创建分润记录失败");
    }
  };

  const updateStatus = async (profitShareId: string, newStatus: string) => {
    try {
      const client = getSupabaseClient();
      const updateData: any = { status: newStatus };
      if (newStatus === "paid") {
        updateData.paidAt = new Date().toISOString();
      }

      const { error } = await client
        .from("profit_shares")
        .update(updateData)
        .eq("id", profitShareId);

      if (error) throw error;
      fetchProfitShares();
    } catch (error) {
      console.error("更新分润状态失败:", error);
      alert("更新失败");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; bg: string; icon: any }> = {
      pending: { text: "待确认", bg: "bg-yellow-100 text-yellow-800", icon: Clock },
      confirmed: { text: "已确认", bg: "bg-blue-100 text-blue-800", icon: CheckCircle2 },
      paid: { text: "已支付", bg: "bg-green-100 text-green-800", icon: DollarSign },
    };
    const s = statusMap[status] || { text: status, bg: "bg-gray-100 text-gray-800", icon: null };
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${s.bg}`}>
        {Icon && <Icon className="h-3 w-3" />}
        {s.text}
      </span>
    );
  };

  const getRuleName = (ruleId: string) => {
    const rule = profitRules.find((r) => r.id === ruleId);
    return rule?.name || "-";
  };

  const getUserName = (userId?: string) => {
    if (!userId) return "-";
    const user = users.find((u) => u.id === userId);
    return user?.name || "-";
  };

  const getCustomerName = (customerId?: string) => {
    if (!customerId) return "-";
    const customer = customers.find((c) => c.id === customerId);
    return customer?.name || "-";
  };

  const getLedgerName = (ledgerId?: string) => {
    if (!ledgerId) return "-";
    const ledger = ledgers.find((l) => l.id === ledgerId);
    return ledger?.name || "-";
  };

  const formatCurrency = (amount: number) => {
    return `¥${(amount / 100).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">分润结算</h2>
          <p className="text-gray-600 mt-1">管理销售与会计的分润记录</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              创建分润记录
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>创建分润记录</DialogTitle>
              <DialogDescription>记录销售与会计的业绩分成</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerId">关联客户</Label>
                    <Select
                      value={formData.customerId}
                      onValueChange={(value) => {
                        setFormData({ ...formData, customerId: value, ledgerId: "" });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择客户" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ledgerId">关联账套</Label>
                    <Select
                      value={formData.ledgerId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, ledgerId: value })
                      }
                      disabled={!formData.customerId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择账套" />
                      </SelectTrigger>
                      <SelectContent>
                        {ledgers
                          .filter((l) => l.customerId === formData.customerId)
                          .map((ledger) => (
                            <SelectItem key={ledger.id} value={ledger.id}>
                              {ledger.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salesId">销售人员</Label>
                    <Select
                      value={formData.salesId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, salesId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择销售" />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter((u) => u.role === "sales")
                          .map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountantId">会计人员</Label>
                    <Select
                      value={formData.accountantId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, accountantId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择会计" />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter((u) => u.role === "accountant")
                          .map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profitRuleId">分润规则 *</Label>
                    <Select
                      value={formData.profitRuleId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, profitRuleId: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择规则" />
                      </SelectTrigger>
                      <SelectContent>
                        {profitRules.map((rule) => (
                          <SelectItem key={rule.id} value={rule.id}>
                            {rule.name} (销售: {rule.salesRate / 10}%, 会计: {rule.accountantRate / 10}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalAmount">总金额 (元) *</Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      value={formData.totalAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, totalAmount: e.target.value })
                      }
                      placeholder="0.00"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="period">结算周期 *</Label>
                    <Input
                      id="period"
                      type="month"
                      value={formData.period}
                      onChange={(e) =>
                        setFormData({ ...formData, period: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">备注</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="备注信息..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  取消
                </Button>
                <Button type="submit">保存</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索结算周期..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待确认</SelectItem>
                <SelectItem value="confirmed">已确认</SelectItem>
                <SelectItem value="paid">已支付</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 分润列表 */}
      <Card>
        <CardHeader>
          <CardTitle>分润记录</CardTitle>
          <CardDescription>共 {profitShares.length} 条记录</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : profitShares.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无分润记录</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>结算周期</TableHead>
                  <TableHead>客户/账套</TableHead>
                  <TableHead>销售/会计</TableHead>
                  <TableHead>总金额</TableHead>
                  <TableHead>销售分成</TableHead>
                  <TableHead>会计分成</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profitShares.map((share) => (
                  <TableRow key={share.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="font-medium">{share.period}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{getCustomerName(share.customerId)}</div>
                        {share.ledgerId && (
                          <div className="text-gray-500">{getLedgerName(share.ledgerId)}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {share.salesId && <div>销售: {getUserName(share.salesId)}</div>}
                        {share.accountantId && <div>会计: {getUserName(share.accountantId)}</div>}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(share.totalAmount)}
                    </TableCell>
                    <TableCell className="text-blue-600">
                      {formatCurrency(share.salesAmount)}
                    </TableCell>
                    <TableCell className="text-green-600">
                      {formatCurrency(share.accountantAmount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(share.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>操作</DropdownMenuLabel>
                          {share.status === "pending" && (
                            <DropdownMenuItem onClick={() => updateStatus(share.id, "confirmed")}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              确认
                            </DropdownMenuItem>
                          )}
                          {share.status === "confirmed" && (
                            <DropdownMenuItem onClick={() => updateStatus(share.id, "paid")}>
                              <DollarSign className="mr-2 h-4 w-4" />
                              标记已支付
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
