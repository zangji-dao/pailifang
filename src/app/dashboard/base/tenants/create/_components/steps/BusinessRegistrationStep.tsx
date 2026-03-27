"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, Loader2, Building2, User, Phone, CreditCard, Sparkles, Eye, MapPin, DollarSign, Briefcase, Calendar, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIndustries } from "@/hooks/useIndustries";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface BusinessRegistrationStepProps {
  enterpriseName: string;
  businessLicense: { name: string; url: string } | null;
  creditCode: string;
  legalPerson: string;
  phone: string;
  industry: string;
  // 新增字段
  registeredCapital?: string;
  businessScope?: string;
  establishDate?: string;
  registeredAddress?: string;
  // 回调
  onUpdateBusinessLicense: (license: { name: string; url: string } | null) => void;
  onUpdateCreditCode: (code: string) => void;
  onUpdateLegalPerson: (person: string) => void;
  onUpdatePhone: (phone: string) => void;
  onUpdateIndustry: (industry: string) => void;
  onUpdateEnterpriseName?: (name: string) => void;
  onUpdateBusinessScope?: (scope: string) => void;
  onUpdateRegisteredCapital?: (capital: string) => void;
  onUpdateEstablishDate?: (date: string) => void;
  onUpdateRegisteredAddress?: (address: string) => void;
}

export function BusinessRegistrationStep({
  enterpriseName,
  businessLicense,
  creditCode,
  legalPerson,
  phone,
  industry,
  registeredCapital = "",
  businessScope = "",
  establishDate = "",
  registeredAddress = "",
  onUpdateBusinessLicense,
  onUpdateCreditCode,
  onUpdateLegalPerson,
  onUpdatePhone,
  onUpdateIndustry,
  onUpdateEnterpriseName,
  onUpdateBusinessScope,
  onUpdateRegisteredCapital,
  onUpdateEstablishDate,
  onUpdateRegisteredAddress,
}: BusinessRegistrationStepProps) {
  const [uploading, setUploading] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [addIndustryOpen, setAddIndustryOpen] = useState(false);
  const [newIndustryName, setNewIndustryName] = useState("");
  const [addingIndustry, setAddingIndustry] = useState(false);
  const { toast } = useToast();
  const { industries, loading: industriesLoading, createIndustry } = useIndustries();

  // 添加新行业
  const handleAddIndustry = async () => {
    if (!newIndustryName.trim()) {
      toast({ title: "请输入行业名称", variant: "destructive" });
      return;
    }
    setAddingIndustry(true);
    try {
      const newIndustry = await createIndustry(newIndustryName.trim());
      if (newIndustry) {
        toast({ title: "添加成功", description: `已添加行业「${newIndustry.name}」` });
        onUpdateIndustry(newIndustry.name);
        setNewIndustryName("");
        setAddIndustryOpen(false);
      }
    } catch (error: any) {
      toast({ title: "添加失败", description: error.message, variant: "destructive" });
    } finally {
      setAddingIndustry(false);
    }
  };

  // 识别营业执照
  const recognizeLicense = async (imageUrl: string) => {
    setRecognizing(true);
    try {
      const res = await fetch("/api/ocr/business-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      const result = await res.json();

      if (result.success && result.data) {
        const { 
          creditCode: code, 
          legalPerson: person, 
          enterpriseName: name, 
          businessScope: scope,
          registeredCapital: capital,
          establishDate: date,
          address
        } = result.data;

        // 自动填充识别结果
        let filledCount = 0;
        if (code) { onUpdateCreditCode(code); filledCount++; }
        if (person) { onUpdateLegalPerson(person); filledCount++; }
        if (name && onUpdateEnterpriseName) { onUpdateEnterpriseName(name); filledCount++; }
        if (scope && onUpdateBusinessScope) { onUpdateBusinessScope(scope); filledCount++; }
        if (capital && onUpdateRegisteredCapital) { onUpdateRegisteredCapital(capital); filledCount++; }
        if (date && onUpdateEstablishDate) { onUpdateEstablishDate(date); filledCount++; }
        if (address && onUpdateRegisteredAddress) { onUpdateRegisteredAddress(address); filledCount++; }

        toast({
          title: "识别成功",
          description: `已自动填充 ${filledCount} 项信息`,
        });
      } else {
        toast({
          title: "识别失败",
          description: result.error || "无法识别营业执照，请手动填写",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("识别失败:", error);
      toast({
        title: "识别失败",
        description: "请手动填写信息",
        variant: "destructive",
      });
    } finally {
      setRecognizing(false);
    }
  };

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

        // 上传成功后自动识别
        recognizeLicense(url);
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
          <CardDescription>上传后将自动识别并填充信息</CardDescription>
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
              <div className="flex items-center gap-1">
                {/* 重新识别 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => recognizeLicense(businessLicense.url)}
                  disabled={recognizing}
                  className="text-primary"
                >
                  {recognizing ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-1" />
                  )}
                  识别
                </Button>
                {/* 查看 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewOpen(true)}
                  className="text-primary"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  查看
                </Button>
                {/* 删除 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdateBusinessLicense(null)}
                  className="text-destructive"
                >
                  删除
                </Button>
              </div>
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
                  <p className="text-xs text-muted-foreground mt-1">支持图片或PDF格式，将自动识别</p>
                </div>
              </div>
            </label>
          )}

          {(uploading || recognizing) && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">{uploading ? "上传中..." : "正在识别营业执照..."}</span>
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
          <CardDescription>
            {businessLicense ? "已识别的信息可手动修改" : "请填写企业的工商注册信息"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 企业名称 */}
          <div className="space-y-2">
            <Label htmlFor="enterpriseName" className="flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              企业名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="enterpriseName"
              value={enterpriseName}
              onChange={(e) => onUpdateEnterpriseName?.(e.target.value)}
              placeholder="请输入企业名称"
            />
          </div>

          {/* 第一行：信用代码 + 法人 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="creditCode">统一社会信用代码</Label>
              <Input
                id="creditCode"
                value={creditCode}
                onChange={(e) => onUpdateCreditCode(e.target.value)}
                placeholder="18位信用代码"
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
                  placeholder="法定代表人姓名"
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* 第二行：注册资本 + 成立日期 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="registeredCapital">注册资本</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="registeredCapital"
                  value={registeredCapital}
                  onChange={(e) => onUpdateRegisteredCapital?.(e.target.value)}
                  placeholder="如：100万元"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="establishDate">成立日期</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="establishDate"
                  type="date"
                  value={establishDate}
                  onChange={(e) => onUpdateEstablishDate?.(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* 第三行：联系电话 + 所属行业 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">联系电话</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => onUpdatePhone(e.target.value)}
                  placeholder="联系电话"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">所属行业</Label>
              <Select 
                value={industry} 
                onValueChange={(value) => {
                  if (value === "_add_new") {
                    setAddIndustryOpen(true);
                  } else {
                    onUpdateIndustry(value);
                  }
                }}
              >
                <SelectTrigger className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="请选择行业" className="pl-6" />
                </SelectTrigger>
                <SelectContent>
                  {/* 添加新行业选项 */}
                  <SelectItem value="_add_new">
                    <span className="flex items-center gap-2 text-primary">
                      <Plus className="w-4 h-4" />
                      添加新行业...
                    </span>
                  </SelectItem>
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

          {/* 添加新行业对话框 */}
          <Dialog open={addIndustryOpen} onOpenChange={setAddIndustryOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>添加新行业</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="newIndustry">行业名称</Label>
                  <Input
                    id="newIndustry"
                    value={newIndustryName}
                    onChange={(e) => setNewIndustryName(e.target.value)}
                    placeholder="请输入行业名称"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddIndustry();
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddIndustryOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleAddIndustry} disabled={addingIndustry}>
                  {addingIndustry && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  添加
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 注册地址 */}
          <div className="space-y-2">
            <Label htmlFor="registeredAddress" className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              注册地址
            </Label>
            <Input
              id="registeredAddress"
              value={registeredAddress}
              onChange={(e) => onUpdateRegisteredAddress?.(e.target.value)}
              placeholder="营业执照上的注册地址"
            />
          </div>

          {/* 经营范围 */}
          <div className="space-y-2">
            <Label htmlFor="businessScope" className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              经营范围
            </Label>
            <Textarea
              id="businessScope"
              value={businessScope}
              onChange={(e) => onUpdateBusinessScope?.(e.target.value)}
              placeholder="请输入经营范围"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 营业执照预览弹窗 */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="truncate">{businessLicense?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/50 rounded-lg">
            {businessLicense && (
              <img
                src={businessLicense.url}
                alt="营业执照"
                className="max-w-full max-h-[70vh] object-contain"
                onError={(e) => {
                  console.error('图片加载失败:', businessLicense.url);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
