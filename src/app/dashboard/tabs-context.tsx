"use client";

import { createContext, useContext, ReactNode } from "react";

// 标签页数据结构
export interface Tab {
  id: string;
  label: string;
  path: string;
  icon?: ReactNode;
  closable?: boolean;
  group?: string; // 所属模块分组，用于识别一级菜单
}

// 标签页上下文
export interface TabsContextType {
  tabs: Tab[];
  activeTab: string;
  openTab: (tab: Omit<Tab, "closable"> & { closable?: boolean }) => void;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  updateTabLabel: (tabId: string, label: string) => void;
}

export const TabsContext = createContext<TabsContextType | null>(null);

export const useTabs = () => {
  const context = useContext(TabsContext);
  return context;
};
