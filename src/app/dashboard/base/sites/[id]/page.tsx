"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Zap,
  Droplets,
  Flame,
  Wifi,
  DoorOpen,
  Building2,
  MapPin,
  ChevronRight,
  Plus,
  Loader2,
  X,
  Home,
  Hash,
  Users,
  Settings,
  Check,
  Search,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useTabs } from "../../../tabs-context";

// 账单查询结果类型
interface BillResult {
  billKey: string;
  billDate: string;
  billAmount: string;
  billStatus: string;
  ownerName?: string;
  address?: string;
}

// 查询状态类型
interface QueryState {
  loading: boolean;
  result: BillResult | null;
  error: string | null;
  needAuth?: boolean;
}

// 授权状态类型
interface AuthStatus {
  hasAuth: boolean;
  status: 'active' | 'expired' | 'needs_refresh' | 'revoked';
  expiresAt?: Date;
  refreshExpiresAt?: Date;
}

type MeterType = "base" | "customer";
type MeterStatus = "normal" | "abnormal";

interface Enterprise {
  id: string;
  name: string;
}

interface RegNumber {
  id: string;
  code: string;
  status: "available" | "allocated" | "reserved";
  enterprise?: Enterprise | null;
}

interface Space {
  id: string;
  meterId: string;
  code: string;
  name: string;
  area: number | null;
  regNumbers: RegNumber[];
}

interface Meter {
  id: string;
  baseId: string;
  code: string;
  name: string;
  electricityNumber: string | null;
  electricityType: MeterType;
  electricityStatus: MeterStatus;
  waterNumber: string | null;
  waterType: MeterType;
  waterStatus: MeterStatus;
  heatingNumber: string | null;
  heatingType: MeterType;
  heatingStatus: MeterStatus;
  networkNumber: string | null;
  networkType: MeterType;
  networkStatus: MeterStatus;
  area: number | null;
  spaces: Space[];
}

interface BaseDetail {
  id: string;
  name: string;
  address: string | null;
  status: string;
  meters: Meter[];
}

// 表号图标组件
function MeterIcon({ type, size = "md" }: { type: "electricity" | "water" | "heating"; size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  
  const styles = {
    electricity: {
      bg: "bg-gradient-to-br from-amber-100 via-amber-50 to-orange-50",
      icon: "text-amber-600",
      shadow: "shadow-amber-100/50",
    },
    water: {
      bg: "bg-gradient-to-br from-sky-100 via-cyan-50 to-blue-50",
      icon: "text-sky-600",
      shadow: "shadow-sky-100/50",
    },
    heating: {
      bg: "bg-gradient-to-br from-orange-100 via-red-50 to-rose-50",
      icon: "text-orange-500",
      shadow: "shadow-orange-100/50",
    },
  };

  const style = styles[type];
  const IconComponent = type === "electricity" ? Zap : type === "water" ? Droplets : Flame;

  return (
    <div className={cn(sizeClasses, style.bg, "rounded-xl flex items-center justify-center shadow-sm", style.shadow)}>
      <IconComponent className={cn(iconSize, style.icon)} />
    </div>
  );
}

// 类型标签
function TypeTag({ type }: { type: MeterType }) {
  return type === "base" ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
      <Check className="h-3 w-3" />
      基地负责
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
      客户负责
    </span>
  );
}

// 账单查询卡片组件
function MeterBillCard({ 
  type, 
  label, 
  meterNumber, 
  meterType 
}: { 
  type: "electricity" | "water" | "heating"; 
  label: string; 
  meterNumber: string | null; 
  meterType: MeterType;
}) {
  const [queryState, setQueryState] = useState<QueryState>({
    loading: false,
    result: null,
    error: null,
  });
  const [showResult, setShowResult] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const bgColor = type === "electricity" ? "#FFFBEB" : type === "water" ? "#F0F9FF" : "#FFF7ED";

  // 检查授权状态
  const checkAuthStatus = async () => {
    setCheckingAuth(true);
    try {
      const response = await fetch('/api/alipay/status');
      const data = await response.json();
      if (data.success) {
        setAuthStatus(data.data);
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

  // 获取授权链接
  const handleAuth = async () => {
    try {
      const response = await fetch('/api/alipay/auth');
      const data = await response.json();
      if (data.success && data.data.authUrl) {
        // 在新窗口打开支付宝授权页面
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
      // 先检查授权状态
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
            style={{ color: type === "electricity" ? "#D97706" : type === "water" ? "#0284C7" : "#EA580C" }}
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

export default function BaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tabs = useTabs();
  const baseId = params.id as string;

  const [baseDetail, setBaseDetail] = useState<BaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMeter, setExpandedMeter] = useState<string | null>(null);
  const [expandedSpace, setExpandedSpace] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchBaseDetail = async () => {
      try {
        const response = await fetch(`/api/bases/${baseId}`);
        const result = await response.json();
        if (result.success) {
          setBaseDetail(result.data);
          // 更新标签页标题
          if (tabs && result.data?.name) {
            tabs.updateTabLabel(`base-${baseId}`, result.data.name);
          }
        }
      } catch (error) {
        console.error("获取基地详情失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBaseDetail();
  }, [baseId]);

  // 删除基地
  const handleDeleteBase = async () => {
    if (!baseDetail) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/bases/${baseDetail.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.success) {
        // 关闭当前标签页
        if (tabs) {
          tabs.closeTab(`base-${baseId}`);
        }
        // 跳转回列表页
        router.push('/dashboard/base/sites');
      } else {
        alert(result.error || '删除失败');
      }
    } catch (error) {
      console.error('删除基地失败:', error);
      alert('删除失败，请稍后重试');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const totalMeters = baseDetail?.meters?.length || 0;
  const totalSpaces = baseDetail?.meters?.reduce((sum, m) => sum + (m.spaces?.length || 0), 0) || 0;
  const totalRegNumbers = baseDetail?.meters?.reduce(
    (sum, m) => sum + (m.spaces?.reduce((s, sp) => s + (sp.regNumbers?.length || 0), 0) || 0),
    0
  ) || 0;
  const allocatedRegNumbers = baseDetail?.meters?.reduce(
    (sum, m) => sum + (m.spaces?.reduce((s, sp) => s + (sp.regNumbers?.filter(r => r.status === "allocated")?.length || 0), 0) || 0),
    0
  ) || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" style={{ background: "linear-gradient(180deg, #FDFBF7 0%, #F8F5F0 100%)" }}>
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!baseDetail) {
    return (
      <div className="text-center py-20" style={{ background: "linear-gradient(180deg, #FDFBF7 0%, #F8F5F0 100%)" }}>
        <p style={{ color: "#78716C" }}>基地不存在</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push("/dashboard/base/sites")}>
          返回列表
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #FDFBF7 0%, #F8F5F0 100%)" }}>
      <div className="p-8 max-w-7xl mx-auto">
        {/* 页面头部 */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard/base/sites")}
            className="inline-flex items-center gap-2 text-sm font-medium mb-4 px-3 py-1.5 rounded-lg hover:bg-white/60 transition-colors"
            style={{ color: "#78716C" }}
          >
            <ArrowLeft className="h-4 w-4" />
            返回基地列表
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 flex items-center justify-center shadow-inner">
                <Building2 className="h-7 w-7 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1C1917" }}>
                    {baseDetail.name}
                  </h1>
                  <span className={`w-2.5 h-2.5 rounded-full ${baseDetail.status === "active" ? "bg-emerald-400" : "bg-slate-300"}`} />
                </div>
                {baseDetail.address && (
                  <p className="text-sm flex items-center gap-1.5 mt-1" style={{ color: "#78716C" }}>
                    <MapPin className="h-3.5 w-3.5" />
                    {baseDetail.address}
                  </p>
                )}
              </div>
            </div>
            
            <Button className="h-11 px-5 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white rounded-xl shadow-lg shadow-slate-900/10 font-medium">
              <Plus className="h-4 w-4 mr-2" />
              新增物业
            </Button>
            <Button 
              variant="outline"
              className="h-11 px-5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl font-medium"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              删除基地
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
                <Home className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums" style={{ color: "#1C1917" }}>{totalMeters}</p>
                <p className="text-sm" style={{ color: "#A8A29E" }}>物业</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
                <DoorOpen className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums" style={{ color: "#1C1917" }}>{totalSpaces}</p>
                <p className="text-sm" style={{ color: "#A8A29E" }}>物理空间</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                <Hash className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums" style={{ color: "#1C1917" }}>{totalRegNumbers}</p>
                <p className="text-sm" style={{ color: "#A8A29E" }}>注册号</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums" style={{ color: "#1C1917" }}>{allocatedRegNumbers}</p>
                <p className="text-sm" style={{ color: "#A8A29E" }}>入驻企业</p>
              </div>
            </div>
          </div>
        </div>

        {/* 物业卡片网格 */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold" style={{ color: "#1C1917" }}>物业列表</h2>
          <p className="text-sm mt-0.5" style={{ color: "#A8A29E" }}>点击物业卡片查看详细信息</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {baseDetail.meters.map((meter) => (
            <div
              key={meter.id}
              onClick={() => setExpandedMeter(expandedMeter === meter.id ? null : meter.id)}
              className="group cursor-pointer"
            >
              <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-300 hover:-translate-y-0.5">
                {/* 物业编号和面积 */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: "#1C1917" }}>{meter.code}</h3>
                    {meter.area && (
                      <p className="text-sm mt-0.5" style={{ color: "#78716C" }}>{meter.area} ㎡</p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </div>

                {/* 水电暖网状态 */}
                <div className="grid grid-cols-4 gap-2">
                  {/* 电 */}
                  <div className="flex flex-col items-center p-2.5 rounded-xl bg-amber-50/50">
                    <Zap className={`h-5 w-5 ${meter.electricityStatus === 'normal' ? 'text-amber-500' : 'text-red-500'}`} />
                    <span className="text-xs mt-1" style={{ color: "#78716C" }}>电</span>
                    <span className={`text-xs font-medium mt-0.5 ${meter.electricityStatus === 'normal' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {meter.electricityStatus === 'normal' ? '正常' : '异常'}
                    </span>
                  </div>
                  
                  {/* 水 */}
                  <div className="flex flex-col items-center p-2.5 rounded-xl bg-sky-50/50">
                    <Droplets className={`h-5 w-5 ${meter.waterStatus === 'normal' ? 'text-sky-500' : 'text-red-500'}`} />
                    <span className="text-xs mt-1" style={{ color: "#78716C" }}>水</span>
                    <span className={`text-xs font-medium mt-0.5 ${meter.waterStatus === 'normal' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {meter.waterStatus === 'normal' ? '正常' : '异常'}
                    </span>
                  </div>
                  
                  {/* 暖 */}
                  <div className="flex flex-col items-center p-2.5 rounded-xl bg-orange-50/50">
                    <Flame className={`h-5 w-5 ${meter.heatingStatus === 'normal' ? 'text-orange-500' : 'text-red-500'}`} />
                    <span className="text-xs mt-1" style={{ color: "#78716C" }}>暖</span>
                    <span className={`text-xs font-medium mt-0.5 ${meter.heatingStatus === 'normal' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {meter.heatingStatus === 'normal' ? '正常' : '异常'}
                    </span>
                  </div>
                  
                  {/* 网 */}
                  <div className="flex flex-col items-center p-2.5 rounded-xl bg-violet-50/50">
                    <Wifi className={`h-5 w-5 ${meter.networkStatus === 'normal' ? 'text-violet-500' : 'text-red-500'}`} />
                    <span className="text-xs mt-1" style={{ color: "#78716C" }}>网</span>
                    <span className={`text-xs font-medium mt-0.5 ${meter.networkStatus === 'normal' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {meter.networkStatus === 'normal' ? '正常' : '异常'}
                    </span>
                  </div>
                </div>

                {/* 底部统计 */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <DoorOpen className="h-4 w-4" style={{ color: "#A8A29E" }} />
                    <span className="text-sm font-medium" style={{ color: "#57534E" }}>{meter.spaces?.length || 0}</span>
                    <span className="text-sm" style={{ color: "#A8A29E" }}>空间</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Hash className="h-4 w-4" style={{ color: "#A8A29E" }} />
                    <span className="text-sm font-medium" style={{ color: "#57534E" }}>
                      {meter.spaces?.reduce((s, sp) => s + (sp.regNumbers?.length || 0), 0) || 0}
                    </span>
                    <span className="text-sm" style={{ color: "#A8A29E" }}>注册号</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 展开的物业详情面板 */}
      {expandedMeter && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" onClick={() => setExpandedMeter(null)}>
          <div 
            className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const meter = baseDetail.meters.find(m => m.id === expandedMeter);
              if (!meter) return null;
              
              return (
                <div className="p-8">
                  {/* 头部 */}
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold" style={{ color: "#1C1917" }}>{meter.code}</h2>
                      <p className="text-sm mt-1" style={{ color: "#78716C" }}>{meter.name}</p>
                    </div>
                    <button 
                      onClick={() => setExpandedMeter(null)}
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
                        <span className="text-2xl font-bold" style={{ color: "#1C1917" }}>{meter.area} <span className="text-base font-normal" style={{ color: "#A8A29E" }}>㎡</span></span>
                      </div>
                    </div>
                  )}

                  {/* 表号详情 */}
                  <div className="mb-8">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "#1C1917" }}>
                      <Settings className="h-4 w-4" style={{ color: "#A8A29E" }} />
                      表号信息
                    </h3>
                    <div className="space-y-3">
                      {/* 电表 */}
                      <MeterBillCard
                        type="electricity"
                        label="电表"
                        meterNumber={meter.electricityNumber}
                        meterType={meter.electricityType}
                      />

                      {/* 水表 */}
                      <MeterBillCard
                        type="water"
                        label="水表"
                        meterNumber={meter.waterNumber}
                        meterType={meter.waterType}
                      />

                      {/* 取暖 */}
                      <MeterBillCard
                        type="heating"
                        label="取暖号"
                        meterNumber={meter.heatingNumber}
                        meterType={meter.heatingType}
                      />
                    </div>
                  </div>

                  {/* 物理空间 */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "#1C1917" }}>
                        <DoorOpen className="h-4 w-4" style={{ color: "#A8A29E" }} />
                        物理空间
                      </h3>
                      <Button variant="ghost" size="sm" className="h-8 text-xs rounded-lg">
                        <Plus className="h-3.5 w-3.5 mr-1.5" />新增
                      </Button>
                    </div>
                    
                    {(meter.spaces?.length || 0) === 0 ? (
                      <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <DoorOpen className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm" style={{ color: "#A8A29E" }}>暂无物理空间</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {meter.spaces?.map((space) => (
                          <div 
                            key={space.id} 
                            className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
                          >
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

                            {/* 注册号列表 */}
                            {expandedSpace === space.id && (
                              <div className="px-4 pb-4 border-t border-slate-100">
                                <div className="flex items-center justify-between mt-3 mb-3">
                                  <span className="text-xs font-medium" style={{ color: "#78716C" }}>注册号</span>
                                  <Button variant="ghost" size="sm" className="h-6 text-xs">
                                    <Plus className="h-3 w-3 mr-1" />新增
                                  </Button>
                                </div>
                                {(space.regNumbers?.length || 0) === 0 ? (
                                  <p className="text-xs text-center py-6" style={{ color: "#A8A29E" }}>暂无注册号</p>
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
            })()}
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除基地</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除基地「{baseDetail?.name}」吗？此操作不可撤销，基地下的所有物业信息将被一并删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBase}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  删除中...
                </>
              ) : (
                '确认删除'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
