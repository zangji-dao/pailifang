"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  FileSignature, 
  Calendar, 
  DollarSign, 
  Check, 
  Loader2,
  Info,
  RefreshCw,
  Search,
  Building2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// 合同类型
type ContractType = "free" | "paid" | "tax_commitment";

// 合同数据接口
interface Contract {
  id: string;
  enterpriseId: string | null;
  enterpriseName: string | null;
  contractNo: string | null;
  contractType: ContractType;
  rentAmount: string | null;
  depositAmount: string | null;
  taxCommitment: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
}

// 合同类型配置
const contractTypeConfig: Record<ContractType, { label: string; className: string }> = {
  free: { label: "免费入驻", className: "text-green-600" },
  paid: { label: "付费入驻", className: "text-blue-600" },
  tax_commitment: { label: "承诺税收", className: "text-amber-600" },
};

interface ContractStepProps {
  enterpriseName: string;
  enterpriseId?: string | null;
  contract: {
    contractId: string | null;
    contractNumber: string;
    startDate: string;
    endDate: string;
    monthlyRent: number;
    deposit: number;
    signature: string | null;
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
  const [signing, setSigning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // 加载可选择的合同列表
  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      try {
        // 获取待签和草稿状态的合同
        const response = await fetch("/api/settlement/contracts?status=pending,draft");
        if (response.ok) {
          const result = await response.json();
          setContracts(result.data || []);
        }
      } catch (error) {
        console.error("获取合同列表失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  // 初始化画布
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
      }
    }
  }, []);

  // 选择合同
  const handleSelectContract = (selectedContract: Contract) => {
    onUpdateContract({
      contractId: selectedContract.id,
      contractNumber: selectedContract.contractNo || "",
      startDate: selectedContract.startDate || new Date().toISOString().split("T")[0],
      endDate: selectedContract.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      monthlyRent: parseFloat(selectedContract.rentAmount || "0"),
      deposit: parseFloat(selectedContract.depositAmount || "0"),
      signature: null,
    });
    toast({ title: "已选择合同", description: selectedContract.contractNo || "未命名合同" });
  };

  // 开始绘制
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsDrawing(true);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  // 绘制中
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // 结束绘制
  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // 清除签名
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (contract) {
      onUpdateContract({ ...contract, signature: null });
    }
  };

  // 确认签名
  const confirmSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setSigning(true);
    try {
      const dataUrl = canvas.toDataURL("image/png");
      
      if (contract) {
        onUpdateContract({ ...contract, signature: dataUrl });
        toast({ title: "签名成功" });
      }
    } catch (error) {
      console.error("签名保存失败:", error);
      toast({ title: "签名保存失败", variant: "destructive" });
    } finally {
      setSigning(false);
    }
  };

  // 过滤合同列表
  const filteredContracts = contracts.filter(c => {
    if (!searchKeyword) return true;
    return (c.contractNo?.includes(searchKeyword)) || 
           (c.enterpriseName?.includes(searchKeyword));
  });

  // 格式化金额
  const formatAmount = (amount: string | number | null) => {
    if (!amount) return "-";
    return `¥${Number(amount).toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* 选择合同 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            选择合同
          </CardTitle>
          <CardDescription>从已有合同中选择一份进行关联</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索合同编号或企业名称..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 合同列表 */}
          <div className="border rounded-lg divide-y max-h-[300px] overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">加载中...</span>
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <FileText className="w-10 h-10 mb-2" />
                <p>暂无可选合同</p>
                <p className="text-xs mt-1">请先在合同管理中创建合同</p>
              </div>
            ) : (
              filteredContracts.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                    contract?.contractId === c.id && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                  onClick={() => handleSelectContract(c)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-step-sky-muted flex items-center justify-center">
                      <FileText className="w-5 h-5 text-step-sky" />
                    </div>
                    <div>
                      <p className="font-medium">{c.contractNo || "未命名合同"}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {c.enterpriseName && (
                          <>
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{c.enterpriseName}</span>
                          </>
                        )}
                        <span className={cn("ml-2", contractTypeConfig[c.contractType].className)}>
                          {contractTypeConfig[c.contractType].label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">{formatAmount(c.rentAmount)}/月</p>
                    <p className="text-muted-foreground">押金 {formatAmount(c.depositAmount)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 已选合同信息 */}
      {contract && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                合同详情
              </CardTitle>
              <CardDescription>已选择的合同信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>合同编号</Label>
                  <Input value={contract.contractNumber} disabled />
                </div>
                <div className="space-y-2">
                  <Label>企业名称</Label>
                  <Input value={enterpriseName} disabled />
                </div>
              </div>

              <Separator />

              {/* 合同期限 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    开始日期
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={contract.startDate}
                    onChange={(e) => onUpdateContract({ ...contract, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    结束日期
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={contract.endDate}
                    onChange={(e) => onUpdateContract({ ...contract, endDate: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              {/* 费用信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyRent" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    月租金（元）
                  </Label>
                  <Input
                    id="monthlyRent"
                    type="number"
                    value={contract.monthlyRent}
                    onChange={(e) => onUpdateContract({ ...contract, monthlyRent: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    押金（元）
                  </Label>
                  <Input
                    id="deposit"
                    type="number"
                    value={contract.deposit}
                    onChange={(e) => onUpdateContract({ ...contract, deposit: Number(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 电子签名 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="w-5 h-5" />
                电子签名
              </CardTitle>
              <CardDescription>请在下方区域内手写签名确认</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-step-sky/30 bg-step-sky-muted">
                <Info className="h-4 w-4 text-step-sky" />
                <AlertDescription className="text-step-sky-foreground">
                  请使用鼠标或触摸屏在白色区域内手写签名，签名后将作为合同确认依据
                </AlertDescription>
              </Alert>

              {/* 签名区域 */}
              <div className="border-2 border-dashed border-step-sky/30 rounded-lg p-4 bg-step-sky-muted/50">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  className="w-full bg-white rounded border cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSignature}
                  disabled={signing}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  清除重签
                </Button>
                
                <Button
                  size="sm"
                  onClick={confirmSignature}
                  disabled={signing}
                >
                  {signing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  确认签名
                </Button>
              </div>

              {/* 签名状态 */}
              {contract.signature && (
                <div className="flex items-center gap-2 text-sm text-step-sky">
                  <Check className="w-4 h-4" />
                  已签名确认
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
