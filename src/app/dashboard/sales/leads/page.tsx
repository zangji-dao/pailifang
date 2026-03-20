"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Phone,
  Mail,
  MessageSquare,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Building2,
  MapPin,
  Calendar,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 线索数据
const LEADS_DATA = [
  {
    id: "L001",
    name: "长春市创新科技有限公司",
    contact: "张总",
    phone: "138****0001",
    source: "官网咨询",
    intention: "high",
    status: "new",
    estimated: 8000,
    createTime: "10分钟前",
    followUp: "待跟进",
  },
  {
    id: "L002",
    name: "吉林市宏达商贸公司",
    contact: "李经理",
    phone: "139****0002",
    source: "老客户推荐",
    intention: "high",
    status: "following",
    estimated: 12000,
    createTime: "1小时前",
    followUp: "今天 15:00",
  },
  {
    id: "L003",
    name: "四平市新起点餐饮",
    contact: "王总",
    phone: "137****0003",
    source: "微信推广",
    intention: "medium",
    status: "following",
    estimated: 5000,
    createTime: "2小时前",
    followUp: "明天 10:00",
  },
  {
    id: "L004",
    name: "通化市瑞丰建材",
    contact: "赵总",
    phone: "136****0004",
    source: "电话咨询",
    intention: "low",
    status: "new",
    estimated: 3000,
    createTime: "昨天",
    followUp: "待跟进",
  },
  {
    id: "L005",
    name: "白山市恒远物流",
    contact: "孙经理",
    phone: "135****0005",
    source: "展会",
    intention: "medium",
    status: "converted",
    estimated: 6000,
    createTime: "昨天",
    followUp: "已转化",
  },
  {
    id: "L006",
    name: "辽源市明达商贸",
    contact: "周总",
    phone: "134****0006",
    source: "BOSS直聘",
    intention: "high",
    status: "following",
    estimated: 9000,
    createTime: "前天",
    followUp: "今天 16:00",
  },
];

// 统计卡片
const STATS = [
  { label: "全部线索", count: 156, color: "text-slate-900", bg: "bg-slate-100" },
  { label: "新线索", count: 42, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "跟进中", count: 89, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "已转化", count: 18, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "已流失", count: 7, color: "text-red-600", bg: "bg-red-50" },
];

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const getIntentionBadge = (intention: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      high: { label: "高意向", variant: "destructive" },
      medium: { label: "中意向", variant: "secondary" },
      low: { label: "低意向", variant: "outline" },
    };
    const c = config[intention] || { label: intention, variant: "secondary" };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      new: { label: "新线索", className: "bg-blue-100 text-blue-700" },
      following: { label: "跟进中", className: "bg-amber-100 text-amber-700" },
      converted: { label: "已转化", className: "bg-emerald-100 text-emerald-700" },
      lost: { label: "已流失", className: "bg-red-100 text-red-700" },
    };
    const c = config[status] || { label: status, className: "bg-slate-100 text-slate-700" };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.className}`}>{c.label}</span>;
  };

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">线索中心</h1>
          <p className="text-slate-500 mt-1">管理和跟进销售线索</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            导入线索
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500">
            <Plus className="h-4 w-4" />
            新增线索
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="flex gap-3">
        {STATS.map((stat) => (
          <button
            key={stat.label}
            onClick={() => setActiveTab(stat.label === "全部线索" ? "all" : stat.label)}
            className={`px-4 py-3 rounded-lg border transition-all ${
              (activeTab === "all" && stat.label === "全部线索") || activeTab === stat.label
                ? "border-amber-300 bg-amber-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${stat.count}`}>{stat.count}</p>
          </button>
        ))}
      </div>

      {/* 搜索筛选 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="搜索线索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
          <select className="h-9 px-3 text-sm border border-slate-200 rounded-md">
            <option>全部来源</option>
            <option>官网咨询</option>
            <option>微信推广</option>
            <option>老客户推荐</option>
            <option>电话咨询</option>
          </select>
          <select className="h-9 px-3 text-sm border border-slate-200 rounded-md">
            <option>意向程度</option>
            <option>高意向</option>
            <option>中意向</option>
            <option>低意向</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowUpDown className="h-4 w-4" />
            排序
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            批量分配
          </Button>
        </div>
      </div>

      {/* 线索列表 */}
      <Card className="border-slate-200/60">
        <div className="divide-y divide-slate-100">
          {LEADS_DATA.map((lead) => (
            <div
              key={lead.id}
              className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-medium">
                  {lead.contact.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{lead.name}</span>
                    {getStatusBadge(lead.status)}
                    {getIntentionBadge(lead.intention)}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                    <span>{lead.contact}</span>
                    <span>{lead.phone}</span>
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {lead.source}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-slate-500">预计金额</p>
                  <p className="font-semibold text-emerald-600">¥{lead.estimated.toLocaleString()}</p>
                </div>
                <div className="text-right w-24">
                  <p className="text-sm text-slate-500">下次跟进</p>
                  <p className="text-sm font-medium text-slate-700">{lead.followUp}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Phone className="h-4 w-4 text-slate-400" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <MessageSquare className="h-4 w-4 text-slate-400" />
                  </Button>
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
                        编辑线索
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <UserPlus className="h-4 w-4 mr-2" />
                        转为客户
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
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
