'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  TemplateVariable,
  VariableTypeLabels,
  VariableBinding,
} from '@/types/template-variable';
import {
  Eye,
  Plus,
  Trash2,
  MousePointer,
  Info,
} from 'lucide-react';

interface ContractBindingEditorProps {
  html: string;
  variables: TemplateVariable[];
  bindings: VariableBinding[];
  onBindingsChange: (bindings: VariableBinding[]) => void;
}

export function ContractBindingEditor({
  html,
  variables,
  bindings,
  onBindingsChange,
}: ContractBindingEditorProps) {
  const [selectedPosition, setSelectedPosition] = useState<{
    anchorText: string;
    offset: number;
    elementId: string;
  } | null>(null);
  const [showVariablePicker, setShowVariablePicker] = useState(false);
  const [insertMode, setInsertMode] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [processedHtml, setProcessedHtml] = useState(html);

  // 更新已绑定的HTML显示
  useEffect(() => {
    let result = html;
    
    // 将绑定标记转换为可视化元素
    bindings.forEach((binding) => {
      const variable = variables.find(v => v.key === binding.variableKey);
      if (variable) {
        // 创建可点击的变量标记
        const marker = `<span class="variable-binding" data-binding-id="${binding.id}" data-variable-key="${binding.variableKey}" style="background: rgba(34, 197, 94, 0.2); color: #16a34a; padding: 2px 8px; border-radius: 4px; cursor: pointer; border: 1px dashed #22c55e; font-weight: 500;">{{${variable.name}}}</span>`;
        
        // 在锚点文本后插入
        if (binding.position.anchorText) {
          // 简单处理：在文本后添加标记
          result = result.replace(
            binding.position.anchorText,
            binding.position.anchorText + marker
          );
        }
      }
    });
    
    setProcessedHtml(result);
  }, [html, bindings, variables]);

  // 处理文档点击
  const handleContentClick = useCallback((e: React.MouseEvent) => {
    if (!insertMode) return;
    
    const target = e.target as HTMLElement;
    
    // 如果点击的是已绑定的变量，显示删除选项
    if (target.classList.contains('variable-binding')) {
      const bindingId = target.dataset.bindingId;
      if (bindingId) {
        handleRemoveBinding(bindingId);
      }
      return;
    }
    
    // 获取点击位置的文本
    const selection = window.getSelection();
    if (!selection) return;
    
    const range = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (!range) return;
    
    // 找到最近的文本节点
    let textNode = range.startContainer;
    let textContent = textNode.textContent || '';
    
    // 获取点击位置前后的文本作为锚点
    const offset = range.startOffset;
    const beforeText = textContent.substring(Math.max(0, offset - 20), offset);
    const afterText = textContent.substring(offset, Math.min(textContent.length, offset + 20));
    
    // 查找最近的"："或合适的位置作为锚点
    const colonIndex = beforeText.lastIndexOf('：');
    const colonIndex2 = beforeText.lastIndexOf(':');
    const bestIndex = Math.max(colonIndex, colonIndex2);
    
    const anchorText = bestIndex >= 0 
      ? beforeText.substring(bestIndex) 
      : beforeText.slice(-10);
    
    setSelectedPosition({
      anchorText,
      offset: 0,
      elementId: `pos-${Date.now()}`,
    });
    setShowVariablePicker(true);
  }, [insertMode]);

  // 插入变量
  const handleInsertVariable = (variable: TemplateVariable) => {
    if (!selectedPosition) return;
    
    const newBinding: VariableBinding = {
      id: `binding-${Date.now()}`,
      variableKey: variable.key,
      position: {
        anchorText: selectedPosition.anchorText,
        offset: selectedPosition.offset,
      },
    };
    
    onBindingsChange([...bindings, newBinding]);
    setShowVariablePicker(false);
    setSelectedPosition(null);
    setInsertMode(false);
  };

  // 删除绑定
  const handleRemoveBinding = (bindingId: string) => {
    onBindingsChange(bindings.filter(b => b.id !== bindingId));
  };

  // 清空所有绑定
  const handleClearAll = () => {
    onBindingsChange([]);
  };

  return (
    <div className="h-full flex flex-col">
      {/* 工具栏 */}
      <div className="p-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={insertMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInsertMode(!insertMode)}
              className={insertMode ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              <MousePointer className="h-4 w-4 mr-1" />
              {insertMode ? '插入模式已开启' : '开启插入模式'}
            </Button>
            {insertMode && (
              <span className="text-xs text-muted-foreground">
                点击文档中要插入变量的位置
              </span>
            )}
          </div>
          {bindings.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-xs">
              清空绑定
            </Button>
          )}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-hidden flex">
        {/* 合同预览 */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 bg-muted/30 min-h-full">
            <style jsx global>{`
              .contract-content {
                max-width: 800px;
                margin: 0 auto;
                padding: 40px;
                background: white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                border-radius: 4px;
                font-size: 14px;
                line-height: 2;
              }
              .contract-content h1 {
                font-size: 20px;
                font-weight: bold;
                text-align: center;
                margin-bottom: 24px;
              }
              .contract-content h2 {
                font-size: 16px;
                font-weight: bold;
                margin: 20px 0 12px;
              }
              .contract-content p {
                text-indent: 2em;
                margin-bottom: 12px;
              }
              /* 表格样式 */
              .contract-content table {
                width: 100%;
                border-collapse: collapse;
                margin: 16px 0;
                font-size: 13px;
              }
              .contract-content table th,
              .contract-content table td {
                border: 1px solid #d1d5db;
                padding: 8px 12px;
                text-align: left;
              }
              .contract-content table th {
                background: #f3f4f6;
                font-weight: 600;
              }
              /* 变量绑定标记 */
              .variable-binding {
                background: rgba(34, 197, 94, 0.2);
                color: #16a34a;
                padding: 2px 8px;
                border-radius: 4px;
                cursor: pointer;
                border: 1px dashed #22c55e;
                font-weight: 500;
              }
              .variable-binding:hover {
                background: rgba(239, 68, 68, 0.2);
                border-color: #ef4444;
                color: #dc2626;
              }
              /* 下划线区域高亮 */
              .contract-content u {
                background: rgba(251, 191, 36, 0.2);
                padding: 0 4px;
                border-radius: 2px;
              }
            `}</style>
            <div
              ref={contentRef}
              className={`contract-content prose prose-sm max-w-none ${insertMode ? 'cursor-crosshair' : ''}`}
              onClick={handleContentClick}
              dangerouslySetInnerHTML={{ __html: processedHtml }}
            />
          </div>
        </div>

        {/* 绑定列表侧栏 */}
        <div className="w-64 border-l bg-muted/30 overflow-auto">
          <div className="p-3 border-b">
            <h3 className="font-medium text-sm">
              已绑定变量 ({bindings.length})
            </h3>
          </div>
          {bindings.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-xs">
              <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>点击"开启插入模式"</p>
              <p>然后在文档中点击要插入变量的位置</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {bindings.map((binding) => {
                const variable = variables.find(v => v.key === binding.variableKey);
                if (!variable) return null;
                
                return (
                  <div
                    key={binding.id}
                    className="flex items-center justify-between p-2 bg-background rounded-lg border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm truncate">
                          {variable.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {VariableTypeLabels[variable.type]}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBinding(binding.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 变量选择弹窗 */}
      <Dialog open={showVariablePicker} onOpenChange={setShowVariablePicker}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>选择要插入的变量</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 max-h-80 overflow-auto">
            {variables.map((variable) => (
              <Button
                key={variable.id}
                variant="outline"
                className="justify-start h-auto py-2"
                onClick={() => handleInsertVariable(variable)}
              >
                <Plus className="h-4 w-4 mr-2 shrink-0" />
                <div className="text-left">
                  <div className="font-medium">{variable.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {VariableTypeLabels[variable.type]}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
