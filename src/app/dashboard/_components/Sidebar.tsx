"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Home,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { NavChildItem, NavItem } from "../types";

interface SidebarProps {
  navigation: NavItem[];
  isOpen: boolean;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onCloseSidebar: () => void;
  onOpenBusinessModule: (path: string, label?: string) => boolean;
  onReturnWorkbench: () => boolean;
}

interface ManualView {
  pathname: string;
  moduleName: string | null;
}

const MODULE_DESCRIPTIONS: Record<string, string> = {
  基地管理: "园区、企业、入驻与合同",
  工单大厅: "服务受理、抢单与派单",
  账务中心: "财务记账与税务事项",
  人力资源: "员工、薪酬与组织管理",
  销售中心: "线索、客户与销售业绩",
};

function normalizePath(path: string) {
  return path.split("?")[0] || "/";
}

function collectHrefs(item: NavItem | NavChildItem): string[] {
  const ownHref = item.href ? [normalizePath(item.href)] : [];
  const childHrefs = item.children?.flatMap(collectHrefs) ?? [];
  return [...ownHref, ...childHrefs];
}

function findActiveHref(pathname: string, item: NavItem | NavChildItem) {
  return (
    collectHrefs(item)
      .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
      .sort((firstHref, secondHref) => secondHref.length - firstHref.length)[0] ?? null
  );
}

function getFlyoutPosition(index: number, total: number) {
  if (index <= 1) return "top-0";
  if (index >= total - 2) return "bottom-0";
  return "top-1/2 -translate-y-1/2";
}

export function Sidebar({
  navigation,
  isOpen,
  collapsed,
  onCollapsedChange,
  onCloseSidebar,
  onOpenBusinessModule,
  onReturnWorkbench,
}: SidebarProps) {
  const pathname = normalizePath(usePathname());
  const [manualView, setManualView] = useState<ManualView | null>(null);
  const dashboardItem = navigation.find((item) => normalizePath(item.href ?? "") === "/dashboard");
  const moduleItems = navigation.filter((item) => item !== dashboardItem);
  const routeModuleName =
    moduleItems.find((item) => findActiveHref(pathname, item))?.name ?? null;
  const selectedModuleName =
    manualView?.pathname === pathname ? manualView.moduleName : routeModuleName;
  const selectedModule =
    moduleItems.find((item) => item.name === selectedModuleName) ?? null;

  const showAllModules = () => {
    setManualView({ pathname, moduleName: null });
  };

  const showModule = (moduleName: string) => {
    setManualView({ pathname, moduleName });
  };

  return (
    <aside
      className={`fixed bottom-0 left-0 top-16 z-40 w-[84vw] max-w-80 transform overflow-hidden border-r border-slate-800 bg-[#0b1220]/[0.98] text-slate-200 shadow-2xl shadow-slate-950/25 backdrop-blur-xl transition-[transform,width] duration-300 ease-out lg:max-w-none lg:translate-x-0 lg:overflow-visible lg:shadow-none ${
        collapsed ? "lg:w-16" : "lg:w-60"
      } ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-amber-300/70 via-amber-500/20 to-transparent" />

      {selectedModule ? (
        <ModuleNavigation
          key={selectedModule.name}
          module={selectedModule}
          pathname={pathname}
          collapsed={collapsed}
          onShowAllModules={showAllModules}
          onCloseSidebar={onCloseSidebar}
          onReturnWorkbench={onReturnWorkbench}
        />
      ) : (
        <PrimaryNavigation
          dashboardItem={dashboardItem}
          modules={moduleItems}
          pathname={pathname}
          collapsed={collapsed}
          routeModuleName={routeModuleName}
          onShowModule={showModule}
          onCloseSidebar={onCloseSidebar}
          onOpenBusinessModule={onOpenBusinessModule}
          onReturnWorkbench={onReturnWorkbench}
        />
      )}

      <button
        type="button"
        title={collapsed ? "展开侧栏" : "收起侧栏"}
        aria-label={collapsed ? "展开侧栏" : "收起侧栏"}
        onClick={() => onCollapsedChange(!collapsed)}
        className="absolute -right-3 bottom-5 z-[90] hidden h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-[#111b2d] text-slate-400 shadow-lg transition-colors hover:border-amber-300/40 hover:text-amber-300 lg:flex"
      >
        {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );
}

function PrimaryNavigation({
  dashboardItem,
  modules,
  pathname,
  collapsed,
  routeModuleName,
  onShowModule,
  onCloseSidebar,
  onOpenBusinessModule,
  onReturnWorkbench,
}: {
  dashboardItem?: NavItem;
  modules: NavItem[];
  pathname: string;
  collapsed: boolean;
  routeModuleName: string | null;
  onShowModule: (moduleName: string) => void;
  onCloseSidebar: () => void;
  onOpenBusinessModule: (path: string, label?: string) => boolean;
  onReturnWorkbench: () => boolean;
}) {
  return (
    <div className="h-full animate-in fade-in-0 slide-in-from-left-2 duration-200">
      <nav className="h-full overflow-y-auto p-3 pb-5 pt-4 lg:overflow-visible">
        <div className={`mb-4 px-3 ${collapsed ? "lg:hidden" : ""}`}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
            工作台导航
          </p>
          <p className="mt-1 text-xs text-slate-500">选择需要进入的业务模块</p>
        </div>

        {dashboardItem?.href && (
          <Link
            href={dashboardItem.href}
            onClick={(event) => {
              event.preventDefault();
              if (onReturnWorkbench()) onCloseSidebar();
            }}
            title={collapsed ? "工作台首页" : undefined}
            className={`group mb-4 flex items-center gap-3 rounded-xl border border-amber-300/15 bg-gradient-to-r from-amber-300/[0.12] to-transparent px-3 py-3 text-white transition-colors hover:border-amber-300/30 hover:bg-amber-300/[0.14] ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-300/10 text-amber-300 ring-1 ring-inset ring-amber-300/15">
              <LayoutDashboard className="h-4 w-4" />
            </span>
            <span className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>
              <span className="block text-sm font-semibold">工作台首页</span>
              <span className="mt-0.5 block text-[11px] text-slate-500">基地企业经营数据</span>
            </span>
            <ChevronRight className={`h-4 w-4 text-amber-300/70 transition-transform group-hover:translate-x-0.5 ${collapsed ? "lg:hidden" : ""}`} />
          </Link>
        )}

        <div className={`mb-2 px-3 ${collapsed ? "lg:hidden" : ""}`}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
            业务模块
          </p>
        </div>

        <div className="space-y-1">
          {modules.map((item, index) => {
            const isCurrentModule = routeModuleName === item.name;

            if (!item.expandable && item.href) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(event) => {
                    event.preventDefault();
                    if (onOpenBusinessModule(item.href!, `${item.name}看板`)) onCloseSidebar();
                  }}
                  title={collapsed ? item.name : undefined}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                    isCurrentModule
                      ? "bg-white/[0.08] text-white ring-1 ring-inset ring-white/10"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                  } ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      isCurrentModule
                        ? "bg-amber-300/10 text-amber-300"
                        : "bg-white/[0.04] text-slate-500 group-hover:text-amber-300"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>
                    <span className="block text-sm font-medium">{item.name}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-slate-600">
                      {MODULE_DESCRIPTIONS[item.name] ?? "查看模块功能"}
                    </span>
                  </span>
                </Link>
              );
            }

            return (
              <div key={item.name} className="group relative">
                <button
                  type="button"
                  aria-haspopup={item.children?.length ? "menu" : undefined}
                  onClick={() => {
                    if (!item.href || onOpenBusinessModule(item.href, `${item.name}看板`)) {
                      onShowModule(item.name);
                      onCloseSidebar();
                    }
                  }}
                  title={collapsed ? item.name : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                    isCurrentModule
                      ? "bg-white/[0.08] text-white ring-1 ring-inset ring-white/10"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                  } ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      isCurrentModule
                        ? "bg-amber-300/10 text-amber-300"
                        : "bg-white/[0.04] text-slate-500 group-hover:text-amber-300"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>
                    <span className="block text-sm font-medium">{item.name}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-slate-600">
                      {MODULE_DESCRIPTIONS[item.name] ?? "查看模块功能"}
                    </span>
                  </span>
                  <ChevronRight className={`h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-300 ${collapsed ? "lg:hidden" : ""}`} />
                </button>

                <DesktopModuleFlyout
                  item={item}
                  pathname={pathname}
                  onCloseSidebar={onCloseSidebar}
                  onNavigate={onOpenBusinessModule}
                  positionClass={getFlyoutPosition(index, modules.length)}
                />
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function DesktopModuleFlyout({
  item,
  pathname,
  onCloseSidebar,
  onNavigate,
  positionClass,
}: {
  item: NavItem;
  pathname: string;
  onCloseSidebar: () => void;
  onNavigate: (path: string, label?: string) => boolean;
  positionClass: string;
}) {
  if (!item.children?.length && !item.href) return null;
  const activeHref = findActiveHref(pathname, item);

  return (
    <div
      className={`pointer-events-none invisible absolute left-full z-[80] hidden w-72 translate-x-1 pl-2 opacity-0 transition-[opacity,transform,visibility] duration-150 ease-out group-hover:pointer-events-auto group-hover:visible group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:translate-x-0 group-focus-within:opacity-100 lg:block ${positionClass}`}
    >
      <div
        role="menu"
        aria-label={`${item.name}快捷菜单`}
        className="max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-2xl shadow-slate-950/20"
      >
        <div className="mb-2 border-b border-slate-100 px-3 pb-2 pt-1">
          <p className="text-sm font-semibold text-slate-950">{item.name}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            {MODULE_DESCRIPTIONS[item.name] ?? "选择需要进入的功能"}
          </p>
        </div>

        {item.href && (
          <FlyoutLink
            name={`${item.name}看板`}
            href={item.href}
            icon={LayoutDashboard}
            isActive={activeHref === normalizePath(item.href)}
            onCloseSidebar={onCloseSidebar}
            onNavigate={onNavigate}
          />
        )}

        {item.children?.map((child) =>
          child.children?.length ? (
            <div key={child.name} className="mt-1 rounded-xl bg-slate-50/80 p-1.5">
              <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] font-semibold text-slate-400">
                <child.icon className="h-3.5 w-3.5" />
                {child.name}
              </div>
              {child.children.map((nestedChild) => (
                <FlyoutLink
                  key={nestedChild.name}
                  name={nestedChild.name}
                  href={nestedChild.href}
                  icon={nestedChild.icon}
                  badge={nestedChild.badge}
                  isActive={activeHref === normalizePath(nestedChild.href)}
                  onCloseSidebar={onCloseSidebar}
                  onNavigate={onNavigate}
                  compact
                />
              ))}
            </div>
          ) : (
            <FlyoutLink
              key={child.name}
              name={child.name}
              href={child.href}
              icon={child.icon}
              badge={child.badge}
              isActive={activeHref === normalizePath(child.href)}
              onCloseSidebar={onCloseSidebar}
              onNavigate={onNavigate}
            />
          )
        )}
      </div>
    </div>
  );
}

function ModuleNavigation({
  module,
  pathname,
  collapsed,
  onShowAllModules,
  onCloseSidebar,
  onReturnWorkbench,
}: {
  module: NavItem;
  pathname: string;
  collapsed: boolean;
  onShowAllModules: () => void;
  onCloseSidebar: () => void;
  onReturnWorkbench: () => boolean;
}) {
  const activeHref = findActiveHref(pathname, module);

  return (
    <div className="relative h-full animate-in fade-in-0 slide-in-from-right-2 duration-200">
      <div className="h-full overflow-y-auto p-3 pb-24 pt-4 lg:overflow-visible">
        <button
          type="button"
          onClick={onShowAllModules}
          title={collapsed ? "全部业务模块" : undefined}
          className={`mb-3 flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs font-medium text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-white ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className={collapsed ? "lg:hidden" : ""}>全部业务模块</span>
        </button>

        <div className={`mb-5 rounded-2xl border border-white/10 bg-white/[0.05] p-3.5 ${collapsed ? "lg:p-2" : ""}`}>
          <div className={`flex items-center gap-3 ${collapsed ? "lg:justify-center" : ""}`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300 ring-1 ring-inset ring-amber-300/15">
              <module.icon className="h-5 w-5" />
            </span>
            <span className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
              <span className="block text-sm font-semibold text-white">{module.name}</span>
              <span className="mt-0.5 block text-[10px] text-slate-500">
                {MODULE_DESCRIPTIONS[module.name] ?? "业务功能导航"}
              </span>
            </span>
          </div>
        </div>

        <div className={`mb-2 px-3 ${collapsed ? "lg:hidden" : ""}`}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
            模块功能
          </p>
        </div>

        <div className="space-y-1">
          {module.href && (
            <ModuleLink
              name={`${module.name}看板`}
              href={module.href}
              icon={LayoutDashboard}
              isActive={activeHref === normalizePath(module.href)}
              collapsed={collapsed}
              onCloseSidebar={onCloseSidebar}
            />
          )}

          {module.children?.map((child, index) =>
            child.children?.length ? (
              <NestedMenuGroup
                key={child.name}
                item={child}
                activeHref={activeHref}
                collapsed={collapsed}
                onCloseSidebar={onCloseSidebar}
                positionClass={getFlyoutPosition(index, module.children?.length ?? 0)}
              />
            ) : (
              <ModuleLink
                key={child.name}
                name={child.name}
                href={child.href}
                icon={child.icon}
                badge={child.badge}
                isActive={activeHref === normalizePath(child.href)}
                collapsed={collapsed}
                onCloseSidebar={onCloseSidebar}
              />
            )
          )}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-white/[0.06] bg-[#0b1220]/95 p-3 backdrop-blur-xl">
        <button
          type="button"
          title={collapsed ? "返回工作台" : undefined}
          onClick={() => {
            if (onReturnWorkbench()) {
              onShowAllModules();
              onCloseSidebar();
            }
          }}
          className={`flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-slate-300 transition-colors hover:border-amber-300/20 hover:bg-white/[0.07] hover:text-white ${collapsed ? "lg:px-0" : ""}`}
        >
          <Home className="h-4 w-4 text-amber-300" />
          <span className={collapsed ? "lg:hidden" : ""}>返回工作台</span>
        </button>
      </div>
    </div>
  );
}

function ModuleLink({
  name,
  href,
  icon: Icon,
  badge,
  isActive,
  collapsed = false,
  onCloseSidebar,
}: {
  name: string;
  href: string;
  icon: NavChildItem["icon"];
  badge?: string | null;
  isActive: boolean;
  collapsed?: boolean;
  onCloseSidebar: () => void;
}) {
  if (!href) return null;

  return (
    <Link
      href={href}
      onClick={onCloseSidebar}
      title={collapsed ? name : undefined}
      className={`group flex min-h-10 items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all ${
        isActive
          ? "bg-amber-300/10 font-medium text-amber-200 ring-1 ring-inset ring-amber-300/10"
          : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
      } ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
    >
      <Icon
        className={`h-4 w-4 shrink-0 ${
          isActive ? "text-amber-300" : "text-slate-600 group-hover:text-amber-300"
        }`}
      />
      <span className={`min-w-0 flex-1 truncate ${collapsed ? "lg:hidden" : ""}`}>{name}</span>
      {badge && (
        <span
          className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
            isActive ? "bg-amber-300/15 text-amber-200" : "bg-white/[0.06] text-slate-500"
          } ${collapsed ? "lg:hidden" : ""}`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

function FlyoutLink({
  name,
  href,
  icon: Icon,
  badge,
  isActive,
  onCloseSidebar,
  onNavigate,
  compact = false,
}: {
  name: string;
  href: string;
  icon: NavChildItem["icon"];
  badge?: string | null;
  isActive: boolean;
  onCloseSidebar: () => void;
  onNavigate?: (path: string, label?: string) => boolean;
  compact?: boolean;
}) {
  if (!href) return null;

  return (
    <Link
      href={href}
      role="menuitem"
      onClick={(event) => {
        if (!onNavigate) {
          onCloseSidebar();
          return;
        }

        event.preventDefault();
        if (onNavigate(href, name)) onCloseSidebar();
      }}
      className={`group/link flex items-center gap-2.5 rounded-xl px-3 text-sm transition-colors ${
        compact ? "min-h-9 py-1.5" : "min-h-10 py-2"
      } ${
        isActive
          ? "bg-amber-50 font-medium text-amber-800"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
      }`}
    >
      <Icon
        className={`h-4 w-4 shrink-0 ${
          isActive ? "text-amber-600" : "text-slate-400 group-hover/link:text-amber-600"
        }`}
      />
      <span className="min-w-0 flex-1 truncate">{name}</span>
      {badge && (
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
          {badge}
        </span>
      )}
    </Link>
  );
}

function NestedMenuGroup({
  item,
  activeHref,
  collapsed,
  onCloseSidebar,
  positionClass,
}: {
  item: NavChildItem;
  activeHref: string | null;
  collapsed: boolean;
  onCloseSidebar: () => void;
  positionClass: string;
}) {
  const hasActiveChild =
    item.children?.some((child) => normalizePath(child.href) === activeHref) ?? false;
  const [isExpanded, setIsExpanded] = useState(false);
  const isOpen = isExpanded || hasActiveChild;

  return (
    <div className={`group relative rounded-xl ${hasActiveChild ? "bg-white/[0.035]" : ""}`}>
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        title={collapsed ? item.name : undefined}
        className={`group flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
          hasActiveChild
            ? "font-medium text-amber-200"
            : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
        } ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
      >
        <item.icon
          className={`h-4 w-4 ${
            hasActiveChild ? "text-amber-300" : "text-slate-600 group-hover:text-amber-300"
          }`}
        />
        <span className={`min-w-0 flex-1 truncate ${collapsed ? "lg:hidden" : ""}`}>{item.name}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-600 transition-transform duration-200 lg:hidden ${
            isOpen ? "rotate-180" : ""
          }`}
        />
        <ChevronRight className={`hidden h-3.5 w-3.5 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-300 lg:block ${collapsed ? "lg:hidden" : ""}`} />
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-200 lg:hidden ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mb-1 ml-5 space-y-0.5 border-l border-slate-800 pl-2.5">
            {item.children?.map((child) => (
              <ModuleLink
                key={child.name}
                name={child.name}
                href={child.href}
                icon={child.icon}
                badge={child.badge}
                isActive={activeHref === normalizePath(child.href)}
                collapsed={collapsed}
                onCloseSidebar={onCloseSidebar}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        className={`pointer-events-none invisible absolute left-full z-[80] hidden w-64 translate-x-1 pl-2 opacity-0 transition-[opacity,transform,visibility] duration-150 ease-out group-hover:pointer-events-auto group-hover:visible group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:translate-x-0 group-focus-within:opacity-100 lg:block ${positionClass}`}
      >
        <div
          role="menu"
          aria-label={`${item.name}菜单`}
          className="max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-2xl shadow-slate-950/20"
        >
          <div className="mb-1 border-b border-slate-100 px-3 py-2 text-xs font-semibold tracking-wide text-slate-400">
            {item.name}
          </div>
          {item.children?.map((child) => (
            <FlyoutLink
              key={child.name}
              name={child.name}
              href={child.href}
              icon={child.icon}
              badge={child.badge}
              isActive={activeHref === normalizePath(child.href)}
              onCloseSidebar={onCloseSidebar}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
