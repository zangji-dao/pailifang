"use client";

import { useState, useEffect } from "react";
import { Building2, Search, User, Phone, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Enterprise {
  id: string;
  name: string;
  enterpriseCode: string;
  creditCode?: string;
  legalPerson?: string;
  phone?: string;
  registeredAddress?: string;
  businessAddress?: string;
  type: string;
  processStatus: string;
  baseId?: string;
  baseName?: string;
}

interface SelectEnterpriseStepProps {
  selectedEnterprise: Enterprise | null;
  onSelect: (enterprise: Enterprise) => void;
  searchKeyword: string;
  onSearchChange: (keyword: string) => void;
}

// 获取企业状态显示
const getProcessStatusBadge = (status: string) => {
  const config: Record<string, { label: string; className: string }> = {
    pending_registration: { label: "待工商注册", className: "bg-purple-50 text-purple-600" },
    pending_change: { label: "待工商变更", className: "bg-violet-50 text-violet-600" },
    pending_contract: { label: "待签合同", className: "bg-cyan-50 text-cyan-600" },
    pending_payment: { label: "待缴费", className: "bg-amber-50 text-amber-600" },
    active: { label: "入驻中", className: "bg-emerald-50 text-emerald-600" },
  };
  const info = config[status] || { label: status, className: "bg-gray-50 text-gray-600" };
  return <Badge className={info.className}>{info.label}</Badge>;
};

export function SelectEnterpriseStep({
  selectedEnterprise,
  onSelect,
  searchKeyword,
  onSearchChange,
}: SelectEnterpriseStepProps) {
  const [loading, setLoading] = useState(false);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);

  // 加载企业列表
  useEffect(() => {
    const fetchEnterprises = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/enterprises");
        if (response.ok) {
          const result = await response.json();
          const validStatuses = ["pending_contract", "pending_payment", "active", "pending_registration", "pending_change"];
          const filtered = (result.data || []).filter((e: Enterprise) => validStatuses.includes(e.processStatus));
          setEnterprises(filtered);
        }
      } catch (error) {
        console.error("加载企业列表失败:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEnterprises();
  }, []);

  // 过滤企业列表
  const filteredEnterprises = enterprises.filter(e => {
    if (!searchKeyword) return true;
    return e.name.includes(searchKeyword) ||
           e.enterpriseCode?.includes(searchKeyword) ||
           e.legalPerson?.includes(searchKeyword);
  });

  return (
    <div className="space-y-4">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索企业名称、编号或法人..."
          value={searchKeyword}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 企业列表 */}
      <div className="border rounded-lg divide-y max-h-[500px] overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredEnterprises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mb-3" />
            <p>暂无可选企业</p>
            <p className="text-xs mt-1">请先在企业管理中创建企业</p>
          </div>
        ) : (
          filteredEnterprises.map((enterprise) => (
            <div
              key={enterprise.id}
              className={cn(
                "p-4 hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-between",
                selectedEnterprise?.id === enterprise.id && "bg-primary/5 border-l-2 border-l-primary"
              )}
              onClick={() => onSelect(enterprise)}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center",
                  selectedEnterprise?.id === enterprise.id ? "bg-primary/20" : "bg-muted"
                )}>
                  <Building2 className={cn(
                    "h-6 w-6",
                    selectedEnterprise?.id === enterprise.id ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{enterprise.name}</span>
                    {getProcessStatusBadge(enterprise.processStatus)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="font-mono">{enterprise.enterpriseCode}</span>
                    {enterprise.legalPerson && (
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {enterprise.legalPerson}
                      </span>
                    )}
                    {enterprise.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {enterprise.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button 
                variant={selectedEnterprise?.id === enterprise.id ? "default" : "ghost"} 
                size="sm"
              >
                {selectedEnterprise?.id === enterprise.id ? "已选择" : "选择"}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
