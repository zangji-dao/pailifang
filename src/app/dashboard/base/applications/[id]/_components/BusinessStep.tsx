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
    <div className="space-y-4">
      {/* 经营范围 */}
      <div className="space-y-2">
        <Label>经营范围 <span className="text-destructive">*</span></Label>
        <Textarea
          value={formData.businessScope || ""}
          onChange={(e) => updateField("businessScope", e.target.value)}
          placeholder="请输入经营范围，例如：技术开发、技术咨询、技术服务"
          rows={5}
          disabled={!canEdit}
        />
        <p className="text-xs text-muted-foreground">请详细描述企业的经营范围，将用于工商注册</p>
      </div>
    </div>
  );
}
