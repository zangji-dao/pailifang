"use client";

import { ArrowLeft, Loader2, Save, Send, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageCropper } from "@/components/image-cropper";
import { useNewApplicationForm } from "./useNewApplicationForm";
import { formSteps } from "../[id]/constants";
import { BasicInfoStep } from "../[id]/_components/BasicInfoStep";
import { AddressStep } from "../[id]/_components/AddressStep";
import { PersonnelStep } from "../[id]/_components/PersonnelStep";
import { ShareholderStep } from "../[id]/_components/ShareholderStep";
import { BusinessStep } from "../[id]/_components/BusinessStep";
import type { ApplicationFormData, Personnel, Shareholder, ShareholderType } from "../[id]/types";

export default function NewApplicationPage() {
  const {
    formData,
    currentStep,
    setCurrentStep,
    submitting,
    saving,
    lastSavedAt,
    errors,
    uploadingPersonnelFiles,
    uploadingShareholderFiles,
    cropperOpen,
    cropperImageSrc,
    shareholderCropperOpen,
    shareholderCropperImageSrc,
    updateField,
    addPersonnel,
    removePersonnel,
    updatePersonnel,
    togglePersonnelRole,
    isRoleTakenByOthers,
    getRoleHolderIndex,
    handlePersonnelFileChange,
    removePersonnelFile,
    addShareholder,
    removeShareholder,
    updateShareholder,
    handleShareholderFileChange,
    removeShareholderFile,
    handleCropComplete,
    handleCropCancel,
    handleShareholderCropComplete,
    handleShareholderCropCancel,
    goToNextStep,
    goToPrevStep,
    saveDraft,
    handleSubmit,
  } = useNewApplicationForm();

  // 类型断言：NewApplicationFormData 字段是 ApplicationFormData 的子集，组件中使用的字段都兼容
  const formDataForComponents = formData as unknown as ApplicationFormData;
  
  // 是否为最后一步
  const isLastStep = currentStep === formSteps.length - 1;
  
  // 格式化保存时间
  const formatLastSaved = (date: Date | null): string => {
    if (!date) return "";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "刚刚保存";
    if (diffMins < 60) return `${diffMins}分钟前保存`;
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) + " 保存";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* 页面标题 */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-xl font-semibold">新建入驻申请</h1>
            <p className="text-sm text-muted-foreground">填写企业信息提交入驻申请</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastSavedAt && (
            <span className="text-xs text-muted-foreground">{formatLastSaved(lastSavedAt)}</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={saveDraft}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 步骤指示器 */}
      <div className="px-6 py-3 border-b bg-muted/30">
        <div className="flex items-center justify-center gap-2">
          {formSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  currentStep === index ? "bg-primary text-primary-foreground" : index < currentStep ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs", currentStep === index ? "bg-primary-foreground text-primary" : index < currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  {index < currentStep ? "✓" : index + 1}
                </span>
                {step.title}
              </button>
              {index < formSteps.length - 1 && <div className={cn("w-12 h-0.5 mx-2", index < currentStep ? "bg-primary" : "bg-muted")} />}
            </div>
          ))}
        </div>
      </div>

      {/* 表单内容 */}
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="max-w-5xl mx-auto pb-24">
          {/* 基本信息 */}
          {currentStep === 0 && (
            <BasicInfoStep
              formData={formDataForComponents}
              errors={errors}
              canEdit={true}
              updateField={updateField as (field: keyof ApplicationFormData, value: string | string[]) => void}
            />
          )}

          {/* 地址信息 */}
          {currentStep === 1 && (
            <AddressStep
              formData={formDataForComponents}
              canEdit={true}
              updateField={updateField as (field: keyof ApplicationFormData, value: string) => void}
            />
          )}

          {/* 人员信息 */}
          {currentStep === 2 && (
            <PersonnelStep
              formData={formDataForComponents}
              errors={errors}
              canEdit={true}
              uploadingFiles={uploadingPersonnelFiles}
              updateField={updateField as (field: keyof ApplicationFormData, value: string) => void}
              addPersonnel={addPersonnel}
              removePersonnel={removePersonnel}
              updatePersonnel={updatePersonnel as (index: number, field: keyof Personnel, value: string | string[]) => void}
              togglePersonnelRole={togglePersonnelRole}
              isRoleTakenByOthers={isRoleTakenByOthers}
              getRoleHolderIndex={getRoleHolderIndex}
              handleFileChange={handlePersonnelFileChange}
              removeIdCard={removePersonnelFile}
            />
          )}

          {/* 股东信息 */}
          {currentStep === 3 && (
            <ShareholderStep
              formData={formDataForComponents}
              canEdit={true}
              uploadingFiles={uploadingShareholderFiles}
              addShareholder={addShareholder}
              removeShareholder={removeShareholder}
              updateShareholder={updateShareholder as (index: number, field: keyof Shareholder, value: string | ShareholderType) => void}
              handleFileChange={handleShareholderFileChange}
              removeFile={removeShareholderFile}
            />
          )}

          {/* 经营信息 */}
          {currentStep === 4 && (
            <BusinessStep
              formData={formDataForComponents}
              canEdit={true}
              updateField={updateField as (field: keyof ApplicationFormData, value: string) => void}
            />
          )}
        </div>
      </ScrollArea>

      {/* 底部操作栏 - 固定在底部 */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 左侧：上一步按钮 */}
            <div className="w-32">
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPrevStep}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  上一步
                </Button>
              )}
            </div>
            
            {/* 中间：步骤提示 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                第 {currentStep + 1} 步，共 {formSteps.length} 步
              </span>
              {isLastStep && (
                <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  最后一步
                </span>
              )}
            </div>
            
            {/* 右侧：下一步/提交审核按钮 */}
            <div className="w-32 flex justify-end">
              {isLastStep ? (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      提交审核
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={goToNextStep}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      下一步
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 图片裁剪对话框 - 身份证 */}
      <ImageCropper
        open={cropperOpen}
        imageSrc={cropperImageSrc}
        onCrop={handleCropComplete}
        onCancel={handleCropCancel}
        aspectRatio={1.58}
      />
      
      {/* 图片裁剪对话框 - 股东证件 */}
      <ImageCropper
        open={shareholderCropperOpen}
        imageSrc={shareholderCropperImageSrc}
        onCrop={handleShareholderCropComplete}
        onCancel={handleShareholderCropCancel}
        aspectRatio={1.58}
      />
    </div>
  );
}
