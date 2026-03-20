"use client";

import { Plus, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ApplicationFormData, TaxType, ApplicationType } from "../types";

interface BasicInfoStepProps {
  formData: ApplicationFormData;
  errors: Record<string, string>;
  canEdit: boolean;
  updateField: (field: keyof ApplicationFormData, value: string | string[]) => void;
}

export function BasicInfoStep({ 
  formData, 
  errors, 
  canEdit, 
  updateField,
}: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      {/* 企业名称 */}
      <div className="rounded-lg border bg-card p-5">
        <h3 className="text-base font-medium mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">1</span>
          企业名称
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>
              申请名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={formData.enterpriseName}
              onChange={(e) => updateField("enterpriseName", e.target.value)}
              placeholder="请输入企业名称"
              disabled={!canEdit}
            />
            {errors.enterpriseName && (
              <p className="text-xs text-destructive">{errors.enterpriseName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              备用名
              <span className="text-xs text-muted-foreground font-normal">(可选)</span>
            </Label>
            <div className="space-y-2">
              {formData.enterpriseNameBackups && formData.enterpriseNameBackups.length > 0 ? (
                <>
                  {formData.enterpriseNameBackups.map((backup, index) => (
                    <div key={index} className="flex items-center gap-2 group">
                      <span className="text-xs text-muted-foreground w-6 shrink-0">{index + 1}.</span>
                      <Input
                        value={backup}
                        onChange={(e) => {
                          const newBackups = [...formData.enterpriseNameBackups];
                          newBackups[index] = e.target.value;
                          updateField("enterpriseNameBackups", newBackups);
                        }}
                        placeholder={`请输入备用名 ${index + 1}`}
                        className="flex-1 h-8"
                        disabled={!canEdit}
                      />
                      {canEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            const newBackups = formData.enterpriseNameBackups.filter((_, i) => i !== index);
                            updateField("enterpriseNameBackups", newBackups);
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {canEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full h-8 border-dashed text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        const backups = [...(formData.enterpriseNameBackups || []), ""];
                        updateField("enterpriseNameBackups", backups);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      继续添加
                    </Button>
                  )}
                </>
              ) : (
                canEdit ? (
                  <button
                    type="button"
                    className="w-full h-9 rounded-md border border-dashed border-muted-foreground/30 bg-transparent hover:border-primary/50 hover:bg-muted/50 transition-colors flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      const backups = [...(formData.enterpriseNameBackups || []), ""];
                      updateField("enterpriseNameBackups", backups);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    添加备用名
                  </button>
                ) : (
                  <p className="text-sm text-muted-foreground">暂无备用名</p>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 注册信息 */}
      <div className="rounded-lg border bg-card p-5">
        <h3 className="text-base font-medium mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">2</span>
          注册信息
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>注册资金 <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input
                type="number"
                value={formData.registeredCapital}
                onChange={(e) => updateField("registeredCapital", e.target.value)}
                placeholder="2000"
                className="pr-12"
                disabled={!canEdit}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">万元</span>
            </div>
            {errors.registeredCapital && <p className="text-xs text-destructive">{errors.registeredCapital}</p>}
          </div>
          <div className="space-y-2">
            <Label>币种 <span className="text-destructive">*</span></Label>
            <Select value={formData.currencyType} onValueChange={(v) => updateField("currencyType", v)} disabled={!canEdit}>
              <SelectTrigger><SelectValue placeholder="选择币种" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CNY">人民币</SelectItem>
                <SelectItem value="USD">美元</SelectItem>
                <SelectItem value="EUR">欧元</SelectItem>
              </SelectContent>
            </Select>
            {errors.currencyType && <p className="text-xs text-destructive">{errors.currencyType}</p>}
          </div>
          <div className="space-y-2">
            <Label>缴税类型 <span className="text-destructive">*</span></Label>
            <Select value={formData.taxType} onValueChange={(v) => updateField("taxType", v as TaxType)} disabled={!canEdit}>
              <SelectTrigger><SelectValue placeholder="选择缴税类型" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">一般纳税人</SelectItem>
                <SelectItem value="small_scale">小规模</SelectItem>
              </SelectContent>
            </Select>
            {errors.taxType && <p className="text-xs text-destructive">{errors.taxType}</p>}
          </div>
          <div className="space-y-2">
            <Label>申请类型 <span className="text-destructive">*</span></Label>
            <Select value={formData.applicationType} onValueChange={(v) => updateField("applicationType", v as ApplicationType)} disabled={!canEdit}>
              <SelectTrigger><SelectValue placeholder="选择申请类型" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new">新建企业</SelectItem>
                <SelectItem value="migration">迁移企业</SelectItem>
              </SelectContent>
            </Select>
            {errors.applicationType && <p className="text-xs text-destructive">{errors.applicationType}</p>}
          </div>
        </div>
      </div>

      {/* 预计经营数据 */}
      <div className="rounded-lg border bg-card p-5">
        <h3 className="text-base font-medium mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">3</span>
          预计经营数据
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>预计主营收入 <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input
                type="number"
                value={formData.expectedAnnualRevenue}
                onChange={(e) => updateField("expectedAnnualRevenue", e.target.value)}
                placeholder="2000"
                className="pr-16"
                disabled={!canEdit}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">万元/年</span>
            </div>
            {errors.expectedAnnualRevenue && <p className="text-xs text-destructive">{errors.expectedAnnualRevenue}</p>}
          </div>
          <div className="space-y-2">
            <Label>预计全口径税收 <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input
                type="number"
                value={formData.expectedAnnualTax}
                onChange={(e) => updateField("expectedAnnualTax", e.target.value)}
                placeholder="200"
                className="pr-16"
                disabled={!canEdit}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">万元/年</span>
            </div>
            {errors.expectedAnnualTax && <p className="text-xs text-destructive">{errors.expectedAnnualTax}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
