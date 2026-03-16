"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Building2,
  User,
  FolderKanban,
  Package,
  Landmark,
  Briefcase,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  LayoutGrid,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrowserTabs } from "@/components/browser-tabs";
import { AuxiliaryEditPage } from "./AuxiliaryEditPage";

/**
 * 辅助核算设置页面
 */

interface AuxiliaryType {
  id: string;
  code: string;
  name: string;
  icon: React.ElementType;
  description: string;
}

interface AuxiliaryItem {
  id: string;
  code: string;
  name: string;
  typeId: string;
  status: "启用" | "停用";
  [key: string]: string | undefined;
}

// 系统预设的辅助核算类型
const AUXILIARY_TYPES: AuxiliaryType[] = [
  { id: "customer", code: "customer", name: "客户", icon: Users, description: "客户档案管理" },
  { id: "supplier", code: "supplier", name: "供应商", icon: Building2, description: "供应商档案管理" },
  { id: "department", code: "department", name: "部门", icon: Landmark, description: "部门组织架构" },
  { id: "employee", code: "employee", name: "职员", icon: User, description: "职员信息管理" },
  { id: "project", code: "project", name: "项目", icon: FolderKanban, description: "项目档案管理" },
  { id: "inventory", code: "inventory", name: "存货", icon: Package, description: "存货档案管理" },
  { id: "fixed_asset", code: "fixed_asset", name: "固定资产", icon: Landmark, description: "固定资产管理" },
  { id: "partner", code: "partner", name: "往来单位", icon: Briefcase, description: "往来单位管理" },
];

// 模拟数据
const MOCK_ITEMS: Record<string, AuxiliaryItem[]> = {
  customer: [
    { id: "1", code: "1", name: "吉林省星锟化工有限公司", typeId: "customer", status: "启用", creditCode: "91220700MAEW85BW0W", category: "一般纳税人", contact: "王经理", phone: "13800138001", address: "吉林省松原市" },
    { id: "2", code: "2", name: "北京科技有限公司", typeId: "customer", status: "启用", category: "一般纳税人", contact: "张经理", phone: "13800138002" },
    { id: "3", code: "3", name: "上海贸易有限公司", typeId: "customer", status: "启用", category: "小规模纳税人", contact: "李总", phone: "13800138003" },
  ],
  supplier: [
    { id: "4", code: "S001", name: "深圳科技有限公司", typeId: "supplier", status: "启用", contact: "陈经理", phone: "13900139001" },
    { id: "5", code: "S002", name: "广州材料供应商", typeId: "supplier", status: "启用", contact: "刘总", phone: "13900139002" },
  ],
  department: [
    { id: "6", code: "01", name: "总经办", typeId: "department", status: "启用" },
    { id: "7", code: "02", name: "财务部", typeId: "department", status: "启用" },
    { id: "8", code: "03", name: "销售部", typeId: "department", status: "启用" },
    { id: "9", code: "04", name: "行政部", typeId: "department", status: "启用" },
    { id: "10", code: "05", name: "技术部", typeId: "department", status: "启用" },
  ],
  employee: [
    { id: "11", code: "E001", name: "张三", typeId: "employee", status: "启用", department: "财务部", phone: "13800000001" },
    { id: "12", code: "E002", name: "李四", typeId: "employee", status: "启用", department: "销售部", phone: "13800000002" },
    { id: "13", code: "E003", name: "王五", typeId: "employee", status: "启用", department: "技术部", phone: "13800000003" },
  ],
  project: [
    { id: "14", code: "P001", name: "智能财务系统开发", typeId: "project", status: "启用", startDate: "2026-01-01", endDate: "2026-12-31" },
  ],
  inventory: [
    { id: "15", code: "INV001", name: "办公用品", typeId: "inventory", status: "启用", spec: "通用", unit: "套" },
  ],
};

// 卡片显示字段配置
const CARD_FIELDS: Record<string, { key: string; icon: React.ElementType; label: string }[][]> = {
  customer: [
    [{ key: "category", icon: FileText, label: "类别" }, { key: "creditCode", icon: CreditCard, label: "信用代码" }],
    [{ key: "contact", icon: User, label: "联系人" }, { key: "phone", icon: Phone, label: "手机" }],
    [{ key: "address", icon: MapPin, label: "地址" }],
  ],
  supplier: [
    [{ key: "contact", icon: User, label: "联系人" }, { key: "phone", icon: Phone, label: "手机" }],
  ],
  department: [],
  employee: [
    [{ key: "department", icon: Building2, label: "部门" }, { key: "phone", icon: Phone, label: "手机" }],
  ],
  project: [
    [{ key: "startDate", icon: FileText, label: "开始" }, { key: "endDate", icon: FileText, label: "结束" }],
  ],
  inventory: [
    [{ key: "spec", icon: FileText, label: "规格" }, { key: "unit", icon: Package, label: "单位" }],
  ],
};

// 表格列配置
const TABLE_COLUMNS: Record<string, { key: string; label: string }[]> = {
  customer: [
    { key: "code", label: "编码" },
    { key: "name", label: "客户名称" },
    { key: "category", label: "类别" },
    { key: "creditCode", label: "统一社会信用代码" },
    { key: "contact", label: "联系人" },
    { key: "phone", label: "手机" },
    { key: "address", label: "地址" },
  ],
  supplier: [
    { key: "code", label: "编码" },
    { key: "name", label: "供应商名称" },
    { key: "contact", label: "联系人" },
    { key: "phone", label: "手机" },
  ],
  department: [
    { key: "code", label: "编码" },
    { key: "name", label: "部门名称" },
  ],
  employee: [
    { key: "code", label: "编码" },
    { key: "name", label: "职员姓名" },
    { key: "department", label: "部门" },
    { key: "phone", label: "手机" },
  ],
  project: [
    { key: "code", label: "编码" },
    { key: "name", label: "项目名称" },
    { key: "startDate", label: "开始日期" },
    { key: "endDate", label: "结束日期" },
  ],
  inventory: [
    { key: "code", label: "编码" },
    { key: "name", label: "存货名称" },
    { key: "spec", label: "规格型号" },
    { key: "unit", label: "单位" },
  ],
  fixed_asset: [
    { key: "code", label: "编码" },
    { key: "name", label: "资产名称" },
    { key: "category", label: "类别" },
  ],
  partner: [
    { key: "code", label: "编码" },
    { key: "name", label: "单位名称" },
    { key: "category", label: "类别" },
    { key: "contact", label: "联系人" },
    { key: "phone", label: "手机" },
  ],
};

export function AuxiliarySettingsPage() {
  const browserTabs = useBrowserTabs();
  const [selectedTypeId, setSelectedTypeId] = useState<string>("customer");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "list">("list");
  const [items, setItems] = useState<Record<string, AuxiliaryItem[]>>(MOCK_ITEMS);

  const selectedType = useMemo(() => AUXILIARY_TYPES.find(t => t.id === selectedTypeId), [selectedTypeId]);
  
  const currentItems = useMemo(() => {
    const list = items[selectedTypeId] || [];
    if (!searchKeyword) return list;
    return list.filter(item => 
      Object.values(item).some(val => typeof val === "string" && val.toLowerCase().includes(searchKeyword.toLowerCase()))
    );
  }, [items, selectedTypeId, searchKeyword]);

  const tableColumns = TABLE_COLUMNS[selectedTypeId] || [];
  const cardFields = CARD_FIELDS[selectedTypeId] || [];

  const handleAdd = () => {
    if (!browserTabs || !selectedType) return;
    browserTabs.openTab({
      id: `auxiliary-add-${selectedTypeId}-${Date.now()}`,
      label: `新增${selectedType.name}`,
      icon: <Plus className="h-3.5 w-3.5" />,
      content: <AuxiliaryEditPage typeId={selectedTypeId} />,
    });
  };

  const handleEdit = (item: AuxiliaryItem) => {
    if (!browserTabs || !selectedType) return;
    browserTabs.openTab({
      id: `auxiliary-edit-${item.id}`,
      label: item.name,
      icon: <Edit2 className="h-3.5 w-3.5" />,
      content: <AuxiliaryEditPage typeId={selectedTypeId} itemId={item.id} initialData={item as Record<string, string>} />,
    });
  };

  const handleDelete = (item: AuxiliaryItem) => {
    if (!confirm(`确定要删除「${item.name}」吗？`)) return;
    setItems(prev => ({
      ...prev,
      [selectedTypeId]: prev[selectedTypeId].filter(i => i.id !== item.id),
    }));
  };

  const getFieldValue = (item: AuxiliaryItem, key: string): string => (item[key] as string) || "-";

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 页面头部 */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">辅助核算</h1>
            <p className="text-xs text-slate-500 mt-0.5">管理客户、供应商、部门、职员等基础档案</p>
          </div>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white h-8" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1.5" />
            新增{selectedType?.name}
          </Button>
        </div>
      </div>

      {/* 工具栏：类型选择 + 搜索 + 视图切换 */}
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-6">
          {/* 左侧：类型选择 */}
          <div className="flex items-center gap-1.5">
            {AUXILIARY_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedTypeId === type.id;
              const count = items[type.id]?.length || 0;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedTypeId(type.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all",
                    isSelected
                      ? "bg-amber-500 text-white"
                      : "text-slate-600 hover:bg-white hover:text-slate-800"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{type.name}</span>
                  <span className={cn(
                    "text-xs px-1 rounded",
                    isSelected ? "bg-white/20" : "bg-slate-200 text-slate-500"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 右侧：搜索 + 视图切换 */}
          <div className="flex items-center gap-3 ml-auto shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="h-8 pl-8 pr-3 w-40 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
            </div>
            
            <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-white">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 transition-colors",
                  viewMode === "list" ? "bg-amber-500 text-white" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("card")}
                className={cn(
                  "p-1.5 transition-colors",
                  viewMode === "card" ? "bg-amber-500 text-white" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-6">
        {currentItems.length === 0 ? (
          <div className="py-16 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              {selectedType && <selectedType.icon className="h-8 w-8 text-slate-400" />}
            </div>
            <p className="text-slate-500">暂无{selectedType?.name}档案</p>
            <Button variant="link" className="text-amber-600 mt-2" onClick={handleAdd}>
              立即新增
            </Button>
          </div>
        ) : viewMode === "list" ? (
          /* 列表视图 */
          <Card className="border-slate-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 w-12">序号</th>
                      {tableColumns.map(col => (
                        <th key={col.key} className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                          {col.label}
                        </th>
                      ))}
                      <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 w-20">状态</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 w-20">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item, index) => (
                      <tr 
                        key={item.id} 
                        className="border-b border-slate-100 hover:bg-amber-50/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm text-slate-500">{index + 1}</td>
                        {tableColumns.map(col => (
                          <td key={col.key} className="py-3 px-4 text-sm text-slate-700">
                            {col.key === "code" ? (
                              <span className="font-mono">{getFieldValue(item, col.key)}</span>
                            ) : (
                              getFieldValue(item, col.key)
                            )}
                          </td>
                        ))}
                        <td className="py-3 px-4 text-center">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                            item.status === "启用" ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-500"
                          )}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(item)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* 卡片视图 */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentItems.map((item) => (
              <Card 
                key={item.id} 
                className="border-slate-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => handleEdit(item)}
              >
                <CardContent className="p-4">
                  {/* 头部 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.code}
                        </span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded whitespace-nowrap",
                          item.status === "启用" ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-500"
                        )}>
                          {item.status}
                        </span>
                      </div>
                      <h3 className="font-medium text-slate-800 truncate">{item.name}</h3>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                        onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* 详细信息 */}
                  {cardFields.length > 0 && (
                    <div className="space-y-1.5 pt-3 border-t border-slate-100">
                      {cardFields.map((row, rowIdx) => (
                        <div key={rowIdx} className="flex gap-3 text-xs">
                          {row.map((field) => {
                            const FieldIcon = field.icon;
                            return (
                              <div key={field.key} className="flex items-center gap-1 text-slate-500 flex-1 min-w-0">
                                <FieldIcon className="h-3 w-3 shrink-0 text-slate-400" />
                                <span className="truncate">{getFieldValue(item, field.key)}</span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
