"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Save,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

// 类型定义
type ApplicationType = "new" | "migration";
type SettlementType = "free" | "paid" | "tax_commitment";
type TaxType = "general" | "small_scale";

interface Shareholder {
  name: string;
  investment: string;
  phone: string;
}

interface ApplicationFormData {
  enterpriseName: string;
  enterpriseNameBackup: string;
  registeredCapital: string;
  currencyType: string;
  taxType: TaxType | "";
  expectedAnnualRevenue: string;
  expectedAnnualTax: string;
  originalRegisteredAddress: string;
  mailingAddress: string;
  businessAddress: string;
  legalPersonName: string;
  legalPersonPhone: string;
  legalPersonEmail: string;
  legalPersonAddress: string;
  shareholders: Shareholder[];
  supervisorName: string;
  supervisorPhone: string;
  financeManagerName: string;
  financeManagerPhone: string;
  contactPersonName: string;
  contactPersonPhone: string;
  ewtContactName: string;
  ewtContactPhone: string;
  intermediaryDepartment: string;
  intermediaryName: string;
  intermediaryPhone: string;
  businessScope: string;
  applicationType: ApplicationType | "";
  settlementType: SettlementType | "";
  remarks: string;
}

const initialFormData: ApplicationFormData = {
  enterpriseName: "",
  enterpriseNameBackup: "",
  registeredCapital: "",
  currencyType: "CNY",
  taxType: "",
  expectedAnnualRevenue: "",
  expectedAnnualTax: "",
  originalRegisteredAddress: "",
  mailingAddress: "",
  businessAddress: "",
  legalPersonName: "",
  legalPersonPhone: "",
  legalPersonEmail: "",
  legalPersonAddress: "",
  shareholders: [{ name: "", investment: "", phone: "" }],
  supervisorName: "",
  supervisorPhone: "",
  financeManagerName: "",
  financeManagerPhone: "",
  contactPersonName: "",
  contactPersonPhone: "",
  ewtContactName: "",
  ewtContactPhone: "",
  intermediaryDepartment: "",
  intermediaryName: "",
  intermediaryPhone: "",
  businessScope: "",
  applicationType: "",
  settlementType: "",
  remarks: "",
};

export default function NewApplicationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ApplicationFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 更新字段
  const updateField = (field: keyof ApplicationFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 股东操作
  const addShareholder = () => {
    setFormData((prev) => ({
      ...prev,
      shareholders: [...prev.shareholders, { name: "", investment: "", phone: "" }],
    }));
  };

  const removeShareholder = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      shareholders: prev.shareholders.filter((_, i) => i !== index),
    }));
  };

  const updateShareholder = (index: number, field: keyof Shareholder, value: string) => {
    setFormData((prev) => {
      const newShareholders = [...prev.shareholders];
      newShareholders[index] = { ...newShareholders[index], [field]: value };
      return { ...prev, shareholders: newShareholders };
    });
  };

  // 验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.enterpriseName) newErrors.enterpriseName = "请输入企业名称";
    if (!formData.applicationType) newErrors.applicationType = "请选择申请类型";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存草稿
  const handleSave = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await fetch("/api/settlement/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        alert("保存成功");
        router.push("/dashboard/base/applications");
      } else {
        alert(result.error || "保存失败");
      }
    } catch (err) {
      console.error("保存失败:", err);
      alert("保存失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between border-b bg-card px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/base/applications")}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <div>
            <h1 className="text-xl font-semibold">填写入园审批表</h1>
            <p className="text-sm text-muted-foreground">请如实填写以下信息</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            保存草稿
          </Button>
        </div>
      </div>

      {/* 表单内容 */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-4xl mx-auto">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="address">地址信息</TabsTrigger>
              <TabsTrigger value="personnel">人员信息</TabsTrigger>
              <TabsTrigger value="shareholder">股东信息</TabsTrigger>
              <TabsTrigger value="business">经营信息</TabsTrigger>
            </TabsList>

            {/* 基本信息 */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    申请名称 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.enterpriseName}
                    onChange={(e) => updateField("enterpriseName", e.target.value)}
                    placeholder="请输入企业名称"
                  />
                  {errors.enterpriseName && (
                    <p className="text-xs text-destructive">{errors.enterpriseName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>备用名</Label>
                  <Input
                    value={formData.enterpriseNameBackup}
                    onChange={(e) => updateField("enterpriseNameBackup", e.target.value)}
                    placeholder="请输入备用名称"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>注册资金（万元）</Label>
                  <Input
                    type="number"
                    value={formData.registeredCapital}
                    onChange={(e) => updateField("registeredCapital", e.target.value)}
                    placeholder="2000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>币种</Label>
                  <Select
                    value={formData.currencyType}
                    onValueChange={(v) => updateField("currencyType", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择币种" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CNY">人民币</SelectItem>
                      <SelectItem value="USD">美元</SelectItem>
                      <SelectItem value="EUR">欧元</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>缴税类型</Label>
                  <Select
                    value={formData.taxType}
                    onValueChange={(v) => updateField("taxType", v as TaxType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择缴税类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">一般纳税人</SelectItem>
                      <SelectItem value="small_scale">小规模</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    申请类型 <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.applicationType}
                    onValueChange={(v) => updateField("applicationType", v as ApplicationType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择申请类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">新建企业</SelectItem>
                      <SelectItem value="migration">迁移企业</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.applicationType && (
                    <p className="text-xs text-destructive">{errors.applicationType}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>入驻类型</Label>
                  <Select
                    value={formData.settlementType}
                    onValueChange={(v) => updateField("settlementType", v as SettlementType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择入驻类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">免费入驻</SelectItem>
                      <SelectItem value="paid">付费入驻</SelectItem>
                      <SelectItem value="tax_commitment">承诺税收入驻</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>预计主营收入（年/万元）</Label>
                  <Input
                    type="number"
                    value={formData.expectedAnnualRevenue}
                    onChange={(e) => updateField("expectedAnnualRevenue", e.target.value)}
                    placeholder="2000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>预计全口径税收（年/万元）</Label>
                  <Input
                    type="number"
                    value={formData.expectedAnnualTax}
                    onChange={(e) => updateField("expectedAnnualTax", e.target.value)}
                    placeholder="200"
                  />
                </div>
              </div>
            </TabsContent>

            {/* 地址信息 */}
            <TabsContent value="address" className="space-y-4">
              <div className="space-y-2">
                <Label>原注册地址（迁移企业填写）</Label>
                <Input
                  value={formData.originalRegisteredAddress}
                  onChange={(e) => updateField("originalRegisteredAddress", e.target.value)}
                  placeholder="请输入原注册地址"
                />
              </div>

              <div className="space-y-2">
                <Label>邮寄地址</Label>
                <Input
                  value={formData.mailingAddress}
                  onChange={(e) => updateField("mailingAddress", e.target.value)}
                  placeholder="请输入邮寄地址"
                />
              </div>

              <div className="space-y-2">
                <Label>实际经营地址</Label>
                <Input
                  value={formData.businessAddress}
                  onChange={(e) => updateField("businessAddress", e.target.value)}
                  placeholder="请输入实际经营地址"
                />
              </div>
            </TabsContent>

            {/* 人员信息 */}
            <TabsContent value="personnel" className="space-y-4">
              {/* 法人信息 */}
              <div className="rounded-lg border p-4 space-y-4">
                <h3 className="font-medium">法人信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>法人姓名</Label>
                    <Input
                      value={formData.legalPersonName}
                      onChange={(e) => updateField("legalPersonName", e.target.value)}
                      placeholder="请输入法人姓名"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>法人电话</Label>
                    <Input
                      value={formData.legalPersonPhone}
                      onChange={(e) => updateField("legalPersonPhone", e.target.value)}
                      placeholder="请输入法人电话"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>法人邮箱</Label>
                    <Input
                      type="email"
                      value={formData.legalPersonEmail}
                      onChange={(e) => updateField("legalPersonEmail", e.target.value)}
                      placeholder="请输入法人邮箱"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>法人住址</Label>
                    <Input
                      value={formData.legalPersonAddress}
                      onChange={(e) => updateField("legalPersonAddress", e.target.value)}
                      placeholder="请输入法人住址"
                    />
                  </div>
                </div>
              </div>

              {/* 监事信息 */}
              <div className="rounded-lg border p-4 space-y-4">
                <h3 className="font-medium">监事信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>监事姓名</Label>
                    <Input
                      value={formData.supervisorName}
                      onChange={(e) => updateField("supervisorName", e.target.value)}
                      placeholder="请输入监事姓名"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>监事电话</Label>
                    <Input
                      value={formData.supervisorPhone}
                      onChange={(e) => updateField("supervisorPhone", e.target.value)}
                      placeholder="请输入监事电话"
                    />
                  </div>
                </div>
              </div>

              {/* 财务负责人 */}
              <div className="rounded-lg border p-4 space-y-4">
                <h3 className="font-medium">财务负责人信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>财务负责人姓名</Label>
                    <Input
                      value={formData.financeManagerName}
                      onChange={(e) => updateField("financeManagerName", e.target.value)}
                      placeholder="请输入财务负责人姓名"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>财务负责人电话</Label>
                    <Input
                      value={formData.financeManagerPhone}
                      onChange={(e) => updateField("financeManagerPhone", e.target.value)}
                      placeholder="请输入财务负责人电话"
                    />
                  </div>
                </div>
              </div>

              {/* 实际联络人 */}
              <div className="rounded-lg border p-4 space-y-4">
                <h3 className="font-medium">实际联络人信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>实际联络人姓名</Label>
                    <Input
                      value={formData.contactPersonName}
                      onChange={(e) => updateField("contactPersonName", e.target.value)}
                      placeholder="请输入实际联络人姓名"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>实际联络人电话</Label>
                    <Input
                      value={formData.contactPersonPhone}
                      onChange={(e) => updateField("contactPersonPhone", e.target.value)}
                      placeholder="请输入实际联络人电话"
                    />
                  </div>
                </div>
              </div>

              {/* e窗通联系人 */}
              <div className="rounded-lg border p-4 space-y-4">
                <h3 className="font-medium">登录e窗通联系人信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>联系人姓名</Label>
                    <Input
                      value={formData.ewtContactName}
                      onChange={(e) => updateField("ewtContactName", e.target.value)}
                      placeholder="请输入联系人姓名"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>联系人电话</Label>
                    <Input
                      value={formData.ewtContactPhone}
                      onChange={(e) => updateField("ewtContactPhone", e.target.value)}
                      placeholder="请输入联系人电话"
                    />
                  </div>
                </div>
              </div>

              {/* 中介信息 */}
              <div className="rounded-lg border p-4 space-y-4">
                <h3 className="font-medium">中介人信息</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>所在部门</Label>
                    <Input
                      value={formData.intermediaryDepartment}
                      onChange={(e) => updateField("intermediaryDepartment", e.target.value)}
                      placeholder="请输入所在部门"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>姓名</Label>
                    <Input
                      value={formData.intermediaryName}
                      onChange={(e) => updateField("intermediaryName", e.target.value)}
                      placeholder="请输入姓名"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>电话</Label>
                    <Input
                      value={formData.intermediaryPhone}
                      onChange={(e) => updateField("intermediaryPhone", e.target.value)}
                      placeholder="请输入电话"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 股东信息 */}
            <TabsContent value="shareholder" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">股东信息</h3>
                <Button size="sm" variant="outline" onClick={addShareholder} className="gap-1">
                  <Plus className="h-4 w-4" />
                  添加股东
                </Button>
              </div>

              {formData.shareholders.map((shareholder, index) => (
                <div key={index} className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">股东 {index + 1}</span>
                    {formData.shareholders.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeShareholder(index)}
                        className="h-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>股东姓名</Label>
                      <Input
                        value={shareholder.name}
                        onChange={(e) => updateShareholder(index, "name", e.target.value)}
                        placeholder="请输入股东姓名"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>出资额（万元）</Label>
                      <Input
                        type="number"
                        value={shareholder.investment}
                        onChange={(e) => updateShareholder(index, "investment", e.target.value)}
                        placeholder="请输入出资额"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>联系电话</Label>
                      <Input
                        value={shareholder.phone}
                        onChange={(e) => updateShareholder(index, "phone", e.target.value)}
                        placeholder="请输入联系电话"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* 经营信息 */}
            <TabsContent value="business" className="space-y-4">
              <div className="space-y-2">
                <Label>经营范围</Label>
                <Textarea
                  value={formData.businessScope}
                  onChange={(e) => updateField("businessScope", e.target.value)}
                  placeholder="请输入经营范围"
                  rows={8}
                />
              </div>

              <div className="space-y-2">
                <Label>备注</Label>
                <Textarea
                  value={formData.remarks}
                  onChange={(e) => updateField("remarks", e.target.value)}
                  placeholder="请输入备注信息"
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
