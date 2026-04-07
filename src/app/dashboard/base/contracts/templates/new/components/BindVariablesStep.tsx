/**
 * Quill 编辑器版本 - 绑定变量步骤
 * 使用 Quill 自带工具栏
 */
"use client";

import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MarkerPanel } from "./MarkerPanel";
import { AttachmentTabs } from "./AttachmentTabs";
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import type { ParseResult } from "@/types/contract-template";
import type { Marker } from "../types";
import type { TemplateVariable } from "@/types/template-variable";

// 扩展 Quill 类型
declare module 'quill' {
  interface Quill {
    root: HTMLElement;
  }
}

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
  // 保留这些以兼容原有接口，但不再使用
  onSaveSelection?: () => void;
  onDetectCurrentFormat?: () => void;
  onBold?: () => void;
  onItalic?: () => void;
  onUnderline?: () => void;
  onStrikethrough?: () => void;
  onAlign?: (alignment: 'left' | 'center' | 'right' | 'justify') => void;
  onOrderedList?: () => void;
  onUnorderedList?: () => void;
  onIndent?: () => void;
  onOutdent?: () => void;
  onSetFont?: (font: string) => void;
  onSetFontSize?: (size: number) => void;
  onSetLineHeight?: (lineHeight: string) => void;
  onApplyPreset?: (preset: string) => void;
  onAddUnderlineFill?: () => void;
  onInsertTable?: (rows: number, cols: number) => void;
  onDeleteRow?: () => void;
  onDeleteColumn?: () => void;
  onPrint?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
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
  onSyncEditedContent,
}: BindVariablesStepProps) {
  const quillContainerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const [isQuillReady, setIsQuillReady] = useState(false);

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

  // 初始化 Quill
  useEffect(() => {
    if (!quillContainerRef.current || quillRef.current) return;

    const quill = new Quill(quillContainerRef.current, {
      modules: {
        toolbar: [
          [{ 'font': [] }],
          [{ 'size': ['small', false, 'large', 'huge'] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'align': [] }],
          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
          [{ 'indent': '-1' }, { 'indent': '+1' }],
          ['link'],
          ['clean'],
        ],
      },
      placeholder: '请输入合同内容...',
      theme: 'snow',
    });

    quillRef.current = quill;
    setIsQuillReady(true);

    // 监听内容变化
    quill.on('text-change', () => {
      const html = quill.root.innerHTML;
      onEditedHtmlChange(html);
    });

    return () => {
      quill.off('text-change');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 设置初始内容
  useEffect(() => {
    if (quillRef.current && currentDocumentHtml && isQuillReady) {
      const currentContent = quillRef.current.root.innerHTML;
      // 只在内容真正变化时更新
      if (currentContent !== currentDocumentHtml) {
        quillRef.current.root.innerHTML = currentDocumentHtml;
      }
    }
  }, [currentDocumentHtml, isQuillReady]);

  // 同步 contentRef 以便外部使用
  useEffect(() => {
    if (quillRef.current && contentRef) {
      (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = quillRef.current.root;
    }
  }, [contentRef, isQuillReady]);

  // 插入变量标记 - 需要适配 Quill
  const handleInsertMarker = useCallback(() => {
    if (!quillRef.current) return;
    
    const selection = quillRef.current.getSelection();
    if (!selection) {
      // 没有选区时，提示用户先定位光标
      alert('请先将光标定位到要插入变量的位置');
      return;
    }

    // 调用原来的插入逻辑
    onInsertMarker();
  }, [onInsertMarker]);

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
                选中文字后使用上方工具栏设置格式，定位光标后点击右侧「插入变量标记」
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        {/* Quill 编辑器 - 工具栏由 Quill 自动生成 */}
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
              /* 变量标记样式 */
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
              /* Quill 编辑器样式 */
              .contract-container .ql-container {
                font-size: 12pt;
                font-family: SimSun, serif;
              }
              .contract-container .ql-editor {
                padding: 0;
                min-height: 100%;
              }
              .contract-container .ql-editor.ql-blank::before {
                font-style: normal;
                color: #999;
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
            
            {/* Quill 编辑器容器 */}
            <div 
              ref={quillContainerRef}
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
          onInsertMarker={handleInsertMarker}
          onRemoveMarker={onRemoveMarker}
          onChangeVariable={onChangeVariable}
          onSetActiveMarker={onSetActiveMarker}
          showVariablePicker={showVariablePicker}
          onShowVariablePicker={onShowVariablePicker}
          selectedVariables={selectedVariables}
          onBindVariable={onBindVariable}
          onAddCustomVariable={onAddCustomVariable}
          onRemoveCustomVariable={onRemoveCustomVariable}
          onUpdateCustomVariable={onUpdateCustomVariable}
        />
      </div>
    </div>
  );
}
