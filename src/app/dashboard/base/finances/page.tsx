"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, Loader2, Eye, ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// 类型定义
interface FinanceRecord {
  id: string;
  enterprise_id: string;
  enterprise_name: string;
  type: "income" | "expense";
  amount: number;
  summary: string;
  remarks: string | null;
  created_at: string;
}

// 格式化金额
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
  }).format(amount);
};

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("zh-CN");
};

// 格式化时间
const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function FinancesPage() {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({ income: 0, expense: 0, total: 0 });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 30,
    total: 0,
    totalPages: 0,
  });

  // 筛选
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("");

  // 对话框
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"income" | "expense">("income");
  const [submitting, setSubmitting] = useState(false);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("pageSize", pagination.pageSize.toString());
      if (typeFilter) params.set("type", typeFilter);
      if (dateFilter) params.set("date", dateFilter);

      const response = await fetch(`/api/dashboard/base/finances?${params}`);
      const data = await response.json();

      if (response.ok) {
        setRecords(data.data || []);
        setBalance(data.balance || { income: 0, expense: 0, total: 0 });
        setPagination((prev) => ({ ...prev, total: data.pagination?.total || 0, totalPages: data.pagination?.totalPages || 0 }));
      }
    } catch (error) {
      console.error("加载数据失败:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, typeFilter, dateFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 打开新增对话框
  const openDialog = (type: "income" | "expense") => {
    setDialogType(type);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">资金管理</h1>
          <p className="text-sm text-muted-foreground mt-1">现金日记账 - 记录收入与支出</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => openDialog("income")}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <ArrowUpCircle className="h-4 w-4 mr-2" />
            记收入
          </Button>
          <Button
            onClick={() => openDialog("expense")}
            className="bg-rose-500 hover:bg-rose-600 text-white"
          >
            <ArrowDownCircle className="h-4 w-4 mr-2" />
            记支出
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">累计收入</div>
              <div className="text-xl font-semibold text-emerald-600">{formatMoney(balance.income)}</div>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <ArrowDownCircle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">累计支出</div>
              <div className="text-xl font-semibold text-rose-600">{formatMoney(balance.expense)}</div>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">当前余额</div>
              <div className={cn(
                "text-xl font-semibold",
                balance.total >= 0 ? "text-cyan-600" : "text-rose-600"
              )}>{formatMoney(balance.total)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选区域 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTypeFilter(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              !typeFilter ? "bg-cyan-500/10 text-cyan-600 ring-2 ring-cyan-400/30" : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            全部
          </button>
          <button
            onClick={() => setTypeFilter("income")}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              typeFilter === "income" ? "bg-emerald-500/10 text-emerald-600 ring-2 ring-emerald-400/30" : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            收入
          </button>
          <button
            onClick={() => setTypeFilter("expense")}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              typeFilter === "expense" ? "bg-rose-500/10 text-rose-600 ring-2 ring-rose-400/30" : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            支出
          </button>
        </div>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-40"
        />
        <Button variant="outline" size="icon" onClick={loadData} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* 记账列表 */}
      <div className="bg-card border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Wallet className="h-12 w-12 mb-4" />
            <p>暂无记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground w-32">日期</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">摘要</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground w-40">企业</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground w-32">收入</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground w-32">支出</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground w-32">余额</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {records.map((record, index) => {
                  const runningBalance = records.slice(0, index + 1).reduce((sum, r) => {
                    return sum + (r.type === "income" ? r.amount : -r.amount);
                  }, 0);

                  return (
                    <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDateTime(record.created_at)}
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{record.summary}</div>
                        {record.remarks && (
                          <div className="text-xs text-muted-foreground mt-0.5">{record.remarks}</div>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {record.enterprise_name || "-"}
                      </td>
                      <td className="p-4 text-right">
                        {record.type === "income" ? (
                          <span className="font-medium text-emerald-600">+{formatMoney(record.amount)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {record.type === "expense" ? (
                          <span className="font-medium text-rose-600">-{formatMoney(record.amount)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <span className={cn(
                          "font-medium",
                          runningBalance >= 0 ? "text-cyan-600" : "text-rose-600"
                        )}>
                          {formatMoney(runningBalance)}
                        </span>
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
            <span>{pagination.page} / {pagination.totalPages}</span>
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

      {/* 新增记录对话框 */}
      <RecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={dialogType}
        onSuccess={() => {
          setDialogOpen(false);
          loadData();
        }}
      />
    </div>
  );
}

// 记录对话框组件
function RecordDialog({
  open,
  onOpenChange,
  type,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "income" | "expense";
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [enterprises, setEnterprises] = useState<{ id: string; name: string; address_code?: string | null; type?: string }[]>([]);
  const [enterpriseSearch, setEnterpriseSearch] = useState("");
  const [formData, setFormData] = useState({
    enterprise_id: "",
    amount: "",
    summary: "",
    remarks: "",
  });

  // 加载企业
  useEffect(() => {
    if (open) {
      setEnterpriseSearch("");
      setFormData({ enterprise_id: "", amount: "", summary: "", remarks: "" });
      
      fetch("/api/dashboard/base/finances/enterprises")
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setEnterprises(data.data);
          }
        });
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!formData.amount || !formData.summary) {
      alert("请填写金额和摘要");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/base/finances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: parseFloat(formData.amount),
          enterprise_id: formData.enterprise_id || null,
          summary: formData.summary,
          remarks: formData.remarks || null,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        alert(data.error || "保存失败");
      }
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败");
    } finally {
      setLoading(false);
    }
  };

  const selectedEnterprise = enterprises.find(e => e.id === formData.enterprise_id);
  const filteredEnterprises = enterprises.filter(e => 
    !enterpriseSearch || e.name.toLowerCase().includes(enterpriseSearch.toLowerCase())
  );

  return (
    open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
        <div className="relative bg-card rounded-lg shadow-xl w-full max-w-md mx-4">
          <div className={cn(
            "p-4 border-b rounded-t-lg",
            type === "income" ? "bg-emerald-500" : "bg-rose-500"
          )}>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              {type === "income" ? (
                <>
                  <ArrowUpCircle className="h-5 w-5" />
                  记收入
                </>
              ) : (
                <>
                  <ArrowDownCircle className="h-5 w-5" />
                  记支出
                </>
              )}
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {/* 金额 */}
            <div>
              <label className="text-sm font-medium">金额 <span className="text-rose-500">*</span></label>
              <Input
                type="number"
                className="mt-1.5 text-xl font-semibold"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                autoFocus
              />
            </div>

            {/* 摘要 */}
            <div>
              <label className="text-sm font-medium">摘要 <span className="text-rose-500">*</span></label>
              <Input
                className="mt-1.5"
                placeholder="例如：收取服务费、退回押金、支付水电费..."
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              />
            </div>

            {/* 关联企业 */}
            <div>
              <label className="text-sm font-medium">关联企业</label>
              <div className="relative mt-1.5">
                <button
                  type="button"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-left flex items-center justify-between hover:border-cyan-400"
                  onClick={() => document.getElementById('enterprise-dropdown')?.classList.toggle('hidden')}
                >
                  <span className={selectedEnterprise ? "text-foreground" : "text-muted-foreground"}>
                    {selectedEnterprise ? (
                      <>
                        {selectedEnterprise.name}
                        {selectedEnterprise.address_code && (
                          <span className="text-muted-foreground ml-1">({selectedEnterprise.address_code})</span>
                        )}
                      </>
                    ) : "选择企业（可选）"}
                  </span>
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div id="enterprise-dropdown" className="hidden absolute z-50 w-full mt-1 bg-card border rounded-lg shadow-lg">
                  <div className="p-2 border-b">
                    <input
                      type="text"
                      placeholder="搜索企业..."
                      value={enterpriseSearch}
                      onChange={(e) => setEnterpriseSearch(e.target.value)}
                      className="w-full h-8 px-3 text-sm border rounded-md bg-background"
                    />
                  </div>
                  <div className="max-h-48 overflow-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, enterprise_id: "" });
                        document.getElementById('enterprise-dropdown')?.classList.add('hidden');
                      }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-muted/50 text-muted-foreground"
                    >
                      不关联企业
                    </button>
                    {filteredEnterprises.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, enterprise_id: e.id });
                          document.getElementById('enterprise-dropdown')?.classList.add('hidden');
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-sm text-left hover:bg-muted/50",
                          formData.enterprise_id === e.id && "bg-cyan-50 text-cyan-600"
                        )}
                      >
                        {e.name}
                        {e.address_code && <span className="text-muted-foreground ml-1">({e.address_code})</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 备注 */}
            <div>
              <label className="text-sm font-medium">备注</label>
              <textarea
                className="w-full mt-1.5 min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                placeholder="其他备注信息..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </div>
          </div>
          <div className="p-4 border-t flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className={type === "income" 
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : "bg-rose-500 hover:bg-rose-600 text-white"
              }
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              确认
            </Button>
          </div>
        </div>
      </div>
    )
  );
}
