"use client";

import { Video, FileText, Sparkles, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PublishRecord, ContentType } from "../types";
import { PUBLISH_HISTORY, STATUS_CONFIG } from "../constants";

// 状态图标映射
const STATUS_ICONS: Record<string, React.ReactNode> = {
  success: "✓",
  reviewing: "⏱",
  failed: "✕",
  scheduled: "📅",
};

// 内容类型图标
const TYPE_ICONS: Record<ContentType, React.ReactNode> = {
  video: <Video className="h-6 w-6 text-slate-400" />,
  article: <FileText className="h-6 w-6 text-slate-400" />,
  dynamic: <Sparkles className="h-6 w-6 text-slate-400" />,
};

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HistoryDialog({ open, onOpenChange }: HistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>发布记录</DialogTitle>
          <DialogDescription>查看历史发布记录和状态</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {PUBLISH_HISTORY.map((record) => (
            <div
              key={record.id}
              className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {/* 封面缩略图 */}
              <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {TYPE_ICONS[record.type]}
              </div>

              {/* 内容信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-slate-900 truncate">{record.title}</h4>
                  <Badge className={cn("text-xs gap-1", STATUS_CONFIG[record.status].color)}>
                    <span className="text-xs">{STATUS_ICONS[record.status]}</span>
                    {STATUS_CONFIG[record.status].label}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <span>{record.publishTime}</span>
                  <span>•</span>
                  <span>{record.platforms.join("、")}</span>
                </div>

                {record.status === "failed" && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {record.error}
                  </p>
                )}

                {record.status === "success" && (
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>👁 {record.views}</span>
                    <span>👍 {record.likes}</span>
                    <span>💬 {record.comments}</span>
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-2">
                {record.status === "scheduled" && (
                  <Button variant="outline" size="sm">
                    取消
                  </Button>
                )}
                {record.status === "failed" && (
                  <Button variant="outline" size="sm">
                    重新发布
                  </Button>
                )}
                <Button variant="ghost" size="sm">
                  查看
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
