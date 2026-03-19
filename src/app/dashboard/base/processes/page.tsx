"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  AlertCircle,
  Building2,
  Phone,
  User,
  CheckCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTabs } from "@/app/dashboard/tabs-context";

// 类型定义
type ProcessType = "new" | "migration";

interface StageProgress {
  stage: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  startedAt?: string;
  completedAt?: string;
  attachments?: { name: string; url: string }[];
  remarks?: string;
}

interface Process {
  id: string;
  applicationId: string;
  enterpriseId: string | null;
  enterpriseName: string | null;
  processType: ProcessType;
  currentStage: string | null;
  currentStageName: string | null;
  stageProgress: StageProgress[];
  startedAt: string | null;
  completedAt: string | null;
  applicationType: string;
  settlementType: string;
  contactPerson: string | null;
  contactPhone: string | null;
}

// 流程阶段配置
const STAGE_CONFIG: Record<string, { name: string; description: string }> = {
  approved: { name: "审批通过", description: "政府审批已通过" },
  address_assigned: { name: "地址已分配", description: "已分配注册地址" },
  pre_approval: { name: "预核准办理中", description: "正在办理预核准" },
  pre_approval_done: { name: "前置审批中", description: "正在办理前置审批" },
  registering: { name: "企业注册中", description: "正在办理企业注册" },
  seal_applying: { name: "公章办理中", description: "正在办理公章" },
  pending_contract: { name: "待签合同", description: "等待签订合同" },
  completed: { name: "入驻完成", description: "入驻流程已完成" },
};

const stageStatusConfig: Record<string, { label: string; className: string; icon: any }> = {
  pending: { label: "待处理", className: "bg-gray-50 text-gray-500 border-gray-200", icon: Clock },
  in_progress: { label: "进行中", className: "bg-blue-50 text-blue-600 border-blue-200", icon: Loader2 },
  completed: { label: "已完成", className: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: CheckCircle },
  skipped: { label: "已跳过", className: "bg-amber-50 text-amber-600 border-amber-200", icon: ArrowRight },
};

const processTypeConfig: Record<ProcessType, { label: string; className: string }> = {
  new: { label: "新建企业流程", className: "bg-purple-50 text-purple-600 border-purple-200" },
  migration: { label: "迁移企业流程", className: "bg-orange-50 text-orange-600 border-orange-200" },
};

export default function ProcessesPage() {
  const router = useRouter();
  const tabsContext = useTabs();

  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [processTypeFilter, setProcessTypeFilter] = useState<string>("all");

  // 获取流程列表
  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/settlement/processes");
        if (!response.ok) {
          throw new Error("获取流程列表失败");
        }
        const result = await response.json();
        setProcesses(result.data || []);
        setError(null);
      } catch (err) {
        console.error("获取流程列表失败:", err);
        setError(err instanceof Error ? err.message : "获取流程列表失败");
      } finally {
        setLoading(false);
      }
    };

    fetchProcesses();
  }, []);

  // 过滤流程列表
  const filteredProcesses = processes.filter((p) => {
    const matchSearch =
      !searchKeyword ||
      (p.enterpriseName && p.enterpriseName.includes(searchKeyword));
    const matchType = processTypeFilter === "all" || p.processType === processTypeFilter;
    return matchSearch && matchType;
  });

  // 打开流程详情标签页
  const handleView = (process: Process) => {
    if (tabsContext) {
      tabsContext.openTab({
        id: `process-${process.id}`,
        label: process.enterpriseName || "入驻流程",
        path: `/dashboard/base/processes/${process.id}`,
      });
    } else {
      router.push(`/dashboard/base/processes/${process.id}`);
    }
  };

  // 计算流程进度
  const getProgress = (process: Process) => {
    if (!process.stageProgress || process.stageProgress.length === 0) return 0;
    const completed = process.stageProgress.filter(
      (s) => s.status === "completed" || s.status === "skipped"
    ).length;
    return Math.round((completed / process.stageProgress.length) * 100);
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
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          重新加载
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white">
      {/* 搜索和筛选 */}
      <div className="px-6 py-4 flex items-center gap-3 border-b border-slate-100 bg-white">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索企业名称..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
          />
        </div>

        <Select value={processTypeFilter} onValueChange={setProcessTypeFilter}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue placeholder="流程类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="new">新建企业</SelectItem>
            <SelectItem value="migration">迁移企业</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 流程列表 */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {filteredProcesses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Building2 className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-slate-500">暂无入驻流程</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProcesses.map((process) => (
              <div
                key={process.id}
                className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleView(process)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">
                        {process.enterpriseName || "待关联企业"}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {process.contactPerson && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {process.contactPerson}
                          </span>
                        )}
                        {process.contactPhone && (
                          <span className="ml-2 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {process.contactPhone}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-medium",
                        processTypeConfig[process.processType].className
                      )}
                    >
                      {processTypeConfig[process.processType].label}
                    </Badge>
                    <span className="text-sm text-slate-500">
                      {getProgress(process)}%
                    </span>
                  </div>
                </div>

                {/* 进度条 */}
                <div className="mb-4">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
                      style={{ width: `${getProgress(process)}%` }}
                    />
                  </div>
                </div>

                {/* 流程阶段 */}
                <div className="flex items-center gap-2 flex-wrap">
                  {process.stageProgress?.map((stage, index) => {
                    const config = STAGE_CONFIG[stage.stage];
                    const statusCfg = stageStatusConfig[stage.status];
                    const Icon = statusCfg.icon;
                    return (
                      <div
                        key={stage.stage}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-full text-xs border",
                          statusCfg.className
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-3 w-3",
                            stage.status === "in_progress" && "animate-spin"
                          )}
                        />
                        <span>{config?.name || stage.stage}</span>
                      </div>
                    );
                  })}
                </div>

                {/* 当前阶段 */}
                {process.currentStageName && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-sm text-slate-600">
                      当前阶段：
                      <span className="font-medium text-slate-900 ml-1">
                        {process.currentStageName}
                      </span>
                    </p>
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
