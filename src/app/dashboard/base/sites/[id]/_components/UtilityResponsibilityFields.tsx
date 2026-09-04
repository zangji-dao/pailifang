"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Enterprise, MeterType } from "../types";

interface UtilityResponsibilityFieldsProps {
  responsibilityType: MeterType;
  enterpriseId: string;
  enterprises: Enterprise[];
  managementCompanyName: string;
  onResponsibilityTypeChange: (value: MeterType) => void;
  onEnterpriseChange: (value: string) => void;
}

export function UtilityResponsibilityFields({
  responsibilityType,
  enterpriseId,
  enterprises,
  managementCompanyName,
  onResponsibilityTypeChange,
  onEnterpriseChange,
}: UtilityResponsibilityFieldsProps) {
  const customerResponsible = responsibilityType === "customer";

  return (
    <div className="mt-4 grid gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-3">
      <div className="min-w-0 space-y-2">
        <Label>费用承担方式</Label>
        <Select
          value={responsibilityType}
          onValueChange={value => {
            const nextType = value as MeterType;
            onResponsibilityTypeChange(nextType);
            if (nextType === "base") onEnterpriseChange("");
          }}
        >
          <SelectTrigger className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="base">管理方承担</SelectItem>
            <SelectItem value="customer">使用方承担</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0 space-y-2">
        <Label>费用责任主体{customerResponsible ? " *" : ""}</Label>
        {customerResponsible ? (
          <Select value={enterpriseId || undefined} onValueChange={onEnterpriseChange} disabled={enterprises.length === 0}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder={enterprises.length === 0 ? "当前基地暂无入驻企业" : "选择入驻企业"} />
            </SelectTrigger>
            <SelectContent>
              {enterprises.map(enterprise => (
                <SelectItem key={enterprise.id} value={enterprise.id}>{enterprise.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div
            className="flex h-9 min-w-0 items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
            title={managementCompanyName}
          >
            <span className="truncate">{managementCompanyName}</span>
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-2">
        <Label>数据维护主体</Label>
        <div className="flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700">
          管理公司统一录入
        </div>
      </div>
    </div>
  );
}
