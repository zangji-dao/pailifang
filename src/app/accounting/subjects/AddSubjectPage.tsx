"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, Search, Info, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AccountingStandard,
  getSubjectsByStandard,
  getApplicableAuxiliaryTypes,
  type AuxiliaryType,
} from "@/data/accounting-subjects";
import { createSubject, type CreateSubjectData } from "@/services/subjectsService";
import { useToast } from "@/hooks/use-toast";
import { useBrowserTabs } from "@/components/browser-tabs";

/**
 * 新增科目页面
 * 用于添加新的会计科目
 * 业务规则：
 * - 一级科目：用户手动输入4位编码
 * - 明细科目：选择上级科目后，自动生成编码（上级编码 + 2位序号）
 */
interface AddSubjectPageProps {
  parentCode?: string;      // 从列表传入的父科目编码
  parentName?: string;      // 从列表传入的父科目名称
  parentDirection?: "借" | "贷";  // 从列表传入的父科目方向
}

// 根据编码判断科目类别
const getCategoryByCode = (code: string): string => {
  const firstChar = code[0];
  const categoryMap: Record<string, string> = {
    "1": "资产类",
    "2": "负债类",
    "3": "所有者权益类",
    "4": "成本类",
    "5": "损益类",
    "6": "损益类",
  };
  return categoryMap[firstChar] || "资产类";
};

// 根据科目类别自动确定余额方向
const getDirectionByCategory = (category: string): "借" | "贷" => {
  const directionMap: Record<string, "借" | "贷"> = {
    "资产类": "借",
    "负债类": "贷",
    "所有者权益类": "贷",
    "成本类": "借",
    "损益类": "借", // 默认借方，具体根据科目编码判断
  };
  return directionMap[category] || "借";
};

// 根据科目编码判断余额方向（更精确）
const getDirectionByCodeLocal = (code: string): "借" | "贷" => {
  const firstChar = code[0];
  // 资产类(1)、成本类(4)：借
  // 负债类(2)、所有者权益类(3)：贷
  // 损益类：收入(5xxx部分)为贷，费用(6xxx或5xxx部分)为借
  if (firstChar === "1" || firstChar === "4") {
    return "借";
  } else if (firstChar === "2" || firstChar === "3") {
    return "贷";
  } else if (firstChar === "5" || firstChar === "6") {
    // 损益类：根据第二位判断
    // 6xxx通常是费用类（借方）
    // 5xxx通常是收入类（贷方），但也有费用
    // 这里简化处理，默认返回借
    return firstChar === "6" ? "借" : "贷";
  }
  return "借";
};

export function AddSubjectPage({ parentCode, parentName, parentDirection }: AddSubjectPageProps = {}) {
  const browserTabs = useBrowserTabs();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const [parentSearch, setParentSearch] = useState("");
  const [accountingStandard] = useState<AccountingStandard>("small_enterprise");

  // 获取所有科目（用于上级科目选择）
  const allSubjects = useMemo(() => {
    const categories = getSubjectsByStandard(accountingStandard);
    return categories.flatMap(cat => cat.subjects);
  }, [accountingStandard]);

  // 生成子科目编码
  const generateChildCode = (parentCode: string): string => {
    const existingCodes = allSubjects
      .filter(s => s.code.startsWith(parentCode) && s.code.length === parentCode.length + 2)
      .map(s => parseInt(s.code.slice(-2)));
    
    const nextNum = existingCodes.length > 0 ? Math.max(...existingCodes) + 1 : 1;
    return parentCode + nextNum.toString().padStart(2, "0");
  };

  // 初始化表单状态
  const [newSubject, setNewSubject] = useState(() => {
    // 如果有父科目信息，初始化为明细科目
    if (parentCode && parentName) {
      const category = getCategoryByCode(parentCode);
      return {
        code: "",  // 编码稍后自动生成
        name: "",
        parentId: parentCode,
        parentName: `${parentCode} ${parentName}`,
        category: category,
        direction: parentDirection || getDirectionByCategory(category),
        status: "启用" as "启用" | "停用",
        // 辅助核算设置
        quantityAccounting: false,
        customerAccounting: false,
        supplierAccounting: false,
        departmentAccounting: false,
        employeeAccounting: false,
        projectAccounting: false,
        inventoryAccounting: false,
        fixedAssetAccounting: false,
        foreignCurrencyAccounting: false,
      };
    }
    // 否则初始化为一级科目（默认资产类，余额方向为借）
    return {
      code: "",
      name: "",
      parentId: "",
      parentName: "",
      category: "资产类",
      direction: "借" as "借" | "贷",
      status: "启用" as "启用" | "停用",
      // 辅助核算设置
      quantityAccounting: false,
      customerAccounting: false,
      supplierAccounting: false,
      departmentAccounting: false,
      employeeAccounting: false,
      projectAccounting: false,
      inventoryAccounting: false,
      fixedAssetAccounting: false,
      foreignCurrencyAccounting: false,
    };
  });

  // 根据当前科目编码判断适用的辅助核算类型
  const applicableAuxiliaryTypes = useMemo(() => {
    // 使用科目编码（如果有上级则用上级编码，否则用当前编码）
    const codeToCheck = newSubject.parentId || newSubject.code;
    if (!codeToCheck) return [];
    return getApplicableAuxiliaryTypes(codeToCheck);
  }, [newSubject.parentId, newSubject.code]);

  // 当有父科目时，自动生成编码
  useEffect(() => {
    if (newSubject.parentId && !newSubject.code) {
      const generatedCode = generateChildCode(newSubject.parentId);
      setNewSubject(prev => ({ ...prev, code: generatedCode }));
    }
  }, [newSubject.parentId, allSubjects]);

  // 搜索上级科目
  const filteredParents = useMemo(() => {
    if (!parentSearch) return allSubjects.slice(0, 50);
    return allSubjects.filter(s => 
      s.code.includes(parentSearch) || s.name.includes(parentSearch)
    ).slice(0, 50);
  }, [allSubjects, parentSearch]);

  // 选择上级科目
  const handleSelectParent = (code: string, name: string) => {
    const newCode = generateChildCode(code);
    const parent = allSubjects.find(s => s.code === code);

    setNewSubject({
      ...newSubject,
      parentId: code,
      parentName: `${code} ${name}`,
      code: newCode,
      category: getCategoryByCode(code),
      direction: parent?.direction || "借",
    });
    setShowParentDropdown(false);
    setParentSearch("");
  };

  // 清除上级科目
  const handleClearParent = () => {
    const defaultCategory = "资产类";
    setNewSubject({
      ...newSubject,
      parentId: "",
      parentName: "",
      code: "",
      category: defaultCategory,
      direction: getDirectionByCategory(defaultCategory),
      // 重置辅助核算
      quantityAccounting: false,
      customerAccounting: false,
      supplierAccounting: false,
      departmentAccounting: false,
      employeeAccounting: false,
      projectAccounting: false,
      inventoryAccounting: false,
      fixedAssetAccounting: false,
      foreignCurrencyAccounting: false,
    });
  };

  // 编码是否可编辑（没有上级科目时可编辑）
  const isCodeEditable = !newSubject.parentId;

  // 转换类别为中文字符串到英文类型
  const categoryToType = (category: string): "asset" | "liability" | "equity" | "cost" | "profit_loss" => {
    const typeMap: Record<string, "asset" | "liability" | "equity" | "cost" | "profit_loss"> = {
      "资产类": "asset",
      "负债类": "liability",
      "所有者权益类": "equity",
      "成本类": "cost",
      "损益类": "profit_loss",
    };
    return typeMap[category] || "asset";
  };

  // 验证表单
  const validateForm = (): boolean => {
    if (!newSubject.code.trim()) {
      toast({
        title: "验证失败",
        description: "请输入科目编码",
        variant: "destructive",
      });
      return false;
    }
    if (!newSubject.name.trim()) {
      toast({
        title: "验证失败",
        description: "请输入科目名称",
        variant: "destructive",
      });
      return false;
    }
    // 一级科目编码必须为4位
    if (!newSubject.parentId && newSubject.code.length !== 4) {
      toast({
        title: "验证失败",
        description: "一级科目编码必须为4位数字",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      const ledgerId = "default-ledger-id";
      
      const data: CreateSubjectData = {
        ledgerId,
        code: newSubject.code,
        name: newSubject.name,
        parentId: newSubject.parentId || null,
        type: categoryToType(newSubject.category),
        direction: newSubject.direction === "借" ? "debit" : "credit",
        isActive: newSubject.status === "启用",
      };
      
      const result = await createSubject(data);
      
      if (result.success) {
        toast({
          title: "保存成功",
          description: `科目「${newSubject.code} ${newSubject.name}」已创建`,
        });
        if (browserTabs) {
          browserTabs.closeTab(browserTabs.activeTabId);
        }
      } else {
        toast({
          title: "保存失败",
          description: result.error || "未知错误",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("保存科目失败:", error);
      toast({
        title: "保存失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      const ledgerId = "default-ledger-id";
      
      const data: CreateSubjectData = {
        ledgerId,
        code: newSubject.code,
        name: newSubject.name,
        parentId: newSubject.parentId || null,
        type: categoryToType(newSubject.category),
        direction: newSubject.direction === "借" ? "debit" : "credit",
        isActive: newSubject.status === "启用",
      };
      
      const result = await createSubject(data);
      
      if (result.success) {
        toast({
          title: "保存成功",
          description: `科目「${newSubject.code} ${newSubject.name}」已创建`,
        });
        // 重置表单，保留父科目信息以便继续添加
        if (newSubject.parentId) {
          const newCode = generateChildCode(newSubject.parentId);
          setNewSubject(prev => ({
            ...prev,
            code: newCode,
            name: "",
            // 保留辅助核算设置，方便连续添加同类科目
          }));
        } else {
          setNewSubject({
            code: "",
            name: "",
            parentId: "",
            parentName: "",
            category: "资产类",
            direction: "借",
            status: "启用",
            quantityAccounting: false,
            customerAccounting: false,
            supplierAccounting: false,
            departmentAccounting: false,
            employeeAccounting: false,
            projectAccounting: false,
            inventoryAccounting: false,
            fixedAssetAccounting: false,
            foreignCurrencyAccounting: false,
          });
        }
      } else {
        toast({
          title: "保存失败",
          description: result.error || "未知错误",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("保存科目失败:", error);
      toast({
        title: "保存失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      {/* 页面标题 */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 text-center">
        <h2 className="text-lg font-semibold text-slate-800">
          科目管理
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {newSubject.parentId 
            ? `在「${newSubject.parentName}」下新增明细科目` 
            : "添加新的一级科目或选择上级科目添加明细科目"}
        </p>
      </div>

      {/* 表单内容 */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* 基本信息卡片 */}
          <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100">
              <CardTitle className="text-sm font-medium text-slate-700">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* 科目类别 + 上级科目 - 左右对换 */}
              <div className="grid grid-cols-12 gap-4">
                {/* 左边：科目类别 */}
                <div className="col-span-6">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    科目类别
                  </label>
                  <div className="relative">
                    <select
                      value={newSubject.category}
                      onChange={(e) => {
                        const newCategory = e.target.value;
                        setNewSubject({ 
                          ...newSubject, 
                          category: newCategory,
                          direction: getDirectionByCategory(newCategory)
                        });
                      }}
                      className="w-full h-8 px-3 pr-8 text-sm border border-slate-200 rounded-md bg-white appearance-none focus:outline-none focus:border-amber-400"
                    >
                      <option value="资产类">资产类</option>
                      <option value="负债类">负债类</option>
                      <option value="所有者权益类">所有者权益类</option>
                      <option value="成本类">成本类</option>
                      <option value="损益类">损益类</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                {/* 右边：上级科目 */}
                <div className="col-span-6">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    上级科目
                  </label>
                  <div className="relative">
                    <div 
                      className="w-full h-8 px-3 pr-8 text-sm border border-slate-200 rounded-md bg-white flex items-center cursor-pointer hover:border-amber-400"
                      onClick={() => setShowParentDropdown(!showParentDropdown)}
                    >
                      {newSubject.parentName ? (
                        <span className="text-slate-700">{newSubject.parentName}</span>
                      ) : (
                        <span className="text-slate-400">点击选择上级科目（可选）</span>
                      )}
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    </div>
                    
                    {showParentDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-64 overflow-hidden">
                        <div className="p-2 border-b border-slate-100">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                              type="text"
                              value={parentSearch}
                              onChange={(e) => setParentSearch(e.target.value)}
                              placeholder="搜索科目编码或名称"
                              className="w-full h-7 pl-7 pr-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-amber-400"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {/* 清除选择 */}
                          {newSubject.parentId && (
                            <button
                              className="w-full text-left px-3 py-2 text-xs text-amber-600 hover:bg-amber-50"
                              onClick={handleClearParent}
                            >
                              清除选择（作为一级科目）
                            </button>
                          )}
                          {filteredParents.map((subject) => (
                            <button
                              key={subject.code}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 transition-colors"
                              onClick={() => handleSelectParent(subject.code, subject.name)}
                            >
                              <span className="font-mono text-slate-500">{subject.code}</span>
                              <span className="ml-2 text-slate-700">{subject.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 科目编码 + 科目名称 */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    <span className="text-red-500">*</span> 科目编码
                  </label>
                  <input
                    type="text"
                    value={newSubject.code}
                    onChange={(e) => {
                      const code = e.target.value;
                      // 一级科目：根据编码第一位自动设置类别和余额方向
                      if (!newSubject.parentId && code.length > 0) {
                        const category = getCategoryByCode(code);
                        const direction = getDirectionByCodeLocal(code);
                        setNewSubject({ ...newSubject, code, category, direction });
                      } else {
                        setNewSubject({ ...newSubject, code });
                      }
                    }}
                    placeholder={newSubject.parentId ? "自动生成" : "如：1001"}
                    disabled={!isCodeEditable}
                    maxLength={newSubject.parentId ? 6 : 4}
                    className={cn(
                      "w-full h-8 px-3 text-sm border border-slate-200 rounded-md bg-white",
                      !isCodeEditable && "bg-slate-50 text-slate-600 cursor-not-allowed"
                    )}
                  />
                  {newSubject.parentId && (
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      明细科目编码自动生成
                    </p>
                  )}
                </div>
                <div className="col-span-8">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    <span className="text-red-500">*</span> 科目名称
                  </label>
                  <input
                    type="text"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                    placeholder="请输入科目名称"
                    className="w-full h-8 px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 核算属性卡片 */}
          <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100">
              <CardTitle className="text-sm font-medium text-slate-700">核算属性</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* 余额方向 + 科目状态 */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6">
                  <label className="block text-xs font-medium text-slate-600 mb-2">
                    余额方向
                  </label>
                  <div className="flex items-center h-8">
                    <span className={cn(
                      "inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium",
                      newSubject.direction === "借" 
                        ? "bg-amber-100 text-amber-700" 
                        : "bg-emerald-100 text-emerald-700"
                    )}>
                      {newSubject.direction}
                    </span>
                    <span className="ml-2 text-xs text-slate-400">
                      (根据科目类别自动确定)
                    </span>
                  </div>
                </div>
                <div className="col-span-6">
                  <label className="block text-xs font-medium text-slate-600 mb-2">
                    科目状态
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="status"
                        checked={newSubject.status === "启用"}
                        onChange={() => setNewSubject({ ...newSubject, status: "启用" })}
                        className="w-4 h-4 text-amber-500 border-slate-300 focus:ring-amber-500"
                      />
                      <span className="text-sm text-slate-600 group-hover:text-slate-800">启用</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="status"
                        checked={newSubject.status === "停用"}
                        onChange={() => setNewSubject({ ...newSubject, status: "停用" })}
                        className="w-4 h-4 text-amber-500 border-slate-300 focus:ring-amber-500"
                      />
                      <span className="text-sm text-slate-600 group-hover:text-slate-800">停用</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 核算选项 - 根据科目类型智能显示 */}
              {(newSubject.code || newSubject.parentId) && (
                <div className="pt-3 border-t border-slate-100">
                  <label className="block text-xs font-medium text-slate-600 mb-3">
                    辅助核算
                    {applicableAuxiliaryTypes.length > 0 && (
                      <span className="font-normal text-slate-400 ml-1">（根据科目类型智能推荐）</span>
                    )}
                  </label>
                  <div className="space-y-3">
                    {/* 显示适用的辅助核算类型 */}
                    {applicableAuxiliaryTypes.map((type) => {
                      // 根据类型ID映射到状态字段
                      const stateKey = {
                        'quantity': 'quantityAccounting',
                        'customer': 'customerAccounting',
                        'supplier': 'supplierAccounting',
                        'department': 'departmentAccounting',
                        'employee': 'employeeAccounting',
                        'project': 'projectAccounting',
                        'inventory': 'inventoryAccounting',
                        'fixed_asset': 'fixedAssetAccounting',
                        'foreign_currency': 'foreignCurrencyAccounting',
                      }[type.id] as keyof typeof newSubject;
                      
                      const isChecked = newSubject[stateKey] as boolean;
                      
                      return (
                        <label key={type.id} className="flex items-start gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => setNewSubject({ ...newSubject, [stateKey]: e.target.checked })}
                            className="w-4 h-4 mt-0.5 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                          />
                          <div>
                            <span className="text-sm text-slate-700 group-hover:text-slate-800">
                              {type.name}
                            </span>
                            {type.isRecommended && (
                              <span className="ml-1.5 inline-flex items-center text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                <Sparkles className="h-3 w-3 mr-0.5" />
                                推荐
                              </span>
                            )}
                            <p className="text-xs text-slate-400 mt-0.5">{type.description}</p>
                          </div>
                        </label>
                      );
                    })}
                    {/* 无适用的辅助核算类型 */}
                    {applicableAuxiliaryTypes.length === 0 && (
                      <p className="text-sm text-slate-400 py-2">
                        当前科目类型暂不需要辅助核算
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="px-6 py-4 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-3">
          <Button 
            className="bg-amber-500 hover:bg-amber-600 text-white px-8"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            保存
          </Button>
          <Button 
            variant="outline" 
            className="px-8 border-amber-500 text-amber-600 hover:bg-amber-50"
            onClick={handleSaveAndNew}
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            保存并新增
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AddSubjectPage;
