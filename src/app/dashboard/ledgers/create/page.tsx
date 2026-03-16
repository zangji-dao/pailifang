"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  HelpCircle,
  Building2,
  Search,
  Loader2,
  CheckCircle2,
  X,
  Calendar,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// 会计准则选项
const ACCOUNTING_STANDARDS = [
  { value: "small_enterprise", label: "小企业会计准则" },
  { value: "enterprise", label: "企业会计准则" },
  { value: "non_profit_2026", label: "民间非营利组织会计制度" },
  { value: "farmer_coop_2023", label: "农民专业合作社财务制度" },
  { value: "union", label: "工会会计制度" },
  { value: "rural_collective", label: "农村集体经济组织核算制度" },
];

// 年份选项
const YEARS = Array.from({ length: 10 }, (_, i) => ({
  value: (new Date().getFullYear() - i).toString(),
  label: `${new Date().getFullYear() - i}年`,
}));

// 月份选项
const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `${i + 1}月`,
}));

// 模拟企业数据库
const MOCK_COMPANIES = [
  {
    name: "松原市宇鑫化工有限公司",
    creditCode: "91220700MA1234AB5X",
    legalPerson: "张三",
    taxpayerType: "general",
    industry: "化学原料和化学制品制造业",
  },
  {
    name: "吉林省宏远贸易公司",
    creditCode: "91220100MA5678CD2Y",
    legalPerson: "李四",
    taxpayerType: "small",
    industry: "批发业",
  },
  {
    name: "华信科技有限公司",
    creditCode: "91220100MA9012EF3Z",
    legalPerson: "王五",
    taxpayerType: "general",
    industry: "软件和信息技术服务业",
  },
];

interface CompanyInfo {
  name: string;
  creditCode: string;
  legalPerson: string;
  taxpayerType: string;
  industry: string;
}

export default function CreateLedgerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    year: new Date().getFullYear().toString(),
    month: "1",
    accountingStandard: "small_enterprise",
    taxpayerType: "small",
    amountDecimal: 2,
    quantityDecimal: 2,
    priceDecimal: 2,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CompanyInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        setIsSearching(true);
        setTimeout(() => {
          const results = MOCK_COMPANIES.filter((c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setSearchResults(results);
          setIsSearching(false);
        }, 300);
        setShowDropdown(true);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectCompany = (company: CompanyInfo) => {
    setSelectedCompany(company);
    setSearchQuery(company.name);
    setFormData({ ...formData, name: company.name, taxpayerType: company.taxpayerType });
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push("/dashboard/ledgers");
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 页面标题区 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-slate-900">新增账套</h1>
          <span className="text-sm text-slate-500">创建一个新的财务核算账套</span>
        </div>
      </div>

      {/* 表单区域 */}
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-8 gap-y-5">
          {/* 单位名称 - 占满一行 */}
          <div className="col-span-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-slate-500">单位名称</Label>
              <span className="text-[10px] text-red-500">必填</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={selectedCompany ? selectedCompany.name : searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedCompany(null);
                }}
                onFocus={() => searchQuery && setShowDropdown(true)}
                onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setShowDropdown(false)}
                placeholder="搜索企业名称..."
                className="h-9 pl-9 pr-9 text-sm border-slate-200 focus:border-amber-400 focus:ring-amber-400/20"
                required
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500 animate-spin" />
              )}
              {selectedCompany && (
                <button
                  type="button"
                  onClick={() => { setSelectedCompany(null); setSearchQuery(""); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* 搜索下拉 */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">
                  {searchResults.map((company) => (
                    <button
                      key={company.creditCode}
                      type="button"
                      onClick={() => handleSelectCompany(company)}
                      className="w-full px-3 py-2.5 text-left hover:bg-amber-50 border-b border-slate-100 last:border-0 flex items-center gap-2.5"
                    >
                      <Building2 className="h-4 w-4 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{company.name}</p>
                        <p className="text-xs text-slate-500">{company.creditCode} · {company.legalPerson}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 已选企业 */}
            {selectedCompany && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg text-sm">
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
                <span className="text-slate-700">{selectedCompany.name}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{selectedCompany.creditCode}</span>
              </div>
            )}
          </div>

          {/* 启用年月 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-500">启用年月</Label>
            <div className="flex gap-2">
              <Select value={formData.year} onValueChange={(v) => setFormData({ ...formData, year: v })}>
                <SelectTrigger className="h-9 flex-1 text-sm">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={formData.month} onValueChange={(v) => setFormData({ ...formData, month: v })}>
                <SelectTrigger className="h-9 w-24 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 会计准则 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1">
              <Label className="text-xs font-medium text-slate-500">会计准则</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-slate-400" /></TooltipTrigger>
                  <TooltipContent><p className="text-xs">选择适合企业的会计准则</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={formData.accountingStandard} onValueChange={(v) => setFormData({ ...formData, accountingStandard: v })}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNTING_STANDARDS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* 纳税人类型 - 占满一行 */}
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs font-medium text-slate-500">纳税人类型</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "small", label: "小规模纳税人", desc: "年销售额 ≤ 500万" },
                { value: "general", label: "一般纳税人", desc: "年销售额 > 500万" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, taxpayerType: item.value })}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all",
                    formData.taxpayerType === item.value
                      ? "border-amber-400 bg-amber-50"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      "w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center",
                      formData.taxpayerType === item.value ? "border-amber-500 bg-amber-500" : "border-slate-300"
                    )}>
                      {formData.taxpayerType === item.value && <div className="w-1 h-1 bg-white rounded-full" />}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 ml-5">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 精度设置 */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Settings2 className="h-3.5 w-3.5 text-slate-400" />
              <Label className="text-xs font-medium text-slate-500">精度设置</Label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "amountDecimal", label: "金额" },
                { key: "quantityDecimal", label: "数量" },
                { key: "priceDecimal", label: "单价" },
              ].map((item) => (
                <div key={item.key}>
                  <label className="text-[10px] text-slate-500 mb-1 block">{item.label}小数位</label>
                  <Select
                    value={formData[item.key as keyof typeof formData].toString()}
                    onValueChange={(v) => setFormData({ ...formData, [item.key]: parseInt(v) })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2位</SelectItem>
                      <SelectItem value="4">4位</SelectItem>
                      <SelectItem value="6">6位</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* 提交按钮 - 占满一行 */}
          <div className="col-span-2 flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/ledgers")}
              className="h-9 px-6 text-sm"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-9 px-8 text-sm bg-amber-500 hover:bg-amber-600"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "创建账套"}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
