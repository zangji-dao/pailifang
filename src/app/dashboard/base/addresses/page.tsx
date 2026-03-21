"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Hash, Plus, Loader2, RefreshCw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 注册号类型
interface RegNumber {
  id: string;
  code: string;
  available: boolean;
  enterprise_id: string | null;
  space: {
    id: string;
    code: string;
    name: string;
    area: number | null;
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

// 空间类型（用于生成注册号）
interface Space {
  id: string;
  code: string;
  name: string;
  area: number | null;
  meter: {
    id: string;
    code: string;
    name: string;
    base: {
      id: string;
      name: string;
    };
  };
}

export default function AddressManagementPage() {
  const [regNumbers, setRegNumbers] = useState<RegNumber[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>("");

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
      toast.error("获取数据失败");
    }
  };

  // 获取可用空间列表
  const fetchSpaces = async () => {
    try {
      const res = await fetch("/api/spaces/available");
      const result = await res.json();
      if (result.success) {
        setSpaces(result.data || []);
      }
    } catch (error) {
      console.error("获取空间失败:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchRegNumbers(), fetchSpaces()]);
      setLoading(false);
    };
    init();
  }, []);

  // 生成注册号
  const generateRegNumber = async () => {
    if (!selectedSpaceId) {
      toast.error("请选择空间");
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
        setSelectedSpaceId("");
        await fetchRegNumbers();
        await fetchSpaces();
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
  const allCount = regNumbers.length;
  const availableCount = regNumbers.filter((r) => r.available).length;
  const usedCount = regNumbers.filter((r) => !r.available).length;

  // 获取地址显示名称
  const getAddressName = (reg: RegNumber) => {
    const space = reg.space;
    const meter = space?.meter;
    const base = meter?.base;
    return `${base?.name || "-"} · ${meter?.name || meter?.code || "-"} · ${space?.name || space?.code || "-"}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="ml-2 text-slate-600">加载中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-slate-900">地址管理</h1>
          <p className="text-body text-muted-foreground">管理注册地址和注册号</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { fetchRegNumbers(); fetchSpaces(); }}>
          <RefreshCw className="h-4 w-4 mr-1.5" />
          刷新
        </Button>
      </div>

      {/* 生成注册号 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-card-title">生成新地址</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-caption text-muted-foreground mb-1.5 block">选择空间</label>
              <Select value={selectedSpaceId} onValueChange={setSelectedSpaceId}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择空间" />
                </SelectTrigger>
                <SelectContent>
                  {spaces.length === 0 ? (
                    <div className="px-2 py-4 text-center text-muted-foreground text-sm">
                      暂无可用空间
                    </div>
                  ) : (
                    spaces.map((space) => (
                      <SelectItem key={space.id} value={space.id}>
                        {space.meter?.base?.name} · {space.meter?.name} · {space.name}
                        {space.area && ` (${space.area}㎡)`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
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
        </CardContent>
      </Card>

      {/* 地址列表 */}
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="all">
            <div className="border-b px-4">
              <TabsList className="h-12 bg-transparent">
                <TabsTrigger value="all" className="data-[state=active]:bg-slate-100">
                  全部 ({allCount})
                </TabsTrigger>
                <TabsTrigger value="available" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-600">
                  待使用 ({availableCount})
                </TabsTrigger>
                <TabsTrigger value="used" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600">
                  已使用 ({usedCount})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* 全部 */}
            <TabsContent value="all" className="m-0">
              <AddressList items={regNumbers} getAddressName={getAddressName} />
            </TabsContent>

            {/* 待使用 */}
            <TabsContent value="available" className="m-0">
              <AddressList
                items={regNumbers.filter((r) => r.available)}
                getAddressName={getAddressName}
              />
            </TabsContent>

            {/* 已使用 */}
            <TabsContent value="used" className="m-0">
              <AddressList
                items={regNumbers.filter((r) => !r.available)}
                getAddressName={getAddressName}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// 地址列表组件
function AddressList({
  items,
  getAddressName,
}: {
  items: RegNumber[];
  getAddressName: (reg: RegNumber) => string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Hash className="h-12 w-12 text-slate-300 mb-3" />
        <p>暂无数据</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {items.map((reg) => (
        <div
          key={reg.id}
          className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <Hash className="h-4 w-4 text-slate-400" />
            <div>
              <p className="font-medium">{reg.code}</p>
              <p className="text-caption text-muted-foreground">{getAddressName(reg)}</p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={reg.available 
              ? "bg-amber-50 text-amber-600" 
              : "bg-emerald-50 text-emerald-600"
            }
          >
            {reg.available ? "待使用" : "已使用"}
          </Badge>
        </div>
      ))}
    </div>
  );
}
