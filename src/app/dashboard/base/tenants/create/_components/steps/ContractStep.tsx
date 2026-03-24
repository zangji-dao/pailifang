"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Loader2,
  Search,
  Building2,
  Calendar,
  Check,
  Link2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// 合同类型
type ContractType = "free" | "paid" | "tax_commitment" | string;

// 合同数据接口
interface Contract {
  id: string;
  enterpriseId: string | null;
  enterpriseName: string | null;
  contractNo: string | null;
  contractName?: string | null;
  contractType: ContractType;
  rentAmount: string | null;
  depositAmount: string | null;
  taxCommitment: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
}

// 合同类型配置
const contractTypeConfig: Record<string, { label: string; className: string }> = {
  free: { label: "免费入驻", className: "text-green-600" },
  paid: { label: "付费入驻", className: "text-blue-600" },
  tax_commitment: { label: "承诺税收", className: "text-amber-600" },
};

// 获取合同类型显示配置
const getContractTypeConfig = (type: ContractType) => {
  return contractTypeConfig[type] || { label: type || "未分类", className: "text-muted-foreground" };
};

// 状态配置
const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "草稿", className: "bg-gray-50 text-gray-600 border-gray-200" },
  pending: { label: "待签", className: "bg-amber-50 text-amber-600 border-amber-200" },
  signed: { label: "已签", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
};

interface ContractStepProps {
  enterpriseName: string;
  enterpriseId?: string | null;
  contract: {
    contractId: string | null;
    contractNumber: string;
  } | null;
  onUpdateContract: (contract: ContractStepProps["contract"]) => void;
}

export function ContractStep({
  enterpriseName,
  enterpriseId,
  contract,
  onUpdateContract,
}: ContractStepProps) {
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const { toast } = useToast();

  // 加载可选择的合同列表
  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      try {
        // 获取所有合同，在前端过滤
        const response = await fetch("/api/settlement/contracts");
        if (response.ok) {
          const result = await response.json();
          // 过滤出已签和待签状态的合同
          const validStatuses = ["signed", "pending"];
          const filteredContracts = (result.data || []).filter(
            (c: Contract) => validStatuses.includes(c.status)
          );
          setContracts(filteredContracts);
        }
      } catch (error) {
        console.error("获取合同列表失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  // 选择合同
  const handleSelectContract = (selectedContract: Contract) => {
    onUpdateContract({
      contractId: selectedContract.id,
      contractNumber: selectedContract.contractNo || "",
    });
    toast({ title: "已选择合同", description: `合同编号：${selectedContract.contractNo}` });
  };

  // 取消选择
  const handleClearSelection = () => {
    onUpdateContract(null);
    toast({ title: "已取消选择" });
  };

  // 过滤合同列表
  const filteredContracts = contracts.filter(c => {
    if (!searchKeyword) return true;
    return (c.contractNo?.includes(searchKeyword)) || 
           (c.enterpriseName?.includes(searchKeyword));
  });

  // 获取已选合同详情
  const selectedContract = contracts.find(c => c.id === contract?.contractId);

  return (
    <div className="space-y-6">
      {/* 已选择的合同 */}
      {contract && selectedContract && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Check className="w-5 h-5 text-primary" />
              已选择合同
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{selectedContract.contractNo}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    {selectedContract.enterpriseName ? (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {selectedContract.enterpriseName}
                      </span>
                    ) : selectedContract.contractName && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {selectedContract.contractName.replace(/合同$/, '')}
                      </span>
                    )}
                    <span className={getContractTypeConfig(selectedContract.contractType).className}>
                      {getContractTypeConfig(selectedContract.contractType).label}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {selectedContract.startDate} ~ {selectedContract.endDate}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">合同有效期</p>
                <p className="font-medium">1年</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t flex justify-end">
              <Button variant="outline" size="sm" onClick={handleClearSelection}>
                重新选择
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 选择合同 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            关联合同
          </CardTitle>
          <CardDescription>
            选择一份已创建的合同与该企业关联，合同详情和签名请在合同管理中完成
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索合同编号或企业名称..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 合同列表 */}
          <div className="border rounded-lg divide-y max-h-[400px] overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">加载中...</span>
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mb-3" />
                <p>暂无可选合同</p>
                <p className="text-xs mt-1">请先在合同管理中创建并签署合同</p>
              </div>
            ) : (
              filteredContracts.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                    contract?.contractId === c.id && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                  onClick={() => handleSelectContract(c)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-step-sky-muted flex items-center justify-center">
                      <FileText className="w-5 h-5 text-step-sky" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{c.contractNo || "未命名合同"}</p>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded border",
                          statusConfig[c.status]?.className || statusConfig.draft.className
                        )}>
                          {statusConfig[c.status]?.label || "草稿"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        {c.enterpriseName ? (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {c.enterpriseName}
                          </span>
                        ) : c.contractName && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {c.contractName.replace(/合同$/, '')}
                          </span>
                        )}
                        <span className={getContractTypeConfig(c.contractType).className}>
                          {getContractTypeConfig(c.contractType).label}
                        </span>
                        {c.startDate && c.endDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {c.startDate} ~ {c.endDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <span className={cn(
                      "px-2 py-1 rounded border",
                      statusConfig[c.status]?.className || "bg-muted text-muted-foreground"
                    )}>
                      {statusConfig[c.status]?.label || "未知"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 提示 */}
          <p className="text-xs text-muted-foreground">
            提示：合同详情编辑和签名请前往「合同管理」完成
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
