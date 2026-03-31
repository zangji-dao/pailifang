"use client";

import { useState, useRef, useEffect } from "react";
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
  Trash2,
  Plus,
  Edit2,
  X,
  File,
  Image,
  Building2,
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { 
  ParseResult, 
  ContractFieldDefinition 
} from "@/types/contract-template";

// 步骤定义
const STEPS = [
  { id: 1, title: "上传文档", description: "上传合同和附件" },
  { id: 2, title: "基本信息", description: "填写模板基本信息" },
  { id: 3, title: "字段设置", description: "设置可填充字段" },
  { id: 4, title: "完成", description: "保存模板" },
];

// 字段类型选项
const fieldTypeOptions = [
  { value: "text", label: "文本" },
  { value: "date", label: "日期" },
  { value: "number", label: "数字" },
  { value: "select", label: "下拉选择" },
  { value: "textarea", label: "多行文本" },
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
  
  // 步骤2: 基本信息
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("tenant");
  const [baseId, setBaseId] = useState<string>("");
  const [isDefault, setIsDefault] = useState(false);
  
  // 步骤3: 字段设置
  const [fields, setFields] = useState<ContractFieldDefinition[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  
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
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/jpeg',
      'image/png',
    ];
    
    const validFiles: AttachmentFile[] = [];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`文件"${file.name}"格式不支持`);
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
    
    // 重置 input
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }
  };
  
  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };
  
  const getFileTypeIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (type.includes('word')) return <FileText className="h-4 w-4 text-blue-500" />;
    if (type.includes('image')) return <Image className="h-4 w-4 text-green-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
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
      // 1. 上传主文件和附件
      const formData = new FormData();
      formData.append("file", mainFile);
      
      // 添加附件
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
      setFields(parseData.data.detectedFields || []);
      
      // 自动填充模板名称
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
  
  // ========== 步骤3: 字段设置 ==========
  
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
      setCurrentStep(2);
      return;
    }
    
    if (!baseId) {
      toast.error("请选择所属基地");
      setCurrentStep(2);
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
      
      // 2. 保存字段
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
        return renderBasicInfoStep();
      case 3:
        return renderFieldsStep();
      case 4:
        return renderCompleteStep();
      default:
        return null;
    }
  };
  
  // 步骤1: 上传文档
  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* 主合同文档上传 */}
      <Card>
        <CardHeader>
          <CardTitle>上传合同文档</CardTitle>
          <CardDescription>
            仅支持 Word 文档（.doc 或 .docx 格式）
          </CardDescription>
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
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(mainFile.size)}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">点击上传合同文档</p>
                <p className="text-sm text-muted-foreground">
                  支持 .doc、.docx 格式
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* 附件上传 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>合同附件</CardTitle>
              <CardDescription>
                上传合同相关的附件文件（可选）
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => attachmentInputRef.current?.click()}
            >
              <Plus className="h-4 w-4 mr-1" />
              添加附件
            </Button>
            <input
              ref={attachmentInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
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
              <p className="text-xs mt-1">支持 PDF、Word、图片格式</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getFileTypeIcon(att.type)}
                    <div>
                      <p className="font-medium text-sm">{att.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(att.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(att.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 解析进度 */}
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
      
      {/* 解析结果预览 */}
      {parseResult && (
        <Card>
          <CardContent className="pt-6">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                解析完成
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">识别字段：</span>
                  <Badge variant="outline">{parseResult.detectedFields.length} 个</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">上传附件：</span>
                  <Badge variant="outline">{uploadedAttachments.length} 个</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">文档字数：</span>
                  <Badge variant="outline">{parseResult.fullText.length} 字</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 提示信息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-medium text-blue-800 mb-2">使用提示</h5>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 文档中使用 <code className="bg-blue-100 px-1 rounded">____</code> 下划线标记的位置将被识别为可填充字段</li>
          <li>• 例如：<code className="bg-blue-100 px-1 rounded">企业名称：______</code> 会自动识别为"企业名称"字段</li>
          <li>• 附件支持 PDF、Word、图片格式，可上传多个</li>
        </ul>
      </div>
    </div>
  );
  
  // 步骤2: 基本信息
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
            <div className="space-y-2 flex items-end">
              <div className="flex items-center gap-2">
                <Switch checked={isDefault} onCheckedChange={setIsDefault} />
                <Label className="font-normal">设为默认模板</Label>
              </div>
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
        </CardContent>
      </Card>
    </div>
  );
  
  // 步骤3: 字段设置
  const renderFieldsStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>可填充字段设置</CardTitle>
              <CardDescription>
                设置合同中需要动态填充的字段
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
  
  // 步骤4: 完成
  const renderCompleteStep = () => {
    const selectedBase = bases.find(b => b.id === baseId);
    
    return (
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
                <Label className="text-muted-foreground">所属基地</Label>
                <p className="font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {selectedBase?.name || "未选择"}
                </p>
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
                <Label className="text-muted-foreground">可填充字段</Label>
                <p className="font-medium">{fields.length} 个</p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">合同附件</Label>
                <p className="font-medium">{uploadedAttachments.length} 个</p>
              </div>
            </div>
          
          {uploadedAttachments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-muted-foreground">附件列表</Label>
                <div className="flex flex-wrap gap-2">
                  {uploadedAttachments.map((att, idx) => (
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
          {currentStep === 4 ? (
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
