"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  Building2,
  Layers3,
  MapPin,
  Home,
  Plus,
  Loader2,
  Users,
  Hash,
  DoorOpen,
  Pencil,
  Trash2,
  Briefcase,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTabs } from "../../tabs-context";

interface Base {
  id: string;
  name: string;
  address: string | null;
  status: string;
  propertyCount: number;
  spaceCount: number;
  workstationCount: number;
  allocatedWorkstationCount: number;
  tenantEnterpriseCount: number;
  serviceEnterpriseCount: number;
  createdAt: string;
  // 管理公司信息（甲方）
  management_company_name?: string | null;
  management_company_credit_code?: string | null;
  management_company_legal_person?: string | null;
  management_company_address?: string | null;
  management_company_phone?: string | null;
}

interface EnterpriseStats {
  total: number;
  tenant: number;
  service: number;
  active: number;
}

export default function BaseListPage() {
  const router = useRouter();
  const tabs = useTabs();
  const [bases, setBases] = useState<Base[]>([]);
  const [enterpriseStats, setEnterpriseStats] = useState<EnterpriseStats>({ total: 0, tenant: 0, service: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  
  // 删除确认弹窗
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; base: Base | null }>({
    open: false,
    base: null,
  });
  const [deleting, setDeleting] = useState(false);

  const fetchData = async (signal?: AbortSignal) => {
    try {
      // 并行获取所有数据，使用 allSettled 来处理部分失败
      const results = await Promise.allSettled([
        fetch("/api/bases", { signal }),
        fetch('/api/enterprises/stats', { signal }),
      ]);
      
      // 处理基地列表
      if (results[0].status === "fulfilled" && results[0].value.ok) {
        const basesResult = await results[0].value.json();
      
        if (basesResult.success) {
          setBases(basesResult.data);
        }
      }

      // 处理企业统计
      if (results[1].status === "fulfilled" && results[1].value.ok) {
        try {
          const enterpriseResult = await results[1].value.json();
          if (enterpriseResult.success) {
            setEnterpriseStats(enterpriseResult.data);
          }
        } catch (e) {
          console.error("获取企业统计失败:", e);
        }
      }
    } catch (error) {
      // 忽略 AbortError
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("获取基地列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, []);

  // 删除基地
  const handleDeleteBase = async () => {
    if (!deleteConfirm.base) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/bases/${deleteConfirm.base.id}`, {
        method: "DELETE",
      });
      
      const result = await response.json();
      if (result.success) {
        toast.success("基地删除成功");
        setDeleteConfirm({ open: false, base: null });
        fetchData();
      } else {
        toast.error(result.error || "删除失败");
      }
    } catch (error) {
      console.error("删除基地失败:", error);
      toast.error("删除失败，请重试");
    } finally {
      setDeleting(false);
    }
  };

  // 打开新建基地页面（新标签页）
  const handleCreateBase = () => {
    if (tabs) {
      tabs.openTab({
        id: "new-base",
        label: "新建基地",
        path: "/dashboard/base/sites/new",
        icon: <Plus className="h-3.5 w-3.5" />,
      });
    } else {
      router.push("/dashboard/base/sites/new");
    }
  };

  // 打开编辑基地页面（新标签页）
  const handleEditBase = (base: Base) => {
    if (tabs) {
      tabs.openTab({
        id: `edit-base-${base.id}`,
        label: `编辑-${base.name}`,
        path: `/dashboard/base/sites/${base.id}/edit`,
        icon: <Pencil className="h-3.5 w-3.5" />,
      });
    } else {
      router.push(`/dashboard/base/sites/${base.id}/edit`);
    }
  };

  const handleBaseClick = (baseId: string, baseName: string) => {
    if (tabs) {
      tabs.openTab({
        id: `base-${baseId}`,
        label: baseName,
        path: `/dashboard/base/sites/${baseId}`,
        icon: <Home className="h-3.5 w-3.5" />,
      });
    } else {
      router.push(`/dashboard/base/sites/${baseId}`);
    }
  };

  const totalProperties = bases.reduce((sum, base) => sum + base.propertyCount, 0);
  const totalSpaces = bases.reduce((sum, base) => sum + base.spaceCount, 0);
  const totalWorkstations = bases.reduce((sum, base) => sum + base.workstationCount, 0);
  const totalAllocatedWorkstations = bases.reduce((sum, base) => sum + base.allocatedWorkstationCount, 0);
  const activeBaseCount = bases.filter((base) => base.status === "active").length;
  const inactiveBaseCount = bases.length - activeBaseCount;
  const workstationAllocationRate = totalWorkstations > 0
    ? (totalAllocatedWorkstations / totalWorkstations) * 100
    : 0;
  const filteredBases = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return bases.filter((base) => {
      const matchesStatus = statusFilter === "all" || base.status === statusFilter;
      const matchesKeyword = !keyword || [
        base.name,
        base.address,
        base.management_company_name,
        base.management_company_credit_code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);

      return matchesStatus && matchesKeyword;
    });
  }, [bases, searchKeyword, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 p-4 sm:p-6">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-[#0f172a] p-5 text-white shadow-[0_24px_70px_-42px_rgba(15,23,42,0.9)] sm:p-7">
        <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full border border-amber-300/10 bg-amber-300/[0.04]" />
        <div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-cyan-400/[0.03] blur-3xl" />
        <div className="relative">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80"><Building2 className="h-3.5 w-3.5" />Base Portfolio</div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-[30px]">基地资源管理</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">从基地到物业、物理空间和工位，统一维护载体资源与企业服务关系。</p>
            </div>
            <Button className="h-11 shrink-0 rounded-xl bg-amber-400 px-5 font-semibold text-slate-950 hover:bg-amber-300" onClick={handleCreateBase}>
              <Plus className="mr-2 h-4 w-4" />新增基地
            </Button>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 lg:grid-cols-4">
            <HeroStat label="运营基地" value={activeBaseCount} unit={`/ ${bases.length}`} note={inactiveBaseCount > 0 ? `${inactiveBaseCount} 个已停用` : "全部正常运营"} />
            <HeroStat label="载体规模" value={totalProperties} unit="个物业" note={`${totalSpaces} 个物理空间`} />
            <HeroStat label="工位利用" value={`${workstationAllocationRate.toFixed(1)}%`} unit="" note={`${totalAllocatedWorkstations} / ${totalWorkstations} 已分配`} />
            <HeroStat label="企业服务关系" value={enterpriseStats.tenant + enterpriseStats.service} unit="家" note={`${enterpriseStats.tenant} 入驻 · ${enterpriseStats.service} 服务`} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <PortfolioMetric label="载体层级" value={totalProperties} unit="个物业" description={`${totalSpaces} 个物理空间`} icon={Layers3} tone="amber" />
        <PortfolioMetric label="工位配置" value={totalWorkstations} unit="个" description={`已分配 ${totalAllocatedWorkstations} 个`} icon={Hash} tone="blue" progress={workstationAllocationRate} />
        <PortfolioMetric label="入驻企业" value={enterpriseStats.tenant} unit="家" description="注册并分配基地工位" icon={Users} tone="cyan" />
        <PortfolioMetric label="服务企业" value={enterpriseStats.service} unit="家" description="未入驻但使用基地服务" icon={Briefcase} tone="violet" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-amber-700" /><h2 className="font-semibold text-slate-950">基地运营档案</h2></div>
              <p className="mt-1 text-xs text-slate-400">展示 {filteredBases.length} 个，共 {bases.length} 个基地</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder="搜索基地、地址或管理单位"
                  className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-9 shadow-none focus-visible:bg-white"
                />
              </div>
              <div className="grid grid-cols-3 rounded-xl bg-slate-100 p-1 text-xs font-medium">
                {([
                  ["all", "全部", bases.length],
                  ["active", "运营中", activeBaseCount],
                  ["inactive", "已停用", inactiveBaseCount],
                ] as const).map(([value, label, count]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={cn("rounded-lg px-3 py-2 transition-colors", statusFilter === value ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800")}
                  >
                    {label} <span className="ml-1 text-[10px] text-slate-400">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50/60 p-4 sm:p-5">
          {bases.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Building2 className="h-6 w-6" /></div>
              <h3 className="mt-4 font-semibold text-slate-900">还没有基地档案</h3>
              <p className="mt-1 text-sm text-slate-400">创建基地后即可继续配置物业、空间和工位。</p>
              <Button className="mt-5 rounded-xl bg-slate-900 text-white hover:bg-slate-800" onClick={handleCreateBase}><Plus className="mr-2 h-4 w-4" />新增基地</Button>
            </div>
          ) : filteredBases.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 text-center">
              <Search className="h-7 w-7 text-slate-300" />
              <h3 className="mt-4 font-semibold text-slate-900">没有符合条件的基地</h3>
              <p className="mt-1 text-sm text-slate-400">尝试更换关键词或运营状态。</p>
              <button type="button" className="mt-4 text-sm font-medium text-amber-700 hover:text-amber-800" onClick={() => { setSearchKeyword(""); setStatusFilter("all"); }}>清除筛选</button>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredBases.map((base) => (
                <BasePortfolioCard
                  key={base.id}
                  base={base}
                  onOpen={() => handleBaseClick(base.id, base.name)}
                  onEdit={() => handleEditBase(base)}
                  onDelete={() => setDeleteConfirm({ open: true, base })}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 删除确认弹窗 */}
      {deleteConfirm.open && deleteConfirm.base && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 遮罩 */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteConfirm({ open: false, base: null })}
          />
          
          {/* 弹窗内容 */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            {(() => {
              const base = deleteConfirm.base;
              const hasProperties = base.propertyCount > 0;
              const hasEnterprises = base.tenantEnterpriseCount > 0 || base.serviceEnterpriseCount > 0;
              const canDelete = !hasProperties && !hasEnterprises;
              
              if (!canDelete) {
                // 有关联数据，禁止删除
                return (
                  <>
                    <div className="p-6">
                      <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-amber-100 rounded-full">
                        <Trash2 className="h-6 w-6 text-amber-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-center text-slate-900 mb-2">
                        无法删除
                      </h3>
                      <p className="text-center text-slate-500 text-sm">
                        基地「{base.name}」下存在关联数据，无法删除。
                      </p>
                      <div className="mt-4 bg-amber-50 rounded-lg p-3 space-y-2">
                        {hasProperties && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">物业数量</span>
                            <span className="font-medium text-amber-700">{base.propertyCount} 个</span>
                          </div>
                        )}
                        {hasEnterprises && (
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">入驻企业</span>
                              <span className="font-medium text-amber-700">{base.tenantEnterpriseCount} 家</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">服务企业</span>
                              <span className="font-medium text-amber-700">{base.serviceEnterpriseCount} 家</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-center text-slate-400 text-xs mt-4">
                        请先删除或迁移相关数据后再操作
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-center px-6 py-4 bg-slate-50 border-t border-slate-100">
                      <Button
                        className="px-8"
                        onClick={() => setDeleteConfirm({ open: false, base: null })}
                      >
                        我知道了
                      </Button>
                    </div>
                  </>
                );
              }
              
              // 无关联数据，可以删除
              return (
                <>
                  <div className="p-6">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                      <Trash2 className="h-6 w-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-center text-slate-900 mb-2">
                      确认删除
                    </h3>
                    <p className="text-center text-slate-500 text-sm">
                      确定要删除基地「{base.name}」吗？此操作不可恢复。
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setDeleteConfirm({ open: false, base: null })}
                      disabled={deleting}
                    >
                      取消
                    </Button>
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      onClick={handleDeleteBase}
                      disabled={deleting}
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          删除中...
                        </>
                      ) : (
                        "确认删除"
                      )}
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function HeroStat({ label, value, unit, note }: { label: string; value: number | string; unit: string; note: string }) {
  return (
    <div className="bg-slate-950/75 px-4 py-4 sm:px-5">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <div className="mt-2 flex items-end gap-1.5">
        <span className="text-2xl font-semibold tracking-tight tabular-nums text-white sm:text-[28px]">{value}</span>
        {unit && <span className="pb-0.5 text-xs text-slate-500">{unit}</span>}
      </div>
      <p className="mt-2 truncate text-[11px] text-slate-500">{note}</p>
    </div>
  );
}

function PortfolioMetric({
  label,
  value,
  unit,
  description,
  icon: Icon,
  tone,
  progress,
}: {
  label: string;
  value: number;
  unit: string;
  description: string;
  icon: LucideIcon;
  tone: "amber" | "blue" | "cyan" | "violet";
  progress?: number;
}) {
  const tones = {
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    cyan: "bg-cyan-50 text-cyan-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <div className="mt-2 flex items-end gap-1.5">
            <span className="text-2xl font-semibold tracking-tight tabular-nums text-slate-950 sm:text-[28px]">{value}</span>
            <span className="pb-0.5 text-xs text-slate-400">{unit}</span>
          </div>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tones[tone])}><Icon className="h-4.5 w-4.5" /></div>
      </div>
      {progress !== undefined && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      )}
      <p className="mt-3 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function BasePortfolioCard({
  base,
  onOpen,
  onEdit,
  onDelete,
}: {
  base: Base;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const allocationRate = base.workstationCount > 0
    ? (base.allocatedWorkstationCount / base.workstationCount) * 100
    : 0;

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/60">
      <div className="h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-cyan-400" />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-amber-300 shadow-lg shadow-slate-950/10">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={onOpen} className="truncate text-left font-semibold text-slate-950 hover:text-amber-800">{base.name}</button>
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold",
                  base.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", base.status === "active" ? "bg-emerald-500" : "bg-slate-400")} />
                  {base.status === "active" ? "运营中" : "已停用"}
                </span>
              </div>
              <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-slate-400">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{base.address || "暂未配置基地地址"}</span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900" onClick={onEdit} aria-label={`编辑${base.name}`} title="编辑基地">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={onDelete} aria-label={`删除${base.name}`} title="删除基地">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Management Entity</p>
              <p className="mt-1 truncate text-sm font-medium text-slate-700">{base.management_company_name || "未配置管理单位"}</p>
            </div>
            {base.management_company_phone && <span className="shrink-0 text-xs tabular-nums text-slate-400">{base.management_company_phone}</span>}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <ResourceValue label="物业" value={base.propertyCount} icon={Home} tone="amber" />
          <ResourceValue label="物理空间" value={base.spaceCount} icon={DoorOpen} tone="emerald" />
          <ResourceValue label="工位" value={base.workstationCount} icon={Hash} tone="blue" />
        </div>

        <div className="mt-4 rounded-xl border border-slate-100 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">工位分配进度</span>
            <span className="font-semibold tabular-nums text-slate-700">{base.allocatedWorkstationCount} / {base.workstationCount}</span>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-slate-800 transition-all" style={{ width: `${Math.min(allocationRate, 100)}%` }} />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-lg bg-cyan-50 px-2.5 py-1.5 font-medium text-cyan-700">{base.tenantEnterpriseCount} 家入驻企业</span>
            <span className="rounded-lg bg-violet-50 px-2.5 py-1.5 font-medium text-violet-700">{base.serviceEnterpriseCount} 家服务企业</span>
          </div>
          <button type="button" onClick={onOpen} className="inline-flex items-center gap-1.5 self-end text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950 sm:self-auto">
            查看基地<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

function ResourceValue({ label, value, icon: Icon, tone }: { label: string; value: number; icon: LucideIcon; tone: "amber" | "emerald" | "blue" }) {
  const tones = {
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
  };

  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", tones[tone])}><Icon className="h-3.5 w-3.5" /></div>
      <p className="mt-3 text-lg font-semibold tabular-nums text-slate-900">{value}</p>
      <p className="mt-0.5 text-[10px] text-slate-400">{label}</p>
    </div>
  );
}
