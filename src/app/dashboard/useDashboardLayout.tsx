"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { User, Tab, ExpandedMenusState } from "./types";
import { getTabConfig } from "./tab-config";

/**
 * 默认工作台标签页
 */
const DEFAULT_TAB: Tab = {
  id: "dashboard",
  label: "工作台",
  path: "/dashboard",
  icon: <LayoutDashboard className="h-3.5 w-3.5" />,
  closable: false,
};

/**
 * Dashboard 布局状态管理 Hook
 * @returns 用户信息、标签页状态、侧边栏状态及操作方法
 */
export function useDashboardLayout() {
  const router = useRouter();
  const pathname = usePathname();

  // 用户状态
  const [user, setUser] = useState<User | null>(null);

  // 侧边栏状态
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 展开菜单状态
  const [expandedMenus, setExpandedMenus] = useState<ExpandedMenusState>(() => ({
    "账务中心": pathname?.startsWith("/accounting") || false,
    "工单管理": pathname?.startsWith("/dashboard/orders") || false,
    "销售中心": pathname?.startsWith("/dashboard/sales") || false,
    "人力资源": pathname?.startsWith("/dashboard/hr") || false,
    "基地管理": pathname?.startsWith("/dashboard/base") || false,
  }));

  // 当路由变化时，自动展开对应的菜单（仅当菜单从未被手动操作过时）
  useEffect(() => {
    // 不再强制展开，尊重用户的手动操作
    // 如果需要自动展开，可以取消下面的注释
    // setExpandedMenus((prev) => ({
    //   ...prev,
    //   "账务中心": prev["账务中心"] || pathname?.startsWith("/accounting") || false,
    //   "工单管理": prev["工单管理"] || pathname?.startsWith("/dashboard/orders") || false,
    //   "销售中心": prev["销售中心"] || pathname?.startsWith("/dashboard/sales") || false,
    //   "人力资源": prev["人力资源"] || pathname?.startsWith("/dashboard/hr") || false,
    //   "基地管理": prev["基地管理"] || pathname?.startsWith("/dashboard/base") || false,
    // }));
  }, [pathname]);

  // 标签页状态
  const [tabs, setTabs] = useState<Tab[]>([DEFAULT_TAB]);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // 打开新标签页
  const openTab = useCallback(
    (tab: Omit<Tab, "closable"> & { closable?: boolean }) => {
      const newTab: Tab = {
        ...tab,
        closable: tab.closable ?? true,
      };

      setTabs((prev) => {
        const existingTab = prev.find((t) => t.path === newTab.path || t.id === newTab.id);
        return existingTab ? prev : [...prev, newTab];
      });

      setActiveTab(newTab.id);
      router.push(newTab.path);
    },
    [router]
  );

  // 关闭标签页
  const closeTab = useCallback(
    (tabId: string) => {
      const tabIndex = tabs.findIndex((t) => t.id === tabId);
      const newTabs = tabs.filter((t) => t.id !== tabId);

      setTabs(newTabs);

      // 如果关闭的是当前激活的标签页，切换到相邻标签页
      if (activeTab === tabId && newTabs.length > 0) {
        const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
        const newActiveTab = newTabs[newActiveIndex];
        setActiveTab(newActiveTab.id);
        router.push(newActiveTab.path);
      }
    },
    [activeTab, router, tabs]
  );

  // 切换标签页
  const switchTab = useCallback(
    (tabId: string) => {
      const tab = tabs.find((t) => t.id === tabId);
      if (tab) {
        setActiveTab(tabId);
        router.push(tab.path);
      }
    },
    [tabs, router]
  );

  // 更新标签页标题
  const updateTabLabel = useCallback((tabId: string, label: string) => {
    setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, label } : t)));
  }, []);

  // 关闭当前标签页并导航到目标页面
  // 用于完成创建后关闭新建标签页，跳转到列表页或详情页
  const closeCurrentTabAndNavigate = useCallback(
    (targetPath: string, targetLabel?: string) => {
      const currentTabId = activeTab;
      const currentTabIndex = tabs.findIndex((t) => t.id === currentTabId);
      
      // 关闭当前标签页
      const newTabs = tabs.filter((t) => t.id !== currentTabId);
      setTabs(newTabs);
      
      // 如果目标路径已存在标签页，切换到该标签页
      const existingTab = newTabs.find((t) => t.path === targetPath);
      if (existingTab) {
        setActiveTab(existingTab.id);
        router.push(existingTab.path);
      } else {
        // 计算新的激活标签页索引
        const newActiveIndex = Math.min(currentTabIndex, newTabs.length - 1);
        if (newTabs.length > 0 && newActiveIndex >= 0) {
          // 切换到相邻标签页
          const newActiveTab = newTabs[newActiveIndex];
          setActiveTab(newActiveTab.id);
          // 然后导航到目标路径（会自动创建新标签页）
          router.push(targetPath);
        } else {
          // 如果没有其他标签页，直接导航
          router.push(targetPath);
        }
      }
    },
    [activeTab, tabs, router]
  );

  // 切换菜单展开状态
  const toggleMenu = useCallback((menuName: string) => {
    setExpandedMenus((prev) => ({ ...prev, [menuName]: !prev[menuName] }));
  }, []);

  // 用户认证检查
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const userData = localStorage.getItem("user");

    if (!isLoggedIn || !userData) {
      router.push("/login");
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (err) {
      router.push("/login");
    }
  }, [router]);

  // 监听路由变化，自动打开/切换标签页
  useEffect(() => {
    // 排除账务中心页面（它有自己的标签系统）
    if (pathname.startsWith("/accounting") || pathname.startsWith("/dashboard/ledgers")) {
      return;
    }

    // 工作台
    if (pathname === "/dashboard") {
      setActiveTab("dashboard");
      return;
    }

    // 根据路径自动创建标签页
    const tabConfig = getTabConfig(pathname);
    if (tabConfig) {
      setTabs((prev) => {
        const existingTab = prev.find((t) => t.path === pathname);
        if (!existingTab) {
          return [...prev, tabConfig!];
        }
        return prev;
      });

      const existingTab = tabs.find((t) => t.path === pathname);
      if (existingTab) {
        setActiveTab(existingTab.id);
      } else if (tabConfig) {
        setActiveTab(tabConfig.id);
      }
    }
  }, [pathname]);

  // 退出登录
  const handleLogout = useCallback(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
    router.push("/login");
  }, [router]);

  return {
    // 状态
    user,
    sidebarOpen,
    setSidebarOpen,
    expandedMenus,
    tabs,
    activeTab,
    // 标签页操作
    openTab,
    closeTab,
    switchTab,
    updateTabLabel,
    closeCurrentTabAndNavigate,
    // 菜单操作
    toggleMenu,
    // 用户操作
    handleLogout,
  };
}
