"use client";

import { useState, useEffect, ReactNode } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import {
  Home,
  FileText,
  Banknote,
  Receipt,
  Briefcase,
  Package,
  RefreshCw,
  BookOpen,
  BarChart3,
  Rocket,
  Settings,
  ChevronRight,
  Users,
  Building2,
  Calculator,
  ArrowLeft,
  X,
  Import,
  Calendar,
  FileSpreadsheet,
  Shield,
  Eye,
  Database,
  History,
  Link2,
  Repeat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LedgerContext } from "./ledger-context";

// 主菜单项类型（一级菜单）
interface MainMenuItem {
  id: string;
  label: string;
  icon: ReactNode;
  path?: string;
  badge?: number | string;
  hasPanel?: boolean; // 是否有二级面板
}

// 设置面板菜单项类型
interface SettingsMenuItem {
  id?: string;
  label?: string;
  icon?: ReactNode;
  path?: string;
  divider?: boolean; // 是否是分隔线
  category?: string; // 分类标题
}

// 主菜单配置（一级菜单）
const mainMenuConfig: MainMenuItem[] = [
  {
    id: "home",
    label: "首页",
    icon: <Home className="h-4 w-4" />,
    path: "",
  },
  {
    id: "voucher",
    label: "凭证",
    icon: <FileText className="h-4 w-4" />,
    path: "voucher",
    badge: 3,
  },
  {
    id: "fund",
    label: "资金",
    icon: <Banknote className="h-4 w-4" />,
    path: "fund",
  },
  {
    id: "invoice",
    label: "发票",
    icon: <Receipt className="h-4 w-4" />,
    path: "invoice",
  },
  {
    id: "salary",
    label: "工资",
    icon: <Briefcase className="h-4 w-4" />,
    path: "salary",
  },
  {
    id: "asset",
    label: "资产",
    icon: <Package className="h-4 w-4" />,
    path: "asset",
  },
  {
    id: "period-end",
    label: "期末结转",
    icon: <RefreshCw className="h-4 w-4" />,
    path: "period-end",
  },
  {
    id: "ledger-book",
    label: "账簿",
    icon: <BookOpen className="h-4 w-4" />,
    path: "ledger-book",
  },
  {
    id: "reports",
    label: "报表",
    icon: <BarChart3 className="h-4 w-4" />,
    path: "reports",
  },
  {
    id: "tax",
    label: "一键报税",
    icon: <Rocket className="h-4 w-4" />,
    path: "tax",
  },
  {
    id: "settings",
    label: "设置",
    icon: <Settings className="h-4 w-4" />,
    hasPanel: true, // 设置有二级面板
  },
];

// 设置面板菜单配置
const settingsPanelConfig: SettingsMenuItem[] = [
  { category: "账套" },
  { id: "import", label: "导入免费版账套", icon: <Import className="h-4 w-4" /> },
  { divider: true },
  { id: "subjects", label: "科目", icon: <Calculator className="h-4 w-4" />, path: "settings/subjects" },
  { id: "opening", label: "期初", icon: <BookOpen className="h-4 w-4" />, path: "settings/opening" },
  { id: "currency", label: "币别", icon: <Banknote className="h-4 w-4" />, path: "settings/currency" },
  { id: "voucher-word", label: "凭证字", icon: <FileText className="h-4 w-4" />, path: "settings/voucher-word" },
  { id: "auxiliary", label: "辅助核算", icon: <Users className="h-4 w-4" />, path: "settings/auxiliary" },
  { id: "voucher-template", label: "凭证模板", icon: <FileSpreadsheet className="h-4 w-4" />, path: "settings/voucher-template" },
  { id: "permissions", label: "权限设置", icon: <Shield className="h-4 w-4" />, path: "settings/permissions" },
  { divider: true },
  { id: "boss-view", label: "老板看账", icon: <Eye className="h-4 w-4" />, path: "settings/boss-view" },
  { id: "backup", label: "备份恢复", icon: <Database className="h-4 w-4" />, path: "settings/backup" },
  { id: "logs", label: "操作日志", icon: <History className="h-4 w-4" />, path: "settings/logs" },
  { id: "link-invoice", label: "关联云发票", icon: <Link2 className="h-4 w-4" />, path: "settings/link-invoice" },
  { id: "link-inventory", label: "关联进销存", icon: <Package className="h-4 w-4" />, path: "settings/link-inventory" },
  { id: "old-import", label: "旧账导入", icon: <Import className="h-4 w-4" />, path: "settings/old-import" },
  { id: "reinit", label: "重新初始化", icon: <Repeat className="h-4 w-4" />, path: "settings/reinit" },
  { divider: true },
  { id: "company", label: "企业信息", icon: <Building2 className="h-4 w-4" />, path: "settings/company" },
];

interface LedgerDetailLayoutProps {
  children: ReactNode;
}

export default function LedgerDetailLayout({ children }: LedgerDetailLayoutProps) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const ledgerId = params.id as string;

  const [ledgerInfo, setLedgerInfo] = useState<{
    name: string;
    year: number;
    standard: string;
  } | null>(null);

  const [activePath, setActivePath] = useState<string>("");
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // 获取账套信息
  useEffect(() => {
    setLedgerInfo({
      name: "杭州某某科技有限公司",
      year: 2024,
      standard: "小企业会计准则",
    });
  }, [ledgerId]);

  // 解析当前路径
  useEffect(() => {
    const base = `/dashboard/ledgers/${ledgerId}`;
    const pathSegment = pathname.replace(base + "/", "").replace(base, "");
    setActivePath(pathSegment);
    
    // 如果在设置页面，自动打开设置面板
    if (pathSegment.startsWith("settings")) {
      setShowSettingsPanel(true);
    }
  }, [pathname, ledgerId]);

  // 导航到菜单
  const navigateTo = (path: string) => {
    router.push(`/dashboard/ledgers/${ledgerId}/${path}`);
  };

  // 检查是否在设置页面
  const isInSettings = activePath.startsWith("settings");

  return (
    <LedgerContext.Provider value={{ ledgerId, ledgerInfo }}>
      {/* 使用固定定位，避开顶部导航和左侧边栏 */}
      <div className="fixed inset-0 top-14 lg:left-56 flex bg-slate-100 -m-4 lg:-m-6">
        {/* 左侧主菜单 */}
        <div className="w-14 bg-slate-800 flex flex-col items-center shrink-0 relative">
          {/* Logo区域 */}
          <div className="h-12 flex items-center justify-center border-b border-slate-700">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Π</span>
            </div>
          </div>

          {/* 返回工作台按钮 */}
          <button
            onClick={() => router.push("/dashboard/ledgers")}
            className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors border-b border-slate-700/50"
            title="返回工作台"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {/* 菜单项 */}
          <nav className="flex-1 py-2 overflow-y-auto">
            <div className="flex flex-col items-center space-y-1">
              {mainMenuConfig.map((item) => {
                const isActive = item.path === activePath || 
                  (item.id === "settings" && isInSettings);
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.hasPanel) {
                        setShowSettingsPanel(!showSettingsPanel);
                      } else if (item.path !== undefined) {
                        setShowSettingsPanel(false);
                        navigateTo(item.path);
                      }
                    }}
                    className={cn(
                      "w-12 h-12 flex flex-col items-center justify-center rounded-lg transition-all relative group",
                      isActive
                        ? "bg-amber-500 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                    )}
                    title={item.label}
                  >
                    {item.icon}
                    {item.badge && (
                      <span className="absolute top-1 right-1 min-w-4 h-4 px-1 text-[10px] font-medium bg-red-500 text-white rounded-full flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                    {item.hasPanel && showSettingsPanel && (
                      <ChevronRight className="h-3 w-3 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* 设置面板（滑出式，绝对定位悬浮在主菜单右侧） */}
        <div
          className={cn(
            "absolute left-14 top-0 bottom-0 w-48 bg-white border-r border-slate-200 flex flex-col z-10 transition-all duration-300 ease-in-out",
            showSettingsPanel ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none"
          )}
        >
          {/* 面板头部 */}
          <div className="h-12 flex items-center justify-between px-4 border-b border-slate-100">
            <span className="text-sm font-medium text-slate-700">设置</span>
            <button
              onClick={() => setShowSettingsPanel(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 面板菜单 */}
          <nav className="flex-1 py-2 overflow-y-auto">
            {settingsPanelConfig.map((item, index) => {
              // 分类标题
              if (item.category) {
                return (
                  <div key={`category-${index}`} className="px-4 py-2">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>
                );
              }

              // 分隔线
              if (item.divider) {
                return <div key={`divider-${index}`} className="my-2 border-t border-slate-100" />;
              }

              // 菜单项
              const isActive = item.path === activePath;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.path) {
                      navigateTo(item.path);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left",
                    isActive
                      ? "bg-amber-50 text-amber-600 font-medium border-r-2 border-amber-500"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  {item.icon && (
                    <span className={isActive ? "text-amber-500" : "text-slate-400"}>
                      {item.icon}
                    </span>
                  )}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </LedgerContext.Provider>
  );
}
