"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Building2,
  DollarSign,
  Calendar,
  User,
  Phone,
  MapPin,
  Search,
  Check,
  Clock,
  FileCheck,
  Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// 甲方信息（服务方）
const PARTY_A = {
  name: "Π立方企业服务中心",
  creditCode: "91220700MAE5DWN98Y", // 示例信用代码，实际应从配置或数据库获取
  legalPerson: "",
  address: "吉林省松原市宁江区",
  contactPhone: "",
};

// 场地类型配置（根据合同范本）
const spaceTypeOptions = [
  { 
    value: "open_station", 
    label: "开放工位", 
    price: 1200, 
    deposit: 1200, 
    unit: "个/年",
    description: "固定工位，共享办公区域"
  },
  { 
    value: "office_no_window", 
    label: "独立办公室（无窗）", 
    price: 3000, 
    deposit: 1200, 
    unit: "间/年",
    description: "独立办公空间，无窗户"
  },
  { 
    value: "office_with_window", 
    label: "独立办公室（有窗）", 
    price: 3600, 
    deposit: 1200, 
    unit: "间/年",
    description: "独立办公空间，带窗户"
  },
  { 
    value: "detached_office", 
    label: "独栋办公室", 
    price: 3600, 
    deposit: 5000, 
    unit: "栋/年",
    description: "独立独栋办公空间"
  },
];

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
}

export default function NewContractPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // 企业相关
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");

  // 合同信息
  const [formData, setFormData] = useState({
    contractNo: "",
    // 场地服务
    spaceType: "",
    spaceQuantity: 1,
    // 费用（根据场地类型自动计算，可手动调整）
    yearlyFee: 0,
    deposit: 0,
    // 期限
    startDate: "",
    endDate: "",
    contractYears: 1,
    // 备注
    remarks: "",
  });

  // 加载企业列表
  useEffect(() => {
    const fetchEnterprises = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/enterprises");
        if (response.ok) {
          const result = await response.json();
          const validStatuses = ["pending_contract", "pending_payment", "active", "pending_registration", "pending_change"];
          const filtered = (result.data || []).filter((e: Enterprise) => validStatuses.includes(e.processStatus));
          setEnterprises(filtered);
        }
      } catch (error) {
        console.error("加载企业列表失败:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEnterprises();
  }, []);

  // 选择企业
  const handleSelectEnterprise = (enterprise: Enterprise) => {
    setSelectedEnterprise(enterprise);
    setStep(2);
  };

  // 选择场地类型
  const handleSelectSpaceType = (spaceType: typeof spaceTypeOptions[0]) => {
    setFormData(prev => ({
      ...prev,
      spaceType: spaceType.value,
      yearlyFee: spaceType.price * prev.spaceQuantity,
      deposit: spaceType.deposit * prev.spaceQuantity,
    }));
    setStep(3);
  };

  // 更新数量时重新计算费用
  useEffect(() => {
    const selectedSpace = spaceTypeOptions.find(s => s.value === formData.spaceType);
    if (selectedSpace) {
      setFormData(prev => ({
        ...prev,
        yearlyFee: selectedSpace.price * prev.spaceQuantity,
        deposit: selectedSpace.deposit * prev.spaceQuantity,
      }));
    }
  }, [formData.spaceQuantity, formData.spaceType]);

  // 根据期限自动计算结束日期
  useEffect(() => {
    if (formData.startDate && formData.contractYears) {
      const start = new Date(formData.startDate);
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + formData.contractYears);
      setFormData(prev => ({
        ...prev,
        endDate: end.toISOString().split('T')[0],
      }));
    }
  }, [formData.startDate, formData.contractYears]);

  // 过滤企业列表
  const filteredEnterprises = enterprises.filter(e => {
    if (!searchKeyword) return true;
    return e.name.includes(searchKeyword) || 
           e.enterpriseCode?.includes(searchKeyword) ||
           e.legalPerson?.includes(searchKeyword);
  });

  // 获取企业状态显示
  const getProcessStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      pending_registration: { label: "待工商注册", className: "bg-purple-50 text-purple-600" },
      pending_change: { label: "待工商变更", className: "bg-violet-50 text-violet-600" },
      pending_contract: { label: "待签合同", className: "bg-cyan-50 text-cyan-600" },
      pending_payment: { label: "待缴费", className: "bg-amber-50 text-amber-600" },
      active: { label: "入驻中", className: "bg-emerald-50 text-emerald-600" },
    };
    const info = config[status] || { label: status, className: "bg-gray-50 text-gray-600" };
    return <Badge className={info.className}>{info.label}</Badge>;
  };

  // 获取选中的场地类型信息
  const getSelectedSpaceInfo = () => spaceTypeOptions.find(s => s.value === formData.spaceType);

  // 提交合同
  const handleSubmit = async () => {
    if (!selectedEnterprise) {
      toast.error("请先选择企业");
      return;
    }
    if (!formData.spaceType) {
      toast.error("请选择场地类型");
      return;
    }
    if (!formData.startDate) {
      toast.error("请选择服务起始日期");
      return;
    }

    setSaving(true);
    try {
      const selectedSpace = getSelectedSpaceInfo();
      const response = await fetch("/api/settlement/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: selectedEnterprise.id,
          enterpriseName: selectedEnterprise.name,
          contractNo: formData.contractNo || undefined,
          contractName: `${selectedEnterprise.name}入驻合同`,
          contractType: formData.spaceType === "detached_office" ? "paid" : "free",
          rentAmount: formData.yearlyFee,
          depositAmount: formData.deposit,
          startDate: formData.startDate,
          endDate: formData.endDate,
          // 甲方信息
          partyA: {
            name: PARTY_A.name,
            creditCode: PARTY_A.creditCode,
            legalPerson: PARTY_A.legalPerson,
            address: PARTY_A.address,
            contactPhone: PARTY_A.contactPhone,
          },
          // 乙方信息
          partyB: {
            name: selectedEnterprise.name,
            creditCode: selectedEnterprise.creditCode,
            legalPerson: selectedEnterprise.legalPerson,
            phone: selectedEnterprise.phone,
            address: selectedEnterprise.registeredAddress || selectedEnterprise.businessAddress,
          },
          remarks: JSON.stringify({
            spaceType: formData.spaceType,
            spaceTypeLabel: selectedSpace?.label,
            spaceQuantity: formData.spaceQuantity,
            contractYears: formData.contractYears,
            remarks: formData.remarks,
          }),
          status: "draft",
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "创建失败");
      }

      const result = await response.json();
      toast.success("合同创建成功");
      router.push(`/dashboard/base/contracts/${result.data.id}`);
    } catch (error) {
      console.error("创建合同失败:", error);
      toast.error(error instanceof Error ? error.message : "创建失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 头部 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">新建入驻合同</h1>
          <p className="text-muted-foreground">
            {step === 1 && "第一步：选择入驻企业"}
            {step === 2 && "第二步：选择场地类型"}
            {step === 3 && "第三步：确认合同信息"}
          </p>
        </div>
      </div>

      {/* 步骤指示器 */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
              step === s ? "bg-primary text-primary-foreground" : 
              step > s ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
            )}>
              {step > s ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">{s}</span>
              )}
              {s === 1 ? "选择企业" : s === 2 ? "场地类型" : "合同信息"}
            </div>
            {s < 3 && <div className="w-8 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      {/* 步骤1：选择企业 */}
      {step === 1 && (
        <div className="space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索企业名称、编号或法人..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 企业列表 */}
          <div className="border rounded-lg divide-y max-h-[500px] overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredEnterprises.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mb-3" />
                <p>暂无可选企业</p>
                <p className="text-xs mt-1">请先在企业管理中创建企业</p>
              </div>
            ) : (
              filteredEnterprises.map((enterprise) => (
                <div
                  key={enterprise.id}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-between"
                  onClick={() => handleSelectEnterprise(enterprise)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{enterprise.name}</span>
                        {getProcessStatusBadge(enterprise.processStatus)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="font-mono">{enterprise.enterpriseCode}</span>
                        {enterprise.legalPerson && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {enterprise.legalPerson}
                          </span>
                        )}
                        {enterprise.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {enterprise.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    选择
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 步骤2：选择场地类型 */}
      {step === 2 && selectedEnterprise && (
        <div className="space-y-6">
          {/* 已选企业 */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{selectedEnterprise.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEnterprise.creditCode || selectedEnterprise.enterpriseCode}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                  重新选择
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 场地类型选择 */}
          <div className="grid grid-cols-2 gap-4">
            {spaceTypeOptions.map((space) => (
              <Card
                key={space.value}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  formData.spaceType === space.value
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => handleSelectSpaceType(space)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{space.label}</CardTitle>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      formData.spaceType === space.value ? "border-primary bg-primary" : "border-border"
                    )}>
                      {formData.spaceType === space.value && (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                  </div>
                  <CardDescription>{space.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-primary">¥{space.price}</p>
                      <p className="text-xs text-muted-foreground">{space.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">押金</p>
                      <p className="font-semibold">¥{space.deposit}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 步骤3：确认合同信息 */}
      {step === 3 && selectedEnterprise && (
        <div className="space-y-6">
          {/* 甲方信息 */}
          <Card className="border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Landmark className="h-5 w-5 text-primary" />
                甲方信息（服务方）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">企业名称：</span>
                  <span className="font-medium">{PARTY_A.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">统一社会信用代码：</span>
                  <span className="font-mono">{PARTY_A.creditCode}</span>
                </div>
                {PARTY_A.legalPerson && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">法定代表人：</span>
                    <span>{PARTY_A.legalPerson}</span>
                  </div>
                )}
                {PARTY_A.contactPhone && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">联系电话：</span>
                    <span>{PARTY_A.contactPhone}</span>
                  </div>
                )}
                <div className="col-span-2 flex items-start gap-2">
                  <span className="text-muted-foreground">地址：</span>
                  <span>{PARTY_A.address}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 乙方信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                乙方信息（入驻方）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">企业名称：</span>
                  <span className="font-medium">{selectedEnterprise.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">统一社会信用代码：</span>
                  <span className="font-mono">{selectedEnterprise.creditCode || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">法定代表人：</span>
                  <span>{selectedEnterprise.legalPerson || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">联系电话：</span>
                  <span>{selectedEnterprise.phone || "-"}</span>
                </div>
                <div className="col-span-2 flex items-start gap-2">
                  <span className="text-muted-foreground">注册地址：</span>
                  <span>{selectedEnterprise.registeredAddress || selectedEnterprise.businessAddress || "-"}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                  重新选择企业
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 场地信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-muted-foreground" />
                场地服务
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>场地类型</Label>
                  <div className="mt-1.5 p-2 border rounded-md bg-muted/50">
                    {getSelectedSpaceInfo()?.label}
                  </div>
                </div>
                <div>
                  <Label>数量</Label>
                  <Input
                    type="number"
                    min={1}
                    className="mt-1.5"
                    value={formData.spaceQuantity}
                    onChange={(e) => setFormData({ ...formData, spaceQuantity: Number(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label>合同编号（选填）</Label>
                  <Input
                    className="mt-1.5"
                    placeholder="留空自动生成"
                    value={formData.contractNo}
                    onChange={(e) => setFormData({ ...formData, contractNo: e.target.value })}
                  />
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                重新选择场地类型
              </Button>
            </CardContent>
          </Card>

          {/* 费用信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                费用信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>首年服务费（元）</Label>
                  <Input
                    type="number"
                    className="mt-1.5"
                    value={formData.yearlyFee}
                    onChange={(e) => setFormData({ ...formData, yearlyFee: Number(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>押金（元）</Label>
                  <Input
                    type="number"
                    className="mt-1.5"
                    value={formData.deposit}
                    onChange={(e) => setFormData({ ...formData, deposit: Number(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>应付总额（元）</Label>
                  <div className="mt-1.5 p-2 border rounded-md bg-primary/5 font-semibold text-primary text-lg">
                    ¥{(formData.yearlyFee + formData.deposit).toLocaleString()}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * 押金于合同终止后30日内无息退还（扣除违约赔偿金）
              </p>
            </CardContent>
          </Card>

          {/* 服务期限 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                服务期限
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>起始日期</Label>
                  <Input
                    type="date"
                    className="mt-1.5"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>合同期限（年）</Label>
                  <Select
                    value={String(formData.contractYears)}
                    onValueChange={(v) => setFormData({ ...formData, contractYears: Number(v) })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 5].map(y => (
                        <SelectItem key={y} value={String(y)}>{y} 年</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>终止日期</Label>
                  <div className="mt-1.5 p-2 border rounded-md bg-muted/50">
                    {formData.endDate || "-"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 备注 */}
          <Card>
            <CardHeader>
              <CardTitle>备注</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="其他备注信息..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* 合同附件提示 */}
          <Card className="bg-muted/50">
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground mb-2">合同创建后将自动包含以下附件：</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>附件一：Π立方服务标准清单</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>附件二：空间使用与管理规范</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>附件三：特色服务超市价目表</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>附件四：独栋办公室补充条款</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>附件五：安全责任承诺书</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setStep(2)}>
              上一步
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Save className="h-4 w-4 mr-2" />
              创建合同
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
