"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  GraduationCap,
  Users,
  Clock,
  CheckCircle,
  Calendar,
  Video,
  FileText,
  User,
  BookOpen,
  Award,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

// 培训状态
const TRAINING_STATUS = {
  draft: { label: "草稿", color: "bg-slate-100 text-slate-700" },
  upcoming: { label: "待开始", color: "bg-blue-100 text-blue-700" },
  ongoing: { label: "进行中", color: "bg-amber-100 text-amber-700" },
  completed: { label: "已完成", color: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "已取消", color: "bg-red-100 text-red-700" },
};

// 培训类型
const TRAINING_TYPES = {
  safety: "安全培训",
  skill: "技能培训",
  induction: "入职培训",
  compliance: "合规培训",
  professional: "专业培训",
};

// 培训方式
const TRAINING_METHODS = {
  online: "线上培训",
  offline: "线下培训",
  mixed: "混合培训",
};

// 模拟培训课程数据
const MOCK_TRAININGS = [
  {
    id: "1",
    title: "新员工入职培训",
    type: "induction",
    method: "offline",
    status: "upcoming",
    target: "新入职员工",
    participantCount: 25,
    maxParticipants: 30,
    duration: "2天",
    startDate: "2024-01-25",
    endDate: "2024-01-26",
    trainer: "人力资源部",
    location: "公司会议室A",
    description: "包含公司文化、规章制度、安全知识等内容",
  },
  {
    id: "2",
    title: "安全生产知识培训",
    type: "safety",
    method: "online",
    status: "ongoing",
    target: "全体员工",
    participantCount: 180,
    maxParticipants: 200,
    duration: "4小时",
    startDate: "2024-01-20",
    endDate: "2024-01-20",
    trainer: "安全管理部",
    location: "在线平台",
    description: "安全生产法规、应急处理、防护措施等",
  },
  {
    id: "3",
    title: "仓储管理技能提升",
    type: "skill",
    method: "mixed",
    status: "completed",
    target: "仓储岗位员工",
    participantCount: 45,
    maxParticipants: 50,
    duration: "3天",
    startDate: "2024-01-10",
    endDate: "2024-01-12",
    trainer: "外部讲师",
    location: "京东仓储培训中心",
    description: "仓储管理系统操作、货品分类、盘点流程",
  },
  {
    id: "4",
    title: "客服沟通技巧培训",
    type: "skill",
    method: "offline",
    status: "ongoing",
    target: "客服岗位员工",
    participantCount: 60,
    maxParticipants: 80,
    duration: "1天",
    startDate: "2024-01-22",
    endDate: "2024-01-22",
    trainer: "培训部",
    location: "阿里巴巴客服中心",
    description: "沟通技巧、投诉处理、服务礼仪",
  },
  {
    id: "5",
    title: "劳动法规合规培训",
    type: "compliance",
    method: "online",
    status: "draft",
    target: "管理人员",
    participantCount: 0,
    maxParticipants: 100,
    duration: "2小时",
    startDate: "2024-02-01",
    endDate: "2024-02-01",
    trainer: "法务部",
    location: "在线平台",
    description: "劳动法基础、合同管理、风险防范",
  },
  {
    id: "6",
    title: "Excel数据处理培训",
    type: "professional",
    method: "online",
    status: "upcoming",
    target: "行政岗位员工",
    participantCount: 35,
    maxParticipants: 40,
    duration: "6小时",
    startDate: "2024-01-28",
    endDate: "2024-01-29",
    trainer: "IT部门",
    location: "在线平台",
    description: "Excel高级函数、数据透视表、图表制作",
  },
];

// 模拟员工培训记录
const MOCK_RECORDS = [
  {
    id: "1",
    employeeName: "张三",
    employeeId: "EMP001",
    trainingTitle: "安全生产知识培训",
    trainingType: "safety",
    status: "completed",
    score: 92,
    completionDate: "2024-01-20",
    certificate: "SAF-2024-001",
  },
  {
    id: "2",
    employeeName: "李四",
    employeeId: "EMP002",
    trainingTitle: "仓储管理技能提升",
    trainingType: "skill",
    status: "completed",
    score: 88,
    completionDate: "2024-01-12",
    certificate: "SKL-2024-015",
  },
  {
    id: "3",
    employeeName: "王五",
    employeeId: "EMP003",
    trainingTitle: "客服沟通技巧培训",
    trainingType: "skill",
    status: "in_progress",
    score: null,
    completionDate: null,
    certificate: null,
  },
  {
    id: "4",
    employeeName: "赵六",
    employeeId: "EMP004",
    trainingTitle: "新员工入职培训",
    trainingType: "induction",
    status: "registered",
    score: null,
    completionDate: null,
    certificate: null,
  },
  {
    id: "5",
    employeeName: "钱七",
    employeeId: "EMP005",
    trainingTitle: "劳动法规合规培训",
    trainingType: "compliance",
    status: "pending",
    score: null,
    completionDate: null,
    certificate: null,
  },
];

// 统计卡片数据
const STATS = [
  { label: "培训课程", value: 28, icon: BookOpen, color: "bg-blue-500" },
  { label: "培训人次", value: 1256, icon: Users, color: "bg-emerald-500" },
  { label: "完成率", value: "87%", icon: CheckCircle, color: "bg-amber-500" },
  { label: "本月培训", value: 12, icon: Calendar, color: "bg-purple-500" },
  { label: "待培训", value: 45, icon: AlertCircle, color: "bg-red-500" },
];

export default function TrainingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<typeof MOCK_TRAININGS[0] | null>(null);
  const [activeTab, setActiveTab] = useState("courses");

  // 过滤培训课程列表
  const filteredTrainings = MOCK_TRAININGS.filter((training) => {
    const matchesSearch = training.title.includes(searchQuery) || training.trainer.includes(searchQuery);
    const matchesType = typeFilter === "all" || training.type === typeFilter;
    const matchesStatus = statusFilter === "all" || training.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // 过滤培训记录列表
  const filteredRecords = MOCK_RECORDS.filter((record) => {
    const matchesSearch = record.employeeName.includes(searchQuery) || record.trainingTitle.includes(searchQuery);
    const matchesType = typeFilter === "all" || record.trainingType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">培训管理</h1>
          <p className="text-sm text-slate-500 mt-1">管理员工培训课程和培训记录</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            批量导入
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <Plus className="h-4 w-4" />
            新增培训
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {STATS.map((stat) => (
          <Card key={stat.label} className="border-slate-200/60">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5 text-white" />
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

      {/* 标签页切换 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="courses" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">
            培训课程
          </TabsTrigger>
          <TabsTrigger value="records" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">
            培训记录
          </TabsTrigger>
          <TabsTrigger value="calendar" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">
            培训日历
          </TabsTrigger>
        </TabsList>

        {/* 培训课程列表 */}
        <TabsContent value="courses" className="mt-6">
          {/* 搜索和筛选 */}
          <Card className="border-slate-200/60 mb-6">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="搜索课程名称、讲师..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 border-slate-200"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px] border-slate-200">
                    <SelectValue placeholder="培训类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="induction">入职培训</SelectItem>
                    <SelectItem value="safety">安全培训</SelectItem>
                    <SelectItem value="skill">技能培训</SelectItem>
                    <SelectItem value="compliance">合规培训</SelectItem>
                    <SelectItem value="professional">专业培训</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] border-slate-200">
                    <SelectValue placeholder="培训状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="upcoming">待开始</SelectItem>
                    <SelectItem value="ongoing">进行中</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 课程列表 */}
          <div className="grid gap-4">
            {filteredTrainings.map((training) => (
              <Card key={training.id} className="border-slate-200/60 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg ${
                          training.method === "online" ? "bg-blue-100" : 
                          training.method === "offline" ? "bg-purple-100" : "bg-amber-100"
                        } flex items-center justify-center`}>
                          {training.method === "online" ? (
                            <Video className="h-5 w-5 text-blue-600" />
                          ) : training.method === "offline" ? (
                            <Users className="h-5 w-5 text-purple-600" />
                          ) : (
                            <BookOpen className="h-5 w-5 text-amber-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{training.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {TRAINING_TYPES[training.type as keyof typeof TRAINING_TYPES]}
                            </Badge>
                            <Badge className={TRAINING_STATUS[training.status as keyof typeof TRAINING_STATUS].color}>
                              {TRAINING_STATUS[training.status as keyof typeof TRAINING_STATUS].label}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Users className="h-4 w-4 text-slate-400" />
                          <span>培训对象: {training.target}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <User className="h-4 w-4 text-slate-400" />
                          <span>讲师: {training.trainer}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>{training.startDate} 至 {training.endDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span>时长: {training.duration}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                        <GraduationCap className="h-4 w-4 text-slate-400" />
                        <span>参与人数: {training.participantCount}/{training.maxParticipants}</span>
                        <div className="flex-1 max-w-[200px] ml-2">
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                              style={{ width: `${(training.participantCount / training.maxParticipants) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-600 hover:text-slate-900"
                        onClick={() => setSelectedTraining(training)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        查看
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-600 hover:text-slate-900"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 培训记录列表 */}
        <TabsContent value="records" className="mt-6">
          {/* 搜索和筛选 */}
          <Card className="border-slate-200/60 mb-6">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="搜索员工姓名、培训课程..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 border-slate-200"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px] border-slate-200">
                    <SelectValue placeholder="培训类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="induction">入职培训</SelectItem>
                    <SelectItem value="safety">安全培训</SelectItem>
                    <SelectItem value="skill">技能培训</SelectItem>
                    <SelectItem value="compliance">合规培训</SelectItem>
                    <SelectItem value="professional">专业培训</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 记录列表 */}
          <Card className="border-slate-200/60">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        员工信息
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        培训课程
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        培训类型
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        成绩
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        完成时间
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        证书编号
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{record.employeeName}</p>
                              <p className="text-xs text-slate-500">{record.employeeId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {record.trainingTitle}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="text-xs">
                            {TRAINING_TYPES[record.trainingType as keyof typeof TRAINING_TYPES]}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={
                            record.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                            record.status === "in_progress" ? "bg-amber-100 text-amber-700" :
                            record.status === "registered" ? "bg-blue-100 text-blue-700" :
                            "bg-slate-100 text-slate-700"
                          }>
                            {record.status === "completed" ? "已完成" :
                             record.status === "in_progress" ? "进行中" :
                             record.status === "registered" ? "已报名" : "待培训"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {record.score ? (
                            <span className={`font-medium ${
                              record.score >= 90 ? "text-emerald-600" :
                              record.score >= 60 ? "text-amber-600" : "text-red-600"
                            }`}>
                              {record.score}分
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {record.completionDate || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {record.certificate ? (
                            <span className="text-amber-600 font-mono text-xs">{record.certificate}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                            查看
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 培训日历 */}
        <TabsContent value="calendar" className="mt-6">
          <Card className="border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-lg">培训日历</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {/* 日历头部 - 星期 */}
                {["周日", "周一", "周二", "周三", "周四", "周五", "周六"].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">
                    {day}
                  </div>
                ))}
                
                {/* 日历内容 - 简化版展示 */}
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i - 0; // 假设本月1号是周日
                  const isCurrentMonth = day >= 0 && day < 31;
                  const currentDay = day + 1;
                  
                  // 查找当天是否有培训
                  const dayTrainings = isCurrentMonth ? MOCK_TRAININGS.filter(t => {
                    const startDay = parseInt(t.startDate.split("-")[2]);
                    return startDay === currentDay;
                  }) : [];

                  return (
                    <div
                      key={i}
                      className={`min-h-[100px] border border-slate-200 rounded-lg p-2 ${
                        isCurrentMonth ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      {isCurrentMonth && (
                        <>
                          <div className="text-sm text-slate-600 mb-1">{currentDay}</div>
                          {dayTrainings.map((training) => (
                            <div
                              key={training.id}
                              className={`text-xs p-1 rounded mb-1 cursor-pointer hover:opacity-80 ${
                                training.type === "safety" ? "bg-red-100 text-red-700" :
                                training.type === "skill" ? "bg-blue-100 text-blue-700" :
                                training.type === "induction" ? "bg-purple-100 text-purple-700" :
                                "bg-amber-100 text-amber-700"
                              }`}
                              title={training.title}
                            >
                              {training.title.length > 8 ? training.title.slice(0, 8) + "..." : training.title}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 图例 */}
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-100"></div>
                  <span className="text-xs text-slate-600">安全培训</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-100"></div>
                  <span className="text-xs text-slate-600">技能培训</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-purple-100"></div>
                  <span className="text-xs text-slate-600">入职培训</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-amber-100"></div>
                  <span className="text-xs text-slate-600">其他培训</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 培训详情弹窗 */}
      <Dialog open={!!selectedTraining} onOpenChange={() => setSelectedTraining(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>培训详情</DialogTitle>
            <DialogDescription>
              查看培训课程的详细信息
            </DialogDescription>
          </DialogHeader>
          {selectedTraining && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg ${
                  selectedTraining.method === "online" ? "bg-blue-100" : 
                  selectedTraining.method === "offline" ? "bg-purple-100" : "bg-amber-100"
                } flex items-center justify-center`}>
                  {selectedTraining.method === "online" ? (
                    <Video className="h-6 w-6 text-blue-600" />
                  ) : selectedTraining.method === "offline" ? (
                    <Users className="h-6 w-6 text-purple-600" />
                  ) : (
                    <BookOpen className="h-6 w-6 text-amber-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">{selectedTraining.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">
                      {TRAINING_TYPES[selectedTraining.type as keyof typeof TRAINING_TYPES]}
                    </Badge>
                    <Badge className={TRAINING_STATUS[selectedTraining.status as keyof typeof TRAINING_STATUS].color}>
                      {TRAINING_STATUS[selectedTraining.status as keyof typeof TRAINING_STATUS].label}
                    </Badge>
                    <Badge variant="outline">
                      {TRAINING_METHODS[selectedTraining.method as keyof typeof TRAINING_METHODS]}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">培训对象:</span>
                    <span className="text-slate-900">{selectedTraining.target}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">讲师:</span>
                    <span className="text-slate-900">{selectedTraining.trainer}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">时间:</span>
                    <span className="text-slate-900">{selectedTraining.startDate} 至 {selectedTraining.endDate}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">时长:</span>
                    <span className="text-slate-900">{selectedTraining.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">参与人数:</span>
                    <span className="text-slate-900">{selectedTraining.participantCount}/{selectedTraining.maxParticipants}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">地点:</span>
                    <span className="text-slate-900">{selectedTraining.location}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <p className="text-sm text-slate-600 mb-2">课程描述:</p>
                <p className="text-sm text-slate-900">{selectedTraining.description}</p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setSelectedTraining(null)}>
                  关闭
                </Button>
                <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                  编辑培训
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
