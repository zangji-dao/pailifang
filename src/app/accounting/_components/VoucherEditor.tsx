"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Keyboard,
  MoreHorizontal,
  Paperclip,
  Plus,
  Printer,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  SUBJECT_OPTIONS,
  ACCOUNTING_TODAY,
  Voucher,
  VoucherDraft,
  VoucherEntry,
  VoucherStatus,
  formatMoney,
  voucherTotals,
} from "../_lib/accounting-store";

interface VoucherEditorProps {
  voucher?: Voucher;
  period: string;
  onClose: () => void;
  onSave: (voucher: VoucherDraft) => void;
}

function emptyEntry(summary = ""): Omit<VoucherEntry, "id"> {
  return {
    summary,
    subjectCode: "",
    subjectName: "",
    debit: 0,
    credit: 0,
  };
}

function initialEntries(voucher?: Voucher) {
  if (voucher?.entries.length) return voucher.entries.map((item) => ({ ...item }));
  return [emptyEntry(), emptyEntry(), emptyEntry(), emptyEntry()];
}

function todayInPeriod(period: string) {
  return ACCOUNTING_TODAY.startsWith(period) ? ACCOUNTING_TODAY : `${period}-01`;
}

export function VoucherEditor({ voucher, period, onClose, onSave }: VoucherEditorProps) {
  const [editingId, setEditingId] = useState(voucher?.id);
  const [voucherNo, setVoucherNo] = useState(voucher?.voucherNo || "自动编号");
  const [voucherDate, setVoucherDate] = useState(voucher?.voucherDate || todayInPeriod(period));
  const [summary, setSummary] = useState(voucher?.summary || "");
  const [attachmentCount, setAttachmentCount] = useState(voucher?.attachmentCount || 0);
  const [entries, setEntries] = useState<Array<Omit<VoucherEntry, "id"> & { id?: string }>>(
    initialEntries(voucher)
  );

  const effectiveEntries = useMemo(
    () => entries.filter((item) => item.summary.trim() || item.subjectCode || item.debit || item.credit),
    [entries]
  );
  const totals = useMemo(
    () => voucherTotals({ entries: effectiveEntries as VoucherEntry[] }),
    [effectiveEntries]
  );

  const updateEntry = (
    index: number,
    key: keyof Omit<VoucherEntry, "id">,
    value: string | number
  ) => {
    setEntries((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        if (key === "subjectCode") {
          const subject = SUBJECT_OPTIONS.find((option) => option.code === value);
          return {
            ...item,
            subjectCode: String(value),
            subjectName: subject?.name || "",
          };
        }
        if (key === "debit") {
          const amount = Number(value || 0);
          return { ...item, debit: amount, credit: amount > 0 ? 0 : item.credit };
        }
        if (key === "credit") {
          const amount = Number(value || 0);
          return { ...item, credit: amount, debit: amount > 0 ? 0 : item.debit };
        }
        return { ...item, [key]: value };
      })
    );
  };

  const addEntry = () => {
    setEntries((current) => [...current, emptyEntry(summary)]);
  };

  const removeEntry = (index: number) => {
    if (entries.length <= 2) {
      toast.error("一张凭证至少保留两行分录");
      return;
    }
    setEntries((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const resetForNextVoucher = () => {
    setEditingId(undefined);
    setVoucherNo("自动编号");
    setVoucherDate(todayInPeriod(period));
    setSummary("");
    setAttachmentCount(0);
    setEntries(initialEntries());
  };

  const submit = (status: VoucherStatus, createNext = false) => {
    const voucherSummary = summary.trim() || effectiveEntries[0]?.summary.trim();
    if (!voucherSummary) {
      toast.error("请填写凭证摘要");
      return;
    }
    if (!voucherDate) {
      toast.error("请选择凭证日期");
      return;
    }

    if (status !== "draft") {
      if (effectiveEntries.length < 2 || effectiveEntries.some((item) => !item.subjectCode || (!item.debit && !item.credit))) {
        toast.error("请至少完成两行会计分录");
        return;
      }
      if (totals.debit <= 0 || totals.difference !== 0) {
        toast.error("凭证借贷必须相等且金额大于 0");
        return;
      }
    }

    onSave({
      id: editingId,
      voucherDate,
      summary: voucherSummary,
      attachmentCount,
      status,
      entries: status === "draft" ? entries : effectiveEntries,
    });

    toast.success(
      status === "posted"
        ? "凭证已保存并过账"
        : status === "pending"
          ? "凭证已保存，等待审核"
          : "凭证草稿已暂存"
    );

    if (createNext) {
      resetForNextVoucher();
      return;
    }
    onClose();
  };

  return (
    <div className="space-y-3">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/80 px-3 py-2 sm:px-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => submit("pending", true)} className="h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-1.5 h-4 w-4" /> 保存并新增
            </Button>
            <Button variant="outline" onClick={() => submit("pending")} className="h-9 rounded-lg">
              <Save className="mr-1.5 h-4 w-4" /> 保存
            </Button>
            <Button variant="outline" onClick={() => window.print()} className="hidden h-9 rounded-lg sm:flex">
              <Printer className="mr-1.5 h-4 w-4" /> 打印
            </Button>
            <Button variant="outline" onClick={() => submit("draft")} className="hidden h-9 rounded-lg md:flex">
              <MoreHorizontal className="mr-1.5 h-4 w-4" /> 暂存草稿
            </Button>
            <Button variant="ghost" className="hidden h-9 rounded-lg text-slate-500 lg:flex">
              <Keyboard className="mr-1.5 h-4 w-4" /> 快捷键
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" aria-label="上一张凭证"><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" aria-label="下一张凭证"><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="ghost" onClick={onClose} className="h-9 rounded-lg">返回列表</Button>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-wide text-slate-950 sm:text-2xl">记账凭证</h1>
                  <p className="mt-1 text-xs text-slate-400">按回车键可快速进入下一录入项</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[620px]">
                <label className="text-xs text-slate-500">
                  凭证字
                  <select className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500">
                    <option>记</option>
                    <option>收</option>
                    <option>付</option>
                    <option>转</option>
                  </select>
                </label>
                <label className="text-xs text-slate-500">
                  凭证号
                  <input value={voucherNo} onChange={(event) => setVoucherNo(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" />
                </label>
                <label className="text-xs text-slate-500">
                  日期
                  <input type="date" value={voucherDate} onChange={(event) => setVoucherDate(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" />
                </label>
                <label className="text-xs text-slate-500">
                  附单据
                  <span className="relative mt-1 block">
                    <input type="number" min={0} value={attachmentCount} onChange={(event) => setAttachmentCount(Number(event.target.value || 0))} className="h-10 w-full rounded-lg border border-slate-200 px-3 pr-8 text-sm outline-none focus:border-emerald-500" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">张</span>
                  </span>
                </label>
              </div>
            </div>

            <label className="mb-3 block text-xs text-slate-500">
              凭证摘要
              <input value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="例如：支付本月办公场地租金" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" />
            </label>

            <div className="hidden overflow-x-auto border border-slate-300 md:block">
              <table className="w-full min-w-[900px] table-fixed border-collapse">
                <thead className="bg-emerald-50/80 text-sm font-medium text-slate-700">
                  <tr>
                    <th className="w-14 border-b border-r border-slate-300 py-3 text-center">序号</th>
                    <th className="border-b border-r border-slate-300 px-3 py-3 text-left">摘要</th>
                    <th className="w-[300px] border-b border-r border-slate-300 px-3 py-3 text-left">会计科目</th>
                    <th className="w-44 border-b border-r border-slate-300 px-3 py-3 text-right">借方金额</th>
                    <th className="w-44 border-b border-r border-slate-300 px-3 py-3 text-right">贷方金额</th>
                    <th className="w-12 border-b border-slate-300" />
                  </tr>
                </thead>
                <tbody>
                  {entries.map((item, index) => (
                    <tr key={item.id || index} className="group">
                      <td className="border-b border-r border-slate-200 py-3 text-center text-sm text-slate-400">{index + 1}</td>
                      <td className="border-b border-r border-slate-200 p-0">
                        <input value={item.summary} onChange={(event) => updateEntry(index, "summary", event.target.value)} placeholder="摘要" className="h-12 w-full border-0 bg-transparent px-3 text-sm outline-none focus:bg-emerald-50/40" />
                      </td>
                      <td className="border-b border-r border-slate-200 p-0">
                        <select value={item.subjectCode} onChange={(event) => updateEntry(index, "subjectCode", event.target.value)} className="h-12 w-full border-0 bg-transparent px-3 text-sm outline-none focus:bg-emerald-50/40">
                          <option value="">输入或选择会计科目</option>
                          {SUBJECT_OPTIONS.map((subject) => <option key={subject.code} value={subject.code}>{subject.code} {subject.name}</option>)}
                        </select>
                      </td>
                      <td className="border-b border-r border-slate-200 p-0">
                        <input type="number" min={0} step="0.01" value={item.debit || ""} onChange={(event) => updateEntry(index, "debit", event.target.value)} className="h-12 w-full border-0 bg-transparent px-3 text-right font-mono text-sm outline-none focus:bg-emerald-50/40" />
                      </td>
                      <td className="border-b border-r border-slate-200 p-0">
                        <input type="number" min={0} step="0.01" value={item.credit || ""} onChange={(event) => updateEntry(index, "credit", event.target.value)} className="h-12 w-full border-0 bg-transparent px-3 text-right font-mono text-sm outline-none focus:bg-emerald-50/40" />
                      </td>
                      <td className="border-b border-slate-200 text-center">
                        <button onClick={() => removeEntry(index)} className="rounded-md p-1.5 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-medium">
                    <td colSpan={3} className="border-r border-slate-300 px-4 py-3 text-sm text-slate-600">合计：人民币 {formatMoney(totals.debit)}</td>
                    <td className="border-r border-slate-300 px-3 py-3 text-right font-mono text-sm">{formatMoney(totals.debit)}</td>
                    <td className="border-r border-slate-300 px-3 py-3 text-right font-mono text-sm">{formatMoney(totals.credit)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {entries.map((item, index) => (
                <div key={item.id || index} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">分录 {index + 1}</span>
                    <button onClick={() => removeEntry(index)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="space-y-2">
                    <input value={item.summary} onChange={(event) => updateEntry(index, "summary", event.target.value)} placeholder="分录摘要" className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500" />
                    <select value={item.subjectCode} onChange={(event) => updateEntry(index, "subjectCode", event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500">
                      <option value="">选择会计科目</option>
                      {SUBJECT_OPTIONS.map((subject) => <option key={subject.code} value={subject.code}>{subject.code} {subject.name}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-xs text-slate-500">借方<input type="number" min={0} step="0.01" value={item.debit || ""} onChange={(event) => updateEntry(index, "debit", event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-right font-mono text-sm outline-none focus:border-emerald-500" /></label>
                      <label className="text-xs text-slate-500">贷方<input type="number" min={0} step="0.01" value={item.credit || ""} onChange={(event) => updateEntry(index, "credit", event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-right font-mono text-sm outline-none focus:border-emerald-500" /></label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={addEntry} className="rounded-lg"><Plus className="mr-1 h-4 w-4" /> 增加分录</Button>
                <Button variant="ghost" size="sm" className="rounded-lg text-slate-500"><Paperclip className="mr-1 h-4 w-4" /> 上传附件</Button>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-500">借贷平衡</span>
                <strong className={totals.debit > 0 && totals.difference === 0 ? "text-emerald-600" : "text-red-500"}>
                  {totals.debit > 0 && totals.difference === 0 ? "校验通过" : `相差 ${formatMoney(Math.abs(totals.difference))}`}
                </strong>
              </div>
            </div>

            <div className="mt-7 grid gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500 sm:grid-cols-3">
              <span>制单人：本地管理员</span>
              <span>审核人：{voucher?.reviewedBy || "未审核"}</span>
              <span className="sm:text-right">会计期间：{period}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky bottom-16 z-20 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur md:hidden">
        <Button variant="outline" onClick={() => submit("draft")} className="h-11 rounded-lg">暂存</Button>
        <Button onClick={() => submit("pending")} className="h-11 rounded-lg bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 className="mr-2 h-4 w-4" /> 保存凭证</Button>
      </div>
    </div>
  );
}
