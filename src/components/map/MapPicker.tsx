"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { MapPin, Search, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import dynamic from "next/dynamic";

// 动态导入地图组件，避免 SSR 问题
const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] flex items-center justify-center bg-muted/50">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>加载地图中...</span>
      </div>
    </div>
  ),
});

export interface Location {
  lng: number;
  lat: number;
  address: string;
  name?: string;
  // 地址详情
  province?: string;  // 省/直辖市
  city?: string;      // 市
  district?: string;  // 区/县
  street?: string;    // 街道
}

interface MapPickerProps {
  value?: Location;
  onChange: (location: Location) => void;
  placeholder?: string;
  className?: string;
}

// 搜索功能使用 Nominatim（OpenStreetMap 的免费地理编码服务）
async function searchAddress(query: string): Promise<Location[]> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
    );
    const data = await response.json();
    
    return data.map((item: any) => {
      const addr = item.address || {};
      return {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        address: item.display_name,
        name: item.name || item.display_name.split(",")[0],
        province: addr.province || addr.state || addr['ISO3166-2-lvl4']?.split('-')[0] || '',
        city: addr.city || addr.town || addr.village || addr.county || '',
        district: addr.suburb || addr.district || addr.county || '',
        street: addr.road || addr.street || '',
      };
    });
  } catch (error) {
    console.error("搜索失败:", error);
    return [];
  }
}

// 逆地理编码 - 返回完整地址信息
async function reverseGeocode(lat: number, lng: number): Promise<Location> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    const data = await response.json();
    const addr = data.address || {};
    
    return {
      lat,
      lng,
      address: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      province: addr.province || addr.state || addr['ISO3166-2-lvl4']?.split('-')[0] || '',
      city: addr.city || addr.town || addr.village || addr.county || '',
      district: addr.suburb || addr.district || addr.county || '',
      street: addr.road || addr.street || '',
    };
  } catch (error) {
    console.error("逆地理编码失败:", error);
    return {
      lat,
      lng,
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    };
  }
}

// 中国省份名称映射（用于匹配）
const provinceNames: Record<string, string> = {
  '北京市': '北京',
  '北京': '北京',
  '天津市': '天津',
  '天津': '天津',
  '河北省': '河北',
  '河北': '河北',
  '山西省': '山西',
  '山西': '山西',
  '内蒙古自治区': '内蒙古',
  '内蒙古': '内蒙古',
  '辽宁省': '辽宁',
  '辽宁': '辽宁',
  '吉林省': '吉林',
  '吉林': '吉林',
  '黑龙江省': '黑龙江',
  '黑龙江': '黑龙江',
  '上海市': '上海',
  '上海': '上海',
  '江苏省': '江苏',
  '江苏': '江苏',
  '浙江省': '浙江',
  '浙江': '浙江',
  '安徽省': '安徽',
  '安徽': '安徽',
  '福建省': '福建',
  '福建': '福建',
  '江西省': '江西',
  '江西': '江西',
  '山东省': '山东',
  '山东': '山东',
  '河南省': '河南',
  '河南': '河南',
  '湖北省': '湖北',
  '湖北': '湖北',
  '湖南省': '湖南',
  '湖南': '湖南',
  '广东省': '广东',
  '广东': '广东',
  '广西壮族自治区': '广西',
  '广西': '广西',
  '海南省': '海南',
  '海南': '海南',
  '重庆市': '重庆',
  '重庆': '重庆',
  '四川省': '四川',
  '四川': '四川',
  '贵州省': '贵州',
  '贵州': '贵州',
  '云南省': '云南',
  '云南': '云南',
  '西藏自治区': '西藏',
  '西藏': '西藏',
  '陕西省': '陕西',
  '陕西': '陕西',
  '甘肃省': '甘肃',
  '甘肃': '甘肃',
  '青海省': '青海',
  '青海': '青海',
  '宁夏回族自治区': '宁夏',
  '宁夏': '宁夏',
  '新疆维吾尔自治区': '新疆',
  '新疆': '新疆',
  '香港特别行政区': '香港',
  '香港': '香港',
  '澳门特别行政区': '澳门',
  '澳门': '澳门',
  '台湾省': '台湾',
  '台湾': '台湾',
};

// 标准化省份名称
function normalizeProvinceName(province: string): string {
  if (!province) return '';
  // 直接匹配
  if (provinceNames[province]) return provinceNames[province];
  // 模糊匹配
  for (const [key, value] of Object.entries(provinceNames)) {
    if (province.includes(key) || key.includes(province)) {
      return value;
    }
  }
  return province;
}

export function MapPicker({ value, onChange, placeholder = "点击选择地址", className = "" }: MapPickerProps) {
  const [showMap, setShowMap] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  // 处理地图点击选择
  const handleLocationSelect = useCallback(async (lat: number, lng: number) => {
    const location = await reverseGeocode(lat, lng);
    // 标准化省份名称
    if (location.province) {
      location.province = normalizeProvinceName(location.province);
    }
    onChange(location);
  }, [onChange]);

  // 处理搜索
  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;
    
    setSearching(true);
    setShowResults(true);
    const results = await searchAddress(searchKeyword);
    // 标准化省份名称
    results.forEach(r => {
      if (r.province) {
        r.province = normalizeProvinceName(r.province);
      }
    });
    setSearchResults(results);
    setSearching(false);
  };

  // 选择搜索结果
  const selectSearchResult = async (location: Location) => {
    const fullLocation = await reverseGeocode(location.lat, location.lng);
    // 标准化省份名称
    if (fullLocation.province) {
      fullLocation.province = normalizeProvinceName(fullLocation.province);
    }
    onChange(fullLocation);
    setShowResults(false);
    setSearchKeyword("");
    setSearchResults([]);
  };

  // 已选择位置但未展开地图
  if (!showMap && value?.address) {
    return (
      <div className={`border rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="truncate flex-1">{value.address}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowMap(true);
                setMapKey(prev => prev + 1);
              }}
              className="text-primary"
            >
              修改
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange({ lng: 0, lat: 0, address: "" })}
              className="text-destructive"
            >
              清除
            </Button>
          </div>
        </div>
        {value.lat && value.lng && (
          <p className="text-xs text-muted-foreground mt-2 pl-6">
            经度: {value.lng.toFixed(6)} 纬度: {value.lat.toFixed(6)}
          </p>
        )}
      </div>
    );
  }

  // 未展开地图且未选择位置
  if (!showMap) {
    return (
      <button
        onClick={() => {
          setShowMap(true);
          setMapKey(prev => prev + 1);
        }}
        className={`w-full border-2 border-dashed rounded-lg p-4 text-center hover:border-primary hover:bg-primary/5 transition-colors ${className}`}
      >
        <MapPin className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{placeholder}</p>
        <p className="text-xs text-muted-foreground/60 mt-1">使用 OpenStreetMap（免费）</p>
      </button>
    );
  }

  // 展开的地图界面
  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">选择地址</span>
          <span className="text-xs text-muted-foreground">(OpenStreetMap)</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMap(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* 搜索栏 */}
      <div className="p-3 border-b relative">
        <div className="flex items-center gap-2">
          <Input
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索地址..."
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={searching}>
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {/* 搜索结果下拉 */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute left-3 right-3 top-full mt-1 bg-background border rounded-lg shadow-lg z-[1000] max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => selectSearchResult(result)}
                className="w-full px-3 py-2 text-left hover:bg-muted text-sm border-b last:border-b-0"
              >
                <div className="font-medium truncate">{result.name}</div>
                <div className="text-xs text-muted-foreground truncate">{result.address}</div>
              </button>
            ))}
          </div>
        )}
        
        {showResults && searching && (
          <div className="absolute left-3 right-3 top-full mt-1 bg-background border rounded-lg shadow-lg z-[1000] p-3 text-center text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
            搜索中...
          </div>
        )}
      </div>

      {/* 地图容器 */}
      <div className="w-full h-[300px]">
        <MapComponent
          key={mapKey}
          position={value ? [value.lat, value.lng] : undefined}
          onLocationSelect={handleLocationSelect}
        />
      </div>

      {/* 已选地址 */}
      {value?.address && (
        <div className="p-3 border-t bg-muted/30">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{value.address}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                经度: {value.lng.toFixed(6)} 纬度: {value.lat.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 提示 */}
      <div className="p-2 bg-muted/30 text-xs text-muted-foreground text-center">
        点击地图选择位置，或使用搜索功能定位
      </div>
    </div>
  );
}
