"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, RefreshCw, ArrowUpDown, Loader2, Eye, RotateCcw, Trash2, Receipt, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/confirm-dialog";
import { 
  financeTypeConfig, 
  depositTypeConfig, 
  statusConfig, 
  paymentMethodConfig 
} from "@/lib/finances-config";

// 类型定义
interface Finance {
  id: string;
  enterprise_id: string;
  enterprise_name: string;
  enterprise_credit_code: string | null;
  site_id: string | null;
  site_name: string | null;
  type: string;
  deposit_type: string | null;
  item_name: string;
  amount: number;
  payment_method: string | null;
  status: string;
  refunded_amount: number;
  paid_at: string | null;
  refunded_at: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  refunds?: Refund[];
}

interface Refund {
  id: string;
  finance_id: string;
  amount: number;
  refund_method: string | null;
  refunded_at: string;
  remarks: string | null;
}

interface Stats {
  byType: Record<string, { total: number; count: number }>;
  byStatus: Record<string, { total: number; count: number }>;
  totalReceived: number;
  totalRefunded: number;
}

// 格式化金额
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
  }).format(amount);
};

// 格式化日期
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("zh-CN");
};

export default function FinancesPage() {
  const [finances, setFinances] = useState<Finance[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  // 筛选条件
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 对话框状态
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedFinance, setSelectedFinance] = useState<Finance | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const confirm = useConfirm();

  // 加载数据
  const loadFinances = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("pageSize", pagination.pageSize.toString());
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/dashboard/base/finances?${params}`);
      const data = await response.json();

      if (response.ok) {
        setFinances(data.data);
        setStats(data.stats);
        setPagination((prev) => ({ ...prev, total: data.pagination.total, totalPages: data.pagination.totalPages }));
      }
    } catch (error) {
      console.error("加载资金列表失败:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, typeFilter, statusFilter, searchQuery]);

  useEffect(() => {
    loadFinances();
  }, [loadFinances]);

  // 删除记录
  const handleDelete = async (finance: Finance) => {
    const confirmed = await confirm({
      title: "确认删除",
      description: `确定要删除「${finance.item_name}」吗？此操作不可撤销。`,
    });

    if (confirmed) {
      try {
        const response = await fetch(`/api/dashboard/base/finances/${finance.id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          loadFinances();
        } else {
          const data = await response.json();
          alert(data.error || "删除失败");
        }
      } catch (error) {
        console.error("删除失败:", error);
        alert("删除失败");
      }
    }
  };

  // 打开返还对话框
  const openRefundDialog = (finance: Finance) => {
    setSelectedFinance(finance);
    setRefundDialogOpen(true);
  };

  // 打开详情对话框
  const openDetailDialog = (finance: Finance) => {
    setSelectedFinance(finance);
    setDetailDialogOpen(true);
  };

  // 计算可返还金额
  const getRefundableAmount = (finance: Finance) => {
    return finance.amount - (finance.refunded_amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">资金管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理企业的服务费、押金、水电费等资金收支</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          新增收费
        </Button>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">已收取</div>
                <div className="text-xl font-semibold text-emerald-600">{formatMoney(stats.totalReceived)}</div>
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">已返还</div>
                <div className="text-xl font-semibold text-rose-600">{formatMoney(stats.totalRefunded)}</div>
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">押金余额</div>
                <div className="text-xl font-semibold text-cyan-600">
                  {formatMoney((stats.byType["deposit"]?.total || 0) - (stats.byStatus["refunded"]?.total || 0))}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">记录总数</div>
                <div className="text-xl font-semibold text-violet-600">{pagination.total}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 筛选区域 */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 类型筛选 */}
        <div className="flex items-center gap-1">
          {Object.entries(financeTypeConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(typeFilter === key ? null : key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                typeFilter === key
                  ? `${config.bg} ${config.color} ring-2 ring-offset-1`
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {config.label}
            </button>
          ))}
        </div>

        {/* 分隔线 */}
        <div className="w-px h-6 bg-border" />

        {/* 状态筛选 */}
        <div className="flex items-center gap-1">
          {Object.entries(statusConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? null : key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                statusFilter === key
                  ? `${config.bg} ${config.color} ring-2 ring-offset-1`
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {config.label}
            </button>
          ))}
        </div>

        {/* 搜索框 */}
        <div className="flex-1 min-w-[200px] max-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索企业/项目..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* 刷新按钮 */}
        <Button variant="outline" size="icon" onClick={loadFinances} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* 资金列表 */}
      <div className="bg-card border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          </div>
        ) : finances.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Receipt className="h-12 w-12 mb-4" />
            <p>暂无资金记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">企业名称</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">收费项目</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">类型</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">金额</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">状态</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">收取时间</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {finances.map((finance) => {
                  const typeConf = financeTypeConfig[finance.type as keyof typeof financeTypeConfig];
                  const statusConf = statusConfig[finance.status as keyof typeof statusConfig];
                  const refundableAmount = getRefundableAmount(finance);

                  return (
                    <tr key={finance.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{finance.enterprise_name}</div>
                          {finance.enterprise_credit_code && (
                            <div className="text-xs text-muted-foreground font-mono">
                              {finance.enterprise_credit_code}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{finance.item_name}</div>
                          {finance.site_name && (
                            <div className="text-xs text-muted-foreground">{finance.site_name}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={cn(typeConf?.color, typeConf?.bg)}>
                          {typeConf?.label || finance.type}
                          {finance.type === "deposit" && finance.deposit_type && (
                            <span className="ml-1">
                              ({depositTypeConfig[finance.deposit_type as keyof typeof depositTypeConfig]?.label})
                            </span>
                          )}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-semibold">{formatMoney(finance.amount)}</div>
                        {finance.refunded_amount > 0 && (
                          <div className="text-xs text-rose-600">
                            已返还 {formatMoney(finance.refunded_amount)}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={cn(statusConf?.color, statusConf?.bg)}>
                          {statusConf?.label || finance.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(finance.paid_at)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetailDialog(finance)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {finance.status !== "pending" && finance.status !== "refunded" && refundableAmount > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openRefundDialog(finance)}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          {finance.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(finance)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 分页 */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>共 {pagination.total} 条记录</div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              上一页
            </Button>
            <span>
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      {/* 新增收费对话框 */}
      <CreateFinanceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          setCreateDialogOpen(false);
          loadFinances();
        }}
      />

      {/* 返还对话框 */}
      {selectedFinance && (
        <RefundDialog
          open={refundDialogOpen}
          onOpenChange={setRefundDialogOpen}
          finance={selectedFinance}
          onSuccess={() => {
            setRefundDialogOpen(false);
            setSelectedFinance(null);
            loadFinances();
          }}
        />
      )}

      {/* 详情对话框 */}
      {selectedFinance && (
        <FinanceDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          finance={selectedFinance}
        />
      )}
    </div>
  );
}

// 新增收费对话框组件
function CreateFinanceDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [enterprises, setEnterprises] = useState<{ id: string; name: string; address_code?: string | null; type?: string }[]>([]);
  const [enterpriseSearch, setEnterpriseSearch] = useState("");
  const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    enterprise_id: "",
    type: "service_fee",
    deposit_type: "",
    item_name: "",
    amount: "",
    payment_method: "bank_transfer",
    status: "paid",
    remarks: "",
    site_id: "",
  });

  // 加载已分配地址的企业列表
  const loadEnterprises = useCallback((searchKeyword: string) => {
    const params = new URLSearchParams();
    if (searchKeyword) {
      params.set('keyword', searchKeyword);
    }
    
    fetch(`/api/dashboard/base/finances/enterprises?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setEnterprises(data.data.map((e: { id: string; name: string; address_code?: string | null; type?: string }) => ({
            id: e.id,
            name: e.name,
            address_code: e.address_code,
            type: e.type,
          })));
        }
      });
  }, []);

  // 初始化加载
  useEffect(() => {
    if (open) {
      setEnterpriseSearch("");
      loadEnterprises("");

      fetch("/api/dashboard/base/sites")
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setSites(data.data.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
          }
        });
    }
  }, [open, loadEnterprises]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      if (open && enterpriseSearch) {
        loadEnterprises(enterpriseSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [enterpriseSearch, open, loadEnterprises]);

  // 处理企业选择
  const handleEnterpriseChange = (value: string) => {
    setEnterpriseSearch(value);
    // 根据名称查找企业 ID
    const matched = enterprises.find(e => e.name === value);
    if (matched) {
      setFormData({ ...formData, enterprise_id: matched.id });
    } else {
      setFormData({ ...formData, enterprise_id: "" });
    }
  };

  const handleSubmit = async () => {
    if (!formData.enterprise_id || !formData.item_name || !formData.amount) {
      alert("请填写必填字段");
      return;
    }

    if (formData.type === "deposit" && !formData.deposit_type) {
      alert("请选择押金类型");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/base/finances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      if (response.ok) {
        onSuccess();
        // 重置表单
        setFormData({
          enterprise_id: "",
          type: "service_fee",
          deposit_type: "",
          item_name: "",
          amount: "",
          payment_method: "bank_transfer",
          status: "paid",
          remarks: "",
          site_id: "",
        });
      } else {
        const data = await response.json();
        alert(data.error || "创建失败");
      }
    } catch (error) {
      console.error("创建失败:", error);
      alert("创建失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
        <div className="relative bg-card rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">新增收费</h2>
          </div>
          <div className="p-6 space-y-4">
            {/* 企业选择 */}
            <div>
              <label className="text-sm font-medium">企业 <span className="text-rose-500">*</span></label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">仅显示已分配地址的企业和服务企业</p>
              <Input
                placeholder="输入搜索并选择企业..."
                value={enterpriseSearch}
                onChange={(e) => handleEnterpriseChange(e.target.value)}
                list="enterprises-list"
              />
              <datalist id="enterprises-list">
                {enterprises.map((e) => (
                  <option key={e.id} value={e.name} />
                ))}
              </datalist>
            </div>

            {/* 收费类型 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">收费类型 <span className="text-rose-500">*</span></label>
                <select
                  className="w-full mt-1.5 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value, deposit_type: "" })}
                >
                  {Object.entries(financeTypeConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>

              {/* 押金类型 */}
              {formData.type === "deposit" && (
                <div>
                  <label className="text-sm font-medium">押金类型 <span className="text-rose-500">*</span></label>
                  <select
                    className="w-full mt-1.5 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.deposit_type}
                    onChange={(e) => setFormData({ ...formData, deposit_type: e.target.value })}
                  >
                    <option value="">请选择</option>
                    {Object.entries(depositTypeConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 项目名称 */}
            <div>
              <label className="text-sm font-medium">项目名称 <span className="text-rose-500">*</span></label>
              <Input
                className="mt-1.5"
                placeholder="例如：2024年第一季度服务费"
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              />
            </div>

            {/* 金额和支付方式 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">金额 <span className="text-rose-500">*</span></label>
                <Input
                  type="number"
                  className="mt-1.5"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">支付方式</label>
                <select
                  className="w-full mt-1.5 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                >
                  {Object.entries(paymentMethodConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 状态 */}
            <div>
              <label className="text-sm font-medium">状态</label>
              <div className="flex gap-2 mt-1.5">
                {["paid", "pending"].map((status) => {
                  const config = statusConfig[status as keyof typeof statusConfig];
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFormData({ ...formData, status })}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                        formData.status === status
                          ? `${config.bg} ${config.color} border-current`
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 关联基地 */}
            <div>
              <label className="text-sm font-medium">关联基地</label>
              <select
                className="w-full mt-1.5 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.site_id}
                onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
              >
                <option value="">请选择基地（可选）</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* 备注 */}
            <div>
              <label className="text-sm font-medium">备注</label>
              <textarea
                className="w-full mt-1.5 min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                placeholder="备注信息..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </div>
          </div>
          <div className="p-6 border-t flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              确认添加
            </Button>
          </div>
        </div>
      </div>
    )
  );
}

// 返还对话框组件
function RefundDialog({
  open,
  onOpenChange,
  finance,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finance: Finance;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    refund_method: "bank_transfer",
    remarks: "",
  });

  const refundableAmount = finance.amount - (finance.refunded_amount || 0);

  useEffect(() => {
    if (open) {
      setFormData({
        amount: refundableAmount.toString(),
        refund_method: "bank_transfer",
        remarks: "",
      });
    }
  }, [open, refundableAmount]);

  const handleSubmit = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert("请输入有效的返还金额");
      return;
    }

    if (parseFloat(formData.amount) > refundableAmount) {
      alert(`返还金额不能超过 ${refundableAmount.toFixed(2)} 元`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/base/finances/${finance.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        alert(data.error || "返还失败");
      }
    } catch (error) {
      console.error("返还失败:", error);
      alert("返还失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
        <div className="relative bg-card rounded-lg shadow-xl w-full max-w-md mx-4">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">资金返还</h2>
          </div>
          <div className="p-6 space-y-4">
            {/* 资金信息 */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">企业</span>
                <span className="font-medium">{finance.enterprise_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">项目</span>
                <span className="font-medium">{finance.item_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">原金额</span>
                <span className="font-medium">{formatMoney(finance.amount)}</span>
              </div>
              {finance.refunded_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">已返还</span>
                  <span className="font-medium text-rose-600">{formatMoney(finance.refunded_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground">可返还</span>
                <span className="font-semibold text-emerald-600">{formatMoney(refundableAmount)}</span>
              </div>
            </div>

            {/* 返还金额 */}
            <div>
              <label className="text-sm font-medium">返还金额 <span className="text-rose-500">*</span></label>
              <Input
                type="number"
                className="mt-1.5"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            {/* 返还方式 */}
            <div>
              <label className="text-sm font-medium">返还方式</label>
              <select
                className="w-full mt-1.5 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.refund_method}
                onChange={(e) => setFormData({ ...formData, refund_method: e.target.value })}
              >
                {Object.entries(paymentMethodConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            {/* 备注 */}
            <div>
              <label className="text-sm font-medium">备注</label>
              <textarea
                className="w-full mt-1.5 min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                placeholder="返还原因等备注信息..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </div>
          </div>
          <div className="p-6 border-t flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              确认返还
            </Button>
          </div>
        </div>
      </div>
    )
  );
}

// 详情对话框组件
function FinanceDetailDialog({
  open,
  onOpenChange,
  finance,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finance: Finance;
}) {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch(`/api/dashboard/base/finances/${finance.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data?.refunds) {
            setRefunds(data.data.refunds);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [open, finance.id]);

  const typeConf = financeTypeConfig[finance.type as keyof typeof financeTypeConfig];
  const statusConf = statusConfig[finance.status as keyof typeof statusConfig];

  return (
    open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
        <div className="relative bg-card rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">资金详情</h2>
          </div>
          <div className="p-6 space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">企业名称</div>
                <div className="font-medium">{finance.enterprise_name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">收费类型</div>
                <div>
                  <Badge variant="outline" className={cn(typeConf?.color, typeConf?.bg)}>
                    {typeConf?.label || finance.type}
                    {finance.type === "deposit" && finance.deposit_type && (
                      <span className="ml-1">
                        ({depositTypeConfig[finance.deposit_type as keyof typeof depositTypeConfig]?.label})
                      </span>
                    )}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">项目名称</div>
                <div className="font-medium">{finance.item_name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">金额</div>
                <div className="font-semibold text-lg">{formatMoney(finance.amount)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">状态</div>
                <div>
                  <Badge variant="outline" className={cn(statusConf?.color, statusConf?.bg)}>
                    {statusConf?.label || finance.status}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">支付方式</div>
                <div>
                  {finance.payment_method 
                    ? paymentMethodConfig[finance.payment_method as keyof typeof paymentMethodConfig]?.label 
                    : "-"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">收取时间</div>
                <div>{formatDate(finance.paid_at)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">关联基地</div>
                <div>{finance.site_name || "-"}</div>
              </div>
            </div>

            {/* 已返还金额 */}
            {finance.refunded_amount > 0 && (
              <div className="bg-rose-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-rose-600">已返还金额</span>
                  <span className="font-semibold text-rose-600">{formatMoney(finance.refunded_amount)}</span>
                </div>
              </div>
            )}

            {/* 备注 */}
            {finance.remarks && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">备注</div>
                <div className="bg-muted/50 rounded-lg p-3 text-sm">{finance.remarks}</div>
              </div>
            )}

            {/* 返还记录 */}
            {refunds.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-3">返还记录</div>
                <div className="space-y-3">
                  {refunds.map((refund) => (
                    <div key={refund.id} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-rose-600">{formatMoney(refund.amount)}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDate(refund.refunded_at)}
                            {refund.refund_method && (
                              <> · {paymentMethodConfig[refund.refund_method as keyof typeof paymentMethodConfig]?.label}</>
                            )}
                          </div>
                          {refund.remarks && (
                            <div className="text-sm text-muted-foreground mt-1">{refund.remarks}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="p-6 border-t flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
          </div>
        </div>
      </div>
    )
  );
}
