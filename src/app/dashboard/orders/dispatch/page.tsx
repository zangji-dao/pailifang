"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Send,
  User,
  Building,
  FileText,
  Clock,
  DollarSign,
  Users,
  Store,
  UserCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface OrderInfo {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  customerCompany?: string;
  serviceType: string;
  serviceName: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
  attachments?: string[];
}

interface Employee {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  workload: number; // 当前在手工单数
}

// 模拟数据
const mockOrders: OrderInfo[] = [
  {
    id: "1",
    orderNo: "ORD20240116001",
    customerName: "张三",
    customerPhone: "138****1234",
    customerCompany: "北京科技有限公司",
    serviceType: "business_register",
    serviceName: "公司注册",
    amount: 2000,
    description: "需要注册一家科技类公司，经营范围包含软件开发、技术咨询等。",
    status: "pending_dispatch",
    createdAt: "2024-01-16 10:30",
    attachments: ["营业执照.jpg", "身份证正面.jpg"],
  },
  {
    id: "2",
    orderNo: "ORD20240116002",
    customerName: "李四",
    customerPhone: "139****5678",
    serviceType: "trademark_register",
    serviceName: "商标注册",
    amount: 1500,
    description: "注册一个图形商标，用于服装类产品。",
    status: "pending_dispatch",
    createdAt: "2024-01-16 11:20",
  },
];

const mockEmployees: Employee[] = [
  { id: "1", name: "王会计", role: "accountant", workload: 3 },
  { id: "2", name: "赵专员", role: "specialist", workload: 5 },
  { id: "3", name: "钱会计", role: "accountant", workload: 2 },
  { id: "4", name: "孙专员", role: "specialist", workload: 1 },
];

const serviceTypeMap: Record<string, string> = {
  business_register: "工商注册",
  business_change: "工商变更",
  trademark_register: "商标注册",
  patent_apply: "专利申请",
  legal_consult: "法律咨询",
  logo_design: "Logo设计",
  accounting: "代理记账",
};

export default function DispatchPage() {
  const [searchNo, setSearchNo] = useState("");
  const [foundOrder, setFoundOrder] = useState<OrderInfo | null>(null);
  const [searchError, setSearchError] = useState("");
  const [dispatchType, setDispatchType] = useState<"hall" | "assign">("hall");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [salesShare, setSalesShare] = useState(30);
  const [handlerShare, setHandlerShare] = useState(50);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  const handleSearch = () => {
    setSearchError("");
    setFoundOrder(null);
    setDispatchSuccess(false);

    if (!searchNo.trim()) {
      setSearchError("请输入订单编号");
      return;
    }

    const order = mockOrders.find(
      (o) => o.orderNo.toLowerCase().includes(searchNo.toLowerCase())
    );

    if (order) {
      setFoundOrder(order);
    } else {
      setSearchError("未找到该订单，请检查订单编号");
    }
  };

  const handleDispatch = async () => {
    if (!foundOrder) return;

    if (dispatchType === "assign" && !selectedEmployee) {
      toast.error("请选择执行人员");
      return;
    }

    setIsDispatching(true);
    
    // 模拟发单请求
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsDispatching(false);
    setDispatchSuccess(true);
  };

  const totalShare = salesShare + handlerShare;
  const platformShare = 100 - totalShare;

  if (dispatchSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-green-800 mb-2">发单成功</h2>
            <p className="text-green-600 mb-6">
              订单 {foundOrder?.orderNo} 已成功发布
              {dispatchType === "hall" ? "到工单大厅" : `给 ${selectedEmployee?.name}`}
            </p>
            <Button onClick={() => {
              setFoundOrder(null);
              setSearchNo("");
              setDispatchSuccess(false);
              setSelectedEmployee(null);
            }}>
              继续去派单
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">去派单</h1>
        <p className="text-slate-500 mt-1">根据订单编号查找并派发工单</p>
      </div>

      {/* 搜索区域 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">查找订单</CardTitle>
          <CardDescription>输入订单编号搜索待派发的订单</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="请输入订单编号，如：ORD20240116001"
                value={searchNo}
                onChange={(e) => setSearchNo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              查找
            </Button>
          </div>
          {searchError && (
            <div className="flex items-center gap-2 mt-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {searchError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 订单详情 */}
      {foundOrder && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：订单信息 */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">订单详情</CardTitle>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    待派发
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 基本信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">订单编号</p>
                    <p className="font-medium">{foundOrder.orderNo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">服务类型</p>
                    <p className="font-medium">{serviceTypeMap[foundOrder.serviceType] || foundOrder.serviceType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">创建时间</p>
                    <p className="font-medium">{foundOrder.createdAt}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">订单金额</p>
                    <p className="font-medium text-amber-600">¥{foundOrder.amount.toLocaleString()}</p>
                  </div>
                </div>

                {/* 客户信息 */}
                <div className="pt-3 border-t">
                  <p className="text-xs text-slate-500 mb-2">客户信息</p>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-amber-100 text-amber-700">
                        {foundOrder.customerName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{foundOrder.customerName}</p>
                        {foundOrder.customerCompany && (
                          <Badge variant="secondary" className="text-xs">
                            <Building className="h-3 w-3 mr-1" />
                            {foundOrder.customerCompany}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{foundOrder.customerPhone}</p>
                    </div>
                  </div>
                </div>

                {/* 需求描述 */}
                <div className="pt-3 border-t">
                  <p className="text-xs text-slate-500 mb-2">需求描述</p>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                    {foundOrder.description}
                  </p>
                </div>

                {/* 附件 */}
                {foundOrder.attachments && foundOrder.attachments.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-slate-500 mb-2">附件</p>
                    <div className="flex flex-wrap gap-2">
                      {foundOrder.attachments.map((file, idx) => (
                        <Badge key={idx} variant="outline" className="font-normal">
                          <FileText className="h-3 w-3 mr-1" />
                          {file}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右侧：派单设置 */}
          <div className="space-y-4">
            {/* 分润设置 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  分润设置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-600">销售分润</span>
                    <span className="font-medium">{salesShare}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={salesShare}
                    onChange={(e) => setSalesShare(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-600">执行人分润</span>
                    <span className="font-medium">{handlerShare}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={handlerShare}
                    onChange={(e) => setHandlerShare(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">平台分润</span>
                    <span className={`font-medium ${platformShare < 0 ? "text-red-600" : "text-slate-900"}`}>
                      {platformShare}%
                    </span>
                  </div>
                  {platformShare < 0 && (
                    <p className="text-xs text-red-600 mt-1">分润比例总和不能超过100%</p>
                  )}
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-slate-500 mb-2">预计分润金额</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">销售</span>
                      <span className="font-medium text-green-600">¥{Math.round(foundOrder.amount * salesShare / 100)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">执行人</span>
                      <span className="font-medium text-green-600">¥{Math.round(foundOrder.amount * handlerShare / 100)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">平台</span>
                      <span className="font-medium text-slate-900">¥{Math.round(foundOrder.amount * platformShare / 100)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 派单方式 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">派单方式</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  onClick={() => {
                    setDispatchType("hall");
                    setSelectedEmployee(null);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    dispatchType === "hall"
                      ? "border-amber-500 bg-amber-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Store className={`h-5 w-5 ${dispatchType === "hall" ? "text-amber-600" : "text-slate-400"}`} />
                  <div className="text-left">
                    <p className="font-medium">派到工单大厅</p>
                    <p className="text-xs text-slate-500">所有人可见并抢单</p>
                  </div>
                </button>

                <button
                  onClick={() => setDispatchType("assign")}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    dispatchType === "assign"
                      ? "border-amber-500 bg-amber-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <UserCheck className={`h-5 w-5 ${dispatchType === "assign" ? "text-amber-600" : "text-slate-400"}`} />
                  <div className="text-left">
                    <p className="font-medium">派给指定人员</p>
                    <p className="text-xs text-slate-500">直接分配给某人执行</p>
                  </div>
                </button>

                {/* 选择执行人 */}
                {dispatchType === "assign" && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-slate-500">选择执行人</p>
                    <div className="max-h-48 overflow-y-auto space-y-1.5">
                      {mockEmployees.map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => setSelectedEmployee(emp)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                            selectedEmployee?.id === emp.id
                              ? "border-amber-500 bg-amber-50"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">
                                {emp.name.slice(-2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-left">
                              <p className="text-sm font-medium">{emp.name}</p>
                              <p className="text-xs text-slate-500">
                                当前在办 {emp.workload} 单
                              </p>
                            </div>
                          </div>
                          {selectedEmployee?.id === emp.id && (
                            <CheckCircle2 className="h-4 w-4 text-amber-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 发单按钮 */}
            <Button
              className="w-full h-11"
              onClick={handleDispatch}
              disabled={platformShare < 0 || isDispatching || (dispatchType === "assign" && !selectedEmployee)}
            >
              {isDispatching ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  发单中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  确认发单
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* 空状态提示 */}
      {!foundOrder && !searchError && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">输入订单编号开始派单</h3>
            <p className="text-sm text-slate-500">支持模糊搜索订单编号</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
