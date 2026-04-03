import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { toast } from "sonner";
import type { ParseResult } from "@/types/contract-template";
import { dedupeAndSortAttachments, FONT_OPTIONS, LINE_HEIGHT_OPTIONS, DOCUMENT_PRESETS } from "../types";

export function useEditor(
  parseResult: ParseResult | null,
  setParseResult: React.Dispatch<React.SetStateAction<ParseResult | null>>,
  initialEditedHtml?: string
) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [editedHtml, setEditedHtml] = useState<string>(initialEditedHtml || "");
  const [activeDocumentId, setActiveDocumentId] = useState<string>('main');
  const [zoom, setZoom] = useState(100);
  // 保存选区
  const savedSelectionRef = useRef<Range | null>(null);
  
  // 当 initialEditedHtml 变化时（比如从草稿加载），更新内部状态
  useEffect(() => {
    if (initialEditedHtml && initialEditedHtml !== editedHtml) {
      console.log('useEditor - 从外部初始化 editedHtml:', initialEditedHtml.substring(0, 100));
      setEditedHtml(initialEditedHtml);
    }
  }, [initialEditedHtml]);

  // 保存当前选区
  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      // 确保选区在编辑区域内
      if (contentRef.current?.contains(range.commonAncestorContainer)) {
        savedSelectionRef.current = range.cloneRange();
      }
    }
  }, []);

  // 恢复选区
  const restoreSelection = useCallback(() => {
    if (savedSelectionRef.current && contentRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelectionRef.current);
      }
    }
  }, []);

  // 同步编辑后的HTML
  const syncEditedContent = useCallback(() => {
    if (contentRef.current) {
      if (activeDocumentId === 'main') {
        setEditedHtml(contentRef.current.innerHTML);
      } else {
        // 更新附件的 HTML
        setParseResult(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            attachments: (prev.attachments || []).map(att => 
              att.id === activeDocumentId 
                ? { ...att, html: contentRef.current?.innerHTML || att.html }
                : att
            ),
          };
        });
      }
    }
  }, [activeDocumentId, setParseResult]);

  // 获取当前文档的HTML
  const currentDocumentHtml = useMemo(() => {
    if (activeDocumentId === 'main') {
      return parseResult?.html || '';
    }
    const attachment = parseResult?.attachments?.find(a => a.id === activeDocumentId);
    return attachment?.html || '';
  }, [activeDocumentId, parseResult]);

  // 当前文档的样式
  const currentDocumentStyles = useMemo(() => {
    if (activeDocumentId === 'main') {
      return parseResult?.styles || '';
    }
    const attachment = parseResult?.attachments?.find(a => a.id === activeDocumentId);
    return attachment?.styles || '';
  }, [activeDocumentId, parseResult]);

  // ===== 编辑器命令 =====

  // 执行编辑命令
  const execCommand = useCallback((command: string, value?: string) => {
    // 确保编辑区域有焦点
    if (contentRef.current) {
      contentRef.current.focus();
    }
    // 恢复之前保存的选区
    restoreSelection();
    document.execCommand(command, false, value);
    syncEditedContent();
  }, [syncEditedContent, restoreSelection]);

  // 加粗
  const handleBold = useCallback(() => {
    execCommand('bold');
  }, [execCommand]);

  // 斜体
  const handleItalic = useCallback(() => {
    execCommand('italic');
  }, [execCommand]);

  // 下划线
  const handleUnderline = useCallback(() => {
    execCommand('underline');
  }, [execCommand]);

  // 删除线
  const handleStrikethrough = useCallback(() => {
    execCommand('strikeThrough');
  }, [execCommand]);

  // 对齐
  const handleAlign = useCallback((alignment: 'left' | 'center' | 'right' | 'justify') => {
    const commands = {
      left: 'justifyLeft',
      center: 'justifyCenter',
      right: 'justifyRight',
      justify: 'justifyFull',
    };
    execCommand(commands[alignment]);
  }, [execCommand]);

  // 有序列表
  const handleOrderedList = useCallback(() => {
    execCommand('insertOrderedList');
  }, [execCommand]);

  // 无序列表
  const handleUnorderedList = useCallback(() => {
    execCommand('insertUnorderedList');
  }, [execCommand]);

  // 增加缩进
  const handleIndent = useCallback(() => {
    execCommand('indent');
  }, [execCommand]);

  // 减少缩进
  const handleOutdent = useCallback(() => {
    execCommand('outdent');
  }, [execCommand]);

  // 设置字体
  const handleSetFont = useCallback((fontFamily: string) => {
    // 确保编辑区域有焦点
    if (contentRef.current) {
      contentRef.current.focus();
    }
    
    // 恢复之前保存的选区
    restoreSelection();
    
    // 找到选中的块级元素并设置字体
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    let container = range.commonAncestorContainer as HTMLElement;
    
    // 找到块级父元素
    while (container && container !== contentRef.current) {
      if (container.nodeType === Node.ELEMENT_NODE) {
        const display = window.getComputedStyle(container).display;
        if (display === 'block' || display === 'list-item' || container.tagName === 'P' || container.tagName === 'DIV') {
          break;
        }
      }
      container = container.parentNode as HTMLElement;
    }
    
    if (container && container !== contentRef.current) {
      container.style.fontFamily = fontFamily;
    } else if (contentRef.current) {
      // 没找到就设置整个文档
      contentRef.current.style.fontFamily = fontFamily;
    }
    
    syncEditedContent();
  }, [syncEditedContent, restoreSelection]);

  // 设置字体大小
  const handleSetFontSize = useCallback((size: number) => {
    // 确保编辑区域有焦点
    if (contentRef.current) {
      contentRef.current.focus();
    }
    
    // 恢复之前保存的选区
    restoreSelection();
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      // 没有选中内容，设置当前行的字体大小
      let container = range.commonAncestorContainer as HTMLElement;
      while (container && container !== contentRef.current) {
        if (container.nodeType === Node.ELEMENT_NODE && 
            (container.tagName === 'P' || container.tagName === 'DIV' || container.tagName === 'SPAN')) {
          (container as HTMLElement).style.fontSize = `${size}pt`;
          break;
        }
        container = container.parentNode as HTMLElement;
      }
    } else {
      // 有选中内容，包裹在span中
      const span = document.createElement('span');
      span.style.fontSize = `${size}pt`;
      range.surroundContents(span);
    }
    
    syncEditedContent();
  }, [syncEditedContent, restoreSelection]);

  // 设置行间距
  const handleSetLineHeight = useCallback((lineHeight: string) => {
    // 确保编辑区域有焦点
    if (contentRef.current) {
      contentRef.current.focus();
    }
    
    // 恢复之前保存的选区
    restoreSelection();
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    let container = range.commonAncestorContainer as HTMLElement;
    
    // 找到块级父元素
    const blockTags = ['P', 'DIV', 'LI', 'TD', 'TH', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BODY'];
    while (container && container !== contentRef.current) {
      if (container.nodeType === Node.ELEMENT_NODE && blockTags.includes(container.tagName)) {
        break;
      }
      container = container.parentNode as HTMLElement;
    }
    
    if (container && container !== contentRef.current) {
      (container as HTMLElement).style.lineHeight = lineHeight;
    } else if (contentRef.current) {
      contentRef.current.style.lineHeight = lineHeight;
    }
    
    syncEditedContent();
  }, [syncEditedContent, restoreSelection]);

  // 应用公文格式预设
  const handleApplyPreset = useCallback((presetKey: string) => {
    const preset = DOCUMENT_PRESETS.find(p => p.key === presetKey);
    if (!preset) return;
    
    // 确保编辑区域有焦点
    if (contentRef.current) {
      contentRef.current.focus();
    }
    
    // 恢复之前保存的选区
    restoreSelection();
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    let container = range.commonAncestorContainer as HTMLElement;
    
    // 找到块级父元素
    while (container && container !== contentRef.current) {
      if (container.nodeType === Node.ELEMENT_NODE && 
          (container.tagName === 'P' || container.tagName === 'DIV' || container.tagName === 'H1' || container.tagName === 'H2' || container.tagName === 'H3' || container.tagName === 'TD' || container.tagName === 'TH')) {
        break;
      }
      container = container.parentNode as HTMLElement;
    }
    
    if (container && container !== contentRef.current) {
      const el = container as HTMLElement;
      // 应用字体
      el.style.fontFamily = preset.font;
      // 应用字号
      el.style.fontSize = `${preset.size}pt`;
      // 应用行距
      el.style.lineHeight = preset.lineHeight;
      // 应用加粗
      if (preset.bold) {
        el.style.fontWeight = 'bold';
      }
      // 应用对齐方式
      if (preset.align) {
        el.style.textAlign = preset.align;
      }
    }
    
    syncEditedContent();
    toast.success(`已应用${preset.label}格式`);
  }, [syncEditedContent, restoreSelection]);

  // 添加下划线填充
  const handleAddUnderlineFill = useCallback(() => {
    // 确保编辑区域有焦点
    if (contentRef.current) {
      contentRef.current.focus();
    }
    
    // 恢复之前保存的选区
    restoreSelection();
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    // 创建带下划线的容器
    const span = document.createElement('span');
    span.style.cssText = 'border-bottom: 1px solid #000; min-width: 80px; display: inline-block; text-align: center; padding: 0 4px;';
    
    if (selectedText) {
      // 有选中文字，将其放在下划线容器中
      span.textContent = selectedText;
      range.deleteContents();
    } else {
      // 没有选中文字，插入占位符
      span.textContent = '____';
    }
    
    range.insertNode(span);
    syncEditedContent();
  }, [syncEditedContent, restoreSelection]);

  // 插入表格
  const handleInsertTable = useCallback((rows: number, cols: number) => {
    // 确保编辑区域有焦点
    if (contentRef.current) {
      contentRef.current.focus();
    }
    
    // 恢复之前保存的选区
    restoreSelection();
    
    const table = document.createElement('table');
    table.style.cssText = 'width: 100%; border-collapse: collapse; margin: 6pt 0;';
    
    for (let i = 0; i < rows; i++) {
      const tr = table.insertRow();
      for (let j = 0; j < cols; j++) {
        const td = tr.insertCell();
        td.style.cssText = 'border: 1px solid #000; padding: 4pt; min-width: 40pt;';
        td.textContent = ' ';
      }
    }
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(table);
    }
    
    syncEditedContent();
    toast.success('已插入表格');
  }, [syncEditedContent, restoreSelection]);

  // 删除表格行
  const handleDeleteRow = useCallback(() => {
    // 确保编辑区域有焦点
    if (contentRef.current) {
      contentRef.current.focus();
    }
    
    // 恢复之前保存的选区
    restoreSelection();
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    let element = selection.anchorNode as HTMLElement;
    while (element && element.tagName !== 'TR') {
      element = element.parentNode as HTMLElement;
    }
    
    if (element && element.tagName === 'TR') {
      element.remove();
      syncEditedContent();
      toast.success('已删除行');
    }
  }, [syncEditedContent, restoreSelection]);

  // 删除表格列
  const handleDeleteColumn = useCallback(() => {
    // 确保编辑区域有焦点
    if (contentRef.current) {
      contentRef.current.focus();
    }
    
    // 恢复之前保存的选区
    restoreSelection();
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    let cell = selection.anchorNode as HTMLElement;
    while (cell && cell.tagName !== 'TD' && cell.tagName !== 'TH') {
      cell = cell.parentNode as HTMLElement;
    }
    
    if (cell && (cell.tagName === 'TD' || cell.tagName === 'TH')) {
      const colIndex = (cell as HTMLTableCellElement).cellIndex;
      const table = cell.closest('table');
      if (table) {
        table.querySelectorAll('tr').forEach(tr => {
          const cells = tr.querySelectorAll('td, th');
          if (cells[colIndex]) {
            cells[colIndex].remove();
          }
        });
        syncEditedContent();
        toast.success('已删除列');
      }
    }
  }, [syncEditedContent, restoreSelection]);

  // 打印
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // 缩放
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 10, 150));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 10, 50));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(100);
  }, []);

  // 获取去重排序后的附件列表
  const getUniqueAttachments = useCallback(() => {
    if (!parseResult?.attachments) return [];
    return dedupeAndSortAttachments(parseResult.attachments);
  }, [parseResult]);

  return {
    contentRef,
    editedHtml,
    setEditedHtml,
    activeDocumentId,
    setActiveDocumentId,
    zoom,
    setZoom,
    currentDocumentHtml,
    currentDocumentStyles,
    syncEditedContent,
    saveSelection,
    // 编辑命令
    handleBold,
    handleItalic,
    handleUnderline,
    handleStrikethrough,
    handleAlign,
    handleOrderedList,
    handleUnorderedList,
    handleIndent,
    handleOutdent,
    handleSetFont,
    handleSetFontSize,
    handleSetLineHeight,
    handleApplyPreset,
    handleAddUnderlineFill,
    handleInsertTable,
    handleDeleteRow,
    handleDeleteColumn,
    handlePrint,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    getUniqueAttachments,
  };
}
