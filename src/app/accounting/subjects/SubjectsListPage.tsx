"use client";

import { useState, useMemo } from "react";
import { pinyin } from "pinyin-pro";
import {
  Calculator,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Pencil,
  Trash2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useBrowserTabs } from "@/components/browser-tabs";
// 导入官方会计准则科目数据
import {
  AccountingStandard,
  ACCOUNTING_STANDARDS,
  getSubjectsByStandard,
} from "@/data/accounting-subjects";
import { AddSubjectPage } from "./AddSubjectPage";

/**
 * 科目列表页面
 * 展示会计科目列表，支持分类筛选、搜索、新增等操作
 * 业务规则：
 * - 一级科目（4位编码）：系统预设，不可编辑编码和名称，只能启用/停用
 * - 明细科目（>4位编码）：用户自定义，可编辑删除
 */
export function SubjectsListPage() {
  const { openTab } = useBrowserTabs()!;
  const [activeCategory, setActiveCategory] = useState("资产类");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showDisabled, setShowDisabled] = useState(false);
  const [accountingStandard, setAccountingStandard] = useState<AccountingStandard>("small_enterprise");
  const [showStandardDropdown, setShowStandardDropdown] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 判断是否为一级科目（系统预设）
  const isPrimarySubject = (code: string) => code.length === 4;

  // 打开新增科目页面
  const handleAddSubject = () => {
    openTab({
      id: `addSubject-${Date.now()}`,
      label: "新增科目",
      icon: <Plus className="h-3.5 w-3.5" />,
      content: <AddSubjectPage />,
      closable: true,
    });
  };

  // 新增下级科目（从列表点击+号进入）
  const handleAddChildSubject = (parentCode: string, parentName: string, parentDirection: "借" | "贷") => {
    openTab({
      id: `addSubject-${Date.now()}`,
      label: "新增科目",
      icon: <Plus className="h-3.5 w-3.5" />,
      content: <AddSubjectPage parentCode={parentCode} parentName={parentName} parentDirection={parentDirection} />,
      closable: true,
    });
  };

  // 获取当前准则的分类列表
  const categories = getSubjectsByStandard(accountingStandard).map(c => c.name);

  // 获取当前准则当前分类的科目数据
  const currentCategoryData = getSubjectsByStandard(accountingStandard).find(c => c.name === activeCategory);
  const currentSubjects = currentCategoryData?.subjects || [];

  // 过滤科目
  const filteredSubjects = currentSubjects.filter((s) => {
    const matchSearch =
      !searchKeyword ||
      s.code.includes(searchKeyword) ||
      s.name.includes(searchKeyword) ||
      (s.mnemonic && s.mnemonic.toLowerCase().includes(searchKeyword.toLowerCase()));
    const matchStatus = showDisabled || s.status === "启用";
    return matchSearch && matchStatus;
  });

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredSubjects.map(s => s.code)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // 单个选择
  const handleSelect = (code: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    if (checked) {
      newSelectedIds.add(code);
    } else {
      newSelectedIds.delete(code);
    }
    setSelectedIds(newSelectedIds);
  };

  // 是否全选
  const isAllSelected = filteredSubjects.length > 0 && selectedIds.size === filteredSubjects.length;
  const isPartialSelected = selectedIds.size > 0 && selectedIds.size < filteredSubjects.length;

  // 生成助记码（科目名称首字母大写）
  const getMnemonic = useMemo(() => {
    return (name: string): string => {
      // 获取拼音首字母并转大写
      const initials = pinyin(name, { pattern: "first", toneType: "none" });
      return initials.toUpperCase().replace(/\s/g, "");
    };
  }, []);

  // 统计各分类科目数量
  const getCategoryCount = (categoryName: string) => {
    const cat = getSubjectsByStandard(accountingStandard).find(c => c.name === categoryName);
    return cat?.subjects.length || 0;
  };

  // 统计当前准则总科目数
  const getTotalCount = () => {
    return getSubjectsByStandard(accountingStandard).reduce((acc, cat) => acc + cat.subjects.length, 0);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 顶部分类标签 */}
      <div className="flex items-center gap-1 px-4 pt-4 pb-2 border-b border-slate-100 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-2",
              activeCategory === cat
                ? "bg-amber-500 text-white"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            {cat}
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full",
              activeCategory === cat
                ? "bg-amber-400/50 text-white"
                : "bg-slate-200 text-slate-500"
            )}>
              {getCategoryCount(cat)}
            </span>
          </button>
        ))}
      </div>

      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-4">
          {/* 会计准则选择 */}
          <div className="relative">
            <button
              onClick={() => setShowStandardDropdown(!showStandardDropdown)}
              className="flex items-center gap-2 h-8 px-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <span className="font-medium">{ACCOUNTING_STANDARDS[accountingStandard].name}</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", showStandardDropdown && "rotate-180")} />
            </button>
            {showStandardDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[240px]">
                {(Object.keys(ACCOUNTING_STANDARDS) as AccountingStandard[]).map((standard) => (
                  <button
                    key={standard}
                    onClick={() => {
                      setAccountingStandard(standard);
                      // 切换准则时重置分类为第一个
                      const newCategories = getSubjectsByStandard(standard).map(c => c.name);
                      if (newCategories.length > 0 && !newCategories.includes(activeCategory)) {
                        setActiveCategory(newCategories[0]);
                      }
                      setShowStandardDropdown(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-amber-50 transition-colors",
                      accountingStandard === standard
                        ? "bg-amber-50 text-amber-700 font-medium"
                        : "text-slate-600"
                    )}
                  >
                    <div>{ACCOUNTING_STANDARDS[standard].name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{ACCOUNTING_STANDARDS[standard].description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="科目编码/名称/助记码"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-64 h-8 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400"
            />
          </div>
          {/* 显示停用科目 */}
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showDisabled}
              onChange={(e) => setShowDisabled(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            显示停用科目
          </label>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          <Button 
            className="bg-amber-500 hover:bg-amber-600 text-white h-8"
            onClick={handleAddSubject}
          >
            <Plus className="h-4 w-4 mr-1" />
            新增科目
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            编码设置
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            导出
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            导入
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            明细转辅助
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            批量操作
            <ChevronRight className="h-4 w-4 ml-1 rotate-90" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <RotateCcw className="h-4 w-4 text-slate-500" />
          </Button>
        </div>
      </div>

      {/* 科目表格 */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b-2 border-amber-300 text-xs font-medium">
              <th className="py-2.5 px-2 text-center w-10">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                />
              </th>
              <th className="py-2.5 px-2 text-center w-12 text-slate-500">序号</th>
              <th className="py-2.5 px-2 text-left w-20 text-slate-500">科目编码</th>
              <th className="py-2.5 px-2 text-left w-40 text-slate-500">科目名称</th>
              <th className="py-2.5 px-2 text-center w-20 text-slate-500">助记码</th>
              <th className="py-2.5 px-2 text-center w-12 text-slate-500">方向</th>
              <th className="py-2.5 px-2 text-left w-20 text-slate-500">辅助核算</th>
              <th className="py-2.5 px-2 text-center w-14 text-slate-500">状态</th>
              <th className="py-2.5 px-2 text-center w-20 text-slate-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubjects.map((subject, index) => (
              <tr
                key={subject.code}
                className={cn(
                  "text-xs border-b border-slate-100 hover:bg-slate-50 transition-colors",
                  subject.status === "停用" && "opacity-50",
                  selectedIds.has(subject.code) && "bg-amber-50/50"
                )}
              >
                <td className="py-2 px-2 text-center">
                  <Checkbox
                    checked={selectedIds.has(subject.code)}
                    onCheckedChange={(checked) => handleSelect(subject.code, checked as boolean)}
                    className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                  />
                </td>
                <td className="py-2 px-2 text-slate-400 text-center">{index + 1}</td>
                <td className="py-2 px-2 font-mono text-slate-600">
                  {subject.code}
                </td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-sm", subject.status === "启用" ? "text-slate-800" : "text-slate-400")}>
                      {subject.name}
                    </span>
                    {isPrimarySubject(subject.code) && (
                      <span className="text-[10px] px-1 py-0.5 rounded bg-slate-100 text-slate-500">
                        系统预设
                      </span>
                    )}
                    {subject.scope && (
                      <span className="text-[10px] text-slate-400">{subject.scope}</span>
                    )}
                  </div>
                </td>
                <td className="py-2 px-2 text-slate-500 text-center">{getMnemonic(subject.name)}</td>
                <td className="py-2 px-2 text-center">
                  <span
                    className={cn(
                      "inline-block text-xs px-1 py-0.5 rounded",
                      subject.direction === "借"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-amber-50 text-amber-600"
                    )}
                  >
                    {subject.direction}
                  </span>
                </td>
                <td className="py-2 px-2 text-slate-500">{subject.auxiliary || "-"}</td>
                <td className="py-2 px-2 text-center">
                  <span
                    className={cn(
                      "text-xs",
                      subject.status === "启用" ? "text-amber-600" : "text-slate-400"
                    )}
                  >
                    {subject.status}
                  </span>
                </td>
                <td className="py-2 px-2 text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    {/* 新增下级科目 */}
                    <button 
                      className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" 
                      title="新增下级科目"
                      onClick={() => handleAddChildSubject(subject.code, subject.name, subject.direction)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    {isPrimarySubject(subject.code) ? (
                      /* 一级科目：系统预设，不可编辑 */
                      <button className="p-1 text-slate-300 cursor-not-allowed" title="系统预设科目，不可编辑" disabled>
                        <Lock className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <>
                        {/* 明细科目：可编辑 */}
                        <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors" title="编辑">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {/* 明细科目：可删除 */}
                        <button className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="删除">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 空状态 */}
        {filteredSubjects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Calculator className="h-12 w-12 mb-4" />
            <p className="text-sm">暂无科目数据</p>
          </div>
        )}
      </div>

      {/* 底部统计 */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
        共 {filteredSubjects.length} 个科目（当前分类）| 总计 {getTotalCount()} 个科目
      </div>
    </div>
  );
}

export default SubjectsListPage;
