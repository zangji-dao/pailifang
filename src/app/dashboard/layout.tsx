"use client";

import { useEffect, useState, useCallback, ReactNode } from "react";
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
  Home,
  GitBranch,
} from "lucide-react";
import { TabsContext, Tab } from "./tabs-context";

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

  // 全局标签页状态
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: "dashboard",
      label: "工作台",
      path: "/dashboard",
      icon: <LayoutDashboard className="h-3.5 w-3.5" />,
      closable: false,
    },
  ]);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // 打开新标签页
  const openTab = useCallback((tab: Omit<Tab, "closable"> & { closable?: boolean }) => {
    const newTab: Tab = {
      ...tab,
      closable: tab.closable ?? true,
    };
    
    setTabs((prev) => {
      const existingTab = prev.find((t) => t.path === newTab.path || t.id === newTab.id);
      return existingTab ? prev : [...prev, newTab];
    });

    // 在 state updater 外部调用导航
    setActiveTab(newTab.id);
    router.push(newTab.path);
  }, [router]);

  // 关闭标签页
  const closeTab = useCallback((tabId: string) => {
    // 先计算需要切换到的标签页
    const tabIndex = tabs.findIndex((t) => t.id === tabId);
    const newTabs = tabs.filter((t) => t.id !== tabId);

    setTabs(newTabs);

    // 如果关闭的是当前激活的标签页，切换到相邻标签页
    if (activeTab === tabId && newTabs.length > 0) {
      const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
      const newActiveTab = newTabs[newActiveIndex];
      setActiveTab(newActiveTab.id);
      router.push(newActiveTab.path);
    }
  }, [activeTab, router, tabs]);

  // 切换标签页
  const switchTab = useCallback((tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      setActiveTab(tabId);
      router.push(tab.path);
    }
  }, [tabs, router]);

  // 更新标签页标题
  const updateTabLabel = useCallback((tabId: string, label: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, label } : t))
    );
  }, []);

  // 根据路径获取标签页配置
  const getTabConfig = (path: string): Tab | null => {
    // 基地管理
    if (path === "/dashboard/base/sites") {
      return {
        id: "base-sites",
        label: "物业运营中心",
        path: "/dashboard/base/sites",
        icon: <Building className="h-3.5 w-3.5" />,
        closable: true,
        group: "base",
      };
    }
    if (path === "/dashboard/base/applications") {
      return {
        id: "base-applications",
        label: "入驻申请",
        path: "/dashboard/base/applications",
        icon: <FileText className="h-3.5 w-3.5" />,
        closable: true,
        group: "base",
      };
    }
    if (path === "/dashboard/base/processes") {
      return {
        id: "base-processes",
        label: "入驻流程",
        path: "/dashboard/base/processes",
        icon: <GitBranch className="h-3.5 w-3.5" />,
        closable: true,
        group: "base",
      };
    }
    if (path === "/dashboard/base/addresses") {
      return {
        id: "base-addresses",
        label: "地址管理",
        path: "/dashboard/base/addresses",
        icon: <MapPin className="h-3.5 w-3.5" />,
        closable: true,
        group: "base",
      };
    }
    if (path === "/dashboard/base/tenants") {
      return {
        id: "base-tenants",
        label: "企业管理",
        path: "/dashboard/base/tenants",
        icon: <Users className="h-3.5 w-3.5" />,
        closable: true,
        group: "base",
      };
    }
    if (path === "/dashboard/base/contracts") {
      return {
        id: "base-contracts",
        label: "合同管理",
        path: "/dashboard/base/contracts",
        icon: <FileSignature className="h-3.5 w-3.5" />,
        closable: true,
        group: "base",
      };
    }
    // 基地详情
    const baseDetailMatch = path.match(/^\/dashboard\/base\/sites\/([^/]+)$/);
    if (baseDetailMatch) {
      return {
        id: `base-${baseDetailMatch[1]}`,
        label: "基地详情",
        path: path,
        icon: <Home className="h-3.5 w-3.5" />,
        closable: true,
        group: "base",
      };
    }
    // 工单大厅
    if (path === "/dashboard/orders") {
      return {
        id: "orders",
        label: "工单大厅",
        path: "/dashboard/orders",
        icon: <ClipboardList className="h-3.5 w-3.5" />,
        closable: true,
        group: "orders",
      };
    }
    if (path === "/dashboard/orders/mine") {
      return {
        id: "orders-mine",
        label: "我的工单",
        path: "/dashboard/orders/mine",
        icon: <Inbox className="h-3.5 w-3.5" />,
        closable: true,
        group: "orders",
      };
    }
    if (path === "/dashboard/orders/hall") {
      return {
        id: "orders-hall",
        label: "去抢单",
        path: "/dashboard/orders/hall",
        icon: <Store className="h-3.5 w-3.5" />,
        closable: true,
        group: "orders",
      };
    }
    if (path === "/dashboard/orders/dispatch") {
      return {
        id: "orders-dispatch",
        label: "去派单",
        path: "/dashboard/orders/dispatch",
        icon: <UserCheck className="h-3.5 w-3.5" />,
        closable: true,
        group: "orders",
      };
    }
    // 工单详情
    const orderDetailMatch = path.match(/^\/dashboard\/orders\/([^/]+)$/);
    if (orderDetailMatch) {
      return {
        id: `order-${orderDetailMatch[1]}`,
        label: "工单详情",
        path: path,
        icon: <FileText className="h-3.5 w-3.5" />,
        closable: true,
        group: "orders",
      };
    }
    // 人力资源
    if (path.startsWith("/dashboard/hr/")) {
      const hrPages: Record<string, { label: string; icon: ReactNode }> = {
        "recruitment": { label: "招聘管理", icon: <UserPlus className="h-3.5 w-3.5" /> },
        "archives": { label: "员工档案", icon: <Users className="h-3.5 w-3.5" /> },
        "contracts": { label: "合同管理", icon: <FileSignature className="h-3.5 w-3.5" /> },
        "dispatch": { label: "派遣项目", icon: <FolderKanban className="h-3.5 w-3.5" /> },
        "attendance": { label: "考勤管理", icon: <Clock className="h-3.5 w-3.5" /> },
        "payroll": { label: "薪酬管理", icon: <DollarSign className="h-3.5 w-3.5" /> },
        "training": { label: "培训管理", icon: <GraduationCap className="h-3.5 w-3.5" /> },
        "reports": { label: "统计报表", icon: <BarChart3 className="h-3.5 w-3.5" /> },
      };
      const hrPath = path.replace("/dashboard/hr/", "");
      const hrConfig = hrPages[hrPath];
      if (hrConfig) {
        return {
          id: `hr-${hrPath}`,
          label: hrConfig.label,
          path: path,
          icon: hrConfig.icon,
          closable: true,
          group: "hr",
        };
      }
    }
    // 销售中心
    if (path.startsWith("/dashboard/sales/")) {
      const salesPages: Record<string, { label: string; icon: ReactNode }> = {
        "overview": { label: "营销概览", icon: <TrendingUp className="h-3.5 w-3.5" /> },
        "leads": { label: "线索中心", icon: <Users className="h-3.5 w-3.5" /> },
        "channels": { label: "渠道管理", icon: <Store className="h-3.5 w-3.5" /> },
        "pool": { label: "客户公海", icon: <Inbox className="h-3.5 w-3.5" /> },
        "customers": { label: "我的客户", icon: <Users className="h-3.5 w-3.5" /> },
        "opportunities": { label: "商机管理", icon: <Target className="h-3.5 w-3.5" /> },
        "payments": { label: "回款管理", icon: <Wallet className="h-3.5 w-3.5" /> },
        "performance": { label: "销售业绩", icon: <DollarSign className="h-3.5 w-3.5" /> },
      };
      const salesPath = path.replace("/dashboard/sales/", "");
      const salesConfig = salesPages[salesPath];
      if (salesConfig) {
        return {
          id: `sales-${salesPath}`,
          label: salesConfig.label,
          path: path,
          icon: salesConfig.icon,
          closable: true,
          group: "sales",
        };
      }
    }
    // 税务日历
    if (path === "/dashboard/tax-calendar") {
      return {
        id: "tax-calendar",
        label: "税务日历",
        path: "/dashboard/tax-calendar",
        icon: <Calendar className="h-3.5 w-3.5" />,
        closable: true,
        group: "accounting",
      };
    }
    // 客户管理
    if (path === "/dashboard/customers") {
      return {
        id: "customers",
        label: "客户管理",
        path: "/dashboard/customers",
        icon: <Users className="h-3.5 w-3.5" />,
        closable: true,
      };
    }
    // 分润结算
    if (path === "/dashboard/profit-shares") {
      return {
        id: "profit-shares",
        label: "分润结算",
        path: "/dashboard/profit-shares",
        icon: <Wallet className="h-3.5 w-3.5" />,
        closable: true,
      };
    }
    
    return null;
  };

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

  // 监听路由变化，自动打开/切换标签页
  useEffect(() => {
    // 排除账务中心页面（它有自己的标签系统）
    if (pathname.startsWith("/accounting") || pathname.startsWith("/dashboard/ledgers")) {
      return;
    }
    
    // 工作台
    if (pathname === "/dashboard") {
      setActiveTab("dashboard");
      return;
    }
    
    // 根据路径自动创建标签页
    const tabConfig = getTabConfig(pathname);
    if (tabConfig) {
      setTabs((prev) => {
        const existingTab = prev.find((t) => t.path === pathname);
        if (!existingTab) {
          return [...prev, tabConfig!];
        }
        return prev;
      });
      
      const existingTab = tabs.find((t) => t.path === pathname);
      if (existingTab) {
        setActiveTab(existingTab.id);
      } else if (tabConfig) {
        setActiveTab(tabConfig.id);
      }
    }
  }, [pathname]);

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
        { name: "入驻申请", href: "/dashboard/base/applications", icon: FileText },
        { name: "入驻流程", href: "/dashboard/base/processes", icon: GitBranch },
        { name: "地址管理", href: "/dashboard/base/addresses", icon: MapPin },
        { name: "企业管理", href: "/dashboard/base/tenants", icon: Users },
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
    <TabsContext.Provider value={{ tabs, activeTab, openTab, closeTab, switchTab, updateTabLabel }}>
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

      {/* 全局标签栏 */}
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
              onClick={() => switchTab(tab.id)}
            >
              {tab.icon}
              <span className="max-w-[140px] truncate">{tab.label}</span>
              {tab.closable && tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
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
      <main className="lg:pl-56 pt-[6rem]">
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
    </TabsContext.Provider>
  );
}
