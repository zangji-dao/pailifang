"use client";

import { useDeferredValue, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  MoreHorizontal,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Settings2,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/confirm-dialog";
import {
  BrowserTabsBar,
  BrowserTabsContent,
  BrowserTabsProvider,
  BrowserTab,
} from "@/components/browser-tabs";
import { cn } from "@/lib/utils";
import { Header } from "@/app/dashboard/_components/Header";
import type { User } from "@/app/dashboard/types";
import { SubjectsListPage } from "../subjects";
import { AuxiliarySettingsPage } from "../auxiliary";
import { CurrencySettingsPage } from "../currency";
import { OpeningBalancePage } from "../opening";
import { getSubjectsByStandard } from "@/data/accounting-subjects";
import {
  AccountingModule,
  ACCOUNTING_TODAY,
  Voucher,
  VoucherDraft,
  useAccountingStore,
} from "../_lib/accounting-store";
import { VoucherEditor } from "./VoucherEditor";
import { DashboardPage } from "./DashboardPage";
import { VouchersPage } from "./VouchersPage";
import { AssetsPage, FundsPage, InvoicesPage, PayrollPage } from "./BusinessPages";
import { ClosingPage, LedgerSettingsPage, TaxPage } from "./ClosingTaxSettingsPages";
import { LedgersPage, ReportsPage } from "./LedgerReportsPages";

interface NavigationItem {
  key: AccountingModule;
  label: string;
  icon: LucideIcon;
  badge?: string;
  children?: NavigationChild[];
}

interface NavigationChild {
  key: string;
  label: string;
  target?: AccountingModule;
  action?: "newVoucher";
}

const primaryNavigation: NavigationItem[] = [
  { key: "home", label: "首页", icon: LayoutDashboard },
  {
    key: "vouchers",
    label: "凭证",
    icon: FileText,
    children: [
      { key: "voucher-new", label: "新增凭证", action: "newVoucher" },
      { key: "voucher-list", label: "查看凭证" },
      { key: "voucher-scm", label: "进销存凭证", target: "invoices" },
      { key: "voucher-archive", label: "会计电子档案" },
      { key: "voucher-receipts", label: "收票宝", target: "invoices" },
    ],
  },
  {
    key: "funds",
    label: "资金",
    icon: WalletCards,
    children: ["现金日记账", "银行日记账", "内部转账", "资金管理", "资金报表", "核对总账", "收支类别", "账户设置"].map((label, index) => ({ key: `funds-${index}`, label })),
  },
  {
    key: "invoices",
    label: "发票",
    icon: Receipt,
    children: ["一键取票", "销项发票", "进项发票", "费用单据", "增值税测算", "资金一览表", "发票风险分析"].map((label, index) => ({ key: `invoice-${index}`, label })),
  },
  {
    key: "payroll",
    label: "工资",
    icon: Users,
    children: ["工资管理", "员工信息", "工资统计表", "五险一金设置"].map((label, index) => ({ key: `payroll-${index}`, label })),
  },
  {
    key: "assets",
    label: "资产",
    icon: Package,
    children: ["资产管理", "折旧摊销明细表", "资产汇总表", "资产类别设置", "资产核对总账"].map((label, index) => ({ key: `asset-${index}`, label })),
  },
  { key: "closing", label: "期末结转", icon: RotateCcw },
  {
    key: "ledgers",
    label: "账簿",
    icon: BookOpen,
    children: ["明细账", "总账", "科目余额表", "科目汇总表", "序时账", "辅助明细账", "辅助余额表", "辅助组合表", "多栏账", "账龄分析表"].map((label, index) => ({ key: `ledger-${index}`, label })),
  },
  {
    key: "reports",
    label: "报表",
    icon: BarChart3,
    children: ["资产负债表", "利润表", "利润表季报", "现金流量表", "现金流量表季报", "标准现金流量表", "部门利润表", "项目利润表", "数据透视表", "费用明细表", "所有者权益变动表", "纳税统计表", "财务概要"].map((label, index) => ({ key: `report-${index}`, label })),
  },
  {
    key: "tax",
    label: "一键报税",
    icon: FileSpreadsheet,
    children: [
      { key: "tax-workbench", label: "一键报税" },
      { key: "tax-login", label: "一键登录税局" },
    ],
  },
  {
    key: "ledgerSettings",
    label: "设置",
    icon: Settings2,
    children: [
      { key: "settings-account", label: "账套", target: "ledgerSettings" },
      { key: "settings-subjects", label: "会计科目", target: "subjects" },
      { key: "settings-opening", label: "期初余额", target: "opening" },
      { key: "settings-currency", label: "币种", target: "currency" },
      { key: "settings-auxiliary", label: "辅助核算", target: "auxiliary" },
      { key: "settings-groups", label: "凭证字", target: "ledgerSettings" },
      { key: "settings-template", label: "凭证模板", target: "ledgerSettings" },
      { key: "settings-permissions", label: "权限设置", target: "ledgerSettings" },
      { key: "settings-backup", label: "备份恢复", target: "ledgerSettings" },
      { key: "settings-log", label: "操作日志", target: "ledgerSettings" },
    ],
  },
];

const mobileNavigation: NavigationItem[] = [
  { key: "home", label: "首页", icon: LayoutDashboard },
  { key: "vouchers", label: "凭证", icon: FileText },
  { key: "funds", label: "资金", icon: WalletCards },
  { key: "reports", label: "报表", icon: BarChart3 },
];

const moduleTitles: Record<AccountingModule, string> = {
  home: "首页",
  vouchers: "查看凭证",
  funds: "现金日记账",
  invoices: "销项发票",
  payroll: "工资管理",
  assets: "资产管理",
  closing: "期末结转",
  ledgers: "科目余额表",
  reports: "资产负债表",
  tax: "一键报税",
  subjects: "会计科目",
  auxiliary: "辅助核算",
  currency: "币种",
  opening: "期初余额",
  ledgerSettings: "账套",
};

function parentModule(module: AccountingModule): AccountingModule {
  return (["subjects", "auxiliary", "currency", "opening", "ledgerSettings"] as AccountingModule[]).includes(module)
    ? "ledgerSettings"
    : module;
}

function periodOptions(period: string) {
  const [year, month] = period.split("-").map(Number);
  return Array.from({ length: 18 }, (_, index) => {
    const date = new Date(year, month - 1 - index, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
}

function accountingDate(period: string) {
  return ACCOUNTING_TODAY.startsWith(period) ? ACCOUNTING_TODAY : `${period}-01`;
}

const DEFAULT_ACCOUNTING_USER: User = {
  id: "local-admin",
  name: "本地管理员",
  email: "admin@local.pi-cube",
  role: "admin",
};

function subscribeToStoredUser() {
  return () => undefined;
}

function readStoredUser() {
  return window.localStorage.getItem("user");
}

export function AccountingWorkbench() {
  const confirm = useConfirm();
  const router = useRouter();
  const storedUser = useSyncExternalStore(subscribeToStoredUser, readStoredUser, () => null);
  const currentUser = useMemo(() => {
    if (!storedUser) return DEFAULT_ACCOUNTING_USER;
    try {
      return JSON.parse(storedUser) as User;
    } catch {
      return DEFAULT_ACCOUNTING_USER;
    }
  }, [storedUser]);
  const {
    state,
    subjectBalances,
    saveVoucher,
    setVoucherStatus,
    deleteVoucher,
    bookInvoice,
    bookPayroll,
    depreciateAssets,
    closePeriod,
    reopenPeriod,
    setPeriod,
    resetDemo,
  } = useAccountingStore();
  const [activeModule, setActiveModule] = useState<AccountingModule>("home");
  const [activePageLabel, setActivePageLabel] = useState("首页");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | undefined>();
  const deferredModule = useDeferredValue(activeModule);
  const deferredPageLabel = useDeferredValue(activePageLabel);
  const deferredEditorOpen = useDeferredValue(editorOpen);
  const isNavigating = deferredModule !== activeModule || deferredPageLabel !== activePageLabel || deferredEditorOpen !== editorOpen;

  const handleLogout = () => {
    window.localStorage.removeItem("user");
    window.localStorage.removeItem("isLoggedIn");
    router.push("/login");
  };

  const pendingCount = state.vouchers.filter((voucher) => voucher.status === "pending").length;
  const navigation = useMemo(
    () => primaryNavigation.map((item) => item.key === "vouchers" ? { ...item, badge: pendingCount ? String(pendingCount) : undefined } : item),
    [pendingCount]
  );

  const navigate = (module: AccountingModule, label = moduleTitles[module]) => {
    setActiveModule(module);
    setActivePageLabel(label);
    setEditorOpen(false);
    setMobileMenuOpen(false);
  };

  const openNewVoucher = () => {
    setActiveModule("vouchers");
    setActivePageLabel("新增凭证");
    setEditingVoucher(undefined);
    setEditorOpen(true);
    setMobileMenuOpen(false);
  };

  const openEditVoucher = (voucher: Voucher) => {
    setActiveModule("vouchers");
    setActivePageLabel(`编辑凭证 ${voucher.voucherNo}`);
    setEditingVoucher(voucher);
    setEditorOpen(true);
  };

  const openCopyVoucher = (voucher: Voucher) => {
    setActiveModule("vouchers");
    setActivePageLabel("复制凭证");
    setEditingVoucher({
      ...voucher,
      id: "",
      voucherNo: "自动编号",
      status: "draft",
      reviewedBy: undefined,
    });
    setEditorOpen(true);
  };

  const closeVoucherEditor = () => {
    setEditorOpen(false);
    setEditingVoucher(undefined);
    setActiveModule("vouchers");
    setActivePageLabel("查看凭证");
  };

  const handleSaveVoucher = (draft: VoucherDraft) => {
    saveVoucher(draft);
  };

  const handleStatusChange = (voucherId: string, status: "draft" | "pending" | "posted" | "void") => {
    setVoucherStatus(voucherId, status);
    toast.success(status === "posted" ? "凭证已审核过账" : status === "void" ? "凭证已作废" : "凭证状态已更新");
  };

  const handleDeleteVoucher = async (voucherId: string) => {
    const confirmed = await confirm({
      title: "删除草稿凭证",
      description: "删除后无法恢复，确定继续吗？",
      confirmText: "确认删除",
      variant: "destructive",
    });
    if (!confirmed) return;
    deleteVoucher(voucherId);
    toast.success("草稿凭证已删除");
  };

  const handleResetDemo = async () => {
    const confirmed = await confirm({
      title: "重置本机演示账簿",
      description: "当前浏览器中的凭证、发票、工资和资产数据都会恢复为初始示例。",
      confirmText: "确认重置",
      variant: "destructive",
    });
    if (!confirmed) return;
    resetDemo();
    toast.success("演示账簿已重置");
  };

  const createInvoiceVoucher = (invoiceId: string) => {
    const invoice = state.invoices.find((item) => item.id === invoiceId);
    if (!invoice || invoice.status === "booked") return;
    const total = invoice.amount + invoice.taxAmount;
    saveVoucher({
      voucherDate: invoice.invoiceDate,
      summary: `${invoice.type === "sales" ? "确认销售" : "确认采购"}发票 ${invoice.number}`,
      attachmentCount: 1,
      status: "pending",
      entries: invoice.type === "sales"
        ? [
            { summary: "确认应收款", subjectCode: "1122", subjectName: "应收账款", debit: total, credit: 0 },
            { summary: "确认主营业务收入", subjectCode: "6001", subjectName: "主营业务收入", debit: 0, credit: invoice.amount },
            ...(invoice.taxAmount > 0 ? [{ summary: "确认销项税额", subjectCode: "2221", subjectName: "应交税费", debit: 0, credit: invoice.taxAmount }] : []),
          ]
        : [
            { summary: "确认采购费用", subjectCode: "6602", subjectName: "管理费用", debit: invoice.amount, credit: 0 },
            ...(invoice.taxAmount > 0 ? [{ summary: "确认进项税额", subjectCode: "2221", subjectName: "应交税费", debit: invoice.taxAmount, credit: 0 }] : []),
            { summary: "确认应付款", subjectCode: "2202", subjectName: "应付账款", debit: 0, credit: total },
          ],
    });
    bookInvoice(invoiceId);
    navigate("vouchers", "查看凭证");
    toast.success("发票已生成待审核凭证");
  };

  const createPayrollVoucher = (payrollId: string) => {
    const payroll = state.payrolls.find((item) => item.id === payrollId);
    if (!payroll || payroll.status === "booked") return;
    saveVoucher({
      voucherDate: accountingDate(state.company.period),
      summary: `计提 ${payroll.period} 职工薪酬`,
      attachmentCount: 1,
      status: "pending",
      entries: [
        { summary: "计提职工薪酬", subjectCode: "6602", subjectName: "管理费用", debit: payroll.grossAmount, credit: 0 },
        { summary: "确认应付职工薪酬", subjectCode: "2211", subjectName: "应付职工薪酬", debit: 0, credit: payroll.grossAmount },
      ],
    });
    bookPayroll(payrollId);
    navigate("vouchers", "查看凭证");
    toast.success("工资表已生成待审核凭证");
  };

  const handleDepreciate = () => {
    const assets = state.assets.filter((asset) => asset.status === "active" && asset.depreciatedMonths === 0);
    if (!assets.length) {
      toast.info("本期固定资产折旧已计提");
      return;
    }
    const monthlyAmount = assets.reduce(
      (sum, asset) => sum + (asset.originalValue * (1 - asset.residualRate / 100)) / asset.usefulMonths,
      0
    );
    depreciateAssets();
    saveVoucher({
      voucherDate: accountingDate(state.company.period),
      summary: `计提 ${state.company.period} 固定资产折旧`,
      attachmentCount: 1,
      status: "pending",
      entries: [
        { summary: "计提固定资产折旧", subjectCode: "6602", subjectName: "管理费用", debit: Number(monthlyAmount.toFixed(2)), credit: 0 },
        { summary: "累计折旧", subjectCode: "1602", subjectName: "累计折旧", debit: 0, credit: Number(monthlyAmount.toFixed(2)) },
      ],
    });
    toast.success("折旧已计提并生成待审核凭证");
  };

  const selectNavigation = (item: NavigationItem, child?: NavigationChild) => {
    if (child?.action === "newVoucher") {
      openNewVoucher();
      return;
    }
    navigate(child?.target || item.key, child?.label || moduleTitles[item.key]);
  };

  const renderModule = () => {
    if (deferredEditorOpen) {
      return (
        <VoucherEditor
          key={editingVoucher?.id || deferredPageLabel}
          voucher={editingVoucher}
          period={state.company.period}
          onClose={closeVoucherEditor}
          onSave={handleSaveVoucher}
        />
      );
    }
    switch (deferredModule) {
      case "home":
        return <DashboardPage state={state} onNavigate={navigate} onNewVoucher={openNewVoucher} />;
      case "vouchers":
        return <VouchersPage vouchers={state.vouchers} period={state.company.period} onNewVoucher={openNewVoucher} onEditVoucher={openEditVoucher} onCopyVoucher={openCopyVoucher} onStatusChange={handleStatusChange} onDeleteVoucher={handleDeleteVoucher} />;
      case "funds":
        return <FundsPage key={deferredPageLabel} state={state} pageLabel={deferredPageLabel} />;
      case "invoices":
        return <InvoicesPage key={deferredPageLabel} state={state} pageLabel={deferredPageLabel} onCreateInvoiceVoucher={createInvoiceVoucher} onCreatePayrollVoucher={createPayrollVoucher} onDepreciate={handleDepreciate} />;
      case "payroll":
        return <PayrollPage key={deferredPageLabel} state={state} pageLabel={deferredPageLabel} onCreateInvoiceVoucher={createInvoiceVoucher} onCreatePayrollVoucher={createPayrollVoucher} onDepreciate={handleDepreciate} />;
      case "assets":
        return <AssetsPage key={deferredPageLabel} state={state} pageLabel={deferredPageLabel} onCreateInvoiceVoucher={createInvoiceVoucher} onCreatePayrollVoucher={createPayrollVoucher} onDepreciate={handleDepreciate} />;
      case "closing":
        return <ClosingPage state={state} onNavigate={navigate} onClosePeriod={closePeriod} onReopenPeriod={reopenPeriod} />;
      case "ledgers":
        return <LedgersPage key={deferredPageLabel} state={state} subjectBalances={subjectBalances} pageLabel={deferredPageLabel} />;
      case "reports":
        return <ReportsPage key={deferredPageLabel} state={state} subjectBalances={subjectBalances} pageLabel={deferredPageLabel} />;
      case "tax":
        return <TaxPage state={state} />;
      case "ledgerSettings":
        return <LedgerSettingsPage state={state} onReset={handleResetDemo} />;
      case "subjects":
      case "auxiliary":
      case "currency":
      case "opening":
        return <EmbeddedSettings key={deferredModule} module={deferredModule} />;
    }
  };

  return (
    <>
      <Header
        user={currentUser}
        sidebarOpen={mobileMenuOpen}
        onToggleSidebar={() => setMobileMenuOpen((current) => !current)}
        onLogout={handleLogout}
      />

      <div className="flex min-h-[100dvh] bg-[#f3f5f7] pt-16 text-slate-900">
        <DesktopSidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          activeModule={parentModule(activeModule)}
          activePageLabel={activePageLabel}
          navigation={navigation}
          onSelect={selectNavigation}
        />
        <MobileDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} activeModule={parentModule(activeModule)} activePageLabel={activePageLabel} navigation={navigation} onSelect={selectNavigation} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-16 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-3 backdrop-blur-xl sm:px-4 lg:px-5">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:bg-slate-50 sm:px-3">
                <Building2 className="h-4 w-4 shrink-0 text-amber-600" />
                <span className="max-w-32 truncate text-sm font-medium sm:max-w-64">{state.company.name}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              </button>
              <select value={state.company.period} onChange={(event) => setPeriod(event.target.value)} className="hidden h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none hover:bg-slate-50 focus:border-amber-400 sm:block">
                {periodOptions(state.company.period).map((item) => <option key={item} value={item}>{item.replace("-", "年")}月</option>)}
              </select>
              <div className="hidden items-center gap-1 border-l border-slate-200 pl-3 xl:flex">
                <button onClick={() => navigate("home", "首页")} className={cn("flex h-8 items-center rounded-lg px-3 text-sm transition-colors", activeModule === "home" && !editorOpen ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>首页</button>
                {(activeModule !== "home" || editorOpen) && (
                  <div className="flex h-8 items-center rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800">
                    <button className="px-3">{activePageLabel}</button>
                    <button onClick={() => navigate("home", "首页")} className="flex h-8 w-8 items-center justify-center border-l border-amber-200 hover:bg-amber-100" aria-label={`关闭 ${activePageLabel}`}><X className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </div>
            </div>
            <Button onClick={openNewVoucher} size="sm" className="h-9 shrink-0 rounded-lg bg-slate-950 px-3 text-amber-100 hover:bg-slate-800">
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">新增凭证</span>
            </Button>
            {isNavigating && <span className="absolute bottom-0 right-4 h-0.5 w-20 overflow-hidden rounded-full bg-amber-100"><span className="block h-full w-2/3 animate-pulse rounded-full bg-amber-500" /></span>}
          </header>

          <main className="min-w-0 flex-1 px-3 py-3 pb-24 sm:px-4 lg:px-5 lg:pb-6">
            <div className="mx-auto max-w-[1520px]">{renderModule()}</div>
          </main>
        </div>

        {!mobileMenuOpen && <MobileBottomNav activeModule={activeModule} onNavigate={navigate} onMore={() => setMobileMenuOpen(true)} />}
      </div>
    </>
  );
}

function DesktopSidebar({
  collapsed,
  onCollapsedChange,
  activeModule,
  activePageLabel,
  navigation,
  onSelect,
}: {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  activeModule: AccountingModule;
  activePageLabel: string;
  navigation: NavigationItem[];
  onSelect: (item: NavigationItem, child?: NavigationChild) => void;
}) {
  return (
    <aside className={cn("relative sticky top-16 z-30 hidden h-[calc(100dvh-4rem)] shrink-0 flex-col overflow-visible border-r border-slate-800 bg-[#0b1220] text-white transition-[width] duration-200 lg:flex", collapsed ? "w-16" : "w-60")}>
      <div className={cn("flex h-16 items-center border-b border-white/[0.06]", collapsed ? "justify-center px-2" : "px-4")}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300 ring-1 ring-inset ring-amber-300/15">
          <BookOpen className="h-4 w-4" />
        </span>
        {!collapsed && <div className="ml-3 min-w-0"><p className="truncate text-sm font-semibold">账务中心</p></div>}
      </div>
      <nav className="min-h-0 flex-1 overflow-visible py-2">
        <NavigationGroup items={navigation} collapsed={collapsed} activeModule={activeModule} activePageLabel={activePageLabel} onSelect={onSelect} mode="flyout" />
      </nav>
      <div className="border-t border-white/10 p-2">
        <Link href="/dashboard" className={cn("flex h-10 items-center rounded-lg text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.07] hover:text-white", collapsed ? "justify-center" : "px-3")}><ArrowLeft className="h-4 w-4 shrink-0 text-amber-300" />{!collapsed && <span className="ml-2">返回工作台</span>}</Link>
      </div>
      <button
        type="button"
        title={collapsed ? "展开侧栏" : "收起侧栏"}
        aria-label={collapsed ? "展开侧栏" : "收起侧栏"}
        onClick={() => onCollapsedChange(!collapsed)}
        className="absolute -right-3 bottom-5 z-[90] flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-[#111b2d] text-slate-400 shadow-lg transition-colors hover:border-amber-300/40 hover:text-amber-300"
      >
        {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );
}

function NavigationGroup({
  items,
  collapsed,
  activeModule,
  activePageLabel,
  onSelect,
  mode = "inline",
}: {
  items: NavigationItem[];
  collapsed: boolean;
  activeModule: AccountingModule;
  activePageLabel: string;
  onSelect: (item: NavigationItem, child?: NavigationChild) => void;
  mode?: "inline" | "flyout";
}) {
  return (
    <div className="space-y-0.5">
      {items.map((item, index) => {
        const active = activeModule === item.key || Boolean(item.children?.some((child) => child.target === activeModule));
        const defaultChild = item.children?.find((child) => child.action !== "newVoucher");
        const flyoutPosition = index <= 2 ? "top-0" : index >= items.length - 2 ? "bottom-0" : "top-1/2 -translate-y-1/2";
        return (
          <div key={item.key} className={cn(mode === "flyout" && "group relative")}>
            <button
              onClick={() => onSelect(item, defaultChild)}
              title={collapsed ? item.label : undefined}
              aria-haspopup={item.children ? "menu" : undefined}
              className={cn("flex w-full items-center border-l-[3px] text-sm font-medium transition", mode === "flyout" ? "h-10" : "h-11", collapsed ? "justify-center px-0" : "px-3", active ? "border-amber-300 bg-white/[0.08] text-white" : "border-transparent text-slate-400 hover:bg-white/[0.05] hover:text-white")}
            >
              <item.icon className={cn("h-[17px] w-[17px] shrink-0", active ? "text-amber-300" : "text-slate-600")} />
              {!collapsed && <><span className="ml-3 flex-1 text-left">{item.label}</span>{item.badge && <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-slate-950">{item.badge}</span>}{item.children && (mode === "flyout" ? <ChevronRight className="ml-2 h-3.5 w-3.5 text-slate-500 transition-transform group-hover:translate-x-0.5" /> : <ChevronDown className={cn("ml-2 h-3.5 w-3.5 transition", active && "rotate-180")} />)}</>}
            </button>
            {mode === "inline" && active && item.children && !collapsed && (
              <div className="border-l border-white/10 bg-black/15 py-1 pl-8 pr-2">
                {item.children.map((child) => (
                  <button key={child.key} onClick={() => onSelect(item, child)} className={cn("flex min-h-9 w-full items-center rounded-md px-3 py-2 text-left text-xs transition", activePageLabel === child.label ? "bg-amber-300/10 text-amber-200" : "text-slate-400 hover:bg-white/5 hover:text-white")}>{child.label}</button>
                ))}
              </div>
            )}
            {mode === "flyout" && item.children && (
              <div className={cn("invisible pointer-events-none absolute left-full z-[80] w-60 translate-x-1 pl-2 opacity-0 transition-[opacity,transform,visibility] duration-150 ease-out group-hover:visible group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:pointer-events-auto group-focus-within:translate-x-0 group-focus-within:opacity-100", flyoutPosition)}>
                <div role="menu" aria-label={`${item.label}菜单`} className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-2xl shadow-slate-950/20">
                  <div className="mb-1 border-b border-slate-100 px-3 py-2 text-xs font-semibold tracking-wide text-slate-400">{item.label}</div>
                  {item.children.map((child) => (
                    <button key={child.key} role="menuitem" onClick={() => onSelect(item, child)} className={cn("flex min-h-9 w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors", activePageLabel === child.label ? "bg-amber-50 font-medium text-amber-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950")}>{child.label}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MobileDrawer({ open, onClose, activeModule, activePageLabel, navigation, onSelect }: { open: boolean; onClose: () => void; activeModule: AccountingModule; activePageLabel: string; navigation: NavigationItem[]; onSelect: (item: NavigationItem, child?: NavigationChild) => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 top-16 z-40 lg:hidden">
      <button aria-label="关闭菜单" onClick={onClose} className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" />
      <aside className="absolute inset-y-0 left-0 flex w-[84vw] max-w-80 flex-col border-r border-slate-800 bg-[#0b1220] text-white shadow-2xl">
        <div className="flex h-16 items-center border-b border-white/[0.06] px-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300 ring-1 ring-inset ring-amber-300/15"><BookOpen className="h-4 w-4" /></span>
          <div className="ml-3"><p className="text-sm font-semibold">账务中心</p></div>
        </div>
        <div className="flex-1 overflow-y-auto py-2"><NavigationGroup items={navigation} collapsed={false} activeModule={activeModule} activePageLabel={activePageLabel} onSelect={onSelect} /></div>
        <div className="border-t border-white/[0.06] p-2"><Link href="/dashboard" className="flex h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-300 hover:bg-white/[0.07]"><ArrowLeft className="mr-3 h-4 w-4 text-amber-300" />返回工作台</Link></div>
      </aside>
    </div>
  );
}

function MobileBottomNav({ activeModule, onNavigate, onMore }: { activeModule: AccountingModule; onNavigate: (module: AccountingModule) => void; onMore: () => void }) {
  return <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden">{mobileNavigation.map((item) => <button key={item.key} onClick={() => onNavigate(item.key)} className={cn("flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium", activeModule === item.key ? "text-amber-600" : "text-slate-400")}><item.icon className="h-5 w-5" /><span>{item.label}</span></button>)}<button onClick={onMore} className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium text-slate-400"><MoreHorizontal className="h-5 w-5" /><span>更多</span></button></nav>;
}

function EmbeddedSettings({ module }: { module: "subjects" | "auxiliary" | "currency" | "opening" }) {
  const mobileContent = module === "subjects"
    ? <MobileSubjectsSettings />
    : module === "auxiliary"
      ? <MobileAuxiliarySettings />
      : module === "currency"
        ? <MobileCurrencySettings />
        : <MobileOpeningSettings />;
  return (
    <>
      <div className="md:hidden">{mobileContent}</div>
      <div className="hidden md:block"><TabbedSettings module={module} /></div>
    </>
  );
}

function TabbedSettings({ module }: { module: "subjects" | "auxiliary" | "currency" | "opening" }) {
  const content = module === "subjects" ? <SubjectsListPage /> : module === "auxiliary" ? <AuxiliarySettingsPage /> : module === "currency" ? <CurrencySettingsPage /> : <OpeningBalancePage />;
  const defaultTabs: BrowserTab[] = [{ id: module, label: moduleTitles[module], content, closable: false }];
  return <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm"><BrowserTabsProvider defaultTabs={defaultTabs} defaultActiveId={module}><BrowserTabsBar className="min-h-11" /><div className="min-h-[calc(100dvh-11rem)]"><BrowserTabsContent /></div></BrowserTabsProvider></div>;
}

function MobileSubjectsSettings() {
  const categories = useMemo(() => getSubjectsByStandard("small_enterprise"), []);
  const [activeCategory, setActiveCategory] = useState(categories[0]?.name || "资产类");
  const [keyword, setKeyword] = useState("");
  const subjects = (categories.find((category) => category.name === activeCategory)?.subjects || []).filter(
    (subject) => !keyword || `${subject.code}${subject.name}`.includes(keyword)
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">会计科目</h1>
        <p className="mt-1 text-sm text-slate-500">按小企业会计准则查看系统预设科目。</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索科目编码或名称"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-amber-400"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => setActiveCategory(category.name)}
            className={cn(
              "shrink-0 rounded-xl px-3 py-2 text-sm font-medium",
              activeCategory === category.name ? "bg-slate-950 text-white" : "bg-white text-slate-600 shadow-sm"
            )}
          >
            {category.name} <span className="ml-1 opacity-60">{category.subjects.length}</span>
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {subjects.map((subject) => (
          <div key={subject.code} className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-50 font-mono text-xs font-semibold text-amber-700">{subject.code}</div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-slate-900">{subject.name}</h3>
              <p className="mt-1 text-xs text-slate-400">余额方向：{subject.direction} · {subject.status}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileAuxiliarySettings() {
  const types = ["客户", "供应商", "部门", "职员"] as const;
  type AuxiliaryKey = (typeof types)[number];
  const [activeType, setActiveType] = useState<AuxiliaryKey>("客户");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [items, setItems] = useState<Record<AuxiliaryKey, Array<{ code: string; name: string; meta: string }>>>({
    客户: [
      { code: "KH001", name: "吉林省星银化工有限公司", meta: "一般纳税人" },
      { code: "KH002", name: "北京科技有限公司", meta: "一般纳税人" },
      { code: "KH003", name: "松原市启航科技有限公司", meta: "小规模纳税人" },
    ],
    供应商: [
      { code: "GYS001", name: "松原市文汇办公用品商行", meta: "办公用品" },
      { code: "GYS002", name: "松原市和悦物业有限公司", meta: "物业服务" },
    ],
    部门: [
      { code: "BM001", name: "综合管理部", meta: "成本中心" },
      { code: "BM002", name: "企业服务部", meta: "业务部门" },
    ],
    职员: [
      { code: "ZY001", name: "张会计", meta: "财务负责人" },
      { code: "ZY002", name: "李经理", meta: "企业服务部" },
    ],
  });

  const addItem = () => {
    if (!newName.trim()) return;
    setItems((current) => ({
      ...current,
      [activeType]: [
        ...current[activeType],
        { code: `${activeType.slice(0, 1)}${String(current[activeType].length + 1).padStart(3, "0")}`, name: newName.trim(), meta: "本机新增" },
      ],
    }));
    setNewName("");
    setAdding(false);
    toast.success(`${activeType}档案已新增`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-slate-950">辅助核算</h1><p className="mt-1 text-sm text-slate-500">管理客户、供应商、部门和职员档案。</p></div>
        <Button size="sm" onClick={() => setAdding(true)} className="h-10 shrink-0 rounded-xl"><Plus className="mr-1 h-4 w-4" />新增</Button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {types.map((type) => (
          <button key={type} onClick={() => setActiveType(type)} className={cn("rounded-xl px-2 py-3 text-xs font-semibold", activeType === type ? "bg-slate-950 text-white" : "bg-white text-slate-600 shadow-sm")}>{type}<span className="mt-1 block text-[10px] opacity-60">{items[type].length}</span></button>
        ))}
      </div>
      {adding && (
        <div className="flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <input autoFocus value={newName} onChange={(event) => setNewName(event.target.value)} placeholder={`请输入${activeType}名称`} className="h-11 min-w-0 flex-1 rounded-xl border border-amber-200 bg-white px-3 text-sm outline-none focus:border-amber-400" />
          <Button onClick={addItem} className="h-11 rounded-xl">保存</Button>
        </div>
      )}
      <div className="space-y-2">
        {items[activeType].map((item) => (
          <div key={item.code} className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
            <div className="flex h-11 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-mono text-[11px] font-semibold text-blue-700">{item.code}</div>
            <div className="min-w-0 flex-1"><h3 className="truncate font-semibold text-slate-900">{item.name}</h3><p className="mt-1 text-xs text-slate-400">{item.meta}</p></div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileCurrencySettings() {
  const [currencies, setCurrencies] = useState([
    { code: "CNY", name: "人民币", symbol: "¥", rate: 1, base: true },
    { code: "USD", name: "美元", symbol: "$", rate: 7.18, base: false },
    { code: "EUR", name: "欧元", symbol: "€", rate: 7.82, base: false },
    { code: "HKD", name: "港币", symbol: "HK$", rate: 0.92, base: false },
  ]);
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold text-slate-950">币别设置</h1><p className="mt-1 text-sm text-slate-500">人民币为本位币，可维护外币记账汇率。</p></div>
      <div className="space-y-2">
        {currencies.map((currency, index) => (
          <div key={currency.code} className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 font-semibold text-emerald-700">{currency.symbol}</div>
              <div className="flex-1"><div className="flex items-center gap-2"><h3 className="font-semibold text-slate-900">{currency.name}</h3>{currency.base && <Badge className="rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100">本位币</Badge>}</div><p className="mt-1 font-mono text-xs text-slate-400">{currency.code}</p></div>
            </div>
            <label className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
              记账汇率
              <input type="number" step="0.0001" disabled={currency.base} value={currency.rate} onChange={(event) => setCurrencies((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, rate: Number(event.target.value || 0) } : item))} className="h-9 w-32 rounded-lg border border-slate-200 bg-white px-3 text-right font-mono text-sm text-slate-900 outline-none disabled:bg-slate-100" />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileOpeningSettings() {
  const categories = useMemo(() => getSubjectsByStandard("small_enterprise"), []);
  const [activeCategory, setActiveCategory] = useState(categories[0]?.name || "资产类");
  const [balances, setBalances] = useState<Record<string, number>>({});
  const subjects = categories.find((category) => category.name === activeCategory)?.subjects || [];
  const total = Object.values(balances).reduce((sum, value) => sum + Number(value || 0), 0);
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold text-slate-950">期初余额</h1><p className="mt-1 text-sm text-slate-500">录入启用账套前各科目的期初余额。</p></div>
      <div className="rounded-2xl bg-slate-950 p-4 text-white"><p className="text-xs text-slate-400">已录入期初余额</p><p className="mt-2 font-mono text-2xl font-bold">¥{total.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</p></div>
      <div className="flex gap-2 overflow-x-auto pb-1">{categories.map((category) => <button key={category.name} onClick={() => setActiveCategory(category.name)} className={cn("shrink-0 rounded-xl px-3 py-2 text-sm font-medium", activeCategory === category.name ? "bg-slate-950 text-white" : "bg-white text-slate-600 shadow-sm")}>{category.name}</button>)}</div>
      <div className="space-y-2">
        {subjects.map((subject) => (
          <label key={subject.code} className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
            <div className="min-w-0 flex-1"><p className="font-mono text-xs text-amber-700">{subject.code}</p><h3 className="mt-1 truncate font-semibold text-slate-900">{subject.name}</h3></div>
            <input type="number" step="0.01" value={balances[subject.code] || ""} onChange={(event) => setBalances((current) => ({ ...current, [subject.code]: Number(event.target.value || 0) }))} placeholder="0.00" className="h-10 w-32 rounded-xl border border-slate-200 px-3 text-right font-mono text-sm outline-none focus:border-amber-400" />
          </label>
        ))}
      </div>
    </div>
  );
}
