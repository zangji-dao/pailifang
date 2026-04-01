"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Save,
  ArrowLeft,
  Loader2,
  Upload,
  FileText,
  SaveAll,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Building2,
  Plus,
  MousePointer,
  GripVertical,
  Type,
  Minus,
  RotateCcw,
  Bold,
  Italic,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  IndentIncrease,
  IndentDecrease,
  Printer,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Table,
  Trash2,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ParseResult } from "@/types/contract-template";
import type { TemplateVariable, VariableType, VariableCategory } from "@/types/template-variable";
import { PresetVariables, VariableTypeLabels, VariableCategoryLabels, computeVariableValue } from "@/types/template-variable";

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

// 已上传的附件类型
interface UploadedAttachment {
  id: string;
  name: string;
  url: string;
  fileType: string;
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
  const searchParams = useSearchParams();
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // 当前步骤
  const [currentStep, setCurrentStep] = useState(1);
  
  // 加载草稿状态
  const [loadingDraft, setLoadingDraft] = useState(false);
  
  // 步骤1: 上传文档
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [templateId, setTemplateId] = useState<string>("");
  
  // 解析结果
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  
  // 已上传的附件
  const [uploadedAttachments, setUploadedAttachments] = useState<UploadedAttachment[]>([]);
  const uploadedAttachmentsRef = useRef<UploadedAttachment[]>([]);
  
  // 同步 uploadedAttachments 到 ref
  useEffect(() => {
    uploadedAttachmentsRef.current = uploadedAttachments;
  }, [uploadedAttachments]);
  
  // 基地列表
  const [bases, setBases] = useState<Base[]>([]);
  const [loadingBases, setLoadingBases] = useState(false);
  
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
  const [savingDraft, setSavingDraft] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  
  // 缩放比例
  const [zoom, setZoom] = useState(100);
  
  // 当前选中的文档标签（主文档为 'main'，附件为附件id）
  const [activeDocumentId, setActiveDocumentId] = useState<string>('main');
  
  // 拖拽状态
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  
  // 打印功能
  const handlePrint = useCallback(() => {
    window.print();
  }, []);
  
  // 优化排版状态
  const [optimizing, setOptimizing] = useState(false);
  
  // 缩放功能
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 10, 150));
  }, []);
  
  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 10, 50));
  }, []);
  
  const handleZoomReset = useCallback(() => {
    setZoom(100);
  }, []);
  
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
  
  // 加载草稿
  useEffect(() => {
    const loadDraft = async () => {
      const draftId = searchParams.get('draftId');
      if (!draftId) return;
      
      setLoadingDraft(true);
      try {
        const response = await fetch(`/api/contract-templates/draft?id=${draftId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          const draft = result.data;
          setTemplateId(draft.id);
          setIsDraft(true);
          setName(draft.name || '');
          setDescription(draft.description || '');
          setType(draft.type || 'tenant');
          setBaseId(draft.base_id || '');
          
          // 恢复草稿数据
          if (draft.draft_data) {
            const draftData = draft.draft_data;
            setCurrentStep(draftData.currentStep || 1);
            setEditedHtml(draftData.editedHtml || '');
            
            // 恢复标记
            if (draftData.markers && Array.isArray(draftData.markers)) {
              setMarkers(draftData.markers.map((m: any) => ({
                id: m.id,
                variableKey: m.variableKey,
                status: m.status,
                position: m.position,
              })));
            }
            
            // 恢复选中的变量
            if (draftData.selectedVariables && Array.isArray(draftData.selectedVariables)) {
              setSelectedVariables(draftData.selectedVariables.map((v: any) => ({
                key: v.key,
                name: v.name,
                type: v.type || 'text',
                category: v.category || 'custom',
                placeholder: v.placeholder,
              })));
            }
            
            // 恢复解析结果
            if (draft.source_file_url) {
              // 如果有上传的附件但没有解析后的附件数据，需要重新解析
              const hasUploadedAttachments = draftData.uploadedAttachments && draftData.uploadedAttachments.length > 0;
              const hasParsedAttachments = draftData.attachments && draftData.attachments.length > 0;
              
              if (hasUploadedAttachments && !hasParsedAttachments) {
                // 需要重新解析附件
                try {
                  const parseRes = await fetch("/api/contract-templates/parse", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      templateId: draft.id,
                      fileUrl: draft.source_file_url,
                      fileName: draft.source_file_name,
                      fileType: draft.source_file_type,
                      attachments: draftData.uploadedAttachments.map((att: any) => ({
                        id: att.id,
                        name: att.name,
                        url: att.url,
                        fileType: att.fileType,
                      })),
                    }),
                  });
                  
                  const parseData = await parseRes.json();
                  
                  if (parseData.success && parseData.data) {
                    setParseResult(parseData.data);
                    // 更新草稿数据
                    draftData.attachments = parseData.data.attachments;
                    draftData.styles = parseData.data.styles;
                  } else {
                    // 解析失败，设置空的解析结果
                    setParseResult({
                      success: true,
                      totalPages: 1,
                      fileName: draft.source_file_name || '草稿文档',
                      fileType: draft.source_file_type || 'docx',
                      fileUrl: draft.source_file_url,
                      pages: [],
                      fullText: '',
                      html: draftData.editedHtml || '',
                      styles: draftData.styles || '',
                      attachments: [],
                      detectedAttachments: [],
                      detectedFields: [],
                      mainContract: { startPage: 1, endPage: 1, pageRange: '1', content: '' },
                    });
                  }
                } catch (parseError) {
                  console.error('[草稿恢复] 重新解析附件失败:', parseError);
                  // 解析失败，设置空的解析结果
                  setParseResult({
                    success: true,
                    totalPages: 1,
                    fileName: draft.source_file_name || '草稿文档',
                    fileType: draft.source_file_type || 'docx',
                    fileUrl: draft.source_file_url,
                    pages: [],
                    fullText: '',
                    html: draftData.editedHtml || '',
                    styles: draftData.styles || '',
                    attachments: [],
                    detectedAttachments: [],
                    detectedFields: [],
                    mainContract: { startPage: 1, endPage: 1, pageRange: '1', content: '' },
                  });
                }
              } else {
                // 使用已有的解析结果
                setParseResult({
                  success: true,
                  totalPages: 1,
                  fileName: draft.source_file_name || '草稿文档',
                  fileType: draft.source_file_type || 'docx',
                  fileUrl: draft.source_file_url,
                  pages: [],
                  fullText: '',
                  html: draftData.editedHtml || '',
                  styles: draftData.styles || '',
                  attachments: draftData.attachments || [],
                  detectedAttachments: [],
                  detectedFields: [],
                  mainContract: { startPage: 1, endPage: 1, pageRange: '1', content: '' },
                });
              }
            }
            
            // 恢复已上传的附件
            if (draftData.uploadedAttachments && Array.isArray(draftData.uploadedAttachments)) {
              setUploadedAttachments(draftData.uploadedAttachments);
              // 同步更新 ref
              uploadedAttachmentsRef.current = draftData.uploadedAttachments;
              // 同时恢复本地附件列表（用于显示）
              setAttachments(draftData.uploadedAttachments.map((a: any) => ({
                id: a.id,
                name: a.name,
                type: a.fileType,
                size: a.size || 0,
                file: null as any, // 文件对象无法恢复，但URL已保存
              })));
            }
          }
          
          toast.success("草稿已加载");
        }
      } catch (error) {
        console.error("加载草稿失败:", error);
        toast.error("加载草稿失败");
      } finally {
        setLoadingDraft(false);
      }
    };
    
    loadDraft();
  }, [searchParams]);
  
  // ========== 步骤1: 上传文档 ==========
  
  const handleMainFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      // 自动上传文件（但不解析）
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        
        const uploadRes = await fetch("/api/contract-templates/upload", {
          method: "POST",
          body: formData,
        });
        
        const uploadData = await uploadRes.json();
        if (!uploadData.success) {
          throw new Error(uploadData.error || "上传失败");
        }
        
        // 保存上传结果，但不解析
        setParseResult({
          success: true,
          totalPages: 1,
          fileName: uploadData.data.fileName,
          fileType: uploadData.data.fileType,
          fileUrl: uploadData.data.fileUrl,
          pages: [],
          fullText: '',
          html: '',
          styles: '',
          attachments: [],
          detectedAttachments: [],
          detectedFields: [],
          mainContract: { startPage: 1, endPage: 1, pageRange: '1', content: '' },
        });
        
        setTemplateId(uploadData.data.templateId);
        toast.success("文件已上传，点击「下一步」解析文档");
      } catch (err) {
        console.error("上传失败:", err);
        toast.error(err instanceof Error ? err.message : "上传失败");
      } finally {
        setUploading(false);
      }
    }
  };
  
  const handleAttachmentsSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      // 自动上传附件到服务器（逐个上传）
      setUploading(true);
      const uploadedList: UploadedAttachment[] = [];
      const failedFiles: string[] = [];
      
      for (const validFile of validFiles) {
        try {
          const formData = new FormData();
          formData.append("file", validFile.file);
          
          const uploadRes = await fetch("/api/contract-templates/upload-attachment", {
            method: "POST",
            body: formData,
          });
          
          const uploadData = await uploadRes.json();
          if (!uploadData.success) {
            throw new Error(uploadData.error || "上传附件失败");
          }
          
          uploadedList.push(uploadData.data);
        } catch (err) {
          console.error(`上传附件 ${validFile.name} 失败:`, err);
          failedFiles.push(validFile.name);
          // 从列表中移除上传失败的文件
          setAttachments(prev => prev.filter(a => a.id !== validFile.id));
        }
      }
      
      // 添加成功上传的附件到列表，同时更新 ref
      if (uploadedList.length > 0) {
        setUploadedAttachments(prev => [...prev, ...uploadedList]);
        // 直接更新 ref，避免等待 useEffect 同步
        uploadedAttachmentsRef.current = [...uploadedAttachmentsRef.current, ...uploadedList];
        toast.success(`已上传 ${uploadedList.length} 个附件`);
      }
      
      if (failedFiles.length > 0) {
        toast.error(`${failedFiles.join("、")} 上传失败`);
      }
      
      setUploading(false);
    }
    
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }
  };
  
  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
    // 同时从已上传列表中删除
    setUploadedAttachments(prev => prev.filter(a => a.id !== id));
  };
  
  // 拖拽排序
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };
  
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedId && draggedId !== id) {
      setDragOverId(id);
    }
  };
  
  const handleDragLeave = () => {
    setDragOverId(null);
  };
  
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }
    
    setAttachments(prev => {
      const draggedIndex = prev.findIndex(a => a.id === draggedId);
      const targetIndex = prev.findIndex(a => a.id === targetId);
      
      if (draggedIndex === -1 || targetIndex === -1) return prev;
      
      const newAttachments = [...prev];
      const [draggedItem] = newAttachments.splice(draggedIndex, 1);
      newAttachments.splice(targetIndex, 0, draggedItem);
      
      // 同步更新 uploadedAttachments 的顺序
      setUploadedAttachments(prevUploaded => {
        // 根据 newAttachments 的顺序重新排列
        const newUploaded = newAttachments
          .map(att => prevUploaded.find(u => u.id === att.id))
          .filter((u): u is UploadedAttachment => u !== undefined);
        // 同步更新 ref
        uploadedAttachmentsRef.current = newUploaded;
        return newUploaded;
      });
      
      return newAttachments;
    });
    
    setDraggedId(null);
  };
  
  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };
  
  const handleUploadAndParse = async () => {
    // 检查是否已有文件URL（已上传过）
    if (!parseResult?.fileUrl && !mainFile) {
      toast.error("请先上传文档");
      return;
    }
    
    setParsing(true);
    try {
      let fileUrl = parseResult?.fileUrl;
      let fileName = parseResult?.fileName;
      let fileType = parseResult?.fileType;
      let templateIdToUse = templateId;
      
      // 检查是否有未上传的附件（file 不为 null）
      const pendingAttachments = attachments.filter(att => att.file !== null);
      const newlyUploaded: UploadedAttachment[] = [];
      
      // 如果有未上传的附件需要上传
      if (pendingAttachments.length > 0) {
        setUploading(true);
        
        // 逐个上传未上传的附件
        for (const att of pendingAttachments) {
          if (!att.file) continue;
          
          try {
            const formData = new FormData();
            formData.append("file", att.file);
            
            const uploadRes = await fetch("/api/contract-templates/upload-attachment", {
              method: "POST",
              body: formData,
            });
            
            const uploadData = await uploadRes.json();
            if (uploadData.success) {
              newlyUploaded.push(uploadData.data);
            }
          } catch (err) {
            console.error(`上传附件 ${att.name} 失败:`, err);
          }
        }
        
        // 合并新上传的附件
        if (newlyUploaded.length > 0) {
          setUploadedAttachments(prev => [...prev, ...newlyUploaded]);
        }
        
        setUploading(false);
      }
      
      // 执行解析 - 使用 ref 获取最新值，合并新上传的附件
      const allAttachments = [...uploadedAttachmentsRef.current, ...newlyUploaded];
      
      const parseRes = await fetch("/api/contract-templates/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: templateIdToUse,
          fileUrl,
          fileName,
          fileType,
          attachments: allAttachments.map(att => ({
            id: att.id,
            name: att.name,
            url: att.url,
            fileType: att.fileType,
          })),
        }),
      });
      
      const parseData = await parseRes.json();
      
      if (!parseData.success) {
        throw new Error(parseData.error || "解析失败");
      }
      
      setParseResult(parseData.data);
      
      if (!name && fileName) {
        setName(fileName.replace(/\.[^/.]+$/, ""));
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
  
  // 文档编辑状态：始终可编辑
  const [editedHtml, setEditedHtml] = useState<string>(""); // 编辑后的HTML
  
  // 标记类型：基于用户点击位置
  interface Marker {
    id: string;
    status: 'pending' | 'bound';
    variableKey?: string;
    // 位置信息：用于在文档中定位
    position: {
      beforeText: string;   // 标记前面的文字（用于定位）
      afterText: string;    // 标记后面的文字（用于定位）
      textOffset: number;   // 在原文中的偏移量
      // 额外的定位信息，用于处理锚点文本不唯一的情况
      clickContext?: {
        parentTagName: string;
        parentClass: string;
        nearestId: string;
        party?: string; // '甲方' 或 '乙方'
      };
    };
    displayText?: string;   // 显示的文字（如"待绑定"或变量名）
  }
  
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [showVariablePicker, setShowVariablePicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<VariableCategory | 'all'>('all');
  
  // 已选变量（用于保存）
  const [selectedVariables, setSelectedVariables] = useState<TemplateVariable[]>([]);
  
  // 兼容旧数据结构的 bindings（用于保存到后端）
  const bindings = useMemo(() => {
    return markers
      .filter(m => m.status === 'bound' && m.variableKey)
      .map(m => ({
        id: m.id,
        variableKey: m.variableKey!,
        position: m.position,
      }));
  }, [markers]);
  
  // 草稿保存功能
  const handleSaveDraft = useCallback(async (silent = false) => {
    // 静默模式下，如果没有必要的数据，直接返回不报错
    if (silent && !mainFile && !templateId && !name.trim()) {
      return;
    }
    
    // 非静默模式下，需要检查必要数据
    if (!silent && !mainFile && !templateId && !name.trim()) {
      toast.error("请至少填写模板名称或上传文档");
      return;
    }
    
    // 如果没有任何需要保存的内容，直接返回
    if (!mainFile && !templateId && !name.trim() && !editedHtml) {
      return;
    }
    
    setSavingDraft(true);
    try {
      const draftData = {
        id: templateId || undefined,
        name,
        description,
        type,
        base_id: baseId || null,
        currentStep,
        editedHtml: editedHtml || undefined,
        markers: markers.map(m => ({
          id: m.id,
          variableKey: m.variableKey,
          status: m.status,
          position: m.position,
        })),
        selectedVariables: selectedVariables.map(v => ({
          key: v.key,
          name: v.name,
          type: v.type,
          category: v.category,
          placeholder: v.placeholder,
        })),
        bindings,
        source_file_url: parseResult?.fileUrl,
        source_file_name: parseResult?.fileName,
        source_file_type: parseResult?.fileType,
        styles: parseResult?.styles, // 保存样式
        // 保存已解析的附件
        attachments: parseResult?.attachments?.map(a => ({
          id: a.id,
          name: a.name,
          url: a.url,
          html: a.html,
        })),
        // 保存已上传但未解析的附件
        uploadedAttachments: uploadedAttachments.map(a => ({
          id: a.id,
          name: a.name,
          url: a.url,
          fileType: a.fileType,
          size: a.size,
        })),
      };
      
      const response = await fetch("/api/contract-templates/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTemplateId(result.data.id);
        setIsDraft(true);
        if (!silent) {
          toast.success("草稿已保存");
        }
      } else {
        throw new Error(result.error || "保存草稿失败");
      }
    } catch (error) {
      console.error("保存草稿失败:", error);
      if (!silent) {
        toast.error(error instanceof Error ? error.message : "保存草稿失败");
      }
    } finally {
      setSavingDraft(false);
    }
  }, [templateId, mainFile, name, description, type, baseId, currentStep, editedHtml, markers, selectedVariables, bindings, parseResult, uploadedAttachments]);
  
  // 过滤变量（包含预设变量和自定义变量）
  const filteredVariables = useMemo(() => {
    // 合并预设变量和自定义变量（自定义变量放前面）
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
  }, [activeCategory, searchTerm, selectedVariables]);
  
  // 检查变量是否已绑定
  const isVariableBound = (key: string) => {
    return markers.some(m => m.status === 'bound' && m.variableKey === key);
  };
  
  // 同步编辑后的HTML
  const syncEditedContent = useCallback(() => {
    if (contentRef.current) {
      setEditedHtml(contentRef.current.innerHTML);
    }
  }, []);
  
  // 重置文档到原始状态
  const handleResetDocument = () => {
    setEditedHtml("");
    setMarkers([]);
    toast.success("文档已重置为原始内容");
  };
  
  // 编辑功能：给选中文字添加下划线
  const handleAddUnderline = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      toast.info("请先选中要添加下划线的文字");
      return;
    }
    
    // 使用 execCommand 添加下划线
    document.execCommand('underline', false);
    syncEditedContent();
    toast.success("已添加下划线");
  }, [syncEditedContent]);
  
  // 编辑功能：移除下划线
  const handleRemoveUnderline = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      toast.info("请先选中要移除下划线的文字");
      return;
    }
    
    // 使用 execCommand 移除下划线
    document.execCommand('removeFormat', false);
    syncEditedContent();
    toast.success("已移除格式");
  }, [syncEditedContent]);
  
  // 编辑功能：加粗
  const handleBold = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      toast.info("请先选中要加粗的文字");
      return;
    }
    document.execCommand('bold', false);
    syncEditedContent();
    toast.success("已加粗");
  }, [syncEditedContent]);
  
  // 编辑功能：斜体
  const handleItalic = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      toast.info("请先选中要斜体的文字");
      return;
    }
    document.execCommand('italic', false);
    syncEditedContent();
    toast.success("已设置斜体");
  }, [syncEditedContent]);
  
  // 编辑功能：删除线
  const handleStrikethrough = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      toast.info("请先选中要添加删除线的文字");
      return;
    }
    document.execCommand('strikeThrough', false);
    syncEditedContent();
    toast.success("已添加删除线");
  }, [syncEditedContent]);
  
  // 编辑功能：文本对齐
  const handleAlign = useCallback((alignment: 'left' | 'center' | 'right' | 'justify') => {
    const command = {
      left: 'justifyLeft',
      center: 'justifyCenter',
      right: 'justifyRight',
      justify: 'justifyFull',
    }[alignment];
    document.execCommand(command, false);
    syncEditedContent();
    toast.success(`已${alignment === 'left' ? '左对齐' : alignment === 'center' ? '居中对齐' : alignment === 'right' ? '右对齐' : '两端对齐'}`);
  }, [syncEditedContent]);
  
  // 编辑功能：缩进
  const handleIndent = useCallback((increase: boolean) => {
    document.execCommand(increase ? 'indent' : 'outdent', false);
    syncEditedContent();
    toast.success(increase ? "已增加缩进" : "已减少缩进");
  }, [syncEditedContent]);
  
  // 编辑功能：列表
  const handleList = useCallback((ordered: boolean) => {
    document.execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList', false);
    syncEditedContent();
    toast.success(ordered ? "已插入有序列表" : "已插入无序列表");
  }, [syncEditedContent]);
  
  // 编辑功能：字体大小
  const handleFontSize = useCallback((size: string) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      toast.info("请先选中要调整的文字");
      return;
    }
    // fontSize command accepts 1-7 (7 is largest)
    const sizeMap: Record<string, string> = {
      '12px': '1',
      '14px': '2',
      '16px': '3',
      '18px': '4',
      '24px': '5',
      '32px': '6',
      '48px': '7',
    };
    document.execCommand('fontSize', false, sizeMap[size] || '3');
    syncEditedContent();
    toast.success(`字体大小已调整为 ${size}`);
  }, [syncEditedContent]);
  
  // 编辑功能：插入表格
  const [tableRows, setTableRows] = useState(2);
  const [tableCols, setTableCols] = useState(2);
  const [showTablePopover, setShowTablePopover] = useState(false);
  
  const handleInsertTable = useCallback((rows: number, cols: number) => {
    // 生成表格 HTML
    let tableHtml = '<table style="border-collapse: collapse; width: 100%; margin: 8pt 0; border: 1px solid #000;">';
    for (let i = 0; i < rows; i++) {
      tableHtml += '<tr>';
      for (let j = 0; j < cols; j++) {
        tableHtml += '<td style="border: 1px solid #000; padding: 4pt 6pt; vertical-align: top; width: ' + (100 / cols) + '%;">&nbsp;</td>';
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</table>';
    
    // 使用 insertHTML 命令插入表格
    document.execCommand('insertHTML', false, tableHtml);
    syncEditedContent();
    setShowTablePopover(false);
    toast.success(`已插入 ${rows} 行 ${cols} 列的表格`);
  }, [syncEditedContent]);
  
  // 获取当前光标所在的表格单元格
  const getCurrentTableCell = useCallback((): { cell: HTMLTableCellElement; row: HTMLTableRowElement; table: HTMLTableElement } | null => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;
    
    let node = selection.anchorNode;
    while (node && node !== contentRef.current) {
      if (node instanceof HTMLTableCellElement) {
        const cell = node;
        const row = cell.closest('tr');
        const table = cell.closest('table');
        if (row && table) {
          return { cell, row, table };
        }
      }
      node = node.parentNode;
    }
    return null;
  }, []);
  
  // 删除当前行
  const handleDeleteRow = useCallback(() => {
    const cellInfo = getCurrentTableCell();
    if (!cellInfo) {
      toast.error('请先在表格中选择要删除的行');
      return;
    }
    
    const { row, table } = cellInfo;
    const rows = table.querySelectorAll('tr');
    
    if (rows.length <= 1) {
      // 如果只有一行，删除整个表格
      table.remove();
      toast.success('已删除表格');
    } else {
      row.remove();
      toast.success('已删除当前行');
    }
    
    syncEditedContent();
  }, [getCurrentTableCell, syncEditedContent]);
  
  // 删除当前列
  const handleDeleteColumn = useCallback(() => {
    const cellInfo = getCurrentTableCell();
    if (!cellInfo) {
      toast.error('请先在表格中选择要删除的列');
      return;
    }
    
    const { cell, table } = cellInfo;
    const cellIndex = cell.cellIndex;
    const rows = table.querySelectorAll('tr');
    
    // 检查是否只有一列
    const firstRow = rows[0];
    if (firstRow && firstRow.querySelectorAll('td, th').length <= 1) {
      // 如果只有一列，删除整个表格
      table.remove();
      toast.success('已删除表格');
    } else {
      rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        if (cells[cellIndex]) {
          cells[cellIndex].remove();
        }
      });
      toast.success('已删除当前列');
    }
    
    syncEditedContent();
  }, [getCurrentTableCell, syncEditedContent]);
  
  // 在当前行上方插入行
  const handleInsertRowAbove = useCallback(() => {
    const cellInfo = getCurrentTableCell();
    if (!cellInfo) {
      toast.error('请先在表格中选择位置');
      return;
    }
    
    const { row, table } = cellInfo;
    const colCount = row.querySelectorAll('td, th').length;
    
    const newRow = document.createElement('tr');
    for (let i = 0; i < colCount; i++) {
      const newCell = document.createElement('td');
      newCell.style.cssText = 'border: 1px solid #000; padding: 4pt 6pt; vertical-align: top;';
      newCell.innerHTML = '&nbsp;';
      newRow.appendChild(newCell);
    }
    
    row.parentNode?.insertBefore(newRow, row);
    toast.success('已在当前行上方插入新行');
    syncEditedContent();
  }, [getCurrentTableCell, syncEditedContent]);
  
  // 在当前行下方插入行
  const handleInsertRowBelow = useCallback(() => {
    const cellInfo = getCurrentTableCell();
    if (!cellInfo) {
      toast.error('请先在表格中选择位置');
      return;
    }
    
    const { row, table } = cellInfo;
    const colCount = row.querySelectorAll('td, th').length;
    
    const newRow = document.createElement('tr');
    for (let i = 0; i < colCount; i++) {
      const newCell = document.createElement('td');
      newCell.style.cssText = 'border: 1px solid #000; padding: 4pt 6pt; vertical-align: top;';
      newCell.innerHTML = '&nbsp;';
      newRow.appendChild(newCell);
    }
    
    if (row.nextSibling) {
      row.parentNode?.insertBefore(newRow, row.nextSibling);
    } else {
      row.parentNode?.appendChild(newRow);
    }
    
    toast.success('已在当前行下方插入新行');
    syncEditedContent();
  }, [getCurrentTableCell, syncEditedContent]);
  
  // 删除整个表格
  const handleDeleteTable = useCallback(() => {
    const cellInfo = getCurrentTableCell();
    if (!cellInfo) {
      toast.error('请先在表格中选择要删除的表格');
      return;
    }
    
    const { table } = cellInfo;
    table.remove();
    toast.success('已删除表格');
    syncEditedContent();
  }, [getCurrentTableCell, syncEditedContent]);
  
  // 处理文档点击 - 处理点击变量标记
  const handleContentClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // 如果点击的是标记，打开变量选择器
    if (target.classList.contains('variable-marker')) {
      const markerId = target.dataset.markerId;
      if (markerId) {
        setActiveMarkerId(markerId);
        setShowVariablePicker(true);
      }
    }
  }, []);
  
  // 辅助函数：查找最近的有ID的父元素
  const findNearestId = (element: HTMLElement | null): string => {
    let current = element;
    let depth = 0;
    const maxDepth = 10;
    
    while (current && depth < maxDepth) {
      if (current.id) {
        return current.id;
      }
      // 也检查特定的class，如甲方、乙方区域
      if (current.className && (
        current.className.includes('甲方') || 
        current.className.includes('乙方') ||
        current.className.includes('party-a') ||
        current.className.includes('party-b')
      )) {
        return current.className;
      }
      current = current.parentElement;
      depth++;
    }
    return '';
  };
  
  // 为标记绑定变量
  const handleBindVariable = (variable: TemplateVariable) => {
    if (!activeMarkerId) return;
    
    setMarkers(prev => prev.map(m => 
      m.id === activeMarkerId 
        ? { ...m, status: 'bound', variableKey: variable.key }
        : m
    ));
    
    // 添加到已选变量
    if (!selectedVariables.find(v => v.key === variable.key)) {
      setSelectedVariables(prev => [...prev, variable]);
    }
    
    // 更新 DOM 中标记的显示
    const markerEl = contentRef.current?.querySelector(`[data-marker-id="${activeMarkerId}"]`) as HTMLElement;
    if (markerEl) {
      markerEl.className = 'variable-marker bound';
      markerEl.style.cssText = 'background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; border: 2px solid #22c55e; font-weight: 500; display: inline-block; margin: 0 2px;';
      markerEl.textContent = `{{${variable.name}}}`;
      syncEditedContent();
    }
    
    setShowVariablePicker(false);
    setActiveMarkerId(null);
    toast.success(`已绑定: ${variable.name}`);
  };
  
  // 删除标记
  const handleRemoveMarker = (markerId: string) => {
    // 从 DOM 中删除标记元素
    const markerEl = contentRef.current?.querySelector(`[data-marker-id="${markerId}"]`);
    if (markerEl) {
      markerEl.remove();
      syncEditedContent();
    }
    
    setMarkers(prev => prev.filter(m => m.id !== markerId));
    toast.success("已删除标记");
  };
  
  // 更换变量（重新绑定）
  const handleChangeVariable = (markerId: string) => {
    setActiveMarkerId(markerId);
    setShowVariablePicker(true);
  };
  
  // 添加自定义变量
  const handleAddCustomVariable = () => {
    if (!newVariable.name || !newVariable.key) {
      toast.error('请填写变量名称和标识');
      return;
    }
    
    // 验证 key 格式：只允许英文、数字、下划线
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newVariable.key)) {
      toast.error('变量标识只能包含英文、数字、下划线，且不能以数字开头');
      return;
    }
    
    // 检查 key 是否已存在
    const existingKeys = [...selectedVariables, ...PresetVariables].map(v => v.key);
    if (existingKeys.includes(newVariable.key)) {
      toast.error(`变量标识 "${newVariable.key}" 已存在，请使用其他标识`);
      return;
    }
    
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
    
    // 如果有活动的标记，直接绑定
    if (activeMarkerId) {
      setMarkers(prev => prev.map(m => 
        m.id === activeMarkerId 
          ? { ...m, status: 'bound', variableKey: customVar.key }
          : m
      ));
      
      // 更新 DOM 中标记的显示
      const markerEl = contentRef.current?.querySelector(`[data-marker-id="${activeMarkerId}"]`) as HTMLElement;
      if (markerEl) {
        markerEl.className = 'variable-marker bound';
        markerEl.style.cssText = 'background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; border: 2px solid #22c55e; font-weight: 500; display: inline-block; margin: 0 2px;';
        markerEl.textContent = `{{${customVar.name}}}`;
        syncEditedContent();
      }
      
      setShowVariablePicker(false);
      setActiveMarkerId(null);
      toast.success(`已绑定: ${customVar.name}`);
    } else {
      toast.success(`已添加自定义变量: ${customVar.name}`);
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
  
  // 获取当前文档的基础HTML（根据选中的标签）
  const currentDocumentHtml = useMemo(() => {
    if (activeDocumentId === 'main') {
      return parseResult?.html || '';
    }
    // 查找对应的附件
    const attachment = parseResult?.attachments?.find(a => a.id === activeDocumentId);
    return attachment?.html || '';
  }, [activeDocumentId, parseResult]);
  
  // 生成处理后的HTML - 在用户点击位置渲染标记（仅主文档）
  const processedHtml = useMemo(() => {
    // 非主文档直接返回原HTML
    if (activeDocumentId !== 'main') {
      return currentDocumentHtml;
    }
    
    // 主文档：优先使用编辑后的HTML，否则使用原始HTML
    const baseHtml = editedHtml || currentDocumentHtml;
    if (!baseHtml) return '';
    
    let result = baseHtml;
    
    // 清理所有现有的标记元素，避免重复
    result = result.replace(/<span class="variable-marker[^"]*"[^>]*>.*?<\/span>/g, '');
    
    // 辅助函数：查找最佳匹配位置
    const findBestMatchPosition = (html: string, anchorText: string, context?: Marker['position']['clickContext']): number => {
      // 如果锚点文本为空，返回-1
      if (!anchorText) return -1;
      
      // 查找所有匹配位置
      const positions: number[] = [];
      let searchPos = 0;
      while (true) {
        const pos = html.indexOf(anchorText, searchPos);
        if (pos === -1) break;
        positions.push(pos);
        searchPos = pos + 1;
      }
      
      // 如果只有一个匹配，直接返回
      if (positions.length === 1) return positions[0];
      
      // 如果没有匹配，返回-1
      if (positions.length === 0) return -1;
      
      // 多个匹配时，根据上下文选择最佳位置
      
      // 策略1：优先使用party字段（甲方/乙方）来确定位置
      if (context?.party) {
        const partyKeyword = context.party; // '甲方' 或 '乙方'
        
        // 找到HTML中所有甲方/乙方的位置
        const partyPositions: { party: string; index: number }[] = [];
        let partySearchPos = 0;
        
        while (true) {
          const partyAIdx = html.indexOf('甲方', partySearchPos);
          const partyBIdx = html.indexOf('乙方', partySearchPos);
          
          if (partyAIdx === -1 && partyBIdx === -1) break;
          
          if (partyAIdx !== -1 && (partyBIdx === -1 || partyAIdx < partyBIdx)) {
            partyPositions.push({ party: '甲方', index: partyAIdx });
            partySearchPos = partyAIdx + 2;
          } else if (partyBIdx !== -1) {
            partyPositions.push({ party: '乙方', index: partyBIdx });
            partySearchPos = partyBIdx + 2;
          }
        }
        
        // 对于每个锚点匹配位置，找到最近的甲方/乙方关键词
        for (const pos of positions) {
          // 获取该位置之前最近的甲方/乙方
          let nearestParty = '';
          let nearestPartyDistance = Infinity;
          
          for (const pp of partyPositions) {
            if (pp.index < pos) {
              const distance = pos - pp.index;
              if (distance < nearestPartyDistance) {
                nearestPartyDistance = distance;
                nearestParty = pp.party;
              }
            }
          }
          
          // 如果最近的party匹配用户点击的位置
          if (nearestParty === partyKeyword) {
            return pos;
          }
        }
      }
      
      // 策略2：使用nearestId特征匹配
      if (context?.nearestId) {
        for (const pos of positions) {
          const extendedContext = html.substring(Math.max(0, pos - 500), Math.min(html.length, pos + anchorText.length + 500));
          if (extendedContext.includes(context.nearestId)) {
            return pos;
          }
        }
      }
      
      // 策略3：检查锚点文本本身是否包含"甲方"或"乙方"
      for (const pos of positions) {
        const beforeContext = html.substring(Math.max(0, pos - 300), pos + anchorText.length);
        if (anchorText.includes('甲方') && beforeContext.includes('甲方')) {
          return pos;
        }
        if (anchorText.includes('乙方') && beforeContext.includes('乙方')) {
          return pos;
        }
      }
      
      // 默认返回第一个匹配位置
      return positions[0];
    };
    
    // 为每个标记在对应位置渲染
    // 按照创建时间排序（后创建的先渲染，避免位置偏移）
    const sortedMarkers = [...markers].sort((a, b) => {
      // 按ID中的时间戳倒序排列（后创建的先处理）
      return b.id.localeCompare(a.id);
    });
    
    sortedMarkers.forEach((marker) => {
      const variable = marker.variableKey 
        ? [...selectedVariables, ...PresetVariables].find(v => v.key === marker.variableKey)
        : null;
      
      const { beforeText, textOffset, clickContext } = marker.position;
      
      // 使用改进的查找函数找到最佳匹配位置
      const anchorPos = findBestMatchPosition(result, beforeText, clickContext);
      
      if (anchorPos !== -1) {
        // 计算实际插入位置
        const insertPos = anchorPos + textOffset;
        
        let markerHtml: string;
        if (marker.status === 'bound' && variable) {
          // 已绑定标记 - 绿色实线
          markerHtml = `<span class="variable-marker bound" data-marker-id="${marker.id}" data-variable-key="${marker.variableKey}" style="background: rgba(34, 197, 94, 0.2); color: #16a34a; padding: 2px 8px; border-radius: 4px; cursor: pointer; border: 1px solid #22c55e; font-weight: 500;">{{${variable.name}}}</span>`;
        } else {
          // 待绑定标记 - 橙色虚线
          markerHtml = `<span class="variable-marker pending" data-marker-id="${marker.id}" style="background: rgba(251, 191, 36, 0.3); color: #d97706; padding: 2px 10px; border-radius: 4px; cursor: pointer; border: 1px dashed #f59e0b; font-weight: 500; font-size: 12px;">待绑定</span>`;
        }
        
        result = result.slice(0, insertPos) + markerHtml + result.slice(insertPos);
      }
    });
    
    return result;
  }, [activeDocumentId, currentDocumentHtml, editedHtml, markers, selectedVariables]);
  
  // 优化排版功能
  const handleOptimizeLayout = useCallback(async () => {
    if (!processedHtml) {
      toast.error("没有可优化的内容");
      return;
    }
    
    setOptimizing(true);
    try {
      const response = await fetch("/api/contract-templates/optimize-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: processedHtml,
          variables: markers.map(m => ({
            key: m.variableKey,
            name: m.variableKey || '未绑定'
          }))
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEditedHtml(data.data.html);
        toast.success("排版优化完成");
      } else {
        throw new Error(data.error || "优化失败");
      }
    } catch (error) {
      console.error("优化排版失败:", error);
      toast.error(error instanceof Error ? error.message : "优化排版失败");
    } finally {
      setOptimizing(false);
    }
  }, [processedHtml, markers]);
  
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
      // 1. 更新基本信息并设置为已发布状态
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
          status: 'published', // 发布时设置为已发布状态
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
              (mainFile || parseResult?.fileUrl) 
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
            ) : parseResult?.fileUrl ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div className="text-left">
                  <p className="font-medium">{parseResult.fileName}</p>
                  <p className="text-sm text-muted-foreground">已上传 · 点击可重新选择</p>
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
                  {/* 拖拽手柄 */}
                  <div className="text-muted-foreground hover:text-foreground transition-colors">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  
                  {/* 序号 */}
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
                    {index + 1}
                  </div>
                  
                  {/* 文件信息 */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{att.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(att.size)}</p>
                    </div>
                  </div>
                  
                  {/* 删除按钮 */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); removeAttachment(att.id); }} 
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
  
  // 步骤2: 变量绑定（简化为单一编辑模式）
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
    
    const pendingCount = markers.filter(m => m.status === 'pending').length;
    const boundCount = markers.filter(m => m.status === 'bound').length;
    
    return (
      <div className="h-[calc(100vh-280px)] min-h-[500px] grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 左侧：合同预览 */}
        <Card className="lg:col-span-2 overflow-hidden flex flex-col">
          <CardHeader className="py-3 border-b shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">合同编辑</CardTitle>
              <div className="flex items-center gap-3">
                {/* 状态显示 */}
                {markers.length > 0 && (
                  <div className="flex items-center gap-2">
                    {pendingCount > 0 && (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        {pendingCount} 待绑定
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {boundCount} 已绑定
                    </Badge>
                  </div>
                )}
                
                {/* 重置按钮 */}
                {(editedHtml || markers.length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-muted-foreground"
                    onClick={handleResetDocument}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    重置
                  </Button>
                )}
              </div>
            </div>
            
            {/* 缩放和打印控制 */}
            <div className="flex items-center gap-2 pt-2 border-t mt-2">
              <span className="text-xs text-muted-foreground">缩放：</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                title="缩小"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-medium w-12 text-center">{zoom}%</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleZoomIn}
                disabled={zoom >= 150}
                title="放大"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleZoomReset}
              >
                重置
              </Button>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={handlePrint}
                title="打印文档"
              >
                <Printer className="h-3.5 w-3.5 mr-1" />
                打印
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={handleOptimizeLayout}
                disabled={optimizing || !processedHtml}
                title="使用AI优化文档排版"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                {optimizing ? "优化中..." : "优化排版"}
              </Button>
            </div>
            
            {/* 编辑工具栏 */}
            <div className="space-y-2 pt-2 border-t mt-2">
              {/* 格式化按钮组 */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs text-muted-foreground mr-2">格式：</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleBold}
                  title="加粗 (Ctrl+B)"
                >
                  <Bold className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleItalic}
                  title="斜体 (Ctrl+I)"
                >
                  <Italic className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleAddUnderline}
                  title="下划线 (Ctrl+U)"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
                    <line x1="4" y1="21" x2="20" y2="21" />
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleStrikethrough}
                  title="删除线"
                >
                  <Strikethrough className="h-3.5 w-3.5" />
                </Button>
                <div className="w-px h-5 bg-border mx-1" />
                <Select onValueChange={handleFontSize}>
                  <SelectTrigger className="h-7 w-20 text-xs">
                    <SelectValue placeholder="字号" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12px" className="text-xs">12px</SelectItem>
                    <SelectItem value="14px" className="text-sm">14px</SelectItem>
                    <SelectItem value="16px" className="text-base">16px</SelectItem>
                    <SelectItem value="18px" className="text-lg">18px</SelectItem>
                    <SelectItem value="24px" className="text-xl">24px</SelectItem>
                    <SelectItem value="32px" className="text-2xl">32px</SelectItem>
                  </SelectContent>
                </Select>
                </div>
                
                {/* 对齐和列表按钮组 */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs text-muted-foreground mr-2">段落：</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleAlign('left')}
                    title="左对齐"
                  >
                    <AlignLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleAlign('center')}
                    title="居中对齐"
                  >
                    <AlignCenter className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleAlign('right')}
                    title="右对齐"
                  >
                    <AlignRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleAlign('justify')}
                    title="两端对齐"
                  >
                    <AlignJustify className="h-3.5 w-3.5" />
                  </Button>
                  <div className="w-px h-5 bg-border mx-1" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleIndent(false)}
                    title="减少缩进"
                  >
                    <IndentDecrease className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleIndent(true)}
                    title="增加缩进"
                  >
                    <IndentIncrease className="h-3.5 w-3.5" />
                  </Button>
                  <div className="w-px h-5 bg-border mx-1" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleList(false)}
                    title="无序列表"
                  >
                    <List className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleList(true)}
                    title="有序列表"
                  >
                    <ListOrdered className="h-3.5 w-3.5" />
                  </Button>
                  <div className="w-px h-5 bg-border mx-1" />
                  {/* 插入表格 */}
                  <Popover open={showTablePopover} onOpenChange={setShowTablePopover}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7"
                        title="表格操作"
                      >
                        <Table className="h-3.5 w-3.5 mr-1" />
                        表格
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72" align="start">
                      <div className="space-y-4">
                        {/* 插入新表格 */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium">插入新表格</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <Label className="text-xs text-muted-foreground">行数</Label>
                              <Input
                                type="number"
                                min={1}
                                max={10}
                                value={tableRows}
                                onChange={(e) => setTableRows(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                                className="h-8 mt-1"
                              />
                            </div>
                            <div className="flex-1">
                              <Label className="text-xs text-muted-foreground">列数</Label>
                              <Input
                                type="number"
                                min={1}
                                max={10}
                                value={tableCols}
                                onChange={(e) => setTableCols(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                                className="h-8 mt-1"
                              />
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleInsertTable(tableRows, tableCols)}
                          >
                            插入 {tableRows} 行 {tableCols} 列表格
                          </Button>
                        </div>
                        
                        <Separator />
                        
                        {/* 编辑表格 */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium">编辑表格</div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleInsertRowAbove}
                              className="justify-start"
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              上方插入行
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleInsertRowBelow}
                              className="justify-start"
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              下方插入行
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDeleteRow}
                              className="justify-start text-amber-600 hover:text-amber-700"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              删除当前行
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDeleteColumn}
                              className="justify-start text-amber-600 hover:text-amber-700"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              删除当前列
                            </Button>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDeleteTable}
                            className="w-full text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            删除整个表格
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <div className="w-px h-5 bg-border mx-1" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7"
                    onClick={handleRemoveUnderline}
                    title="清除格式"
                  >
                    <Minus className="h-3.5 w-3.5 mr-1" />
                    清除格式
                  </Button>
                </div>
              </div>
            </CardHeader>
          <CardContent className="p-0 flex flex-col flex-1 min-h-0">
            {/* 文档内容区域 - 可滚动 */}
            <div className="flex-1 overflow-auto bg-muted/30 p-6 flex justify-center min-h-0">
              {/* 注入 LibreOffice 生成的样式 */}
              {parseResult?.styles && (
                <style dangerouslySetInnerHTML={{ __html: parseResult.styles }} />
              )}
              <style jsx global>{`
                /* 文档容器样式 - 只保留容器相关样式，不覆盖内容样式 */
                .a4-paper {
                  padding: 2.54cm 3.17cm;
                  background: white;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                  color: #000;
                  box-sizing: border-box;
                  max-width: 210mm;
                  width: 100%;
                }
                
                /* contentEditable 元素样式 */
                .a4-paper[contenteditable="true"],
                .a4-paper[contenteditable="true"]:focus {
                  outline: none;
                }
                
                /* 表格基础样式 - 仅在 LibreOffice 未定义时生效 */
                .a4-paper table {
                  border-collapse: collapse;
                  width: 100%;
                }
                .a4-paper table td,
                .a4-paper table th {
                  vertical-align: top;
                }
                
                /* 变量标记样式 */
                .variable-marker {
                  cursor: pointer;
                  transition: all 0.15s ease;
                  display: inline;
                  position: relative;
                }
                .variable-marker.pending {
                  background: rgba(251, 191, 36, 0.25) !important;
                  border-bottom: 2px dashed #f59e0b;
                  padding: 1px 2px;
                }
                .variable-marker.pending:hover {
                  background: rgba(251, 191, 36, 0.4) !important;
                }
                .variable-marker.bound {
                  background: rgba(34, 197, 94, 0.15) !important;
                  border-bottom: 2px solid #22c55e;
                  padding: 1px 2px;
                }
                .variable-marker.bound:hover {
                  background: rgba(239, 68, 68, 0.15) !important;
                  border-bottom-color: #ef4444;
                }
                
                /* 打印样式 */
                @media print {
                  body {
                    background: white !important;
                  }
                  .a4-paper {
                    box-shadow: none !important;
                    margin: 0 !important;
                    padding: 2.5cm 2.8cm !important;
                  }
                  @page {
                    size: A4;
                    margin: 0;
                  }
                }
              `}</style>
              {/* 缩放容器 */}
              <div style={{
                transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
                transformOrigin: 'top center',
              }}>
                <div
                  ref={contentRef}
                  className="a4-paper"
                  contentEditable={true}
                  suppressContentEditableWarning
                  onClick={handleContentClick}
                  onBlur={syncEditedContent}
                  onKeyDown={(e) => {
                    // 处理快捷键
                    if (e.ctrlKey || e.metaKey) {
                      switch (e.key.toLowerCase()) {
                        case 'b':
                          e.preventDefault();
                          handleBold();
                          break;
                        case 'i':
                          e.preventDefault();
                          handleItalic();
                          break;
                        case 'u':
                          e.preventDefault();
                          handleAddUnderline();
                          break;
                      }
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: editedHtml || currentDocumentHtml || '' }}
                />
              </div>
            </div>
            
            {/* 文档标签页 - 类似Excel的Sheet标签，固定在底部 */}
            {parseResult && parseResult.attachments && parseResult.attachments.length > 0 && (
              <div className="shrink-0 bg-white border-t flex items-center px-2 py-1.5 gap-1 min-h-[36px]">
                <button
                  onClick={() => setActiveDocumentId('main')}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-t border-b-2 transition-colors",
                    activeDocumentId === 'main'
                      ? "bg-background border-primary text-primary font-medium"
                      : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted"
                  )}
                >
                  <FileText className="h-3 w-3 inline-block mr-1" />
                  主合同
                </button>
                {parseResult.attachments?.map((att) => (
                  <button
                    key={att.id}
                    onClick={() => setActiveDocumentId(att.id)}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded-t border-b-2 transition-colors max-w-32 truncate",
                      activeDocumentId === att.id
                        ? "bg-background border-primary text-primary font-medium"
                        : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted"
                    )}
                    title={att.displayName}
                  >
                    <FileText className="h-3 w-3 inline-block mr-1" />
                    {att.displayName}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 右侧：标记面板 */}
        <Card className="overflow-hidden">
          <CardHeader className="py-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">标记管理</CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-3 w-3 mr-1" />
                  自定义变量
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-auto h-[calc(100%-52px)]">
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
                onMouseDown={(e) => {
                  // 阻止按钮获取焦点，保持文档选区
                  e.preventDefault();
                }}
                onClick={() => {
                  const selection = window.getSelection();
                  
                  if (!selection || selection.rangeCount === 0) {
                    toast.info("请先在文档中点击定位光标");
                    contentRef.current?.focus();
                    return;
                  }
                  
                  const range = selection.getRangeAt(0);
                  
                  // 检查光标是否在文档内
                  if (!contentRef.current?.contains(range.commonAncestorContainer)) {
                    toast.info("请先在文档中点击定位光标");
                    contentRef.current?.focus();
                    return;
                  }
                  
                  const markerId = `marker-${Date.now()}`;
                  
                  // 创建变量标记元素
                  const markerSpan = document.createElement('span');
                  markerSpan.className = 'variable-marker pending';
                  markerSpan.dataset.markerId = markerId;
                  markerSpan.style.cssText = 'background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; border: 2px dashed #f59e0b; font-weight: 500; display: inline-block; margin: 0 2px;';
                  markerSpan.textContent = '【待绑定】';
                  
                  try {
                    // 如果有选中文字，替换
                    if (!selection.isCollapsed) {
                      range.deleteContents();
                    }
                    
                    // 在光标位置插入标记
                    range.insertNode(markerSpan);
                    
                    // 将光标移到标记后面
                    range.setStartAfter(markerSpan);
                    range.setEndAfter(markerSpan);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    
                    syncEditedContent();
                    
                    // 添加标记记录
                    const newMarker: Marker = {
                      id: markerId,
                      status: 'pending',
                      position: {
                        beforeText: '',
                        afterText: '',
                        textOffset: 0,
                      },
                      displayText: markerSpan.textContent || '变量',
                    };
                    setMarkers(prev => [...prev, newMarker]);
                    setActiveMarkerId(markerId);
                    setShowVariablePicker(true);
                    toast.success("已插入变量标记，请选择变量");
                  } catch {
                    toast.error("插入标记失败，请重试");
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                插入变量标记
              </Button>
            </div>
            
            {markers.length === 0 ? (
              /* 无标记 */
              <div className="p-6 text-center text-muted-foreground">
                <MousePointer className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">暂无变量标记</p>
                <p className="text-xs mt-1">在文档中定位光标后点击"插入变量标记"</p>
              </div>
            ) : (
              /* 有标记 */
              <div className="p-3 space-y-2">
                {markers.map((marker, index) => {
                  const variable = marker.variableKey 
                    ? [...selectedVariables, ...PresetVariables].find(v => v.key === marker.variableKey)
                    : null;
                  
                  return (
                    <div
                      key={marker.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                        marker.status === 'pending' 
                          ? "bg-amber-50 border-amber-200" 
                          : "bg-green-50 border-green-200"
                      )}
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {marker.status === 'pending' ? (
                            <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                              待绑定
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                              已绑定
                            </Badge>
                          )}
                          <span className="font-medium text-sm truncate">
                            {variable ? variable.name : '未选择变量'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {variable ? variable.key : `位置: ...${marker.position.beforeText.slice(-10)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => handleChangeVariable(marker.id)}
                        >
                          {marker.status === 'pending' ? '绑定' : '更换'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveMarker(marker.id)}
                        >
                          删除
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                      if (!variable) return null;
                      
                      const isComputed = variable.type === 'computed';
                      
                      return (
                        <Badge 
                          key={binding.id} 
                          variant="outline" 
                          className={cn(
                            "flex items-center gap-1",
                            isComputed ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-green-50"
                          )}
                        >
                          {variable.name}
                          {isComputed && (
                            <span className="text-[10px] bg-blue-100 px-1 rounded ml-1">
                              自动计算
                            </span>
                          )}
                        </Badge>
                      );
                    })}
                  </div>
                  
                  {/* 计算型变量说明 */}
                  {bindings.some(b => {
                    const v = [...selectedVariables, ...PresetVariables].find(v => v.key === b.variableKey);
                    return v?.type === 'computed';
                  }) && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">💡 计算型变量说明：</span>
                        带有"自动计算"标记的变量会根据其依赖的变量值自动计算生成。例如"租赁年限"会根据"开始日期"和"结束日期"自动计算。
                      </p>
                    </div>
                  )}
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
        // 需要已上传文件（有fileUrl）才能进入下一步
        return parseResult?.fileUrl !== null;
      case 2:
      case 3:
        return true;
      case 4:
        return false;
      default:
        return false;
    }
  };
  
  const handleNext = async () => {
    if (currentStep === 1) {
      // 如果还没有解析HTML，先执行解析
      if (!parseResult?.html) {
        await handleUploadAndParse();
      } else {
        // 已解析，直接进入下一步
        await handleSaveDraft(true);
        setCurrentStep(2);
      }
      return;
    }
    
    // 自动保存草稿后再切换步骤
    if (currentStep < 4) {
      await handleSaveDraft(true); // true 表示静默保存（不显示成功提示）
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handlePrev = async () => {
    // 自动保存草稿后再切换步骤
    if (currentStep > 1) {
      await handleSaveDraft(true); // true 表示静默保存（不显示成功提示）
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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrev} disabled={currentStep === 1}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            上一步
          </Button>
          {isDraft && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              草稿
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* 保存草稿按钮 - 所有步骤都显示 */}
          <Button 
            variant="outline" 
            onClick={() => handleSaveDraft(false)} 
            disabled={savingDraft}
            className="text-amber-600 border-amber-300 hover:bg-amber-50"
          >
            {savingDraft ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />保存中...</>
            ) : (
              <><SaveAll className="h-4 w-4 mr-2" />保存草稿</>
            )}
          </Button>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
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
                    });
                  }}
                  placeholder="如：项目负责人"
                />
              </div>
              <div>
                <Label>变量标识 * <span className="text-xs text-muted-foreground font-normal">（仅限英文、数字、下划线）</span></Label>
                <Input
                  value={newVariable.key}
                  onChange={(e) => {
                    // 只允许英文、数字、下划线
                    const value = e.target.value.replace(/[^a-z0-9_A-Z]/g, '');
                    setNewVariable({ ...newVariable, key: value });
                  }}
                  placeholder="如：project_manager"
                />
                <p className="text-xs text-muted-foreground mt-1">建议使用英文命名，如：project_manager、contact_person</p>
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
          <Card className="w-[600px] max-h-[80vh] overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle>选择变量</CardTitle>
              <p className="text-sm text-muted-foreground">
                选择要绑定的变量，或点击取消删除此标记
              </p>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden">
              {/* 搜索和分类 */}
              <div className="p-4 border-b space-y-3">
                <Input
                  placeholder="搜索变量..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant={activeCategory === 'all' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setActiveCategory('all')}
                  >
                    全部
                  </Button>
                  {(['custom', 'enterprise', 'contract', 'location', 'date'] as VariableCategory[]).map((cat) => (
                    <Button 
                      key={cat} 
                      variant={activeCategory === cat ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => setActiveCategory(cat)}
                    >
                      {VariableCategoryLabels[cat]}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* 变量列表 */}
              <div className="overflow-auto max-h-[400px]">
                <div className="grid grid-cols-2 gap-2 p-4">
                  {filteredVariables.map((variable) => {
                    const bound = isVariableBound(variable.key);
                    const isComputed = variable.type === 'computed';
                    return (
                      <Button
                        key={variable.id}
                        variant={bound ? "secondary" : "outline"}
                        className={cn(
                          "justify-start h-auto py-3",
                          bound && "bg-green-50 border-green-200",
                          isComputed && "border-blue-200 bg-blue-50/30"
                        )}
                        onClick={() => handleBindVariable(variable)}
                      >
                        <div className="flex items-center gap-2">
                          {bound ? (
                            <Check className="h-4 w-4 text-green-600 shrink-0" />
                          ) : (
                            <Plus className="h-4 w-4 shrink-0" />
                          )}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-medium flex items-center gap-1">
                            <span className="truncate">{variable.name}</span>
                            {isComputed && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded shrink-0">
                                自动
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {isComputed && variable.computed ? (
                              <span className="text-blue-600">
                                依赖: {variable.computed.dependsOn.map(k => {
                                  const depVar = PresetVariables.find(v => v.key === k);
                                  return depVar?.name || k;
                                }).join('、')}
                              </span>
                            ) : (
                              VariableTypeLabels[variable.type]
                            )}
                            {bound && " · 已绑定"}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
            <div className="flex justify-between p-4 border-t">
              <Button 
                variant="ghost" 
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                自定义变量
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowVariablePicker(false);
                  // 如果是待绑定状态，删除标记
                  if (activeMarkerId) {
                    const marker = markers.find(m => m.id === activeMarkerId);
                    if (marker?.status === 'pending') {
                      handleRemoveMarker(activeMarkerId);
                    }
                  }
                  setActiveMarkerId(null);
                }}
              >
                取消
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
