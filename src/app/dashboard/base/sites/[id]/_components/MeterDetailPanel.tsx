"use client";

import { useState, useEffect } from "react";
import { Building2, Settings, DoorOpen, Plus, X, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Meter, Space, Enterprise } from "../types";
import { MeterBillCard } from "./MeterBillCard";

interface MeterDetailPanelProps {
  meter: Meter;
  onClose: () => void;
  onRefresh?: () => void;
}

export function MeterDetailPanel({ meter, onClose, onRefresh }: MeterDetailPanelProps) {
  const [expandedSpace, setExpandedSpace] = useState<string | null>(null);
  const [showAddRegNumber, setShowAddRegNumber] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // 企业列表
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loadingEnterprises, setLoadingEnterprises] = useState(false);
  
  // 新增工位号表单
  const [regNumberForm, setRegNumberForm] = useState({ code: "" });

  // 获取服务企业列表（负责公司）
  useEffect(() => {
    const fetchEnterprises = async () => {
      setLoadingEnterprises(true);
      try {
        // 只获取服务企业（非入驻企业）
        const res = await fetch("/api/enterprises?type=service");
        const result = await res.json();
        if (result.success) {
          setEnterprises(result.data || []);
        }
      } catch (error) {
        console.error("获取企业列表失败:", error);
      } finally {
        setLoadingEnterprises(false);
      }
    };
    
    fetchEnterprises();
  }, []);

  // 新增工位号
  const handleAddRegNumber = async (spaceId: string) => {
    if (!regNumberForm.code.trim()) {
      toast.error("请输入工位号");
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch("/api/registration-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          space_id: spaceId,
          code: regNumberForm.code,
          available: true,
        }),
      });
      
      const result = await res.json();
      if (result.success) {
        toast.success("工位号创建成功");
        setShowAddRegNumber(null);
        setRegNumberForm({ code: "" });
        onRefresh?.();
      } else {
        toast.error(result.error || "创建失败");
      }
    } catch (error) {
      toast.error("创建失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "#1C1917" }}>{meter.code}</h2>
          <p className="text-sm mt-1" style={{ color: "#78716C" }}>{meter.name}</p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
        >
          <X className="h-5 w-5" style={{ color: "#78716C" }} />
        </button>
      </div>

      {/* 面积信息 */}
      {meter.area && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 mb-6 border border-amber-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                <Building2 className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-sm font-medium" style={{ color: "#78716C" }}>建筑面积</span>
            </div>
            <span className="text-2xl font-bold" style={{ color: "#1C1917" }}>
              {meter.area} <span className="text-base font-normal" style={{ color: "#A8A29E" }}>㎡</span>
            </span>
          </div>
        </div>
      )}

      {/* 表号详情 */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "#1C1917" }}>
          <Settings className="h-4 w-4" style={{ color: "#A8A29E" }} />
          表号信息
        </h3>
        {loadingEnterprises ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-3">
            <MeterBillCard
              meterId={meter.id}
              type="electricity"
              label="电表"
              meterNumber={meter.electricityNumber}
              meterType={meter.electricityType}
              enterpriseId={meter.electricityEnterpriseId}
              enterprises={enterprises}
              onEnterpriseUpdate={onRefresh}
            />
            <MeterBillCard
              meterId={meter.id}
              type="water"
              label="水表"
              meterNumber={meter.waterNumber}
              meterType={meter.waterType}
              enterpriseId={meter.waterEnterpriseId}
              enterprises={enterprises}
              onEnterpriseUpdate={onRefresh}
            />
            <MeterBillCard
              meterId={meter.id}
              type="heating"
              label="取暖号"
              meterNumber={meter.heatingNumber}
              meterType={meter.heatingType}
              enterpriseId={meter.heatingEnterpriseId}
              enterprises={enterprises}
              onEnterpriseUpdate={onRefresh}
            />
          </div>
        )}
      </div>

      {/* 物理空间 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "#1C1917" }}>
            <DoorOpen className="h-4 w-4" style={{ color: "#A8A29E" }} />
            物理空间
          </h3>
        </div>

        {(meter.spaces?.length || 0) === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <DoorOpen className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm" style={{ color: "#A8A29E" }}>暂无物理空间</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meter.spaces?.map((space) => (
              <div key={space.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedSpace(expandedSpace === space.id ? null : space.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
                      <DoorOpen className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: "#1C1917" }}>{space.code}</span>
                      <span className="text-sm ml-2" style={{ color: "#78716C" }}>{space.name}</span>
                      {space.area && (
                        <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-slate-100" style={{ color: "#A8A29E" }}>
                          {space.area}㎡
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs px-2.5 py-1 rounded-full" style={{ background: (space.regNumbers?.filter(r => r.status === "allocated")?.length || 0) > 0 ? "#DCFCE7" : "#F5F5F4", color: (space.regNumbers?.filter(r => r.status === "allocated")?.length || 0) > 0 ? "#15803D" : "#78716C" }}>
                      {(space.regNumbers?.filter(r => r.status === "allocated")?.length || 0)}/{space.regNumbers?.length || 0} 已分配
                    </div>
                    <ChevronRight className={cn("h-4 w-4 transition-transform", expandedSpace === space.id && "rotate-90")} style={{ color: "#A8A29E" }} />
                  </div>
                </div>

                {/* 工位号列表 */}
                {expandedSpace === space.id && (
                  <div className="px-4 pb-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mt-3 mb-3">
                      <span className="text-xs font-medium" style={{ color: "#78716C" }}>工位号</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAddRegNumber(space.id);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />新增
                      </Button>
                    </div>
                    
                    {/* 新增工位号表单 */}
                    {showAddRegNumber === space.id && (
                      <div className="bg-slate-50 rounded-lg p-3 mb-3 border border-slate-200">
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="text-xs font-medium mb-1 block" style={{ color: "#78716C" }}>工位号 *</label>
                            <Input
                              value={regNumberForm.code}
                              onChange={(e) => setRegNumberForm({ code: e.target.value })}
                              placeholder="如：101-1"
                              className="h-8"
                            />
                          </div>
                          <Button variant="outline" size="sm" className="h-8" onClick={() => setShowAddRegNumber(null)}>取消</Button>
                          <Button size="sm" className="h-8" onClick={() => handleAddRegNumber(space.id)} disabled={submitting}>
                            {submitting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                            确认
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {(space.regNumbers?.length || 0) === 0 ? (
                      <p className="text-xs text-center py-6" style={{ color: "#A8A29E" }}>暂无工位号</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {space.regNumbers?.map((reg) => (
                          <div
                            key={reg.id}
                            className={cn(
                              "px-3 py-2.5 rounded-xl border text-center",
                              reg.status === "allocated"
                                ? "bg-emerald-50 border-emerald-200"
                                : "bg-slate-50 border-slate-200"
                            )}
                          >
                            <span className="font-mono text-sm font-medium" style={{ color: "#1C1917" }}>{reg.code}</span>
                            {reg.enterprise && (
                              <p className="text-xs mt-0.5 truncate" style={{ color: "#A8A29E" }}>{reg.enterprise.name}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
