"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  MoreHorizontal,
  Edit,
  Trash2,
  Building2,
  Building,
  Users,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiClient, PaginatedResponse } from "@/lib/apiClient";

// 企业类型：基地内注册 / 基地外注册
type RegistrationType = "in_base" | "out_base";

interface Customer {
  id: string;
  name: string;
  contactPerson: string;
  contactPhone: string;
  email?: string;
  address?: string;
  salesId?: string;
  status: string;
  registrationType: RegistrationType; // 新增：企业类型
  notes?: string;
  createdAt: string;
}

// 统计卡片组件
function StatsCards({ customers }: { customers: Customer[] }) {
  const inBaseCount = customers.filter((c) => c.registrationType === "in_base").length;
  const outBaseCount = customers.filter((c) => c.registrationType === "out_base").length;
  const activeCount = customers.filter((c) => c.status === "cooperative").length;
  const potentialCount = customers.filter((c) => c.status === "potential").length;

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">基地内企业</p>
              <p className="text-2xl font-bold text-slate-900">{inBaseCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Building className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">基地外企业</p>
              <p className="text-2xl font-bold text-slate-900">{outBaseCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">合作中</p>
              <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">潜在客户</p>
              <p className="text-2xl font-bold text-slate-900">{potentialCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<string>("all");

  // 表单状态
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    contactPhone: "",
    email: "",
    address: "",
    salesId: "",
    status: "potential",
    registrationType: "in_base" as RegistrationType,
    notes: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, statusFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await apiClient.get<PaginatedResponse<Customer>>(
        `/api/customers?${params.toString()}`
      );

      if (response.success && response.data) {
        setCustomers(response.data.data);
      } else {
        setCustomers(getMockCustomers());
      }
    } catch (error) {
      console.error("获取客户列表失败，使用模拟数据:", error);
      setCustomers(getMockCustomers());
    } finally {
      setLoading(false);
    }
  };

  // 模拟数据
  const getMockCustomers = (): Customer[] => {
    const mockData: Customer[] = [
      {
        id: "1",
        name: "吉林省宏远贸易公司",
        contactPerson: "张总",
        contactPhone: "13800138001",
        email: "zhang@hongyuan.com",
        address: "长春市朝阳区人民大街123号",
        status: "cooperative",
        registrationType: "in_base",
        notes: "重要客户，月度记账",
        createdAt: "2025-12-01",
      },
      {
        id: "2",
        name: "松原市宇鑫化工有限公司",
        contactPerson: "李经理",
        contactPhone: "13900139002",
        email: "li@yuxin.com",
        address: "松原市宁江区化工园区",
        status: "cooperative",
        registrationType: "in_base",
        notes: "代理记账+税务申报",
        createdAt: "2025-11-15",
      },
      {
        id: "3",
        name: "华信科技有限公司",
        contactPerson: "王总",
        contactPhone: "13700137003",
        email: "wang@huaxin.com",
        address: "长春市高新区硅谷大街",
        status: "cooperative",
        registrationType: "in_base",
        notes: "工商注册+记账",
        createdAt: "2025-10-20",
      },
      {
        id: "4",
        name: "新兴建材有限公司",
        contactPerson: "赵总",
        contactPhone: "13600136004",
        email: "zhao@xinxing.com",
        address: "四平市铁东区",
        status: "potential",
        registrationType: "out_base",
        notes: "潜在客户，有合作意向",
        createdAt: "2026-01-10",
      },
      {
        id: "5",
        name: "长春市盛世餐饮公司",
        contactPerson: "孙经理",
        contactPhone: "13500135005",
        email: "sun@shengshi.com",
        address: "长春市南关区重庆路",
        status: "inactive",
        registrationType: "out_base",
        notes: "已暂停合作",
        createdAt: "2025-08-05",
      },
      {
        id: "6",
        name: "吉林省博远科技有限公司",
        contactPerson: "周总",
        contactPhone: "13400134006",
        email: "zhou@boyuan.com",
        address: "长春市经开区兴隆山",
        status: "cooperative",
        registrationType: "in_base",
        notes: "新注册企业，代理记账",
        createdAt: "2026-01-05",
      },
      {
        id: "7",
        name: "沈阳恒达商贸有限公司",
        contactPerson: "刘经理",
        contactPhone: "13300133007",
        email: "liu@hengda.com",
        address: "沈阳市和平区",
        status: "potential",
        registrationType: "out_base",
        notes: "外省客户，意向合作",
        createdAt: "2026-02-01",
      },
    ];

    return mockData.filter((customer) => {
      if (statusFilter !== "all" && customer.status !== statusFilter) {
        return false;
      }
      if (
        searchTerm &&
        !customer.name.includes(searchTerm) &&
        !customer.contactPerson.includes(searchTerm)
      ) {
        return false;
      }
      return true;
    });
  };

  // 根据 Tab 过滤
  const filteredCustomers = customers.filter((customer) => {
    if (activeTab === "all") return true;
    if (activeTab === "in_base") return customer.registrationType === "in_base";
    if (activeTab === "out_base") return customer.registrationType === "out_base";
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post<Customer>("/api/customers", {
        ...formData,
        sales_id: formData.salesId || null,
      });

      if (!response.success) {
        throw new Error(response.error || "创建客户失败");
      }

      setDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      console.error("创建客户失败，使用本地模拟:", error);
      const newCustomer: Customer = {
        id: `mock-${Date.now()}`,
        name: formData.name,
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
        email: formData.email || undefined,
        address: formData.address || undefined,
        status: formData.status,
        registrationType: formData.registrationType,
        notes: formData.notes || undefined,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setCustomers((prev) => [newCustomer, ...prev]);
      setDialogOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      contactPerson: "",
      contactPhone: "",
      email: "",
      address: "",
      salesId: "",
      status: "potential",
      registrationType: "in_base",
      notes: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; bg: string }> = {
      potential: { text: "潜在客户", bg: "bg-blue-100 text-blue-800" },
      cooperative: { text: "合作中", bg: "bg-green-100 text-green-800" },
      inactive: { text: "已暂停", bg: "bg-gray-100 text-gray-800" },
      lost: { text: "已流失", bg: "bg-red-100 text-red-800" },
    };
    const s = statusMap[status] || { text: status, bg: "bg-gray-100 text-gray-800" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.bg}`}>
        {s.text}
      </span>
    );
  };

  const getRegistrationTypeBadge = (type: RegistrationType) => {
    if (type === "in_base") {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          基地内
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        基地外
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">服务企业</h2>
          <p className="text-gray-600 mt-1">管理基地内外企业客户信息</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600">
              <Plus className="mr-2 h-4 w-4" />
              添加企业
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>添加服务企业</DialogTitle>
              <DialogDescription>填写企业信息，录入系统</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 py-4">
                {/* 企业类型选择 */}
                <div className="space-y-2">
                  <Label htmlFor="registrationType">企业类型 *</Label>
                  <Select
                    value={formData.registrationType}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        registrationType: value as RegistrationType,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_base">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-amber-600" />
                          基地内注册企业
                        </div>
                      </SelectItem>
                      <SelectItem value="out_base">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-blue-600" />
                          基地外注册企业
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    {formData.registrationType === "in_base"
                      ? "基地内注册企业：在创业基地/园区内注册的企业"
                      : "基地外注册企业：未在基地内注册的外部企业"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">企业名称 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">联系人 *</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) =>
                        setFormData({ ...formData, contactPerson: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">联系电话 *</Label>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, contactPhone: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">地址</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">客户状态 *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="potential">潜在客户</SelectItem>
                      <SelectItem value="cooperative">合作中</SelectItem>
                      <SelectItem value="inactive">已暂停</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">备注</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit" className="bg-amber-500 hover:bg-amber-600">
                  保存
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      <StatsCards customers={customers} />

      {/* Tab 切换 + 筛选栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList>
                <TabsTrigger value="all">全部企业</TabsTrigger>
                <TabsTrigger value="in_base">
                  <Building2 className="h-4 w-4 mr-1.5" />
                  基地内企业
                </TabsTrigger>
                <TabsTrigger value="out_base">
                  <Building className="h-4 w-4 mr-1.5" />
                  基地外企业
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索企业名称或联系人..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-[220px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="筛选状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="potential">潜在客户</SelectItem>
                  <SelectItem value="cooperative">合作中</SelectItem>
                  <SelectItem value="inactive">已暂停</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 客户列表 */}
      <Card>
        <CardHeader>
          <CardTitle>企业列表</CardTitle>
          <CardDescription>
            共 {filteredCustomers.length} 家企业
            {activeTab === "in_base" && "（基地内注册）"}
            {activeTab === "out_base" && "（基地外注册）"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无企业数据</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>企业名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>联系人</TableHead>
                  <TableHead>联系电话</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{getRegistrationTypeBadge(customer.registrationType)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{customer.contactPerson}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        <span>{customer.contactPhone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          <span className="truncate max-w-[150px]">{customer.email}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(customer.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>操作</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Phone className="mr-2 h-4 w-4" />
                            联系记录
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
