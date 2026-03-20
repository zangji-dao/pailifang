"use client";

import { AlertCircle, Plus, Trash2, Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { roleConfig } from "../constants";
import type { ApplicationFormData, Personnel } from "../types";

interface PersonnelStepProps {
  formData: ApplicationFormData;
  errors: Record<string, string>;
  canEdit: boolean;
  uploadingFiles: Record<string, boolean>;
  updateField: (field: keyof ApplicationFormData, value: string) => void;
  addPersonnel: () => void;
  removePersonnel: (index: number) => void;
  updatePersonnel: (index: number, field: keyof Personnel, value: string | string[]) => void;
  togglePersonnelRole: (index: number, role: string) => void;
  isRoleTakenByOthers: (currentIndex: number, role: string) => boolean;
  getRoleHolderIndex: (role: string) => number;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back', personnelIndex: number) => void;
  removeIdCard: (type: 'front' | 'back', personnelIndex: number) => void;
}

export function PersonnelStep({
  formData,
  errors,
  canEdit,
  uploadingFiles,
  updateField,
  addPersonnel,
  removePersonnel,
  updatePersonnel,
  togglePersonnelRole,
  isRoleTakenByOthers,
  getRoleHolderIndex,
  handleFileChange,
  removeIdCard,
}: PersonnelStepProps) {
  return (
    <div className="space-y-6">
      {/* 提示信息 */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">工商注册人员配置规则：</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>最少需要 <strong>2个人</strong>：法人代表、监事（必须分开）</li>
              <li>法人代表可以兼任财务负责人、实际联络人</li>
              <li>监事<strong>不能</strong>兼任法人代表或财务负责人</li>
            </ul>
          </div>
        </div>
      </div>

      {errors.personnel && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{errors.personnel}</span>
          </div>
        </div>
      )}

      {/* 人员列表 */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium">公司人员</h3>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={addPersonnel} className="gap-1">
            <Plus className="h-4 w-4" />
            添加人员
          </Button>
        )}
      </div>

      {formData.personnel.map((person, index) => (
        <div key={index} className="rounded-lg border bg-card overflow-hidden">
          {/* 人员头部 */}
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                {index + 1}
              </span>
              <span className="font-medium">{person.name || `人员 ${index + 1}`}</span>
              {person.roles.length > 0 && (
                <div className="flex gap-1">
                  {person.roles.map(role => (
                    <Badge key={role} variant="secondary" className="text-xs">
                      {roleConfig[role]?.label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {canEdit && formData.personnel.length > 2 && (
              <Button size="sm" variant="ghost" onClick={() => removePersonnel(index)} className="h-8 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="p-4 space-y-4">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>姓名 <span className="text-destructive">*</span></Label>
                <Input value={person.name} onChange={(e) => updatePersonnel(index, "name", e.target.value)} placeholder="请输入姓名" disabled={!canEdit} />
              </div>
              <div className="space-y-2">
                <Label>电话 <span className="text-destructive">*</span></Label>
                <Input value={person.phone} onChange={(e) => updatePersonnel(index, "phone", e.target.value)} placeholder="请输入电话" disabled={!canEdit} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>邮箱 <span className="text-destructive">*</span></Label>
                <Input type="email" value={person.email} onChange={(e) => updatePersonnel(index, "email", e.target.value)} placeholder="请输入邮箱" disabled={!canEdit} />
              </div>
              <div className="space-y-2">
                <Label>住址 <span className="text-destructive">*</span></Label>
                <Input value={person.address} onChange={(e) => updatePersonnel(index, "address", e.target.value)} placeholder="请输入住址" disabled={!canEdit} />
              </div>
            </div>

            {/* 职务选择 */}
            <div className="space-y-2">
              <Label>担任职务 <span className="text-destructive">*</span></Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(roleConfig).map(([role, config]) => {
                  const isSelected = person.roles.includes(role);
                  const isTakenByOther = isRoleTakenByOthers(index, role);
                  const hasConflict = 
                    (role === "supervisor" && (person.roles.includes("legal_person") || person.roles.includes("finance_manager"))) ||
                    (role === "legal_person" && person.roles.includes("supervisor")) ||
                    (role === "finance_manager" && person.roles.includes("supervisor"));
                  
                  // 已被其他人员选择的角色不显示（当前人员已选择的除外）
                  if (isTakenByOther && !isSelected) {
                    return null;
                  }

                  const isDisabled = !canEdit || hasConflict;

                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => !isDisabled && togglePersonnelRole(index, role)}
                      disabled={isDisabled}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                        isSelected ? "bg-primary/10 border-primary text-primary" : isDisabled ? "opacity-50 cursor-not-allowed bg-muted" : "hover:bg-muted/50"
                      )}
                    >
                      <div className={cn("w-4 h-4 rounded border flex items-center justify-center", isSelected ? "bg-primary border-primary" : "border-muted-foreground")}>
                        {isSelected && <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium">{config.label}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 身份证上传 */}
            <div className="space-y-3">
              <Label>身份证照片 <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-2 gap-6">
                {/* 正面 */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">正面（人像面）<span className="text-destructive">*</span></p>
                  {person.idCardFrontUrl ? (
                    <div className="relative group">
                      <div className="aspect-[1.58/1] rounded-lg border overflow-hidden bg-slate-100">
                        <img src={person.idCardFrontUrl} alt="身份证正面" className="w-full h-full object-contain" />
                      </div>
                      {canEdit && (
                        <button type="button" onClick={() => removeIdCard('front', index)} className="absolute -top-2 -right-2 p-1.5 rounded-full bg-destructive text-white hover:bg-destructive/90 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <label className={cn("flex flex-col items-center justify-center aspect-[1.58/1] rounded-lg border-2 border-dashed transition-all", canEdit ? "border-muted-foreground/25 hover:border-primary/50 cursor-pointer" : "border-muted-foreground/25 opacity-50 cursor-not-allowed")}>
                      {uploadingFiles[`${index}-front`] ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">上传中...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Upload className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <span className="text-sm text-muted-foreground">点击上传正面</span>
                        </div>
                      )}
                      <input type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" onChange={(e) => handleFileChange(e, 'front', index)} disabled={!canEdit || uploadingFiles[`${index}-front`]} />
                    </label>
                  )}
                </div>
                {/* 反面 */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">反面（国徽面）<span className="text-destructive">*</span></p>
                  {person.idCardBackUrl ? (
                    <div className="relative group">
                      <div className="aspect-[1.58/1] rounded-lg border overflow-hidden bg-slate-100">
                        <img src={person.idCardBackUrl} alt="身份证反面" className="w-full h-full object-contain" />
                      </div>
                      {canEdit && (
                        <button type="button" onClick={() => removeIdCard('back', index)} className="absolute -top-2 -right-2 p-1.5 rounded-full bg-destructive text-white hover:bg-destructive/90 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <label className={cn("flex flex-col items-center justify-center aspect-[1.58/1] rounded-lg border-2 border-dashed transition-all", canEdit ? "border-muted-foreground/25 hover:border-primary/50 cursor-pointer" : "border-muted-foreground/25 opacity-50 cursor-not-allowed")}>
                      {uploadingFiles[`${index}-back`] ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">上传中...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Upload className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <span className="text-sm text-muted-foreground">点击上传反面</span>
                        </div>
                      )}
                      <input type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" onChange={(e) => handleFileChange(e, 'back', index)} disabled={!canEdit || uploadingFiles[`${index}-back`]} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* 中介人信息 */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
            {formData.personnel.length + 1}
          </span>
          中介人信息
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>所在部门</Label>
            <Input value={formData.intermediaryDepartment} onChange={(e) => updateField("intermediaryDepartment", e.target.value)} placeholder="请输入所在部门" disabled={!canEdit} />
          </div>
          <div className="space-y-2">
            <Label>姓名</Label>
            <Input value={formData.intermediaryName} onChange={(e) => updateField("intermediaryName", e.target.value)} placeholder="请输入姓名" disabled={!canEdit} />
          </div>
          <div className="space-y-2">
            <Label>电话</Label>
            <Input value={formData.intermediaryPhone} onChange={(e) => updateField("intermediaryPhone", e.target.value)} placeholder="请输入电话" disabled={!canEdit} />
          </div>
        </div>
      </div>
    </div>
  );
}
