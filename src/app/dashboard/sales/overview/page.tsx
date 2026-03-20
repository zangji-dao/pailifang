"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Phone,
  Mail,
  MessageSquare,
  Store,
  Calendar,
  ArrowRight,
  ChevronRight,
  UserPlus,
  FileVideo,
  Send,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// 销售概览统计
const SALES_STATS = [
  {
    title: "本月销售额",
    value: "¥128,500",
    change: "+18.5%",
    icon: DollarSign,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    title: "新增线索",
    value: "156",
    change: "+32",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "成交客户",
    value: "12",
    change: "+3",
    icon: UserPlus,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    title: "转化率",
    value: "32%",
    change: "+5%",
    icon: Target,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
];

// 待跟进线索
const PENDING_LEADS = [
  { id: 1, name: "长春市创新科技", source: "官网", time: "10分钟前", phone: "138****0001", intention: "高" },
  { id: 2, name: "吉林市宏达商贸", source: "推荐", time: "1小时前", phone: "139****0002", intention: "高" },
  { id: 3, name: "四平市新起点餐饮", source: "微信", time: "2小时前", phone: "137****0003", intention: "中" },
  { id: 4, name: "通化市瑞丰建材", source: "电话", time: "昨天", phone: "136****0004", intention: "低" },
];

// 销售漏斗
const SALES_FUNNEL = [
  { stage: "线索", count: 156, percentage: 100 },
  { stage: "初步沟通", count: 89, percentage: 57 },
  { stage: "需求确认", count: 45, percentage: 29 },
  { stage: "报价谈判", count: 18, percentage: 12 },
  { stage: "成交", count: 12, percentage: 8 },
];

// 渠道来源
const CHANNEL_SOURCES = [
  { channel: "官网咨询", count: 45, color: "bg-blue-500" },
  { channel: "微信推广", count: 38, color: "bg-green-500" },
  { channel: "老客户推荐", count: 32, color: "bg-amber-500" },
  { channel: "电话咨询", count: 25, color: "bg-purple-500" },
  { channel: "其他渠道", count: 16, color: "bg-slate-400" },
];

// 最近成交
const RECENT_DEALS = [
  { customer: "吉林省宏远贸易公司", amount: 6000, sales: "李销售", date: "今天" },
  { customer: "松原市宇鑫化工有限公司", amount: 3000, sales: "王销售", date: "昨天" },
  { customer: "华信科技有限公司", amount: 1800, sales: "李销售", date: "昨天" },
];

export default function SalesOverviewPage() {
  const [timeRange, setTimeRange] = useState("month");

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">营销概览</h1>
          <p className="text-slate-500 mt-1">销售数据概览与营销分析</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <FileVideo className="h-4 w-4" />
            推广内容
          </Button>
          <Button size="sm" className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500">
            <Send className="h-4 w-4" />
            发布推广
          </Button>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-4 gap-4">
        {SALES_STATS.map((stat) => (
          <Card key={stat.title} className="border-slate-200/60">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-emerald-600 mt-1">{stat.change} 较上月</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 销售漏斗 + 渠道来源 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 销售漏斗 */}
        <Card className="border-slate-200/60">
          <CardHeader>
            <CardTitle className="text-lg">销售漏斗</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {SALES_FUNNEL.map((item, index) => (
                <div key={item.stage}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-600">{item.stage}</span>
                    <span className="text-sm font-medium text-slate-900">
                      {item.count}
                      <span className="text-slate-400 ml-2">{item.percentage}%</span>
                    </span>
                  </div>
                  <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        index === SALES_FUNNEL.length - 1 
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                          : index === 0 
                            ? "bg-gradient-to-r from-blue-500 to-blue-400"
                            : "bg-gradient-to-r from-amber-500 to-amber-400"
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">整体转化率</p>
                <p className="text-2xl font-semibold text-slate-900">7.7%</p>
              </div>
              <Button variant="ghost" size="sm" className="text-amber-600">
                查看详情 <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 渠道来源 */}
        <Card className="border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">线索来源分布</CardTitle>
            <Link href="/dashboard/sales/channels">
              <Button variant="ghost" size="sm" className="text-amber-600">
                渠道管理 <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {CHANNEL_SOURCES.map((item) => (
                <div key={item.channel} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-slate-600 flex-1">{item.channel}</span>
                  <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${(item.count / 45) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-900 w-10 text-right">{item.count}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">最佳渠道</p>
                  <p className="font-medium text-slate-900">官网咨询</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">转化率</p>
                  <p className="font-medium text-emerald-600">38%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 待跟进线索 + 最近成交 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 待跟进线索 */}
        <Card className="border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5 text-amber-500" />
              待跟进线索
            </CardTitle>
            <Link href="/dashboard/sales/leads">
              <Button variant="ghost" size="sm" className="text-amber-600">
                全部线索 <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
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
                      lead.intention === "高" 
                        ? "bg-red-500 animate-pulse" 
                        : lead.intention === "中" 
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
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      lead.intention === "高" 
                        ? "destructive" 
                        : lead.intention === "中" 
                          ? "secondary" 
                          : "outline"
                    } className="text-xs">
                      {lead.intention}意向
                    </Badge>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 最近成交 */}
        <Card className="border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              最近成交
            </CardTitle>
            <Link href="/dashboard/sales/performance">
              <Button variant="ghost" size="sm" className="text-amber-600">
                销售业绩 <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
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
                      <span className="text-xs text-slate-500">{deal.sales}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">{deal.date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600">¥{deal.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 rounded-lg bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">本月成交总额</p>
                  <p className="text-2xl font-semibold text-slate-900">¥128,500</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">成交笔数</p>
                  <p className="text-lg font-bold text-slate-900">32笔</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
