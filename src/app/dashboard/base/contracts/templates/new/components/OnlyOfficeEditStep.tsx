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
  Plus, 
  Search,
  FileText,
  Loader2,
  Info,
  Variable,
  ZoomIn,
  ZoomOut,
  PanelLeft,
  File,
} from "lucide-react";
import { toast } from "sonner";
import { OnlyOfficeEditor } from "@/components/OnlyOfficeEditor";
import type { TemplateVariable, VariableCategory } from "@/types/template-variable";
import { PresetVariables, VariableCategoryLabels } from "@/types/template-variable";

// OnlyOffice 配置接口
interface OnlyOfficeConfig {
  document: {
    fileType: string;
    key: string;
    title: string;
    url: string;
    permissions: {
      edit: boolean;
      download: boolean;
      print: boolean;
      review: boolean;
    };
  };
  documentType: string;
  editorConfig: {
    mode: string;
    callbackUrl: string;
    lang: string;
    user: {
      id: string;
      name: string;
    };
    customization: Record<string, unknown>;
  };
  type: string;
  width: string;
  height: string;
  token?: string;
}

// 附件文档接口
interface AttachmentDocument {
  id: string;
  name: string;
  url: string;
}

interface OnlyOfficeEditStepProps {
  /** 模板 ID */
  templateId: string;
  /** 主文档 URL（OnlyOffice 可访问的地址） */
  documentUrl: string;
  /** 主文档标题 */
  documentTitle: string;
  /** 附件列表 */
  attachments?: AttachmentDocument[];
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
  attachments = [],
  selectedVariables,
  onSave,
  onExportWord,
  saving = false,
}: OnlyOfficeEditStepProps) {
  // 当前编辑的文档索引（0=主文档，1,2,3...=附件）
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  
  // 当前文档信息
  const currentDocument = currentDocIndex === 0 
    ? { id: 'main', name: documentTitle, url: documentUrl }
    : attachments[currentDocIndex - 1];
    
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [editorConfig, setEditorConfig] = useState<{
    config: OnlyOfficeConfig;
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
  
  // 布局状态
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  
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
    if (!currentDocument?.url) return;
    
    // 切换文档时重置状态
    setIsEditorReady(false);
    setEditorError(null);
    setEditorConfig(null);
    
    try {
      const response = await fetch("/api/onlyoffice/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: `${templateId}_${currentDocIndex}`, // 不同文档使用不同ID
          title: currentDocument.name,
          documentUrl: currentDocument.url,
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
  }, [templateId, currentDocument, currentDocIndex]);

  // 初始化时获取配置
  useEffect(() => {
    if (templateId && currentDocument?.url) {
      fetchEditorConfig();
    }
  }, [templateId, currentDocument?.url, currentDocIndex, fetchEditorConfig]);

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
    if (currentDocument) {
      onSave({ documentUrl: currentDocument.url, variables: updatedVariables });
    }
    
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
    if (!currentDocument) return;
    await onSave({ documentUrl: currentDocument.url, variables: selectedVariables });
    toast.success("保存成功");
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 border rounded-lg bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPanelCollapsed(!panelCollapsed)}
            className="gap-1"
          >
            <PanelLeft className="h-4 w-4" />
            {panelCollapsed ? '展开面板' : '收起面板'}
          </Button>
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="text-sm">{currentDocument?.name}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 缩放控制 */}
          <div className="flex items-center gap-1 border rounded-md px-2 py-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}
              disabled={zoomLevel <= 50}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs w-12 text-center font-medium">{zoomLevel}%</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
              disabled={zoomLevel >= 200}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
          
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
        </div>
      </div>
      
      {/* 文档切换 Tab */}
      {(attachments.length > 0) && (
        <div className="flex items-center gap-1 px-1 shrink-0">
          <button
            onClick={() => setCurrentDocIndex(0)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
              currentDocIndex === 0 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            主文档
          </button>
          {attachments.map((att, idx) => (
            <button
              key={att.id}
              onClick={() => setCurrentDocIndex(idx + 1)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                currentDocIndex === idx + 1 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              <File className="h-3.5 w-3.5" />
              {att.name}
            </button>
          ))}
        </div>
      )}
      
      {/* 主体区域：左侧变量面板 + 右侧编辑器 */}
      <div className="flex flex-1 overflow-hidden gap-4">
        {/* 左侧变量面板 - 可折叠 */}
        {!panelCollapsed && (
          <div className="w-64 border rounded-lg bg-card shrink-0 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Variable className="h-4 w-4" />
                <span className="font-medium text-sm">变量</span>
                <Badge variant="secondary" className="text-xs">
                  {selectedVariables.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddDialog(true)}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            
            {/* 搜索 */}
            <div className="px-2 py-2 border-b shrink-0">
              <div className="relative">
                <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="搜索变量..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8 text-sm"
                />
              </div>
            </div>
            
            {/* 变量列表 */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {Object.entries(groupedVariables).map(([category, variables]) => (
                  <div key={category}>
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                      {VariableCategoryLabels[category as VariableCategory] || category} ({variables.length})
                    </div>
                    <div className="space-y-0.5">
                      {variables.map((variable) => (
                        <button
                          key={variable.id}
                          className="w-full flex items-center gap-2 p-2 rounded text-left hover:bg-muted/50 transition-colors group"
                          onClick={() => {
                            navigator.clipboard.writeText(`{{${variable.key}}}`);
                            toast.success(`已复制 {{${variable.key}}}`);
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{variable.name}</div>
                            <div className="text-xs text-muted-foreground font-mono truncate">
                              {`{{${variable.key}}}`}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                            复制
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                
                {filteredVariables.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    {searchTerm ? "没有匹配的变量" : "暂无变量"}
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* 使用提示 */}
            <div className="p-2 border-t bg-muted/30 shrink-0">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                点击变量复制标识符，格式：<code className="bg-muted px-1 rounded">{'{{变量名}}'}</code>
              </p>
            </div>
          </div>
        )}
        
        {/* 右侧编辑器 */}
        <div className="flex-1 border rounded-lg overflow-hidden relative bg-muted/20">
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
          {editorConfig && currentDocument && (
            <OnlyOfficeEditor
              documentId={`${templateId}_${currentDocIndex}`}
              title={currentDocument.name}
              documentUrl={currentDocument.url}
              serverUrl={editorConfig.serverUrl}
              callbackUrl={editorConfig.config.editorConfig.callbackUrl}
              onReady={() => setIsEditorReady(true)}
              onError={(err) => {
                setEditorError(err.message);
                setIsEditorReady(false);
              }}
              variables={selectedVariables}
              zoomLevel={zoomLevel}
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
        </div>
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
