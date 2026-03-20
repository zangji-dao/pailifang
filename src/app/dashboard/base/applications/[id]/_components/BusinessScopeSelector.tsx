"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, Plus, X, GripVertical, ChevronLeft, ChevronRight, AlertCircle, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  searchBusinessScopes,
  getBusinessScopesByIds,
  licenseTypeLabels,
  type BusinessScopeItem,
  type LicenseType,
} from "../data/business-scopes";

interface BusinessScopeSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[], names: string[]) => void;
  disabled?: boolean;
}

export function BusinessScopeSelector({
  selectedIds,
  onChange,
  disabled,
}: BusinessScopeSelectorProps) {
  const [activeTab, setActiveTab] = useState<"theme" | "search">("search");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [searchResults, setSearchResults] = useState<{
    items: BusinessScopeItem[];
    total: number;
  }>({ items: [], total: 0 });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const pageSize = 5;

  // 已选择的经营范围详情
  const selectedItems = getBusinessScopesByIds(selectedIds);

  // 搜索
  const handleSearch = useCallback(() => {
    const results = searchBusinessScopes(keyword, page, pageSize);
    setSearchResults(results);
  }, [keyword, page]);

  // 初始加载
  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  // 添加到已选
  const handleAdd = (id: string) => {
    if (disabled || selectedIds.includes(id)) return;
    const newIds = [...selectedIds, id];
    const items = getBusinessScopesByIds(newIds);
    const names = items.map(item => item.name);
    onChange(newIds, names);
  };

  // 从已选移除
  const handleRemove = (id: string) => {
    if (disabled) return;
    const newIds = selectedIds.filter(i => i !== id);
    const items = getBusinessScopesByIds(newIds);
    const names = items.map(item => item.name);
    onChange(newIds, names);
  };

  // 拖拽排序
  const handleDragStart = (index: number) => {
    if (disabled) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (disabled || draggedIndex === null || draggedIndex === index) return;
    
    const newOrder = [...selectedIds];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    
    const items = getBusinessScopesByIds(newOrder);
    const names = items.map(item => item.name);
    onChange(newOrder, names);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const totalPages = Math.ceil(searchResults.total / pageSize);

  // 获取许可情况颜色
  const getLicenseBadgeClass = (type: LicenseType) => {
    switch (type) {
      case "general":
        return "bg-emerald-500 text-white hover:bg-emerald-500";
      case "post":
        return "bg-blue-500 text-white hover:bg-blue-500";
      case "pre":
        return "bg-orange-500 text-white hover:bg-orange-500";
    }
  };

  return (
    <div className="space-y-4">
      {/* 标签切换 */}
      <div className="flex border-b">
        <button
          type="button"
          onClick={() => setActiveTab("theme")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors relative",
            activeTab === "theme"
              ? "text-blue-600"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          主题
          {activeTab === "theme" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("search")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors relative",
            activeTab === "search"
              ? "text-blue-600"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          快速查询
          {activeTab === "search" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
      </div>

      {/* 搜索与数据列表区 */}
      <div className="space-y-3">
        {/* 搜索栏 */}
        <div className="flex gap-2">
          <Input
            ref={searchInputRef}
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            placeholder="请输入关键字"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 bg-slate-50"
            disabled={disabled}
          />
          <Button
            type="button"
            onClick={handleSearch}
            disabled={disabled}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Search className="h-4 w-4 mr-1" />
            查询
          </Button>
        </div>

        {/* 数据表格 */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium text-slate-600 w-14">序号</th>
                <th className="px-3 py-2.5 text-left font-medium text-slate-600">相关经营范围表述</th>
                <th className="px-3 py-2.5 text-left font-medium text-slate-600">国民经济行业分类</th>
                <th className="px-3 py-2.5 text-left font-medium text-slate-600 w-24">许可情况</th>
                <th className="px-3 py-2.5 text-center font-medium text-slate-600 w-28">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {searchResults.items.map((item, index) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <tr key={item.id} className={cn("bg-white hover:bg-slate-50", isSelected && "bg-blue-50")}>
                    <td className="px-3 py-2.5 text-slate-500">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-3 py-2.5 text-slate-900">{item.name}</td>
                    <td className="px-3 py-2.5 text-slate-500">
                      {item.categoryCode} {item.category}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge className={cn("text-xs rounded-full", getLicenseBadgeClass(item.licenseType))}>
                        {licenseTypeLabels[item.licenseType].label}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs text-slate-600 border-slate-300"
                          disabled={disabled}
                        >
                          详情
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className={cn(
                            "h-7 text-xs",
                            isSelected
                              ? "bg-slate-300 text-slate-500 hover:bg-slate-300"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          )}
                          onClick={() => isSelected ? handleRemove(item.id) : handleAdd(item.id)}
                          disabled={disabled}
                        >
                          {isSelected ? "已添加" : "添加"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {searchResults.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                    未找到匹配的经营范围
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {searchResults.total > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">
              <span className="text-blue-600 font-medium">{searchResults.total}</span> 条数据中的第 {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, searchResults.total)} 条
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    type="button"
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      "h-7 w-7 p-0",
                      page === pageNum && "bg-blue-600 hover:bg-blue-700"
                    )}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              {totalPages > 5 && page < totalPages - 2 && (
                <>
                  <span className="px-1 text-slate-400">...</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(totalPages)}
                    className="h-7 w-7 p-0"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 选择结果与说明区 */}
      <div className="border-t-2 border-red-200 bg-slate-50 rounded-b-lg p-4 space-y-3">
        <p className="text-sm text-slate-700">
          您已选择的经营范围如下：
          <span className="text-red-500 font-medium"> 温馨提示：您选择的第一个经营范围，默认为您的主营经营范围，您可以通过拖拽调整经营范围顺序</span>
        </p>
        
        {/* 许可类型图例 */}
        <div className="flex flex-wrap gap-6 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500" />
            <span>一般事项</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span>后置事项，在办理完营业执照后，需要到相关后续业务部门办理</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500" />
            <span>前置事项，需要在核名通过后到相关部门办理许可审批</span>
          </div>
        </div>
      </div>

      {/* 已选内容展示区 */}
      <div className="border rounded-lg min-h-[120px] bg-white">
        {selectedItems.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {selectedItems.map((item, index) => (
              <div
                key={item.id}
                draggable={!disabled}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-all",
                  !disabled && "cursor-move hover:bg-slate-50",
                  draggedIndex === index && "opacity-50 bg-blue-50"
                )}
              >
                {!disabled && (
                  <GripVertical className="h-4 w-4 text-slate-300 flex-shrink-0" />
                )}
                <span className="flex-1 text-sm text-slate-900">
                  {index === 0 && (
                    <Badge variant="outline" className="mr-2 text-xs border-amber-300 text-amber-600">
                      主营
                    </Badge>
                  )}
                  {item.name}
                </span>
                <Badge className={cn("text-xs rounded-full", getLicenseBadgeClass(item.licenseType))}>
                  {licenseTypeLabels[item.licenseType].label}
                </Badge>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Mail className="h-10 w-10 mb-2" />
            <p className="text-sm">暂无数据</p>
          </div>
        )}
      </div>
    </div>
  );
}
