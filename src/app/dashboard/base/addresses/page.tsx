"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  Home,
  DoorOpen,
  Hash,
  Plus,
  ChevronRight,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// 类型定义
interface RegNumber {
  id: string;
  code: string;
  available: boolean;
  enterprise_id: string | null;
}

interface Space {
  id: string;
  code: string;
  name: string;
  area: number | null;
  status: string;
  isOccupied: boolean;
  regNumbers: RegNumber[];
}

interface Meter {
  id: string;
  code: string;
  name: string;
  area: number | null;
  status: string;
  spaces: Space[];
}

interface Base {
  id: string;
  name: string;
  address: string | null;
  status: string;
  meters: Meter[];
}

export default function AddressManagementPage() {
  const router = useRouter();
  const [cascadeData, setCascadeData] = useState<Base[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBases, setExpandedBases] = useState<Set<string>>(new Set());
  const [expandedMeters, setExpandedMeters] = useState<Set<string>>(new Set());
  const [generatingReg, setGeneratingReg] = useState<string | null>(null);

  // 获取级联数据
  const fetchCascadeData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bases/cascade");
      const result = await res.json();
      if (result.success) {
        setCascadeData(result.data || []);
      } else {
        toast.error("获取数据失败");
      }
    } catch (error) {
      console.error("获取级联数据失败:", error);
      toast.error("获取数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCascadeData();
  }, []);

  // 展开/折叠基地
  const toggleBase = (baseId: string) => {
    setExpandedBases((prev) => {
      const next = new Set(prev);
      if (next.has(baseId)) {
        next.delete(baseId);
      } else {
        next.add(baseId);
      }
      return next;
    });
  };

  // 展开/折叠物业
  const toggleMeter = (meterId: string) => {
    setExpandedMeters((prev) => {
      const next = new Set(prev);
      if (next.has(meterId)) {
        next.delete(meterId);
      } else {
        next.add(meterId);
      }
      return next;
    });
  };

  // 生成注册号
  const generateRegNumber = async (spaceId: string) => {
    setGeneratingReg(spaceId);
    try {
      const res = await fetch("/api/registration-numbers/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ space_id: spaceId }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`注册号 ${result.data.code} 生成成功`);
        // 刷新数据
        fetchCascadeData();
      } else {
        toast.error(result.error || "生成失败");
      }
    } catch (error) {
      console.error("生成注册号失败:", error);
      toast.error("生成注册号失败");
    } finally {
      setGeneratingReg(null);
    }
  };

  // 统计数据
  const stats = {
    totalBases: cascadeData.length,
    totalMeters: cascadeData.reduce((sum, b) => sum + b.meters.length, 0),
    totalSpaces: cascadeData.reduce(
      (sum, b) => sum + b.meters.reduce((s, m) => s + m.spaces.length, 0),
      0
    ),
    availableSpaces: cascadeData.reduce(
      (sum, b) =>
        sum +
        b.meters.reduce(
          (s, m) => s + m.spaces.filter((sp) => !sp.isOccupied).length,
          0
        ),
      0
    ),
    totalRegNumbers: cascadeData.reduce(
      (sum, b) =>
        sum +
        b.meters.reduce(
          (s, m) =>
            s + m.spaces.reduce((rs, sp) => rs + (sp.regNumbers?.length || 0), 0),
          0
        ),
      0
    ),
    availableRegNumbers: cascadeData.reduce(
      (sum, b) =>
        sum +
        b.meters.reduce(
          (s, m) =>
            s +
            m.spaces.reduce(
              (rs, sp) =>
                rs + (sp.regNumbers?.filter((r) => r.available).length || 0),
              0
            ),
          0
        ),
      0
    ),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-600">加载中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">地址管理</h1>
          <p className="text-sm text-slate-500 mt-1">
            管理基地、物业、物理空间和注册号
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCascadeData}>
          <RefreshCw className="h-4 w-4 mr-1.5" />
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">基地</p>
                <p className="text-2xl font-semibold">{stats.totalBases}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Home className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">物业</p>
                <p className="text-2xl font-semibold">{stats.totalMeters}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <DoorOpen className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">物理空间</p>
                <p className="text-2xl font-semibold">{stats.totalSpaces}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-green-600">可用空间</p>
                <p className="text-2xl font-semibold text-green-600">
                  {stats.availableSpaces}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Hash className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">注册号</p>
                <p className="text-2xl font-semibold">{stats.totalRegNumbers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                <Hash className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-sm text-violet-600">可用注册号</p>
                <p className="text-2xl font-semibold text-violet-600">
                  {stats.availableRegNumbers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 层级树 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">地址层级</CardTitle>
        </CardHeader>
        <CardContent>
          {cascadeData.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">暂无地址数据</p>
              <p className="text-sm text-slate-400 mt-1">
                请先在基地列表中添加基地和物业
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {cascadeData.map((base) => (
                <div key={base.id} className="border rounded-lg">
                  {/* 基地层级 */}
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50"
                    onClick={() => toggleBase(base.id)}
                  >
                    <div className="flex items-center gap-2">
                      {expandedBases.has(base.id) ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                      <Building2 className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">{base.name}</span>
                      {base.address && (
                        <span className="text-sm text-slate-500">
                          · {base.address}
                        </span>
                      )}
                      <Badge variant="secondary" className="ml-2">
                        {base.meters.length} 物业
                      </Badge>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        base.status === "active"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-slate-50 text-slate-500"
                      )}
                    >
                      {base.status === "active" ? "运营中" : "已停用"}
                    </Badge>
                  </div>

                  {/* 物业层级 */}
                  {expandedBases.has(base.id) && (
                    <div className="ml-6 border-l-2 border-slate-100 pl-2 py-1">
                      {base.meters.map((meter) => (
                        <div key={meter.id} className="mb-1">
                          <div
                            className="flex items-center justify-between p-2 cursor-pointer hover:bg-slate-50 rounded"
                            onClick={() => toggleMeter(meter.id)}
                          >
                            <div className="flex items-center gap-2">
                              {expandedMeters.has(meter.id) ? (
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                              )}
                              <Home className="h-4 w-4 text-amber-500" />
                              <span className="font-medium">
                                {meter.name || meter.code}
                              </span>
                              <span className="text-sm text-slate-500">
                                ({meter.code})
                              </span>
                              {meter.area && (
                                <span className="text-sm text-slate-500">
                                  · {meter.area}㎡
                                </span>
                              )}
                              <Badge variant="secondary" className="ml-1">
                                {meter.spaces.length} 空间
                              </Badge>
                            </div>
                          </div>

                          {/* 物理空间层级 */}
                          {expandedMeters.has(meter.id) && (
                            <div className="ml-6 border-l-2 border-slate-100 pl-2 py-1">
                              {meter.spaces.map((space) => (
                                <div
                                  key={space.id}
                                  className="flex items-center justify-between p-2 hover:bg-slate-50 rounded"
                                >
                                  <div className="flex items-center gap-2">
                                    <DoorOpen className="h-4 w-4 text-emerald-500" />
                                    <span>{space.name || space.code}</span>
                                    {space.area && (
                                      <span className="text-sm text-slate-500">
                                        · {space.area}㎡
                                      </span>
                                    )}
                                    {space.isOccupied ? (
                                      <Badge
                                        variant="outline"
                                        className="bg-slate-50 text-slate-500"
                                      >
                                        已占用
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="bg-green-50 text-green-600 border-green-200"
                                      >
                                        可用
                                      </Badge>
                                    )}
                                  </div>

                                  {/* 注册号区域 */}
                                  <div className="flex items-center gap-2">
                                    {(space.regNumbers?.length || 0) > 0 ? (
                                      space.regNumbers?.map((reg) => (
                                        <Badge
                                          key={reg.id}
                                          variant="outline"
                                          className={cn(
                                            reg.available
                                              ? "bg-violet-50 text-violet-600 border-violet-200"
                                              : "bg-slate-50 text-slate-500"
                                          )}
                                        >
                                          <Hash className="h-3 w-3 mr-1" />
                                          {reg.code}
                                          {reg.available ? " (可用)" : " (已分配)"}
                                        </Badge>
                                      ))
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          generateRegNumber(space.id);
                                        }}
                                        disabled={generatingReg === space.id}
                                      >
                                        {generatingReg === space.id ? (
                                          <>
                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                            生成中...
                                          </>
                                        ) : (
                                          <>
                                            <Plus className="h-3 w-3 mr-1" />
                                            生成注册号
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
