"use client";

import { ArrowLeft, ArrowRight, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { STEPS } from "../types";

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        {STEPS.map((step, index) => (
          <div
            key={step.id}
            className="flex items-center"
          >
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep > step.id
                  ? "bg-primary text-primary-foreground"
                  : currentStep === step.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep > step.id ? "✓" : step.id}
            </div>
            <span className={`ml-2 text-sm ${
              currentStep === step.id ? "font-medium" : "text-muted-foreground"
            }`}>
              {step.title}
            </span>
            {index < STEPS.length - 1 && (
              <div className="w-16 h-0.5 bg-muted mx-2" />
            )}
          </div>
        ))}
      </div>
      <Progress value={progress} className="h-1" />
    </div>
  );
}

interface StepNavigationProps {
  currentStep: number;
  saving: boolean;
  savingDraft: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  onComplete: () => void;
}

export function StepNavigation({
  currentStep,
  saving,
  savingDraft,
  canGoNext,
  isLastStep,
  onPrev,
  onNext,
  onSaveDraft,
  onComplete,
}: StepNavigationProps) {
  return (
    <div className="border-t bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onPrev}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            上一步
          </Button>
          <Button
            variant="ghost"
            onClick={onSaveDraft}
            disabled={savingDraft}
          >
            {savingDraft ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            保存
          </Button>
        </div>
        
        {isLastStep ? (
          <Button onClick={onComplete} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            完成创建
          </Button>
        ) : (
          <Button onClick={onNext} disabled={!canGoNext}>
            下一步
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
