"use client";

import { useRef } from "react";
import { Upload, FileText, Plus, GripVertical, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { AttachmentFile, Base } from "../types";
import { formatFileSize } from "../types";

interface UploadStepProps {
  mainFile: File | null;
  mainFileUrl: string | null;
  mainFileName: string | null;
  uploading: boolean;
  parsing: boolean;
  parseProgress: number;
  attachments: AttachmentFile[];
  bases: Base[];
  draggedId: string | null;
  dragOverId: string | null;
  onMainFileSelect: (file: File) => void;
  onAttachmentsSelect: (files: FileList) => void;
  onRemoveAttachment: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onNext: () => void;
}

export function UploadStep({
  mainFile,
  mainFileUrl,
  mainFileName,
  uploading,
  parsing,
  parseProgress,
  attachments,
  bases,
  draggedId,
  dragOverId,
  onMainFileSelect,
  onAttachmentsSelect,
  onRemoveAttachment,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onNext,
}: UploadStepProps) {
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const handleMainFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onMainFileSelect(file);
    }
  };

  const handleAttachmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onAttachmentsSelect(e.target.files);
    }
  };

  return (
    <div className="space-y-6">
      {/* 主文档上传 */}
      <Card>
        <CardHeader>
          <CardTitle>合同主文档</CardTitle>
          <CardDescription>上传合同主文档，支持 .doc、.docx 格式</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => mainFileInputRef.current?.click()}
          >
            <input
              ref={mainFileInputRef}
              type="file"
              accept=".doc,.docx"
              onChange={handleMainFileChange}
              className="hidden"
            />
            
            {mainFile || mainFileUrl ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div className="text-left">
                  <p className="font-medium">{mainFileName || mainFile?.name || '合同文档'}</p>
                  <p className="text-sm text-muted-foreground">
                    {mainFile ? formatFileSize(mainFile.size) : <span className="text-green-500">已上传</span>}
                  </p>
                </div>
                {mainFileUrl && !mainFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      mainFileInputRef.current?.click();
                    }}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    重新上传
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">点击上传合同文档</p>
                <p className="text-sm text-muted-foreground">支持 .doc、.docx 格式</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 附件上传 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>合同附件</CardTitle>
              <CardDescription>附件将与主合同合并展示，支持绑定变量</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => attachmentInputRef.current?.click()}
            >
              <Plus className="h-4 w-4 mr-1" />
              添加附件
            </Button>
            <input
              ref={attachmentInputRef}
              type="file"
              accept=".doc,.docx"
              multiple
              onChange={handleAttachmentsChange}
              className="hidden"
            />
          </div>
        </CardHeader>
        <CardContent>
          {attachments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
              <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">点击"添加附件"上传附件文件</p>
              <p className="text-xs mt-1">仅支持 Word 格式，将合并到主合同预览</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attachments.map((att, index) => (
                <div
                  key={att.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, att.id)}
                  onDragOver={(e) => onDragOver(e, att.id)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, att.id)}
                  onDragEnd={onDragEnd}
                  className={cn(
                    "flex items-center gap-3 p-3 bg-muted/50 rounded-lg transition-all cursor-move",
                    draggedId === att.id && "opacity-50 scale-[0.98]",
                    dragOverId === att.id && "border-2 border-amber-500 bg-amber-50/50"
                  )}
                >
                  <div className="text-muted-foreground hover:text-foreground transition-colors">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{att.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {att.uploading ? (
                          <span className="text-amber-500">上传中...</span>
                        ) : att.size > 0 ? (
                          formatFileSize(att.size)
                        ) : att.url ? (
                          <span className="text-green-500">已上传</span>
                        ) : (
                          '待上传'
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onRemoveAttachment(att.id); }}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <p className="text-xs text-muted-foreground text-center pt-2">拖拽附件可调整顺序</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 上传进度 */}
      {(uploading || parsing) && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{parsing ? "正在解析文档..." : "正在上传..."}</span>
              </div>
              <Progress value={parseProgress} />
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
