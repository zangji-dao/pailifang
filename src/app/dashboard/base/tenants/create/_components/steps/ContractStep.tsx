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
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContractStepProps {
  enterpriseName: string;
  contract: {
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
  contract,
  onUpdateContract,
}: ContractStepProps) {
  const [signing, setSigning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // 初始化合同数据
  useEffect(() => {
    if (!contract) {
      onUpdateContract({
        contractNumber: `HT-${Date.now().toString().slice(-8)}`,
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        monthlyRent: 0,
        deposit: 0,
        signature: null,
      });
    }
  }, [contract, onUpdateContract]);

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
      // 将画布转为 base64
      const dataUrl = canvas.toDataURL("image/png");
      
      // 这里可以上传签名图片，暂时直接存储 base64
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

  if (!contract) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 合同信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            入驻合同
          </CardTitle>
          <CardDescription>请查看并确认入驻合同信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 合同基本信息 */}
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
                placeholder="请输入月租金"
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
                placeholder="请输入押金金额"
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
          {/* 签名提示 */}
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
    </div>
  );
}
