"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Sparkles } from "lucide-react";
import { NavItem, NavChildItem, ExpandedMenusState } from "../types";

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
            // 检查子菜单是否匹配当前路径（排除空href的情况）
            const hasActiveChild = item.children.some(
              (child) => {
                if (!child.href) {
                  // 如果子菜单有嵌套子项，检查嵌套子项
                  if (child.children && child.children.length > 0) {
                    return child.children.some(
                      (nested) => nested.href && (pathname === nested.href || pathname.startsWith(nested.href + "/"))
                    );
                  }
                  return false;
                }
                return pathname === child.href || pathname.startsWith(child.href + "/");
              }
            );
            
            return (
              <ExpandableNavItem
                key={item.name}
                item={item}
                isExpanded={expandedMenus[item.name] || false}
                isActive={hasActiveChild}
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
            // 如果子菜单项有嵌套的子菜单
            if (child.children && child.children.length > 0) {
              return (
                <NestedMenuItem
                  key={child.name}
                  item={child}
                  pathname={pathname}
                  onCloseSidebar={onCloseSidebar}
                />
              );
            }

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

/**
 * 嵌套菜单项（三级菜单）
 */
interface NestedMenuItemProps {
  item: NavChildItem;
  pathname: string;
  onCloseSidebar: () => void;
  parentExpanded?: boolean; // 父菜单是否展开
}

function NestedMenuItem({ item, pathname, onCloseSidebar, parentExpanded }: NestedMenuItemProps) {
  if (!item.children || item.children.length === 0) return null;
  
  // 检查是否有子菜单项处于激活状态
  const hasActiveChild = item.children.some(
    (child) => pathname === child.href || pathname.startsWith(child.href + "/")
  );
  
  // 当父菜单展开且有激活子项时，自动展开
  const isOpen = hasActiveChild;

  return (
    <div className={`${hasActiveChild ? "bg-amber-50/50 rounded-lg" : ""}`}>
      <Link
        href={item.children[0]?.href || "#"}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all ${
          hasActiveChild
            ? "text-amber-600 font-medium"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
        }`}
        onClick={onCloseSidebar}
      >
        <div className="flex items-center gap-2.5">
          <item.icon className="h-3.5 w-3.5" />
          <span>{item.name}</span>
        </div>
      </Link>
      
      {/* 直接显示子菜单项 */}
      <div className="ml-4 pl-3 border-l border-slate-200 space-y-0.5">
        {item.children.map((nestedChild) => {
          // 三级菜单激活逻辑：
          // 1. 精确匹配
          // 2. 子路径匹配（但排除其他同级菜单的路径）
          const isExactMatch = pathname === nestedChild.href;
          
          // 子路径匹配时，需要排除其他同级菜单的特殊路径
          // 例如：/dashboard/base/tenants/create 不应匹配 /dashboard/base/tenants
          const isSubPathMatch = 
            pathname.startsWith(nestedChild.href + "/") &&
            !item.children?.some(
              (sibling) => 
                sibling.href !== nestedChild.href && 
                pathname.startsWith(sibling.href)
            );
          
          const isActive = isExactMatch || isSubPathMatch;
          
          return (
            <Link
              key={nestedChild.name}
              href={nestedChild.href}
              className={`flex items-center gap-2.5 px-3 py-1.5 text-sm rounded-lg transition-all ${
                isActive
                  ? "text-amber-600 font-medium bg-amber-50"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
              onClick={onCloseSidebar}
            >
              <nestedChild.icon className="h-3 w-3" />
              <span>{nestedChild.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
