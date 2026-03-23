"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Receipt, 
  DollarSign, 
  Upload, 
  Check, 
  Loader2, 
  CreditCard,
  FileText,
  Plus,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Fee {
  id: string;
  name: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  proofUrl: string | null;
  status: "pending" | "paid" | "verified";
}

interface PaymentStepProps {
  enterpriseName: string;
  fees: Fee[];
  onUpdateFees: (fees: Fee[]) => void;
}

export function PaymentStep({
  enterpriseName,
  fees,
  onUpdateFees,
}: PaymentStepProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const { toast } = useToast();

  // 添加费用项
  const addFee = () => {
    const newFee: Fee = {
      id: `fee-${Date.now()}`,
      name: "",
      amount: 0,
      paymentMethod: "bank_transfer",
      paymentDate: new Date().toISOString().split("T")[0],
      proofUrl: null,
      status: "pending",
    };
    onUpdateFees([...fees, newFee]);
  };

  // 删除费用项
  const removeFee = (id: string) => {
    onUpdateFees(fees.filter(f => f.id !== id));
  };

  // 更新费用项
  const updateFee = (id: string, field: keyof Fee, value: any) => {
    onUpdateFees(fees.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  // 上传缴费凭证
  const handleUploadProof = async (feeId: string, file: File) => {
    setUploading(feeId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "payment-proofs");

      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (result.success || result.url) {
        const url = result.data?.url || result.url;
        updateFee(feeId, "proofUrl", url);
        updateFee(feeId, "status", "paid");
        toast({ title: "上传成功" });
      } else {
        throw new Error(result.error || result.message || "上传失败");
      }
    } catch (error: any) {
      console.error("上传失败:", error);
      toast({ title: "上传失败", description: error.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  // 计算总金额
  const totalAmount = fees.reduce((sum, f) => sum + f.amount, 0);

  // 获取状态样式
  const getStatusStyle = (status: Fee["status"]) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-700 border-green-200";
      case "paid":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // 获取状态文本
  const getStatusText = (status: Fee["status"]) => {
    switch (status) {
      case "verified":
        return "已核实";
      case "paid":
        return "已缴费";
      default:
        return "待缴费";
    }
  };

  return (
    <div className="space-y-6">
      {/* 费用汇总 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-violet-600" />
            费用缴纳
          </CardTitle>
          <CardDescription>请缴纳相关费用并上传缴费凭证</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-violet-50 rounded-lg border border-violet-100">
            <div>
              <p className="text-sm text-violet-600">企业名称</p>
              <p className="font-semibold text-violet-900">{enterpriseName || "未填写"}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-violet-600">应缴总额</p>
              <p className="text-2xl font-bold text-violet-700">¥{totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 费用明细 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                费用明细
              </CardTitle>
              <CardDescription>添加并缴纳各项费用</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addFee}>
              <Plus className="w-4 h-4 mr-2" />
              添加费用
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {fees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="w-16 h-16 mx-auto rounded-full bg-violet-100 flex items-center justify-center mb-4">
                <Receipt className="w-8 h-8 text-violet-600" />
              </div>
              <p>暂无费用项，点击"添加费用"按钮添加</p>
            </div>
          ) : (
            fees.map((fee, index) => (
              <div key={fee.id} className="border rounded-lg p-4 space-y-4">
                {/* 费用项头部 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">费用项 {index + 1}</span>
                    <Badge variant="outline" className={getStatusStyle(fee.status)}>
                      {getStatusText(fee.status)}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFee(fee.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <Separator />

                {/* 费用项内容 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>费用名称</Label>
                    <Input
                      value={fee.name}
                      onChange={(e) => updateFee(fee.id, "name", e.target.value)}
                      placeholder="如：租金、押金、物业费等"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>金额（元）</Label>
                    <Input
                      type="number"
                      value={fee.amount}
                      onChange={(e) => updateFee(fee.id, "amount", Number(e.target.value))}
                      placeholder="请输入金额"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>支付方式</Label>
                    <select
                      value={fee.paymentMethod}
                      onChange={(e) => updateFee(fee.id, "paymentMethod", e.target.value)}
                      className="h-10 w-full px-3 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                    >
                      <option value="bank_transfer">银行转账</option>
                      <option value="alipay">支付宝</option>
                      <option value="wechat">微信支付</option>
                      <option value="cash">现金</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>缴费日期</Label>
                    <Input
                      type="date"
                      value={fee.paymentDate}
                      onChange={(e) => updateFee(fee.id, "paymentDate", e.target.value)}
                    />
                  </div>
                </div>

                {/* 上传凭证 */}
                <div className="space-y-2">
                  <Label>缴费凭证</Label>
                  {fee.proofUrl ? (
                    <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-lg">
                      <FileText className="w-8 h-8 text-violet-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-violet-900">凭证已上传</p>
                        <p className="text-xs text-violet-600">点击可查看</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(fee.proofUrl!, "_blank")}
                      >
                        查看
                      </Button>
                    </div>
                  ) : (
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadProof(fee.id, file);
                        }}
                        disabled={uploading === fee.id}
                      />
                      <div
                        className={`border-2 border-dashed border-violet-200 rounded-lg p-4 text-center cursor-pointer transition-colors bg-violet-50/30
                          ${uploading === fee.id ? "opacity-50" : "hover:border-violet-400 hover:bg-violet-50"}`}
                      >
                        {uploading === fee.id ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">上传中...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 mx-auto text-violet-600 mb-2" />
                            <p className="text-sm text-violet-700">点击上传缴费凭证</p>
                          </>
                        )}
                      </div>
                    </label>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 支付信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            收款账户信息
          </CardTitle>
          <CardDescription>请按照以下账户信息进行转账</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">收款户名</p>
              <p className="font-medium">XX物业管理有限公司</p>
            </div>
            <div>
              <p className="text-muted-foreground">开户银行</p>
              <p className="font-medium">XX银行XX支行</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">银行账号</p>
              <p className="font-medium font-mono">1234 5678 9012 3456</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            * 转账时请备注企业名称，缴费后请上传转账凭证
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
