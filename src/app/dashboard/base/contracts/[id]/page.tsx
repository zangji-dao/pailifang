"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Building2,
  Upload,
  Download,
  Trash2,
  Loader2,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// 类型定义
type ContractStatus = "draft" | "pending" | "signed" | "expired" | "terminated";

interface Contract {
  id: string;
  enterpriseId: string | null;
  enterpriseName?: string | null;
  contractNo: string | null;
  contractName: string | null;
  startDate: string | null;
  endDate: string | null;
  signedDate: string | null;
  status: ContractStatus;
  contractFileUrl: string | null;
  remarks: string | null;
  createdAt: string;
}

// 状态配置 - 使用统一的七彩配色风格（与 globals.css 对齐）
const statusConfig: Record<ContractStatus, { 
  label: string; 
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  draft: { 
    label: "草稿", 
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
  },
  pending: { 
    label: "待签", 
    color: "text-amber-600",      // 琥珀色 - 签订合同
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  signed: { 
    label: "已签", 
    color: "text-emerald-600",    // 翡翠绿 - 完成
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  expired: { 
    label: "已到期", 
    color: "text-rose-600",       // 玫瑰粉 - 异常状态
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
  },
  terminated: { 
    label: "已终止", 
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
  },
};

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("仅支持 PDF、JPG、PNG 格式");
      return;
    }

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

      const updateRes = await fetch(`/api/settlement/contracts/${contractId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractFileUrl: uploadResult.url,
          // 上传附件后保持原状态，不自动改为待签
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

  // 删除合同
  const handleDelete = async () => {
    if (!confirm("确定要删除这份合同吗？")) return;

    try {
      const response = await fetch(`/api/settlement/contracts/${contractId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("删除失败");

      toast.success("合同已删除");
      router.push("/dashboard/base/contracts");
    } catch (error) {
      console.error("删除失败:", error);
      toast.error("删除失败");
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/base/contracts")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              {contract.contractName || "合同详情"}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-muted-foreground font-mono text-sm">
                {contract.contractNo || "未编号"}
              </span>
              <Badge className={cn("font-normal border", statusInfo.bgColor, statusInfo.color, statusInfo.borderColor)}>
                {statusInfo.label}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {contract.status === "draft" && (
            <>
              <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                删除合同
              </Button>
              <Button onClick={() => router.push(`/dashboard/base/contracts/${contractId}/edit`)}>
                编辑合同
              </Button>
            </>
          )}
          {/* 草稿或待签状态，有合同文件就可以确认签署 */}
          {(contract.status === "draft" || contract.status === "pending") && contract.contractFileUrl && (
            <Button onClick={handleSign} className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              确认签署
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 合同信息 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              合同信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">合同编号</span>
              <span className="font-mono">{contract.contractNo || "-"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">合同名称</span>
              <span>{contract.contractName || "-"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">关联企业</span>
              <span>{contract.enterpriseName || "-"}</span>
            </div>
          </CardContent>
        </Card>

        {/* 有效期 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              有效期
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">开始日期</span>
              <span>{contract.startDate || "-"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">截止日期</span>
              <span>{contract.endDate || "-"}</span>
            </div>
            {contract.signedDate && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">签署日期</span>
                <span>{contract.signedDate}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 备注 */}
        {contract.remarks && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">备注</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contract.remarks}</p>
            </CardContent>
          </Card>
        )}

        {/* 合同文件 */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              合同文件
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contract.contractFileUrl ? (
              <div className="flex items-center gap-4">
                <div className="flex-1 flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">合同文件</p>
                    <p className="text-xs text-muted-foreground">点击查看或下载</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={contract.contractFileUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      查看
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={contract.contractFileUrl} download>
                      <Download className="h-4 w-4 mr-1" />
                      下载
                    </a>
                  </Button>
                </div>
                {contract.status !== "signed" && (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleUpload}
                      disabled={uploading}
                    />
                    <Button variant="outline" size="sm" disabled={uploading}>
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </Button>
                  </label>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex-1 border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">上传合同文件</p>
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
                  <Button disabled={uploading}>
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
          </CardContent>
        </Card>
      </div>

      {/* 底部操作 */}
      <div className="flex justify-between items-center pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          创建时间：{new Date(contract.createdAt).toLocaleString()}
        </p>
        <div className="flex items-center gap-2">
          {contract.status !== "signed" && !contract.contractFileUrl && (
            <span className="text-sm text-amber-600">请上传合同文件</span>
          )}
          {contract.status !== "signed" && contract.contractFileUrl && (
            <span className="text-sm text-emerald-600">文件已上传，点击"确认签署"完成签署</span>
          )}
          <Button onClick={() => router.push("/dashboard/base/contracts/new")}>
            <Plus className="h-4 w-4 mr-2" />
            新建合同
          </Button>
        </div>
      </div>
    </div>
  );
}
