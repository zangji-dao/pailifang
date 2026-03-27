"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { MainStep } from "../_constants/steps";

// 柔和的七彩配色方案 - 使用语义化变量
const stepColors: Record<string, { bg: string; text: string; light: string; ring: string }> = {
  address: {
    bg: "bg-step-sky",
    text: "text-step-sky",
    light: "bg-step-sky-muted",
    ring: "ring-step-sky/30",
  },
  registration: {
    bg: "bg-step-violet",
    text: "text-step-violet",
    light: "bg-step-violet-muted",
    ring: "ring-step-violet/30",
  },
  contract: {
    bg: "bg-step-amber",
    text: "text-step-amber",
    light: "bg-step-amber-muted",
    ring: "ring-step-amber/30",
  },
  payment: {
    bg: "bg-step-emerald",
    text: "text-step-emerald",
    light: "bg-step-emerald-muted",
    ring: "ring-step-emerald/30",
  },
  complete: {
    bg: "bg-step-rose",
    text: "text-step-rose",
    light: "bg-step-rose-muted",
    ring: "ring-step-rose/30",
  },
};

interface VerticalStepIndicatorProps {
  steps: MainStep[];
  currentMainStepId: string;
  completedMainSteps: Set<string>;
  onStepClick?: (stepId: string) => void;
  className?: string;
  isNonTenant?: boolean; // 服务企业过滤可选大步骤
}

export function VerticalStepIndicator({
  steps,
  currentMainStepId,
  completedMainSteps,
  onStepClick,
  className,
  isNonTenant = false,
}: VerticalStepIndicatorProps) {
  // 服务企业过滤掉可选的大步骤（合同、缴费）
  const displaySteps = isNonTenant 
    ? steps.filter(step => !step.isOptional)
    : steps;
  
  return (
    <div className={cn("w-64 shrink-0 bg-card border-r", className)}>
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">{isNonTenant ? "服务企业流程" : "入驻流程"}</h2>
        <p className="text-sm text-muted-foreground">{isNonTenant ? "完成以下步骤创建" : "完成以下步骤入驻"}</p>
      </div>
      
      <nav className="p-4 space-y-2">
        {displaySteps.map((step, index) => {
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
                isCompleted && !isActive && "bg-step-emerald-muted ring-1 ring-step-emerald/30",
                !isActive && !isCompleted && "hover:bg-muted/30"
              )}
            >
              {/* 步骤图标 */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors text-step-emerald-foreground",
                  isCompleted && "bg-step-emerald",
                  isActive && !isCompleted && `${colors.bg} text-step-sky-foreground`,
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
                      isCompleted && "text-step-emerald",
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
