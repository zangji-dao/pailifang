"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Building2,
  Users,
  Calendar,
  MapPin,
  MoreHorizontal,
  Eye,
  Edit,
  UserPlus,
  Briefcase,
  CheckCircle,
  Clock,
  Pause,
  XCircle,
} from "lucide-react";

// 项目状态
const PROJECT_STATUS = {
  preparing: { label: "筹备中", color: "bg-blue-100 text-blue-700", icon: Clock },
  active: { label: "进行中", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  paused: { label: "已暂停", color: "bg-amber-100 text-amber-700", icon: Pause },
  completed: { label: "已完成", color: "bg-slate-100 text-slate-700", icon: CheckCircle },
  cancelled: { label: "已取消", color: "bg-red-100 text-red-700", icon: XCircle },
};

// 模拟项目数据
const MOCK_PROJECTS = [
  {
    id: "1",
    name: "阿里巴巴客服项目",
    company: "阿里巴巴集团",
    address: "杭州市余杭区",
    manager: "王经理",
    startDate: "2023-01-01",
    endDate: "2024-12-31",
    status: "active",
    requiredCount: 50,
    currentCount: 42,
    positions: [
      { name: "客服专员", required: 30, current: 25 },
      { name: "客服主管", required: 5, current: 4 },
      { name: "质检专员", required: 10, current: 8 },
      { name: "培训专员", required: 5, current: 5 },
    ],
  },
  {
    id: "2",
    name: "京东仓储项目",
    company: "京东物流",
    address: "上海市嘉定区",
    manager: "李经理",
    startDate: "2023-03-01",
    endDate: "2024-06-30",
    status: "active",
    requiredCount: 100,
    currentCount: 95,
    positions: [
      { name: "仓储管理员", required: 60, current: 58 },
      { name: "分拣员", required: 30, current: 28 },
      { name: "叉车司机", required: 10, current: 9 },
    ],
  },
  {
    id: "3",
    name: "美团配送项目",
    company: "美团外卖",
    address: "北京市朝阳区",
    manager: "张经理",
    startDate: "2024-01-01",
    endDate: null,
    status: "active",
    requiredCount: 200,
    currentCount: 180,
    positions: [
      { name: "配送员", required: 180, current: 165 },
      { name: "站点管理", required: 15, current: 12 },
      { name: "客服支持", required: 5, current: 3 },
    ],
  },
  {
    id: "4",
    name: "网易游戏测试项目",
    company: "网易游戏",
    address: "广州市天河区",
    manager: "陈经理",
    startDate: "2024-02-01",
    endDate: "2024-08-31",
    status: "preparing",
    requiredCount: 20,
    currentCount: 5,
    positions: [
      { name: "游戏测试员", required: 15, current: 3 },
      { name: "测试组长", required: 5, current: 2 },
    ],
  },
  {
    id: "5",
    name: "顺丰快递项目",
    company: "顺丰速运",
    address: "深圳市南山区",
    manager: "刘经理",
    startDate: "2022-06-01",
    endDate: "2023-12-31",
    status: "completed",
    requiredCount: 80,
    currentCount: 0,
    positions: [],
  },
];

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredProjects = MOCK_PROJECTS.filter((project) => {
    const matchesSearch = project.name.includes(searchQuery) || project.company.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 统计数据
  const stats = {
    total: MOCK_PROJECTS.length,
    active: MOCK_PROJECTS.filter((p) => p.status === "active").length,
    preparing: MOCK_PROJECTS.filter((p) => p.status === "preparing").length,
    totalPeople: MOCK_PROJECTS.reduce((sum, p) => sum + p.currentCount, 0),
  };

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">项目管理</h1>
          <p className="text-sm text-slate-500 mt-1">管理派遣项目及人员分配</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <Plus className="h-4 w-4" />
            新增项目
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-500">项目总数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
                <p className="text-xs text-slate-500">进行中</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.preparing}</p>
                <p className="text-xs text-slate-500">筹备中</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalPeople}</p>
                <p className="text-xs text-slate-500">在岗人数</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card className="border-slate-200/60">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="搜索项目名称、用工单位..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="项目状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="preparing">筹备中</SelectItem>
                <SelectItem value="active">进行中</SelectItem>
                <SelectItem value="paused">已暂停</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 项目列表 */}
      <div className="grid gap-4">
        {filteredProjects.map((project) => {
          const statusConfig = PROJECT_STATUS[project.status as keyof typeof PROJECT_STATUS];
          const progress = Math.round((project.currentCount / project.requiredCount) * 100);

          return (
            <Card key={project.id} className="border-slate-200/60 hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{project.name}</h3>
                      <Badge className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {project.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {project.address}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1">
                      <UserPlus className="h-3.5 w-3.5" />
                      分配人员
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* 人员进度 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">人员配置</span>
                    <span className="text-sm font-medium text-slate-900">
                      {project.currentCount} / {project.requiredCount} 人
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* 岗位分布 */}
                {project.positions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {project.positions.map((position) => (
                      <div
                        key={position.name}
                        className={`px-3 py-1.5 rounded-lg text-sm ${
                          position.current < position.required
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-50 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {position.name}: {position.current}/{position.required}
                        {position.current < position.required && (
                          <span className="ml-1 text-xs">缺{position.required - position.current}人</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 底部信息 */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {project.startDate} ~ {project.endDate || "长期"}
                  </span>
                  <span>负责人: {project.manager}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
