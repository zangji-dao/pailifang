"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, FileText } from "lucide-react";

interface ProofFile {
  name: string;
  url: string;
  size: number;
}

interface ConfirmInfoStepProps {
  enterpriseName: string;
  enterpriseCode: string;
  enterpriseType: "tenant" | "non_tenant" | null;
  baseName: string;
  selectedRegNumber: {
    code: string;
    manualCode: string | null;
    fullAddress: string | null;
    assignedEnterpriseName: string | null;
  } | null;
  proofFiles: ProofFile[];
  remarks: string;
  onUpdateEnterpriseName: (name: string) => void;
  onUpdateRemarks: (remarks: string) => void;
}

export function ConfirmInfoStep({
  enterpriseName,
  enterpriseCode,
  enterpriseType,
  baseName,
  selectedRegNumber,
  proofFiles,
  remarks,
  onUpdateEnterpriseName,
  onUpdateRemarks,
}: ConfirmInfoStepProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>确认企业信息</CardTitle>
        <CardDescription>请确认企业信息并完成创建</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 信息汇总 */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">企业编号</Label>
              <p className="font-semibold">{enterpriseCode}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">企业类型</Label>
              <p className="font-semibold">
                {enterpriseType === "tenant" ? "入驻企业" : "非入驻企业"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">所属基地</Label>
              <p className="font-semibold">{baseName}</p>
            </div>
            {selectedRegNumber && (
              <div>
                <Label className="text-muted-foreground">工位号</Label>
                <p className="font-semibold">{selectedRegNumber.manualCode || selectedRegNumber.code}</p>
              </div>
            )}
          </div>

          {/* 企业名称 */}
          <div className="space-y-2">
            <Label>企业名称 <span className="text-red-500">*</span></Label>
            <Input
              value={enterpriseName}
              onChange={(e) => onUpdateEnterpriseName(e.target.value)}
              placeholder="请输入企业名称"
            />
            {selectedRegNumber?.assignedEnterpriseName && (
              <p className="text-xs text-muted-foreground">
                已从预分配信息带入：{selectedRegNumber.assignedEnterpriseName}
              </p>
            )}
          </div>

          {/* 地址信息 */}
          {selectedRegNumber && (
            <div>
              <Label className="text-muted-foreground">注册地址</Label>
              <p className="text-sm">{selectedRegNumber.fullAddress}</p>
            </div>
          )}

          {/* 备注 */}
          <div className="space-y-2">
            <Label>备注</Label>
            <Textarea
              value={remarks}
              onChange={(e) => onUpdateRemarks(e.target.value)}
              placeholder="可选，填写备注信息"
              rows={3}
            />
          </div>

          {/* 已上传文件 */}
          {proofFiles.length > 0 && (
            <div>
              <Label className="text-muted-foreground">产权证明文件 ({proofFiles.length})</Label>
              <div className="mt-2 space-y-1">
                {proofFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span>{file.name}</span>
                    <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 创建后状态提示 */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            创建后企业将进入
            <strong className="text-primary">
              {enterpriseType === "tenant" ? "待工商注册" : "待工商变更"}
            </strong>
            状态，可在企业管理中继续完善信息
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
