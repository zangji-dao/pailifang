"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Inbox,
  Store,
  UserCheck,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
  Target,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// 收入统计卡片数据
const INCOME_STATS = [
  {
    label: "本月收入",
    value: "¥28,600",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
    color: "bg-emerald-500",
    description: "较上月增长",
  },
  {
    label: "待结算金额",
    value: "¥8,500",
    count: "5笔",
    icon: Clock,
    color: "bg-amber-500",
    description: "待客户确认结算",
  },
  {
    label: "累计收入",
    value: "¥186,500",
    change: "+8.2%",
    trend: "up",
    icon: Wallet,
    color: "bg-blue-500",
    description: "本年度累计",
  },
  {
    label: "本月目标",
    value: "¥35,000",
    current: 28600,
    target: 35000,
    icon: Target,
    color: "bg-purple-500",
    description: "完成率 81.7%",
  },
];

// 工单概览数据
const ORDER_OVERVIEW = [
  { label: "进行中", count: 8, icon: Clock, color: "text-blue-600 bg-blue-50" },
  { label: "待确认", count: 3, icon: AlertCircle, color: "text-amber-600 bg-amber-50" },
  { label: "本月完成", count: 42, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
  { label: "待抢单", count: 15, icon: Store, color: "text-purple-600 bg-purple-50" },
];

// 近期收入明细
const RECENT_INCOME = [
  {
    id: "WO-2026-006",
    title: "分公司注册",
    customer: "吉林省宏远贸易公司",
    amount: 2500,
    myShare: 1250,
    status: "completed",
    date: "2026-01-15",
  },
  {
    id: "WO-2026-007",
    title: "商标续展",
    customer: "松原市宇鑫化工有限公司",
    amount: 1800,
    myShare: 900,
    status: "completed",
    date: "2026-01-14",
  },
  {
    id: "WO-2026-008",
    title: "法律咨询",
    customer: "华信科技有限公司",
    amount: 600,
    myShare: 300,
    status: "completed",
    date: "2026-01-13",
  },
  {
    id: "WO-2026-009",
    title: "Logo设计",
    customer: "新兴建材有限公司",
    amount: 3500,
    myShare: 1750,
    status: "pending",
    date: "2026-01-12",
  },
];

// 月度收入趋势
const MONTHLY_TREND = [
  { month: "8月", amount: 22000 },
  { month: "9月", amount: 24500 },
  { month: "10月", amount: 26800 },
  { month: "11月", amount: 23400 },
  { month: "12月", amount: 25200 },
  { month: "1月", amount: 28600 },
];

export default function OrdersHallPage() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">工单大厅</h1>
          <p className="text-sm text-slate-500 mt-1">工单管理与收入统计</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            本月
          </Button>
          <Button variant="outline" className="gap-2">
            <Receipt className="h-4 w-4" />
            收入明细
          </Button>
        </div>
      </div>

      {/* 收入统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {INCOME_STATS.map((stat) => (
          <Card key={stat.label} className="border-slate-200/60">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {stat.trend && (
                      <span className={`flex items-center text-xs font-medium ${
                        stat.trend === "up" ? "text-emerald-600" : "text-red-600"
                      }`}>
                        {stat.trend === "up" ? (
                          <ArrowUpRight className="h-3 w-3 mr-0.5" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-0.5" />
                        )}
                        {stat.change}
                      </span>
                    )}
                    {stat.count && (
                      <span className="text-xs text-slate-500">{stat.count}</span>
                    )}
                    {stat.current && stat.target && (
                      <span className="text-xs text-slate-500">{stat.description}</span>
                    )}
                  </div>
                  {stat.current && stat.target && (
                    <div className="mt-3">
                      <Progress value={(stat.current / stat.target) * 100} className="h-1.5" />
                    </div>
                  )}
                </div>
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 工单概览 + 快速入口 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 工单概览 */}
        <Card className="lg:col-span-2 border-slate-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">工单概览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ORDER_OVERVIEW.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-slate-900">{item.count}</p>
                    <p className="text-xs text-slate-500">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 快速入口 */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">快速入口</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/dashboard/orders/mine">
                <Button variant="outline" className="w-full justify-start gap-3 h-11">
                  <Inbox className="h-4 w-4 text-blue-500" />
                  <span>我的工单</span>
                  <Badge variant="secondary" className="ml-auto">3</Badge>
                </Button>
              </Link>
              <Link href="/dashboard/orders/hall">
                <Button variant="outline" className="w-full justify-start gap-3 h-11">
                  <Store className="h-4 w-4 text-purple-500" />
                  <span>去抢单</span>
                  <Badge variant="secondary" className="ml-auto">15</Badge>
                </Button>
              </Link>
              <Link href="/dashboard/orders/dispatch">
                <Button variant="outline" className="w-full justify-start gap-3 h-11">
                  <UserCheck className="h-4 w-4 text-amber-500" />
                  <span>去派单</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 近期收入明细 + 月度趋势 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 近期收入明细 */}
        <Card className="border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">近期收入</CardTitle>
            <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700">
              查看全部
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {RECENT_INCOME.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      item.status === "completed" ? "bg-emerald-100" : "bg-amber-100"
                    }`}>
                      {item.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.customer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">+¥{item.myShare.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 月度收入趋势 */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">月度收入趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MONTHLY_TREND.map((item, index) => {
                const maxAmount = Math.max(...MONTHLY_TREND.map(m => m.amount));
                const percentage = (item.amount / maxAmount) * 100;
                const isCurrent = index === MONTHLY_TREND.length - 1;
                
                return (
                  <div key={item.month} className="flex items-center gap-3">
                    <div className="w-10 text-sm text-slate-500">{item.month}</div>
                    <div className="flex-1">
                      <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isCurrent 
                              ? "bg-gradient-to-r from-amber-500 to-orange-500" 
                              : "bg-slate-300"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className={`w-20 text-sm text-right font-medium ${
                      isCurrent ? "text-amber-600" : "text-slate-600"
                    }`}>
                      ¥{(item.amount / 1000).toFixed(1)}k
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* 统计摘要 */}
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">近6个月总收入</p>
                <p className="text-lg font-bold text-slate-900">¥150,500</p>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                <span>月均增长 8.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 业绩排行 */}
      <Card className="border-slate-200/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">本月业绩排行</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 第一名 */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                  1
                </div>
                <Award className="absolute -top-1 -right-1 h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">张会计</p>
                <p className="text-xs text-slate-500">完成工单 18 笔</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-amber-600">¥12,800</p>
                <p className="text-xs text-emerald-600">↑ 15%</p>
              </div>
            </div>
            
            {/* 第二名 */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/50">
              <div className="w-12 h-12 rounded-full bg-slate-300 flex items-center justify-center text-white font-bold text-lg">
                2
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">王会计</p>
                <p className="text-xs text-slate-500">完成工单 15 笔</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-700">¥9,600</p>
                <p className="text-xs text-emerald-600">↑ 8%</p>
              </div>
            </div>
            
            {/* 第三名 */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/50">
              <div className="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold text-lg">
                3
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">李会计</p>
                <p className="text-xs text-slate-500">完成工单 12 笔</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-700">¥6,200</p>
                <p className="text-xs text-emerald-600">↑ 5%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
