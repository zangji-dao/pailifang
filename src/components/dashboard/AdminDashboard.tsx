"use client";

import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Target,
  Award,
  CheckCircle2,
  Clock,
  Briefcase,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// 公司整体数据
const COMPANY_STATS = [
  {
    title: "本月总收入",
    value: "¥286,500",
    change: "+15.2%",
    trend: "up",
    icon: DollarSign,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    title: "客户总数",
    value: "328",
    change: "+12",
    trend: "up",
    icon: Building2,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "在服账套",
    value: "156",
    change: "+8",
    trend: "up",
    icon: Briefcase,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    title: "员工总数",
    value: "42",
    change: "+3",
    trend: "up",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
];

// 业绩排行
const TOP_PERFORMERS = [
  { rank: 1, name: "张会计", department: "记账组", revenue: 45600, orders: 28, growth: 18 },
  { rank: 2, name: "李销售", department: "销售组", revenue: 38200, orders: 15, growth: 12 },
  { rank: 3, name: "王会计", department: "记账组", revenue: 32100, orders: 22, growth: 8 },
  { rank: 4, name: "赵销售", department: "销售组", revenue: 29800, orders: 12, growth: 5 },
  { rank: 5, name: "刘会计", department: "记账组", revenue: 26500, orders: 18, growth: 3 },
];

// 月度收入趋势
const MONTHLY_REVENUE = [
  { month: "8月", revenue: 220000, profit: 88000 },
  { month: "9月", revenue: 245000, profit: 98000 },
  { month: "10月", revenue: 268000, profit: 107000 },
  { month: "11月", revenue: 234000, profit: 93600 },
  { month: "12月", revenue: 252000, profit: 100800 },
  { month: "1月", revenue: 286500, profit: 114600 },
];

// 预警事项
const ALERTS = [
  { type: "danger", message: "5份合同将于本月到期，需及时续签", time: "立即处理" },
  { type: "warning", message: "3位客户欠款超过30天，总计¥45,000", time: "尽快跟进" },
  { type: "info", message: "本月报税截止日期：1月20日", time: "4天后" },
  { type: "info", message: "新员工培训课程待安排", time: "本周" },
];

// 各部门业绩
const DEPARTMENT_PERFORMANCE = [
  { name: "记账组", revenue: 128500, target: 150000, orders: 156 },
  { name: "工商组", revenue: 85600, target: 100000, orders: 45 },
  { name: "销售组", revenue: 72400, target: 80000, orders: 32 },
  { name: "人力资源组", revenue: 0, target: 50000, orders: 18 },
];

export function AdminDashboard() {
  const maxRevenue = Math.max(...MONTHLY_REVENUE.map(m => m.revenue));

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">管理驾驶舱</h1>
          <p className="text-slate-500 mt-1">公司整体运营概况</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            2026年1月
          </Button>
          <Button variant="outline" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 公司整体指标 */}
      <div className="grid grid-cols-4 gap-4">
        {COMPANY_STATS.map((stat) => (
          <Card key={stat.title} className="border-slate-200/60">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  <div className={`flex items-center gap-1 mt-2 text-sm ${
                    stat.trend === "up" ? "text-emerald-600" : "text-red-600"
                  }`}>
                    {stat.trend === "up" ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>{stat.change}</span>
                    <span className="text-slate-400">较上月</span>
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

      {/* 月度收入趋势 + 预警提醒 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 月度收入趋势 */}
        <Card className="col-span-2 border-slate-200/60">
          <CardHeader>
            <CardTitle className="text-lg">月度收入趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MONTHLY_REVENUE.map((item, index) => {
                const percentage = (item.revenue / maxRevenue) * 100;
                const isCurrent = index === MONTHLY_REVENUE.length - 1;
                
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
                    <div className="w-28 text-right">
                      <p className={`text-sm font-medium ${isCurrent ? "text-amber-600" : "text-slate-600"}`}>
                        ¥{(item.revenue / 1000).toFixed(0)}k
                      </p>
                      <p className="text-xs text-slate-400">利润 ¥{(item.profit / 1000).toFixed(0)}k</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">近6个月总收入</p>
                <p className="text-lg font-bold text-slate-900">¥1,505,500</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">平均利润率</p>
                <p className="text-lg font-bold text-emerald-600">40%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 预警提醒 */}
        <Card className="border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              预警提醒
            </CardTitle>
            <Badge variant="secondary">{ALERTS.length}项</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ALERTS.map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    alert.type === "danger" 
                      ? "bg-red-50 border border-red-100" 
                      : alert.type === "warning"
                        ? "bg-amber-50 border border-amber-100"
                        : "bg-slate-50 border border-slate-100"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      alert.type === "danger" 
                        ? "bg-red-500" 
                        : alert.type === "warning"
                          ? "bg-amber-500"
                          : "bg-slate-400"
                    }`} />
                    <div className="flex-1 ml-2">
                      <p className="text-sm text-slate-700">{alert.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{alert.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 业绩排行 + 部门业绩 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 员工业绩排行 */}
        <Card className="border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              本月业绩排行
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-amber-600">
              查看全部 <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {TOP_PERFORMERS.map((performer) => (
                <div
                  key={performer.rank}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    performer.rank <= 3 
                      ? "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100" 
                      : "bg-slate-50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    performer.rank === 1 
                      ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" 
                      : performer.rank === 2
                        ? "bg-slate-300 text-white"
                        : performer.rank === 3
                          ? "bg-amber-600 text-white"
                          : "bg-slate-200 text-slate-600"
                  }`}>
                    {performer.rank}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{performer.name}</span>
                      <span className="text-xs text-slate-400">{performer.department}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{performer.orders}单</span>
                      <span className={`text-xs ${performer.growth > 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {performer.growth > 0 ? "+" : ""}{performer.growth}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">¥{performer.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 各部门业绩 */}
        <Card className="border-slate-200/60">
          <CardHeader>
            <CardTitle className="text-lg">各部门业绩完成情况</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {DEPARTMENT_PERFORMANCE.map((dept) => {
                const percentage = (dept.revenue / dept.target) * 100;
                return (
                  <div key={dept.name}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">{dept.name}</span>
                        <Badge variant="secondary" className="text-xs">{dept.orders}单</Badge>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-slate-900">
                          ¥{dept.revenue.toLocaleString()}
                        </span>
                        <span className="text-sm text-slate-400"> / ¥{dept.target.toLocaleString()}</span>
                      </div>
                    </div>
                    <Progress 
                      value={percentage} 
                      className={`h-2 ${percentage >= 100 ? "bg-emerald-100" : ""}`}
                    />
                    <p className="text-xs text-slate-500 mt-1 text-right">完成率 {percentage.toFixed(1)}%</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
