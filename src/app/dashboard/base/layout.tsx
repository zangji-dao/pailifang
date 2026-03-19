"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X, Plus, Building2, Users, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsContext, Tab } from "./tabs-context";

// 根据路径获取标签页配置
const getTabConfig = (path: string): Tab | null => {
  // 物业运营中心首页
  if (path === "/dashboard/base" || path === "/dashboard/base/sites") {
    return {
      id: "sites-list",
      label: "物业运营中心",
      path: "/dashboard/base/sites",
      icon: <Building2 className="h-3.5 w-3.5" />,
      closable: false,
    };
  }
  
  // 入驻企业页面
  if (path === "/dashboard/base/tenants") {
    return {
      id: "tenants",
      label: "入驻企业",
      path: "/dashboard/base/tenants",
      icon: <Users className="h-3.5 w-3.5" />,
      closable: true,
    };
  }
  
  // 基地详情页 - 需要提取基地名称
  const detailMatch = path.match(/^\/dashboard\/base\/sites\/([^/]+)(\/.*)?$/);
  if (detailMatch) {
    const baseId = detailMatch[1];
    return {
      id: `base-${baseId}`,
      label: "基地详情",
      path: path,
      icon: <Home className="h-3.5 w-3.5" />,
      closable: true,
    };
  }
  
  return null;
};

interface BaseLayoutProps {
  children: ReactNode;
}

export default function BaseLayout({ children }: BaseLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  // 默认标签页（不可关闭）
  const defaultTabs: Tab[] = [
    {
      id: "sites-list",
      label: "物业运营中心",
      path: "/dashboard/base/sites",
      icon: <Building2 className="h-3.5 w-3.5" />,
      closable: false,
    },
  ];

  const [tabs, setTabs] = useState<Tab[]>(defaultTabs);
  const [activeTab, setActiveTab] = useState<string>("sites-list");

  // 打开新标签页
  const openTab = useCallback((tab: Omit<Tab, "closable"> & { closable?: boolean }) => {
    const newTab: Tab = {
      ...tab,
      closable: tab.closable ?? true,
    };
    
    setTabs((prev) => {
      const existingTab = prev.find((t) => t.path === newTab.path || t.id === newTab.id);
      if (existingTab) {
        setActiveTab(existingTab.id);
        return prev;
      }
      return [...prev, newTab];
    });
    
    setActiveTab(newTab.id);
    router.push(newTab.path);
  }, [router]);

  // 关闭标签页
  const closeTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      const tabIndex = prev.findIndex((t) => t.id === tabId);
      const newTabs = prev.filter((t) => t.id !== tabId);

      if (activeTab === tabId && newTabs.length > 0) {
        const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
        const newActiveTab = newTabs[newActiveIndex];
        setActiveTab(newActiveTab.id);
        router.push(newActiveTab.path);
      }

      return newTabs;
    });
  }, [activeTab, router]);

  // 切换标签页
  const switchTab = useCallback((tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      setActiveTab(tabId);
      router.push(tab.path);
    }
  }, [tabs, router]);

  // 更新标签页标题
  const updateTabLabel = useCallback((tabId: string, label: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, label } : t))
    );
  }, []);

  // 监听路径变化，自动同步标签页
  useEffect(() => {
    const tabConfig = getTabConfig(pathname);
    if (tabConfig) {
      setTabs((prev) => {
        const existingTab = prev.find((t) => t.path === tabConfig!.path);
        if (!existingTab) {
          return [...prev, tabConfig!];
        }
        return prev;
      });
      
      const existingTab = tabs.find((t) => t.path === pathname);
      if (existingTab) {
        setActiveTab(existingTab.id);
      } else {
        setActiveTab(tabConfig.id);
      }
    }
  }, [pathname]);

  return (
    <TabsContext.Provider value={{ tabs, activeTab, openTab, closeTab, switchTab, updateTabLabel }}>
      <div className="h-full flex flex-col bg-slate-50/30">
        {/* 标签页栏 */}
        <div className="flex items-center bg-white border-b border-slate-200/60 px-3 pt-2 shrink-0">
          <div className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`group flex items-center gap-1.5 px-3.5 py-2 text-sm cursor-pointer transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-amber-600 border-amber-500 bg-amber-50/50"
                    : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100/50"
                }`}
                onClick={() => switchTab(tab.id)}
              >
                {tab.icon}
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

          {/* 新建标签按钮 - 打开入驻企业 */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0 ml-1"
            onClick={() => {
              openTab({
                id: "tenants",
                label: "入驻企业",
                path: "/dashboard/base/tenants",
                icon: <Users className="h-3.5 w-3.5" />,
              });
            }}
            title="入驻企业管理"
          >
            <Users className="h-4 w-4" />
          </Button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </TabsContext.Provider>
  );
}
