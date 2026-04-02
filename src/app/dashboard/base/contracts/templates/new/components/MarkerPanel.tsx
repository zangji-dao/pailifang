"use client";

import { useState, useEffect } from "react";
import { Plus, MousePointer, X, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Marker } from "../types";
import type { TemplateVariable, VariableCategory } from "@/types/template-variable";
import { PresetVariables, VariableCategoryLabels } from "@/types/template-variable";

interface MarkerPanelProps {
  markers: Marker[];
  activeDocumentId: string;
  activeMarkerId: string | null;
  showVariablePicker: boolean;
  selectedVariables: TemplateVariable[];
  onInsertMarker: () => void;
  onBindVariable: (variable: TemplateVariable) => void;
  onRemoveMarker: (markerId: string) => void;
  onChangeVariable: (markerId: string) => void;
  onSetActiveMarker: (markerId: string | null) => void;
  onShowVariablePicker: (show: boolean) => void;
  onAddCustomVariable: (variable: Partial<TemplateVariable>, onSuccess?: () => void) => boolean;
  onRemoveCustomVariable?: (key: string) => void;
  onUpdateCustomVariable?: (key: string, variable: Partial<TemplateVariable>) => boolean;
}

/**
 * 生成变量标识符
 * 规则：custom_ + 递增数字
 */
function generateVariableKey(existingKeys: string[]): string {
  let index = 1;
  while (existingKeys.includes(`custom_${index}`)) {
    index++;
  }
  return `custom_${index}`;
}

export function MarkerPanel({
  markers,
  activeDocumentId,
  activeMarkerId,
  showVariablePicker,
  selectedVariables,
  onInsertMarker,
  onBindVariable,
  onRemoveMarker,
  onChangeVariable,
  onSetActiveMarker,
  onShowVariablePicker,
  onAddCustomVariable,
  onRemoveCustomVariable,
  onUpdateCustomVariable,
}: MarkerPanelProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingVariable, setEditingVariable] = useState<TemplateVariable | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<VariableCategory | 'all'>('all');
  const [newVariable, setNewVariable] = useState<Partial<TemplateVariable>>({
    name: '',
    key: '',
    type: 'text',
    category: 'custom',
    placeholder: '',
  });
  
  // 当打开对话框时，自动生成变量标识符
  useEffect(() => {
    if (showAddDialog) {
      const existingKeys = [
        ...selectedVariables.map(v => v.key),
        ...PresetVariables.map(v => v.key),
      ];
      const autoKey = generateVariableKey(existingKeys);
      setNewVariable(prev => ({
        ...prev,
        key: autoKey,
      }));
    }
  }, [showAddDialog, selectedVariables]);
  
  // 自定义变量列表
  const customVariables = selectedVariables.filter(v => v.category === 'custom');

  // 过滤变量
  const filteredVariables = (() => {
    const customVars = selectedVariables.filter(v => v.category === 'custom');
    let vars = [...customVars, ...PresetVariables];
    
    if (activeCategory !== 'all') {
      vars = vars.filter(v => v.category === activeCategory);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      vars = vars.filter(
        v => v.name.toLowerCase().includes(term) || 
             v.key.toLowerCase().includes(term)
      );
    }
    
    return vars;
  })();

  // 检查变量绑定次数（支持同一变量多次绑定）
  const getVariableBindCount = (key: string) => {
    return markers.filter(m => m.status === 'bound' && m.variableKey === key).length;
  };

  // 当前文档的标记
  const currentMarkers = markers.filter(m => m.documentId === activeDocumentId);

  const handleAddVariable = () => {
    const success = onAddCustomVariable(newVariable, () => {
      setShowAddDialog(false);
      setNewVariable({
        name: '',
        key: '',
        type: 'text',
        category: 'custom',
        placeholder: '',
      });
    });
  };
  
  // 打开编辑对话框
  const handleEditVariable = (variable: TemplateVariable) => {
    setEditingVariable(variable);
    setShowEditDialog(true);
  };
  
  // 保存编辑
  const handleSaveEdit = () => {
    if (!editingVariable || !onUpdateCustomVariable) return;
    const success = onUpdateCustomVariable(editingVariable.key, editingVariable);
    if (success) {
      setShowEditDialog(false);
      setEditingVariable(null);
    }
  };
  
  // 删除自定义变量
  const handleDeleteVariable = (key: string) => {
    if (!onRemoveCustomVariable) return;
    // 检查是否已被绑定，如果绑定则解绑所有
    const boundMarkers = markers.filter(m => m.status === 'bound' && m.variableKey === key);
    boundMarkers.forEach(m => onRemoveMarker(m.id));
    onRemoveCustomVariable(key);
  };

  return (
    <>
      <Card className="overflow-hidden h-full flex flex-col">
        <CardHeader className="py-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">标记管理</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-3 w-3 mr-1" />
              自定义变量
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-y-auto flex-1 min-h-0">
          {/* 提示信息 */}
          <div className="p-4 bg-muted/50 border-b">
            <p className="text-xs text-muted-foreground">
              <MousePointer className="h-3 w-3 inline-block mr-1" />
              在文档中定位光标，点击下方按钮插入变量标记
            </p>
          </div>
          
          {/* 插入变量按钮 */}
          <div className="p-3 border-b">
            <Button 
              className="w-full"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onInsertMarker}
            >
              插入变量标记
            </Button>
          </div>

          {/* 已插入的标记列表 */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">当前文档标记</span>
              <Badge variant="outline">{currentMarkers.length}</Badge>
            </div>
            
            {currentMarkers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                暂无标记
              </div>
            ) : (
              <div className="space-y-2">
                {currentMarkers.map(marker => (
                  <div
                    key={marker.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded border text-sm",
                      marker.status === 'bound' ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {marker.status === 'bound' ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-amber-400" />
                      )}
                      <span>
                        {marker.status === 'bound' 
                          ? `{{${PresetVariables.find(v => v.key === marker.variableKey)?.name || marker.variableKey}}}`
                          : '待绑定'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {marker.status === 'bound' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onChangeVariable(marker.id)}
                          title="更换变量"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveMarker(marker.id)}
                        className="text-destructive hover:text-destructive"
                        title="删除标记"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 自定义变量列表 */}
          {customVariables.length > 0 && (
            <div className="p-3 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">自定义变量</span>
                <Badge variant="outline">{customVariables.length}</Badge>
              </div>
              <div className="space-y-1">
                {customVariables.map(variable => (
                  <div
                    key={variable.key}
                    className="flex items-center justify-between p-2 rounded border bg-blue-50 border-blue-200 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{variable.name}</p>
                      <p className="text-xs text-muted-foreground">{variable.key}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditVariable(variable)}
                        title="编辑变量"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteVariable(variable.key)}
                        className="text-destructive hover:text-destructive"
                        title="删除变量"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 变量选择对话框 */}
      <Dialog open={showVariablePicker} onOpenChange={onShowVariablePicker}>
        <DialogContent className="sm:max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>选择变量</DialogTitle>
          </DialogHeader>
          
          {/* 搜索和分类 */}
          <div className="space-y-2">
            <Input
              placeholder="搜索变量..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex flex-wrap gap-1">
              <Button
                variant={activeCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory('all')}
              >
                全部
              </Button>
              {Object.entries(VariableCategoryLabels).map(([key, label]) => (
                <Button
                  key={key}
                  variant={activeCategory === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(key as VariableCategory)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* 变量列表 */}
          <ScrollArea className="h-64">
            <div className="space-y-1 pr-4">
              {filteredVariables.map(variable => {
                const bindCount = getVariableBindCount(variable.key);
                return (
                  <div
                    key={variable.key}
                    className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted"
                    onClick={() => onBindVariable(variable)}
                  >
                    <div>
                      <p className="font-medium text-sm">{variable.name}</p>
                      <p className="text-xs text-muted-foreground">{variable.key}</p>
                    </div>
                    {bindCount > 0 && (
                      <Badge variant="outline" className="text-xs">已绑定 {bindCount} 次</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 添加自定义变量对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加自定义变量</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>变量名称 *</Label>
              <Input
                value={newVariable.name}
                onChange={(e) => setNewVariable(prev => ({ ...prev, name: e.target.value }))}
                placeholder="如：甲方联系人"
              />
            </div>
            <div>
              <Label>变量标识</Label>
              <Input
                value={newVariable.key}
                readOnly
                className="bg-muted text-muted-foreground"
                placeholder="自动生成"
              />
              <p className="text-xs text-muted-foreground mt-1">系统自动生成，无需手动输入</p>
            </div>
            <div>
              <Label>变量类型</Label>
              <Select
                value={newVariable.type}
                onValueChange={(v) => setNewVariable(prev => ({ ...prev, type: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">文本</SelectItem>
                  <SelectItem value="number">数字</SelectItem>
                  <SelectItem value="date">日期</SelectItem>
                  <SelectItem value="select">选项</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>占位提示</Label>
              <Input
                value={newVariable.placeholder || ''}
                onChange={(e) => setNewVariable(prev => ({ ...prev, placeholder: e.target.value }))}
                placeholder="如：请输入甲方联系人姓名"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAddVariable}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 编辑自定义变量对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑自定义变量</DialogTitle>
          </DialogHeader>
          {editingVariable && (
            <div className="space-y-4">
              <div>
                <Label>变量名称 *</Label>
                <Input
                  value={editingVariable.name}
                  onChange={(e) => setEditingVariable(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="如：甲方联系人"
                />
              </div>
              <div>
                <Label>变量标识</Label>
                <Input
                  value={editingVariable.key}
                  readOnly
                  className="bg-muted text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">变量标识不可修改</p>
              </div>
              <div>
                <Label>变量类型</Label>
                <Select
                  value={editingVariable.type}
                  onValueChange={(v) => setEditingVariable(prev => prev ? { ...prev, type: v as any } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">文本</SelectItem>
                    <SelectItem value="number">数字</SelectItem>
                    <SelectItem value="date">日期</SelectItem>
                    <SelectItem value="money">金额</SelectItem>
                    <SelectItem value="select">选项</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>占位提示</Label>
                <Input
                  value={editingVariable.placeholder || ''}
                  onChange={(e) => setEditingVariable(prev => prev ? { ...prev, placeholder: e.target.value } : null)}
                  placeholder="如：请输入甲方联系人姓名"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
