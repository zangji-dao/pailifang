"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Download,
  Upload,
  Settings,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

// 科目类别
type Category = "资产" | "负债" | "权益" | "成本" | "损益";

// 科目数据结构
interface Subject {
  code: string;
  name: string;
  mnemonic?: string;
  balanceDirection: "借" | "贷";
  auxiliary?: string;
  status: "启用" | "停用";
  level: number;
  children?: Subject[];
  standards: {
    smallEnterprise: boolean;
    enterprise: boolean;
    nonprofit: boolean;
    cooperative: boolean;
    union: boolean;
    ruralCollective: boolean;
  };
}

// 模拟科目数据
const subjectsData: Record<Category, Subject[]> = {
  资产: [
    { code: "1001", name: "库存现金", mnemonic: "kcxj", balanceDirection: "借", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: true, cooperative: true, union: true, ruralCollective: true } },
    { code: "1002", name: "银行存款", mnemonic: "yhck", balanceDirection: "借", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: true, cooperative: true, union: true, ruralCollective: true } },
    { 
      code: "1002", 
      name: "银行存款", 
      mnemonic: "yhck", 
      balanceDirection: "借", 
      status: "启用", 
      level: 1,
      standards: { smallEnterprise: true, enterprise: true, nonprofit: true, cooperative: true, union: true, ruralCollective: true },
      children: [
        { code: "100201", name: "基本户", mnemonic: "yhck_jbh", balanceDirection: "借", status: "启用", level: 2, standards: { smallEnterprise: true, enterprise: true, nonprofit: true, cooperative: true, union: true, ruralCollective: true } },
        { code: "100202", name: "一般户", mnemonic: "yhck_ybh", balanceDirection: "借", status: "启用", level: 2, standards: { smallEnterprise: true, enterprise: true, nonprofit: true, cooperative: true, union: true, ruralCollective: true } },
      ]
    },
    { code: "1012", name: "其他货币资金", mnemonic: "qthbzj", balanceDirection: "借", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: true, cooperative: true, union: false, ruralCollective: true } },
    { code: "1101", name: "短期投资", mnemonic: "dqtz", balanceDirection: "借", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: false, nonprofit: true, cooperative: false, union: false, ruralCollective: false } },
    { code: "1102", name: "交易性金融资产", mnemonic: "jyxjrzc", balanceDirection: "借", status: "启用", level: 1, standards: { smallEnterprise: false, enterprise: true, nonprofit: false, cooperative: false, union: false, ruralCollective: false } },
    { code: "1121", name: "应收票据", mnemonic: "yspj", balanceDirection: "借", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: false, cooperative: false, union: false, ruralCollective: false } },
    { 
      code: "1122", 
      name: "应收账款", 
      mnemonic: "yszk", 
      balanceDirection: "借", 
      status: "启用", 
      level: 1,
      standards: { smallEnterprise: true, enterprise: true, nonprofit: true, cooperative: true, union: false, ruralCollective: true },
      children: [
        { code: "1122001", name: "应收账款", mnemonic: "yszk_yszk", balanceDirection: "借", auxiliary: "客户", status: "启用", level: 2, standards: { smallEnterprise: true, enterprise: true, nonprofit: true, cooperative: true, union: false, ruralCollective: true } },
      ]
    },
    { code: "1123", name: "预付账款", mnemonic: "yfzk", balanceDirection: "借", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: true, cooperative: false, union: false, ruralCollective: false } },
    { code: "1221", name: "其他应收款", mnemonic: "qtysk", balanceDirection: "借", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: true, cooperative: true, union: true, ruralCollective: true } },
    { code: "1231", name: "坏账准备", mnemonic: "hzzb", balanceDirection: "贷", status: "启用", level: 1, standards: { smallEnterprise: false, enterprise: true, nonprofit: false, cooperative: false, union: false, ruralCollective: false } },
    { code: "1403", name: "原材料", mnemonic: "ycl", balanceDirection: "借", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: false, cooperative: true, union: false, ruralCollective: true } },
    { code: "1405", name: "库存商品", mnemonic: "kcsp", balanceDirection: "借", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: false, cooperative: false, union: false, ruralCollective: false } },
    { code: "1601", name: "固定资产", mnemonic: "gdzc", balanceDirection: "借", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: true, cooperative: true, union: true, ruralCollective: true } },
    { code: "1602", name: "累计折旧", mnemonic: "ljzj", balanceDirection: "贷", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: true, cooperative: true, union: true, ruralCollective: true } },
    { code: "1604", name: "在建工程", mnemonic: "zjgc", balanceDirection: "借", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: true, cooperative: true, union: true, ruralCollective: true } },
    { code: "1701", name: "无形资产", mnemonic: "wxzc", balanceDirection: "借", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: true, cooperative: true, union: true, ruralCollective: true } },
    { code: "1702", name: "累计摊销", mnemonic: "ljtx", balanceDirection: "贷", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: false, cooperative: false, union: true, ruralCollective: true } },
  ],
  负债: [
    { code: "2001", name: "短期借款", mnemonic: "dqjk", balanceDirection: "贷", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: true, cooperative: false, union: false, ruralCollective: true } },
    { code: "2202", name: "应付账款", mnemonic: "yfzk", balanceDirection: "贷", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: true, cooperative: true, union: false, ruralCollective: true } },
    { code: "2211", name: "应付职工薪酬", mnemonic: "yfzgxc", balanceDirection: "贷", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: true, cooperative: true, union: true, ruralCollective: true } },
    { 
      code: "2221", 
      name: "应交税费", 
      mnemonic: "yjsf", 
      balanceDirection: "贷", 
      status: "启用", 
      level: 1,
      standards: { smallEnterprise: true, enterprise: true, nonprofit: true, cooperative: true, union: false, ruralCollective: true },
      children: [
        { code: "222101", name: "应交增值税", mnemonic: "yjsf_yjzzs", balanceDirection: "贷", status: "启用", level: 2, standards: { smallEnterprise: true, enterprise: true, nonprofit: true, cooperative: true, union: false, ruralCollective: true } },
        { code: "222103", name: "应交所得税", mnemonic: "yjsf_yjsds", balanceDirection: "贷", status: "启用", level: 2, standards: { smallEnterprise: true, enterprise: true, nonprofit: true, cooperative: true, union: false, ruralCollective: true } },
      ]
    },
    { code: "2241", name: "其他应付款", mnemonic: "qtyfk", balanceDirection: "贷", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: true, cooperative: true, union: true, ruralCollective: true } },
    { code: "2501", name: "长期借款", mnemonic: "cqjk", balanceDirection: "贷", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: true, cooperative: true, union: false, ruralCollective: true } },
  ],
  权益: [
    { code: "3001", name: "实收资本", mnemonic: "sszb", balanceDirection: "贷", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: false, cooperative: false, union: false, ruralCollective: false } },
    { code: "3002", name: "资本公积", mnemonic: "zbgj", balanceDirection: "贷", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: false, cooperative: true, union: false, ruralCollective: true } },
    { code: "3101", name: "盈余公积", mnemonic: "yygj", balanceDirection: "贷", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: false, cooperative: true, union: false, ruralCollective: true } },
    { code: "3103", name: "本年利润", mnemonic: "bnlr", balanceDirection: "贷", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: false, cooperative: false, union: false, ruralCollective: false } },
    { code: "3104", name: "利润分配", mnemonic: "lrfp", balanceDirection: "贷", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: false, cooperative: false, union: false, ruralCollective: false } },
  ],
  成本: [
    { code: "4001", name: "生产成本", mnemonic: "sccb", balanceDirection: "借", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: false, cooperative: true, union: false, ruralCollective: true } },
    { code: "4101", name: "制造费用", mnemonic: "zzfy", balanceDirection: "借", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: false, cooperative: false, union: false, ruralCollective: false } },
  ],
  损益: [
    { code: "5001", name: "主营业务收入", mnemonic: "zyywsr", balanceDirection: "贷", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: false, cooperative: false, union: false, ruralCollective: false } },
    { code: "5051", name: "其他业务收入", mnemonic: "qtywsr", balanceDirection: "贷", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: false, cooperative: false, union: false, ruralCollective: false } },
    { code: "5401", name: "主营业务成本", mnemonic: "zyywcb", balanceDirection: "借", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: false, cooperative: false, union: false, ruralCollective: false } },
    { code: "5602", name: "管理费用", mnemonic: "glfy", balanceDirection: "借", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: true, cooperative: true, union: false, ruralCollective: true } },
    { code: "5603", name: "财务费用", mnemonic: "cwfy", balanceDirection: "借", status: "启用", level: 1, standards: { smallEnterprise: true, enterprise: true, nonprofit: false, cooperative: false, union: false, ruralCollective: false } },
  ],
};

export default function SubjectsPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("资产");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDisabled, setShowDisabled] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // 筛选科目
  const filteredSubjects = useMemo(() => {
    let subjects = subjectsData[activeCategory];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      subjects = subjects.filter(
        (s) =>
          s.code.toLowerCase().includes(term) ||
          s.name.toLowerCase().includes(term) ||
          s.mnemonic?.toLowerCase().includes(term)
      );
    }

    if (!showDisabled) {
      subjects = subjects.filter((s) => s.status === "启用");
    }

    return subjects;
  }, [activeCategory, searchTerm, showDisabled]);

  // 切换行展开
  const toggleRow = (code: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  // 渲染科目行
  const renderSubjectRow = (subject: Subject, index: number, parentCode?: string) => {
    const hasChildren = subject.children && subject.children.length > 0;
    const isExpanded = expandedRows.has(subject.code);
    const isChild = parentCode !== undefined;

    return (
      <TableRow
        key={`${parentCode || ""}-${subject.code}`}
        className={`${isChild ? "bg-slate-50/50" : ""} hover:bg-slate-50/80`}
      >
        <TableCell className="w-12 text-center text-slate-500 text-sm">
          {index + 1}
        </TableCell>
        <TableCell className="font-mono text-sm">
          <div className="flex items-center gap-1" style={{ paddingLeft: `${(subject.level - 1) * 20}px` }}>
            {hasChildren && (
              <button
                onClick={() => toggleRow(subject.code)}
                className="p-0.5 hover:bg-slate-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                )}
              </button>
            )}
            {!hasChildren && subject.level > 1 && <span className="w-5" />}
            {hasChildren ? (
              <Folder className="h-4 w-4 text-amber-500" />
            ) : (
              <FileText className="h-4 w-4 text-slate-400" />
            )}
            <span className="ml-1">{subject.code}</span>
          </div>
        </TableCell>
        <TableCell className="font-medium text-sm">{subject.name}</TableCell>
        <TableCell className="text-slate-500 text-sm font-mono">
          {subject.mnemonic || "-"}
        </TableCell>
        <TableCell className="text-sm">
          <Badge
            variant="outline"
            className={
              subject.balanceDirection === "借"
                ? "border-blue-200 text-blue-700 bg-blue-50"
                : "border-red-200 text-red-700 bg-red-50"
            }
          >
            {subject.balanceDirection}
          </Badge>
        </TableCell>
        <TableCell className="text-sm text-slate-500">
          {subject.auxiliary || "-"}
        </TableCell>
        <TableCell className="text-sm">
          <Badge
            variant="outline"
            className={
              subject.status === "启用"
                ? "border-green-200 text-green-700 bg-green-50"
                : "border-gray-200 text-gray-500 bg-gray-50"
            }
          >
            {subject.status}
          </Badge>
        </TableCell>
        <TableCell className="text-sm">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              新增
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-600 hover:text-slate-700 hover:bg-slate-100">
              编辑
            </Button>
            {subject.level > 1 && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50">
                删除
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  // 渲染科目列表
  const renderSubjects = (subjects: Subject[]) => {
    let rowIndex = 0;
    const rows: React.ReactElement[] = [];

    const renderWithChildren = (subject: Subject, parentCode?: string) => {
      rows.push(renderSubjectRow(subject, rowIndex++, parentCode));

      if (subject.children && expandedRows.has(subject.code)) {
        subject.children.forEach((child) => {
          renderWithChildren(child, subject.code);
        });
      }
    };

    subjects.forEach((subject) => {
      renderWithChildren(subject);
    });

    return rows;
  };

  // 统计
  const categoryCounts = useMemo(() => {
    const counts: Record<Category, number> = { 资产: 0, 负债: 0, 权益: 0, 成本: 0, 损益: 0 };
    Object.entries(subjectsData).forEach(([category, subjects]) => {
      counts[category as Category] = subjects.length;
    });
    return counts;
  }, []);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 顶部标签栏 */}
      <div className="border-b border-slate-200">
        <div className="flex items-center px-4">
          {(["资产", "负债", "权益", "成本", "损益"] as Category[]).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`relative px-5 py-3 text-sm font-medium transition-colors ${
                activeCategory === category
                  ? "text-amber-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {category}
              <span className="ml-1.5 text-xs text-slate-400">
                ({categoryCounts[category]})
              </span>
              {activeCategory === category && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="输入编码/名称/助记码搜索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-9 h-8 text-sm bg-white"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <Checkbox
              checked={showDisabled}
              onCheckedChange={(checked) => setShowDisabled(checked as boolean)}
              className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
            />
            显示停用科目
          </label>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" className="h-8 bg-amber-500 hover:bg-amber-600 text-white">
            <Plus className="h-4 w-4 mr-1" />
            新增科目
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            <Settings className="h-4 w-4 mr-1" />
            编码设置
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            <Download className="h-4 w-4 mr-1" />
            导出
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            <Upload className="h-4 w-4 mr-1" />
            导入
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <RefreshCw className="h-4 w-4 text-slate-500" />
          </Button>
        </div>
      </div>

      {/* 表格区域 */}
      <ScrollArea className="flex-1">
        <Table>
          <TableHeader className="sticky top-0 bg-slate-100 z-10">
            <TableRow className="hover:bg-slate-100">
              <TableHead className="w-12 text-center text-xs font-medium text-slate-500">序号</TableHead>
              <TableHead className="text-xs font-medium text-slate-500 w-32">科目编码</TableHead>
              <TableHead className="text-xs font-medium text-slate-500">科目名称</TableHead>
              <TableHead className="text-xs font-medium text-slate-500 w-28">助记码</TableHead>
              <TableHead className="text-xs font-medium text-slate-500 w-20">余额方向</TableHead>
              <TableHead className="text-xs font-medium text-slate-500 w-24">辅助核算</TableHead>
              <TableHead className="text-xs font-medium text-slate-500 w-20">状态</TableHead>
              <TableHead className="text-xs font-medium text-slate-500 w-32">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubjects.length > 0 ? (
              renderSubjects(filteredSubjects)
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                  暂无匹配的科目数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-500">
        <span>共 <span className="font-medium text-slate-700">{filteredSubjects.length}</span> 个科目</span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <Folder className="h-3.5 w-3.5 text-amber-500" />
            一级科目
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            明细科目
          </span>
        </div>
      </div>
    </div>
  );
}
