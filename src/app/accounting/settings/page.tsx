"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Settings,
  Calculator,
  Users,
  Building2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  FileText,
  DollarSign,
  Receipt,
  Wallet,
  Package,
  RotateCcw,
  BarChart3,
  FileSpreadsheet,
  LayoutDashboard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 左侧导航菜单
const navMenus = [
  { name: "首页", icon: LayoutDashboard, href: "/accounting" },
  { name: "凭证", icon: FileText, href: "/accounting/vouchers", badge: "3" },
  { name: "资金", icon: DollarSign, href: "/accounting/funds" },
  { name: "发票", icon: Receipt, href: "/accounting/invoices" },
  { name: "工资", icon: Wallet, href: "/accounting/payroll" },
  { name: "资产", icon: Package, href: "/accounting/assets" },
  { name: "期末结转", icon: RotateCcw, href: "/accounting/period-end" },
  { name: "账簿", icon: BookOpen, href: "/accounting/account-books" },
  { name: "报表", icon: BarChart3, href: "/accounting/reports" },
  { name: "一键报税", icon: FileSpreadsheet, href: "/accounting/tax-filing" },
  { name: "设置", icon: Settings, active: true, href: "/accounting/settings" },
];

// 设置菜单
const settingsMenus = [
  {
    id: "subjects",
    name: "会计科目",
    icon: Calculator,
    description: "管理会计科目体系，支持多会计准则",
    href: "/dashboard/ledgers/ledger-001/settings/subjects",
  },
  {
    id: "auxiliary",
    name: "辅助核算",
    icon: Users,
    description: "设置客户、供应商、项目等辅助核算项",
    href: "/accounting/settings/auxiliary",
  },
  {
    id: "company",
    name: "企业信息",
    icon: Building2,
    description: "查看和修改企业基本信息、纳税人类型",
    href: "/accounting/settings/company",
  },
];

// 模拟科目数据
const mockSubjects = [
  { code: "1001", name: "库存现金", direction: "借", category: "资产类" },
  { code: "1002", name: "银行存款", direction: "借", category: "资产类" },
  { code: "1012", name: "其他货币资金", direction: "借", category: "资产类" },
  { code: "1101", name: "交易性金融资产", direction: "借", category: "资产类" },
  { code: "1121", name: "应收票据", direction: "借", category: "资产类" },
  { code: "1122", name: "应收账款", direction: "借", category: "资产类" },
  { code: "2201", name: "应付票据", direction: "贷", category: "负债类" },
  { code: "2202", name: "应付账款", direction: "贷", category: "负债类" },
  { code: "2221", name: "应交税费", direction: "贷", category: "负债类" },
  { code: "4001", name: "实收资本", direction: "贷", category: "所有者权益类" },
  { code: "4101", name: "盈余公积", direction: "贷", category: "所有者权益类" },
  { code: "6001", name: "主营业务收入", direction: "贷", category: "损益类" },
];

export default function AccountingSettingsPage() {
  const [activeTab, setActiveTab] = useState("subjects");

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      {/* 左侧导航栏 */}
      <aside className="w-56 bg-white/60 backdrop-blur-xl border-r border-slate-200/60 flex flex-col flex-shrink-0 relative">
        {/* 左侧装饰条 */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 via-amber-500 to-orange-500"></div>
        
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-slate-200/60">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900">云财务</h1>
              <p className="text-[10px] text-slate-400 leading-none">智能记账系统</p>
            </div>
          </div>
        </div>

        {/* 导航菜单 */}
        <ScrollArea className="flex-1">
          <nav className="p-3 pt-4">
            <div className="mb-2 px-3">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">功能导航</span>
            </div>
            <ul className="space-y-0.5">
              {navMenus.map((menu) => (
                <li key={menu.name}>
                  <Link
                    href={menu.href}
                    className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all duration-200 group ${
                      menu.active
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <menu.icon className={`h-4 w-4 ${menu.active ? "text-white" : "text-slate-400 group-hover:text-amber-500"}`} />
                    <span className="flex-1 font-medium">{menu.name}</span>
                    {menu.badge && (
                      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                        menu.active 
                          ? "bg-white/20 text-white" 
                          : "bg-amber-100 text-amber-600"
                      }`}>
                        {menu.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </ScrollArea>

        {/* 底部升级提示 */}
        <div className="p-3">
          <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-700">专业版</span>
            </div>
            <p className="text-[10px] text-amber-600/70">解锁全部高级功能</p>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部信息栏 */}
        <header className="h-14 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/accounting" 
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              返回工作台
            </Link>
            <div className="w-px h-4 bg-slate-200"></div>
            <span className="font-medium text-slate-900">松原市宇鑫化工有限公司</span>
            <Badge variant="outline" className="text-amber-600 border-amber-200">
              2026年01月
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索凭证、科目..."
                className="w-64 h-8 pl-9 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-medium">
                张
              </div>
              <span className="text-sm font-medium text-slate-700">张会计</span>
            </div>
          </div>
        </header>

        {/* 内容区 */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">设置</h1>

            {/* 设置入口卡片 */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {settingsMenus.map((menu) => (
                <Link key={menu.id} href={menu.href}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer border-slate-200/60">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                          <menu.icon className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 mb-1">{menu.name}</h3>
                          <p className="text-sm text-slate-500">{menu.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* 科目预览 */}
            <Card className="border-slate-200/60">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">会计科目预览</CardTitle>
                  <Link href="/dashboard/ledgers/ledger-001/settings/subjects">
                    <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50">
                      管理科目
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">科目编码</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">科目名称</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">余额方向</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">科目类别</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mockSubjects.map((subject) => (
                        <tr key={subject.code} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-sm font-mono text-slate-600">{subject.code}</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{subject.name}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              subject.direction === "借" 
                                ? "bg-blue-100 text-blue-700" 
                                : "bg-red-100 text-red-700"
                            }`}>
                              {subject.direction}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">{subject.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
