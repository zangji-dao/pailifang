"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Store,
  Search,
  Filter,
  Plus,
  Clock,
  User,
  Building2,
  ChevronRight,
  FileText,
  CircleDot,
  Scale,
  Palette,
  Award,
  Briefcase,
  AlertCircle,
  TrendingUp,
  Users,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// 服务类型配置
const serviceTypes = [
  { id: "all", name: "全部", icon: Store, count: 5 },
  { id: "business", name: "工商服务", icon: Briefcase, count: 2 },
  { id: "trademark", name: "商标注册", icon: CircleDot, count: 1 },
  { id: "patent", name: "专利申请", icon: FileText, count: 0 },
  { id: "legal", name: "法律服务", icon: Scale, count: 1 },
  { id: "design", name: "设计服务", icon: Palette, count: 1 },
  { id: "qualification", name: "资质代办", icon: Award, count: 0 },
];

// 工单数据
const workOrders = [
  {
    id: "WO-2026-001",
    type: "business",
    typeName: "工商注册",
    title: "公司注册",
    customer: "长春市盛世餐饮有限公司",
    amount: 2000,
    deadline: "2026-01-18",
    priority: "high",
    salesPerson: "张销售",
    description: "新公司注册，需要办理营业执照、公章刻制、银行开户等全套服务。",
    createdAt: "2026-01-15 09:30",
  },
  {
    id: "WO-2026-002",
    type: "business",
    typeName: "工商变更",
    title: "公司地址变更",
    customer: "松原市宇鑫化工有限公司",
    amount: 800,
    deadline: "2026-01-20",
    priority: "medium",
    salesPerson: "李销售",
    description: "公司办公地址迁移，需要办理工商变更登记。",
    createdAt: "2026-01-15 10:15",
  },
  {
    id: "WO-2026-003",
    type: "trademark",
    typeName: "商标注册",
    title: "商标注册申请",
    customer: "吉林省宏远贸易公司",
    amount: 1500,
    deadline: "2026-01-22",
    priority: "medium",
    salesPerson: "张销售",
    description: "申请注册公司商标，类别：第35类广告销售。",
    createdAt: "2026-01-14 14:20",
  },
  {
    id: "WO-2026-004",
    type: "legal",
    typeName: "法律咨询",
    title: "合同审核",
    customer: "华信科技有限公司",
    amount: 500,
    deadline: "2026-01-17",
    priority: "low",
    salesPerson: "王销售",
    description: "审核供应商合作协议，条款风险评估。",
    createdAt: "2026-01-15 11:00",
  },
  {
    id: "WO-2026-005",
    type: "design",
    typeName: "Logo设计",
    title: "企业Logo设计",
    customer: "新兴建材有限公司",
    amount: 3000,
    deadline: "2026-01-25",
    priority: "medium",
    salesPerson: "李销售",
    description: "设计公司Logo，提供3套方案，含源文件。",
    createdAt: "2026-01-15 08:45",
  },
];

// 统计数据
const stats = [
  { label: "待接单", value: 5, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
  { label: "今日新增", value: 3, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
  { label: "平均金额", value: "¥1,560", icon: Sparkles, color: "text-violet-500", bg: "bg-violet-50" },
];

// 获取优先级样式
const getPriorityStyle = (priority: string) => {
  switch (priority) {
    case "high":
      return { label: "紧急", className: "bg-rose-50 text-rose-600 border-rose-200" };
    case "medium":
      return { label: "普通", className: "bg-amber-50 text-amber-600 border-amber-200" };
    case "low":
      return { label: "低优", className: "bg-slate-50 text-slate-600 border-slate-200" };
    default:
      return { label: "普通", className: "bg-slate-50 text-slate-600 border-slate-200" };
  }
};

// 获取类型图标
const getTypeIcon = (type: string) => {
  switch (type) {
    case "business": return Briefcase;
    case "trademark": return CircleDot;
    case "patent": return FileText;
    case "legal": return Scale;
    case "design": return Palette;
    case "qualification": return Award;
    default: return FileText;
  }
};

// 计算剩余天数
const getDaysLeft = (deadline: string) => {
  const today = new Date("2026-01-16");
  const deadlineDate = new Date(deadline);
  const diff = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

export default function OrderHallPage() {
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 过滤工单
  const filteredOrders = workOrders.filter(order => {
    const typeMatch = selectedType === "all" || order.type === selectedType;
    const searchMatch = searchQuery === "" || 
      order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase());
    return typeMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">去抢单</h1>
          <p className="text-sm text-slate-500 mt-0.5">查看可抢单的工单，选择合适的任务</p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 border-0">
          <Plus className="h-4 w-4" />
          发起工单
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-slate-200/60 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 类型筛选 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {serviceTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              selectedType === type.id
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
                : "bg-white border border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50"
            }`}
          >
            <type.icon className="h-4 w-4" />
            {type.name}
            {type.count > 0 && (
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                selectedType === type.id ? "bg-white/20 text-white" : "bg-amber-100 text-amber-600"
              }`}>
                {type.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 搜索栏 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="搜索工单标题、客户名称..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
        />
      </div>

      {/* 工单列表 */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Store className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">暂无符合条件的工单</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const TypeIcon = getTypeIcon(order.type);
            const priorityStyle = getPriorityStyle(order.priority);
            const daysLeft = getDaysLeft(order.deadline);

            return (
              <Card 
                key={order.id} 
                className="border-slate-200/60 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* 类型图标 */}
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex-shrink-0">
                      <TypeIcon className="h-5 w-5 text-amber-600" />
                    </div>

                    {/* 工单信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-amber-600">{order.id}</span>
                            <Badge variant="outline" className={`text-[10px] ${priorityStyle.className}`}>
                              {priorityStyle.label}
                            </Badge>
                            <span className="text-xs text-slate-400">{order.typeName}</span>
                          </div>
                          <h3 className="text-base font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">
                            {order.title}
                          </h3>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-slate-900">¥{order.amount.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">工单金额</p>
                        </div>
                      </div>

                      <p className="text-sm text-slate-600 mb-3 line-clamp-1">{order.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5" />
                            <span>{order.customer}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            <span>{order.salesPerson}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center gap-1 text-xs ${
                            daysLeft <= 1 ? "text-rose-600" : daysLeft <= 3 ? "text-amber-600" : "text-slate-500"
                          }`}>
                            <Clock className="h-3.5 w-3.5" />
                            <span>{daysLeft <= 0 ? "已截止" : `${daysLeft}天后截止`}</span>
                          </div>
                          <Button 
                            size="sm" 
                            className="h-7 gap-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
                          >
                            立即抢单
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
