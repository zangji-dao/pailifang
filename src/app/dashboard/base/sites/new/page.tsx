"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  ArrowLeft,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTabs } from "@/app/dashboard/tabs-context";
import { MapPicker, type Location } from "@/components/map/MapPicker";
import { apiClient } from "@/lib/apiClient";
import {
  OperatorOrganizationSelect,
  type OperatorOrganization,
} from "../_components/OperatorOrganizationSelect";

export default function NewBasePage() {
  const router = useRouter();
  const tabs = useTabs();
  
  // 表单数据
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    address_template: "",
    status: "active",
    organization_id: "",
  });
  const [operatorOrganizations, setOperatorOrganizations] = useState<OperatorOrganization[]>([]);
  const [operatorsLoading, setOperatorsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location>();
  
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

  useEffect(() => {
    let active = true;
    void apiClient.get<Array<OperatorOrganization & { type: string }>>("/api/access-control/organizations").then((response) => {
      if (!active) return;
      if (!response.success || !response.data) {
        toast.error(response.error || "运营机构加载失败");
        setOperatorsLoading(false);
        return;
      }
      setOperatorOrganizations(response.data.filter((organization) => organization.type === "park" && organization.status === "active"));
      setOperatorsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  // 创建基地
  const handleCreateBase = async () => {
    if (!formData.name.trim()) {
      toast.error("请输入基地名称");
      return;
    }
    if (!formData.organization_id) {
      toast.error("请选择运营机构");
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch("/api/bases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      if (result.success) {
        toast.success("基地创建成功");
        // 关闭当前标签页并跳转到基地列表
        if (tabs) {
          tabs.closeCurrentTabAndNavigate("/dashboard/base/sites");
        } else {
          router.push("/dashboard/base/sites");
        }
      } else {
        toast.error(result.error || "创建失败");
      }
    } catch (error) {
      console.error("创建基地失败:", error);
      toast.error("创建失败，请重试");
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

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* 头部 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoBack}
          className="h-10 rounded-xl text-slate-600 hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回列表
        </Button>
      </div>

      {/* 表单卡片 */}
      <div className="dashboard-surface overflow-hidden">
        {/* 头部 */}
        <div className="border-b border-slate-100 bg-gradient-to-r from-white to-amber-50/50 px-4 py-4 sm:px-6 sm:py-5">
          <h2 className="text-lg font-semibold text-slate-900">新增基地</h2>
          <p className="text-sm text-slate-500 mt-1">填写基地基本信息</p>
        </div>
        
        {/* 表单内容 */}
        <div className="space-y-5 p-4 sm:p-6">
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
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
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
              onChange={(e) => {
                setSelectedLocation(undefined);
                setFormData({ ...formData, address: e.target.value });
              }}
              placeholder="请输入基地详细地址"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            />
          </div>
          
          {/* 地图选点 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              在地图上选择位置
            </label>
            <MapPicker
              value={
                selectedLocation || (formData.address
                  ? {
                      lng: 0,
                      lat: 0,
                      address: formData.address,
                    }
                  : undefined)
              }
              onChange={(location) => {
                setSelectedLocation(location.address ? location : undefined);
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
          
          {/* 地址模板区块 */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
            <h3 className="text-base font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-500" />
              地址模板设置
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              设置工位号地址模板，用于自动生成工位号地址
            </p>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                地址模板
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_6rem] sm:items-center">
                <div className="min-w-0">
                  <input
                    type="text"
                    value={addressParts.prefix}
                    onChange={(e) => {
                      const newTemplate = `${e.target.value}（工位号）${addressParts.suffix}`;
                      setFormData({ ...formData, address_template: newTemplate });
                    }}
                    placeholder="如：松原市宁江区建华路义乌城小区"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                  />
                </div>
                <div className="flex h-8 items-center justify-center px-2 text-sm text-slate-400 sm:h-11">
                  + 工位号 +
                </div>
                <div>
                  <input
                    type="text"
                    value={addressParts.suffix}
                    onChange={(e) => {
                      const newTemplate = `${addressParts.prefix}（工位号）${e.target.value}`;
                      setFormData({ ...formData, address_template: newTemplate });
                    }}
                    placeholder="号"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                  />
                </div>
              </div>
              {formData.address_template && (
                <p className="text-xs text-slate-500">
                  示例：{addressParts.prefix}108{addressParts.suffix}
                </p>
              )}
            </div>
          </div>
          
          <OperatorOrganizationSelect
            organizations={operatorOrganizations}
            value={formData.organization_id}
            onChange={(organization_id) => setFormData({ ...formData, organization_id })}
            loading={operatorsLoading}
          />
        </div>
        
        {/* 底部按钮 */}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <Button
            variant="outline"
            onClick={handleGoBack}
            disabled={submitting || operatorsLoading || operatorOrganizations.length === 0}
            className="h-11 w-full rounded-xl sm:w-auto"
          >
            取消
          </Button>
          <Button
            onClick={handleCreateBase}
            disabled={submitting}
            className="h-11 w-full rounded-xl sm:w-auto"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                创建中...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                创建基地
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
