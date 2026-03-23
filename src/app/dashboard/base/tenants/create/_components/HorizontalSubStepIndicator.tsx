"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { SubStep } from "../_constants/steps";

interface HorizontalSubStepIndicatorProps {
  subSteps: SubStep[];
  currentSubStepId: string;
  completedSubSteps: Set<string>;
  onSubStepClick?: (subStepId: string) => void;
  className?: string;
}

export function HorizontalSubStepIndicator({
  subSteps,
  currentSubStepId,
  completedSubSteps,
  onSubStepClick,
  className,
}: HorizontalSubStepIndicatorProps) {
  if (subSteps.length <= 1) {
    return null;
  }

  return (
    <div className={cn("bg-card border-b px-6 py-4", className)}>
      <div className="flex items-center justify-center gap-2">
        {subSteps.map((subStep, index) => {
          const isActive = subStep.id === currentSubStepId;
          const isCompleted = completedSubSteps.has(subStep.id);
          const Icon = subStep.icon;
          const isLast = index === subSteps.length - 1;

          return (
            <div key={subStep.id} className="flex items-center">
              <button
                onClick={() => onSubStepClick?.(subStep.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                  isActive && "bg-primary/10 border border-primary/20",
                  isCompleted && !isActive && "text-primary",
                  !isActive && !isCompleted && "text-muted-foreground hover:bg-muted/30"
                )}
              >
                {/* 子步骤图标 */}
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                    isCompleted && "bg-primary text-primary-foreground",
                    isActive && !isCompleted && "bg-primary text-primary-foreground",
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
                    isActive && "text-primary",
                    isCompleted && !isActive && "text-primary",
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
                    "w-8 h-0.5 mx-1",
                    isCompleted ? "bg-primary" : "bg-muted"
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
