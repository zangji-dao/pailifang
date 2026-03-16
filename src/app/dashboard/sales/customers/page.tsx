"use client";

import { useState } from "react";
import {
  Users,
  Phone,
  Mail,
  MessageSquare,
  Building2,
  Calendar,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Clock,
  MapPin,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 我的客户数据
const MY_CUSTOMERS = [
  {
    id: "C001",
    name: "吉林省宏远贸易公司",
    contact: "张总",
    phone: "138****0001",
    email: "zhang@hongyuan.com",
    status: "active",
    totalAmount: 28600,
    lastFollow: "今天",
    nextFollow: "明天 10:00",
    services: ["代理记账", "税务申报"],
    daysWithMe: 180,
  },
  {
    id: "C002",
    name: "松原市宇鑫化工有限公司",
    contact: "李经理",
    phone: "139****0002",
    email: "li@yuxin.com",
    status: "active",
    totalAmount: 15200,
    lastFollow: "昨天",
    nextFollow: "后天 14:00",
    services: ["公司注册", "代理记账"],
    daysWithMe: 90,
  },
  {
    id: "C003",
    name: "华信科技有限公司",
    contact: "王总",
    phone: "137****0003",
    email: "wang@huaxin.com",
    status: "pending",
    totalAmount: 8000,
    lastFollow: "3天前",
    nextFollow: "今天 16:00",
    services: ["商标注册"],
    daysWithMe: 30,
  },
  {
    id: "C004",
    name: "新兴建材有限公司",
    contact: "赵总",
    phone: "136****0004",
    email: "zhao@xinxing.com",
    status: "potential",
    totalAmount: 0,
    lastFollow: "7天前",
    nextFollow: "待安排",
    services: ["咨询中"],
    daysWithMe: 15,
  },
  {
    id: "C005",
    name: "长春市盛世餐饮公司",
    contact: "孙经理",
    phone: "135****0005",
    email: "sun@shengshi.com",
    status: "inactive",
    totalAmount: 12000,
    lastFollow: "30天前",
    nextFollow: "-",
    services: ["暂停合作"],
    daysWithMe: 200,
  },
];

// 跟进记录
const FOLLOW_RECORDS = [
  { customer: "吉林省宏远贸易公司", action: "电话沟通", content: "确认本月报税事宜", time: "今天 10:30" },
  { customer: "松原市宇鑫化工", action: "微信回复", content: "发送了服务报价单", time: "昨天 16:20" },
  { customer: "华信科技", action: "上门拜访", content: "洽谈商标注册业务", time: "3天前" },
];

export default function MyCustomersPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: "合作中", variant: "default" },
      pending: { label: "跟进中", variant: "secondary" },
      potential: { label: "潜在客户", variant: "outline" },
      inactive: { label: "已暂停", variant: "destructive" },
    };
    const c = config[status] || { label: status, variant: "secondary" };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">我的客户</h1>
          <p className="text-slate-500 mt-1">管理名下客户资源</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            退回公海
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500">
            <Plus className="h-4 w-4" />
            新增客户
          </Button>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="border-slate-200/60">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">客户总数</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">38</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">合作中</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">22</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">跟进中</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">10</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">本月成交</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">¥63,800</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">待跟进</p>
            <p className="text-2xl font-bold text-red-600 mt-1">5</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 客户列表 */}
        <div className="col-span-2 space-y-4">
          {/* Tab 筛选 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === "all" ? "bg-amber-100 text-amber-700" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === "active" ? "bg-amber-100 text-amber-700" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              合作中
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === "pending" ? "bg-amber-100 text-amber-700" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              跟进中
            </button>
            <div className="flex-1" />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="搜索客户..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 pl-9"
              />
            </div>
          </div>

          {/* 客户卡片列表 */}
          <div className="space-y-3">
            {MY_CUSTOMERS.map((customer) => (
              <Card key={customer.id} className="border-slate-200/60 hover:border-amber-200 transition-colors">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-medium">
                        {customer.contact.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{customer.name}</span>
                          {getStatusBadge(customer.status)}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                          <span>{customer.contact}</span>
                          <span>{customer.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {customer.services.map((service, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">{service}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-6">
                      <div className="text-right">
                        <p className="text-sm text-slate-500">累计金额</p>
                        <p className="font-semibold text-emerald-600">¥{customer.totalAmount.toLocaleString()}</p>
                      </div>
                      <div className="text-right w-24">
                        <p className="text-sm text-slate-500">下次跟进</p>
                        <p className="text-sm font-medium text-slate-700">{customer.nextFollow}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Phone className="h-4 w-4 text-slate-400" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <MessageSquare className="h-4 w-4 text-slate-400" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              查看详情
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              编辑客户
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="h-4 w-4 mr-2" />
                              添加跟进
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <RefreshCw className="h-4 w-4 mr-2" />
                              退回公海
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 右侧面板 */}
        <div className="space-y-4">
          {/* 今日待办 */}
          <Card className="border-slate-200/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                今日待办
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900 text-sm">华信科技</span>
                    <span className="text-xs text-slate-500">16:00</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">跟进商标注册意向</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900 text-sm">新兴建材</span>
                    <span className="text-xs text-slate-500">待安排</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">7天未跟进，需尽快联系</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 最近跟进 */}
          <Card className="border-slate-200/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">最近跟进</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {FOLLOW_RECORDS.map((record, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Phone className="h-3 w-3 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{record.customer}</p>
                      <p className="text-xs text-slate-500">{record.content}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{record.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
