"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Upload, X, AlertCircle, Link, Unlink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ApplicationFormData, Shareholder, ShareholderType, Personnel } from "../types";

interface ShareholderStepProps {
  formData: ApplicationFormData;
  errors: Record<string, string>;
  canEdit: boolean;
  uploadingFiles: Record<string, boolean>;
  addShareholder: () => void;
  removeShareholder: (index: number) => void;
  updateShareholder: (index: number, field: keyof Shareholder, value: string | ShareholderType) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, fileType: 'idCardFront' | 'idCardBack' | 'licenseOriginal' | 'licenseCopy', shareholderIndex: number) => void;
  removeFile: (fileType: 'idCardFront' | 'idCardBack' | 'licenseOriginal' | 'licenseCopy', shareholderIndex: number) => void;
}

export function ShareholderStep({
  formData,
  errors,
  canEdit,
  uploadingFiles,
  addShareholder,
  removeShareholder,
  updateShareholder,
  handleFileChange,
  removeFile,
}: ShareholderStepProps) {
  // 错误弹窗状态
  const [showError, setShowError] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevErrorRef = useRef<string | null>(null);
  
  // 关联人员状态：记录每个股东关联的人员索引（-1 表示未关联）
  const [linkedPersonnel, setLinkedPersonnel] = useState<Record<number, number>>({});

  // 获取可关联的人员列表（排除已被关联的）
  const getAvailablePersonnel = (currentIndex: number): Personnel[] => {
    const linkedIndices = Object.entries(linkedPersonnel)
      .filter(([idx]) => parseInt(idx) !== currentIndex)
      .map(([, pIdx]) => pIdx);
    return formData.personnel.filter((_, idx) => !linkedIndices.includes(idx));
  };

  // 关联人员
  const handleLinkPersonnel = (shareholderIndex: number, personnelIndex: string) => {
    if (personnelIndex === "none") {
      // 取消关联
      const newLinked = { ...linkedPersonnel };
      delete newLinked[shareholderIndex];
      setLinkedPersonnel(newLinked);
      return;
    }
    
    const pIdx = parseInt(personnelIndex);
    const person = formData.personnel[pIdx];
    if (!person) return;
    
    // 自动填充股东信息
    updateShareholder(shareholderIndex, "name", person.name);
    updateShareholder(shareholderIndex, "phone", person.phone);
    // 身份证信息
    if (person.idCardFrontKey) {
      updateShareholder(shareholderIndex, "idCardFrontKey", person.idCardFrontKey);
    }
    if (person.idCardFrontUrl) {
      updateShareholder(shareholderIndex, "idCardFrontUrl", person.idCardFrontUrl);
    }
    if (person.idCardBackKey) {
      updateShareholder(shareholderIndex, "idCardBackKey", person.idCardBackKey);
    }
    if (person.idCardBackUrl) {
      updateShareholder(shareholderIndex, "idCardBackUrl", person.idCardBackUrl);
    }
    
    setLinkedPersonnel({ ...linkedPersonnel, [shareholderIndex]: pIdx });
  };

  // 当 errors.shareholder 变化时显示弹窗，1秒后自动消失
  useEffect(() => {
    if (errors.shareholder && errors.shareholder !== prevErrorRef.current) {
      setShowError(true);
      prevErrorRef.current = errors.shareholder;
      
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      
      hideTimerRef.current = setTimeout(() => {
        setShowError(false);
      }, 1000);
    }
    
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [errors.shareholder]);

  // 点击任意位置隐藏弹窗
  useEffect(() => {
    const handleClick = () => setShowError(false);
    if (showError) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showError]);

  // 进入输入状态时隐藏弹窗
  const handleFocus = () => setShowError(false);

  const getUploadKey = (fileType: string, index: number) => `shareholder-${index}-${fileType}`;

  return (
    <div className="space-y-4">
      {/* 错误提示弹窗 */}
      {showError && errors.shareholder && (
        <div 
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-destructive/95 border border-destructive px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-bottom-4 duration-300 cursor-pointer"
          onClick={() => setShowError(false)}
        >
          <div className="flex items-center gap-2 text-white">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{errors.shareholder}</span>
          </div>
        </div>
      )}

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
            <Label>股东类型 <span className="text-destructive">*</span></Label>
            <Select value={shareholder.type || "natural"} onValueChange={(value: ShareholderType) => updateShareholder(index, "type", value)} disabled={!canEdit}>
              <SelectTrigger onFocus={handleFocus}><SelectValue placeholder="请选择股东类型" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="natural">自然人股东</SelectItem>
                <SelectItem value="enterprise">企业股东</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 基本信息 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{shareholder.type === "enterprise" ? "企业名称" : "股东姓名"} <span className="text-destructive">*</span></Label>
              <Input value={shareholder.name} onChange={(e) => updateShareholder(index, "name", e.target.value)} onFocus={handleFocus} placeholder={shareholder.type === "enterprise" ? "请输入企业名称" : "请输入股东姓名"} disabled={!canEdit} />
            </div>
            <div className="space-y-2">
              <Label>出资额（万元） <span className="text-destructive">*</span></Label>
              <Input type="number" value={shareholder.investment} onChange={(e) => updateShareholder(index, "investment", e.target.value)} onFocus={handleFocus} placeholder="请输入出资额" disabled={!canEdit} />
            </div>
            <div className="space-y-2">
              <Label>联系电话 <span className="text-destructive">*</span></Label>
              <Input value={shareholder.phone} onChange={(e) => updateShareholder(index, "phone", e.target.value)} onFocus={handleFocus} placeholder="请输入联系电话" disabled={!canEdit} />
            </div>
          </div>

          {/* 自然人股东 - 关联人员选择 */}
          {(shareholder.type === "natural" || !shareholder.type) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="flex items-center gap-1">
                  <Link className="h-3.5 w-3.5" />
                  关联人员信息
                </Label>
                {linkedPersonnel[index] !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    已关联：{formData.personnel[linkedPersonnel[index]]?.name}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Select 
                  value={linkedPersonnel[index]?.toString() || "none"} 
                  onValueChange={(value) => handleLinkPersonnel(index, value)} 
                  disabled={!canEdit}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="选择已填写的人员，自动填充身份证信息" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">不关联，手动填写</span>
                    </SelectItem>
                    {getAvailablePersonnel(index).map((person, pIdx) => {
                      const actualIdx = formData.personnel.findIndex(p => p === person);
                      return (
                        <SelectItem key={actualIdx} value={actualIdx.toString()}>
                          {person.name} {person.phone && `(${person.phone})`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {linkedPersonnel[index] !== undefined && canEdit && (
                  <Button 
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleLinkPersonnel(index, "none")}
                    className="shrink-0"
                  >
                    <Unlink className="h-4 w-4 mr-1" />
                    取消关联
                  </Button>
                )}
              </div>
              {linkedPersonnel[index] === undefined && formData.personnel.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  💡 选择人员后，姓名、电话和身份证信息将自动填充
                </p>
              )}
            </div>
          )}

          {/* 自然人股东 - 身份证上传 */}
          {(shareholder.type === "natural" || !shareholder.type) && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                身份证照片 <span className="text-destructive">*</span>
                {linkedPersonnel[index] !== undefined && (
                  <Badge variant="outline" className="text-xs font-normal">
                    <Link className="h-3 w-3 mr-1" />
                    来自人员信息
                  </Badge>
                )}
              </Label>
              <div className="grid grid-cols-2 gap-4">
                {/* 正面 */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">正面（人像面）<span className="text-destructive">*</span></p>
                  {shareholder.idCardFrontUrl ? (
                    <div className="relative group">
                      <div className="aspect-[1.58/1] rounded-lg border overflow-hidden bg-muted/50">
                        <img src={shareholder.idCardFrontUrl} alt="身份证正面" className="w-full h-full object-contain" />
                      </div>
                      {/* 只有未关联人员时才允许删除 */}
                      {canEdit && linkedPersonnel[index] === undefined && (
                        <button type="button" onClick={() => removeFile('idCardFront', index)} className="absolute -top-2 -right-2 p-1.5 rounded-full bg-destructive text-white hover:bg-destructive/90 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <label className={cn(
                      "flex flex-col items-center justify-center aspect-[1.58/1] rounded-lg border-2 border-dashed transition-all",
                      canEdit && linkedPersonnel[index] === undefined 
                        ? "border-muted-foreground/25 hover:border-primary/50 cursor-pointer" 
                        : "border-muted-foreground/25 opacity-50 cursor-not-allowed",
                      uploadingFiles[getUploadKey('idCardFront', index)] && "opacity-50 cursor-wait"
                    )}>
                      {uploadingFiles[getUploadKey('idCardFront', index)] ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                          <span className="text-xs text-muted-foreground">上传中...</span>
                        </div>
                      ) : linkedPersonnel[index] !== undefined ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Link className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <span className="text-sm text-muted-foreground">请先上传人员身份证</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Upload className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <span className="text-sm text-muted-foreground">点击上传正面</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/jpg" 
                        className="hidden" 
                        onChange={(e) => handleFileChange(e, 'idCardFront', index)} 
                        disabled={!canEdit || uploadingFiles[getUploadKey('idCardFront', index)] || linkedPersonnel[index] !== undefined} 
                      />
                    </label>
                  )}
                </div>
                {/* 反面 */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">反面（国徽面）<span className="text-destructive">*</span></p>
                  {shareholder.idCardBackUrl ? (
                    <div className="relative group">
                      <div className="aspect-[1.58/1] rounded-lg border overflow-hidden bg-muted/50">
                        <img src={shareholder.idCardBackUrl} alt="身份证反面" className="w-full h-full object-contain" />
                      </div>
                      {/* 只有未关联人员时才允许删除 */}
                      {canEdit && linkedPersonnel[index] === undefined && (
                        <button type="button" onClick={() => removeFile('idCardBack', index)} className="absolute -top-2 -right-2 p-1.5 rounded-full bg-destructive text-white hover:bg-destructive/90 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <label className={cn(
                      "flex flex-col items-center justify-center aspect-[1.58/1] rounded-lg border-2 border-dashed transition-all",
                      canEdit && linkedPersonnel[index] === undefined 
                        ? "border-muted-foreground/25 hover:border-primary/50 cursor-pointer" 
                        : "border-muted-foreground/25 opacity-50 cursor-not-allowed",
                      uploadingFiles[getUploadKey('idCardBack', index)] && "opacity-50 cursor-wait"
                    )}>
                      {uploadingFiles[getUploadKey('idCardBack', index)] ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                          <span className="text-xs text-muted-foreground">上传中...</span>
                        </div>
                      ) : linkedPersonnel[index] !== undefined ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Link className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <span className="text-sm text-muted-foreground">请先上传人员身份证</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Upload className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <span className="text-sm text-muted-foreground">点击上传反面</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/jpg" 
                        className="hidden" 
                        onChange={(e) => handleFileChange(e, 'idCardBack', index)} 
                        disabled={!canEdit || uploadingFiles[getUploadKey('idCardBack', index)] || linkedPersonnel[index] !== undefined} 
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 企业股东 - 营业执照上传 */}
          {shareholder.type === "enterprise" && (
            <div className="space-y-2">
              <Label>营业执照 <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-2 gap-4">
                {/* 正本 */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">正本<span className="text-destructive">*</span></p>
                  {shareholder.licenseOriginalUrl ? (
                    <div className="relative group">
                      <div className="aspect-[1.4/1] rounded-lg border overflow-hidden bg-muted/50">
                        <img src={shareholder.licenseOriginalUrl} alt="营业执照正本" className="w-full h-full object-contain" />
                      </div>
                      {canEdit && (
                        <button type="button" onClick={() => removeFile('licenseOriginal', index)} className="absolute -top-2 -right-2 p-1.5 rounded-full bg-destructive text-white hover:bg-destructive/90 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <label className={cn("flex flex-col items-center justify-center aspect-[1.4/1] rounded-lg border-2 border-dashed transition-all", canEdit ? "border-muted-foreground/25 hover:border-primary/50 cursor-pointer" : "border-muted-foreground/25 opacity-50 cursor-not-allowed", uploadingFiles[getUploadKey('licenseOriginal', index)] && "opacity-50 cursor-wait")}>
                      {uploadingFiles[getUploadKey('licenseOriginal', index)] ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                          <span className="text-xs text-muted-foreground">上传中...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Upload className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <span className="text-sm text-muted-foreground">点击上传正本</span>
                        </div>
                      )}
                      <input type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" onChange={(e) => handleFileChange(e, 'licenseOriginal', index)} disabled={!canEdit || uploadingFiles[getUploadKey('licenseOriginal', index)]} />
                    </label>
                  )}
                </div>
                {/* 副本 */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">副本<span className="text-destructive">*</span></p>
                  {shareholder.licenseCopyUrl ? (
                    <div className="relative group">
                      <div className="aspect-[1.4/1] rounded-lg border overflow-hidden bg-muted/50">
                        <img src={shareholder.licenseCopyUrl} alt="营业执照副本" className="w-full h-full object-contain" />
                      </div>
                      {canEdit && (
                        <button type="button" onClick={() => removeFile('licenseCopy', index)} className="absolute -top-2 -right-2 p-1.5 rounded-full bg-destructive text-white hover:bg-destructive/90 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <label className={cn("flex flex-col items-center justify-center aspect-[1.4/1] rounded-lg border-2 border-dashed transition-all", canEdit ? "border-muted-foreground/25 hover:border-primary/50 cursor-pointer" : "border-muted-foreground/25 opacity-50 cursor-not-allowed", uploadingFiles[getUploadKey('licenseCopy', index)] && "opacity-50 cursor-wait")}>
                      {uploadingFiles[getUploadKey('licenseCopy', index)] ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                          <span className="text-xs text-muted-foreground">上传中...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Upload className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <span className="text-sm text-muted-foreground">点击上传副本</span>
                        </div>
                      )}
                      <input type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" onChange={(e) => handleFileChange(e, 'licenseCopy', index)} disabled={!canEdit || uploadingFiles[getUploadKey('licenseCopy', index)]} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
