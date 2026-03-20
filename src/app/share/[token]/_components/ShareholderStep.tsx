"use client";

import { Plus, X, Upload, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FormData, Shareholder, ShareholderType } from "../types";

interface ShareholderStepProps {
  formData: FormData;
  errors: Record<string, string>;
  addShareholder: () => void;
  removeShareholder: (index: number) => void;
  updateShareholder: (index: number, field: keyof Shareholder, value: string) => void;
  handleFileChange: (
    index: number,
    fileType: "idCardFront" | "idCardBack" | "licenseOriginal" | "licenseCopy",
    file: File
  ) => void;
  removeFile: (
    index: number,
    fileType: "idCardFront" | "idCardBack" | "licenseOriginal" | "licenseCopy"
  ) => void;
  uploadingFiles: Record<string, boolean>;
}

export function ShareholderStep({
  formData,
  errors,
  addShareholder,
  removeShareholder,
  updateShareholder,
  handleFileChange,
  removeFile,
  uploadingFiles,
}: ShareholderStepProps) {
  return (
    <div className="space-y-4">
      {/* 股东列表 */}
      {formData.shareholders.map((shareholder, index) => (
        <div key={index} className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-gray-900">
              股东 {index + 1}
              <span className="ml-2 text-xs text-gray-500 font-normal">
                ({shareholder.type === "natural" ? "自然人" : "企业"})
              </span>
            </h3>
            {formData.shareholders.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeShareholder(index)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* 股东类型 */}
          <div className="mb-4">
            <Label className="text-gray-700 mb-2 block">股东类型</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateShareholder(index, "type", "natural")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  shareholder.type === "natural"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                自然人
              </button>
              <button
                type="button"
                onClick={() => updateShareholder(index, "type", "enterprise")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  shareholder.type === "enterprise"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                企业
              </button>
            </div>
          </div>

          {/* 基本信息 */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">
                  {shareholder.type === "natural" ? "姓名" : "企业名称"}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={shareholder.name}
                  onChange={(e) => updateShareholder(index, "name", e.target.value)}
                  placeholder={shareholder.type === "natural" ? "请输入姓名" : "请输入企业名称"}
                  className="h-11"
                />
                {errors[`shareholder_${index}_name`] && (
                  <p className="text-xs text-red-500">{errors[`shareholder_${index}_name`]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">
                  联系电话 <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={shareholder.phone}
                  onChange={(e) => updateShareholder(index, "phone", e.target.value)}
                  placeholder="请输入电话"
                  className="h-11"
                />
                {errors[`shareholder_${index}_phone`] && (
                  <p className="text-xs text-red-500">{errors[`shareholder_${index}_phone`]}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">
                出资额 <span className="text-red-500">*</span>
              </Label>
              <Input
                value={shareholder.investment}
                onChange={(e) => updateShareholder(index, "investment", e.target.value)}
                placeholder="请输入出资额"
                className="h-11"
              />
              {errors[`shareholder_${index}_investment`] && (
                <p className="text-xs text-red-500">{errors[`shareholder_${index}_investment`]}</p>
              )}
            </div>

            {/* 自然人股东 - 身份证上传 */}
            {shareholder.type === "natural" && (
              <div className="space-y-2">
                <Label className="text-gray-700">
                  身份证 <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  {/* 正面 */}
                  <div className="relative">
                    {shareholder.idCardFrontUrl ? (
                      <div className="relative aspect-[1.58] rounded-lg overflow-hidden border-2 border-primary">
                        <img
                          src={shareholder.idCardFrontUrl}
                          alt="身份证正面"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index, "idCardFront")}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center aspect-[1.58] rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-primary transition-colors">
                        {uploadingFiles[`idCardFront_${index}`] ? (
                          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                        ) : (
                          <Upload className="w-6 h-6 text-gray-400" />
                        )}
                        <span className="text-xs text-gray-500 mt-1">正面</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileChange(index, "idCardFront", file);
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* 背面 */}
                  <div className="relative">
                    {shareholder.idCardBackUrl ? (
                      <div className="relative aspect-[1.58] rounded-lg overflow-hidden border-2 border-primary">
                        <img
                          src={shareholder.idCardBackUrl}
                          alt="身份证背面"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index, "idCardBack")}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center aspect-[1.58] rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-primary transition-colors">
                        {uploadingFiles[`idCardBack_${index}`] ? (
                          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                        ) : (
                          <Upload className="w-6 h-6 text-gray-400" />
                        )}
                        <span className="text-xs text-gray-500 mt-1">背面</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileChange(index, "idCardBack", file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
                {(errors[`shareholder_${index}_idCardFront`] || errors[`shareholder_${index}_idCardBack`]) && (
                  <p className="text-xs text-red-500">
                    {errors[`shareholder_${index}_idCardFront`] || errors[`shareholder_${index}_idCardBack`]}
                  </p>
                )}
              </div>
            )}

            {/* 企业股东 - 营业执照上传 */}
            {shareholder.type === "enterprise" && (
              <div className="space-y-2">
                <Label className="text-gray-700">
                  营业执照 <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  {/* 正本 */}
                  <div className="relative">
                    {shareholder.licenseOriginalUrl ? (
                      <div className="relative aspect-[1.41] rounded-lg overflow-hidden border-2 border-primary">
                        <img
                          src={shareholder.licenseOriginalUrl}
                          alt="营业执照正本"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index, "licenseOriginal")}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center aspect-[1.41] rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-primary transition-colors">
                        {uploadingFiles[`licenseOriginal_${index}`] ? (
                          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                        ) : (
                          <Upload className="w-6 h-6 text-gray-400" />
                        )}
                        <span className="text-xs text-gray-500 mt-1">正本</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileChange(index, "licenseOriginal", file);
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* 副本 */}
                  <div className="relative">
                    {shareholder.licenseCopyUrl ? (
                      <div className="relative aspect-[1.41] rounded-lg overflow-hidden border-2 border-primary">
                        <img
                          src={shareholder.licenseCopyUrl}
                          alt="营业执照副本"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index, "licenseCopy")}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center aspect-[1.41] rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-primary transition-colors">
                        {uploadingFiles[`licenseCopy_${index}`] ? (
                          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                        ) : (
                          <Upload className="w-6 h-6 text-gray-400" />
                        )}
                        <span className="text-xs text-gray-500 mt-1">副本</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileChange(index, "licenseCopy", file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
                {(errors[`shareholder_${index}_licenseOriginal`] || errors[`shareholder_${index}_licenseCopy`]) && (
                  <p className="text-xs text-red-500">
                    {errors[`shareholder_${index}_licenseOriginal`] || errors[`shareholder_${index}_licenseCopy`]}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* 添加股东按钮 */}
      <button
        type="button"
        onClick={addShareholder}
        className="w-full py-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        添加股东
      </button>
    </div>
  );
}
