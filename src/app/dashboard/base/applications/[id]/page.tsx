"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, Save, Send, AlertCircle, FileImage, X, Crop } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ImageCropper } from "@/components/image-cropper";
import { useApplicationForm } from "./useApplicationForm";
import { statusConfig, formSteps } from "./constants";
import { BasicInfoStep } from "./_components/BasicInfoStep";
import { AddressStep } from "./_components/AddressStep";
import { PersonnelStep } from "./_components/PersonnelStep";
import { ShareholderStep } from "./_components/ShareholderStep";
import { BusinessStep } from "./_components/BusinessStep";
import type { ApplicationFormData } from "./types";

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  // 使用自定义 Hook 管理表单状态
  const {
    formData,
    currentStep,
    setCurrentStep,
    loading,
    submitting,
    pageError,
    success,
    canEdit,
    errors,
    uploadingFiles,
    uploadingPersonnelFiles,
    uploadingShareholderFiles,
    cropperOpen,
    cropperImageSrc,
    shareholderCropperOpen,
    shareholderCropperImageSrc,
    loadApplication,
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
    handleSubmit,
    handleCropComplete,
    handleCropCancel,
    handleShareholderCropComplete,
    handleShareholderCropCancel,
    goToNextStep,
    goToPrevStep,
  } = useApplicationForm(applicationId);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  if (loading || !formData) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">加载中...</span>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">加载失败</p>
        <p className="text-muted-foreground">{pageError}</p>
        <Button onClick={() => router.push("/dashboard/base/applications")}>返回列表</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* 页面标题 */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/base/applications")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-xl font-semibold">入驻申请详情</h1>
            <p className="text-sm text-muted-foreground">申请编号：{formData.applicationNo}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={cn("px-3 py-1", statusConfig[formData.approvalStatus].className)}>
            {statusConfig[formData.approvalStatus].label}
          </Badge>
          {success && <div className="text-sm text-green-600">保存成功</div>}
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
        <div className="max-w-5xl mx-auto pb-20">
          {/* 基本信息 */}
          {currentStep === 0 && (
            <BasicInfoStep
              formData={formData}
              errors={errors}
              canEdit={canEdit}
              updateField={updateField}
              onNext={goToNextStep}
            />
          )}

          {/* 地址信息 */}
          {currentStep === 1 && (
            <AddressStep
              formData={formData}
              canEdit={canEdit}
              updateField={updateField}
              onPrev={goToPrevStep}
              onNext={goToNextStep}
            />
          )}

          {/* 人员信息 */}
          {currentStep === 2 && (
            <PersonnelStep
              formData={formData}
              errors={errors}
              canEdit={canEdit}
              uploadingFiles={uploadingPersonnelFiles}
              updateField={updateField}
              addPersonnel={addPersonnel}
              removePersonnel={removePersonnel}
              updatePersonnel={updatePersonnel}
              togglePersonnelRole={togglePersonnelRole}
              isRoleTakenByOthers={isRoleTakenByOthers}
              getRoleHolderIndex={getRoleHolderIndex}
              handleFileChange={handlePersonnelFileChange}
              removeIdCard={removePersonnelFile}
              onPrev={goToPrevStep}
              onNext={goToNextStep}
            />
          )}

          {/* 股东信息 */}
          {currentStep === 3 && (
            <ShareholderStep
              formData={formData}
              canEdit={canEdit}
              uploadingFiles={uploadingShareholderFiles}
              addShareholder={addShareholder}
              removeShareholder={removeShareholder}
              updateShareholder={updateShareholder}
              handleFileChange={handleShareholderFileChange}
              removeFile={removeShareholderFile}
              onPrev={goToPrevStep}
              onNext={goToNextStep}
            />
          )}

          {/* 经营信息 */}
          {currentStep === 4 && (
            <BusinessStep
              formData={formData}
              canEdit={canEdit}
              updateField={updateField}
              onPrev={goToPrevStep}
            />
          )}
        </div>
      </ScrollArea>

      {/* 底部操作栏 */}
      {canEdit && (
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-card">
          <Button type="button" variant="outline" onClick={() => handleSubmit("draft")} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            保存草稿
          </Button>
          <Button type="button" onClick={() => handleSubmit("pending")} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            提交审核
          </Button>
        </div>
      )}

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
