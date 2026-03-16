"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  Save,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrowserTabs } from "@/components/browser-tabs";

/**
 * 辅助核算档案编辑页面
 */

// 字段配置
interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "select" | "textarea";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  colSpan?: 1 | 2 | 3;
}

// 字段分组配置
interface FieldGroup {
  title: string;
  fields: FieldConfig[];
}

// 不同类型的字段配置
const FIELD_GROUPS: Record<string, FieldGroup[]> = {
  customer: [
    {
      title: "基本信息",
      fields: [
        { key: "code", label: "客户编码", type: "text", required: true, placeholder: "请输入编码" },
        { key: "name", label: "客户名称", type: "text", required: true, placeholder: "请输入名称", colSpan: 2 },
        { key: "category", label: "客户类别", type: "select", options: [
          { value: "一般纳税人", label: "一般纳税人" },
          { value: "小规模纳税人", label: "小规模纳税人" },
          { value: "个人", label: "个人" },
        ]},
      ],
    },
    {
      title: "企业信息",
      fields: [
        { key: "creditCode", label: "统一社会信用代码", type: "text", placeholder: "18位统一社会信用代码", colSpan: 2 },
        { key: "address", label: "经营地址", type: "text", placeholder: "请输入详细地址", colSpan: 3 },
      ],
    },
    {
      title: "联系方式",
      fields: [
        { key: "contact", label: "联系人", type: "text", placeholder: "联系人姓名" },
        { key: "phone", label: "手机号码", type: "text", placeholder: "手机号码" },
        { key: "bankName", label: "开户银行", type: "text", placeholder: "银行名称" },
        { key: "bankAccount", label: "银行账号", type: "text", placeholder: "银行账号", colSpan: 2 },
      ],
    },
  ],
  supplier: [
    {
      title: "基本信息",
      fields: [
        { key: "code", label: "供应商编码", type: "text", required: true, placeholder: "请输入编码" },
        { key: "name", label: "供应商名称", type: "text", required: true, placeholder: "请输入名称", colSpan: 2 },
        { key: "category", label: "类别", type: "select", options: [
          { value: "一般纳税人", label: "一般纳税人" },
          { value: "小规模纳税人", label: "小规模纳税人" },
          { value: "个人", label: "个人" },
        ]},
      ],
    },
    {
      title: "企业信息",
      fields: [
        { key: "creditCode", label: "统一社会信用代码", type: "text", placeholder: "18位统一社会信用代码", colSpan: 2 },
        { key: "address", label: "地址", type: "text", placeholder: "请输入地址", colSpan: 3 },
        { key: "bankName", label: "开户银行", type: "text", placeholder: "银行名称" },
        { key: "bankAccount", label: "银行账号", type: "text", placeholder: "银行账号" },
      ],
    },
    {
      title: "联系方式",
      fields: [
        { key: "contact", label: "联系人", type: "text", placeholder: "联系人姓名" },
        { key: "phone", label: "手机号码", type: "text", placeholder: "手机号码" },
      ],
    },
  ],
  department: [
    {
      title: "部门信息",
      fields: [
        { key: "code", label: "部门编码", type: "text", required: true, placeholder: "如：01" },
        { key: "name", label: "部门名称", type: "text", required: true, placeholder: "请输入部门名称" },
      ],
    },
  ],
  employee: [
    {
      title: "基本信息",
      fields: [
        { key: "code", label: "职员编码", type: "text", required: true, placeholder: "如：E001" },
        { key: "name", label: "职员姓名", type: "text", required: true, placeholder: "请输入姓名" },
        { key: "department", label: "所属部门", type: "select", options: [
          { value: "总经办", label: "总经办" },
          { value: "财务部", label: "财务部" },
          { value: "销售部", label: "销售部" },
          { value: "行政部", label: "行政部" },
          { value: "技术部", label: "技术部" },
        ]},
        { key: "phone", label: "手机号码", type: "text", placeholder: "手机号码" },
      ],
    },
  ],
  project: [
    {
      title: "项目信息",
      fields: [
        { key: "code", label: "项目编码", type: "text", required: true, placeholder: "如：P001" },
        { key: "name", label: "项目名称", type: "text", required: true, placeholder: "请输入项目名称", colSpan: 2 },
        { key: "startDate", label: "开始日期", type: "text", placeholder: "2026-01-01" },
        { key: "endDate", label: "结束日期", type: "text", placeholder: "2026-12-31" },
      ],
    },
  ],
  inventory: [
    {
      title: "存货信息",
      fields: [
        { key: "code", label: "存货编码", type: "text", required: true, placeholder: "如：INV001" },
        { key: "name", label: "存货名称", type: "text", required: true, placeholder: "请输入存货名称" },
        { key: "spec", label: "规格型号", type: "text", placeholder: "规格型号" },
        { key: "unit", label: "计量单位", type: "text", placeholder: "如：个、件、公斤" },
      ],
    },
  ],
  fixed_asset: [
    {
      title: "资产信息",
      fields: [
        { key: "code", label: "资产编码", type: "text", required: true, placeholder: "如：FA001" },
        { key: "name", label: "资产名称", type: "text", required: true, placeholder: "请输入资产名称" },
        { key: "category", label: "资产类别", type: "select", options: [
          { value: "房屋建筑物", label: "房屋建筑物" },
          { value: "机器设备", label: "机器设备" },
          { value: "运输设备", label: "运输设备" },
          { value: "电子设备", label: "电子设备" },
          { value: "其他", label: "其他" },
        ]},
        { key: "purchaseDate", label: "购置日期", type: "text", placeholder: "2026-01-01" },
      ],
    },
  ],
  partner: [
    {
      title: "单位信息",
      fields: [
        { key: "code", label: "单位编码", type: "text", required: true, placeholder: "请输入编码" },
        { key: "name", label: "单位名称", type: "text", required: true, placeholder: "请输入名称", colSpan: 2 },
        { key: "category", label: "单位类别", type: "select", options: [
          { value: "客户", label: "客户" },
          { value: "供应商", label: "供应商" },
          { value: "客户兼供应商", label: "客户兼供应商" },
        ]},
        { key: "creditCode", label: "统一社会信用代码", type: "text", placeholder: "18位统一社会信用代码", colSpan: 2 },
        { key: "contact", label: "联系人", type: "text", placeholder: "联系人姓名" },
        { key: "phone", label: "手机号码", type: "text", placeholder: "手机号码" },
      ],
    },
  ],
};

const TYPE_NAMES: Record<string, string> = {
  customer: "客户",
  supplier: "供应商",
  department: "部门",
  employee: "职员",
  project: "项目",
  inventory: "存货",
  fixed_asset: "固定资产",
  partner: "往来单位",
};

interface AuxiliaryEditPageProps {
  typeId: string;
  itemId?: string;
  initialData?: Record<string, string>;
}

export function AuxiliaryEditPage({ typeId, itemId, initialData }: AuxiliaryEditPageProps) {
  const browserTabs = useBrowserTabs();
  const fieldGroups = FIELD_GROUPS[typeId] || [];
  const typeName = TYPE_NAMES[typeId] || "档案";
  const isEdit = !!itemId;

  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const data: Record<string, string> = { status: "启用" };
    fieldGroups.forEach(group => {
      group.fields.forEach(field => {
        data[field.key] = initialData?.[field.key] || "";
      });
    });
    return data;
  });

  const [isSaving, setIsSaving] = useState(false);

  const updateFormField = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    for (const group of fieldGroups) {
      const requiredField = group.fields.find(f => f.required && !formData[f.key]?.trim());
      if (requiredField) {
        alert(`请填写${requiredField.label}`);
        return;
      }
    }

    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSaving(false);

    if (browserTabs) {
      browserTabs.closeTab(browserTabs.activeTabId);
    }
  };

  const handleBack = () => {
    if (browserTabs) {
      browserTabs.closeTab(browserTabs.activeTabId);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 顶部标题栏 */}
      <div className="border-b border-slate-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">返回列表</span>
          </button>
          <h1 className="text-lg font-semibold text-slate-800">
            {isEdit ? `编辑${typeName}` : `新增${typeName}`}
          </h1>
          <div className="w-20" />
        </div>
      </div>

      {/* 表单内容区 */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {fieldGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="mb-8">
              {/* 分组标题 */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-amber-600">{group.title}</h3>
              </div>
              
              {/* 字段网格 - 三列布局 */}
              <div className="grid grid-cols-3 gap-x-8 gap-y-4">
                {group.fields.map((field) => (
                  <div key={field.key} className={cn(
                    field.colSpan === 2 && "col-span-2",
                    field.colSpan === 3 && "col-span-3"
                  )}>
                    <label className="block text-sm text-slate-600 mb-1.5">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    {field.type === "text" && (
                      <input
                        type="text"
                        value={formData[field.key] || ""}
                        onChange={(e) => updateFormField(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full h-10 px-3 text-sm border border-slate-200 rounded-md bg-white hover:border-slate-300 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                      />
                    )}
                    {field.type === "select" && (
                      <select
                        value={formData[field.key] || ""}
                        onChange={(e) => updateFormField(field.key, e.target.value)}
                        className="w-full h-10 px-3 text-sm border border-slate-200 rounded-md bg-white hover:border-slate-300 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors appearance-none cursor-pointer"
                      >
                        <option value="">请选择</option>
                        {field.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    )}
                    {field.type === "textarea" && (
                      <textarea
                        value={formData[field.key] || ""}
                        onChange={(e) => updateFormField(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white hover:border-slate-300 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors resize-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* 状态设置 */}
          <div className="mb-8">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-amber-600">状态设置</h3>
            </div>
            <div className="flex items-center gap-8">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={formData.status === "启用"}
                  onChange={() => updateFormField("status", "启用")}
                  className="w-4 h-4 text-amber-500 border-slate-300 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-600">启用</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={formData.status === "停用"}
                  onChange={() => updateFormField("status", "停用")}
                  className="w-4 h-4 text-slate-400 border-slate-300 focus:ring-slate-400"
                />
                <span className="text-sm text-slate-600">停用</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 底部按钮栏 */}
      <div className="border-t border-slate-200 px-8 py-4 bg-slate-50">
        <div className="flex items-center justify-center gap-4">
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white px-8 h-10"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="px-8 h-10 border-slate-300 text-slate-600 hover:bg-white"
            onClick={handleBack}
          >
            <X className="h-4 w-4 mr-2" />
            取消
          </Button>
        </div>
      </div>
    </div>
  );
}
