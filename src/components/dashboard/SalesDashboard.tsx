"use client";

import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Briefcase,
  Sparkles,
  UserPlus,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// 个人业绩数据
const MY_STATS = [
  {
    title: "本月提成",
    value: "¥12,800",
    change: "+18.5%",
    trend: "up",
    icon: DollarSign,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    title: "我的客户",
    value: "38",
    change: "+5",
    trend: "up",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "待跟进线索",
    value: "12",
    change: "需处理",
    trend: "neutral",
    icon: Phone,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    title: "转化率",
    value: "32%",
    change: "+5%",
    trend: "up",
    icon: Target,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
];

// 待跟进线索
const PENDING_LEADS = [
  { id: 1, name: "长春市创新科技有限公司", source: "官网咨询", time: "10分钟前", priority: "high", estimated: 8000 },
  { id: 2, name: "吉林市宏达商贸公司", source: "老客户推荐", time: "1小时前", priority: "high", estimated: 12000 },
  { id: 3, name: "四平市新起点餐饮", source: "微信推广", time: "2小时前", priority: "medium", estimated: 5000 },
  { id: 4, name: "通化市瑞丰建材", source: "电话咨询", time: "昨天", priority: "low", estimated: 3000 },
  { id: 5, name: "白山市恒远物流", source: "展会", time: "昨天", priority: "medium", estimated: 6000 },
];

// 最近成交
const RECENT_DEALS = [
  { customer: "吉林省宏远贸易公司", service: "代理记账", amount: 6000, commission: 1200, date: "今天" },
  { customer: "松原市宇鑫化工有限公司", service: "公司注册", amount: 3000, commission: 600, date: "昨天" },
  { customer: "华信科技有限公司", service: "商标注册", amount: 1800, commission: 360, date: "昨天" },
];

// 进行中工单
const ACTIVE_ORDERS = [
  { id: "WO-2026-014", title: "分公司注册", customer: "长春市新创科技", status: "processing", step: "工商审核中" },
  { id: "WO-2026-015", title: "代理记账", customer: "吉林市明达商贸", status: "assigned", step: "已派单待处理" },
];

// 业绩目标
const PERFORMANCE_TARGETS = [
  { name: "本月收入目标", current: 38500, target: 50000, unit: "¥" },
  { name: "新客户开发", current: 5, target: 8, unit: "家" },
  { name: "线索转化目标", current: 8, target: 15, unit: "单" },
];

export function SalesDashboard() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">我的工作台</h1>
          <p className="text-slate-500 mt-1">销售经理 · 李销售</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            本月
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <UserPlus className="h-4 w-4" />
            新增线索
          </Button>
        </div>
      </div>

      {/* 个人业绩指标 */}
      <div className="grid grid-cols-4 gap-4">
        {MY_STATS.map((stat) => (
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

      {/* 待跟进线索 + 业绩目标 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 待跟进线索 */}
        <Card className="col-span-2 border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5 text-amber-500" />
              待跟进线索
            </CardTitle>
            <Badge variant="secondary" className="gap-1">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              {PENDING_LEADS.length}条待处理
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {PENDING_LEADS.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      lead.priority === "high" 
                        ? "bg-red-500" 
                        : lead.priority === "medium" 
                          ? "bg-amber-500" 
                          : "bg-slate-300"
                    }`} />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{lead.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">{lead.source}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">{lead.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-emerald-600">预估 ¥{lead.estimated.toLocaleString()}</p>
                    </div>
                    <Button size="sm" className="h-7 text-xs bg-amber-500 hover:bg-amber-600">
                      跟进
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 业绩目标 */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              业绩目标
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {PERFORMANCE_TARGETS.map((target) => {
                const percentage = (target.current / target.target) * 100;
                return (
                  <div key={target.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">{target.name}</span>
                      <span className="text-xs text-slate-500">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                    <Progress value={Math.min(percentage, 100)} className="h-2" />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-slate-400">
                        {target.unit === "¥" ? "¥" : ""}{target.current.toLocaleString()}{target.unit !== "¥" ? target.unit : ""}
                      </span>
                      <span className="text-xs text-slate-400">
                        目标 {target.unit === "¥" ? "¥" : ""}{target.target.toLocaleString()}{target.unit !== "¥" ? target.unit : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 mb-2">预计本月提成</p>
              <p className="text-2xl font-bold text-emerald-600">¥15,200</p>
              <p className="text-xs text-emerald-600 mt-1">还需完成 ¥11,500 达成目标</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最近成交 + 进行中工单 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 最近成交 */}
        <Card className="border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              最近成交
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-amber-600">
              查看全部 <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {RECENT_DEALS.map((deal, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100"
                >
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{deal.customer}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{deal.service}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">{deal.date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">¥{deal.amount.toLocaleString()}</p>
                    <p className="text-xs text-emerald-600">提成 ¥{deal.commission.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 进行中工单 */}
        <Card className="border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-500" />
              进行中工单
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-amber-600">
              全部工单 <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ACTIVE_ORDERS.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 text-sm">{order.title}</p>
                      <span className="text-xs text-slate-400">{order.id}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={order.status === "processing" ? "default" : "secondary"} className="text-xs">
                      {order.step}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">本月已派单</p>
                  <p className="text-xs text-slate-500">等待服务完成确认</p>
                </div>
                <p className="text-xl font-bold text-blue-600">8单</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
