"use client";

import { X } from "lucide-react";
import { Tab } from "../types";

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  sidebarCollapsed: boolean;
  onSwitchTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
}

/**
 * 全局标签栏组件
 */
export function TabBar({ tabs, activeTab, sidebarCollapsed, onSwitchTab, onCloseTab }: TabBarProps) {
  return (
    <div className={`fixed inset-x-0 top-16 z-30 hidden h-11 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl transition-[left] duration-200 sm:flex ${sidebarCollapsed ? "lg:left-16" : "lg:left-60"}`}>
      <div className="scrollbar-hide flex h-full min-w-0 flex-1 items-center gap-4 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`group relative flex h-full cursor-pointer items-center gap-1.5 whitespace-nowrap px-1 text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors ${
              activeTab === tab.id
                ? "font-medium text-slate-950 after:bg-amber-500"
                : "text-slate-400 after:bg-transparent hover:text-slate-700"
            }`}
            onClick={() => onSwitchTab(tab.id)}
          >
            {tab.icon}
            <span className="max-w-[140px] truncate">{tab.label}</span>
            {tab.closable && tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="ml-0.5 rounded p-0.5 text-slate-400 opacity-60 transition-opacity hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
