"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AttachmentTabs } from "./AttachmentTabs";
import type { ParseResult } from "@/types/contract-template";
import type { Marker } from "../types";
import type { TemplateVariable } from "@/types/template-variable";
import { useTiptapEditor } from "../hooks/useTiptapEditor";
import { TiptapToolbar } from "./TiptapToolbar";
import { MarkerPanel } from "./MarkerPanel";

interface TiptapBindVariablesStepProps {
  parseResult: ParseResult | null;
  editedHtml: string;
  activeDocumentId: string;
  markers: Marker[];
  activeMarkerId: string | null;
  showVariablePicker: boolean;
  selectedVariables: TemplateVariable[];
  zoom: number;
  contentRef: React.RefObject<HTMLDivElement | null>;
  onEditedHtmlChange: (html: string) => void;
  onDocumentChange: (id: string) => void;
  onZoomChange: (zoom: number) => void;
  onInsertMarker: () => void;
  onBindVariable: (variable: TemplateVariable) => void;
  onRemoveMarker: (markerId: string) => void;
  onChangeVariable: (markerId: string) => void;
  onSetActiveMarker: (markerId: string | null) => void;
  onShowVariablePicker: (show: boolean) => void;
  onAddCustomVariable: (variable: Partial<TemplateVariable>, onSuccess?: () => void) => boolean;
  onRemoveCustomVariable?: (key: string) => void;
  onUpdateCustomVariable?: (key: string, variable: Partial<TemplateVariable>) => boolean;
}

export function TiptapBindVariablesStep({
  parseResult,
  editedHtml,
  activeDocumentId,
  markers,
  activeMarkerId,
  showVariablePicker,
  selectedVariables,
  zoom,
  contentRef,
  onEditedHtmlChange,
  onDocumentChange,
  onZoomChange,
  onInsertMarker,
  onBindVariable,
  onRemoveMarker,
  onChangeVariable,
  onSetActiveMarker,
  onShowVariablePicker,
  onAddCustomVariable,
  onRemoveCustomVariable,
  onUpdateCustomVariable,
}: TiptapBindVariablesStepProps) {
  // 获取当前文档的HTML
  const currentDocumentHtml = useMemo(() => {
    if (activeDocumentId === 'main') {
      return editedHtml || parseResult?.html || '';
    }
    const attachment = parseResult?.attachments?.find(a => a.id === activeDocumentId);
    return attachment?.html || '';
  }, [activeDocumentId, parseResult, editedHtml]);

  // 获取当前文档的样式
  const currentDocumentStyles = useMemo(() => {
    if (activeDocumentId === 'main') {
      return parseResult?.styles || '';
    }
    const attachment = parseResult?.attachments?.find(a => a.id === activeDocumentId);
    return attachment?.styles || '';
  }, [activeDocumentId, parseResult]);

  // 使用 TipTap 编辑器 hook
  const { editor, EditorContent, handleApplyPreset } = useTiptapEditor({
    initialContent: currentDocumentHtml,
    onUpdate: (html) => {
      onEditedHtmlChange(html);
    },
  });

  if (!editor) {
    return <div className="flex items-center justify-center h-full">加载编辑器...</div>;
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[600px]">
      {/* 左侧：文档编辑区域 */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        {/* 标题区域 */}
        <CardHeader className="py-2.5 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">编辑合同文档</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                选中文字后直接点击工具栏设置格式，选区不会丢失
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        {/* TipTap 工具栏 */}
        <TiptapToolbar editor={editor} onApplyPreset={handleApplyPreset} />

        {/* 编辑区域 */}
        <div 
          className="flex-1 overflow-auto bg-gray-100 p-4"
          style={{ 
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center'
          }}
        >
          <div className="max-w-[8.27in] mx-auto shadow-lg bg-white min-h-[11.69in]">
            <style>{`
              @media print {
                .contract-content {
                  padding: 2.54cm 3.17cm !important;
                  box-sizing: border-box !important;
                }
                @page {
                  size: A4;
                  margin: 0;
                }
              }
              ${currentDocumentStyles}
            `}</style>
            <div
              ref={contentRef}
              className="contract-content outline-none p-[2.54cm_3.17cm] min-h-full"
            >
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
        
        {/* 文档标签页 */}
        <AttachmentTabs
          parseResult={parseResult}
          activeDocumentId={activeDocumentId}
          onDocumentChange={onDocumentChange}
        />
      </Card>

      {/* 右侧：标记面板 */}
      <div className="w-80 shrink-0 h-full">
        <MarkerPanel
          markers={markers}
          activeDocumentId={activeDocumentId}
          activeMarkerId={activeMarkerId}
          showVariablePicker={showVariablePicker}
          selectedVariables={selectedVariables}
          onInsertMarker={onInsertMarker}
          onBindVariable={onBindVariable}
          onRemoveMarker={onRemoveMarker}
          onChangeVariable={onChangeVariable}
          onSetActiveMarker={onSetActiveMarker}
          onShowVariablePicker={onShowVariablePicker}
          onAddCustomVariable={onAddCustomVariable}
          onRemoveCustomVariable={onRemoveCustomVariable}
          onUpdateCustomVariable={onUpdateCustomVariable}
        />
      </div>
    </div>
  );
}
