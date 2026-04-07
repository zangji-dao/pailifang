/**
 * OnlyOffice 编辑步骤组件
 * 用于在 OnlyOffice 中直接编辑 Word 文档并绑定变量
 */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Save, 
  Download, 
  Plus, 
  Search,
  FileText,
  Loader2,
  ExternalLink,
  Info,
  Variable,
} from "lucide-react";
import { toast } from "sonner";
import { OnlyOfficeEditor } from "@/components/OnlyOfficeEditor";
import type { TemplateVariable, VariableCategory } from "@/types/template-variable";
import { PresetVariables, VariableCategoryLabels } from "@/types/template-variable";

interface OnlyOfficeEditStepProps {
  /** 模板 ID */
  templateId: string;
  /** 文档 URL（OnlyOffice 可访问的地址） */
  documentUrl: string;
  /** 文档标题 */
  documentTitle: string;
  /** 已选变量列表 */
  selectedVariables: TemplateVariable[];
  /** 保存回调 */
  onSave: (data: { documentUrl: string; variables: TemplateVariable[] }) => Promise<void>;
  /** 导出 Word 回调 */
  onExportWord?: () => void;
  /** 是否正在保存 */
  saving?: boolean;
}

/**
 * 生成变量标识符
 */
function generateVariableKey(existingKeys: string[]): string {
  let index = 1;
  while (existingKeys.includes(`custom_${index}`)) {
    index++;
  }
  return `custom_${index}`;
}

export function OnlyOfficeEditStep({
  templateId,
  documentUrl,
  documentTitle,
  selectedVariables,
  onSave,
  onExportWord,
  saving = false,
}: OnlyOfficeEditStepProps) {
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [editorConfig, setEditorConfig] = useState<{
    config: Record<string, unknown>;
    serverUrl: string;
  } | null>(null);
  
  // 变量面板状态
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<VariableCategory | 'all'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newVariable, setNewVariable] = useState<Partial<TemplateVariable>>({
    name: '',
    key: '',
    type: 'text',
    category: 'custom',
    placeholder: '',
  });
  
  // 获取环境变量
  const onlyofficeUrl = process.env.NEXT_PUBLIC_ONLYOFFICE_URL || "http://localhost:8080";
  
  // 自动生成变量标识符
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

  // 获取编辑器配置
  const fetchEditorConfig = useCallback(async () => {
    try {
      const response = await fetch("/api/onlyoffice/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: templateId,
          title: documentTitle,
          documentUrl,
          fileType: "docx",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "获取配置失败");
      }

      setEditorConfig(data);
    } catch (error) {
      const err = error instanceof Error ? error : new Error("获取配置失败");
      setEditorError(err.message);
      toast.error(err.message);
    }
  }, [templateId, documentTitle, documentUrl]);

  // 初始化时获取配置
  useEffect(() => {
    if (templateId && documentUrl) {
      fetchEditorConfig();
    }
  }, [templateId, documentUrl, fetchEditorConfig]);

  // 过滤变量
  const filteredVariables = selectedVariables.filter(variable => {
    const matchesSearch = searchTerm === "" || 
      variable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variable.key.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === 'all' || variable.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  // 按类别分组
  const groupedVariables = filteredVariables.reduce((acc, variable) => {
    const category = variable.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(variable);
    return acc;
  }, {} as Record<string, TemplateVariable[]>);

  // 添加自定义变量
  const handleAddVariable = () => {
    if (!newVariable.name?.trim()) {
      toast.error("请输入变量名称");
      return;
    }

    const variable: TemplateVariable = {
      id: `var_${Date.now()}`,
      name: newVariable.name.trim(),
      key: newVariable.key || generateVariableKey(selectedVariables.map(v => v.key)),
      type: newVariable.type || 'text',
      category: 'custom',
      placeholder: newVariable.placeholder,
    };

    // 检查 key 是否重复
    if (selectedVariables.some(v => v.key === variable.key)) {
      toast.error("变量标识符已存在");
      return;
    }

    // 更新变量列表
    const updatedVariables = [...selectedVariables, variable];
    onSave({ documentUrl, variables: updatedVariables });
    
    setShowAddDialog(false);
    setNewVariable({
      name: '',
      key: '',
      type: 'text',
      category: 'custom',
      placeholder: '',
    });
    
    toast.success("变量已添加");
  };

  // 保存文档
  const handleSave = async () => {
    await onSave({ documentUrl, variables: selectedVariables });
    toast.success("保存成功");
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[600px]">
      {/* 左侧：OnlyOffice 编辑器 */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardHeader className="py-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                编辑合同文档
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                在 OnlyOffice 中直接编辑 Word 文档
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={saving || !isEditorReady}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                保存
              </Button>
              {onExportWord && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExportWord}
                  disabled={!isEditorReady}
                >
                  <Download className="h-4 w-4 mr-1" />
                  导出 Word
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 relative">
          {/* 错误提示 */}
          {editorError && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/95 z-20">
              <Card className="max-w-md">
                <CardHeader>
                  <CardTitle className="text-destructive">编辑器加载失败</CardTitle>
                  <CardDescription>{editorError}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                    <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-1">请确保：</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>OnlyOffice 服务已部署并运行</li>
                        <li>环境变量 ONLYOFFICE_URL 已正确配置</li>
                        <li>文档 URL 可被 OnlyOffice 访问</li>
                      </ol>
                    </div>
                  </div>
                  <Button onClick={fetchEditorConfig} className="w-full">
                    重试
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* OnlyOffice 编辑器 */}
          {editorConfig && (
            <OnlyOfficeEditor
              documentId={templateId}
              title={documentTitle}
              documentUrl={documentUrl}
              serverUrl={editorConfig.serverUrl}
              callbackUrl={`${window.location.origin}/api/onlyoffice/callback?templateId=${templateId}`}
              onReady={() => setIsEditorReady(true)}
              onError={(err) => {
                setEditorError(err.message);
                setIsEditorReady(false);
              }}
              variables={selectedVariables}
            />
          )}
          
          {/* 未加载提示 */}
          {!editorConfig && !editorError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">正在加载编辑器...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 右侧：变量面板 */}
      <div className="w-80 shrink-0 h-full">
        <Card className="h-full flex flex-col">
          <CardHeader className="py-3 border-b shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Variable className="h-4 w-4" />
                变量列表
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                添加变量
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
            {/* 搜索和筛选 */}
            <div className="p-3 border-b space-y-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索变量..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select
                value={activeCategory}
                onValueChange={(value) => setActiveCategory(value as VariableCategory | 'all')}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="选择类别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类别</SelectItem>
                  {Object.entries(VariableCategoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* 变量列表 */}
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-4">
                {Object.entries(groupedVariables).map(([category, variables]) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {VariableCategoryLabels[category as VariableCategory] || category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {variables.length} 个
                      </span>
                    </div>
                    <div className="space-y-1">
                      {variables.map((variable) => (
                        <div
                          key={variable.id}
                          className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 cursor-pointer group"
                          title="在 OnlyOffice 中使用「变量绑定」插件插入此变量"
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">
                              {variable.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {`{{${variable.key}}}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {filteredVariables.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {searchTerm || activeCategory !== 'all' 
                      ? "没有找到匹配的变量" 
                      : "暂无变量，点击上方按钮添加"}
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* 底部提示 */}
            <div className="p-3 border-t bg-muted/30 shrink-0">
              <p className="text-xs text-muted-foreground">
                在 OnlyOffice 编辑器中，使用「插件」→「变量绑定」面板插入变量到文档中
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 添加变量对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加自定义变量</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="var-name">变量名称 *</Label>
              <Input
                id="var-name"
                placeholder="如：签订日期"
                value={newVariable.name || ''}
                onChange={(e) => setNewVariable(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="var-key">变量标识符</Label>
              <Input
                id="var-key"
                placeholder="如：sign_date"
                value={newVariable.key || ''}
                onChange={(e) => setNewVariable(prev => ({ ...prev, key: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                用于模板填充时的字段名，建议使用英文下划线格式
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="var-type">字段类型</Label>
              <Select
                value={newVariable.type || 'text'}
                onValueChange={(value) => setNewVariable(prev => ({ ...prev, type: value as TemplateVariable['type'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">文本</SelectItem>
                  <SelectItem value="number">数字</SelectItem>
                  <SelectItem value="date">日期</SelectItem>
                  <SelectItem value="select">下拉选择</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="var-placeholder">占位提示</Label>
              <Input
                id="var-placeholder"
                placeholder="如：请输入签订日期"
                value={newVariable.placeholder || ''}
                onChange={(e) => setNewVariable(prev => ({ ...prev, placeholder: e.target.value }))}
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
    </div>
  );
}

export default OnlyOfficeEditStep;
