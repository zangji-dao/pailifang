"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  Download,
  DollarSign,
  Calculator,
  FileSpreadsheet,
  Users,
  TrendingUp,
  CreditCard,
  Building2,
  Percent,
  Eye,
  Edit,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Receipt,
  Wallet,
} from "lucide-react";

// 工资状态
const SALARY_STATUS = {
  draft: { label: "草稿", color: "bg-slate-100 text-slate-700" },
  pending: { label: "待审批", color: "bg-amber-100 text-amber-700" },
  approved: { label: "已审批", color: "bg-emerald-100 text-emerald-700" },
  paid: { label: "已发放", color: "bg-blue-100 text-blue-700" },
};

// 模拟工资数据
const MOCK_SALARY_RECORDS = [
  {
    id: "1",
    employeeName: "张三",
    project: "阿里巴巴客服项目",
    baseSalary: 6000,
    performance: 1200,
    overtime: 480,
    subsidy: 300,
    socialInsurance: 680,
    housingFund: 420,
    tax: 185,
    deductions: 0,
    grossSalary: 7980,
    netSalary: 6695,
    status: "paid",
    month: "2024-01",
  },
  {
    id: "2",
    employeeName: "李四",
    project: "京东仓储项目",
    baseSalary: 5500,
    performance: 800,
    overtime: 320,
    subsidy: 200,
    socialInsurance: 620,
    housingFund: 380,
    tax: 120,
    deductions: 0,
    grossSalary: 6820,
    netSalary: 5700,
    status: "approved",
    month: "2024-01",
  },
  {
    id: "3",
    employeeName: "王五",
    project: "-",
    baseSalary: 5000,
    performance: 0,
    overtime: 0,
    subsidy: 0,
    socialInsurance: 580,
    housingFund: 350,
    tax: 45,
    deductions: 200,
    grossSalary: 5000,
    netSalary: 3825,
    status: "pending",
    month: "2024-01",
  },
  {
    id: "4",
    employeeName: "赵六",
    project: "阿里巴巴客服项目",
    baseSalary: 6500,
    performance: 1500,
    overtime: 720,
    subsidy: 300,
    socialInsurance: 720,
    housingFund: 450,
    tax: 245,
    deductions: 0,
    grossSalary: 9020,
    netSalary: 7605,
    status: "draft",
    month: "2024-01",
  },
];

// 工资月度汇总
const MONTHLY_SUMMARY = {
  month: "2024年1月",
  totalEmployees: 322,
  totalGross: 2156800,
  totalNet: 1812500,
  totalSocial: 186000,
  totalFund: 115200,
  totalTax: 45200,
  status: "pending",
};

// 社保公积金配置
const INSURANCE_CONFIG = {
  pension: { company: 0.16, personal: 0.08 },
  medical: { company: 0.095, personal: 0.02 },
  unemployment: { company: 0.005, personal: 0.005 },
  injury: { company: 0.004, personal: 0 },
  maternity: { company: 0.008, personal: 0 },
  housingFund: { company: 0.07, personal: 0.07 },
};

export default function SalaryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("2024-01");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<typeof MOCK_SALARY_RECORDS[0] | null>(null);

  const filteredRecords = MOCK_SALARY_RECORDS.filter((record) => {
    const matchesSearch = record.employeeName.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const showSalaryDetail = (record: typeof MOCK_SALARY_RECORDS[0]) => {
    setSelectedEmployee(record);
    setDetailDialogOpen(true);
  };

  // 统计数据
  const stats = {
    totalGross: MOCK_SALARY_RECORDS.reduce((sum, r) => sum + r.grossSalary, 0),
    totalNet: MOCK_SALARY_RECORDS.reduce((sum, r) => sum + r.netSalary, 0),
    totalSocial: MOCK_SALARY_RECORDS.reduce((sum, r) => sum + r.socialInsurance, 0),
    totalTax: MOCK_SALARY_RECORDS.reduce((sum, r) => sum + r.tax, 0),
    averageSalary: Math.round(
      MOCK_SALARY_RECORDS.reduce((sum, r) => sum + r.netSalary, 0) / MOCK_SALARY_RECORDS.length
    ),
  };

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">薪资管理</h1>
          <p className="text-sm text-slate-500 mt-1">工资表制作、社保公积金、个税计算</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            导入数据
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出工资条
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <Calculator className="h-4 w-4" />
            生成工资表
          </Button>
        </div>
      </div>

      {/* 月度汇总卡片 */}
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{MONTHLY_SUMMARY.month} 工资汇总</h3>
                <p className="text-sm text-slate-500">共 {MONTHLY_SUMMARY.totalEmployees} 名员工</p>
              </div>
            </div>
            <Badge className="bg-amber-100 text-amber-700 text-base px-4 py-1">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              待审批
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">应发总额</p>
              <p className="text-2xl font-semibold text-slate-900">¥{MONTHLY_SUMMARY.totalGross.toLocaleString()}</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">实发总额</p>
              <p className="text-2xl font-semibold text-emerald-600">¥{MONTHLY_SUMMARY.totalNet.toLocaleString()}</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">社保总额</p>
              <p className="text-2xl font-semibold text-blue-600">¥{MONTHLY_SUMMARY.totalSocial.toLocaleString()}</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">公积金总额</p>
              <p className="text-2xl font-semibold text-purple-600">¥{MONTHLY_SUMMARY.totalFund.toLocaleString()}</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">个税总额</p>
              <p className="text-2xl font-semibold text-amber-600">¥{MONTHLY_SUMMARY.totalTax.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-amber-200">
            <Button variant="outline" className="gap-2 bg-white/60">
              <Eye className="h-4 w-4" />
              查看明细
            </Button>
            <Button variant="outline" className="gap-2 bg-white/60">
              <Edit className="h-4 w-4" />
              编辑调整
            </Button>
            <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 ml-auto">
              <CheckCircle className="h-4 w-4" />
              提交审批
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-slate-200/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">¥{stats.totalGross.toLocaleString()}</p>
                <p className="text-xs text-slate-500">应发工资</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">¥{stats.totalNet.toLocaleString()}</p>
                <p className="text-xs text-slate-500">实发工资</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">¥{stats.totalSocial.toLocaleString()}</p>
                <p className="text-xs text-slate-500">社保扣除</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                <Percent className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">¥{stats.totalTax.toLocaleString()}</p>
                <p className="text-xs text-slate-500">个税扣除</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">¥{stats.averageSalary.toLocaleString()}</p>
                <p className="text-xs text-slate-500">平均工资</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 标签页 */}
      <Tabs defaultValue="salary">
        <TabsList>
          <TabsTrigger value="salary">工资表</TabsTrigger>
          <TabsTrigger value="insurance">社保公积金</TabsTrigger>
          <TabsTrigger value="tax">个税计算</TabsTrigger>
          <TabsTrigger value="history">历史记录</TabsTrigger>
        </TabsList>

        {/* 工资表 */}
        <TabsContent value="salary" className="space-y-4 mt-4">
          {/* 搜索和筛选 */}
          <Card className="border-slate-200/60">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="搜索员工姓名..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="选择月份" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-01">2024年1月</SelectItem>
                    <SelectItem value="2023-12">2023年12月</SelectItem>
                    <SelectItem value="2023-11">2023年11月</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="发放状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="pending">待审批</SelectItem>
                    <SelectItem value="approved">已审批</SelectItem>
                    <SelectItem value="paid">已发放</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 工资表列表 */}
          <Card className="border-slate-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">员工</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">项目</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">基本工资</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">绩效</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">加班</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">补贴</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600 text-emerald-600">应发</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600 text-blue-600">社保</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600 text-purple-600">公积金</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600 text-amber-600">个税</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600 text-red-500">扣款</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-900 font-semibold">实发</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">状态</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => {
                    const statusConfig = SALARY_STATUS[record.status as keyof typeof SALARY_STATUS];
                    return (
                      <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {record.employeeName.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium text-slate-900">{record.employeeName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500">{record.project}</td>
                        <td className="py-3 px-4 text-right text-sm">¥{record.baseSalary.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-sm text-emerald-600">+¥{record.performance.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-sm text-emerald-600">+¥{record.overtime.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-sm text-emerald-600">+¥{record.subsidy.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-sm font-medium text-emerald-600">¥{record.grossSalary.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-sm text-blue-600">-¥{record.socialInsurance.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-sm text-purple-600">-¥{record.housingFund.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-sm text-amber-600">-¥{record.tax.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-sm text-red-500">-¥{record.deductions.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-sm font-bold text-slate-900">¥{record.netSalary.toLocaleString()}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => showSalaryDetail(record)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* 社保公积金 */}
        <TabsContent value="insurance" className="space-y-4 mt-4">
          <Card className="border-slate-200/60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">社保公积金配置</CardTitle>
                <Button variant="outline" size="sm">编辑配置</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* 社保 */}
                <div>
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-500" />
                    社会保险
                  </h4>
                  <div className="space-y-2">
                    {Object.entries({
                      "养老保险": INSURANCE_CONFIG.pension,
                      "医疗保险": INSURANCE_CONFIG.medical,
                      "失业保险": INSURANCE_CONFIG.unemployment,
                      "工伤保险": INSURANCE_CONFIG.injury,
                      "生育保险": INSURANCE_CONFIG.maternity,
                    }).map(([name, rates]) => (
                      <div key={name} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-700">{name}</span>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-blue-600">企业 {rates.company * 100}%</span>
                          <span className="text-amber-600">个人 {rates.personal * 100}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 公积金 */}
                <div>
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-purple-500" />
                    住房公积金
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                      <span className="text-sm text-slate-700">缴存比例</span>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-blue-600">企业 7%</span>
                        <span className="text-amber-600">个人 7%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                      <span className="text-sm text-slate-700">缴存基数下限</span>
                      <span className="text-sm text-slate-900 font-medium">¥2,690</span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                      <span className="text-sm text-slate-700">缴存基数上限</span>
                      <span className="text-sm text-slate-900 font-medium">¥34,188</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 个税计算 */}
        <TabsContent value="tax" className="space-y-4 mt-4">
          <Card className="border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-base">个人所得税计算器</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-600 mb-1.5 block">税前工资</label>
                    <Input type="number" placeholder="输入税前工资" className="text-right" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 mb-1.5 block">五险一金</label>
                    <Input type="number" placeholder="输入五险一金" className="text-right" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 mb-1.5 block">专项附加扣除</label>
                    <Input type="number" placeholder="输入专项附加扣除" className="text-right" />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500">
                    计算个税
                  </Button>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-6">
                  <h4 className="font-medium text-slate-900 mb-4">计算结果</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">应纳税所得额</span>
                      <span className="font-medium">¥0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">适用税率</span>
                      <span className="font-medium">3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">速算扣除</span>
                      <span className="font-medium">¥0.00</span>
                    </div>
                    <div className="border-t border-slate-200 pt-3 flex justify-between">
                      <span className="font-medium text-slate-900">应缴个税</span>
                      <span className="font-bold text-amber-600 text-lg">¥0.00</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 税率表 */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="font-medium text-slate-900 mb-3">个人所得税税率表（综合所得适用）</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="text-left py-2 px-3 text-slate-600">级数</th>
                        <th className="text-left py-2 px-3 text-slate-600">应纳税所得额</th>
                        <th className="text-center py-2 px-3 text-slate-600">税率</th>
                        <th className="text-right py-2 px-3 text-slate-600">速算扣除</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { level: 1, range: "不超过36,000元", rate: "3%", deduction: 0 },
                        { level: 2, range: "超过36,000元至144,000元", rate: "10%", deduction: 2520 },
                        { level: 3, range: "超过144,000元至300,000元", rate: "20%", deduction: 16920 },
                        { level: 4, range: "超过300,000元至420,000元", rate: "25%", deduction: 31920 },
                        { level: 5, range: "超过420,000元至660,000元", rate: "30%", deduction: 52920 },
                        { level: 6, range: "超过660,000元至960,000元", rate: "35%", deduction: 85920 },
                        { level: 7, range: "超过960,000元", rate: "45%", deduction: 181920 },
                      ].map((row) => (
                        <tr key={row.level} className="hover:bg-slate-50">
                          <td className="py-2 px-3">{row.level}</td>
                          <td className="py-2 px-3">{row.range}</td>
                          <td className="py-2 px-3 text-center font-medium text-amber-600">{row.rate}</td>
                          <td className="py-2 px-3 text-right">¥{row.deduction.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 历史记录 */}
        <TabsContent value="history" className="mt-4">
          <Card className="border-slate-200/60">
            <CardContent className="pt-6 text-center text-slate-500">
              <CreditCard className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>暂无历史发放记录</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 工资详情弹窗 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>工资明细</DialogTitle>
            <DialogDescription>
              {selectedEmployee?.month} · {selectedEmployee?.employeeName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEmployee && (
            <div className="space-y-4">
              {/* 收入 */}
              <div>
                <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  收入项目
                </h4>
                <div className="space-y-1.5 bg-emerald-50/50 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">基本工资</span>
                    <span>¥{selectedEmployee.baseSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">绩效奖金</span>
                    <span className="text-emerald-600">+¥{selectedEmployee.performance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">加班工资</span>
                    <span className="text-emerald-600">+¥{selectedEmployee.overtime.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">补贴</span>
                    <span className="text-emerald-600">+¥{selectedEmployee.subsidy.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-emerald-200 pt-1.5 flex justify-between font-medium">
                    <span>应发合计</span>
                    <span className="text-emerald-700">¥{selectedEmployee.grossSalary.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 扣除 */}
              <div>
                <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-red-500" />
                  扣除项目
                </h4>
                <div className="space-y-1.5 bg-red-50/50 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">养老保险</span>
                    <span className="text-red-500">-¥{(selectedEmployee.socialInsurance * 0.45).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">医疗保险</span>
                    <span className="text-red-500">-¥{(selectedEmployee.socialInsurance * 0.3).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">失业保险</span>
                    <span className="text-red-500">-¥{(selectedEmployee.socialInsurance * 0.05).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">住房公积金</span>
                    <span className="text-red-500">-¥{selectedEmployee.housingFund.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">个人所得税</span>
                    <span className="text-red-500">-¥{selectedEmployee.tax.toLocaleString()}</span>
                  </div>
                  {selectedEmployee.deductions > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">其他扣款</span>
                      <span className="text-red-500">-¥{selectedEmployee.deductions.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-red-200 pt-1.5 flex justify-between font-medium">
                    <span>扣除合计</span>
                    <span className="text-red-600">¥{(selectedEmployee.grossSalary - selectedEmployee.netSalary).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 实发 */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-700">实发工资</span>
                  <span className="text-2xl font-bold text-amber-600">¥{selectedEmployee.netSalary.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  下载工资条
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Send className="h-4 w-4" />
                  发送员工
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
