"use client";

import { useEffect, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

const DEFAULT_CENTER: [number, number] = [35.8617, 104.1954];
const DEFAULT_ZOOM = 4;

interface MapComponentProps {
  position?: [number, number];
  onLocationSelect: (lat: number, lng: number) => void;
}

function MapEventHandler({ onLocationSelect }: Pick<MapComponentProps, "onLocationSelect">) {
  useMapEvents({
    click: (event: L.LeafletMouseEvent) => {
      onLocationSelect(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function MapPositionUpdater({ position }: Pick<MapComponentProps, "position">) {
  const map = useMap();
  const previousPosition = useRef<[number, number] | undefined>(undefined);

  useEffect(() => {
    if (
      position &&
      (!previousPosition.current ||
        previousPosition.current[0] !== position[0] ||
        previousPosition.current[1] !== position[1])
    ) {
      map.setView(position, 15);
      previousPosition.current = position;
    }
  }, [map, position]);

  return null;
}

function isValidPosition(position?: [number, number]) {
  if (!position) return false;
  const [lat, lng] = position;
  return lat !== 0 && lng !== 0 && Number.isFinite(lat) && Number.isFinite(lng);
}

export default function MapComponent({ position, onLocationSelect }: MapComponentProps) {
  const hasValidPosition = isValidPosition(position);
  const center = hasValidPosition ? position! : DEFAULT_CENTER;
  const zoom = hasValidPosition ? 15 : DEFAULT_ZOOM;

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
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
