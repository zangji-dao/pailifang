"use client";

import { useState } from "react";
import {
  Users,
  Phone,
  Mail,
  Building2,
  Calendar,
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  ArrowUpDown,
  RefreshCw,
  Clock,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 公海客户数据
const POOL_CUSTOMERS = [
  {
    id: "P001",
    name: "长春市远东贸易公司",
    contact: "刘总",
    phone: "138****0011",
    industry: "贸易",
    lastFollow: "30天前",
    inPoolDays: 15,
    source: "老客户推荐",
    estimated: 8000,
  },
  {
    id: "P002",
    name: "吉林市盛达建材",
    contact: "陈经理",
    phone: "139****0012",
    industry: "建材",
    lastFollow: "45天前",
    inPoolDays: 28,
    source: "官网咨询",
    estimated: 5000,
  },
  {
    id: "P003",
    name: "四平市鑫源餐饮",
    contact: "周总",
    phone: "137****0013",
    industry: "餐饮",
    lastFollow: "60天前",
    inPoolDays: 45,
    source: "电话咨询",
    estimated: 6000,
  },
  {
    id: "P004",
    name: "通化市宏运物流",
    contact: "吴经理",
    phone: "136****0014",
    industry: "物流",
    lastFollow: "20天前",
    inPoolDays: 12,
    source: "展会",
    estimated: 10000,
  },
  {
    id: "P005",
    name: "白山市新兴科技",
    contact: "赵总",
    phone: "135****0015",
    industry: "科技",
    lastFollow: "90天前",
    inPoolDays: 60,
    source: "微信推广",
    estimated: 15000,
  },
];

// 公海规则
const POOL_RULES = [
  { rule: "未跟进超过30天的客户自动进入公海", status: "生效中" },
  { rule: "销售主动放弃的客户进入公海", status: "生效中" },
  { rule: "每人最多领取5个公海客户", status: "生效中" },
];

export default function CustomerPoolPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">客户公海</h1>
          <p className="text-slate-500 mt-1">公共客户资源池，销售可领取跟进</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            刷新规则
          </Button>
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            分配记录
          </Button>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-slate-200/60">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">公海客户</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">128</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">今日领取</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">12</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">今日退回</p>
                <p className="text-2xl font-bold text-red-600 mt-1">3</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">待认领（&gt;30天）</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">45</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 公海规则提示 */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">公海规则</p>
              <div className="mt-2 space-y-1">
                {POOL_RULES.map((rule, index) => (
                  <p key={index} className="text-sm text-slate-600">
                    • {rule.rule}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 搜索筛选 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="搜索客户..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
          <select className="h-9 px-3 text-sm border border-slate-200 rounded-md">
            <option>全部行业</option>
            <option>贸易</option>
            <option>餐饮</option>
            <option>建材</option>
            <option>科技</option>
            <option>物流</option>
          </select>
          <select className="h-9 px-3 text-sm border border-slate-200 rounded-md">
            <option>入库时间</option>
            <option>最近7天</option>
            <option>最近30天</option>
            <option>30天以上</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowUpDown className="h-4 w-4" />
            排序
          </Button>
          <Button size="sm" className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500">
            <UserPlus className="h-4 w-4" />
            批量领取
          </Button>
        </div>
      </div>

      {/* 客户列表 */}
      <Card className="border-slate-200/60">
        <div className="divide-y divide-slate-100">
          {POOL_CUSTOMERS.map((customer) => (
            <div
              key={customer.id}
              className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-medium">
                  {customer.contact.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{customer.name}</span>
                    <Badge variant="outline" className="text-xs">{customer.industry}</Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                    <span>{customer.contact}</span>
                    <span>{customer.phone}</span>
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {customer.source}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-slate-500">预计金额</p>
                  <p className="font-semibold text-emerald-600">¥{customer.estimated.toLocaleString()}</p>
                </div>
                <div className="text-right w-24">
                  <p className="text-sm text-slate-500">入库{customer.inPoolDays}天</p>
                  <p className="text-xs text-slate-400">上次跟进: {customer.lastFollow}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    查看
                  </Button>
                  <Button size="sm" className="gap-1 bg-amber-500 hover:bg-amber-600">
                    <UserPlus className="h-3.5 w-3.5" />
                    领取
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
