/**
 * 基于 OnlyOffice 的合同模板创建页面
 * 
 * 新流程（简化版）：
 * 1. 基本信息 - 填写模板名称、类型、所属基地
 * 2. 上传文档 - 上传 Word 文件（主文档 + 附件）
 * 3. OnlyOffice 编辑 - 直接在 OnlyOffice 中编辑文档，绑定变量
 * 4. 完成 - 保存模板
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { 
  Loader2, 
  Check, 
  FileText, 
  Upload, 
  Edit, 
  CheckCircle,
  Plus,
  GripVertical,
  X,
  Save,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import { OnlyOfficeEditStep } from "../new/components/OnlyOfficeEditStep";
import type { TemplateVariable } from "@/types/template-variable";
import { PresetVariables } from "@/types/template-variable";

// 步骤配置
const STEPS = [
  { id: 1, title: "基本信息", icon: FileText },
  { id: 2, title: "上传文档", icon: Upload },
  { id: 3, title: "编辑文档", icon: Edit },
  { id: 4, title: "完成", icon: CheckCircle },
];

// 步骤指示器组件
function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((step, index) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        const Icon = step.icon;
        
        return (
          <div key={step.id} className="flex items-center">
            <div
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full transition-colors
                ${isActive ? "bg-primary text-primary-foreground" : ""}
                ${isCompleted ? "bg-primary/10 text-primary" : ""}
                ${!isActive && !isCompleted ? "bg-muted text-muted-foreground" : ""}
              `}
            >
              <div
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium
                  ${isActive ? "bg-primary-foreground/20" : ""}
                  ${isCompleted ? "bg-primary text-primary-foreground" : ""}
                `}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step.id}
              </div>
              <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-2 ${
                  isCompleted ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// 基地类型
interface Base {
  id: string;
  name: string;
  address: string | null;
}

// 附件类型
interface AttachmentFile {
  id: string;
  name: string;
  file: File | null;
  url: string;
  size: number;
  uploading: boolean;
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function NewOnlyOfficeTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdFromUrl = searchParams.get("id");
  
  // 状态
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  
  // 基本信息
  const [templateId, setTemplateId] = useState<string>(templateIdFromUrl || "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<'tenant' | 'service' | 'lease' | 'other'>('tenant');
  const [baseId, setBaseId] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [bases, setBases] = useState<Base[]>([]);
  const [loadingBases, setLoadingBases] = useState(false);
  
  // 文件
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [mainFileUrl, setMainFileUrl] = useState("");
  const [mainFileName, setMainFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // 附件
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  
  // 变量
  const [selectedVariables, setSelectedVariables] = useState<TemplateVariable[]>([...PresetVariables]);
  
  // Refs
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  
  // 加载基地列表
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
  
  // 加载现有模板（编辑模式）
  useEffect(() => {
    if (templateIdFromUrl) {
      loadTemplate(templateIdFromUrl);
    }
  }, [templateIdFromUrl]);
  
  // 保存草稿
  const saveDraft = useCallback(async (silent = false) => {
    setSavingDraft(true);
    
    try {
      const uploadedAttachments = attachments.filter(a => a.url).map((a, index) => ({
        id: a.id,
        name: a.name,
        url: a.url,
        fileType: 'docx',
        order: index,
      }));
      
      const res = await fetch("/api/contract-templates/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: templateId || undefined,
          name: name || '未命名模板',
          description,
          type,
          base_id: baseId,
          currentStep,
          selectedVariables,
          source_file_url: mainFileUrl,
          source_file_name: mainFileName,
          source_file_type: 'docx',
          uploadedAttachments,
        }),
      });
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || "保存失败");
      }
      
      // 如果是新创建的草稿，更新 templateId
      if (data.data?.id && !templateId) {
        setTemplateId(data.data.id);
        const url = new URL(window.location.href);
        url.searchParams.set('id', data.data.id);
        window.history.replaceState({}, '', url);
      }
      
      if (!silent) {
        toast.success("保存成功");
      }
    } catch (err) {
      console.error("保存失败:", err);
      if (!silent) {
        toast.error(err instanceof Error ? err.message : "保存失败");
      }
      throw err;
    } finally {
      setSavingDraft(false);
    }
  }, [templateId, name, description, type, baseId, currentStep, selectedVariables, mainFileUrl, mainFileName, attachments]);
  
  // 加载模板数据
  const loadTemplate = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contract-templates/${id}`);
      const data = await res.json();
      
      if (data.success && data.data) {
        const template = data.data;
        setName(template.name || "");
        setDescription(template.description || "");
        setType(template.type || 'tenant');
        setBaseId(template.base_id || "");
        setIsDefault(template.is_default || false);
        
        // 加载文档 URL
        if (template.source_file_url || template.file_url) {
          setMainFileUrl(template.source_file_url || template.file_url);
          setMainFileName(template.source_file_name || template.file_name || "模板文档.docx");
        }
        
        // 加载草稿数据
        if (template.draft_data) {
          setCurrentStep(template.draft_data.currentStep || 1);
          
          if (template.draft_data.selectedVariables) {
            setSelectedVariables(template.draft_data.selectedVariables);
          }
          
          if (template.draft_data.uploadedAttachments) {
            setAttachments(template.draft_data.uploadedAttachments.map((att: any) => ({
              id: att.id,
              name: att.name,
              file: null,
              url: att.url,
              size: att.size || 0,
              uploading: false,
            })));
          }
        }
        
        // 加载附件
        if (template.attachments && template.attachments.length > 0) {
          setAttachments(template.attachments.map((att: any) => ({
            id: att.id,
            name: att.name,
            file: null,
            url: att.url || '',
            size: 0,
            uploading: false,
          })));
        }
        
        // 加载自定义变量
        if (template.fields && template.fields.length > 0) {
          const customVariables: TemplateVariable[] = template.fields.map((field: any) => ({
            id: field.id,
            name: field.label,
            key: field.key,
            type: field.type || 'text',
            category: 'custom',
            placeholder: field.placeholder,
          }));
          setSelectedVariables(prev => {
            const existingKeys = new Set(prev.map(v => v.key));
            const newVars = customVariables.filter(v => !existingKeys.has(v.key));
            return [...prev, ...newVars];
          });
        }
      }
    } catch (err) {
      console.error("加载模板失败:", err);
      toast.error("加载模板失败");
    } finally {
      setLoading(false);
    }
  };
  
  // 上传主文档
  const handleMainFileSelect = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "contract-template");
      
      // 模拟进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const res = await fetch("/api/contract-templates/upload", {
        method: "POST",
        body: formData,
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || "上传失败");
      }
      
      setMainFile(file);
      const fileUrl = data.data.fileUrl;
      const fileName = data.data.fileName;
      setMainFileUrl(fileUrl);
      setMainFileName(fileName);
      
      // 如果是新模板，创建模板记录并更新草稿数据
      if (!templateId) {
        const newId = data.data.templateId || '';
        setTemplateId(newId);
        
        // 更新模板记录的 draft_data
        if (newId) {
          await fetch("/api/contract-templates/draft", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: newId,
              name: name || '未命名模板',
              description,
              type,
              base_id: baseId,
              currentStep: 2,
              source_file_url: fileUrl,
              source_file_name: fileName,
              source_file_type: data.data.fileType,
              uploadedAttachments: [],
            }),
          });
          setCurrentStep(2);
        }
      } else {
        // 更新现有模板的文件信息并保存草稿
        await fetch("/api/contract-templates", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: templateId,
            source_file_url: fileUrl,
            source_file_name: fileName,
            source_file_type: data.data.fileType,
          }),
        });
        
        await fetch("/api/contract-templates/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: templateId,
            name: name || '未命名模板',
            description,
            type,
            base_id: baseId,
            currentStep: 2,
            source_file_url: fileUrl,
            source_file_name: fileName,
            source_file_type: data.data.fileType,
            uploadedAttachments: attachments.filter(a => a.url).map((a, index) => ({
              id: a.id,
              name: a.name,
              url: a.url,
              fileType: 'docx',
              order: index,
            })),
          }),
        });
        setCurrentStep(2);
      }
      
      toast.success("主文档上传成功");
    } catch (err) {
      console.error("上传失败:", err);
      toast.error(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };
  
  // 添加附件
  const handleAttachmentsSelect = async (files: FileList) => {
    const newAttachments: AttachmentFile[] = Array.from(files).map(file => ({
      id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      file,
      url: '',
      size: file.size,
      uploading: true,
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
    
    // 逐个上传附件
    for (const att of newAttachments) {
      try {
        const formData = new FormData();
        formData.append("file", att.file!);
        formData.append("type", "contract-attachment");
        
        const res = await fetch("/api/contract-templates/upload-attachment", {
          method: "POST",
          body: formData,
        });
        
        const data = await res.json();
        
        if (data.success) {
          setAttachments(prev => prev.map(a => 
            a.id === att.id 
              ? { ...a, url: data.url, uploading: false }
              : a
          ));
          // 上传完成后保存草稿
          await saveDraft(true);
        } else {
          throw new Error(data.error || "上传失败");
        }
      } catch (err) {
        console.error(`上传附件 ${att.name} 失败:`, err);
        setAttachments(prev => prev.map(a => 
          a.id === att.id 
            ? { ...a, uploading: false }
            : a
        ));
        toast.error(`附件 ${att.name} 上传失败`);
      }
    }
  };
  
  // 删除附件
  const handleRemoveAttachment = async (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
    // 删除完成后保存草稿
    await saveDraft(true);
  };
  
  // 拖拽排序
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };
  
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== id) {
      setDragOverId(id);
    }
  };
  
  const handleDragLeave = () => {
    setDragOverId(null);
  };
  
  const handleDrop = (e: React.DragEvent, dropId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === dropId) return;
    
    setAttachments(prev => {
      const items = [...prev];
      const dragIndex = items.findIndex(i => i.id === draggedId);
      const dropIndex = items.findIndex(i => i.id === dropId);
      
      if (dragIndex !== -1 && dropIndex !== -1) {
        const [draggedItem] = items.splice(dragIndex, 1);
        items.splice(dropIndex, 0, draggedItem);
      }
      
      return items;
    });
    
    setDraggedId(null);
    setDragOverId(null);
    // 排序完成后保存草稿
    saveDraft(true);
  };
  
  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };
  
  // 保存文档和变量
  const handleSaveDocument = async (data: { documentUrl: string; variables: TemplateVariable[] }) => {
    setSaving(true);
    try {
      // 保存变量
      const customVariables = data.variables.filter(v => v.category === 'custom');
      
      if (customVariables.length > 0) {
        await fetch("/api/contract-templates/fields", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId,
            fields: customVariables.map(v => ({
              key: v.key,
              label: v.name,
              type: v.type || 'text',
              required: true,
              placeholder: v.placeholder,
            })),
          }),
        });
      }
      
      setSelectedVariables(data.variables);
      // 保存完成后保存草稿
      await saveDraft(true);
    } catch (err) {
      console.error("保存失败:", err);
      throw err;
    } finally {
      setSaving(false);
    }
  };
  
  // 完成创建
  const handleComplete = async () => {
    if (!templateId) {
      toast.error("请先上传文档");
      return;
    }
    
    if (!name.trim()) {
      toast.error("请输入模板名称");
      return;
    }
    
    if (!baseId) {
      toast.error("请选择所属基地");
      return;
    }
    
    setSaving(true);
    
    try {
      // 1. 保存附件信息
      const attachmentsData = attachments.filter(a => a.url).map((a, index) => ({
        id: a.id,
        name: a.name,
        url: a.url,
        description: '',
        required: false,
        order: index,
      }));
      
      // 2. 更新模板基本信息
      const res = await fetch("/api/contract-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: templateId,
          name,
          description,
          type,
          base_id: baseId,
          is_default: isDefault,
          status: 'published',
          attachments: attachmentsData,
          source_file_url: mainFileUrl,
          source_file_name: mainFileName,
          source_file_type: 'docx',
        }),
      });
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || "保存失败");
      }
      
      // 3. 保存自定义变量
      const customVariables = selectedVariables.filter(v => v.category === 'custom');
      if (customVariables.length > 0) {
        await fetch("/api/contract-templates/fields", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId,
            fields: customVariables.map(v => ({
              key: v.key,
              label: v.name,
              type: v.type || 'text',
              required: true,
              placeholder: v.placeholder,
            })),
          }),
        });
      }
      
      toast.success("模板创建成功");
      router.push("/dashboard/base/contracts/templates");
    } catch (err) {
      console.error("保存失败:", err);
      toast.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };
  
  // 步骤导航
  const handleNext = async () => {
    // 验证当前步骤
    if (currentStep === 1) {
      if (!name.trim()) {
        toast.error("请输入模板名称");
        return;
      }
      // 第1步完成后自动保存草稿
      await saveDraft(true);
    }
    if (currentStep === 2 && !mainFileUrl) {
      toast.error("请上传主文档");
      return;
    }
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      // 步骤切换后自动保存草稿
      await saveDraft(true);
    } else {
      handleComplete();
    }
  };
  
  const handlePrev = async () => {
    if (currentStep > 1) {
      // 返回前一步时自动保存草稿
      await saveDraft(true);
      setCurrentStep(currentStep - 1);
    }
  };
  
  // 手动保存草稿
  const handleSaveDraftClick = async () => {
    await saveDraft(false);
  };
  
  // 加载中
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* 标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {templateId ? '编辑合同模板' : '创建合同模板'}
        </h1>
        <p className="text-muted-foreground">
          基于 OnlyOffice 的合同模板编辑，支持原生 Word 格式
        </p>
      </div>
      
      {/* 步骤指示器 */}
      <StepIndicator currentStep={currentStep} />
      
      {/* 步骤内容 */}
      <div className="mt-6">
        {/* 步骤 1：基本信息 */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>填写模板的基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">模板名称 *</Label>
                <Input
                  id="name"
                  placeholder="如：入驻企业合同模板"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">模板描述</Label>
                <Textarea
                  id="description"
                  placeholder="描述该模板的用途和适用场景"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">模板类型</Label>
                  <Select value={type} onValueChange={(value) => setType(value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant">入驻企业</SelectItem>
                      <SelectItem value="service">服务企业</SelectItem>
                      <SelectItem value="lease">租赁合同</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="base">所属基地 *</Label>
                  <Select value={baseId} onValueChange={setBaseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择基地" />
                    </SelectTrigger>
                    <SelectContent>
                      {bases.map((base) => (
                        <SelectItem key={base.id} value={base.id}>
                          {base.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="default"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
                <Label htmlFor="default">设为默认模板</Label>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* 步骤 2：上传文档 */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* 主文档上传 */}
            <Card>
              <CardHeader>
                <CardTitle>合同主文档</CardTitle>
                <CardDescription>上传合同主文档，支持 .doc、.docx 格式</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => mainFileInputRef.current?.click()}
                >
                  <input
                    ref={mainFileInputRef}
                    type="file"
                    accept=".doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleMainFileSelect(file);
                    }}
                    className="hidden"
                    disabled={uploading}
                  />
                  
                  {mainFileUrl ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div className="text-left">
                        <p className="font-medium">{mainFileName}</p>
                        <p className="text-sm text-green-500">已上传</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          mainFileInputRef.current?.click();
                        }}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                        disabled={uploading}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        重新上传
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">点击上传合同文档</p>
                      <p className="text-sm text-muted-foreground">支持 .doc、.docx 格式</p>
                    </>
                  )}
                </div>
                
                {/* 上传进度 */}
                {uploading && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>正在上传...</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 附件上传 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>合同附件</CardTitle>
                    <CardDescription>附件将与主合同合并展示，支持绑定变量</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => attachmentInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    添加附件
                  </Button>
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    accept=".doc,.docx"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        handleAttachmentsSelect(e.target.files);
                      }
                    }}
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
                      <div
                        key={att.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, att.id)}
                        onDragOver={(e) => handleDragOver(e, att.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, att.id)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "flex items-center gap-3 p-3 bg-muted/50 rounded-lg transition-all cursor-move",
                          draggedId === att.id && "opacity-50 scale-[0.98]",
                          dragOverId === att.id && "border-2 border-amber-500 bg-amber-50/50"
                        )}
                      >
                        <div className="text-muted-foreground hover:text-foreground transition-colors">
                          <GripVertical className="h-5 w-5" />
                        </div>
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{att.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {att.uploading ? (
                                <span className="text-amber-500">上传中...</span>
                              ) : att.size > 0 ? (
                                formatFileSize(att.size)
                              ) : att.url ? (
                                <span className="text-green-500">已上传</span>
                              ) : (
                                '待上传'
                              )}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleRemoveAttachment(att.id); }}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground text-center pt-2">拖拽附件可调整顺序</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* 步骤 3：OnlyOffice 编辑 */}
        {currentStep === 3 && (
          <OnlyOfficeEditStep
            templateId={templateId}
            documentUrl={mainFileUrl}
            documentTitle={mainFileName}
            selectedVariables={selectedVariables}
            onSave={handleSaveDocument}
            saving={saving}
          />
        )}
        
        {/* 步骤 4：完成 */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>确认信息</CardTitle>
              <CardDescription>检查模板信息并完成创建</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">模板名称</span>
                  <span className="font-medium">{name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">模板类型</span>
                  <span className="font-medium">
                    {type === 'tenant' ? '入驻企业' : 
                     type === 'service' ? '服务企业' :
                     type === 'lease' ? '租赁合同' : '其他'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">所属基地</span>
                  <span className="font-medium">
                    {bases.find(b => b.id === baseId)?.name || '-'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">文档文件</span>
                  <span className="font-medium">{mainFileName}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">附件数量</span>
                  <span className="font-medium">{attachments.length} 个</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">变量数量</span>
                  <span className="font-medium">{selectedVariables.length} 个</span>
                </div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  点击「完成」按钮后，模板将被发布并可在合同管理中使用。
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* 步骤导航 */}
      <div className="flex justify-between items-center mt-6 pt-6 border-t">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 1}
        >
          上一步
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={handleSaveDraftClick}
            disabled={savingDraft}
          >
            {savingDraft ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存
              </>
            )}
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={uploading || saving || attachments.some(a => a.uploading) || savingDraft}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                保存中...
              </>
            ) : currentStep === 4 ? (
              "完成"
            ) : (
              "下一步"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
