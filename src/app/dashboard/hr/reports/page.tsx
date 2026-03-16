"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  Briefcase,
  FileText,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

// 月度统计数据
const MONTHLY_STATS = [
  { month: "2024-01", employees: 322, newHires: 15, departures: 8, payroll: 2156800, avgSalary: 6695 },
  { month: "2023-12", employees: 315, newHires: 12, departures: 5, payroll: 2013500, avgSalary: 6392 },
  { month: "2023-11", employees: 308, newHires: 18, departures: 10, payroll: 1925600, avgSalary: 6252 },
  { month: "2023-10", employees: 300, newHires: 20, departures: 12, payroll: 1854200, avgSalary: 6181 },
];

// 项目分布
const PROJECT_DISTRIBUTION = [
  { name: "阿里巴巴客服项目", employees: 42, percentage: 13 },
  { name: "京东仓储项目", employees: 95, percentage: 29 },
  { name: "美团配送项目", employees: 180, percentage: 56 },
  { name: "其他项目", employees: 5, percentage: 2 },
];

// 年龄分布
const AGE_DISTRIBUTION = [
  { range: "18-25岁", count: 85, percentage: 26 },
  { range: "26-35岁", count: 156, percentage: 48 },
  { range: "36-45岁", count: 62, percentage: 19 },
  { range: "46岁以上", count: 19, percentage: 6 },
];

// 学历分布
const EDUCATION_DISTRIBUTION = [
  { level: "高中及以下", count: 45, percentage: 14 },
  { level: "大专", count: 128, percentage: 40 },
  { level: "本科", count: 135, percentage: 42 },
  { level: "硕士及以上", count: 14, percentage: 4 },
];

// 在职状态
const STATUS_DISTRIBUTION = [
  { status: "在职", count: 298, percentage: 92.5, color: "bg-emerald-500" },
  { status: "待岗", count: 12, percentage: 3.7, color: "bg-amber-500" },
  { status: "待入职", count: 8, percentage: 2.5, color: "bg-blue-500" },
  { status: "本月离职", count: 4, percentage: 1.3, color: "bg-red-500" },
];

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState("2024-01");
  const [selectedYear, setSelectedYear] = useState("2024");

  const currentStats = MONTHLY_STATS[0];
  const prevStats = MONTHLY_STATS[1];

  // 计算环比变化
  const calcChange = (current: number, prev: number) => {
    const change = ((current - prev) / prev) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      trend: change > 0 ? "up" : change < 0 ? "down" : "flat",
    };
  };

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">统计报表</h1>
          <p className="text-sm text-slate-500 mt-1">人力资源数据分析与报表</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="选择年份" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024年</SelectItem>
              <SelectItem value="2023">2023年</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">在职人数</span>
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-900">{currentStats.employees}</span>
              {(() => {
                const change = calcChange(currentStats.employees, prevStats.employees);
                return (
                  <span className={`text-xs flex items-center gap-0.5 ${change.trend === "up" ? "text-emerald-600" : change.trend === "down" ? "text-red-500" : "text-slate-400"}`}>
                    {change.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : change.trend === "down" ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    {change.value}%
                  </span>
                );
              })()}
            </div>
            <p className="text-xs text-slate-400 mt-1">较上月 +{currentStats.newHires} 入职, -{currentStats.departures} 离职</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">本月薪资总额</span>
              <DollarSign className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-900">¥{(currentStats.payroll / 10000).toFixed(1)}万</span>
              {(() => {
                const change = calcChange(currentStats.payroll, prevStats.payroll);
                return (
                  <span className={`text-xs flex items-center gap-0.5 ${change.trend === "up" ? "text-emerald-600" : change.trend === "down" ? "text-red-500" : "text-slate-400"}`}>
                    {change.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : change.trend === "down" ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    {change.value}%
                  </span>
                );
              })()}
            </div>
            <p className="text-xs text-slate-400 mt-1">较上月增加 ¥{((currentStats.payroll - prevStats.payroll) / 10000).toFixed(1)}万</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">平均工资</span>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-900">¥{currentStats.avgSalary.toLocaleString()}</span>
              {(() => {
                const change = calcChange(currentStats.avgSalary, prevStats.avgSalary);
                return (
                  <span className={`text-xs flex items-center gap-0.5 ${change.trend === "up" ? "text-emerald-600" : change.trend === "down" ? "text-red-500" : "text-slate-400"}`}>
                    {change.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : change.trend === "down" ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    {change.value}%
                  </span>
                );
              })()}
            </div>
            <p className="text-xs text-slate-400 mt-1">较上月 +¥{(currentStats.avgSalary - prevStats.avgSalary).toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">人员流动率</span>
              <TrendingDown className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {((currentStats.departures / currentStats.employees) * 100).toFixed(1)}%
              </span>
              <span className="text-xs text-emerald-600 flex items-center gap-0.5">
                <ArrowDownRight className="h-3 w-3" />
                0.5%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">本月离职 {currentStats.departures} 人</p>
          </CardContent>
        </Card>
      </div>

      {/* 标签页 */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">综合概览</TabsTrigger>
          <TabsTrigger value="personnel">人员分析</TabsTrigger>
          <TabsTrigger value="salary">薪酬分析</TabsTrigger>
          <TabsTrigger value="project">项目分析</TabsTrigger>
        </TabsList>

        {/* 综合概览 */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* 在职状态分布 */}
            <Card className="border-slate-200/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-amber-500" />
                  在职状态分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {STATUS_DISTRIBUTION.map((item) => (
                    <div key={item.status} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="flex-1 text-sm text-slate-700">{item.status}</span>
                      <span className="text-sm font-medium text-slate-900">{item.count}人</span>
                      <span className="text-xs text-slate-400 w-12 text-right">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
                {/* 简易条形图 */}
                <div className="h-3 rounded-full bg-slate-100 mt-4 flex overflow-hidden">
                  {STATUS_DISTRIBUTION.map((item, index) => (
                    <div
                      key={index}
                      className={`${item.color}`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 项目人员分布 */}
            <Card className="border-slate-200/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  项目人员分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {PROJECT_DISTRIBUTION.map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">{item.name}</span>
                        <span className="font-medium">{item.employees}人 ({item.percentage}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 月度趋势 */}
          <Card className="border-slate-200/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <LineChart className="h-4 w-4 text-emerald-500" />
                月度趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 font-medium text-slate-600">月份</th>
                      <th className="text-right py-2 px-3 font-medium text-slate-600">人数</th>
                      <th className="text-right py-2 px-3 font-medium text-slate-600">新入职</th>
                      <th className="text-right py-2 px-3 font-medium text-slate-600">离职</th>
                      <th className="text-right py-2 px-3 font-medium text-slate-600">薪资总额</th>
                      <th className="text-right py-2 px-3 font-medium text-slate-600">平均工资</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {MONTHLY_STATS.map((row) => (
                      <tr key={row.month} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-medium">{row.month}</td>
                        <td className="py-2 px-3 text-right">{row.employees}</td>
                        <td className="py-2 px-3 text-right text-emerald-600">+{row.newHires}</td>
                        <td className="py-2 px-3 text-right text-red-500">-{row.departures}</td>
                        <td className="py-2 px-3 text-right">¥{(row.payroll / 10000).toFixed(1)}万</td>
                        <td className="py-2 px-3 text-right font-medium">¥{row.avgSalary.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 人员分析 */}
        <TabsContent value="personnel" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* 年龄分布 */}
            <Card className="border-slate-200/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  年龄分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {AGE_DISTRIBUTION.map((item) => (
                    <div key={item.range} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">{item.range}</span>
                        <span className="font-medium">{item.count}人 ({item.percentage}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-purple-500"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 学历分布 */}
            <Card className="border-slate-200/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  学历分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {EDUCATION_DISTRIBUTION.map((item) => (
                    <div key={item.level} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">{item.level}</span>
                        <span className="font-medium">{item.count}人 ({item.percentage}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 薪酬分析 */}
        <TabsContent value="salary" className="mt-4">
          <Card className="border-slate-200/60">
            <CardContent className="pt-6 text-center text-slate-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>薪酬分析报表开发中...</p>
              <p className="text-sm mt-1">将包含薪资结构分析、薪酬趋势、社保公积金明细等</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 项目分析 */}
        <TabsContent value="project" className="mt-4">
          <Card className="border-slate-200/60">
            <CardContent className="pt-6 text-center text-slate-500">
              <Briefcase className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>项目分析报表开发中...</p>
              <p className="text-sm mt-1">将包含项目人员配置、项目成本、项目效益等分析</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
