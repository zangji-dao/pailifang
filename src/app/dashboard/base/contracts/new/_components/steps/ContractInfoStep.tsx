"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Building2,
  Landmark,
  Loader2,
  MapPin,
  Clock,
  FileText,
} from "lucide-react";

interface Enterprise {
  id: string;
  name: string;
  enterpriseCode: string;
  creditCode?: string;
  legalPerson?: string;
  phone?: string;
  registeredAddress?: string;
  businessAddress?: string;
  baseId?: string;
}

interface ManagementCompany {
  name: string;
  creditCode: string;
  legalPerson: string;
  address: string;
  phone: string;
}

interface ContractInfoStepProps {
  enterprise: Enterprise | null;
  formData: {
    contractNo: string;
    startDate: string;
    endDate: string;
    contractYears: number;
    remarks: string;
  };
  onUpdateFormData: (data: Record<string, string | number>) => void;
  subStepId: string;
  managementCompany: ManagementCompany | null;
  onUpdateManagementCompany: (company: ManagementCompany | null) => void;
}

export function ContractInfoStep({
  enterprise,
  formData,
  onUpdateFormData,
  subStepId,
  managementCompany,
  onUpdateManagementCompany,
}: ContractInfoStepProps) {
  const [loadingManagement, setLoadingManagement] = useState(false);

  // 获取基地的管理公司信息
  useEffect(() => {
    if (enterprise?.baseId) {
      setLoadingManagement(true);
      fetch(`/api/bases/${enterprise.baseId}`)
        .then(res => res.json())
        .then(result => {
          if (result.success && result.data) {
            const company: ManagementCompany = {
              name: result.data.management_company_name || "",
              creditCode: result.data.management_company_credit_code || "",
              legalPerson: result.data.management_company_legal_person || "",
              address: result.data.management_company_address || "",
              phone: result.data.management_company_phone || "",
            };
            onUpdateManagementCompany(company);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingManagement(false));
    } else {
      onUpdateManagementCompany(null);
    }
  }, [enterprise?.baseId, onUpdateManagementCompany]);

  // 根据期限自动计算结束日期
  useEffect(() => {
    if (formData.startDate && formData.contractYears) {
      const start = new Date(formData.startDate);
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + formData.contractYears);
      onUpdateFormData({ endDate: end.toISOString().split("T")[0] });
    }
  }, [formData.startDate, formData.contractYears, onUpdateFormData]);

  const isPartyInfoStep = subStepId === "party_info";

  if (isPartyInfoStep) {
    return (
      <div className="space-y-6">
        {/* 甲方信息 */}
        <Card className={managementCompany ? "border-primary/30" : "border-amber-200 bg-amber-50/50"}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="h-5 w-5 text-primary" />
              甲方信息（服务方）
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingManagement ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>正在加载管理公司信息...</span>
              </div>
            ) : managementCompany ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">企业名称：</span>
                  <span className="font-medium">{managementCompany.name || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">统一社会信用代码：</span>
                  <span className="font-mono text-xs">{managementCompany.creditCode || "-"}</span>
                </div>
                {managementCompany.legalPerson && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">法定代表人：</span>
                    <span>{managementCompany.legalPerson}</span>
                  </div>
                )}
                {managementCompany.phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">联系电话：</span>
                    <span>{managementCompany.phone}</span>
                  </div>
                )}
                <div className="col-span-2 flex items-start gap-2">
                  <span className="text-muted-foreground">地址：</span>
                  <span>{managementCompany.address || "-"}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-amber-600">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">未配置管理公司信息</p>
                  <p className="text-sm text-amber-600/80 mt-1">
                    该企业关联的基地尚未配置管理公司信息。请先在「基地管理」中为该基地设置管理公司信息。
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 乙方信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              乙方信息（入驻方）
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enterprise ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">企业名称：</span>
                  <span className="font-medium">{enterprise.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">统一社会信用代码：</span>
                  <span className="font-mono text-xs">{enterprise.creditCode || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">法定代表人：</span>
                  <span>{enterprise.legalPerson || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">联系电话：</span>
                  <span>{enterprise.phone || "-"}</span>
                </div>
                <div className="col-span-2 flex items-start gap-2">
                  <span className="text-muted-foreground">注册地址：</span>
                  <span>{enterprise.registeredAddress || enterprise.businessAddress || "-"}</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">请先选择企业</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // 服务期限步骤
  return (
    <div className="space-y-6">
      {/* 合同编号 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            合同编号
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>合同编号（选填）</Label>
              <Input
                className="mt-1.5"
                placeholder="留空自动生成"
                value={formData.contractNo}
                onChange={(e) => onUpdateFormData({ contractNo: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <p className="text-sm text-muted-foreground">
                若不填写，系统将自动生成合同编号
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 服务期限 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            服务期限
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>起始日期</Label>
              <Input
                type="date"
                className="mt-1.5"
                value={formData.startDate}
                onChange={(e) => onUpdateFormData({ startDate: e.target.value })}
              />
            </div>
            <div>
              <Label>合同期限（年）</Label>
              <Select
                value={String(formData.contractYears)}
                onValueChange={(v) => onUpdateFormData({ contractYears: Number(v) })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 5].map(y => (
                    <SelectItem key={y} value={String(y)}>{y} 年</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>终止日期</Label>
              <div className="mt-1.5 p-2 border rounded-md bg-muted/50">
                {formData.endDate || "-"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 备注 */}
      <Card>
        <CardHeader>
          <CardTitle>备注</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="其他备注信息..."
            value={formData.remarks}
            onChange={(e) => onUpdateFormData({ remarks: e.target.value })}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* 合同附件提示 */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground mb-2">合同创建后将自动包含以下附件：</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>附件一：Π立方服务标准清单</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>附件二：空间使用与管理规范</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>附件三：特色服务超市价目表</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>附件四：独栋办公室补充条款</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>附件五：安全责任承诺书</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
