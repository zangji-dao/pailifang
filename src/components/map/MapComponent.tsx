"use client";

import { useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 修复 Leaflet 默认图标问题
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

// 默认中心点（中国中部）
const DEFAULT_CENTER: [number, number] = [35.8617, 104.1954];
const DEFAULT_ZOOM = 4;

interface MapComponentProps {
  position?: [number, number];
  onLocationSelect: (lat: number, lng: number) => void;
}

// 地图事件处理组件
function MapEventHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    click: (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });

  return null;
}

// 位置更新组件 - 当 position 变化时自动移动地图视图
function MapPositionUpdater({ position }: { position?: [number, number] }) {
  const map = useMap();
  const prevPositionRef = useRef<[number, number] | undefined>(undefined);

  useEffect(() => {
    if (position && (
      !prevPositionRef.current ||
      prevPositionRef.current[0] !== position[0] ||
      prevPositionRef.current[1] !== position[1]
    )) {
      // 位置变化时，移动地图到新位置
      map.setView(position, 15);
      prevPositionRef.current = position;
    }
  }, [position, map]);

  return null;
}

// 检查位置是否有效（非零坐标）
function isValidPosition(position?: [number, number]): boolean {
  if (!position) return false;
  const [lat, lng] = position;
  return lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng);
}

export default function MapComponent({ position, onLocationSelect }: MapComponentProps) {
  const hasValidPosition = isValidPosition(position);
  const center = hasValidPosition ? position! : DEFAULT_CENTER;
  const zoom = hasValidPosition ? 15 : DEFAULT_ZOOM;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {hasValidPosition && <Marker position={position!} />}
      <MapEventHandler onLocationSelect={onLocationSelect} />
      <MapPositionUpdater position={hasValidPosition ? position : undefined} />
    </MapContainer>
  );
}
