'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ContractFieldDefinition, FieldType } from '@/types/contract-template';
import { Eye, Plus, Trash2, Settings, Check, X } from 'lucide-react';

interface ContractPreviewProps {
  html: string;
  fields: ContractFieldDefinition[];
  onFieldsChange: (fields: ContractFieldDefinition[]) => void;
  selectedFieldIds: Set<string>;
  onSelectedFieldIdsChange: (ids: Set<string>) => void;
}

interface EditingField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string;
}

const fieldTypeLabels: Record<FieldType, string> = {
  text: '文本',
  number: '数字',
  date: '日期',
  select: '选择框',
  textarea: '多行文本',
};

export function ContractPreview({
  html,
  fields,
  onFieldsChange,
  selectedFieldIds,
  onSelectedFieldIdsChange,
}: ContractPreviewProps) {
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 处理字段点击
  const handleFieldClick = useCallback((fieldId: string, fieldKey: string, fieldLabel: string) => {
    const newSelectedIds = new Set(selectedFieldIds);
    const exists = fields.find(f => f.key === fieldKey);

    if (newSelectedIds.has(fieldId)) {
      // 取消选择
      newSelectedIds.delete(fieldId);
      if (exists) {
        onFieldsChange(fields.filter(f => f.key !== fieldKey));
      }
    } else {
      // 添加选择
      newSelectedIds.add(fieldId);
      if (!exists) {
        onFieldsChange([
          ...fields,
          {
            key: fieldKey,
            label: fieldLabel,
            type: 'text' as FieldType,
            required: false,
          },
        ]);
      }
    }
    onSelectedFieldIdsChange(newSelectedIds);
  }, [selectedFieldIds, fields, onFieldsChange, onSelectedFieldIdsChange]);

  // 使用事件委托处理点击
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const placeholder = target.closest('.field-placeholder') as HTMLElement;
      
      if (placeholder) {
        const fieldId = placeholder.dataset.fieldId || '';
        const fieldKey = placeholder.dataset.fieldKey || '';
        const fieldLabel = placeholder.dataset.fieldLabel || '';
        
        if (fieldId && fieldKey) {
          handleFieldClick(fieldId, fieldKey, fieldLabel);
        }
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [handleFieldClick]);

  // 处理HTML，更新选中状态
  const processedHtml = useMemo(() => {
    // 保留原始style，只更新字段的选中状态
    let processed = html;
    
    // 更新字段的选中状态
    selectedFieldIds.forEach(id => {
      const regex = new RegExp(`data-field-id="${id}" data-selected="false"`, 'g');
      processed = processed.replace(regex, `data-field-id="${id}" data-selected="true"`);
    });
    
    return processed;
  }, [html, selectedFieldIds]);

  // 添加新字段
  const handleAddField = () => {
    const newKey = `field_${Date.now()}`;
    setEditingField({
      key: newKey,
      label: '新字段',
      type: 'text',
      required: false,
    });
    setEditingFieldId(null);
  };

  // 编辑字段
  const handleEditField = (field: ContractFieldDefinition) => {
    setEditingField({
      key: field.key,
      label: field.label,
      type: field.type,
      required: field.required || false,
      options: field.options?.map(o => o.value).join('\n'),
    });
    setEditingFieldId(field.key);
  };

  // 保存字段编辑
  const handleSaveField = () => {
    if (!editingField) return;

    const newField: ContractFieldDefinition = {
      key: editingField.key,
      label: editingField.label,
      type: editingField.type,
      required: editingField.required,
      options: editingField.type === 'select' && editingField.options
        ? editingField.options.split('\n').filter(Boolean).map(v => ({ value: v, label: v }))
        : undefined,
    };

    if (editingFieldId) {
      // 更新现有字段
      onFieldsChange(fields.map(f => (f.key === editingFieldId ? newField : f)));
    } else {
      // 添加新字段
      onFieldsChange([...fields, newField]);
    }

    setEditingField(null);
    setEditingFieldId(null);
  };

  // 删除字段
  const handleDeleteField = (key: string) => {
    onFieldsChange(fields.filter(f => f.key !== key));
  };

  // 切换必填
  const handleToggleRequired = (key: string) => {
    onFieldsChange(fields.map(f => 
      f.key === key ? { ...f, required: !f.required } : f
    ));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)] min-h-[500px]">
      {/* 左侧：合同预览 */}
      <Card className="lg:col-span-2 overflow-hidden">
        <CardHeader className="py-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">合同预览</CardTitle>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-block w-4 h-1 bg-yellow-300 rounded" />
              <span>点击高亮区域选择字段</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto h-[calc(100%-52px)]">
          <div className="p-6 bg-muted/30">
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
                vertical-align: top;
              }
              .contract-content table th {
                background: #f3f4f6;
                font-weight: 600;
                text-align: center;
              }
              .contract-content table tr:hover {
                background: #f9fafb;
              }
              .field-label {
                font-weight: 500;
              }
              .field-placeholder {
                cursor: pointer !important;
                padding: 2px 8px;
                border-radius: 2px;
                transition: all 0.2s;
                border-bottom: 1px solid #d1d5db;
                background: rgba(251, 191, 36, 0.2);
                min-width: 60px;
                display: inline-block;
              }
              .field-placeholder:hover {
                background: rgba(251, 191, 36, 0.4) !important;
                border-color: #f59e0b;
              }
              .field-placeholder[data-selected="true"] {
                background: rgba(34, 197, 94, 0.3) !important;
                border-color: #22c55e;
                color: #16a34a;
              }
              .field-date {
                letter-spacing: 0.5em;
              }
              .field-placeholder u {
                text-decoration: none;
              }
              /* 列表样式 */
              .contract-content ul,
              .contract-content ol {
                padding-left: 2em;
                margin: 8px 0;
              }
              .contract-content li {
                margin: 4px 0;
              }
            `}</style>
            <div 
              ref={contentRef}
              className="contract-content prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: processedHtml }}
            />
          </div>
        </CardContent>
      </Card>

      {/* 右侧：字段列表 */}
      <Card className="overflow-hidden">
        <CardHeader className="py-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">字段设置</CardTitle>
            <Button size="sm" onClick={handleAddField}>
              <Plus className="h-4 w-4 mr-1" />
              添加字段
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto h-[calc(100%-52px)]">
          {fields.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              <p>暂无字段</p>
              <p className="mt-1 text-xs">点击预览中的黄色区域，或手动添加字段</p>
            </div>
          ) : (
            <div className="divide-y">
              {fields.map((field) => (
                <div 
                  key={field.key}
                  className="p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{field.label}</span>
                        <Badge variant="outline" className="text-xs">
                          {fieldTypeLabels[field.type]}
                        </Badge>
                        {field.required && (
                          <Badge variant="destructive" className="text-xs">必填</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        字段键: {field.key}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => handleToggleRequired(field.key)}
                        title={field.required ? '设为非必填' : '设为必填'}
                      >
                        {field.required ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => handleEditField(field)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => handleDeleteField(field.key)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 字段编辑对话框 */}
      <Dialog open={!!editingField} onOpenChange={(open) => !open && setEditingField(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFieldId ? '编辑字段' : '添加字段'}</DialogTitle>
          </DialogHeader>
          {editingField && (
            <div className="space-y-4">
              <div>
                <Label>字段标签</Label>
                <Input
                  value={editingField.label}
                  onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                  placeholder="如：企业名称"
                />
              </div>
              <div>
                <Label>字段键</Label>
                <Input
                  value={editingField.key}
                  onChange={(e) => setEditingField({ ...editingField, key: e.target.value })}
                  placeholder="如：enterprise_name"
                />
              </div>
              <div>
                <Label>字段类型</Label>
                <Select
                  value={editingField.type}
                  onValueChange={(value) => setEditingField({ ...editingField, type: value as FieldType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">文本</SelectItem>
                    <SelectItem value="number">数字</SelectItem>
                    <SelectItem value="date">日期</SelectItem>
                    <SelectItem value="select">选择框</SelectItem>
                    <SelectItem value="textarea">多行文本</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingField.type === 'select' && (
                <div>
                  <Label>选项（每行一个）</Label>
                  <Textarea
                    value={editingField.options || ''}
                    onChange={(e) => setEditingField({ ...editingField, options: e.target.value })}
                    placeholder="选项1&#10;选项2&#10;选项3"
                    rows={4}
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="required"
                  checked={editingField.required}
                  onCheckedChange={(checked) => 
                    setEditingField({ ...editingField, required: checked as boolean })
                  }
                />
                <Label htmlFor="required">必填字段</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingField(null)}>
              取消
            </Button>
            <Button onClick={handleSaveField}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
