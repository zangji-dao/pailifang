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
  FileImage,
  X,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

// 类型定义
type ApprovalStatus = "draft" | "pending" | "approved" | "rejected";
type ApplicationType = "new" | "migration";
type TaxType = "general" | "small_scale";

// 股东类型
type ShareholderType = "natural" | "enterprise";

interface Shareholder {
  type: ShareholderType; // natural=自然人股东, enterprise=企业股东
  name: string;
  investment: string;
  phone: string;
  // 自然人股东 - 身份证
  idCardFrontKey?: string;
  idCardFrontUrl?: string;
  idCardBackKey?: string;
  idCardBackUrl?: string;
  // 企业股东 - 营业执照
  licenseKey?: string; // 营业执照存储key
  licenseUrl?: string; // 营业执照预览URL
}

interface Personnel {
  name: string;
  phone: string;
  email: string;
  address: string;
  roles: string[];
  idCardFrontKey: string;
  idCardFrontUrl: string;
  idCardBackKey: string;
  idCardBackUrl: string;
}

interface ApplicationFormData {
  applicationNo: string;
  applicationDate: string;
  approvalStatus: ApprovalStatus;
  enterpriseName: string;
  enterpriseNameBackups: string[]; // 备用名列表（可多个）
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
};

export default function EditApplicationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState<ApplicationFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});

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
              { name: "", phone: "", email: "", address: "", roles: ["legal_person", "finance_manager"] },
              { name: "", phone: "", email: "", address: "", roles: ["supervisor"] },
            ],
            shareholders: result.data.shareholders || [{ 
              type: "natural", 
              name: "", 
              investment: "", 
              phone: "",
              idCardFrontKey: "",
              idCardFrontUrl: "",
              idCardBackKey: "",
              idCardBackUrl: "",
              licenseKey: "",
              licenseUrl: "",
            }],
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
      personnel: [...prev.personnel, { 
        name: "", 
        phone: "", 
        email: "", 
        address: "", 
        roles: [],
        idCardFrontKey: "",
        idCardFrontUrl: "",
        idCardBackKey: "",
        idCardBackUrl: "",
      }],
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

  // 文件上传
  const uploadFile = async (file: File, type: 'front' | 'back', personnelIndex: number): Promise<void> => {
    const uploadKey = `${personnelIndex}-${type}`;
    setUploadingFiles((prev) => ({ ...prev, [uploadKey]: true }));

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', 'id_card');

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const result = await response.json();

      if (result.success) {
        setFormData((prev) => {
          if (!prev) return null;
          const newPersonnel = [...prev.personnel];
          if (type === 'front') {
            newPersonnel[personnelIndex] = {
              ...newPersonnel[personnelIndex],
              idCardFrontKey: result.data.key,
              idCardFrontUrl: result.data.url,
            };
          } else {
            newPersonnel[personnelIndex] = {
              ...newPersonnel[personnelIndex],
              idCardBackKey: result.data.key,
              idCardBackUrl: result.data.url,
            };
          }
          return { ...prev, personnel: newPersonnel };
        });
      } else {
        alert(result.error || '上传失败');
      }
    } catch (err) {
      console.error('上传失败:', err);
      alert('上传失败');
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back', personnelIndex: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        alert('请上传 JPG 或 PNG 格式的图片');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('文件大小不能超过 5MB');
        return;
      }
      uploadFile(file, type, personnelIndex);
    }
  };

  const removeIdCard = (type: 'front' | 'back', personnelIndex: number) => {
    setFormData((prev) => {
      if (!prev) return null;
      const newPersonnel = [...prev.personnel];
      if (type === 'front') {
        newPersonnel[personnelIndex] = {
          ...newPersonnel[personnelIndex],
          idCardFrontKey: '',
          idCardFrontUrl: '',
        };
      } else {
        newPersonnel[personnelIndex] = {
          ...newPersonnel[personnelIndex],
          idCardBackKey: '',
          idCardBackUrl: '',
        };
      }
      return { ...prev, personnel: newPersonnel };
    });
  };

  // 股东操作
  const addShareholder = () => {
    setFormData((prev) => prev ? {
      ...prev,
      shareholders: [...prev.shareholders, { 
        type: "natural" as ShareholderType, 
        name: "", 
        investment: "", 
        phone: "",
        idCardFrontKey: "",
        idCardFrontUrl: "",
        idCardBackKey: "",
        idCardBackUrl: "",
        licenseKey: "",
        licenseUrl: "",
      }],
    } : null);
  };

  const removeShareholder = (index: number) => {
    setFormData((prev) => prev ? {
      ...prev,
      shareholders: prev.shareholders.filter((_, i) => i !== index),
    } : null);
  };

  const updateShareholder = (index: number, field: keyof Shareholder, value: string | ShareholderType) => {
    setFormData((prev) => {
      if (!prev) return null;
      const newShareholders = [...prev.shareholders];
      newShareholders[index] = { ...newShareholders[index], [field]: value };
      return { ...prev, shareholders: newShareholders };
    });
  };

  // 股东文件上传状态
  const [uploadingShareholderFiles, setUploadingShareholderFiles] = useState<Record<string, boolean>>({});

  // 上传股东证件文件
  const uploadShareholderFile = async (
    file: File, 
    fileType: 'idCardFront' | 'idCardBack' | 'license', 
    shareholderIndex: number
  ): Promise<void> => {
    const uploadKey = `shareholder-${shareholderIndex}-${fileType}`;
    setUploadingShareholderFiles((prev) => ({ ...prev, [uploadKey]: true }));

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', fileType === 'license' ? 'license' : 'id_card');

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const result = await response.json();

      if (result.success) {
        setFormData((prev) => {
          if (!prev) return null;
          const newShareholders = [...prev.shareholders];
          if (fileType === 'idCardFront') {
            newShareholders[shareholderIndex] = {
              ...newShareholders[shareholderIndex],
              idCardFrontKey: result.data.key,
              idCardFrontUrl: result.data.url,
            };
          } else if (fileType === 'idCardBack') {
            newShareholders[shareholderIndex] = {
              ...newShareholders[shareholderIndex],
              idCardBackKey: result.data.key,
              idCardBackUrl: result.data.url,
            };
          } else if (fileType === 'license') {
            newShareholders[shareholderIndex] = {
              ...newShareholders[shareholderIndex],
              licenseKey: result.data.key,
              licenseUrl: result.data.url,
            };
          }
          return { ...prev, shareholders: newShareholders };
        });
      } else {
        alert(result.error || '上传失败');
      }
    } catch (err) {
      console.error('上传失败:', err);
      alert('上传失败');
    } finally {
      setUploadingShareholderFiles((prev) => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleShareholderFileChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    fileType: 'idCardFront' | 'idCardBack' | 'license', 
    shareholderIndex: number
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        alert('请上传 JPG 或 PNG 格式的图片');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('文件大小不能超过 5MB');
        return;
      }
      uploadShareholderFile(file, fileType, shareholderIndex);
    }
  };

  const removeShareholderFile = (
    fileType: 'idCardFront' | 'idCardBack' | 'license', 
    shareholderIndex: number
  ) => {
    setFormData((prev) => {
      if (!prev) return null;
      const newShareholders = [...prev.shareholders];
      if (fileType === 'idCardFront') {
        newShareholders[shareholderIndex] = {
          ...newShareholders[shareholderIndex],
          idCardFrontKey: '',
          idCardFrontUrl: '',
        };
      } else if (fileType === 'idCardBack') {
        newShareholders[shareholderIndex] = {
          ...newShareholders[shareholderIndex],
          idCardBackKey: '',
          idCardBackUrl: '',
        };
      } else if (fileType === 'license') {
        newShareholders[shareholderIndex] = {
          ...newShareholders[shareholderIndex],
          licenseKey: '',
          licenseUrl: '',
        };
      }
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
    if (!formData?.registeredCapital) newErrors.registeredCapital = "请输入注册资金";
    if (!formData?.currencyType) newErrors.currencyType = "请选择币种";
    if (!formData?.taxType) newErrors.taxType = "请选择缴税类型";
    if (!formData?.applicationType) newErrors.applicationType = "请选择申请类型";
    if (!formData?.expectedAnnualRevenue) newErrors.expectedAnnualRevenue = "请输入预计主营收入";
    if (!formData?.expectedAnnualTax) newErrors.expectedAnnualTax = "请输入预计全口径税收";

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
            <TabsContent value="basic" className="space-y-6">
              {/* 企业名称 */}
              <div className="rounded-lg border bg-card p-5">
                <h3 className="text-base font-medium mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">1</span>
                  企业名称
                </h3>
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
                                disabled={!canEdit}
                              />
                              {canEdit && (
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
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          ))}
                          {canEdit && (
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
                          )}
                        </>
                      ) : (
                        canEdit ? (
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
                        ) : (
                          <p className="text-sm text-muted-foreground">暂无备用名</p>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 注册信息 */}
              <div className="rounded-lg border bg-card p-5">
                <h3 className="text-base font-medium mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">2</span>
                  注册信息
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>
                      注册资金 <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formData.registeredCapital}
                        onChange={(e) => updateField("registeredCapital", e.target.value)}
                        placeholder="2000"
                        className="pr-12"
                        disabled={!canEdit}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">万元</span>
                    </div>
                    {errors.registeredCapital && (
                      <p className="text-xs text-destructive">{errors.registeredCapital}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      币种 <span className="text-destructive">*</span>
                    </Label>
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
                    {errors.currencyType && (
                      <p className="text-xs text-destructive">{errors.currencyType}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      缴税类型 <span className="text-destructive">*</span>
                    </Label>
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
                    {errors.taxType && (
                      <p className="text-xs text-destructive">{errors.taxType}</p>
                    )}
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
                </div>
              </div>

              {/* 预计经营数据 */}
              <div className="rounded-lg border bg-card p-5">
                <h3 className="text-base font-medium mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">3</span>
                  预计经营数据
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>
                      预计主营收入 <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formData.expectedAnnualRevenue}
                        onChange={(e) => updateField("expectedAnnualRevenue", e.target.value)}
                        placeholder="2000"
                        className="pr-16"
                        disabled={!canEdit}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">万元/年</span>
                    </div>
                    {errors.expectedAnnualRevenue && (
                      <p className="text-xs text-destructive">{errors.expectedAnnualRevenue}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      预计全口径税收 <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formData.expectedAnnualTax}
                        onChange={(e) => updateField("expectedAnnualTax", e.target.value)}
                        placeholder="200"
                        className="pr-16"
                        disabled={!canEdit}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">万元/年</span>
                    </div>
                    {errors.expectedAnnualTax && (
                      <p className="text-xs text-destructive">{errors.expectedAnnualTax}</p>
                    )}
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

                  {/* 身份证上传 */}
                  <div className="space-y-2">
                    <Label>身份证照片</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {/* 正面 */}
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">正面（人像面）</p>
                        {person.idCardFrontUrl ? (
                          <div className="relative group">
                            <img
                              src={person.idCardFrontUrl}
                              alt="身份证正面"
                              className="w-full h-24 object-cover rounded border"
                            />
                            {canEdit && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeIdCard('front', index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <label
                            className={cn(
                              "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded cursor-pointer hover:border-primary",
                              uploadingFiles[`${index}-front`] && "opacity-50 cursor-wait",
                              !canEdit && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {uploadingFiles[`${index}-front`] ? (
                              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                            ) : (
                              <>
                                <Upload className="h-6 w-6 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground mt-1">上传正面</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/jpg"
                              className="hidden"
                              onChange={(e) => handleFileChange(e, 'front', index)}
                              disabled={!canEdit || uploadingFiles[`${index}-front`]}
                            />
                          </label>
                        )}
                      </div>

                      {/* 反面 */}
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">反面（国徽面）</p>
                        {person.idCardBackUrl ? (
                          <div className="relative group">
                            <img
                              src={person.idCardBackUrl}
                              alt="身份证反面"
                              className="w-full h-24 object-cover rounded border"
                            />
                            {canEdit && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeIdCard('back', index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <label
                            className={cn(
                              "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded cursor-pointer hover:border-primary",
                              uploadingFiles[`${index}-back`] && "opacity-50 cursor-wait",
                              !canEdit && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {uploadingFiles[`${index}-back`] ? (
                              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                            ) : (
                              <>
                                <Upload className="h-6 w-6 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground mt-1">上传反面</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/jpg"
                              className="hidden"
                              onChange={(e) => handleFileChange(e, 'back', index)}
                              disabled={!canEdit || uploadingFiles[`${index}-back`]}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">支持JPG、PNG格式，单张不超过5MB</p>
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
                <div>
                  <h3 className="font-medium">股东信息</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    自然人股东需上传身份证，企业股东需上传营业执照
                  </p>
                </div>
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

                  {/* 股东类型选择 */}
                  <div className="space-y-2">
                    <Label>股东类型</Label>
                    <Select
                      value={shareholder.type || "natural"}
                      onValueChange={(value: ShareholderType) => updateShareholder(index, "type", value)}
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="请选择股东类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="natural">自然人股东</SelectItem>
                        <SelectItem value="enterprise">企业股东</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 基本信息 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{shareholder.type === "enterprise" ? "企业名称" : "股东姓名"}</Label>
                      <Input
                        value={shareholder.name}
                        onChange={(e) => updateShareholder(index, "name", e.target.value)}
                        placeholder={shareholder.type === "enterprise" ? "请输入企业名称" : "请输入股东姓名"}
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
                      <Label>{shareholder.type === "enterprise" ? "联系人电话" : "联系电话"}</Label>
                      <Input
                        value={shareholder.phone}
                        onChange={(e) => updateShareholder(index, "phone", e.target.value)}
                        placeholder="请输入联系电话"
                        disabled={!canEdit}
                      />
                    </div>
                  </div>

                  {/* 自然人股东 - 身份证上传 */}
                  {(shareholder.type === "natural" || !shareholder.type) && (
                    <div className="space-y-2">
                      <Label>身份证照片</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {/* 正面 */}
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">正面（人像面）</p>
                          {shareholder.idCardFrontUrl ? (
                            <div className="relative group">
                              <img
                                src={shareholder.idCardFrontUrl}
                                alt="身份证正面"
                                className="w-full h-24 object-cover rounded border"
                              />
                              {canEdit && (
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => removeShareholderFile('idCardFront', index)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ) : (
                            <label className={cn(
                              "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded cursor-pointer hover:border-primary",
                              uploadingShareholderFiles[`shareholder-${index}-idCardFront`] && "opacity-50 cursor-wait",
                              !canEdit && "opacity-50 cursor-not-allowed"
                            )}>
                              {uploadingShareholderFiles[`shareholder-${index}-idCardFront`] ? (
                                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                              ) : (
                                <>
                                  <Upload className="h-6 w-6 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground mt-1">上传正面</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/jpg"
                                className="hidden"
                                onChange={(e) => handleShareholderFileChange(e, 'idCardFront', index)}
                                disabled={!canEdit || uploadingShareholderFiles[`shareholder-${index}-idCardFront`]}
                              />
                            </label>
                          )}
                        </div>

                        {/* 反面 */}
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">反面（国徽面）</p>
                          {shareholder.idCardBackUrl ? (
                            <div className="relative group">
                              <img
                                src={shareholder.idCardBackUrl}
                                alt="身份证反面"
                                className="w-full h-24 object-cover rounded border"
                              />
                              {canEdit && (
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => removeShareholderFile('idCardBack', index)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ) : (
                            <label className={cn(
                              "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded cursor-pointer hover:border-primary",
                              uploadingShareholderFiles[`shareholder-${index}-idCardBack`] && "opacity-50 cursor-wait",
                              !canEdit && "opacity-50 cursor-not-allowed"
                            )}>
                              {uploadingShareholderFiles[`shareholder-${index}-idCardBack`] ? (
                                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                              ) : (
                                <>
                                  <Upload className="h-6 w-6 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground mt-1">上传反面</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/jpg"
                                className="hidden"
                                onChange={(e) => handleShareholderFileChange(e, 'idCardBack', index)}
                                disabled={!canEdit || uploadingShareholderFiles[`shareholder-${index}-idCardBack`]}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">支持JPG、PNG格式，单张不超过5MB</p>
                    </div>
                  )}

                  {/* 企业股东 - 营业执照上传 */}
                  {shareholder.type === "enterprise" && (
                    <div className="space-y-2">
                      <Label>营业执照</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">营业执照正本/副本</p>
                          {shareholder.licenseUrl ? (
                            <div className="relative group">
                              <img
                                src={shareholder.licenseUrl}
                                alt="营业执照"
                                className="w-full h-24 object-cover rounded border"
                              />
                              {canEdit && (
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => removeShareholderFile('license', index)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ) : (
                            <label className={cn(
                              "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded cursor-pointer hover:border-primary",
                              uploadingShareholderFiles[`shareholder-${index}-license`] && "opacity-50 cursor-wait",
                              !canEdit && "opacity-50 cursor-not-allowed"
                            )}>
                              {uploadingShareholderFiles[`shareholder-${index}-license`] ? (
                                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                              ) : (
                                <>
                                  <Upload className="h-6 w-6 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground mt-1">上传营业执照</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/jpg"
                                className="hidden"
                                onChange={(e) => handleShareholderFileChange(e, 'license', index)}
                                disabled={!canEdit || uploadingShareholderFiles[`shareholder-${index}-license`]}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">支持JPG、PNG格式，不超过5MB</p>
                    </div>
                  )}
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
  enterpriseNameBackups: [],
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
    { 
      name: "", 
      phone: "", 
      email: "", 
      address: "", 
      roles: ["legal_person", "finance_manager"],
      idCardFrontKey: "",
      idCardFrontUrl: "",
      idCardBackKey: "",
      idCardBackUrl: "",
    },
    { 
      name: "", 
      phone: "", 
      email: "", 
      address: "", 
      roles: ["supervisor"],
      idCardFrontKey: "",
      idCardFrontUrl: "",
      idCardBackKey: "",
      idCardBackUrl: "",
    },
  ],
  shareholders: [{ 
    type: "natural", 
    name: "", 
    investment: "", 
    phone: "",
    idCardFrontKey: "",
    idCardFrontUrl: "",
    idCardBackKey: "",
    idCardBackUrl: "",
    licenseKey: "",
    licenseUrl: "",
  }],
  ewtContactName: "",
  ewtContactPhone: "",
  intermediaryDepartment: "",
  intermediaryName: "",
  intermediaryPhone: "",
  businessScope: "",
  applicationType: "",
  remarks: "",
};
