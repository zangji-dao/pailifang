import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { AttachmentFile, UploadedAttachment } from "../types";

export function useAttachments() {
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [uploadedAttachments, setUploadedAttachments] = useState<UploadedAttachment[]>([]);
  const uploadedAttachmentsRef = useRef<UploadedAttachment[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // 同步 uploadedAttachments 到 ref
  useEffect(() => {
    uploadedAttachmentsRef.current = uploadedAttachments;
  }, [uploadedAttachments]);

  // 选择附件
  const handleAttachmentsSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    
    const validFiles: AttachmentFile[] = [];
    for (const file of fileArray) {
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
      
      // 自动上传附件到服务器
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
          setAttachments(prev => prev.filter(a => a.id !== validFile.id));
        }
      }
      
      if (uploadedList.length > 0) {
        // 只更新 state，ref 会通过 useEffect 自动同步
        setUploadedAttachments(prev => [...prev, ...uploadedList]);
        toast.success(`已上传 ${uploadedList.length} 个附件`);
      }
      
      if (failedFiles.length > 0) {
        toast.error(`${failedFiles.join("、")} 上传失败`);
      }
    }
  }, []);

  // 移除附件
  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
    setUploadedAttachments(prev => prev.filter(a => a.id !== id));
  }, []);

  // 拖拽排序
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedId && draggedId !== id) {
      setDragOverId(id);
    }
  }, [draggedId]);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
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
        const newUploaded = newAttachments
          .map(att => prevUploaded.find(u => u.id === att.id))
          .filter((u): u is UploadedAttachment => u !== undefined);
        // 只更新 state，ref 会通过 useEffect 自动同步
        return newUploaded;
      });
      
      return newAttachments;
    });
    
    setDraggedId(null);
  }, [draggedId]);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  // 重置状态
  const reset = useCallback(() => {
    setAttachments([]);
    setUploadedAttachments([]);
    // 注意：不需要手动清空 ref，它会通过 useEffect 自动同步
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  // 从模板数据加载
  const loadFromTemplate = useCallback((template: any) => {
    const attachmentsList = template.attachments || [];
    if (attachmentsList.length > 0) {
      // 只更新 state，ref 会通过 useEffect 自动同步
      setUploadedAttachments(attachmentsList.map((a: any) => ({
        id: a.id,
        name: a.name,
        url: a.url || '',
        fileType: 'application/vnd.openxmlformats-officientml.wordprocessingml.document',
        size: 0,
      })));
      setAttachments(attachmentsList.map((a: any) => ({
        id: a.id,
        name: a.name,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 0,
        file: null as any,
      })));
    }
  }, []);

  // 从草稿数据加载
  const loadFromDraft = useCallback((draftData: any) => {
    if (draftData?.uploadedAttachments) {
      const uploadedAtts = draftData.uploadedAttachments;
      // 只更新 state，ref 会通过 useEffect 自动同步
      setUploadedAttachments(uploadedAtts);
      setAttachments(uploadedAtts.map((a: any) => ({
        id: a.id,
        name: a.name,
        type: a.fileType,
        size: a.size || 0,
        file: null as any,
      })));
    }
  }, []);

  return {
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
    reset,
    loadFromTemplate,
    loadFromDraft,
  };
}
