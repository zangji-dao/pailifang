"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
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
import { cn } from "@/lib/utils";

// 企业状态
type EnterpriseStatus = "active" | "inactive" | "pending";

// 企业类型
type EnterpriseType = "tenant" | "service";

// 企业信息接口
interface Enterprise {
  id: string;
  name: string;
  creditCode: string;
  legalPerson: string;
  phone: string;
  registeredAddress: string;
  businessAddress: string;
  industry: string;
  入驻Date: string;
  status: EnterpriseStatus;
  type: EnterpriseType;
  remarks: string;
}

// API响应类型
interface ApiEnterprise {
  id: string;
  name: string;
  creditCode: string | null;
  legalPerson: string | null;
  phone: string | null;
  registeredAddress: string | null;
  businessAddress: string | null;
  industry: string | null;
  settledDate: string | null;
  status: string;
  type: string;
  remarks: string | null;
}

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

// 转换API数据到前端格式
function transformEnterprise(api: ApiEnterprise): Enterprise {
  return {
    id: api.id,
    name: api.name,
    creditCode: api.creditCode || "",
    legalPerson: api.legalPerson || "",
    phone: api.phone || "",
    registeredAddress: api.registeredAddress || "",
    businessAddress: api.businessAddress || "",
    industry: api.industry || "",
    入驻Date: api.settledDate || "",
    status: api.status as EnterpriseStatus,
    type: api.type as EnterpriseType,
    remarks: api.remarks || "",
  };
}

export default function EnterpriseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const tabsContext = useTabs();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Enterprise>>({});

  // 获取企业详情
  useEffect(() => {
    const fetchEnterprise = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/enterprises/${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error("获取企业数据失败");
        }
        const result = await response.json();
        if (result.data) {
          const enterprise = transformEnterprise(result.data);
          setFormData(enterprise);
        } else {
          throw new Error("企业不存在");
        }
        setError(null);
      } catch (err) {
        console.error("获取企业数据失败:", err);
        setError(err instanceof Error ? err.message : "获取企业数据失败");
      } finally {
        setLoading(false);
      }
    };

    fetchEnterprise();
  }, [resolvedParams.id]);

  // 返回
  const handleBack = () => {
    // 先尝试关闭 tab（如果存在）
    if (tabsContext) {
      const tabId = `enterprise-edit-${resolvedParams.id}`;
      const tabExists = tabsContext.tabs.some(t => t.id === tabId);
      if (tabExists) {
        tabsContext.closeTab(tabId);
      }
    }
    // 始终执行导航返回详情页
    router.push(`/dashboard/base/tenants/${resolvedParams.id}`);
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

      const response = await fetch(`/api/enterprises/${resolvedParams.id}`, {
        method: "PUT",
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
          settledDate: formData.入驻Date,
          status: formData.status,
          type: formData.type,
          remarks: formData.remarks,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "保存失败");
      }

      // 关闭编辑标签页（如果存在），导航到详情页
      if (tabsContext) {
        const editTabId = `enterprise-edit-${resolvedParams.id}`;
        const tabExists = tabsContext.tabs.some(t => t.id === editTabId);
        if (tabExists) {
          tabsContext.closeTab(editTabId);
        }
      }
      router.push(`/dashboard/base/tenants/${resolvedParams.id}`);
    } catch (err) {
      console.error("保存失败:", err);
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  // 加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-600">加载中...</span>
      </div>
    );
  }

  // 错误状态
  if (error && !formData.id) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button variant="outline" onClick={handleBack}>
          返回
        </Button>
      </div>
    );
  }

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
            <span className="text-sm text-slate-500">编辑企业信息</span>
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
              保存修改
            </Button>
          </div>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-3xl mx-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
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
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入企业名称"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    统一社会信用代码 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.creditCode || ""}
                    onChange={(e) => setFormData({ ...formData, creditCode: e.target.value })}
                    placeholder="请输入18位信用代码"
                    className="font-mono"
                    maxLength={18}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">法定代表人</Label>
                  <Input
                    value={formData.legalPerson || ""}
                    onChange={(e) => setFormData({ ...formData, legalPerson: e.target.value })}
                    placeholder="请输入法定代表人姓名"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">联系电话</Label>
                  <Input
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="请输入联系电话"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-medium">注册地址</Label>
                  <Input
                    value={formData.registeredAddress || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, registeredAddress: e.target.value })
                    }
                    placeholder="请输入注册地址"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-medium">经营地址（入驻地址）</Label>
                  <Input
                    value={formData.businessAddress || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, businessAddress: e.target.value })
                    }
                    placeholder="请输入实际经营地址（如与注册地址相同可留空）"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">所属行业</Label>
                  <Select
                    value={formData.industry || ""}
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
                    value={formData.入驻Date || ""}
                    onChange={(e) => setFormData({ ...formData, 入驻Date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">企业类型</Label>
                  <Select
                    value={formData.type || "tenant"}
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
                    value={formData.status || "pending"}
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
                    value={formData.remarks || ""}
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
