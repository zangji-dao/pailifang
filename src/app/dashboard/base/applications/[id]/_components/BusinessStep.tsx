"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ApplicationFormData } from "../types";

interface BusinessStepProps {
  formData: ApplicationFormData;
  canEdit: boolean;
  updateField: (field: keyof ApplicationFormData, value: string) => void;
  onPrev: () => void;
}

export function BusinessStep({
  formData,
  canEdit,
  updateField,
  onPrev,
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

      {/* 步骤导航 */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onPrev}>
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          上一步：股东信息
        </Button>
        <div className="text-sm text-muted-foreground">第 5 步，共 5 步（最后一步）</div>
        <div className="w-24"></div>
      </div>
    </div>
  );
}
