"use client";

import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { dedupeAndSortAttachments } from "../types";
import type { ParseResult } from "@/types/contract-template";

interface AttachmentTabsProps {
  parseResult: ParseResult | null;
  activeDocumentId: string;
  onDocumentChange: (id: string) => void;
}

export function AttachmentTabs({
  parseResult,
  activeDocumentId,
  onDocumentChange,
}: AttachmentTabsProps) {
  // 调试信息
  console.log('AttachmentTabs - 调试信息:', {
    hasParseResult: !!parseResult,
    attachments: parseResult?.attachments,
    attachmentsLength: parseResult?.attachments?.length || 0,
  });

  if (!parseResult?.attachments || parseResult.attachments.length === 0) {
    console.log('AttachmentTabs - 没有附件，不显示标签页');
    return null;
  }

  const uniqueAttachments = dedupeAndSortAttachments(parseResult.attachments);
  console.log('AttachmentTabs - 去重排序后的附件:', uniqueAttachments);

  if (uniqueAttachments.length === 0) {
    console.log('AttachmentTabs - 去重后没有附件，不显示标签页');
    return null;
  }

  return (
    <div className="shrink-0 bg-white border-t flex items-center px-2 py-1.5 gap-1 min-h-[36px]">
      <button
        onClick={() => onDocumentChange('main')}
        className={cn(
          "px-3 py-1.5 text-xs rounded-t border-b-2 transition-colors",
          activeDocumentId === 'main'
            ? "bg-background border-primary text-primary font-medium"
            : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted"
        )}
      >
        <FileText className="h-3 w-3 inline-block mr-1" />
        主合同
      </button>
      {uniqueAttachments.map((att) => {
        const displayName = att.displayName || att.name?.replace(/\.[^/.]+$/, '') || '未命名附件';
        return (
          <button
            key={att.id}
            onClick={() => onDocumentChange(att.id)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-t border-b-2 transition-colors max-w-32 truncate",
              activeDocumentId === att.id
                ? "bg-background border-primary text-primary font-medium"
                : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted"
            )}
            title={displayName}
          >
            <FileText className="h-3 w-3 inline-block mr-1" />
            {displayName}
          </button>
        );
      })}
    </div>
  );
}
