"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Droplets,
  Flame,
  Gift,
  MapPin,
  Phone,
  ReceiptText,
  RefreshCw,
  Loader2,
  UserRound,
  WalletCards,
  Wifi,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BaseDetail, BaseEnterprise, Meter, UtilityPayment } from "../types";

const processStatusMap: Record<string, string> = {
  new: "新建",
  draft: "资料准备",
  pending_registration: "工商办理",
  pending_change: "信息变更",
  pending_contract: "合同办理",
  pending_payment: "待缴费",
  active: "正常经营",
  completed: "已入驻",
  terminated: "已终止",
};

const paymentStatusMap: Record<string, { label: string; className: string }> = {
  paid: { label: "已缴", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/15" },
  pending: { label: "待缴", className: "bg-amber-50 text-amber-700 ring-amber-600/15" },
  arrears: { label: "欠费", className: "bg-rose-50 text-rose-700 ring-rose-600/15" },
  cancelled: { label: "已取消", className: "bg-slate-100 text-slate-500 ring-slate-500/15" },
};

function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center">
      <Building2 className="mb-3 h-8 w-8 text-slate-300" />
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

export function EnterprisePanel({
  enterprises,
  title,
  description,
  compact = false,
}: {
  enterprises: BaseEnterprise[];
  title: string;
  description: string;
  compact?: boolean;
}) {
  const visibleEnterprises = compact ? enterprises.slice(0, 4) : enterprises;

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/30">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {enterprises.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {visibleEnterprises.length === 0 ? (
          <EmptyState text="当前基地暂未登记相关企业" />
        ) : (
          <div className="space-y-3">
            {visibleEnterprises.map(enterprise => (
              <Link
                key={`${enterprise.relationType}-${enterprise.id}`}
                href={`/dashboard/base/tenants/${enterprise.id}`}
                className="group grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-cyan-200 hover:bg-cyan-50/40 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] md:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-slate-900">{enterprise.name}</span>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
                      {processStatusMap[enterprise.processStatus] || enterprise.processStatus || "未设置"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-400">
                    {enterprise.enterpriseCode || enterprise.creditCode || "尚未生成企业编号"}
                  </p>
                </div>

                <div className="space-y-1 text-sm text-slate-500">
                  <p className="flex items-center gap-2">
                    <UserRound className="h-3.5 w-3.5 text-slate-400" />
                    {enterprise.legalPerson || enterprise.adminName || "负责人未登记"}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">
                      {enterprise.locations[0] || enterprise.businessAddress || enterprise.registeredAddress || "尚未分配空间"}
                    </span>
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 md:justify-end">
                  <div className="text-left md:text-right">
                    <p className="text-lg font-semibold tabular-nums text-slate-900">{enterprise.assignedWorkstationCount}</p>
                    <p className="text-xs text-slate-400">已分配工位</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-600" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {compact && enterprises.length > visibleEnterprises.length && (
          <p className="mt-4 text-center text-xs text-slate-400">另有 {enterprises.length - visibleEnterprises.length} 家企业，请在“企业信息”标签查看</p>
        )}
      </div>
    </section>
  );
}

type FeeType = "heating" | "property_fee" | "network";
type PaymentCategory = "electricity" | "water" | FeeType;

function getLatestPayment(meter: Meter, utilityType: FeeType) {
  return [...meter.utilityPayments]
    .filter(payment => payment.utilityType === utilityType)
    .sort((first, second) => {
      const periodOrder = second.billingPeriod.localeCompare(first.billingPeriod);
      if (periodOrder !== 0) return periodOrder;
      return String(second.paidAt || "").localeCompare(String(first.paidAt || ""));
    })[0] || null;
}

function BalanceCell({
  value,
  accountNumber,
  updatedAt,
}: {
  value: number | string | null;
  accountNumber: string | null;
  updatedAt: string | null;
}) {
  const hasBalance = value !== null && value !== undefined && value !== "";

  return (
    <div>
      <p className={`font-semibold tabular-nums ${hasBalance ? "text-slate-950" : "text-slate-400"}`}>
        {hasBalance ? formatCurrency(value) : "余额未录入"}
      </p>
      <p className="mt-1 text-xs text-slate-400">户号 {accountNumber || "未登记"}</p>
      {updatedAt && <p className="mt-1 text-[11px] text-slate-400">更新于 {formatDate(updatedAt)}</p>}
    </div>
  );
}

function PaymentCell({ payment, emptyText }: { payment: UtilityPayment | null; emptyText: string }) {
  if (!payment) return <p className="text-sm text-slate-400">{emptyText}</p>;

  const status = paymentStatusMap[payment.status] || paymentStatusMap.pending;
  const chargeLabel = payment.chargeType === "full"
    ? "全额采暖"
    : payment.chargeType === "base"
      ? "基础采暖"
      : payment.chargeType || "按账单";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold tabular-nums text-slate-950">{formatCurrency(payment.amount)}</p>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${status.className}`}>{status.label}</span>
      </div>
      <p className="mt-1 text-xs text-slate-400">{payment.billingPeriod} · {chargeLabel}</p>
    </div>
  );
}

function NetworkCell({ meter, payment }: { meter: Meter; payment: UtilityPayment | null }) {
  if (payment) return <PaymentCell payment={payment} emptyText="网络账单未建立" />;

  const status = meter.networkStatus === "arrears"
    ? { label: "欠费", className: paymentStatusMap.arrears.className }
    : meter.networkStatus === "not_applicable"
      ? { label: "不涉及", className: paymentStatusMap.cancelled.className }
      : { label: "状态正常", className: paymentStatusMap.paid.className };

  return (
    <div>
      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${status.className}`}>{status.label}</span>
      <p className="mt-2 text-xs text-slate-400">账号 {meter.networkNumber || "未登记"}</p>
    </div>
  );
}

export function PropertyPaymentPanel({
  base,
  compact = false,
  onRefresh,
}: {
  base: BaseDetail;
  compact?: boolean;
  onRefresh?: () => Promise<void>;
}) {
  const [syncingKey, setSyncingKey] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<PaymentCategory>("electricity");
  const currentYear = new Date().getFullYear();
  const rows = [...base.meters]
    .sort((first, second) => (first.sortOrder || 0) - (second.sortOrder || 0))
    .map(meter => ({
      meter,
      heatingPayment: getLatestPayment(meter, "heating"),
      propertyPayment: getLatestPayment(meter, "property_fee"),
      networkPayment: getLatestPayment(meter, "network"),
    }));
  const electricityRows = rows.filter(row => row.meter.electricityEnabled);
  const waterRows = rows.filter(row => row.meter.waterEnabled);
  const heatingRows = rows.filter(row => row.meter.heatingEnabled);
  const propertyFeeRows = rows.filter(row => row.meter.propertyFeeEnabled);
  const networkRows = rows.filter(row => row.meter.networkEnabled);
  const electricityBalances = electricityRows
    .map(row => row.meter.electricityBalance)
    .filter(value => value !== null && value !== undefined && value !== "");
  const waterBalances = waterRows
    .map(row => row.meter.waterBalance)
    .filter(value => value !== null && value !== undefined && value !== "");
  const heatingPeriods = heatingRows
    .map(row => row.heatingPayment?.billingPeriod)
    .filter((period): period is string => Boolean(period))
    .sort();
  const latestHeatingPeriod = heatingPeriods.at(-1) || null;
  const latestHeatingRows = latestHeatingPeriod
    ? heatingRows.filter(row => row.heatingPayment?.billingPeriod === latestHeatingPeriod)
    : [];
  const heatingPaidCount = latestHeatingRows.filter(row => row.heatingPayment?.status === "paid").length;
  const networkAlertCount = networkRows.filter(row => row.meter.networkStatus === "arrears" || row.networkPayment?.status === "arrears").length;
  const propertyFeeFree = base.propertyFeeMode === "free";
  const electricityTotal = electricityBalances.reduce<number>((sum, value) => sum + Number(value || 0), 0);
  const waterTotal = waterBalances.reduce<number>((sum, value) => sum + Number(value || 0), 0);
  const summaryItems = [
    {
      key: "electricity" as const,
      icon: Zap,
      label: "电费",
      value: electricityBalances.length > 0 ? formatCurrency(electricityTotal) : "待录入",
      note: `${electricityBalances.length}/${electricityRows.length} 个物业已更新`,
      className: "bg-amber-50 text-amber-700",
      count: electricityRows.length,
    },
    {
      key: "water" as const,
      icon: Droplets,
      label: "水费",
      value: waterBalances.length > 0 ? formatCurrency(waterTotal) : "待录入",
      note: `${waterBalances.length}/${waterRows.length} 个物业已更新`,
      className: "bg-sky-50 text-sky-700",
      count: waterRows.length,
    },
    {
      key: "heating" as const,
      icon: Flame,
      label: "取暖费",
      value: latestHeatingRows.length > 0 ? `${heatingPaidCount}/${latestHeatingRows.length} 已缴` : "未建账",
      note: latestHeatingPeriod || "按年度建立账单",
      className: "bg-orange-50 text-orange-700",
      count: heatingRows.length,
    },
    {
      key: "property_fee" as const,
      icon: Gift,
      label: "物业费",
      value: propertyFeeFree ? "免收" : "年度计费",
      note: `${currentYear}年度 · ${base.propertyFeeBillingCycle === "annual" ? "按年" : "按约定"}`,
      className: propertyFeeFree ? "bg-emerald-50 text-emerald-700" : "bg-violet-50 text-violet-700",
      count: propertyFeeRows.length,
    },
    {
      key: "network" as const,
      icon: Wifi,
      label: "网络费用",
      value: networkAlertCount > 0 ? `${networkAlertCount} 个异常` : "状态正常",
      note: "按物业账号或合同周期管理",
      className: networkAlertCount > 0 ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700",
      count: networkRows.length,
    },
  ].filter(item => item.count > 0);
  const categoryRows: Record<PaymentCategory, typeof rows> = {
    electricity: electricityRows,
    water: waterRows,
    heating: heatingRows,
    property_fee: propertyFeeRows,
    network: networkRows,
  };
  const effectiveCategory = summaryItems.some(item => item.key === activeCategory)
    ? activeCategory
    : summaryItems[0]?.key;
  const activeSummary = summaryItems.find(item => item.key === effectiveCategory) || null;
  const selectedRows = activeSummary ? categoryRows[activeSummary.key] : [];
  const visibleRows = compact ? selectedRows.slice(0, 4) : selectedRows;
  const summaryGridClass = summaryItems.length >= 5
    ? "lg:grid-cols-5"
    : summaryItems.length === 4
      ? "lg:grid-cols-4"
      : summaryItems.length === 3
        ? "lg:grid-cols-3"
        : "lg:grid-cols-2";

  const syncBalance = async (meter: Meter, type: "electricity" | "water") => {
    const isElectricity = type === "electricity";
    const accountNumber = isElectricity ? meter.electricityNumber : meter.waterNumber;
    const chargeInst = isElectricity ? meter.electricityChargeInst : meter.waterChargeInst;
    const utilityName = isElectricity ? "电费" : "水费";

    if (!accountNumber) {
      toast.error(`${meter.name || meter.code}尚未填写${utilityName}户号`);
      return;
    }
    if (!chargeInst) {
      toast.error(`请先进入${meter.name || meter.code}的物业详情，填写支付宝收费机构编码`);
      return;
    }

    const key = `${meter.id}:${type}`;
    setSyncingKey(key);
    try {
      const response = await fetch(`/api/meters/${meter.id}/sync-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        toast.error(result.error || `${utilityName}余额同步失败`);
        return;
      }

      if (result.data?.balance === null || result.data?.balance === undefined) {
        toast.info(result.message || "收费机构本次未返回余额");
      } else {
        toast.success(`${meter.name || meter.code}${utilityName}余额已同步：${formatCurrency(result.data.balance)}`);
      }
      await onRefresh?.();
    } catch (error) {
      console.error("同步物业余额失败:", error);
      toast.error(`${utilityName}余额同步失败`);
    } finally {
      setSyncingKey(null);
    }
  };

  const SyncButton = ({ meter, type }: { meter: Meter; type: "electricity" | "water" }) => {
    const key = `${meter.id}:${type}`;
    const syncing = syncingKey === key;
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-2 h-7 gap-1 px-2 text-xs text-cyan-700 hover:bg-cyan-50 hover:text-cyan-900"
        onClick={() => syncBalance(meter, type)}
        disabled={syncingKey !== null}
      >
        {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        同步余额
      </Button>
    );
  };

  const renderActiveFee = ({
    meter,
    heatingPayment,
    propertyPayment,
    networkPayment,
  }: {
    meter: Meter;
    heatingPayment: UtilityPayment | null;
    propertyPayment: UtilityPayment | null;
    networkPayment: UtilityPayment | null;
  }) => {
    if (activeCategory === "electricity") {
      return (
        <div>
          <BalanceCell value={meter.electricityBalance} accountNumber={meter.electricityNumber} updatedAt={meter.electricityBalanceUpdatedAt} />
          <SyncButton meter={meter} type="electricity" />
        </div>
      );
    }

    if (activeCategory === "water") {
      return (
        <div>
          <BalanceCell value={meter.waterBalance} accountNumber={meter.waterNumber} updatedAt={meter.waterBalanceUpdatedAt} />
          <SyncButton meter={meter} type="water" />
        </div>
      );
    }

    if (activeCategory === "heating") {
      return (
        <div>
          <PaymentCell payment={heatingPayment} emptyText="年度取暖账单未建立" />
          <p className="mt-2 text-xs text-slate-400">取暖号 {meter.heatingNumber || "未登记"}</p>
        </div>
      );
    }

    if (activeCategory === "property_fee") {
      return propertyFeeFree ? (
        <div>
          <p className="font-semibold text-emerald-700">{currentYear}年度免收物业费</p>
          <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/15">政策免收</span>
          <p className="mt-2 text-xs text-slate-400">计费周期：按年度</p>
        </div>
      ) : (
        <PaymentCell payment={propertyPayment} emptyText="年度物业费账单未建立" />
      );
    }

    return <NetworkCell meter={meter} payment={networkPayment} />;
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/30">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-950">物业缴费总览</h2>
              <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">{rows.length} 个物业</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">统一查看水电余额、年度取暖费、年度物业费和网络费用</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <WalletCards className="h-4 w-4 text-slate-400" />
            水电按余额管理，固定费用按周期管理
          </div>
        </div>

        <div className={`mt-5 grid grid-cols-2 gap-3 ${summaryGridClass}`}>
          {summaryItems.map(item => (
            <button
              type="button"
              key={item.key}
              onClick={() => setActiveCategory(item.key)}
              className={`rounded-2xl border p-3.5 text-left transition ${effectiveCategory === item.key ? "border-cyan-300 bg-cyan-50/50 shadow-sm ring-2 ring-cyan-100" : "border-slate-100 bg-slate-50/60 hover:border-slate-200 hover:bg-white"}`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${item.className}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <p className="mt-3 truncate text-lg font-semibold tabular-nums text-slate-950">{item.value}</p>
              <p className="mt-0.5 text-xs font-medium text-slate-600">{item.label}</p>
              <p className="mt-1 truncate text-[11px] text-slate-400">{item.note}</p>
            </button>
          ))}
        </div>
      </div>

      {!activeSummary || visibleRows.length === 0 ? (
        <div className="p-5">
          <EmptyState text={rows.length === 0 ? "当前基地还没有物业" : "当前基地尚未为物业启用任何费用"} />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2 border-b border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${activeSummary.className}`}>
                <activeSummary.icon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{activeSummary.label}物业明细</h3>
                <p className="text-xs text-slate-400">按物业逐项查看账户、金额和缴费状态</p>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-400">共 {visibleRows.length} 个物业</span>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50/80 text-xs text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">物业</th>
                  <th className="px-5 py-3 font-medium">{activeSummary.label}情况</th>
                  <th className="px-5 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRows.map(({ meter, heatingPayment, propertyPayment, networkPayment }) => (
                  <tr key={meter.id} className="align-top transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{meter.name || meter.code}</p>
                      <p className="mt-1 text-xs text-slate-400">{meter.code} · {Number(meter.area || 0).toLocaleString("zh-CN")}㎡</p>
                    </td>
                    <td className="px-5 py-4">{renderActiveFee({ meter, heatingPayment, propertyPayment, networkPayment })}</td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/dashboard/base/sites/${base.id}/meters/${meter.id}`} className="inline-flex items-center gap-1 font-medium text-cyan-700 hover:text-cyan-900">
                        物业详情 <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 lg:hidden">
            {visibleRows.map(({ meter, heatingPayment, propertyPayment, networkPayment }) => (
              <div key={meter.id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{meter.name || meter.code}</p>
                    <p className="mt-1 text-xs text-slate-400">{meter.code} · {Number(meter.area || 0).toLocaleString("zh-CN")}㎡</p>
                  </div>
                  <Link href={`/dashboard/base/sites/${base.id}/meters/${meter.id}`} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-cyan-700">
                    详情 <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="mb-3 text-xs font-semibold text-slate-500">{activeSummary.label}情况</p>
                  {renderActiveFee({ meter, heatingPayment, propertyPayment, networkPayment })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {compact && selectedRows.length > visibleRows.length && (
        <div className="border-t border-slate-100 px-5 py-3 text-center text-xs text-slate-400">
          另有 {selectedRows.length - visibleRows.length} 个物业，请在“物业缴费”标签查看
        </div>
      )}
    </section>
  );
}

export function BaseProfileCard({ base }: { base: BaseDetail }) {
  const profileItems = [
    { icon: Building2, label: "运营机构", value: base.organization?.name || base.managementCompanyName || "未登记" },
    { icon: BadgeCheck, label: "统一社会信用代码", value: base.managementCompanyCreditCode || "未登记" },
    { icon: UserRound, label: "法定代表人", value: base.managementCompanyLegalPerson || "未登记" },
    { icon: Phone, label: "联系电话", value: base.managementCompanyPhone || "未登记" },
    { icon: MapPin, label: "管理方地址", value: base.managementCompanyAddress || "未登记" },
    { icon: Gift, label: "物业费政策", value: base.propertyFeeMode === "free" ? "免收物业费" : "按年度收取物业费" },
    { icon: CalendarDays, label: "基地建档时间", value: formatDate(base.createdAt) },
  ];

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <ReceiptText className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-950">基地档案</h2>
          <p className="text-xs text-slate-400">运营主体与基础登记信息</p>
        </div>
      </div>

      <div className="space-y-4">
        {profileItems.map(item => (
          <div key={item.label} className="flex gap-3">
            <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">{item.label}</p>
              <p className="mt-1 break-words text-sm font-medium leading-6 text-slate-700">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
