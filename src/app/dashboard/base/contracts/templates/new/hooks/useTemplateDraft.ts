import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { ParseResult } from "@/types/contract-template";
import type { Marker, Binding, UploadedAttachment } from "../types";
import type { TemplateVariable } from "@/types/template-variable";

interface DraftData {
  templateId: string;
  mainFile: File | null;
  name: string;
  description: string;
  type: string;
  baseId: string;
  currentStep: number;
  editedHtml: string;
  markers: Marker[];
  selectedVariables: TemplateVariable[];
  bindings: Binding[];
  parseResult: ParseResult | null;
  uploadedAttachments: UploadedAttachment[];
}

export function useTemplateDraft() {
  const [savingDraft, setSavingDraft] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  // 保存草稿
  const saveDraft = useCallback(async (
    data: DraftData,
    options?: { silent?: boolean }
  ) => {
    const { silent = false } = options || {};
    setSavingDraft(true);
    
    try {
      // API 期望的字段在顶层，而不是嵌套在 draft_data 内
      const requestBody = {
        id: data.templateId || undefined,
        name: data.name || '未命名模板',
        description: data.description,
        type: data.type,
        base_id: data.baseId || null,
        currentStep: data.currentStep,
        editedHtml: data.editedHtml,
        markers: data.markers.map(m => ({
          id: m.id,
          variableKey: m.variableKey,
          status: m.status,
          position: m.position,
          documentId: m.documentId,
        })),
        selectedVariables: data.selectedVariables.map(v => ({
          id: v.id,
          key: v.key,
          name: v.name,
          type: v.type,
          category: v.category,
          placeholder: v.placeholder,
        })),
        bindings: data.bindings,
        source_file_url: data.parseResult?.fileUrl,
        source_file_name: data.parseResult?.fileName,
        source_file_type: data.parseResult?.fileType,
        styles: data.parseResult?.styles,
        attachments: data.parseResult?.attachments?.map(a => ({
          id: a.id,
          name: a.name,
          displayName: a.displayName,
          url: a.url,
          html: a.html,
        })),
        uploadedAttachments: data.uploadedAttachments.map(a => ({
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
        body: JSON.stringify(requestBody),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIsDraft(true);
        if (!silent) {
          toast.success("已保存");
        }
        return result.data.id;
      } else {
        throw new Error(result.error || "保存失败");
      }
    } catch (error) {
      console.error("保存失败:", error);
      if (!silent) {
        toast.error(error instanceof Error ? error.message : "保存失败");
      }
      return null;
    } finally {
      setSavingDraft(false);
    }
  }, []);

  // 自动保存
  const autoSave = useCallback((data: DraftData) => {
    return saveDraft(data, { silent: true });
  }, [saveDraft]);

  return {
    savingDraft,
    isDraft,
    setIsDraft,
    saveDraft,
    autoSave,
  };
}
