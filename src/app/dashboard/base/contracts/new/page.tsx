"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Building2,
  Upload,
  X,
  FileText,
  Check,
  Search,
  FileSignature,
  Info,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// 企业类型
interface Enterprise {
  id: string;
  name: string;
  enterpriseCode: string;
  creditCode?: string;
  legalPerson?: string;
  phone?: string;
  processStatus: string;
  baseName?: string;
}

// 合同类型
interface ContractType {
  id: string;
  name: string;
  description: string | null;
}

// 步骤配置 - 简化为2步
const steps = [
  { id: 1, title: "选择企业", description: "选择签约企业主体", icon: Building2 },
  { id: 2, title: "合同信息", description: "填写合同详情并上传附件", icon: FileSignature },
];

export default function NewContractPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 企业列表
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);

  // 合同类型列表
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [selectedContractType, setSelectedContractType] = useState<ContractType | null>(null);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  // 合同信息
  const [contractNo, setContractNo] = useState("");
  const [contractName, setContractName] = useState("");
  const [signDate, setSignDate] = useState(""); // 开始日期
  const [duration, setDuration] = useState(1); // 有效时长（年）
  const [remarks, setRemarks] = useState("");

  // 计算截止日期
  const endDate = signDate ? (() => {
    const start = new Date(signDate);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + duration);
    return end.toISOString().split('T')[0];
  })() : "";

  // 附件
  const [attachments, setAttachments] = useState<Array<{
    key: string;
    url: string;
    name: string;
  }>>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  // 加载企业列表和合同类型
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 并行加载企业列表和合同类型
        const [enterprisesRes, contractTypesRes] = await Promise.all([
          fetch("/api/enterprises"),
          fetch("/api/contract-types"),
        ]);

        if (enterprisesRes.ok) {
          const result = await enterprisesRes.json();
          // 过滤可签约的企业状态
          const validStatuses = ["pending_contract", "pending_payment", "active", "pending_registration", "pending_change"];
          const filtered = (result.data || []).filter((e: Enterprise) => validStatuses.includes(e.processStatus));
          setEnterprises(filtered);
        }

        if (contractTypesRes.ok) {
          const result = await contractTypesRes.json();
          setContractTypes(result.data || []);
          // 默认选择第一个合同类型
          if (result.data?.length > 0) {
            setSelectedContractType(result.data[0]);
          }
        }
      } catch (error) {
        console.error("加载数据失败:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 生成合同号
  const generateContractNo = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `HT${year}${month}${day}${random}`;
  }, []);

  // 选择企业后自动生成合同号
  useEffect(() => {
    if (selectedEnterprise && !contractNo) {
      setContractNo(generateContractNo());
      setContractName(`${selectedEnterprise.name}合同`);
    }
  }, [selectedEnterprise, contractNo, generateContractNo]);

  // 过滤企业列表
  const filteredEnterprises = enterprises.filter(e => {
    if (!searchKeyword) return true;
    return e.name.includes(searchKeyword) ||
           e.enterpriseCode?.includes(searchKeyword) ||
           e.legalPerson?.includes(searchKeyword);
  });

  // 上传文件
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const fileId = `${Date.now()}-${Math.random()}`;
      setUploadingFiles(prev => new Set(prev).add(fileId));

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "contract");

        const response = await fetch("/api/storage/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        if (result.success) {
          setAttachments(prev => [...prev, {
            key: result.key,
            url: result.url,
            name: file.name,
          }]);
        } else {
          toast.error(result.error || "上传失败");
        }
      } catch (error) {
        console.error("上传失败:", error);
        toast.error("上传失败");
      } finally {
        setUploadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
      }
    }

    // 重置 input
    e.target.value = "";
  };

  // 删除附件
  const handleRemoveAttachment = (key: string) => {
    setAttachments(prev => prev.filter(a => a.key !== key));
  };

  // 下一步
  const handleNext = () => {
    if (currentStep === 1 && !selectedEnterprise) {
      toast.error("请选择企业");
      return;
    }
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  // 上一步
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 提交合同
  const handleSubmit = async () => {
    if (!selectedEnterprise) {
      toast.error("请选择企业");
      return;
    }
    if (!signDate) {
      toast.error("请填写开始日期");
      return;
    }
    if (!selectedContractType) {
      toast.error("请选择合同类型");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/settlement/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: selectedEnterprise.id,
          enterpriseName: selectedEnterprise.name,
          contractNo,
          contractName: contractName || `${selectedEnterprise.name}合同`,
          contractType: selectedContractType.name, // 兼容后端
          contractTypeId: selectedContractType.id,
          contractTypeName: selectedContractType.name,
          startDate: signDate,
          endDate,
          remarks,
          attachments: attachments.map(a => ({
            key: a.key,
            url: a.url,
            name: a.name,
          })),
          // 创建合同统一为草稿状态，需要后续确认签署
          status: "draft",
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("合同创建成功");
        router.push(`/dashboard/base/contracts/${result.data.id}`);
      } else {
        toast.error(result.error || "创建失败");
      }
    } catch (error) {
      console.error("创建合同失败:", error);
      toast.error("创建失败");
    } finally {
      setSubmitting(false);
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
          <p className="text-muted-foreground mt-1">
            {steps[currentStep - 1].description}
          </p>
        </div>
      </div>

      {/* 步骤指示器 - 使用七彩配色中的琥珀色（签订合同） */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-center">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const Icon = step.icon;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => {
                    if (isCompleted || (step.id === 1 && currentStep === 2 && selectedEnterprise)) {
                      setCurrentStep(step.id);
                    }
                  }}
                  disabled={!isCompleted && step.id !== currentStep && !(step.id === 1)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                    isActive && "bg-amber-50 ring-2 ring-amber-300",
                    isCompleted && "bg-step-emerald-muted ring-1 ring-step-emerald/30",
                    !isActive && !isCompleted && "text-muted-foreground"
                  )}
                >
                  {/* 步骤图标 */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                      isCompleted && "bg-step-emerald text-step-emerald-foreground",
                      isActive && !isCompleted && "bg-amber-500 text-white",
                      !isActive && !isCompleted && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>

                  {/* 步骤信息 */}
                  <div className="text-left">
                    <span
                      className={cn(
                        "text-sm font-medium block",
                        isActive && "text-amber-700",
                        isCompleted && "text-step-emerald",
                        !isActive && !isCompleted && "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      第 {step.id} 步
                    </span>
                  </div>
                </button>

                {/* 连接线 */}
                {!isLast && (
                  <div
                    className={cn(
                      "w-16 h-0.5 mx-2 rounded-full transition-colors",
                      isCompleted ? "bg-step-emerald/50" : "bg-muted"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 步骤1：选择企业 */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                选择签约企业
              </CardTitle>
              <CardDescription>从已有企业中选择签约主体</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="border rounded-lg divide-y max-h-[400px] overflow-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredEnterprises.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Building2 className="h-12 w-12 mb-3" />
                    <p>暂无可选企业</p>
                    <p className="text-xs mt-1">请先在企业入驻中创建企业</p>
                  </div>
                ) : (
                  filteredEnterprises.map((enterprise) => (
                    <div
                      key={enterprise.id}
                      className={cn(
                        "p-4 hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-between",
                        selectedEnterprise?.id === enterprise.id && "bg-amber-50 border-l-2 border-l-amber-500"
                      )}
                      onClick={() => setSelectedEnterprise(enterprise)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center",
                          selectedEnterprise?.id === enterprise.id ? "bg-amber-100" : "bg-muted"
                        )}>
                          <Building2 className={cn(
                            "h-6 w-6",
                            selectedEnterprise?.id === enterprise.id ? "text-amber-600" : "text-muted-foreground"
                          )} />
                        </div>
                        <div>
                          <span className="font-medium">{enterprise.name}</span>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="font-mono">{enterprise.enterpriseCode}</span>
                            {enterprise.legalPerson && (
                              <span>法人：{enterprise.legalPerson}</span>
                            )}
                            {enterprise.baseName && (
                              <span>基地：{enterprise.baseName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {selectedEnterprise?.id === enterprise.id && (
                        <Check className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 步骤2：合同信息 + 上传附件 */}
      {currentStep === 2 && selectedEnterprise && (
        <div className="space-y-4">
          {/* 已选企业 */}
          <Card className="border-step-emerald/30 bg-step-emerald-muted/30">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-step-emerald text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedEnterprise.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEnterprise.creditCode || selectedEnterprise.enterpriseCode}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)}>
                  重新选择
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 合同信息表单 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-amber-600" />
                合同信息
              </CardTitle>
              <CardDescription>填写合同编号和有效期</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>合同编号</Label>
                  <Input
                    className="mt-1.5"
                    value={contractNo}
                    onChange={(e) => setContractNo(e.target.value)}
                    placeholder="留空自动生成"
                  />
                  <p className="text-xs text-muted-foreground mt-1">已自动生成，可手动修改</p>
                </div>
                <div>
                  <Label>合同名称</Label>
                  <Input
                    className="mt-1.5"
                    value={contractName}
                    onChange={(e) => setContractName(e.target.value)}
                    placeholder="输入合同名称"
                  />
                </div>
              </div>

              {/* 合同类型选择 */}
              <div>
                <Label>合同类型</Label>
                <div className="relative mt-1.5">
                  <button
                    type="button"
                    onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-background hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span>{selectedContractType?.name || "选择合同类型"}</span>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", typeDropdownOpen && "rotate-180")} />
                  </button>
                  {typeDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg bg-background shadow-lg z-10 max-h-60 overflow-auto">
                      {contractTypes.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">暂无合同类型</div>
                      ) : (
                        contractTypes.map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => {
                              setSelectedContractType(type);
                              setTypeDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors",
                              selectedContractType?.id === type.id && "bg-amber-50 text-amber-700"
                            )}
                          >
                            <FileText className="w-4 h-4 text-amber-600" />
                            <div>
                              <div className="text-sm font-medium">{type.name}</div>
                              {type.description && (
                                <div className="text-xs text-muted-foreground">{type.description}</div>
                              )}
                            </div>
                            {selectedContractType?.id === type.id && (
                              <Check className="w-4 h-4 text-amber-600 ml-auto" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>开始日期 <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    className="mt-1.5"
                    value={signDate}
                    onChange={(e) => setSignDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>有效时长</Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      className="w-24"
                      value={duration}
                      onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                    <span className="text-muted-foreground">年</span>
                    {signDate && (
                      <span className="text-sm text-muted-foreground ml-auto">
                        截止：{endDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label>备注</Label>
                <Input
                  className="mt-1.5"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="可选备注信息"
                />
              </div>
            </CardContent>
          </Card>

          {/* 上传附件 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-600" />
                合同附件
                <span className="text-xs font-normal text-muted-foreground ml-2 bg-muted px-2 py-0.5 rounded">
                  可选
                </span>
              </CardTitle>
              <CardDescription>上传合同扫描件或电子版</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 上传按钮 */}
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-amber-300 hover:bg-amber-50/30 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  {uploadingFiles.size > 0 ? (
                    <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 text-amber-600" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    点击上传或拖拽文件到此处
                  </span>
                  <span className="text-xs text-muted-foreground">
                    支持 PDF、Word、图片格式
                  </span>
                </label>
              </div>

              {/* 已上传文件列表 */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file) => (
                    <div
                      key={file.key}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-amber-600" />
                        <span className="text-sm truncate max-w-[300px]">{file.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAttachment(file.key)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 温馨提示 */}
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">温馨提示</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-700">
                    <li>合同创建后为<b>草稿</b>状态，需在详情页确认签署</li>
                    <li>合同附件可在创建后继续上传</li>
                    <li>草稿状态的合同可随时删除</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 底部操作栏 */}
      <div className="border-t bg-card px-6 py-4 -mx-6 sticky bottom-0">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            上一步
          </Button>

          {currentStep === 2 ? (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-amber-600 hover:bg-amber-700 text-white px-8"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  创建中...
                </>
              ) : (
                "创建合同"
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              下一步
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
