"use client";

import { FileText, Loader2, CheckCircle, AlertCircle, Files, Play, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
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
  parseError?: string | null;
  
  // 解析结果
  parseResult: any;
  
  // 开始解析回调
  onStartParse: () => void;
}

export function ParseStep({
  mainFileName,
  mainFileUrl,
  attachments,
  parsing,
  parseProgress,
  parseError,
  parseResult,
  onStartParse,
}: ParseStepProps) {
  // 计算所有文档的解析状态
  const totalFiles = 1 + attachments.length; // 主文档 + 附件
  const allParsed = parseResult && !parsing;
  
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
              : `共 ${totalFiles} 个文件需要解析，点击下方按钮开始解析`}
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
            共 {totalFiles} 个文件需要解析
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* 主文档 */}
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-lg",
              parsing ? "bg-blue-50/50 border border-blue-200" : "bg-muted/50",
              allParsed && "bg-green-50/50 border border-green-200"
            )}>
              {parsing ? (
                <Loader2 className="h-5 w-5 text-blue-500 shrink-0 animate-spin" />
              ) : allParsed ? (
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              ) : (
                <FileText className="h-5 w-5 text-blue-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{mainFileName}</p>
                <p className="text-xs text-muted-foreground">主合同文档</p>
              </div>
              {allParsed && (
                <span className="text-xs text-green-600 font-medium">已解析</span>
              )}
            </div>
            
            {/* 附件列表 */}
            {attachments.map((att, index) => (
              <div 
                key={att.id} 
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg",
                  parsing ? "bg-amber-50/50 border border-amber-200" : "bg-muted/50",
                  allParsed && "bg-green-50/50 border border-green-200"
                )}
              >
                {parsing ? (
                  <Loader2 className="h-5 w-5 text-amber-500 shrink-0 animate-spin" />
                ) : allParsed ? (
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                ) : (
                  <Files className="h-5 w-5 text-amber-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{att.name}</p>
                  <p className="text-xs text-muted-foreground">附件 {index + 1}</p>
                </div>
                {allParsed && (
                  <span className="text-xs text-green-600 font-medium">已解析</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 开始解析按钮 */}
      {!parseResult && !parsing && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground text-center">
                点击下方按钮开始解析所有文档，解析过程可能需要 10-30 秒
              </p>
              <Button 
                size="lg" 
                onClick={onStartParse}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                开始解析
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* 解析成功提示 */}
      {allParsed && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-800">
                <strong>解析完成！</strong>
                所有文档已成功解析，请点击「下一步」继续配置变量绑定。
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onStartParse}
                className="gap-1.5 text-green-700 border-green-300 hover:bg-green-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                重新解析
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 解析失败提示 */}
      {parseError && !parsing && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-800">
                <strong>解析失败：</strong>{parseError}
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onStartParse}
                className="gap-1.5 text-red-700 border-red-300 hover:bg-red-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                重试
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
