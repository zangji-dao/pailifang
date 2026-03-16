"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
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
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  Calculator,
  Menu,
  X,
  FileText,
  ChevronDown,
  ChevronRight,
  Building2,
  LogOut,
  Settings,
  Search,
  Bell,
  Sparkles,
  Briefcase,
  Wallet,
  Inbox,
  UserCheck,
  Store,
  Megaphone,
  TrendingUp,
  MessageSquare,
  Send,
  UserCog,
  FileSignature,
  FolderKanban,
  Clock,
  DollarSign,
  GraduationCap,
  BarChart3,
  UserPlus,
  Target,
  Calendar,
  MapPin,
  Building,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    "账务中心": pathname.startsWith("/accounting"),
    "工单管理": pathname.startsWith("/dashboard/orders"),
    "销售中心": pathname.startsWith("/dashboard/sales"),
    "人力资源": pathname.startsWith("/dashboard/hr"),
    "基地管理": pathname.startsWith("/dashboard/base"),
  });

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const userData = localStorage.getItem("user");

    if (!isLoggedIn || !userData) {
      router.push("/login");
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (err) {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
    router.push("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: "管理员",
      accountant: "会计",
      sales: "销售",
    };
    return roleMap[role] || role;
  };

  const navigation = [
    { 
      name: "仪表盘", 
      href: "/dashboard", 
      icon: LayoutDashboard,
      badge: null
    },
    { 
      name: "基地管理", 
      icon: MapPin, 
      expandable: true,
      badge: null,
      children: [
        { name: "基地列表", href: "/dashboard/base/sites", icon: Building },
        { name: "入驻企业", href: "/dashboard/base/tenants", icon: Users },
        { name: "合同管理", href: "/dashboard/base/contracts", icon: FileSignature },
      ]
    },
    { 
      name: "工单大厅", 
      href: "/dashboard/orders",
      icon: ClipboardList, 
      expandable: true,
      badge: null,
      children: [
        { name: "我的工单", href: "/dashboard/orders/mine", icon: Inbox, badge: "3" },
        { name: "去抢单", href: "/dashboard/orders/hall", icon: Store, badge: "5" },
        // 派单功能：销售专属
        ...(user?.role === "sales" || user?.role === "admin" 
          ? [{ name: "去派单", href: "/dashboard/orders/dispatch", icon: UserCheck, badge: null }] 
          : []),
      ]
    },
    { 
      name: "账务中心", 
      icon: FileText, 
      expandable: true,
      badge: null,
      children: [
        { name: "去记账", href: "/accounting", icon: BookOpen },
        { name: "税务日历", href: "/dashboard/tax-calendar", icon: Calendar },
      ]
    },
    { 
      name: "人力资源", 
      icon: UserCog, 
      expandable: true,
      badge: null,
      children: [
        { name: "招聘管理", href: "/dashboard/hr/recruitment", icon: UserPlus, badge: "56" },
        { name: "员工档案", href: "/dashboard/hr/archives", icon: Users, badge: "322" },
        { name: "合同管理", href: "/dashboard/hr/contracts", icon: FileSignature, badge: "5" },
        { name: "派遣项目", href: "/dashboard/hr/dispatch", icon: FolderKanban },
        { name: "考勤管理", href: "/dashboard/hr/attendance", icon: Clock },
        { name: "薪酬管理", href: "/dashboard/hr/payroll", icon: DollarSign },
        { name: "培训管理", href: "/dashboard/hr/training", icon: GraduationCap },
        { name: "统计报表", href: "/dashboard/hr/reports", icon: BarChart3 },
      ]
    },
    { 
      name: "销售中心", 
      icon: Briefcase, 
      expandable: true,
      badge: null,
      children: [
        { name: "营销概览", href: "/dashboard/sales/overview", icon: TrendingUp },
        { name: "线索中心", href: "/dashboard/sales/leads", icon: Users, badge: "42" },
        { name: "渠道管理", href: "/dashboard/sales/channels", icon: Store },
        { name: "客户公海", href: "/dashboard/sales/pool", icon: Inbox },
        { name: "我的客户", href: "/dashboard/sales/customers", icon: Users },
        { name: "商机管理", href: "/dashboard/sales/opportunities", icon: Target },
        { name: "回款管理", href: "/dashboard/sales/payments", icon: Wallet },
        { name: "销售业绩", href: "/dashboard/sales/performance", icon: DollarSign },
      ]
    },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      {/* 顶部导航栏 */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* 左侧：Logo + 标题 */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              onClick={() => setSidebarOpen(!sidebarOpen)}
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

          {/* 中间：搜索框 */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
              <input
                type="text"
                placeholder="搜索客户、凭证、科目..."
                className="w-full h-9 pl-9 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:bg-white transition-all"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-slate-100 rounded">
                ⌘K
              </kbd>
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
                  onClick={handleLogout} 
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

      {/* 侧边栏 */}
      <aside
        className={`fixed left-0 top-14 bottom-0 z-40 w-56 bg-white/60 backdrop-blur-xl border-r border-slate-200/60 transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 侧边栏顶部装饰条 */}
        <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-amber-400 via-amber-500 to-orange-500"></div>
        
        <nav className="p-3 pt-4 space-y-0.5">
          <div className="px-3 mb-3">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">主菜单</p>
          </div>
          
          {navigation.map((item, index) => {
            if (item.expandable && item.children) {
              const isExpanded = expandedMenus[item.name] || false;
              const isActive = item.children.some(child => 
                pathname === child.href || pathname.startsWith(child.href + "/")
              );
              
              return (
                <div key={item.name}>
                  <div
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all duration-200 group ${
                      isActive 
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25" 
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="flex items-center gap-2.5 flex-1"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400 group-hover:text-amber-500"}`} />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2.5 flex-1">
                        <item.icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400 group-hover:text-amber-500"}`} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                    )}
                    <button
                      onClick={() => setExpandedMenus(prev => ({ ...prev, [item.name]: !prev[item.name] }))}
                      className="p-1 hover:bg-slate-200/50 rounded transition-colors"
                    >
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                  
                  <div className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                    <div className="mt-1 ml-4 pl-3 border-l border-slate-200 space-y-0.5">
                      {item.children.map((child) => {
                        const childIsActive = pathname === child.href || pathname.startsWith(child.href + "/");
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const childBadge = (child as any).badge;
                        
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all ${
                              childIsActive
                                ? "text-amber-600 font-medium bg-amber-50"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <child.icon className="h-3.5 w-3.5" />
                            <span>{child.name}</span>
                            {childBadge && (
                              <span className={`ml-auto px-1.5 py-0.5 text-[10px] font-medium rounded ${
                                childIsActive 
                                  ? "bg-amber-100 text-amber-600" 
                                  : "bg-slate-100 text-slate-500"
                              }`}>
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
            
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href!}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400 group-hover:text-amber-500"}`} />
                <span className="font-medium">{item.name}</span>
                {item.badge && (
                  <span className={`ml-auto px-1.5 py-0.5 text-[10px] font-medium rounded ${
                    isActive 
                      ? "bg-white/20 text-white" 
                      : "bg-amber-100 text-amber-600"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
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

      {/* 主内容区 */}
      <main className="lg:pl-56 pt-14">
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
  );
}
