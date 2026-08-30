"use client";

import { TabsContext } from "./tabs-context";
import { useDashboardLayout } from "./useDashboardLayout";
import { getNavigation } from "./constants";
import { Header } from "./_components/Header";
import { TabBar } from "./_components/TabBar";
import { Sidebar } from "./_components/Sidebar";
import { ToastProvider } from "@/hooks/use-toast";
import { SiteComplianceFooter } from "@/components/site-compliance-footer";

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
          <main className={`flex min-h-[100dvh] min-w-0 flex-col pt-16 transition-[padding] duration-200 sm:pt-[6.75rem] ${sidebarCollapsed ? "lg:pl-16" : "lg:pl-60"}`}>
            <div className="flex-1 p-3 sm:p-5 lg:p-6 xl:p-8">{children}</div>
            <SiteComplianceFooter className="border-t border-slate-200/80 bg-white/45 px-4 py-4 backdrop-blur-sm" />
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
