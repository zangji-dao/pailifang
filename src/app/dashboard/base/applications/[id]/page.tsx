"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Save,
  Send,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// 类型定义
type ApprovalStatus = "draft" | "pending" | "approved" | "rejected";
type ApplicationType = "new" | "migration";
type TaxType = "general" | "small_scale";

interface Shareholder {
  name: string;
  investment: string;
  phone: string;
}

interface Personnel {
  name: string;
  phone: string;
  email: string;
  address: string;
  roles: string[];
}

interface ApplicationFormData {
  applicationNo: string;
  applicationDate: string;
  approvalStatus: ApprovalStatus;
  enterpriseName: string;
  enterpriseNameBackup: string;
  registeredCapital: string;
  currencyType: string;
  taxType: TaxType | "";
  expectedAnnualRevenue: string;
  expectedAnnualTax: string;
  introducerName: string;
  introducerPhone: string;
  originalRegisteredAddress: string;
  mailingAddress: string;
  businessAddress: string;
  personnel: Personnel[];
  shareholders: Shareholder[];
  ewtContactName: string;
  ewtContactPhone: string;
  intermediaryDepartment: string;
  intermediaryName: string;
  intermediaryPhone: string;
  businessScope: string;
  applicationType: ApplicationType | "";
  remarks: string;
}

const statusConfig: Record<ApprovalStatus, { label: string; className: string }> = {
  draft: { label: "草稿", className: "bg-gray-50 text-gray-600 border-gray-200" },
  pending: { label: "待审批", className: "bg-blue-50 text-blue-600 border-blue-200" },
  approved: { label: "已通过", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  rejected: { label: "已驳回", className: "bg-red-50 text-red-600 border-red-200" },
};

const roleConfig: Record<string, { label: string; description: string }> = {
  legal_person: { label: "法人代表", description: "公司法定代表人" },
  supervisor: { label: "监事", description: "负责监督公司运营" },
  finance_manager: { label: "财务负责人", description: "负责公司财务管理" },
  contact_person: { label: "实际联络人", description: "日常事务联系人" },
};

export default function EditApplicationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState<ApplicationFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 获取申请详情
  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/settlement/applications/${id}`);
        const result = await response.json();
        if (result.success) {
          setFormData({
            ...initialFormData,
            ...result.data,
            personnel: result.data.personnel || [
              { name: "", phone: "", email: "", address: "", roles: ["legal_person", "finance_manager", "contact_person"] },
              { name: "", phone: "", email: "", address: "", roles: ["supervisor"] },
            ],
            shareholders: result.data.shareholders || [{ name: "", investment: "", phone: "" }],
          });
        } else {
          alert(result.error || "获取申请详情失败");
          router.push("/dashboard/base/applications");
        }
      } catch (err) {
        console.error("获取申请详情失败:", err);
        alert("获取申请详情失败");
        router.push("/dashboard/base/applications");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchApplication();
  }, [id, router]);

  // 更新字段
  const updateField = (field: keyof ApplicationFormData, value: any) => {
    setFormData((prev) => prev ? { ...prev, [field]: value } : null);
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 人员操作
  const addPersonnel = () => {
    setFormData((prev) => prev ? {
      ...prev,
      personnel: [...prev.personnel, { name: "", phone: "", email: "", address: "", roles: [] }],
    } : null);
  };

  const removePersonnel = (index: number) => {
    setFormData((prev) => prev ? {
      ...prev,
      personnel: prev.personnel.filter((_, i) => i !== index),
    } : null);
  };

  const updatePersonnel = (index: number, field: keyof Personnel, value: any) => {
    setFormData((prev) => {
      if (!prev) return null;
      const newPersonnel = [...prev.personnel];
      newPersonnel[index] = { ...newPersonnel[index], [field]: value };
      return { ...prev, personnel: newPersonnel };
    });
  };

  const togglePersonnelRole = (index: number, role: string) => {
    setFormData((prev) => {
      if (!prev) return null;
      const newPersonnel = [...prev.personnel];
      const roles = newPersonnel[index].roles;
      if (roles.includes(role)) {
        newPersonnel[index] = { ...newPersonnel[index], roles: roles.filter((r) => r !== role) };
      } else {
        newPersonnel[index] = { ...newPersonnel[index], roles: [...roles, role] };
      }
      return { ...prev, personnel: newPersonnel };
    });
  };

  // 股东操作
  const addShareholder = () => {
    setFormData((prev) => prev ? {
      ...prev,
      shareholders: [...prev.shareholders, { name: "", investment: "", phone: "" }],
    } : null);
  };

  const removeShareholder = (index: number) => {
    setFormData((prev) => prev ? {
      ...prev,
      shareholders: prev.shareholders.filter((_, i) => i !== index),
    } : null);
  };

  const updateShareholder = (index: number, field: keyof Shareholder, value: string) => {
    setFormData((prev) => {
      if (!prev) return null;
      const newShareholders = [...prev.shareholders];
      newShareholders[index] = { ...newShareholders[index], [field]: value };
      return { ...prev, shareholders: newShareholders };
    });
  };

  // 验证人员角色冲突
  const validatePersonnelRoles = (): string | null => {
    if (!formData) return "数据未加载";

    const legalPersonIndex = formData.personnel.findIndex((p) => p.roles.includes("legal_person"));
    const supervisorIndex = formData.personnel.findIndex((p) => p.roles.includes("supervisor"));
    const financeIndex = formData.personnel.findIndex((p) => p.roles.includes("finance_manager"));

    if (legalPersonIndex !== -1 && legalPersonIndex === supervisorIndex) {
      return "法人代表和监事不能是同一人";
    }

    if (supervisorIndex !== -1 && supervisorIndex === financeIndex) {
      return "监事和财务负责人不能是同一人";
    }

    if (legalPersonIndex === -1) {
      return "必须指定法人代表";
    }

    if (supervisorIndex === -1) {
      return "必须指定监事";
    }

    return null;
  };

  // 验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData?.enterpriseName) newErrors.enterpriseName = "请输入企业名称";
    if (!formData?.applicationType) newErrors.applicationType = "请选择申请类型";

    const roleError = validatePersonnelRoles();
    if (roleError) newErrors.personnel = roleError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存
  const handleSave = async () => {
    if (!validateForm() || !formData) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/settlement/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        alert("保存成功");
      } else {
        alert(result.error || "保存失败");
      }
    } catch (err) {
      console.error("保存失败:", err);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  // 提交审批
  const handleSubmit = async () => {
    if (!validateForm() || !formData) return;
    if (!confirm("确认提交此申请进行审批？")) return;

    setSaving(true);
    try {
      const saveResponse = await fetch(`/api/settlement/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const saveResult = await saveResponse.json();
      
      if (!saveResult.success) {
        alert(saveResult.error || "保存失败");
        return;
      }

      const submitResponse = await fetch(`/api/settlement/applications/${id}/submit`, {
        method: "POST",
      });
      const submitResult = await submitResponse.json();
      
      if (submitResult.success) {
        alert("提交成功");
        router.push("/dashboard/base/applications");
      } else {
        alert(submitResult.error || "提交失败");
      }
    } catch (err) {
      console.error("提交失败:", err);
      alert("提交失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!formData) {
    return null;
  }

  const canEdit = formData.approvalStatus === "draft" || formData.approvalStatus === "rejected";

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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{formData.applicationNo}</h1>
              <Badge variant="outline" className={statusConfig[formData.approvalStatus].className}>
                {statusConfig[formData.approvalStatus].label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{formData.enterpriseName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button variant="outline" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                保存
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                <Send className="mr-2 h-4 w-4" />
                提交审批
              </Button>
            </>
          )}
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
                    disabled={!canEdit}
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
                    disabled={!canEdit}
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
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>币种</Label>
                  <Select
                    value={formData.currencyType}
                    onValueChange={(v) => updateField("currencyType", v)}
                    disabled={!canEdit}
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
                    disabled={!canEdit}
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

              <div className="space-y-2">
                <Label>
                  申请类型 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.applicationType}
                  onValueChange={(v) => updateField("applicationType", v as ApplicationType)}
                  disabled={!canEdit}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>预计主营收入（年/万元）</Label>
                  <Input
                    type="number"
                    value={formData.expectedAnnualRevenue}
                    onChange={(e) => updateField("expectedAnnualRevenue", e.target.value)}
                    placeholder="2000"
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>预计全口径税收（年/万元）</Label>
                  <Input
                    type="number"
                    value={formData.expectedAnnualTax}
                    onChange={(e) => updateField("expectedAnnualTax", e.target.value)}
                    placeholder="200"
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-4">
                <h3 className="font-medium">介绍人信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>介绍人姓名</Label>
                    <Input
                      value={formData.introducerName}
                      onChange={(e) => updateField("introducerName", e.target.value)}
                      placeholder="请输入介绍人姓名"
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>介绍人电话</Label>
                    <Input
                      value={formData.introducerPhone}
                      onChange={(e) => updateField("introducerPhone", e.target.value)}
                      placeholder="请输入介绍人电话"
                      disabled={!canEdit}
                    />
                  </div>
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
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-2">
                <Label>邮寄地址</Label>
                <Input
                  value={formData.mailingAddress}
                  onChange={(e) => updateField("mailingAddress", e.target.value)}
                  placeholder="请输入邮寄地址"
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-2">
                <Label>实际经营地址</Label>
                <Input
                  value={formData.businessAddress}
                  onChange={(e) => updateField("businessAddress", e.target.value)}
                  placeholder="请输入实际经营地址"
                  disabled={!canEdit}
                />
              </div>
            </TabsContent>

            {/* 人员信息 */}
            <TabsContent value="personnel" className="space-y-4">
              {/* 提示信息 */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">工商注册人员配置规则：</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>最少需要 <strong>2个人</strong>：法人代表、监事（必须分开）</li>
                      <li>法人代表可以兼任财务负责人、实际联络人</li>
                      <li>监事<strong>不能</strong>兼任法人代表或财务负责人</li>
                    </ul>
                  </div>
                </div>
              </div>

              {errors.personnel && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{errors.personnel}</span>
                  </div>
                </div>
              )}

              {/* 人员列表 */}
              <div className="flex items-center justify-between">
                <h3 className="font-medium">公司人员</h3>
                {canEdit && (
                  <Button size="sm" variant="outline" onClick={addPersonnel} className="gap-1">
                    <Plus className="h-4 w-4" />
                    添加人员
                  </Button>
                )}
              </div>

              {formData.personnel.map((person, index) => (
                <div key={index} className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">人员 {index + 1}</span>
                    {canEdit && formData.personnel.length > 2 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removePersonnel(index)}
                        className="h-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* 基本信息 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>姓名</Label>
                      <Input
                        value={person.name}
                        onChange={(e) => updatePersonnel(index, "name", e.target.value)}
                        placeholder="请输入姓名"
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>电话</Label>
                      <Input
                        value={person.phone}
                        onChange={(e) => updatePersonnel(index, "phone", e.target.value)}
                        placeholder="请输入电话"
                        disabled={!canEdit}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>邮箱</Label>
                      <Input
                        type="email"
                        value={person.email}
                        onChange={(e) => updatePersonnel(index, "email", e.target.value)}
                        placeholder="请输入邮箱"
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>住址</Label>
                      <Input
                        value={person.address}
                        onChange={(e) => updatePersonnel(index, "address", e.target.value)}
                        placeholder="请输入住址"
                        disabled={!canEdit}
                      />
                    </div>
                  </div>

                  {/* 职务选择 */}
                  <div className="space-y-2">
                    <Label>担任职务</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(roleConfig).map(([role, config]) => {
                        const isDisabled =
                          !canEdit ||
                          (role === "supervisor" && person.roles.includes("legal_person")) ||
                          (role === "supervisor" && person.roles.includes("finance_manager")) ||
                          (role === "legal_person" && person.roles.includes("supervisor")) ||
                          (role === "finance_manager" && person.roles.includes("supervisor"));

                        return (
                          <div
                            key={role}
                            className={cn(
                              "flex items-center space-x-2 p-2 rounded border",
                              isDisabled && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <Checkbox
                              id={`role-${index}-${role}`}
                              checked={person.roles.includes(role)}
                              onCheckedChange={() => togglePersonnelRole(index, role)}
                              disabled={isDisabled}
                            />
                            <div className="flex-1">
                              <label
                                htmlFor={`role-${index}-${role}`}
                                className={cn(
                                  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                                  isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                                )}
                              >
                                {config.label}
                              </label>
                              <p className="text-xs text-muted-foreground">{config.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {/* 其他联系人 */}
              <div className="rounded-lg border p-4 space-y-4">
                <h3 className="font-medium">登录e窗通联系人</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>联系人姓名</Label>
                    <Input
                      value={formData.ewtContactName}
                      onChange={(e) => updateField("ewtContactName", e.target.value)}
                      placeholder="请输入联系人姓名"
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>联系人电话</Label>
                    <Input
                      value={formData.ewtContactPhone}
                      onChange={(e) => updateField("ewtContactPhone", e.target.value)}
                      placeholder="请输入联系人电话"
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-4">
                <h3 className="font-medium">中介人信息</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>所在部门</Label>
                    <Input
                      value={formData.intermediaryDepartment}
                      onChange={(e) => updateField("intermediaryDepartment", e.target.value)}
                      placeholder="请输入所在部门"
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>姓名</Label>
                    <Input
                      value={formData.intermediaryName}
                      onChange={(e) => updateField("intermediaryName", e.target.value)}
                      placeholder="请输入姓名"
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>电话</Label>
                    <Input
                      value={formData.intermediaryPhone}
                      onChange={(e) => updateField("intermediaryPhone", e.target.value)}
                      placeholder="请输入电话"
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 股东信息 */}
            <TabsContent value="shareholder" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">股东信息</h3>
                {canEdit && (
                  <Button size="sm" variant="outline" onClick={addShareholder} className="gap-1">
                    <Plus className="h-4 w-4" />
                    添加股东
                  </Button>
                )}
              </div>

              {formData.shareholders.map((shareholder, index) => (
                <div key={index} className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">股东 {index + 1}</span>
                    {canEdit && formData.shareholders.length > 1 && (
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
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>出资额（万元）</Label>
                      <Input
                        type="number"
                        value={shareholder.investment}
                        onChange={(e) => updateShareholder(index, "investment", e.target.value)}
                        placeholder="请输入出资额"
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>联系电话</Label>
                      <Input
                        value={shareholder.phone}
                        onChange={(e) => updateShareholder(index, "phone", e.target.value)}
                        placeholder="请输入联系电话"
                        disabled={!canEdit}
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
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-2">
                <Label>备注</Label>
                <Textarea
                  value={formData.remarks}
                  onChange={(e) => updateField("remarks", e.target.value)}
                  placeholder="请输入备注信息"
                  rows={3}
                  disabled={!canEdit}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}

const initialFormData: ApplicationFormData = {
  applicationNo: "",
  applicationDate: "",
  approvalStatus: "draft",
  enterpriseName: "",
  enterpriseNameBackup: "",
  registeredCapital: "",
  currencyType: "CNY",
  taxType: "",
  expectedAnnualRevenue: "",
  expectedAnnualTax: "",
  introducerName: "",
  introducerPhone: "",
  originalRegisteredAddress: "",
  mailingAddress: "",
  businessAddress: "",
  personnel: [
    { name: "", phone: "", email: "", address: "", roles: ["legal_person", "finance_manager", "contact_person"] },
    { name: "", phone: "", email: "", address: "", roles: ["supervisor"] },
  ],
  shareholders: [{ name: "", investment: "", phone: "" }],
  ewtContactName: "",
  ewtContactPhone: "",
  intermediaryDepartment: "",
  intermediaryName: "",
  intermediaryPhone: "",
  businessScope: "",
  applicationType: "",
  remarks: "",
};
