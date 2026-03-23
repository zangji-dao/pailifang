"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { SubStep } from "../_constants/steps";
import { stepColors } from "./VerticalStepIndicator";

interface HorizontalSubStepIndicatorProps {
  subSteps: SubStep[];
  currentSubStepId: string;
  completedSubSteps: Set<string>;
  mainStepId?: string;
  onSubStepClick?: (subStepId: string) => void;
  className?: string;
}

export function HorizontalSubStepIndicator({
  subSteps,
  currentSubStepId,
  completedSubSteps,
  mainStepId,
  onSubStepClick,
  className,
}: HorizontalSubStepIndicatorProps) {
  if (subSteps.length <= 1) {
    return null;
  }

  const colors = stepColors[mainStepId || "address"] || stepColors.address;

  return (
    <div className={cn("bg-card border-b px-6 py-4", className)}>
      <div className="flex items-center justify-center gap-2">
        {subSteps.map((subStep, index) => {
          const isActive = subStep.id === currentSubStepId;
          const isCompleted = completedSubSteps.has(`${mainStepId}_${subStep.id}`);
          const Icon = subStep.icon;
          const isLast = index === subSteps.length - 1;

          return (
            <div key={subStep.id} className="flex items-center">
              <button
                onClick={() => onSubStepClick?.(subStep.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                  isActive && `${colors.light} ring-2 ${colors.ring}`,
                  isCompleted && !isActive && "bg-green-50 text-green-600 ring-1 ring-green-200",
                  !isActive && !isCompleted && "text-muted-foreground hover:bg-muted/30"
                )}
              >
                {/* 子步骤图标 */}
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                    isCompleted && "bg-green-400 text-white",
                    isActive && !isCompleted && `${colors.bg} text-white`,
                    !isActive && !isCompleted && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Icon className="w-3 h-3" />
                  )}
                </div>

                {/* 子步骤标题 */}
                <span
                  className={cn(
                    "text-sm font-medium whitespace-nowrap",
                    isActive && colors.text,
                    isCompleted && !isActive && "text-green-600",
                    !isActive && !isCompleted && "text-muted-foreground"
                  )}
                >
                  {subStep.title}
                </span>

                {/* 可选标签 */}
                {subStep.isOptional && (
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    可选
                  </span>
                )}
              </button>

              {/* 连接线 */}
              {!isLast && (
                <div
                  className={cn(
                    "w-8 h-0.5 mx-1 rounded-full",
                    isCompleted ? "bg-green-300" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 当前子步骤描述 */}
      {subSteps.find(s => s.id === currentSubStepId)?.description && (
        <p className="text-center text-sm text-muted-foreground mt-2">
          {subSteps.find(s => s.id === currentSubStepId)?.description}
        </p>
      )}
    </div>
  );
}
