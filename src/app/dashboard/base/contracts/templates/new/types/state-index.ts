/**
 * 类型统一导出
 */

// 导出所有类型
export type {
  Base,
  Attachment,
  UploadedAttachment,
  Marker,
  Variable,
  Binding,
  ParseResult,
  DraftData,
  TemplateState,
  TemplateAction,
} from './state';

// 导出 Context
export { TemplateProvider, useTemplateContext } from './context';

// 导出 Reducer
export { templateReducer, initialState } from './reducer';
