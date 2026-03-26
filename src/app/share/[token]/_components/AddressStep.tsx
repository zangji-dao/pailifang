"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FormData } from "../types";

interface AddressStepProps {
  formData: FormData;
  errors: Record<string, string>;
  updateField: (field: keyof FormData, value: string | string[]) => void;
}

export function AddressStep({ formData, errors, updateField }: AddressStepProps) {
  return (
    <div className="space-y-6">
      {/* 原注册地址 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-base font-medium mb-4 text-gray-900">原注册地址</h3>
        <p className="text-xs text-gray-500 mb-4">如果是迁移业务，请填写原注册地址</p>
        <div className="space-y-2">
          <Textarea
            value={formData.originalRegisteredAddress || ""}
            onChange={(e) => updateField("originalRegisteredAddress", e.target.value)}
            placeholder="请输入原注册地址（如有）"
            rows={3}
          />
        </div>
      </div>

      {/* 邮寄地址 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-base font-medium mb-4 text-gray-900">邮寄地址</h3>
        <div className="space-y-2">
          <Textarea
            value={formData.mailingAddress || ""}
            onChange={(e) => updateField("mailingAddress", e.target.value)}
            placeholder="请输入邮寄地址"
            rows={3}
          />
        </div>
      </div>

      {/* 经营地址 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-base font-medium mb-4 text-gray-900">经营地址</h3>
        <p className="text-xs text-gray-500 mb-4">实际办公地址（如有）</p>
        <div className="space-y-2">
          <Textarea
            value={formData.businessAddress || ""}
            onChange={(e) => updateField("businessAddress", e.target.value)}
            placeholder="请输入经营地址（如有）"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
