"use client";

import { Plus, Trash2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
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
import type { ApplicationFormData, Shareholder, ShareholderType } from "../types";

interface ShareholderStepProps {
  formData: ApplicationFormData;
  canEdit: boolean;
  uploadingFiles: Record<string, boolean>;
  addShareholder: () => void;
  removeShareholder: (index: number) => void;
  updateShareholder: (index: number, field: keyof Shareholder, value: string | ShareholderType) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, fileType: 'idCardFront' | 'idCardBack' | 'licenseOriginal' | 'licenseCopy', shareholderIndex: number) => void;
  removeFile: (fileType: 'idCardFront' | 'idCardBack' | 'licenseOriginal' | 'licenseCopy', shareholderIndex: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function ShareholderStep({
  formData,
  canEdit,
  uploadingFiles,
  addShareholder,
  removeShareholder,
  updateShareholder,
  handleFileChange,
  removeFile,
  onPrev,
  onNext,
}: ShareholderStepProps) {
  const getUploadKey = (fileType: string, index: number) => `shareholder-${index}-${fileType}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">股东信息</h3>
          <p className="text-xs text-muted-foreground mt-1">自然人股东需上传身份证，企业股东需上传营业执照</p>
        </div>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={addShareholder} className="gap-1">
            <Plus className="h-4 w-4" />
            添加股东
          </Button>
        )}
      </div>

      {formData.shareholders.map((shareholder, index) => (
        <div key={index} className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">股东 {index + 1}</span>
            {canEdit && formData.shareholders.length > 1 && (
              <Button size="sm" variant="ghost" onClick={() => removeShareholder(index)} className="h-8 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* 股东类型选择 */}
          <div className="space-y-2">
            <Label>股东类型</Label>
            <Select value={shareholder.type || "natural"} onValueChange={(value: ShareholderType) => updateShareholder(index, "type", value)} disabled={!canEdit}>
              <SelectTrigger><SelectValue placeholder="请选择股东类型" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="natural">自然人股东</SelectItem>
                <SelectItem value="enterprise">企业股东</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 基本信息 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{shareholder.type === "enterprise" ? "企业名称" : "股东姓名"}</Label>
              <Input value={shareholder.name} onChange={(e) => updateShareholder(index, "name", e.target.value)} placeholder={shareholder.type === "enterprise" ? "请输入企业名称" : "请输入股东姓名"} disabled={!canEdit} />
            </div>
            <div className="space-y-2">
              <Label>出资额（万元）</Label>
              <Input type="number" value={shareholder.investment} onChange={(e) => updateShareholder(index, "investment", e.target.value)} placeholder="请输入出资额" disabled={!canEdit} />
            </div>
            <div className="space-y-2">
              <Label>联系电话</Label>
              <Input value={shareholder.phone} onChange={(e) => updateShareholder(index, "phone", e.target.value)} placeholder="请输入联系电话" disabled={!canEdit} />
            </div>
          </div>

          {/* 自然人股东 - 身份证上传 */}
          {(shareholder.type === "natural" || !shareholder.type) && (
            <div className="space-y-2">
              <Label>身份证照片</Label>
              <div className="grid grid-cols-2 gap-4">
                {['idCardFront', 'idCardBack'].map((type) => (
                  <div key={type} className="space-y-2">
                    <p className="text-xs text-muted-foreground">{type === 'idCardFront' ? '正面（人像面）' : '反面（国徽面）'}</p>
                    {shareholder[`${type}Url` as keyof Shareholder] ? (
                      <div className="relative group">
                        <img src={shareholder[`${type}Url` as keyof Shareholder] as string} alt={`身份证${type === 'idCardFront' ? '正面' : '反面'}`} className="w-full h-24 object-cover rounded border" />
                        {canEdit && (
                          <Button type="button" variant="destructive" size="sm" className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeFile(type as 'idCardFront' | 'idCardBack', index)}>
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <label className={cn("flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded cursor-pointer hover:border-primary", uploadingFiles[getUploadKey(type, index)] && "opacity-50 cursor-wait", !canEdit && "opacity-50 cursor-not-allowed")}>
                        {uploadingFiles[getUploadKey(type, index)] ? (
                          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                        ) : (
                          <>
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground mt-1">上传{type === 'idCardFront' ? '正面' : '反面'}</span>
                          </>
                        )}
                        <input type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" onChange={(e) => handleFileChange(e, type as 'idCardFront' | 'idCardBack', index)} disabled={!canEdit || uploadingFiles[getUploadKey(type, index)]} />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 企业股东 - 营业执照上传 */}
          {shareholder.type === "enterprise" && (
            <div className="space-y-2">
              <Label>营业执照</Label>
              <div className="grid grid-cols-2 gap-4">
                {['licenseOriginal', 'licenseCopy'].map((type) => (
                  <div key={type} className="space-y-2">
                    <p className="text-xs text-muted-foreground">{type === 'licenseOriginal' ? '正本' : '副本'}</p>
                    {shareholder[`${type}Url` as keyof Shareholder] ? (
                      <div className="relative group">
                        <img src={shareholder[`${type}Url` as keyof Shareholder] as string} alt={`营业执照${type === 'licenseOriginal' ? '正本' : '副本'}`} className="w-full h-24 object-cover rounded border" />
                        {canEdit && (
                          <Button type="button" variant="destructive" size="sm" className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeFile(type as 'licenseOriginal' | 'licenseCopy', index)}>
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <label className={cn("flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded cursor-pointer hover:border-primary", uploadingFiles[getUploadKey(type, index)] && "opacity-50 cursor-wait", !canEdit && "opacity-50 cursor-not-allowed")}>
                        {uploadingFiles[getUploadKey(type, index)] ? (
                          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                        ) : (
                          <>
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground mt-1">上传{type === 'licenseOriginal' ? '正本' : '副本'}</span>
                          </>
                        )}
                        <input type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" onChange={(e) => handleFileChange(e, type as 'licenseOriginal' | 'licenseCopy', index)} disabled={!canEdit || uploadingFiles[getUploadKey(type, index)]} />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* 步骤导航 */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onPrev}>
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          上一步：人员信息
        </Button>
        <div className="text-sm text-muted-foreground">第 4 步，共 5 步</div>
        <Button type="button" onClick={onNext}>
          下一步：经营信息
          <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
