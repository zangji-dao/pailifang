"use client";

import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  FileText,
  Calendar,
  ArrowRight,
  Store,
  Award,
  Zap,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// 个人工作数据
const MY_WORK_STATS = [
  {
    title: "本月分润",
    value: "¥8,600",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    title: "待处理工单",
    value: "5",
    change: "需处理",
    trend: "neutral",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    title: "本月完成",
    value: "18",
    change: "+3单",
    trend: "up",
    icon: CheckCircle2,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "服务评分",
    value: "4.8",
    change: "优秀",
    trend: "neutral",
    icon: Award,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
];

// 待处理工单
const PENDING_TASKS = [
  { id: "WO-2026-016", title: "月度记账", customer: "吉林省宏远贸易公司", deadline: "今天", priority: "high", amount: 800 },
  { id: "WO-2026-017", title: "税务申报", customer: "松原市宇鑫化工有限公司", deadline: "明天", priority: "high", amount: 500 },
  { id: "WO-2026-018", title: "财务报表", customer: "华信科技有限公司", deadline: "后天", priority: "medium", amount: 600 },
  { id: "WO-2026-019", title: "凭证审核", customer: "新兴建材有限公司", deadline: "3天后", priority: "low", amount: 300 },
  { id: "WO-2026-020", title: "年度审计", customer: "长春市盛世餐饮", deadline: "本周", priority: "medium", amount: 2000 },
];

// 可抢单
const AVAILABLE_ORDERS = [
  { id: "WO-2026-021", title: "公司注册", customer: "白山市新创科技", amount: 1500, deadline: "5天", required: "工商业务" },
  { id: "WO-2026-022", title: "代理记账", customer: "通化市瑞丰建材", amount: 800, deadline: "3天", required: "记账业务" },
  { id: "WO-2026-023", title: "商标注册", customer: "辽源市明达商贸", amount: 600, deadline: "7天", required: "商标业务" },
];

// 最近收入
const RECENT_INCOME = [
  { customer: "吉林省宏远贸易公司", service: "月度记账", amount: 400, date: "今天" },
  { customer: "松原市宇鑫化工有限公司", service: "税务申报", amount: 250, date: "昨天" },
  { customer: "华信科技有限公司", service: "财务报表", amount: 300, date: "昨天" },
  { customer: "新兴建材有限公司", service: "凭证审核", amount: 150, date: "前天" },
];

// 本周目标
const WEEKLY_TARGETS = [
  { name: "工单完成", current: 18, target: 25 },
  { name: "凭证录入", current: 156, target: 200 },
  { name: "客户回访", current: 3, target: 5 },
];

export function AccountantDashboard() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">我的工作台</h1>
          <p className="text-slate-500 mt-1">会计 · 张会计</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            本周
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <Store className="h-4 w-4" />
            去抢单
          </Button>
        </div>
      </div>

      {/* 个人工作指标 */}
      <div className="grid grid-cols-4 gap-4">
        {MY_WORK_STATS.map((stat) => (
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

      {/* 待处理工单 + 可抢单 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 待处理工单 */}
        <Card className="col-span-2 border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              待处理工单
            </CardTitle>
            <Badge variant="secondary" className="gap-1">
              {PENDING_TASKS.length}单待处理
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {PENDING_TASKS.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      task.priority === "high" 
                        ? "bg-red-500 animate-pulse" 
                        : task.priority === "medium" 
                          ? "bg-amber-500" 
                          : "bg-slate-300"
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 text-sm">{task.title}</span>
                        <span className="text-xs text-slate-400">{task.id}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{task.customer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-emerald-600">+¥{task.amount}</p>
                      <p className="text-xs text-slate-400">截止 {task.deadline}</p>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      处理
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 可抢单 */}
        <Card className="border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              可抢单
            </CardTitle>
            <Badge variant="secondary">{AVAILABLE_ORDERS.length}单</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {AVAILABLE_ORDERS.map((order) => (
                <div
                  key={order.id}
                  className="p-3 rounded-lg bg-amber-50 border border-amber-100 hover:border-amber-200 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-900 text-sm">{order.title}</span>
                    <span className="text-sm font-semibold text-amber-600">¥{order.amount}</span>
                  </div>
                  <p className="text-xs text-slate-500">{order.customer}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-400">截止 {order.deadline}</span>
                    <Button size="sm" className="h-6 text-xs bg-amber-500 hover:bg-amber-600">
                      抢单
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最近收入 + 本周目标 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 最近收入 */}
        <Card className="border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              最近收入
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-amber-600">
              查看明细 <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {RECENT_INCOME.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100"
                >
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{item.customer}</p>
                    <p className="text-xs text-slate-500">{item.service}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600">+¥{item.amount}</p>
                    <p className="text-xs text-slate-400">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 rounded-lg bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">本月累计收入</p>
                  <p className="text-xl font-bold text-slate-900">¥8,600</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">较上月</p>
                  <p className="text-sm text-emerald-600 font-medium">+12.5%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 本周目标 */}
        <Card className="border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              本周目标
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {WEEKLY_TARGETS.map((target) => {
                const percentage = (target.current / target.target) * 100;
                return (
                  <div key={target.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">{target.name}</span>
                      <span className="text-sm">
                        <span className="font-semibold text-slate-900">{target.current}</span>
                        <span className="text-slate-400"> / {target.target}</span>
                      </span>
                    </div>
                    <Progress value={Math.min(percentage, 100)} className="h-2" />
                    <p className="text-xs text-slate-500 mt-1 text-right">
                      {percentage >= 100 ? (
                        <span className="text-emerald-600">✓ 已完成</span>
                      ) : (
                        `还差 ${target.target - target.current} 完成`
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 mb-1">本周预计收入</p>
              <p className="text-2xl font-bold text-slate-900">¥2,400</p>
              <p className="text-xs text-emerald-600 mt-1">距离周目标还差 ¥600</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
