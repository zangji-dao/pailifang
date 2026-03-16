"use client";

import { useState } from "react";
import {
  Store,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Plus,
  Settings,
  BarChart3,
  ArrowRight,
  ExternalLink,
  Power,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// 渠道列表
const CHANNELS = [
  {
    id: 1,
    name: "官网咨询",
    icon: "🌐",
    status: "active",
    leads: 45,
    converted: 18,
    cost: 3200,
    roi: 4.2,
    trend: "up",
  },
  {
    id: 2,
    name: "微信推广",
    icon: "💬",
    status: "active",
    leads: 38,
    converted: 12,
    cost: 2800,
    roi: 3.5,
    trend: "up",
  },
  {
    id: 3,
    name: "老客户推荐",
    icon: "🤝",
    status: "active",
    leads: 32,
    converted: 15,
    cost: 0,
    roi: 99,
    trend: "up",
  },
  {
    id: 4,
    name: "BOSS直聘",
    icon: "💼",
    status: "active",
    leads: 18,
    converted: 6,
    cost: 4000,
    roi: 2.8,
    trend: "down",
  },
  {
    id: 5,
    name: "抖音推广",
    icon: "📱",
    status: "paused",
    leads: 15,
    converted: 3,
    cost: 2500,
    roi: 1.8,
    trend: "down",
  },
];

// 渠道效果对比
const CHANNEL_COMPARISON = [
  { channel: "官网咨询", leads: 45, cost: 3200, cpl: 71 },
  { channel: "微信推广", leads: 38, cost: 2800, cpl: 74 },
  { channel: "老客户推荐", leads: 32, cost: 0, cpl: 0 },
  { channel: "BOSS直聘", leads: 18, cost: 4000, cpl: 222 },
  { channel: "抖音推广", leads: 15, cost: 2500, cpl: 167 },
];

export default function ChannelsPage() {
  const [timeRange, setTimeRange] = useState("month");

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">渠道管理</h1>
          <p className="text-slate-500 mt-1">管理各渠道来源与效果分析</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            导出报表
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500">
            <Plus className="h-4 w-4" />
            添加渠道
          </Button>
        </div>
      </div>

      {/* 渠道概览 */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-slate-200/60">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">活跃渠道</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">4</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Store className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">本月线索</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">148</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">渠道成本</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">¥12,500</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">平均ROI</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">3.8x</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 渠道列表 */}
      <Card className="border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-lg">渠道列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {CHANNELS.map((channel) => (
              <div
                key={channel.id}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-2xl">
                    {channel.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{channel.name}</span>
                      <Badge variant={channel.status === "active" ? "default" : "secondary"}>
                        {channel.status === "active" ? "运行中" : "已暂停"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                      <span>线索 {channel.leads}</span>
                      <span>·</span>
                      <span>转化 {channel.converted}</span>
                      <span>·</span>
                      <span>成本 ¥{channel.cost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-slate-500">ROI</p>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-slate-900">{channel.roi}x</span>
                      {channel.trend === "up" ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className={channel.status === "active" ? "text-red-600" : "text-emerald-600"}>
                      <Power className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 渠道效果对比 */}
      <Card className="border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-lg">渠道效果对比</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {CHANNEL_COMPARISON.map((item) => {
              const maxLeads = Math.max(...CHANNEL_COMPARISON.map(c => c.leads));
              return (
                <div key={item.channel}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">{item.channel}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-500">
                        线索 <span className="font-medium text-slate-900">{item.leads}</span>
                      </span>
                      <span className="text-slate-500">
                        成本 <span className="font-medium text-slate-900">¥{item.cost}</span>
                      </span>
                      <span className="text-slate-500">
                        单线索成本 <span className="font-medium text-slate-900">
                          {item.cpl === 0 ? "免费" : `¥${item.cpl}`}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                      style={{ width: `${(item.leads / maxLeads) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
