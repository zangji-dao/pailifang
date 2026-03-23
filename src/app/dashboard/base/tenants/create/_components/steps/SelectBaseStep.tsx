"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPinned, Check, Filter, Loader2 } from "lucide-react";
import { provinces, Province, City } from "@/lib/cities";

interface Base {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  city_code: string | null;
}

interface SelectBaseStepProps {
  selectedBaseId: string;
  onSelectBase: (baseId: string) => void;
}

export function SelectBaseStep({ selectedBaseId, onSelectBase }: SelectBaseStepProps) {
  const [bases, setBases] = useState<Base[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProvince, setFilterProvince] = useState<Province | null>(null);
  const [filterCity, setFilterCity] = useState<City | null>(null);

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
    } finally {
      setLoading(false);
    }
  };

  // 从地址中解析城市名
  const getCityFromAddress = (address: string | null): string => {
    if (!address) return "";
    const parts = address.split(",").map(p => p.trim());
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
    const baseCityCode = base.city_code;
    const baseProvince = base.city_code
      ? null
      : getProvinceFromAddress(base.address);
    const baseCity = base.city || (base.city_code ? null : getCityFromAddress(base.address));

    if (filterCity) {
      if (baseCityCode) {
        return baseCityCode === filterCity.code;
      }
      return baseCity === filterCity.name.replace("市", "");
    }

    if (filterProvince) {
      if (baseCityCode) {
        const provincePrefix = filterProvince.code.substring(0, 2);
        return baseCityCode.startsWith(provincePrefix);
      }
      const provinceName = filterProvince.name.replace(/省|自治区/g, "");
      return baseProvince === provinceName;
    }

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
        <CardTitle>选择合作基地</CardTitle>
        <CardDescription>请选择企业入驻的合作基地</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 城市筛选 */}
        <div className="flex items-center gap-3 pb-4 border-b">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-2 flex-1">
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

        {/* 结果统计 */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>共 {filteredBases.length} 个基地</span>
          {(filterProvince || filterCity) && (
            <span className="text-xs">
              已筛选：{filterProvince?.name}{filterCity ? ` / ${filterCity.name}` : ''}
            </span>
          )}
        </div>

        {/* 基地列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBases.map((base) => (
            <Card
              key={base.id}
              className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                selectedBaseId === base.id ? "border-primary ring-2 ring-primary/20" : ""
              }`}
              onClick={() => onSelectBase(base.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-sky-600" />
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
}
