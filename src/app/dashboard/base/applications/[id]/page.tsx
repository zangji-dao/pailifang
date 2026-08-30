"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, Save, Send, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ImageCropper } from "@/components/image-cropper";
import { useTabs } from "@/app/dashboard/tabs-context";
import { useApplicationForm } from "./useApplicationForm";
import { useConfirm } from "@/components/confirm-dialog";
import { formSteps } from "./constants";
import { BasicInfoStep } from "./_components/BasicInfoStep";
import { AddressStep } from "./_components/AddressStep";
import { PersonnelStep } from "./_components/PersonnelStep";
import { ShareholderStep } from "./_components/ShareholderStep";
import { BusinessStep } from "./_components/BusinessStep";
import type { ApplicationFormData, Personnel, Shareholder, ShareholderType } from "./types";

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tabs = useTabs();
  const applicationId = params.id as string;

  const {
    formData,
    currentStep,
    setCurrentStep,
    loading,
    submitting,
    saving,
    pageError,
    success,
    canEdit,
    errors,
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
    goToStep,
    handleGoBack,
  } = useApplicationForm(applicationId);

  const confirm = useConfirm();

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  const isLastStep = currentStep === formSteps.length - 1;

  // 提交审核（需要确认）
  const handleSubmitForApproval = async () => {
    const confirmed = await confirm({
      title: "提交审批",
      description: "确认提交此申请进行审批？",
    });
    if (confirmed) {
      handleSubmit("pending");
    }
  };

  if (loading || !formData) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
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
        <Button onClick={() => {
          if (tabs) {
            tabs.closeCurrentTabAndNavigate("/dashboard/base/applications");
          } else {
            router.push("/dashboard/base/applications");
          }
        }}>返回列表</Button>
      </div>
    );
  }

  return (
    <div className="-m-3 flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-slate-50/70 sm:-m-5 sm:h-[calc(100dvh-6.75rem)] lg:-m-7">
      <div className="shrink-0 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            disabled={saving}
            className="h-10 rounded-xl px-2.5 text-slate-600 sm:px-3"
          >
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ArrowLeft className="mr-1.5 h-4 w-4" />}
            返回
          </Button>

          <div className="min-w-0 text-center">
            <h1 className="truncate text-lg font-semibold tracking-tight text-slate-950 sm:text-2xl">入驻申请详情</h1>
            <p className="truncate text-xs text-slate-500 sm:text-sm">申请编号：{formData.applicationNo}</p>
            {success && <p className="mt-0.5 text-[11px] text-emerald-600 sm:text-xs">已保存</p>}
          </div>

          <div className="flex min-w-10 justify-end">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSubmit("draft")}
                disabled={saving || submitting}
                className="h-10 rounded-xl border-slate-200 bg-white px-3 shadow-sm"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                <span className="hidden min-[360px]:inline">保存</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-b border-slate-200/80 bg-white px-4 py-3 sm:px-6">
        <div className="sm:hidden">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-xs font-semibold text-white">
                {currentStep + 1}
              </span>
              <span className="truncate text-sm font-medium text-slate-800">{formSteps[currentStep]?.title}</span>
            </div>
            <span className="shrink-0 text-xs text-slate-400">{currentStep + 1} / {formSteps.length}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / formSteps.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="mx-auto hidden max-w-6xl items-center justify-center sm:flex">
          {formSteps.map((step, index) => {
            const accessible = !canEdit || index <= currentStep;
            return (
              <div key={step.id} className="flex min-w-0 items-center">
                <button
                  type="button"
                  disabled={!accessible}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium transition-all lg:px-3",
                    currentStep === index && "bg-amber-600 text-white shadow-sm shadow-amber-500/25",
                    currentStep !== index && accessible && "cursor-pointer bg-amber-50 text-amber-700 hover:bg-amber-100",
                    !accessible && "cursor-default text-slate-400",
                  )}
                  onClick={() => accessible && goToStep(index)}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs",
                      currentStep === index && "bg-white/20",
                      currentStep !== index && accessible && "bg-amber-600 text-white",
                      !accessible && "bg-slate-100 text-slate-400",
                    )}
                  >
                    {index < currentStep ? "✓" : index + 1}
                  </span>
                  <span className="hidden lg:inline">{step.title}</span>
                </button>
                {index < formSteps.length - 1 && (
                  <div className={cn("mx-1 h-px w-5 bg-slate-200 md:w-8 lg:mx-2 lg:w-12", index < currentStep && "bg-amber-300")} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 表单内容 - 滚动区域 */}
      <div className="wizard-form min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {currentStep === 0 && (
            <BasicInfoStep
              formData={formData}
              errors={errors}
              canEdit={canEdit}
              updateField={updateField as (field: keyof ApplicationFormData, value: string | string[]) => void}
            />
          )}

          {currentStep === 1 && (
            <AddressStep
              formData={formData}
              canEdit={canEdit}
              updateField={updateField as (field: keyof ApplicationFormData, value: string) => void}
            />
          )}

          {currentStep === 2 && (
            <PersonnelStep
              formData={formData}
              errors={errors}
              canEdit={canEdit}
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

          {currentStep === 3 && (
            <ShareholderStep
              formData={formData}
              errors={errors}
              canEdit={canEdit}
              uploadingFiles={uploadingShareholderFiles}
              addShareholder={addShareholder}
              removeShareholder={removeShareholder}
              updateShareholder={updateShareholder as (index: number, field: keyof Shareholder, value: string | ShareholderType) => void}
              handleFileChange={handleShareholderFileChange}
              removeFile={removeShareholderFile}
            />
          )}

          {currentStep === 4 && (
            <BusinessStep
              formData={formData}
              canEdit={canEdit}
              updateField={updateField as (field: keyof ApplicationFormData, value: string | string[]) => void}
            />
          )}
        </div>
      </div>

      {/* 底部操作栏（仅草稿状态显示） */}
      {canEdit && (
        <div className="shrink-0 border-t border-slate-200/80 bg-white/95 px-3 pt-3 shadow-[0_-12px_30px_-24px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:px-8 sm:py-3">
          <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-0">
              <div className="flex justify-start">
                {currentStep > 0 && (
                  <Button type="button" variant="outline" onClick={goToPrevStep} className="h-11 min-w-24 rounded-xl">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    上一步
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 text-center">
                <span className="text-xs text-slate-400 sm:text-sm">
                  第 {currentStep + 1} 步，共 {formSteps.length} 步
                </span>
                {isLastStep && (
                  <span className="hidden rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700 sm:inline-flex">
                    最后一步
                  </span>
                )}
              </div>

              <div className="flex justify-end">
                {isLastStep ? (
                  <Button
                    type="button"
                    onClick={handleSubmitForApproval}
                    disabled={submitting}
                    className="h-11 min-w-28 rounded-xl bg-orange-600 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-700"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-1" />
                        提交审核
                      </>
                    )}
                  </Button>
                ) : (
                  <Button type="button" onClick={goToNextStep} className="h-11 min-w-24 rounded-xl shadow-lg shadow-amber-500/20">
                    下一步
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
          </div>
        </div>
      )}

      <ImageCropper
        open={cropperOpen}
        imageSrc={cropperImageSrc}
        onCrop={handleCropComplete}
        onCancel={handleCropCancel}
        aspectRatio={1.58}
      />
      
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
