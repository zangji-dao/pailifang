"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ApplicationFormData } from "../types";

interface BusinessStepProps {
  formData: ApplicationFormData;
  canEdit: boolean;
  updateField: (field: keyof ApplicationFormData, value: string) => void;
}

export function BusinessStep({
  formData,
  canEdit,
  updateField,
}: BusinessStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>经营范围</Label>
        <Textarea
          value={formData.businessScope}
          onChange={(e) => updateField("businessScope", e.target.value)}
          placeholder="请输入经营范围"
          rows={8}
          disabled={!canEdit}
        />
      </div>

      <div className="space-y-2">
        <Label>备注</Label>
        <Textarea
          value={formData.remarks}
          onChange={(e) => updateField("remarks", e.target.value)}
          placeholder="请输入备注信息"
          rows={3}
          disabled={!canEdit}
        />
      </div>
    </div>
  );
}
