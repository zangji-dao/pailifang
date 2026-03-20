"use client";

import { X } from "lucide-react";
import { Tab } from "../types";

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onSwitchTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
}

/**
 * 全局标签栏组件
 */
export function TabBar({ tabs, activeTab, onSwitchTab, onCloseTab }: TabBarProps) {
  return (
    <div className="fixed left-56 right-0 top-14 z-30 h-10 bg-white border-b border-slate-200/60 flex items-center px-3 shrink-0">
      <div className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`group flex items-center gap-1.5 px-3 py-2 text-sm cursor-pointer transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? "text-amber-600 border-amber-500 bg-amber-50/50"
                : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100/50"
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
                className="ml-0.5 p-0.5 rounded hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
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
