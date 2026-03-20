"use client";

import { Check } from "lucide-react";
import type { MeterType } from "../types";

interface TypeTagProps {
  type: MeterType;
}

export function TypeTag({ type }: TypeTagProps) {
  return type === "base" ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
      <Check className="h-3 w-3" />
      基地负责
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
      客户负责
    </span>
  );
}
