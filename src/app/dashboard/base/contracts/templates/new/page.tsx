/**
 * 合同模板创建页面 - 完全重构版本
 * 使用新的状态管理架构
 * 
 * 目标：将 919 行精简到 <300 行
 */

"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// 新架构
import { TemplateProvider, useTemplateContext } from "./types/context";
import { useFileUpload } from "./hooks/useFileUpload";
import { useDraft } from "./hooks/useDraft";

// 保留的旧 Hooks（暂时复用）
import { 
  useAttachments, 
  useMarkers, 
  useTemplateDraft, 
  usePdfExport, 
  useEditor 
} from "./hooks";

// 组件（复用现有）
import {
  UploadStep,
  ParseStep,
  BasicInfoStep,
  BindVariablesStep,
  CompleteStep,
  StepNavigation,
  StepIndicator,
} from "./components";

// 类型
import type { ParseResult } from "@/types/contract-template";

/**
 * 内部组件（使用新架构）
 */
function TemplateCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, dispatch } = useTemplateContext();
  
  // 新架构 Hooks
  const fileUpload = useFileUpload();
  const draft = useDraft();
  
  // 旧的 Hooks（暂时保留）
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
    loadFromTemplateAttachments,
    loadFromDraft: loadAttachmentsFromDraft,
  } = useAttachments();
  
  const {
    savingDraft: oldSavingDraft,
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
  } = useEditor(state.parseResult, ((result: ParseResult | null) => {
    dispatch({ type: 'SET_PARSE_RESULT', payload: result });
  }) as any, state.editedHtml);
  
  // 同步 useEditor 的 editedHtml 到 Context
  useEffect(() => {
    if (editedHtml && editedHtml !== state.editedHtml) {
      dispatch({ type: 'SET_EDITED_HTML', payload: editedHtml });
    }
  }, [editedHtml]);
  
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
  } = useMarkers(contentRef, syncEditedContent, () => activeDocumentId || 'main', state.markers as any, state.selectedVariables as any);
  
  // 同步 useMarkers 的 markers 和 selectedVariables 到 Context（使用类型断言）
  useEffect(() => {
    if (markers.length > 0 && JSON.stringify(markers) !== JSON.stringify(state.markers)) {
      dispatch({ type: 'SET_MARKERS', payload: markers as any });
    }
  }, [markers]);
  
  useEffect(() => {
    if (selectedVariables.length > 0 && JSON.stringify(selectedVariables) !== JSON.stringify(state.selectedVariables)) {
      dispatch({ type: 'SET_SELECTED_VARIABLES', payload: selectedVariables as any });
    }
  }, [selectedVariables]);
  
  useEffect(() => {
    if (bindings.length > 0 && JSON.stringify(bindings) !== JSON.stringify(state.bindings)) {
      dispatch({ type: 'SET_BINDINGS', payload: bindings as any });
    }
  }, [bindings]);

  // 获取基地列表
  useEffect(() => {
    const fetchBases = async () => {
      dispatch({ type: 'SET_LOADING_BASES', payload: true });
      try {
        const res = await fetch("/api/bases");
        const data = await res.json();
        if (data.success) {
          dispatch({ type: 'SET_BASES', payload: data.data || [] });
        }
      } catch (err) {
        console.error("获取基地列表失败:", err);
      } finally {
        dispatch({ type: 'SET_LOADING_BASES', payload: false });
      }
    };
    
    fetchBases();
  }, [dispatch]);
  
  // 同步 useAttachments 的 uploadedAttachments 到 Context
  useEffect(() => {
    if (uploadedAttachments.length > 0) {
      dispatch({ type: 'SET_UPLOADED_ATTACHMENTS', payload: uploadedAttachments });
    }
  }, [uploadedAttachments, dispatch]);
  
  // 从 Context 同步附件到 useAttachments（编辑模板时）
  useEffect(() => {
    // 当 Context 中有附件但 useAttachments 没有时，同步过去
    if (state.templateId && state.uploadedAttachments.length > 0 && attachments.length === 0) {
      console.log('同步附件到 useAttachments:', state.uploadedAttachments);
      loadAttachmentsFromDraft({ uploadedAttachments: state.uploadedAttachments });
    }
  }, [state.templateId, state.uploadedAttachments, attachments.length, loadAttachmentsFromDraft]);
  
  // 解析文档
  const handleUploadAndParse = async () => {
    if (!state.templateId || !state.mainFileUrl) {
      toast.error("请先上传文档并等待上传完成");
      return;
    }
    
    // 清除之前的解析结果（支持重新解析）
    dispatch({ type: 'SET_PARSE_RESULT', payload: null });
    dispatch({ type: 'SET_PARSE_ERROR', payload: null });
    
    dispatch({ type: 'SET_PARSING', payload: true });
    dispatch({ type: 'SET_PARSE_PROGRESS', payload: 20 });
    
    try {
      // 检查是否有未上传的附件（旧页面的逻辑）
      const pendingAttachments = attachments.filter(att => att.file !== null);
      const newlyUploaded: any[] = [];
      
      if (pendingAttachments.length > 0) {
        dispatch({ type: 'SET_UPLOADING', payload: true });
        
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
        
        dispatch({ type: 'SET_UPLOADING', payload: false });
      }
      
      dispatch({ type: 'SET_PARSE_PROGRESS', payload: 50 });
      
      // 合并已上传的附件
      const allAttachments = [...uploadedAttachmentsRef.current, ...newlyUploaded];
      
      const parseRes = await fetch("/api/contract-templates/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: state.templateId,
          fileUrl: state.mainFileUrl,
          fileName: state.mainFileName,
          fileType: 'docx',
          attachments: allAttachments.map(att => ({
            id: att.id,
            name: att.name,
            url: att.url,
            fileType: att.fileType,
          })),
        }),
      });
      
      dispatch({ type: 'SET_PARSE_PROGRESS', payload: 80 });
      
      const parseData = await parseRes.json();
      
      if (!parseData.success) {
        throw new Error(parseData.error || "解析失败");
      }
      
      dispatch({ type: 'SET_PARSE_RESULT', payload: parseData.data });
      
      if (!state.name && state.mainFileName) {
        dispatch({ type: 'SET_NAME', payload: state.mainFileName.replace(/\.[^/.]+$/, "") });
      }
      
      dispatch({ type: 'SET_PARSE_PROGRESS', payload: 100 });
      toast.success("文档解析成功");
      
      // 解析完成后自动保存草稿
      draft.saveDraft(true);
    } catch (err) {
      console.error("上传解析失败:", err);
      toast.error(err instanceof Error ? err.message : "上传解析失败");
      dispatch({ type: 'SET_PARSE_ERROR', payload: err instanceof Error ? err.message : "上传解析失败" });
    } finally {
      dispatch({ type: 'SET_UPLOADING', payload: false });
      dispatch({ type: 'SET_PARSING', payload: false });
      dispatch({ type: 'SET_PARSE_PROGRESS', payload: 0 });
    }
  };
  
  // 步骤导航
  const handlePrev = () => {
    if (state.currentStep > 1) {
      // 如果在第3步（绑定变量）返回，回到解析步骤（第2步）
      // 如果在第2步（解析）返回，回到上传步骤（第1步）
      draft.saveDraft(true);
      dispatch({ type: 'SET_STEP', payload: state.currentStep - 1 });
    }
  };
  
  const handleNext = () => {
    console.log('handleNext - 当前步骤:', state.currentStep);
    
    if (state.currentStep === 1) {
      // 第1步：上传文档 → 进入解析步骤
      // 检查是否正在上传
      if (fileUpload.uploading) {
        toast.error("文件正在上传中，请稍候...");
        return;
      }
      
      // 检查是否已上传文件
      if (!state.templateId || !state.mainFileUrl) {
        toast.error("请先上传主文档");
        return;
      }
      
      // 进入解析步骤
      draft.saveDraft(true);
      dispatch({ type: 'SET_STEP', payload: 2 });
      
    } else if (state.currentStep === 2) {
      // 第2步：解析文档 → 必须解析完成才能进入下一步
      if (!state.parseResult) {
        toast.error("请先点击「开始解析」按钮解析文档");
        return;
      }
      
      // 解析完成，进入绑定变量步骤
      draft.saveDraft(true);
      dispatch({ type: 'SET_STEP', payload: 3 });
      
    } else if (state.currentStep === 5) {
      // 最后一步，完成创建
      handleComplete();
    } else {
      // 其他步骤正常流转
      draft.saveDraft(true);
      dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
    }
  };
  
  const handleComplete = async () => {
    if (!state.templateId) {
      toast.error("请先上传文档");
      return;
    }
    
    if (!state.name.trim()) {
      toast.error("请输入模板名称");
      return;
    }
    
    if (!state.baseId) {
      toast.error("请选择所属基地");
      return;
    }
    
    dispatch({ type: 'SET_SAVING', payload: true });
    
    try {
      // 1. 更新模板基本信息
      const res = await fetch("/api/contract-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: state.templateId,
          name: state.name,
          description: state.description,
          type: state.type,
          base_id: state.baseId,
          is_default: state.isDefault,
          status: 'published',
        }),
      });
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || "保存失败");
      }
      
      // 2. 保存自定义变量到 contract_fields 表
      const customVariables = selectedVariables.filter(v => v.category === 'custom');
      if (customVariables.length > 0) {
        const fieldsRes = await fetch("/api/contract-templates/fields", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId: state.templateId,
            fields: customVariables.map(v => ({
              key: v.key,
              label: v.name,
              type: v.type || 'text',
              required: true,
              placeholder: v.placeholder,
              options: v.options,
            })),
          }),
        });
        
        const fieldsData = await fieldsRes.json();
        if (!fieldsData.success) {
          console.error("保存字段失败:", fieldsData.error);
          // 不阻止流程，只记录错误
        }
      }
      
      toast.success("模板创建成功");
      router.push("/dashboard/base/contracts/templates");
    } catch (err) {
      console.error("保存失败:", err);
      toast.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  };
  
  const handleSaveDraftClick = async () => {
    await draft.saveDraft(false);
  };
  
  // 删除附件后自动保存草稿（同步到数据库）
  const handleRemoveAttachment = async (id: string) => {
    // 从 useAttachments 中删除
    removeAttachment(id);
    
    // 同时从 Context 中删除（同步状态）
    dispatch({
      type: 'SET_UPLOADED_ATTACHMENTS',
      payload: state.uploadedAttachments.filter(a => a.id !== id),
    });
    
    // 如果已有 templateId，自动保存草稿以同步附件列表
    if (state.templateId) {
      // 稍作延迟，等待状态更新
      setTimeout(() => {
        draft.saveDraft(true);
      }, 100);
    }
  };
  
  const isLastStep = state.currentStep === 5;
  
  // 第2步（解析步骤）只有解析完成后才能点击下一步
  const canGoNext = !fileUpload.uploading && !state.parsing && !state.saving && (
    state.currentStep !== 2 || state.parseResult !== null
  );
  
  // 加载中
  if (state.loadingDraft) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {state.templateId ? '编辑合同模板' : '创建合同模板'}
        </h1>
        <p className="text-muted-foreground">
          创建可重复使用的合同模板，支持变量绑定和附件管理
        </p>
      </div>
      
      <StepIndicator currentStep={state.currentStep} />
      
      <div className="mt-6">
        {state.currentStep === 1 && (
          <UploadStep
            mainFile={state.mainFile}
            mainFileUrl={state.mainFileUrl}
            mainFileName={state.mainFileName}
            uploading={state.uploading}
            parsing={state.parsing}
            parseProgress={state.parseProgress}
            attachments={attachments}
            draggedId={draggedId}
            dragOverId={dragOverId}
            bases={state.bases}
            onMainFileSelect={fileUpload.handleMainFileSelect}
            onAttachmentsSelect={handleAttachmentsSelect}
            onRemoveAttachment={handleRemoveAttachment}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onNext={handleNext}
          />
        )}
        
        {state.currentStep === 2 && (
          <ParseStep
            mainFileName={state.mainFileName}
            mainFileUrl={state.mainFileUrl}
            attachments={state.uploadedAttachments}
            parsing={state.parsing}
            parseProgress={state.parseProgress}
            parseResult={state.parseResult}
            parseError={state.parseError}
            onStartParse={handleUploadAndParse}
          />
        )}
        
        {state.currentStep === 3 && (
          <BindVariablesStep
            parseResult={state.parseResult}
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
            onBindVariable={handleBindVariable as any}
            onRemoveMarker={handleRemoveMarker}
            onChangeVariable={handleChangeVariable as any}
            onSetActiveMarker={setActiveMarkerId}
            onShowVariablePicker={setShowVariablePicker}
            onAddCustomVariable={addCustomVariable as any}
            onSyncEditedContent={syncEditedContent as any}
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
        )}
        
        {state.currentStep === 4 && (
          <BasicInfoStep
            name={state.name}
            description={state.description}
            type={state.type}
            baseId={state.baseId}
            isDefault={state.isDefault}
            bases={state.bases}
            loadingBases={state.loadingBases}
            onNameChange={(value: string) => dispatch({ type: 'SET_NAME', payload: value })}
            onDescriptionChange={(value: string) => dispatch({ type: 'SET_DESCRIPTION', payload: value })}
            onTypeChange={(value) => dispatch({ type: 'SET_TYPE', payload: value })}
            onBaseChange={(value: string) => dispatch({ type: 'SET_BASE_ID', payload: value })}
            onDefaultChange={(value: boolean) => dispatch({ type: 'SET_IS_DEFAULT', payload: value })}
          />
        )}
        
        {state.currentStep === 5 && (
          <CompleteStep
            name={state.name}
            description={state.description}
            type={state.type}
            baseId={state.baseId}
            bindings={bindings}
            selectedVariables={selectedVariables}
            parseResult={state.parseResult}
            uploadedAttachments={state.uploadedAttachments as any}
            bases={state.bases}
            previewZoom={state.previewZoom}
            editedHtml={editedHtml}
            exporting={exporting}
            attachmentDialogOpen={attachmentDialogOpen}
            selectedExportAttachments={selectedExportAttachments}
            onZoomChange={(zoom) => dispatch({ type: 'SET_PREVIEW_ZOOM', payload: zoom })}
            onQuickExport={handleQuickExport as any}
            onOpenAttachmentDialog={openAttachmentDialog as any}
            onExportPDF={handleExportPDF as any}
            onAttachmentDialogChange={setAttachmentDialogOpen}
            onToggleExportAttachment={toggleExportAttachment as any}
          />
        )}
      </div>
      
      <div className="mt-6">
        <StepNavigation
          currentStep={state.currentStep}
          saving={state.saving}
          savingDraft={state.savingDraft}
          canGoNext={canGoNext}
          isLastStep={isLastStep}
          onPrev={handlePrev}
          onNext={handleNext}
          onSaveDraft={handleSaveDraftClick}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}

/**
 * 导出（使用 TemplateProvider 包裹）
 */
export default function TemplateCreatePage() {
  return (
    <TemplateProvider>
      <TemplateCreateContent />
    </TemplateProvider>
  );
}
