"use client";

import { TabsContext } from "./tabs-context";
import { useDashboardLayout } from "./useDashboardLayout";
import { getNavigation } from "./constants";
import { Header } from "./_components/Header";
import { TabBar } from "./_components/TabBar";
import { Sidebar } from "./_components/Sidebar";
import { ToastProvider } from "@/hooks/use-toast";

/**
 * Dashboard 布局组件
 * 提供顶部导航栏、侧边栏、标签栏和主内容区域
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    user,
    sidebarOpen,
    setSidebarOpen,
    expandedMenus,
    tabs,
    activeTab,
    openTab,
    closeTab,
    switchTab,
    updateTabLabel,
    toggleMenu,
    handleLogout,
  } = useDashboardLayout();

  // 用户未登录时不渲染
  if (!user) return null;

  // 获取导航配置（根据用户角色动态生成）
  const navigation = getNavigation(user.role);

  return (
    <ToastProvider>
      <TabsContext.Provider
        value={{ tabs, activeTab, openTab, closeTab, switchTab, updateTabLabel }}
      >
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
          {/* 顶部导航栏 */}
          <Header
            user={user}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onLogout={handleLogout}
          />

          {/* 全局标签栏 */}
          <TabBar
            tabs={tabs}
            activeTab={activeTab}
            onSwitchTab={switchTab}
            onCloseTab={closeTab}
          />

          {/* 侧边栏 */}
          <Sidebar
            navigation={navigation}
            expandedMenus={expandedMenus}
            isOpen={sidebarOpen}
            onToggleMenu={toggleMenu}
            onCloseSidebar={() => setSidebarOpen(false)}
          />

          {/* 主内容区 */}
          <main className="lg:pl-56 pt-[6rem]">
            <div className="p-4 lg:p-6">{children}</div>
          </main>

          {/* 移动端遮罩 */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </div>
      </TabsContext.Provider>
    </ToastProvider>
  );
}
