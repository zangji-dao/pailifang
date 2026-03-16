"use client";

import {
  Users,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Calendar,
  ArrowRight,
  Target,
  BarChart3,
  Briefcase,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// 团队整体数据
const TEAM_STATS = [
  {
    title: "团队本月收入",
    value: "¥128,500",
    change: "+12.8%",
    trend: "up",
    icon: Briefcase,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    title: "待分配工单",
    value: "8",
    change: "需处理",
    trend: "neutral",
    icon: ClipboardList,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    title: "进行中工单",
    value: "23",
    change: "正常推进",
    trend: "neutral",
    icon: Clock,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "团队成员",
    value: "12",
    change: "在线 10",
    trend: "neutral",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
];

// 团队成员绩效
const TEAM_MEMBERS = [
  { name: "张会计", avatar: "张", status: "online", orders: 8, revenue: 15600, tasks: 3, rating: 4.8 },
  { name: "王会计", avatar: "王", status: "online", orders: 6, revenue: 12800, tasks: 2, rating: 4.6 },
  { name: "李会计", avatar: "李", status: "busy", orders: 5, revenue: 9500, tasks: 4, rating: 4.5 },
  { name: "赵会计", avatar: "赵", status: "online", orders: 7, revenue: 11200, tasks: 1, rating: 4.7 },
  { name: "刘会计", avatar: "刘", status: "offline", orders: 4, revenue: 8600, tasks: 2, rating: 4.4 },
];

// 待分配工单
const PENDING_ORDERS = [
  { id: "WO-2026-010", title: "公司注册", customer: "长春市新创科技", amount: 3000, priority: "high", deadline: "今天" },
  { id: "WO-2026-011", title: "商标注册", customer: "吉林市明达商贸", amount: 1800, priority: "medium", deadline: "明天" },
  { id: "WO-2026-012", title: "代理记账", customer: "四平市鑫源餐饮", amount: 5000, priority: "high", deadline: "今天" },
  { id: "WO-2026-013", title: "税务申报", customer: "通化市盛世地产", amount: 1200, priority: "low", deadline: "3天后" },
];

// 重点客户跟进
const KEY_CUSTOMERS = [
  { name: "吉林省宏远贸易公司", contact: "张总", lastFollow: "2天前", nextAction: "合同续签", status: "pending" },
  { name: "松原市宇鑫化工有限公司", contact: "李经理", lastFollow: "昨天", nextAction: "月度汇报", status: "completed" },
  { name: "华信科技有限公司", contact: "王总", lastFollow: "3天前", nextAction: "欠款催收", status: "urgent" },
  { name: "新兴建材有限公司", contact: "赵总", lastFollow: "今天", nextAction: "服务确认", status: "completed" },
];

// 本月目标
const MONTHLY_TARGETS = [
  { name: "团队收入目标", current: 128500, target: 150000, unit: "¥" },
  { name: "工单完成目标", current: 68, target: 100, unit: "单" },
  { name: "客户满意度", current: 95, target: 98, unit: "%" },
  { name: "新客户开发", current: 5, target: 8, unit: "家" },
];

export function ManagerDashboard() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">团队工作台</h1>
          <p className="text-slate-500 mt-1">记账组 · 12名成员</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            本周
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <UserCheck className="h-4 w-4" />
            分配工单
          </Button>
        </div>
      </div>

      {/* 团队整体指标 */}
      <div className="grid grid-cols-4 gap-4">
        {TEAM_STATS.map((stat) => (
          <Card key={stat.title} className="border-slate-200/60">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.trend === "up" && (
                      <span className="flex items-center text-sm text-emerald-600">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {stat.change}
                      </span>
                    )}
                    {stat.trend === "down" && (
                      <span className="flex items-center text-sm text-red-600">
                        <TrendingDown className="h-4 w-4 mr-1" />
                        {stat.change}
                      </span>
                    )}
                    {stat.trend === "neutral" && (
                      <span className="text-sm text-slate-500">{stat.change}</span>
                    )}
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 待分配工单 + 团队成员状态 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 待分配工单 */}
        <Card className="border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-amber-500" />
              待分配工单
            </CardTitle>
            <Badge variant="secondary">{PENDING_ORDERS.length}单待分配</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {PENDING_ORDERS.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      order.priority === "high" 
                        ? "bg-red-500" 
                        : order.priority === "medium" 
                          ? "bg-amber-500" 
                          : "bg-slate-300"
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{order.title}</span>
                        <span className="text-xs text-slate-400">{order.id}</span>
                      </div>
                      <p className="text-xs text-slate-500">{order.customer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">¥{order.amount.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">{order.deadline}</p>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      分配
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 团队成员状态 */}
        <Card className="border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              团队成员
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-amber-600">
              查看详情 <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {TEAM_MEMBERS.map((member) => (
                <div
                  key={member.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-medium">
                        {member.avatar}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        member.status === "online" 
                          ? "bg-emerald-400" 
                          : member.status === "busy" 
                            ? "bg-amber-400" 
                            : "bg-slate-300"
                      }`} />
                    </div>
                    <div>
                      <span className="font-medium text-slate-900">{member.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">{member.orders}单</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-amber-600">⭐ {member.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">¥{member.revenue.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">{member.tasks}个任务</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 本月目标完成情况 + 重点客户跟进 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 本月目标 */}
        <Card className="border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              本月目标完成情况
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MONTHLY_TARGETS.map((target) => {
                const percentage = (target.current / target.target) * 100;
                return (
                  <div key={target.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">{target.name}</span>
                      <span className="text-sm">
                        <span className="font-semibold text-slate-900">
                          {target.unit === "¥" ? "¥" : ""}{target.current.toLocaleString()}{target.unit !== "¥" ? target.unit : ""}
                        </span>
                        <span className="text-slate-400"> / {target.unit === "¥" ? "¥" : ""}{target.target.toLocaleString()}{target.unit !== "¥" ? target.unit : ""}</span>
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className={`h-2 ${percentage >= 100 ? "" : ""}`}
                    />
                    <p className="text-xs text-slate-500 mt-1 text-right">
                      完成率 {percentage.toFixed(1)}%
                      {percentage >= 100 && <span className="text-emerald-600 ml-1">✓</span>}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 重点客户跟进 */}
        <Card className="border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-500" />
              重点客户跟进
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-amber-600">
              全部客户 <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {KEY_CUSTOMERS.map((customer) => (
                <div
                  key={customer.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{customer.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{customer.contact}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">{customer.lastFollow}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      customer.status === "urgent" 
                        ? "destructive" 
                        : customer.status === "pending" 
                          ? "secondary" 
                          : "default"
                    } className="text-xs">
                      {customer.nextAction}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
