"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Save,
  Check,
  Building2,
  FileText,
  PenTool,
  Wallet,
  CheckCircle2,
  ChevronRight,
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
import { useTabs } from "@/app/dashboard/tabs-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// 步骤定义
const STEPS = [
  { id: 1, name: "分配房间", icon: Building2, description: "选择入驻基地和房间号" },
  { id: 2, name: "工商办理", icon: FileText, description: "工商注册或工商变更" },
  { id: 3, name: "签订合同", icon: PenTool, description: "签订入驻合同" },
  { id: 4, name: "缴纳费用", icon: Wallet, description: "缴纳押金与费用" },
  { id: 5, name: "完成入驻", icon: CheckCircle2, description: "确认完成正式入驻" },
];

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

// 基地接口
interface Base {
  id: string;
  name: string;
}

// 房间接口
interface Room {
  id: string;
  roomNumber: string;
  status: string;
}

// 表单数据接口
interface FormData {
  // 步骤1：分配房间
  baseId: string;
  baseName: string;
  roomId: string;
  roomNumber: string;
  
  // 步骤2：工商办理
  businessType: "register" | "change"; // 注册或变更
  enterpriseName: string;
  creditCode: string;
  legalPerson: string;
  phone: string;
  industry: string;
  registeredAddress: string;
  businessAddress: string;
  
  // 步骤3：签订合同
  contractNo: string;
  contractStartDate: string;
  contractEndDate: string;
  contractAmount: string;
  
  // 步骤4：缴纳费用
  deposit: string;
  rent: string;
  serviceFee: string;
  otherFee: string;
  totalFee: string;
  paymentStatus: "unpaid" | "partial" | "paid";
  paymentDate: string;
  
  // 备注
  remarks: string;
}

export default function EnterpriseCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabsContext = useTabs();

  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loadingBases, setLoadingBases] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  
  const [bases, setBases] = useState<Base[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [createdEnterpriseId, setCreatedEnterpriseId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    baseId: "",
    baseName: "",
    roomId: "",
    roomNumber: "",
    businessType: "register",
    enterpriseName: "",
    creditCode: "",
    legalPerson: "",
    phone: "",
    industry: "",
    registeredAddress: "",
    businessAddress: "",
    contractNo: "",
    contractStartDate: new Date().toISOString().split("T")[0],
    contractEndDate: "",
    contractAmount: "",
    deposit: "",
    rent: "",
    serviceFee: "",
    otherFee: "",
    totalFee: "",
    paymentStatus: "unpaid",
    paymentDate: "",
    remarks: "",
  });

  // 从入驻申请获取数据预填
  const applicationId = searchParams.get("applicationId");

  useEffect(() => {
    fetchBases();
    if (applicationId) {
      fetchApplicationData(applicationId);
    }
  }, [applicationId]);

  // 加载基地列表
  const fetchBases = async () => {
    try {
      setLoadingBases(true);
      const response = await fetch("/api/bases");
      const result = await response.json();
      if (result.success) {
        setBases(result.data || []);
      }
    } catch (err) {
      console.error("获取基地列表失败:", err);
    } finally {
      setLoadingBases(false);
    }
  };

  // 加载房间列表
  const fetchRooms = async (baseId: string) => {
    try {
      setLoadingRooms(true);
      const response = await fetch(`/api/bases/${baseId}`);
      const result = await response.json();
      if (result.success && result.data.meters) {
        // 展开所有房间
        const allRooms: Room[] = [];
        result.data.meters.forEach((meter: any) => {
          meter.spaces?.forEach((space: any) => {
            allRooms.push({
              id: space.id,
              roomNumber: space.room_number || space.name,
              status: space.status || "available",
            });
          });
        });
        setRooms(allRooms);
      }
    } catch (err) {
      console.error("获取房间列表失败:", err);
    } finally {
      setLoadingRooms(false);
    }
  };

  // 从申请获取数据
  const fetchApplicationData = async (id: string) => {
    try {
      const response = await fetch(`/api/applications/${id}`);
      const result = await response.json();
      if (result.success && result.data) {
        const app = result.data;
        const legalPerson = app.personnel?.find(
          (p: any) => p.roles?.includes("legal_person")
        );
        setFormData((prev) => ({
          ...prev,
          enterpriseName: app.enterpriseName || prev.enterpriseName,
          legalPerson: legalPerson?.name || prev.legalPerson,
          phone: legalPerson?.phone || prev.phone,
          businessAddress: app.businessAddress || prev.businessAddress,
        }));
      }
    } catch (err) {
      console.error("获取申请数据失败:", err);
    }
  };

  // 更新表单字段
  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 基地选择变更
  const handleBaseChange = (baseId: string) => {
    const base = bases.find((b) => b.id === baseId);
    updateFormData("baseId", baseId);
    updateFormData("baseName", base?.name || "");
    updateFormData("roomId", "");
    updateFormData("roomNumber", "");
    fetchRooms(baseId);
  };

  // 房间选择变更
  const handleRoomChange = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    updateFormData("roomId", roomId);
    updateFormData("roomNumber", room?.roomNumber || "");
  };

  // 计算总费用
  useEffect(() => {
    const total = 
      parseFloat(formData.deposit || "0") +
      parseFloat(formData.rent || "0") +
      parseFloat(formData.serviceFee || "0") +
      parseFloat(formData.otherFee || "0");
    updateFormData("totalFee", total > 0 ? total.toString() : "");
  }, [formData.deposit, formData.rent, formData.serviceFee, formData.otherFee]);

  // 下一步
  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  // 上一步
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 保存企业
  const handleSave = async () => {
    if (!formData.enterpriseName) {
      toast.error("请填写企业名称");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/enterprises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.enterpriseName,
          credit_code: formData.creditCode,
          legal_person: formData.legalPerson,
          phone: formData.phone,
          industry: formData.industry,
          registered_address: formData.registeredAddress,
          business_address: formData.businessAddress,
          settled_date: new Date().toISOString().split("T")[0],
          type: "tenant",
          status: "active",
          remarks: formData.remarks,
        }),
      });
      const result = await response.json();
      
      if (result.success) {
        setCreatedEnterpriseId(result.data.id);
        toast.success("企业创建成功");
        handleNext();
      } else {
        toast.error(result.error || "保存失败");
      }
    } catch (err) {
      console.error("保存失败:", err);
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  // 完成入驻
  const handleComplete = () => {
    router.push("/dashboard/base/tenants");
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>选择基地 *</Label>
                <Select value={formData.baseId} onValueChange={handleBaseChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择基地" />
                  </SelectTrigger>
                  <SelectContent>
                    {bases.map((base) => (
                      <SelectItem key={base.id} value={base.id}>
                        {base.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>选择房间 *</Label>
                <Select 
                  value={formData.roomId} 
                  onValueChange={handleRoomChange}
                  disabled={!formData.baseId || loadingRooms}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingRooms ? "加载中..." : "请选择房间"} />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.roomNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {formData.baseId && formData.roomNumber && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">已分配地址</div>
                <div className="text-lg font-medium">
                  {formData.baseName} - {formData.roomNumber}
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>办理类型 *</Label>
              <Select 
                value={formData.businessType} 
                onValueChange={(v) => updateFormData("businessType", v)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="register">工商注册</SelectItem>
                  <SelectItem value="change">工商变更</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>企业名称 *</Label>
                <Input
                  value={formData.enterpriseName}
                  onChange={(e) => updateFormData("enterpriseName", e.target.value)}
                  placeholder="请输入企业名称"
                />
              </div>
              <div className="space-y-2">
                <Label>统一社会信用代码</Label>
                <Input
                  value={formData.creditCode}
                  onChange={(e) => updateFormData("creditCode", e.target.value)}
                  placeholder="请输入信用代码"
                />
              </div>
              <div className="space-y-2">
                <Label>法人代表 *</Label>
                <Input
                  value={formData.legalPerson}
                  onChange={(e) => updateFormData("legalPerson", e.target.value)}
                  placeholder="请输入法人姓名"
                />
              </div>
              <div className="space-y-2">
                <Label>联系电话</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  placeholder="请输入联系电话"
                />
              </div>
              <div className="space-y-2">
                <Label>所属行业</Label>
                <Select value={formData.industry} onValueChange={(v) => updateFormData("industry", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择行业" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>注册地址</Label>
                <Input
                  value={formData.registeredAddress}
                  onChange={(e) => updateFormData("registeredAddress", e.target.value)}
                  placeholder="请输入注册地址"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>合同编号</Label>
                <Input
                  value={formData.contractNo}
                  onChange={(e) => updateFormData("contractNo", e.target.value)}
                  placeholder="请输入合同编号"
                />
              </div>
              <div className="space-y-2">
                <Label>合同金额 (元)</Label>
                <Input
                  type="number"
                  value={formData.contractAmount}
                  onChange={(e) => updateFormData("contractAmount", e.target.value)}
                  placeholder="请输入合同金额"
                />
              </div>
              <div className="space-y-2">
                <Label>合同开始日期</Label>
                <Input
                  type="date"
                  value={formData.contractStartDate}
                  onChange={(e) => updateFormData("contractStartDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>合同结束日期</Label>
                <Input
                  type="date"
                  value={formData.contractEndDate}
                  onChange={(e) => updateFormData("contractEndDate", e.target.value)}
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-600">
                提示：合同签订后请上传扫描件至系统存档
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>押金 (元)</Label>
                <Input
                  type="number"
                  value={formData.deposit}
                  onChange={(e) => updateFormData("deposit", e.target.value)}
                  placeholder="请输入押金金额"
                />
              </div>
              <div className="space-y-2">
                <Label>租金 (元)</Label>
                <Input
                  type="number"
                  value={formData.rent}
                  onChange={(e) => updateFormData("rent", e.target.value)}
                  placeholder="请输入租金金额"
                />
              </div>
              <div className="space-y-2">
                <Label>服务费 (元)</Label>
                <Input
                  type="number"
                  value={formData.serviceFee}
                  onChange={(e) => updateFormData("serviceFee", e.target.value)}
                  placeholder="请输入服务费金额"
                />
              </div>
              <div className="space-y-2">
                <Label>其他费用 (元)</Label>
                <Input
                  type="number"
                  value={formData.otherFee}
                  onChange={(e) => updateFormData("otherFee", e.target.value)}
                  placeholder="请输入其他费用"
                />
              </div>
              <div className="space-y-2">
                <Label>缴费状态</Label>
                <Select 
                  value={formData.paymentStatus} 
                  onValueChange={(v) => updateFormData("paymentStatus", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">未缴费</SelectItem>
                    <SelectItem value="partial">部分缴费</SelectItem>
                    <SelectItem value="paid">已缴清</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>缴费日期</Label>
                <Input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => updateFormData("paymentDate", e.target.value)}
                />
              </div>
            </div>

            {formData.totalFee && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">费用合计</span>
                  <span className="text-xl font-semibold">¥ {parseFloat(formData.totalFee).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">入驻流程已完成</h2>
              <p className="text-muted-foreground text-center max-w-md">
                企业 {formData.enterpriseName} 已完成所有入驻流程，可正式开始运营。
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">企业名称</span>
                <span>{formData.enterpriseName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">入驻地址</span>
                <span>{formData.baseName} - {formData.roomNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">法人代表</span>
                <span>{formData.legalPerson}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">联系电话</span>
                <span>{formData.phone || "-"}</span>
              </div>
              {formData.totalFee && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">费用合计</span>
                  <span>¥ {parseFloat(formData.totalFee).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">新建企业</h1>
          <p className="text-sm text-muted-foreground mt-1">
            完成入驻流程后企业将正式入驻
          </p>
        </div>
      </div>

      {/* 步骤条 */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                      isActive && "border-primary bg-primary text-primary-foreground",
                      isCompleted && "border-emerald-500 bg-emerald-500 text-white",
                      !isActive && !isCompleted && "border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={cn(
                      "text-sm font-medium",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.name}
                    </div>
                    <div className="text-xs text-muted-foreground hidden lg:block">
                      {step.description}
                    </div>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-4",
                    currentStep > step.id ? "bg-emerald-500" : "bg-muted"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 步骤内容 */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">
          步骤 {currentStep}：{STEPS[currentStep - 1].name}
        </h2>
        {renderStepContent()}
      </div>

      {/* 底部操作按钮 */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 1}
        >
          上一步
        </Button>
        
        <div className="flex gap-2">
          {currentStep < STEPS.length - 1 && (
            <Button onClick={handleNext}>
              下一步
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          
          {currentStep === STEPS.length - 1 && (
            <Button 
              onClick={handleSave}
              disabled={saving || !formData.enterpriseName}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Save className="h-4 w-4 mr-2" />
              保存企业
            </Button>
          )}
          
          {currentStep === STEPS.length && (
            <Button onClick={handleComplete}>
              完成
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
