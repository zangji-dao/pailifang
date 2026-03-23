"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

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

interface Fee {
  id: string;
  name: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  proofUrl: string | null;
  status: "pending" | "paid" | "verified";
}

export default function NewTenantPage() {
  const router = useRouter();
  const { toast } = useToast();

  // ========== 步骤状态 ==========
  const [currentMainStepId, setCurrentMainStepId] = useState("address");
  const [currentSubStepId, setCurrentSubStepId] = useState("select_base");
  const [completedMainSteps, setCompletedMainSteps] = useState<Set<string>>(new Set());
  const [completedSubSteps, setCompletedSubSteps] = useState<Set<string>>(new Set());

  // ========== 表单数据 ==========
  // 步骤1：分配地址
  const [bases, setBases] = useState<Base[]>([]);
  const [selectedBaseId, setSelectedBaseId] = useState<string>("");
  const [enterpriseType, setEnterpriseType] = useState<EnterpriseType | null>(null);
  const [enterpriseCode, setEnterpriseCode] = useState<string>("");
  const [selectedRegNumber, setSelectedRegNumber] = useState<AvailableRegNumber | null>(null);
  const [proofFiles, setProofFiles] = useState<ProofFile[]>([]);
  const [enterpriseName, setEnterpriseName] = useState("");
  const [remarks, setRemarks] = useState("");

  // 步骤2：工商注册
  const [businessLicense, setBusinessLicense] = useState<{ name: string; url: string } | null>(null);
  const [creditCode, setCreditCode] = useState("");
  const [legalPerson, setLegalPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState("");

  // 步骤3：签订合同
  const [contract, setContract] = useState<{
    contractNumber: string;
    startDate: string;
    endDate: string;
    monthlyRent: number;
    deposit: number;
    signature: string | null;
  } | null>(null);

  // 步骤4：费用缴纳
  const [fees, setFees] = useState<Fee[]>([]);

  // ========== 状态 ==========
  const [submitting, setSubmitting] = useState(false);
  const [createdEnterpriseId, setCreatedEnterpriseId] = useState<string | null>(null);

  // 加载基地列表
  useEffect(() => {
    const fetchBases = async () => {
      try {
        const res = await fetch("/api/bases");
        const result = await res.json();
        if (result.success) {
          setBases(result.data || []);
        }
      } catch (error) {
        console.error("获取基地列表失败:", error);
      }
    };
    fetchBases();
  }, []);

  // 获取当前大步骤和子步骤信息
  const currentMainStep = mainSteps.find(s => s.id === currentMainStepId);
  const currentSubStep = currentMainStep?.subSteps.find(s => s.id === currentSubStepId);

  // 判断是否是非入驻企业
  const isNonTenant = enterpriseType === "non_tenant";

  // 判断是否可以跳过当前步骤
  const canSkipCurrentStep = useCallback(() => {
    if (!currentSubStep) return false;
    return isNonTenant && currentSubStep.isOptional;
  }, [currentSubStep, isNonTenant]);

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
        return businessLicense !== null;
      case "registration_fill_info":
        return creditCode.trim() !== "" && legalPerson.trim() !== "";
      case "contract_review_contract":
      case "contract_sign_contract":
        return contract?.signature !== null;
      case "payment_view_fees":
      case "payment_upload_payment":
        return true;
      case "payment_confirm_payment":
        return fees.some(f => f.status === "paid" || f.status === "verified");
      case "complete_review_all":
        return true;
      default:
        return true;
    }
  }, [currentMainStepId, currentSubStepId, selectedBaseId, enterpriseType, selectedRegNumber, proofFiles, enterpriseName, businessLicense, creditCode, legalPerson, contract, fees, isNonTenant]);

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
    setCompletedSubSteps(prev => new Set([...prev, `${currentMainStepId}_${currentSubStepId}`]));

    // 获取下一步
    const nextStep = getNextStep(currentMainStepId, currentSubStepId, isNonTenant);
    if (nextStep) {
      // 检查是否需要标记大步骤完成
      if (nextStep.mainStepId !== currentMainStepId) {
        setCompletedMainSteps(prev => new Set([...prev, currentMainStepId]));
      }
      setCurrentMainStepId(nextStep.mainStepId);
      setCurrentSubStepId(nextStep.subStepId);
    }
  }, [currentMainStepId, currentSubStepId, isNonTenant, validateCurrentStep, toast]);

  // 上一步
  const handlePrev = useCallback(() => {
    const prevStep = getPrevStep(currentMainStepId, currentSubStepId);
    if (prevStep) {
      setCurrentMainStepId(prevStep.mainStepId);
      setCurrentSubStepId(prevStep.subStepId);
    }
  }, [currentMainStepId, currentSubStepId]);

  // 跳转到大步骤
  const handleMainStepClick = useCallback((stepId: string) => {
    // 只能跳转到已完成或当前大步骤
    const stepIndex = mainSteps.findIndex(s => s.id === stepId);
    const currentIndex = mainSteps.findIndex(s => s.id === currentMainStepId);
    
    if (stepIndex <= currentIndex || completedMainSteps.has(stepId)) {
      const targetStep = mainSteps[stepIndex];
      setCurrentMainStepId(stepId);
      setCurrentSubStepId(targetStep.subSteps[0].id);
    }
  }, [currentMainStepId, completedMainSteps]);

  // 跳转到子步骤
  const handleSubStepClick = useCallback((subStepId: string) => {
    if (!currentMainStep) return;
    
    // 只能跳转到已完成的子步骤
    const subStepIndex = currentMainStep.subSteps.findIndex(s => s.id === subStepId);
    const currentIndex = currentMainStep.subSteps.findIndex(s => s.id === currentSubStepId);
    
    if (subStepIndex <= currentIndex || completedSubSteps.has(`${currentMainStepId}_${subStepId}`)) {
      setCurrentSubStepId(subStepId);
    }
  }, [currentMainStep, currentSubStepId, completedSubSteps]);

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

      // 合同信息
      if (contract) {
        requestData.contract = {
          contract_number: contract.contractNumber,
          start_date: contract.startDate,
          end_date: contract.endDate,
          monthly_rent: contract.monthlyRent,
          deposit: contract.deposit,
          signature: contract.signature,
        };
      }

      // 费用信息
      if (fees.length > 0) {
        requestData.fees = fees.map(f => ({
          name: f.name,
          amount: f.amount,
          payment_method: f.paymentMethod,
          payment_date: f.paymentDate,
          proof_url: f.proofUrl,
          status: f.status,
        }));
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

      setCreatedEnterpriseId(result.data?.id);
      toast({ title: "创建成功", description: `企业 ${enterpriseName} 已成功创建` });
    } catch (error: any) {
      console.error("提交失败:", error);
      toast({ title: "创建失败", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [enterpriseName, enterpriseCode, enterpriseType, selectedBaseId, remarks, selectedRegNumber, proofFiles, creditCode, legalPerson, phone, industry, contract, fees, bases, toast]);

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
          fees={fees}
          onViewDetails={() => router.push(`/dashboard/base/tenants/${createdEnterpriseId}`)}
          onReturnToList={() => router.push("/dashboard/base/tenants")}
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
              onSelectBase={setSelectedBaseId}
            />
          );
        case "select_type":
          return (
            <SelectTypeStep
              enterpriseType={enterpriseType}
              enterpriseCode={enterpriseCode}
              onSelectType={(type) => {
                setEnterpriseType(type);
                // 生成企业编号
                const prefix = type === "tenant" ? "RQ" : "NQ";
                const timestamp = Date.now().toString().slice(-8);
                setEnterpriseCode(`${prefix}-${timestamp}`);
              }}
            />
          );
        case "select_station":
          if (isNonTenant) {
            return null; // 非入驻企业跳过
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
                setSelectedRegNumber(reg);
                if (reg?.assignedEnterpriseName) {
                  setEnterpriseName(reg.assignedEnterpriseName);
                }
              }}
            />
          );
        case "upload_proof":
          if (isNonTenant) {
            return null; // 非入驻企业跳过
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
              onUpdateProofFiles={setProofFiles}
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
              onUpdateEnterpriseName={setEnterpriseName}
              onUpdateRemarks={setRemarks}
            />
          );
      }
    }

    // 工商注册大步骤
    if (currentMainStepId === "registration") {
      switch (currentSubStepId) {
        case "upload_license":
        case "fill_info":
          return (
            <BusinessRegistrationStep
              enterpriseName={enterpriseName}
              businessLicense={businessLicense}
              creditCode={creditCode}
              legalPerson={legalPerson}
              phone={phone}
              industry={industry}
              onUpdateBusinessLicense={setBusinessLicense}
              onUpdateCreditCode={setCreditCode}
              onUpdateLegalPerson={setLegalPerson}
              onUpdatePhone={setPhone}
              onUpdateIndustry={setIndustry}
            />
          );
      }
    }

    // 签订合同大步骤
    if (currentMainStepId === "contract") {
      return (
        <ContractStep
          enterpriseName={enterpriseName}
          contract={contract}
          onUpdateContract={setContract}
        />
      );
    }

    // 费用缴纳大步骤
    if (currentMainStepId === "payment") {
      return (
        <PaymentStep
          enterpriseName={enterpriseName}
          fees={fees}
          onUpdateFees={setFees}
        />
      );
    }

    return null;
  };

  // 判断是否是最后一步
  const isLastStep = currentMainStepId === "complete";

  return (
    <div className="flex h-[calc(100vh-7rem)]">
      {/* 左侧垂直步骤指示器 */}
      <VerticalStepIndicator
        steps={mainSteps.map(s => ({
          ...s,
          status: completedMainSteps.has(s.id) 
            ? "completed" 
            : s.id === currentMainStepId 
              ? "in_progress" 
              : "pending"
        }))}
        currentMainStepId={currentMainStepId}
        completedMainSteps={completedMainSteps}
        onStepClick={handleMainStepClick}
      />

      {/* 右侧内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部子步骤指示器 */}
        {currentMainStep && currentMainStep.subSteps.length > 1 && !createdEnterpriseId && (
          <HorizontalSubStepIndicator
            subSteps={currentMainStep.subSteps}
            currentSubStepId={currentSubStepId}
            completedSubSteps={completedSubSteps}
            mainStepId={currentMainStepId}
            onSubStepClick={handleSubStepClick}
          />
        )}

        {/* 页面标题 */}
        {!createdEnterpriseId && (
          <div className="px-6 py-4 border-b bg-card">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/base/tenants">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">
                  {currentMainStep?.title || "企业入驻"}
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
        {!createdEnterpriseId && (
          <div className="border-t bg-card px-6 py-4">
            <div className="flex justify-between items-center max-w-4xl mx-auto">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentMainStepId === "address" && currentSubStepId === "select_base"}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                上一步
              </Button>

              {isLastStep ? (
                <Button onClick={handleSubmit} disabled={submitting}>
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
                <Button onClick={handleNext}>
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
