"use client";

import { Eye, Download, Building2, Loader2, ZoomIn, ZoomOut, RotateCcw, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ParseResult, ParsedAttachment } from "@/types/contract-template";
import type { Base, UploadedAttachment, Binding } from "../types";
import { dedupeAndSortAttachments } from "../types";
import type { TemplateVariable } from "@/types/template-variable";
import { PresetVariables } from "@/types/template-variable";

interface CompleteStepProps {
  name: string;
  description: string;
  type: string;
  baseId: string;
  bindings: Binding[];
  selectedVariables: TemplateVariable[];
  parseResult: ParseResult | null;
  uploadedAttachments: UploadedAttachment[];
  bases: Base[];
  previewZoom: number;
  editedHtml: string;
  exporting: boolean;
  onZoomChange: (zoom: number) => void;
  onQuickExport: () => void;
}

export function CompleteStep({
  name,
  description,
  type,
  baseId,
  bindings,
  selectedVariables,
  parseResult,
  uploadedAttachments,
  bases,
  previewZoom,
  editedHtml,
  exporting,
  onZoomChange,
  onQuickExport,
}: CompleteStepProps) {
  const selectedBase = bases.find(b => b.id === baseId);
  
  // 获取附件列表
  const rawAttachments = parseResult?.attachments?.length 
    ? parseResult.attachments 
    : uploadedAttachments.map(att => ({
        id: att.id,
        name: att.name,
        displayName: att.name.replace(/\.[^/.]+$/, ''),
        url: att.url,
        html: '',
        styles: '',
        text: '',
        order: 0,
      }));
  
  const allAttachments = dedupeAndSortAttachments(rawAttachments);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'tenant': return '入驻合同';
      case 'service': return '服务合同';
      case 'lease': return '租赁合同';
      default: return '其他合同';
    }
  };

  return (
    <div className="space-y-6">
      {/* 操作按钮区 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onQuickExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            导出Word
          </Button>
        </div>
        
        {/* 缩放控制 */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onZoomChange(Math.max(50, previewZoom - 10))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-12 text-center">{previewZoom}%</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onZoomChange(Math.min(150, previewZoom + 10))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onZoomChange(100)}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* 文档预览区域 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                文档预览
              </CardTitle>
              <CardDescription>预览模板效果，导出PDF查看最终效果</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="overflow-auto border rounded-lg bg-muted/30 p-4"
            style={{ maxHeight: '500px' }}
          >
            <div 
              className="mx-auto bg-white shadow-lg contract-container"
              style={{
                transform: previewZoom !== 100 ? `scale(${previewZoom / 100})` : undefined,
                transformOrigin: 'top center',
                width: '210mm',
                minHeight: '297mm',
                padding: '2.5cm 2.8cm',
              }}
            >
              <style jsx global>{`
                .contract-container table {
                  border-collapse: collapse;
                  width: 100%;
                  margin: 6pt 0;
                }
                .contract-container td, .contract-container th {
                  vertical-align: middle;
                  text-align: center;
                  padding: 2pt 4pt;
                  border: 1px solid #000;
                }
                .contract-container table[border="0"] td,
                .contract-container table[border="0"] th {
                  border: none;
                }
                .contract-container .variable-marker {
                  display: inline !important;
                  white-space: nowrap;
                }
                .contract-container .variable-marker.pending {
                  background: #fef3c7;
                  color: #92400e;
                  padding: 1px 4px;
                  border-radius: 3px;
                  border: 1px dashed #f59e0b;
                }
                .contract-container .variable-marker.bound {
                  background: #dcfce7;
                  color: #166534;
                  padding: 1px 4px;
                  border-radius: 3px;
                  border: 1px solid #22c55e;
                }
              `}</style>
              <div 
                className="contract-content"
                dangerouslySetInnerHTML={{ 
                  __html: parseResult?.styles 
                    ? `<style>${parseResult.styles}</style>${editedHtml || parseResult?.html || ''}`
                    : editedHtml || parseResult?.html || ''
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 基本信息 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">模板信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">模板名称</Label>
              <p className="font-medium">{name || "未填写"}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">所属基地</Label>
              <p className="font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {selectedBase?.name || "未选择"}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">模板类型</Label>
              <p className="font-medium">{getTypeLabel(type)}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">变量绑定</Label>
              <p className="font-medium">{bindings.length} 处</p>
            </div>
          </div>
        
          {bindings.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-muted-foreground">已绑定变量</Label>
                <div className="flex flex-wrap gap-2">
                  {bindings.map((binding) => {
                    const variable = [...selectedVariables, ...PresetVariables].find(v => v.key === binding.variableKey);
                    if (!variable) return null;
                    
                    const isComputed = variable.type === 'computed';
                    
                    return (
                      <Badge 
                        key={binding.id} 
                        variant="outline" 
                        className={cn(
                          "flex items-center gap-1",
                          isComputed ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-green-50"
                        )}
                      >
                        {variable.name}
                        {isComputed && (
                          <span className="text-[10px] bg-blue-100 px-1 rounded ml-1">
                            自动计算
                          </span>
                        )}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </>
          )}
          
          {/* 附件信息 */}
          {allAttachments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  附件 ({allAttachments.length} 个)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {allAttachments.map((att) => (
                    <Badge key={att.id} variant="outline" className="bg-muted/50">
                      {att.displayName || att.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
