"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { FormData, Personnel, Shareholder } from "./types";
import { initialFormData, formSteps } from "./types";
import { validateForm, validateStep } from "./utils/validation";
import { useFileUploader } from "./hooks/useFileUploader";

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

  // 文件上传 Hook
  const fileUploader = useFileUploader();

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
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // ========== 人员管理 ==========
  const updatePersonnelList = useCallback((personnel: Personnel[]) => {
    setFormData((prev) => ({ ...prev, personnel }));
  }, []);

  const addPersonnel = useCallback(() => {
    const newPersonnel: Personnel = {
      name: "",
      phone: "",
      email: "",
      address: "",
      roles: [],
      idCardFrontKey: "",
      idCardFrontUrl: "",
      idCardBackKey: "",
      idCardBackUrl: "",
    };
    updatePersonnelList([...formData.personnel, newPersonnel]);
  }, [formData.personnel, updatePersonnelList]);

  const removePersonnel = useCallback(
    (index: number) => {
      updatePersonnelList(formData.personnel.filter((_, i) => i !== index));
    },
    [formData.personnel, updatePersonnelList]
  );

  const updatePersonnel = useCallback(
    (index: number, field: keyof Personnel, value: string | string[]) => {
      const newPersonnel = [...formData.personnel];
      newPersonnel[index] = { ...newPersonnel[index], [field]: value };
      updatePersonnelList(newPersonnel);
    },
    [formData.personnel, updatePersonnelList]
  );

  const togglePersonnelRole = useCallback(
    (index: number, roleKey: string) => {
      const newPersonnel = [...formData.personnel];
      const currentRoles = newPersonnel[index].roles;
      if (currentRoles.includes(roleKey)) {
        newPersonnel[index].roles = currentRoles.filter((r) => r !== roleKey);
      } else {
        newPersonnel[index].roles = [...currentRoles, roleKey];
      }
      updatePersonnelList(newPersonnel);
    },
    [formData.personnel, updatePersonnelList]
  );

  const isRoleTakenByOthers = useCallback(
    (roleKey: string, currentIndex: number): boolean => {
      return formData.personnel.some(
        (p, idx) => idx !== currentIndex && p.roles.includes(roleKey)
      );
    },
    [formData.personnel]
  );

  const getRoleHolderIndex = useCallback(
    (roleKey: string): number => {
      return formData.personnel.findIndex((p) => p.roles.includes(roleKey));
    },
    [formData.personnel]
  );

  // ========== 股东管理 ==========
  const updateShareholderList = useCallback((shareholders: Shareholder[]) => {
    setFormData((prev) => ({ ...prev, shareholders }));
  }, []);

  const addShareholder = useCallback(() => {
    const newShareholder: Shareholder = {
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
    };
    updateShareholderList([...formData.shareholders, newShareholder]);
  }, [formData.shareholders, updateShareholderList]);

  const removeShareholder = useCallback(
    (index: number) => {
      updateShareholderList(formData.shareholders.filter((_, i) => i !== index));
    },
    [formData.shareholders, updateShareholderList]
  );

  const updateShareholder = useCallback(
    (index: number, field: keyof Shareholder, value: string) => {
      const newShareholders = [...formData.shareholders];
      newShareholders[index] = { ...newShareholders[index], [field]: value };
      updateShareholderList(newShareholders);
    },
    [formData.shareholders, updateShareholderList]
  );

  // ========== 文件处理 ==========
  const handleCropComplete = useCallback(
    async (croppedImage: Blob) => {
      if (!fileUploader.cropperTarget) return;

      const { type, personnelIndex } = fileUploader.cropperTarget;
      const key = type === "front" ? "idCardFront" : "idCardBack";
      fileUploader.setUploadingFiles((prev) => ({
        ...prev,
        [`${key}_${personnelIndex}`]: true,
      }));

      const result = await fileUploader.uploadFile(
        croppedImage,
        `personnel_${personnelIndex}_${key}.jpg`
      );

      if (result) {
        updatePersonnel(
          personnelIndex,
          `${key}Key` as keyof Personnel,
          result.key
        );
        updatePersonnel(
          personnelIndex,
          `${key}Url` as keyof Personnel,
          result.url
        );
      }

      fileUploader.setUploadingFiles((prev) => {
        const newState = { ...prev };
        delete newState[`${key}_${personnelIndex}`];
        return newState;
      });
      fileUploader.setCropperOpen(false);
      fileUploader.setCropperTarget(null);
    },
    [fileUploader, updatePersonnel]
  );

  const handleShareholderCropComplete = useCallback(
    async (croppedImage: Blob) => {
      if (!fileUploader.shareholderCropperTarget) return;

      const { fileType, shareholderIndex } = fileUploader.shareholderCropperTarget;
      fileUploader.setUploadingShareholderFiles((prev) => ({
        ...prev,
        [`${fileType}_${shareholderIndex}`]: true,
      }));

      const result = await fileUploader.uploadFile(
        croppedImage,
        `shareholder_${shareholderIndex}_${fileType}.jpg`
      );

      if (result) {
        updateShareholder(
          shareholderIndex,
          `${fileType}Key` as keyof Shareholder,
          result.key
        );
        updateShareholder(
          shareholderIndex,
          `${fileType}Url` as keyof Shareholder,
          result.url
        );
      }

      fileUploader.setUploadingShareholderFiles((prev) => {
        const newState = { ...prev };
        delete newState[`${fileType}_${shareholderIndex}`];
        return newState;
      });
      fileUploader.setShareholderCropperOpen(false);
      fileUploader.setShareholderCropperTarget(null);
    },
    [fileUploader, updateShareholder]
  );

  const handleCropCancel = useCallback(() => {
    fileUploader.setCropperOpen(false);
    fileUploader.setCropperTarget(null);
  }, [fileUploader]);

  const handleShareholderCropCancel = useCallback(() => {
    fileUploader.setShareholderCropperOpen(false);
    fileUploader.setShareholderCropperTarget(null);
  }, [fileUploader]);

  const removePersonnelFile = useCallback(
    (personnelIndex: number, type: "front" | "back") => {
      const key = type === "front" ? "idCardFront" : "idCardBack";
      updatePersonnel(personnelIndex, `${key}Key` as keyof Personnel, "");
      updatePersonnel(personnelIndex, `${key}Url` as keyof Personnel, "");
    },
    [updatePersonnel]
  );

  const removeShareholderFile = useCallback(
    (
      shareholderIndex: number,
      fileType: "idCardFront" | "idCardBack" | "licenseOriginal" | "licenseCopy"
    ) => {
      updateShareholder(shareholderIndex, `${fileType}Key` as keyof Shareholder, "");
      updateShareholder(shareholderIndex, `${fileType}Url` as keyof Shareholder, "");
    },
    [updateShareholder]
  );

  // ========== 保存与提交 ==========
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

  const handleSubmit = useCallback(async () => {
    const validation = validateForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
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
  }, [formData, token]);

  // ========== 步骤导航 ==========
  const goToNextStep = useCallback(async () => {
    const validation = validateStep(currentStep, formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      // 提示用户有必填信息未填写
      const firstError = Object.values(validation.errors)[0];
      toast.error(firstError || "请填写必填信息");
      return;
    }

    await handleSave();

    if (currentStep < formSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, formData, handleSave]);

  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

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
    uploadingFiles: fileUploader.uploadingFiles,
    uploadingPersonnelFiles: fileUploader.uploadingFiles,
    uploadingShareholderFiles: fileUploader.uploadingShareholderFiles,

    // 裁剪状态
    cropperOpen: fileUploader.cropperOpen,
    cropperImageSrc: fileUploader.cropperImageSrc,
    shareholderCropperOpen: fileUploader.shareholderCropperOpen,
    shareholderCropperImageSrc: fileUploader.shareholderCropperImageSrc,

    // 方法
    loadFormData,
    updateField,
    addPersonnel,
    removePersonnel,
    updatePersonnel,
    togglePersonnelRole,
    isRoleTakenByOthers,
    getRoleHolderIndex,
    handlePersonnelFileChange: fileUploader.handlePersonnelFileChange,
    removePersonnelFile,
    addShareholder,
    removeShareholder,
    updateShareholder,
    handleShareholderFileChange: fileUploader.handleShareholderFileChange,
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
