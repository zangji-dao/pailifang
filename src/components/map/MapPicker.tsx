"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Search, Loader2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import config from "@/config";

interface Location {
  lng: number;
  lat: number;
  address: string;
  name?: string;
}

interface MapPickerProps {
  value?: Location;
  onChange: (location: Location) => void;
  placeholder?: string;
  className?: string;
}

// 高德地图 API 类型声明
declare global {
  interface Window {
    AMap: any;
    AMapUI: any;
  }
}

export function MapPicker({ value, onChange, placeholder = "点击选择地址", className = "" }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const amapKey = config.map.amapKey;

  // 初始化地图
  const initMap = useCallback(() => {
    if (!containerRef.current || !amapKey) return;

    const defaultCenter = [config.map.defaultCenterLng, config.map.defaultCenterLat];
    const center = value ? [value.lng, value.lat] : defaultCenter;

    // 创建地图实例
    const map = new window.AMap.Map(containerRef.current, {
      zoom: config.map.defaultZoom,
      center: center,
    });

    mapRef.current = map;

    // 创建标记点
    const marker = new window.AMap.Marker({
      position: center,
      draggable: true,
    });

    markerRef.current = marker;
    map.add(marker);

    // 点击地图选择位置
    map.on("click", async (e: any) => {
      const { lng, lat } = e.lnglat;
      marker.setPosition([lng, lat]);

      // 逆地理编码获取地址
      try {
        const address = await getAddressByLngLat(lng, lat);
        onChange({
          lng,
          lat,
          address: address,
        });
      } catch (err) {
        console.error("获取地址失败:", err);
        onChange({
          lng,
          lat,
          address: `${lng.toFixed(6)}, ${lat.toFixed(6)}`,
        });
      }
    });

    // 拖拽结束获取地址
    marker.on("dragend", async () => {
      const position = marker.getPosition();
      const { lng, lat } = position;

      try {
        const address = await getAddressByLngLat(lng, lat);
        onChange({
          lng,
          lat,
          address: address,
        });
      } catch (err) {
        console.error("获取地址失败:", err);
        onChange({
          lng,
          lat,
          address: `${lng.toFixed(6)}, ${lat.toFixed(6)}`,
        });
      }
    });

    setLoading(false);
  }, [amapKey, value, onChange]);

  // 逆地理编码
  const getAddressByLngLat = async (lng: number, lat: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      window.AMap.plugin("AMap.Geocoder", () => {
        const geocoder = new window.AMap.Geocoder();
        geocoder.getAddress([lng, lat], (status: string, result: any) => {
          if (status === "complete" && result.regeocode) {
            resolve(result.regeocode.formattedAddress);
          } else {
            reject(new Error("获取地址失败"));
          }
        });
      });
    });
  };

  // 搜索地址
  const handleSearch = async () => {
    if (!searchKeyword.trim() || !mapRef.current) return;

    setSearching(true);
    try {
      window.AMap.plugin("AMap.PlaceSearch", () => {
        const placeSearch = new window.AMap.PlaceSearch({
          pageSize: 5,
          pageIndex: 1,
        });

        placeSearch.search(searchKeyword, (status: string, result: any) => {
          if (status === "complete" && result.poiList?.pois?.length > 0) {
            const poi = result.poiList.pois[0];
            const { lng, lat } = poi.location;
            const address = poi.address || poi.name;

            // 移动地图到搜索结果
            mapRef.current.setCenter([lng, lat]);
            mapRef.current.setZoom(15);

            // 设置标记点
            markerRef.current.setPosition([lng, lat]);

            onChange({
              lng,
              lat,
              address: address,
              name: poi.name,
            });
          }
          setSearching(false);
        });
      });
    } catch (err) {
      console.error("搜索失败:", err);
      setSearching(false);
    }
  };

  // 加载高德地图 API
  useEffect(() => {
    if (!showMap || !amapKey) return;

    // 检查是否已加载
    if (window.AMap) {
      initMap();
      return;
    }

    // 动态加载高德地图 JS API
    const script = document.createElement("script");
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${amapKey}`;
    script.async = true;
    script.onload = () => {
      initMap();
    };
    script.onerror = () => {
      setError("地图加载失败，请检查网络连接");
      setLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      // 清理地图实例
      if (mapRef.current) {
        mapRef.current.destroy();
      }
    };
  }, [showMap, amapKey, initMap]);

  // 如果没有配置 API Key
  if (!amapKey) {
    return (
      <div className={`border rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3 text-amber-600">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">地图功能未配置</p>
            <p className="text-sm text-muted-foreground mt-1">
              请在环境变量中配置 <code className="bg-muted px-1 rounded">AMAP_KEY</code> 以启用地图选点功能
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              获取高德地图 API Key: 
              <a 
                href="https://lbs.amap.com/api/javascript-api/guide/abc/prepare" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline ml-1"
              >
                高德开放平台
              </a>
            </p>
          </div>
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">手动输入地址</label>
          <Input
            value={value?.address || ""}
            onChange={(e) => onChange({ lng: 0, lat: 0, address: e.target.value })}
            placeholder="请输入详细地址"
          />
        </div>
      </div>
    );
  }

  // 已选择位置但未展开地图
  if (!showMap && value?.address) {
    return (
      <div className={`border rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="truncate">{value.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMap(true)}
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
      </div>
    );
  }

  // 未展开地图且未选择位置
  if (!showMap) {
    return (
      <button
        onClick={() => setShowMap(true)}
        className={`w-full border-2 border-dashed rounded-lg p-4 text-center hover:border-primary hover:bg-primary/5 transition-colors ${className}`}
      >
        <MapPin className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{placeholder}</p>
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
      <div className="p-3 border-b">
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
      </div>

      {/* 地图容器 */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>加载地图中...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
              <p>{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  initMap();
                }}
                className="mt-2"
              >
                重试
              </Button>
            </div>
          </div>
        )}
        <div ref={containerRef} className="w-full h-[300px]" />
      </div>

      {/* 已选地址 */}
      {value?.address && (
        <div className="p-3 border-t bg-muted/30">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{value.address}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                经度: {value.lng.toFixed(6)} 纬度: {value.lat.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 提示 */}
      <div className="p-2 bg-muted/30 text-xs text-muted-foreground text-center">
        点击地图或拖拽标记点选择位置
      </div>
    </div>
  );
}
