"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
  onCopy: () => void;
}

export function ShareDialog({ open, onOpenChange, shareUrl, onCopy }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">分享申请表单</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* 二维码区域 */}
          <div className="flex flex-col items-center py-4">
            <div className="p-4 bg-white rounded-2xl shadow-lg border">
              <QRCodeSVG
                value={shareUrl}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              扫描二维码填写表单
            </p>
          </div>

          {/* 分隔线 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">或者</span>
            </div>
          </div>

          {/* 链接复制 */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">复制链接发送给客户</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-muted rounded-md text-xs text-muted-foreground break-all max-h-16 overflow-y-auto">
                {shareUrl}
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleCopy}
                className={copied ? "shrink-0 px-3 bg-emerald-600 hover:bg-emerald-600" : "shrink-0 px-3"}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* 提示信息 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800 text-center">
              链接有效期7天，客户填写后数据将保存到您的账号
            </p>
          </div>

          {/* 操作按钮 */}
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            完成
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
