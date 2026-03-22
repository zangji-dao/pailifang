"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  FileText,
  PenTool,
  CreditCard,
  CheckCircle2,
  Plus,
  Minus,
  Loader2,
  AlertCircle,
  Users,
  Store,
  Home,
  Hash,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

// 步骤定义 - 入驻企业
const TENANT_STEPS = [
  { id: 0, title: "选择类型", icon: Users },
  { id: 1, title: "分配房间", icon: Home },
  { id: 2, title: "工商办理", icon: FileText },
  { id: 3, title: "签订合同", icon: PenTool },
  { id: 4, title: "缴纳费用", icon: CreditCard },
  { id: 5, title: "完成入驻", icon: CheckCircle2 },
];

// 步骤定义 - 非入驻企业
const NON_TENANT_STEPS = [
  { id: 0, title: "选择类型", icon: Users },
  { id: 1, title: "基本信息", icon: Building2 },
  { id: 2, title: "完成创建", icon: CheckCircle2 },
];

// 企业类型
type EnterpriseType = "tenant" | "non_tenant";

// 可用工位号信息（从地址管理中选择）
interface AvailableRegNumber {
  id: string;
  code: string;
  spaceId: string;
  spaceName: string;
  spaceCode: string;
  meterName: string;
  meterCode: string;
  baseName: string;
  baseAddress: string | null;
  fullAddress: string | null;
}

export default function NewTenantPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // 从入驻审批跳转过来时，跳过类型选择
  const fromApproval = searchParams.get("from") === "approval";
  const prefillType = searchParams.get("type") as EnterpriseType | null;
  
  const [currentStep, setCurrentStep] = useState(fromApproval ? 1 : 0);
  const [submitting, setSubmitting] = useState(false);
  
  // 企业类型
  const [enterpriseType, setEnterpriseType] = useState<EnterpriseType | null>(prefillType);
  
  // 系统生成的企业编号
  const [enterpriseCode, setEnterpriseCode] = useState<string>("");
  
  // 步骤1：分配房间（入驻企业）- 选择已有工位号或手动输入
  const [availableRegNumbers, setAvailableRegNumbers] = useState<AvailableRegNumber[]>([]);
  const [selectedRegNumber, setSelectedRegNumber] = useState<AvailableRegNumber | null>(null);
  const [loadingRegNumbers, setLoadingRegNumbers] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [useManualAddress, setUseManualAddress] = useState(false);
  
  // 步骤2：工商办理（入驻企业）/ 基本信息（非入驻企业）
  const [enterpriseName, setEnterpriseName] = useState("");
  const [creditCode, setCreditCode] = useState("");
  const [legalPerson, setLegalPerson] = useState("");
  const [idCard, setIdCard] = useState("");
  const [phone, setPhone] = useState("");
  const [capital, setCapital] = useState("");
  const [businessScope, setBusinessScope] = useState("");
  const [industry, setIndustry] = useState("");
  const [businessType, setBusinessType] = useState<"register" | "change">("register");
  
  // 步骤3：签订合同（入驻企业）
  const [contractNumber, setContractNumber] = useState("");
  const [contractStartDate, setContractStartDate] = useState("");
  const [contractEndDate, setContractEndDate] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [deposit, setDeposit] = useState("");
  
  // 步骤4：缴纳费用（入驻企业）
  const [fees, setFees] = useState<{ name: string; amount: number; paid: boolean }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  
  // 完成后的企业ID
  const [createdEnterpriseId, setCreatedEnterpriseId] = useState<string | null>(null);

  // 获取当前步骤列表
  const steps = enterpriseType === "non_tenant" ? NON_TENANT_STEPS : TENANT_STEPS;

  // 加载可用工位号
  useEffect(() => {
    if (enterpriseType === "tenant" && currentStep === 1) {
      fetchAvailableRegNumbers();
    }
  }, [enterpriseType, currentStep]);

  // 生成合同编号
  useEffect(() => {
    if (enterpriseType === "tenant" && currentStep === 3 && !contractNumber) {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
      setContractNumber(`HT-${year}${month}-${random}`);
    }
  }, [enterpriseType, currentStep, contractNumber]);

  // 初始化费用列表
  useEffect(() => {
    if (enterpriseType === "tenant" && currentStep === 4 && fees.length === 0) {
      setFees([
        { name: "首月租金", amount: parseFloat(monthlyRent) || 0, paid: false },
        { name: "押金", amount: parseFloat(deposit) || 0, paid: false },
        { name: "物业费", amount: 0, paid: false },
      ]);
    }
  }, [enterpriseType, currentStep, fees.length, monthlyRent, deposit]);

  // 获取可用工位号列表
  const fetchAvailableRegNumbers = async () => {
    setLoadingRegNumbers(true);
    try {
      const res = await fetch("/api/registration-numbers/available");
      const result = await res.json();
      if (result.success) {
        setAvailableRegNumbers(result.data || []);
        // 如果没有可用工位号，自动切换到手动输入模式
        if (!result.data || result.data.length === 0) {
          setUseManualAddress(true);
        }
      } else {
        setUseManualAddress(true);
      }
    } catch (error) {
      console.error("获取可用工位号失败:", error);
      setUseManualAddress(true);
    } finally {
      setLoadingRegNumbers(false);
    }
  };

  // 跳转到地址管理
  const goToAddressManagement = () => {
    router.push("/dashboard/base/addresses");
  };

  // 选择企业类型
  const selectEnterpriseType = (type: EnterpriseType) => {
    setEnterpriseType(type);
    generateEnterpriseCode(type);
    setCurrentStep(1);
  };

  // 生成企业编号
  const generateEnterpriseCode = async (type: EnterpriseType) => {
    try {
      const res = await fetch("/api/enterprises/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const result = await res.json();
      if (result.success) {
        setEnterpriseCode(result.data.code);
      }
    } catch (error) {
      console.error("生成企业编号失败:", error);
      // 本地生成备用
      const prefix = type === "tenant" ? "RQ" : "NQ";
      const timestamp = Date.now().toString().slice(-8);
      setEnterpriseCode(`${prefix}-${timestamp}`);
    }
  };

  // 更新费用
  const updateFee = (index: number, field: string, value: any) => {
    const updated = [...fees];
    updated[index] = { ...updated[index], [field]: value };
    setFees(updated);
  };

  // 添加费用项
  const addFee = () => {
    setFees([...fees, { name: "新费用项", amount: 0, paid: false }]);
  };

  // 移除费用项
  const removeFee = (index: number) => {
    setFees(fees.filter((_, i) => i !== index));
  };

  // 步骤验证
  const validateStep = (step: number): boolean => {
    if (enterpriseType === "non_tenant") {
      if (step === 1) {
        return enterpriseName.trim() !== "" && legalPerson.trim() !== "";
      }
      return true;
    }
    
    // 入驻企业流程
    switch (step) {
      case 1:
        // 需要选择了工位号，或者使用手动输入地址
        return selectedRegNumber !== null || (useManualAddress && manualAddress.trim() !== "");
      case 2:
        return enterpriseName.trim() !== "" && legalPerson.trim() !== "";
      case 3:
        return contractNumber.trim() !== "" && contractStartDate !== "" && contractEndDate !== "";
      case 4:
        return true; // 费用可以稍后缴纳
      default:
        return true;
    }
  };

  // 下一步
  const nextStep = () => {
    if (!validateStep(currentStep)) {
      toast({
        title: "请完善信息",
        description: "请填写当前步骤的必填信息",
        variant: "destructive",
      });
      return;
    }
    
    const maxStep = enterpriseType === "non_tenant" ? 1 : 4;
    if (currentStep < maxStep) {
      setCurrentStep(currentStep + 1);
    }
  };

  // 上一步
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 提交企业
  const submitEnterprise = async () => {
    if (!validateStep(currentStep)) {
      toast({
        title: "请完善信息",
        description: "请填写当前步骤的必填信息",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    try {
      // 构建请求数据
      let registeredAddress = "";
      
      if (useManualAddress) {
        registeredAddress = manualAddress;
      } else if (selectedRegNumber) {
        registeredAddress = selectedRegNumber.fullAddress || 
          `${selectedRegNumber.baseAddress || ''} ${selectedRegNumber.meterName || ''} ${selectedRegNumber.spaceName || ''}`.trim();
      }

      const requestData: any = {
        name: enterpriseName,
        enterprise_code: enterpriseCode,
        credit_code: creditCode || null,
        legal_person: legalPerson,
        phone: phone || null,
        industry: industry || null,
        type: enterpriseType,
        status: "active",
        business_scope: businessScope || null,
        registered_address: registeredAddress,
        business_address: registeredAddress,
        settled_date: new Date().toISOString().split("T")[0],
      };

      // 入驻企业额外信息
      if (enterpriseType === "tenant") {
        if (selectedRegNumber) {
          requestData.space_id = selectedRegNumber.spaceId;
          requestData.registration_number_id = selectedRegNumber.id;
          requestData.registration_number = selectedRegNumber.code;
        }
        if (contractNumber) {
          requestData.contract = {
            contract_number: contractNumber,
            start_date: contractStartDate,
            end_date: contractEndDate,
            monthly_rent: parseFloat(monthlyRent) || 0,
            deposit: parseFloat(deposit) || 0,
          };
        }
        const paidFees = fees.filter(f => f.paid);
        if (paidFees.length > 0) {
          requestData.fees = paidFees.map(f => ({
            name: f.name,
            amount: f.amount,
            payment_method: paymentMethod,
            payment_date: paymentDate,
          }));
        }
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
      
      // 进入完成步骤
      const completeStep = enterpriseType === "non_tenant" ? 2 : 5;
      setCurrentStep(completeStep);

      toast({
        title: "创建成功",
        description: `企业 ${enterpriseName} 已成功创建，企业编号：${enterpriseCode}`,
      });
    } catch (error: any) {
      console.error("提交失败:", error);
      toast({
        title: "创建失败",
        description: error.message || "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 渲染步骤指示器
  const renderStepIndicator = () => {
    const displaySteps = enterpriseType === "non_tenant" 
      ? NON_TENANT_STEPS.filter(s => s.id > 0) 
      : TENANT_STEPS.filter(s => s.id > 0);
    
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {displaySteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep > step.id
                      ? "bg-green-500 text-white"
                      : currentStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className="mt-2 text-sm font-medium">{step.title}</span>
              </div>
              {index < displaySteps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 ${
                    currentStep > step.id ? "bg-green-500" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 步骤0：选择企业类型
  const renderStep0 = () => (
    <Card>
      <CardHeader>
        <CardTitle>选择企业类型</CardTitle>
        <CardDescription>请选择要创建的企业类型，不同类型对应不同的流程</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* 入驻企业 */}
          <Card 
            className={`cursor-pointer transition-all hover:border-primary hover:shadow-lg ${
              enterpriseType === "tenant" ? "border-primary ring-2 ring-primary/20" : ""
            }`}
            onClick={() => selectEnterpriseType("tenant")}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">入驻企业</h3>
              <p className="text-sm text-muted-foreground mb-4">
                在园区内分配房间或工位的企业
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• 分配房间（自动分配工位号）</p>
                <p>• 工商办理</p>
                <p>• 签订合同</p>
                <p>• 缴纳费用</p>
              </div>
            </CardContent>
          </Card>

          {/* 非入驻企业 */}
          <Card 
            className={`cursor-pointer transition-all hover:border-primary hover:shadow-lg ${
              enterpriseType === "non_tenant" ? "border-primary ring-2 ring-primary/20" : ""
            }`}
            onClick={() => selectEnterpriseType("non_tenant")}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center">
                <Store className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">非入驻企业</h3>
              <p className="text-sm text-muted-foreground mb-4">
                不在园区内入驻，仅使用园区服务的企业
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• 填写基本信息</p>
                <p>• 完成创建</p>
                <p className="text-green-600">• 流程更简单快捷</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 企业编号预览 */}
        {enterpriseCode && (
          <Alert className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              系统已为您分配企业编号：<strong className="text-primary">{enterpriseCode}</strong>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  // 步骤1（入驻企业）：选择工位号
  const renderStep1Tenant = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>分配房间</CardTitle>
          <CardDescription>选择已生成的工位号，或手动输入注册地址</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 企业编号 */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              企业编号：<strong className="text-primary">{enterpriseCode}</strong>
            </AlertDescription>
          </Alert>

          {/* 切换模式 */}
          <div className="flex items-center gap-4">
            <Button
              variant={!useManualAddress ? "default" : "outline"}
              size="sm"
              onClick={() => setUseManualAddress(false)}
            >
              选择工位号
            </Button>
            <Button
              variant={useManualAddress ? "default" : "outline"}
              size="sm"
              onClick={() => setUseManualAddress(true)}
            >
              手动输入地址
            </Button>
          </div>

          {useManualAddress ? (
            // 手动输入地址
            <div className="space-y-2">
              <Label>注册地址 *</Label>
              <Input
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="请输入企业注册地址，如：吉林省松原市宁江区义乌城A座101室"
              />
              <p className="text-xs text-muted-foreground">
                如果系统中暂无可用工位号，可以手动输入注册地址
              </p>
            </div>
          ) : loadingRegNumbers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : availableRegNumbers.length === 0 ? (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  暂无可用工位号，请先在地址管理中生成工位号
                </AlertDescription>
              </Alert>
              <Button variant="outline" onClick={goToAddressManagement}>
                前往地址管理
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Label>选择工位号</Label>
              <div className="grid grid-cols-1 gap-3">
                {availableRegNumbers.map((reg) => {
                  const isSelected = selectedRegNumber?.id === reg.id;
                  
                  return (
                    <div
                      key={reg.id}
                      onClick={() => setSelectedRegNumber(reg)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-purple-500 bg-purple-50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                              <Hash className="h-3 w-3 mr-1" />
                              {reg.code}
                            </Badge>
                            <span className="font-medium">{reg.baseName}</span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-2 space-y-1">
                            <p>物业：{reg.meterName || reg.meterCode}</p>
                            <p>空间：{reg.spaceName || reg.spaceCode}</p>
                            {reg.fullAddress && (
                              <p className="text-xs">地址：{reg.fullAddress}</p>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-purple-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* 提示：可以前往地址管理生成更多工位号 */}
              <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
                <span>共 {availableRegNumbers.length} 个可用工位号</span>
                <Button variant="link" size="sm" onClick={goToAddressManagement}>
                  前往地址管理生成更多
                </Button>
              </div>
            </div>
          )}

          {/* 选中信息汇总 */}
          {selectedRegNumber && !useManualAddress && (
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                <div className="space-y-1">
                  <p>工位号：<strong>{selectedRegNumber.code}</strong></p>
                  <p>基地：<strong>{selectedRegNumber.baseName}</strong></p>
                  <p>物业：<strong>{selectedRegNumber.meterName || selectedRegNumber.meterCode}</strong></p>
                  <p>空间：<strong>{selectedRegNumber.spaceName || selectedRegNumber.spaceCode}</strong></p>
                  {selectedRegNumber.fullAddress && (
                    <p>注册地址：<strong>{selectedRegNumber.fullAddress}</strong></p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  // 步骤1（非入驻企业）/ 步骤2（入驻企业）：基本信息/工商办理
  const renderEnterpriseForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>{enterpriseType === "non_tenant" ? "基本信息" : "工商办理"}</CardTitle>
        <CardDescription>
          {enterpriseType === "non_tenant" 
            ? "填写企业的基本信息" 
            : "填写企业的工商登记信息"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 企业编号 */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            企业编号：<strong className="text-primary">{enterpriseCode}</strong>
            {enterpriseType === "tenant" && (selectedRegNumber || manualAddress) && (
              <span className="ml-4">注册地址：<strong>
                {useManualAddress ? manualAddress : selectedRegNumber?.fullAddress}
              </strong></span>
            )}
          </AlertDescription>
        </Alert>

        {/* 入驻企业的办理类型 */}
        {enterpriseType === "tenant" && (
          <div className="space-y-2">
            <Label>办理类型</Label>
            <div className="flex gap-4">
              <Button
                variant={businessType === "register" ? "default" : "outline"}
                onClick={() => setBusinessType("register")}
              >
                新注册
              </Button>
              <Button
                variant={businessType === "change" ? "default" : "outline"}
                onClick={() => setBusinessType("change")}
              >
                变更
              </Button>
            </div>
          </div>
        )}

        <Separator />

        {/* 基本信息 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>企业名称 *</Label>
            <Input
              value={enterpriseName}
              onChange={(e) => setEnterpriseName(e.target.value)}
              placeholder="请输入企业名称"
            />
          </div>
          <div className="space-y-2">
            <Label>统一社会信用代码</Label>
            <Input
              value={creditCode}
              onChange={(e) => setCreditCode(e.target.value)}
              placeholder="请输入统一社会信用代码"
            />
          </div>
          <div className="space-y-2">
            <Label>法定代表人 *</Label>
            <Input
              value={legalPerson}
              onChange={(e) => setLegalPerson(e.target.value)}
              placeholder="请输入法定代表人姓名"
            />
          </div>
          <div className="space-y-2">
            <Label>身份证号</Label>
            <Input
              value={idCard}
              onChange={(e) => setIdCard(e.target.value)}
              placeholder="请输入法定代表人身份证号"
            />
          </div>
          <div className="space-y-2">
            <Label>联系电话</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入联系电话"
            />
          </div>
          <div className="space-y-2">
            <Label>注册资本(万元)</Label>
            <Input
              value={capital}
              onChange={(e) => setCapital(e.target.value)}
              placeholder="请输入注册资本"
              type="number"
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>所属行业</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger>
                <SelectValue placeholder="请选择行业" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="油田技服">油田技服</SelectItem>
                <SelectItem value="企业服务">企业服务</SelectItem>
                <SelectItem value="商贸服务">商贸服务</SelectItem>
                <SelectItem value="运输服务">运输服务</SelectItem>
                <SelectItem value="建筑工程">建筑工程</SelectItem>
                <SelectItem value="化工贸易">化工贸易</SelectItem>
                <SelectItem value="能源技术">能源技术</SelectItem>
                <SelectItem value="新材料">新材料</SelectItem>
                <SelectItem value="生物技术">生物技术</SelectItem>
                <SelectItem value="财税服务">财税服务</SelectItem>
                <SelectItem value="法律服务">法律服务</SelectItem>
                <SelectItem value="其他">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>经营范围</Label>
          <Textarea
            value={businessScope}
            onChange={(e) => setBusinessScope(e.target.value)}
            placeholder="请输入经营范围"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );

  // 步骤3（入驻企业）：签订合同
  const renderStep3Tenant = () => (
    <Card>
      <CardHeader>
        <CardTitle>签订合同</CardTitle>
        <CardDescription>填写入驻企业的租赁合同信息</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            企业编号：<strong className="text-primary">{enterpriseCode}</strong>
            <span className="ml-4">企业名称：<strong>{enterpriseName}</strong></span>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>合同编号</Label>
            <Input value={contractNumber} readOnly />
          </div>
          <div className="space-y-2">
            <Label>签订日期</Label>
            <Input
              type="date"
              value={contractStartDate}
              onChange={(e) => setContractStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>合同开始日期 *</Label>
            <Input
              type="date"
              value={contractStartDate}
              onChange={(e) => setContractStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>合同结束日期 *</Label>
            <Input
              type="date"
              value={contractEndDate}
              onChange={(e) => setContractEndDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>月租金(元)</Label>
            <Input
              type="number"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
              placeholder="请输入月租金"
            />
          </div>
          <div className="space-y-2">
            <Label>押金(元)</Label>
            <Input
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              placeholder="请输入押金"
            />
          </div>
        </div>

        {(selectedRegNumber || manualAddress) && (
          <Alert>
            <Home className="h-4 w-4" />
            <AlertDescription>
              注册地址：<strong>{useManualAddress ? manualAddress : selectedRegNumber?.fullAddress}</strong>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  // 步骤4（入驻企业）：缴纳费用
  const renderStep4Tenant = () => (
    <Card>
      <CardHeader>
        <CardTitle>缴纳费用</CardTitle>
        <CardDescription>记录入驻企业的缴费情况（可稍后缴纳）</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            企业编号：<strong className="text-primary">{enterpriseCode}</strong>
            <span className="ml-4">企业名称：<strong>{enterpriseName}</strong></span>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>费用项目</Label>
            <Button variant="outline" size="sm" onClick={addFee}>
              <Plus className="w-4 h-4 mr-1" />
              添加费用项
            </Button>
          </div>

          <div className="space-y-2">
            {fees.map((fee, index) => (
              <div key={index} className="flex gap-2 items-center p-3 bg-muted rounded-lg">
                <Input
                  value={fee.name}
                  onChange={(e) => updateFee(index, "name", e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={fee.amount}
                  onChange={(e) =>
                    updateFee(index, "amount", parseFloat(e.target.value) || 0)
                  }
                  className="w-32"
                  placeholder="金额"
                />
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={fee.paid}
                    onCheckedChange={(checked) =>
                      updateFee(index, "paid", checked === true)
                    }
                  />
                  <span className="text-sm">已缴</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFee(index)}
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">合计金额</p>
            <p className="text-xl font-bold">
              ¥{fees.reduce((sum, f) => sum + f.amount, 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">已缴金额</p>
            <p className="text-xl font-bold text-green-600">
              ¥{fees.filter((f) => f.paid).reduce((sum, f) => sum + f.amount, 0).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>支付方式</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">银行转账</SelectItem>
                <SelectItem value="cash">现金</SelectItem>
                <SelectItem value="wechat">微信</SelectItem>
                <SelectItem value="alipay">支付宝</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>支付日期</Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // 完成步骤
  const renderComplete = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-2xl">
          {enterpriseType === "non_tenant" ? "创建成功" : "入驻成功"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        <CheckCircle2 className="w-24 h-24 mx-auto text-green-500" />
        
        <div className="space-y-2">
          <p className="text-lg font-medium">
            {enterpriseType === "non_tenant" ? "非入驻企业创建完成" : "企业入驻已完成"}
          </p>
          <p className="text-muted-foreground">
            企业 <strong>{enterpriseName}</strong> 已成功创建
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-left max-w-md mx-auto p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">企业编号</p>
            <p className="font-semibold text-primary">{enterpriseCode}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">企业类型</p>
            <p className="font-semibold">{enterpriseType === "tenant" ? "入驻企业" : "非入驻企业"}</p>
          </div>
          {enterpriseType === "tenant" && (selectedRegNumber || manualAddress) && (
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">注册地址</p>
              <p className="font-semibold text-sm">
                {useManualAddress ? manualAddress : selectedRegNumber?.fullAddress}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 max-w-md mx-auto">
          <Button variant="outline" asChild>
            <Link href="/dashboard/base/tenants">返回企业列表</Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/base/tenants/${createdEnterpriseId}`}>
              查看企业详情
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // 渲染当前步骤内容
  const renderCurrentStep = () => {
    if (currentStep === 0) {
      return renderStep0();
    }

    if (enterpriseType === "non_tenant") {
      switch (currentStep) {
        case 1:
          return renderEnterpriseForm();
        case 2:
          return renderComplete();
        default:
          return null;
      }
    }

    // 入驻企业
    switch (currentStep) {
      case 1:
        return renderStep1Tenant();
      case 2:
        return renderEnterpriseForm();
      case 3:
        return renderStep3Tenant();
      case 4:
        return renderStep4Tenant();
      case 5:
        return renderComplete();
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/base/tenants">
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">新建企业</h1>
      </div>

      {/* 步骤指示器（非选择类型步骤时显示） */}
      {currentStep > 0 && renderStepIndicator()}

      {/* 步骤内容 */}
      {renderCurrentStep()}

      {/* 底部按钮 */}
      {currentStep > 0 && (
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            上一步
          </Button>

          {/* 最后一步：提交 */}
          {((enterpriseType === "non_tenant" && currentStep === 1) ||
            (enterpriseType === "tenant" && currentStep === 4)) ? (
            <Button onClick={submitEnterprise} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {enterpriseType === "non_tenant" ? "完成创建" : "完成入驻"}
            </Button>
          ) : (
            currentStep < (enterpriseType === "non_tenant" ? 1 : 4) && (
              <Button onClick={nextStep}>
                下一步
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}
