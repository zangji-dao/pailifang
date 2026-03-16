"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  FileText,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Users,
  UserCheck,
  UserX,
  Clock,
} from "lucide-react";

// 员工状态
const EMPLOYEE_STATUS = {
  pending: { label: "待入职", color: "bg-blue-100 text-blue-700" },
  active: { label: "在职", color: "bg-emerald-100 text-emerald-700" },
  standby: { label: "待岗", color: "bg-amber-100 text-amber-700" },
  resigned: { label: "已离职", color: "bg-slate-100 text-slate-700" },
  blacklist: { label: "黑名单", color: "bg-red-100 text-red-700" },
};

// 模拟员工数据
const MOCK_EMPLOYEES = [
  {
    id: "1",
    name: "张三",
    idCard: "3301**********1234",
    phone: "138****5678",
    gender: "male",
    age: 28,
    education: "本科",
    status: "active",
    currentProject: "阿里巴巴客服项目",
    position: "客服专员",
    joinDate: "2023-06-15",
    contractExpiry: "2025-06-14",
  },
  {
    id: "2",
    name: "李四",
    idCard: "3302**********5678",
    phone: "139****9012",
    gender: "male",
    age: 32,
    education: "大专",
    status: "active",
    currentProject: "京东仓储项目",
    position: "仓储管理员",
    joinDate: "2023-03-01",
    contractExpiry: "2025-02-28",
  },
  {
    id: "3",
    name: "王五",
    idCard: "3303**********9012",
    phone: "137****3456",
    gender: "male",
    age: 25,
    education: "高中",
    status: "standby",
    currentProject: null,
    position: null,
    joinDate: "2023-08-20",
    contractExpiry: "2025-08-19",
  },
  {
    id: "4",
    name: "赵六",
    idCard: "3304**********3456",
    phone: "136****7890",
    gender: "female",
    age: 29,
    education: "本科",
    status: "pending",
    currentProject: null,
    position: "行政助理",
    joinDate: "2024-01-20",
    contractExpiry: null,
  },
  {
    id: "5",
    name: "钱七",
    idCard: "3305**********7890",
    phone: "135****1234",
    gender: "female",
    age: 35,
    education: "大专",
    status: "resigned",
    currentProject: null,
    position: null,
    joinDate: "2022-05-10",
    contractExpiry: null,
    resignDate: "2023-12-31",
  },
];

// 统计卡片数据
const STATS = [
  { label: "总人数", value: 256, icon: Users, color: "bg-blue-500" },
  { label: "在职员工", value: 189, icon: UserCheck, color: "bg-emerald-500" },
  { label: "待岗人员", value: 42, icon: Clock, color: "bg-amber-500" },
  { label: "待入职", value: 15, icon: UserPlus, color: "bg-purple-500" },
  { label: "本月离职", value: 8, icon: UserX, color: "bg-red-500" },
];

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<typeof MOCK_EMPLOYEES[0] | null>(null);

  // 过滤员工列表
  const filteredEmployees = MOCK_EMPLOYEES.filter((emp) => {
    const matchesSearch = emp.name.includes(searchQuery) || emp.phone.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">员工档案</h1>
          <p className="text-sm text-slate-500 mt-1">管理劳务派遣员工档案信息</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            批量导入
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <Plus className="h-4 w-4" />
            新增员工
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {STATS.map((stat) => (
          <Card key={stat.label} className="border-slate-200/60">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 搜索和筛选 */}
      <Card className="border-slate-200/60">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="搜索员工姓名、手机号..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="员工状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待入职</SelectItem>
                <SelectItem value="active">在职</SelectItem>
                <SelectItem value="standby">待岗</SelectItem>
                <SelectItem value="resigned">已离职</SelectItem>
                <SelectItem value="blacklist">黑名单</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="项目" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部项目</SelectItem>
                <SelectItem value="alibaba">阿里巴巴客服项目</SelectItem>
                <SelectItem value="jd">京东仓储项目</SelectItem>
                <SelectItem value="meituan">美团配送项目</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 员工列表 */}
      <Card className="border-slate-200/60">
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {filteredEmployees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setSelectedEmployee(employee)}
              >
                {/* 头像 */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-medium">
                    {employee.name.charAt(0)}
                  </span>
                </div>

                {/* 基本信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-900">{employee.name}</span>
                    <Badge className={EMPLOYEE_STATUS[employee.status as keyof typeof EMPLOYEE_STATUS].color}>
                      {EMPLOYEE_STATUS[employee.status as keyof typeof EMPLOYEE_STATUS].label}
                    </Badge>
                    {employee.status === "active" && employee.contractExpiry && (
                      <Badge variant="outline" className="text-xs border-orange-200 text-orange-600">
                        合同将到期
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {employee.phone}
                    </span>
                    <span>{employee.idCard}</span>
                    <span>{employee.education}</span>
                  </div>
                </div>

                {/* 项目信息 */}
                <div className="text-right">
                  {employee.currentProject ? (
                    <>
                      <p className="text-sm font-medium text-slate-900">{employee.currentProject}</p>
                      <p className="text-xs text-slate-500">{employee.position}</p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">未分配项目</p>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 员工详情对话框 */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>员工详情</DialogTitle>
          </DialogHeader>
          
          {selectedEmployee && (
            <div className="space-y-6">
              {/* 头部信息 */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <span className="text-white text-xl font-medium">
                    {selectedEmployee.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">{selectedEmployee.name}</h3>
                    <Badge className={EMPLOYEE_STATUS[selectedEmployee.status as keyof typeof EMPLOYEE_STATUS].color}>
                      {EMPLOYEE_STATUS[selectedEmployee.status as keyof typeof EMPLOYEE_STATUS].label}
                    </Badge>
                  </div>
                  <p className="text-slate-500">{selectedEmployee.position || "暂无职位"}</p>
                </div>
              </div>

              {/* 标签页 */}
              <Tabs defaultValue="basic">
                <TabsList>
                  <TabsTrigger value="basic">基本信息</TabsTrigger>
                  <TabsTrigger value="education">教育经历</TabsTrigger>
                  <TabsTrigger value="work">工作经历</TabsTrigger>
                  <TabsTrigger value="certs">证件证书</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500">身份证号</label>
                      <p className="text-sm font-medium">{selectedEmployee.idCard}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">手机号码</label>
                      <p className="text-sm font-medium">{selectedEmployee.phone}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">性别</label>
                      <p className="text-sm font-medium">{selectedEmployee.gender === "male" ? "男" : "女"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">年龄</label>
                      <p className="text-sm font-medium">{selectedEmployee.age}岁</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">学历</label>
                      <p className="text-sm font-medium">{selectedEmployee.education}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">入职日期</label>
                      <p className="text-sm font-medium">{selectedEmployee.joinDate}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">合同到期</label>
                      <p className="text-sm font-medium">{selectedEmployee.contractExpiry || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">当前项目</label>
                      <p className="text-sm font-medium">{selectedEmployee.currentProject || "-"}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="education">
                  <div className="text-center py-8 text-slate-500">
                    暂无教育经历记录
                  </div>
                </TabsContent>
                
                <TabsContent value="work">
                  <div className="text-center py-8 text-slate-500">
                    暂无工作经历记录
                  </div>
                </TabsContent>
                
                <TabsContent value="certs">
                  <div className="text-center py-8 text-slate-500">
                    暂无证件证书记录
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
