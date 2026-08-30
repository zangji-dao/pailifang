"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  ChevronDown,
  Copy,
  Download,
  FileArchive,
  Filter,
  Import,
  ListFilter,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ACCOUNTING_TODAY, Voucher, VoucherStatus, formatMoney, voucherTotals } from "../_lib/accounting-store";
import {
  EmptyState,
  VoucherStatusBadge,
  downloadCsv,
  voucherStatusConfig,
} from "./AccountingCommon";

interface VouchersPageProps {
  vouchers: Voucher[];
  period: string;
  onNewVoucher: () => void;
  onEditVoucher: (voucher: Voucher) => void;
  onCopyVoucher: (voucher: Voucher) => void;
  onStatusChange: (voucherId: string, status: VoucherStatus) => void;
  onDeleteVoucher: (voucherId: string) => void;
}

export function VouchersPage({
  vouchers,
  period,
  onNewVoucher,
  onEditVoucher,
  onCopyVoucher,
  onStatusChange,
  onDeleteVoucher,
}: VouchersPageProps) {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<"all" | VoucherStatus>("all");
  const [selectedPeriod, setSelectedPeriod] = useState(period);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const periods = useMemo(
    () => Array.from(new Set([period, ...vouchers.map((voucher) => voucher.period)])).sort((a, b) => b.localeCompare(a)),
    [period, vouchers]
  );
  const filtered = useMemo(
    () =>
      vouchers
        .filter((voucher) => {
          const matchesPeriod = voucher.period === selectedPeriod;
          const matchesStatus = status === "all" || voucher.status === status;
          const query = keyword.trim().toLowerCase();
          const matchesKeyword = !query || `${voucher.voucherNo}${voucher.summary}${voucher.createdBy}${voucher.entries.map((entry) => `${entry.summary}${entry.subjectCode}${entry.subjectName}`).join("")}`.toLowerCase().includes(query);
          return matchesPeriod && matchesStatus && matchesKeyword;
        })
        .sort((a, b) => b.voucherDate.localeCompare(a.voucherDate) || b.voucherNo.localeCompare(a.voucherNo)),
    [keyword, selectedPeriod, status, vouchers]
  );
  const allSelected = filtered.length > 0 && filtered.every((voucher) => selectedIds.includes(voucher.id));
  const selectedPending = filtered.filter((voucher) => selectedIds.includes(voucher.id) && voucher.status === "pending");

  const exportVouchers = () => {
    downloadCsv(`记账凭证-${ACCOUNTING_TODAY}.csv`, [
      ["凭证号", "日期", "摘要", "状态", "借方合计", "贷方合计", "制单人"],
      ...filtered.map((voucher) => {
        const totals = voucherTotals(voucher);
        return [voucher.voucherNo, voucher.voucherDate, voucher.summary, voucherStatusConfig[voucher.status].label, totals.debit, totals.credit, voucher.createdBy];
      }),
    ]);
    toast.success("凭证列表已导出");
  };

  const toggleSelected = (voucherId: string) => {
    setSelectedIds((current) => current.includes(voucherId) ? current.filter((item) => item !== voucherId) : [...current, voucherId]);
  };

  const toggleAll = () => {
    setSelectedIds((current) => allSelected ? current.filter((item) => !filtered.some((voucher) => voucher.id === item)) : Array.from(new Set([...current, ...filtered.map((voucher) => voucher.id)])));
  };

  const batchReview = () => {
    if (!selectedPending.length) {
      toast.info("请先选择待审核凭证");
      return;
    }
    selectedPending.forEach((voucher) => onStatusChange(voucher.id, "posted"));
    setSelectedIds([]);
    toast.success(`已审核 ${selectedPending.length} 张凭证`);
  };

  return (
    <div className="space-y-3">
      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-3 py-3 xl:flex-row xl:items-center xl:justify-between sm:px-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg bg-emerald-600 text-white">
              <select value={selectedPeriod} onChange={(event) => setSelectedPeriod(event.target.value)} className="h-9 appearance-none bg-transparent pl-3 pr-8 text-sm font-medium outline-none">
                {periods.map((item) => <option key={item} value={item} className="text-slate-900">{item.replace("-", "年")}月</option>)}
              </select>
              <button onClick={() => setFiltersOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center border-l border-white/20" aria-label="筛选凭证"><Filter className="h-4 w-4" /></button>
            </div>
            <Button onClick={onNewVoucher} className="h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700"><Plus className="mr-1.5 h-4 w-4" /> 新增凭证</Button>
            <Button variant="outline" onClick={batchReview} className="h-9 rounded-lg"><BadgeCheck className="mr-1.5 h-4 w-4" /> 审核<ChevronDown className="ml-1 h-3.5 w-3.5" /></Button>
            <Button variant="outline" onClick={() => window.print()} className="hidden h-9 rounded-lg md:flex"><Printer className="mr-1.5 h-4 w-4" /> 打印<ChevronDown className="ml-1 h-3.5 w-3.5" /></Button>
            <Button variant="outline" onClick={() => window.print()} className="hidden h-9 rounded-lg lg:flex"><FileArchive className="mr-1.5 h-4 w-4" /> 电子账簿</Button>
            <Button variant="outline" onClick={exportVouchers} className="h-9 rounded-lg"><Download className="mr-1.5 h-4 w-4" /> 导出<ChevronDown className="ml-1 h-3.5 w-3.5" /></Button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button variant="ghost" onClick={() => toast.info("请选择标准凭证 CSV 文件导入")} className="hidden h-9 rounded-lg text-slate-600 xl:flex"><Import className="mr-1.5 h-4 w-4" /> 导入凭证</Button>
            <Button variant="ghost" onClick={() => toast.success("已按日期和凭证号重新整理")} className="hidden h-9 rounded-lg text-slate-600 xl:flex"><ListFilter className="mr-1.5 h-4 w-4" /> 整理凭证</Button>
            <Button variant="ghost" onClick={() => setStatus("void")} className="h-9 rounded-lg text-slate-600"><Trash2 className="mr-1.5 h-4 w-4" /> 回收站</Button>
            <Button variant="ghost" size="icon" onClick={() => toast.success("凭证列表已刷新")} className="h-9 w-9 rounded-lg" aria-label="刷新"><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </div>

        {filtersOpen && (
          <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-4">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索凭证号、摘要、科目或制单人" className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-emerald-500" />
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {(["all", "draft", "pending", "posted", "void"] as const).map((item) => (
                <button key={item} onClick={() => setStatus(item)} className={cn("shrink-0 rounded-lg px-3 py-2 text-sm font-medium", status === item ? "bg-emerald-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100")}>
                  {item === "all" ? "全部状态" : voucherStatusConfig[item].label}
                </button>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="p-5"><EmptyState title="没有找到凭证" description="调整期间或筛选条件，也可以新增第一张记账凭证。" /></div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[980px] border-collapse">
                <thead className="bg-emerald-50/70 text-left text-xs font-medium text-slate-600">
                  <tr>
                    <th className="w-12 px-4 py-3 text-center"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="全选凭证" /></th>
                    <th className="px-3 py-3">摘要 / 科目</th>
                    <th className="w-36 px-3 py-3">凭证信息</th>
                    <th className="w-36 px-3 py-3 text-right">借方金额</th>
                    <th className="w-36 px-3 py-3 text-right">贷方金额</th>
                    <th className="w-44 px-4 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((voucher) => {
                    const totals = voucherTotals(voucher);
                    return (
                      <VoucherTableGroup
                        key={voucher.id}
                        voucher={voucher}
                        totals={totals}
                        selected={selectedIds.includes(voucher.id)}
                        onToggle={() => toggleSelected(voucher.id)}
                        onEdit={() => onEditVoucher(voucher)}
                        onCopy={() => onCopyVoucher(voucher)}
                        onStatusChange={onStatusChange}
                        onDelete={onDeleteVoucher}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {filtered.map((voucher) => {
                const totals = voucherTotals(voucher);
                return (
                  <div key={voucher.id} className="space-y-3 p-4">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={selectedIds.includes(voucher.id)} onChange={() => toggleSelected(voucher.id)} className="mt-1" aria-label={`选择 ${voucher.voucherNo}`} />
                      <button onClick={() => onEditVoucher(voucher)} className="min-w-0 flex-1 text-left">
                        <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-semibold">{voucher.voucherNo}</span><VoucherStatusBadge status={voucher.status} /></div>
                        <p className="mt-2 font-medium text-slate-900">{voucher.summary}</p>
                        <p className="mt-1 text-xs text-slate-400">{voucher.voucherDate} · {voucher.entries.length} 条分录 · 附件 {voucher.attachmentCount} 张</p>
                      </button>
                      <Button variant="ghost" size="icon" onClick={() => onCopyVoucher(voucher)} className="h-9 w-9 shrink-0 rounded-lg"><Copy className="h-4 w-4" /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-sm">
                      <Amount label="借方合计" value={totals.debit} />
                      <Amount label="贷方合计" value={totals.credit} />
                    </div>
                    {voucher.status === "pending" && <Button onClick={() => onStatusChange(voucher.id, "posted")} className="h-10 w-full rounded-lg bg-emerald-600 hover:bg-emerald-700"><BadgeCheck className="mr-2 h-4 w-4" /> 审核凭证</Button>}
                    {voucher.status === "draft" && <Button variant="outline" onClick={() => onDeleteVoucher(voucher.id)} className="h-10 w-full rounded-lg text-red-500"><Trash2 className="mr-2 h-4 w-4" /> 删除草稿</Button>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>显示 {filtered.length ? 1 : 0} 到 {filtered.length}，共 {filtered.length} 条记录</span>
          <span>{selectedIds.length ? `已选择 ${selectedIds.length} 张凭证` : "每页 20 条"}</span>
        </div>
      </Card>
    </div>
  );
}

function VoucherTableGroup({
  voucher,
  totals,
  selected,
  onToggle,
  onEdit,
  onCopy,
  onStatusChange,
  onDelete,
}: {
  voucher: Voucher;
  totals: ReturnType<typeof voucherTotals>;
  selected: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onStatusChange: (voucherId: string, status: VoucherStatus) => void;
  onDelete: (voucherId: string) => void;
}) {
  return (
    <>
      <tr className="border-t border-slate-200 bg-slate-50/80">
        <td className="px-4 py-2 text-center"><input type="checkbox" checked={selected} onChange={onToggle} aria-label={`选择 ${voucher.voucherNo}`} /></td>
        <td colSpan={3} className="px-3 py-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-800">日期：{voucher.voucherDate}</span>
          <span className="ml-4 font-semibold text-slate-800">凭证字号：{voucher.voucherNo}</span>
          <span className="ml-4">附件：{voucher.attachmentCount}</span>
          <span className="ml-4"><VoucherStatusBadge status={voucher.status} /></span>
        </td>
        <td colSpan={2} className="px-4 py-2 text-right text-xs">
          <button onClick={onEdit} className="mr-3 text-blue-600 hover:underline">修改</button>
          <button onClick={onCopy} className="mr-3 text-blue-600 hover:underline">复制</button>
          {voucher.status === "pending" && <button onClick={() => onStatusChange(voucher.id, "posted")} className="mr-3 text-emerald-600 hover:underline">审核</button>}
          {voucher.status === "posted" && <button onClick={() => onStatusChange(voucher.id, "void")} className="mr-3 text-slate-500 hover:underline">作废</button>}
          {voucher.status === "draft" && <button onClick={() => onDelete(voucher.id)} className="text-red-500 hover:underline">删除</button>}
        </td>
      </tr>
      {voucher.entries.map((entry, index) => (
        <tr key={entry.id} className="border-t border-slate-100 hover:bg-emerald-50/20">
          <td className="px-4 py-3 text-center text-xs text-slate-400">{index + 1}</td>
          <td className="px-3 py-3 text-sm text-slate-700">{entry.summary || voucher.summary}</td>
          <td className="px-3 py-3 text-sm text-slate-700"><span className="font-mono text-xs text-slate-400">{entry.subjectCode}</span><span className="ml-2">{entry.subjectName}</span></td>
          <td className="px-3 py-3 text-right font-mono text-sm">{entry.debit ? formatMoney(entry.debit) : ""}</td>
          <td className="px-3 py-3 text-right font-mono text-sm">{entry.credit ? formatMoney(entry.credit) : ""}</td>
          <td />
        </tr>
      ))}
      <tr className="border-t border-slate-200 bg-white font-medium">
        <td />
        <td colSpan={2} className="px-3 py-3 text-sm text-slate-600">合计：{voucher.summary}</td>
        <td className="px-3 py-3 text-right font-mono text-sm">{formatMoney(totals.debit)}</td>
        <td className="px-3 py-3 text-right font-mono text-sm">{formatMoney(totals.credit)}</td>
        <td className="px-4 py-3 text-right text-xs text-slate-400">制单：{voucher.createdBy}</td>
      </tr>
    </>
  );
}

function Amount({ label, value }: { label: string; value: number }) {
  return <div><span className="text-xs text-slate-400">{label}</span><p className="mt-1 font-mono font-semibold">{formatMoney(value)}</p></div>;
}
