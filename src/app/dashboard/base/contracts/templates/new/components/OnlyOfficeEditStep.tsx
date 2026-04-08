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
  PanelRightClose,
  PanelRightOpen,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { OnlyOfficeEditor } from "@/components/OnlyOfficeEditor";
import type { TemplateVariable, VariableCategory } from "@/types/template-variable";
import { PresetVariables, VariableCategoryLabels } from "@/types/template-variable";
import { cn } from "@/lib/utils";

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
  /** 返回上一步（全屏模式时显示） */
  onBack?: () => void;
  /** 进入下一步（全屏模式时显示） */
  onNext?: () => void;
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
  onBack,
  onNext,
}: OnlyOfficeEditStepProps) {
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [editorConfig, setEditorConfig] = useState<{
    config: OnlyOfficeConfig;
    serverUrl: string;
  } | null>(null);
  
  // 变量面板状态
  const [showVariablePanel, setShowVariablePanel] = useState(false);
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
    <div className="relative h-screen">
      {/* 主编辑区域 - 全宽 */}
      <div className={cn(
        "absolute inset-0 transition-all duration-300",
        showVariablePanel && "mr-80"
      )}>
        <Card className="h-full overflow-hidden flex flex-col border-0 shadow-none rounded-none">
          {/* 顶部工具栏 */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-3">
              {onBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  返回
                </Button>
              )}
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{documentTitle}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVariablePanel(!showVariablePanel)}
                className="gap-1"
              >
                {showVariablePanel ? (
                  <>
                    <PanelRightClose className="h-4 w-4" />
                    隐藏变量
                  </>
                ) : (
                  <>
                    <PanelRightOpen className="h-4 w-4" />
                    显示变量
                  </>
                )}
              </Button>
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
                  导出
                </Button>
              )}
              {onNext && (
                <Button
                  size="sm"
                  onClick={onNext}
                  disabled={!isEditorReady}
                  className="gap-1"
                >
                  继续
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* 编辑器内容区 */}
          <div className="flex-1 relative">
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
                callbackUrl={editorConfig.config.editorConfig.callbackUrl}
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
          </div>
        </Card>
      </div>

      {/* 右侧变量面板 - 滑动抽屉 */}
      <div className={cn(
        "absolute top-0 right-0 bottom-0 w-80 border-l bg-background shadow-lg transition-transform duration-300 z-10",
        showVariablePanel ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* 面板标题 */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <Variable className="h-4 w-4" />
              <span className="font-medium text-sm">变量列表</span>
              <Badge variant="secondary" className="text-xs">
                {selectedVariables.length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddDialog(true)}
              className="h-7"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              添加
            </Button>
          </div>
          
          {/* 搜索和筛选 */}
          <div className="px-3 py-2 border-b space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="搜索变量..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select
              value={activeCategory}
              onValueChange={(value) => setActiveCategory(value as VariableCategory | 'all')}
            >
              <SelectTrigger className="h-8 text-sm">
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
            <div className="p-3 space-y-3">
              {Object.entries(groupedVariables).map(([category, variables]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      {VariableCategoryLabels[category as VariableCategory] || category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({variables.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {variables.map((variable) => (
                      <div
                        key={variable.id}
                        className="flex items-center justify-between p-2 rounded border hover:bg-muted/50 cursor-pointer group"
                        title="点击复制变量标识符"
                        onClick={() => {
                          navigator.clipboard.writeText(`{{${variable.key}}}`);
                          toast.success(`已复制: {{${variable.key}}}`);
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">
                            {variable.name}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
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
          <div className="px-3 py-2 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground">
              点击变量可复制标识符，在编辑器中粘贴使用
            </p>
          </div>
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
