"use client";

import { useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  IndentIncrease,
  IndentDecrease,
  Table,
  Trash2,
  Type,
  Minus,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FONT_OPTIONS, LINE_HEIGHT_OPTIONS, DOCUMENT_PRESETS } from "../types";

interface EditorToolbarProps {
  zoom: number;
  onSaveSelection: () => void;
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

export function EditorToolbar({
  zoom,
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
}: EditorToolbarProps) {
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // 包装按钮，在 mousedown 时保存选区
  const ToolButton = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
    <Button 
      variant="ghost" 
      size="sm" 
      onMouseDown={(e) => {
        e.preventDefault();
        onSaveSelection();
      }}
      onClick={onClick} 
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-muted/30 flex-wrap">
      {/* 字体选择 */}
      <Select onValueChange={(v) => { onSaveSelection(); onSetFont(v); }}>
        <SelectTrigger className="w-28 h-8">
          <SelectValue placeholder="字体" />
        </SelectTrigger>
        <SelectContent className="z-50">
          {FONT_OPTIONS.map(font => (
            <SelectItem key={font.value} value={font.value}>
              {font.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 字号选择 */}
      <Select onValueChange={(v) => { onSaveSelection(); onSetFontSize(Number(v)); }}>
        <SelectTrigger className="w-16 h-8">
          <SelectValue placeholder="字号" />
        </SelectTrigger>
        <SelectContent className="z-50">
          {[8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72].map(size => (
            <SelectItem key={size} value={String(size)}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 文本格式 */}
      <ToolButton onClick={onBold} title="加粗">
        <Bold className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={onItalic} title="斜体">
        <Italic className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={onUnderline} title="下划线">
        <Underline className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={onStrikethrough} title="删除线">
        <Strikethrough className="h-4 w-4" />
      </ToolButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 对齐 */}
      <ToolButton onClick={() => onAlign('left')} title="左对齐">
        <AlignLeft className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={() => onAlign('center')} title="居中">
        <AlignCenter className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={() => onAlign('right')} title="右对齐">
        <AlignRight className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={() => onAlign('justify')} title="两端对齐">
        <AlignJustify className="h-4 w-4" />
      </ToolButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 列表 */}
      <ToolButton onClick={onUnorderedList} title="无序列表">
        <List className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={onOrderedList} title="有序列表">
        <ListOrdered className="h-4 w-4" />
      </ToolButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 缩进 */}
      <ToolButton onClick={onIndent} title="增加缩进">
        <IndentIncrease className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={onOutdent} title="减少缩进">
        <IndentDecrease className="h-4 w-4" />
      </ToolButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 行间距 */}
      <Select onValueChange={(v) => { onSaveSelection(); onSetLineHeight(v); }}>
        <SelectTrigger className="w-20 h-8">
          <SelectValue placeholder="行距" />
        </SelectTrigger>
        <SelectContent className="z-50">
          {LINE_HEIGHT_OPTIONS.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 公文格式预设 */}
      <Select onValueChange={(v) => { onSaveSelection(); onApplyPreset(v); }}>
        <SelectTrigger className="w-28 h-8">
          <SelectValue placeholder="格式" />
        </SelectTrigger>
        <SelectContent className="z-50">
          {DOCUMENT_PRESETS.map(preset => (
            <SelectItem key={preset.key} value={preset.key}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 下划线填充 */}
      <ToolButton onClick={onAddUnderlineFill} title="下划线填充">
        <Minus className="h-4 w-4" />
      </ToolButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 表格 */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" title="插入表格" onMouseDown={(e) => { e.preventDefault(); onSaveSelection(); }}>
            <Table className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">行数:</span>
              <input
                type="number"
                min={1}
                max={20}
                value={tableRows}
                onChange={(e) => setTableRows(Number(e.target.value))}
                className="w-16 border rounded px-2 py-1 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">列数:</span>
              <input
                type="number"
                min={1}
                max={10}
                value={tableCols}
                onChange={(e) => setTableCols(Number(e.target.value))}
                className="w-16 border rounded px-2 py-1 text-sm"
              />
            </div>
            <Button
              size="sm"
              className="w-full"
              onMouseDown={(e) => { e.preventDefault(); onSaveSelection(); }}
              onClick={() => onInsertTable(tableRows, tableCols)}
            >
              插入表格
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <ToolButton onClick={onDeleteRow} title="删除行">
        删行
      </ToolButton>
      <ToolButton onClick={onDeleteColumn} title="删除列">
        删列
      </ToolButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 打印和缩放 */}
      <Button variant="ghost" size="sm" onClick={onPrint} title="打印">
        <Printer className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1 ml-auto">
        <Button variant="ghost" size="sm" onClick={onZoomOut} title="缩小">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs w-10 text-center">{zoom}%</span>
        <Button variant="ghost" size="sm" onClick={onZoomIn} title="放大">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onZoomReset} title="重置缩放">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
