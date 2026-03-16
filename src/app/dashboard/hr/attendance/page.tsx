"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  TrendingUp,
  TrendingDown,
  UserCheck,
  UserX,
  Timer,
} from "lucide-react";

// 考勤状态
const ATTENDANCE_STATUS = {
  normal: { label: "正常", color: "bg-emerald-100 text-emerald-700" },
  late: { label: "迟到", color: "bg-amber-100 text-amber-700" },
  early: { label: "早退", color: "bg-amber-100 text-amber-700" },
  absent: { label: "缺勤", color: "bg-red-100 text-red-700" },
  leave: { label: "请假", color: "bg-blue-100 text-blue-700" },
  overtime: { label: "加班", color: "bg-purple-100 text-purple-700" },
};

// 模拟考勤数据
const MOCK_ATTENDANCE = [
  {
    id: "1",
    employeeName: "张三",
    project: "阿里巴巴客服项目",
    date: "2024-01-16",
    checkIn: "08:55",
    checkOut: "18:05",
    status: "normal",
    workHours: 9.2,
  },
  {
    id: "2",
    employeeName: "李四",
    project: "京东仓储项目",
    date: "2024-01-16",
    checkIn: "09:15",
    checkOut: "18:00",
    status: "late",
    workHours: 8.8,
  },
  {
    id: "3",
    employeeName: "王五",
    project: "-",
    date: "2024-01-16",
    checkIn: null,
    checkOut: null,
    status: "absent",
    workHours: 0,
  },
  {
    id: "4",
    employeeName: "赵六",
    project: "阿里巴巴客服项目",
    date: "2024-01-16",
    checkIn: "08:58",
    checkOut: "20:30",
    status: "overtime",
    workHours: 11.5,
  },
  {
    id: "5",
    employeeName: "钱七",
    project: "美团配送项目",
    date: "2024-01-16",
    checkIn: "08:50",
    checkOut: "17:30",
    status: "early",
    workHours: 8.7,
  },
];

// 请假记录
const MOCK_LEAVES = [
  {
    id: "1",
    employeeName: "张三",
    type: "事假",
    startDate: "2024-01-20",
    endDate: "2024-01-21",
    days: 2,
    reason: "家中有事",
    status: "pending",
  },
  {
    id: "2",
    employeeName: "李四",
    type: "病假",
    startDate: "2024-01-18",
    endDate: "2024-01-19",
    days: 2,
    reason: "感冒发烧",
    status: "approved",
  },
];

export default function AttendancePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("today");

  const filteredAttendance = MOCK_ATTENDANCE.filter((record) => {
    const matchesSearch = record.employeeName.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 统计数据
  const stats = {
    total: 256,
    present: 242,
    absent: 8,
    late: 12,
    onLeave: 15,
    attendanceRate: 94.5,
  };

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">考勤管理</h1>
          <p className="text-sm text-slate-500 mt-1">管理员工考勤打卡记录</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="border-slate-200/60">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-xs text-slate-500">应出勤</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.present}</p>
              <p className="text-xs text-slate-500">已出勤</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              <p className="text-xs text-slate-500">缺勤</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.late}</p>
              <p className="text-xs text-slate-500">迟到</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.onLeave}</p>
              <p className="text-xs text-slate-500">请假</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.attendanceRate}%</p>
              <p className="text-xs text-emerald-600">出勤率</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 标签页 */}
      <Tabs defaultValue="records">
        <TabsList>
          <TabsTrigger value="records">考勤记录</TabsTrigger>
          <TabsTrigger value="leaves">请假管理</TabsTrigger>
          <TabsTrigger value="overtime">加班管理</TabsTrigger>
        </TabsList>

        {/* 考勤记录 */}
        <TabsContent value="records" className="space-y-4 mt-4">
          {/* 搜索和筛选 */}
          <Card className="border-slate-200/60">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="搜索员工姓名..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="日期" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">今天</SelectItem>
                    <SelectItem value="yesterday">昨天</SelectItem>
                    <SelectItem value="week">本周</SelectItem>
                    <SelectItem value="month">本月</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="考勤状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="normal">正常</SelectItem>
                    <SelectItem value="late">迟到</SelectItem>
                    <SelectItem value="early">早退</SelectItem>
                    <SelectItem value="absent">缺勤</SelectItem>
                    <SelectItem value="leave">请假</SelectItem>
                    <SelectItem value="overtime">加班</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 考勤列表 */}
          <Card className="border-slate-200/60">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {filteredAttendance.map((record) => {
                  const statusConfig = ATTENDANCE_STATUS[record.status as keyof typeof ATTENDANCE_STATUS];
                  return (
                    <div
                      key={record.id}
                      className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                    >
                      {/* 头像 */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-medium">
                          {record.employeeName.charAt(0)}
                        </span>
                      </div>

                      {/* 员工信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900">{record.employeeName}</span>
                          <span className="text-xs text-slate-500">{record.project}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {record.date}
                          </span>
                        </div>
                      </div>

                      {/* 打卡时间 */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-slate-500 text-xs">上班打卡</p>
                          <p className={`font-medium ${record.checkIn ? "text-slate-900" : "text-slate-400"}`}>
                            {record.checkIn || "-"}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-slate-500 text-xs">下班打卡</p>
                          <p className={`font-medium ${record.checkOut ? "text-slate-900" : "text-slate-400"}`}>
                            {record.checkOut || "-"}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-slate-500 text-xs">工时</p>
                          <p className="font-medium text-slate-900">{record.workHours}h</p>
                        </div>
                      </div>

                      {/* 状态 */}
                      <Badge className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 请假管理 */}
        <TabsContent value="leaves" className="space-y-4 mt-4">
          <Card className="border-slate-200/60">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">请假申请</CardTitle>
                <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500">
                  新增申请
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {MOCK_LEAVES.map((leave) => (
                  <div key={leave.id} className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {leave.employeeName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{leave.employeeName}</span>
                        <Badge variant="outline">{leave.type}</Badge>
                        <Badge className={leave.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                          {leave.status === "approved" ? "已批准" : "待审批"}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">
                        {leave.startDate} ~ {leave.endDate} ({leave.days}天) · {leave.reason}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">批准</Button>
                      <Button variant="outline" size="sm">拒绝</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 加班管理 */}
        <TabsContent value="overtime" className="mt-4">
          <Card className="border-slate-200/60">
            <CardContent className="pt-6 text-center text-slate-500">
              暂无加班记录
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
