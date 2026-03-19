"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  MapPin,
  Eye,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Building2,
  User,
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
type AddressStatus = "available" | "reserved" | "assigned";

interface Address {
  id: string;
  code: string;
  fullAddress: string;
  building: string | null;
  floor: string | null;
  room: string | null;
  area: string | null;
  status: AddressStatus;
  enterpriseId: string | null;
  enterpriseName: string | null;
  assignedAt: string | null;
  remarks: string | null;
  createdAt: string;
}

// 状态配置
const statusConfig: Record<AddressStatus, { label: string; className: string }> = {
  available: { label: "可用", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  reserved: { label: "预留", className: "bg-amber-50 text-amber-600 border-amber-200" },
  assigned: { label: "已分配", className: "bg-gray-50 text-gray-600 border-gray-200" },
};

export default function AddressesPage() {
  const router = useRouter();
  const tabsContext = useTabs();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // 获取地址列表
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/settlement/addresses");
        if (!response.ok) {
          throw new Error("获取地址列表失败");
        }
        const result = await response.json();
        setAddresses(result.data || []);
        setError(null);
      } catch (err) {
        console.error("获取地址列表失败:", err);
        setError(err instanceof Error ? err.message : "获取地址列表失败");
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  // 过滤地址列表
  const filteredAddresses = addresses.filter((a) => {
    const matchSearch =
      !searchKeyword ||
      a.code.includes(searchKeyword) ||
      a.fullAddress.includes(searchKeyword) ||
      (a.building && a.building.includes(searchKeyword));
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // 统计数据
  const stats = {
    total: addresses.length,
    available: addresses.filter((a) => a.status === "available").length,
    reserved: addresses.filter((a) => a.status === "reserved").length,
    assigned: addresses.filter((a) => a.status === "assigned").length,
  };

  // 打开新增地址标签页
  const handleAdd = () => {
    if (tabsContext) {
      tabsContext.openTab({
        id: "address-create",
        label: "新增地址",
        path: "/dashboard/base/addresses/create",
      });
    } else {
      router.push("/dashboard/base/addresses/create");
    }
  };

  // 打开地址详情标签页
  const handleView = (address: Address) => {
    if (tabsContext) {
      tabsContext.openTab({
        id: `address-${address.id}`,
        label: address.code,
        path: `/dashboard/base/addresses/${address.id}`,
      });
    } else {
      router.push(`/dashboard/base/addresses/${address.id}`);
    }
  };

  // 删除地址
  const handleDelete = async (address: Address) => {
    if (!confirm(`确定要删除地址「${address.code}」吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/settlement/addresses/${address.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "删除失败");
      }

      setAddresses((prev) => prev.filter((a) => a.id !== address.id));
    } catch (err) {
      console.error("删除失败:", err);
      alert(err instanceof Error ? err.message : "删除失败");
    }
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
      {/* 操作栏 */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            onClick={handleAdd}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            新增地址
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">地址总数</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-slate-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-emerald-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-600">可用</p>
              <p className="text-2xl font-semibold text-emerald-700 mt-1">{stats.available}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-amber-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600">预留</p>
              <p className="text-2xl font-semibold text-amber-700 mt-1">{stats.reserved}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">已分配</p>
              <p className="text-2xl font-semibold text-gray-700 mt-1">{stats.assigned}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="px-6 py-3 flex items-center gap-3 border-b border-slate-100 bg-white">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索地址编码、地址、楼宇..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-9 text-sm">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="available">可用</SelectItem>
            <SelectItem value="reserved">预留</SelectItem>
            <SelectItem value="assigned">已分配</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 地址列表 */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  地址编码
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  完整地址
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  楼宇/楼层/房间
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">面积</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">状态</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">
                  分配企业
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredAddresses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <MapPin className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p>暂无地址数据</p>
                  </td>
                </tr>
              ) : (
                filteredAddresses.map((address) => (
                  <tr
                    key={address.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900 font-mono">
                        {address.code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 max-w-xs truncate">
                      {address.fullAddress}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {address.building || address.floor || address.room ? (
                        <span>
                          {[address.building, address.floor, address.room]
                            .filter(Boolean)
                            .join(" / ")}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {address.area ? `${address.area}㎡` : "-"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-medium",
                          statusConfig[address.status].className
                        )}
                      >
                        {statusConfig[address.status].label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {address.enterpriseName ? (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-sm text-slate-600">{address.enterpriseName}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                          onClick={() => handleView(address)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {address.status !== "assigned" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-amber-600"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                              onClick={() => handleDelete(address)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
