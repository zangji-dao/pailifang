/**
 * 合同模板创建页面的状态类型定义
 * 复用现有的类型定义，避免类型冲突
 */

// 从现有类型导入
import type { 
  ParseResult, 
  DocumentType,
  ContractFieldDefinition 
} from '@/types/contract-template';

// 基础类型
export interface Base {
  id: string;
  name: string;
  address: string | null; // 修改为兼容现有类型
}

// 附件类型（兼容现有的 AttachmentFile）
export interface Attachment {
  id: string;
  name: string;
  displayName?: string;
  url: string;
  file?: File | null;
  html?: string;
  styles?: string;
  text?: string;
  order: number;
}

export interface UploadedAttachment {
  id: string;
  name: string;
  url: string;
  fileType: string;
  size?: number; // 可选，与 types.ts 保持一致
}

// 变量标记类型
export interface Marker {
  id: string;
  documentId: string; // 'main' 或附件ID
  variableKey: string;
  status: 'pending' | 'bound' | 'error';
  position: {
    start: number;
    end: number;
  };
}

// 变量类型
export interface Variable {
  id: string;
  key: string;
  name: string;
  type: 'text' | 'date' | 'number' | 'select';
  category: 'enterprise' | 'contract' | 'custom';
  placeholder?: string;
  options?: string[];
}

// 变量绑定类型
export interface Binding {
  markerId: string;
  variableKey: string;
}

// 草稿数据类型
export interface DraftData {
  currentStep: number;
  editedHtml: string;
  styles: string;
  markers: Marker[];
  selectedVariables: Variable[];
  bindings: Binding[];
  attachments: Attachment[];
  uploadedAttachments: UploadedAttachment[];
  original_template_id?: string;
  // 原始解析的 HTML（用于恢复时显示）
  originalHtml?: string;
}

// 模板状态
export interface TemplateState {
  // 当前步骤
  currentStep: number;
  
  // 模板基本信息
  templateId: string;
  name: string;
  description: string;
  type: 'tenant' | 'service' | 'lease' | 'other';
  baseId: string;
  isDefault: boolean;
  
  // 文件信息
  mainFile: File | null;
  mainFileUrl: string;
  mainFileName: string;
  
  // 上传状态
  uploading: boolean;
  parsing: boolean;
  parseProgress: number;
  parseError: string | null;
  
  // 解析结果（使用现有类型）
  parseResult: ParseResult | null;
  editedHtml: string;
  
  // 变量管理
  markers: Marker[];
  selectedVariables: Variable[];
  bindings: Binding[];
  
  // 附件管理
  attachments: Attachment[];
  uploadedAttachments: UploadedAttachment[];
  
  // 加载状态
  loadingDraft: boolean;
  saving: boolean;
  savingDraft: boolean;
  isDraft: boolean;
  
  // 基地列表
  bases: Base[];
  loadingBases: boolean;
  
  // 预览缩放
  previewZoom: number;
}

// Action 类型
export type TemplateAction =
  // 步骤相关
  | { type: 'SET_STEP'; payload: number }
  
  // 基本信息
  | { type: 'SET_TEMPLATE_ID'; payload: string }
  | { type: 'SET_NAME'; payload: string }
  | { type: 'SET_DESCRIPTION'; payload: string }
  | { type: 'SET_TYPE'; payload: 'tenant' | 'service' | 'lease' | 'other' }
  | { type: 'SET_BASE_ID'; payload: string }
  | { type: 'SET_IS_DEFAULT'; payload: boolean }
  
  // 文件相关
  | { type: 'SET_MAIN_FILE'; payload: { file: File | null; url: string; name: string } }
  | { type: 'SET_UPLOADING'; payload: boolean }
  | { type: 'SET_PARSING'; payload: boolean }
  | { type: 'SET_PARSE_PROGRESS'; payload: number }
  | { type: 'SET_PARSE_ERROR'; payload: string | null }
  
  // 解析结果
  | { type: 'SET_PARSE_RESULT'; payload: ParseResult | null }
  | { type: 'SET_EDITED_HTML'; payload: string }
  
  // 变量相关
  | { type: 'SET_MARKERS'; payload: Marker[] }
  | { type: 'ADD_MARKER'; payload: Marker }
  | { type: 'REMOVE_MARKER'; payload: string }
  | { type: 'SET_SELECTED_VARIABLES'; payload: Variable[] }
  | { type: 'SET_BINDINGS'; payload: Binding[] }
  
  // 附件相关
  | { type: 'SET_ATTACHMENTS'; payload: Attachment[] }
  | { type: 'ADD_ATTACHMENT'; payload: Attachment }
  | { type: 'REMOVE_ATTACHMENT'; payload: string }
  | { type: 'SET_UPLOADED_ATTACHMENTS'; payload: UploadedAttachment[] }
  
  // 状态相关
  | { type: 'SET_LOADING_DRAFT'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_SAVING_DRAFT'; payload: boolean }
  | { type: 'SET_IS_DRAFT'; payload: boolean }
  
  // 基地相关
  | { type: 'SET_BASES'; payload: Base[] }
  | { type: 'SET_LOADING_BASES'; payload: boolean }
  
  // 预览相关
  | { type: 'SET_PREVIEW_ZOOM'; payload: number }
  
  // 批量更新
  | { type: 'LOAD_DRAFT'; payload: Partial<TemplateState> }
  | { type: 'RESET_STATE' };

// 重新导出现有类型，供其他文件使用
export type { ParseResult, DocumentType, ContractFieldDefinition };

