"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Building2,
  Calendar,
  Upload,
  X,
  FileText,
  Check,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

// 步骤配置
const steps = [
  { id: 1, title: "选择企业", description: "选择签约企业" },
  { id: 2, title: "合同信息", description: "填写合同信息" },
  { id: 3, title: "上传附件", description: "上传合同文件" },
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

  // 合同信息
  const [contractNo, setContractNo] = useState("");
  const [contractName, setContractName] = useState("");
  const [signDate, setSignDate] = useState(""); // 签订日期
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

  // 加载企业列表
  useEffect(() => {
    const fetchEnterprises = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/enterprises");
        if (response.ok) {
          const result = await response.json();
          // 过滤可签约的企业状态
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

  // 获取企业状态显示
  const getStatusBadge = (status: string) => {
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
            key: result.data.key,
            url: result.data.url,
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
    if (currentStep === 2 && !signDate) {
      toast.error("请填写签订日期");
      return;
    }
    if (currentStep < 3) {
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
      toast.error("请填写签订日期");
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
          contractType: "free", // 默认免费入驻合同
          startDate: signDate,
          endDate,
          remarks,
          attachments: attachments.map(a => ({
            key: a.key,
            url: a.url,
            name: a.name,
          })),
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
          <p className="text-muted-foreground">
            第 {currentStep} 步，共 {steps.length} 步 - {steps[currentStep - 1].description}
          </p>
        </div>
      </div>

      {/* 步骤指示器 */}
      <div className="flex items-center gap-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                currentStep === step.id
                  ? "bg-primary text-primary-foreground"
                  : currentStep > step.id
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {currentStep > step.id ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                  {step.id}
                </span>
              )}
              {step.title}
            </div>
            {index < steps.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      {/* 步骤1：选择企业 */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">选择签约企业</CardTitle>
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
                        selectedEnterprise?.id === enterprise.id && "bg-primary/5 border-l-2 border-l-primary"
                      )}
                      onClick={() => setSelectedEnterprise(enterprise)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{enterprise.name}</span>
                            {getStatusBadge(enterprise.processStatus)}
                          </div>
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
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 步骤2：合同信息 */}
      {currentStep === 2 && selectedEnterprise && (
        <div className="space-y-4">
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
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)}>
                  重新选择
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 合同信息表单 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">合同信息</CardTitle>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>签订日期 <span className="text-red-500">*</span></Label>
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
        </div>
      )}

      {/* 步骤3：上传附件 */}
      {currentStep === 3 && (
        <div className="space-y-4">
          {/* 合同摘要 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">合同摘要</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">合同编号：</span>
                  <span className="font-mono">{contractNo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">企业名称：</span>
                  <span className="font-medium">{selectedEnterprise?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">签订日期：</span>
                  <span>{signDate || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">有效时长：</span>
                  <span>{duration} 年（截止：{endDate || "-"}）</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 上传附件 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="w-5 h-5" />
                合同附件
              </CardTitle>
              <CardDescription>上传合同扫描件或电子版（可选）</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 上传按钮 */}
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
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
                    <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 text-muted-foreground" />
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
                        <FileText className="w-5 h-5 text-muted-foreground" />
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
        </div>
      )}

      {/* 底部操作栏 */}
      <div className="border-t bg-card px-6 py-4 -mx-6">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            上一步
          </Button>

          {currentStep === 3 ? (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  创建合同
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              下一步
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
