"use client";

import { useLedger } from "./ledger-context";
import { Plus, Clock, CheckCircle2, Wallet, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LedgerHomePage() {
  const ledger = useLedger();
  const ledgerInfo = ledger?.ledgerInfo;

  // 获取当前日期
  const today = new Date();
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日，星期${weekDays[today.getDay()]}`;

  return (
    <div className="flex-1 overflow-auto bg-slate-50">
      <div className="p-6">
        {/* 顶部标题区 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">财务工作台</h1>
            <p className="text-sm text-slate-500 mt-1">今天是{dateStr}</p>
          </div>
          <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md">
            <Plus className="h-4 w-4 mr-1" />
            新增凭证
          </Button>
        </div>

        {/* 数据卡片区 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">资产总额</p>
                  <p className="text-xl font-bold text-slate-900">¥243,500</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">本月凭证</p>
                  <p className="text-xl font-bold text-slate-900">12 张</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">已结账月份</p>
                  <p className="text-xl font-bold text-slate-900">11 个月</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">待处理</p>
                  <p className="text-xl font-bold text-slate-900">3 项</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 待办事项 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">待办事项</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg border border-pink-100">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4 text-pink-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">凭证审核</p>
                  <span className="text-xs text-pink-500 font-medium">今天</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">2026年1月尚有3张凭证待审核</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">期末结转</p>
                  <span className="text-xs text-amber-500 font-medium">3天内</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">2026年1月期末结转待处理</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">纳税申报</p>
                  <span className="text-xs text-blue-500 font-medium">本周内</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">增值税申报截止日期1月20日</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 快捷入口 */}
        <div className="mt-6 grid grid-cols-5 gap-3">
          {[
            { icon: "📝", label: "录入凭证", color: "bg-blue-100" },
            { icon: "📊", label: "资产负债表", color: "bg-green-100" },
            { icon: "📈", label: "利润表", color: "bg-purple-100" },
            { icon: "📒", label: "明细账", color: "bg-orange-100" },
            { icon: "📋", label: "总账", color: "bg-cyan-100" },
          ].map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center text-2xl`}>
                {item.icon}
              </div>
              <span className="text-sm text-slate-700">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
