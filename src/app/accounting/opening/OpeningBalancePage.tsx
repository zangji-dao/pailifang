"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Calculator,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  Download,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AccountingStandard,
  getSubjectsByStandard,
  SubjectCategory,
} from "@/data/accounting-subjects";
import { DEFAULT_LEDGER_CONFIG, LedgerConfig } from "@/app/dashboard/ledgers/[id]/ledger-context";

/**
 * 期初余额页面
 * 录入账套启用时各科目的初始余额
 */

interface SubjectBalance {
  code: string;
  name: string;
  direction: "借" | "贷";
  level: number;
  parentCode: string | null;
  openingBalance: number;
  debitAccumulated: number;
  creditAccumulated: number;
  yearOpeningBalance: number;
  hasChildren: boolean;
  expanded: boolean;
}

// 科目分类配置
const categoryTabs = [
  { key: "资产类", label: "资产" },
  { key: "负债类", label: "负债" },
  { key: "所有者权益类", label: "权益" },
  { key: "成本类", label: "成本" },
  { key: "损益类", label: "损益" },
];

interface OpeningBalancePageProps {
  ledgerConfig?: LedgerConfig;
}

export function OpeningBalancePage({ ledgerConfig = DEFAULT_LEDGER_CONFIG }: OpeningBalancePageProps) {
  const [accountingStandard, setAccountingStandard] = useState<AccountingStandard>(
    (ledgerConfig.accountingStandard as AccountingStandard) || "small_enterprise"
  );
  const [searchKeyword, setSearchKeyword] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("资产类");
  
  const [balances, setBalances] = useState<Record<string, {
    openingBalance: number;
    debitAccumulated: number;
    creditAccumulated: number;
  }>>({});
  
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());

  const categories = getSubjectsByStandard(accountingStandard);
  
  // 从账套配置获取精度设置
  const decimalPlaces = ledgerConfig.amountDecimal || 2;

  // 扁平化科目列表，构建树形结构
  const flattenSubjects = useCallback((categoryData: SubjectCategory[]): SubjectBalance[] => {
    const result: SubjectBalance[] = [];
    
    categoryData.forEach(category => {
      category.subjects.forEach(subject => {
        const level = subject.code.length === 4 ? 1 : 
                      subject.code.length === 6 ? 2 : 
                      subject.code.length === 8 ? 3 : 4;
        const parentCode = level > 1 ? subject.code.substring(0, subject.code.length - 2) : null;
        const hasChildren = category.subjects.some(s => 
          s.code.startsWith(subject.code) && s.code !== subject.code && s.code.length === subject.code.length + 2
        );
        
        const data = balances[subject.code] || { openingBalance: 0, debitAccumulated: 0, creditAccumulated: 0 };
        const openingBalance = data.openingBalance ?? 0;
        const debitAccumulated = data.debitAccumulated ?? 0;
        const creditAccumulated = data.creditAccumulated ?? 0;
        
        result.push({
          code: subject.code,
          name: subject.name,
          direction: subject.direction,
          level,
          parentCode,
          openingBalance,
          debitAccumulated,
          creditAccumulated,
          yearOpeningBalance: openingBalance + (subject.direction === "借" ? debitAccumulated - creditAccumulated : creditAccumulated - debitAccumulated),
          hasChildren,
          expanded: expandedCodes.has(subject.code),
        });
      });
    });
    
    return result;
  }, [balances, expandedCodes]);

  // 计算汇总余额（上级科目自动汇总下级）
  const calculateSummaryBalances = useCallback((subjects: SubjectBalance[]): SubjectBalance[] => {
    const sortedByLevel = [...subjects].sort((a, b) => b.level - a.level);
    
    const summaryMap = new Map<string, {
      openingBalance: number;
      debitAccumulated: number;
      creditAccumulated: number;
    }>();
    
    sortedByLevel.forEach(subject => {
      const current = balances[subject.code] || { openingBalance: 0, debitAccumulated: 0, creditAccumulated: 0 };
      
      if (subject.parentCode) {
        const parentSum = summaryMap.get(subject.parentCode) || { 
          openingBalance: 0, 
          debitAccumulated: 0, 
          creditAccumulated: 0 
        };
        parentSum.openingBalance += current.openingBalance ?? 0;
        parentSum.debitAccumulated += current.debitAccumulated ?? 0;
        parentSum.creditAccumulated += current.creditAccumulated ?? 0;
        summaryMap.set(subject.parentCode, parentSum);
      }
    });
    
    return subjects.map(subject => {
      if (subject.hasChildren) {
        const sum = summaryMap.get(subject.code) || { 
          openingBalance: 0, 
          debitAccumulated: 0, 
          creditAccumulated: 0 
        };
        const opening = sum.openingBalance ?? 0;
        const debit = sum.debitAccumulated ?? 0;
        const credit = sum.creditAccumulated ?? 0;
        return { 
          ...subject, 
          openingBalance: opening,
          debitAccumulated: debit,
          creditAccumulated: credit,
          yearOpeningBalance: opening + (subject.direction === "借" ? debit - credit : credit - debit),
        };
      }
      return subject;
    });
  }, [balances]);

  const currentCategoryData = categories.find(c => c.name === activeCategory);
  
  const allSubjects = useMemo(() => {
    const data = currentCategoryData ? [currentCategoryData] : [];
    return calculateSummaryBalances(flattenSubjects(data));
  }, [currentCategoryData, flattenSubjects, calculateSummaryBalances]);

  const filteredSubjects = useMemo(() => {
    if (!searchKeyword) return allSubjects;
    const keyword = searchKeyword.toLowerCase();
    return allSubjects.filter(s => 
      s.code.includes(searchKeyword) || 
      s.name.toLowerCase().includes(keyword)
    );
  }, [allSubjects, searchKeyword]);

  const trialBalance = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;
    
    categories.forEach(category => {
      category.subjects.filter(s => s.code.length === 4).forEach(subject => {
        const balance = balances[subject.code]?.openingBalance || 0;
        if (subject.direction === "借") {
          totalDebit += balance;
        } else {
          totalCredit += balance;
        }
      });
    });
    
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
    
    return { totalDebit, totalCredit, isBalanced };
  }, [categories, balances]);

  const toggleExpand = (code: string) => {
    setExpandedCodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(code)) {
        newSet.delete(code);
      } else {
        newSet.add(code);
      }
      return newSet;
    });
  };

  const updateBalance = (code: string, field: "openingBalance" | "debitAccumulated" | "creditAccumulated", value: string) => {
    const numValue = parseFloat(value.replace(/,/g, "")) || 0;
    setBalances(prev => ({
      ...prev,
      [code]: {
        ...prev[code],
        [field]: numValue,
      }
    }));
  };

  const formatAmount = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || amount === 0) return "";
    return amount.toLocaleString("zh-CN", { 
      minimumFractionDigits: decimalPlaces, 
      maximumFractionDigits: decimalPlaces 
    });
  };

  const renderSubjectRow = (subject: SubjectBalance, index: number) => {
    const indent = (subject.level - 1) * 24;
    const isLeaf = !subject.hasChildren;
    const showInput = isLeaf;

    return (
      <tr 
        key={subject.code}
        className={cn(
          "border-b border-gray-100 transition-colors",
          "hover:bg-amber-50/40",
          subject.level === 1 && "bg-amber-50/20"
        )}
      >
        {/* 科目编码 */}
        <td className="py-2.5 px-4">
          <span 
            className="text-sm font-mono text-gray-400"
            style={{ paddingLeft: `${indent}px` }}
          >
            {subject.code}
          </span>
        </td>
        
        {/* 科目名称 */}
        <td className="py-2.5 px-2">
          <div className="flex items-center gap-1" style={{ paddingLeft: `${indent}px` }}>
            {subject.hasChildren ? (
              <button
                onClick={() => toggleExpand(subject.code)}
                className="p-0.5 rounded hover:bg-amber-100 text-gray-400 hover:text-amber-600 transition-colors"
              >
                {subject.expanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <span className={cn(
              "text-sm",
              subject.level === 1 ? "text-gray-800 font-medium" : "text-gray-600"
            )}>
              {subject.name}
            </span>
          </div>
        </td>
        
        {/* 方向 */}
        <td className="py-2.5 px-2 text-center">
          <span className={cn(
            "text-xs font-medium",
            subject.direction === "借" ? "text-gray-500" : "text-gray-400"
          )}>
            {subject.direction}
          </span>
        </td>
        
        {/* 期初余额 */}
        <td className="py-2.5 px-2">
          {showInput ? (
            <input
              type="text"
              value={formatAmount(subject.openingBalance)}
              onChange={(e) => updateBalance(subject.code, "openingBalance", e.target.value)}
              className="w-full text-right text-sm px-3 py-1.5 border-0 bg-transparent focus:bg-amber-50 focus:ring-1 focus:ring-amber-300 rounded transition-all outline-none"
              placeholder="—"
            />
          ) : (
            <div className="text-right text-sm text-gray-400 px-3 py-1.5">
              {formatAmount(subject.openingBalance)}
            </div>
          )}
        </td>
        
        {/* 借方累计 */}
        <td className="py-2.5 px-2">
          {showInput ? (
            <input
              type="text"
              value={formatAmount(subject.debitAccumulated)}
              onChange={(e) => updateBalance(subject.code, "debitAccumulated", e.target.value)}
              className="w-full text-right text-sm px-3 py-1.5 border-0 bg-transparent focus:bg-gray-50 focus:ring-1 focus:ring-gray-300 rounded transition-all outline-none"
              placeholder="—"
            />
          ) : (
            <div className="text-right text-sm text-gray-400 px-3 py-1.5">
              {formatAmount(subject.debitAccumulated)}
            </div>
          )}
        </td>
        
        {/* 贷方累计 */}
        <td className="py-2.5 px-2">
          {showInput ? (
            <input
              type="text"
              value={formatAmount(subject.creditAccumulated)}
              onChange={(e) => updateBalance(subject.code, "creditAccumulated", e.target.value)}
              className="w-full text-right text-sm px-3 py-1.5 border-0 bg-transparent focus:bg-gray-50 focus:ring-1 focus:ring-gray-300 rounded transition-all outline-none"
              placeholder="—"
            />
          ) : (
            <div className="text-right text-sm text-gray-400 px-3 py-1.5">
              {formatAmount(subject.creditAccumulated)}
            </div>
          )}
        </td>
        
        {/* 年初余额 */}
        <td className="py-2.5 px-2">
          <div className="text-right text-sm text-gray-500 px-3 py-1.5">
            {formatAmount(subject.yearOpeningBalance) || "—"}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 顶部标签页 */}
      <div className="flex items-center border-b border-gray-100 px-6 py-3">
        <div className="flex items-center gap-6">
          {categoryTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className={cn(
                "text-sm transition-colors relative py-1",
                activeCategory === tab.key
                  ? "text-amber-600 font-medium"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {tab.label}
              {activeCategory === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
        
        {/* 搜索框 */}
        <div className="ml-8 flex-1 max-w-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索科目..."
              className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 transition-all"
            />
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex items-center gap-1 ml-auto">
          <Button variant="ghost" size="sm" className="text-gray-400 h-8 w-8 p-0">
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-500 h-8">
            <Download className="h-4 w-4 mr-1.5" />
            导出
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-500 h-8">
            <Upload className="h-4 w-4 mr-1.5" />
            导入
          </Button>
          <Button 
            size="sm"
            className={cn(
              "h-8 ml-2",
              trialBalance.isBalanced 
                ? "bg-emerald-500 hover:bg-emerald-600" 
                : "bg-amber-500 hover:bg-amber-600"
            )}
          >
            <Calculator className="h-4 w-4 mr-1.5" />
            试算平衡
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400 h-8 w-8 p-0 ml-1">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 表格区域 */}
      <div className="flex-1 overflow-auto px-6">
        <table className="w-full border-collapse table-fixed">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-3 text-xs font-medium text-gray-400 w-[90px]">
                科目编码
              </th>
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 w-[160px]">
                科目名称
              </th>
              <th className="text-center py-3 px-1 text-xs font-medium text-gray-400 w-[40px]">
                方向
              </th>
              <th className="text-right py-3 px-2 text-xs font-medium text-gray-400">
                期初余额
              </th>
              <th className="text-right py-3 px-2 text-xs font-medium text-gray-400">
                借方累计
              </th>
              <th className="text-right py-3 px-2 text-xs font-medium text-gray-400">
                贷方累计
              </th>
              <th className="text-right py-3 px-2 text-xs font-medium text-gray-400">
                <div className="flex items-center justify-end gap-1">
                  年初余额
                  <HelpCircle className="h-3 w-3 text-gray-300" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredSubjects.map((subject, index) => renderSubjectRow(subject, index))}
          </tbody>
        </table>
      </div>

      {/* 底部汇总栏 */}
      <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <div className="text-gray-500">
              借方合计：<span className="font-medium text-gray-700">{formatAmount(trialBalance.totalDebit) || "0.00"}</span>
            </div>
            <div className="text-gray-500">
              贷方合计：<span className="font-medium text-gray-700">{formatAmount(trialBalance.totalCredit) || "0.00"}</span>
            </div>
            {!trialBalance.isBalanced && trialBalance.totalDebit + trialBalance.totalCredit > 0 && (
              <div className="text-red-500">
                差额：<span className="font-medium">{formatAmount(Math.abs(trialBalance.totalDebit - trialBalance.totalCredit))}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1.5">
            {trialBalance.isBalanced ? (
              <>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-emerald-600 font-medium">试算平衡</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-amber-600 font-medium">试算不平衡</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OpeningBalancePage;
