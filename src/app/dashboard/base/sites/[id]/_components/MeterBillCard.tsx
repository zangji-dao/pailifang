"use client";

import { useState } from "react";
import { Search, Loader2, AlertCircle, Building } from "lucide-react";
import type { MeterType, QueryState, Enterprise } from "../types";
import { MeterIcon } from "./MeterIcon";
import { TypeTag } from "./TypeTag";
import { toast } from "sonner";

interface MeterBillCardProps {
  meterId: string;
  type: "electricity" | "water" | "heating";
  label: string;
  meterNumber: string | null;
  meterType: MeterType;
  enterpriseId?: string | null;
  enterprises: Enterprise[];
  onEnterpriseUpdate?: () => void;
}

export function MeterBillCard({ 
  meterId, 
  type, 
  label, 
  meterNumber, 
  meterType, 
  enterpriseId,
  enterprises,
  onEnterpriseUpdate 
}: MeterBillCardProps) {
  const [queryState, setQueryState] = useState<QueryState>({
    loading: false,
    result: null,
    error: null,
  });
  const [showResult, setShowResult] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string | null>(enterpriseId || null);
  const [updatingEnterprise, setUpdatingEnterprise] = useState(false);

  const bgColor = type === "electricity" ? "#FFFBEB" : type === "water" ? "#F0F9FF" : "#FFF7ED";
  const typeColor = type === "electricity" ? "#D97706" : type === "water" ? "#0284C7" : "#EA580C";

  const checkAuthStatus = async (): Promise<boolean> => {
    setCheckingAuth(true);
    try {
      const response = await fetch('/api/alipay/status');
      const data = await response.json();
      if (data.success) {
        return data.data.hasAuth && data.data.status === 'active';
      }
      return false;
    } catch (error) {
      console.error('检查授权状态失败:', error);
      return false;
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleAuth = async () => {
    try {
      const response = await fetch('/api/alipay/auth');
      const data = await response.json();
      if (data.success && data.data.authUrl) {
        window.open(data.data.authUrl, '_blank');
      }
    } catch (error) {
      console.error('获取授权链接失败:', error);
    }
  };

  const handleQuery = async () => {
    if (!meterNumber) return;

    setQueryState({ loading: true, result: null, error: null });
    setShowResult(true);

    try {
      const isAuthorized = await checkAuthStatus();

      if (!isAuthorized) {
        setQueryState({
          loading: false,
          result: null,
          error: '请先授权支付宝',
          needAuth: true,
        });
        return;
      }

      const billType = type === "electricity" ? "electricity" : type === "water" ? "water" : "gas";
      const response = await fetch("/api/bill/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billKey: meterNumber,
          billType,
          region: "songyuan",
        }),
      });

      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        setQueryState({
          loading: false,
          result: data.data[0],
          error: null,
        });
      } else {
        setQueryState({
          loading: false,
          result: null,
          error: data.error || "未查询到账单信息",
          needAuth: data.needAuth,
        });
      }
    } catch (error) {
      setQueryState({
        loading: false,
        result: null,
        error: "查询失败，请稍后重试",
      });
    }
  };

  // 更新负责公司
  const handleUpdateEnterprise = async (newEnterpriseId: string) => {
    setUpdatingEnterprise(true);
    try {
      const field = type === "electricity" ? "electricity_enterprise_id" 
                  : type === "water" ? "water_enterprise_id" 
                  : "heating_enterprise_id";
      
      const res = await fetch(`/api/meters/${meterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: newEnterpriseId || null }),
      });
      
      const result = await res.json();
      if (result.success) {
        toast.success(`${label}负责公司更新成功`);
        setSelectedEnterpriseId(newEnterpriseId || null);
        onEnterpriseUpdate?.();
      } else {
        toast.error(result.error || "更新失败");
      }
    } catch (error) {
      toast.error("更新失败");
    } finally {
      setUpdatingEnterprise(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <MeterIcon type={type} />
          <span className="font-medium" style={{ color: "#1C1917" }}>{label}</span>
        </div>
        <TypeTag type={meterType} />
      </div>

      <div className="mt-3 py-2.5 px-4 rounded-xl font-mono text-lg font-semibold flex items-center justify-between" style={{ background: bgColor, color: "#1C1917" }}>
        <span>{meterNumber || "—"}</span>
        {meterNumber && (
          <button
            onClick={handleQuery}
            disabled={queryState.loading}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium bg-white/80 hover:bg-white transition-colors disabled:opacity-50"
            style={{ color: typeColor }}
          >
            {queryState.loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            查询
          </button>
        )}
      </div>

      {/* 负责公司选择 */}
      <div className="mt-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Building className="h-3.5 w-3.5" style={{ color: "#A8A29E" }} />
          <span className="text-xs font-medium" style={{ color: "#78716C" }}>负责公司</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedEnterpriseId || ""}
            onChange={(e) => handleUpdateEnterprise(e.target.value)}
            disabled={updatingEnterprise}
            className="flex-1 h-8 px-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 bg-white disabled:opacity-50"
          >
            <option value="">未指定</option>
            {enterprises.map((enterprise) => (
              <option key={enterprise.id} value={enterprise.id}>
                {enterprise.name}
              </option>
            ))}
          </select>
          {updatingEnterprise && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        </div>
      </div>

      {/* 查询结果 */}
      {showResult && (
        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
          {queryState.loading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              <span className="ml-2 text-sm" style={{ color: "#78716C" }}>查询中...</span>
            </div>
          ) : queryState.error ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 py-1">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-sm" style={{ color: "#78716C" }}>{queryState.error}</span>
              </div>
              {queryState.needAuth && (
                <button
                  onClick={handleAuth}
                  className="w-full py-2 px-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
                >
                  授权支付宝
                </button>
              )}
            </div>
          ) : queryState.result ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "#78716C" }}>账单金额</span>
                <span className="text-lg font-bold" style={{ color: "#1C1917" }}>
                  ¥{queryState.result.billAmount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "#78716C" }}>账单日期</span>
                <span className="text-sm" style={{ color: "#57534E" }}>{queryState.result.billDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "#78716C" }}>账单状态</span>
                <span className={`text-sm font-medium ${
                  queryState.result.billStatus === "UNPAID" ? "text-amber-600" : "text-emerald-600"
                }`}>
                  {queryState.result.billStatus === "UNPAID" ? "未缴费" : "已缴费"}
                </span>
              </div>
              {queryState.result.ownerName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "#78716C" }}>户名</span>
                  <span className="text-sm" style={{ color: "#57534E" }}>{queryState.result.ownerName}</span>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
