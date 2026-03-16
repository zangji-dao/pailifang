"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import {
  Plus,
  Search,
  Filter,
  ClipboardList,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface WorkOrder {
  id: string;
  title: string;
  type: string;
  description?: string;
  customerId?: string;
  ledgerId?: string;
  assignedTo: string;
  createdBy: string;
  priority: string;
  status: string;
  dueDate?: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
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

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [formData, setFormData] = useState({
    title: "",
    type: "bookkeeping",
    description: "",
    customerId: "",
    ledgerId: "",
    assignedTo: "",
    priority: "medium",
    dueDate: "",
  });

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchWorkOrders();
    fetchUsers();
    fetchCustomers();
    fetchLedgers();
  }, [searchTerm, statusFilter, priorityFilter]);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const client = getSupabaseClient();

      let query = client.from("work_orders").select("*").order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (priorityFilter !== "all") {
        query = query.eq("priority", priorityFilter);
      }

      if (searchTerm) {
        query = query.ilike("title", `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setWorkOrders(data || []);
    } catch (error) {
      console.error("获取工单列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("users")
        .select("id, name")
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

      const { error } = await client.from("work_orders").insert({
        ...formData,
        createdBy: currentUser.id,
        dueDate: formData.dueDate || null,
        customerId: formData.customerId || null,
        ledgerId: formData.ledgerId || null,
      });

      if (error) throw error;

      setDialogOpen(false);
      setFormData({
        title: "",
        type: "bookkeeping",
        description: "",
        customerId: "",
        ledgerId: "",
        assignedTo: "",
        priority: "medium",
        dueDate: "",
      });
      fetchWorkOrders();
    } catch (error) {
      console.error("创建工单失败:", error);
      alert("创建工单失败");
    }
  };

  const updateStatus = async (workOrderId: string, newStatus: string) => {
    try {
      const client = getSupabaseClient();
      const updateData: any = { status: newStatus };
      if (newStatus === "completed") {
        updateData.completedAt = new Date().toISOString();
      }

      const { error } = await client
        .from("work_orders")
        .update(updateData)
        .eq("id", workOrderId);

      if (error) throw error;
      fetchWorkOrders();
    } catch (error) {
      console.error("更新工单状态失败:", error);
      alert("更新失败");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; bg: string; icon: any }> = {
      pending: { text: "待处理", bg: "bg-gray-100 text-gray-800", icon: Clock },
      in_progress: { text: "进行中", bg: "bg-blue-100 text-blue-800", icon: Play },
      completed: { text: "已完成", bg: "bg-green-100 text-green-800", icon: CheckCircle2 },
      cancelled: { text: "已取消", bg: "bg-red-100 text-red-800", icon: XCircle },
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

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { text: string; bg: string }> = {
      low: { text: "低", bg: "bg-gray-100 text-gray-800" },
      medium: { text: "中", bg: "bg-yellow-100 text-yellow-800" },
      high: { text: "高", bg: "bg-red-100 text-red-800" },
    };
    const p = priorityMap[priority] || { text: priority, bg: "bg-gray-100 text-gray-800" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.bg}`}>
        {p.text}
      </span>
    );
  };

  const getTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      bookkeeping: "记账",
      tax_declaration: "报税",
      audit: "审计",
      other: "其他",
    };
    return typeMap[type] || type;
  };

  const getUserName = (userId: string) => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">工单管理</h2>
          <p className="text-gray-600 mt-1">分配和跟踪工作任务</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              创建工单
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>创建工单</DialogTitle>
              <DialogDescription>分配新的工作任务</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">工单标题 *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="例如：2024年1月月度报税"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">工单类型 *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bookkeeping">记账</SelectItem>
                        <SelectItem value="tax_declaration">报税</SelectItem>
                        <SelectItem value="audit">审计</SelectItem>
                        <SelectItem value="other">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">优先级 *</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        setFormData({ ...formData, priority: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">低</SelectItem>
                        <SelectItem value="medium">中</SelectItem>
                        <SelectItem value="high">高</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
                    <Label htmlFor="assignedTo">指派给 *</Label>
                    <Select
                      value={formData.assignedTo}
                      onValueChange={(value) =>
                        setFormData({ ...formData, assignedTo: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择人员" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">截止日期</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">描述</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    placeholder="工单的详细描述..."
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
                <Button type="submit">创建</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索工单标题..."
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
                <SelectItem value="pending">待处理</SelectItem>
                <SelectItem value="in_progress">进行中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <AlertTriangle className="mr-2 h-4 w-4" />
                <SelectValue placeholder="优先级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部优先级</SelectItem>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="low">低</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 工单列表 */}
      <Card>
        <CardHeader>
          <CardTitle>工单列表</CardTitle>
          <CardDescription>共 {workOrders.length} 个工单</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : workOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无工单数据</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>工单标题</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>关联客户</TableHead>
                  <TableHead>指派给</TableHead>
                  <TableHead>优先级</TableHead>
                  <TableHead>截止日期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.title}</TableCell>
                    <TableCell>{getTypeName(order.type)}</TableCell>
                    <TableCell>{getCustomerName(order.customerId)}</TableCell>
                    <TableCell>{getUserName(order.assignedTo)}</TableCell>
                    <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                    <TableCell>
                      {order.dueDate ? (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span className="text-sm">
                            {format(new Date(order.dueDate), "yyyy-MM-dd", { locale: zhCN })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>操作</DropdownMenuLabel>
                          {order.status === "pending" && (
                            <DropdownMenuItem onClick={() => updateStatus(order.id, "in_progress")}>
                              <Play className="mr-2 h-4 w-4" />
                              开始处理
                            </DropdownMenuItem>
                          )}
                          {order.status === "in_progress" && (
                            <DropdownMenuItem onClick={() => updateStatus(order.id, "completed")}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              标记完成
                            </DropdownMenuItem>
                          )}
                          {(order.status === "pending" || order.status === "in_progress") && (
                            <DropdownMenuItem onClick={() => updateStatus(order.id, "cancelled")}>
                              <XCircle className="mr-2 h-4 w-4" />
                              取消工单
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
