"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { currencyOptions, taxTypeOptions, applicationTypeOptions } from "../types";
import type { FormData } from "../types";

interface BasicStepProps {
  formData: FormData;
  errors: Record<string, string>;
  updateField: (field: keyof FormData, value: string | string[]) => void;
}

export function BasicStep({ formData, errors, updateField }: BasicStepProps) {
  return (
    <div className="space-y-6">
      {/* 企业名称 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-base font-medium mb-4 text-gray-900">企业名称</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-700">
              申请名称 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.enterpriseName}
              onChange={(e) => updateField("enterpriseName", e.target.value)}
              placeholder="请输入企业名称"
              className="h-11"
            />
            {errors.enterpriseName && (
              <p className="text-xs text-red-500">{errors.enterpriseName}</p>
            )}
          </div>

          {/* 备用名列表 */}
          {formData.enterpriseNameBackups && formData.enterpriseNameBackups.length > 0 && (
            <div className="space-y-2">
              <Label className="text-gray-700">备用名称</Label>
              {formData.enterpriseNameBackups.map((backup, index) => (
                <Input
                  key={index}
                  value={backup}
                  onChange={(e) => {
                    const newBackups = [...formData.enterpriseNameBackups];
                    newBackups[index] = e.target.value;
                    updateField("enterpriseNameBackups", newBackups);
                  }}
                  placeholder={`备用名 ${index + 1}`}
                  className="h-11"
                />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              const backups = [...(formData.enterpriseNameBackups || []), ""];
              updateField("enterpriseNameBackups", backups);
            }}
            className="text-sm text-primary font-medium"
          >
            + 添加备用名称
          </button>
        </div>
      </div>

      {/* 注册信息 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-base font-medium mb-4 text-gray-900">注册信息</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700">注册资本</Label>
              <Input
                value={formData.registeredCapital}
                onChange={(e) => updateField("registeredCapital", e.target.value)}
                placeholder="请输入金额"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">币种</Label>
              <Select
                value={formData.currencyType}
                onValueChange={(value) => updateField("currencyType", value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700">
              纳税人类型 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.taxType}
              onValueChange={(value) => updateField("taxType", value)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="请选择纳税人类型" />
              </SelectTrigger>
              <SelectContent>
                {taxTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.taxType && (
              <p className="text-xs text-red-500">{errors.taxType}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700">
              申请类型 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.applicationType}
              onValueChange={(value) => updateField("applicationType", value)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="请选择申请类型" />
              </SelectTrigger>
              <SelectContent>
                {applicationTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.applicationType && (
              <p className="text-xs text-red-500">{errors.applicationType}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700">预计年营收</Label>
              <Input
                value={formData.expectedAnnualRevenue}
                onChange={(e) => updateField("expectedAnnualRevenue", e.target.value)}
                placeholder="请输入"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">预计年纳税</Label>
              <Input
                value={formData.expectedAnnualTax}
                onChange={(e) => updateField("expectedAnnualTax", e.target.value)}
                placeholder="请输入"
                className="h-11"
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
