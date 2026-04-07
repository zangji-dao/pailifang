'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import Highlight from '@tiptap/extension-highlight'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { useCallback, useEffect, useRef } from 'react'
import { LineHeight, FontSize } from '../editor/extensions'

interface UseTiptapEditorProps {
  initialContent: string
  onUpdate: (html: string) => void
}

export function useTiptapEditor({ initialContent, onUpdate }: UseTiptapEditorProps) {
  const initialContentRef = useRef(initialContent)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextStyle,
      FontFamily,
      FontSize,
      LineHeight,
      TextAlign.configure({
        types: ['paragraph', 'heading'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose max-w-none outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onUpdate(html)
    },
  })

  // 当 initialContent 变化时更新内容（文档切换）
  useEffect(() => {
    if (editor && initialContent && initialContent !== initialContentRef.current) {
      initialContentRef.current = initialContent
      editor.commands.setContent(initialContent, { emitUpdate: false })
    }
  }, [editor, initialContent])

  // 应用公文格式预设
  const handleApplyPreset = useCallback((presetKey: string) => {
    if (!editor) return

    const presets: Record<string, { font: string; size: string; lineHeight: string; align?: string; bold?: boolean }> = {
      title: { font: 'SimHei', size: '22pt', lineHeight: '1.5', align: 'center' },
      heading1: { font: 'SimHei', size: '16pt', lineHeight: '1.5', bold: true },
      heading2: { font: 'SimHei', size: '14pt', lineHeight: '1.5', bold: true },
      heading3: { font: 'SimHei', size: '12pt', lineHeight: '1.5', bold: true },
      body: { font: 'SimSun', size: '16pt', lineHeight: '1.5', align: 'justify' },
      bodySmall: { font: 'SimSun', size: '12pt', lineHeight: '1.5', align: 'justify' },
      signature: { font: 'SimSun', size: '12pt', lineHeight: '1.5', align: 'right' },
    }

    const preset = presets[presetKey]
    if (!preset) return

    const chain = editor.chain().focus()

    // 应用字体
    chain.setFontFamily(preset.font)

    // 应用对齐
    if (preset.align) {
      chain.setTextAlign(preset.align as 'left' | 'center' | 'right' | 'justify')
    }

    chain.run()

    // 应用字号 - 通过设置 TextStyle 属性
    editor.chain().focus()
      .updateAttributes('textStyle', { fontSize: preset.size })
      .run()

    // 应用行高 - 通过设置段落属性
    editor.chain().focus()
      .updateAttributes('paragraph', { lineHeight: preset.lineHeight })
      .run()

    // 应用加粗
    if (preset.bold && !editor.isActive('bold')) {
      editor.chain().focus().toggleBold().run()
    }
  }, [editor])

  // 设置字号
  const setFontSize = useCallback((size: string) => {
    if (!editor) return
    editor.chain().focus()
      .updateAttributes('textStyle', { fontSize: `${size}pt` })
      .run()
  }, [editor])

  // 设置行高
  const setLineHeight = useCallback((lineHeight: string) => {
    if (!editor) return
    editor.chain().focus()
      .updateAttributes('paragraph', { lineHeight })
      .run()
  }, [editor])

  return {
    editor,
    EditorContent,
    handleApplyPreset,
    setFontSize,
    setLineHeight,
  }
}
