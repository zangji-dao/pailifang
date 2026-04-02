/**
 * 草稿管理 Hook
 * 处理草稿的保存、加载、恢复逻辑
 */

import { useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useTemplateContext } from '../types/context';
import { DraftData } from '../types/state';

export function useDraft() {
  const { state, dispatch } = useTemplateContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftLoadedRef = useRef(false);
  
  // 保存草稿
  const saveDraft = useCallback(async (silent = false) => {
    if (!state.templateId) {
      if (!silent) {
        toast.error('请先上传文档');
      }
      return null;
    }
    
    dispatch({ type: 'SET_SAVING_DRAFT', payload: true });
    
    try {
      const draftData: DraftData = {
        currentStep: state.currentStep,
        editedHtml: state.editedHtml,
        styles: state.parseResult?.styles || '',
        markers: state.markers,
        selectedVariables: state.selectedVariables,
        bindings: state.bindings,
        attachments: state.parseResult?.attachments || [],
        uploadedAttachments: state.uploadedAttachments,
      };
      
      const response = await fetch('/api/contract-templates/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: state.templateId,
          name: state.name,
          description: state.description,
          type: state.type,
          base_id: state.baseId,
          currentStep: state.currentStep,
          editedHtml: state.editedHtml,
          markers: state.markers,
          selectedVariables: state.selectedVariables,
          bindings: state.bindings,
          source_file_url: state.mainFileUrl,
          source_file_name: state.mainFileName,
          source_file_type: 'docx',
          styles: state.parseResult?.styles || '',
          attachments: state.parseResult?.attachments || [],
          uploadedAttachments: state.uploadedAttachments,
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '保存失败');
      }
      
      if (!silent) {
        toast.success('已保存');
      }
      
      return result.data.id;
    } catch (err) {
      console.error('保存草稿失败:', err);
      if (!silent) {
        toast.error(err instanceof Error ? err.message : '保存失败');
      }
      return null;
    } finally {
      dispatch({ type: 'SET_SAVING_DRAFT', payload: false });
    }
  }, [state, dispatch]);
  
  // 加载草稿
  const loadDraft = useCallback(async (draftId: string) => {
    dispatch({ type: 'SET_LOADING_DRAFT', payload: true });
    
    try {
      const response = await fetch(`/api/contract-templates/draft?id=${draftId}`);
      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || '加载草稿失败');
      }
      
      const template = result.data;
      
      // 恢复状态
      dispatch({
        type: 'LOAD_DRAFT',
        payload: {
          templateId: template.id,
          name: template.name || '',
          description: template.description || '',
          type: template.type || 'tenant',
          baseId: template.base_id || '',
          currentStep: template.draft_data?.currentStep || 1,
          editedHtml: template.draft_data?.editedHtml || '',
          markers: template.draft_data?.markers || [],
          selectedVariables: template.draft_data?.selectedVariables || [],
          bindings: template.draft_data?.bindings || [],
          uploadedAttachments: template.draft_data?.uploadedAttachments || [],
          mainFileUrl: template.source_file_url || '',
          mainFileName: template.source_file_name || '',
          isDraft: true,
        },
      });
      
      // 如果有解析结果，恢复
      if (template.source_file_url && template.draft_data) {
        const parseResult = {
          success: true,
          totalPages: 1,
          fileName: template.source_file_name || '合同文档',
          fileType: template.source_file_type || 'docx',
          fileUrl: template.source_file_url,
          pages: [],
          fullText: '',
          html: template.draft_data?.editedHtml || '',
          styles: template.draft_data?.styles || '',
          attachments: template.draft_data?.attachments || [],
          detectedAttachments: [],
          detectedFields: [],
          mainContract: { startPage: 1, endPage: 1, pageRange: '1', content: '' },
        };
        
        dispatch({ type: 'SET_PARSE_RESULT', payload: parseResult });
      }
      
      toast.success('草稿已加载');
      
      return true;
    } catch (err) {
      console.error('加载草稿失败:', err);
      toast.error(err instanceof Error ? err.message : '加载草稿失败');
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING_DRAFT', payload: false });
    }
  }, [dispatch]);
  
  // 初始化时加载草稿（如果有）
  useEffect(() => {
    const loadInitialDraft = async () => {
      const draftId = searchParams.get('draftId');
      const templateIdParam = searchParams.get('templateId');
      
      if (!draftId && !templateIdParam) return;
      if (draftLoadedRef.current) return;
      
      draftLoadedRef.current = true;
      
      if (draftId) {
        await loadDraft(draftId);
      } else if (templateIdParam) {
        // TODO: 加载已发布模板的逻辑
        await loadDraft(templateIdParam);
      }
    };
    
    loadInitialDraft();
  }, [searchParams, loadDraft]);
  
  return {
    loadingDraft: state.loadingDraft,
    savingDraft: state.savingDraft,
    isDraft: state.isDraft,
    saveDraft,
    loadDraft,
  };
}
