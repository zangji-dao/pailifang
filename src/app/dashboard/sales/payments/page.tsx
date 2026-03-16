"use client";

import { useState } from "react";
import {
  Wallet,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  FileText,
  Download,
  ChevronRight,
  Building2,
  User,
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

// 回款统计
const PAYMENT_STATS = [
  {
    title: "本月回款",
    value: "¥86,500",
    target: "¥120,000",
    progress: 72.1,
    change: "+15.2%",
    trend: "up",
    icon: Wallet,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    title: "待回款",
    value: "¥45,800",
    count: "8笔",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    title: "逾期未回",
    value: "¥12,000",
    count: "2笔",
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    title: "回款率",
    value: "85%",
    change: "+5%",
    trend: "up",
    icon: TrendingUp,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
];

// 待回款列表
const PENDING_PAYMENTS = [
  {
    id: "P001",
    customer: "吉林省宏远贸易公司",
    contract: "年度代理记账服务",
    amount: 18000,
    paidAmount: 0,
    dueDate: "2026-01-25",
    overdue: false,
    sales: "李销售",
    daysLeft: 9,
  },
  {
    id: "P002",
    customer: "松原市宇鑫化工有限公司",
    contract: "税务申报服务",
    amount: 12000,
    paidAmount: 0,
    dueDate: "2026-01-20",
    overdue: false,
    sales: "李销售",
    daysLeft: 4,
  },
  {
    id: "P003",
    customer: "华信科技有限公司",
    contract: "商标注册服务",
    amount: 8000,
    paidAmount: 0,
    dueDate: "2026-01-15",
    overdue: true,
    sales: "王销售",
    daysLeft: -1,
  },
  {
    id: "P004",
    customer: "新兴建材有限公司",
    contract: "工商变更服务",
    amount: 6000,
    paidAmount: 0,
    dueDate: "2026-01-18",
    overdue: false,
    sales: "李销售",
    daysLeft: 2,
  },
  {
    id: "P005",
    customer: "长春市盛世餐饮公司",
    contract: "代理记账服务",
    amount: 4000,
    paidAmount: 0,
    dueDate: "2026-01-10",
    overdue: true,
    sales: "张销售",
    daysLeft: -6,
  },
];

// 回款记录
const PAYMENT_RECORDS = [
  {
    id: "R001",
    customer: "吉林省宏远贸易公司",
    contract: "代理记账-2025年12月",
    amount: 6000,
    method: "银行转账",
    time: "今天 10:30",
    sales: "李销售",
  },
  {
    id: "R002",
    customer: "松原市宇鑫化工有限公司",
    contract: "税务申报-2025年12月",
    amount: 4500,
    method: "微信支付",
    time: "昨天 16:20",
    sales: "李销售",
  },
  {
    id: "R003",
    customer: "创新科技有限公司",
    contract: "公司注册服务",
    amount: 8000,
    method: "银行转账",
    time: "昨天 14:00",
    sales: "王销售",
  },
  {
    id: "R004",
    customer: "四平市新起点餐饮",
    contract: "代理记账-首付款",
    amount: 5000,
    method: "支付宝",
    time: "前天 11:30",
    sales: "张销售",
  },
];

// 回款计划
const PAYMENT_PLAN = [
  { week: "本周", amount: 28000, count: 3, completed: 18000 },
  { week: "下周", amount: 35000, count: 4, completed: 0 },
  { week: "本月", amount: 86500, count: 8, completed: 68000 },
];

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">回款管理</h1>
          <p className="text-slate-500 mt-1">应收账款与回款跟进</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出对账单
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500">
            <Plus className="h-4 w-4" />
            登记回款
          </Button>
        </div>
      </div>

      {/* 回款统计 */}
      <div className="grid grid-cols-4 gap-4">
        {PAYMENT_STATS.map((stat) => (
          <Card key={stat.title} className="border-slate-200/60">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  {stat.target && (
                    <p className="text-xs text-slate-400 mt-1">目标: {stat.target}</p>
                  )}
                  {stat.progress !== undefined && (
                    <Progress value={stat.progress} className="h-1.5 mt-2" />
                  )}
                  {stat.count && (
                    <p className="text-xs text-slate-400 mt-1">{stat.count}</p>
                  )}
                  {stat.change && (
                    <p className={`text-xs mt-2 ${stat.trend === "up" ? "text-emerald-600" : "text-red-600"}`}>
                      {stat.trend === "up" ? <TrendingUp className="h-3 w-3 inline mr-1" /> : <TrendingDown className="h-3 w-3 inline mr-1" />}
                      {stat.change} 较上月
                    </p>
                  )}
                </div>
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab 导航 */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "pending"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          待回款
          <Badge variant="secondary" className="ml-2">{PENDING_PAYMENTS.length}</Badge>
        </button>
        <button
          onClick={() => setActiveTab("records")}
          className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "records"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          回款记录
        </button>
        <button
          onClick={() => setActiveTab("plan")}
          className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "plan"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          回款计划
        </button>
      </div>

      {/* Tab 内容 */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {/* 搜索筛选 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="搜索客户..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-9"
                />
              </div>
              <select className="h-9 px-3 text-sm border border-slate-200 rounded-md">
                <option>全部状态</option>
                <option>即将到期</option>
                <option>已逾期</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-amber-600">
                <Clock className="h-3 w-3 mr-1" />
                即将到期 3笔
              </Badge>
              <Badge variant="outline" className="text-red-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                已逾期 2笔
              </Badge>
            </div>
          </div>

          {/* 待回款列表 */}
          <Card className="border-slate-200/60">
            <div className="divide-y divide-slate-100">
              {PENDING_PAYMENTS.map((payment) => (
                <div
                  key={payment.id}
                  className={`flex items-center justify-between p-4 ${
                    payment.overdue ? "bg-red-50/50" : ""
                  } hover:bg-slate-50 transition-colors`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      payment.overdue 
                        ? "bg-red-100" 
                        : payment.daysLeft <= 3 
                          ? "bg-amber-100" 
                          : "bg-slate-100"
                    }`}>
                      {payment.overdue ? (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      ) : payment.daysLeft <= 3 ? (
                        <Clock className="h-5 w-5 text-amber-600" />
                      ) : (
                        <Wallet className="h-5 w-5 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{payment.customer}</span>
                        {payment.overdue && (
                          <Badge variant="destructive" className="text-xs">已逾期</Badge>
                        )}
                        {!payment.overdue && payment.daysLeft <= 3 && (
                          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">即将到期</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{payment.contract}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">¥{payment.amount.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">销售: {payment.sales}</p>
                    </div>
                    <div className="text-right w-24">
                      <p className="text-sm text-slate-500">到期日</p>
                      <p className={`text-sm font-medium ${payment.overdue ? "text-red-600" : "text-slate-700"}`}>
                        {payment.dueDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        详情
                      </Button>
                      <Button size="sm" className="gap-1 bg-amber-500 hover:bg-amber-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        回款
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "records" && (
        <Card className="border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">回款记录</CardTitle>
            <div className="flex items-center gap-2">
              <Input placeholder="搜索..." className="w-48 h-8" />
              <select className="h-8 px-3 text-sm border border-slate-200 rounded-md">
                <option>全部方式</option>
                <option>银行转账</option>
                <option>微信支付</option>
                <option>支付宝</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {PAYMENT_RECORDS.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{record.customer}</span>
                        <Badge variant="secondary" className="text-xs">{record.method}</Badge>
                      </div>
                      <p className="text-sm text-slate-500">{record.contract}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">+¥{record.amount.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{record.time}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "plan" && (
        <div className="grid grid-cols-3 gap-6">
          {PAYMENT_PLAN.map((plan) => (
            <Card key={plan.week} className="border-slate-200/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{plan.week}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">计划回款</span>
                    <span className="text-xl font-bold text-slate-900">¥{plan.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">回款笔数</span>
                    <span className="font-medium">{plan.count}笔</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">已回款</span>
                    <span className="font-medium text-emerald-600">¥{plan.completed.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={(plan.completed / plan.amount) * 100} 
                    className="h-2"
                  />
                  <div className="text-center text-sm text-slate-500">
                    完成率 {((plan.completed / plan.amount) * 100).toFixed(1)}%
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
