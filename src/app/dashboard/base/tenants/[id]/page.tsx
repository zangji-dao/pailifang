"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Phone,
  User,
  Calendar,
  FileText,
  Edit,
  ArrowLeft,
  Loader2,
  AlertCircle,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useTabs } from "@/app/dashboard/tabs-context";
import { toast } from "sonner";

// 企业状态
type EnterpriseStatus = 
  | "active" 
  | "inactive" 
  | "pending"
  | "new"
  | "pending_address" 
  | "pending_registration" 
  | "pending_change"
  | "pending_contract" 
  | "pending_payment" 
  | "moved_out"
  | "terminated";

// 企业类型
type EnterpriseType = "tenant" | "non_tenant";

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
  processStatus?: string;
  remarks: string;
}

// 状态配置 - 包含所有可能的状态
const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "入驻中", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  inactive: { label: "已迁出", className: "bg-gray-50 text-gray-600 border-gray-200" },
  pending: { label: "待入驻", className: "bg-amber-50 text-amber-600 border-amber-200" },
  new: { label: "新建", className: "bg-slate-50 text-slate-600 border-slate-200" },
  pending_address: { label: "待分配地址", className: "bg-orange-50 text-orange-600 border-orange-200" },
  pending_registration: { label: "待工商注册", className: "bg-purple-50 text-purple-600 border-purple-200" },
  pending_change: { label: "待工商变更", className: "bg-blue-50 text-blue-600 border-blue-200" },
  pending_contract: { label: "待签合同", className: "bg-cyan-50 text-cyan-600 border-cyan-200" },
  pending_payment: { label: "待缴费", className: "bg-amber-50 text-amber-600 border-amber-200" },
  moved_out: { label: "已迁出", className: "bg-gray-50 text-gray-600 border-gray-200" },
  terminated: { label: "已终止", className: "bg-red-50 text-red-600 border-red-200" },
};

// 企业类型配置
const typeConfig: Record<string, { label: string; description: string; className: string }> = {
  tenant: {
    label: "入驻企业",
    description: "在基地内注册的企业",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  non_tenant: {
    label: "服务企业",
    description: "不在基地内注册的企业",
    className: "bg-muted text-muted-foreground border-border",
  },
};

// API响应类型
interface ApiEnterprise {
  id: string;
  name: string;
  credit_code: string | null;
  legal_person: string | null;
  phone: string | null;
  registered_address: string | null;
  business_address: string | null;
  industry: string | null;
  settled_date: string | null;
  status: string;
  type: string;
  process_status: string | null;
  remarks: string | null;
}

// 转换API数据到前端格式
function transformEnterprise(api: ApiEnterprise): Enterprise {
  return {
    id: api.id,
    name: api.name,
    creditCode: api.credit_code || "",
    legalPerson: api.legal_person || "",
    phone: api.phone || "",
    registeredAddress: api.registered_address || "",
    businessAddress: api.business_address || "",
    industry: api.industry || "",
    入驻Date: api.settled_date || "",
    status: api.status as EnterpriseStatus,
    type: api.type as EnterpriseType,
    processStatus: api.process_status || undefined,
    remarks: api.remarks || "",
  };
}

export default function EnterpriseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const tabsContext = useTabs();

  const [enterprise, setEnterprise] = useState<Enterprise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exiting, setExiting] = useState(false);

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
          setEnterprise(transformEnterprise(result.data));
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

  // 返回列表
  const handleBack = () => {
    // 先尝试关闭 tab（如果存在）
    if (tabsContext) {
      const tabId = `enterprise-${resolvedParams.id}`;
      const tabExists = tabsContext.tabs.some(t => t.id === tabId);
      if (tabExists) {
        tabsContext.closeTab(tabId);
      }
    }
    // 始终执行导航返回列表页
    router.push("/dashboard/base/tenants");
  };

  // 打开编辑页面
  const handleEdit = () => {
    if (tabsContext && enterprise) {
      tabsContext.openTab({
        id: `enterprise-edit-${resolvedParams.id}`,
        label: `编辑 - ${enterprise.name}`,
        path: `/dashboard/base/tenants/${resolvedParams.id}/edit`,
      });
    } else {
      router.push(`/dashboard/base/tenants/${resolvedParams.id}/edit`);
    }
  };

  // 企业迁出
  const handleExit = async () => {
    if (!enterprise) return;

    try {
      setExiting(true);
      const response = await fetch(`/api/enterprises/${enterprise.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ process_status: "moved_out" }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "操作失败");
      }

      toast.success("企业已迁出");
      // 刷新数据
      setEnterprise({ ...enterprise, processStatus: "moved_out", status: "inactive" });
    } catch (err) {
      console.error("企业迁出失败:", err);
      toast.error(err instanceof Error ? err.message : "操作失败");
    } finally {
      setExiting(false);
    }
  };

  // 判断企业是否已退出
  const isExited = enterprise && (
    ["inactive", "moved_out", "terminated"].includes(enterprise.status) ||
    ["moved_out", "terminated"].includes(enterprise.processStatus || "")
  );

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
  if (error || !enterprise) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-red-600 mb-4">{error || "企业不存在"}</p>
        <Button variant="outline" onClick={handleBack}>
          返回列表
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
            <span className="text-sm text-slate-500">企业详情</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-slate-600">
              <FileText className="h-4 w-4 mr-1.5" />
              导出档案
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={handleEdit}
            >
              <Edit className="h-4 w-4 mr-1.5" />
              编辑信息
            </Button>
            {/* 迁出企业按钮 - 仅在未退出时显示 */}
            {!isExited && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    <UserX className="h-4 w-4 mr-1.5" />
                    迁出企业
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认迁出企业</AlertDialogTitle>
                    <AlertDialogDescription>
                      确定要将「{enterprise?.name}」标记为已迁出吗？
                      <br />
                      此操作不可撤销。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleExit}
                      disabled={exiting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {exiting ? (
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      ) : null}
                      确认迁出
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      {/* 详情内容 */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 企业基本信息 */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-medium text-slate-500">基本信息</h3>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-6">
                <div
                  className={cn(
                    "w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0",
                    enterprise.type === "tenant" ? "bg-emerald-500/10" : "bg-muted"
                  )}
                >
                  <Building2
                    className={cn(
                      "h-8 w-8",
                      enterprise.type === "tenant" ? "text-emerald-600" : "text-muted-foreground"
                    )}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-semibold text-slate-900">{enterprise.name}</h2>
                    <Badge
                      variant="outline"
                      className={cn("text-sm", typeConfig[enterprise.type]?.className)}
                    >
                      {typeConfig[enterprise.type]?.label || enterprise.type}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn("text-sm", statusConfig[enterprise.status]?.className)}
                    >
                      {statusConfig[enterprise.status]?.label || enterprise.status}
                    </Badge>
                  </div>
                  <p className="text-slate-500 font-mono text-sm">{enterprise.creditCode}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 详细信息 */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-medium text-slate-500">详细信息</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-500">
                    <User className="h-4 w-4" />
                    <span className="text-sm">法定代表人</span>
                  </div>
                  <p className="text-slate-900 font-medium pl-6">
                    {enterprise.legalPerson || "—"}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">联系电话</span>
                  </div>
                  <p className="text-slate-900 font-medium pl-6">{enterprise.phone || "—"}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm">所属行业</span>
                  </div>
                  <p className="text-slate-900 font-medium pl-6">
                    {enterprise.industry || "—"}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">入驻日期</span>
                  </div>
                  <p className="text-slate-900 font-medium pl-6">
                    {enterprise.入驻Date || "—"}
                  </p>
                </div>

                <div className="col-span-2 space-y-1">
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">注册地址</span>
                  </div>
                  <p className="text-slate-900 font-medium pl-6">
                    {enterprise.registeredAddress || "—"}
                  </p>
                </div>

                <div className="col-span-2 space-y-1">
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">经营地址（入驻地址）</span>
                  </div>
                  <p className="text-slate-900 font-medium pl-6">
                    {enterprise.businessAddress || "—"}
                  </p>
                </div>

                {enterprise.remarks && (
                  <div className="col-span-2 space-y-1">
                    <div className="flex items-center gap-2 text-slate-500">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">备注</span>
                    </div>
                    <p className="text-slate-900 font-medium pl-6">{enterprise.remarks}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 企业类型说明 */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-medium text-slate-500">类型说明</h3>
            </div>
            <div className="p-6">
              <p className="text-slate-600 text-sm leading-relaxed">
                {enterprise.type === "non_tenant"
                  ? "服务企业：不在基地内注册的企业，仅使用园区提供的服务。"
                  : "入驻企业：在基地内注册的企业，享受基地提供的各项服务和支持。"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
