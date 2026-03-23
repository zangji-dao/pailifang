"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, Loader2, Building2, User, Phone, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIndustries } from "@/hooks/useIndustries";

interface BusinessRegistrationStepProps {
  enterpriseName: string;
  businessLicense: { name: string; url: string } | null;
  creditCode: string;
  legalPerson: string;
  phone: string;
  industry: string;
  onUpdateBusinessLicense: (license: { name: string; url: string } | null) => void;
  onUpdateCreditCode: (code: string) => void;
  onUpdateLegalPerson: (person: string) => void;
  onUpdatePhone: (phone: string) => void;
  onUpdateIndustry: (industry: string) => void;
}

export function BusinessRegistrationStep({
  enterpriseName,
  businessLicense,
  creditCode,
  legalPerson,
  phone,
  industry,
  onUpdateBusinessLicense,
  onUpdateCreditCode,
  onUpdateLegalPerson,
  onUpdatePhone,
  onUpdateIndustry,
}: BusinessRegistrationStepProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { industries, loading: industriesLoading } = useIndustries();

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "business-licenses");

      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (result.success || result.url) {
        const url = result.data?.url || result.url;
        onUpdateBusinessLicense({ name: file.name, url });
        toast({ title: "上传成功" });
      } else {
        throw new Error(result.error || result.message || "上传失败");
      }
    } catch (error: any) {
      console.error("上传失败:", error);
      toast({ title: "上传失败", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 上传营业执照 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            上传营业执照
          </CardTitle>
          <CardDescription>请上传清晰的营业执照照片或扫描件</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 已上传的执照 */}
          {businessLicense && (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-step-amber-muted border-step-amber/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-step-amber-muted flex items-center justify-center">
                  <FileText className="w-5 h-5 text-step-amber" />
                </div>
                <div>
                  <p className="font-medium">{businessLicense.name}</p>
                  <p className="text-xs text-muted-foreground">已上传</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdateBusinessLicense(null)}
                className="text-destructive"
              >
                删除
              </Button>
            </div>
          )}

          {/* 上传区域 */}
          {!businessLicense && (
            <label
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors block
                ${uploading ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:bg-muted/50"}`}
            >
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                disabled={uploading}
              />
              <div className="space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-step-amber-muted flex items-center justify-center">
                  <Upload className="w-7 h-7 text-step-amber" />
                </div>
                <div>
                  <p className="text-sm font-medium">点击上传营业执照</p>
                  <p className="text-xs text-muted-foreground mt-1">支持图片或PDF格式</p>
                </div>
              </div>
            </label>
          )}

          {uploading && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">上传中...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 工商信息填写 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            工商注册信息
          </CardTitle>
          <CardDescription>请填写企业的工商注册信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="creditCode">统一社会信用代码</Label>
              <Input
                id="creditCode"
                value={creditCode}
                onChange={(e) => onUpdateCreditCode(e.target.value)}
                placeholder="请输入18位信用代码"
                maxLength={18}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legalPerson">法定代表人</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="legalPerson"
                  value={legalPerson}
                  onChange={(e) => onUpdateLegalPerson(e.target.value)}
                  placeholder="请输入法定代表人姓名"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">联系电话</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => onUpdatePhone(e.target.value)}
                  placeholder="请输入联系电话"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">所属行业</Label>
              <Select value={industry} onValueChange={onUpdateIndustry}>
                <SelectTrigger className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="请选择行业" className="pl-6" />
                </SelectTrigger>
                <SelectContent>
                  {industriesLoading ? (
                    <SelectItem value="_loading" disabled>加载中...</SelectItem>
                  ) : industries.length === 0 ? (
                    <SelectItem value="_empty" disabled>暂无行业数据</SelectItem>
                  ) : (
                    industries.map((ind) => (
                      <SelectItem key={ind.id} value={ind.name}>
                        {ind.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 企业名称显示 */}
          <div className="p-4 bg-step-amber-muted rounded-lg border border-step-amber/30">
            <p className="text-sm text-step-amber">企业名称</p>
            <p className="font-semibold text-lg text-step-amber-foreground">{enterpriseName || "未填写"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
