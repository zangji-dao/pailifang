"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hash, Home, MapPin, Check, Loader2, Filter } from "lucide-react";

interface AvailableRegNumber {
  id: string;
  code: string;
  manualCode: string | null;
  assignedEnterpriseName: string | null;
  spaceId: string;
  spaceName: string;
  meterName: string;
  fullAddress: string | null;
}

interface SelectStationStepProps {
  baseId: string;
  selectedRegNumber: AvailableRegNumber | null;
  onSelectRegNumber: (regNumber: AvailableRegNumber | null) => void;
}

function mapRegNumberFromAPI(apiData: any): AvailableRegNumber {
  return {
    id: apiData.id,
    code: apiData.code,
    manualCode: apiData.manualCode || apiData.manual_code,
    assignedEnterpriseName: apiData.assignedEnterpriseName || apiData.assigned_enterprise_name,
    spaceId: apiData.spaceId,
    spaceName: apiData.spaceName,
    meterName: apiData.meterName,
    fullAddress: apiData.fullAddress,
  };
}

export function SelectStationStep({ 
  baseId, 
  selectedRegNumber, 
  onSelectRegNumber 
}: SelectStationStepProps) {
  const [availableRegNumbers, setAvailableRegNumbers] = useState<AvailableRegNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<string | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);

  // 加载可用工位号
  useEffect(() => {
    if (baseId) {
      fetchAvailableRegNumbers();
    }
  }, [baseId]);

  const fetchAvailableRegNumbers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/registration-numbers/available?base_id=${baseId}`);
      const result = await res.json();
      if (result.success) {
        const mappedData = (result.data || []).map(mapRegNumberFromAPI);
        setAvailableRegNumbers(mappedData);
      }
    } catch (error) {
      console.error("获取可用工位号失败:", error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
              <select
                value={selectedMeter || ""}
                onChange={(e) => {
                  setSelectedMeter(e.target.value || null);
                  setSelectedSpace(null);
                }}
                className="h-9 px-3 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              >
                <option value="">全部物业</option>
                {meters.map((meter) => (
                  <option key={meter} value={meter}>{meter}</option>
                ))}
              </select>

              <select
                value={selectedSpace || ""}
                onChange={(e) => setSelectedSpace(e.target.value || null)}
                className="h-9 px-3 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              >
                <option value="">全部空间</option>
                {spaces.map((space) => (
                  <option key={space} value={space}>{space}</option>
                ))}
              </select>

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

        {/* 工位号列表 */}
        {availableRegNumbers.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <Hash className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-muted-foreground mb-4">该基地暂无可用工位号</p>
            <Button variant="outline" onClick={() => window.location.href = "/dashboard/base/addresses"}>
              前往地址管理生成工位号
            </Button>
          </div>
        ) : filteredRegNumbers.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <Hash className="w-8 h-8 text-emerald-600" />
            </div>
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
                onClick={() => onSelectRegNumber(reg)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-lg text-emerald-700">
                          {reg.manualCode || reg.code}
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
                        {reg.assignedEnterpriseName && (
                          <p className="text-emerald-600 font-medium">预分配：{reg.assignedEnterpriseName}</p>
                        )}
                      </div>
                    </div>
                    {selectedRegNumber?.id === reg.id && (
                      <Check className="w-5 h-5 text-emerald-600" />
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
}
