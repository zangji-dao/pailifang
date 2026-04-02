/**
 * 合同模板状态管理的 Reducer
 */

import { TemplateState, TemplateAction } from './state';

// 初始状态
export const initialState: TemplateState = {
  // 当前步骤
  currentStep: 1,
  
  // 模板基本信息
  templateId: '',
  name: '',
  description: '',
  type: 'tenant',
  baseId: '',
  isDefault: false,
  
  // 文件信息
  mainFile: null,
  mainFileUrl: '',
  mainFileName: '',
  
  // 上传状态
  uploading: false,
  parsing: false,
  parseProgress: 0,
  parseError: null,
  
  // 解析结果
  parseResult: null,
  editedHtml: '',
  
  // 变量管理
  markers: [],
  selectedVariables: [],
  bindings: [],
  
  // 附件管理
  attachments: [],
  uploadedAttachments: [],
  
  // 加载状态
  loadingDraft: false,
  saving: false,
  savingDraft: false,
  isDraft: false,
  
  // 基地列表
  bases: [],
  loadingBases: false,
  
  // 预览缩放
  previewZoom: 100,
};

// Reducer 函数
export function templateReducer(state: TemplateState, action: TemplateAction): TemplateState {
  // 添加调试日志
  if (action.type === 'SET_MAIN_FILE' || action.type === 'SET_TEMPLATE_ID') {
    console.log('reducer - 处理 action:', action.type, action.payload);
  }
  
  switch (action.type) {
    // 步骤相关
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    
    // 基本信息
    case 'SET_TEMPLATE_ID':
      return { ...state, templateId: action.payload };
    case 'SET_NAME':
      return { ...state, name: action.payload };
    case 'SET_DESCRIPTION':
      return { ...state, description: action.payload };
    case 'SET_TYPE':
      return { ...state, type: action.payload };
    case 'SET_BASE_ID':
      return { ...state, baseId: action.payload };
    case 'SET_IS_DEFAULT':
      return { ...state, isDefault: action.payload };
    
    // 文件相关
    case 'SET_MAIN_FILE':
      console.log('reducer - SET_MAIN_FILE:', {
        mainFile: action.payload.file,
        mainFileUrl: action.payload.url,
        mainFileName: action.payload.name,
      });
      return {
        ...state,
        mainFile: action.payload.file,
        mainFileUrl: action.payload.url,
        mainFileName: action.payload.name,
      };
    case 'SET_UPLOADING':
      return { ...state, uploading: action.payload };
    case 'SET_PARSING':
      return { ...state, parsing: action.payload };
    case 'SET_PARSE_PROGRESS':
      return { ...state, parseProgress: action.payload };
    case 'SET_PARSE_ERROR':
      return { ...state, parseError: action.payload };
    
    // 解析结果
    case 'SET_PARSE_RESULT':
      return { ...state, parseResult: action.payload };
    case 'SET_EDITED_HTML':
      return { ...state, editedHtml: action.payload };
    
    // 变量相关
    case 'SET_MARKERS':
      return { ...state, markers: action.payload };
    case 'ADD_MARKER':
      return { ...state, markers: [...state.markers, action.payload] };
    case 'REMOVE_MARKER':
      return {
        ...state,
        markers: state.markers.filter(m => m.id !== action.payload),
      };
    case 'SET_SELECTED_VARIABLES':
      return { ...state, selectedVariables: action.payload };
    case 'SET_BINDINGS':
      return { ...state, bindings: action.payload };
    
    // 附件相关
    case 'SET_ATTACHMENTS':
      return { ...state, attachments: action.payload };
    case 'ADD_ATTACHMENT':
      return { ...state, attachments: [...state.attachments, action.payload] };
    case 'REMOVE_ATTACHMENT':
      return {
        ...state,
        attachments: state.attachments.filter(a => a.id !== action.payload),
      };
    case 'SET_UPLOADED_ATTACHMENTS':
      return { ...state, uploadedAttachments: action.payload };
    
    // 状态相关
    case 'SET_LOADING_DRAFT':
      return { ...state, loadingDraft: action.payload };
    case 'SET_SAVING':
      return { ...state, saving: action.payload };
    case 'SET_SAVING_DRAFT':
      return { ...state, savingDraft: action.payload };
    case 'SET_IS_DRAFT':
      return { ...state, isDraft: action.payload };
    
    // 基地相关
    case 'SET_BASES':
      return { ...state, bases: action.payload };
    case 'SET_LOADING_BASES':
      return { ...state, loadingBases: action.payload };
    
    // 预览相关
    case 'SET_PREVIEW_ZOOM':
      return { ...state, previewZoom: action.payload };
    
    // 批量更新
    case 'LOAD_DRAFT':
      return { ...state, ...action.payload };
    
    // 重置状态
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}
