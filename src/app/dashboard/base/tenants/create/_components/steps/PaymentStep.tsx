"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Receipt, 
  Check,
  Loader2,
  ArrowUpCircle,
  Building2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// 收款记录类型
interface FinanceRecord {
  id: string;
  enterprise_id: string;
  enterprise_name: string | null;
  type: "income" | "expense";
  category: string;
  amount: number;
  summary: string;
  remarks: string | null;
  created_at: string;
}

// 类型映射
const categoryLabels: Record<string, string> = {
  service_fee: "服务费",
  deposit: "押金",
  utility: "水电费",
  network: "网络费",
  heating: "取暖费",
  other_income: "其他收入",
  refund_deposit: "退押金",
  refund_utility: "退水电费",
  refund_prepayment: "退预存款",
  other_expense: "其他支出",
};

// 格式化金额
const formatMoney = (amount: number) => {
  return `¥${amount.toLocaleString()}`;
};

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("zh-CN");
};

interface PaymentStepProps {
  enterpriseId: string | null;
  enterpriseName: string;
  paymentRecordIds: string[];
  onUpdatePaymentRecords: (ids: string[], count: number, totalAmount: number) => void;
}

export function PaymentStep({
  enterpriseId,
  enterpriseName,
  paymentRecordIds,
  onUpdatePaymentRecords,
}: PaymentStepProps) {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const { toast } = useToast();

  // 加载该企业的收款记录
  useEffect(() => {
    const fetchRecords = async () => {
      if (!enterpriseId) {
        setRecords([]);
        return;
      }
      
      setLoading(true);
      try {
        // 获取该企业的所有收款记录
        const response = await fetch(`/api/dashboard/base/finances/enterprises`);
        if (response.ok) {
          const result = await response.json();
          // 过滤出当前企业的收入记录
          const enterpriseRecords = (result.data || [])
            .filter((r: FinanceRecord) => r.id === enterpriseId)
            .flatMap((e: any) => e.records || []);
          
          // 只保留收入类型
          const incomeRecords = enterpriseRecords.filter(
            (r: FinanceRecord) => r.type === "income"
          );
          setRecords(incomeRecords);
        }
      } catch (error) {
        console.error("获取收款记录失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [enterpriseId]);

  // 选择/取消选择记录
  const toggleRecord = (recordId: string) => {
    let newIds: string[];
    if (paymentRecordIds.includes(recordId)) {
      newIds = paymentRecordIds.filter(id => id !== recordId);
      toast({ title: "已取消关联" });
    } else {
      newIds = [...paymentRecordIds, recordId];
      toast({ title: "已关联收款记录" });
    }
    // 计算新的总额
    const selectedRecords = records.filter(r => newIds.includes(r.id));
    const totalAmount = selectedRecords.reduce((sum, r) => sum + Number(r.amount), 0);
    onUpdatePaymentRecords(newIds, newIds.length, totalAmount);
  };

  // 计算已选金额
  const selectedRecords = records.filter(r => paymentRecordIds.includes(r.id));
  const totalSelected = selectedRecords.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="space-y-6">
      {/* 已选择的收款记录汇总 */}
      {paymentRecordIds.length > 0 && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-emerald-700">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              已关联收款记录
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已选择 {paymentRecordIds.length} 笔收款</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedRecords.map(r => categoryLabels[r.category] || r.category).join("、")}
                </p>
              </div>
              <div className="text-right bg-white/60 px-4 py-2 rounded-lg">
                <p className="text-xs text-muted-foreground">已收款金额</p>
                <p className="text-xl font-bold text-emerald-700">{formatMoney(totalSelected)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 选择收款记录 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            关联收款记录
          </CardTitle>
          <CardDescription>
            选择该企业在资金管理中的收款记录，费用详情请在资金管理中完成
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">加载中...</span>
            </div>
          ) : !enterpriseId ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mb-3" />
              <p>请先完成企业信息填写</p>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <ArrowUpCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <p>暂无收款记录</p>
              <p className="text-xs mt-1">请先在资金管理中创建该企业的收款记录</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => window.open("/dashboard/base/finances", "_blank")}
              >
                前往资金管理
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg divide-y">
              {records.map((record) => (
                <div
                  key={record.id}
                  className={cn(
                    "flex items-center justify-between p-4 cursor-pointer hover:bg-emerald-50/50 transition-colors",
                    paymentRecordIds.includes(record.id) && "bg-emerald-50 border-l-2 border-l-emerald-500"
                  )}
                  onClick={() => toggleRecord(record.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      paymentRecordIds.includes(record.id) ? "bg-emerald-100" : "bg-muted"
                    )}>
                      <ArrowUpCircle className={cn(
                        "w-5 h-5",
                        paymentRecordIds.includes(record.id) ? "text-emerald-600" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{record.summary}</p>
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                          {categoryLabels[record.category] || record.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(record.created_at)}
                        </span>
                        {record.remarks && (
                          <span>{record.remarks}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold text-emerald-600">{formatMoney(Number(record.amount))}</p>
                    {paymentRecordIds.includes(record.id) && (
                      <Check className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 提示 */}
          <p className="text-xs text-muted-foreground">
            提示：收款记录请在「资金管理」中创建和管理
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
