"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Plus,
  Loader2,
  Search,
  Eye,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// 企业状态
type EnterpriseStatus = "active" | "inactive" | "pending";

interface Enterprise {
  id: string;
  name: string;
  creditCode?: string;
  legalPerson?: string;
  phone?: string;
  industry?: string;
  status: string;
  type?: string;
  settledDate?: string;
  createdAt: string;
}

// 状态配置
const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "正常", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  inactive: { label: "注销", className: "bg-slate-50 text-slate-600 border-slate-200" },
  pending: { label: "待审核", className: "bg-amber-50 text-amber-600 border-amber-200" },
};

export default function EnterpriseListPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");

  // 获取企业列表
  const fetchEnterprises = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/enterprises");
      const result = await response.json();
      if (result.success) {
        setEnterprises(result.data || []);
      } else {
        toast({
          title: "获取企业列表失败",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("获取企业列表失败:", err);
      toast({
        title: "获取企业列表失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnterprises();
  }, []);

  // 过滤企业列表
  const filteredEnterprises = enterprises.filter((e) => {
    if (!searchKeyword) return true;
    const keyword = searchKeyword.toLowerCase();
    return (
      e.name?.toLowerCase().includes(keyword) ||
      e.creditCode?.includes(keyword) ||
      e.legalPerson?.toLowerCase().includes(keyword) ||
      e.phone?.includes(keyword)
    );
  });

  // 统计数据
  const stats = {
    total: enterprises.length,
    active: enterprises.filter((e) => e.status === "active").length,
    pending: enterprises.filter((e) => e.status === "pending").length,
  };

  // 加载状态
  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">企业列表</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理所有入驻企业和服务商
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/base/tenants/create")}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          新建企业
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">企业总数</div>
          <div className="text-2xl font-semibold mt-1">{stats.total}</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">正常运营</div>
          <div className="text-2xl font-semibold mt-1 text-emerald-600">{stats.active}</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">待审核</div>
          <div className="text-2xl font-semibold mt-1 text-amber-600">{stats.pending}</div>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="搜索企业名称、法人、电话..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* 企业列表 */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">企业名称</th>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">统一社会信用代码</th>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">法人/电话</th>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">行业</th>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">状态</th>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">入驻时间</th>
              <th className="p-4 text-right text-sm font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredEnterprises.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  {searchKeyword ? "未找到匹配的企业" : "暂无企业数据"}
                </td>
              </tr>
            ) : (
              filteredEnterprises.map((enterprise) => (
                <tr key={enterprise.id} className="border-b last:border-b-0 hover:bg-muted/50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{enterprise.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground font-mono">
                    {enterprise.creditCode || "-"}
                  </td>
                  <td className="p-4 text-sm">
                    <div>{enterprise.legalPerson || "-"}</div>
                    <div className="text-muted-foreground">{enterprise.phone || "-"}</div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {enterprise.industry || "-"}
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className={cn("font-normal", statusConfig[enterprise.status]?.className || statusConfig.pending.className)}>
                      {statusConfig[enterprise.status]?.label || enterprise.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {enterprise.settledDate ? new Date(enterprise.settledDate).toLocaleDateString("zh-CN") : (enterprise.createdAt ? new Date(enterprise.createdAt).toLocaleDateString("zh-CN") : "-")}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/dashboard/base/tenants/${enterprise.id}`)}
                        className="gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        查看
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/dashboard/base/tenants/${enterprise.id}/edit`)}
                        className="gap-1"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        编辑
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
