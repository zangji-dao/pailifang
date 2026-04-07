/**
 * Quill 编辑器组件
 * 用于合同模板编辑，支持选区保持
 */
'use client';

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

// 扩展 Quill 类型
declare module 'quill' {
  interface Quill {
    root: HTMLElement;
  }
}

export interface QuillEditorRef {
  getHTML: () => string;
  setHTML: (html: string) => void;
  getContent: () => string;
}

interface QuillEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}

// 公文格式预设
const PRESETS: Record<string, { font: string; size: string; align: string; lineHeight: string; bold?: boolean }> = {
  title: { font: 'SimHei', size: '22pt', align: 'center', lineHeight: '1.5' },
  heading1: { font: 'SimHei', size: '16pt', align: 'left', lineHeight: '1.5', bold: true },
  heading2: { font: 'SimHei', size: '14pt', align: 'left', lineHeight: '1.5', bold: true },
  heading3: { font: 'SimHei', size: '12pt', align: 'left', lineHeight: '1.5', bold: true },
  body: { font: 'SimSun', size: '16pt', align: 'justify', lineHeight: '1.5' },
  bodySmall: { font: 'SimSun', size: '12pt', align: 'justify', lineHeight: '1.5' },
  signature: { font: 'SimSun', size: '12pt', align: 'right', lineHeight: '1.5' },
};

const QuillEditor = forwardRef<QuillEditorRef, QuillEditorProps>(
  ({ initialContent = '', onChange, placeholder = '请输入内容...' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<Quill | null>(null);

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      getHTML: () => quillRef.current?.root.innerHTML || '',
      setHTML: (html: string) => {
        if (quillRef.current) {
          quillRef.current.root.innerHTML = html;
        }
      },
      getContent: () => quillRef.current?.getText() || '',
    }));

    useEffect(() => {
      if (!containerRef.current || quillRef.current) return;

      // 创建工具栏容器
      const toolbarContainer = document.createElement('div');
      toolbarContainer.id = 'quill-toolbar';
      toolbarContainer.innerHTML = `
        <span class="ql-formats">
          <select class="ql-font">
            <option value="">默认</option>
            <option value="SimSun">宋体</option>
            <option value="SimHei">黑体</option>
            <option value="KaiTi">楷体</option>
            <option value="FangSong">仿宋</option>
            <option value="Microsoft YaHei">微软雅黑</option>
          </select>
          <select class="ql-size">
            <option value="">默认</option>
            <option value="10pt">10pt</option>
            <option value="12pt">12pt</option>
            <option value="14pt">14pt</option>
            <option value="16pt">16pt</option>
            <option value="18pt">18pt</option>
            <option value="20pt">20pt</option>
            <option value="22pt">22pt</option>
            <option value="24pt">24pt</option>
          </select>
        </span>
        <span class="ql-formats">
          <button class="ql-bold" title="加粗"></button>
          <button class="ql-italic" title="斜体"></button>
          <button class="ql-underline" title="下划线"></button>
          <button class="ql-strike" title="删除线"></button>
        </span>
        <span class="ql-formats">
          <button class="ql-align" value="" title="左对齐"></button>
          <button class="ql-align" value="center" title="居中"></button>
          <button class="ql-align" value="right" title="右对齐"></button>
          <button class="ql-align" value="justify" title="两端对齐"></button>
        </span>
        <span class="ql-formats">
          <button class="ql-list" value="ordered" title="有序列表"></button>
          <button class="ql-list" value="bullet" title="无序列表"></button>
          <button class="ql-indent" value="-1" title="减少缩进"></button>
          <button class="ql-indent" value="+1" title="增加缩进"></button>
        </span>
        <span class="ql-formats">
          <select class="ql-lineheight" title="行高">
            <option value="">默认</option>
            <option value="1">1.0</option>
            <option value="1.25">1.25</option>
            <option value="1.5">1.5</option>
            <option value="1.75">1.75</option>
            <option value="2">2.0</option>
          </select>
        </span>
        <span class="ql-formats">
          <select class="ql-preset" title="公文格式">
            <option value="">公文格式</option>
            <option value="title">公文标题</option>
            <option value="heading1">一级标题</option>
            <option value="heading2">二级标题</option>
            <option value="heading3">三级标题</option>
            <option value="body">正文(三号)</option>
            <option value="bodySmall">正文(小四)</option>
            <option value="signature">签章区</option>
          </select>
        </span>
      `;

      containerRef.current.prepend(toolbarContainer);

      // 初始化 Quill
      const quill = new Quill(containerRef.current, {
        modules: {
          toolbar: toolbarContainer,
        },
        placeholder,
        theme: 'snow',
      });

      quillRef.current = quill;

      // 设置初始内容
      if (initialContent) {
        quill.root.innerHTML = initialContent;
      }

      // 监听内容变化
      quill.on('text-change', () => {
        onChange?.(quill.root.innerHTML);
      });

      // 绑定公文格式预设选择器
      const presetSelect = toolbarContainer.querySelector('.ql-preset') as HTMLSelectElement;
      if (presetSelect) {
        presetSelect.addEventListener('change', (e) => {
          const value = (e.target as HTMLSelectElement).value;
          if (value && PRESETS[value]) {
            applyPreset(value);
          }
          presetSelect.value = '';
        });
      }

      // 清理函数
      return () => {
        quill.off('text-change');
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 设置初始内容（当 initialContent 变化时）
    useEffect(() => {
      if (quillRef.current && initialContent && quillRef.current.root.innerHTML !== initialContent) {
        quillRef.current.root.innerHTML = initialContent;
      }
    }, [initialContent]);

    // 应用公文格式预设
    const applyPreset = useCallback((presetKey: string) => {
      const quill = quillRef.current;
      if (!quill) return;

      const preset = PRESETS[presetKey];
      if (!preset) return;

      const selection = quill.getSelection();
      if (!selection) return;

      const { index, length } = selection;

      // 应用字体
      quill.formatText(index, length, 'font', preset.font);
      
      // 应用字号
      quill.formatText(index, length, 'size', preset.size);
      
      // 应用对齐
      quill.format('align', preset.align);
      
      // 应用行高
      quill.formatText(index, length, 'line-height', preset.lineHeight);
      
      // 应用加粗
      if (preset.bold) {
        quill.formatText(index, length, 'bold', true);
      }
    }, []);

    return (
      <div
        ref={containerRef}
        className="quill-editor-wrapper"
        style={{ minHeight: '400px' }}
      />
    );
  }
);

QuillEditor.displayName = 'QuillEditor';

export default QuillEditor;
