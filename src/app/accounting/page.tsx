"use client";

import { useState, ReactNode, useCallback } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  DollarSign,
  Receipt,
  Wallet,
  Package,
  RotateCcw,
  BookOpen,
  BarChart3,
  FileSpreadsheet,
  Settings,
  Plus,
  TrendingUp,
  TrendingDown,
  Building2,
  Target,
  Clock,
  Search,
  Bell,
  ChevronRight,
  X,
  Calculator,
  Users,
  Import,
  Eye,
  Database,
  History,
  Link2,
  Repeat,
  Shield,
  PanelLeftClose,
  PanelLeft,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LedgerList } from "@/components/ledgers/LedgerList";
import {
  BrowserTabsProvider,
  BrowserTabsBar,
  BrowserTab,
  useBrowserTabs,
} from "@/components/browser-tabs";
// 导入科目模块组件
import { SubjectsListPage } from "./subjects";
// 导入辅助核算模块组件
import { AuxiliarySettingsPage } from "./auxiliary";
// 导入币别设置模块组件
import { CurrencySettingsPage } from "./currency";
// 导入期初余额模块组件
import { OpeningBalancePage } from "./opening";
// 导入官方会计准则科目数据
import {
  AccountingStandard,
  ACCOUNTING_STANDARDS,
  getSubjectsByStandard,
  SubjectCategory,
  Subject,
} from "@/data/accounting-subjects";

// 主菜单配置
const mainMenuConfig = [
  { id: "home", name: "首页", icon: LayoutDashboard, key: "home" },
  { id: "voucher", name: "凭证", icon: FileText, key: "voucher", badge: "3" },
  { id: "fund", name: "资金", icon: DollarSign, key: "fund" },
  { id: "invoice", name: "发票", icon: Receipt, key: "invoice" },
  { id: "salary", name: "工资", icon: Wallet, key: "salary" },
  { id: "asset", name: "资产", icon: Package, key: "asset" },
  { id: "period-end", name: "期末结转", icon: RotateCcw, key: "periodEnd" },
  { id: "ledger-book", name: "账簿", icon: BookOpen, key: "ledgerBook" },
  { id: "reports", name: "报表", icon: BarChart3, key: "reports" },
  { id: "tax", name: "一键报税", icon: FileSpreadsheet, key: "tax" },
];

// 设置面板菜单配置
const settingsPanelConfig = [
  { category: "账套" },
  { id: "import", name: "导入免费版账套", icon: Import, key: "importData" },
  { divider: true },
  { id: "my-ledgers", name: "我的账套", icon: Building2, key: "myLedgers" },
  { id: "subjects", name: "科目", icon: Calculator, key: "subjects" },
  { id: "auxiliary", name: "辅助核算", icon: Users, key: "auxiliary" },
  { id: "currency", name: "币别", icon: DollarSign, key: "currency" },
  { id: "opening", name: "期初", icon: BookOpen, key: "opening" },
  { id: "voucher-word", name: "凭证字", icon: FileText, key: "voucherWord" },
  { id: "voucher-template", name: "凭证模板", icon: FileSpreadsheet, key: "voucherTemplate" },
  { id: "permissions", name: "权限设置", icon: Shield, key: "permissions" },
  { divider: true },
  { id: "boss-view", name: "老板看账", icon: Eye, key: "bossView" },
  { id: "backup", name: "备份恢复", icon: Database, key: "backup" },
  { id: "logs", name: "操作日志", icon: History, key: "logs" },
  { id: "link-invoice", name: "关联云发票", icon: Link2, key: "linkInvoice" },
  { id: "link-inventory", name: "关联进销存", icon: Package, key: "linkInventory" },
  { id: "old-import", name: "旧账导入", icon: Import, key: "oldImport" },
  { id: "reinit", name: "重新初始化", icon: Repeat, key: "reinit" },
];

// 财务概览数据
const financialOverview = [
  { label: "资产总额", value: 243500, change: 15.2, trend: "up", icon: Building2 },
  { label: "负债总额", value: 247700, change: 8.7, trend: "up", icon: Wallet },
  { label: "所有者权益", value: -4200, change: 13.3, trend: "down", icon: Target },
  { label: "本期利润", value: -4200, change: 13.3, trend: "down", icon: TrendingUp },
];

// 快捷功能
const quickActions = [
  { name: "新增凭证", icon: Plus, primary: true },
  { name: "查看凭证", icon: FileText },
  { name: "科目余额表", icon: BookOpen },
  { name: "资产负债表", icon: BarChart3 },
  { name: "利润表", icon: FileSpreadsheet },
  { name: "更多功能", icon: Target },
];

// 待办事项
const todoItems = [
  { id: 1, type: "凭证审核", content: "2026年1月尚有3张凭证未审核", priority: "high", time: "今天" },
  { id: 2, type: "期末结转", content: "2026年1月期末结转未完成", priority: "medium", time: "3天内" },
  { id: 3, type: "财务报表", content: "2025年度财务报表待生成", priority: "low", time: "本周" },
  { id: 4, type: "纳税申报", content: "增值税申报表待提交", priority: "high", time: "明天" },
];

// 最近凭证
const recentVouchers = [
  { id: "记-001", date: "01-15", summary: "收到客户货款", debit: 35700, credit: 0, status: "已审核" },
  { id: "记-002", date: "01-14", summary: "支付办公费用", debit: 0, credit: 3600, status: "已审核" },
  { id: "记-003", date: "01-13", summary: "计提本月工资", debit: 0, credit: 15000, status: "待审核" },
  { id: "记-004", date: "01-12", summary: "收到投资款", debit: 100000, credit: 0, status: "待审核" },
];

// ========== 页面内容组件 ==========

// 首页内容
function HomePageContent() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* 快捷操作 */}
      <div className="flex items-center gap-3">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            className={cn(
              "h-9",
              action.primary
                ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            )}
          >
            <action.icon className="h-4 w-4 mr-1.5" />
            {action.name}
          </Button>
        ))}
      </div>

      {/* 数据概览 */}
      <div className="grid grid-cols-4 gap-4">
        {financialOverview.map((item, index) => (
          <Card key={index} className="border-slate-200/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    ¥{item.value.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {item.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 text-red-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-green-500" />
                    )}
                    <span className={item.trend === "up" ? "text-xs text-red-500" : "text-xs text-green-500"}>
                      {item.change}%
                    </span>
                    <span className="text-xs text-slate-400">较上月</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 待办事项和最近凭证 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 待办事项 */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-base">待办事项</CardTitle>
              </div>
              <Badge className="bg-amber-100 text-amber-700">4项待处理</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {todoItems.map((todo) => (
              <div
                key={todo.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg",
                  todo.priority === "high"
                    ? "bg-red-50 border border-red-100"
                    : todo.priority === "medium"
                    ? "bg-amber-50 border border-amber-100"
                    : "bg-blue-50 border border-blue-100"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    todo.priority === "high"
                      ? "bg-red-100"
                      : todo.priority === "medium"
                      ? "bg-amber-100"
                      : "bg-blue-100"
                  )}
                >
                  <Clock
                    className={cn(
                      "h-4 w-4",
                      todo.priority === "high"
                        ? "text-red-500"
                        : todo.priority === "medium"
                        ? "text-amber-500"
                        : "text-blue-500"
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900 text-sm">{todo.type}</p>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        todo.priority === "high"
                          ? "text-red-500"
                          : todo.priority === "medium"
                          ? "text-amber-500"
                          : "text-blue-500"
                      )}
                    >
                      {todo.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{todo.content}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 最近凭证 */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-base">最近凭证</CardTitle>
              </div>
              <Button variant="link" className="text-amber-600 text-sm p-0 h-auto">
                查看全部
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-xs font-medium text-slate-500">凭证号</th>
                  <th className="text-left py-2 text-xs font-medium text-slate-500">摘要</th>
                  <th className="text-right py-2 text-xs font-medium text-slate-500">金额</th>
                  <th className="text-right py-2 text-xs font-medium text-slate-500">状态</th>
                </tr>
              </thead>
              <tbody>
                {recentVouchers.map((voucher) => (
                  <tr key={voucher.id} className="border-b border-slate-50">
                    <td className="py-2.5 text-sm font-medium text-slate-900">{voucher.id}</td>
                    <td className="py-2.5 text-sm text-slate-600">{voucher.summary}</td>
                    <td className="py-2.5 text-sm text-right font-mono text-slate-900">
                      ¥{(voucher.debit || voucher.credit).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          voucher.status === "已审核"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        )}
                      >
                        {voucher.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 我的账套页面内容 - 使用公共组件
function MyLedgersPageContent() {
  return <LedgerList />;
}

// 占位页面内容
function PlaceholderPageContent({ title }: { title: string }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">{title}</h2>
        <p className="text-slate-500">页面开发中...</p>
      </div>
    </div>
  );
}

// 根据页面 key 获取页面配置
function getPageConfig(key: string): { label: string; icon: ReactNode; content: ReactNode } | null {
  const configs: Record<string, { label: string; icon: ReactNode; content: ReactNode }> = {
    home: {
      label: "首页",
      icon: <LayoutDashboard className="h-3.5 w-3.5" />,
      content: <HomePageContent />,
    },
    voucher: {
      label: "凭证",
      icon: <FileText className="h-3.5 w-3.5" />,
      content: <PlaceholderPageContent title="凭证管理" />,
    },
    fund: {
      label: "资金",
      icon: <DollarSign className="h-3.5 w-3.5" />,
      content: <PlaceholderPageContent title="资金管理" />,
    },
    invoice: {
      label: "发票",
      icon: <Receipt className="h-3.5 w-3.5" />,
      content: <PlaceholderPageContent title="发票管理" />,
    },
    salary: {
      label: "工资",
      icon: <Wallet className="h-3.5 w-3.5" />,
      content: <PlaceholderPageContent title="工资管理" />,
    },
    asset: {
      label: "资产",
      icon: <Package className="h-3.5 w-3.5" />,
      content: <PlaceholderPageContent title="资产管理" />,
    },
    periodEnd: {
      label: "期末结转",
      icon: <RotateCcw className="h-3.5 w-3.5" />,
      content: <PlaceholderPageContent title="期末结转" />,
    },
    ledgerBook: {
      label: "账簿",
      icon: <BookOpen className="h-3.5 w-3.5" />,
      content: <PlaceholderPageContent title="账簿查询" />,
    },
    reports: {
      label: "报表",
      icon: <BarChart3 className="h-3.5 w-3.5" />,
      content: <PlaceholderPageContent title="财务报表" />,
    },
    tax: {
      label: "一键报税",
      icon: <FileSpreadsheet className="h-3.5 w-3.5" />,
      content: <PlaceholderPageContent title="一键报税" />,
    },
    myLedgers: {
      label: "我的账套",
      icon: <Building2 className="h-3.5 w-3.5" />,
      content: <MyLedgersPageContent />,
    },
    subjects: {
      label: "科目设置",
      icon: <Calculator className="h-3.5 w-3.5" />,
      content: <SubjectsListPage />,
    },
    opening: {
      label: "期初余额",
      icon: <BookOpen className="h-3.5 w-3.5" />,
      content: <OpeningBalancePage />,
    },
    currency: {
      label: "币别设置",
      icon: <DollarSign className="h-3.5 w-3.5" />,
      content: <CurrencySettingsPage />,
    },
    voucherWord: {
      label: "凭证字",
      icon: <FileText className="h-3.5 w-3.5" />,
      content: <PlaceholderPageContent title="凭证字设置" />,
    },
    auxiliary: {
      label: "辅助核算",
      icon: <Users className="h-3.5 w-3.5" />,
      content: <AuxiliarySettingsPage />,
    },
    voucherTemplate: {
      label: "凭证模板",
      icon: <FileSpreadsheet className="h-3.5 w-3.5" />,
      content: <PlaceholderPageContent title="凭证模板" />,
    },
    permissions: {
      label: "权限设置",
      icon: <Shield className="h-3.5 w-3.5" />,
      content: <PlaceholderPageContent title="权限设置" />,
    },
    bossView: {
      label: "老板看账",
      icon: <Eye className="h-3.5 w-3.5" />,
      content: <PlaceholderPageContent title="老板看账" />,
    },
    backup: {
      label: "备份恢复",
      icon: <Database className="h-3.5 w-3.5" />,
      content: <PlaceholderPageContent title="备份恢复" />,
    },
    logs: {
      label: "操作日志",
      icon: <History className="h-3.5 w-3.5" />,
      content: <PlaceholderPageContent title="操作日志" />,
    },
  };

  return configs[key] || null;
}

// ========== 侧边栏组件 ==========

interface SidebarProps {
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  showSettingsPanel: boolean;
  setShowSettingsPanel: (show: boolean) => void;
  activeMenuId: string;
  onMenuClick: (key: string, label: string) => void;
  settingsPanelLeft: string;
}

function Sidebar({
  sidebarExpanded,
  setSidebarExpanded,
  showSettingsPanel,
  setShowSettingsPanel,
  activeMenuId,
  onMenuClick,
  settingsPanelLeft,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "bg-slate-800 flex flex-col shrink-0 relative transition-all duration-300 ease-in-out",
        sidebarExpanded ? "w-56" : "w-14"
      )}
    >
      {/* Logo 区域 */}
      <div className="h-12 flex items-center justify-between px-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <div
            className={cn(
              "transition-all duration-300 whitespace-nowrap",
              sidebarExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
            )}
          >
            <h1 className="text-base font-semibold text-white">云财务</h1>
            <p className="text-[10px] text-slate-400 leading-none">智能记账系统</p>
          </div>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
        <ul className={cn("flex flex-col", sidebarExpanded ? "px-2 space-y-0.5" : "items-center space-y-1")}>
          {mainMenuConfig.map((menu) => {
            const isActive = activeMenuId === menu.key;
            const MenuItem = (
              <button
                key={menu.id}
                onClick={() => onMenuClick(menu.key, menu.name)}
                className={cn(
                  "flex items-center rounded-lg transition-all relative group w-full",
                  sidebarExpanded ? "gap-3 px-3 h-10" : "w-10 h-10 justify-center",
                  isActive ? "bg-amber-500 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                )}
              >
                <menu.icon className="h-4 w-4 shrink-0" />
                <span
                  className={cn(
                    "text-sm font-medium whitespace-nowrap transition-all",
                    sidebarExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                  )}
                >
                  {menu.name}
                </span>
                {menu.badge && (
                  <span
                    className={cn(
                      "min-w-4 h-4 px-1 text-[10px] font-medium bg-red-500 text-white rounded-full flex items-center justify-center",
                      sidebarExpanded ? "ml-auto" : "absolute -top-0.5 -right-0.5"
                    )}
                  >
                    {menu.badge}
                  </span>
                )}
              </button>
            );

            if (!sidebarExpanded) {
              return (
                <li key={menu.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>{MenuItem}</TooltipTrigger>
                    <TooltipContent side="right" className="bg-slate-700 text-white border-slate-600">
                      {menu.name}
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            }

            return <li key={menu.id}>{MenuItem}</li>;
          })}

          {/* 设置按钮 */}
          <li className={cn(!sidebarExpanded && "flex justify-center")}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                  className={cn(
                    "flex items-center rounded-lg transition-all relative group w-full",
                    sidebarExpanded ? "gap-3 px-3 h-10" : "w-10 h-10 justify-center",
                    showSettingsPanel ? "bg-amber-500 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  )}
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  <span
                    className={cn(
                      "text-sm font-medium whitespace-nowrap transition-all",
                      sidebarExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                    )}
                  >
                    设置
                  </span>
                  {sidebarExpanded && showSettingsPanel && (
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  )}
                </button>
              </TooltipTrigger>
              {!sidebarExpanded && (
                <TooltipContent side="right" className="bg-slate-700 text-white border-slate-600">
                  设置
                </TooltipContent>
              )}
            </Tooltip>
          </li>
        </ul>
      </nav>

      {/* 底部区域 */}
      <div className="p-2 border-t border-slate-700/50">
        {/* 展开/收缩按钮 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                setSidebarExpanded(!sidebarExpanded);
                if (sidebarExpanded) setShowSettingsPanel(false);
              }}
              className={cn(
                "flex items-center rounded-lg transition-colors w-full",
                sidebarExpanded ? "px-3 h-10 gap-2" : "h-10 justify-center"
              )}
            >
              {sidebarExpanded ? (
                <>
                  <PanelLeftClose className="h-4 w-4 shrink-0" />
                  <span className="text-sm text-slate-400">收起侧边栏</span>
                </>
              ) : (
                <PanelLeft className="h-4 w-4 text-slate-400" />
              )}
            </button>
          </TooltipTrigger>
          {!sidebarExpanded && (
            <TooltipContent side="right" className="bg-slate-700 text-white border-slate-600">
              展开侧边栏
            </TooltipContent>
          )}
        </Tooltip>

        {/* 返回工作台 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/dashboard"
              className={cn(
                "mt-2 rounded-lg flex items-center transition-all w-full",
                sidebarExpanded
                  ? "px-3 h-10 gap-2 bg-gradient-to-r from-amber-500 to-orange-500"
                  : "h-10 justify-center bg-amber-500"
              )}
            >
              <ArrowLeft className="h-4 w-4 text-white shrink-0" />
              <span
                className={cn(
                  "text-sm text-white font-medium whitespace-nowrap transition-all",
                  sidebarExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                )}
              >
                返回工作台
              </span>
            </Link>
          </TooltipTrigger>
          {!sidebarExpanded && (
            <TooltipContent side="right" className="bg-slate-700 text-white border-slate-600">
              返回工作台
            </TooltipContent>
          )}
        </Tooltip>
      </div>

      {/* 设置面板遮罩层 */}
      {showSettingsPanel && (
        <div
          className="fixed inset-0 z-[100] bg-black/10 backdrop-blur-[2px]"
          onClick={() => setShowSettingsPanel(false)}
        />
      )}

      {/* 设置面板 */}
      <div
        className={cn(
          "absolute top-0 bottom-0 w-48 bg-white border-r border-slate-200 flex flex-col z-[110] transition-all duration-300 ease-in-out",
          settingsPanelLeft,
          showSettingsPanel ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none"
        )}
      >
        <div className="h-12 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
          <span className="text-sm font-medium text-slate-700">设置</span>
          <button
            onClick={() => setShowSettingsPanel(false)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {settingsPanelConfig.map((item, index) => {
            if (item.category) {
              return (
                <div key={`category-${index}`} className="px-4 py-2">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>
              );
            }
            if (item.divider) {
              return <div key={`divider-${index}`} className="my-2 border-t border-slate-100" />;
            }
            if (!item.key) return null;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onMenuClick(item.key!, item.name);
                  setShowSettingsPanel(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left",
                  activeMenuId === item.key
                    ? "bg-amber-50 text-amber-600 font-medium border-r-2 border-amber-500"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {item.icon && <item.icon className={cn("h-4 w-4", activeMenuId === item.key ? "text-amber-500" : "text-slate-400")} />}
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

// ========== 主页面组件 ==========

export default function AccountingHomePage() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [currentPeriod] = useState("2026年01月");
  const [selectedCompany] = useState("松原市宇鑫化工有限公司");

  const sidebarWidth = sidebarExpanded ? "w-56" : "w-14";
  const settingsPanelLeft = sidebarExpanded ? "left-56" : "left-14";

  // 默认标签页
  const defaultTabs: BrowserTab[] = [
    {
      id: "home",
      label: "首页",
      icon: <LayoutDashboard className="h-3.5 w-3.5" />,
      closable: false,
      content: <HomePageContent />,
    },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <BrowserTabsProvider defaultTabs={defaultTabs} defaultActiveId="home">
        <AccountingLayout
          sidebarExpanded={sidebarExpanded}
          setSidebarExpanded={setSidebarExpanded}
          showSettingsPanel={showSettingsPanel}
          setShowSettingsPanel={setShowSettingsPanel}
          currentPeriod={currentPeriod}
          selectedCompany={selectedCompany}
          sidebarWidth={sidebarWidth}
          settingsPanelLeft={settingsPanelLeft}
        />
      </BrowserTabsProvider>
    </TooltipProvider>
  );
}

// 布局组件
interface AccountingLayoutProps {
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  showSettingsPanel: boolean;
  setShowSettingsPanel: (show: boolean) => void;
  currentPeriod: string;
  selectedCompany: string;
  sidebarWidth: string;
  settingsPanelLeft: string;
}

function AccountingLayout({
  sidebarExpanded,
  setSidebarExpanded,
  showSettingsPanel,
  setShowSettingsPanel,
  currentPeriod,
  selectedCompany,
  sidebarWidth,
  settingsPanelLeft,
}: AccountingLayoutProps) {
  const { tabs, activeTabId, openTab } = useBrowserTabs()!;

  // 处理菜单点击
  const handleMenuClick = useCallback(
    (key: string, label: string) => {
      const pageConfig = getPageConfig(key);
      if (!pageConfig) return;

      openTab({
        id: key,
        label: pageConfig.label,
        icon: pageConfig.icon,
        content: pageConfig.content,
        closable: key !== "home",
      });
    },
    [openTab]
  );

  // 获取当前激活的菜单 ID
  const activeMenuId = activeTabId;

  // 获取当前激活标签页的内容
  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      {/* 侧边栏 */}
      <Sidebar
        sidebarExpanded={sidebarExpanded}
        setSidebarExpanded={setSidebarExpanded}
        showSettingsPanel={showSettingsPanel}
        setShowSettingsPanel={setShowSettingsPanel}
        activeMenuId={activeMenuId}
        onMenuClick={handleMenuClick}
        settingsPanelLeft={settingsPanelLeft}
      />

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部信息栏 */}
        <header className="h-12 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-medium text-slate-900">{selectedCompany}</span>
            <Badge variant="outline" className="text-amber-600 border-amber-200">
              {currentPeriod}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索凭证、科目..."
                className="w-48 h-8 pl-8 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4 text-slate-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-medium">
                张
              </div>
              <span className="text-sm font-medium text-slate-700">张会计</span>
            </div>
          </div>
        </header>

        {/* 标签页栏 */}
        <BrowserTabsBar />

        {/* 内容区 */}
        <main className="flex-1 overflow-auto bg-slate-50/30">
          {activeTab?.content || <HomePageContent />}
        </main>
      </div>
    </div>
  );
}
