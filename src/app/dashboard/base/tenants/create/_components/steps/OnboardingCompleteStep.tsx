"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  Building2, 
  MapPin, 
  Phone, 
  User,
  Calendar,
  FileText,
  CreditCard
} from "lucide-react";

interface OnboardingCompleteStepProps {
  enterpriseName: string;
  enterpriseCode: string;
  enterpriseType: "tenant" | "non_tenant" | null;
  baseName: string;
  selectedRegNumber: {
    code: string;
    manualCode: string | null;
    fullAddress: string | null;
  } | null;
  creditCode: string;
  legalPerson: string;
  phone: string;
  contract: {
    contractId: string | null;
    contractNumber: string;
  } | null;
  paymentRecordCount: number;
  totalPaymentAmount: number;
  onViewDetails: () => void;
  onReturnToList: () => void;
}

export function OnboardingCompleteStep({
  enterpriseName,
  enterpriseCode,
  enterpriseType,
  baseName,
  selectedRegNumber,
  creditCode,
  legalPerson,
  phone,
  contract,
  paymentRecordCount,
  totalPaymentAmount,
  onViewDetails,
  onReturnToList,
}: OnboardingCompleteStepProps) {

  return (
    <div className="space-y-6">
      {/* 成功提示 */}
      <Card className="border-step-emerald/30 bg-step-emerald-muted/50">
        <CardContent className="py-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-step-emerald-muted flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-step-emerald" />
          </div>
          <h2 className="text-2xl font-bold text-step-emerald mb-2">入驻流程完成</h2>
          <p className="text-step-emerald">
            企业 <strong className="text-step-emerald">{enterpriseName}</strong> 已完成所有入驻流程
          </p>
        </CardContent>
      </Card>

      {/* 入驻信息汇总 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            入驻信息汇总
          </CardTitle>
          <CardDescription>以下是您的入驻信息概览</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 基本信息 */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">基本信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">企业名称</p>
                  <p className="font-medium">{enterpriseName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">企业编号</p>
                  <p className="font-medium">{enterpriseCode}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">所属基地</p>
                  <p className="font-medium">{baseName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">企业类型</p>
                  <Badge variant={enterpriseType === "tenant" ? "default" : "secondary"}>
                    {enterpriseType === "tenant" ? "入驻企业" : "服务企业"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 工位信息 */}
          {selectedRegNumber && (
            <>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">工位信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">工位号</p>
                      <p className="font-medium">{selectedRegNumber.manualCode || selectedRegNumber.code}</p>
                    </div>
                  </div>
                  {selectedRegNumber.fullAddress && (
                    <div className="col-span-2 flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">注册地址</p>
                        <p className="font-medium">{selectedRegNumber.fullAddress}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* 工商信息 */}
          {(creditCode || legalPerson || phone) && (
            <>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">工商信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  {creditCode && (
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">信用代码</p>
                        <p className="font-medium font-mono text-sm">{creditCode}</p>
                      </div>
                    </div>
                  )}
                  {legalPerson && (
                    <div className="flex items-start gap-3">
                      <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">法定代表人</p>
                        <p className="font-medium">{legalPerson}</p>
                      </div>
                    </div>
                  )}
                  {phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">联系电话</p>
                        <p className="font-medium">{phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* 合同信息 */}
          {contract && (
            <>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">合同信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">关联合同</p>
                      <p className="font-medium">{contract.contractNumber}</p>
                    </div>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* 费用信息 */}
          {paymentRecordCount > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">费用信息</h4>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span>关联合同收款记录</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{paymentRecordCount} 条</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-medium">收款总金额</span>
                <span className="font-bold text-step-emerald">¥{totalPaymentAmount.toLocaleString()}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={onReturnToList}>
          返回列表
        </Button>
        <Button onClick={onViewDetails}>
          查看企业详情
        </Button>
      </div>
    </div>
  );
}
