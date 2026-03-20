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
  Crop,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ImageCropper } from "@/components/image-cropper";

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
  licenseOriginalKey?: string; // 营业执照正本存储key
  licenseOriginalUrl?: string; // 营业执照正本预览URL
  licenseCopyKey?: string; // 营业执照副本存储key
  licenseCopyUrl?: string; // 营业执照副本预览URL
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
  ewt_contact: { label: "e窗通登录联系人", description: "负责登录e窗通办理业务" },
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
  
  // 裁剪对话框状态
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string>("");
  const [cropperTarget, setCropperTarget] = useState<{
    type: 'front' | 'back';
    personnelIndex: number;
  } | null>(null);

  // 步骤配置
  const steps = [
    { value: "basic", label: "基本信息", description: "企业名称、注册信息等" },
    { value: "address", label: "地址信息", description: "注册地址、邮寄地址等" },
    { value: "personnel", label: "人员信息", description: "法人、监事、财务等" },
    { value: "shareholder", label: "股东信息", description: "股东及出资情况" },
    { value: "business", label: "经营信息", description: "经营范围、中介等" },
  ] as const;

  const [currentStep, setCurrentStep] = useState(0);

  // 验证基本信息
  const validateBasicStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData?.enterpriseName?.trim()) {
      newErrors.enterpriseName = "请输入企业名称";
    }
    if (!formData?.registeredCapital?.trim()) {
      newErrors.registeredCapital = "请输入注册资金";
    }
    if (!formData?.taxType) {
      newErrors.taxType = "请选择缴税类型";
    }
    if (!formData?.expectedAnnualRevenue?.trim()) {
      newErrors.expectedAnnualRevenue = "请输入预计主营收入";
    }
    if (!formData?.expectedAnnualTax?.trim()) {
      newErrors.expectedAnnualTax = "请输入预计全口径税收";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 验证地址信息
  const validateAddressStep = (): boolean => {
    // 地址信息都是可选的，直接返回 true
    return true;
  };

  // 验证人员信息
  const validatePersonnelStep = (): boolean => {
    if (!formData?.personnel || formData.personnel.length < 2) {
      setErrors({ personnel: "至少需要2名人员（法人代表和监事）" });
      return false;
    }
    
    // 检查所有必填职务是否都有人担任
    const requiredRoles = [
      { key: "legal_person", label: "法人代表" },
      { key: "supervisor", label: "监事" },
      { key: "finance_manager", label: "财务负责人" },
      { key: "ewt_contact", label: "e窗通登录联系人" },
    ];
    
    for (const role of requiredRoles) {
      const hasRole = formData.personnel.some(p => p.roles.includes(role.key));
      if (!hasRole) {
        setErrors({ personnel: `请指定${role.label}` });
        return false;
      }
    }
    
    // 检查法人代表和监事是否是同一人
    const legalPersonIndex = formData.personnel.findIndex(p => p.roles.includes("legal_person"));
    const supervisorIndex = formData.personnel.findIndex(p => p.roles.includes("supervisor"));
    
    if (legalPersonIndex === supervisorIndex) {
      setErrors({ personnel: "法人代表和监事不能是同一人" });
      return false;
    }
    
    // 检查监事和财务负责人是否是同一人
    const financeIndex = formData.personnel.findIndex(p => p.roles.includes("finance_manager"));
    if (supervisorIndex === financeIndex) {
      setErrors({ personnel: "监事和财务负责人不能是同一人" });
      return false;
    }
    
    setErrors({});
    return true;
  };

  // 验证股东信息
  const validateShareholderStep = (): boolean => {
    if (!formData?.shareholders || formData.shareholders.length === 0) {
      return true; // 股东信息可选
    }
    
    // 检查股东信息是否完整
    for (let i = 0; i < formData.shareholders.length; i++) {
      const shareholder = formData.shareholders[i];
      if (!shareholder.name?.trim()) {
        return true; // 未填写完整也可以继续
      }
    }
    
    return true;
  };

  // 切换到下一步
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      // 验证当前步骤
      let isValid = true;
      switch (currentStep) {
        case 0:
          isValid = validateBasicStep();
          break;
        case 1:
          isValid = validateAddressStep();
          break;
        case 2:
          isValid = validatePersonnelStep();
          break;
        case 3:
          isValid = validateShareholderStep();
          break;
      }
      
      if (isValid) {
        setCurrentStep(currentStep + 1);
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // 切换到上一步
  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
  const updateField = (field: keyof ApplicationFormData, value: string | string[] | Shareholder[] | Personnel[]) => {
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

  const updatePersonnel = (index: number, field: keyof Personnel, value: string | string[]) => {
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
        // 检查该职务是否已被其他人担任
        const isRoleTaken = prev.personnel.some((p, i) => i !== index && p.roles.includes(role));
        if (!isRoleTaken) {
          newPersonnel[index] = { ...newPersonnel[index], roles: [...roles, role] };
        }
      }
      return { ...prev, personnel: newPersonnel };
    });
  };

  // 检查某个职务是否已被其他人担任
  const isRoleTakenByOthers = (currentIndex: number, role: string): boolean => {
    if (!formData) return false;
    return formData.personnel.some((p, i) => i !== currentIndex && p.roles.includes(role));
  };

  // 获取某个职务的担任者索引
  const getRoleHolderIndex = (role: string): number => {
    if (!formData) return -1;
    return formData.personnel.findIndex((p) => p.roles.includes(role));
  };

  // 文件上传和裁剪
  const uploadFile = async (file: File | Blob, type: 'front' | 'back', personnelIndex: number): Promise<void> => {
    const uploadKey = `${personnelIndex}-${type}`;
    setUploadingFiles((prev) => ({ ...prev, [uploadKey]: true }));

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file, 'cropped-image.jpg');
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
      
      // 打开裁剪对话框
      const reader = new FileReader();
      reader.onload = (event) => {
        setCropperImageSrc(event.target?.result as string);
        setCropperTarget({ type, personnelIndex });
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
    // 清空 input 以便重复选择同一文件
    e.target.value = '';
  };
  
  // 裁剪完成后的处理
  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!cropperTarget) return;
    
    setCropperOpen(false);
    await uploadFile(croppedBlob, cropperTarget.type, cropperTarget.personnelIndex);
    setCropperTarget(null);
    setCropperImageSrc("");
  };
  
  // 取消裁剪
  const handleCropCancel = () => {
    setCropperOpen(false);
    setCropperTarget(null);
    setCropperImageSrc("");
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
  
  // 股东文件裁剪状态
  const [shareholderCropperOpen, setShareholderCropperOpen] = useState(false);
  const [shareholderCropperImageSrc, setShareholderCropperImageSrc] = useState<string>("");
  const [shareholderCropperTarget, setShareholderCropperTarget] = useState<{
    fileType: 'idCardFront' | 'idCardBack' | 'licenseOriginal' | 'licenseCopy';
    shareholderIndex: number;
  } | null>(null);

  // 上传股东证件文件
  const uploadShareholderFile = async (
    file: File | Blob, 
    fileType: 'idCardFront' | 'idCardBack' | 'licenseOriginal' | 'licenseCopy', 
    shareholderIndex: number
  ): Promise<void> => {
    const uploadKey = `shareholder-${shareholderIndex}-${fileType}`;
    setUploadingShareholderFiles((prev) => ({ ...prev, [uploadKey]: true }));

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file, 'cropped-image.jpg');
      formDataUpload.append('type', fileType.startsWith('license') ? 'license' : 'id_card');

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
          } else if (fileType === 'licenseOriginal') {
            newShareholders[shareholderIndex] = {
              ...newShareholders[shareholderIndex],
              licenseOriginalKey: result.data.key,
              licenseOriginalUrl: result.data.url,
            };
          } else if (fileType === 'licenseCopy') {
            newShareholders[shareholderIndex] = {
              ...newShareholders[shareholderIndex],
              licenseCopyKey: result.data.key,
              licenseCopyUrl: result.data.url,
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
    fileType: 'idCardFront' | 'idCardBack' | 'licenseOriginal' | 'licenseCopy', 
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
      
      // 打开裁剪对话框
      const reader = new FileReader();
      reader.onload = (event) => {
        setShareholderCropperImageSrc(event.target?.result as string);
        setShareholderCropperTarget({ fileType, shareholderIndex });
        setShareholderCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };
  
  // 股东文件裁剪完成
  const handleShareholderCropComplete = async (croppedBlob: Blob) => {
    if (!shareholderCropperTarget) return;
    
    setShareholderCropperOpen(false);
    await uploadShareholderFile(croppedBlob, shareholderCropperTarget.fileType, shareholderCropperTarget.shareholderIndex);
    setShareholderCropperTarget(null);
    setShareholderCropperImageSrc("");
  };
  
  const handleShareholderCropCancel = () => {
    setShareholderCropperOpen(false);
    setShareholderCropperTarget(null);
    setShareholderCropperImageSrc("");
  };

  const removeShareholderFile = (
    fileType: 'idCardFront' | 'idCardBack' | 'licenseOriginal' | 'licenseCopy', 
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
      } else if (fileType === 'licenseOriginal') {
        newShareholders[shareholderIndex] = {
          ...newShareholders[shareholderIndex],
          licenseOriginalKey: '',
          licenseOriginalUrl: '',
        };
      } else if (fileType === 'licenseCopy') {
        newShareholders[shareholderIndex] = {
          ...newShareholders[shareholderIndex],
          licenseCopyKey: '',
          licenseCopyUrl: '',
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
          {/* 步骤进度指示器 */}
          {/* 步骤进度指示器 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {steps.map((step, index) => (
                <div key={step.value} className="flex items-center flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      // 只能点击已完成的步骤或当前步骤
                      if (index <= currentStep) {
                        setCurrentStep(index);
                      }
                    }}
                    disabled={index > currentStep}
                    className={cn(
                      "flex items-center gap-2 group",
                      index > currentStep && "cursor-not-allowed opacity-60"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                        index < currentStep
                          ? "bg-primary text-primary-foreground"
                          : index === currentStep
                          ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {index < currentStep ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className={cn(
                      "text-sm font-medium hidden sm:block",
                      index === currentStep ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-2 transition-colors",
                      index < currentStep ? "bg-primary" : "bg-muted"
                    )} />
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              当前步骤：{steps[currentStep].label} - {steps[currentStep].description}
            </p>
          </div>

          {/* 基本信息 */}
          {currentStep === 0 && (
          <div className="space-y-6">
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

              {/* 步骤导航 */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="w-24"></div>
                <div className="text-sm text-muted-foreground">
                  第 1 步，共 5 步
                </div>
                <Button type="button" onClick={goToNextStep}>
                  下一步：地址信息
                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
          </div>
          )}

          {/* 地址信息 */}
          {currentStep === 1 && (
          <div className="space-y-6">
              {/* 迁移企业：迁移前地址 */}
              {formData.applicationType === "migration" && (
              <div className="rounded-lg border bg-card p-5">
                <h3 className="text-base font-medium mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">1</span>
                  迁移前地址
                  <Badge variant="outline" className="ml-2 text-xs font-normal bg-amber-50 text-amber-700 border-amber-200">迁移企业必填</Badge>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>原注册地址 <span className="text-destructive">*</span></Label>
                    <Textarea
                      value={formData.originalRegisteredAddress}
                      onChange={(e) => updateField("originalRegisteredAddress", e.target.value)}
                      placeholder="请输入原工商注册地址，如：&#10;北京市朝阳区某某街道某某号"
                      rows={3}
                      className="resize-none"
                      disabled={!canEdit}
                    />
                    <p className="text-xs text-muted-foreground">迁移前的工商注册地址</p>
                  </div>
                  <div className="space-y-2">
                    <Label>原实际经营地址</Label>
                    <Textarea
                      value={formData.businessAddress}
                      onChange={(e) => updateField("businessAddress", e.target.value)}
                      placeholder="请输入迁移前的实际经营地址"
                      rows={3}
                      className="resize-none"
                      disabled={!canEdit}
                    />
                    <p className="text-xs text-muted-foreground">迁移前企业实际开展业务的地址</p>
                  </div>
                </div>
              </div>
              )}

              {/* 邮寄地址 */}
              <div className="rounded-lg border bg-card p-5">
                <h3 className="text-base font-medium mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                    {formData.applicationType === "migration" ? "2" : "1"}
                  </span>
                  邮寄地址
                </h3>
                <div className="space-y-2">
                  <Textarea
                    value={formData.mailingAddress}
                    onChange={(e) => updateField("mailingAddress", e.target.value)}
                    placeholder="请输入邮寄地址，用于接收重要文件和通知"
                    rows={3}
                    className="resize-none"
                    disabled={!canEdit}
                  />
                  <p className="text-xs text-muted-foreground">用于接收重要文件和通知</p>
                </div>
              </div>

              {/* 新建企业：实际经营地址提示 */}
              {formData.applicationType === "new" && (
              <div className="rounded-lg bg-muted/50 border border-dashed p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium">实际经营地址</p>
                    <p className="mt-1">新建企业的实际经营地址将在入园审批通过后，由系统根据分配的基地自动生成，无需填写。</p>
                  </div>
                </div>
              </div>
              )}

              {/* 步骤导航 */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button type="button" variant="outline" onClick={goToPrevStep}>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  上一步：基本信息
                </Button>
                <div className="text-sm text-muted-foreground">
                  第 2 步，共 5 步
                </div>
                <Button type="button" onClick={goToNextStep}>
                  下一步：人员信息
                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
          </div>
          )}

          {/* 人员信息 */}
          {currentStep === 2 && (
          <div className="space-y-6">
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
                <div key={index} className="rounded-lg border bg-card overflow-hidden">
                  {/* 人员头部 */}
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                        {index + 1}
                      </span>
                      <span className="font-medium">{person.name || `人员 ${index + 1}`}</span>
                      {person.roles.length > 0 && (
                        <div className="flex gap-1">
                          {person.roles.map(role => (
                            <Badge key={role} variant="secondary" className="text-xs">
                              {roleConfig[role]?.label}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
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

                  <div className="p-4 space-y-4">
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
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(roleConfig).map(([role, config]) => {
                          const isSelected = person.roles.includes(role);
                          const isTakenByOther = isRoleTakenByOthers(index, role);
                          const holderIndex = getRoleHolderIndex(role);
                          const holderName = holderIndex >= 0 && formData ? formData.personnel[holderIndex]?.name : "";
                          
                          // 职务冲突规则：法人和监事不能同一人，监事和财务不能同一人
                          const hasConflict = 
                            (role === "supervisor" && (person.roles.includes("legal_person") || person.roles.includes("finance_manager"))) ||
                            (role === "legal_person" && person.roles.includes("supervisor")) ||
                            (role === "finance_manager" && person.roles.includes("supervisor"));
                          
                          const isDisabled = !canEdit || isTakenByOther || hasConflict;

                          return (
                            <button
                              key={role}
                              type="button"
                              onClick={() => !isDisabled && togglePersonnelRole(index, role)}
                              disabled={isDisabled}
                              title={isTakenByOther ? `该职务已由"${holderName || `人员${holderIndex + 1}`}"担任` : hasConflict ? "职务冲突，不能同时担任" : ""}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                                isSelected 
                                  ? "bg-primary/10 border-primary text-primary" 
                                  : isDisabled 
                                    ? "opacity-50 cursor-not-allowed bg-muted" 
                                    : "hover:bg-muted/50"
                              )}
                            >
                              <div className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center",
                                isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                              )}>
                                {isSelected && (
                                  <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div className="text-left">
                                <div className="text-sm font-medium">{config.label}</div>
                                {isTakenByOther && !isSelected && (
                                  <div className="text-xs text-muted-foreground">已被占用</div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        每个职务只能由一人担任，灰色选项表示已被其他人选择或职务冲突
                      </p>
                    </div>

                    {/* 身份证上传 */}
                    <div className="space-y-3">
                      <Label>身份证照片</Label>
                      <div className="grid grid-cols-2 gap-6">
                        {/* 身份证正面 */}
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">正面（人像面）</p>
                          {person.idCardFrontUrl ? (
                            <div className="relative group">
                              <div className="aspect-[1.58/1] rounded-lg border overflow-hidden bg-slate-100 shadow-sm">
                                <img
                                  src={person.idCardFrontUrl}
                                  alt="身份证正面"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => removeIdCard('front', index)}
                                  className="absolute -top-2 -right-2 p-1.5 rounded-full bg-destructive text-white hover:bg-destructive/90 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <label className={cn(
                              "flex flex-col items-center justify-center aspect-[1.58/1] rounded-lg border-2 border-dashed transition-all",
                              canEdit 
                                ? "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5 cursor-pointer" 
                                : "border-muted-foreground/25 opacity-50 cursor-not-allowed"
                            )}>
                              {uploadingFiles[`${index}-front`] ? (
                                <div className="flex flex-col items-center gap-2">
                                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">上传中...</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                    <Upload className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                  <span className="text-sm text-muted-foreground">点击上传正面</span>
                                </div>
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

                        {/* 身份证反面 */}
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">反面（国徽面）</p>
                          {person.idCardBackUrl ? (
                            <div className="relative group">
                              <div className="aspect-[1.58/1] rounded-lg border overflow-hidden bg-slate-100 shadow-sm">
                                <img
                                  src={person.idCardBackUrl}
                                  alt="身份证反面"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => removeIdCard('back', index)}
                                  className="absolute -top-2 -right-2 p-1.5 rounded-full bg-destructive text-white hover:bg-destructive/90 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <label className={cn(
                              "flex flex-col items-center justify-center aspect-[1.58/1] rounded-lg border-2 border-dashed transition-all",
                              canEdit 
                                ? "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5 cursor-pointer" 
                                : "border-muted-foreground/25 opacity-50 cursor-not-allowed"
                            )}>
                              {uploadingFiles[`${index}-back`] ? (
                                <div className="flex flex-col items-center gap-2">
                                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">上传中...</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                    <Upload className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                  <span className="text-sm text-muted-foreground">点击上传反面</span>
                                </div>
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
                      <p className="text-xs text-muted-foreground">
                        支持 JPG、PNG 格式，单个文件不超过 5MB
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* 中介人信息 */}
              <div className="rounded-lg border bg-card p-4 space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                    {formData.personnel.length + 1}
                  </span>
                  中介人信息
                </h3>
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

              {/* 步骤导航 */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button type="button" variant="outline" onClick={goToPrevStep}>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  上一步：地址信息
                </Button>
                <div className="text-sm text-muted-foreground">
                  第 3 步，共 5 步
                </div>
                <Button type="button" onClick={goToNextStep}>
                  下一步：股东信息
                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
          </div>
          )}

          {/* 股东信息 */}
          {currentStep === 3 && (
          <div className="space-y-4">
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
                        {/* 正本 */}
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">正本</p>
                          {shareholder.licenseOriginalUrl ? (
                            <div className="relative group">
                              <img
                                src={shareholder.licenseOriginalUrl}
                                alt="营业执照正本"
                                className="w-full h-24 object-cover rounded border"
                              />
                              {canEdit && (
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => removeShareholderFile('licenseOriginal', index)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ) : (
                            <label className={cn(
                              "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded cursor-pointer hover:border-primary",
                              uploadingShareholderFiles[`shareholder-${index}-licenseOriginal`] && "opacity-50 cursor-wait",
                              !canEdit && "opacity-50 cursor-not-allowed"
                            )}>
                              {uploadingShareholderFiles[`shareholder-${index}-licenseOriginal`] ? (
                                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                              ) : (
                                <>
                                  <Upload className="h-6 w-6 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground mt-1">上传正本</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/jpg"
                                className="hidden"
                                onChange={(e) => handleShareholderFileChange(e, 'licenseOriginal', index)}
                                disabled={!canEdit || uploadingShareholderFiles[`shareholder-${index}-licenseOriginal`]}
                              />
                            </label>
                          )}
                        </div>
                        
                        {/* 副本 */}
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">副本</p>
                          {shareholder.licenseCopyUrl ? (
                            <div className="relative group">
                              <img
                                src={shareholder.licenseCopyUrl}
                                alt="营业执照副本"
                                className="w-full h-24 object-cover rounded border"
                              />
                              {canEdit && (
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => removeShareholderFile('licenseCopy', index)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ) : (
                            <label className={cn(
                              "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded cursor-pointer hover:border-primary",
                              uploadingShareholderFiles[`shareholder-${index}-licenseCopy`] && "opacity-50 cursor-wait",
                              !canEdit && "opacity-50 cursor-not-allowed"
                            )}>
                              {uploadingShareholderFiles[`shareholder-${index}-licenseCopy`] ? (
                                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                              ) : (
                                <>
                                  <Upload className="h-6 w-6 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground mt-1">上传副本</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/jpg"
                                className="hidden"
                                onChange={(e) => handleShareholderFileChange(e, 'licenseCopy', index)}
                                disabled={!canEdit || uploadingShareholderFiles[`shareholder-${index}-licenseCopy`]}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">支持JPG、PNG格式，单张不超过5MB</p>
                    </div>
                  )}
                </div>
              ))}
              
              {/* 步骤导航 */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button type="button" variant="outline" onClick={goToPrevStep}>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  上一步：人员信息
                </Button>
                <div className="text-sm text-muted-foreground">
                  第 4 步，共 5 步
                </div>
                <Button type="button" onClick={goToNextStep}>
                  下一步：经营信息
                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
          </div>
          )}

          {/* 经营信息 */}
          {currentStep === 4 && (
          <div className="space-y-4">
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

              {/* 步骤导航 */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button type="button" variant="outline" onClick={goToPrevStep}>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  上一步：股东信息
                </Button>
                <div className="text-sm text-muted-foreground">
                  第 5 步，共 5 步（最后一步）
                </div>
                <div className="w-24"></div>
              </div>
          </div>
          )}
        </div>
      </ScrollArea>
      
      {/* 图片裁剪对话框 - 身份证 */}
      <ImageCropper
        open={cropperOpen}
        imageSrc={cropperImageSrc}
        onCrop={handleCropComplete}
        onCancel={handleCropCancel}
        aspectRatio={1.58}
      />
      
      {/* 图片裁剪对话框 - 股东证件 */}
      <ImageCropper
        open={shareholderCropperOpen}
        imageSrc={shareholderCropperImageSrc}
        onCrop={handleShareholderCropComplete}
        onCancel={handleShareholderCropCancel}
        aspectRatio={shareholderCropperTarget?.fileType?.startsWith('license') ? 1.41 : 1.58}
      />
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
    licenseOriginalKey: "",
    licenseOriginalUrl: "",
    licenseCopyKey: "",
    licenseCopyUrl: "",
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
