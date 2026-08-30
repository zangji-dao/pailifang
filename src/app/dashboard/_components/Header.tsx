"use client";

import { Building2, Check, Loader2, LogOut, Menu, ShieldCheck, X } from "lucide-react";
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
import { BrandMark } from "@/components/brand-logo";

interface HeaderProps {
  user: User;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onLogout: () => void;
  onOrganizationChange?: (organizationId: string) => void;
  organizationSwitching?: boolean;
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
export function Header({
  user,
  sidebarOpen,
  onToggleSidebar,
  onLogout,
  onOrganizationChange,
  organizationSwitching = false,
}: HeaderProps) {
  const activeRoleName = user.activeOrganization?.roles.map((role) => role.name).join("、") || getRoleName(user.role);

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-slate-200 bg-[#fbfcfd]/95 backdrop-blur-xl">
      <div className="flex h-full items-center gap-4 px-3 sm:px-5 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label={sidebarOpen ? "关闭侧栏" : "打开侧栏"}
            className="h-9 w-9 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950 lg:hidden"
            onClick={onToggleSidebar}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>

          <div className="flex min-w-0 items-center gap-2.5">
            <BrandMark className="h-9 w-9 shrink-0 drop-shadow-sm" />
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold tracking-[0.08em] text-slate-950">Π立方</h1>
              <p className="mt-0.5 text-[10px] tracking-wide text-slate-400">企业经营服务中台</p>
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex h-10 items-center gap-2 rounded-lg px-1.5 hover:bg-slate-100 sm:px-2.5">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-slate-900 text-xs font-semibold text-amber-200">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium leading-tight text-slate-800">{user.name}</p>
                  <p className="max-w-44 truncate text-[10px] leading-tight text-slate-400">
                    {user.activeOrganization?.organizationName || activeRoleName}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl border-slate-200 p-2 shadow-xl">
              <DropdownMenuLabel className="mb-2 rounded-lg bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-slate-900 text-amber-200">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" />
                      {activeRoleName}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              {user.memberships && user.memberships.length > 0 && (
                <>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuLabel className="px-2 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                    当前组织
                  </DropdownMenuLabel>
                  {user.memberships.map((membership) => (
                    <DropdownMenuItem
                      key={membership.id}
                      disabled={organizationSwitching}
                      onClick={() => onOrganizationChange?.(membership.organizationId)}
                      className="cursor-pointer rounded-md py-2"
                    >
                      {organizationSwitching && membership.organizationId === user.activeOrganizationId ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-400" />
                      ) : (
                        <Building2 className="mr-2 h-4 w-4 text-slate-400" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-slate-800">{membership.organizationName}</p>
                        <p className="truncate text-[10px] text-slate-400">
                          {membership.roles.map((role) => role.name).join("、") || "组织成员"}
                        </p>
                      </div>
                      {membership.organizationId === user.activeOrganizationId && (
                        <Check className="ml-2 h-4 w-4 text-emerald-500" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
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
