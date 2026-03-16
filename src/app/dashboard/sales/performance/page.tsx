"use client";

import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Calendar,
  Award,
  BarChart3,
  Download,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// 销售业绩数据
const PERFORMANCE_STATS = [
  {
    title: "本月业绩",
    value: "¥128,500",
    target: "¥150,000",
    progress: 85.7,
    change: "+18.5%",
    trend: "up",
    icon: DollarSign,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    title: "本月提成",
    value: "¥12,850",
    change: "+¥2,850",
    trend: "up",
    icon: Award,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    title: "成交客户",
    value: "12",
    target: "15",
    progress: 80,
    change: "+3",
    trend: "up",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "转化率",
    value: "32%",
    target: "40%",
    progress: 80,
    change: "+5%",
    trend: "up",
    icon: Target,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
];

// 月度趋势
const MONTHLY_TREND = [
  { month: "8月", amount: 95000, target: 120000 },
  { month: "9月", amount: 108000, target: 120000 },
  { month: "10月", amount: 115000, target: 130000 },
  { month: "11月", amount: 102000, target: 130000 },
  { month: "12月", amount: 125000, target: 150000 },
  { month: "1月", amount: 128500, target: 150000 },
];

// 业绩排行
const RANKING = [
  { rank: 1, name: "王销售", amount: 156000, deals: 15, avatar: "王" },
  { rank: 2, name: "李销售", amount: 128500, deals: 12, avatar: "李" },
  { rank: 3, name: "张销售", amount: 98000, deals: 9, avatar: "张" },
  { rank: 4, name: "赵销售", amount: 85000, deals: 8, avatar: "赵" },
  { rank: 5, name: "刘销售", amount: 72000, deals: 6, avatar: "刘" },
];

// 成交记录
const DEAL_RECORDS = [
  { customer: "吉林省宏远贸易公司", service: "年度服务", amount: 18000, date: "今天", commission: 1800 },
  { customer: "松原市宇鑫化工", service: "代理记账", amount: 12000, date: "昨天", commission: 1200 },
  { customer: "华信科技", service: "商标注册", amount: 8000, date: "昨天", commission: 800 },
  { customer: "创新科技", service: "公司注册", amount: 6000, date: "前天", commission: 600 },
  { customer: "新起点餐饮", service: "代理记账", amount: 5000, date: "前天", commission: 500 },
];

export default function PerformancePage() {
  const [timeRange, setTimeRange] = useState("month");

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">销售业绩</h1>
          <p className="text-slate-500 mt-1">业绩统计与提成计算</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="h-9 px-3 text-sm border border-slate-200 rounded-md"
          >
            <option value="week">本周</option>
            <option value="month">本月</option>
            <option value="quarter">本季度</option>
            <option value="year">本年度</option>
          </select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-4 gap-4">
        {PERFORMANCE_STATS.map((stat) => (
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
                  <p className={`text-xs mt-2 ${stat.trend === "up" ? "text-emerald-600" : "text-red-600"}`}>
                    {stat.trend === "up" ? <TrendingUp className="h-3 w-3 inline mr-1" /> : <TrendingDown className="h-3 w-3 inline mr-1" />}
                    {stat.change} 较上月
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 月度趋势 + 业绩排行 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 月度趋势 */}
        <Card className="col-span-2 border-slate-200/60">
          <CardHeader>
            <CardTitle className="text-lg">业绩趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MONTHLY_TREND.map((item, index) => {
                const maxAmount = Math.max(...MONTHLY_TREND.map(m => Math.max(m.amount, m.target)));
                const isCurrent = index === MONTHLY_TREND.length - 1;
                
                return (
                  <div key={item.month}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">{item.month}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-400">
                          目标 ¥{(item.target / 1000).toFixed(0)}k
                        </span>
                        <span className={`font-medium ${isCurrent ? "text-amber-600" : "text-slate-900"}`}>
                          ¥{(item.amount / 1000).toFixed(0)}k
                        </span>
                      </div>
                    </div>
                    <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
                      {/* 目标线 */}
                      <div
                        className="absolute h-full bg-slate-200 rounded-full"
                        style={{ width: `${(item.target / maxAmount) * 100}%` }}
                      />
                      {/* 实际金额 */}
                      <div
                        className={`absolute h-full rounded-full ${
                          isCurrent 
                            ? "bg-gradient-to-r from-amber-500 to-orange-500" 
                            : item.amount >= item.target 
                              ? "bg-emerald-500" 
                              : "bg-blue-400"
                        }`}
                        style={{ width: `${(item.amount / maxAmount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-500">本年度累计</p>
                <p className="text-lg font-bold text-slate-900">¥673,500</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">平均月业绩</p>
                <p className="text-lg font-bold text-slate-900">¥112,250</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">目标完成率</p>
                <p className="text-lg font-bold text-emerald-600">96%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 业绩排行 */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              销售排行
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {RANKING.map((item) => (
                <div
                  key={item.rank}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    item.rank === 2 
                      ? "bg-amber-50 border border-amber-100" 
                      : item.rank <= 3 
                        ? "bg-slate-50" 
                        : ""
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    item.rank === 1 
                      ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" 
                      : item.rank === 2 
                        ? "bg-slate-300 text-white"
                        : item.rank === 3
                          ? "bg-amber-600 text-white"
                          : "bg-slate-200 text-slate-600"
                  }`}>
                    {item.rank}
                  </div>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-medium">
                    {item.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.deals}单</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">¥{(item.amount / 1000).toFixed(0)}k</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 成交记录 */}
      <Card className="border-slate-200/60">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">成交记录</CardTitle>
          <Button variant="ghost" size="sm" className="text-amber-600">
            查看全部 <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {DEAL_RECORDS.map((deal, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500">{deal.date}</span>
                  <Badge variant="secondary" className="text-xs">{deal.service}</Badge>
                </div>
                <p className="font-medium text-slate-900 text-sm line-clamp-1">{deal.customer}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="font-semibold text-emerald-600">¥{deal.amount.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">提成 ¥{deal.commission}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
