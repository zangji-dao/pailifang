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
import { TemplateProvider, useTemplateContext } from "../new/types/context";
import { useFileUpload } from "../new/hooks/useFileUpload";
import { useDraft } from "../new/hooks/useDraft";

// 保留的旧 Hooks（暂时复用）
import { 
  useAttachments, 
  useMarkers, 
  useTemplateDraft, 
  usePdfExport, 
  useEditor 
} from "../new/hooks";

// 组件（复用现有）
import {
  UploadStep,
  BasicInfoStep,
  BindVariablesStep,
  CompleteStep,
  StepNavigation,
  StepIndicator,
} from "../new/components";

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
  } = useEditor(state.parseResult, (result: ParseResult | null) => {
    dispatch({ type: 'SET_PARSE_RESULT', payload: result });
  });
  
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
  } = useMarkers(contentRef, syncEditedContent, () => activeDocumentId || 'main');
  
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
  
  // 解析文档
  const handleUploadAndParse = async () => {
    if (!state.templateId || !state.mainFileUrl) {
      toast.error("请先上传文档并等待上传完成");
      return;
    }
    
    dispatch({ type: 'SET_PARSING', payload: true });
    dispatch({ type: 'SET_PARSE_PROGRESS', payload: 20 });
    
    try {
      const allAttachments = [...uploadedAttachmentsRef.current];
      
      dispatch({ type: 'SET_PARSE_PROGRESS', payload: 50 });
      
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
      
      dispatch({ type: 'SET_STEP', payload: 2 });
    } catch (err) {
      console.error("上传解析失败:", err);
      toast.error(err instanceof Error ? err.message : "上传解析失败");
    } finally {
      dispatch({ type: 'SET_UPLOADING', payload: false });
      dispatch({ type: 'SET_PARSING', payload: false });
      dispatch({ type: 'SET_PARSE_PROGRESS', payload: 0 });
    }
  };
  
  // 步骤导航
  const handlePrev = () => {
    if (state.currentStep > 1) {
      draft.saveDraft(true);
      dispatch({ type: 'SET_STEP', payload: state.currentStep - 1 });
    }
  };
  
  const handleNext = () => {
    if (state.currentStep === 1) {
      if (fileUpload.uploading) {
        toast.error("文件正在上传中，请稍候...");
        return;
      }
      
      const isEditingExistingTemplate = state.templateId && state.mainFileUrl;
      
      if (isEditingExistingTemplate) {
        draft.saveDraft(true);
        dispatch({ type: 'SET_STEP', payload: 2 });
      } else {
        if (!state.mainFile && !state.mainFileUrl) {
          toast.error("请先上传文档");
          return;
        }
        
        if (state.mainFile && (!state.templateId || !state.mainFileUrl)) {
          toast.error("文件上传失败，请重新选择文件");
          return;
        }
        
        handleUploadAndParse();
      }
    } else {
      draft.saveDraft(true);
      dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
    }
  };
  
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
            onRemoveAttachment={removeAttachment}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onNext={handleNext}
          />
        )}
        
        {state.currentStep === 2 && (
          <BindVariablesStep
            parseResult={state.parseResult}
            editedHtml={editedHtml}
            setEditedHtml={setEditedHtml}
            contentRef={contentRef}
            markers={markers}
            setMarkers={setMarkers}
            activeMarkerId={activeMarkerId}
            setActiveMarkerId={setActiveMarkerId}
            showVariablePicker={showVariablePicker}
            setShowVariablePicker={setShowVariablePicker}
            selectedVariables={selectedVariables}
            setSelectedVariables={setSelectedVariables}
            bindings={bindings}
            insertMarker={insertMarker}
            handleBindVariable={handleBindVariable}
            handleRemoveMarker={handleRemoveMarker}
            handleChangeVariable={handleChangeVariable}
            addCustomVariable={addCustomVariable}
            activeDocumentId={activeDocumentId}
            setActiveDocumentId={setActiveDocumentId}
            zoom={zoom}
            setZoom={setZoom}
            syncEditedContent={syncEditedContent}
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
        
        {state.currentStep === 3 && (
          <BasicInfoStep
            name={state.name}
            description={state.description}
            type={state.type}
            baseId={state.baseId}
            isDefault={state.isDefault}
            bases={state.bases}
            loadingBases={state.loadingBases}
            onNameChange={(value) => dispatch({ type: 'SET_NAME', payload: value })}
            onDescriptionChange={(value) => dispatch({ type: 'SET_DESCRIPTION', payload: value })}
            onTypeChange={(value) => dispatch({ type: 'SET_TYPE', payload: value as 'tenant' | 'non_tenant' })}
            onBaseIdChange={(value) => dispatch({ type: 'SET_BASE_ID', payload: value })}
            onIsDefaultChange={(value) => dispatch({ type: 'SET_IS_DEFAULT', payload: value })}
          />
        )}
        
        {state.currentStep === 4 && (
          <CompleteStep
            name={state.name}
            description={state.description}
            type={state.type}
            baseId={state.baseId}
            isDefault={state.isDefault}
            parseResult={state.parseResult}
            editedHtml={editedHtml}
            markers={markers}
            selectedVariables={selectedVariables}
            bases={state.bases}
            exporting={exporting}
            attachmentDialogOpen={attachmentDialogOpen}
            setAttachmentDialogOpen={setAttachmentDialogOpen}
            selectedExportAttachments={selectedExportAttachments}
            setSelectedExportAttachments={setSelectedExportAttachments}
            onOpenAttachmentDialog={openAttachmentDialog}
            onToggleExportAttachment={toggleExportAttachment}
            onQuickExport={handleQuickExport}
            onExportPDF={handleExportPDF}
          />
        )}
      </div>
      
      <div className="mt-6">
        <StepNavigation
          currentStep={state.currentStep}
          onPrev={handlePrev}
          onNext={handleNext}
          isSaving={state.savingDraft}
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
