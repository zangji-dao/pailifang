"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ImageCropper } from "@/components/image-cropper";
import { useShareForm } from "./useShareForm";
import { formSteps } from "./types";
import { BasicStep } from "./_components/BasicStep";
import { AddressStep } from "./_components/AddressStep";
import { PersonnelStep } from "./_components/PersonnelStep";
import { ShareholderStep } from "./_components/ShareholderStep";
import { BusinessStep } from "./_components/BusinessStep";

export default function ShareFormPage() {
  const params = useParams();
  const token = params.token as string;

  const {
    formData,
    loading,
    saving,
    submitting,
    error,
    success,
    errors,
    currentStep,
    setCurrentStep,
    uploadingPersonnelFiles,
    uploadingShareholderFiles,
    cropperOpen,
    cropperImageSrc,
    shareholderCropperOpen,
    shareholderCropperImageSrc,
    loadFormData,
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
  } = useShareForm(token);

  useEffect(() => {
    loadFormData();
  }, [loadFormData]);

  // 成功页面
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">提交成功</h1>
        <p className="text-gray-600 text-center mb-8">
          您的入驻申请信息已提交，我们会尽快处理。
        </p>
        <div className="text-sm text-gray-500">
          申请编号：{formData.applicationNo}
        </div>
      </div>
    );
  }

  // 错误页面
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">出错了</h1>
        <p className="text-gray-600 text-center mb-8">{error}</p>
      </div>
    );
  }

  // 加载页面
  if (loading || !formData) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-gray-600">加载中...</p>
      </div>
    );
  }

  const isLastStep = currentStep === formSteps.length - 1;

  // 渲染当前步骤
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicStep
            formData={formData}
            errors={errors}
            updateField={updateField}
          />
        );
      case 1:
        return (
          <AddressStep
            formData={formData}
            errors={errors}
            updateField={updateField}
          />
        );
      case 2:
        return (
          <PersonnelStep
            formData={formData}
            errors={errors}
            addPersonnel={addPersonnel}
            removePersonnel={removePersonnel}
            updatePersonnel={updatePersonnel}
            togglePersonnelRole={togglePersonnelRole}
            isRoleTakenByOthers={isRoleTakenByOthers}
            getRoleHolderIndex={getRoleHolderIndex}
            handleFileChange={handlePersonnelFileChange}
            removeFile={removePersonnelFile}
            uploadingFiles={uploadingPersonnelFiles}
          />
        );
      case 3:
        return (
          <ShareholderStep
            formData={formData}
            errors={errors}
            addShareholder={addShareholder}
            removeShareholder={removeShareholder}
            updateShareholder={updateShareholder}
            handleFileChange={handleShareholderFileChange}
            removeFile={removeShareholderFile}
            uploadingFiles={uploadingShareholderFiles}
          />
        );
      case 4:
        return (
          <BusinessStep
            formData={formData}
            errors={errors}
            updateField={updateField}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部标题栏 */}
      <header className="bg-white border-b shrink-0 sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-lg font-semibold text-gray-900">入驻申请</h1>
          <p className="text-sm text-gray-500 mt-0.5">申请编号：{formData.applicationNo}</p>
        </div>
      </header>

      {/* 步骤指示器 */}
      <div className="bg-white border-b shrink-0 sticky top-[72px] z-10">
        <div className="px-4 py-3 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {formSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => {
                  if (index < currentStep) {
                    setCurrentStep(index);
                  }
                }}
                disabled={index > currentStep}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  index === currentStep
                    ? "bg-primary text-white"
                    : index < currentStep
                    ? "bg-primary/10 text-primary"
                    : "bg-gray-100 text-gray-400"
                )}
              >
                <span
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-xs",
                    index === currentStep
                      ? "bg-white text-primary"
                      : index < currentStep
                      ? "bg-primary text-white"
                      : "bg-gray-300 text-white"
                  )}
                >
                  {index < currentStep ? "✓" : index + 1}
                </span>
                <span className="hidden sm:inline">{step.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 表单内容区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pb-24">{renderStep()}</div>
      </div>

      {/* 底部操作按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-10">
        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={goToPrevStep}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              上一步
            </Button>
          )}
          {isLastStep ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || saving}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {submitting || saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  提交中...
                </>
              ) : (
                "提交申请"
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={goToNextStep}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  下一步
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* 人员文件裁剪弹窗 */}
      <ImageCropper
        open={cropperOpen}
        imageSrc={cropperImageSrc}
        aspectRatio={1.58}
        onCrop={handleCropComplete}
        onCancel={handleCropCancel}
      />

      {/* 股东文件裁剪弹窗 */}
      <ImageCropper
        open={shareholderCropperOpen}
        imageSrc={shareholderCropperImageSrc}
        aspectRatio={shareholderCropperImageSrc ? 1.58 : 1.41}
        onCrop={handleShareholderCropComplete}
        onCancel={handleShareholderCropCancel}
      />
    </div>
  );
}
