import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { ParseResult } from "@/types/contract-template";
import type { UploadedAttachment } from "../types";
import { dedupeAndSortAttachments } from "../types";

export function usePdfExport() {
  const [exporting, setExporting] = useState(false);
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  const [selectedExportAttachments, setSelectedExportAttachments] = useState<string[]>([]);

  // 打开附件选择对话框
  const openAttachmentDialog = useCallback((
    parseResult: ParseResult | null,
    uploadedAttachments: UploadedAttachment[]
  ) => {
    const rawAttachments = parseResult?.attachments?.length 
      ? parseResult.attachments 
      : uploadedAttachments.map(att => ({
          id: att.id,
          name: att.name,
          displayName: att.name.replace(/\.[^/.]+$/, ''),
          url: att.url,
          html: '',
          styles: '',
          text: '',
          order: 0,
        }));
    
    const allParsedAttachments = dedupeAndSortAttachments(rawAttachments);
    
    const allAttachmentIds = allParsedAttachments.map(a => a.id);
    setSelectedExportAttachments(allAttachmentIds);
    setAttachmentDialogOpen(true);
  }, []);

  // 切换附件选择
  const toggleExportAttachment = useCallback((attachmentId: string) => {
    setSelectedExportAttachments(prev => 
      prev.includes(attachmentId)
        ? prev.filter(id => id !== attachmentId)
        : [...prev, attachmentId]
    );
  }, []);

  // 构建导出用的模板数据
  const buildExportTemplateData = useCallback((
    templateId: string,
    name: string,
    description: string,
    type: string,
    activeDocumentId: string,
    editedHtml: string,
    parseResult: ParseResult | null,
    selectedExportAttachments: string[],
    uploadedAttachments: UploadedAttachment[]
  ) => {
    const currentHtml = activeDocumentId === 'main' 
      ? (editedHtml || parseResult?.html || '')
      : parseResult?.attachments?.find(a => a.id === activeDocumentId)?.html || '';
    
    const rawAttachments = parseResult?.attachments?.length 
      ? parseResult.attachments 
      : uploadedAttachments.map(att => ({
          id: att.id,
          name: att.name,
          displayName: att.name.replace(/\.[^/.]+$/, ''),
          url: att.url,
          html: '',
          styles: '',
          text: '',
          order: 0,
        }));
    
    const allParsedAttachments = dedupeAndSortAttachments(rawAttachments);
    
    const attachments = allParsedAttachments
      .filter(att => selectedExportAttachments.includes(att.id))
      .map(att => ({
        id: att.id,
        name: att.displayName || att.name,
        description: '',
        required: false,
        order: att.order || 0,
      }));
    
    return {
      id: templateId || 'preview',
      name: name || '未命名模板',
      description: description,
      type: type,
      html: currentHtml,
      styles: parseResult?.styles || '',
      attachments: attachments,
      styleConfig: {
        pageSize: 'A4',
        orientation: 'portrait' as const,
        margins: { top: 25, right: 20, bottom: 25, left: 20 },
        font: { family: 'SimSun', size: 12, lineHeight: 1.8 },
        titleFont: { family: 'SimHei', size: 18, weight: 'bold' as const },
        colors: {
          primary: '#1a1a1a',
          secondary: '#666666',
          text: '#333333',
          border: '#e5e5e5',
          headerBg: '#f5f5f5',
        },
        layout: {
          showLogo: true,
          logoPosition: 'center' as const,
          showPageNumber: true,
          pageNumberPosition: 'center' as const,
          headerHeight: 60,
          footerHeight: 40,
        },
        clauseStyle: {
          numberingStyle: 'decimal' as const,
          indent: 24,
          spacing: 12,
        },
      },
    };
  }, []);

  // 快速导出PDF（不含附件）
  const handleQuickExport = useCallback(async (
    templateId: string,
    name: string,
    description: string,
    type: string,
    activeDocumentId: string,
    editedHtml: string,
    parseResult: ParseResult | null
  ) => {
    setExporting(true);
    try {
      const templateData = buildExportTemplateData(
        templateId,
        name,
        description,
        type,
        activeDocumentId,
        editedHtml,
        parseResult,
        [],
        []
      );

      const response = await fetch('/api/contract-templates/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: templateData,
          includeAttachments: false,
          selectedAttachments: [],
        }),
      });

      if (!response.ok) {
        throw new Error('导出失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name || '合同模板'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('PDF导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      toast.error('导出失败');
    } finally {
      setExporting(false);
    }
  }, [buildExportTemplateData]);

  // 导出PDF（含选择附件）
  const handleExportPDF = useCallback(async (
    templateId: string,
    name: string,
    description: string,
    type: string,
    activeDocumentId: string,
    editedHtml: string,
    parseResult: ParseResult | null,
    selectedExportAttachments: string[],
    uploadedAttachments: UploadedAttachment[]
  ) => {
    setExporting(true);
    try {
      const templateData = buildExportTemplateData(
        templateId,
        name,
        description,
        type,
        activeDocumentId,
        editedHtml,
        parseResult,
        selectedExportAttachments,
        uploadedAttachments
      );

      const response = await fetch('/api/contract-templates/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: templateData,
          includeAttachments: selectedExportAttachments.length > 0,
          selectedAttachments: selectedExportAttachments,
        }),
      });

      if (!response.ok) {
        throw new Error('导出失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name || '合同模板'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setAttachmentDialogOpen(false);
      toast.success('PDF导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      toast.error('导出失败');
    } finally {
      setExporting(false);
    }
  }, [buildExportTemplateData]);

  return {
    exporting,
    attachmentDialogOpen,
    setAttachmentDialogOpen,
    selectedExportAttachments,
    setSelectedExportAttachments,
    openAttachmentDialog,
    toggleExportAttachment,
    buildExportTemplateData,
    handleQuickExport,
    handleExportPDF,
  };
}
