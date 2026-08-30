"use client";

import Link from "next/link";
import { Building2, ExternalLink } from "lucide-react";

export interface OperatorOrganization {
  id: string;
  name: string;
  code: string;
  status: string;
  metadata?: {
    managementCompanyCreditCode?: string;
    managementCompanyLegalPerson?: string;
    managementCompanyAddress?: string;
    managementCompanyPhone?: string;
  };
}

interface OperatorOrganizationSelectProps {
  organizations: OperatorOrganization[];
  value: string;
  onChange: (organizationId: string) => void;
  loading?: boolean;
}

export function OperatorOrganizationSelect({ organizations, value, onChange, loading = false }: OperatorOrganizationSelectProps) {
  const selectedOrganization = organizations.find((organization) => organization.id === value);
  const metadata = selectedOrganization?.metadata;

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Building2 className="h-4 w-4 text-amber-500" />
            运营机构（合同甲方）
          </h3>
          <p className="mt-1 text-sm text-slate-500">基地必须关联一个已录入的运营机构，同一机构可以管理多个基地。</p>
        </div>
        <Link href="/dashboard/access-control" className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800">
          维护运营机构 <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">选择运营机构 <span className="text-red-500">*</span></label>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={loading}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 disabled:cursor-wait disabled:bg-slate-100"
        >
          <option value="">{loading ? "正在加载运营机构..." : "请选择运营机构"}</option>
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id} disabled={organization.status !== "active"}>
              {organization.name}{organization.status !== "active" ? "（已停用）" : ""}
            </option>
          ))}
        </select>
      </div>

      {!loading && organizations.length === 0 && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          暂无可选运营机构，请先到“账号与权限 → 组织管理”中录入。
        </div>
      )}

      {selectedOrganization && (
        <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
          <Info label="机构名称" value={selectedOrganization.name} />
          <Info label="统一社会信用代码" value={metadata?.managementCompanyCreditCode || "未填写"} mono />
          <Info label="法定代表人" value={metadata?.managementCompanyLegalPerson || "未填写"} />
          <Info label="联系电话" value={metadata?.managementCompanyPhone || "未填写"} />
          <div className="sm:col-span-2"><Info label="注册地址" value={metadata?.managementCompanyAddress || "未填写"} /></div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><p className="text-xs text-slate-400">{label}</p><p className={`mt-1 text-slate-700 ${mono ? "font-mono" : ""}`}>{value}</p></div>;
}
