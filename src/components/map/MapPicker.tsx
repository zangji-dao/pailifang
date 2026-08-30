"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, MapPin, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] w-full items-center justify-center bg-muted/50">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
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
  province?: string;
  city?: string;
  district?: string;
  street?: string;
}

interface MapPickerProps {
  value?: Location;
  onChange: (location: Location) => void;
  placeholder?: string;
  className?: string;
}

interface NominatimAddress {
  province?: string;
  state?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  suburb?: string;
  district?: string;
  road?: string;
  street?: string;
}

interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  address?: NominatimAddress;
}

interface NominatimReverseResult {
  display_name?: string;
  address?: NominatimAddress;
}

async function searchAddress(query: string): Promise<Location[]> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&accept-language=zh`,
  );
  if (!response.ok) throw new Error("地址搜索失败");

  const data = await response.json() as NominatimSearchResult[];
  return data.map((item) => {
    const address = item.address || {};
    return {
      lat: Number.parseFloat(item.lat),
      lng: Number.parseFloat(item.lon),
      address: item.display_name,
      name: item.name || item.display_name.split(",")[0],
      province: address.province || address.state || "",
      city: address.city || address.town || address.village || address.county || "",
      district: address.suburb || address.district || address.county || "",
      street: address.road || address.street || "",
    };
  });
}

async function reverseGeocode(lat: number, lng: number): Promise<Location> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=zh`,
  );
  if (!response.ok) throw new Error("地址解析失败");

  const data = await response.json() as NominatimReverseResult;
  const address = data.address || {};
  return {
    lat,
    lng,
    address: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    province: address.province || address.state || "",
    city: address.city || address.town || address.village || address.county || "",
    district: address.suburb || address.district || address.county || "",
    street: address.road || address.street || "",
  };
}

export function MapPicker({
  value,
  onChange,
  placeholder = "点击选择地址",
  className = "",
}: MapPickerProps) {
  const [showMap, setShowMap] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [providerError, setProviderError] = useState("");
  const [mapKey, setMapKey] = useState(0);

  const handleLocationSelect = useCallback(async (lat: number, lng: number) => {
    setProviderError("");
    try {
      onChange(await reverseGeocode(lat, lng));
    } catch (error: unknown) {
      console.error("地址解析失败:", error);
      setProviderError(error instanceof Error ? error.message : "地址解析失败");
      onChange({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
    }
  }, [onChange]);

  const handleSearch = async () => {
    const keyword = searchKeyword.trim();
    if (!keyword) return;

    setSearching(true);
    setShowResults(true);
    setProviderError("");
    try {
      const results = await searchAddress(keyword);
      setSearchResults(results);
      if (results.length === 0) setProviderError("未找到匹配地址，请补充省市区后重试");
    } catch (error: unknown) {
      console.error("地址搜索失败:", error);
      setSearchResults([]);
      setProviderError(error instanceof Error ? error.message : "地址搜索失败");
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = async (location: Location) => {
    setProviderError("");
    try {
      onChange(await reverseGeocode(location.lat, location.lng));
    } catch {
      onChange(location);
    }
    setShowResults(false);
    setSearchKeyword("");
    setSearchResults([]);
  };

  if (!showMap && value?.address) {
    return (
      <div className={`rounded-lg border p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
            <span className="flex-1 truncate">{value.address}</span>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowMap(true);
                setMapKey((current) => current + 1);
              }}
              className="text-primary"
            >
              修改
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange({ lng: 0, lat: 0, address: "" })}
              className="text-destructive"
            >
              清除
            </Button>
          </div>
        </div>
        {value.lat !== 0 && value.lng !== 0 && (
          <p className="mt-2 pl-6 text-xs text-muted-foreground">
            经度: {value.lng.toFixed(6)} 纬度: {value.lat.toFixed(6)}
          </p>
        )}
      </div>
    );
  }

  if (!showMap) {
    return (
      <button
        type="button"
        onClick={() => {
          setShowMap(true);
          setMapKey((current) => current + 1);
        }}
        className={`w-full rounded-lg border-2 border-dashed p-4 text-center transition-colors hover:border-primary hover:bg-primary/5 ${className}`}
      >
        <MapPin className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{placeholder}</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          使用 OpenStreetMap（免费）
        </p>
      </button>
    );
  }

  return (
    <div className={`overflow-hidden rounded-lg border ${className}`}>
      <div className="flex items-center justify-between border-b bg-muted/50 p-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">选择地址</span>
          <span className="text-xs text-muted-foreground">(OpenStreetMap)</span>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowMap(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative border-b p-3">
        <div className="flex items-center gap-2">
          <Input
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder="输入省市区、道路或园区名称"
            className="flex-1"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleSearch();
              }
            }}
          />
          <Button type="button" onClick={() => void handleSearch()} disabled={searching}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {showResults && searchResults.length > 0 && (
          <div className="absolute left-3 right-3 top-full z-[1000] mt-1 max-h-60 overflow-y-auto rounded-lg border bg-background shadow-lg">
            {searchResults.map((result) => (
              <button
                type="button"
                key={`${result.lng}-${result.lat}-${result.name || result.address}`}
                onClick={() => void selectSearchResult(result)}
                className="w-full border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
              >
                <div className="truncate font-medium">{result.name || result.address}</div>
                <div className="truncate text-xs text-muted-foreground">{result.address}</div>
              </button>
            ))}
          </div>
        )}

        {showResults && searching && (
          <div className="absolute left-3 right-3 top-full z-[1000] mt-1 rounded-lg border bg-background p-3 text-center text-sm text-muted-foreground shadow-lg">
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
            搜索中...
          </div>
        )}
      </div>

      {providerError && (
        <div className="border-b border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
          {providerError}
        </div>
      )}

      <div className="h-[300px] w-full">
        <MapComponent
          key={mapKey}
          position={value ? [value.lat, value.lng] : undefined}
          onLocationSelect={handleLocationSelect}
        />
      </div>

      {value?.address && (
        <div className="border-t bg-muted/30 p-3">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{value.address}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                经度: {value.lng.toFixed(6)} 纬度: {value.lat.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-muted/30 p-2 text-center text-xs text-muted-foreground">
        点击地图选择位置，或搜索地址后定位
      </div>
    </div>
  );
}
