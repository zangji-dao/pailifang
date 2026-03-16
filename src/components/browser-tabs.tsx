"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// 标签页数据结构
export interface BrowserTab {
  id: string;
  label: string;
  content?: ReactNode;
  icon?: ReactNode;
  closable?: boolean;
}

// 标签页上下文类型
export interface BrowserTabsContextType {
  tabs: BrowserTab[];
  activeTabId: string;
  openTab: (tab: Omit<BrowserTab, "closable"> & { closable?: boolean }) => void;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  updateTabLabel: (tabId: string, label: string) => void;
  getActiveTab: () => BrowserTab | undefined;
}

const BrowserTabsContext = createContext<BrowserTabsContextType | null>(null);

export const useBrowserTabs = () => {
  const context = useContext(BrowserTabsContext);
  return context;
};

// 标签页栏组件 Props
interface BrowserTabsBarProps {
  className?: string;
  onAddTab?: () => void;
  showAddButton?: boolean;
}

// 标签页栏组件
export function BrowserTabsBar({ className, onAddTab, showAddButton = false }: BrowserTabsBarProps) {
  const context = useBrowserTabs();
  if (!context) return null;

  const { tabs, activeTabId, switchTab, closeTab } = context;

  return (
    <div className={cn("flex items-center bg-white border-b border-slate-200/60 px-2 shrink-0", className)}>
      <div className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              "group flex items-center gap-1.5 px-3.5 py-2 text-sm cursor-pointer transition-all border-b-2 whitespace-nowrap select-none",
              activeTabId === tab.id
                ? "text-amber-600 border-amber-500 bg-amber-50/50"
                : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100/50"
            )}
            onClick={() => switchTab(tab.id)}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span className="max-w-[140px] truncate">{tab.label}</span>
            {tab.closable && tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="ml-0.5 p-0.5 rounded hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 新建标签按钮 */}
      {showAddButton && onAddTab && (
        <button
          onClick={onAddTab}
          className="h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0 ml-1"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// 标签页内容区域组件
export function BrowserTabsContent({ className }: { className?: string }) {
  const context = useBrowserTabs();
  if (!context) return null;

  const { tabs, activeTabId } = context;
  const activeTab = tabs.find((t) => t.id === activeTabId);

  if (!activeTab?.content) return null;

  return (
    <div className={cn("flex-1 overflow-auto", className)}>
      {activeTab.content}
    </div>
  );
}

// 获取当前激活标签页的内容
export function useActiveTabContent() {
  const context = useBrowserTabs();
  if (!context) return null;
  
  const { tabs, activeTabId } = context;
  return tabs.find((t) => t.id === activeTabId)?.content;
}

// 标签页 Provider Props
interface BrowserTabsProviderProps {
  children: ReactNode;
  defaultTabs?: BrowserTab[];
  defaultActiveId?: string;
  onChange?: (tabId: string) => void;
}

// 标签页 Provider
export function BrowserTabsProvider({
  children,
  defaultTabs = [],
  defaultActiveId,
  onChange,
}: BrowserTabsProviderProps) {
  const [tabs, setTabs] = useState<BrowserTab[]>(defaultTabs);
  const [activeTabId, setActiveTabId] = useState<string>(
    defaultActiveId || defaultTabs[0]?.id || ""
  );

  const openTab = useCallback((tab: Omit<BrowserTab, "closable"> & { closable?: boolean }) => {
    const newTab: BrowserTab = {
      ...tab,
      closable: tab.closable ?? true,
    };

    setTabs((prev) => {
      const existingTab = prev.find((t) => t.id === newTab.id);
      if (existingTab) {
        setActiveTabId(existingTab.id);
        return prev;
      }
      return [...prev, newTab];
    });

    setActiveTabId(newTab.id);
    onChange?.(newTab.id);
  }, [onChange]);

  const closeTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      const tabIndex = prev.findIndex((t) => t.id === tabId);
      const newTabs = prev.filter((t) => t.id !== tabId);

      if (activeTabId === tabId && newTabs.length > 0) {
        const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
        const newActiveTab = newTabs[newActiveIndex];
        setActiveTabId(newActiveTab.id);
        onChange?.(newActiveTab.id);
      }

      return newTabs;
    });
  }, [activeTabId, onChange]);

  const switchTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
    onChange?.(tabId);
  }, [onChange]);

  const updateTabLabel = useCallback((tabId: string, label: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, label } : t))
    );
  }, []);

  const getActiveTab = useCallback(() => {
    return tabs.find((t) => t.id === activeTabId);
  }, [tabs, activeTabId]);

  return (
    <BrowserTabsContext.Provider
      value={{
        tabs,
        activeTabId,
        openTab,
        closeTab,
        switchTab,
        updateTabLabel,
        getActiveTab,
      }}
    >
      {children}
    </BrowserTabsContext.Provider>
  );
}

// 导出上下文
export { BrowserTabsContext };
