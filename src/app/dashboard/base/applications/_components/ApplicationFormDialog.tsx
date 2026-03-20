"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Loader2, Plus, Trash2 } from "lucide-react";

// 类型定义
type ApplicationType = "new" | "migration";
type SettlementType = "free" | "paid" | "tax_commitment";
type TaxType = "general" | "small_scale";

interface Shareholder {
  name: string;
  investment: number | string;
  phone: string;
}

interface ApplicationFormData {
  id?: string;
  // 基本信息
  enterpriseName: string;
  enterpriseNameBackups: string[]; // 备用名列表（可多个）
  registeredCapital: string;
  currencyType: string;
  taxType: TaxType | "";
  
  // 预计经营数据
  expectedAnnualRevenue: string;
  expectedAnnualTax: string;
  
  // 地址信息
  originalRegisteredAddress: string;
  mailingAddress: string;
  businessAddress: string;
  
  // 法人信息
  legalPersonName: string;
  legalPersonPhone: string;
  legalPersonEmail: string;
  legalPersonAddress: string;
  
  // 股东信息
  shareholders: Shareholder[];
  
  // 监事信息
  supervisorName: string;
  supervisorPhone: string;
  
  // 财务负责人信息
  financeManagerName: string;
  financeManagerPhone: string;
  
  // 实际联络人信息
  contactPersonName: string;
  contactPersonPhone: string;
  
  // e窗通联系人信息
  ewtContactName: string;
  ewtContactPhone: string;
  
  // 中介信息
  intermediaryDepartment: string;
  intermediaryName: string;
  intermediaryPhone: string;
  
  // 经营范围
  businessScope: string;
  
  // 申请类型
  applicationType: ApplicationType | "";
  settlementType: SettlementType | "";
  
  // 其他
  remarks: string;
}

const initialFormData: ApplicationFormData = {
  enterpriseName: "",
  enterpriseNameBackups: [],
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

interface ApplicationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: ApplicationFormData | null;
  onSuccess: () => void;
}

export function ApplicationFormDialog({
  open,
  onOpenChange,
  application,
  onSuccess,
}: ApplicationFormDialogProps) {
  const [formData, setFormData] = useState<ApplicationFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 编辑时加载数据
  useEffect(() => {
    if (application) {
      setFormData({
        ...initialFormData,
        ...application,
        shareholders: application.shareholders || [{ name: "", investment: "", phone: "" }],
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [application, open]);

  // 更新字段
  const updateField = (field: keyof ApplicationFormData, value: string | string[] | Shareholder[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 清除错误
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 添加股东
  const addShareholder = () => {
    setFormData((prev) => ({
      ...prev,
      shareholders: [...prev.shareholders, { name: "", investment: "", phone: "" }],
    }));
  };

  // 删除股东
  const removeShareholder = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      shareholders: prev.shareholders.filter((_, i) => i !== index),
    }));
  };

  // 更新股东信息
  const updateShareholder = (index: number, field: keyof Shareholder, value: string) => {
    setFormData((prev) => {
      const newShareholders = [...prev.shareholders];
      newShareholders[index] = { ...newShareholders[index], [field]: value };
      return { ...prev, shareholders: newShareholders };
    });
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.enterpriseName) {
      newErrors.enterpriseName = "请输入企业名称";
    }
    if (!formData.applicationType) {
      newErrors.applicationType = "请选择申请类型";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const url = application
        ? `/api/settlement/applications/${application.id}`
        : "/api/settlement/applications";
      const method = application ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        onSuccess();
      } else {
        alert(result.error || "保存失败");
      }
    } catch (err) {
      console.error("保存申请失败:", err);
      alert("保存申请失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl">
            {application ? "编辑入驻申请" : "填写入园审批表"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 h-[calc(90vh-180px)]">
          <div className="p-6 pt-2">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">基本信息</TabsTrigger>
                <TabsTrigger value="address">地址信息</TabsTrigger>
                <TabsTrigger value="personnel">人员信息</TabsTrigger>
                <TabsTrigger value="shareholder">股东信息</TabsTrigger>
                <TabsTrigger value="business">经营信息</TabsTrigger>
              </TabsList>

              {/* 基本信息 */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="enterpriseName">
                      申请名称 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="enterpriseName"
                      value={formData.enterpriseName}
                      onChange={(e) => updateField("enterpriseName", e.target.value)}
                      placeholder="请输入企业名称"
                    />
                    {errors.enterpriseName && (
                      <p className="text-xs text-destructive">{errors.enterpriseName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      备用名
                      <span className="text-xs text-muted-foreground font-normal">(可选)</span>
                    </Label>
                    <div className="space-y-2">
                      {formData.enterpriseNameBackups && formData.enterpriseNameBackups.length > 0 ? (
                        <>
                          {formData.enterpriseNameBackups.map((backup, index) => (
                            <div key={index} className="flex items-center gap-2 group">
                              <span className="text-xs text-muted-foreground w-6 shrink-0">{index + 1}.</span>
                              <Input
                                value={backup}
                                onChange={(e) => {
                                  const newBackups = [...formData.enterpriseNameBackups];
                                  newBackups[index] = e.target.value;
                                  updateField("enterpriseNameBackups", newBackups);
                                }}
                                placeholder={`请输入备用名 ${index + 1}`}
                                className="flex-1 h-8"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  const newBackups = formData.enterpriseNameBackups.filter((_, i) => i !== index);
                                  updateField("enterpriseNameBackups", newBackups);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full h-8 border-dashed text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              const backups = [...(formData.enterpriseNameBackups || []), ""];
                              updateField("enterpriseNameBackups", backups);
                            }}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            继续添加
                          </Button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="w-full h-9 rounded-md border border-dashed border-muted-foreground/30 bg-transparent hover:border-primary/50 hover:bg-muted/50 transition-colors flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            const backups = [...(formData.enterpriseNameBackups || []), ""];
                            updateField("enterpriseNameBackups", backups);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          添加备用名
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="registeredCapital">注册资金（万元）</Label>
                    <Input
                      id="registeredCapital"
                      type="number"
                      value={formData.registeredCapital}
                      onChange={(e) => updateField("registeredCapital", e.target.value)}
                      placeholder="2000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currencyType">币种</Label>
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
                    <Label htmlFor="taxType">缴税类型</Label>
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
                    <Label htmlFor="applicationType">
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
                    <Label htmlFor="settlementType">入驻类型</Label>
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
                    <Label htmlFor="expectedAnnualRevenue">预计主营收入（年/万元）</Label>
                    <Input
                      id="expectedAnnualRevenue"
                      type="number"
                      value={formData.expectedAnnualRevenue}
                      onChange={(e) => updateField("expectedAnnualRevenue", e.target.value)}
                      placeholder="2000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expectedAnnualTax">预计全口径税收（年/万元）</Label>
                    <Input
                      id="expectedAnnualTax"
                      type="number"
                      value={formData.expectedAnnualTax}
                      onChange={(e) => updateField("expectedAnnualTax", e.target.value)}
                      placeholder="200"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* 地址信息 */}
              <TabsContent value="address" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="originalRegisteredAddress">原注册地址（迁移企业填写）</Label>
                  <Input
                    id="originalRegisteredAddress"
                    value={formData.originalRegisteredAddress}
                    onChange={(e) => updateField("originalRegisteredAddress", e.target.value)}
                    placeholder="请输入原注册地址"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mailingAddress">邮寄地址</Label>
                  <Input
                    id="mailingAddress"
                    value={formData.mailingAddress}
                    onChange={(e) => updateField("mailingAddress", e.target.value)}
                    placeholder="请输入邮寄地址"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">实际经营地址</Label>
                  <Input
                    id="businessAddress"
                    value={formData.businessAddress}
                    onChange={(e) => updateField("businessAddress", e.target.value)}
                    placeholder="请输入实际经营地址"
                  />
                </div>
              </TabsContent>

              {/* 人员信息 */}
              <TabsContent value="personnel" className="space-y-4 mt-4">
                {/* 法人信息 */}
                <div className="rounded-lg border p-4 space-y-4">
                  <h3 className="font-medium">法人信息</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="legalPersonName">法人姓名</Label>
                      <Input
                        id="legalPersonName"
                        value={formData.legalPersonName}
                        onChange={(e) => updateField("legalPersonName", e.target.value)}
                        placeholder="请输入法人姓名"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="legalPersonPhone">法人电话</Label>
                      <Input
                        id="legalPersonPhone"
                        value={formData.legalPersonPhone}
                        onChange={(e) => updateField("legalPersonPhone", e.target.value)}
                        placeholder="请输入法人电话"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="legalPersonEmail">法人邮箱</Label>
                      <Input
                        id="legalPersonEmail"
                        type="email"
                        value={formData.legalPersonEmail}
                        onChange={(e) => updateField("legalPersonEmail", e.target.value)}
                        placeholder="请输入法人邮箱"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="legalPersonAddress">法人住址</Label>
                      <Input
                        id="legalPersonAddress"
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
                      <Label htmlFor="supervisorName">监事姓名</Label>
                      <Input
                        id="supervisorName"
                        value={formData.supervisorName}
                        onChange={(e) => updateField("supervisorName", e.target.value)}
                        placeholder="请输入监事姓名"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supervisorPhone">监事电话</Label>
                      <Input
                        id="supervisorPhone"
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
                      <Label htmlFor="financeManagerName">财务负责人姓名</Label>
                      <Input
                        id="financeManagerName"
                        value={formData.financeManagerName}
                        onChange={(e) => updateField("financeManagerName", e.target.value)}
                        placeholder="请输入财务负责人姓名"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="financeManagerPhone">财务负责人电话</Label>
                      <Input
                        id="financeManagerPhone"
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
                      <Label htmlFor="contactPersonName">实际联络人姓名</Label>
                      <Input
                        id="contactPersonName"
                        value={formData.contactPersonName}
                        onChange={(e) => updateField("contactPersonName", e.target.value)}
                        placeholder="请输入实际联络人姓名"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPersonPhone">实际联络人电话</Label>
                      <Input
                        id="contactPersonPhone"
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
                      <Label htmlFor="ewtContactName">联系人姓名</Label>
                      <Input
                        id="ewtContactName"
                        value={formData.ewtContactName}
                        onChange={(e) => updateField("ewtContactName", e.target.value)}
                        placeholder="请输入联系人姓名"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ewtContactPhone">联系人电话</Label>
                      <Input
                        id="ewtContactPhone"
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
                      <Label htmlFor="intermediaryDepartment">所在部门</Label>
                      <Input
                        id="intermediaryDepartment"
                        value={formData.intermediaryDepartment}
                        onChange={(e) => updateField("intermediaryDepartment", e.target.value)}
                        placeholder="请输入所在部门"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="intermediaryName">姓名</Label>
                      <Input
                        id="intermediaryName"
                        value={formData.intermediaryName}
                        onChange={(e) => updateField("intermediaryName", e.target.value)}
                        placeholder="请输入姓名"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="intermediaryPhone">电话</Label>
                      <Input
                        id="intermediaryPhone"
                        value={formData.intermediaryPhone}
                        onChange={(e) => updateField("intermediaryPhone", e.target.value)}
                        placeholder="请输入电话"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* 股东信息 */}
              <TabsContent value="shareholder" className="space-y-4 mt-4">
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
              <TabsContent value="business" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="businessScope">经营范围</Label>
                  <Textarea
                    id="businessScope"
                    value={formData.businessScope}
                    onChange={(e) => updateField("businessScope", e.target.value)}
                    placeholder="请输入经营范围"
                    rows={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">备注</Label>
                  <Textarea
                    id="remarks"
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

        <DialogFooter className="p-6 pt-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
