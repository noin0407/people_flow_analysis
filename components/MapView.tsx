"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- Leafletアイコンの修正（Next.js対応） ---
// TypeScriptの strict モードでの any エラーを避けるため、プロトタイプを拡張定義
interface DefaultIconPrototype extends L.Icon.Default {
  _getIconUrl?: string;
}

// 既存の誤った画像パス参照を削除
delete (L.Icon.Default.prototype as DefaultIconPrototype)._getIconUrl;

// 正しいアイコンURL（CDN）を手動でセット
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});
// ------------------------------------------

import GravityLinkLayer from "./GravityLinkLayer";
import { CalculatedLinkVolume } from "@/hooks/calculateGravityModelVolumes";
import { CrowdData } from "@/types";

interface MapViewProps {
  hourlySnapshot: CrowdData[];
  selectedLocation: string;
  selectedHour: number;
  rawData: CrowdData[];
  linkVolumes: CalculatedLinkVolume[];
}

const MapView = ({
  hourlySnapshot,
  selectedLocation,
  linkVolumes,
}: MapViewProps) => {
  // 仙台駅周辺をセンターに設定
  const center: [number, number] = [38.263, 140.872];

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={15}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* 重力モデルによるリンク交通量の可視化レイヤー */}
        <GravityLinkLayer volumes={linkVolumes} />

        {/* 各地点の地点マーカー */}
        {hourlySnapshot.map((point) => (
          <Marker
            key={point.locationName}
            position={[point.latitude, point.longitude]}
          >
            <Popup>
              <div className="p-1">
                <p className="font-bold text-sm text-slate-800">
                  {point.locationName}
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-slate-600 flex justify-between">
                    <span>滞留人数:</span>
                    <span className="font-mono font-bold text-indigo-600">
                      {Math.round(point.peopleCount).toLocaleString()}人
                    </span>
                  </p>
                  <p className="text-xs text-slate-600 flex justify-between">
                    <span>混雑度:</span>
                    <span className="font-mono font-bold text-amber-600">
                      {point.peopleOccupancy.toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
