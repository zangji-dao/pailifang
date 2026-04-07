/**
 * 基于 OnlyOffice 的合同模板创建页面
 * 
 * 新流程（简化版）：
 * 1. 基本信息 - 填写模板名称、类型、所属基地
 * 2. 上传文档 - 上传 Word 文件
 * 3. OnlyOffice 编辑 - 直接在 OnlyOffice 中编辑文档，绑定变量
 * 4. 完成 - 保存模板
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Check, FileText, Upload, Edit, CheckCircle } from "lucide-react";

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

export default function NewOnlyOfficeTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdFromUrl = searchParams.get("id");
  
  // 状态
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
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
  
  // 变量
  const [selectedVariables, setSelectedVariables] = useState<TemplateVariable[]>([...PresetVariables]);
  
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
        if (template.file_url) {
          setMainFileUrl(template.file_url);
          setMainFileName(template.file_name || "模板文档.docx");
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
            isCustom: true,
          }));
          setSelectedVariables([...PresetVariables, ...customVariables]);
        }
      }
    } catch (err) {
      console.error("加载模板失败:", err);
      toast.error("加载模板失败");
    } finally {
      setLoading(false);
    }
  };
  
  // 上传文件
  const handleFileUpload = async (file: File) => {
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
      setMainFileUrl(data.url);
      setMainFileName(file.name);
      
      // 如果是新模板，创建模板记录
      if (!templateId) {
        const createRes = await fetch("/api/contract-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name || file.name.replace(/\.[^/.]+$/, ""),
            type,
            base_id: baseId,
            file_url: data.url,
            file_name: file.name,
            status: "draft",
          }),
        });
        
        const createData = await createRes.json();
        if (createData.success) {
          setTemplateId(createData.data.id);
        }
      } else {
        // 更新文件 URL
        await fetch("/api/contract-templates", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: templateId,
            file_url: data.url,
            file_name: file.name,
          }),
        });
      }
      
      toast.success("文件上传成功");
    } catch (err) {
      console.error("上传失败:", err);
      toast.error(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
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
        }),
      });
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || "保存失败");
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
  const handleNext = () => {
    // 验证当前步骤
    if (currentStep === 1 && !name.trim()) {
      toast.error("请输入模板名称");
      return;
    }
    if (currentStep === 2 && !mainFileUrl) {
      toast.error("请上传文档");
      return;
    }
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
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
          <Card>
            <CardHeader>
              <CardTitle>上传文档</CardTitle>
              <CardDescription>上传 Word 文档作为模板</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>选择文档文件</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    type="file"
                    id="file-upload"
                    accept=".docx,.doc"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    disabled={uploading}
                  />
                  
                  {mainFileUrl ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 text-primary">
                        <CheckCircle className="h-8 w-8" />
                        <span className="font-medium">{mainFileName}</span>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("file-upload")?.click()}
                        disabled={uploading}
                      >
                        更换文件
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById("file-upload")?.click()}
                          disabled={uploading}
                        >
                          {uploading ? "上传中..." : "选择文件"}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        支持 .docx, .doc 格式，最大 10MB
                      </p>
                    </div>
                  )}
                  
                  {uploading && (
                    <div className="mt-4 space-y-2">
                      <Progress value={uploadProgress} />
                      <p className="text-sm text-muted-foreground">上传中...</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
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
      <div className="flex justify-between mt-6 pt-6 border-t">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 1}
        >
          上一步
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={uploading || saving}
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
  );
}
