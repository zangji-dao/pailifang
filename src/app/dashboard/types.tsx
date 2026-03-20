import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

/**
 * 用户信息类型
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

/**
 * 标签页类型
 */
export interface Tab {
  id: string;
  label: string;
  path: string;
  icon?: ReactNode;
  closable: boolean;
  group?: string;
}

/**
 * 标签页上下文类型
 */
export interface TabsContextType {
  tabs: Tab[];
  activeTab: string;
  openTab: (tab: Omit<Tab, "closable"> & { closable?: boolean }) => void;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  updateTabLabel: (tabId: string, label: string) => void;
}

/**
 * 导航子菜单项类型
 */
export interface NavChildItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string | null;
}

/**
 * 导航菜单项类型
 */
export interface NavItem {
  name: string;
  href?: string;
  icon: LucideIcon;
  badge?: string | null;
  expandable?: boolean;
  children?: NavChildItem[];
}

/**
 * 展开菜单状态类型
 */
export type ExpandedMenusState = Record<string, boolean>;

/**
 * 角色名称映射类型
 */
export type RoleMap = Record<string, string>;
