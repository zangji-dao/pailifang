"use client";

import { useState, useCallback, useMemo } from "react";
import { mainSteps, getNextStep, getPrevStep } from "../_constants/steps";

// 入驻流程状态
export interface OnboardingState {
  // 当前步骤
  currentMainStepId: string;
  currentSubStepId: string;
  
  // 已完成的步骤
  completedMainSteps: Set<string>;
  completedSubSteps: Set<string>;
  
  // 企业数据
  enterpriseData: {
    // 基本信息
    name: string;
    enterpriseCode: string;
    type: "tenant" | "non_tenant" | null;
    baseId: string;
    
    // 地址信息
    selectedRegNumber: {
      id: string;
      code: string;
      manualCode: string | null;
      spaceId: string;
      spaceName: string;
      meterName: string;
      fullAddress: string | null;
      assignedEnterpriseName: string | null;
    } | null;
    
    // 产权证明文件
    proofFiles: { name: string; url: string; size: number }[];
    
    // 工商注册信息
    businessLicense: { name: string; url: string } | null;
    creditCode: string;
    legalPerson: string;
    phone: string;
    industry: string;
    
    // 合同信息
    contract: {
      contractNumber: string;
      startDate: string;
      endDate: string;
      monthlyRent: number;
      deposit: number;
      signature: string | null; // 签名图片
    } | null;
    
    // 费用信息
    fees: {
      id: string;
      name: string;
      amount: number;
      paymentMethod: string;
      paymentDate: string;
      proofUrl: string | null;
      status: "pending" | "paid" | "verified";
    }[];
    
    // 备注
    remarks: string;
  };
  
  // 创建完成后的企业ID
  createdEnterpriseId: string | null;
}

// 初始状态
const initialState: OnboardingState = {
  currentMainStepId: "address",
  currentSubStepId: "select_base",
  completedMainSteps: new Set(),
  completedSubSteps: new Set(),
  enterpriseData: {
    name: "",
    enterpriseCode: "",
    type: null,
    baseId: "",
    selectedRegNumber: null,
    proofFiles: [],
    businessLicense: null,
    creditCode: "",
    legalPerson: "",
    phone: "",
    industry: "",
    contract: null,
    fees: [],
    remarks: "",
  },
  createdEnterpriseId: null,
};

export function useOnboardingState() {
  const [state, setState] = useState<OnboardingState>(initialState);

  // 获取当前大步骤信息
  const currentMainStep = useMemo(() => {
    return mainSteps.find(s => s.id === state.currentMainStepId);
  }, [state.currentMainStepId]);

  // 获取当前子步骤信息
  const currentSubStep = useMemo(() => {
    return currentMainStep?.subSteps.find(s => s.id === state.currentSubStepId);
  }, [currentMainStep, state.currentSubStepId]);

  // 更新企业数据
  const updateEnterpriseData = useCallback(
    <K extends keyof OnboardingState["enterpriseData"]>(
      field: K,
      value: OnboardingState["enterpriseData"][K]
    ) => {
      setState(prev => ({
        ...prev,
        enterpriseData: {
          ...prev.enterpriseData,
          [field]: value,
        },
      }));
    },
    []
  );

  // 标记当前步骤完成并移动到下一步
  const completeCurrentStep = useCallback((skipOptional: boolean = false) => {
    setState(prev => {
      const newCompletedSubSteps = new Set(prev.completedSubSteps);
      newCompletedSubSteps.add(`${prev.currentMainStepId}_${prev.currentSubStepId}`);

      const nextStep = getNextStep(
        prev.currentMainStepId,
        prev.currentSubStepId,
        skipOptional
      );

      if (!nextStep) {
        // 流程完成
        const newCompletedMainSteps = new Set(prev.completedMainSteps);
        newCompletedMainSteps.add(prev.currentMainStepId);
        return {
          ...prev,
          completedSubSteps: newCompletedSubSteps,
          completedMainSteps: newCompletedMainSteps,
        };
      }

      // 检查是否需要标记大步骤完成
      const newCompletedMainSteps = new Set(prev.completedMainSteps);
      if (nextStep.mainStepId !== prev.currentMainStepId) {
        newCompletedMainSteps.add(prev.currentMainStepId);
      }

      return {
        ...prev,
        completedSubSteps: newCompletedSubSteps,
        completedMainSteps: newCompletedMainSteps,
        currentMainStepId: nextStep.mainStepId,
        currentSubStepId: nextStep.subStepId,
      };
    });
  }, []);

  // 移动到下一步（不标记完成）
  const goToNextStep = useCallback((skipOptional: boolean = false) => {
    setState(prev => {
      const nextStep = getNextStep(
        prev.currentMainStepId,
        prev.currentSubStepId,
        skipOptional
      );

      if (!nextStep) return prev;

      const newCompletedMainSteps = new Set(prev.completedMainSteps);
      if (nextStep.mainStepId !== prev.currentMainStepId) {
        newCompletedMainSteps.add(prev.currentMainStepId);
      }

      return {
        ...prev,
        currentMainStepId: nextStep.mainStepId,
        currentSubStepId: nextStep.subStepId,
        completedMainSteps: newCompletedMainSteps,
      };
    });
  }, []);

  // 移动到上一步
  const goToPrevStep = useCallback(() => {
    setState(prev => {
      const prevStep = getPrevStep(
        prev.currentMainStepId,
        prev.currentSubStepId
      );

      if (!prevStep) return prev;

      return {
        ...prev,
        currentMainStepId: prevStep.mainStepId,
        currentSubStepId: prevStep.subStepId,
      };
    });
  }, []);

  // 跳转到指定步骤
  const goToStep = useCallback((mainStepId: string, subStepId?: string) => {
    setState(prev => {
      const targetMainStep = mainSteps.find(s => s.id === mainStepId);
      if (!targetMainStep) return prev;

      const targetSubStep = subStepId
        ? targetMainStep.subSteps.find(s => s.id === subStepId)
        : targetMainStep.subSteps[0];

      if (!targetSubStep) return prev;

      return {
        ...prev,
        currentMainStepId: mainStepId,
        currentSubStepId: targetSubStep.id,
      };
    });
  }, []);

  // 重置状态
  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  // 设置创建完成
  const setCompleted = useCallback((enterpriseId: string) => {
    setState(prev => ({
      ...prev,
      createdEnterpriseId: enterpriseId,
      completedMainSteps: new Set(mainSteps.map(s => s.id)),
      completedSubSteps: new Set(
        mainSteps.flatMap(mainStep =>
          mainStep.subSteps.map(subStep => `${mainStep.id}_${subStep.id}`)
        )
      ),
    }));
  }, []);

  return {
    state,
    currentMainStep,
    currentSubStep,
    mainSteps,
    updateEnterpriseData,
    completeCurrentStep,
    goToNextStep,
    goToPrevStep,
    goToStep,
    resetState,
    setCompleted,
  };
}
