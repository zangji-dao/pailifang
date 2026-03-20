"use client";

import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ApplicationFormData, ApplicationType } from "../types";

interface AddressStepProps {
  formData: ApplicationFormData;
  canEdit: boolean;
  updateField: (field: keyof ApplicationFormData, value: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function AddressStep({ 
  formData, 
  canEdit, 
  updateField,
  onPrev,
  onNext 
}: AddressStepProps) {
  const isMigration = formData.applicationType === "migration";
  const stepNumber = isMigration ? "2" : "1";

  return (
    <div className="space-y-6">
      {/* 迁移企业：迁移前地址 */}
      {isMigration && (
        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-base font-medium mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">1</span>
            迁移前地址
            <Badge variant="outline" className="ml-2 text-xs font-normal bg-amber-50 text-amber-700 border-amber-200">迁移企业必填</Badge>
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>原注册地址 <span className="text-destructive">*</span></Label>
              <Textarea
                value={formData.originalRegisteredAddress}
                onChange={(e) => updateField("originalRegisteredAddress", e.target.value)}
                placeholder="请输入原工商注册地址"
                rows={3}
                className="resize-none"
                disabled={!canEdit}
              />
              <p className="text-xs text-muted-foreground">迁移前的工商注册地址</p>
            </div>
            <div className="space-y-2">
              <Label>原实际经营地址</Label>
              <Textarea
                value={formData.businessAddress}
                onChange={(e) => updateField("businessAddress", e.target.value)}
                placeholder="请输入迁移前的实际经营地址"
                rows={3}
                className="resize-none"
                disabled={!canEdit}
              />
              <p className="text-xs text-muted-foreground">迁移前企业实际开展业务的地址</p>
            </div>
          </div>
        </div>
      )}

      {/* 邮寄地址 */}
      <div className="rounded-lg border bg-card p-5">
        <h3 className="text-base font-medium mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
            {stepNumber}
          </span>
          邮寄地址
        </h3>
        <div className="space-y-2">
          <Textarea
            value={formData.mailingAddress}
            onChange={(e) => updateField("mailingAddress", e.target.value)}
            placeholder="请输入邮寄地址，用于接收重要文件和通知"
            rows={3}
            className="resize-none"
            disabled={!canEdit}
          />
          <p className="text-xs text-muted-foreground">用于接收重要文件和通知</p>
        </div>
      </div>

      {/* 新建企业：实际经营地址提示 */}
      {formData.applicationType === "new" && (
        <div className="rounded-lg bg-muted/50 border border-dashed p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">实际经营地址</p>
              <p className="mt-1">新建企业的实际经营地址将在入园审批通过后，由系统根据分配的基地自动生成，无需填写。</p>
            </div>
          </div>
        </div>
      )}

      {/* 步骤导航 */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onPrev}>
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          上一步：基本信息
        </Button>
        <div className="text-sm text-muted-foreground">第 2 步，共 5 步</div>
        <Button type="button" onClick={onNext}>
          下一步：人员信息
          <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
