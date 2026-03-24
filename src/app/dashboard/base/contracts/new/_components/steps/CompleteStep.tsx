"use client";

import { CheckCircle2, Building2, FileText, Calendar, DollarSign, Clock, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Enterprise {
  id: string;
  name: string;
  enterpriseCode: string;
  creditCode?: string;
  legalPerson?: string;
  phone?: string;
  registeredAddress?: string;
  businessAddress?: string;
}

interface ManagementCompany {
  name: string;
  creditCode: string;
  legalPerson: string;
  address: string;
  phone: string;
}

interface CompleteStepProps {
  enterprise: Enterprise | null;
  managementCompany: ManagementCompany | null;
  spaceType: string;
  spaceTypeLabel: string;
  spaceQuantity: number;
  yearlyFee: number;
  deposit: number;
  formData: {
    contractNo: string;
    startDate: string;
    endDate: string;
    contractYears: number;
    remarks: string;
  };
  onViewContract: () => void;
  onCreateAnother: () => void;
}

export function CompleteStep({
  enterprise,
  managementCompany,
  spaceType,
  spaceTypeLabel,
  spaceQuantity,
  yearlyFee,
  deposit,
  formData,
  onViewContract,
  onCreateAnother,
}: CompleteStepProps) {
  return (
    <div className="space-y-6">
      {/* 成功提示 */}
      <div className="flex flex-col items-center py-8">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-emerald-600">合同创建成功！</h2>
        <p className="text-muted-foreground mt-2">入驻合同已成功创建，可继续完善或查看详情</p>
      </div>

      {/* 合同摘要 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 合同信息 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-muted-foreground" />
              合同信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">合同编号</span>
              <span className="font-mono">{formData.contractNo || "自动生成"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">场地类型</span>
              <span>{spaceTypeLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">数量</span>
              <span>{spaceQuantity}</span>
            </div>
          </CardContent>
        </Card>

        {/* 费用信息 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              费用信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">首年服务费</span>
              <span className="font-medium">¥{yearlyFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">押金</span>
              <span className="font-medium">¥{deposit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-medium">应付总额</span>
              <span className="font-bold text-primary text-lg">¥{(yearlyFee + deposit).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* 服务期限 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-muted-foreground" />
              服务期限
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">起始日期</span>
              <span>{formData.startDate || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">终止日期</span>
              <span>{formData.endDate || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">合同期限</span>
              <span>{formData.contractYears} 年</span>
            </div>
          </CardContent>
        </Card>

        {/* 企业信息 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              乙方信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">企业名称</span>
              <span className="font-medium">{enterprise?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">法定代表人</span>
              <span>{enterprise?.legalPerson || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">联系电话</span>
              <span>{enterprise?.phone || "-"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-center gap-4 pt-4">
        <Button variant="outline" size="lg" onClick={onCreateAnother}>
          继续创建
        </Button>
        <Button size="lg" onClick={onViewContract}>
          <ExternalLink className="w-4 h-4 mr-2" />
          查看合同详情
        </Button>
      </div>
    </div>
  );
}
