"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Building2,
  DollarSign,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ContractType = "free" | "paid" | "tax_commitment";

const contractTypeOptions: { value: ContractType; label: string }[] = [
  { value: "free", label: "免费入驻" },
  { value: "paid", label: "付费入驻" },
  { value: "tax_commitment", label: "承诺税收" },
];

export default function NewContractPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    contractNo: "",
    contractName: "",
    contractType: "" as ContractType | "",
    rentAmount: "",
    depositAmount: "",
    taxCommitment: "",
    startDate: "",
    endDate: "",
    remarks: "",
  });

  const handleSubmit = async () => {
    // 验证
    if (!formData.contractType) {
      toast.error("请选择合同类型");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/settlement/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractNo: formData.contractNo || undefined,
          contractName: formData.contractName || undefined,
          contractType: formData.contractType,
          rentAmount: formData.rentAmount ? parseFloat(formData.rentAmount) : null,
          depositAmount: formData.depositAmount ? parseFloat(formData.depositAmount) : null,
          taxCommitment: formData.taxCommitment ? parseFloat(formData.taxCommitment) : null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          remarks: formData.remarks || null,
          status: "draft",
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "创建失败");
      }

      const result = await response.json();
      toast.success("合同创建成功");
      router.push(`/dashboard/base/contracts/${result.data.id}`);
    } catch (error) {
      console.error("创建合同失败:", error);
      toast.error(error instanceof Error ? error.message : "创建失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 头部 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">新建合同</h1>
          <p className="text-muted-foreground">创建空白合同，后续可上传签署好的文件</p>
        </div>
      </div>

      {/* 基本信息 */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          基本信息
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>合同类型 *</Label>
            <Select
              value={formData.contractType}
              onValueChange={(v) => setFormData({ ...formData, contractType: v as ContractType })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="选择合同类型" />
              </SelectTrigger>
              <SelectContent>
                {contractTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>合同编号</Label>
            <Input
              className="mt-1.5"
              placeholder="留空自动生成"
              value={formData.contractNo}
              onChange={(e) => setFormData({ ...formData, contractNo: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Label>合同名称</Label>
            <Input
              className="mt-1.5"
              placeholder="例如：2024年度入驻合同"
              value={formData.contractName}
              onChange={(e) => setFormData({ ...formData, contractName: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* 费用信息 */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          费用信息
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>租金金额</Label>
            <Input
              type="number"
              className="mt-1.5"
              placeholder="0.00"
              value={formData.rentAmount}
              onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
            />
          </div>
          <div>
            <Label>押金金额</Label>
            <Input
              type="number"
              className="mt-1.5"
              placeholder="0.00"
              value={formData.depositAmount}
              onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
            />
          </div>
          <div>
            <Label>税收承诺</Label>
            <Input
              type="number"
              className="mt-1.5"
              placeholder="0.00"
              value={formData.taxCommitment}
              onChange={(e) => setFormData({ ...formData, taxCommitment: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* 时间信息 */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          合同期限
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>开始日期</Label>
            <Input
              type="date"
              className="mt-1.5"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
          <div>
            <Label>结束日期</Label>
            <Input
              type="date"
              className="mt-1.5"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* 备注 */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="font-semibold mb-4">备注</h2>
        <Textarea
          placeholder="其他备注信息..."
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          rows={3}
        />
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          取消
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          <Save className="h-4 w-4 mr-2" />
          创建合同
        </Button>
      </div>
    </div>
  );
}
