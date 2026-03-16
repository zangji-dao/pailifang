"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Crown,
  Users,
  Phone,
  Calculator,
  ChevronDown,
  Building2,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Calendar,
  ArrowRight,
  Store,
  Award,
  Zap,
  Target,
  UserCheck,
  Receipt,
  BarChart3,
  Settings,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

// 角色配置
const ROLE_CONFIG = {
  admin: {
    name: "老板/管理员",
    icon: Crown,
    description: "全局经营视角",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  manager: {
    name: "经理",
    icon: Users,
    description: "团队运营视角",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  sales: {
    name: "销售",
    icon: Phone,
    description: "个人业绩视角",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  accountant: {
    name: "员工/会计",
    icon: Calculator,
    description: "工作任务视角",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
  },
};

// 功能入口配置
const FEATURE_MODULES = [
  {
    id: "customers",
    name: "客户管理",
    description: "客户档案、跟进记录",
    icon: Building2,
    href: "/dashboard/customers",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    gradient: "from-blue-500 to-cyan-500",
    stats: "128 位客户",
  },
  {
    id: "work-orders",
    name: "工单中心",
    description: "任务派发、进度追踪",
    icon: FileText,
    href: "/dashboard/work-orders",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    gradient: "from-amber-500 to-orange-500",
    stats: "5 待处理",
    badge: "5",
  },
  {
    id: "accounting",
    name: "云财务",
    description: "记账、报税、报表",
    icon: Calculator,
    href: "/accounting",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    gradient: "from-emerald-500 to-teal-500",
    stats: "23 个账套",
  },
  {
    id: "settlement",
    name: "分润结算",
    description: "业绩统计、收益分配",
    icon: DollarSign,
    href: "/dashboard/settlement",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    gradient: "from-purple-500 to-pink-500",
    stats: "¥8,600 本月",
  },
  {
    id: "sales",
    name: "销售中心",
    description: "线索管理、商机转化",
    icon: TrendingUp,
    href: "/dashboard/sales",
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    gradient: "from-rose-500 to-red-500",
    stats: "12 条线索",
    badge: "3",
  },
  {
    id: "hr",
    name: "人力资源",
    description: "劳务派遣、员工管理",
    icon: UserCheck,
    href: "/dashboard/hr",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    gradient: "from-cyan-500 to-blue-500",
    stats: "56 在职",
  },
];

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

// 快捷操作
const QUICK_ACTIONS = [
  { name: "新增客户", icon: Building2, href: "/dashboard/customers/new" },
  { name: "创建工单", icon: FileText, href: "/dashboard/work-orders/new" },
  { name: "新增凭证", icon: Receipt, href: "/accounting/vouchers/new" },
  { name: "收款登记", icon: DollarSign, href: "/dashboard/settlement/receipt" },
];

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<string>("accountant");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setCurrentRole(parsedUser.role || "accountant");
    }
    setLoading(false);
  }, []);

  const currentRoleConfig = ROLE_CONFIG[currentRole as keyof typeof ROLE_CONFIG];
  const CurrentIcon = currentRoleConfig?.icon || Calculator;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] -m-6 p-6 bg-gradient-to-br from-amber-50/60 via-slate-50 to-amber-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 mt-2">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] -m-6 p-6 bg-gradient-to-br from-amber-50/60 via-slate-50 to-amber-50/30">
      {/* 角色切换演示工具条 */}
      <div className="fixed top-16 right-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-white/90 backdrop-blur-sm border-slate-200 shadow-sm">
              <div className={`w-6 h-6 rounded-full ${currentRoleConfig.bgColor} flex items-center justify-center`}>
                <CurrentIcon className={`h-3.5 w-3.5 ${currentRoleConfig.color}`} />
              </div>
              <span className="text-sm">{currentRoleConfig.name}</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>切换角色视图</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.entries(ROLE_CONFIG).map(([role, config]) => {
              const Icon = config.icon;
              return (
                <DropdownMenuItem
                  key={role}
                  onClick={() => setCurrentRole(role)}
                  className={cn("flex items-center gap-3 cursor-pointer", currentRole === role ? "bg-amber-50" : "")}
                >
                  <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{config.name}</p>
                    <p className="text-xs text-slate-500">{config.description}</p>
                  </div>
                  {currentRole === role && <Badge variant="secondary" className="text-xs">当前</Badge>}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">工作台</h1>
            <p className="text-slate-500 mt-1">欢迎回来，{user?.name || "张会计"}</p>
          </div>
          <div className="flex items-center gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.name}
                variant="outline"
                size="sm"
                className="h-8 bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                asChild
              >
                <Link href={action.href}>
                  <action.icon className="h-3.5 w-3.5 mr-1.5" />
                  {action.name}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        {/* 功能入口卡片 */}
        <div className="grid grid-cols-6 gap-4">
          {FEATURE_MODULES.map((module) => (
            <Link
              key={module.id}
              href={module.href}
              className="group relative bg-white rounded-xl border border-slate-200/60 p-4 hover:shadow-lg hover:border-amber-200 transition-all duration-300"
            >
              {/* 角标 */}
              {module.badge && (
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1.5 text-[10px] font-medium bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm">
                  {module.badge}
                </span>
              )}

              {/* 图标 */}
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br text-white shadow-lg",
                  module.gradient
                )}
              >
                <module.icon className="h-6 w-6" />
              </div>

              {/* 标题 */}
              <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-amber-600 transition-colors">
                {module.name}
              </h3>

              {/* 描述 */}
              <p className="text-xs text-slate-500 mb-2">{module.description}</p>

              {/* 统计数据 */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">{module.stats}</span>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>

        {/* 数据概览 */}
        <div className="grid grid-cols-4 gap-4">
          {MY_WORK_STATS.map((stat, index) => (
            <Card key={index} className="border-slate-200/60 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    <p
                      className={cn(
                        "text-xs mt-1",
                        stat.trend === "up" ? "text-emerald-600" : stat.trend === "down" ? "text-red-600" : "text-slate-500"
                      )}
                    >
                      {stat.change}
                    </p>
                  </div>
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.bgColor)}>
                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 主要内容区 */}
        <div className="grid grid-cols-3 gap-6">
          {/* 待处理工单 */}
          <Card className="col-span-2 border-slate-200/60 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-base">待处理工单</CardTitle>
                </div>
                <Button variant="link" className="text-amber-600 text-sm p-0 h-auto" asChild>
                  <Link href="/dashboard/work-orders">
                    查看全部
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {PENDING_TASKS.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-colors cursor-pointer"
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        task.priority === "high"
                          ? "bg-red-100"
                          : task.priority === "medium"
                          ? "bg-amber-100"
                          : "bg-blue-100"
                      )}
                    >
                      <FileText
                        className={cn(
                          "h-4 w-4",
                          task.priority === "high"
                            ? "text-red-500"
                            : task.priority === "medium"
                            ? "text-amber-500"
                            : "text-blue-500"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-900 text-sm">{task.title}</p>
                        <span className="text-sm font-medium text-slate-600">¥{task.amount}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-slate-500">{task.customer}</p>
                        <span
                          className={cn(
                            "text-xs font-medium",
                            task.priority === "high"
                              ? "text-red-500"
                              : task.priority === "medium"
                              ? "text-amber-500"
                              : "text-blue-500"
                          )}
                        >
                          {task.deadline}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 右侧区域 */}
          <div className="space-y-6">
            {/* 本周目标 */}
            <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-base">本周目标</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {WEEKLY_TARGETS.map((target, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-slate-600">{target.name}</span>
                      <span className="text-xs text-slate-500">
                        {target.current}/{target.target}
                      </span>
                    </div>
                    <Progress
                      value={(target.current / target.target) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 最近收入 */}
            <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-base">最近收入</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {RECENT_INCOME.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.customer}</p>
                        <p className="text-xs text-slate-500">{item.service}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-emerald-600">+¥{item.amount}</p>
                        <p className="text-xs text-slate-400">{item.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
