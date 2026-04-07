/**
 * TipTap 编辑器测试页面
 * 自定义浮动工具栏 - 选中文字后自动浮现
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineHeight, FontSize } from "../editor/extensions";

// 示例 HTML 内容
const SAMPLE_HTML = `
<h1 style="text-align: center; font-family: SimHei; font-size: 22pt;">合同模板标题</h1>
<p style="font-family: SimSun; font-size: 12pt; line-height: 1.5;">
  <strong>甲方：</strong>{{企业名称}}<br>
  <strong>乙方：</strong>{{乙方名称}}<br>
  <strong>签订日期：</strong>{{签订日期}}
</p>
<h2 style="font-family: SimHei; font-size: 16pt;">一、合同条款</h2>
<p style="font-family: SimSun; font-size: 12pt; line-height: 1.5; text-align: justify;">
  根据《中华人民共和国民法典》及相关法律法规的规定，甲乙双方本着平等自愿、诚实信用的原则，就相关事宜达成如下协议：
</p>
<p style="font-family: SimSun; font-size: 12pt; line-height: 1.5; text-align: justify;">
  1.1 甲方同意将位于{{地址}}的房屋出租给乙方使用。<br>
  1.2 租赁期限为{{租赁期限}}年，自{{开始日期}}起至{{结束日期}}止。<br>
  1.3 租金为人民币{{租金金额}}元/月，押金为人民币{{押金金额}}元。
</p>
<h2 style="font-family: SimHei; font-size: 16pt;">二、双方权利义务</h2>
<p style="font-family: SimSun; font-size: 12pt; line-height: 1.5; text-align: justify;">
  2.1 甲方应保证房屋符合出租条件，并负责房屋的主体结构维修。<br>
  2.2 乙方应按时支付租金，并合理使用房屋及其设施。<br>
  2.3 乙方不得擅自改变房屋结构或用途。
</p>
<div style="text-align: right; font-family: SimSun; font-size: 12pt; line-height: 1.5;">
  <p>甲方签章：____________</p>
  <p>乙方签章：____________</p>
  <p>签订日期：{{签订日期}}</p>
</div>
`;

const FONT_OPTIONS = [
  { value: 'SimSun', label: '宋体' },
  { value: 'SimHei', label: '黑体' },
  { value: 'KaiTi', label: '楷体' },
  { value: 'FangSong', label: '仿宋' },
  { value: 'Microsoft YaHei', label: '微软雅黑' },
];

const FONT_SIZES = ['10pt', '12pt', '14pt', '16pt', '18pt', '20pt', '22pt', '24pt'];

export default function TiptapTestPage() {
  const [html, setHtml] = useState(SAMPLE_HTML);
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      FontFamily,
      FontSize,
      LineHeight,
      TextAlign.configure({
        types: ['paragraph', 'heading'],
      }),
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: SAMPLE_HTML,
    editorProps: {
      attributes: {
        class: 'prose max-w-none outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      setHtml(editor.getHTML());
    },
  });

  // 监听选区变化，更新工具栏位置
  useEffect(() => {
    if (!editor) return;

    const updateToolbarPosition = () => {
      const { from, to } = editor.state.selection;
      
      // 如果没有选中文字，隐藏工具栏
      if (from === to) {
        setToolbarPosition(null);
        return;
      }

      // 获取选区的 DOM 坐标
      const { view } = editor;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);
      
      // 计算工具栏位置（选区上方居中）
      const left = (start.left + end.left) / 2;
      const top = start.top - 10; // 选区上方 10px

      setToolbarPosition({ top, left });
    };

    editor.on('selectionUpdate', updateToolbarPosition);
    editor.on('focus', updateToolbarPosition);
    
    // 点击其他地方时隐藏工具栏
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        // 延迟检查，给选区变化事件时间
        setTimeout(() => {
          const { from, to } = editor.state.selection;
          if (from === to) {
            setToolbarPosition(null);
          }
        }, 10);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      editor.off('selectionUpdate', updateToolbarPosition);
      editor.off('focus', updateToolbarPosition);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editor]);

  // 应用公文格式预设
  const handleApplyPreset = useCallback((presetKey: string) => {
    if (!editor) return;

    const presets: Record<string, { font: string; size: string; lineHeight: string; align?: string; bold?: boolean }> = {
      title: { font: 'SimHei', size: '22pt', lineHeight: '1.5', align: 'center' },
      heading1: { font: 'SimHei', size: '16pt', lineHeight: '1.5', bold: true },
      heading2: { font: 'SimHei', size: '14pt', lineHeight: '1.5', bold: true },
      heading3: { font: 'SimHei', size: '12pt', lineHeight: '1.5', bold: true },
      body: { font: 'SimSun', size: '16pt', lineHeight: '1.5', align: 'justify' },
      bodySmall: { font: 'SimSun', size: '12pt', lineHeight: '1.5', align: 'justify' },
      signature: { font: 'SimSun', size: '12pt', lineHeight: '1.5', align: 'right' },
    };

    const preset = presets[presetKey];
    if (!preset) return;

    const chain = editor.chain().focus();

    // 应用字体
    chain.setFontFamily(preset.font);

    // 应用对齐
    if (preset.align) {
      chain.setTextAlign(preset.align as 'left' | 'center' | 'right' | 'justify');
    }

    chain.run();

    // 应用字号
    editor.chain().focus()
      .updateAttributes('textStyle', { fontSize: preset.size })
      .run();

    // 应用行高
    editor.chain().focus()
      .updateAttributes('paragraph', { lineHeight: preset.lineHeight })
      .run();

    // 应用加粗
    if (preset.bold && !editor.isActive('bold')) {
      editor.chain().focus().toggleBold().run();
    }
  }, [editor]);

  if (!editor) {
    return <div className="flex items-center justify-center h-screen">加载编辑器...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">TipTap 编辑器测试（自定义浮动工具栏）</h1>
      <p className="text-muted-foreground mb-6">
        <strong>选中文字后，工具栏会自动浮现在选区上方</strong> - 完全自定义实现，无选区丢失问题
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 编辑器 */}
        <Card className="overflow-hidden">
          <CardHeader className="py-2 border-b">
            <CardTitle className="text-base">编辑区域 - 选中文字试试</CardTitle>
          </CardHeader>
          <CardContent className="p-4 bg-gray-100 max-h-[600px] overflow-auto relative">
            <div className="bg-white shadow-lg p-8 min-h-[500px]">
              <EditorContent editor={editor} />
            </div>
            
            {/* 浮动工具栏 - 通过 Portal 渲染到 body */}
            {toolbarPosition && (
              <div
                ref={toolbarRef}
                className="fixed z-50 bg-white border rounded-lg shadow-lg p-1 flex items-center gap-1 animate-in fade-in-0 zoom-in-95"
                style={{
                  top: toolbarPosition.top - 45, // 工具栏高度约 40px
                  left: toolbarPosition.left,
                  transform: 'translateX(-50%)', // 水平居中
                }}
                onMouseDown={(e) => e.preventDefault()} // 防止点击工具栏时丢失选区
              >
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
                  title="加粗"
                >
                  <strong>B</strong>
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
                  title="斜体"
                >
                  <em>I</em>
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
                  title="下划线"
                >
                  <u>U</u>
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <select
                  onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                  className="p-1 border rounded text-sm"
                  value={editor.getAttributes('textStyle').fontFamily || ''}
                >
                  <option value="">字体</option>
                  {FONT_OPTIONS.map(font => (
                    <option key={font.value} value={font.value}>{font.label}</option>
                  ))}
                </select>
                <select
                  onChange={(e) => editor.chain().focus().updateAttributes('textStyle', { fontSize: e.target.value }).run()}
                  className="p-1 border rounded text-sm"
                  value={editor.getAttributes('textStyle').fontSize || ''}
                >
                  <option value="">字号</option>
                  {FONT_SIZES.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <select
                  onChange={(e) => handleApplyPreset(e.target.value)}
                  className="p-1 border rounded text-sm"
                  value=""
                >
                  <option value="">公文格式</option>
                  <option value="title">公文标题</option>
                  <option value="heading1">一级标题</option>
                  <option value="heading2">二级标题</option>
                  <option value="heading3">三级标题</option>
                  <option value="body">正文(三号)</option>
                  <option value="bodySmall">正文(小四)</option>
                  <option value="signature">签章区</option>
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* HTML 输出 */}
        <Card className="overflow-hidden">
          <CardHeader className="py-2 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">HTML 输出</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(html)}
              >
                复制
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-[600px] whitespace-pre-wrap">
              {html}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* 测试说明 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">测试步骤</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>在编辑器中选中一段文字</li>
            <li><strong>工具栏会自动浮现在选区上方</strong></li>
            <li>点击工具栏的按钮设置格式（加粗、斜体、字体、字号等）</li>
            <li><strong>选区不会丢失，格式直接应用</strong></li>
            <li>点击编辑器其他位置，工具栏自动隐藏</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
