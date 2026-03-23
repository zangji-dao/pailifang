import { ReactNode } from "react";
import {
  Building,
  FileText,
  GitBranch,
  MapPin,
  Users,
  FileSignature,
  Home,
  ClipboardList,
  Inbox,
  Store,
  UserCheck,
  Calendar,
  UserPlus,
  DollarSign,
  GraduationCap,
  BarChart3,
  FolderKanban,
  Clock,
  TrendingUp,
  Target,
  Wallet,
  Receipt,
} from "lucide-react";
import { Tab } from "./types";

/**
 * 标签页配置类型
 */
interface TabConfig {
  id: string;
  label: string;
  icon: ReactNode;
  group?: string;
}

/**
 * 入驻管理标签页配置
 */
const SETTLEMENT_TAB_CONFIGS: Record<string, TabConfig> = {
  applications: { id: "settlement-applications", label: "入驻申请", icon: <FileText className="h-3.5 w-3.5" />, group: "settlement" },
  processes: { id: "settlement-processes", label: "入驻审批", icon: <GitBranch className="h-3.5 w-3.5" />, group: "settlement" },
};

/**
 * 基地管理标签页配置
 */
const BASE_TAB_CONFIGS: Record<string, TabConfig> = {
  sites: { id: "base-sites", label: "基地管理", icon: <Building className="h-3.5 w-3.5" />, group: "base" },
  addresses: { id: "base-addresses", label: "地址管理", icon: <MapPin className="h-3.5 w-3.5" />, group: "base" },
  finances: { id: "base-finances", label: "资金管理", icon: <Receipt className="h-3.5 w-3.5" />, group: "base" },
  tenants: { id: "base-tenants", label: "企业管理", icon: <Users className="h-3.5 w-3.5" />, group: "base" },
  contracts: { id: "base-contracts", label: "合同管理", icon: <FileSignature className="h-3.5 w-3.5" />, group: "base" },
};

/**
 * 工单大厅标签页配置
 */
const ORDERS_TAB_CONFIGS: Record<string, TabConfig> = {
  mine: { id: "orders-mine", label: "我的工单", icon: <Inbox className="h-3.5 w-3.5" />, group: "orders" },
  hall: { id: "orders-hall", label: "去抢单", icon: <Store className="h-3.5 w-3.5" />, group: "orders" },
  dispatch: { id: "orders-dispatch", label: "去派单", icon: <UserCheck className="h-3.5 w-3.5" />, group: "orders" },
};

/**
 * 人力资源标签页配置
 */
const HR_TAB_CONFIGS: Record<string, TabConfig> = {
  recruitment: { id: "hr-recruitment", label: "招聘管理", icon: <UserPlus className="h-3.5 w-3.5" />, group: "hr" },
  archives: { id: "hr-archives", label: "员工档案", icon: <Users className="h-3.5 w-3.5" />, group: "hr" },
  contracts: { id: "hr-contracts", label: "合同管理", icon: <FileSignature className="h-3.5 w-3.5" />, group: "hr" },
  dispatch: { id: "hr-dispatch", label: "派遣项目", icon: <FolderKanban className="h-3.5 w-3.5" />, group: "hr" },
  attendance: { id: "hr-attendance", label: "考勤管理", icon: <Clock className="h-3.5 w-3.5" />, group: "hr" },
  payroll: { id: "hr-payroll", label: "薪酬管理", icon: <DollarSign className="h-3.5 w-3.5" />, group: "hr" },
  training: { id: "hr-training", label: "培训管理", icon: <GraduationCap className="h-3.5 w-3.5" />, group: "hr" },
  reports: { id: "hr-reports", label: "统计报表", icon: <BarChart3 className="h-3.5 w-3.5" />, group: "hr" },
};

/**
 * 销售中心标签页配置
 */
const SALES_TAB_CONFIGS: Record<string, TabConfig> = {
  overview: { id: "sales-overview", label: "营销概览", icon: <TrendingUp className="h-3.5 w-3.5" />, group: "sales" },
  leads: { id: "sales-leads", label: "线索中心", icon: <Users className="h-3.5 w-3.5" />, group: "sales" },
  channels: { id: "sales-channels", label: "渠道管理", icon: <Store className="h-3.5 w-3.5" />, group: "sales" },
  pool: { id: "sales-pool", label: "客户公海", icon: <Inbox className="h-3.5 w-3.5" />, group: "sales" },
  customers: { id: "sales-customers", label: "我的客户", icon: <Users className="h-3.5 w-3.5" />, group: "sales" },
  opportunities: { id: "sales-opportunities", label: "商机管理", icon: <Target className="h-3.5 w-3.5" />, group: "sales" },
  payments: { id: "sales-payments", label: "回款管理", icon: <Wallet className="h-3.5 w-3.5" />, group: "sales" },
  performance: { id: "sales-performance", label: "销售业绩", icon: <DollarSign className="h-3.5 w-3.5" />, group: "sales" },
};

/**
 * 根据路径获取标签页配置
 * @param path 当前路径
 * @returns 标签页配置，如果没有匹配则返回 null
 */
export function getTabConfig(path: string): Tab | null {
  // 入驻管理（优先匹配，因为路径仍在 /dashboard/base/ 下）
  if (path === "/dashboard/base/applications" || path === "/dashboard/base/processes") {
    const pathMatch = path.match(/^\/dashboard\/base\/([^/]+)$/);
    if (pathMatch) {
      const subPath = pathMatch[1];
      const config = SETTLEMENT_TAB_CONFIGS[subPath];
      if (config) {
        return {
          ...config,
          path: path,
          closable: true,
        };
      }
    }
  }

  // 基地管理
  if (path.startsWith("/dashboard/base/")) {
    const baseMatch = path.match(/^\/dashboard\/base\/([^/]+)$/);
    if (baseMatch) {
      const subPath = baseMatch[1];
      // 检查是否是基地详情页（UUID 格式）
      if (subPath.length === 36 && subPath.includes("-")) {
        return {
          id: `base-${subPath}`,
          label: "基地详情",
          path: path,
          icon: <Home className="h-3.5 w-3.5" />,
          closable: true,
          group: "base",
        };
      }
      const config = BASE_TAB_CONFIGS[subPath];
      if (config) {
        return {
          ...config,
          path: path,
          closable: true,
        };
      }
    }
    return null;
  }

  // 工单大厅
  if (path === "/dashboard/orders") {
    return {
      id: "orders",
      label: "工单大厅",
      path: path,
      icon: <ClipboardList className="h-3.5 w-3.5" />,
      closable: true,
      group: "orders",
    };
  }

  if (path.startsWith("/dashboard/orders/")) {
    const orderMatch = path.match(/^\/dashboard\/orders\/([^/]+)$/);
    if (orderMatch) {
      const subPath = orderMatch[1];
      // 检查是否是工单详情页
      if (subPath.length === 36 && subPath.includes("-")) {
        return {
          id: `order-${subPath}`,
          label: "工单详情",
          path: path,
          icon: <FileText className="h-3.5 w-3.5" />,
          closable: true,
          group: "orders",
        };
      }
      const config = ORDERS_TAB_CONFIGS[subPath];
      if (config) {
        return {
          ...config,
          path: path,
          closable: true,
        };
      }
    }
    return null;
  }

  // 人力资源
  if (path.startsWith("/dashboard/hr/")) {
    const hrMatch = path.match(/^\/dashboard\/hr\/([^/]+)$/);
    if (hrMatch) {
      const config = HR_TAB_CONFIGS[hrMatch[1]];
      if (config) {
        return {
          ...config,
          path: path,
          closable: true,
        };
      }
    }
    return null;
  }

  // 销售中心
  if (path.startsWith("/dashboard/sales/")) {
    const salesMatch = path.match(/^\/dashboard\/sales\/([^/]+)$/);
    if (salesMatch) {
      const config = SALES_TAB_CONFIGS[salesMatch[1]];
      if (config) {
        return {
          ...config,
          path: path,
          closable: true,
        };
      }
    }
    return null;
  }

  // 税务日历
  if (path === "/dashboard/tax-calendar") {
    return {
      id: "tax-calendar",
      label: "税务日历",
      path: path,
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
      path: path,
      icon: <Users className="h-3.5 w-3.5" />,
      closable: true,
    };
  }

  // 分润结算
  if (path === "/dashboard/profit-shares") {
    return {
      id: "profit-shares",
      label: "分润结算",
      path: path,
      icon: <Wallet className="h-3.5 w-3.5" />,
      closable: true,
    };
  }

  return null;
}
