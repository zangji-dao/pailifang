"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  Loader2,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTabs } from "@/app/dashboard/tabs-context";
import { MapPicker } from "@/components/map/MapPicker";

interface BaseData {
  id: string;
  name: string;
  address: string | null;
  addressTemplate?: string | null;
  status: string;
  managementCompanyName?: string | null;
  managementCompanyCreditCode?: string | null;
  managementCompanyLegalPerson?: string | null;
  managementCompanyAddress?: string | null;
  managementCompanyPhone?: string | null;
}

export default function EditBasePage() {
  const params = useParams();
  const router = useRouter();
  const tabs = useTabs();
  const baseId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 表单数据
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    address_template: "",
    status: "active",
    // 管理公司信息（甲方）
    management_company_name: "",
    management_company_credit_code: "",
    management_company_legal_person: "",
    management_company_address: "",
    management_company_phone: "",
  });
  
  // 解析地址模板为前缀和后缀
  const parseAddressTemplate = (template: string) => {
    if (!template) return { prefix: "", suffix: "" };
    const match = template.match(/^(.+?)（工位号）(.*)$/);
    if (match) {
      return { prefix: match[1] || "", suffix: match[2] || "" };
    }
    return { prefix: template, suffix: "" };
  };
  
  // 获取地址模板前缀和后缀
  const addressParts = parseAddressTemplate(formData.address_template);
  const [submitting, setSubmitting] = useState(false);

  // 加载基地数据
  useEffect(() => {
    const fetchBase = async () => {
      try {
        const response = await fetch(`/api/bases/${baseId}`);
        const result = await response.json();
        
        if (result.success) {
          const base: BaseData = result.data;
          setFormData({
            name: base.name,
            address: base.address || "",
            address_template: base.addressTemplate || "",
            status: base.status,
            management_company_name: base.managementCompanyName || "",
            management_company_credit_code: base.managementCompanyCreditCode || "",
            management_company_legal_person: base.managementCompanyLegalPerson || "",
            management_company_address: base.managementCompanyAddress || "",
            management_company_phone: base.managementCompanyPhone || "",
          });
        } else {
          setError(result.error || "获取基地信息失败");
        }
      } catch (err) {
        console.error("获取基地信息失败:", err);
        setError("获取基地信息失败");
      } finally {
        setLoading(false);
      }
    };

    fetchBase();
  }, [baseId]);

  // 更新基地
  const handleUpdateBase = async () => {
    if (!formData.name.trim()) {
      toast.error("请输入基地名称");
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/bases/${baseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      if (result.success) {
        toast.success("基地更新成功");
        // 关闭当前标签页并跳转到基地列表
        if (tabs) {
          tabs.closeCurrentTabAndNavigate("/dashboard/base/sites");
        } else {
          router.push("/dashboard/base/sites");
        }
      } else {
        toast.error(result.error || "更新失败");
      }
    } catch (error) {
      console.error("更新基地失败:", error);
      toast.error("更新失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  // 返回列表
  const handleGoBack = () => {
    if (tabs) {
      tabs.closeCurrentTabAndNavigate("/dashboard/base/sites");
    } else {
      router.push("/dashboard/base/sites");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-lg font-medium">{error}</p>
        <Button variant="outline" onClick={handleGoBack}>
          返回列表
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* 头部 */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoBack}
          className="text-slate-600"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回列表
        </Button>
      </div>

      {/* 表单卡片 */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">编辑基地</h2>
          <p className="text-sm text-slate-500 mt-1">修改基地基本信息</p>
        </div>
        
        {/* 表单内容 */}
        <div className="p-6 space-y-5">
          {/* 基地名称 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              基地名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入基地名称"
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            />
          </div>
          
          {/* 基地地址 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              基地地址
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="请输入基地详细地址"
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            />
          </div>
          
          {/* 地址模板 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              地址模板
              <span className="text-xs text-slate-400 font-normal ml-1">用于生成工位号地址</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={addressParts.prefix}
                  onChange={(e) => {
                    const newTemplate = `${e.target.value}（工位号）${addressParts.suffix}`;
                    setFormData({ ...formData, address_template: newTemplate });
                  }}
                  placeholder="如：松原市宁江区建华路义乌城小区"
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
              <div className="flex items-center justify-center px-2 h-10 text-slate-400 text-sm whitespace-nowrap">
                + 工位号 +
              </div>
              <div className="w-24">
                <input
                  type="text"
                  value={addressParts.suffix}
                  onChange={(e) => {
                    const newTemplate = `${addressParts.prefix}（工位号）${e.target.value}`;
                    setFormData({ ...formData, address_template: newTemplate });
                  }}
                  placeholder="号"
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
            </div>
            {formData.address_template && (
              <p className="text-xs text-slate-500 mt-1.5">
                示例：{addressParts.prefix}108{addressParts.suffix}
              </p>
            )}
          </div>
          
          {/* 地图选点 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              在地图上选择位置
            </label>
            <MapPicker
              value={
                formData.address
                  ? {
                      lng: 0,
                      lat: 0,
                      address: formData.address,
                    }
                  : undefined
              }
              onChange={(location) => {
                setFormData({
                  ...formData,
                  address: location.address || formData.address,
                });
              }}
              placeholder="点击在地图上选择基地位置"
            />
          </div>
          
          {/* 状态 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              状态
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={formData.status === "active"}
                  onChange={() => setFormData({ ...formData, status: "active" })}
                  className="w-4 h-4 text-amber-500 border-slate-300 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700">运营中</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={formData.status === "inactive"}
                  onChange={() => setFormData({ ...formData, status: "inactive" })}
                  className="w-4 h-4 text-amber-500 border-slate-300 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700">已停用</span>
              </label>
            </div>
          </div>
          
          {/* 分隔线 */}
          <div className="border-t border-slate-200 pt-5 mt-5">
            <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-500" />
              管理公司信息（合同甲方）
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              填写该基地的管理公司信息，用于生成入驻合同时作为甲方信息
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              {/* 管理公司名称 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  管理公司名称
                </label>
                <input
                  type="text"
                  value={formData.management_company_name}
                  onChange={(e) => setFormData({ ...formData, management_company_name: e.target.value })}
                  placeholder="例如：XX企业服务中心"
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
              
              {/* 统一社会信用代码 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  统一社会信用代码
                </label>
                <input
                  type="text"
                  value={formData.management_company_credit_code}
                  onChange={(e) => setFormData({ ...formData, management_company_credit_code: e.target.value })}
                  placeholder="18位信用代码"
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 font-mono"
                />
              </div>
              
              {/* 法定代表人 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  法定代表人
                </label>
                <input
                  type="text"
                  value={formData.management_company_legal_person}
                  onChange={(e) => setFormData({ ...formData, management_company_legal_person: e.target.value })}
                  placeholder="法人姓名"
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
              
              {/* 联系电话 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  联系电话
                </label>
                <input
                  type="text"
                  value={formData.management_company_phone}
                  onChange={(e) => setFormData({ ...formData, management_company_phone: e.target.value })}
                  placeholder="联系电话"
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
              
              {/* 公司地址 */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  公司地址
                </label>
                <input
                  type="text"
                  value={formData.management_company_address}
                  onChange={(e) => setFormData({ ...formData, management_company_address: e.target.value })}
                  placeholder="详细地址"
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-xl">
          <Button
            variant="outline"
            onClick={handleGoBack}
            disabled={submitting}
          >
            取消
          </Button>
          <Button
            onClick={handleUpdateBase}
            disabled={submitting}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              "保存修改"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
