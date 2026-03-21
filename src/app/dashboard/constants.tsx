import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  FileText,
  Building2,
  MapPin,
  Inbox,
  UserCheck,
  Store,
  Calendar,
  UserCog,
  Briefcase,
  TrendingUp,
  Target,
  Wallet,
  DollarSign,
  GraduationCap,
  BarChart3,
  UserPlus,
  FolderKanban,
  Clock,
  FileSignature,
  GitBranch,
  Building,
  Home,
  FileCheck,
} from "lucide-react";
import { NavItem, NavChildItem, RoleMap } from "./types";

/**
 * 角色名称映射
 */
export const ROLE_MAP: RoleMap = {
  admin: "管理员",
  accountant: "会计",
  sales: "销售",
};

/**
 * 基础导航配置（静态部分）
 */
export const BASE_NAVIGATION: NavItem[] = [
  {
    name: "仪表盘",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
];

/**
 * 入驻管理子菜单（基地管理下的二级菜单）
 */
export const SETTLEMENT_CHILDREN: NavChildItem[] = [
  { name: "入驻申请", href: "/dashboard/base/applications", icon: FileText },
  { name: "入驻审批", href: "/dashboard/base/processes", icon: GitBranch },
];

/**
 * 基地管理子菜单
 */
export const BASE_MANAGEMENT_CHILDREN: NavChildItem[] = [
  { name: "基地列表", href: "/dashboard/base/sites", icon: Building },
  { name: "入驻管理", href: "", icon: FileCheck, children: SETTLEMENT_CHILDREN },
  { name: "企业管理", href: "/dashboard/base/tenants", icon: Users },
  { name: "地址管理", href: "/dashboard/base/addresses", icon: MapPin },
  { name: "合同管理", href: "/dashboard/base/contracts", icon: FileSignature },
];

/**
 * 工单大厅子菜单
 */
export const ORDERS_CHILDREN: NavChildItem[] = [
  { name: "我的工单", href: "/dashboard/orders/mine", icon: Inbox, badge: "3" },
  { name: "去抢单", href: "/dashboard/orders/hall", icon: Store, badge: "5" },
];

/**
 * 派单功能（销售专属）
 */
export const ORDERS_DISPATCH: NavChildItem = {
  name: "去派单",
  href: "/dashboard/orders/dispatch",
  icon: UserCheck,
};

/**
 * 账务中心子菜单
 */
export const ACCOUNTING_CHILDREN = [
  { name: "去记账", href: "/accounting", icon: BookOpen },
  { name: "税务日历", href: "/dashboard/tax-calendar", icon: Calendar },
];

/**
 * 人力资源子菜单
 */
export const HR_CHILDREN = [
  { name: "招聘管理", href: "/dashboard/hr/recruitment", icon: UserPlus, badge: "56" },
  { name: "员工档案", href: "/dashboard/hr/archives", icon: Users, badge: "322" },
  { name: "合同管理", href: "/dashboard/hr/contracts", icon: FileSignature, badge: "5" },
  { name: "派遣项目", href: "/dashboard/hr/dispatch", icon: FolderKanban },
  { name: "考勤管理", href: "/dashboard/hr/attendance", icon: Clock },
  { name: "薪酬管理", href: "/dashboard/hr/payroll", icon: DollarSign },
  { name: "培训管理", href: "/dashboard/hr/training", icon: GraduationCap },
  { name: "统计报表", href: "/dashboard/hr/reports", icon: BarChart3 },
];

/**
 * 销售中心子菜单
 */
export const SALES_CHILDREN = [
  { name: "营销概览", href: "/dashboard/sales/overview", icon: TrendingUp },
  { name: "线索中心", href: "/dashboard/sales/leads", icon: Users, badge: "42" },
  { name: "渠道管理", href: "/dashboard/sales/channels", icon: Store },
  { name: "客户公海", href: "/dashboard/sales/pool", icon: Inbox },
  { name: "我的客户", href: "/dashboard/sales/customers", icon: Users },
  { name: "商机管理", href: "/dashboard/sales/opportunities", icon: Target },
  { name: "回款管理", href: "/dashboard/sales/payments", icon: Wallet },
  { name: "销售业绩", href: "/dashboard/sales/performance", icon: DollarSign },
];

/**
 * 获取导航配置
 * @param userRole 用户角色
 * @returns 完整的导航配置
 */
export function getNavigation(userRole?: string): NavItem[] {
  // 工单大厅子菜单（根据角色动态添加派单功能）
  const ordersChildren = [...ORDERS_CHILDREN];
  if (userRole === "sales" || userRole === "admin") {
    ordersChildren.push(ORDERS_DISPATCH);
  }

  return [
    ...BASE_NAVIGATION,
    {
      name: "基地管理",
      icon: MapPin,
      expandable: true,
      badge: null,
      children: BASE_MANAGEMENT_CHILDREN,
    },
    {
      name: "工单大厅",
      href: "/dashboard/orders",
      icon: ClipboardList,
      expandable: true,
      badge: null,
      children: ordersChildren,
    },
    {
      name: "账务中心",
      icon: FileText,
      expandable: true,
      badge: null,
      children: ACCOUNTING_CHILDREN,
    },
    {
      name: "人力资源",
      icon: UserCog,
      expandable: true,
      badge: null,
      children: HR_CHILDREN,
    },
    {
      name: "销售中心",
      icon: Briefcase,
      expandable: true,
      badge: null,
      children: SALES_CHILDREN,
    },
  ];
}
