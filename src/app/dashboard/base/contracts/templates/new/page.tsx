"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ParseResult } from "@/types/contract-template";
import type { Base, Marker, Binding, UploadedAttachment } from "./types";
import { dedupeAndSortAttachments } from "./types";
import { 
  useAttachments, 
  useMarkers, 
  useTemplateDraft, 
  usePdfExport, 
  useEditor 
} from "./hooks";
import {
  UploadStep,
  BasicInfoStep,
  BindVariablesStep,
  CompleteStep,
  StepNavigation,
} from "./components";

export default function NewTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftLoadedRef = useRef(false);
  
  // 基本状态
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [templateId, setTemplateId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  
  // 主文件状态
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [mainFileUrl, setMainFileUrl] = useState<string>("");
  const [mainFileName, setMainFileName] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  
  // 基本信息
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("tenant");
  const [baseId, setBaseId] = useState<string>("");
  const [isDefault, setIsDefault] = useState(false);
  
  // 基地列表
  const [bases, setBases] = useState<Base[]>([]);
  const [loadingBases, setLoadingBases] = useState(false);
  
  // 预览缩放
  const [previewZoom, setPreviewZoom] = useState(100);
  
  // Hooks
  const {
    attachments,
    uploadedAttachments,
    uploadedAttachmentsRef,
    draggedId,
    dragOverId,
    handleAttachmentsSelect,
    removeAttachment,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    loadFromTemplate: loadAttachmentsFromTemplate,
    loadFromDraft: loadAttachmentsFromDraft,
  } = useAttachments();
  
  const {
    savingDraft,
    isDraft,
    setIsDraft,
    saveDraft,
    autoSave,
  } = useTemplateDraft();
  
  const {
    exporting,
    attachmentDialogOpen,
    setAttachmentDialogOpen,
    selectedExportAttachments,
    setSelectedExportAttachments,
    openAttachmentDialog,
    toggleExportAttachment,
    handleQuickExport,
    handleExportPDF,
  } = usePdfExport();
  
  // 编辑器
  const {
    contentRef,
    editedHtml,
    setEditedHtml,
    activeDocumentId,
    setActiveDocumentId,
    zoom,
    setZoom,
    syncEditedContent,
    handleBold,
    handleItalic,
    handleUnderline,
    handleStrikethrough,
    handleAlign,
    handleOrderedList,
    handleUnorderedList,
    handleIndent,
    handleOutdent,
    handleSetFont,
    handleSetFontSize,
    handleSetLineHeight,
    handleApplyPreset,
    handleAddUnderlineFill,
    handleInsertTable,
    handleDeleteRow,
    handleDeleteColumn,
    handlePrint,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
  } = useEditor(parseResult, setParseResult);
  
  // 标记管理
  const {
    markers,
    setMarkers,
    activeMarkerId,
    setActiveMarkerId,
    showVariablePicker,
    setShowVariablePicker,
    selectedVariables,
    setSelectedVariables,
    bindings,
    insertMarker,
    handleBindVariable,
    handleRemoveMarker,
    handleChangeVariable,
    addCustomVariable,
    loadFromTemplate: loadMarkersFromTemplate,
  } = useMarkers(contentRef, syncEditedContent, () => activeDocumentId);
  
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
  
  // 加载模板数据（草稿或已发布模板）
  useEffect(() => {
    const loadTemplate = async () => {
      const draftId = searchParams.get('draftId');
      const templateIdParam = searchParams.get('templateId');
      
      if (!draftId && !templateIdParam) return;
      if (draftLoadedRef.current) return;
      draftLoadedRef.current = true;
      
      setLoadingDraft(true);
      try {
        let template: any;
        let isDraftTemplate = false;
        
        if (draftId) {
          const response = await fetch(`/api/contract-templates/draft?id=${draftId}`);
          const result = await response.json();
          if (result.success && result.data) {
            template = result.data;
            isDraftTemplate = true;
          }
        } else if (templateIdParam) {
          const response = await fetch(`/api/contract-templates?id=${templateIdParam}`);
          const result = await response.json();
          if (result.success && result.data) {
            template = result.data;
            isDraftTemplate = false;
          }
        }
        
        if (template) {
          setTemplateId(template.id);
          setIsDraft(isDraftTemplate);
          setName(template.name || '');
          setDescription(template.description || '');
          setType(template.type || 'tenant');
          setBaseId(template.base_id || '');
          
          // 如果是草稿
          if (isDraftTemplate && template.draft_data) {
            const draftData = template.draft_data;
            setCurrentStep(draftData.currentStep || 1);
            setEditedHtml(draftData.editedHtml || '');
            
            // 恢复标记
            if (draftData.markers && Array.isArray(draftData.markers)) {
              setMarkers(draftData.markers.map((m: any) => ({
                id: m.id,
                documentId: m.documentId || 'main',
                variableKey: m.variableKey,
                status: m.status,
                position: m.position,
              })));
            }
            
            // 恢复选中的变量
            if (draftData.selectedVariables && Array.isArray(draftData.selectedVariables)) {
              setSelectedVariables(draftData.selectedVariables.map((v: any) => ({
                id: v.id || `var_custom_${v.key}`,
                key: v.key,
                name: v.name,
                type: v.type || 'text',
                category: v.category || 'custom',
                placeholder: v.placeholder,
              })));
            }
          }
          
          // 恢复解析结果
          if (template.source_file_url) {
            const parseData: ParseResult = {
              success: true,
              totalPages: 1,
              fileName: template.source_file_name || '合同文档',
              fileType: template.source_file_type || 'docx',
              fileUrl: template.source_file_url,
              pages: [],
              fullText: '',
              html: isDraftTemplate ? (template.draft_data?.editedHtml || '') : '',
              styles: isDraftTemplate ? template.draft_data?.styles : '',
              attachments: (template.attachments || []).map((a: any) => ({
                id: a.id,
                name: a.name,
                displayName: a.name,
                url: a.url || '',
                html: '',
                styles: '',
                text: '',
                order: a.order || 0,
              })),
              detectedAttachments: [],
              detectedFields: [],
              mainContract: { startPage: 1, endPage: 1, pageRange: '1', content: '' },
            };
            setParseResult(parseData);
            setMainFileUrl(template.source_file_url);
            setMainFileName(template.source_file_name || '');
            
            if (isDraftTemplate && template.draft_data?.editedHtml) {
              setEditedHtml(template.draft_data.editedHtml);
            }
          }
          
          // 恢复附件
          loadAttachmentsFromTemplate(template);
          
          // 草稿附件
          if (isDraftTemplate && template.draft_data?.uploadedAttachments) {
            loadAttachmentsFromDraft(template.draft_data);
          }
          
          toast.success(isDraftTemplate ? "草稿已加载" : "模板已加载");
        }
      } catch (err) {
        console.error("加载模板失败:", err);
        toast.error("加载模板失败");
      } finally {
        setLoadingDraft(false);
      }
    };
    
    loadTemplate();
  }, [searchParams, setMarkers, setSelectedVariables, setEditedHtml, loadAttachmentsFromTemplate, loadAttachmentsFromDraft, setIsDraft]);
  
  // 主文件选择
  const handleMainFileSelect = async (file: File) => {
    setMainFile(file);
    setUploading(true);
    setParseProgress(20);
    
    try {
      // 上传文件
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
      
      setParseProgress(60);
      setTemplateId(uploadData.templateId);
      setMainFileUrl(uploadData.fileUrl);
      setMainFileName(file.name);
      
      toast.success("文件已上传，点击「下一步」解析文档");
    } catch (err) {
      console.error("上传失败:", err);
      toast.error(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
      setParseProgress(0);
    }
  };
  
  // 上传并解析
  const handleUploadAndParse = async () => {
    if (!parseResult?.fileUrl && !mainFile && !mainFileUrl) {
      toast.error("请先上传文档");
      return;
    }
    
    setParsing(true);
    setParseProgress(20);
    
    try {
      let fileUrl = parseResult?.fileUrl || mainFileUrl;
      let fileName = parseResult?.fileName || mainFileName;
      let fileType = parseResult?.fileType || 'docx';
      let templateIdToUse = templateId;
      
      // 上传未上传的附件
      const pendingAttachments = attachments.filter(att => att.file !== null);
      const newlyUploaded: UploadedAttachment[] = [];
      
      if (pendingAttachments.length > 0) {
        setUploading(true);
        
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
        
        setUploading(false);
      }
      
      setParseProgress(50);
      
      // 解析
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
      
      setParseProgress(80);
      
      const parseData = await parseRes.json();
      
      if (!parseData.success) {
        throw new Error(parseData.error || "解析失败");
      }
      
      setParseResult(parseData.data);
      
      if (!name && fileName) {
        setName(fileName.replace(/\.[^/.]+$/, ""));
      }
      
      setParseProgress(100);
      toast.success("文档解析成功");
      setCurrentStep(2);
    } catch (err) {
      console.error("上传解析失败:", err);
      toast.error(err instanceof Error ? err.message : "上传解析失败");
    } finally {
      setUploading(false);
      setParsing(false);
      setParseProgress(0);
    }
  };
  
  // 保存草稿
  const handleSaveDraft = useCallback(async (silent = false) => {
    const id = await saveDraft({
      templateId,
      mainFile,
      name,
      description,
      type,
      baseId,
      currentStep,
      editedHtml,
      markers,
      selectedVariables,
      bindings,
      parseResult,
      uploadedAttachments,
    }, { silent });
    
    if (id) {
      setTemplateId(id);
    }
  }, [templateId, mainFile, name, description, type, baseId, currentStep, editedHtml, markers, selectedVariables, bindings, parseResult, uploadedAttachments, saveDraft]);
  
  // 完成创建
  const handleComplete = async () => {
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
      // 构建附件列表
      const rawAttachments = parseResult?.attachments?.length 
        ? parseResult.attachments.map(a => ({
            id: a.id,
            name: a.displayName || a.name,
            url: a.url,
            description: '',
            required: false,
            order: a.order || 0,
          }))
        : uploadedAttachments.map(att => ({
            id: att.id,
            name: att.name.replace(/\.[^/.]+$/, ''),
            url: att.url,
            description: '',
            required: false,
            order: 0,
          }));
      
      const attachmentsList = dedupeAndSortAttachments(rawAttachments);
      
      // 更新模板
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
          status: 'published',
          attachments: attachmentsList,
        }),
      });
      
      if (!updateRes.ok) throw new Error("更新基本信息失败");
      
      // 保存变量绑定
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
  
  // 步骤导航
  const handlePrev = () => {
    if (currentStep > 1) {
      handleSaveDraft(true);
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleNext = () => {
    if (currentStep === 1) {
      handleUploadAndParse();
    } else {
      handleSaveDraft(true);
      setCurrentStep(currentStep + 1);
    }
  };
  
  // 渲染当前步骤
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <UploadStep
            mainFile={mainFile}
            mainFileUrl={mainFileUrl}
            mainFileName={mainFileName}
            uploading={uploading}
            parsing={parsing}
            parseProgress={parseProgress}
            attachments={attachments}
            bases={bases}
            draggedId={draggedId}
            dragOverId={dragOverId}
            onMainFileSelect={handleMainFileSelect}
            onAttachmentsSelect={handleAttachmentsSelect}
            onRemoveAttachment={removeAttachment}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onNext={handleNext}
          />
        );
      
      case 2:
        return (
          <BindVariablesStep
            parseResult={parseResult}
            editedHtml={editedHtml}
            activeDocumentId={activeDocumentId}
            markers={markers}
            activeMarkerId={activeMarkerId}
            showVariablePicker={showVariablePicker}
            selectedVariables={selectedVariables}
            zoom={zoom}
            contentRef={contentRef}
            onEditedHtmlChange={setEditedHtml}
            onDocumentChange={setActiveDocumentId}
            onZoomChange={setZoom}
            onInsertMarker={insertMarker}
            onBindVariable={handleBindVariable}
            onRemoveMarker={handleRemoveMarker}
            onChangeVariable={handleChangeVariable}
            onSetActiveMarker={setActiveMarkerId}
            onShowVariablePicker={setShowVariablePicker}
            onAddCustomVariable={addCustomVariable}
            onSyncEditedContent={syncEditedContent}
            onBold={handleBold}
            onItalic={handleItalic}
            onUnderline={handleUnderline}
            onStrikethrough={handleStrikethrough}
            onAlign={handleAlign}
            onOrderedList={handleOrderedList}
            onUnorderedList={handleUnorderedList}
            onIndent={handleIndent}
            onOutdent={handleOutdent}
            onSetFont={handleSetFont}
            onSetFontSize={handleSetFontSize}
            onSetLineHeight={handleSetLineHeight}
            onApplyPreset={handleApplyPreset}
            onAddUnderlineFill={handleAddUnderlineFill}
            onInsertTable={handleInsertTable}
            onDeleteRow={handleDeleteRow}
            onDeleteColumn={handleDeleteColumn}
            onPrint={handlePrint}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomReset={handleZoomReset}
          />
        );
      
      case 3:
        return (
          <BasicInfoStep
            name={name}
            description={description}
            type={type}
            baseId={baseId}
            isDefault={isDefault}
            bases={bases}
            loadingBases={loadingBases}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onTypeChange={setType}
            onBaseChange={setBaseId}
            onDefaultChange={setIsDefault}
          />
        );
      
      case 4:
        return (
          <CompleteStep
            name={name}
            description={description}
            type={type}
            baseId={baseId}
            bindings={bindings}
            selectedVariables={selectedVariables}
            parseResult={parseResult}
            uploadedAttachments={uploadedAttachments}
            bases={bases}
            previewZoom={previewZoom}
            editedHtml={editedHtml}
            exporting={exporting}
            attachmentDialogOpen={attachmentDialogOpen}
            selectedExportAttachments={selectedExportAttachments}
            onZoomChange={setPreviewZoom}
            onQuickExport={() => handleQuickExport(templateId, name, description, type, activeDocumentId, editedHtml, parseResult)}
            onOpenAttachmentDialog={() => openAttachmentDialog(parseResult, uploadedAttachments)}
            onExportPDF={() => handleExportPDF(templateId, name, description, type, activeDocumentId, editedHtml, parseResult, selectedExportAttachments, uploadedAttachments)}
            onAttachmentDialogChange={setAttachmentDialogOpen}
            onToggleExportAttachment={toggleExportAttachment}
          />
        );
      
      default:
        return null;
    }
  };
  
  // 加载中
  if (loadingDraft) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isDraft ? "编辑模板" : "新建合同模板"}
          </h1>
          <p className="text-muted-foreground">
            创建可重复使用的合同模板，支持变量绑定
          </p>
        </div>
      </div>
      
      {renderStep()}
      
      {/* 底部导航 */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <StepNavigation
          currentStep={currentStep}
          saving={saving}
          savingDraft={savingDraft}
          canGoNext={currentStep === 1 ? !!(mainFile || mainFileUrl) : true}
          isLastStep={currentStep === 4}
          onPrev={handlePrev}
          onNext={handleNext}
          onSaveDraft={() => handleSaveDraft(false)}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
