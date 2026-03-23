"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { MeterCard } from "./MeterCard";
import type { Meter } from "../types";

interface DraggableMeterCardProps {
  meter: Meter;
  baseId: string;
}

export function DraggableMeterCard({ meter, baseId }: DraggableMeterCardProps) {
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
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 left-3 z-10 p-1.5 rounded-lg bg-white/80 border border-slate-200 cursor-grab active:cursor-grabbing opacity-0 group-hover/drag:opacity-100 transition-opacity hover:bg-slate-50"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 text-slate-400" />
      </div>
      
      <MeterCard meter={meter} baseId={baseId} />
    </div>
  );
}
