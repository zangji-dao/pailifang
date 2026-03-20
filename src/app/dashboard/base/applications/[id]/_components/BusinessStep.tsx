"use client";

import { Label } from "@/components/ui/label";
import { BusinessScopeSelector } from "./BusinessScopeSelector";
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
  // 处理经营范围选择变化
  const handleScopeChange = (ids: string[], names: string[]) => {
    updateField("businessScopeIds", ids);
    updateField("businessScope", names.join("、"));
  };

  return (
    <div className="space-y-4">
      {/* 经营范围选择器 */}
      <div className="space-y-2">
        <Label>经营范围 <span className="text-destructive">*</span></Label>
        <BusinessScopeSelector
          selectedIds={formData.businessScopeIds || []}
          onChange={handleScopeChange}
          disabled={!canEdit}
        />
      </div>
    </div>
  );
}
