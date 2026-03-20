"use client";

import { Plus, X, Upload, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { roleConfig, requiredRoles } from "../types";
import type { FormData, Personnel } from "../types";

interface PersonnelStepProps {
  formData: FormData;
  errors: Record<string, string>;
  addPersonnel: () => void;
  removePersonnel: (index: number) => void;
  updatePersonnel: (index: number, field: keyof Personnel, value: string | string[]) => void;
  togglePersonnelRole: (index: number, roleKey: string) => void;
  isRoleTakenByOthers: (roleKey: string, currentIndex: number) => boolean;
  getRoleHolderIndex: (roleKey: string) => number;
  handleFileChange: (index: number, type: "front" | "back", file: File) => void;
  removeFile: (index: number, type: "front" | "back") => void;
  uploadingFiles: Record<string, boolean>;
}

export function PersonnelStep({
  formData,
  errors,
  addPersonnel,
  removePersonnel,
  updatePersonnel,
  togglePersonnelRole,
  isRoleTakenByOthers,
  getRoleHolderIndex,
  handleFileChange,
  removeFile,
  uploadingFiles,
}: PersonnelStepProps) {
  return (
    <div className="space-y-4">
      {/* 职务分配提示 */}
      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
        <p className="text-sm text-amber-800">
          请为以下职务分配人员：{requiredRoles.map((r) => r.label).join("、")}
        </p>
      </div>

      {/* 人员列表 */}
      {formData.personnel.map((person, index) => (
        <div key={index} className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-gray-900">
              人员 {index + 1}
              {person.roles.length > 0 && (
                <span className="ml-2 text-xs text-primary font-normal">
                  ({person.roles.map((r) => roleConfig[r]?.label || r).join("、")})
                </span>
              )}
            </h3>
            {formData.personnel.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removePersonnel(index)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* 职务选择 */}
          <div className="mb-4">
            <Label className="text-gray-700 mb-2 block">
              担任职务 <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {requiredRoles.map((role) => {
                const isTaken = isRoleTakenByOthers(role.key, index);
                const isSelected = person.roles.includes(role.key);

                return (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => togglePersonnelRole(index, role.key)}
                    disabled={isTaken && !isSelected}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-primary text-white"
                        : isTaken
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {role.label}
                  </button>
                );
              })}
            </div>
            {errors[`role_legal_person`] && !person.roles.includes("legal_person") && (
              <p className="text-xs text-red-500 mt-1">{errors[`role_legal_person`]}</p>
            )}
          </div>

          {/* 基本信息 */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">
                  姓名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={person.name}
                  onChange={(e) => updatePersonnel(index, "name", e.target.value)}
                  placeholder="请输入姓名"
                  className="h-11"
                />
                {errors[`personnel_${index}_name`] && (
                  <p className="text-xs text-red-500">{errors[`personnel_${index}_name`]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">
                  电话 <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={person.phone}
                  onChange={(e) => updatePersonnel(index, "phone", e.target.value)}
                  placeholder="请输入电话"
                  className="h-11"
                />
                {errors[`personnel_${index}_phone`] && (
                  <p className="text-xs text-red-500">{errors[`personnel_${index}_phone`]}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">
                邮箱 <span className="text-red-500">*</span>
              </Label>
              <Input
                value={person.email}
                onChange={(e) => updatePersonnel(index, "email", e.target.value)}
                placeholder="请输入邮箱"
                type="email"
                className="h-11"
              />
              {errors[`personnel_${index}_email`] && (
                <p className="text-xs text-red-500">{errors[`personnel_${index}_email`]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">
                住址 <span className="text-red-500">*</span>
              </Label>
              <Input
                value={person.address}
                onChange={(e) => updatePersonnel(index, "address", e.target.value)}
                placeholder="请输入住址"
                className="h-11"
              />
              {errors[`personnel_${index}_address`] && (
                <p className="text-xs text-red-500">{errors[`personnel_${index}_address`]}</p>
              )}
            </div>

            {/* 身份证上传 */}
            <div className="space-y-2">
              <Label className="text-gray-700">
                身份证 <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-4">
                {/* 正面 */}
                <div className="relative">
                  {person.idCardFrontUrl ? (
                    <div className="relative aspect-[1.58] rounded-lg overflow-hidden border-2 border-primary">
                      <img
                        src={person.idCardFrontUrl}
                        alt="身份证正面"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index, "front")}
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
                          if (file) handleFileChange(index, "front", file);
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* 背面 */}
                <div className="relative">
                  {person.idCardBackUrl ? (
                    <div className="relative aspect-[1.58] rounded-lg overflow-hidden border-2 border-primary">
                      <img
                        src={person.idCardBackUrl}
                        alt="身份证背面"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index, "back")}
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
                          if (file) handleFileChange(index, "back", file);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
              {(errors[`personnel_${index}_idCardFront`] || errors[`personnel_${index}_idCardBack`]) && (
                <p className="text-xs text-red-500">
                  {errors[`personnel_${index}_idCardFront`] || errors[`personnel_${index}_idCardBack`]}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* 添加人员按钮 */}
      <button
        type="button"
        onClick={addPersonnel}
        className="w-full py-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        添加人员
      </button>
    </div>
  );
}
