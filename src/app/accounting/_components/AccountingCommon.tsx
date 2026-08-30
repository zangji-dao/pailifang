"use client";

import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { VoucherStatus, formatMoney } from "../_lib/accounting-store";

export const voucherStatusConfig: Record<
  VoucherStatus,
  { label: string; className: string }
> = {
  draft: { label: "草稿", className: "border-slate-200 bg-slate-100 text-slate-600" },
  pending: { label: "待审核", className: "border-amber-200 bg-amber-50 text-amber-700" },
  posted: { label: "已过账", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  void: { label: "已作废", className: "border-red-200 bg-red-50 text-red-600" },
};

export function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const content = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <FileText className="h-6 w-6" />
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}

export function VoucherStatusBadge({ status }: { status: VoucherStatus }) {
  const config = voucherStatusConfig[status];
  return (
    <Badge variant="outline" className={cn("rounded-full", config.className)}>
      {config.label}
    </Badge>
  );
}

export function Metric({
  label,
  value = 0,
  rawValue,
  icon: Icon,
  tone,
  className,
}: {
  label: string;
  value?: number;
  rawValue?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "amber" | "blue" | "emerald" | "red" | "violet";
  className?: string;
}) {
  const tones = {
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <Card className={cn("rounded-2xl border-slate-200/70 shadow-sm", className)}>
      <CardContent className="relative p-4 sm:p-5">
        <div className={cn("absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl sm:right-5 sm:top-5 sm:h-10 sm:w-10", tones[tone])}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <p className="pr-11 text-xs text-slate-500 sm:text-sm">{label}</p>
        <p className="mt-3 text-sm font-bold tracking-tight text-slate-950 sm:text-xl">
          {rawValue || formatMoney(value)}
        </p>
      </CardContent>
    </Card>
  );
}

export function SmallMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 truncate font-mono text-sm font-semibold text-slate-800">{formatMoney(value)}</p>
    </div>
  );
}

export function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

export function DataTable({ headers, rows }: { headers: string[]; rows: Array<Array<string | number>> }) {
  if (!rows.length) {
    return <EmptyState title="暂无账簿数据" description="凭证审核过账后，数据会自动汇总到这里。" />;
  }
  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200/70 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
            <tr>
              {headers.map((header, index) => (
                <th key={header} className={cn("px-5 py-3", index >= headers.length - 2 && "text-right")}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50/60">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className={cn("px-5 py-4 text-sm text-slate-700", cellIndex >= row.length - 2 && "text-right font-mono")}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
