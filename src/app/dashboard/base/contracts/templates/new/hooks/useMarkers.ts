import { useState, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import type { Marker, Binding } from "../types";
import type { TemplateVariable } from "@/types/template-variable";

export function useMarkers(
  contentRef: React.RefObject<HTMLDivElement | null>,
  syncEditedContent: () => void,
  getActiveDocumentId: () => string
) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [showVariablePicker, setShowVariablePicker] = useState(false);
  const [selectedVariables, setSelectedVariables] = useState<TemplateVariable[]>([]);

  // 兼容旧数据结构的 bindings
  const bindings = useMemo(() => {
    return markers
      .filter(m => m.status === 'bound' && m.variableKey)
      .map(m => ({
        id: m.id,
        variableKey: m.variableKey!,
        position: m.position,
      }));
  }, [markers]);

  // 插入变量标记
  const insertMarker = useCallback(() => {
    const activeDocumentId = getActiveDocumentId();
    const selection = window.getSelection();
    
    if (!selection || selection.rangeCount === 0) {
      toast.info("请先在文档中点击定位光标");
      contentRef.current?.focus();
      return;
    }
    
    const range = selection.getRangeAt(0);
    
    if (!contentRef.current?.contains(range.commonAncestorContainer)) {
      toast.info("请先在文档中点击定位光标");
      contentRef.current?.focus();
      return;
    }
    
    // 生成唯一ID
    const markerId = `marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 获取上下文信息用于定位
    const clickContext = getContextInfo(range);
    
    // 创建标记元素
    const markerSpan = document.createElement('span');
    markerSpan.className = 'variable-marker pending';
    markerSpan.setAttribute('data-marker-id', markerId);
    markerSpan.setAttribute('data-document-id', activeDocumentId);
    markerSpan.style.cssText = 'background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; border: 2px dashed #f59e0b; font-weight: 500; display: inline-block; margin: 0 2px; cursor: pointer;';
    markerSpan.textContent = '待绑定';
    markerSpan.onclick = () => {
      setActiveMarkerId(markerId);
      setShowVariablePicker(true);
    };
    
    // 插入标记
    range.deleteContents();
    range.insertNode(markerSpan);
    
    // 获取位置信息
    const beforeText = getBeforeText(markerSpan, 50);
    const afterText = getAfterText(markerSpan, 50);
    
    // 保存标记信息
    const newMarker: Marker = {
      id: markerId,
      documentId: activeDocumentId,
      status: 'pending',
      position: {
        beforeText,
        afterText,
        textOffset: 0,
        clickContext,
      },
      displayText: '待绑定',
    };
    
    setMarkers(prev => [...prev, newMarker]);
    syncEditedContent();
    
    // 自动打开变量选择器
    setActiveMarkerId(markerId);
    setShowVariablePicker(true);
  }, [contentRef, syncEditedContent]);

  // 绑定变量
  const handleBindVariable = useCallback((variable: TemplateVariable) => {
    if (!activeMarkerId) return;
    
    setMarkers(prev => prev.map(m => 
      m.id === activeMarkerId 
        ? { ...m, status: 'bound', variableKey: variable.key }
        : m
    ));
    
    // 添加到已选变量
    if (!selectedVariables.find(v => v.key === variable.key)) {
      setSelectedVariables(prev => [...prev, variable]);
    }
    
    // 更新 DOM 中标记的显示
    const markerEl = contentRef.current?.querySelector(`[data-marker-id="${activeMarkerId}"]`) as HTMLElement;
    if (markerEl) {
      markerEl.className = 'variable-marker bound';
      markerEl.style.cssText = 'background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; border: 2px solid #22c55e; font-weight: 500; display: inline-block; margin: 0 2px;';
      markerEl.textContent = `{{${variable.name}}}`;
      syncEditedContent();
    }
    
    setShowVariablePicker(false);
    setActiveMarkerId(null);
    toast.success(`已绑定: ${variable.name}`);
  }, [activeMarkerId, selectedVariables, contentRef, syncEditedContent]);

  // 删除标记
  const handleRemoveMarker = useCallback((markerId: string) => {
    const markerEl = contentRef.current?.querySelector(`[data-marker-id="${markerId}"]`);
    if (markerEl) {
      markerEl.remove();
      syncEditedContent();
    }
    
    setMarkers(prev => prev.filter(m => m.id !== markerId));
    toast.success("已删除标记");
  }, [contentRef, syncEditedContent]);

  // 更换变量
  const handleChangeVariable = useCallback((markerId: string) => {
    setActiveMarkerId(markerId);
    setShowVariablePicker(true);
  }, []);

  // 添加自定义变量并绑定
  const addCustomVariable = useCallback((
    newVariable: Partial<TemplateVariable>,
    onSuccess?: () => void
  ) => {
    if (!newVariable.name || !newVariable.key) {
      toast.error('请填写变量名称和标识');
      return false;
    }
    
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newVariable.key)) {
      toast.error('变量标识只能包含英文、数字、下划线，且不能以数字开头');
      return false;
    }
    
    const existingKeys = [...selectedVariables].map(v => v.key);
    if (existingKeys.includes(newVariable.key)) {
      toast.error(`变量标识 "${newVariable.key}" 已存在`);
      return false;
    }
    
    const customVar: TemplateVariable = {
      id: `var_custom_${Date.now()}`,
      name: newVariable.name,
      key: newVariable.key,
      type: newVariable.type || 'text',
      category: 'custom',
      placeholder: newVariable.placeholder,
    };
    
    setSelectedVariables(prev => [...prev, customVar]);
    
    if (activeMarkerId) {
      setMarkers(prev => prev.map(m => 
        m.id === activeMarkerId 
          ? { ...m, status: 'bound', variableKey: customVar.key }
          : m
      ));
      
      const markerEl = contentRef.current?.querySelector(`[data-marker-id="${activeMarkerId}"]`) as HTMLElement;
      if (markerEl) {
        markerEl.className = 'variable-marker bound';
        markerEl.style.cssText = 'background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; border: 2px solid #22c55e; font-weight: 500; display: inline-block; margin: 0 2px;';
        markerEl.textContent = `{{${customVar.name}}}`;
        syncEditedContent();
      }
      
      setShowVariablePicker(false);
      setActiveMarkerId(null);
      toast.success(`已绑定: ${customVar.name}`);
    } else {
      toast.success(`已添加自定义变量: ${customVar.name}`);
    }
    
    onSuccess?.();
    return true;
  }, [activeMarkerId, selectedVariables, contentRef, syncEditedContent]);

  // 从模板加载
  const loadFromTemplate = useCallback((template: any) => {
    if (template.draft_data?.markers) {
      setMarkers(template.draft_data.markers.map((m: any) => ({
        id: m.id,
        documentId: m.documentId || 'main',
        variableKey: m.variableKey,
        status: m.status,
        position: m.position,
      })));
    }
    
    if (template.draft_data?.selectedVariables) {
      setSelectedVariables(template.draft_data.selectedVariables.map((v: any) => ({
        id: v.id || `var_custom_${v.key}`,
        key: v.key,
        name: v.name,
        type: v.type || 'text',
        category: v.category || 'custom',
        placeholder: v.placeholder,
      })));
    }
  }, []);

  // 重置
  const reset = useCallback(() => {
    setMarkers([]);
    setActiveMarkerId(null);
    setShowVariablePicker(false);
    setSelectedVariables([]);
  }, []);

  return {
    markers,
    setMarkers,
    activeMarkerId,
    setActiveMarkerId,
    showVariablePicker,
    setShowVariablePicker,
    selectedVariables,
    setSelectedVariables,
    bindings,
    insertMarker,
    handleBindVariable,
    handleRemoveMarker,
    handleChangeVariable,
    addCustomVariable,
    loadFromTemplate,
    reset,
  };
}

// 辅助函数：获取点击上下文
function getContextInfo(range: Range): Marker['position']['clickContext'] {
  let current = range.commonAncestorContainer as HTMLElement;
  let depth = 0;
  
  while (current && depth < 10) {
    if (current.id) {
      return {
        parentTagName: current.tagName,
        parentClass: current.className,
        nearestId: current.id,
      };
    }
    if (current.className && (
      current.className.includes('甲方') || 
      current.className.includes('乙方') ||
      current.className.includes('party-a') ||
      current.className.includes('party-b')
    )) {
      return {
        parentTagName: current.tagName,
        parentClass: current.className,
        nearestId: '',
        party: current.className.includes('甲') || current.className.includes('party-a') ? '甲方' : '乙方',
      };
    }
    current = current.parentElement as HTMLElement;
    depth++;
  }
  return {
    parentTagName: '',
    parentClass: '',
    nearestId: '',
  };
}

// 辅助函数：获取标记前的文字
function getBeforeText(element: HTMLElement, maxLength: number): string {
  let text = '';
  let current: Node | null = element.previousSibling;
  
  while (current && text.length < maxLength) {
    if (current.nodeType === Node.TEXT_NODE) {
      text = (current.textContent || '') + text;
    } else if (current.nodeType === Node.ELEMENT_NODE) {
      text = (current.textContent || '') + text;
    }
    current = current.previousSibling;
  }
  
  // 如果还不够，向上查找父节点的兄弟
  if (text.length < maxLength && element.parentElement) {
    let parent: HTMLElement | null = element.parentElement;
    let prevSibling: Node | null = parent?.previousSibling || null;
    let depth = 0;
    
    while (prevSibling && text.length < maxLength && depth < 5) {
      if (prevSibling.nodeType === Node.TEXT_NODE) {
        text = (prevSibling.textContent || '') + text;
      } else if (prevSibling.nodeType === Node.ELEMENT_NODE) {
        text = (prevSibling.textContent || '').slice(-maxLength) + text;
      }
      prevSibling = prevSibling.previousSibling;
      if (!prevSibling) {
        parent = parent?.parentElement || null;
        prevSibling = parent?.previousSibling || null;
        depth++;
      }
    }
  }
  
  return text.slice(-maxLength);
}

// 辅助函数：获取标记后的文字
function getAfterText(element: HTMLElement, maxLength: number): string {
  let text = '';
  let current: Node | null = element.nextSibling;
  
  while (current && text.length < maxLength) {
    if (current.nodeType === Node.TEXT_NODE) {
      text += current.textContent || '';
    } else if (current.nodeType === Node.ELEMENT_NODE) {
      text += current.textContent || '';
    }
    current = current.nextSibling;
  }
  
  // 如果还不够，向上查找父节点的兄弟
  if (text.length < maxLength && element.parentElement) {
    let parent: HTMLElement | null = element.parentElement;
    let nextSibling: Node | null = parent?.nextSibling || null;
    let depth = 0;
    
    while (nextSibling && text.length < maxLength && depth < 5) {
      if (nextSibling.nodeType === Node.TEXT_NODE) {
        text += nextSibling.textContent || '';
      } else if (nextSibling.nodeType === Node.ELEMENT_NODE) {
        text += (nextSibling.textContent || '').slice(0, maxLength);
      }
      nextSibling = nextSibling.nextSibling;
      if (!nextSibling) {
        parent = parent?.parentElement || null;
        nextSibling = parent?.nextSibling || null;
        depth++;
      }
    }
  }
  
  return text.slice(0, maxLength);
}
