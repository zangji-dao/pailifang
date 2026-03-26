"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTabs } from "@/app/dashboard/tabs-context";
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
  const searchParams = useSearchParams();
  const tabs = useTabs();
  
  // 基础状态
  const [formData, setFormData] = useState<ApplicationFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // 从 URL 参数读取当前步骤
  const getStepFromUrl = useCallback(() => {
    const stepParam = searchParams.get("step");
    if (stepParam) {
      const step = parseInt(stepParam, 10);
      if (!isNaN(step) && step >= 0 && step < formSteps.length) {
        return step;
      }
    }
    return 0;
  }, [searchParams]);
  
  const [currentStep, setCurrentStep] = useState(() => {
    // 初始化时从 URL 读取步骤
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const stepParam = params.get("step");
      if (stepParam) {
        const step = parseInt(stepParam, 10);
        if (!isNaN(step) && step >= 0 && step < 5) {
          return step;
        }
      }
    }
    return 0;
  });
  
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
      const response = await fetch(`/api/applications/${id}`);
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
            newPersonnel[personnelIndex] = { ...newPersonnel[personnelIndex], idCardFrontKey: result.key, idCardFrontUrl: result.url };
          } else {
            newPersonnel[personnelIndex] = { ...newPersonnel[personnelIndex], idCardBackKey: result.key, idCardBackUrl: result.url };
          }
          return { ...prev, personnel: newPersonnel };
        });
      } else {
        toast.error(result.error || '上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      toast.error('上传失败');
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
            [fields.key]: result.key,
            [fields.url]: result.url,
          };
          return { ...prev, shareholders: newShareholders };
        });
      } else {
        toast.error(result.error || '上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      toast.error('上传失败');
    } finally {
      setUploadingShareholderFiles((prev) => ({ ...prev, [uploadKey]: false }));
    }
  }, []);

  // ========== 文件选择 ==========
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back', personnelIndex: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        toast.error('请上传 JPG 或 PNG 格式的图片');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('文件大小不能超过 5MB');
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
        toast.error('请上传 JPG 或 PNG 格式的图片');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('文件大小不能超过 5MB');
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
  const validateBasicStep = useCallback((): { isValid: boolean; errors: Record<string, string> } => {
    const newErrors: Record<string, string> = {};
    if (!formData?.enterpriseName?.trim()) newErrors.enterpriseName = "请输入企业名称";
    if (!formData?.registeredCapital?.trim()) newErrors.registeredCapital = "请输入注册资金";
    if (!formData?.taxType) newErrors.taxType = "请选择缴税类型";
    if (!formData?.expectedAnnualRevenue?.trim()) newErrors.expectedAnnualRevenue = "请输入预计主营收入";
    if (!formData?.expectedAnnualTax?.trim()) newErrors.expectedAnnualTax = "请输入预计全口径税收";
    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  }, [formData]);

  const validatePersonnelStep = useCallback((): { isValid: boolean; errors: Record<string, string> } => {
    const newErrors: Record<string, string> = {};
    
    if (!formData?.personnel || formData.personnel.length < 2) {
      newErrors.personnel = "至少需要2名人员（法人代表和监事）";
      setErrors(newErrors);
      return { isValid: false, errors: newErrors };
    }
    
    // 验证每个人员的信息是否完整
    for (let i = 0; i < formData.personnel.length; i++) {
      const person = formData.personnel[i];
      if (!person.name?.trim()) {
        newErrors.personnel = `第${i + 1}位人员姓名不能为空`;
        setErrors(newErrors);
        return { isValid: false, errors: newErrors };
      }
      if (!person.phone?.trim()) {
        newErrors.personnel = `第${i + 1}位人员电话不能为空`;
        setErrors(newErrors);
        return { isValid: false, errors: newErrors };
      }
      if (!person.address?.trim()) {
        newErrors.personnel = `第${i + 1}位人员住址不能为空`;
        setErrors(newErrors);
        return { isValid: false, errors: newErrors };
      }
      if (!person.idCardFrontUrl) {
        newErrors.personnel = `第${i + 1}位人员身份证正面未上传`;
        setErrors(newErrors);
        return { isValid: false, errors: newErrors };
      }
      if (!person.idCardBackUrl) {
        newErrors.personnel = `第${i + 1}位人员身份证反面未上传`;
        setErrors(newErrors);
        return { isValid: false, errors: newErrors };
      }
      if (person.roles.length === 0) {
        newErrors.personnel = `第${i + 1}位人员请至少选择一个职务`;
        setErrors(newErrors);
        return { isValid: false, errors: newErrors };
      }
    }
    
    // 验证必填职务
    for (const role of requiredRoles) {
      const hasRole = formData.personnel.some(p => p.roles.includes(role.key));
      if (!hasRole) {
        newErrors.personnel = `请指定${role.label}`;
        setErrors(newErrors);
        return { isValid: false, errors: newErrors };
      }
    }
    
    const legalPersonIndex = formData.personnel.findIndex(p => p.roles.includes("legal_person"));
    const supervisorIndex = formData.personnel.findIndex(p => p.roles.includes("supervisor"));
    
    if (legalPersonIndex === supervisorIndex) {
      newErrors.personnel = "法人代表和监事不能是同一人";
      setErrors(newErrors);
      return { isValid: false, errors: newErrors };
    }
    
    const financeIndex = formData.personnel.findIndex(p => p.roles.includes("finance_manager"));
    if (supervisorIndex === financeIndex) {
      newErrors.personnel = "监事和财务负责人不能是同一人";
      setErrors(newErrors);
      return { isValid: false, errors: newErrors };
    }
    
    setErrors({});
    return { isValid: true, errors: {} };
  }, [formData]);

  // ========== 股东信息验证 ==========
  const validateShareholderStep = useCallback((): { isValid: boolean; errors: Record<string, string> } => {
    const newErrors: Record<string, string> = {};
    
    if (!formData?.shareholders || formData.shareholders.length === 0) {
      newErrors.shareholder = "至少需要1名股东";
      setErrors(newErrors);
      return { isValid: false, errors: newErrors };
    }
    
    // 验证每个股东的信息是否完整
    for (let i = 0; i < formData.shareholders.length; i++) {
      const shareholder = formData.shareholders[i];
      if (!shareholder.name?.trim()) {
        newErrors.shareholder = `第${i + 1}位股东名称不能为空`;
        setErrors(newErrors);
        return { isValid: false, errors: newErrors };
      }
      if (!shareholder.investment?.trim()) {
        newErrors.shareholder = `第${i + 1}位股东出资额不能为空`;
        setErrors(newErrors);
        return { isValid: false, errors: newErrors };
      }
      if (!shareholder.phone?.trim()) {
        newErrors.shareholder = `第${i + 1}位股东联系电话不能为空`;
        setErrors(newErrors);
        return { isValid: false, errors: newErrors };
      }
      
      // 自然人股东需要身份证
      if (shareholder.type === "natural" || !shareholder.type) {
        if (!shareholder.idCardFrontUrl) {
          newErrors.shareholder = `第${i + 1}位股东身份证正面未上传`;
          setErrors(newErrors);
          return { isValid: false, errors: newErrors };
        }
        if (!shareholder.idCardBackUrl) {
          newErrors.shareholder = `第${i + 1}位股东身份证反面未上传`;
          setErrors(newErrors);
          return { isValid: false, errors: newErrors };
        }
      }
      
      // 企业股东需要营业执照
      if (shareholder.type === "enterprise") {
        if (!shareholder.licenseOriginalUrl) {
          newErrors.shareholder = `第${i + 1}位股东营业执照正本未上传`;
          setErrors(newErrors);
          return { isValid: false, errors: newErrors };
        }
        if (!shareholder.licenseCopyUrl) {
          newErrors.shareholder = `第${i + 1}位股东营业执照副本未上传`;
          setErrors(newErrors);
          return { isValid: false, errors: newErrors };
        }
      }
    }
    
    setErrors({});
    return { isValid: true, errors: {} };
  }, [formData]);

  // ========== 经营信息验证 ==========
  const validateBusinessStep = useCallback((): { isValid: boolean; errors: Record<string, string> } => {
    const newErrors: Record<string, string> = {};
    
    if (!formData?.businessScopeIds || formData.businessScopeIds.length === 0) {
      newErrors.businessScope = "请至少选择一项经营范围";
      setErrors(newErrors);
      return { isValid: false, errors: newErrors };
    }
    
    setErrors({});
    return { isValid: true, errors: {} };
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
  // 更新 URL 参数中的步骤
  const updateStepInUrl = useCallback((step: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set("step", step.toString());
    window.history.replaceState({}, "", url.toString());
  }, []);

  const goToNextStep = useCallback(async () => {
    if (currentStep < formSteps.length - 1) {
      let isValid = true;
      let firstError = "";
      
      if (currentStep === 0) {
        const result = validateBasicStep();
        isValid = result.isValid;
        const errorValues = Object.values(result.errors);
        if (errorValues.length > 0) {
          firstError = errorValues[0];
        }
      }
      else if (currentStep === 2) {
        const result = validatePersonnelStep();
        isValid = result.isValid;
        const errorValues = Object.values(result.errors);
        if (errorValues.length > 0) {
          firstError = errorValues[0];
        }
      }
      else if (currentStep === 3) {
        const result = validateShareholderStep();
        isValid = result.isValid;
        const errorValues = Object.values(result.errors);
        if (errorValues.length > 0) {
          firstError = errorValues[0];
        }
      }
      else if (currentStep === 4) {
        const result = validateBusinessStep();
        isValid = result.isValid;
        const errorValues = Object.values(result.errors);
        if (errorValues.length > 0) {
          firstError = errorValues[0];
        }
      }
      
      if (!isValid) {
        return;
      }
      
      if (formData) {
        // 自动保存当前步骤数据
        try {
          const response = await fetch(`/api/applications/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });
          const result = await response.json();
          if (result.success) {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
          }
        } catch (error) {
          console.error("自动保存失败:", error);
        }
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        updateStepInUrl(nextStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [currentStep, validateBasicStep, validatePersonnelStep, validateShareholderStep, validateBusinessStep, formData, id, updateStepInUrl]);

  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      updateStepInUrl(prevStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, updateStepInUrl]);

  // 跳转到指定步骤
  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < formSteps.length) {
      setCurrentStep(step);
      updateStepInUrl(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [updateStepInUrl]);

  // ========== 保存提交 ==========
  const handleSave = useCallback(async () => {
    if (!validateForm() || !formData) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } else {
        toast.error(result.error || "保存失败");
      }
    } catch (error) {
      console.error("保存失败:", error);
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  }, [id, formData, validateForm]);

  const handleSubmit = useCallback(async (status?: "draft" | "pending") => {
    if (!validateForm() || !formData) return;

    setSubmitting(true);
    setSuccess(false);
    try {
      // 保存数据并更新状态
      const saveResponse = await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: status || 'draft',
          approvalStatus: status === "pending" ? "pending" : formData.approvalStatus,
        }),
      });
      const saveResult = await saveResponse.json();
      
      if (!saveResult.success) {
        toast.error(saveResult.error || "保存失败");
        return;
      }

      if (status === "pending") {
        setSuccess(true);
        toast.success("提交成功");
        // 返回时带上来源状态参数
        const from = searchParams.get("from");
        const returnUrl = from 
          ? `/dashboard/base/applications?from=${from}` 
          : "/dashboard/base/applications";
        // 关闭当前标签页并跳转
        if (tabs) {
          tabs.closeCurrentTabAndNavigate(returnUrl);
        } else {
          router.push(returnUrl);
        }
      } else {
        setSuccess(true);
        toast.success("保存成功");
      }
    } catch (error) {
      console.error("操作失败:", error);
      toast.error("操作失败");
    } finally {
      setSubmitting(false);
    }
  }, [id, formData, validateForm, router, searchParams, tabs]);

  // 计算属性：填报中、草稿和驳回状态可编辑
  const canEdit = formData?.approvalStatus === "filling" || formData?.approvalStatus === "draft" || formData?.approvalStatus === "rejected";

  // ========== 返回并保存 ==========
  const handleGoBack = useCallback(async () => {
    // 如果有表单数据，先保存再跳转
    if (formData && canEdit) {
      setSaving(true);
      try {
        await fetch(`/api/applications/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } catch (error) {
        console.error("保存失败:", error);
      } finally {
        setSaving(false);
      }
    }
    
    // 判断来源页面
    const fromPage = searchParams.get("from");
    const fromStatus = searchParams.get("status");
    
    // 构建返回URL
    let returnUrl: string;
    if (fromPage === "approval") {
      returnUrl = fromStatus 
        ? `/dashboard/base/processes?status=${fromStatus}` 
        : "/dashboard/base/processes";
    } else {
      returnUrl = fromStatus 
        ? `/dashboard/base/applications?from=${fromStatus}` 
        : "/dashboard/base/applications";
    }
    
    // 关闭当前标签页并跳转
    if (tabs) {
      tabs.closeCurrentTabAndNavigate(returnUrl);
    } else {
      router.push(returnUrl);
    }
  }, [id, formData, canEdit, router, searchParams, tabs]);

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
    goToStep,
    
    // 保存提交
    handleSubmit,
    handleGoBack,
  };
}
