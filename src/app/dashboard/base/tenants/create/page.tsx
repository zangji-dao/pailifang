"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTabs } from "@/app/dashboard/tabs-context";
import { toast } from "sonner";

// 企业状态
type EnterpriseStatus = "active" | "inactive" | "pending";

// 企业类型
type EnterpriseType = "tenant" | "service";

// 行业选项
const INDUSTRIES = [
  "制造业",
  "批发和零售业",
  "信息技术服务业",
  "科学研究和技术服务业",
  "租赁和商务服务业",
  "建筑业",
  "交通运输业",
  "住宿和餐饮业",
  "金融业",
  "教育",
  "卫生和社会工作",
  "文化、体育和娱乐业",
  "其他",
];

export default function EnterpriseCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabsContext = useTabs();

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    creditCode: "",
    legalPerson: "",
    phone: "",
    registeredAddress: "",
    businessAddress: "",
    industry: "",
    settledDate: new Date().toISOString().split("T")[0],
    status: "pending" as EnterpriseStatus,
    type: "tenant" as EnterpriseType,
    remarks: "",
  });

  // 从入驻申请获取数据预填
  const applicationId = searchParams.get("applicationId");

  useEffect(() => {
    if (applicationId) {
      fetchApplicationData(applicationId);
    }
  }, [applicationId]);

  const fetchApplicationData = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/applications/${id}`);
      const result = await response.json();

      if (result.success && result.data) {
        const app = result.data;
        // 找到法人代表
        const legalPerson = app.personnel?.find(
          (p: any) => p.roles?.includes("legal_person")
        );
        
        // 预填表单
        setFormData({
          name: app.enterpriseName || "",
          creditCode: "", // 信用代码需要手动填写
          legalPerson: legalPerson?.name || "",
          phone: legalPerson?.phone || "",
          registeredAddress: app.originalRegisteredAddress || "",
          businessAddress: app.businessAddress || "",
          industry: "", // 行业需要手动选择
          settledDate: new Date().toISOString().split("T")[0],
          status: "pending" as EnterpriseStatus,
          type: "tenant" as EnterpriseType,
          remarks: `来源：入驻申请 ${app.applicationNo}`,
        });
        toast.success("已从入驻申请预填企业信息");
      }
    } catch (err) {
      console.error("获取入驻申请数据失败:", err);
      toast.error("获取入驻申请数据失败");
    } finally {
      setLoading(false);
    }
  };

  // 返回
  const handleBack = () => {
    if (tabsContext) {
      tabsContext.closeTab(`enterprise-create`);
    } else {
      router.push("/dashboard/base/tenants");
    }
  };

  // 保存
  const handleSave = async () => {
    if (!formData.name || !formData.creditCode) {
      setError("请填写必填项：企业名称和统一社会信用代码");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch("/api/enterprises", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          creditCode: formData.creditCode,
          legalPerson: formData.legalPerson,
          phone: formData.phone,
          registeredAddress: formData.registeredAddress,
          businessAddress: formData.businessAddress,
          industry: formData.industry,
          settledDate: formData.settledDate,
          status: formData.status,
          type: formData.type,
          remarks: formData.remarks,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "保存失败");
      }

      const result = await response.json();
      const enterpriseId = result.data?.id;

      // 关闭创建标签页，打开详情标签页或返回列表
      if (tabsContext) {
        tabsContext.closeTab(`enterprise-create`);
        if (enterpriseId) {
          tabsContext.openTab({
            id: `enterprise-${enterpriseId}`,
            label: formData.name,
            path: `/dashboard/base/tenants/${enterpriseId}`,
          });
        }
      } else {
        router.push("/dashboard/base/tenants");
      }
    } catch (err) {
      console.error("保存失败:", err);
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white">
      {/* 操作栏 */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回
            </Button>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-sm text-slate-500">新增入驻企业</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleBack}>
              取消
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1.5" />
              )}
              确认添加
            </Button>
          </div>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-3xl mx-auto">
          {loading && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 text-sm flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              正在从入驻申请加载数据...
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {applicationId && !loading && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
              📋 已从入驻申请预填企业信息，请补充完整后提交
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-medium text-slate-500">企业基本信息</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    企业名称 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入企业名称"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    统一社会信用代码 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.creditCode}
                    onChange={(e) => setFormData({ ...formData, creditCode: e.target.value })}
                    placeholder="请输入18位信用代码"
                    className="font-mono"
                    maxLength={18}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">法定代表人</Label>
                  <Input
                    value={formData.legalPerson}
                    onChange={(e) => setFormData({ ...formData, legalPerson: e.target.value })}
                    placeholder="请输入法定代表人姓名"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">联系电话</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="请输入联系电话"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-medium">注册地址</Label>
                  <Input
                    value={formData.registeredAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, registeredAddress: e.target.value })
                    }
                    placeholder="请输入注册地址"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-medium">经营地址（入驻地址）</Label>
                  <Input
                    value={formData.businessAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, businessAddress: e.target.value })
                    }
                    placeholder="请输入实际经营地址（如与注册地址相同可留空）"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">所属行业</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => setFormData({ ...formData, industry: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择行业" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">入驻日期</Label>
                  <Input
                    type="date"
                    value={formData.settledDate}
                    onChange={(e) => setFormData({ ...formData, settledDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">企业类型</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value as EnterpriseType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant">入驻企业</SelectItem>
                      <SelectItem value="service">服务企业</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-400">
                    {formData.type === "service"
                      ? "服务企业：不在基地内注册的企业，如合作会计师事务所、律师事务所等"
                      : "入驻企业：在基地内注册的企业"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">企业状态</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value as EnterpriseStatus })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">待入驻</SelectItem>
                      <SelectItem value="active">入驻中</SelectItem>
                      <SelectItem value="inactive">已迁出</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-medium">备注</Label>
                  <Input
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="备注信息"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
