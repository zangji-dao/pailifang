"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Loader2,
  Search,
  Calendar,
  Check,
  Plus,
  ChevronRight,
  ChevronLeft,
  Upload,
  X,
  ArrowRight,
  Building2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 合同类型
type ContractType = "free" | "paid" | "agreement" | string;

// 合同数据接口
interface Contract {
  id: string;
  enterpriseId: string | null;
  enterpriseName: string | null;
  contractNo: string | null;
  contractName?: string | null;
  contractType: ContractType;
  rentAmount: string | null;
  depositAmount: string | null;
  taxCommitment: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
}

// 合同类型配置
const contractTypeOptions: { value: ContractType; label: string; description: string; icon: string }[] = [
  { value: "free", label: "免费合同", description: "免费入驻，不收取任何费用", icon: "🆓" },
  { value: "paid", label: "收费合同", description: "收费入驻，按合同约定收取费用", icon: "💰" },
  { value: "agreement", label: "协议合同", description: "协议入驻，按双方协议执行", icon: "📝" },
];

// 获取合同类型显示配置
const getContractTypeConfig = (type: ContractType) => {
  const config: Record<string, { label: string; color: string; bgColor: string }> = {
    free: { label: "免费", color: "text-green-600", bgColor: "bg-green-50" },
    paid: { label: "收费", color: "text-blue-600", bgColor: "bg-blue-50" },
    agreement: { label: "协议", color: "text-amber-600", bgColor: "bg-amber-50" },
  };
  return config[type] || { label: type || "未分类", color: "text-muted-foreground", bgColor: "bg-muted" };
};

// 状态配置
const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "草稿", className: "bg-gray-50 text-gray-600 border-gray-200" },
  pending: { label: "待签", className: "bg-amber-50 text-amber-600 border-amber-200" },
  signed: { label: "已签", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
};

interface ContractStepProps {
  enterpriseName: string;
  enterpriseId?: string | null;
  contract: {
    contractId: string | null;
    contractNumber: string;
    contractType?: ContractType;
  } | null;
  onUpdateContract: (contract: ContractStepProps["contract"]) => void;
}

export function ContractStep({
  enterpriseName,
  enterpriseId,
  contract,
  onUpdateContract,
}: ContractStepProps) {
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // 新建合同步骤 (1: 选择类型, 2: 填写信息, 3: 上传附件)
  const [createStep, setCreateStep] = useState(1);
  
  // 新建合同表单
  const [newContract, setNewContract] = useState({
    contractType: "" as ContractType,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    amount: "",
    deposit: "",
    remarks: "",
    attachmentUrl: "",
  });
  
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // 加载可选择的合同列表
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchContracts = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/settlement/contracts", {
          signal: controller.signal,
        });
        if (response.ok) {
          const result = await response.json();
          const validStatuses = ["signed", "pending"];
          const filteredContracts = (result.data || []).filter(
            (c: Contract) => validStatuses.includes(c.status)
          );
          setContracts(filteredContracts);
        }
      } catch (error) {
        // 忽略 AbortError（组件卸载时请求被取消是正常行为）
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("获取合同列表失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
    
    return () => controller.abort();
  }, []);

  // 选择已有合同
  const handleSelectContract = (selectedContract: Contract) => {
    onUpdateContract({
      contractId: selectedContract.id,
      contractNumber: selectedContract.contractNo || "",
      contractType: selectedContract.contractType,
    });
    toast({ title: "已选择合同", description: `合同编号：${selectedContract.contractNo}` });
  };

  // 取消选择
  const handleClearSelection = () => {
    onUpdateContract(null);
    toast({ title: "已取消选择" });
  };

  // 上传附件
  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "contracts");

      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        setNewContract({ ...newContract, attachmentUrl: result.url });
        toast({ title: "上传成功" });
      } else {
        throw new Error(result.error || "上传失败");
      }
    } catch (error: any) {
      console.error("上传失败:", error);
      toast({ title: "上传失败", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // 新建合同
  const handleCreateContract = async () => {
    if (!newContract.contractType) {
      toast({ title: "请选择合同类型", variant: "destructive" });
      return;
    }

    if (!enterpriseName) {
      toast({ title: "请先填写企业名称", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const contractNo = `HT-${Date.now()}`;
      
      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract_number: contractNo,
          contract_type: newContract.contractType,
          start_date: newContract.startDate,
          end_date: newContract.endDate,
          amount: newContract.amount ? parseFloat(newContract.amount) : 0,
          deposit: newContract.deposit ? parseFloat(newContract.deposit) : 0,
          status: "signed",
          remarks: newContract.remarks,
          attachment_url: newContract.attachmentUrl,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        onUpdateContract({
          contractId: result.data.id,
          contractNumber: contractNo,
          contractType: newContract.contractType,
        });
        setShowCreateForm(false);
        setCreateStep(1);
        toast({ title: "合同创建成功", description: `合同编号：${contractNo}` });
      } else {
        throw new Error(result.error || "创建合同失败");
      }
    } catch (error: any) {
      console.error("创建合同失败:", error);
      toast({ title: "创建失败", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  // 重置新建表单
  const resetCreateForm = () => {
    setCreateStep(1);
    setNewContract({
      contractType: "" as ContractType,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: "",
      deposit: "",
      remarks: "",
      attachmentUrl: "",
    });
  };

  // 过滤合同列表
  const filteredContracts = contracts.filter(c => {
    if (!searchKeyword) return true;
    return (c.contractNo?.includes(searchKeyword)) || 
           (c.enterpriseName?.includes(searchKeyword));
  });

  // 获取已选合同详情
  const selectedContract = contracts.find(c => c.id === contract?.contractId);

  // 获取合同类型标签
  const getContractTypeLabel = () => {
    if (!contract?.contractType) return null;
    const config = getContractTypeConfig(contract.contractType);
    return (
      <span className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        config.bgColor,
        config.color
      )}>
        {config.label}
      </span>
    );
  };

  // 获取当前选择的合同类型选项
  const selectedTypeOption = contractTypeOptions.find(o => o.value === newContract.contractType);

  return (
    <div className="space-y-6">
      {/* 已选择的合同 */}
      {contract && !showCreateForm && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-amber-700">
              <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              已选择合同
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-lg">{contract.contractNumber}</p>
                    {getContractTypeLabel()}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    {selectedContract?.startDate && selectedContract?.endDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {selectedContract.startDate} ~ {selectedContract.endDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right bg-white/60 px-4 py-2 rounded-lg">
                <p className="text-xs text-muted-foreground">合同有效期</p>
                <p className="font-semibold text-amber-700">1年</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-amber-200/50 flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearSelection}
                className="border-amber-200 text-amber-700 hover:bg-amber-100"
              >
                重新选择
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 新建合同表单 */}
      {showCreateForm && (
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="w-5 h-5 text-blue-600" />
                新建合同
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateForm(false);
                  resetCreateForm();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <CardDescription>
              为企业「{enterpriseName}」创建新合同
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 步骤指示器 */}
            <div className="flex items-center justify-center mb-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    createStep === step 
                      ? "bg-blue-600 text-white" 
                      : createStep > step 
                        ? "bg-green-500 text-white" 
                        : "bg-muted text-muted-foreground"
                  )}>
                    {createStep > step ? <Check className="w-4 h-4" /> : step}
                  </div>
                  {step < 3 && (
                    <div className={cn(
                      "w-16 h-0.5",
                      createStep > step ? "bg-green-500" : "bg-muted"
                    )} />
                  )}
                </div>
              ))}
            </div>
            
            {/* 步骤标题 */}
            <div className="text-center mb-6">
              <p className="font-medium">
                {createStep === 1 && "选择合同类型"}
                {createStep === 2 && "填写合同信息"}
                {createStep === 3 && "上传合同附件"}
              </p>
              <p className="text-sm text-muted-foreground">
                {createStep === 1 && "请选择本次入驻的合同类型"}
                {createStep === 2 && "请填写合同基本信息"}
                {createStep === 3 && "上传签字后的合同文件（可选）"}
              </p>
            </div>

            {/* Step 1: 选择合同类型 */}
            {createStep === 1 && (
              <div className="space-y-4">
                <div className="grid gap-3">
                  {contractTypeOptions.map((option) => (
                    <div
                      key={option.value}
                      className={cn(
                        "p-4 rounded-lg border-2 cursor-pointer transition-all",
                        newContract.contractType === option.value 
                          ? "border-blue-500 bg-blue-50" 
                          : "border-border hover:border-blue-300 hover:bg-muted/50"
                      )}
                      onClick={() => setNewContract({ ...newContract, contractType: option.value })}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{option.icon}</span>
                        <div className="flex-1">
                          <p className="font-medium">{option.label}</p>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                        {newContract.contractType === option.value && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => setCreateStep(2)}
                    disabled={!newContract.contractType}
                    className="gap-1"
                  >
                    下一步
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: 填写合同信息 */}
            {createStep === 2 && (
              <div className="space-y-4">
                {/* 显示已选类型 */}
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <span className="text-lg">{selectedTypeOption?.icon}</span>
                  <span className="font-medium">{selectedTypeOption?.label}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-xs"
                    onClick={() => setCreateStep(1)}
                  >
                    修改
                  </Button>
                </div>

                {/* 合同期限 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">开始日期</Label>
                    <Input
                      type="date"
                      value={newContract.startDate}
                      onChange={(e) => setNewContract({ ...newContract, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">结束日期</Label>
                    <Input
                      type="date"
                      value={newContract.endDate}
                      onChange={(e) => setNewContract({ ...newContract, endDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* 收费合同显示金额字段 */}
                {newContract.contractType === "paid" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">合同金额（元）</Label>
                      <Input
                        type="number"
                        placeholder="请输入合同金额"
                        value={newContract.amount}
                        onChange={(e) => setNewContract({ ...newContract, amount: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">押金（元）</Label>
                      <Input
                        type="number"
                        placeholder="请输入押金金额"
                        value={newContract.deposit}
                        onChange={(e) => setNewContract({ ...newContract, deposit: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* 备注 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">备注</Label>
                  <Input
                    placeholder="合同备注信息"
                    value={newContract.remarks}
                    onChange={(e) => setNewContract({ ...newContract, remarks: e.target.value })}
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCreateStep(1)}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    上一步
                  </Button>
                  <Button
                    onClick={() => setCreateStep(3)}
                    className="gap-1"
                  >
                    下一步
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: 上传合同附件 */}
            {createStep === 3 && (
              <div className="space-y-4">
                {/* 合同信息摘要 */}
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{selectedTypeOption?.icon}</span>
                    <span className="font-medium">{selectedTypeOption?.label}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {newContract.startDate} ~ {newContract.endDate}
                    </span>
                  </div>
                  {newContract.contractType === "paid" && (newContract.amount || newContract.deposit) && (
                    <div className="flex items-center gap-4 text-sm">
                      {newContract.amount && <span>金额: ¥{newContract.amount}</span>}
                      {newContract.deposit && <span>押金: ¥{newContract.deposit}</span>}
                    </div>
                  )}
                </div>

                {/* 上传附件 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    合同附件
                    <span className="text-muted-foreground font-normal ml-1">(可选)</span>
                  </Label>
                  
                  {newContract.attachmentUrl ? (
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="text-sm flex-1">已上传合同附件</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setNewContract({ ...newContract, attachmentUrl: "" })}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <input
                        type="file"
                        id="contract-attachment"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleUploadAttachment}
                        disabled={uploading}
                      />
                      <label
                        htmlFor="contract-attachment"
                        className="cursor-pointer"
                      >
                        {uploading ? (
                          <div className="flex flex-col items-center">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">上传中...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">点击上传合同附件</span>
                            <span className="text-xs text-muted-foreground mt-1">支持 PDF、Word、图片格式</span>
                          </div>
                        )}
                      </label>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCreateStep(2)}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    上一步
                  </Button>
                  <Button
                    onClick={handleCreateContract}
                    disabled={creating}
                    className="gap-1 bg-green-600 hover:bg-green-700"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        创建中...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        确认创建
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 选择合同 */}
      {!showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              关联合同
            </CardTitle>
            <CardDescription>
              选择已有合同或新建合同
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 操作按钮 */}
            {!contract && (
              <div className="flex gap-2">
                <Button
                  variant="default"
                  className="flex-1 gap-1"
                  onClick={() => {
                    resetCreateForm();
                    setShowCreateForm(true);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  新建合同
                </Button>
              </div>
            )}

            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索已有合同..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* 已有合同列表 */}
            <div className="border rounded-lg divide-y max-h-[300px] overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">加载中...</span>
                </div>
              ) : filteredContracts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <FileText className="w-10 h-10 mb-2" />
                  <p className="text-sm">暂无可选合同</p>
                </div>
              ) : (
                filteredContracts.map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      "flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                      contract?.contractId === c.id && "bg-amber-50 border-l-2 border-l-amber-500"
                    )}
                    onClick={() => handleSelectContract(c)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{c.contractNo || "未命名合同"}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded",
                            getContractTypeConfig(c.contractType).bgColor,
                            getContractTypeConfig(c.contractType).color
                          )}>
                            {getContractTypeConfig(c.contractType).label}
                          </span>
                          {c.startDate && (
                            <span>{c.startDate}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {contract?.contractId === c.id && (
                      <Check className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
