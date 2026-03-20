"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, Plus, Info, X, GripVertical, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [searchResults, setSearchResults] = useState<{
    items: BusinessScopeItem[];
    total: number;
  }>({ items: [], total: 0 });
  const [selectedInDialog, setSelectedInDialog] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showError, setShowError] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevErrorRef = useRef<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const pageSize = 8;

  // 已选择的经营范围详情
  const selectedItems = getBusinessScopesByIds(selectedIds);

  // 搜索
  const handleSearch = useCallback(() => {
    const results = searchBusinessScopes(keyword, page, pageSize);
    setSearchResults(results);
  }, [keyword, page]);

  // 初始加载和搜索
  useEffect(() => {
    if (open) {
      handleSearch();
      // 聚焦搜索框
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open, handleSearch]);

  // 打开弹窗时同步已选
  useEffect(() => {
    if (open) {
      setSelectedInDialog([...selectedIds]);
      setKeyword("");
      setPage(1);
    }
  }, [open, selectedIds]);

  // 添加到已选
  const handleAdd = (id: string) => {
    if (!selectedInDialog.includes(id)) {
      setSelectedInDialog([...selectedInDialog, id]);
    }
  };

  // 从已选移除
  const handleRemove = (id: string) => {
    setSelectedInDialog(selectedInDialog.filter(i => i !== id));
  };

  // 确认选择
  const handleConfirm = () => {
    const items = getBusinessScopesByIds(selectedInDialog);
    const names = items.map(item => item.name);
    onChange(selectedInDialog, names);
    setOpen(false);
  };

  // 拖拽排序
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
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

  // 删除已选项
  const handleDelete = (id: string) => {
    const newIds = selectedIds.filter(i => i !== id);
    const items = getBusinessScopesByIds(newIds);
    const names = items.map(item => item.name);
    onChange(newIds, names);
  };

  // 显示错误提示
  const showErrorToast = (message: string) => {
    if (message !== prevErrorRef.current) {
      setShowError(true);
      prevErrorRef.current = message;
      
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      
      hideTimerRef.current = setTimeout(() => {
        setShowError(false);
      }, 1000);
    }
  };

  // 验证必填
  useEffect(() => {
    // 可以在外部调用时触发验证
  }, []);

  const totalPages = Math.ceil(searchResults.total / pageSize);

  return (
    <div className="space-y-4">
      {/* 已选经营范围展示 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>已选经营范围</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            disabled={disabled}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            添加经营范围
          </Button>
        </div>

        {selectedItems.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              温馨提示：第一个经营范围默认为主营业务，可拖拽调整顺序
            </p>
            <div className="space-y-2">
              {selectedItems.map((item, index) => (
                <div
                  key={item.id}
                  draggable={!disabled}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border bg-card transition-all",
                    !disabled && "cursor-move hover:border-primary/50",
                    draggedIndex === index && "opacity-50 border-primary"
                  )}
                >
                  {!disabled && <GripVertical className="h-4 w-4 text-muted-foreground" />}
                  <span className="flex-1 text-sm">
                    {index === 0 && <Badge variant="outline" className="mr-2 text-xs">主营</Badge>}
                    {item.name}
                  </span>
                  <Badge variant="outline" className={cn("text-xs", licenseTypeLabels[item.licenseType].color)}>
                    {licenseTypeLabels[item.licenseType].label}
                  </Badge>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1 rounded hover:bg-muted"
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p className="text-sm">暂无经营范围，请点击上方按钮添加</p>
          </div>
        )}

        {/* 许可类型图例 */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
          {Object.entries(licenseTypeLabels).map(([key, value]) => (
            <div key={key} className="flex items-center gap-1">
              <div className={cn("w-3 h-3 rounded", value.color.split(" ")[0])} />
              <span>{value.label}</span>
              {key === "post" && <span className="text-[10px]">（需后续办理许可）</span>}
              {key === "pre" && <span className="text-[10px]">（需先办理许可）</span>}
            </div>
          ))}
        </div>
      </div>

      {/* 选择弹窗 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>选择经营范围</DialogTitle>
            <DialogDescription>
              请输入关键字搜索经营范围，点击"添加"按钮选择
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
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
                className="flex-1"
              />
              <Button type="button" onClick={handleSearch}>
                <Search className="h-4 w-4 mr-1" />
                查询
              </Button>
            </div>

            {/* 已选提示 */}
            {selectedInDialog.length > 0 && (
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                已选择 <span className="text-primary font-medium">{selectedInDialog.length}</span> 项经营范围
              </div>
            )}

            {/* 搜索结果表格 */}
            <div className="flex-1 overflow-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">序号</th>
                    <th className="px-3 py-2 text-left font-medium">经营范围表述</th>
                    <th className="px-3 py-2 text-left font-medium">国民经济行业分类</th>
                    <th className="px-3 py-2 text-left font-medium">许可情况</th>
                    <th className="px-3 py-2 text-center font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {searchResults.items.map((item, index) => {
                    const isSelected = selectedInDialog.includes(item.id);
                    return (
                      <tr key={item.id} className={cn("hover:bg-muted/30", isSelected && "bg-primary/5")}>
                        <td className="px-3 py-2 text-muted-foreground">
                          {(page - 1) * pageSize + index + 1}
                        </td>
                        <td className="px-3 py-2">{item.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {item.categoryCode} {item.category}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className={cn("text-xs", licenseTypeLabels[item.licenseType].color)}>
                            {licenseTypeLabels[item.licenseType].label}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {isSelected ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemove(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="h-3 w-3 mr-1" />
                              移除
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="default"
                              size="sm"
                              onClick={() => handleAdd(item.id)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              添加
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {searchResults.items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
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
                <span className="text-muted-foreground">
                  {searchResults.total} 条数据中的第 {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, searchResults.total)} 条
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
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
                        className="w-8"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && page < totalPages - 2 && (
                    <>
                      <span className="px-1">...</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(totalPages)}
                        className="w-8"
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
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="button" onClick={handleConfirm}>
              确认选择
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 错误提示弹窗 */}
      {showError && (
        <div 
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-destructive/95 border border-destructive px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-bottom-4 duration-300 cursor-pointer"
          onClick={() => setShowError(false)}
        >
          <div className="flex items-center gap-2 text-white">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">请至少选择一项经营范围</span>
          </div>
        </div>
      )}
    </div>
  );
}

// 简化的 Label 组件（如果未导入）
function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium leading-none">{children}</label>;
}
