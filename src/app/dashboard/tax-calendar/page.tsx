"use client";

import { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Bell,
  Building2,
  FileText,
  DollarSign,
  Users,
  Briefcase,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 税务类型配置
const TAX_TYPES = {
  vat: { name: "增值税", icon: DollarSign, color: "blue", bgColor: "bg-blue-50", textColor: "text-blue-600" },
  cit: { name: "企业所得税", icon: Building2, color: "purple", bgColor: "bg-purple-50", textColor: "text-purple-600" },
  iit: { name: "个人所得税", icon: Users, color: "green", bgColor: "bg-green-50", textColor: "text-green-600" },
  stamp: { name: "印花税", icon: FileText, color: "orange", bgColor: "bg-orange-50", textColor: "text-orange-600" },
  surcharge: { name: "附加税", icon: Briefcase, color: "cyan", bgColor: "bg-cyan-50", textColor: "text-cyan-600" },
  report: { name: "财务报表", icon: FileText, color: "slate", bgColor: "bg-slate-50", textColor: "text-slate-600" },
};

// 税务事项状态
const STATUS_CONFIG = {
  pending: { name: "待处理", color: "amber", icon: Clock },
  completed: { name: "已完成", color: "emerald", icon: CheckCircle2 },
  overdue: { name: "已逾期", color: "red", icon: AlertCircle },
  warning: { name: "即将到期", color: "orange", icon: AlertTriangle },
};

// 当月税务事项
const TAX_ITEMS = [
  {
    id: 1,
    type: "vat",
    title: "增值税月度申报",
    customer: "吉林省宏远贸易公司",
    deadline: "2026-01-15",
    status: "pending",
    period: "2025年12月",
    amount: "¥12,580",
    daysLeft: 4,
  },
  {
    id: 2,
    type: "iit",
    title: "个人所得税代扣代缴",
    customer: "松原市宇鑫化工有限公司",
    deadline: "2026-01-15",
    status: "completed",
    period: "2025年12月",
    amount: "¥8,200",
    daysLeft: 4,
  },
  {
    id: 3,
    type: "cit",
    title: "企业所得税季度预缴",
    customer: "华信科技有限公司",
    deadline: "2026-01-18",
    status: "pending",
    period: "2025年Q4",
    amount: "¥45,000",
    daysLeft: 7,
  },
  {
    id: 4,
    type: "report",
    title: "财务报表报送",
    customer: "新兴建材有限公司",
    deadline: "2026-01-20",
    status: "warning",
    period: "2025年12月",
    amount: "-",
    daysLeft: 9,
  },
  {
    id: 5,
    type: "stamp",
    title: "印花税申报",
    customer: "长春市盛世餐饮公司",
    deadline: "2026-01-10",
    status: "overdue",
    period: "2025年Q4",
    amount: "¥580",
    daysLeft: -1,
  },
  {
    id: 6,
    type: "vat",
    title: "增值税月度申报",
    customer: "创新科技有限公司",
    deadline: "2026-01-15",
    status: "completed",
    period: "2025年12月",
    amount: "¥25,800",
    daysLeft: 4,
  },
  {
    id: 7,
    type: "surcharge",
    title: "附加税申报",
    customer: "四平市新起点餐饮",
    deadline: "2026-01-15",
    status: "pending",
    period: "2025年12月",
    amount: "¥1,520",
    daysLeft: 4,
  },
];

// 日历事件数据（按日期分组）
const CALENDAR_EVENTS: Record<string, Array<{ type: string; title: string; customer: string }>> = {
  "2026-01-10": [{ type: "stamp", title: "印花税申报", customer: "长春市盛世餐饮" }],
  "2026-01-15": [
    { type: "vat", title: "增值税申报", customer: "吉林省宏远贸易" },
    { type: "iit", title: "个税代扣", customer: "松原市宇鑫化工" },
    { type: "vat", title: "增值税申报", customer: "创新科技" },
    { type: "surcharge", title: "附加税申报", customer: "四平新起点餐饮" },
  ],
  "2026-01-18": [{ type: "cit", title: "企业所得税预缴", customer: "华信科技" }],
  "2026-01-20": [{ type: "report", title: "财务报表报送", customer: "新兴建材" }],
  "2026-01-25": [{ type: "vat", title: "增值税申报", customer: "测试公司A" }],
};

// 统计数据
const STATS = [
  { label: "待处理", value: 3, color: "text-amber-600", bgColor: "bg-amber-50" },
  { label: "已完成", value: 2, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  { label: "已逾期", value: 1, color: "text-red-600", bgColor: "bg-red-50" },
  { label: "本月总计", value: 6, color: "text-blue-600", bgColor: "bg-blue-50" },
];

export default function TaxCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1)); // 2026年1月
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  // 生成日历数据
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: Array<{ date: Date; isCurrentMonth: boolean; events: typeof CALENDAR_EVENTS[string] }> = [];

    // 上个月的日期填充
    for (let i = 0; i < startDay; i++) {
      const prevDate = new Date(year, month, -startDay + i + 1);
      const dateStr = formatDate(prevDate);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        events: CALENDAR_EVENTS[dateStr] || [],
      });
    }

    // 当前月的日期
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateStr = formatDate(date);
      days.push({
        date,
        isCurrentMonth: true,
        events: CALENDAR_EVENTS[dateStr] || [],
      });
    }

    // 下个月的日期填充
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dateStr = formatDate(nextDate);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        events: CALENDAR_EVENTS[dateStr] || [],
      });
    }

    return days;
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatMonth = (date: Date): string => {
    const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
    return `${date.getFullYear()}年 ${months[date.getMonth()]}`;
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const today = new Date();
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  // 筛选税务事项
  const filteredItems = TAX_ITEMS.filter((item) => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">税务日历</h1>
          <p className="text-slate-500 mt-1">管理客户税务申报时间节点，避免逾期风险</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Bell className="h-4 w-4" />
            提醒设置
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500">
            <Plus className="h-4 w-4" />
            添加事项
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <Card key={stat.label} className="border-slate-200/60">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
                </div>
                <span className="text-sm text-slate-600">{stat.label}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 日历区域 */}
        <div className="col-span-8">
          <Card className="border-slate-200/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">申报日历</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[120px] text-center">{formatMonth(currentDate)}</span>
                <Button variant="ghost" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* 星期标题 */}
              <div className="grid grid-cols-7 mb-2">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* 日历格子 */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const dateStr = formatDate(day.date);
                  const isSelected = selectedDate === dateStr;
                  const hasEvents = day.events.length > 0;

                  return (
                    <div
                      key={index}
                      onClick={() => hasEvents && setSelectedDate(dateStr)}
                      className={`min-h-[80px] p-1 rounded-lg border transition-all cursor-pointer ${
                        day.isCurrentMonth
                          ? isSelected
                            ? "border-amber-400 bg-amber-50"
                            : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                          : "border-transparent bg-slate-50/50"
                      } ${hasEvents ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-sm ${
                            isToday(day.date)
                              ? "w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center"
                              : day.isCurrentMonth
                              ? "text-slate-700"
                              : "text-slate-400"
                          }`}
                        >
                          {day.date.getDate()}
                        </span>
                        {hasEvents && (
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-xs flex items-center justify-center">
                            {day.events.length}
                          </span>
                        )}
                      </div>

                      {/* 事件指示器 */}
                      <div className="space-y-0.5">
                        {day.events.slice(0, 2).map((event, i) => {
                          const typeConfig = TAX_TYPES[event.type as keyof typeof TAX_TYPES];
                          return (
                            <div
                              key={i}
                              className={`text-[10px] px-1 py-0.5 rounded truncate ${typeConfig.bgColor} ${typeConfig.textColor}`}
                            >
                              {event.title}
                            </div>
                          );
                        })}
                        {day.events.length > 2 && (
                          <div className="text-[10px] text-slate-400 px-1">+{day.events.length - 2}更多</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 图例 */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                {Object.entries(TAX_TYPES).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded ${config.bgColor}`} />
                    <span className="text-xs text-slate-500">{config.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧待办列表 */}
        <div className="col-span-4 space-y-4">
          {/* 筛选 */}
          <Card className="border-slate-200/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                快速筛选
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={filter === "all" ? "default" : "outline"}
                  onClick={() => setFilter("all")}
                  className={filter === "all" ? "bg-amber-500 hover:bg-amber-600" : ""}
                >
                  全部
                </Button>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={filter === key ? "default" : "outline"}
                    onClick={() => setFilter(key)}
                    className={filter === key ? "bg-amber-500 hover:bg-amber-600" : ""}
                  >
                    {config.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 待办事项列表 */}
          <Card className="border-slate-200/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                近期待办
                <Badge variant="secondary" className="ml-2">{filteredItems.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredItems.map((item) => {
                  const typeConfig = TAX_TYPES[item.type as keyof typeof TAX_TYPES];
                  const statusConfig = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG];
                  const Icon = typeConfig.icon;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        item.status === "overdue"
                          ? "border-red-200 bg-red-50/50"
                          : item.status === "warning"
                          ? "border-orange-200 bg-orange-50/50"
                          : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg ${typeConfig.bgColor} flex items-center justify-center`}>
                            <Icon className={`h-4 w-4 ${typeConfig.textColor}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{item.title}</p>
                            <p className="text-xs text-slate-500">{item.customer}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              查看详情
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${
                              statusConfig.color === "red"
                                ? "bg-red-100 text-red-700"
                                : statusConfig.color === "emerald"
                                ? "bg-emerald-100 text-emerald-700"
                                : statusConfig.color === "orange"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.name}
                          </Badge>
                          <span className="text-slate-400">{item.period}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-slate-700">{item.amount}</span>
                          <p className="text-slate-400">
                            截止 {item.deadline}
                            {item.daysLeft > 0 ? ` (${item.daysLeft}天后)` : item.daysLeft === 0 ? " (今天)" : " (已逾期)"}
                          </p>
                        </div>
                      </div>

                      {item.status !== "completed" && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            标记完成
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredItems.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>暂无符合条件的税务事项</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 选中日期详情 */}
      {selectedDate && CALENDAR_EVENTS[selectedDate] && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-amber-600" />
              {selectedDate} 税务事项
              <Badge variant="secondary">{CALENDAR_EVENTS[selectedDate].length}项</Badge>
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSelectedDate(null)}>
                关闭
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {CALENDAR_EVENTS[selectedDate].map((event, i) => {
                const typeConfig = TAX_TYPES[event.type as keyof typeof TAX_TYPES];
                return (
                  <div key={i} className={`px-3 py-2 rounded-lg ${typeConfig.bgColor}`}>
                    <p className={`text-sm font-medium ${typeConfig.textColor}`}>{event.title}</p>
                    <p className="text-xs text-slate-500">{event.customer}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
