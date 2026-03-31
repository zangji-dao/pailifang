/**
 * 合同模板系统类型定义
 */

// ============ 基础类型 ============

/** 文档类型 */
export type DocumentType = 'pdf' | 'docx' | 'doc';

/** 解析状态 */
export type ParseStatus = 'pending' | 'parsing' | 'completed' | 'failed';

/** 字段类型 */
export type FieldType = 'text' | 'date' | 'number' | 'select' | 'textarea';

/** 合同实例状态 */
export type ContractStatus = 'draft' | 'pending' | 'signed' | 'archived';

// ============ 合同模板 ============

/** 样式配置 */
export interface TemplateStyleConfig {
  pageSize: 'A4' | 'A5' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  font: {
    family: string;
    size: number;
    lineHeight: number;
  };
  titleFont: {
    family: string;
    size: number;
    weight: 'normal' | 'bold';
  };
  colors: {
    primary: string;
    secondary: string;
    text: string;
    border: string;
    headerBg: string;
  };
  layout: {
    showLogo: boolean;
    logoPosition: 'left' | 'center' | 'right';
    showPageNumber: boolean;
    pageNumberPosition: 'left' | 'center' | 'right';
    headerHeight: number;
    footerHeight: number;
  };
  clauseStyle: {
    numberingStyle: 'decimal' | 'lower-alpha' | 'upper-alpha' | 'lower-roman' | 'upper-roman';
    indent: number;
    spacing: number;
  };
}

/** 模板条款 */
export interface TemplateClause {
  id: string;
  title: string;
  content: string;
  order: number;
  required: boolean;
  editable: boolean;
}

/** 合同附件 */
export interface ContractAttachment {
  id: string;
  template_id: string;
  name: string;
  description?: string;
  content_html?: string;
  source_file_url?: string;
  source_file_name?: string;
  page_range?: string;
  auto_detected?: boolean;
  required: boolean;
  order: number;
}

/** 合同模板 */
export interface ContractTemplate {
  id: string;
  name: string;
  description: string | null;
  type: string;
  style_config: TemplateStyleConfig;
  clauses: TemplateClause[];
  attachments?: ContractAttachment[];
  source_file_url?: string;
  source_file_name?: string;
  source_file_type?: DocumentType;
  parse_status?: ParseStatus;
  parse_error?: string;
  field_definitions?: ContractFieldDefinition[];
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

// ============ 可填充字段 ============

/** 字段位置提示 */
export interface FieldPositionHint {
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

/** Select选项 */
export interface SelectOption {
  value: string;
  label: string;
}

/** 可填充字段定义 */
export interface ContractField {
  id: string;
  template_id: string;
  field_key: string;
  field_label: string;
  field_type: FieldType;
  default_value?: string;
  options?: SelectOption[];
  required: boolean;
  placeholder?: string;
  position_hint?: FieldPositionHint;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** 字段定义（用于模板创建时） */
export interface ContractFieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  defaultValue?: string;
  options?: SelectOption[];
  required?: boolean;
  placeholder?: string;
}

// ============ 合同实例 ============

/** 合同实例 */
export interface ContractInstance {
  id: string;
  template_id: string;
  enterprise_id?: string;
  contract_number?: string;
  field_values: Record<string, string | number>;
  selected_attachments: string[];
  status: ContractStatus;
  pdf_url?: string;
  signed_pdf_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ============ 文档解析 ============

/** 解析后的文档页面 */
export interface ParsedPage {
  pageNumber: number;
  text: string;
  html?: string;
  hasTables: boolean;
  hasImages: boolean;
}

/** 识别出的附件 */
export interface DetectedAttachment {
  id: string;
  name: string;           // 如 "附件一：服务标准清单"
  startPage: number;
  endPage: number;
  pageRange: string;      // 如 "6-10"
  confidence: number;     // 识别置信度 0-1
  content: string;        // 提取的文本内容
}

/** 解析后的附件文档 */
export interface ParsedAttachment {
  id: string;
  name: string;           // 文件名
  displayName: string;    // 显示名称（不含扩展名）
  html: string;           // HTML内容
  text: string;           // 纯文本内容
  order: number;          // 排序
}

/** 解析结果 */
export interface ParseResult {
  success: boolean;
  error?: string;
  
  // 基本信息
  totalPages: number;
  fileName: string;
  fileType: DocumentType;
  
  // 解析内容 - 主文档
  pages: ParsedPage[];
  fullText: string;
  html?: string;  // 主文档HTML格式内容（用于预览）
  
  // 附件文档 - 分开展示
  attachments: ParsedAttachment[];
  
  // 识别结果
  detectedAttachments: DetectedAttachment[];
  
  // 识别的可填充字段
  detectedFields: ContractFieldDefinition[];
  
  // 主合同信息
  mainContract: {
    startPage: number;
    endPage: number;
    pageRange: string;
    content: string;
  };
}

/** 上传进度 */
export interface UploadProgress {
  status: 'uploading' | 'parsing' | 'completed' | 'error';
  progress: number;       // 0-100
  message: string;
  result?: ParseResult;
}

// ============ API 请求/响应 ============

/** 创建模板请求 */
export interface CreateTemplateRequest {
  name: string;
  description?: string;
  type: string;
  style_config?: Partial<TemplateStyleConfig>;
  clauses?: TemplateClause[];
}

/** 上传文档请求 */
export interface UploadDocumentRequest {
  file: File;
  templateId?: string;     // 如果是更新现有模板
}

/** 上传文档响应 */
export interface UploadDocumentResponse {
  success: boolean;
  error?: string;
  templateId?: string;
  parseResult?: ParseResult;
}

/** 确认附件拆分请求 */
export interface ConfirmAttachmentsRequest {
  templateId: string;
  attachments: {
    name: string;
    startPage: number;
    endPage: number;
  }[];
}

/** 保存字段定义请求 */
export interface SaveFieldsRequest {
  templateId: string;
  fields: ContractFieldDefinition[];
}

/** 生成合同请求 */
export interface GenerateContractRequest {
  templateId: string;
  enterpriseId: string;
  fieldValues: Record<string, string | number>;
  selectedAttachments: string[];
}

/** 生成合同响应 */
export interface GenerateContractResponse {
  success: boolean;
  error?: string;
  instanceId?: string;
  contractNumber?: string;
  pdfUrl?: string;
}
