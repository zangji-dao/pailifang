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
  CheckCircle2,
  Clock,
  AlertCircle,
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
  contractType?: string | null;  // 后端返回的合同类型名称
  startDate: string | null;
  endDate: string | null;
  signedDate: string | null;
  status: ContractStatus;
  contractFileUrl: string | null;
  remarks: string | null;
  createdAt: string;
}

// 状态配置 - 使用统一的七彩配色风格
const statusConfig: Record<ContractStatus, { 
  label: string; 
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  draft: { 
    label: "草稿", 
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    icon: FileText,
  },
  pending: { 
    label: "待签", 
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    icon: Clock,
  },
  signed: { 
    label: "已签", 
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    icon: CheckCircle2,
  },
  expired: { 
    label: "已到期", 
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    icon: AlertCircle,
  },
  terminated: { 
    label: "已终止", 
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    icon: AlertCircle,
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
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* 头部区域 */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/base/contracts")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">
                {contract.contractName || "合同详情"}
              </h1>
              <Badge className={cn("font-normal border", statusInfo.bgColor, statusInfo.color, statusInfo.borderColor)}>
                <StatusIcon className="h-3.5 w-3.5 mr-1" />
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 font-mono text-sm">
              合同编号：{contract.contractNo || "未编号"}
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {contract.status === "draft" && (
            <>
              <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </Button>
            </>
          )}
          {contract.contractFileUrl && (
            <Button variant="outline" asChild>
              <a href={contract.contractFileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                查看合同
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* 主内容区 - 两列布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：合同基本信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 合同信息卡片 */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-600" />
                合同信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">关联企业</p>
                  <p className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {contract.enterpriseName || contract.contractName?.replace(/合同$/, '') || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">合同类型</p>
                  <p className="font-medium">{contract.contractType || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">开始日期</p>
                  <p className="font-medium">{contract.startDate || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">截止日期</p>
                  <p className="font-medium">{contract.endDate || "-"}</p>
                </div>
              </div>

              {contract.remarks && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">备注</p>
                  <p className="text-sm">{contract.remarks}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 合同文件卡片 */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-600" />
                合同文件
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contract.contractFileUrl ? (
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">合同扫描件</p>
                    <p className="text-sm text-muted-foreground">
                      上传于 {new Date(contract.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                  <div className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                    "hover:border-amber-300 hover:bg-amber-50/30",
                    uploading && "opacity-50 pointer-events-none"
                  )}>
                    {uploading ? (
                      <Loader2 className="h-8 w-8 mx-auto text-amber-600 animate-spin mb-3" />
                    ) : (
                      <Upload className="h-8 w-8 mx-auto text-amber-600 mb-3" />
                    )}
                    <p className="font-medium">点击上传合同文件</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      支持 PDF、JPG、PNG 格式，最大 10MB
                    </p>
                  </div>
                </label>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧：状态和时间线 */}
        <div className="space-y-6">
          {/* 状态卡片 */}
          <Card className={cn("border-l-4", contract.status === "signed" ? "border-l-emerald-500" : contract.status === "draft" ? "border-l-slate-400" : "border-l-amber-500")}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", statusInfo.bgColor)}>
                  <StatusIcon className={cn("h-7 w-7", statusInfo.color)} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">当前状态</p>
                  <p className={cn("text-xl font-semibold", statusInfo.color)}>{statusInfo.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 时间线 */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-600" />
                时间记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
                  <div>
                    <p className="text-sm font-medium">创建合同</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(contract.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {contract.signedDate && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                    <div>
                      <p className="text-sm font-medium">签署合同</p>
                      <p className="text-xs text-muted-foreground">{contract.signedDate}</p>
                    </div>
                  </div>
                )}
                {contract.endDate && new Date(contract.endDate) < new Date() && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-rose-500 mt-2" />
                    <div>
                      <p className="text-sm font-medium">合同到期</p>
                      <p className="text-xs text-muted-foreground">{contract.endDate}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 操作提示 */}
          {contract.status === "draft" && !contract.contractFileUrl && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>下一步：</strong>上传合同扫描件或电子版文件
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
