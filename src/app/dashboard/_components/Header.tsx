"use client";

import { Menu, X, Bell, Settings, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "../types";
import { ROLE_MAP } from "../constants";

interface HeaderProps {
  user: User;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

/**
 * 获取用户名首字母
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * 获取角色显示名称
 */
function getRoleName(role: string): string {
  return ROLE_MAP[role] || role;
}

/**
 * 顶部导航栏组件
 */
export function Header({ user, sidebarOpen, onToggleSidebar, onLogout }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* 左侧：Logo + 标题 */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            onClick={onToggleSidebar}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <span className="text-white font-bold text-sm">Π</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-semibold text-slate-900 tracking-tight">Π立方</h1>
              <p className="text-[10px] text-slate-400 leading-none -mt-0.5">企业服务中心</p>
            </div>
          </div>
        </div>

        {/* 右侧：操作区 */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100 relative"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          >
            <Settings className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-slate-200 mx-2"></div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-8 px-2 hover:bg-slate-100">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-medium">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-slate-700 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-400 leading-tight">{getRoleName(user.role)}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 p-2">
              <DropdownMenuLabel className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 mb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-[10px] font-medium text-amber-700 bg-amber-100 rounded-full">
                      <Sparkles className="h-2.5 w-2.5" />
                      {getRoleName(user.role)}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem className="rounded-md cursor-pointer">
                <Settings className="h-4 w-4 mr-2 text-slate-400" />
                账户设置
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onClick={onLogout}
                className="rounded-md text-red-600 focus:text-red-600 cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
