"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Building2,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Filter,
  MapPin,
  Phone,
  User,
  Calendar,
  FileText,
  AlertCircle,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// 企业状态
type EnterpriseStatus = "active" | "inactive" | "pending";

// 企业信息接口
interface Enterprise {
  id: string;
  name: string;
  creditCode: string;
  legalPerson: string;
  phone: string;
  registeredAddress: string;
  businessAddress: string;
  industry: string;
 入驻Date: string;
  status: EnterpriseStatus;
  remarks: string;
}

// 状态配置
const statusConfig: Record<EnterpriseStatus, { label: string; className: string }> = {
  active: { label: "入驻中", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  inactive: { label: "已迁出", className: "bg-gray-50 text-gray-600 border-gray-200" },
  pending: { label: "待入驻", className: "bg-amber-50 text-amber-600 border-amber-200" },
};

// 行业选项
const INDUSTRIES = [
  "制造业",
  "批发和零售业",
  "信息技术服务业",
  "科学研究和技术服务业",
  "租赁和商务服务业",
  "建筑业",
  "交通运输业",
  "住宿和餐饮业",
  "金融业",
  "教育",
  "卫生和社会工作",
  "文化、体育和娱乐业",
  "其他",
];

// 模拟数据
const mockEnterprises: Enterprise[] = [
  {
    id: "1",
    name: "松原市宇鑫化工有限公司",
    creditCode: "91220700MA1234AB5X",
    legalPerson: "张三",
    phone: "138****5678",
    registeredAddress: "吉林省松原市宁江区化工园区",
    businessAddress: "吉林省松原市宁江区化工园区A栋",
    industry: "制造业",
    入驻Date: "2023-03-15",
    status: "active",
    remarks: "",
  },
  {
    id: "2",
    name: "吉林省宏远贸易公司",
    creditCode: "91220100MA5678CD2Y",
    legalPerson: "李四",
    phone: "139****1234",
    registeredAddress: "吉林省长春市朝阳区人民大街100号",
    businessAddress: "吉林省长春市朝阳区人民大街100号",
    industry: "批发和零售业",
    入驻Date: "2022-08-20",
    status: "active",
    remarks: "",
  },
  {
    id: "3",
    name: "华信科技有限公司",
    creditCode: "91220100MA9012EF3Z",
    legalPerson: "王五",
    phone: "137****9876",
    registeredAddress: "吉林省长春市高新区硅谷大街888号",
    businessAddress: "基地B座301室",
    industry: "信息技术服务业",
    入驻Date: "2024-01-10",
    status: "active",
    remarks: "高新技术企业",
  },
  {
    id: "4",
    name: "新兴建材有限公司",
    creditCode: "91220100MA3456GH4W",
    legalPerson: "赵六",
    phone: "136****5432",
    registeredAddress: "吉林省长春市宽城区建材市场",
    businessAddress: "基地C座102室",
    industry: "建筑业",
    入驻Date: "2021-05-08",
    status: "inactive",
    remarks: "2024年3月迁出",
  },
  {
    id: "5",
    name: "长春市盛世餐饮公司",
    creditCode: "91220100MA7890IJ5V",
    legalPerson: "孙七",
    phone: "135****8765",
    registeredAddress: "吉林省长春市南关区人民广场",
    businessAddress: "",
    industry: "住宿和餐饮业",
    入驻Date: "2024-06-01",
    status: "pending",
    remarks: "预计6月入驻",
  },
];

export default function TenantsPage() {
  const [enterprises, setEnterprises] = useState<Enterprise[]>(mockEnterprises);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEnterprise, setEditingEnterprise] = useState<Enterprise | null>(null);
  const [viewingEnterprise, setViewingEnterprise] = useState<Enterprise | null>(null);
  
  // 表单数据
  const [formData, setFormData] = useState<Partial<Enterprise>>({
    name: "",
    creditCode: "",
    legalPerson: "",
    phone: "",
    registeredAddress: "",
    businessAddress: "",
    industry: "",
    入驻Date: new Date().toISOString().split("T")[0],
    status: "pending",
    remarks: "",
  });

  // 过滤企业列表
  const filteredEnterprises = enterprises.filter(e => {
    const matchSearch = !searchKeyword || 
      e.name.includes(searchKeyword) || 
      e.creditCode.includes(searchKeyword) ||
      e.legalPerson.includes(searchKeyword);
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    const matchIndustry = industryFilter === "all" || e.industry === industryFilter;
    return matchSearch && matchStatus && matchIndustry;
  });

  // 统计数据
  const stats = {
    total: enterprises.length,
    active: enterprises.filter(e => e.status === "active").length,
    inactive: enterprises.filter(e => e.status === "inactive").length,
    pending: enterprises.filter(e => e.status === "pending").length,
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: "",
      creditCode: "",
      legalPerson: "",
      phone: "",
      registeredAddress: "",
      businessAddress: "",
      industry: "",
      入驻Date: new Date().toISOString().split("T")[0],
      status: "pending",
      remarks: "",
    });
  };

  // 打开新增对话框
  const handleAdd = () => {
    resetForm();
    setEditingEnterprise(null);
    setShowAddDialog(true);
  };

  // 打开编辑对话框
  const handleEdit = (enterprise: Enterprise) => {
    setFormData(enterprise);
    setEditingEnterprise(enterprise);
    setShowAddDialog(true);
  };

  // 保存企业信息
  const handleSave = () => {
    if (!formData.name || !formData.creditCode) {
      return;
    }

    if (editingEnterprise) {
      // 编辑模式
      setEnterprises(prev => prev.map(e => 
        e.id === editingEnterprise.id 
          ? { ...e, ...formData, id: editingEnterprise.id } as Enterprise
          : e
      ));
    } else {
      // 新增模式
      const newEnterprise: Enterprise = {
        id: Date.now().toString(),
        name: formData.name || "",
        creditCode: formData.creditCode || "",
        legalPerson: formData.legalPerson || "",
        phone: formData.phone || "",
        registeredAddress: formData.registeredAddress || "",
        businessAddress: formData.businessAddress || "",
        industry: formData.industry || "",
        入驻Date: formData.入驻Date || new Date().toISOString().split("T")[0],
        status: (formData.status as EnterpriseStatus) || "pending",
        remarks: formData.remarks || "",
      };
      setEnterprises(prev => [newEnterprise, ...prev]);
    }

    setShowAddDialog(false);
    resetForm();
  };

  // 删除企业
  const handleDelete = (id: string) => {
    if (confirm("确定要删除该企业信息吗？")) {
      setEnterprises(prev => prev.filter(e => e.id !== id));
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white">
      {/* 页面标题 */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">入驻企业管理</h1>
              <p className="text-sm text-slate-500">登记和管理入驻企业的基本信息</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-slate-600">
              <Download className="h-4 w-4 mr-1.5" />
              导出
            </Button>
            <Button variant="outline" size="sm" className="text-slate-600">
              <Upload className="h-4 w-4 mr-1.5" />
              导入
            </Button>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={handleAdd}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              新增企业
            </Button>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">企业总数</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-slate-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">入驻中</p>
              <p className="text-2xl font-semibold text-emerald-600 mt-1">{stats.active}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">待入驻</p>
              <p className="text-2xl font-semibold text-amber-600 mt-1">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">已迁出</p>
              <p className="text-2xl font-semibold text-gray-500 mt-1">{stats.inactive}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="px-6 py-3 flex items-center gap-3 border-b border-slate-100 bg-white">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索企业名称、信用代码、法人..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-9 text-sm">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">入驻中</SelectItem>
            <SelectItem value="pending">待入驻</SelectItem>
            <SelectItem value="inactive">已迁出</SelectItem>
          </SelectContent>
        </Select>

        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue placeholder="行业" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部行业</SelectItem>
            {INDUSTRIES.map(industry => (
              <SelectItem key={industry} value={industry}>{industry}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="ghost" size="sm" className="text-slate-500">
          <Filter className="h-4 w-4 mr-1.5" />
          更多筛选
        </Button>
      </div>

      {/* 企业列表 */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">企业名称</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">统一社会信用代码</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">法定代表人</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">联系电话</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">所属行业</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">入驻日期</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">状态</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnterprises.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p>暂无企业数据</p>
                  </td>
                </tr>
              ) : (
                filteredEnterprises.map((enterprise) => (
                  <tr 
                    key={enterprise.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-amber-600" />
                        </div>
                        <span className="font-medium text-slate-900">{enterprise.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 font-mono">
                      {enterprise.creditCode}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {enterprise.legalPerson}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {enterprise.phone}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {enterprise.industry}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {enterprise.入驻Date}
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant="outline"
                        className={cn("text-xs font-medium", statusConfig[enterprise.status].className)}
                      >
                        {statusConfig[enterprise.status].label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                          onClick={() => setViewingEnterprise(enterprise)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-slate-400 hover:text-amber-600"
                          onClick={() => handleEdit(enterprise)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                          onClick={() => handleDelete(enterprise.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新增/编辑对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingEnterprise ? "编辑企业信息" : "新增入驻企业"}</DialogTitle>
            <DialogDescription>
              {editingEnterprise ? "修改企业的基本信息" : "登记新入驻企业的基本信息"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                企业名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入企业名称"
                className="h-9"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                统一社会信用代码 <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.creditCode || ""}
                onChange={(e) => setFormData({ ...formData, creditCode: e.target.value })}
                placeholder="请输入18位信用代码"
                className="h-9 font-mono"
                maxLength={18}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">法定代表人</Label>
              <Input
                value={formData.legalPerson || ""}
                onChange={(e) => setFormData({ ...formData, legalPerson: e.target.value })}
                placeholder="请输入法定代表人姓名"
                className="h-9"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">联系电话</Label>
              <Input
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="请输入联系电话"
                className="h-9"
              />
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label className="text-sm font-medium">注册地址</Label>
              <Input
                value={formData.registeredAddress || ""}
                onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
                placeholder="请输入注册地址"
              />
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label className="text-sm font-medium">经营地址（入驻地址）</Label>
              <Input
                value={formData.businessAddress || ""}
                onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                placeholder="请输入实际经营地址（如与注册地址相同可留空）"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">所属行业</Label>
              <Select 
                value={formData.industry || ""} 
                onValueChange={(value) => setFormData({ ...formData, industry: value })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="请选择行业" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map(industry => (
                    <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">入驻日期</Label>
              <Input
                type="date"
                value={formData.入驻Date || ""}
                onChange={(e) => setFormData({ ...formData, 入驻Date: e.target.value })}
                className="h-9"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">企业状态</Label>
              <Select 
                value={formData.status || "pending"} 
                onValueChange={(value) => setFormData({ ...formData, status: value as EnterpriseStatus })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="请选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">待入驻</SelectItem>
                  <SelectItem value="active">入驻中</SelectItem>
                  <SelectItem value="inactive">已迁出</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">备注</Label>
              <Input
                value={formData.remarks || ""}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="备注信息"
                className="h-9"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button 
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={handleSave}
            >
              {editingEnterprise ? "保存修改" : "确认添加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看详情对话框 */}
      <Dialog open={!!viewingEnterprise} onOpenChange={() => setViewingEnterprise(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>企业详情</DialogTitle>
          </DialogHeader>
          
          {viewingEnterprise && (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{viewingEnterprise.name}</h3>
                  <p className="text-sm text-slate-500 font-mono">{viewingEnterprise.creditCode}</p>
                </div>
                <Badge 
                  variant="outline"
                  className={cn("ml-auto text-sm", statusConfig[viewingEnterprise.status].className)}
                >
                  {statusConfig[viewingEnterprise.status].label}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">法定代表人</p>
                  <p className="font-medium text-slate-900 mt-1">{viewingEnterprise.legalPerson || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500">联系电话</p>
                  <p className="font-medium text-slate-900 mt-1">{viewingEnterprise.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500">所属行业</p>
                  <p className="font-medium text-slate-900 mt-1">{viewingEnterprise.industry || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500">入驻日期</p>
                  <p className="font-medium text-slate-900 mt-1">{viewingEnterprise.入驻Date || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500">注册地址</p>
                  <p className="font-medium text-slate-900 mt-1">{viewingEnterprise.registeredAddress || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500">经营地址</p>
                  <p className="font-medium text-slate-900 mt-1">{viewingEnterprise.businessAddress || "—"}</p>
                </div>
                {viewingEnterprise.remarks && (
                  <div className="col-span-2">
                    <p className="text-slate-500">备注</p>
                    <p className="font-medium text-slate-900 mt-1">{viewingEnterprise.remarks}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingEnterprise(null)}>
              关闭
            </Button>
            <Button 
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={() => {
                if (viewingEnterprise) {
                  setViewingEnterprise(null);
                  handleEdit(viewingEnterprise);
                }
              }}
            >
              编辑信息
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
