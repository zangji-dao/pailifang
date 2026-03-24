"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Loader2, RotateCcw, Save, Cloud, CloudOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTabs } from "@/app/dashboard/tabs-context";

// 步骤配置和组件
import { mainSteps, getNextStep, getPrevStep } from "./_constants/steps";
import { VerticalStepIndicator } from "./_components/VerticalStepIndicator";
import { HorizontalSubStepIndicator } from "./_components/HorizontalSubStepIndicator";
import {
  SelectBaseStep,
  SelectTypeStep,
  SelectStationStep,
  UploadProofStep,
  ConfirmInfoStep,
  BusinessRegistrationStep,
  ContractStep,
  PaymentStep,
  OnboardingCompleteStep,
} from "./_components/steps";
import { useFormPersistence } from "./_hooks/useFormPersistence";

// 类型定义
type EnterpriseType = "tenant" | "non_tenant";

interface Base {
  id: string;
  name: string;
  address: string | null;
}

interface AvailableRegNumber {
  id: string;
  code: string;
  manualCode: string | null;
  spaceId: string;
  spaceName: string;
  meterName: string;
  fullAddress: string | null;
  assignedEnterpriseName: string | null;
}

interface ProofFile {
  name: string;
  url: string;
  size: number;
}

// 表单状态接口
interface FormState {
  // 草稿ID（保存到数据库后返回）
  draftId: string | null;

  // 步骤状态
  currentMainStepId: string;
  currentSubStepId: string;
  completedMainSteps: string[];
  completedSubSteps: string[];

  // 步骤1：分配地址
  selectedBaseId: string;
  enterpriseType: EnterpriseType | null;
  enterpriseCode: string;
  selectedRegNumber: AvailableRegNumber | null;
  proofFiles: ProofFile[];
  enterpriseName: string;
  remarks: string;

  // 步骤2：工商注册
  businessLicense: { name: string; url: string } | null;
  creditCode: string;
  legalPerson: string;
  phone: string;
  industry: string;
  registeredCapital: string;
  establishDate: string;
  registeredAddress: string;
  businessScope: string;

  // 步骤3：签订合同
  contract: {
    contractId: string | null;
    contractNumber: string;
  } | null;

  // 步骤4：费用缴纳
  paymentRecordIds: string[];
  paymentRecordCount: number;
  totalPaymentAmount: number;
}

// 初始状态
const initialFormState: FormState = {
  draftId: null,

  currentMainStepId: "address",
  currentSubStepId: "select_base",
  completedMainSteps: [],
  completedSubSteps: [],

  selectedBaseId: "",
  enterpriseType: null,
  enterpriseCode: "",
  selectedRegNumber: null,
  proofFiles: [],
  enterpriseName: "",
  remarks: "",

  businessLicense: null,
  creditCode: "",
  legalPerson: "",
  phone: "",
  industry: "",
  registeredCapital: "",
  establishDate: "",
  registeredAddress: "",
  businessScope: "",

  contract: null,
  paymentRecordIds: [],
  paymentRecordCount: 0,
  totalPaymentAmount: 0,
};

export default function NewTenantPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const tabs = useTabs();

  // 基地列表（不需要持久化）
  const [bases, setBases] = useState<Base[]>([]);

  // 使用持久化 hook 管理表单状态
  const [formState, updateFormState, clearFormCache] = useFormPersistence<FormState>(initialFormState);

  // 状态
  const [submitting, setSubmitting] = useState(false);
  const [createdEnterpriseId, setCreatedEnterpriseId] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // 解构表单状态
  const {
    draftId,
    currentMainStepId,
    currentSubStepId,
    completedMainSteps,
    completedSubSteps,
    selectedBaseId,
    enterpriseType,
    enterpriseCode,
    selectedRegNumber,
    proofFiles,
    enterpriseName,
    remarks,
    businessLicense,
    creditCode,
    legalPerson,
    phone,
    industry,
    registeredCapital,
    establishDate,
    registeredAddress,
    businessScope,
    contract,
    paymentRecordIds,
    paymentRecordCount,
    totalPaymentAmount,
  } = formState;

  // 加载基地列表和继续注册的企业数据
  // 使用 ref 防止重复初始化
  const initializedRef = useRef(false);
  
  useEffect(() => {
    const fetchData = async () => {
      // 加载基地列表
      try {
        const res = await fetch("/api/bases");
        const result = await res.json();
        if (result.success) {
          setBases(result.data || []);
        }
      } catch (error) {
        console.error("获取基地列表失败:", error);
      }

      // 如果已经初始化过，不再重复处理
      if (initializedRef.current) {
        return;
      }
      initializedRef.current = true;

      // 检查 URL 参数
      const isNewPage = searchParams.get('new') === 'true';
      const continueId = searchParams.get('continue');
      
      // 如果是新建页面（从侧边栏点击进入），清空之前的数据
      if (isNewPage) {
        clearFormCache();
        return;
      }

      // 如果有继续注册的企业ID，从数据库加载
      if (continueId && !draftId) {
        try {
          const res = await fetch(`/api/enterprises/${continueId}`);
          const result = await res.json();
          if (result.success && result.data) {
            const enterprise = result.data;
            
            // 根据企业状态确定当前步骤
            let mainStepId = "registration";
            let subStepId = "upload_license";
            
            if (enterprise.process_status === 'draft') {
              mainStepId = "address";
              subStepId = "select_base";
            } else if (enterprise.process_status === 'pending_registration' || enterprise.process_status === 'pending_change') {
              mainStepId = "registration";
              subStepId = "upload_license";
            } else if (enterprise.process_status === 'pending_contract') {
              mainStepId = "contract";
              subStepId = "select_contract";
            } else if (enterprise.process_status === 'pending_payment') {
              mainStepId = "payment";
              subStepId = "pay_fees";
            }

            // 填充表单数据
            updateFormState({
              draftId: enterprise.id,
              enterpriseCode: enterprise.enterprise_code,
              enterpriseName: enterprise.name,
              enterpriseType: enterprise.type,
              creditCode: enterprise.credit_code || "",
              legalPerson: enterprise.legal_person || "",
              phone: enterprise.phone || "",
              industry: enterprise.industry || "",
              remarks: enterprise.business_scope || "",
              currentMainStepId: mainStepId,
              currentSubStepId: subStepId,
              selectedRegNumber: enterprise.space_id ? {
                id: "",
                code: enterprise.registration_number || "",
                manualCode: enterprise.registration_number,
                spaceId: enterprise.space_id,
                spaceName: "",
                meterName: "",
                fullAddress: enterprise.registered_address,
                assignedEnterpriseName: null,
              } : null,
            });

            toast({
              title: "已加载企业数据",
              description: `继续为「${enterprise.name}」完成注册流程`,
            });
          }
        } catch (error) {
          console.error("加载企业数据失败:", error);
          toast({
            title: "加载失败",
            description: "无法加载企业数据",
            variant: "destructive",
          });
        }
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 获取当前大步骤和子步骤信息
  const currentMainStep = mainSteps.find(s => s.id === currentMainStepId);
  const currentSubStep = currentMainStep?.subSteps.find(s => s.id === currentSubStepId);

  // 判断是否是非入驻企业
  const isNonTenant = enterpriseType === "non_tenant";

  // 步骤验证
  const validateCurrentStep = useCallback((): boolean => {
    switch (`${currentMainStepId}_${currentSubStepId}`) {
      case "address_select_base":
        return selectedBaseId !== "";
      case "address_select_type":
        return enterpriseType !== null;
      case "address_select_station":
        if (isNonTenant) return true;
        return selectedRegNumber !== null;
      case "address_upload_proof":
        if (isNonTenant) return true;
        return proofFiles.length > 0;
      case "address_confirm_info":
        return enterpriseName.trim() !== "";
      case "registration_upload_license":
        // 工商注册步骤：需要上传营业执照并填写基本信息
        return businessLicense !== null && creditCode.trim() !== "" && legalPerson.trim() !== "";
      case "contract_select_contract":
        // 签订合同步骤：需要选择一个合同
        return contract?.contractId !== null && contract?.contractId !== undefined;
      case "payment_pay_fees":
        // 费用缴纳步骤：至少关联一条收款记录
        return paymentRecordIds.length > 0;
      case "complete_review_all":
        return true;
      default:
        return true;
    }
  }, [currentMainStepId, currentSubStepId, selectedBaseId, enterpriseType, selectedRegNumber, proofFiles, enterpriseName, businessLicense, creditCode, legalPerson, contract, paymentRecordIds, isNonTenant]);

  // 保存草稿到数据库
  const saveDraft = useCallback(async (step?: string) => {
    if (!enterpriseCode || submitting) return;

    setSavingDraft(true);
    try {
      const requestData: Record<string, any> = {
        draft_id: draftId,
        enterprise_code: enterpriseCode,
        name: enterpriseName || `草稿-${enterpriseCode}`,
        type: enterpriseType,
        space_id: selectedRegNumber?.spaceId || null,
        registered_address: registeredAddress || selectedRegNumber?.fullAddress || null,
        business_address: selectedRegNumber?.fullAddress || null,
        business_scope: businessScope || remarks || null,
        credit_code: creditCode || null,
        legal_person: legalPerson || null,
        phone: phone || null,
        industry: industry || null,
        registered_capital: registeredCapital || null,
        establish_date: establishDate || null,
        current_step: step || currentMainStepId,
        // 添加工位号信息，用于关联
        registration_number_id: selectedRegNumber?.id || null,
        registration_number: selectedRegNumber?.manualCode || selectedRegNumber?.code || null,
      };

      const res = await fetch("/api/enterprises/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const result = await res.json();
      if (result.success) {
        // 更新草稿ID
        if (result.data?.id && !draftId) {
          updateFormState({ draftId: result.data.id });
        }
        setLastSavedAt(new Date());
      } else {
        console.error("保存草稿失败:", result.error);
      }
    } catch (error) {
      console.error("保存草稿失败:", error);
    } finally {
      setSavingDraft(false);
    }
  }, [draftId, enterpriseCode, enterpriseName, enterpriseType, selectedBaseId, selectedRegNumber, proofFiles, remarks, creditCode, legalPerson, phone, industry, registeredCapital, establishDate, registeredAddress, businessScope, currentMainStepId, submitting, updateFormState]);

  // 下一步
  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) {
      toast({
        title: "请完善信息",
        description: "请完成当前步骤的必填信息",
        variant: "destructive",
      });
      return;
    }

    // 标记当前步骤完成
    const stepKey = `${currentMainStepId}_${currentSubStepId}`;
    const newCompletedSubSteps = completedSubSteps.includes(stepKey)
      ? completedSubSteps
      : [...completedSubSteps, stepKey];

    // 获取下一步
    const nextStep = getNextStep(currentMainStepId, currentSubStepId, isNonTenant);
    if (nextStep) {
      // 检查是否需要标记大步骤完成
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

      // 如果完成了某个大步骤，自动保存草稿
      if (isCompletingMainStep && currentMainStepId !== "complete") {
        saveDraft(currentMainStepId);
        toast({
          title: "进度已保存",
          description: `${mainSteps.find(s => s.id === currentMainStepId)?.title || "当前步骤"}已完成并保存`,
        });
      }
    }
  }, [currentMainStepId, currentSubStepId, isNonTenant, validateCurrentStep, toast, completedMainSteps, completedSubSteps, updateFormState, saveDraft]);

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

  // 重置表单
  const handleReset = useCallback(async () => {
    if (!confirm("确定要重置表单吗？所有已填写的数据将被清除。")) return;

    // 如果有草稿ID，删除数据库中的草稿
    if (draftId) {
      try {
        await fetch(`/api/enterprises/draft?id=${draftId}`, { method: "DELETE" });
      } catch (e) {
        console.error("删除草稿失败:", e);
      }
    }

    clearFormCache();
    setLastSavedAt(null);
    toast({ title: "表单已重置" });
  }, [draftId, clearFormCache, toast]);

  // 提交企业
  const handleSubmit = useCallback(async () => {
    if (!enterpriseName.trim()) {
      toast({ title: "请输入企业名称", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const selectedBase = bases.find(b => b.id === selectedBaseId);

      const requestData: any = {
        name: enterpriseName,
        enterprise_code: enterpriseCode,
        type: enterpriseType,
        base_id: selectedBaseId,
        status: "active",
        business_scope: remarks || null,
        registered_address: selectedRegNumber?.fullAddress || null,
        business_address: selectedRegNumber?.fullAddress || null,
        credit_code: creditCode || null,
        legal_person: legalPerson || null,
        phone: phone || null,
        industry: industry || null,
      };

      // 入驻企业需要上传证明和绑定工位
      if (enterpriseType === "tenant") {
        requestData.proof_documents = proofFiles;
        if (selectedRegNumber) {
          requestData.space_id = selectedRegNumber.spaceId;
          requestData.registration_number_id = selectedRegNumber.id;
          requestData.registration_number = selectedRegNumber.manualCode || selectedRegNumber.code;
        }
      }

      // 合同信息 - 关联已有合同
      if (contract?.contractId) {
        requestData.contract_id = contract.contractId;
      }

      // 费用信息 - 关联收款记录ID
      if (paymentRecordIds.length > 0) {
        requestData.payment_record_ids = paymentRecordIds;
      }

      const res = await fetch("/api/enterprises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || "创建企业失败");
      }

      // 创建成功，清除缓存
      clearFormCache();
      setCreatedEnterpriseId(result.data?.id);
      toast({ title: "创建成功", description: `企业 ${enterpriseName} 已成功创建` });
    } catch (error: any) {
      console.error("提交失败:", error);
      toast({ title: "创建失败", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [enterpriseName, enterpriseCode, enterpriseType, selectedBaseId, remarks, selectedRegNumber, proofFiles, creditCode, legalPerson, phone, industry, contract, paymentRecordIds, bases, toast, clearFormCache]);

  // 获取基地名称
  const getBaseName = () => bases.find(b => b.id === selectedBaseId)?.name || "";

  // 渲染步骤内容
  const renderStepContent = () => {
    // 完成页面
    if (createdEnterpriseId) {
      return (
        <OnboardingCompleteStep
          enterpriseName={enterpriseName}
          enterpriseCode={enterpriseCode}
          enterpriseType={enterpriseType}
          baseName={getBaseName()}
          selectedRegNumber={selectedRegNumber ? {
            code: selectedRegNumber.code,
            manualCode: selectedRegNumber.manualCode,
            fullAddress: selectedRegNumber.fullAddress,
          } : null}
          creditCode={creditCode}
          legalPerson={legalPerson}
          phone={phone}
          contract={contract}
          paymentRecordCount={paymentRecordCount}
          totalPaymentAmount={totalPaymentAmount}
          onViewDetails={() => {
            // 关闭当前标签页并打开企业详情页
            if (tabs) {
              tabs.closeCurrentTabAndNavigate(`/dashboard/base/tenants/${createdEnterpriseId}`);
            } else {
              router.push(`/dashboard/base/tenants/${createdEnterpriseId}`);
            }
          }}
          onReturnToList={() => {
            // 关闭当前标签页并返回企业列表
            if (tabs) {
              tabs.closeCurrentTabAndNavigate("/dashboard/base/tenants");
            } else {
              router.push("/dashboard/base/tenants");
            }
          }}
        />
      );
    }

    // 分配地址大步骤
    if (currentMainStepId === "address") {
      switch (currentSubStepId) {
        case "select_base":
          return (
            <SelectBaseStep
              selectedBaseId={selectedBaseId}
              onSelectBase={(id) => updateFormState({ selectedBaseId: id })}
            />
          );
        case "select_type":
          return (
            <SelectTypeStep
              enterpriseType={enterpriseType}
              enterpriseCode={enterpriseCode}
              onSelectType={(type) => {
                const prefix = type === "tenant" ? "RQ" : "NQ";
                const timestamp = Date.now().toString().slice(-8);
                updateFormState({
                  enterpriseType: type,
                  enterpriseCode: `${prefix}-${timestamp}`,
                });
              }}
            />
          );
        case "select_station":
          if (isNonTenant) {
            return null;
          }
          return (
            <SelectStationStep
              baseId={selectedBaseId}
              selectedRegNumber={selectedRegNumber ? {
                id: selectedRegNumber.id,
                code: selectedRegNumber.code,
                manualCode: selectedRegNumber.manualCode,
                spaceId: selectedRegNumber.spaceId,
                spaceName: selectedRegNumber.spaceName,
                meterName: selectedRegNumber.meterName,
                fullAddress: selectedRegNumber.fullAddress,
                assignedEnterpriseName: selectedRegNumber.assignedEnterpriseName,
              } : null}
              onSelectRegNumber={(reg) => {
                updateFormState({
                  selectedRegNumber: reg,
                  ...(reg?.assignedEnterpriseName ? { enterpriseName: reg.assignedEnterpriseName } : {}),
                });
              }}
            />
          );
        case "upload_proof":
          if (isNonTenant) {
            return null;
          }
          return (
            <UploadProofStep
              selectedRegNumber={selectedRegNumber ? {
                id: selectedRegNumber.id,
                code: selectedRegNumber.code,
                manualCode: selectedRegNumber.manualCode,
                assignedEnterpriseName: selectedRegNumber.assignedEnterpriseName,
              } : null}
              proofFiles={proofFiles}
              onUpdateProofFiles={(files) => updateFormState({ proofFiles: files })}
            />
          );
        case "confirm_info":
          return (
            <ConfirmInfoStep
              enterpriseName={enterpriseName}
              enterpriseCode={enterpriseCode}
              enterpriseType={enterpriseType}
              baseName={getBaseName()}
              selectedRegNumber={selectedRegNumber ? {
                code: selectedRegNumber.code,
                manualCode: selectedRegNumber.manualCode,
                fullAddress: selectedRegNumber.fullAddress,
                assignedEnterpriseName: selectedRegNumber.assignedEnterpriseName,
              } : null}
              proofFiles={proofFiles}
              remarks={remarks}
              onUpdateEnterpriseName={(name) => updateFormState({ enterpriseName: name })}
              onUpdateRemarks={(text) => updateFormState({ remarks: text })}
            />
          );
      }
    }

    // 工商注册大步骤
    if (currentMainStepId === "registration") {
      return (
        <BusinessRegistrationStep
          enterpriseName={enterpriseName}
          businessLicense={businessLicense}
          creditCode={creditCode}
          legalPerson={legalPerson}
          phone={phone}
          industry={industry}
          registeredCapital={registeredCapital}
          establishDate={establishDate}
          registeredAddress={registeredAddress}
          businessScope={businessScope}
          onUpdateBusinessLicense={(license) => updateFormState({ businessLicense: license })}
          onUpdateCreditCode={(code) => updateFormState({ creditCode: code })}
          onUpdateLegalPerson={(person) => updateFormState({ legalPerson: person })}
          onUpdatePhone={(p) => updateFormState({ phone: p })}
          onUpdateIndustry={(ind) => updateFormState({ industry: ind })}
          onUpdateEnterpriseName={(name) => updateFormState({ enterpriseName: name })}
          onUpdateBusinessScope={(scope) => updateFormState({ businessScope: scope })}
          onUpdateRegisteredCapital={(capital) => updateFormState({ registeredCapital: capital })}
          onUpdateEstablishDate={(date) => updateFormState({ establishDate: date })}
          onUpdateRegisteredAddress={(address) => updateFormState({ registeredAddress: address })}
        />
      );
    }

    // 签订合同大步骤
    if (currentMainStepId === "contract") {
      return (
        <ContractStep
          enterpriseName={enterpriseName}
          enterpriseId={draftId}
          contract={contract}
          onUpdateContract={(c) => updateFormState({ contract: c })}
        />
      );
    }

    // 费用缴纳大步骤
    if (currentMainStepId === "payment") {
      return (
        <PaymentStep
          enterpriseId={createdEnterpriseId}
          enterpriseName={enterpriseName}
          paymentRecordIds={formState.paymentRecordIds}
          onUpdatePaymentRecords={(ids, count, totalAmount) => 
            updateFormState({ 
              paymentRecordIds: ids,
              paymentRecordCount: count,
              totalPaymentAmount: totalAmount
            })
          }
        />
      );
    }

    return null;
  };

  // 判断是否是最后一步
  const isLastStep = currentMainStepId === "complete";

  // 检查是否有草稿数据
  const hasDraftData = selectedBaseId || enterpriseType || enterpriseName || selectedRegNumber;

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
        {currentMainStep && currentMainStep.subSteps.length > 1 && !createdEnterpriseId && (
          <HorizontalSubStepIndicator
            subSteps={currentMainStep.subSteps}
            currentSubStepId={currentSubStepId}
            completedSubSteps={new Set(completedSubSteps)}
            mainStepId={currentMainStepId}
            onSubStepClick={handleSubStepClick}
          />
        )}

        {/* 页面标题 */}
        {!createdEnterpriseId && (
          <div className="px-6 py-4 border-b bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => window.close()}
                  title="关闭页面"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-bold">
                    {currentMainStep?.title || "企业入驻"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {currentSubStep?.description || ""}
                  </p>
                </div>
              </div>
              {/* 草稿提示和重置按钮 */}
              {hasDraftData && (
                <div className="flex items-center gap-3">
                  {/* 保存状态 */}
                  <div className="flex items-center gap-2">
                    {savingDraft ? (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        保存中...
                      </span>
                    ) : draftId ? (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        <Check className="w-3 h-3" />
                        {lastSavedAt ? `已保存 ${lastSavedAt.toLocaleTimeString()}` : "已保存到云端"}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        <CloudOff className="w-3 h-3" />
                        本地暂存
                      </span>
                    )}
                  </div>
                  {/* 手动保存按钮 */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => saveDraft()}
                    disabled={savingDraft || !enterpriseCode}
                    className="h-7 text-xs"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    保存
                  </Button>
                  {/* 重置按钮 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="text-muted-foreground hover:text-destructive h-7 text-xs"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    重置
                  </Button>
                </div>
              )}
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
        {!createdEnterpriseId && (
          <div className="border-t bg-card px-6 py-4">
            <div className="flex justify-between items-center max-w-4xl mx-auto">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentMainStepId === "address" && currentSubStepId === "select_base"}
                className="border-slate-300 hover:bg-slate-50 hover:text-slate-700"
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
                      <Check className="w-4 h-4 mr-2" />
                      完成入驻
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
