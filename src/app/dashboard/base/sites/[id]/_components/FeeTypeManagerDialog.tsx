"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { BaseFeeType, FeeBillingCycle } from "../types";

export function FeeTypeManagerDialog({
  baseId,
  feeTypes,
  open,
  onOpenChange,
  onRefresh,
}: {
  baseId: string;
  feeTypes: BaseFeeType[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [billingCycle, setBillingCycle] = useState<FeeBillingCycle>("monthly");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const addFeeType = async () => {
    if (!name.trim()) {
      toast.error("请输入费用类型名称");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/bases/${baseId}/fee-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), billingCycle }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        toast.error(result.error || "新增费用类型失败");
        return;
      }
      setName("");
      setBillingCycle("monthly");
      await onRefresh?.();
      toast.success("费用类型已添加");
    } catch {
      toast.error("新增费用类型失败");
    } finally {
      setSaving(false);
    }
  };

  const toggleFeeType = async (feeType: BaseFeeType, isActive: boolean) => {
    setUpdatingId(feeType.id);
    try {
      const response = await fetch(`/api/bases/${baseId}/fee-types`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeTypeId: feeType.id, isActive }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        toast.error(result.error || "更新费用类型失败");
        return;
      }
      await onRefresh?.();
    } catch {
      toast.error("更新费用类型失败");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>基地费用类型</DialogTitle>
          <DialogDescription>费用目录仅对当前基地生效。停用后不会删除历史账单。</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {feeTypes.map(feeType => (
            <div key={feeType.id} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-3 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-slate-800">{feeType.name}</p>
                  <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                    {feeType.isBuiltin ? "内置" : "自定义"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{feeType.billingCycle === "monthly" ? "每月录入" : "每年录入"}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {updatingId === feeType.id && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                <Switch
                  checked={feeType.isActive}
                  disabled={updatingId !== null}
                  aria-label={`${feeType.name}${feeType.isActive ? "已启用" : "已停用"}`}
                  onCheckedChange={checked => void toggleFeeType(feeType, checked)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">新增自定义类型</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
            <div className="space-y-2">
              <Label htmlFor="custom-fee-name">费用名称</Label>
              <Input
                id="custom-fee-name"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="例如：垃圾清运费"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>录入周期</Label>
              <Select value={billingCycle} onValueChange={value => setBillingCycle(value as FeeBillingCycle)}>
                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">每月</SelectItem>
                  <SelectItem value="annual">每年</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="mt-3 gap-2" onClick={() => void addFeeType()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            添加类型
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>完成</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
