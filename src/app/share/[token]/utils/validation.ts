"use client";

import type { FormData } from "../types";
import { requiredRoles } from "../types";

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateForm(formData: FormData): ValidationResult {
  const errors: Record<string, string> = {};

  // 基本信息
  if (!formData.enterpriseName.trim()) {
    errors.enterpriseName = "请输入企业名称";
  }

  if (!formData.applicationType) {
    errors.applicationType = "请选择申请类型";
  }

  if (!formData.taxType) {
    errors.taxType = "请选择纳税人类型";
  }

  // 检查必填职务
  for (const role of requiredRoles) {
    const hasRole = formData.personnel.some((p) => p.roles.includes(role.key));
    if (!hasRole) {
      errors[`role_${role.key}`] = `请指定${role.label}`;
    }
  }

  // 验证人员信息
  formData.personnel.forEach((person, index) => {
    if (person.roles.length > 0) {
      if (!person.name.trim()) {
        errors[`personnel_${index}_name`] = "请输入姓名";
      }
      if (!person.phone.trim()) {
        errors[`personnel_${index}_phone`] = "请输入电话";
      }
      if (!person.address.trim()) {
        errors[`personnel_${index}_address`] = "请输入住址";
      }
      if (!person.idCardFrontUrl) {
        errors[`personnel_${index}_idCardFront`] = "请上传身份证正面";
      }
      if (!person.idCardBackUrl) {
        errors[`personnel_${index}_idCardBack`] = "请上传身份证背面";
      }
    }
  });

  // 验证股东信息
  formData.shareholders.forEach((shareholder, index) => {
    if (!shareholder.name.trim()) {
      errors[`shareholder_${index}_name`] = "请输入股东名称";
    }
    if (!shareholder.investment.trim()) {
      errors[`shareholder_${index}_investment`] = "请输入出资额";
    }
    if (!shareholder.phone.trim()) {
      errors[`shareholder_${index}_phone`] = "请输入联系电话";
    }

    if (shareholder.type === "natural") {
      if (!shareholder.idCardFrontUrl) {
        errors[`shareholder_${index}_idCardFront`] = "请上传身份证正面";
      }
      if (!shareholder.idCardBackUrl) {
        errors[`shareholder_${index}_idCardBack`] = "请上传身份证背面";
      }
    } else {
      if (!shareholder.licenseOriginalUrl) {
        errors[`shareholder_${index}_licenseOriginal`] = "请上传营业执照正本";
      }
      if (!shareholder.licenseCopyUrl) {
        errors[`shareholder_${index}_licenseCopy`] = "请上传营业执照副本";
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateStep(
  currentStep: number,
  formData: FormData
): ValidationResult {
  const errors: Record<string, string> = {};

  switch (currentStep) {
    case 0: // 基本信息
      if (!formData.enterpriseName.trim()) {
        errors.enterpriseName = "请输入企业名称";
      }
      if (!formData.applicationType) {
        errors.applicationType = "请选择申请类型";
      }
      if (!formData.taxType) {
        errors.taxType = "请选择纳税人类型";
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
        errors.role_missing = `请指定：${missingRoles.map((r) => r.label).join("、")}`;
      }

      formData.personnel.forEach((person, index) => {
        if (person.roles.length > 0) {
          if (!person.name.trim()) {
            errors[`personnel_${index}_name`] = "请输入姓名";
          }
          if (!person.phone.trim()) {
            errors[`personnel_${index}_phone`] = "请输入电话";
          }
          if (!person.address.trim()) {
            errors[`personnel_${index}_address`] = "请输入住址";
          }
          if (!person.idCardFrontUrl) {
            errors[`personnel_${index}_idCardFront`] = "请上传身份证正面";
          }
          if (!person.idCardBackUrl) {
            errors[`personnel_${index}_idCardBack`] = "请上传身份证背面";
          }
        }
      });
      break;

    case 3: // 股东信息
      formData.shareholders.forEach((shareholder, index) => {
        if (!shareholder.name.trim()) {
          errors[`shareholder_${index}_name`] = "请输入股东名称";
        }
        if (!shareholder.investment.trim()) {
          errors[`shareholder_${index}_investment`] = "请输入出资额";
        }
        if (!shareholder.phone.trim()) {
          errors[`shareholder_${index}_phone`] = "请输入联系电话";
        }
        if (shareholder.type === "natural") {
          if (!shareholder.idCardFrontUrl) {
            errors[`shareholder_${index}_idCardFront`] = "请上传身份证正面";
          }
          if (!shareholder.idCardBackUrl) {
            errors[`shareholder_${index}_idCardBack`] = "请上传身份证背面";
          }
        } else {
          if (!shareholder.licenseOriginalUrl) {
            errors[`shareholder_${index}_licenseOriginal`] = "请上传营业执照正本";
          }
          if (!shareholder.licenseCopyUrl) {
            errors[`shareholder_${index}_licenseCopy`] = "请上传营业执照副本";
          }
        }
      });
      break;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
