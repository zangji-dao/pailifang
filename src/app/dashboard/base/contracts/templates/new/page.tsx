"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  ArrowLeft,
  Loader2,
  Eye,
  Upload,
  FileText,
  Check,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Plus,
  GripVertical,
  AlertCircle,
  FileDown,
  RefreshCw,
  X,
  Edit2,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { 
  ParseResult, 
  DetectedAttachment, 
  ContractFieldDefinition 
} from "@/types/contract-template";

// 步骤定义
const STEPS = [
  { id: 1, title: "上传文档", description: "上传合同PDF或Word文档" },
  { id: 2, title: "确认附件", description: "确认自动识别的附件拆分" },
  { id: 3, title: "基本信息", description: "填写模板基本信息" },
  { id: 4, title: "字段设置", description: "设置可填充字段" },
  { id: 5, title: "完成", description: "保存模板" },
];

// 字段类型选项
const fieldTypeOptions = [
  { value: "text", label: "文本" },
  { value: "date", label: "日期" },
  { value: "number", label: "数字" },
  { value: "select", label: "下拉选择" },
  { value: "textarea", label: "多行文本" },
];

export default function NewTemplatePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 当前步骤
  const [currentStep, setCurrentStep] = useState(1);
  
  // 步骤1: 上传文档
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [templateId, setTemplateId] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string>("");
  
  // 步骤2: 解析结果和附件
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [attachments, setAttachments] = useState<DetectedAttachment[]>([]);
  const [editingAttachment, setEditingAttachment] = useState<string | null>(null);
  
  // 步骤3: 基本信息
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("tenant");
  const [isDefault, setIsDefault] = useState(false);
  
  // 步骤4: 字段设置
  const [fields, setFields] = useState<ContractFieldDefinition[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  
  // 保存状态
  const [saving, setSaving] = useState(false);
  
  // ========== 步骤1: 上传文档 ==========
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword"
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("请上传 PDF 或 Word 文档");
        return;
      }
      setUploadFile(file);
    }
  };
  
  const handleUploadAndParse = async () => {
    if (!uploadFile) return;
    
    setUploading(true);
    try {
      // 1. 上传文件
      const formData = new FormData();
      formData.append("file", uploadFile);
      
      const uploadRes = await fetch("/api/contract-templates/upload", {
        method: "POST",
        body: formData,
      });
      
      const uploadData = await uploadRes.json();
      if (!uploadData.success) {
        throw new Error(uploadData.error || "上传失败");
      }
      
      setTemplateId(uploadData.data.templateId);
      setFileUrl(uploadData.data.fileUrl);
      setUploading(false);
      
      // 2. 解析文档
      setParsing(true);
      const parseRes = await fetch("/api/contract-templates/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: uploadData.data.templateId,
          fileUrl: uploadData.data.fileUrl,
          fileName: uploadData.data.fileName,
          fileType: uploadData.data.fileType,
        }),
      });
      
      const parseData = await parseRes.json();
      if (!parseData.success) {
        throw new Error(parseData.error || "解析失败");
      }
      
      setParseResult(parseData.data);
      setAttachments(parseData.data.detectedAttachments || []);
      setFields(parseData.data.detectedFields || []);
      
      // 自动填充模板名称
      if (!name) {
        setName(uploadFile.name.replace(/\.[^/.]+$/, ""));
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
  
  // ========== 步骤2: 确认附件 ==========
  
  const handleUpdateAttachment = (id: string, updates: Partial<DetectedAttachment>) => {
    setAttachments(prev => prev.map(att => 
      att.id === id ? { ...att, ...updates } : att
    ));
  };
  
  const handleDeleteAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };
  
  const handleAddAttachment = () => {
    const newAtt: DetectedAttachment = {
      id: `att-new-${Date.now()}`,
      name: `新附件`,
      startPage: 1,
      endPage: 1,
      pageRange: "1",
      confidence: 1,
      content: "",
    };
    setAttachments(prev => [...prev, newAtt]);
  };
  
  // ========== 步骤4: 字段设置 ==========
  
  const handleUpdateField = (key: string, updates: Partial<ContractFieldDefinition>) => {
    setFields(prev => prev.map(f => 
      f.key === key ? { ...f, ...updates } : f
    ));
  };
  
  const handleDeleteField = (key: string) => {
    setFields(prev => prev.filter(f => f.key !== key));
  };
  
  const handleAddField = () => {
    const newField: ContractFieldDefinition = {
      key: `field_${Date.now()}`,
      label: "新字段",
      type: "text",
      required: false,
    };
    setFields(prev => [...prev, newField]);
  };
  
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
          is_default: isDefault,
        }),
      });
      
      if (!updateRes.ok) throw new Error("更新基本信息失败");
      
      // 2. 保存附件
      if (attachments.length > 0) {
        await fetch("/api/contract-templates/confirm-attachments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId,
            attachments: attachments.map((att, idx) => ({
              id: att.id,
              name: att.name,
              pageRange: att.pageRange,
              order: idx + 1,
            })),
          }),
        });
      }
      
      // 3. 保存字段
      if (fields.length > 0) {
        await fetch("/api/contract-templates/fields", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId,
            fields,
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
        return renderAttachmentsStep();
      case 3:
        return renderBasicInfoStep();
      case 4:
        return renderFieldsStep();
      case 5:
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
          <CardDescription>
            支持 PDF、Word（.doc/.docx）格式，系统将自动解析文档结构和附件
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 上传区域 */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              uploadFile 
                ? "border-green-500 bg-green-50" 
                : "border-muted-foreground/25 hover:border-amber-500 hover:bg-amber-50/50"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            {uploadFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div className="text-left">
                  <p className="font-medium">{uploadFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">点击或拖拽上传文档</p>
                <p className="text-sm text-muted-foreground">
                  支持 PDF、Word 文档，单个文件最大 50MB
                </p>
              </>
            )}
          </div>
          
          {/* 解析进度 */}
          {(uploading || parsing) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{uploading ? "上传中..." : "正在解析文档..."}</span>
              </div>
              <Progress value={uploading ? 30 : 70} className="h-2" />
            </div>
          )}
          
          {/* 解析结果预览 */}
          {parseResult && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                解析完成
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">文件类型：</span>
                  <Badge variant="outline">{parseResult.fileType.toUpperCase()}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">识别附件：</span>
                  <Badge variant="outline">{parseResult.detectedAttachments.length} 个</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">识别字段：</span>
                  <Badge variant="outline">{parseResult.detectedFields.length} 个</Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
  
  // 步骤2: 确认附件
  const renderAttachmentsStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>确认附件拆分</CardTitle>
              <CardDescription>
                系统已自动识别文档中的附件，请确认或调整拆分结果
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleAddAttachment}>
              <Plus className="h-4 w-4 mr-1" />
              添加附件
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {attachments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>未检测到附件</p>
              <p className="text-sm">您可以手动添加附件或跳过此步骤</p>
            </div>
          ) : (
            <div className="space-y-4">
              {attachments.map((att, index) => (
                <div
                  key={att.id}
                  className="border rounded-lg p-4 hover:border-amber-300 transition-colors"
                >
                  {editingAttachment === att.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>附件名称</Label>
                          <Input
                            value={att.name}
                            onChange={(e) => handleUpdateAttachment(att.id, { name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>页码范围</Label>
                          <Input
                            value={att.pageRange}
                            onChange={(e) => handleUpdateAttachment(att.id, { pageRange: e.target.value })}
                            placeholder="如: 6-10"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingAttachment(null)}
                        >
                          完成
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{att.name}</p>
                          <p className="text-sm text-muted-foreground">
                            页码: {att.pageRange}
                            {att.confidence < 0.9 && (
                              <span className="ml-2 text-amber-600">
                                (置信度: {Math.round(att.confidence * 100)}%)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingAttachment(att.id)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
  
  // 步骤3: 基本信息
  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>模板基本信息</CardTitle>
          <CardDescription>
            设置模板的名称、类型和描述
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>模板名称 *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="如：园区入驻服务合同模板"
              />
            </div>
            <div className="space-y-2">
              <Label>模板类型</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant">入驻合同</SelectItem>
                  <SelectItem value="service">服务合同</SelectItem>
                  <SelectItem value="lease">租赁合同</SelectItem>
                  <SelectItem value="other">其他合同</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>模板描述</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述该模板的用途和特点"
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            <Label className="font-normal">设为默认模板</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  
  // 步骤4: 字段设置
  const renderFieldsStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>可填充字段设置</CardTitle>
              <CardDescription>
                设置合同中需要动态填充的字段，用户使用模板时可填写这些字段
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleAddField}>
              <Plus className="h-4 w-4 mr-1" />
              添加字段
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Edit2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>未检测到可填充字段</p>
              <p className="text-sm">您可以手动添加字段或跳过此步骤</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.key}
                  className="border rounded-lg p-4 hover:border-amber-300 transition-colors"
                >
                  {editingField === field.key ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>字段标签</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => handleUpdateField(field.key, { label: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>字段标识</Label>
                          <Input
                            value={field.key}
                            onChange={(e) => handleUpdateField(field.key, { key: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>字段类型</Label>
                          <Select
                            value={field.type}
                            onValueChange={(v) => handleUpdateField(field.key, { type: v as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldTypeOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>占位符</Label>
                          <Input
                            value={field.placeholder || ""}
                            onChange={(e) => handleUpdateField(field.key, { placeholder: e.target.value })}
                            placeholder="输入提示文字"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={field.required}
                            onCheckedChange={(v) => handleUpdateField(field.key, { required: v })}
                          />
                          <Label className="font-normal">必填字段</Label>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingField(null)}
                        >
                          完成
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {field.label}
                            {field.required && (
                              <span className="text-red-500">*</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {field.key} · {fieldTypeOptions.find(o => o.value === field.type)?.label}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingField(field.key)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteField(field.key)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
  
  // 步骤5: 完成
  const renderCompleteStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>确认并保存</CardTitle>
          <CardDescription>
            请检查以下信息，确认无误后保存模板
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-muted-foreground">模板名称</Label>
              <p className="font-medium">{name || "未填写"}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">模板类型</Label>
              <p className="font-medium">
                {type === "tenant" ? "入驻合同" : 
                 type === "service" ? "服务合同" :
                 type === "lease" ? "租赁合同" : "其他合同"}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">附件数量</Label>
              <p className="font-medium">{attachments.length} 个</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">可填充字段</Label>
              <p className="font-medium">{fields.length} 个</p>
            </div>
          </div>
          
          {attachments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-muted-foreground">附件列表</Label>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((att, idx) => (
                    <Badge key={att.id} variant="outline">
                      {idx + 1}. {att.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {fields.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-muted-foreground">字段列表</Label>
                <div className="flex flex-wrap gap-2">
                  {fields.map((field, idx) => (
                    <Badge key={field.key} variant="outline">
                      {idx + 1}. {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
  
  // ========== 导航按钮 ==========
  
  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return parseResult !== null;
      case 2:
      case 3:
      case 4:
        return true;
      case 5:
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
    if (currentStep < 5) {
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
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/base/contracts/templates")}
          >
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
              <div
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full transition-colors",
                  currentStep === step.id
                    ? "bg-amber-600 text-white"
                    : currentStep > step.id
                    ? "bg-green-100 text-green-700"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <span className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium",
                  currentStep === step.id
                    ? "bg-white/20"
                    : currentStep > step.id
                    ? "bg-green-200"
                    : "bg-muted-foreground/20"
                )}>
                  {currentStep > step.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </span>
                <span className="hidden sm:inline">{step.title}</span>
              </div>
              {index < STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* 步骤内容 */}
      <div className="min-h-[400px]">
        {renderStepContent()}
      </div>
      
      {/* 底部导航 */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          上一步
        </Button>
        
        <div className="flex items-center gap-2">
          {currentStep === 5 ? (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  保存模板
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canGoNext() && currentStep !== 1}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {currentStep === 1 && !parseResult ? (
                uploading || parsing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {uploading ? "上传中..." : "解析中..."}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    上传并解析
                  </>
                )
              ) : (
                <>
                  下一步
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
