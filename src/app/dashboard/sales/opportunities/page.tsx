"use client";

import { useState } from "react";
import {
  Target,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 销售阶段
const STAGES = [
  { id: "initial", name: "初步接触", color: "bg-blue-500", count: 12, amount: 96000 },
  { id: "needs", name: "需求确认", color: "bg-purple-500", count: 8, amount: 72000 },
  { id: "proposal", name: "方案报价", color: "bg-amber-500", count: 5, amount: 48000 },
  { id: "negotiate", name: "谈判协商", color: "bg-orange-500", count: 3, amount: 32000 },
  { id: "closing", name: "即将成交", color: "bg-emerald-500", count: 2, amount: 18000 },
];

// 商机数据
const OPPORTUNITIES = [
  {
    id: "O001",
    name: "吉林省宏远贸易-年度服务",
    customer: "吉林省宏远贸易公司",
    stage: "closing",
    amount: 18000,
    probability: 90,
    expectedDate: "2026-01-20",
    owner: "李销售",
    createTime: "2026-01-10",
  },
  {
    id: "O002",
    name: "宇鑫化工-代理记账",
    customer: "松原市宇鑫化工有限公司",
    stage: "negotiate",
    amount: 12000,
    probability: 70,
    expectedDate: "2026-01-25",
    owner: "李销售",
    createTime: "2026-01-08",
  },
  {
    id: "O003",
    name: "华信科技-商标注册",
    customer: "华信科技有限公司",
    stage: "proposal",
    amount: 8000,
    probability: 50,
    expectedDate: "2026-02-01",
    owner: "李销售",
    createTime: "2026-01-05",
  },
  {
    id: "O004",
    name: "创新科技-公司注册",
    customer: "长春市创新科技有限公司",
    stage: "needs",
    amount: 6000,
    probability: 30,
    expectedDate: "2026-02-15",
    owner: "李销售",
    createTime: "2026-01-12",
  },
  {
    id: "O005",
    name: "新起点餐饮-代理记账",
    customer: "四平市新起点餐饮",
    stage: "initial",
    amount: 5000,
    probability: 10,
    expectedDate: "2026-02-28",
    owner: "李销售",
    createTime: "2026-01-14",
  },
];

export default function OpportunitiesPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const getStageBadge = (stage: string) => {
    const stageInfo = STAGES.find(s => s.id === stage);
    return (
      <Badge className={`${stageInfo?.color} text-white`}>
        {stageInfo?.name}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">商机管理</h1>
          <p className="text-slate-500 mt-1">销售漏斗与商机跟进</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === "kanban" ? "bg-white shadow-sm" : "text-slate-500"
              }`}
            >
              看板
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === "list" ? "bg-white shadow-sm" : "text-slate-500"
              }`}
            >
              列表
            </button>
          </div>
          <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500">
            <Plus className="h-4 w-4" />
            新增商机
          </Button>
        </div>
      </div>

      {/* 商机概览 */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-slate-200/60">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">商机总数</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">30</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">预计成交金额</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">¥266,000</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">加权金额</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">¥158,600</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">本月预计成交</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">8笔</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 看板视图 */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-5 gap-4">
          {STAGES.map((stage) => (
            <div key={stage.id} className="space-y-3">
              {/* 阶段标题 */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <span className="font-medium text-slate-900 text-sm">{stage.name}</span>
                </div>
                <span className="text-xs text-slate-500">{stage.count}</span>
              </div>
              
              {/* 阶段金额 */}
              <div className="px-2 py-2 bg-slate-50 rounded-lg text-center">
                <p className="text-xs text-slate-500">¥{(stage.amount / 1000).toFixed(0)}k</p>
              </div>
              
              {/* 商机卡片 */}
              <div className="space-y-2">
                {OPPORTUNITIES.filter(o => o.stage === stage.id).map((opp) => (
                  <Card key={opp.id} className="border-slate-200/60 hover:border-amber-200 cursor-pointer transition-colors">
                    <CardContent className="pt-3 pb-3 px-3">
                      <div className="space-y-2">
                        <p className="font-medium text-slate-900 text-sm line-clamp-1">{opp.name}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{opp.customer}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-600 text-sm">¥{opp.amount.toLocaleString()}</span>
                          <span className="text-xs text-slate-400">{opp.probability}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span className="text-xs text-slate-500">{opp.expectedDate}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* 新增按钮 */}
                <button className="w-full p-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm hover:border-amber-300 hover:text-amber-500 transition-colors">
                  <Plus className="h-4 w-4 mx-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 列表视图 */}
      {viewMode === "list" && (
        <Card className="border-slate-200/60">
          <div className="divide-y divide-slate-100">
            {OPPORTUNITIES.map((opp) => (
              <div
                key={opp.id}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{opp.name}</span>
                      {getStageBadge(opp.stage)}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{opp.customer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right w-24">
                    <p className="text-sm text-slate-500">金额</p>
                    <p className="font-semibold text-emerald-600">¥{opp.amount.toLocaleString()}</p>
                  </div>
                  <div className="text-right w-16">
                    <p className="text-sm text-slate-500">概率</p>
                    <p className="font-medium text-slate-900">{opp.probability}%</p>
                  </div>
                  <div className="text-right w-24">
                    <p className="text-sm text-slate-500">预计成交</p>
                    <p className="text-sm text-slate-700">{opp.expectedDate}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
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
                        编辑商机
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ArrowRight className="h-4 w-4 mr-2" />
                        推进阶段
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
