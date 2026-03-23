"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Building2,
  DollarSign,
  Upload,
  Download,
  Trash2,
  Edit,
  Loader2,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// 类型定义
type ContractStatus = "draft" | "pending" | "signed" | "expired" | "terminated";
type ContractType = "free" | "paid" | "tax_commitment";

interface Contract {
  id: string;
  enterpriseId: string | null;
  applicationId: string | null;
  contractNo: string | null;
  contractName: string | null;
  contractType: ContractType;
  rentAmount: string | null;
  depositAmount: string | null;
  taxCommitment: string | null;
  startDate: string | null;
  endDate: string | null;
  signedDate: string | null;
  status: ContractStatus;
  contractFileUrl: string | null;
  remarks: string | null;
  createdAt: string;
  application?: {
    enterpriseName: string | null;
  } | null;
}

// 状态配置
const statusConfig: Record<ContractStatus, { label: string; className: string; icon: React.ReactNode }> = {
  draft: { label: "草稿", className: "bg-gray-50 text-gray-600 border-gray-200", icon: <FileText className="h-4 w-4" /> },
  pending: { label: "待签", className: "bg-amber-50 text-amber-600 border-amber-200", icon: <Clock className="h-4 w-4" /> },
  signed: { label: "已签", className: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: <CheckCircle2 className="h-4 w-4" /> },
  expired: { label: "已到期", className: "bg-red-50 text-red-600 border-red-200", icon: <XCircle className="h-4 w-4" /> },
  terminated: { label: "已终止", className: "bg-slate-50 text-slate-600 border-slate-200", icon: <XCircle className="h-4 w-4" /> },
};

const contractTypeConfig: Record<ContractType, { label: string; className: string }> = {
  free: { label: "免费入驻", className: "text-green-600" },
  paid: { label: "付费入驻", className: "text-blue-600" },
  tax_commitment: { label: "承诺税收", className: "text-amber-600" },
};

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchContract();
  }, [contractId]);

  const fetchContract = async () => {
    try {
      const response = await fetch(`/api/settlement/contracts/${contractId}`);
      if (!response.ok) throw new Error("获取合同详情失败");
      const result = await response.json();
      setContract(result.data);
    } catch (error) {
      console.error("获取合同详情失败:", error);
      toast.error("获取合同详情失败");
    } finally {
      setLoading(false);
    }
  };

  // 上传合同文件
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("仅支持 PDF、JPG、PNG 格式");
      return;
    }

    // 检查文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("文件大小不能超过 10MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "contract");

      const uploadRes = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("上传失败");
      const uploadResult = await uploadRes.json();

      // 更新合同文件URL
      const updateRes = await fetch(`/api/settlement/contracts/${contractId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractFileUrl: uploadResult.url,
          status: contract?.status === "draft" ? "pending" : contract?.status,
        }),
      });

      if (!updateRes.ok) throw new Error("更新合同失败");

      toast.success("合同文件上传成功");
      fetchContract();
    } catch (error) {
      console.error("上传失败:", error);
      toast.error("上传失败");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // 删除合同
  const handleDelete = async () => {
    if (!confirm("确定要删除这份合同吗？")) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/settlement/contracts/${contractId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "删除失败");
      }

      toast.success("合同已删除");
      router.push("/dashboard/base/contracts");
    } catch (error) {
      console.error("删除失败:", error);
      toast.error(error instanceof Error ? error.message : "删除失败");
    } finally {
      setDeleting(false);
    }
  };

  // 确认签署
  const handleSign = async () => {
    if (!contract?.contractFileUrl) {
      toast.error("请先上传合同文件");
      return;
    }

    try {
      const response = await fetch(`/api/settlement/contracts/${contractId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedDate: new Date().toISOString().split("T")[0] }),
      });

      if (!response.ok) throw new Error("签署失败");

      toast.success("合同已确认签署");
      fetchContract();
    } catch (error) {
      console.error("签署失败:", error);
      toast.error("签署失败");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
        <FileText className="h-12 w-12 mb-4" />
        <p>合同不存在</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/base/contracts")}>
          返回列表
        </Button>
      </div>
    );
  }

  const statusInfo = statusConfig[contract.status];
  const typeInfo = contractTypeConfig[contract.contractType];

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/base/contracts")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-3">
              {contract.contractNo || "未编号合同"}
              <Badge variant="outline" className={cn("font-normal", statusInfo.className)}>
                {statusInfo.icon}
                <span className="ml-1">{statusInfo.label}</span>
              </Badge>
            </h1>
            {contract.contractName && (
              <p className="text-muted-foreground mt-1">{contract.contractName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {contract.status === "draft" && (
            <>
              <Button variant="outline" asChild>
                <a href={`/dashboard/base/contracts/${contractId}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑
                </a>
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </>
          )}
          {contract.status === "pending" && contract.contractFileUrl && (
            <Button onClick={handleSign} className="bg-emerald-500 hover:bg-emerald-600">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              确认签署
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：合同信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本信息 */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              基本信息
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">合同类型</label>
                <p className={cn("font-medium", typeInfo.className)}>{typeInfo.label}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">关联企业</label>
                <p className="font-medium">{contract.application?.enterpriseName || "未关联"}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">合同编号</label>
                <p className="font-medium">{contract.contractNo || "-"}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">合同名称</label>
                <p className="font-medium">{contract.contractName || "-"}</p>
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
                <label className="text-sm text-muted-foreground">租金金额</label>
                <p className="font-medium text-lg">
                  {contract.rentAmount ? `¥${parseFloat(contract.rentAmount).toLocaleString()}` : "-"}
                </p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">押金金额</label>
                <p className="font-medium text-lg">
                  {contract.depositAmount ? `¥${parseFloat(contract.depositAmount).toLocaleString()}` : "-"}
                </p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">税收承诺</label>
                <p className="font-medium text-lg">
                  {contract.taxCommitment ? `¥${parseFloat(contract.taxCommitment).toLocaleString()}` : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* 时间信息 */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              时间信息
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">开始日期</label>
                <p className="font-medium">{contract.startDate || "-"}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">结束日期</label>
                <p className="font-medium">{contract.endDate || "-"}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">签署日期</label>
                <p className="font-medium">{contract.signedDate || "-"}</p>
              </div>
            </div>
          </div>

          {/* 备注 */}
          {contract.remarks && (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="font-semibold mb-4">备注</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{contract.remarks}</p>
            </div>
          )}
        </div>

        {/* 右侧：合同文件 */}
        <div className="space-y-6">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="font-semibold mb-4">合同文件</h2>
            
            {contract.contractFileUrl ? (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">合同文件</p>
                      <p className="text-xs text-muted-foreground">点击查看或下载</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={contract.contractFileUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      查看
                    </a>
                  </Button>
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={contract.contractFileUrl} download>
                      <Download className="h-4 w-4 mr-2" />
                      下载
                    </a>
                  </Button>
                </div>
                
                {/* 重新上传 */}
                {contract.status !== "signed" && (
                  <div className="pt-4 border-t">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleUpload}
                        disabled={uploading}
                      />
                      <Button variant="outline" className="w-full" disabled={uploading}>
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        重新上传
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">上传合同文件</p>
                  <p className="text-xs text-muted-foreground">支持 PDF、JPG、PNG，最大 10MB</p>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                  <Button className="w-full" disabled={uploading}>
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    选择文件
                  </Button>
                </label>
              </div>
            )}
          </div>

          {/* 创建信息 */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="font-semibold mb-4">创建信息</h2>
            <div className="text-sm text-muted-foreground">
              <p>创建时间：{new Date(contract.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
