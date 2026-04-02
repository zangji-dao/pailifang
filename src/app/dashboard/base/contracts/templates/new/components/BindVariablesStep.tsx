"use client";

import { useRef, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EditorToolbar } from "./EditorToolbar";
import { MarkerPanel } from "./MarkerPanel";
import { AttachmentTabs } from "./AttachmentTabs";
import type { ParseResult } from "@/types/contract-template";
import type { Marker, Binding } from "../types";
import type { TemplateVariable } from "@/types/template-variable";

interface BindVariablesStepProps {
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
  onSyncEditedContent: () => void;
  onSaveSelection: () => void;
  // 编辑器命令
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onStrikethrough: () => void;
  onAlign: (alignment: 'left' | 'center' | 'right' | 'justify') => void;
  onOrderedList: () => void;
  onUnorderedList: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  onSetFont: (font: string) => void;
  onSetFontSize: (size: number) => void;
  onSetLineHeight: (lineHeight: string) => void;
  onApplyPreset: (preset: string) => void;
  onAddUnderlineFill: () => void;
  onInsertTable: (rows: number, cols: number) => void;
  onDeleteRow: () => void;
  onDeleteColumn: () => void;
  onPrint: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export function BindVariablesStep({
  parseResult,
  editedHtml,
  activeDocumentId,
  markers,
  activeMarkerId,
  showVariablePicker,
  selectedVariables,
  zoom,
  contentRef,
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
  onSyncEditedContent,
  onSaveSelection,
  onBold,
  onItalic,
  onUnderline,
  onStrikethrough,
  onAlign,
  onOrderedList,
  onUnorderedList,
  onIndent,
  onOutdent,
  onSetFont,
  onSetFontSize,
  onSetLineHeight,
  onApplyPreset,
  onAddUnderlineFill,
  onInsertTable,
  onDeleteRow,
  onDeleteColumn,
  onPrint,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: BindVariablesStepProps) {
  // 获取当前文档的HTML
  const currentDocumentHtml = useMemo(() => {
    if (activeDocumentId === 'main') {
      // 主合同：优先使用编辑后的内容
      return editedHtml || parseResult?.html || '';
    }
    // 附件：直接使用附件的 HTML
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

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            onBold();
            break;
          case 'i':
            e.preventDefault();
            onItalic();
            break;
          case 'u':
            e.preventDefault();
            onAddUnderlineFill();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBold, onItalic, onAddUnderlineFill]);

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
                在文档中定位光标后，点击右侧「插入变量标记」按钮
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        {/* 工具栏 - 固定在标题下方 */}
        <div className="shrink-0">
          <EditorToolbar
            zoom={zoom}
            onSaveSelection={onSaveSelection}
            onBold={onBold}
            onItalic={onItalic}
            onUnderline={onUnderline}
            onStrikethrough={onStrikethrough}
            onAlign={onAlign}
            onOrderedList={onOrderedList}
            onUnorderedList={onUnorderedList}
            onIndent={onIndent}
            onOutdent={onOutdent}
            onSetFont={onSetFont}
            onSetFontSize={onSetFontSize}
            onSetLineHeight={onSetLineHeight}
            onApplyPreset={onApplyPreset}
            onAddUnderlineFill={onAddUnderlineFill}
            onInsertTable={onInsertTable}
            onDeleteRow={onDeleteRow}
            onDeleteColumn={onDeleteColumn}
            onPrint={onPrint}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onZoomReset={onZoomReset}
          />
        </div>
        
        {/* 文档内容区域 - 单独滚动 */}
        <div className="flex-1 overflow-auto p-4 bg-muted/30">
          <div 
            className="mx-auto bg-white shadow-lg contract-container"
            style={{
              width: '210mm',
              minHeight: '297mm',
              padding: '2.5cm 2.8cm',
              transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
              transformOrigin: 'top center',
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
              /* 变量标记样式 - 确保内联显示 */
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
              @media print {
                .contract-container {
                  width: 210mm !important;
                  padding: 2.54cm 3.17cm !important;
                  box-sizing: border-box !important;
                }
                @page {
                  size: A4;
                  margin: 0;
                }
              }
            `}</style>
            <div
              ref={contentRef}
              className="contract-content outline-none"
              contentEditable
              suppressContentEditableWarning
              onBlur={onSyncEditedContent}
              onKeyDown={(e) => {
                // 阻止回车键创建新段落（可选）
                if (e.key === 'Enter' && !e.shiftKey) {
                  // 默认行为
                }
              }}
              dangerouslySetInnerHTML={{ 
                __html: currentDocumentStyles 
                  ? `<style>${currentDocumentStyles}</style>${currentDocumentHtml}`
                  : currentDocumentHtml
              }}
            />
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
