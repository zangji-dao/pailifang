"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Home, Store, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

type EnterpriseType = "tenant" | "non_tenant";

interface SelectTypeStepProps {
  enterpriseType: EnterpriseType | null;
  enterpriseCode: string;
  onSelectType: (type: EnterpriseType) => void;
}

export function SelectTypeStep({ 
  enterpriseType, 
  enterpriseCode, 
  onSelectType 
}: SelectTypeStepProps) {
  const [generatedCode, setGeneratedCode] = useState(enterpriseCode);

  // 选择类型后生成企业编号
  useEffect(() => {
    if (enterpriseType && !enterpriseCode) {
      generateEnterpriseCode(enterpriseType);
    }
  }, [enterpriseType, enterpriseCode]);

  const generateEnterpriseCode = async (type: EnterpriseType) => {
    try {
      const res = await fetch("/api/enterprises/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const result = await res.json();
      if (result.success) {
        setGeneratedCode(result.data.code);
      }
    } catch (error) {
      console.error("生成企业编号失败:", error);
      const prefix = type === "tenant" ? "RQ" : "NQ";
      const timestamp = Date.now().toString().slice(-8);
      setGeneratedCode(`${prefix}-${timestamp}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>选择企业类型</CardTitle>
        <CardDescription>请选择要创建的企业类型</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {/* 入驻企业 */}
          <Card 
            className={`cursor-pointer transition-all hover:border-primary hover:shadow-lg ${
              enterpriseType === "tenant" ? "border-primary ring-2 ring-primary/20" : ""
            }`}
            onClick={() => onSelectType("tenant")}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Home className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">入驻企业</h3>
              <p className="text-sm text-muted-foreground mb-4">
                在园区内分配工位的企业
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• 分配工位号</p>
                <p>• 上传产权证明</p>
                <p>• 待工商注册</p>
              </div>
            </CardContent>
          </Card>

          {/* 非入驻企业 */}
          <Card 
            className={`cursor-pointer transition-all hover:border-primary hover:shadow-lg ${
              enterpriseType === "non_tenant" ? "border-primary ring-2 ring-primary/20" : ""
            }`}
            onClick={() => onSelectType("non_tenant")}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Store className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">非入驻企业</h3>
              <p className="text-sm text-muted-foreground mb-4">
                不在园区入驻，仅使用园区服务
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• 无需分配工位</p>
                <p>• 上传产权证明</p>
                <p>• 待工商变更</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 企业编号预览 */}
        {generatedCode && enterpriseType && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              系统已分配企业编号：<strong className="text-primary">{generatedCode}</strong>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
