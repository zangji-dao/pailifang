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
    organizationSwitching,
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    tabs,
    activeTab,
    openTab,
    closeTab,
    switchTab,
    openBusinessModule,
    returnToWorkbench,
    updateTabLabel,
    closeCurrentTabAndNavigate,
    handleLogout,
    switchOrganization,
  } = useDashboardLayout();

  // 用户未登录时不渲染
  if (!user) return null;

  // 获取导航配置（根据用户角色动态生成）
  const navigation = getNavigation(user.role, user.permissions, user.activeOrganization?.organizationType);

  return (
    <ToastProvider>
      <TabsContext.Provider
        value={{ tabs, activeTab, openTab, closeTab, switchTab, updateTabLabel, closeCurrentTabAndNavigate }}
      >
        <div className="min-h-[100dvh] bg-[#f3f5f7] text-slate-900">
          {/* 顶部导航栏 */}
          <Header
            user={user}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onLogout={handleLogout}
            onOrganizationChange={switchOrganization}
            organizationSwitching={organizationSwitching}
          />

          {/* 全局标签栏 */}
          <TabBar
            tabs={tabs}
            activeTab={activeTab}
            sidebarCollapsed={sidebarCollapsed}
            onSwitchTab={switchTab}
            onCloseTab={closeTab}
          />

          {/* 侧边栏 */}
          <Sidebar
            navigation={navigation}
            isOpen={sidebarOpen}
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
            onCloseSidebar={() => setSidebarOpen(false)}
            onOpenBusinessModule={openBusinessModule}
            onReturnWorkbench={returnToWorkbench}
          />

          {/* 主内容区 */}
          <main className={`min-w-0 pt-16 transition-[padding] duration-200 sm:pt-[6.75rem] ${sidebarCollapsed ? "lg:pl-16" : "lg:pl-60"}`}>
            <div className="p-3 sm:p-5 lg:p-6 xl:p-8">{children}</div>
          </main>

          {/* 移动端遮罩 */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </div>
      </TabsContext.Provider>
    </ToastProvider>
  );
}
