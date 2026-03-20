"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { 
  ApplicationFormData, 
  Personnel, 
  Shareholder, 
  ShareholderType 
} from "./types";
import { initialFormData, formSteps, requiredRoles } from "./constants";

// 裁剪目标类型
interface CropperTarget {
  type: 'front' | 'back';
  personnelIndex: number;
}

interface ShareholderCropperTarget {
  fileType: 'idCardFront' | 'idCardBack' | 'licenseOriginal' | 'licenseCopy';
  shareholderIndex: number;
}

export function useApplicationForm(id: string) {
  const router = useRouter();
  
  // 基础状态
  const [formData, setFormData] = useState<ApplicationFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  
  // 文件上传状态
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [uploadingShareholderFiles, setUploadingShareholderFiles] = useState<Record<string, boolean>>({});
  
  // 人员文件裁剪状态
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string>("");
  const [cropperTarget, setCropperTarget] = useState<CropperTarget | null>(null);
  
  // 股东文件裁剪状态
  const [shareholderCropperOpen, setShareholderCropperOpen] = useState(false);
  const [shareholderCropperImageSrc, setShareholderCropperImageSrc] = useState<string>("");
  const [shareholderCropperTarget, setShareholderCropperTarget] = useState<ShareholderCropperTarget | null>(null);

  // 获取申请详情
  const loadApplication = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");
      const response = await fetch(`/api/settlement/applications/${id}`);
      const result = await response.json();
      if (result.success) {
        setFormData({
          ...initialFormData,
          ...result.data,
          personnel: result.data.personnel || initialFormData.personnel,
          shareholders: result.data.shareholders || initialFormData.shareholders,
        });
      } else {
        setPageError(result.error || "获取申请详情失败");
      }
    } catch (error) {
      console.error("获取申请详情失败:", error);
      setPageError("获取申请详情失败");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadApplication();
  }, [id, loadApplication]);

  // 更新字段
  const updateField = useCallback((field: keyof ApplicationFormData, value: string | string[] | Shareholder[] | Personnel[]) => {
    setFormData((prev) => prev ? { ...prev, [field]: value } : null);
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // ========== 人员操作 ==========
  const addPersonnel = useCallback(() => {
    setFormData((prev) => prev ? {
      ...prev,
      personnel: [...prev.personnel, { 
        name: "", phone: "", email: "", address: "", roles: [],
        idCardFrontKey: "", idCardFrontUrl: "", idCardBackKey: "", idCardBackUrl: "",
      }],
    } : null);
  }, []);

  const removePersonnel = useCallback((index: number) => {
    setFormData((prev) => prev ? {
      ...prev, personnel: prev.personnel.filter((_, i) => i !== index),
    } : null);
  }, []);

  const updatePersonnel = useCallback((index: number, field: keyof Personnel, value: string | string[]) => {
    setFormData((prev) => {
      if (!prev) return null;
      const newPersonnel = [...prev.personnel];
      newPersonnel[index] = { ...newPersonnel[index], [field]: value };
      return { ...prev, personnel: newPersonnel };
    });
  }, []);

  const togglePersonnelRole = useCallback((index: number, role: string) => {
    setFormData((prev) => {
      if (!prev) return null;
      const newPersonnel = [...prev.personnel];
      const roles = newPersonnel[index].roles;
      if (roles.includes(role)) {
        newPersonnel[index] = { ...newPersonnel[index], roles: roles.filter((r) => r !== role) };
      } else {
        const isRoleTaken = prev.personnel.some((p, i) => i !== index && p.roles.includes(role));
        if (!isRoleTaken) {
          newPersonnel[index] = { ...newPersonnel[index], roles: [...roles, role] };
        }
      }
      return { ...prev, personnel: newPersonnel };
    });
  }, []);

  const isRoleTakenByOthers = useCallback((currentIndex: number, role: string): boolean => {
    if (!formData) return false;
    return formData.personnel.some((p, i) => i !== currentIndex && p.roles.includes(role));
  }, [formData]);

  const getRoleHolderIndex = useCallback((role: string): number => {
    if (!formData) return -1;
    return formData.personnel.findIndex((p) => p.roles.includes(role));
  }, [formData]);

  // ========== 股东操作 ==========
  const addShareholder = useCallback(() => {
    setFormData((prev) => prev ? {
      ...prev,
      shareholders: [...prev.shareholders, { 
        type: "natural" as ShareholderType, name: "", investment: "", phone: "",
        idCardFrontKey: "", idCardFrontUrl: "", idCardBackKey: "", idCardBackUrl: "",
        licenseOriginalKey: "", licenseOriginalUrl: "", licenseCopyKey: "", licenseCopyUrl: "",
      }],
    } : null);
  }, []);

  const removeShareholder = useCallback((index: number) => {
    setFormData((prev) => prev ? {
      ...prev, shareholders: prev.shareholders.filter((_, i) => i !== index),
    } : null);
  }, []);

  const updateShareholder = useCallback((index: number, field: keyof Shareholder, value: string | ShareholderType) => {
    setFormData((prev) => {
      if (!prev) return null;
      const newShareholders = [...prev.shareholders];
      newShareholders[index] = { ...newShareholders[index], [field]: value };
      return { ...prev, shareholders: newShareholders };
    });
  }, []);

  // ========== 文件上传 ==========
  const uploadFile = useCallback(async (file: File | Blob, type: 'front' | 'back', personnelIndex: number): Promise<void> => {
    const uploadKey = `${personnelIndex}-${type}`;
    setUploadingFiles((prev) => ({ ...prev, [uploadKey]: true }));

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file, 'cropped-image.jpg');
      formDataUpload.append('type', 'id_card');

      const response = await fetch('/api/storage/upload', { method: 'POST', body: formDataUpload });
      const result = await response.json();

      if (result.success) {
        setFormData((prev) => {
          if (!prev) return null;
          const newPersonnel = [...prev.personnel];
          if (type === 'front') {
            newPersonnel[personnelIndex] = { ...newPersonnel[personnelIndex], idCardFrontKey: result.data.key, idCardFrontUrl: result.data.url };
          } else {
            newPersonnel[personnelIndex] = { ...newPersonnel[personnelIndex], idCardBackKey: result.data.key, idCardBackUrl: result.data.url };
          }
          return { ...prev, personnel: newPersonnel };
        });
      } else {
        alert(result.error || '上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败');
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [uploadKey]: false }));
    }
  }, []);

  const uploadShareholderFile = useCallback(async (
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

      const response = await fetch('/api/storage/upload', { method: 'POST', body: formDataUpload });
      const result = await response.json();

      if (result.success) {
        setFormData((prev) => {
          if (!prev) return null;
          const newShareholders = [...prev.shareholders];
          const fieldMap: Record<string, { key: keyof Shareholder; url: keyof Shareholder }> = {
            idCardFront: { key: 'idCardFrontKey', url: 'idCardFrontUrl' },
            idCardBack: { key: 'idCardBackKey', url: 'idCardBackUrl' },
            licenseOriginal: { key: 'licenseOriginalKey', url: 'licenseOriginalUrl' },
            licenseCopy: { key: 'licenseCopyKey', url: 'licenseCopyUrl' },
          };
          const fields = fieldMap[fileType];
          newShareholders[shareholderIndex] = {
            ...newShareholders[shareholderIndex],
            [fields.key]: result.data.key,
            [fields.url]: result.data.url,
          };
          return { ...prev, shareholders: newShareholders };
        });
      } else {
        alert(result.error || '上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败');
    } finally {
      setUploadingShareholderFiles((prev) => ({ ...prev, [uploadKey]: false }));
    }
  }, []);

  // ========== 文件选择 ==========
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back', personnelIndex: number) => {
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
      const reader = new FileReader();
      reader.onload = (event) => {
        setCropperImageSrc(event.target?.result as string);
        setCropperTarget({ type, personnelIndex });
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }, []);

  const handleShareholderFileChange = useCallback((
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
      const reader = new FileReader();
      reader.onload = (event) => {
        setShareholderCropperImageSrc(event.target?.result as string);
        setShareholderCropperTarget({ fileType, shareholderIndex });
        setShareholderCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }, []);

  // ========== 裁剪完成 ==========
  const handleCropComplete = useCallback(async (croppedBlob: Blob) => {
    if (!cropperTarget) return;
    setCropperOpen(false);
    await uploadFile(croppedBlob, cropperTarget.type, cropperTarget.personnelIndex);
    setCropperTarget(null);
    setCropperImageSrc("");
  }, [cropperTarget, uploadFile]);

  const handleShareholderCropComplete = useCallback(async (croppedBlob: Blob) => {
    if (!shareholderCropperTarget) return;
    setShareholderCropperOpen(false);
    await uploadShareholderFile(croppedBlob, shareholderCropperTarget.fileType, shareholderCropperTarget.shareholderIndex);
    setShareholderCropperTarget(null);
    setShareholderCropperImageSrc("");
  }, [shareholderCropperTarget, uploadShareholderFile]);

  // ========== 取消裁剪 ==========
  const handleCropCancel = useCallback(() => {
    setCropperOpen(false);
    setCropperTarget(null);
    setCropperImageSrc("");
  }, []);

  const handleShareholderCropCancel = useCallback(() => {
    setShareholderCropperOpen(false);
    setShareholderCropperTarget(null);
    setShareholderCropperImageSrc("");
  }, []);

  // ========== 移除文件 ==========
  const removeIdCard = useCallback((type: 'front' | 'back', personnelIndex: number) => {
    setFormData((prev) => {
      if (!prev) return null;
      const newPersonnel = [...prev.personnel];
      if (type === 'front') {
        newPersonnel[personnelIndex] = { ...newPersonnel[personnelIndex], idCardFrontKey: '', idCardFrontUrl: '' };
      } else {
        newPersonnel[personnelIndex] = { ...newPersonnel[personnelIndex], idCardBackKey: '', idCardBackUrl: '' };
      }
      return { ...prev, personnel: newPersonnel };
    });
  }, []);

  const removeShareholderFile = useCallback((
    fileType: 'idCardFront' | 'idCardBack' | 'licenseOriginal' | 'licenseCopy', 
    shareholderIndex: number
  ) => {
    setFormData((prev) => {
      if (!prev) return null;
      const newShareholders = [...prev.shareholders];
      const fieldMap: Record<string, { key: keyof Shareholder; url: keyof Shareholder }> = {
        idCardFront: { key: 'idCardFrontKey', url: 'idCardFrontUrl' },
        idCardBack: { key: 'idCardBackKey', url: 'idCardBackUrl' },
        licenseOriginal: { key: 'licenseOriginalKey', url: 'licenseOriginalUrl' },
        licenseCopy: { key: 'licenseCopyKey', url: 'licenseCopyUrl' },
      };
      const fields = fieldMap[fileType];
      newShareholders[shareholderIndex] = {
        ...newShareholders[shareholderIndex],
        [fields.key]: '',
        [fields.url]: '',
      };
      return { ...prev, shareholders: newShareholders };
    });
  }, []);

  // ========== 验证 ==========
  const validateBasicStep = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData?.enterpriseName?.trim()) newErrors.enterpriseName = "请输入企业名称";
    if (!formData?.registeredCapital?.trim()) newErrors.registeredCapital = "请输入注册资金";
    if (!formData?.taxType) newErrors.taxType = "请选择缴税类型";
    if (!formData?.expectedAnnualRevenue?.trim()) newErrors.expectedAnnualRevenue = "请输入预计主营收入";
    if (!formData?.expectedAnnualTax?.trim()) newErrors.expectedAnnualTax = "请输入预计全口径税收";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const validatePersonnelStep = useCallback((): boolean => {
    if (!formData?.personnel || formData.personnel.length < 2) {
      setErrors({ personnel: "至少需要2名人员（法人代表和监事）" });
      return false;
    }
    
    for (const role of requiredRoles) {
      const hasRole = formData.personnel.some(p => p.roles.includes(role.key));
      if (!hasRole) {
        setErrors({ personnel: `请指定${role.label}` });
        return false;
      }
    }
    
    const legalPersonIndex = formData.personnel.findIndex(p => p.roles.includes("legal_person"));
    const supervisorIndex = formData.personnel.findIndex(p => p.roles.includes("supervisor"));
    
    if (legalPersonIndex === supervisorIndex) {
      setErrors({ personnel: "法人代表和监事不能是同一人" });
      return false;
    }
    
    const financeIndex = formData.personnel.findIndex(p => p.roles.includes("finance_manager"));
    if (supervisorIndex === financeIndex) {
      setErrors({ personnel: "监事和财务负责人不能是同一人" });
      return false;
    }
    
    setErrors({});
    return true;
  }, [formData]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData?.enterpriseName) newErrors.enterpriseName = "请输入企业名称";
    if (!formData?.registeredCapital) newErrors.registeredCapital = "请输入注册资金";
    if (!formData?.currencyType) newErrors.currencyType = "请选择币种";
    if (!formData?.taxType) newErrors.taxType = "请选择缴税类型";
    if (!formData?.applicationType) newErrors.applicationType = "请选择申请类型";
    if (!formData?.expectedAnnualRevenue) newErrors.expectedAnnualRevenue = "请输入预计主营收入";
    if (!formData?.expectedAnnualTax) newErrors.expectedAnnualTax = "请输入预计全口径税收";

    const legalPersonIndex = formData?.personnel.findIndex((p) => p.roles.includes("legal_person")) ?? -1;
    const supervisorIndex = formData?.personnel.findIndex((p) => p.roles.includes("supervisor")) ?? -1;
    const financeIndex = formData?.personnel.findIndex((p) => p.roles.includes("finance_manager")) ?? -1;

    if (legalPersonIndex !== -1 && legalPersonIndex === supervisorIndex) {
      newErrors.personnel = "法人代表和监事不能是同一人";
    }
    if (supervisorIndex !== -1 && supervisorIndex === financeIndex) {
      newErrors.personnel = "监事和财务负责人不能是同一人";
    }
    if (legalPersonIndex === -1) newErrors.personnel = "必须指定法人代表";
    if (supervisorIndex === -1) newErrors.personnel = "必须指定监事";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // ========== 步骤切换 ==========
  const goToNextStep = useCallback(() => {
    if (currentStep < formSteps.length - 1) {
      let isValid = true;
      if (currentStep === 0) isValid = validateBasicStep();
      else if (currentStep === 2) isValid = validatePersonnelStep();
      
      if (isValid) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [currentStep, validateBasicStep, validatePersonnelStep]);

  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  // ========== 保存提交 ==========
  const handleSave = useCallback(async () => {
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
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  }, [id, formData, validateForm]);

  const handleSubmit = useCallback(async (status?: "draft" | "pending") => {
    if (!validateForm() || !formData) return;
    
    if (status === "pending" && !confirm("确认提交此申请进行审批？")) return;

    setSubmitting(true);
    setSuccess(false);
    try {
      // 保存数据
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

      // 如果是提交审批
      if (status === "pending") {
        const submitResponse = await fetch(`/api/settlement/applications/${id}/submit`, { method: "POST" });
        const submitResult = await submitResponse.json();
        
        if (submitResult.success) {
          setSuccess(true);
          alert("提交成功");
          router.push("/dashboard/base/applications");
        } else {
          alert(submitResult.error || "提交失败");
        }
      } else {
        setSuccess(true);
      }
    } catch (error) {
      console.error("操作失败:", error);
      alert("操作失败");
    } finally {
      setSubmitting(false);
    }
  }, [id, formData, validateForm, router]);

  // 计算属性
  const canEdit = formData?.approvalStatus === "draft";

  return {
    // 状态
    formData,
    loading,
    saving,
    submitting,
    pageError,
    success,
    canEdit,
    errors,
    currentStep,
    setCurrentStep,
    
    // 文件上传状态
    uploadingFiles,
    uploadingPersonnelFiles: uploadingFiles, // 别名，用于人员文件上传
    uploadingShareholderFiles,
    
    // 裁剪状态
    cropperOpen,
    cropperImageSrc,
    shareholderCropperOpen,
    shareholderCropperImageSrc,
    
    // 加载方法
    loadApplication,
    
    // 字段更新
    updateField,
    
    // 人员操作
    addPersonnel,
    removePersonnel,
    updatePersonnel,
    togglePersonnelRole,
    isRoleTakenByOthers,
    getRoleHolderIndex,
    
    // 股东操作
    addShareholder,
    removeShareholder,
    updateShareholder,
    
    // 文件操作
    handleFileChange: handleFileChange, // 重命名以匹配页面
    handlePersonnelFileChange: handleFileChange, // 别名
    handleShareholderFileChange,
    handleCropComplete,
    handleShareholderCropComplete,
    handleCropCancel,
    handleShareholderCropCancel,
    removeFile: removeIdCard, // 重命名
    removePersonnelFile: removeIdCard, // 别名
    removeShareholderFile,
    
    // 步骤操作
    goToNextStep,
    goToPrevStep,
    
    // 保存提交
    handleSubmit,
  };
}
