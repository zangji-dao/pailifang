"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  ArrowLeft,
  Loader2,
  Upload,
  FileText,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Building2,
  Plus,
  MousePointer,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ParseResult } from "@/types/contract-template";
import type { TemplateVariable, VariableBinding, VariableType, VariableCategory, VariableTypeLabels as VTLabels, VariableCategoryLabels as VTCatLabels } from "@/types/template-variable";
import { PresetVariables, VariableTypeLabels, VariableCategoryLabels } from "@/types/template-variable";

// 步骤定义
const STEPS = [
  { id: 1, title: "上传文档", description: "上传合同文件" },
  { id: 2, title: "绑定变量", description: "选择变量并绑定位置" },
  { id: 3, title: "基本信息", description: "填写模板信息" },
  { id: 4, title: "完成", description: "预览并保存" },
];

// 附件文件类型
interface AttachmentFile {
  id: string;
  file: File;
  name: string;
  type: string;
  size: number;
}

// 基地类型
interface Base {
  id: string;
  name: string;
  address: string | null;
}

export default function NewTemplatePage() {
  const router = useRouter();
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // 当前步骤
  const [currentStep, setCurrentStep] = useState(1);
  
  // 步骤1: 上传文档
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [templateId, setTemplateId] = useState<string>("");
  
  // 解析结果
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  
  // 已上传的附件
  const [uploadedAttachments, setUploadedAttachments] = useState<Array<{
    id: string;
    name: string;
    url: string;
    fileType: string;
    size: number;
  }>>([]);
  
  // 基地列表
  const [bases, setBases] = useState<Base[]>([]);
  const [loadingBases, setLoadingBases] = useState(false);
  
  // 步骤2: 变量绑定（合并选择和绑定）
  const [selectedVariables, setSelectedVariables] = useState<TemplateVariable[]>([]);
  const [bindings, setBindings] = useState<VariableBinding[]>([]);
  const [insertMode, setInsertMode] = useState(false);
  const [showVariablePicker, setShowVariablePicker] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{
    anchorText: string;
    offset: number;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<VariableCategory | 'all'>('all');
  
  // 自定义变量弹窗
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newVariable, setNewVariable] = useState<Partial<TemplateVariable>>({
    name: '',
    key: '',
    type: 'text',
    category: 'custom',
    placeholder: '',
  });
  
  // 步骤3: 基本信息
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("tenant");
  const [baseId, setBaseId] = useState<string>("");
  const [isDefault, setIsDefault] = useState(false);
  
  // 保存状态
  const [saving, setSaving] = useState(false);
  
  // 获取基地列表
  useEffect(() => {
    const fetchBases = async () => {
      setLoadingBases(true);
      try {
        const res = await fetch("/api/bases");
        const data = await res.json();
        if (data.success) {
          setBases(data.data || []);
        }
      } catch (err) {
        console.error("获取基地列表失败:", err);
      } finally {
        setLoadingBases(false);
      }
    };
    
    fetchBases();
  }, []);
  
  // ========== 步骤1: 上传文档 ==========
  
  const handleMainFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword"
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("合同文档仅支持 Word 格式（.doc 或 .docx）");
        return;
      }
      setMainFile(file);
    }
  };
  
  const handleAttachmentsSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // 附件只支持 Word 格式
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    
    const validFiles: AttachmentFile[] = [];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`文件"${file.name}"格式不支持，附件仅支持 Word 格式`);
        continue;
      }
      validFiles.push({
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        type: file.type,
        size: file.size,
      });
    }
    
    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles]);
    }
    
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }
  };
  
  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };
  
  // 移动附件排序
  const moveAttachment = (id: string, direction: 'up' | 'down') => {
    setAttachments(prev => {
      const index = prev.findIndex(a => a.id === id);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newAttachments = [...prev];
      [newAttachments[index], newAttachments[newIndex]] = [newAttachments[newIndex], newAttachments[index]];
      return newAttachments;
    });
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };
  
  const handleUploadAndParse = async () => {
    if (!mainFile) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", mainFile);
      
      for (const att of attachments) {
        formData.append("attachments", att.file);
      }
      
      const uploadRes = await fetch("/api/contract-templates/upload", {
        method: "POST",
        body: formData,
      });
      
      const uploadData = await uploadRes.json();
      if (!uploadData.success) {
        throw new Error(uploadData.error || "上传失败");
      }
      
      setTemplateId(uploadData.data.templateId);
      setUploadedAttachments(uploadData.data.attachments || []);
      setUploading(false);
      
      setParsing(true);
      
      // 构建附件信息
      const attachmentInfos = (uploadData.data.attachments || []).map((att: any) => ({
        id: att.id,
        name: att.name,
        url: att.url,
        fileType: att.fileType,
      }));
      
      const parseRes = await fetch("/api/contract-templates/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: uploadData.data.templateId,
          fileUrl: uploadData.data.fileUrl,
          fileName: uploadData.data.fileName,
          fileType: uploadData.data.fileType,
          attachments: attachmentInfos,
        }),
      });
      
      const parseData = await parseRes.json();
      if (!parseData.success) {
        throw new Error(parseData.error || "解析失败");
      }
      
      setParseResult(parseData.data);
      
      if (!name) {
        setName(mainFile.name.replace(/\.[^/.]+$/, ""));
      }
      
      toast.success("文档解析成功");
      setCurrentStep(2);
    } catch (err) {
      console.error("上传解析失败:", err);
      toast.error(err instanceof Error ? err.message : "上传解析失败");
    } finally {
      setUploading(false);
      setParsing(false);
    }
  };
  
  // ========== 步骤2: 变量绑定 ==========
  
  // 过滤变量
  const filteredVariables = useMemo(() => {
    let vars = PresetVariables;
    
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
  }, [activeCategory, searchTerm]);
  
  // 检查变量是否已绑定
  const isVariableBound = (key: string) => {
    return bindings.some(b => b.variableKey === key);
  };
  
  // 处理文档点击
  const handleContentClick = useCallback((e: React.MouseEvent) => {
    if (!insertMode) return;
    
    const target = e.target as HTMLElement;
    
    // 如果点击的是已绑定的变量，删除绑定
    if (target.classList.contains('variable-binding')) {
      const bindingId = target.dataset.bindingId;
      if (bindingId) {
        setBindings(prev => prev.filter(b => b.id !== bindingId));
        toast.success("已删除绑定");
      }
      return;
    }
    
    // 获取点击位置
    const selection = window.getSelection();
    if (!selection) return;
    
    const range = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (!range) return;
    
    const textNode = range.startContainer;
    const textContent = textNode.textContent || '';
    const offset = range.startOffset;
    const beforeText = textContent.substring(Math.max(0, offset - 30), offset);
    
    // 查找最近的"："作为锚点
    const colonIndex = beforeText.lastIndexOf('：');
    const colonIndex2 = beforeText.lastIndexOf(':');
    const bestIndex = Math.max(colonIndex, colonIndex2);
    
    const anchorText = bestIndex >= 0 
      ? beforeText.substring(bestIndex) 
      : beforeText.slice(-15);
    
    setSelectedPosition({ anchorText, offset: 0 });
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
    
    // 如果变量未在选择列表中，添加它
    if (!selectedVariables.find(v => v.key === variable.key)) {
      setSelectedVariables(prev => [...prev, variable]);
    }
    
    setBindings(prev => [...prev, newBinding]);
    setShowVariablePicker(false);
    setSelectedPosition(null);
    toast.success(`已绑定变量: ${variable.name}`);
  };
  
  // 删除绑定
  const handleRemoveBinding = (bindingId: string) => {
    setBindings(prev => prev.filter(b => b.id !== bindingId));
  };
  
  // 添加自定义变量
  const handleAddCustomVariable = () => {
    if (!newVariable.name || !newVariable.key) return;
    
    const customVar: TemplateVariable = {
      id: `var_custom_${Date.now()}`,
      name: newVariable.name,
      key: newVariable.key,
      type: newVariable.type || 'text',
      category: 'custom',
      placeholder: newVariable.placeholder,
    };
    
    // 添加到已选变量
    setSelectedVariables(prev => [...prev, customVar]);
    
    // 如果有选中位置，直接绑定
    if (selectedPosition) {
      handleInsertVariable(customVar);
    }
    
    setShowAddDialog(false);
    setNewVariable({
      name: '',
      key: '',
      type: 'text',
      category: 'custom',
      placeholder: '',
    });
  };
  
  // 生成处理后的HTML
  const processedHtml = useMemo(() => {
    if (!parseResult?.html) return '';
    
    let result = parseResult.html;
    
    // 标记已绑定变量
    bindings.forEach((binding) => {
      const variable = [...selectedVariables, ...PresetVariables].find(v => v.key === binding.variableKey);
      if (variable && binding.position.anchorText) {
        const marker = `<span class="variable-binding" data-binding-id="${binding.id}" data-variable-key="${binding.variableKey}" style="background: rgba(34, 197, 94, 0.2); color: #16a34a; padding: 2px 8px; border-radius: 4px; cursor: pointer; border: 1px dashed #22c55e; font-weight: 500;">{{${variable.name}}}</span>`;
        
        // 简单替换：在锚点文本后添加标记
        result = result.replace(
          binding.position.anchorText,
          binding.position.anchorText + marker
        );
      }
    });
    
    return result;
  }, [parseResult?.html, bindings, selectedVariables]);
  
  // ========== 保存模板 ==========
  
  const handleSave = async () => {
    if (!templateId) {
      toast.error("请先上传文档");
      return;
    }
    
    if (!name.trim()) {
      toast.error("请输入模板名称");
      setCurrentStep(3);
      return;
    }
    
    if (!baseId) {
      toast.error("请选择所属基地");
      setCurrentStep(3);
      return;
    }
    
    setSaving(true);
    try {
      // 1. 更新基本信息
      const updateRes = await fetch("/api/contract-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: templateId,
          name,
          description,
          type,
          base_id: baseId || null,
          is_default: isDefault,
        }),
      });
      
      if (!updateRes.ok) throw new Error("更新基本信息失败");
      
      // 2. 保存变量绑定
      if (selectedVariables.length > 0) {
        await fetch("/api/contract-templates/variables", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId,
            variables: selectedVariables,
            bindings,
          }),
        });
      }
      
      toast.success("模板创建成功");
      router.push("/dashboard/base/contracts/templates");
    } catch (err) {
      console.error("保存失败:", err);
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };
  
  // ========== 渲染步骤内容 ==========
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderUploadStep();
      case 2:
        return renderBindingStep();
      case 3:
        return renderBasicInfoStep();
      case 4:
        return renderCompleteStep();
      default:
        return null;
    }
  };
  
  // 步骤1: 上传文档
  const renderUploadStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>上传合同文档</CardTitle>
          <CardDescription>仅支持 Word 文档（.doc 或 .docx 格式）</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              mainFile 
                ? "border-green-500 bg-green-50" 
                : "border-muted-foreground/25 hover:border-amber-500 hover:bg-amber-50/50"
            )}
            onClick={() => mainFileInputRef.current?.click()}
          >
            <input
              ref={mainFileInputRef}
              type="file"
              accept=".doc,.docx"
              onChange={handleMainFileSelect}
              className="hidden"
            />
            {mainFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div className="text-left">
                  <p className="font-medium">{mainFile.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(mainFile.size)}</p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">点击上传合同文档</p>
                <p className="text-sm text-muted-foreground">支持 .doc、.docx 格式</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>合同附件</CardTitle>
              <CardDescription>附件将与主合同合并展示，支持绑定变量</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => attachmentInputRef.current?.click()}>
              <Plus className="h-4 w-4 mr-1" />
              添加附件
            </Button>
            <input
              ref={attachmentInputRef}
              type="file"
              accept=".doc,.docx"
              multiple
              onChange={handleAttachmentsSelect}
              className="hidden"
            />
          </div>
        </CardHeader>
        <CardContent>
          {attachments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
              <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">点击"添加附件"上传附件文件</p>
              <p className="text-xs mt-1">仅支持 Word 格式，将合并到主合同预览</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attachments.map((att, index) => (
                <div key={att.id} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg group">
                  {/* 排序手柄 */}
                  <div className="flex flex-col items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-50 hover:opacity-100 disabled:opacity-30"
                      onClick={() => moveAttachment(att.id, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-50 hover:opacity-100 disabled:opacity-30"
                      onClick={() => moveAttachment(att.id, 'down')}
                      disabled={index === attachments.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* 文件信息 */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        <span className="text-muted-foreground mr-2">附件{index + 1}:</span>
                        {att.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(att.size)}</p>
                    </div>
                  </div>
                  
                  {/* 删除按钮 */}
                  <Button variant="ghost" size="sm" onClick={() => removeAttachment(att.id)} className="text-destructive shrink-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {(uploading || parsing) && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{uploading ? "上传文件中..." : "正在解析文档..."}</span>
              </div>
              <Progress value={uploading ? 30 : 70} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
  
  // 步骤2: 变量绑定（合并选择和绑定）
  const renderBindingStep = () => {
    if (!parseResult?.html) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>未检测到合同内容，请返回步骤1重新上传</p>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <div className="h-[calc(100vh-280px)] min-h-[500px] grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 左侧：合同预览 */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="py-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">合同预览</CardTitle>
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
                {bindings.length > 0 && (
                  <Badge variant="secondary">{bindings.length} 处绑定</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-auto h-[calc(100%-52px)]">
            <div className="p-6 bg-muted/30 min-h-full">
              <style jsx global>{`
                .contract-content { max-width: 800px; margin: 0 auto; padding: 40px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 4px; font-size: 14px; line-height: 2; }
                .contract-content h1 { font-size: 20px; font-weight: bold; text-align: center; margin-bottom: 24px; }
                .contract-content h2 { font-size: 16px; font-weight: bold; margin: 20px 0 12px; }
                .contract-content p { text-indent: 2em; margin-bottom: 12px; }
                .contract-content table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
                .contract-content table th, .contract-content table td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
                .contract-content table th { background: #f3f4f6; font-weight: 600; }
                .variable-binding { background: rgba(34, 197, 94, 0.2); color: #16a34a; padding: 2px 8px; border-radius: 4px; cursor: pointer; border: 1px dashed #22c55e; font-weight: 500; }
                .variable-binding:hover { background: rgba(239, 68, 68, 0.2); border-color: #ef4444; color: #dc2626; }
                .contract-content u { background: rgba(251, 191, 36, 0.2); padding: 0 4px; border-radius: 2px; }
                .document-separator { margin: 40px 0; padding: 20px 0; border-top: 2px dashed #d1d5db; }
                .document-separator h2 { text-align: center; color: #374151; font-size: 18px; margin-bottom: 20px; padding: 10px; background: #f3f4f6; border-radius: 4px; }
              `}</style>
              <div
                ref={contentRef}
                className={`contract-content prose prose-sm max-w-none ${insertMode ? 'cursor-crosshair' : ''}`}
                onClick={handleContentClick}
                dangerouslySetInnerHTML={{ __html: processedHtml }}
              />
            </div>
          </CardContent>
        </Card>

        {/* 右侧：变量面板 */}
        <Card className="overflow-hidden">
          <CardHeader className="py-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">变量列表</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-3 w-3 mr-1" />
                自定义
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-auto h-[calc(100%-52px)]">
            {/* 搜索和分类 */}
            <div className="p-3 space-y-2 border-b">
              <Input
                placeholder="搜索变量..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8"
              />
              <div className="flex gap-1 flex-wrap">
                <Button variant={activeCategory === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory('all')} className="text-xs h-6 px-2">全部</Button>
                {(['enterprise', 'contract', 'location', 'date'] as VariableCategory[]).map((cat) => (
                  <Button key={cat} variant={activeCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory(cat)} className="text-xs h-6 px-2">
                    {VariableCategoryLabels[cat]}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* 变量列表 */}
            <ScrollArea className="h-[calc(100%-120px)]">
              <div className="p-2 space-y-1">
                {filteredVariables.map((variable) => {
                  const bound = isVariableBound(variable.key);
                  return (
                    <div
                      key={variable.id}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        bound ? 'bg-green-50 border border-green-200' : 'hover:bg-muted'
                      }`}
                      onClick={() => {
                        if (insertMode) {
                          setSelectedPosition({ anchorText: '', offset: 0 });
                          handleInsertVariable(variable);
                        } else {
                          toast.info('请先开启插入模式');
                        }
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-sm">{variable.name}</span>
                          {bound && <Check className="h-3 w-3 text-green-600" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{variable.key}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{VariableTypeLabels[variable.type]}</Badge>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // 步骤3: 基本信息
  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>模板基本信息</CardTitle>
          <CardDescription>设置模板的名称、类型和描述</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>模板名称 *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：园区入驻服务合同模板" />
            </div>
            <div className="space-y-2">
              <Label>所属基地 *</Label>
              <Select value={baseId} onValueChange={setBaseId} disabled={loadingBases}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingBases ? "加载中..." : "选择基地"} />
                </SelectTrigger>
                <SelectContent>
                  {bases.map((base) => (
                    <SelectItem key={base.id} value={base.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{base.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>模板类型</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant">入驻合同</SelectItem>
                  <SelectItem value="service">服务合同</SelectItem>
                  <SelectItem value="lease">租赁合同</SelectItem>
                  <SelectItem value="other">其他合同</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex items-end">
              <div className="flex items-center gap-2">
                <Switch checked={isDefault} onCheckedChange={setIsDefault} />
                <Label className="font-normal">设为默认模板</Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>模板描述</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="描述该模板的用途和特点" rows={3} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
  
  // 步骤4: 完成
  const renderCompleteStep = () => {
    const selectedBase = bases.find(b => b.id === baseId);
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>确认并保存</CardTitle>
            <CardDescription>请检查以下信息，确认无误后保存模板</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-muted-foreground">模板名称</Label>
                <p className="font-medium">{name || "未填写"}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">所属基地</Label>
                <p className="font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {selectedBase?.name || "未选择"}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">模板类型</Label>
                <p className="font-medium">
                  {type === "tenant" ? "入驻合同" : type === "service" ? "服务合同" : type === "lease" ? "租赁合同" : "其他合同"}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">变量绑定</Label>
                <p className="font-medium">{bindings.length} 处</p>
              </div>
            </div>
          
            {bindings.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-muted-foreground">已绑定变量</Label>
                  <div className="flex flex-wrap gap-2">
                    {bindings.map((binding) => {
                      const variable = [...selectedVariables, ...PresetVariables].find(v => v.key === binding.variableKey);
                      return variable ? (
                        <Badge key={binding.id} variant="outline" className="bg-green-50">
                          {variable.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // ========== 导航按钮 ==========
  
  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return parseResult !== null;
      case 2:
      case 3:
        return true;
      case 4:
        return false;
      default:
        return false;
    }
  };
  
  const handleNext = () => {
    if (currentStep === 1 && !parseResult) {
      handleUploadAndParse();
      return;
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/base/contracts/templates")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
          <h1 className="text-2xl font-semibold">新建合同模板</h1>
        </div>
      </div>
      
      {/* 步骤指示器 */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-colors",
                currentStep === step.id ? "bg-amber-600 text-white" : currentStep > step.id ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
              )}>
                <span className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium",
                  currentStep === step.id ? "bg-white/20" : currentStep > step.id ? "bg-green-200" : "bg-muted-foreground/20"
                )}>
                  {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                </span>
                <span className="hidden sm:inline">{step.title}</span>
              </div>
              {index < STEPS.length - 1 && <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </div>
      
      <div className="min-h-[400px]">{renderStepContent()}</div>
      
      {/* 底部导航 */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={handlePrev} disabled={currentStep === 1}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          上一步
        </Button>
        <div className="flex items-center gap-2">
          {currentStep === 4 ? (
            <Button onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />保存中...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" />保存模板</>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canGoNext() && currentStep !== 1} className="bg-amber-600 hover:bg-amber-700">
              {currentStep === 1 && !parseResult ? (
                uploading || parsing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{uploading ? "上传中..." : "解析中..."}</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" />上传并解析</>
                )
              ) : (
                <><span>下一步</span><ChevronRight className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* 自定义变量弹窗 */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[400px]">
            <CardHeader>
              <CardTitle>添加自定义变量</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>变量名称 *</Label>
                <Input
                  value={newVariable.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setNewVariable({
                      ...newVariable,
                      name,
                      key: name ? name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w\u4e00-\u9fa5]/g, '') : '',
                    });
                  }}
                  placeholder="如：项目负责人"
                />
              </div>
              <div>
                <Label>变量标识 *</Label>
                <Input
                  value={newVariable.key}
                  onChange={(e) => setNewVariable({ ...newVariable, key: e.target.value })}
                  placeholder="如：project_manager"
                />
              </div>
              <div>
                <Label>变量类型</Label>
                <Select value={newVariable.type} onValueChange={(v) => setNewVariable({ ...newVariable, type: v as VariableType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">文本</SelectItem>
                    <SelectItem value="number">数字</SelectItem>
                    <SelectItem value="date">日期</SelectItem>
                    <SelectItem value="money">金额</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-4 border-t">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>取消</Button>
              <Button onClick={handleAddCustomVariable} disabled={!newVariable.name || !newVariable.key}>添加</Button>
            </div>
          </Card>
        </div>
      )}

      {/* 变量选择弹窗 */}
      {showVariablePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[500px] max-h-[80vh] overflow-hidden">
            <CardHeader>
              <CardTitle>选择要插入的变量</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-auto max-h-[60vh]">
              <div className="grid grid-cols-2 gap-2 p-4">
                {filteredVariables.map((variable) => (
                  <Button
                    key={variable.id}
                    variant="outline"
                    className="justify-start h-auto py-3"
                    onClick={() => handleInsertVariable(variable)}
                  >
                    <Plus className="h-4 w-4 mr-2 shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">{variable.name}</div>
                      <div className="text-xs text-muted-foreground">{VariableTypeLabels[variable.type]}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
            <div className="flex justify-end p-4 border-t">
              <Button variant="outline" onClick={() => { setShowVariablePicker(false); setSelectedPosition(null); }}>取消</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
