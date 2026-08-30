"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ApplicationFormData } from "../types";

interface BusinessStepProps {
  formData: ApplicationFormData;
  canEdit: boolean;
  updateField: (field: keyof ApplicationFormData, value: string | string[]) => void;
}

export function BusinessStep({
  formData,
  canEdit,
  updateField,
}: BusinessStepProps) {
  return (
    <div className="form-section space-y-4">
      <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
        <span className="step-number step-number-5">5</span>
        经营信息
      </h3>
      {/* 经营范围 */}
      <div className="space-y-2">
        <Label>经营范围 <span className="text-destructive">*</span></Label>
        <Textarea
          value={formData.businessScope || ""}
          onChange={(e) => updateField("businessScope", e.target.value)}
          placeholder="请输入经营范围，例如：技术开发、技术咨询、技术服务"
          rows={5}
          disabled={!canEdit}
          className="min-h-40 rounded-xl border-slate-200 bg-white p-3 text-sm leading-6"
        />
        <p className="text-xs text-muted-foreground">请详细描述企业的经营范围，将用于工商注册</p>
      </div>
    </div>
  );
}
