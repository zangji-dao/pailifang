"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PublishFormData } from "../types";
import { PLATFORMS } from "../constants";

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: PublishFormData;
}

export function PreviewDialog({ open, onOpenChange, formData }: PreviewDialogProps) {
  const selectedPlatformNames = formData.selectedPlatforms.length > 0
    ? PLATFORMS.filter((p) => formData.selectedPlatforms.includes(p.id))
        .map((p) => p.name)
        .join("、")
    : "未选择平台";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>内容预览</DialogTitle>
          <DialogDescription>预览内容在移动端的展示效果</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center">
          <div className="w-[320px] border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-lg">
            {/* 模拟手机顶部 */}
            <div className="h-6 bg-slate-100 flex items-center justify-center">
              <div className="w-16 h-1 bg-slate-300 rounded-full"></div>
            </div>

            {/* 内容区 */}
            <div className="p-4 space-y-3">
              {/* 封面 */}
              {formData.coverImage && (
                <img src={formData.coverImage} alt="封面" className="w-full h-40 object-cover rounded-lg" />
              )}

              {/* 标题 */}
              <h3 className="font-bold text-lg">{formData.title || "未输入标题"}</h3>

              {/* 内容 */}
              <p className="text-sm text-slate-600 leading-relaxed">{formData.content || "未输入内容"}</p>

              {/* 标签 */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag, i) => (
                    <span key={i} className="text-xs text-blue-500">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 平台信息 */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">将发布至：{selectedPlatformNames}</p>
              </div>
            </div>
          </div>
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
