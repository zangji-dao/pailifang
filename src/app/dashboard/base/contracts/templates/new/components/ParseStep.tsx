"use client";

import { FileText, Loader2, CheckCircle, AlertCircle, Files } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { UploadedAttachment } from "../types";

interface ParseStepProps {
  // 主文档信息
  mainFileName: string;
  mainFileUrl: string;
  
  // 附件信息
  attachments: UploadedAttachment[];
  
  // 解析状态
  parsing: boolean;
  parseProgress: number;
  parseError?: string;
  
  // 解析结果
  parseResult: any;
}

export function ParseStep({
  mainFileName,
  mainFileUrl,
  attachments,
  parsing,
  parseProgress,
  parseError,
  parseResult,
}: ParseStepProps) {
  return (
    <div className="space-y-6">
      {/* 解析进度 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {parsing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                正在解析文档
              </>
            ) : parseError ? (
              <>
                <AlertCircle className="h-5 w-5 text-destructive" />
                解析失败
              </>
            ) : parseResult ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                解析完成
              </>
            ) : (
              <>
                <FileText className="h-5 w-5 text-muted-foreground" />
                准备解析
              </>
            )}
          </CardTitle>
          <CardDescription>
            {parsing 
              ? "正在使用 LibreOffice 解析文档，这可能需要一些时间..." 
              : parseError 
              ? parseError 
              : parseResult 
              ? "文档已成功解析，可以进入下一步" 
              : "点击「下一步」开始解析文档"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={parseProgress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            {parsing ? `解析进度: ${parseProgress}%` : ""}
          </p>
        </CardContent>
      </Card>

      {/* 待解析文件列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">待解析文件</CardTitle>
          <CardDescription>
            共 {attachments.length + 1} 个文件需要解析
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* 主文档 */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{mainFileName}</p>
                <p className="text-xs text-muted-foreground">主合同文档</p>
              </div>
              {parseResult && !parsing && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
            
            {/* 附件列表 */}
            {attachments.map((att, index) => (
              <div 
                key={att.id} 
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <Files className="h-5 w-5 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{att.name}</p>
                  <p className="text-xs text-muted-foreground">附件 {index + 1}</p>
                </div>
                {parseResult && !parsing && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 解析提示 */}
      {parsing && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-4">
            <p className="text-sm text-amber-800">
              <strong>提示：</strong>
              LibreOffice 正在将 Word 文档转换为 HTML 格式，同时保留原始样式。
              这通常需要 10-30 秒，请耐心等待。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
