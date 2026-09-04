"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { MeterCard } from "./MeterCard";
import type { Meter } from "../types";

interface DraggableMeterCardProps {
  meter: Meter;
  baseId: string;
  propertyFeeMode: "charged" | "free";
}

export function DraggableMeterCard({ meter, baseId, propertyFeeMode }: DraggableMeterCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: meter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/drag">
      {/* 拖拽手柄 */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`调整${meter.name || meter.code}顺序`}
        title="拖动调整顺序"
        className="absolute left-3 top-3 z-10 cursor-grab rounded-md border border-slate-200 bg-white/90 p-1.5 opacity-100 transition-opacity hover:bg-slate-50 active:cursor-grabbing sm:opacity-0 sm:group-hover/drag:opacity-100 sm:focus:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 text-slate-400" />
      </button>
      
      <MeterCard meter={meter} baseId={baseId} propertyFeeMode={propertyFeeMode} />
    </div>
  );
}
