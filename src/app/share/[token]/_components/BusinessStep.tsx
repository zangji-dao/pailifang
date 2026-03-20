"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FormData } from "../types";

interface BusinessStepProps {
  formData: FormData;
  errors: Record<string, string>;
  updateField: (field: keyof FormData, value: string | string[]) => void;
}

export function BusinessStep({ formData, errors, updateField }: BusinessStepProps) {
  return (
    <div className="space-y-6">
      {/* e窗通联系人 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-base font-medium mb-4 text-gray-900">e窗通联系人</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-700">联系人姓名</Label>
            <Input
              value={formData.ewtContactName}
              onChange={(e) => updateField("ewtContactName", e.target.value)}
              placeholder="请输入姓名"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-700">联系人电话</Label>
            <Input
              value={formData.ewtContactPhone}
              onChange={(e) => updateField("ewtContactPhone", e.target.value)}
              placeholder="请输入电话"
              className="h-11"
            />
          </div>
        </div>
      </div>

      {/* 中介信息 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-base font-medium mb-4 text-gray-900">中介信息（可选）</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-700">中介机构</Label>
            <Input
              value={formData.intermediaryDepartment}
              onChange={(e) => updateField("intermediaryDepartment", e.target.value)}
              placeholder="请输入中介机构名称"
              className="h-11"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700">经办人姓名</Label>
              <Input
                value={formData.intermediaryName}
                onChange={(e) => updateField("intermediaryName", e.target.value)}
                placeholder="请输入姓名"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">经办人电话</Label>
              <Input
                value={formData.intermediaryPhone}
                onChange={(e) => updateField("intermediaryPhone", e.target.value)}
                placeholder="请输入电话"
                className="h-11"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 经营范围 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-base font-medium mb-4 text-gray-900">经营范围</h3>
        <div className="space-y-2">
          <Textarea
            value={formData.businessScope}
            onChange={(e) => updateField("businessScope", e.target.value)}
            placeholder="请输入经营范围"
            rows={5}
          />
          <p className="text-xs text-gray-500">请详细描述企业的经营范围，将用于工商注册</p>
        </div>
      </div>

      {/* 备注 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-base font-medium mb-4 text-gray-900">备注（可选）</h3>
        <div className="space-y-2">
          <Textarea
            value={formData.remarks}
            onChange={(e) => updateField("remarks", e.target.value)}
            placeholder="如有其他需要说明的事项，请在此填写"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
