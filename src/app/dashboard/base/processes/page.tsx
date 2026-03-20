"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  MapPin,
  Calendar,
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
type OverallStatus = "pending" | "in_progress" | "completed" | "cancelled";

interface StageProgress {
  stage: string;
  stageName: string;
  stageIndex: number;
  status: "pending" | "in_progress" | "completed" | "skipped";
  startedAt?: string;
  completedAt?: string;
  operator?: string;
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
  currentStageIndex: number;
  overallStatus: OverallStatus;
  stages: StageProgress[];
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  // 关联的申请信息
  legalPersonName?: string;
  legalPersonPhone?: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
  assignedAddress?: string;
}

// 流程阶段配置
const NEW_ENTERPRISE_STAGES = [
  { stage: "approved", name: "审批通过" },
  { stage: "address_assigned", name: "地址分配" },
  { stage: "pre_approval", name: "预核准" },
  { stage: "pre_approval_done", name: "前置审批" },
  { stage: "registered", name: "企业注册" },
  { stage: "seal_made", name: "公章办理" },
  { stage: "contract_pending", name: "待签合同" },
  { stage: "completed", name: "入驻完成" },
];

const MIGRATION_STAGES = [
  { stage: "approved", name: "审批通过" },
  { stage: "address_assigned", name: "地址分配" },
  { stage: "contract_pending", name: "待签合同" },
  { stage: "completed", name: "入驻完成" },
];

// 阶段状态配置类型
type StageStatusIcon = React.ComponentType<{ className?: string }>;
interface StageStatusConfig {
  label: string;
  className: string;
  icon: StageStatusIcon;
}

const stageStatusConfig: Record<string, StageStatusConfig> = {
  pending: { label: "待处理", className: "bg-muted/50 text-muted-foreground border-border", icon: Clock },
  in_progress: { label: "进行中", className: "bg-blue-50 text-blue-600 border-blue-200", icon: Loader2 },
  completed: { label: "已完成", className: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: CheckCircle },
  skipped: { label: "已跳过", className: "bg-amber-50 text-amber-600 border-amber-200", icon: ArrowRight },
};

const processTypeConfig: Record<ProcessType, { label: string; className: string }> = {
  new: { label: "新建企业", className: "bg-purple-50 text-purple-600 border-purple-200" },
  migration: { label: "迁移企业", className: "bg-orange-50 text-orange-600 border-orange-200" },
};

const overallStatusConfig: Record<OverallStatus, { label: string; className: string }> = {
  pending: { label: "待开始", className: "text-gray-500" },
  in_progress: { label: "进行中", className: "text-blue-600" },
  completed: { label: "已完成", className: "text-emerald-600" },
  cancelled: { label: "已取消", className: "text-red-500" },
};

export default function ProcessesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabsContext = useTabs();

  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [processTypeFilter, setProcessTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // 从URL参数获取申请ID
  const applicationIdFromUrl = searchParams.get("applicationId");

  // 获取流程列表
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

  useEffect(() => {
    fetchProcesses();
  }, []);

  // 过滤流程列表
  const filteredProcesses = processes.filter((p) => {
    const matchSearch =
      !searchKeyword ||
      (p.enterpriseName && p.enterpriseName.includes(searchKeyword));
    const matchType = processTypeFilter === "all" || p.processType === processTypeFilter;
    const matchStatus = statusFilter === "all" || p.overallStatus === statusFilter;
    
    // 如果URL中有申请ID，优先显示该申请的流程
    if (applicationIdFromUrl) {
      return p.applicationId === applicationIdFromUrl;
    }
    
    return matchSearch && matchType && matchStatus;
  });

  // 计算流程进度
  const getProgress = (process: Process) => {
    if (!process.stages || process.stages.length === 0) return 0;
    const completed = process.stages.filter(
      (s) => s.status === "completed" || s.status === "skipped"
    ).length;
    return Math.round((completed / process.stages.length) * 100);
  };

  // 获取当前阶段名称
  const getCurrentStageName = (process: Process) => {
    if (!process.stages || !process.currentStage) return "-";
    const stage = process.stages.find(s => s.stage === process.currentStage);
    return stage?.stageName || process.currentStage;
  };

  // 加载状态
  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={fetchProcesses}>
          重新加载
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold">入驻流程</h1>
        <p className="text-muted-foreground mt-1">
          跟踪企业入驻各阶段进度
        </p>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索企业名称..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Select value={processTypeFilter} onValueChange={setProcessTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="流程类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="new">新建企业</SelectItem>
            <SelectItem value="migration">迁移企业</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="流程状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="in_progress">进行中</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
            <SelectItem value="pending">待开始</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 流程列表 */}
      {filteredProcesses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-lg border bg-card">
          <Building2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">暂无入驻流程</p>
          <p className="text-sm text-muted-foreground mt-1">
            请先在"入驻申请"页面提交申请
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProcesses.map((process) => (
            <div
              key={process.id}
              className="rounded-lg border bg-card p-5 hover:shadow-sm transition-shadow"
            >
              {/* 头部信息 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {process.enterpriseName || "待关联企业"}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-0.5">
                      <Badge variant="outline" className={cn("font-normal", processTypeConfig[process.processType].className)}>
                        {processTypeConfig[process.processType].label}
                      </Badge>
                      <span className={overallStatusConfig[process.overallStatus].className}>
                        {overallStatusConfig[process.overallStatus].label}
                      </span>
                      <span>{getProgress(process)}% 完成</span>
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(process.createdAt).toLocaleDateString("zh-CN")}
                  </div>
                </div>
              </div>

              {/* 进度条 */}
              <div className="mb-4">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${getProgress(process)}%` }}
                  />
                </div>
              </div>

              {/* 联系信息 */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4 pb-4 border-b">
                {process.legalPersonName && (
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    <span>法人：{process.legalPersonName}</span>
                  </div>
                )}
                {process.legalPersonPhone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{process.legalPersonPhone}</span>
                  </div>
                )}
                {process.assignedAddress && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{process.assignedAddress}</span>
                  </div>
                )}
              </div>

              {/* 流程阶段 */}
              <div className="flex items-center gap-2 flex-wrap">
                {process.stages?.map((stage, index) => {
                  const statusCfg = stageStatusConfig[stage.status];
                  const Icon = statusCfg.icon;
                  const isActive = stage.stage === process.currentStage;
                  
                  return (
                    <div
                      key={stage.stage}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        statusCfg.className,
                        isActive && "ring-2 ring-primary ring-offset-2"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-3.5 w-3.5",
                          stage.status === "in_progress" && "animate-spin"
                        )}
                      />
                      <span>{stage.stageName}</span>
                    </div>
                  );
                })}
              </div>

              {/* 当前阶段 */}
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-muted-foreground">当前阶段：</span>
                  <span className="font-medium ml-1">{getCurrentStageName(process)}</span>
                </div>
                <Button size="sm" variant="outline">
                  查看详情
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
