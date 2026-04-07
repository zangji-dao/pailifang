'use client'

import type { Editor } from '@tiptap/react'
import { useState, useEffect } from 'react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table,
  Minus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const FONT_OPTIONS = [
  { value: 'SimSun', label: '宋体' },
  { value: 'SimHei', label: '黑体' },
  { value: 'KaiTi', label: '楷体' },
  { value: 'FangSong', label: '仿宋' },
  { value: 'Microsoft YaHei', label: '微软雅黑' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
]

const FONT_SIZES = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72]

const LINE_HEIGHT_OPTIONS = [
  { value: '1', label: '1倍' },
  { value: '1.15', label: '1.15倍' },
  { value: '1.5', label: '1.5倍' },
  { value: '1.75', label: '1.75倍' },
  { value: '2', label: '2倍' },
  { value: '2.5', label: '2.5倍' },
  { value: '3', label: '3倍' },
]

const DOCUMENT_PRESETS = [
  { key: 'title', label: '公文标题', description: '黑体 22pt 居中' },
  { key: 'heading1', label: '一级标题', description: '黑体 16pt 加粗' },
  { key: 'heading2', label: '二级标题', description: '黑体 14pt 加粗' },
  { key: 'heading3', label: '三级标题', description: '黑体 12pt 加粗' },
  { key: 'body', label: '正文(三号)', description: '宋体 16pt 两端对齐' },
  { key: 'bodySmall', label: '正文(小四)', description: '宋体 12pt 两端对齐' },
  { key: 'signature', label: '签章区', description: '宋体 12pt 右对齐' },
]

interface TiptapToolbarProps {
  editor: Editor
  onApplyPreset: (presetKey: string) => void
  zoom?: number
  onZoomChange?: (zoom: number) => void
}

export function TiptapToolbar({ editor, onApplyPreset, zoom = 100, onZoomChange }: TiptapToolbarProps) {
  const [currentFont, setCurrentFont] = useState<string>('')
  const [currentFontSize, setCurrentFontSize] = useState<string>('')
  const [currentLineHeight, setCurrentLineHeight] = useState<string>('')
  const [tableRows, setTableRows] = useState(3)
  const [tableCols, setTableCols] = useState(3)

  // 更新当前格式状态
  useEffect(() => {
    const updateFormatState = () => {
      // 获取当前字体
      const fontFamily = editor.getAttributes('textStyle').fontFamily
      setCurrentFont(fontFamily || '')

      // 获取当前字号
      const fontSize = editor.getAttributes('textStyle').fontSize
      setCurrentFontSize(fontSize || '')

      // 获取当前行高
      const { lineHeight } = editor.getAttributes('paragraph')
      setCurrentLineHeight(lineHeight || '')
    }

    editor.on('selectionUpdate', updateFormatState)
    editor.on('focus', updateFormatState)
    editor.on('update', updateFormatState)

    return () => {
      editor.off('selectionUpdate', updateFormatState)
      editor.off('focus', updateFormatState)
      editor.off('update', updateFormatState)
    }
  }, [editor])

  // 设置字体
  const handleSetFont = (font: string) => {
    editor.chain().focus().setFontFamily(font).run()
  }

  // 设置字号 - 通过 updateAttributes
  const handleSetFontSize = (size: string) => {
    editor.chain().focus().updateAttributes('textStyle', { fontSize: `${size}pt` }).run()
  }

  // 设置行高 - 通过 updateAttributes
  const handleSetLineHeight = (lineHeight: string) => {
    editor.chain().focus().updateAttributes('paragraph', { lineHeight }).run()
  }

  // 插入表格
  const handleInsertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: false })
      .run()
  }

  // 插入下划线填充
  const handleInsertUnderlineFill = () => {
    editor
      .chain()
      .focus()
      .insertContent('____________')
      .run()
  }

  // 缩放控制
  const handleZoomIn = () => onZoomChange?.(Math.min(zoom + 10, 200))
  const handleZoomOut = () => onZoomChange?.(Math.max(zoom - 10, 50))
  const handleZoomReset = () => onZoomChange?.(100)

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-muted/30 flex-wrap">
      {/* 字体选择 */}
      <Select value={currentFont} onValueChange={handleSetFont}>
        <SelectTrigger className="w-28 h-8">
          <SelectValue placeholder="字体">
            {FONT_OPTIONS.find(f => f.value === currentFont)?.label || '字体'}
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
      <Select value={currentFontSize} onValueChange={handleSetFontSize}>
        <SelectTrigger className="w-16 h-8">
          <SelectValue placeholder="字号">
            {currentFontSize ? currentFontSize.replace('pt', '') : '字号'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="z-50">
          {FONT_SIZES.map(size => (
            <SelectItem key={size} value={String(size)}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 文本格式 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-muted' : ''}
        title="加粗 (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-muted' : ''}
        title="斜体 (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={editor.isActive('underline') ? 'bg-muted' : ''}
        title="下划线 (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={editor.isActive('strike') ? 'bg-muted' : ''}
        title="删除线"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 对齐方式 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={editor.isActive({ textAlign: 'left' }) ? 'bg-muted' : ''}
        title="左对齐"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={editor.isActive({ textAlign: 'center' }) ? 'bg-muted' : ''}
        title="居中"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={editor.isActive({ textAlign: 'right' }) ? 'bg-muted' : ''}
        title="右对齐"
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={editor.isActive({ textAlign: 'justify' }) ? 'bg-muted' : ''}
        title="两端对齐"
      >
        <AlignJustify className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 行距 */}
      <Select value={currentLineHeight} onValueChange={handleSetLineHeight}>
        <SelectTrigger className="w-20 h-8">
          <SelectValue placeholder="行距">
            {LINE_HEIGHT_OPTIONS.find(o => o.value === currentLineHeight)?.label || '行距'}
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
      <Select onValueChange={onApplyPreset}>
        <SelectTrigger className="w-32 h-8">
          <SelectValue placeholder="公文格式" />
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
      <Button variant="ghost" size="sm" onClick={handleInsertUnderlineFill} title="下划线填充">
        <Minus className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 表格 */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" title="插入表格">
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
                max={10}
                value={tableRows}
                onChange={e => setTableRows(Number(e.target.value))}
                className="w-16 px-2 py-1 border rounded text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">列数:</span>
              <input
                type="number"
                min={1}
                max={10}
                value={tableCols}
                onChange={e => setTableCols(Number(e.target.value))}
                className="w-16 px-2 py-1 border rounded text-sm"
              />
            </div>
            <Button size="sm" className="w-full" onClick={handleInsertTable}>
              插入表格
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 缩放 */}
      <Button variant="ghost" size="sm" onClick={handleZoomOut} title="缩小">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <span className="text-xs w-12 text-center">{zoom}%</span>
      <Button variant="ghost" size="sm" onClick={handleZoomIn} title="放大">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={handleZoomReset} title="重置缩放">
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  )
}
