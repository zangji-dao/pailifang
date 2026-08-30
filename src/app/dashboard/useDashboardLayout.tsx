"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { User, Tab } from "./types";
import { getTabConfig } from "./tab-config";
import { apiClient } from "@/lib/apiClient";

type BusinessModule = "base" | "orders" | "hr" | "sales" | "accounting";

const MODULE_NAMES: Record<BusinessModule, string> = {
  base: "基地管理",
  orders: "工单大厅",
  hr: "人力资源",
  sales: "销售中心",
  accounting: "账务中心",
};

function normalizePath(path: string) {
  return path.split("?")[0] || "/";
}

function getBusinessModule(path: string): BusinessModule | null {
  const normalizedPath = normalizePath(path);

  if (normalizedPath === "/dashboard/base" || normalizedPath.startsWith("/dashboard/base/")) {
    return "base";
  }
  if (normalizedPath === "/dashboard/orders" || normalizedPath.startsWith("/dashboard/orders/")) {
    return "orders";
  }
  if (normalizedPath === "/dashboard/hr" || normalizedPath.startsWith("/dashboard/hr/")) {
    return "hr";
  }
  if (normalizedPath === "/dashboard/sales" || normalizedPath.startsWith("/dashboard/sales/")) {
    return "sales";
  }
  if (normalizedPath.startsWith("/accounting") || normalizedPath.startsWith("/dashboard/ledgers")) {
    return "accounting";
  }

  return null;
}

function getOpenBusinessModule(tabs: Tab[]) {
  return tabs.map((tab) => getBusinessModule(tab.path)).find(Boolean) ?? null;
}

function isPotentiallyUnsavedTab(tab: Tab) {
  const path = tab.path.toLowerCase();
  return (
    /\/(new|create|edit)(\/|\?|$)/.test(path) ||
    /[?&]new=true(?:&|$)/.test(path) ||
    /^(新建|编辑)/.test(tab.label)
  );
}

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
  const [organizationSwitching, setOrganizationSwitching] = useState(false);

  // 侧边栏状态
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 标签页状态
  const [tabs, setTabs] = useState<Tab[]>([DEFAULT_TAB]);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  const confirmClosingBusinessModule = useCallback(
    (module: BusinessModule | null) => {
      const riskyTabs = tabs.filter((tab) => tab.closable && isPotentiallyUnsavedTab(tab));
      if (riskyTabs.length === 0) return true;

      const moduleName = module ? MODULE_NAMES[module] : "当前业务模块";
      return window.confirm(
        `${moduleName}中有新建或编辑页面。切换后将关闭该模块的全部标签，未保存内容可能丢失，是否继续？`
      );
    },
    [tabs]
  );

  const returnToWorkbench = useCallback(() => {
    const currentModule = getBusinessModule(pathname) ?? getOpenBusinessModule(tabs);
    if (currentModule && !confirmClosingBusinessModule(currentModule)) {
      return false;
    }

    setTabs([DEFAULT_TAB]);
    setActiveTab(DEFAULT_TAB.id);
    router.push(DEFAULT_TAB.path);
    return true;
  }, [confirmClosingBusinessModule, pathname, router, tabs]);

  const openBusinessModule = useCallback(
    (targetPath: string, fallbackLabel?: string) => {
      const normalizedTargetPath = normalizePath(targetPath);
      const targetModule = getBusinessModule(normalizedTargetPath);
      const currentModule = getBusinessModule(pathname) ?? getOpenBusinessModule(tabs);

      if (!targetModule) {
        const standaloneTab = getTabConfig(normalizedTargetPath);
        if (!standaloneTab) return false;

        if (currentModule && !confirmClosingBusinessModule(currentModule)) {
          return false;
        }

        setTabs((previousTabs) => {
          const scopedTabs = currentModule ? [DEFAULT_TAB] : previousTabs;
          const existingTab = scopedTabs.find(
            (tab) => tab.id === standaloneTab.id || normalizePath(tab.path) === normalizedTargetPath
          );
          return existingTab
            ? scopedTabs
            : [...scopedTabs, { ...standaloneTab, path: targetPath }];
        });
        setActiveTab(standaloneTab.id);
        router.push(targetPath);
        return true;
      }

      const isSwitchingModule = Boolean(currentModule && currentModule !== targetModule);

      if (isSwitchingModule && !confirmClosingBusinessModule(currentModule)) {
        return false;
      }

      if (targetModule === "accounting") {
        setTabs([DEFAULT_TAB]);
        setActiveTab(DEFAULT_TAB.id);
        router.push(targetPath);
        return true;
      }

      const tabConfig =
        getTabConfig(normalizedTargetPath) ??
        ({
          id: `business-${normalizedTargetPath.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}`,
          label: fallbackLabel ?? `${MODULE_NAMES[targetModule]}业务页面`,
          path: targetPath,
          icon: <LayoutDashboard className="h-3.5 w-3.5" />,
          closable: true,
          group: targetModule,
        } satisfies Tab);

      setTabs((previousTabs) => {
        const scopedTabs = isSwitchingModule ? [DEFAULT_TAB] : previousTabs;
        const existingTab = scopedTabs.find(
          (tab) => tab.id === tabConfig.id || normalizePath(tab.path) === normalizedTargetPath
        );
        return existingTab ? scopedTabs : [...scopedTabs, { ...tabConfig, path: targetPath }];
      });
      setActiveTab(tabConfig.id);
      router.push(targetPath);
      return true;
    },
    [confirmClosingBusinessModule, pathname, router, tabs]
  );

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
      if (tabId === DEFAULT_TAB.id) {
        returnToWorkbench();
        return;
      }

      const tab = tabs.find((t) => t.id === tabId);
      if (tab) {
        setActiveTab(tabId);
        router.push(tab.path);
      }
    },
    [returnToWorkbench, tabs, router]
  );

  // 更新标签页标题
  const updateTabLabel = useCallback((tabId: string, label: string) => {
    setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, label } : t)));
  }, []);

  // 关闭当前标签页并导航到目标页面
  // 用于完成创建后关闭新建标签页，跳转到列表页或详情页
  const closeCurrentTabAndNavigate = useCallback(
    (targetPath: string) => {
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

  // 用户认证检查
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    let active = true;
    void apiClient.get<User>("/api/auth/me").then((response) => {
      if (!active) return;
      if (!response.success || !response.data) {
        localStorage.removeItem("user");
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      localStorage.setItem("user", JSON.stringify(response.data));
      localStorage.setItem("isLoggedIn", "true");
      setUser(response.data);
    });

    return () => {
      active = false;
    };
  }, [router]);

  // 监听路由变化，自动打开/切换标签页
  useEffect(() => {
    // 排除账务中心页面（它有自己的标签系统）
    if (pathname.startsWith("/accounting") || pathname.startsWith("/dashboard/ledgers")) {
      return;
    }

    const timer = window.setTimeout(() => {
      // 工作台
      if (pathname === "/dashboard") {
        setTabs([DEFAULT_TAB]);
        setActiveTab(DEFAULT_TAB.id);
        return;
      }

      // 根据路径自动创建标签页
      const tabConfig = getTabConfig(pathname);
      if (tabConfig) {
        setTabs((prev) => {
          const routeModule = getBusinessModule(pathname);
          const scopedTabs = routeModule
            ? prev.filter(
                (tab) => tab.id === DEFAULT_TAB.id || getBusinessModule(tab.path) === routeModule
              )
            : prev;
          const existingTab = scopedTabs.find(
            (tab) => tab.id === tabConfig.id || normalizePath(tab.path) === pathname
          );
          if (!existingTab) {
            return [...scopedTabs, tabConfig];
          }
          return scopedTabs;
        });
        setActiveTab(tabConfig.id);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  // 退出登录
  const handleLogout = useCallback(() => {
    void fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("token");
    router.push("/login");
  }, [router]);

  const switchOrganization = useCallback(async (organizationId: string) => {
    if (!user || organizationId === user.activeOrganizationId) return;

    setOrganizationSwitching(true);
    try {
      const response = await apiClient.post<User>("/api/auth/context", { organizationId });
      if (!response.success || !response.data) return;

      localStorage.setItem("user", JSON.stringify(response.data));
      setUser(response.data);
      window.location.reload();
    } finally {
      setOrganizationSwitching(false);
    }
  }, [user]);

  return {
    // 状态
    user,
    organizationSwitching,
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    tabs,
    activeTab,
    // 标签页操作
    openTab,
    closeTab,
    switchTab,
    openBusinessModule,
    returnToWorkbench,
    updateTabLabel,
    closeCurrentTabAndNavigate,
    // 用户操作
    handleLogout,
    switchOrganization,
  };
}
