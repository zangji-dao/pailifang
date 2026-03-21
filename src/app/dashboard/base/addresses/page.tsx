"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Hash, Plus, Loader2, RefreshCw, Building2, Home, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// 类型定义
interface Space {
  id: string;
  code: string;
  name: string;
  area: number | null;
  status: string;
  isOccupied: boolean;
  regNumbers: { id: string; code: string; available: boolean }[];
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

// 注册号类型（列表用）
interface RegNumber {
  id: string;
  code: string;
  available: boolean;
  enterprise_id: string | null;
  space: {
    id: string;
    code: string;
    name: string;
    meter: {
      id: string;
      code: string;
      name: string;
      base: {
        id: string;
        name: string;
      };
    };
  };
}

// 状态配置（参考 tenants 页面风格）
const statusConfig = {
  all: {
    label: "全部",
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-300",
    dotColor: "bg-slate-500",
  },
  available: {
    label: "待使用",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    dotColor: "bg-amber-500",
  },
  used: {
    label: "已使用",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
    dotColor: "bg-emerald-500",
  },
};

export default function AddressManagementPage() {
  const [cascadeData, setCascadeData] = useState<Base[]>([]);
  const [regNumbers, setRegNumbers] = useState<RegNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // 三级联动选择状态
  const [selectedBaseId, setSelectedBaseId] = useState<string>("");
  const [selectedMeterId, setSelectedMeterId] = useState<string>("");
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>("");

  // 获取级联数据
  const fetchCascadeData = async () => {
    try {
      const res = await fetch("/api/bases/cascade");
      const result = await res.json();
      if (result.success) {
        setCascadeData(result.data || []);
      }
    } catch (error) {
      console.error("获取级联数据失败:", error);
      toast.error("获取数据失败");
    }
  };

  // 获取注册号列表
  const fetchRegNumbers = async () => {
    try {
      const res = await fetch("/api/registration-numbers");
      const result = await res.json();
      if (result.success) {
        setRegNumbers(result.data || []);
      }
    } catch (error) {
      console.error("获取注册号失败:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchCascadeData(), fetchRegNumbers()]);
      setLoading(false);
    };
    init();
  }, []);

  // 基地变化时，重置物业和空间
  const handleBaseChange = (baseId: string) => {
    setSelectedBaseId(baseId);
    setSelectedMeterId("");
    setSelectedSpaceId("");
  };

  // 物业变化时，重置空间
  const handleMeterChange = (meterId: string) => {
    setSelectedMeterId(meterId);
    setSelectedSpaceId("");
  };

  // 获取当前选中的基地
  const selectedBase = cascadeData.find((b) => b.id === selectedBaseId);

  // 获取当前选中的物业
  const selectedMeter = selectedBase?.meters.find((m) => m.id === selectedMeterId);

  // 获取当前选中的空间
  const selectedSpace = selectedMeter?.spaces.find((s) => s.id === selectedSpaceId);

  // 生成注册号
  const generateRegNumber = async () => {
    if (!selectedSpaceId) {
      toast.error("请选择物理空间");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/registration-numbers/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spaceId: selectedSpaceId }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("注册号生成成功");
        // 重置选择
        setSelectedSpaceId("");
        // 刷新数据
        await Promise.all([fetchCascadeData(), fetchRegNumbers()]);
      } else {
        toast.error(result.error || "生成失败");
      }
    } catch (error) {
      console.error("生成注册号失败:", error);
      toast.error("生成失败");
    } finally {
      setGenerating(false);
    }
  };

  // 分类统计
  const stats = {
    all: regNumbers.length,
    available: regNumbers.filter((r) => r.available).length,
    used: regNumbers.filter((r) => !r.available).length,
  };

  // 获取地址显示名称
  const getAddressName = (reg: RegNumber) => {
    const space = reg.space;
    const meter = space?.meter;
    const base = meter?.base;
    return `${base?.name || "-"} · ${meter?.name || meter?.code || "-"} · ${space?.name || space?.code || "-"}`;
  };

  // 过滤列表
  const filteredRegNumbers = regNumbers.filter((r) => {
    if (statusFilter === "all" || !statusFilter) return true;
    if (statusFilter === "available") return r.available;
    if (statusFilter === "used") return !r.available;
    return true;
  });

  // 加载状态
  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* 页面标题和操作按钮 */}
      <div className="py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">地址管理</h1>
          <p className="text-sm text-slate-500 mt-1">管理注册地址和注册号</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchCascadeData();
            fetchRegNumbers();
          }}
        >
          <RefreshCw className="h-4 w-4 mr-1.5" />
          刷新
        </Button>
      </div>

      {/* 分割线 */}
      <div className="border-b" />

      {/* 状态卡片 */}
      <div className="py-4">
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(statusConfig).map(([key, config]) => {
            const count = stats[key as keyof typeof stats];
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(statusFilter === key ? null : key)}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3 py-2.5 transition-all",
                  statusFilter === key
                    ? `${config.borderColor} ${config.bgColor}`
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                )}
              >
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">{config.label}</div>
                  <div
                    className={cn(
                      "text-xl font-semibold",
                      statusFilter === key ? config.color : "text-foreground"
                    )}
                  >
                    {count}
                  </div>
                </div>
                <div className={cn("w-2 h-2 rounded-full", config.dotColor)} />
              </button>
            );
          })}
        </div>
      </div>

      {/* 分割线 */}
      <div className="border-b" />

      {/* 生成新地址 - 三级联动 */}
      <div className="py-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">生成新地址</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 items-end">
              {/* 基地选择 */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  基地
                </Label>
                <Select value={selectedBaseId} onValueChange={handleBaseChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择基地" />
                  </SelectTrigger>
                  <SelectContent>
                    {cascadeData.map((base) => (
                      <SelectItem key={base.id} value={base.id}>
                        {base.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 物业选择 */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Home className="h-3 w-3" />
                  物业
                </Label>
                <Select
                  value={selectedMeterId}
                  onValueChange={handleMeterChange}
                  disabled={!selectedBaseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedBaseId ? "选择物业" : "请先选基地"} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedBase?.meters.map((meter) => (
                      <SelectItem key={meter.id} value={meter.id}>
                        {meter.name || meter.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 物理空间选择 */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <DoorOpen className="h-3 w-3" />
                  物理空间
                </Label>
                <Select
                  value={selectedSpaceId}
                  onValueChange={setSelectedSpaceId}
                  disabled={!selectedMeterId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedMeterId ? "选择空间" : "请先选物业"} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedMeter?.spaces
                      .filter((space) => space.regNumbers.length === 0)
                      .map((space) => (
                        <SelectItem key={space.id} value={space.id}>
                          {space.name || space.code}
                          {space.area && ` (${space.area}㎡)`}
                        </SelectItem>
                      ))}
                    {selectedMeter?.spaces.every((s) => s.regNumbers.length > 0) && (
                      <div className="px-2 py-4 text-center text-muted-foreground text-sm">
                        该物业所有空间已生成注册号
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* 生成按钮 */}
              <Button
                onClick={generateRegNumber}
                disabled={generating || !selectedSpaceId}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1.5" />
                    生成注册号
                  </>
                )}
              </Button>
            </div>

            {/* 选中空间信息提示 */}
            {selectedSpace && (
              <div className="mt-3 p-2 bg-slate-50 rounded-lg text-xs text-muted-foreground">
                <span className="font-medium">已选择：</span>
                {selectedBase?.name} → {selectedMeter?.name || selectedMeter?.code} → {selectedSpace.name || selectedSpace.code}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 地址列表 */}
      <div className="border-t">
        {filteredRegNumbers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Hash className="h-12 w-12 text-slate-300 mb-3" />
            <p>暂无数据</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredRegNumbers.map((reg) => (
              <div
                key={reg.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="font-medium">{reg.code}</p>
                    <p className="text-xs text-muted-foreground">{getAddressName(reg)}</p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    reg.available
                      ? "bg-amber-50 text-amber-600"
                      : "bg-emerald-50 text-emerald-600"
                  }
                >
                  {reg.available ? "待使用" : "已使用"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
