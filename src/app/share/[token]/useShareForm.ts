"use client";

import { useState, useCallback } from "react";
import type { FormData, Personnel, Shareholder } from "./types";
import { initialFormData, requiredRoles, roleConfig } from "./types";

// 裁剪目标类型
interface CropperTarget {
  type: "front" | "back";
  personnelIndex: number;
}

interface ShareholderCropperTarget {
  fileType: "idCardFront" | "idCardBack" | "licenseOriginal" | "licenseCopy";
  shareholderIndex: number;
}

export function useShareForm(token: string) {
  // 基础状态
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  // 加载表单数据
  const loadFormData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/share/${token}`);
      const result = await response.json();

      if (!result.success) {
        setError(result.error || "加载失败");
        return;
      }

      setFormData(result.data);
    } catch (err) {
      console.error("加载表单数据失败:", err);
      setError("加载失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // 更新字段
  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // ========== 人员管理 ==========
  const addPersonnel = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      personnel: [
        ...prev.personnel,
        {
          name: "",
          phone: "",
          email: "",
          address: "",
          roles: [],
          idCardFrontKey: "",
          idCardFrontUrl: "",
          idCardBackKey: "",
          idCardBackUrl: "",
        },
      ],
    }));
  }, []);

  const removePersonnel = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      personnel: prev.personnel.filter((_, i) => i !== index),
    }));
  }, []);

  const updatePersonnel = useCallback((index: number, field: keyof Personnel, value: string | string[]) => {
    setFormData((prev) => {
      const newPersonnel = [...prev.personnel];
      newPersonnel[index] = { ...newPersonnel[index], [field]: value };
      return { ...prev, personnel: newPersonnel };
    });
  }, []);

  const togglePersonnelRole = useCallback((index: number, roleKey: string) => {
    setFormData((prev) => {
      const newPersonnel = [...prev.personnel];
      const currentRoles = newPersonnel[index].roles;
      if (currentRoles.includes(roleKey)) {
        newPersonnel[index].roles = currentRoles.filter((r) => r !== roleKey);
      } else {
        newPersonnel[index].roles = [...currentRoles, roleKey];
      }
      return { ...prev, personnel: newPersonnel };
    });
  }, []);

  // 检查角色是否已被其他人占用
  const isRoleTakenByOthers = useCallback(
    (roleKey: string, currentIndex: number): boolean => {
      return formData.personnel.some((p, idx) => idx !== currentIndex && p.roles.includes(roleKey));
    },
    [formData.personnel]
  );

  // 获取角色持有者的索引
  const getRoleHolderIndex = useCallback(
    (roleKey: string): number => {
      return formData.personnel.findIndex((p) => p.roles.includes(roleKey));
    },
    [formData.personnel]
  );

  // ========== 股东管理 ==========
  const addShareholder = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      shareholders: [
        ...prev.shareholders,
        {
          type: "natural" as const,
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
        },
      ],
    }));
  }, []);

  const removeShareholder = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      shareholders: prev.shareholders.filter((_, i) => i !== index),
    }));
  }, []);

  const updateShareholder = useCallback((index: number, field: keyof Shareholder, value: string) => {
    setFormData((prev) => {
      const newShareholders = [...prev.shareholders];
      newShareholders[index] = { ...newShareholders[index], [field]: value };
      return { ...prev, shareholders: newShareholders };
    });
  }, []);

  // ========== 文件上传 ==========
  const handlePersonnelFileChange = useCallback(
    async (personnelIndex: number, type: "front" | "back", file: File) => {
      // 设置裁剪
      const reader = new FileReader();
      reader.onload = () => {
        setCropperImageSrc(reader.result as string);
        setCropperTarget({ type, personnelIndex });
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleShareholderFileChange = useCallback(
    async (
      shareholderIndex: number,
      fileType: "idCardFront" | "idCardBack" | "licenseOriginal" | "licenseCopy",
      file: File
    ) => {
      const reader = new FileReader();
      reader.onload = () => {
        setShareholderCropperImageSrc(reader.result as string);
        setShareholderCropperTarget({ fileType, shareholderIndex });
        setShareholderCropperOpen(true);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // 上传文件到存储
  const uploadFile = useCallback(async (blob: Blob, filename: string): Promise<{ key: string; url: string } | null> => {
    try {
      const formData = new FormData();
      formData.append("file", blob, filename);

      const response = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        return { key: result.data.key, url: result.data.url };
      }
      return null;
    } catch (error) {
      console.error("上传文件失败:", error);
      return null;
    }
  }, []);

  // 处理人员裁剪完成
  const handleCropComplete = useCallback(
    async (croppedImage: Blob) => {
      if (!cropperTarget) return;

      const { type, personnelIndex } = cropperTarget;
      const key = type === "front" ? "idCardFront" : "idCardBack";
      setUploadingFiles((prev) => ({ ...prev, [`${key}_${personnelIndex}`]: true }));

      const result = await uploadFile(croppedImage, `personnel_${personnelIndex}_${key}.jpg`);

      if (result) {
        updatePersonnel(personnelIndex, `${key}Key` as keyof Personnel, result.key);
        updatePersonnel(personnelIndex, `${key}Url` as keyof Personnel, result.url);
      }

      setUploadingFiles((prev) => {
        const newState = { ...prev };
        delete newState[`${key}_${personnelIndex}`];
        return newState;
      });
      setCropperOpen(false);
      setCropperTarget(null);
    },
    [cropperTarget, uploadFile, updatePersonnel]
  );

  // 处理股东裁剪完成
  const handleShareholderCropComplete = useCallback(
    async (croppedImage: Blob) => {
      if (!shareholderCropperTarget) return;

      const { fileType, shareholderIndex } = shareholderCropperTarget;
      setUploadingShareholderFiles((prev) => ({ ...prev, [`${fileType}_${shareholderIndex}`]: true }));

      const result = await uploadFile(croppedImage, `shareholder_${shareholderIndex}_${fileType}.jpg`);

      if (result) {
        updateShareholder(shareholderIndex, `${fileType}Key` as keyof Shareholder, result.key);
        updateShareholder(shareholderIndex, `${fileType}Url` as keyof Shareholder, result.url);
      }

      setUploadingShareholderFiles((prev) => {
        const newState = { ...prev };
        delete newState[`${fileType}_${shareholderIndex}`];
        return newState;
      });
      setShareholderCropperOpen(false);
      setShareholderCropperTarget(null);
    },
    [shareholderCropperTarget, uploadFile, updateShareholder]
  );

  const handleCropCancel = useCallback(() => {
    setCropperOpen(false);
    setCropperTarget(null);
  }, []);

  const handleShareholderCropCancel = useCallback(() => {
    setShareholderCropperOpen(false);
    setShareholderCropperTarget(null);
  }, []);

  // 删除文件
  const removePersonnelFile = useCallback((personnelIndex: number, type: "front" | "back") => {
    const key = type === "front" ? "idCardFront" : "idCardBack";
    updatePersonnel(personnelIndex, `${key}Key` as keyof Personnel, "");
    updatePersonnel(personnelIndex, `${key}Url` as keyof Personnel, "");
  }, [updatePersonnel]);

  const removeShareholderFile = useCallback(
    (shareholderIndex: number, fileType: "idCardFront" | "idCardBack" | "licenseOriginal" | "licenseCopy") => {
      updateShareholder(shareholderIndex, `${fileType}Key` as keyof Shareholder, "");
      updateShareholder(shareholderIndex, `${fileType}Url` as keyof Shareholder, "");
    },
    [updateShareholder]
  );

  // ========== 表单验证 ==========
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // 基本信息
    if (!formData.enterpriseName.trim()) {
      newErrors.enterpriseName = "请输入企业名称";
    }

    if (!formData.applicationType) {
      newErrors.applicationType = "请选择申请类型";
    }

    if (!formData.taxType) {
      newErrors.taxType = "请选择纳税人类型";
    }

    // 检查必填职务
    for (const role of requiredRoles) {
      const hasRole = formData.personnel.some((p) => p.roles.includes(role.key));
      if (!hasRole) {
        newErrors[`role_${role.key}`] = `请指定${role.label}`;
      }
    }

    // 验证人员信息
    formData.personnel.forEach((person, index) => {
      if (person.roles.length > 0) {
        if (!person.name.trim()) {
          newErrors[`personnel_${index}_name`] = "请输入姓名";
        }
        if (!person.phone.trim()) {
          newErrors[`personnel_${index}_phone`] = "请输入电话";
        }
        if (!person.email.trim()) {
          newErrors[`personnel_${index}_email`] = "请输入邮箱";
        }
        if (!person.address.trim()) {
          newErrors[`personnel_${index}_address`] = "请输入住址";
        }
        if (!person.idCardFrontUrl) {
          newErrors[`personnel_${index}_idCardFront`] = "请上传身份证正面";
        }
        if (!person.idCardBackUrl) {
          newErrors[`personnel_${index}_idCardBack`] = "请上传身份证背面";
        }
      }
    });

    // 验证股东信息
    formData.shareholders.forEach((shareholder, index) => {
      if (!shareholder.name.trim()) {
        newErrors[`shareholder_${index}_name`] = "请输入股东名称";
      }
      if (!shareholder.investment.trim()) {
        newErrors[`shareholder_${index}_investment`] = "请输入出资额";
      }
      if (!shareholder.phone.trim()) {
        newErrors[`shareholder_${index}_phone`] = "请输入联系电话";
      }

      if (shareholder.type === "natural") {
        if (!shareholder.idCardFrontUrl) {
          newErrors[`shareholder_${index}_idCardFront`] = "请上传身份证正面";
        }
        if (!shareholder.idCardBackUrl) {
          newErrors[`shareholder_${index}_idCardBack`] = "请上传身份证背面";
        }
      } else {
        if (!shareholder.licenseOriginalUrl) {
          newErrors[`shareholder_${index}_licenseOriginal`] = "请上传营业执照正本";
        }
        if (!shareholder.licenseCopyUrl) {
          newErrors[`shareholder_${index}_licenseCopy`] = "请上传营业执照副本";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // ========== 保存 ==========
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/share/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!result.success) {
        setError(result.error || "保存失败");
      }
    } catch (err) {
      console.error("保存失败:", err);
      setError("保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  }, [token, formData]);

  // ========== 验证当前步骤 ==========
  const validateCurrentStep = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 0: // 基本信息
        if (!formData.enterpriseName.trim()) {
          newErrors.enterpriseName = "请输入企业名称";
        }
        if (!formData.applicationType) {
          newErrors.applicationType = "请选择申请类型";
        }
        if (!formData.taxType) {
          newErrors.taxType = "请选择纳税人类型";
        }
        break;

      case 1: // 地址信息 - 非必填
        break;

      case 2: // 人员信息
        // 检查必填职务
        const missingRoles = requiredRoles.filter(
          (role) => !formData.personnel.some((p) => p.roles.includes(role.key))
        );
        if (missingRoles.length > 0) {
          newErrors.role_missing = `请指定：${missingRoles.map((r) => r.label).join("、")}`;
        }
        
        formData.personnel.forEach((person, index) => {
          if (person.roles.length > 0) {
            if (!person.name.trim()) newErrors[`personnel_${index}_name`] = "请输入姓名";
            if (!person.phone.trim()) newErrors[`personnel_${index}_phone`] = "请输入电话";
            if (!person.email.trim()) newErrors[`personnel_${index}_email`] = "请输入邮箱";
            if (!person.address.trim()) newErrors[`personnel_${index}_address`] = "请输入住址";
            if (!person.idCardFrontUrl) newErrors[`personnel_${index}_idCardFront`] = "请上传身份证正面";
            if (!person.idCardBackUrl) newErrors[`personnel_${index}_idCardBack`] = "请上传身份证背面";
          }
        });
        break;

      case 3: // 股东信息
        formData.shareholders.forEach((shareholder, index) => {
          if (!shareholder.name.trim()) newErrors[`shareholder_${index}_name`] = "请输入股东名称";
          if (!shareholder.investment.trim()) newErrors[`shareholder_${index}_investment`] = "请输入出资额";
          if (!shareholder.phone.trim()) newErrors[`shareholder_${index}_phone`] = "请输入联系电话";
          if (shareholder.type === "natural") {
            if (!shareholder.idCardFrontUrl) newErrors[`shareholder_${index}_idCardFront`] = "请上传身份证正面";
            if (!shareholder.idCardBackUrl) newErrors[`shareholder_${index}_idCardBack`] = "请上传身份证背面";
          } else {
            if (!shareholder.licenseOriginalUrl) newErrors[`shareholder_${index}_licenseOriginal`] = "请上传营业执照正本";
            if (!shareholder.licenseCopyUrl) newErrors[`shareholder_${index}_licenseCopy`] = "请上传营业执照副本";
          }
        });
        break;
    }

    setErrors(newErrors);
    
    // 如果有错误，显示第一个错误
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      // 可以通过 toast 或者其他方式提示
      console.log("验证失败:", firstError);
    }
    
    return Object.keys(newErrors).length === 0;
  }, [currentStep, formData]);

  // ========== 提交 ==========
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/share/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "提交失败");
      }
    } catch (err) {
      console.error("提交失败:", err);
      setError("提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, token, formData]);

  // ========== 步骤导航 ==========
  const goToNextStep = useCallback(async () => {
    // 先验证当前步骤
    if (!validateCurrentStep()) {
      return;
    }
    
    // 保存数据
    await handleSave();
    
    if (currentStep < formSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, validateCurrentStep, handleSave]);

  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const formSteps = [
    { id: "basic", title: "基本信息", description: "企业名称、注册信息等" },
    { id: "address", title: "地址信息", description: "注册地址、邮寄地址等" },
    { id: "personnel", title: "人员信息", description: "法人、监事、财务等" },
    { id: "shareholder", title: "股东信息", description: "股东及出资情况" },
    { id: "business", title: "经营信息", description: "经营范围、中介等" },
  ];

  return {
    // 状态
    formData,
    loading,
    saving,
    submitting,
    error,
    success,
    errors,
    currentStep,
    setCurrentStep,

    // 文件上传状态
    uploadingFiles,
    uploadingPersonnelFiles: uploadingFiles,
    uploadingShareholderFiles,

    // 裁剪状态
    cropperOpen,
    cropperImageSrc,
    shareholderCropperOpen,
    shareholderCropperImageSrc,

    // 方法
    loadFormData,
    updateField,
    addPersonnel,
    removePersonnel,
    updatePersonnel,
    togglePersonnelRole,
    isRoleTakenByOthers,
    getRoleHolderIndex,
    handlePersonnelFileChange,
    removePersonnelFile,
    addShareholder,
    removeShareholder,
    updateShareholder,
    handleShareholderFileChange,
    removeShareholderFile,
    handleSave,
    handleSubmit,
    handleCropComplete,
    handleCropCancel,
    handleShareholderCropComplete,
    handleShareholderCropCancel,
    goToNextStep,
    goToPrevStep,
  };
}
