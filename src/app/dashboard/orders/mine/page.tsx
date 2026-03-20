"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Building2,
  ChevronRight,
  FileText,
  CircleDot,
  Scale,
  Palette,
  Award,
  Briefcase,
  TrendingUp,
  Calendar,
  MessageCircle,
  Paperclip,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// 工单状态 Tab
const statusTabs = [
  { id: "in_progress", name: "进行中", count: 3, icon: Clock },
  { id: "pending_confirm", name: "待确认", count: 1, icon: AlertCircle },
  { id: "completed", name: "已完成", count: 12, icon: CheckCircle2 },
];

// 进行中/待确认工单
const myOrders = [
  {
    id: "WO-2026-006",
    type: "business" as const,
    typeName: "工商注册",
    title: "分公司注册",
    customer: "吉林省宏远贸易公司",
    amount: 2500,
    deadline: "2026-01-19",
    priority: "high" as const,
    salesPerson: "张销售",
    progress: 60,
    status: "in_progress" as const,
    currentStep: "等待工商局审核",
    createdAt: "2026-01-13 14:20",
    myShare: 1250,
  },
  {
    id: "WO-2026-007",
    type: "trademark" as const,
    typeName: "商标注册",
    title: "商标续展",
    customer: "松原市宇鑫化工有限公司",
    amount: 1800,
    deadline: "2026-01-22",
    priority: "medium" as const,
    salesPerson: "李销售",
    progress: 30,
    status: "in_progress" as const,
    currentStep: "准备续展材料",
    createdAt: "2026-01-14 09:15",
    myShare: 900,
  },
  {
    id: "WO-2026-008",
    type: "legal" as const,
    typeName: "法律咨询",
    title: "劳动纠纷咨询",
    customer: "华信科技有限公司",
    amount: 600,
    deadline: "2026-01-17",
    priority: "medium" as const,
    salesPerson: "王销售",
    progress: 80,
    status: "in_progress" as const,
    currentStep: "已提供咨询意见，等待客户确认",
    createdAt: "2026-01-12 16:30",
    myShare: 300,
  },
  {
    id: "WO-2026-009",
    type: "design" as const,
    typeName: "Logo设计",
    title: "品牌Logo设计",
    customer: "新兴建材有限公司",
    amount: 3500,
    deadline: "2026-01-20",
    priority: "medium" as const,
    salesPerson: "李销售",
    progress: 100,
    status: "pending_confirm" as const,
    currentStep: "已提交设计方案，等待确认",
    createdAt: "2026-01-10 11:00",
    myShare: 1750,
  },
];

// 已完成工单
const completedOrders = [
  {
    id: "WO-2026-005",
    type: "business" as const,
    typeName: "工商变更",
    title: "公司地址变更",
    customer: "长春市盛世餐饮有限公司",
    amount: 800,
    completedAt: "2026-01-14",
    salesPerson: "张销售",
    myShare: 400,
    rating: 5,
  },
  {
    id: "WO-2026-003",
    type: "trademark" as const,
    typeName: "商标注册",
    title: "商标申请",
    customer: "吉林省宏远贸易公司",
    amount: 1500,
    completedAt: "2026-01-12",
    salesPerson: "李销售",
    myShare: 750,
    rating: 4,
  },
];

// 统计数据
const stats = [
  { label: "进行中", value: 3, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
  { label: "本月完成", value: 12, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
  { label: "本月收入", value: "¥8,650", icon: TrendingUp, color: "text-violet-500", bg: "bg-violet-50" },
];

// 获取优先级样式
const getPriorityStyle = (priority: string) => {
  switch (priority) {
    case "high":
      return { label: "紧急", className: "bg-rose-50 text-rose-600 border-rose-200" };
    case "medium":
      return { label: "普通", className: "bg-amber-50 text-amber-600 border-amber-200" };
    case "low":
      return { label: "低优", className: "bg-slate-50 text-slate-600 border-slate-200" };
    default:
      return { label: "普通", className: "bg-slate-50 text-slate-600 border-slate-200" };
  }
};

// 获取类型图标
const getTypeIcon = (type: string) => {
  switch (type) {
    case "business": return Briefcase;
    case "trademark": return CircleDot;
    case "patent": return FileText;
    case "legal": return Scale;
    case "design": return Palette;
    case "qualification": return Award;
    default: return FileText;
  }
};

// 计算剩余天数
const getDaysLeft = (deadline: string) => {
  const today = new Date("2026-01-16");
  const deadlineDate = new Date(deadline);
  const diff = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

export default function MyOrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState("in_progress");

  // 过滤进行中/待确认工单
  const activeOrders = myOrders.filter(order => order.status === selectedStatus);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">我的工单</h1>
          <p className="text-sm text-slate-500 mt-0.5">查看和处理分配给我的工单任务</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            日历视图
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-slate-200/60 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 状态 Tab */}
      <div className="flex gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatus(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              selectedStatus === tab.id
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
                : "bg-white border border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.name}
            <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${
              selectedStatus === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 工单列表 */}
      <div className="space-y-3">
        {selectedStatus === "completed" ? (
          // 已完成工单列表
          completedOrders.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">暂无已完成的工单</p>
            </div>
          ) : (
            completedOrders.map((order) => {
              const TypeIcon = getTypeIcon(order.type);
              return (
                <Card 
                  key={order.id} 
                  className="border-slate-200/60 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex-shrink-0">
                        <TypeIcon className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-slate-400">{order.id}</span>
                          <span className="text-xs text-slate-400">{order.typeName}</span>
                        </div>
                        <h3 className="text-base font-semibold text-slate-900">{order.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {order.customer}
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            完成于 {order.completedAt}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-slate-900">¥{order.amount.toLocaleString()}</p>
                        <p className="text-xs text-emerald-600">+¥{order.myShare.toLocaleString()}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )
        ) : (
          // 进行中/待确认工单列表
          activeOrders.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">暂无工单</p>
            </div>
          ) : (
            activeOrders.map((order) => {
              const TypeIcon = getTypeIcon(order.type);
              const priorityStyle = getPriorityStyle(order.priority);
              const daysLeft = getDaysLeft(order.deadline);

              return (
                <Card 
                  key={order.id} 
                  className="border-slate-200/60 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* 类型图标 */}
                      <div className={`p-3 rounded-xl flex-shrink-0 ${
                        order.status === "pending_confirm" 
                          ? "bg-gradient-to-br from-emerald-100 to-teal-100"
                          : "bg-gradient-to-br from-amber-100 to-orange-100"
                      }`}>
                        <TypeIcon className={`h-5 w-5 ${
                          order.status === "pending_confirm" ? "text-emerald-600" : "text-amber-600"
                        }`} />
                      </div>

                      {/* 工单信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-amber-600">{order.id}</span>
                              <Badge variant="outline" className={`text-[10px] ${priorityStyle.className}`}>
                                {priorityStyle.label}
                              </Badge>
                              <span className="text-xs text-slate-400">{order.typeName}</span>
                              {order.status === "pending_confirm" && (
                                <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200">
                                  待确认
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-base font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">
                              {order.title}
                            </h3>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-lg font-bold text-slate-900">¥{order.amount.toLocaleString()}</p>
                            <p className="text-xs text-emerald-600">可获 ¥{order.myShare.toLocaleString()}</p>
                          </div>
                        </div>

                        {/* 进度条 */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>{order.currentStep}</span>
                            <span>{order.progress}%</span>
                          </div>
                          <Progress value={order.progress} className="h-1.5 bg-slate-100" />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5" />
                              <span>{order.customer}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5" />
                              <span>销售: {order.salesPerson}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-1 text-xs ${
                              daysLeft <= 1 ? "text-rose-600" : daysLeft <= 3 ? "text-amber-600" : "text-slate-500"
                            }`}>
                              <Clock className="h-3.5 w-3.5" />
                              <span>{daysLeft <= 0 ? "已截止" : `${daysLeft}天后截止`}</span>
                            </div>
                            <Link href={`/dashboard/orders/${order.id}`}>
                              <Button 
                                size="sm" 
                                className="h-7 gap-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
                              >
                                {order.status === "pending_confirm" ? "查看详情" : "继续处理"}
                                <ChevronRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )
        )}
      </div>
    </div>
  );
}
