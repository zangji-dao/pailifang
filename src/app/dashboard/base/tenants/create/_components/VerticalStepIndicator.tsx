"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { MainStep } from "../_constants/steps";

// 柔和的七彩配色方案
const stepColors: Record<string, { bg: string; text: string; light: string; ring: string }> = {
  address: {
    bg: "bg-sky-400",
    text: "text-sky-600",
    light: "bg-sky-50",
    ring: "ring-sky-200",
  },
  registration: {
    bg: "bg-violet-400",
    text: "text-violet-600",
    light: "bg-violet-50",
    ring: "ring-violet-200",
  },
  contract: {
    bg: "bg-amber-400",
    text: "text-amber-600",
    light: "bg-amber-50",
    ring: "ring-amber-200",
  },
  payment: {
    bg: "bg-emerald-400",
    text: "text-emerald-600",
    light: "bg-emerald-50",
    ring: "ring-emerald-200",
  },
  complete: {
    bg: "bg-rose-400",
    text: "text-rose-600",
    light: "bg-rose-50",
    ring: "ring-rose-200",
  },
};

interface VerticalStepIndicatorProps {
  steps: MainStep[];
  currentMainStepId: string;
  completedMainSteps: Set<string>;
  onStepClick?: (stepId: string) => void;
  className?: string;
}

export function VerticalStepIndicator({
  steps,
  currentMainStepId,
  completedMainSteps,
  onStepClick,
  className,
}: VerticalStepIndicatorProps) {
  return (
    <div className={cn("w-64 shrink-0 bg-card border-r", className)}>
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">入驻流程</h2>
        <p className="text-sm text-muted-foreground">完成以下步骤入驻</p>
      </div>
      
      <nav className="p-4 space-y-2">
        {steps.map((step, index) => {
          const isActive = step.id === currentMainStepId;
          const isCompleted = completedMainSteps.has(step.id);
          const Icon = step.icon;
          const colors = stepColors[step.id] || stepColors.address;

          return (
            <button
              key={step.id}
              onClick={() => onStepClick?.(step.id)}
              className={cn(
                "w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left",
                isActive && `${colors.light} ring-2 ${colors.ring}`,
                isCompleted && !isActive && "bg-green-50 ring-1 ring-green-200",
                !isActive && !isCompleted && "hover:bg-muted/30"
              )}
            >
              {/* 步骤图标 */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                  isCompleted && "bg-green-400 text-white",
                  isActive && !isCompleted && `${colors.bg} text-white`,
                  !isActive && !isCompleted && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>

              {/* 步骤信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-medium truncate",
                      isActive && colors.text,
                      isCompleted && "text-green-600",
                      !isActive && !isCompleted && "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {index + 1}/{steps.length}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {step.description}
                </p>

                {/* 子步骤进度 */}
                {step.subSteps.length > 1 && (
                  <div className="flex items-center gap-1 mt-2">
                    {step.subSteps.map((subStep, subIndex) => (
                      <div
                        key={subStep.id}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors",
                          isActive && subIndex === 0
                            ? colors.bg
                            : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export { stepColors };
