/**
 * 合同模板创建页面的全局状态 Context
 */

'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import { TemplateState, TemplateAction } from './state';
import { templateReducer, initialState } from './reducer';

// Context 类型
interface TemplateContextType {
  state: TemplateState;
  dispatch: React.Dispatch<TemplateAction>;
}

// 创建 Context
const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

// Provider 组件
export function TemplateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(templateReducer, initialState);
  
  return (
    <TemplateContext.Provider value={{ state, dispatch }}>
      {children}
    </TemplateContext.Provider>
  );
}

// 自定义 Hook
export function useTemplateContext() {
  const context = useContext(TemplateContext);
  if (context === undefined) {
    throw new Error('useTemplateContext must be used within a TemplateProvider');
  }
  return context;
}

// 导出类型
export type { TemplateState, TemplateAction };
