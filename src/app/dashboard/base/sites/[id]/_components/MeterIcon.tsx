"use client";

import { Zap, Droplets, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface MeterIconProps {
  type: "electricity" | "water" | "heating";
  size?: "sm" | "md";
}

export function MeterIcon({ type, size = "md" }: MeterIconProps) {
  const sizeClasses = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  const styles = {
    electricity: {
      bg: "bg-gradient-to-br from-amber-100 via-amber-50 to-orange-50",
      icon: "text-amber-600",
      shadow: "shadow-amber-100/50",
    },
    water: {
      bg: "bg-gradient-to-br from-sky-100 via-cyan-50 to-blue-50",
      icon: "text-sky-600",
      shadow: "shadow-sky-100/50",
    },
    heating: {
      bg: "bg-gradient-to-br from-orange-100 via-red-50 to-rose-50",
      icon: "text-orange-500",
      shadow: "shadow-orange-100/50",
    },
  };

  const style = styles[type];
  const IconComponent = type === "electricity" ? Zap : type === "water" ? Droplets : Flame;

  return (
    <div className={cn(sizeClasses, style.bg, "rounded-xl flex items-center justify-center shadow-sm", style.shadow)}>
      <IconComponent className={cn(iconSize, style.icon)} />
    </div>
  );
}
