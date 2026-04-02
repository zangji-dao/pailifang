/**
 * 文件上传 Hook
 * 处理主文件和附件的上传逻辑
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useTemplateContext } from '../types/context';
import { Attachment, UploadedAttachment } from '../types/state';

export function useFileUpload() {
  const { state, dispatch } = useTemplateContext();
  
  // 上传主文件
  const uploadMainFile = useCallback(async (file: File) => {
    console.log('uploadMainFile - 开始上传:', file.name);
    
    dispatch({ type: 'SET_UPLOADING', payload: true });
    dispatch({ type: 'SET_PARSE_PROGRESS', payload: 20 });
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch('/api/contract-templates/upload', {
        method: 'POST',
        body: formData,
      });
      
      const uploadData = await uploadRes.json();
      
      console.log('uploadMainFile - 上传结果:', uploadData);
      
      if (!uploadData.success) {
        throw new Error(uploadData.error || '上传失败');
      }
      
      // 修正：从 data 对象中读取 templateId 和 fileUrl
      const { templateId, fileUrl } = uploadData.data;
      
      console.log('uploadMainFile - 解析数据:', { templateId, fileUrl });
      
      dispatch({ type: 'SET_PARSE_PROGRESS', payload: 60 });
      dispatch({ type: 'SET_TEMPLATE_ID', payload: templateId });
      dispatch({ type: 'SET_MAIN_FILE', payload: { file, url: fileUrl, name: file.name } });
      
      console.log('uploadMainFile - 状态已更新:', {
        templateId,
        mainFileUrl: fileUrl,
      });
      
      toast.success('文件已上传，点击「下一步」解析文档');
      
      return {
        success: true,
        templateId,
        fileUrl,
      };
    } catch (err) {
      console.error('上传失败:', err);
      toast.error(err instanceof Error ? err.message : '上传失败');
      
      // 重置状态
      dispatch({ type: 'SET_MAIN_FILE', payload: { file: null, url: '', name: '' } });
      
      return { success: false };
    } finally {
      dispatch({ type: 'SET_UPLOADING', payload: false });
      dispatch({ type: 'SET_PARSE_PROGRESS', payload: 0 });
    }
  }, [dispatch]);
  
  // 上传附件
  const uploadAttachment = useCallback(async (file: File): Promise<UploadedAttachment | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch('/api/contract-templates/upload-attachment', {
        method: 'POST',
        body: formData,
      });
      
      const uploadData = await uploadRes.json();
      
      if (!uploadData.success) {
        throw new Error(uploadData.error || '上传附件失败');
      }
      
      return uploadData.data as UploadedAttachment;
    } catch (err) {
      console.error(`上传附件失败:`, err);
      toast.error(err instanceof Error ? err.message : '上传附件失败');
      return null;
    }
  }, []);
  
  // 批量上传附件
  const uploadAttachments = useCallback(async (files: File[]): Promise<UploadedAttachment[]> => {
    const results: UploadedAttachment[] = [];
    
    for (const file of files) {
      const result = await uploadAttachment(file);
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  }, [uploadAttachment]);
  
  // 处理文件选择
  const handleMainFileSelect = useCallback(async (file: File) => {
    const result = await uploadMainFile(file);
    return result;
  }, [uploadMainFile]);
  
  // 处理附件选择
  const handleAttachmentsSelect = useCallback(async (files: File[]) => {
    // 先添加到 attachments 状态
    const newAttachments: Attachment[] = files.map((file, index) => ({
      id: `temp_${Date.now()}_${index}`,
      name: file.name,
      displayName: file.name.replace(/\.[^/.]+$/, ''),
      url: '',
      file,
      order: state.attachments.length + index,
    }));
    
    dispatch({ type: 'SET_ATTACHMENTS', payload: [...state.attachments, ...newAttachments] });
    
    // 然后上传
    dispatch({ type: 'SET_UPLOADING', payload: true });
    
    const uploadedAttachments = await uploadAttachments(files);
    
    // 更新状态：将已上传的附件信息合并
    if (uploadedAttachments.length > 0) {
      const updatedAttachments = state.attachments.map(att => {
        if (att.file) {
          const uploaded = uploadedAttachments.find(u => u.name === att.file?.name);
          if (uploaded) {
            return {
              ...att,
              id: uploaded.id,
              url: uploaded.url,
              file: null, // 清除 file 对象
            };
          }
        }
        return att;
      });
      
      dispatch({ type: 'SET_ATTACHMENTS', payload: updatedAttachments });
      dispatch({ type: 'SET_UPLOADED_ATTACHMENTS', payload: [...state.uploadedAttachments, ...uploadedAttachments] });
    }
    
    dispatch({ type: 'SET_UPLOADING', payload: false });
    
    return uploadedAttachments;
  }, [state.attachments, state.uploadedAttachments, dispatch, uploadAttachments]);
  
  // 移除附件
  const removeAttachment = useCallback((attachmentId: string) => {
    dispatch({ type: 'REMOVE_ATTACHMENT', payload: attachmentId });
    dispatch({
      type: 'SET_UPLOADED_ATTACHMENTS',
      payload: state.uploadedAttachments.filter(a => a.id !== attachmentId),
    });
  }, [state.uploadedAttachments, dispatch]);
  
  return {
    uploading: state.uploading,
    parseProgress: state.parseProgress,
    mainFile: state.mainFile,
    mainFileUrl: state.mainFileUrl,
    mainFileName: state.mainFileName,
    attachments: state.attachments,
    uploadedAttachments: state.uploadedAttachments,
    
    uploadMainFile,
    uploadAttachment,
    uploadAttachments,
    handleMainFileSelect,
    handleAttachmentsSelect,
    removeAttachment,
  };
}
