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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ContractType = "free" | "paid" | "tax_commitment";

const contractTypeOptions: { value: ContractType; label: string; description: string }[] = [
  { value: "free", label: "免费入驻", description: "免租金入驻，适合初创企业" },
  { value: "paid", label: "付费入驻", description: "按月缴纳租金和押金" },
  { value: "tax_commitment", label: "承诺税收", description: "承诺年度税收额度" },
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
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // 企业相关
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");

  // 合同信息
  const [formData, setFormData] = useState({
    contractNo: "",
    contractName: "",
    contractType: "" as ContractType | "",
    rentAmount: "",
    depositAmount: "",
    taxCommitment: "",
    startDate: "",
    endDate: "",
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
          // 只显示入驻中或已完成入驻的企业
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
    // 自动生成合同名称
    setFormData(prev => ({
      ...prev,
      contractName: `${enterprise.name}入驻合同`,
    }));
    setStep(2);
  };

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

  // 提交合同
  const handleSubmit = async () => {
    if (!selectedEnterprise) {
      toast.error("请先选择企业");
      return;
    }
    if (!formData.contractType) {
      toast.error("请选择合同类型");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/settlement/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: selectedEnterprise.id,
          enterpriseName: selectedEnterprise.name,
          contractNo: formData.contractNo || undefined,
          contractName: formData.contractName || undefined,
          contractType: formData.contractType,
          rentAmount: formData.rentAmount ? parseFloat(formData.rentAmount) : null,
          depositAmount: formData.depositAmount ? parseFloat(formData.depositAmount) : null,
          taxCommitment: formData.taxCommitment ? parseFloat(formData.taxCommitment) : null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          remarks: formData.remarks || null,
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
          <h1 className="text-2xl font-semibold">新建合同</h1>
          <p className="text-muted-foreground">
            {step === 1 ? "选择要签约的企业" : "填写合同信息"}
          </p>
        </div>
      </div>

      {/* 步骤指示器 */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
          step === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">1</span>
          选择企业
        </div>
        <div className="w-8 h-px bg-border" />
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
          step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">2</span>
          合同信息
        </div>
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

      {/* 步骤2：填写合同信息 */}
      {step === 2 && selectedEnterprise && (
        <div className="space-y-6">
          {/* 已选企业信息 */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Check className="w-5 h-5 text-primary" />
                已选择企业
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">企业名称：</span>
                  <span className="font-medium">{selectedEnterprise.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">统一代码：</span>
                  <span className="font-mono">{selectedEnterprise.creditCode || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">法定代表人：</span>
                  <span>{selectedEnterprise.legalPerson || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">联系电话：</span>
                  <span>{selectedEnterprise.phone || "-"}</span>
                </div>
                <div className="col-span-2 flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">注册地址：</span>
                  <span>{selectedEnterprise.registeredAddress || selectedEnterprise.businessAddress || "-"}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                  重新选择
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 合同类型 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                合同类型 *
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {contractTypeOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={cn(
                      "border-2 rounded-lg p-4 cursor-pointer transition-all",
                      formData.contractType === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setFormData({ ...formData, contractType: opt.value })}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                        formData.contractType === opt.value ? "border-primary" : "border-border"
                      )}>
                        {formData.contractType === opt.value && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <span className="font-medium">{opt.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 合同基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>合同编号</Label>
                  <Input
                    className="mt-1.5"
                    placeholder="留空自动生成"
                    value={formData.contractNo}
                    onChange={(e) => setFormData({ ...formData, contractNo: e.target.value })}
                  />
                </div>
                <div>
                  <Label>合同名称</Label>
                  <Input
                    className="mt-1.5"
                    placeholder="例如：2024年度入驻合同"
                    value={formData.contractName}
                    onChange={(e) => setFormData({ ...formData, contractName: e.target.value })}
                  />
                </div>
              </div>
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
                  <Label>月租金（元）</Label>
                  <Input
                    type="number"
                    className="mt-1.5"
                    placeholder="0.00"
                    value={formData.rentAmount}
                    onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                    disabled={formData.contractType === "free"}
                  />
                </div>
                <div>
                  <Label>押金（元）</Label>
                  <Input
                    type="number"
                    className="mt-1.5"
                    placeholder="0.00"
                    value={formData.depositAmount}
                    onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                    disabled={formData.contractType === "free"}
                  />
                </div>
                <div>
                  <Label>税收承诺（元/年）</Label>
                  <Input
                    type="number"
                    className="mt-1.5"
                    placeholder="0.00"
                    value={formData.taxCommitment}
                    onChange={(e) => setFormData({ ...formData, taxCommitment: e.target.value })}
                    disabled={formData.contractType !== "tax_commitment"}
                  />
                </div>
              </div>
              {formData.contractType === "free" && (
                <p className="text-xs text-muted-foreground mt-2">
                  * 免费入驻合同无需填写租金和押金
                </p>
              )}
            </CardContent>
          </Card>

          {/* 合同期限 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                合同期限
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>开始日期</Label>
                  <Input
                    type="date"
                    className="mt-1.5"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>结束日期</Label>
                  <Input
                    type="date"
                    className="mt-1.5"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
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

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>
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
