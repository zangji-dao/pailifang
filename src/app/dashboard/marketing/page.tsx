"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Users,
  UserPlus,
  Target,
  DollarSign,
  ArrowRight,
  Eye,
  MousePointer,
  Phone,
  ShoppingCart,
  BarChart3,
  Radio,
  Megaphone,
  FileVideo,
  Settings,
} from "lucide-react";

// 模拟数据
const overviewData = {
  todayLeads: 42,
  todayLeadsChange: 15.2,
  monthLeads: 892,
  monthLeadsChange: 23.8,
  conversionRate: 12.6,
  conversionChange: 2.1,
  costPerLead: 38.5,
  costChange: -8.3,
  totalCost: 34352,
  totalRevenue: 156800,
  roi: 356.2,
};

const channelData = [
  { name: "抖音", leads: 312, conversion: "10.5%", cost: 12000, icon: "🎬", color: "bg-pink-500" },
  { name: "百度SEM", leads: 186, conversion: "15.2%", cost: 8500, icon: "🔍", color: "bg-blue-500" },
  { name: "微信公众号", leads: 142, conversion: "6.8%", cost: 3200, icon: "📱", color: "bg-green-500" },
  { name: "小红书", leads: 98, conversion: "8.9%", cost: 4100, icon: "📕", color: "bg-red-500" },
  { name: "口碑转介绍", leads: 86, conversion: "28.5%", cost: 0, icon: "🤝", color: "bg-amber-500" },
  { name: "视频号", leads: 68, conversion: "7.2%", cost: 2100, icon: "📺", color: "bg-purple-500" },
];

const recentLeads = [
  { id: 1, name: "张先生", phone: "138****1234", channel: "抖音", source: "《代理记账一个月多少钱？》", time: "10分钟前", status: "new" },
  { id: 2, name: "李女士", phone: "139****5678", channel: "百度SEM", source: "公司注册 搜索", time: "25分钟前", status: "contacted" },
  { id: 3, name: "王总", phone: "137****9012", channel: "口碑转介绍", source: "老客户张总推荐", time: "1小时前", status: "new" },
  { id: 4, name: "赵经理", phone: "136****3456", channel: "小红书", source: "《创业必看：公司注册流程》", time: "2小时前", status: "pending" },
  { id: 5, name: "孙女士", phone: "135****7890", channel: "微信公众号", source: "文章咨询", time: "3小时前", status: "contacted" },
];

const trendData = [
  { date: "01-10", leads: 28, converted: 3 },
  { date: "01-11", leads: 35, converted: 5 },
  { date: "01-12", leads: 42, converted: 6 },
  { date: "01-13", leads: 31, converted: 4 },
  { date: "01-14", leads: 38, converted: 5 },
  { date: "01-15", leads: 45, converted: 7 },
  { date: "01-16", leads: 42, converted: 5 },
];

export default function MarketingPage() {
  const [timeRange, setTimeRange] = useState("today");

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">营销助手</h1>
          <p className="text-slate-500 mt-1">全渠道营销数据概览与管理</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileVideo className="h-4 w-4 mr-2" />
            推广内容
          </Button>
          <Button size="sm">
            <Megaphone className="h-4 w-4 mr-2" />
            创建活动
          </Button>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/60">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">今日线索</p>
                <p className="text-2xl font-semibold text-slate-900">{overviewData.todayLeads}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs text-green-600">+{overviewData.todayLeadsChange}%</span>
              <span className="text-xs text-slate-400">较昨日</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">本月线索</p>
                <p className="text-2xl font-semibold text-slate-900">{overviewData.monthLeads}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs text-green-600">+{overviewData.monthLeadsChange}%</span>
              <span className="text-xs text-slate-400">较上月</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">转化率</p>
                <p className="text-2xl font-semibold text-slate-900">{overviewData.conversionRate}%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Target className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs text-green-600">+{overviewData.conversionChange}%</span>
              <span className="text-xs text-slate-400">较上月</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">线索成本</p>
                <p className="text-2xl font-semibold text-slate-900">¥{overviewData.costPerLead}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingDown className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs text-green-600">{overviewData.costChange}%</span>
              <span className="text-xs text-slate-400">成本下降</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI 和 转化漏斗 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ROI 卡片 */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">营销ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-amber-600">{overviewData.roi}%</div>
              <p className="text-sm text-slate-500 mt-1">投资回报率</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">¥{overviewData.totalCost.toLocaleString()}</p>
                <p className="text-xs text-slate-500">总投入</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-green-600">¥{overviewData.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-slate-500">总收入</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 转化漏斗 */}
        <Card className="lg:col-span-2 border-slate-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">转化漏斗</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">曝光量</span>
                  </div>
                  <span className="text-sm font-medium">28,650</span>
                </div>
                <div className="h-8 bg-blue-100 rounded-lg flex items-center px-3">
                  <span className="text-xs text-blue-700">100%</span>
                </div>
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <MousePointer className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">点击量</span>
                  </div>
                  <span className="text-sm font-medium">3,420</span>
                </div>
                <div className="h-8 bg-purple-100 rounded-lg flex items-center px-3" style={{ width: "60%" }}>
                  <span className="text-xs text-purple-700">11.9%</span>
                </div>
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">留资量</span>
                  </div>
                  <span className="text-sm font-medium">892</span>
                </div>
                <div className="h-8 bg-amber-100 rounded-lg flex items-center px-3" style={{ width: "40%" }}>
                  <span className="text-xs text-amber-700">26.1%</span>
                </div>
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">有效咨询</span>
                  </div>
                  <span className="text-sm font-medium">326</span>
                </div>
                <div className="h-8 bg-green-100 rounded-lg flex items-center px-3" style={{ width: "25%" }}>
                  <span className="text-xs text-green-700">36.5%</span>
                </div>
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">成交客户</span>
                  </div>
                  <span className="text-sm font-medium">103</span>
                </div>
                <div className="h-8 bg-emerald-200 rounded-lg flex items-center px-3" style={{ width: "15%" }}>
                  <span className="text-xs text-emerald-700">11.5%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 渠道数据 & 最近线索 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 渠道效果排行 */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">渠道效果排行</CardTitle>
              <Link href="/dashboard/marketing/channels">
                <Button variant="ghost" size="sm" className="text-slate-500">
                  查看全部
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {channelData.map((channel, index) => (
                <div key={channel.name} className="flex items-center gap-3">
                  <div className="w-6 text-center text-sm text-slate-400 font-medium">
                    {index + 1}
                  </div>
                  <div className="text-lg">{channel.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{channel.name}</span>
                      <span className="text-sm text-slate-900">{channel.leads} 条线索</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full mr-3">
                        <div 
                          className={`h-full ${channel.color} rounded-full`}
                          style={{ width: `${(channel.leads / 312) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-16 text-right">
                        转化 {channel.conversion}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 最近线索 */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">最近线索</CardTitle>
              <Link href="/dashboard/marketing/leads">
                <Button variant="ghost" size="sm" className="text-slate-500">
                  查看全部
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                    {lead.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{lead.name}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] px-1.5 py-0 ${
                          lead.status === "new" 
                            ? "bg-blue-50 text-blue-600 border-blue-200" 
                            : lead.status === "contacted"
                            ? "bg-green-50 text-green-600 border-green-200"
                            : "bg-amber-50 text-amber-600 border-amber-200"
                        }`}
                      >
                        {lead.status === "new" ? "新线索" : lead.status === "contacted" ? "已联系" : "待跟进"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      来自：{lead.source}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">{lead.time}</p>
                    <p className="text-xs text-slate-400">{lead.channel}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快捷入口 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/marketing/channels">
          <Card className="border-slate-200/60 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                  <Radio className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">渠道管理</p>
                  <p className="text-xs text-slate-500">配置推广渠道</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/marketing/leads">
          <Card className="border-slate-200/60 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">线索中心</p>
                  <p className="text-xs text-slate-500">管理客户线索</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/marketing/content">
          <Card className="border-slate-200/60 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
                  <FileVideo className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">推广内容</p>
                  <p className="text-xs text-slate-500">视频文章管理</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/marketing/ads">
          <Card className="border-slate-200/60 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Megaphone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">投放管理</p>
                  <p className="text-xs text-slate-500">广告投放配置</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
