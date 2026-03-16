"use client";

import { useState } from "react";
import {
  Briefcase,
  Users,
  FileText,
  Calendar,
  TrendingUp,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  UserPlus,
  Building2,
  MapPin,
  DollarSign,
  ChevronRight,
  Phone,
  Mail,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// 招聘统计概览
const RECRUITMENT_STATS = [
  {
    title: "招聘中职位",
    value: 8,
    change: "+2",
    icon: Briefcase,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "待处理简历",
    value: 56,
    change: "+12",
    icon: FileText,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    title: "本周面试",
    value: 15,
    change: "+5",
    icon: Calendar,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    title: "本月入职",
    value: 6,
    change: "+2",
    icon: UserPlus,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
];

// 职位列表
const JOB_POSITIONS = [
  {
    id: 1,
    title: "高级会计",
    department: "记账组",
    location: "长春",
    salary: "8K-12K",
    applicants: 28,
    newResumes: 5,
    interviews: 4,
    status: "active",
    publishDate: "2026-01-10",
    deadline: "2026-02-10",
  },
  {
    id: 2,
    title: "销售经理",
    department: "销售组",
    location: "吉林",
    salary: "6K-10K",
    applicants: 35,
    newResumes: 8,
    interviews: 6,
    status: "active",
    publishDate: "2026-01-08",
    deadline: "2026-02-08",
  },
  {
    id: 3,
    title: "行政助理",
    department: "行政部",
    location: "长春",
    salary: "4K-6K",
    applicants: 42,
    newResumes: 12,
    interviews: 8,
    status: "active",
    publishDate: "2026-01-05",
    deadline: "2026-02-05",
  },
  {
    id: 4,
    title: "工商专员",
    department: "工商组",
    location: "长春",
    salary: "5K-8K",
    applicants: 18,
    newResumes: 0,
    interviews: 2,
    status: "paused",
    publishDate: "2026-01-01",
    deadline: "2026-02-01",
  },
];

// 简历列表
const RESUMES = [
  {
    id: 1,
    name: "张明华",
    position: "高级会计",
    education: "本科 · 吉林财经大学",
    experience: "5年会计经验",
    source: "智联招聘",
    applyDate: "2026-01-15",
    status: "pending",
    matchScore: 92,
  },
  {
    id: 2,
    name: "李晓芳",
    position: "销售经理",
    education: "本科 · 长春理工大学",
    experience: "3年销售经验",
    source: "BOSS直聘",
    applyDate: "2026-01-15",
    status: "interviewing",
    matchScore: 88,
  },
  {
    id: 3,
    name: "王建国",
    position: "行政助理",
    education: "大专 · 吉林工商学院",
    experience: "2年行政经验",
    source: "前程无忧",
    applyDate: "2026-01-14",
    status: "passed",
    matchScore: 85,
  },
  {
    id: 4,
    name: "赵小敏",
    position: "高级会计",
    education: "硕士 · 东北师范大学",
    experience: "7年财务经验",
    source: "猎聘",
    applyDate: "2026-01-14",
    status: "rejected",
    matchScore: 78,
  },
];

// 面试安排
const INTERVIEWS = [
  {
    id: 1,
    candidate: "李晓芳",
    position: "销售经理",
    interviewer: "王经理",
    time: "今天 14:00",
    type: "二面",
    status: "scheduled",
  },
  {
    id: 2,
    candidate: "张明华",
    position: "高级会计",
    interviewer: "李主管",
    time: "今天 15:30",
    type: "初面",
    status: "scheduled",
  },
  {
    id: 3,
    candidate: "陈志强",
    position: "行政助理",
    interviewer: "赵主管",
    time: "明天 10:00",
    type: "初面",
    status: "pending",
  },
];

// 招聘漏斗数据
const FUNNEL_DATA = [
  { stage: "简历投递", count: 156, percentage: 100 },
  { stage: "简历筛选", count: 89, percentage: 57 },
  { stage: "初试", count: 45, percentage: 29 },
  { stage: "复试", count: 18, percentage: 12 },
  { stage: "录用", count: 6, percentage: 4 },
];

// 渠道统计
const CHANNEL_STATS = [
  { channel: "智联招聘", resumes: 48, hired: 2, cost: "¥3,200" },
  { channel: "BOSS直聘", resumes: 42, hired: 2, cost: "¥2,800" },
  { channel: "前程无忧", resumes: 35, hired: 1, cost: "¥2,500" },
  { channel: "猎聘", resumes: 18, hired: 1, cost: "¥4,000" },
  { channel: "内部推荐", resumes: 13, hired: 0, cost: "¥0" },
];

type TabType = "positions" | "resumes" | "interviews" | "analytics";

export default function RecruitmentPage() {
  const [activeTab, setActiveTab] = useState<TabType>("positions");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPositionDialog, setShowPositionDialog] = useState(false);
  const [selectedResume, setSelectedResume] = useState<number | null>(null);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: "招聘中", variant: "default" },
      paused: { label: "已暂停", variant: "secondary" },
      closed: { label: "已关闭", variant: "outline" },
      pending: { label: "待筛选", variant: "secondary" },
      interviewing: { label: "面试中", variant: "default" },
      passed: { label: "已通过", variant: "default" },
      rejected: { label: "已淘汰", variant: "destructive" },
      scheduled: { label: "已安排", variant: "default" },
    };
    const config = statusConfig[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">招聘管理</h1>
          <p className="text-slate-500 mt-1">职位发布、简历管理、面试安排</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            招聘报表
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <Plus className="h-4 w-4" />
            发布职位
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {RECRUITMENT_STATS.map((stat) => (
          <Card key={stat.title} className="border-slate-200/60">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-emerald-600 mt-1">{stat.change} 较上周</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab 导航 */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          {[
            { id: "positions", label: "职位管理", icon: Briefcase },
            { id: "resumes", label: "简历管理", icon: FileText },
            { id: "interviews", label: "面试安排", icon: Calendar },
            { id: "analytics", label: "招聘统计", icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab 内容 */}
      {activeTab === "positions" && (
        <div className="space-y-4">
          {/* 搜索筛选 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="搜索职位..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-9"
                />
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                筛选
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">招聘中: 8</Badge>
              <Badge variant="outline">已暂停: 2</Badge>
            </div>
          </div>

          {/* 职位列表 */}
          <div className="grid gap-4">
            {JOB_POSITIONS.map((job) => (
              <Card key={job.id} className="border-slate-200/60 hover:border-amber-200 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900">{job.title}</h3>
                        {getStatusBadge(job.status)}
                        {job.newResumes > 0 && (
                          <Badge variant="default" className="bg-red-500">
                            {job.newResumes}份新简历
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {job.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          {job.salary}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 mt-4 text-sm">
                        <span className="text-slate-600">
                          投递 <span className="font-semibold text-slate-900">{job.applicants}</span> 人
                        </span>
                        <span className="text-slate-600">
                          待筛选 <span className="font-semibold text-amber-600">{job.newResumes}</span> 份
                        </span>
                        <span className="text-slate-600">
                          面试 <span className="font-semibold text-slate-900">{job.interviews}</span> 人
                        </span>
                        <span className="text-slate-400">
                          发布于 {job.publishDate}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        查看简历
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            编辑职位
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Send className="h-4 w-4 mr-2" />
                            刷新发布
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            关闭职位
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "resumes" && (
        <div className="space-y-4">
          {/* 搜索筛选 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="搜索简历..."
                  className="w-64 pl-9"
                />
              </div>
              <select className="h-9 px-3 text-sm border border-slate-200 rounded-md">
                <option>全部职位</option>
                <option>高级会计</option>
                <option>销售经理</option>
                <option>行政助理</option>
              </select>
              <select className="h-9 px-3 text-sm border border-slate-200 rounded-md">
                <option>全部状态</option>
                <option>待筛选</option>
                <option>面试中</option>
                <option>已通过</option>
                <option>已淘汰</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">导出简历</Button>
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                批量安排面试
              </Button>
            </div>
          </div>

          {/* 简历列表 */}
          <Card className="border-slate-200/60">
            <div className="divide-y divide-slate-100">
              {RESUMES.map((resume) => (
                <div
                  key={resume.id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedResume(resume.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-medium">
                      {resume.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{resume.name}</span>
                        {getStatusBadge(resume.status)}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span>{resume.education}</span>
                        <span>·</span>
                        <span>{resume.experience}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-slate-500">{resume.position}</p>
                      <p className="text-xs text-slate-400">{resume.source} · {resume.applyDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center ${
                        resume.matchScore >= 85 
                          ? "bg-emerald-50 text-emerald-600" 
                          : resume.matchScore >= 70 
                            ? "bg-amber-50 text-amber-600"
                            : "bg-slate-50 text-slate-500"
                      }`}>
                        <span className="text-lg font-bold">{resume.matchScore}</span>
                        <span className="text-[10px]">匹配度</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "interviews" && (
        <div className="grid grid-cols-3 gap-6">
          {/* 今日面试 */}
          <div className="col-span-2">
            <Card className="border-slate-200/60">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">面试日程</CardTitle>
                <Button variant="outline" size="sm" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  日历视图
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {INTERVIEWS.map((interview) => (
                    <div
                      key={interview.id}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        interview.status === "scheduled" 
                          ? "bg-amber-50 border border-amber-100" 
                          : "bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-medium">
                          {interview.candidate.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{interview.candidate}</span>
                            <Badge variant="secondary">{interview.type}</Badge>
                          </div>
                          <p className="text-sm text-slate-500">{interview.position}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium text-slate-900">{interview.time}</p>
                          <p className="text-sm text-slate-500">面试官: {interview.interviewer}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Phone className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 面试提醒 */}
          <div className="space-y-4">
            <Card className="border-slate-200/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">今日概览</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-slate-600">待面试</span>
                    <span className="text-lg font-bold text-blue-600">3场</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <span className="text-sm text-slate-600">已完成</span>
                    <span className="text-lg font-bold text-emerald-600">2场</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <span className="text-sm text-slate-600">待评价</span>
                    <span className="text-lg font-bold text-amber-600">1场</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">本周统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-slate-900">15</p>
                  <p className="text-sm text-slate-500">场面试安排</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
                  <div className="text-center">
                    <p className="text-xl font-bold text-emerald-600">8</p>
                    <p className="text-xs text-slate-500">已通过</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-red-500">3</p>
                    <p className="text-xs text-slate-500">未通过</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="grid grid-cols-2 gap-6">
          {/* 招聘漏斗 */}
          <Card className="border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-lg">招聘漏斗</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {FUNNEL_DATA.map((item, index) => (
                  <div key={item.stage}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">{item.stage}</span>
                      <span className="text-sm font-medium text-slate-900">
                        {item.count}人
                        <span className="text-slate-400 ml-2">{item.percentage}%</span>
                      </span>
                    </div>
                    <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                      <div
                        className={`h-full rounded-lg transition-all ${
                          index === 0 
                            ? "bg-blue-400" 
                            : index === 4 
                              ? "bg-emerald-500"
                              : "bg-amber-400"
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">整体转化率</p>
                    <p className="text-xl font-bold text-slate-900">3.8%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">平均招聘周期</p>
                    <p className="text-xl font-bold text-slate-900">18天</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">人均招聘成本</p>
                    <p className="text-xl font-bold text-slate-900">¥2,080</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 渠道效果 */}
          <Card className="border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-lg">渠道效果分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {CHANNEL_STATS.map((channel) => (
                  <div
                    key={channel.channel}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                        {channel.channel.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-900">{channel.channel}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-slate-500">简历数</p>
                        <p className="font-semibold text-slate-900">{channel.resumes}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-500">录用</p>
                        <p className="font-semibold text-emerald-600">{channel.hired}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-500">花费</p>
                        <p className="font-semibold text-slate-900">{channel.cost}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">最佳渠道</span>
                  <span className="font-medium text-emerald-600">BOSS直聘 · 转化率4.8%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 月度招聘趋势 */}
          <Card className="col-span-2 border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-lg">月度招聘趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-4">
                {["8月", "9月", "10月", "11月", "12月", "1月"].map((month, index) => {
                  const resumes = [42, 56, 38, 65, 48, 56][index];
                  const hired = [3, 4, 2, 5, 3, 6][index];
                  const maxResumes = 65;
                  
                  return (
                    <div key={month} className="text-center">
                      <p className="text-sm text-slate-500 mb-2">{month}</p>
                      <div className="h-32 bg-slate-100 rounded-lg flex flex-col justify-end p-2">
                        <div
                          className="bg-gradient-to-t from-blue-500 to-blue-400 rounded transition-all"
                          style={{ height: `${(resumes / maxResumes) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm font-medium text-slate-900 mt-2">{resumes}</p>
                      <p className="text-xs text-emerald-600">录用{hired}人</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
