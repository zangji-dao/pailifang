"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Sparkles } from "lucide-react";
import { NavItem, ExpandedMenusState } from "../types";

interface SidebarProps {
  navigation: NavItem[];
  expandedMenus: ExpandedMenusState;
  isOpen: boolean;
  onToggleMenu: (menuName: string) => void;
  onCloseSidebar: () => void;
}

/**
 * 侧边栏组件
 */
export function Sidebar({
  navigation,
  expandedMenus,
  isOpen,
  onToggleMenu,
  onCloseSidebar,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed left-0 top-14 bottom-0 z-40 w-56 bg-white/60 backdrop-blur-xl border-r border-slate-200/60 transform transition-transform duration-300 ease-out lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* 侧边栏顶部装饰条 */}
      <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-amber-400 via-amber-500 to-orange-500"></div>

      <nav className="p-3 pt-4 space-y-0.5">
        <div className="px-3 mb-3">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">主菜单</p>
        </div>

        {navigation.map((item) => {
          if (item.expandable && item.children) {
            return (
              <ExpandableNavItem
                key={item.name}
                item={item}
                isExpanded={expandedMenus[item.name] || false}
                isActive={item.children.some(
                  (child) => pathname === child.href || pathname.startsWith(child.href + "/")
                )}
                pathname={pathname}
                onToggle={() => onToggleMenu(item.name)}
                onCloseSidebar={onCloseSidebar}
              />
            );
          }

          return (
            <NavLinkItem
              key={item.name}
              item={item}
              isActive={pathname === item.href}
              onCloseSidebar={onCloseSidebar}
            />
          );
        })}
      </nav>

      {/* 底部版本信息 */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-medium text-amber-700">专业版</span>
          </div>
          <p className="text-[10px] text-amber-600/70">解锁全部高级功能</p>
        </div>
      </div>
    </aside>
  );
}

/**
 * 可展开的导航项
 */
interface ExpandableNavItemProps {
  item: NavItem;
  isExpanded: boolean;
  isActive: boolean;
  pathname: string;
  onToggle: () => void;
  onCloseSidebar: () => void;
}

function ExpandableNavItem({
  item,
  isExpanded,
  isActive,
  pathname,
  onToggle,
  onCloseSidebar,
}: ExpandableNavItemProps) {
  if (!item.children) return null;

  return (
    <div>
      <div
        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all duration-200 group ${
          isActive
            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        {item.href ? (
          <Link href={item.href} className="flex items-center gap-2.5 flex-1" onClick={onCloseSidebar}>
            <item.icon
              className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400 group-hover:text-amber-500"}`}
            />
            <span className="font-medium">{item.name}</span>
          </Link>
        ) : (
          <div className="flex items-center gap-2.5 flex-1">
            <item.icon
              className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400 group-hover:text-amber-500"}`}
            />
            <span className="font-medium">{item.name}</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1 hover:bg-slate-200/50 rounded transition-colors"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mt-1 ml-4 pl-3 border-l border-slate-200 space-y-0.5">
          {item.children.map((child) => {
            const childIsActive = pathname === child.href || pathname.startsWith(child.href + "/");
            const childBadge = child.badge;

            return (
              <Link
                key={child.name}
                href={child.href}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all ${
                  childIsActive
                    ? "text-amber-600 font-medium bg-amber-50"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
                onClick={onCloseSidebar}
              >
                <child.icon className="h-3.5 w-3.5" />
                <span>{child.name}</span>
                {childBadge && (
                  <span
                    className={`ml-auto px-1.5 py-0.5 text-[10px] font-medium rounded ${
                      childIsActive ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {childBadge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * 普通链接导航项
 */
interface NavLinkItemProps {
  item: NavItem;
  isActive: boolean;
  onCloseSidebar: () => void;
}

function NavLinkItem({ item, isActive, onCloseSidebar }: NavLinkItemProps) {
  if (!item.href) return null;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all duration-200 group ${
        isActive
          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
      onClick={onCloseSidebar}
    >
      <item.icon
        className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400 group-hover:text-amber-500"}`}
      />
      <span className="font-medium">{item.name}</span>
      {item.badge && (
        <span
          className={`ml-auto px-1.5 py-0.5 text-[10px] font-medium rounded ${
            isActive ? "bg-white/20 text-white" : "bg-amber-100 text-amber-600"
          }`}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}
