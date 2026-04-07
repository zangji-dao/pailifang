"use client";

import { useState, useEffect } from "react";
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
import { FONT_OPTIONS, LINE_HEIGHT_OPTIONS, DOCUMENT_PRESETS, DocumentPreset } from "../types";

// 当前格式状态接口
export interface CurrentFormat {
  fontFamily: string | null;
  fontSize: string | null;
  lineHeight: string | null;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: 'left' | 'center' | 'right' | 'justify' | null;
}

interface EditorToolbarProps {
  zoom: number;
  currentFormat: CurrentFormat;
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

// 根据字体值获取显示标签
function getFontLabel(value: string | null): string {
  if (!value) return "字体";
  const font = FONT_OPTIONS.find(f => f.value === value || value.includes(f.value));
  return font?.label || value;
}

// 根据字号值匹配最接近的选项
function getFontSizeLabel(value: string | null): string {
  if (!value) return "字号";
  // 提取数字部分
  const match = value.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    return match[1];
  }
  return value;
}

// 根据行距值匹配最接近的选项
function getLineHeightLabel(value: string | null): string {
  if (!value) return "行距";
  const opt = LINE_HEIGHT_OPTIONS.find(o => o.value === value);
  if (opt) return opt.label;
  // 尝试匹配数值
  const match = value.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    return `${match[1]}倍`;
  }
  return value;
}

// 检测当前格式是否匹配某个预设
function detectPreset(format: CurrentFormat): string | null {
  for (const preset of DOCUMENT_PRESETS) {
    if (format.fontFamily?.includes(preset.font) || 
        (preset.font === 'SimSun' && (format.fontFamily?.includes('宋体') || format.fontFamily?.includes('SimSun'))) ||
        (preset.font === 'SimHei' && (format.fontFamily?.includes('黑体') || format.fontFamily?.includes('SimHei')))) {
      // 字体匹配，检查其他属性
      const fontSizeMatch = format.fontSize?.includes(String(preset.size));
      const lineHeightMatch = format.lineHeight === preset.lineHeight || 
                             format.lineHeight?.includes(preset.lineHeight);
      if (fontSizeMatch && lineHeightMatch) {
        return preset.key;
      }
    }
  }
  return null;
}

export function EditorToolbar({
  zoom,
  currentFormat,
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

  // 检测当前匹配的预设
  const currentPresetKey = detectPreset(currentFormat);
  const currentPreset = DOCUMENT_PRESETS.find(p => p.key === currentPresetKey);

  // 包装按钮，在 mousedown 时保存选区
  const ToolButton = ({ 
    onClick, 
    title, 
    children, 
    active = false 
  }: { 
    onClick: () => void; 
    title: string; 
    children: React.ReactNode;
    active?: boolean;
  }) => (
    <Button 
      variant={active ? "secondary" : "ghost"} 
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
      <Select 
        onValueChange={(v) => { onSetFont(v); }}
        value={currentFormat.fontFamily?.split(',')[0]?.replace(/["']/g, '') || undefined}
      >
        <SelectTrigger 
          className="w-28 h-8"
          onMouseDown={(e) => {
            // 阻止默认行为，防止选区被清除
            e.preventDefault();
            onSaveSelection();
          }}
        >
          <SelectValue placeholder="字体">
            {getFontLabel(currentFormat.fontFamily)}
          </SelectValue>
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
      <Select 
        onValueChange={(v) => { onSetFontSize(Number(v)); }}
        value={currentFormat.fontSize ? getFontSizeLabel(currentFormat.fontSize) : undefined}
      >
        <SelectTrigger 
          className="w-16 h-8"
          onMouseDown={(e) => {
            e.preventDefault();
            onSaveSelection();
          }}
        >
          <SelectValue placeholder="字号">
            {getFontSizeLabel(currentFormat.fontSize)}
          </SelectValue>
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
      <ToolButton onClick={onBold} title="加粗" active={currentFormat.bold}>
        <Bold className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={onItalic} title="斜体" active={currentFormat.italic}>
        <Italic className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={onUnderline} title="下划线" active={currentFormat.underline}>
        <Underline className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={onStrikethrough} title="删除线">
        <Strikethrough className="h-4 w-4" />
      </ToolButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 对齐 */}
      <ToolButton onClick={() => onAlign('left')} title="左对齐" active={currentFormat.align === 'left'}>
        <AlignLeft className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={() => onAlign('center')} title="居中" active={currentFormat.align === 'center'}>
        <AlignCenter className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={() => onAlign('right')} title="右对齐" active={currentFormat.align === 'right'}>
        <AlignRight className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={() => onAlign('justify')} title="两端对齐" active={currentFormat.align === 'justify'}>
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
      <Select 
        onValueChange={(v) => { onSetLineHeight(v); }}
        value={currentFormat.lineHeight || undefined}
      >
        <SelectTrigger 
          className="w-20 h-8"
          onMouseDown={(e) => {
            e.preventDefault();
            onSaveSelection();
          }}
        >
          <SelectValue placeholder="行距">
            {getLineHeightLabel(currentFormat.lineHeight)}
          </SelectValue>
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
      <Select 
        onValueChange={(v) => { onApplyPreset(v); }}
        value={currentPresetKey || undefined}
      >
        <SelectTrigger 
          className="w-32 h-8"
          onMouseDown={(e) => {
            e.preventDefault();
            onSaveSelection();
          }}
        >
          <SelectValue placeholder="公文格式">
            {currentPreset ? currentPreset.label : "公文格式"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="z-50 w-64">
          {DOCUMENT_PRESETS.map(preset => (
            <SelectItem key={preset.key} value={preset.key} className="py-2">
              <div className="flex flex-col items-start">
                <span className="font-medium">{preset.label}</span>
                {preset.description && (
                  <span className="text-xs text-muted-foreground">{preset.description}</span>
                )}
              </div>
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
