"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  FileText,
  Upload,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Store,
  Home,
  Hash,
  MapPin,
  MapPinned,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { provinces, Province, City } from "@/lib/cities";

// 步骤定义
const STEPS = [
  { id: 0, title: "选择基地", icon: Building2 },
  { id: 1, title: "选择类型", icon: Store },
  { id: 2, title: "选择工位", icon: Hash },
  { id: 3, title: "上传证明", icon: Upload },
  { id: 4, title: "确认信息", icon: CheckCircle2 },
];

// 企业类型
type EnterpriseType = "tenant" | "non_tenant";

// 基地信息
interface Base {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  city_code: string | null;
}

// 可用工位号信息
interface AvailableRegNumber {
  id: string;
  code: string;
  manual_code: string | null;
  assigned_enterprise_name: string | null;
  spaceId: string;
  spaceName: string;
  meterName: string;
  baseName: string;
  baseAddress: string | null;
  fullAddress: string | null;
  property_owner: string | null;
  management_company: string | null;
}

// API 返回数据转换为前端格式
function mapRegNumberFromAPI(apiData: any): AvailableRegNumber {
  return {
    id: apiData.id,
    code: apiData.code,
    manual_code: apiData.manualCode || apiData.manual_code,
    assigned_enterprise_name: apiData.assignedEnterpriseName || apiData.assigned_enterprise_name,
    spaceId: apiData.spaceId,
    spaceName: apiData.spaceName,
    meterName: apiData.meterName,
    baseName: apiData.baseName,
    baseAddress: apiData.baseAddress,
    fullAddress: apiData.fullAddress,
    property_owner: apiData.propertyOwner || apiData.property_owner,
    management_company: apiData.managementCompany || apiData.management_company,
  };
}

export default function NewTenantPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 步骤0：选择基地
  const [bases, setBases] = useState<Base[]>([]);
  const [selectedBaseId, setSelectedBaseId] = useState<string>("");
  
  // 城市筛选
  const [filterProvince, setFilterProvince] = useState<Province | null>(null);
  const [filterCity, setFilterCity] = useState<City | null>(null);
  const [showCityFilter, setShowCityFilter] = useState(false);
  
  // 步骤1：选择类型
  const [enterpriseType, setEnterpriseType] = useState<EnterpriseType | null>(null);
  const [enterpriseCode, setEnterpriseCode] = useState<string>("");
  
  // 步骤2：选择工位号
  const [availableRegNumbers, setAvailableRegNumbers] = useState<AvailableRegNumber[]>([]);
  const [selectedRegNumber, setSelectedRegNumber] = useState<AvailableRegNumber | null>(null);
  const [selectedMeter, setSelectedMeter] = useState<string | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  
  // 步骤3：上传证明
  const [proofFiles, setProofFiles] = useState<{ name: string; url: string; size: number }[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // 步骤4：确认信息
  const [enterpriseName, setEnterpriseName] = useState("");
  const [remarks, setRemarks] = useState("");
  
  // 完成后的企业ID
  const [createdEnterpriseId, setCreatedEnterpriseId] = useState<string | null>(null);

  // 加载基地列表
  useEffect(() => {
    fetchBases();
  }, []);

  const fetchBases = async () => {
    try {
      const res = await fetch("/api/bases");
      const result = await res.json();
      if (result.success) {
        setBases(result.data || []);
      }
    } catch (error) {
      console.error("获取基地列表失败:", error);
    }
  };

  // 选择基地后，加载该基地的可用工位号
  useEffect(() => {
    if (selectedBaseId && currentStep >= 2) {
      fetchAvailableRegNumbers();
    }
  }, [selectedBaseId, currentStep]);

  // 选择类型后，生成企业编号
  useEffect(() => {
    if (enterpriseType && currentStep === 1) {
      generateEnterpriseCode(enterpriseType);
    }
  }, [enterpriseType, currentStep]);

  // 选择工位号后，自动填充企业名称
  useEffect(() => {
    if (selectedRegNumber?.assigned_enterprise_name) {
      setEnterpriseName(selectedRegNumber.assigned_enterprise_name);
    }
  }, [selectedRegNumber]);

  // 获取可用工位号列表
  const fetchAvailableRegNumbers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/registration-numbers/available?base_id=${selectedBaseId}`);
      const result = await res.json();
      if (result.success) {
        // 转换 API 返回的字段名
        const mappedData = (result.data || []).map(mapRegNumberFromAPI);
        setAvailableRegNumbers(mappedData);
      }
    } catch (error) {
      console.error("获取可用工位号失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 生成企业编号
  const generateEnterpriseCode = async (type: EnterpriseType) => {
    try {
      const res = await fetch("/api/enterprises/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const result = await res.json();
      if (result.success) {
        setEnterpriseCode(result.data.code);
      }
    } catch (error) {
      console.error("生成企业编号失败:", error);
      const prefix = type === "tenant" ? "RQ" : "NQ";
      const timestamp = Date.now().toString().slice(-8);
      setEnterpriseCode(`${prefix}-${timestamp}`);
    }
  };

  // 上传文件
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "enterprise-proofs");
      
      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (result.success || result.url) {
        const url = result.data?.url || result.url;
        setProofFiles(prev => [...prev, { 
          name: file.name, 
          url: url,
          size: file.size 
        }]);
        toast({ title: "上传成功" });
      } else {
        throw new Error(result.error || result.message || "上传失败");
      }
    } catch (error: any) {
      console.error("上传失败:", error);
      toast({ title: "上传失败", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // 删除文件
  const handleRemoveFile = (index: number) => {
    setProofFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // 步骤验证
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return selectedBaseId !== "";
      case 1:
        return enterpriseType !== null;
      case 2:
        // 入驻企业必须选择工位号，非入驻企业跳过此步骤
        if (enterpriseType === "non_tenant") return true;
        return selectedRegNumber !== null;
      case 3:
        // 入驻企业必须上传证明，非入驻企业跳过此步骤
        if (enterpriseType === "non_tenant") return true;
        return proofFiles.length > 0;
      case 4:
        return enterpriseName.trim() !== "";
      default:
        return true;
    }
  };

  // 下一步
  const nextStep = () => {
    if (!validateStep(currentStep)) {
      toast({
        title: "请完善信息",
        description: "请完成当前步骤的必填信息",
        variant: "destructive",
      });
      return;
    }
    
    // 非入驻企业跳过工位选择和上传证明步骤
    if (currentStep === 1 && enterpriseType === "non_tenant") {
      setCurrentStep(4); // 直接跳到确认信息
    } else if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  // 上一步
  const prevStep = () => {
    // 非入驻企业跳过工位选择和上传证明步骤
    if (currentStep === 4 && enterpriseType === "non_tenant") {
      setCurrentStep(1);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 提交企业
  const submitEnterprise = async () => {
    if (!validateStep(currentStep)) {
      toast({
        title: "请完善信息",
        description: "请填写企业名称",
        variant: "destructive",
      });
      return;
    }
    
    // 入驻企业必须选择工位号
    if (enterpriseType === "tenant" && !selectedRegNumber) {
      toast({
        title: "请完善信息",
        description: "入驻企业必须选择工位号",
        variant: "destructive",
      });
      setCurrentStep(2); // 跳转到工位选择步骤
      return;
    }
    
    setSubmitting(true);
    try {
      const selectedBase = bases.find(b => b.id === selectedBaseId);
      
      // 构建请求数据
      const requestData: any = {
        name: enterpriseName,
        enterprise_code: enterpriseCode,
        type: enterpriseType,
        base_id: selectedBaseId,
        status: enterpriseType === "tenant" ? "pending_registration" : "pending_change",
        business_scope: remarks || null,
        registered_address: selectedRegNumber?.fullAddress || null,
        business_address: selectedRegNumber?.fullAddress || null,
      };

      // 入驻企业需要上传证明和绑定工位
      if (enterpriseType === "tenant") {
        requestData.proof_documents = proofFiles;
        if (selectedRegNumber) {
          requestData.space_id = selectedRegNumber.spaceId;
          requestData.registration_number_id = selectedRegNumber.id;
          requestData.registration_number = selectedRegNumber.manual_code || selectedRegNumber.code;
        }
      }

      const res = await fetch("/api/enterprises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || "创建企业失败");
      }

      setCreatedEnterpriseId(result.data?.id);

      toast({
        title: "创建成功",
        description: `企业 ${enterpriseName} 已成功创建`,
      });
    } catch (error: any) {
      console.error("提交失败:", error);
      toast({
        title: "创建失败",
        description: error.message || "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 渲染步骤指示器
  const renderStepIndicator = () => {
    // 非入驻企业跳过工位选择和上传证明步骤
    const displaySteps = enterpriseType === "non_tenant"
      ? STEPS.filter(s => s.id !== 2 && s.id !== 3)
      : STEPS;
    
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {displaySteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep > step.id
                      ? "bg-green-500 text-white"
                      : currentStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className="mt-2 text-sm font-medium">{step.title}</span>
              </div>
              {index < displaySteps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 ${
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 步骤0：选择基地
  const renderStep0 = () => {
    // 从地址中解析城市名
    const getCityFromAddress = (address: string | null): string => {
      if (!address) return "";
      // 地址格式通常是: 街道, 区, 市, 省, 国家
      const parts = address.split(",").map(p => p.trim());
      // 查找市级行政区
      for (const part of parts) {
        if (part.includes("市")) {
          return part.replace("市", "");
        }
      }
      return "";
    };
    
    // 从地址中解析省份名
    const getProvinceFromAddress = (address: string | null): string => {
      if (!address) return "";
      const parts = address.split(",").map(p => p.trim());
      for (const part of parts) {
        if (part.includes("省") || part.includes("自治区")) {
          return part.replace(/省|自治区/g, "");
        }
      }
      return "";
    };
    
    // 根据省份/城市筛选基地
    const filteredBases = bases.filter((base) => {
      // 优先使用 city_code，如果没有则从 address 解析
      const baseCityCode = base.city_code;
      const baseProvince = base.city_code 
        ? null // 如果有 city_code，不需要从地址解析
        : getProvinceFromAddress(base.address);
      const baseCity = base.city 
        || (base.city_code ? null : getCityFromAddress(base.address));
      
      // 如果选择了城市
      if (filterCity) {
        // 优先按 city_code 精确匹配
        if (baseCityCode) {
          return baseCityCode === filterCity.code;
        }
        // 否则按城市名匹配
        return baseCity === filterCity.name.replace("市", "");
      }
      
      // 如果只选择了省份
      if (filterProvince) {
        // 优先按 city_code 前缀匹配
        if (baseCityCode) {
          const provincePrefix = filterProvince.code.substring(0, 2);
          return baseCityCode.startsWith(provincePrefix);
        }
        // 否则按省份名匹配
        const provinceName = filterProvince.name.replace(/省|自治区/g, "");
        return baseProvince === provinceName;
      }
      
      return true;
    });
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>选择合作基地</CardTitle>
          <CardDescription>请选择企业入驻的合作基地</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 城市筛选 */}
          <div className="flex items-center gap-3 pb-4 border-b">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-2 flex-1">
              {/* 省份选择 */}
              <select
                value={filterProvince?.code || ""}
                onChange={(e) => {
                  const province = provinces.find(p => p.code === e.target.value);
                  setFilterProvince(province || null);
                  setFilterCity(null);
                }}
                className="h-9 px-3 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              >
                <option value="">全部省份</option>
                {provinces.map((province) => (
                  <option key={province.code} value={province.code}>
                    {province.name}
                  </option>
                ))}
              </select>
              
              {/* 城市选择 */}
              <select
                value={filterCity?.code || ""}
                onChange={(e) => {
                  const city = filterProvince?.cities.find(c => c.code === e.target.value);
                  setFilterCity(city || null);
                }}
                disabled={!filterProvince}
                className="h-9 px-3 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background disabled:bg-muted disabled:text-muted-foreground"
              >
                <option value="">全部城市</option>
                {filterProvince?.cities.map((city) => (
                  <option key={city.code} value={city.code}>
                    {city.name}
                  </option>
                ))}
              </select>
              
              {/* 清除筛选 */}
              {(filterProvince || filterCity) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterProvince(null);
                    setFilterCity(null);
                  }}
                  className="text-muted-foreground"
                >
                  清除
                </Button>
              )}
            </div>
          </div>

          {/* 基地列表 */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>共 {filteredBases.length} 个基地</span>
            {(filterProvince || filterCity) && (
              <span className="text-xs">
                已筛选：{filterProvince?.name}{filterCity ? ` / ${filterCity.name}` : ''}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBases.map((base) => (
              <Card
                key={base.id}
                className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                  selectedBaseId === base.id ? "border-primary ring-2 ring-primary/20" : ""
                }`}
                onClick={() => setSelectedBaseId(base.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{base.name}</h3>
                        {base.city && (
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <MapPinned className="w-3 h-3" />
                            {base.city}
                          </Badge>
                        )}
                      </div>
                      {base.address && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">{base.address}</p>
                      )}
                    </div>
                    {selectedBaseId === base.id && (
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredBases.length === 0 && bases.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              该城市暂无基地，请选择其他城市
            </div>
          )}
          
          {bases.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              暂无可用基地，请先添加基地
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // 步骤1：选择类型
  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle>选择企业类型</CardTitle>
        <CardDescription>请选择要创建的企业类型</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {/* 入驻企业 */}
          <Card 
            className={`cursor-pointer transition-all hover:border-primary hover:shadow-lg ${
              enterpriseType === "tenant" ? "border-primary ring-2 ring-primary/20" : ""
            }`}
            onClick={() => setEnterpriseType("tenant")}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Home className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">入驻企业</h3>
              <p className="text-sm text-muted-foreground mb-4">
                在园区内分配工位的企业
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• 分配工位号</p>
                <p>• 上传产权证明</p>
                <p>• 待工商注册</p>
              </div>
            </CardContent>
          </Card>

          {/* 非入驻企业 */}
          <Card 
            className={`cursor-pointer transition-all hover:border-primary hover:shadow-lg ${
              enterpriseType === "non_tenant" ? "border-primary ring-2 ring-primary/20" : ""
            }`}
            onClick={() => setEnterpriseType("non_tenant")}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Store className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">非入驻企业</h3>
              <p className="text-sm text-muted-foreground mb-4">
                不在园区入驻，仅使用园区服务
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• 无需分配工位</p>
                <p>• 上传产权证明</p>
                <p>• 待工商变更</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 企业编号预览 */}
        {enterpriseCode && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              系统已分配企业编号：<strong className="text-primary">{enterpriseCode}</strong>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  // 步骤2：选择工位号（入驻企业）
  const renderStep2 = () => {
    // 提取唯一的物业列表
    const meters = [...new Set(availableRegNumbers.map(r => r.meterName))];
    
    // 根据物业筛选后的空间列表
    const spaces = [...new Set(
      availableRegNumbers
        .filter(r => !selectedMeter || r.meterName === selectedMeter)
        .map(r => r.spaceName)
    )];
    
    // 筛选后的工位号列表
    const filteredRegNumbers = availableRegNumbers.filter(r => {
      if (selectedMeter && r.meterName !== selectedMeter) return false;
      if (selectedSpace && r.spaceName !== selectedSpace) return false;
      return true;
    });
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>选择工位号</CardTitle>
          <CardDescription>请从可用工位号中选择一个</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 筛选器 */}
          {availableRegNumbers.length > 0 && (
            <div className="flex items-center gap-3 pb-4 border-b">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                {/* 物业筛选 */}
                <select
                  value={selectedMeter || ""}
                  onChange={(e) => {
                    setSelectedMeter(e.target.value || null);
                    setSelectedSpace(null); // 切换物业时清空空间选择
                  }}
                  className="h-9 px-3 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                >
                  <option value="">全部物业</option>
                  {meters.map((meter) => (
                    <option key={meter} value={meter}>
                      {meter}
                    </option>
                  ))}
                </select>
                
                {/* 空间筛选 */}
                <select
                  value={selectedSpace || ""}
                  onChange={(e) => setSelectedSpace(e.target.value || null)}
                  className="h-9 px-3 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                >
                  <option value="">全部空间</option>
                  {spaces.map((space) => (
                    <option key={space} value={space}>
                      {space}
                    </option>
                  ))}
                </select>
                
                {/* 清除筛选 */}
                {(selectedMeter || selectedSpace) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedMeter(null);
                      setSelectedSpace(null);
                    }}
                    className="text-muted-foreground"
                  >
                    清除
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* 结果统计 */}
          {availableRegNumbers.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>共 {filteredRegNumbers.length} 个可用工位号</span>
              {(selectedMeter || selectedSpace) && (
                <span className="text-xs">
                  已筛选：{selectedMeter || '全部物业'}{selectedSpace ? ` / ${selectedSpace}` : ''}
                </span>
              )}
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : availableRegNumbers.length === 0 ? (
            <div className="text-center py-8">
              <Hash className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">该基地暂无可用工位号</p>
              <Button variant="outline" onClick={() => router.push("/dashboard/base/addresses")}>
                前往地址管理生成工位号
              </Button>
            </div>
          ) : filteredRegNumbers.length === 0 ? (
            <div className="text-center py-8">
              <Hash className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">当前筛选条件下无可用工位号</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRegNumbers.map((reg) => (
                <Card
                  key={reg.id}
                  className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                    selectedRegNumber?.id === reg.id ? "border-primary ring-2 ring-primary/20" : ""
                  }`}
                  onClick={() => setSelectedRegNumber(reg)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold text-lg">
                            {reg.manual_code || reg.code}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground space-y-1">
                          <p className="flex items-center gap-1">
                            <Home className="w-3 h-3" />
                            {reg.meterName} - {reg.spaceName}
                          </p>
                          {reg.fullAddress && (
                            <p className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {reg.fullAddress}
                            </p>
                          )}
                          {reg.assigned_enterprise_name && (
                            <p className="text-primary">预分配：{reg.assigned_enterprise_name}</p>
                          )}
                        </div>
                      </div>
                      {selectedRegNumber?.id === reg.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // 步骤3：上传证明
  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle>上传房屋产权证明</CardTitle>
        <CardDescription>请上传已盖章的房屋产权证明文件，支持多个文件</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 显示工位号信息 */}
        {selectedRegNumber && (
          <Alert>
            <Hash className="h-4 w-4" />
            <AlertDescription>
              已选择工位号：<strong>{selectedRegNumber.manual_code || selectedRegNumber.code}</strong>
              {selectedRegNumber.assigned_enterprise_name && (
                <span className="ml-2">预分配企业：{selectedRegNumber.assigned_enterprise_name}</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* 文件列表 */}
        {proofFiles.length > 0 && (
          <div className="space-y-2">
            <Label className="text-muted-foreground">已上传文件 ({proofFiles.length})</Label>
            <div className="border rounded-lg divide-y">
              {proofFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    删除
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 上传区域 */}
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <div className="space-y-4">
            <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">点击选择文件上传</p>
            <Input
              type="file"
              accept="image/*,.pdf"
              className="max-w-xs mx-auto"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              disabled={uploading}
            />
            {uploading && (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">上传中...</span>
              </div>
            )}
          </div>
        </div>

        {/* 提示 */}
        <div className="text-sm text-muted-foreground">
          <p>支持上传图片或PDF文件，文件大小不超过10MB，可上传多个文件</p>
        </div>
      </CardContent>
    </Card>
  );

  // 步骤4：确认信息
  const renderStep4 = () => (
    <Card>
      <CardHeader>
        <CardTitle>确认企业信息</CardTitle>
        <CardDescription>请确认企业信息并完成创建</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 信息汇总 */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">企业编号</Label>
              <p className="font-semibold">{enterpriseCode}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">企业类型</Label>
              <p className="font-semibold">
                {enterpriseType === "tenant" ? "入驻企业" : "非入驻企业"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">所属基地</Label>
              <p className="font-semibold">{bases.find(b => b.id === selectedBaseId)?.name}</p>
            </div>
            {selectedRegNumber && (
              <div>
                <Label className="text-muted-foreground">工位号</Label>
                <p className="font-semibold">{selectedRegNumber.manual_code || selectedRegNumber.code}</p>
              </div>
            )}
          </div>
          
          {/* 企业名称 */}
          <div className="space-y-2">
            <Label>企业名称 <span className="text-red-500">*</span></Label>
            <Input
              value={enterpriseName}
              onChange={(e) => setEnterpriseName(e.target.value)}
              placeholder="请输入企业名称"
            />
            {selectedRegNumber?.assigned_enterprise_name && (
              <p className="text-xs text-muted-foreground">
                已从预分配信息带入：{selectedRegNumber.assigned_enterprise_name}
              </p>
            )}
          </div>

          {/* 地址信息 */}
          {selectedRegNumber && (
            <div>
              <Label className="text-muted-foreground">注册地址</Label>
              <p className="text-sm">{selectedRegNumber.fullAddress}</p>
            </div>
          )}

          {/* 备注 */}
          <div className="space-y-2">
            <Label>备注</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="可选，填写备注信息"
              rows={3}
            />
          </div>

          {/* 已上传文件 */}
          {proofFiles.length > 0 && (
            <div>
              <Label className="text-muted-foreground">产权证明文件 ({proofFiles.length})</Label>
              <div className="mt-2 space-y-1">
                {proofFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span>{file.name}</span>
                    <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 创建后状态提示 */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            创建后企业将进入
            <strong className="text-primary">
              {enterpriseType === "tenant" ? "待工商注册" : "待工商变更"}
            </strong>
            状态，可在企业管理中继续完善信息
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );

  // 完成页面
  const renderComplete = () => (
    <Card>
      <CardContent className="py-12 text-center">
        <CheckCircle2 className="w-16 h-16 mx-auto text-primary mb-4" />
        <h2 className="text-2xl font-bold mb-2">创建成功</h2>
        <p className="text-muted-foreground mb-6">
          企业 <strong>{enterpriseName}</strong> 已成功创建
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => router.push("/dashboard/base/tenants")}>
            返回列表
          </Button>
          {createdEnterpriseId && (
            <Button onClick={() => router.push(`/dashboard/base/tenants/${createdEnterpriseId}`)}>
              查看详情
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // 渲染当前步骤内容
  const renderCurrentStep = () => {
    if (createdEnterpriseId) {
      return renderComplete();
    }
    
    switch (currentStep) {
      case 0:
        return renderStep0();
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-6">
      {/* 页头 */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/base/tenants">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">新建企业</h1>
          <p className="text-muted-foreground">创建新的企业信息</p>
        </div>
      </div>

      {/* 步骤指示器 */}
      {!createdEnterpriseId && renderStepIndicator()}

      {/* 步骤内容 */}
      {renderCurrentStep()}

      {/* 底部按钮 */}
      {!createdEnterpriseId && (
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            上一步
          </Button>
          
          {currentStep < 4 ? (
            <Button onClick={nextStep}>
              下一步
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={submitEnterprise} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  完成创建
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
