"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Upload,
  X,
  Plus,
  Minus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

// 步骤定义
const STEPS = [
  { id: 1, title: "企业信息", icon: Building2 },
  { id: 2, title: "工商办理", icon: FileText },
  { id: 3, title: "签订合同", icon: PenTool },
  { id: 4, title: "缴纳费用", icon: CreditCard },
  { id: 5, title: "完成入驻", icon: CheckCircle2 },
];

export default function NewTenantPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // 步骤1：企业基本信息
  const [enterpriseName, setEnterpriseName] = useState("");
  const [creditCode, setCreditCode] = useState("");
  const [legalPerson, setLegalPerson] = useState("");
  const [idCard, setIdCard] = useState("");
  const [phone, setPhone] = useState("");
  const [capital, setCapital] = useState("");
  const [businessScope, setBusinessScope] = useState("");
  const [industry, setIndustry] = useState("");

  // 步骤2：工商办理
  const [businessType, setBusinessType] = useState<"register" | "change">("register");
  const [shareholders, setShareholders] = useState<{ name: string; idCard: string; ratio: string }[]>([]);
  const [staffList, setStaffList] = useState<{ name: string; idCard: string; phone: string }[]>([]);

  // 步骤3：签订合同
  const [contractNumber, setContractNumber] = useState("");
  const [contractStartDate, setContractStartDate] = useState("");
  const [contractEndDate, setContractEndDate] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");

  // 步骤4：缴纳费用
  const [fees, setFees] = useState<{ name: string; amount: number; paid: boolean }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);

  // 完成后的企业ID
  const [createdEnterpriseId, setCreatedEnterpriseId] = useState<string | null>(null);

  // 生成合同编号
  useEffect(() => {
    if (currentStep === 3 && !contractNumber) {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
      setContractNumber(`HT-${year}${month}-${random}`);
    }
  }, [currentStep, contractNumber]);

  // 初始化费用列表
  useEffect(() => {
    if (currentStep === 4 && fees.length === 0) {
      setFees([
        { name: "首月租金", amount: parseFloat(monthlyRent) || 0, paid: false },
        { name: "押金", amount: parseFloat(deposit) || 0, paid: false },
        { name: "物业费", amount: 0, paid: false },
        { name: "水电费押金", amount: 500, paid: false },
      ]);
    }
  }, [currentStep, fees.length, monthlyRent, deposit]);

  // 添加股东
  const addShareholder = () => {
    setShareholders([...shareholders, { name: "", idCard: "", ratio: "" }]);
  };

  // 移除股东
  const removeShareholder = (index: number) => {
    setShareholders(shareholders.filter((_, i) => i !== index));
  };

  // 更新股东信息
  const updateShareholder = (index: number, field: string, value: string) => {
    const updated = [...shareholders];
    updated[index] = { ...updated[index], [field]: value };
    setShareholders(updated);
  };

  // 添加员工
  const addStaff = () => {
    setStaffList([...staffList, { name: "", idCard: "", phone: "" }]);
  };

  // 移除员工
  const removeStaff = (index: number) => {
    setStaffList(staffList.filter((_, i) => i !== index));
  };

  // 更新员工信息
  const updateStaff = (index: number, field: string, value: string) => {
    const updated = [...staffList];
    updated[index] = { ...updated[index], [field]: value };
    setStaffList(updated);
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
    switch (step) {
      case 1:
        return enterpriseName.trim() !== "" && legalPerson.trim() !== "";
      case 2:
        return true; // 工商办理可选
      case 3:
        return true; // 合同可选
      case 4:
        return true; // 费用可选
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
    setCurrentStep(currentStep + 1);
  };

  // 上一步
  const prevStep = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  // 提交企业入驻
  const submitEnterprise = async () => {
    setSubmitting(true);
    try {
      // 调用后端API创建企业
      const res = await fetch("/api/enterprises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: enterpriseName,
          credit_code: creditCode,
          legal_person: legalPerson,
          phone,
          industry,
          type: "tenant",
          status: "active",
          registered_address: registeredAddress,
          business_address: businessAddress,
          settled_date: new Date().toISOString().split("T")[0],
        }),
      });

      const result = await res.json();
      if (!result.success && !result.data?.id) {
        throw new Error(result.error || result.message || "创建企业失败");
      }

      const enterpriseId = result.data?.id || result.id;
      setCreatedEnterpriseId(enterpriseId);

      toast({
        title: "入驻成功",
        description: `企业 ${enterpriseName} 已成功创建`,
      });

      setCurrentStep(5);
    } catch (error: any) {
      console.error("提交失败:", error);
      toast({
        title: "提交失败",
        description: error.message || "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 渲染步骤指示器
  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
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
            {index < STEPS.length - 1 && (
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

  // 步骤1：企业基本信息
  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle>企业基本信息</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
          <div className="space-y-2">
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

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>注册地址</Label>
            <Input
              value={registeredAddress}
              onChange={(e) => setRegisteredAddress(e.target.value)}
              placeholder="请输入注册地址"
            />
          </div>
          <div className="space-y-2">
            <Label>经营地址</Label>
            <Input
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              placeholder="请输入经营地址"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // 步骤2：工商办理
  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle>工商办理</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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

        <Separator />

        {/* 股东信息 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>股东信息</Label>
            <Button variant="outline" size="sm" onClick={addShareholder}>
              <Plus className="w-4 h-4 mr-1" />
              添加股东
            </Button>
          </div>
          {shareholders.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无股东信息</p>
          ) : (
            shareholders.map((shareholder, index) => (
              <div key={index} className="flex gap-2 items-end">
                <Input
                  placeholder="股东姓名"
                  value={shareholder.name}
                  onChange={(e) => updateShareholder(index, "name", e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="身份证号"
                  value={shareholder.idCard}
                  onChange={(e) => updateShareholder(index, "idCard", e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="持股比例(%)"
                  value={shareholder.ratio}
                  onChange={(e) => updateShareholder(index, "ratio", e.target.value)}
                  className="w-32"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeShareholder(index)}
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <Separator />

        {/* 员工信息 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>员工信息</Label>
            <Button variant="outline" size="sm" onClick={addStaff}>
              <Plus className="w-4 h-4 mr-1" />
              添加员工
            </Button>
          </div>
          {staffList.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无员工信息</p>
          ) : (
            staffList.map((staff, index) => (
              <div key={index} className="flex gap-2 items-end">
                <Input
                  placeholder="员工姓名"
                  value={staff.name}
                  onChange={(e) => updateStaff(index, "name", e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="身份证号"
                  value={staff.idCard}
                  onChange={(e) => updateStaff(index, "idCard", e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="联系电话"
                  value={staff.phone}
                  onChange={(e) => updateStaff(index, "phone", e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStaff(index)}
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            股东和员工信息可在入驻后继续完善
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );

  // 步骤3：签订合同
  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle>签订合同</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
            <Label>合同开始日期</Label>
            <Input
              type="date"
              value={contractStartDate}
              onChange={(e) => setContractStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>合同结束日期</Label>
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

        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            合同信息可在入驻后继续完善
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );

  // 步骤4：缴纳费用
  const renderStep4 = () => (
    <Card>
      <CardHeader>
        <CardTitle>缴纳费用</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>费用项目</Label>
            <Button variant="outline" size="sm" onClick={addFee}>
              <Plus className="w-4 h-4 mr-1" />
              添加费用项
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>费用名称</TableHead>
                <TableHead>金额(元)</TableHead>
                <TableHead>已缴纳</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.map((fee, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      value={fee.name}
                      onChange={(e) => updateFee(index, "name", e.target.value)}
                      className="border-0 p-0 h-auto"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={fee.amount}
                      onChange={(e) =>
                        updateFee(index, "amount", parseFloat(e.target.value) || 0)
                      }
                      className="border-0 p-0 h-auto w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={fee.paid}
                      onCheckedChange={(checked) =>
                        updateFee(index, "paid", checked === true)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFee(index)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="font-medium">合计金额</span>
          <span className="text-xl font-bold">
            ¥{fees.reduce((sum, f) => sum + f.amount, 0).toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 rounded-lg">
          <span className="font-medium text-green-700 dark:text-green-300">已缴金额</span>
          <span className="text-xl font-bold text-green-600">
            ¥{fees.filter((f) => f.paid).reduce((sum, f) => sum + f.amount, 0).toFixed(2)}
          </span>
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

        <Alert>
          <CreditCard className="h-4 w-4" />
          <AlertDescription>
            费用信息可在入驻后继续完善
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );

  // 步骤5：完成入驻
  const renderStep5 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-2xl">入驻成功</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        <CheckCircle2 className="w-24 h-24 mx-auto text-green-500" />
        <div className="space-y-2">
          <p className="text-lg font-medium">企业入驻已完成</p>
          <p className="text-muted-foreground">
            企业 <strong>{enterpriseName}</strong> 已成功创建
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
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

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/base/tenants">
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">新建企业入驻</h1>
      </div>

      {/* 步骤指示器 */}
      {renderStepIndicator()}

      {/* 步骤内容 */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}
      {currentStep === 5 && renderStep5()}

      {/* 底部按钮 */}
      {currentStep < 5 && (
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            上一步
          </Button>

          {currentStep === 4 ? (
            <Button onClick={submitEnterprise} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              完成入驻
            </Button>
          ) : (
            <Button onClick={nextStep}>
              下一步
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
