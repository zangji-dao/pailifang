"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

// 步骤配置和组件
import { mainSteps, getNextStep, getPrevStep } from "./_constants/steps";
import { VerticalStepIndicator } from "./_components/VerticalStepIndicator";
import { HorizontalSubStepIndicator } from "./_components/HorizontalSubStepIndicator";
import {
  SelectEnterpriseStep,
  ServiceFeeStep,
  DepositStep,
  ContractInfoStep,
  CompleteStep,
  type DepositItem,
} from "./_components/steps";
import { spaceTypeOptions } from "./_components/steps/ServiceFeeStep";

// 类型定义
interface Enterprise {
  id: string;
  name: string;
  enterpriseCode: string;
  creditCode?: string;
  legalPerson?: string;
  phone?: string;
  registeredAddress?: string;
  businessAddress?: string;
  type: string;
  processStatus: string;
  baseId?: string;
  baseName?: string;
}

interface ManagementCompany {
  name: string;
  creditCode: string;
  legalPerson: string;
  address: string;
  phone: string;
}

// 表单状态接口
interface FormState {
  // 步骤状态
  currentMainStepId: string;
  currentSubStepId: string;
  completedMainSteps: string[];
  completedSubSteps: string[];

  // 企业信息
  selectedEnterprise: Enterprise | null;
  searchKeyword: string;

  // 服务费
  spaceType: string;
  spaceQuantity: number;
  yearlyFee: number;

  // 押金
  baseDeposit: number;
  depositItems: DepositItem[];

  // 合同信息
  contractNo: string;
  startDate: string;
  endDate: string;
  contractYears: number;
  remarks: string;

  // 管理公司
  managementCompany: ManagementCompany | null;
}

// 初始状态
const initialFormState: FormState = {
  currentMainStepId: "enterprise",
  currentSubStepId: "search",
  completedMainSteps: [],
  completedSubSteps: [],

  selectedEnterprise: null,
  searchKeyword: "",

  spaceType: "",
  spaceQuantity: 1,
  yearlyFee: 0,

  baseDeposit: 0,
  depositItems: [],

  contractNo: "",
  startDate: "",
  endDate: "",
  contractYears: 1,
  remarks: "",

  managementCompany: null,
};

// 根据场地类型获取默认押金
const getDefaultDeposit = (spaceType: string): number => {
  const depositMap: Record<string, number> = {
    open_station: 1200,
    office_no_window: 1200,
    office_with_window: 1200,
    detached_office: 5000,
  };
  return depositMap[spaceType] || 1200;
};

export default function NewContractPage() {
  const router = useRouter();

  // 表单状态
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [createdContractId, setCreatedContractId] = useState<string | null>(null);

  // 解构表单状态
  const {
    currentMainStepId,
    currentSubStepId,
    completedMainSteps,
    completedSubSteps,
    selectedEnterprise,
    searchKeyword,
    spaceType,
    spaceQuantity,
    yearlyFee,
    baseDeposit,
    depositItems,
    contractNo,
    startDate,
    endDate,
    contractYears,
    remarks,
    managementCompany,
  } = formState;

  // 更新表单状态
  const updateFormState = useCallback((updates: Partial<FormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  }, []);

  // 获取当前大步骤和子步骤信息
  const currentMainStep = mainSteps.find(s => s.id === currentMainStepId);
  const currentSubStep = currentMainStep?.subSteps.find(s => s.id === currentSubStepId);

  // 计算总押金
  const totalDeposit = baseDeposit + depositItems.reduce((sum, item) => sum + item.amount, 0);

  // 步骤验证
  const validateCurrentStep = useCallback((): boolean => {
    switch (`${currentMainStepId}_${currentSubStepId}`) {
      case "enterprise_search":
        return true;
      case "enterprise_confirm":
        return selectedEnterprise !== null;
      case "service_fee_select_space":
        return spaceType !== "" && yearlyFee > 0;
      case "deposit_deposit_items":
        return baseDeposit > 0;
      case "contract_party_info":
        return selectedEnterprise !== null;
      case "contract_duration":
        return startDate !== "";
      case "complete_review":
        return true;
      default:
        return true;
    }
  }, [currentMainStepId, currentSubStepId, selectedEnterprise, spaceType, yearlyFee, baseDeposit, startDate]);

  // 选择企业
  const handleSelectEnterprise = useCallback((enterprise: Enterprise) => {
    updateFormState({ selectedEnterprise: enterprise });
  }, [updateFormState]);

  // 选择场地类型
  const handleSelectSpaceType = useCallback((space: typeof spaceTypeOptions[0]) => {
    const newYearlyFee = space.price * spaceQuantity;
    const newBaseDeposit = getDefaultDeposit(space.value) * spaceQuantity;
    updateFormState({
      spaceType: space.value,
      yearlyFee: newYearlyFee,
      baseDeposit: newBaseDeposit,
    });
  }, [spaceQuantity, updateFormState]);

  // 更新数量时重新计算费用
  useEffect(() => {
    if (spaceType) {
      const selectedSpace = spaceTypeOptions.find(s => s.value === spaceType);
      if (selectedSpace) {
        updateFormState({
          yearlyFee: selectedSpace.price * spaceQuantity,
          baseDeposit: getDefaultDeposit(spaceType) * spaceQuantity,
        });
      }
    }
  }, [spaceQuantity, spaceType, updateFormState]);

  // 根据期限自动计算结束日期
  useEffect(() => {
    if (startDate && contractYears) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + contractYears);
      updateFormState({ endDate: end.toISOString().split('T')[0] });
    }
  }, [startDate, contractYears, updateFormState]);

  // 添加押金项
  const handleAddDepositItem = useCallback((item: DepositItem) => {
    updateFormState({ depositItems: [...depositItems, item] });
  }, [depositItems, updateFormState]);

  // 更新押金项
  const handleUpdateDepositItem = useCallback((id: string, updates: Partial<DepositItem>) => {
    updateFormState({
      depositItems: depositItems.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ),
    });
  }, [depositItems, updateFormState]);

  // 删除押金项
  const handleRemoveDepositItem = useCallback((id: string) => {
    updateFormState({
      depositItems: depositItems.filter(item => item.id !== id),
    });
  }, [depositItems, updateFormState]);

  // 下一步
  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) {
      toast.error("请完善当前步骤的信息");
      return;
    }

    const stepKey = `${currentMainStepId}_${currentSubStepId}`;
    const newCompletedSubSteps = completedSubSteps.includes(stepKey)
      ? completedSubSteps
      : [...completedSubSteps, stepKey];

    const nextStep = getNextStep(currentMainStepId, currentSubStepId);
    if (nextStep) {
      const isCompletingMainStep = nextStep.mainStepId !== currentMainStepId;
      const newCompletedMainSteps = isCompletingMainStep
        ? completedMainSteps.includes(currentMainStepId)
          ? completedMainSteps
          : [...completedMainSteps, currentMainStepId]
        : completedMainSteps;

      updateFormState({
        currentMainStepId: nextStep.mainStepId,
        currentSubStepId: nextStep.subStepId,
        completedMainSteps: newCompletedMainSteps,
        completedSubSteps: newCompletedSubSteps,
      });
    }
  }, [currentMainStepId, currentSubStepId, validateCurrentStep, completedMainSteps, completedSubSteps, updateFormState]);

  // 上一步
  const handlePrev = useCallback(() => {
    const prevStep = getPrevStep(currentMainStepId, currentSubStepId);
    if (prevStep) {
      updateFormState({
        currentMainStepId: prevStep.mainStepId,
        currentSubStepId: prevStep.subStepId,
      });
    }
  }, [currentMainStepId, currentSubStepId, updateFormState]);

  // 跳转到大步骤
  const handleMainStepClick = useCallback((stepId: string) => {
    const stepIndex = mainSteps.findIndex(s => s.id === stepId);
    const currentIndex = mainSteps.findIndex(s => s.id === currentMainStepId);
    
    if (stepIndex <= currentIndex || completedMainSteps.includes(stepId)) {
      const targetStep = mainSteps[stepIndex];
      updateFormState({
        currentMainStepId: stepId,
        currentSubStepId: targetStep.subSteps[0].id,
      });
    }
  }, [currentMainStepId, completedMainSteps, updateFormState]);

  // 跳转到子步骤
  const handleSubStepClick = useCallback((subStepId: string) => {
    if (!currentMainStep) return;
    
    const subStepIndex = currentMainStep.subSteps.findIndex(s => s.id === subStepId);
    const currentIndex = currentMainStep.subSteps.findIndex(s => s.id === currentSubStepId);
    
    if (subStepIndex <= currentIndex || completedSubSteps.includes(`${currentMainStepId}_${subStepId}`)) {
      updateFormState({ currentSubStepId: subStepId });
    }
  }, [currentMainStep, currentSubStepId, completedSubSteps, currentMainStepId, updateFormState]);

  // 提交合同
  const handleSubmit = useCallback(async () => {
    if (!selectedEnterprise) {
      toast.error("请先选择企业");
      return;
    }
    if (!spaceType) {
      toast.error("请选择场地类型");
      return;
    }
    if (!startDate) {
      toast.error("请选择服务起始日期");
      return;
    }

    setSubmitting(true);
    try {
      const selectedSpace = spaceTypeOptions.find(s => s.value === spaceType);
      const response = await fetch("/api/settlement/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: selectedEnterprise.id,
          enterpriseName: selectedEnterprise.name,
          contractNo: contractNo || undefined,
          contractName: `${selectedEnterprise.name}入驻合同`,
          contractType: spaceType === "detached_office" ? "paid" : "free",
          rentAmount: yearlyFee,
          depositAmount: totalDeposit,
          startDate: startDate,
          endDate: endDate,
          // 甲方信息
          partyA: managementCompany ? {
            name: managementCompany.name,
            creditCode: managementCompany.creditCode,
            legalPerson: managementCompany.legalPerson,
            address: managementCompany.address,
            contactPhone: managementCompany.phone,
          } : undefined,
          // 乙方信息
          partyB: {
            name: selectedEnterprise.name,
            creditCode: selectedEnterprise.creditCode,
            legalPerson: selectedEnterprise.legalPerson,
            phone: selectedEnterprise.phone,
            address: selectedEnterprise.registeredAddress || selectedEnterprise.businessAddress,
          },
          remarks: JSON.stringify({
            spaceType: spaceType,
            spaceTypeLabel: selectedSpace?.label,
            spaceQuantity: spaceQuantity,
            contractYears: contractYears,
            baseDeposit: baseDeposit,
            depositItems: depositItems,
            remarks: remarks,
          }),
          status: "draft",
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "创建失败");
      }

      const result = await response.json();
      setCreatedContractId(result.data.id);
      
      updateFormState({
        completedMainSteps: [...completedMainSteps, "contract", "complete"],
        currentMainStepId: "complete",
        currentSubStepId: "review",
      });
      
      toast.success("合同创建成功");
    } catch (error) {
      console.error("创建合同失败:", error);
      toast.error(error instanceof Error ? error.message : "创建失败");
    } finally {
      setSubmitting(false);
    }
  }, [selectedEnterprise, spaceType, startDate, contractNo, yearlyFee, totalDeposit, endDate, managementCompany, contractYears, remarks, spaceQuantity, baseDeposit, depositItems, completedMainSteps, updateFormState]);

  // 获取选中的场地类型信息
  const getSelectedSpaceInfo = () => spaceTypeOptions.find(s => s.value === spaceType);

  // 渲染步骤内容
  const renderStepContent = () => {
    // 完成页面
    if (createdContractId && currentMainStepId === "complete") {
      return (
        <CompleteStep
          enterprise={selectedEnterprise}
          managementCompany={managementCompany}
          spaceType={spaceType}
          spaceTypeLabel={getSelectedSpaceInfo()?.label || ""}
          spaceQuantity={spaceQuantity}
          yearlyFee={yearlyFee}
          baseDeposit={baseDeposit}
          depositItems={depositItems}
          totalDeposit={totalDeposit}
          formData={{ contractNo, startDate, endDate, contractYears, remarks }}
          onViewContract={() => router.push(`/dashboard/base/contracts/${createdContractId}`)}
          onCreateAnother={() => {
            setCreatedContractId(null);
            setFormState(initialFormState);
          }}
        />
      );
    }

    // 选择企业大步骤
    if (currentMainStepId === "enterprise") {
      return (
        <SelectEnterpriseStep
          selectedEnterprise={selectedEnterprise}
          onSelect={handleSelectEnterprise}
          searchKeyword={searchKeyword}
          onSearchChange={(keyword) => updateFormState({ searchKeyword: keyword })}
        />
      );
    }

    // 服务费大步骤
    if (currentMainStepId === "service_fee") {
      return (
        <ServiceFeeStep
          spaceType={spaceType}
          spaceQuantity={spaceQuantity}
          yearlyFee={yearlyFee}
          onSelectSpaceType={handleSelectSpaceType}
          onUpdateQuantity={(q) => updateFormState({ spaceQuantity: q })}
          onUpdateYearlyFee={(fee) => updateFormState({ yearlyFee: fee })}
        />
      );
    }

    // 押金大步骤
    if (currentMainStepId === "deposit") {
      return (
        <DepositStep
          spaceType={spaceType}
          spaceQuantity={spaceQuantity}
          baseDeposit={baseDeposit}
          depositItems={depositItems}
          onUpdateBaseDeposit={(amount) => updateFormState({ baseDeposit: amount })}
          onAddDepositItem={handleAddDepositItem}
          onUpdateDepositItem={handleUpdateDepositItem}
          onRemoveDepositItem={handleRemoveDepositItem}
        />
      );
    }

    // 合同信息大步骤
    if (currentMainStepId === "contract") {
      return (
        <ContractInfoStep
          enterprise={selectedEnterprise}
          formData={{ contractNo, startDate, endDate, contractYears, remarks }}
          onUpdateFormData={(data) => updateFormState(data as Partial<FormState>)}
          subStepId={currentSubStepId}
          managementCompany={managementCompany}
          onUpdateManagementCompany={(company) => updateFormState({ managementCompany: company })}
        />
      );
    }

    return null;
  };

  // 判断是否是最后一步
  const isLastStep = currentMainStepId === "contract" && currentSubStepId === "duration";

  return (
    <div className="flex h-[calc(100vh-7rem)]">
      {/* 左侧垂直步骤指示器 */}
      <VerticalStepIndicator
        steps={mainSteps.map(s => ({
          ...s,
          status: completedMainSteps.includes(s.id)
            ? "completed"
            : s.id === currentMainStepId
              ? "in_progress"
              : "pending"
        }))}
        currentMainStepId={currentMainStepId}
        completedMainSteps={new Set(completedMainSteps)}
        onStepClick={handleMainStepClick}
      />

      {/* 右侧内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部子步骤指示器 */}
        {currentMainStep && currentMainStep.subSteps.length > 1 && !createdContractId && (
          <HorizontalSubStepIndicator
            subSteps={currentMainStep.subSteps}
            currentSubStepId={currentSubStepId}
            completedSubSteps={new Set(completedSubSteps)}
            mainStepId={currentMainStepId}
            onSubStepClick={handleSubStepClick}
          />
        )}

        {/* 页面标题 */}
        {!createdContractId && (
          <div className="px-6 py-4 border-b bg-card">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard/base/contracts")}
                title="返回列表"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">
                  {currentMainStep?.title || "新建合同"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {currentSubStep?.description || ""}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 步骤内容 */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            {renderStepContent()}
          </div>
        </div>

        {/* 底部操作栏 */}
        {!createdContractId && (
          <div className="border-t bg-card px-6 py-4">
            <div className="flex justify-between items-center max-w-4xl mx-auto">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentMainStepId === "enterprise" && currentSubStepId === "search"}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                上一步
              </Button>

              {isLastStep ? (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-step-emerald hover:bg-step-emerald/90 text-step-emerald-foreground"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      创建合同
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="bg-step-sky hover:bg-step-sky/90 text-step-sky-foreground"
                >
                  下一步
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
