"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { useLeaflet } from "@/hooks/useLeaflet";
import { CrowdData } from "@/types";

interface MapViewProps {
  hourlySnapshot: CrowdData[];
  selectedLocation: string;
  selectedHour: number;
  rawData: CrowdData[];
}

const MapView = ({
  hourlySnapshot,
  selectedLocation,
  selectedHour,
  rawData,
}: MapViewProps) => {
  useEffect(() => {
    if (leafletMapRef.current && hourlySnapshot.length > 0) {
      // データが読み込まれた直後（初期状態など）にその場所へ移動
      const firstPoint = hourlySnapshot[0];
      leafletMapRef.current.flyTo(
        [firstPoint.latitude, firstPoint.longitude],
        14
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData]); // rawData が更新されたときだけ実行

  useEffect(() => {
    if (leafletMapRef.current && selectedLocation) {
      const selectedPoint = hourlySnapshot.find(
        (p) => p.locationName === selectedLocation
      );
      if (selectedPoint) {
        leafletMapRef.current.panTo([
          selectedPoint.latitude,
          selectedPoint.longitude,
        ]);
      }
    }
  }, [selectedLocation, hourlySnapshot]);

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{ [key: string]: L.Circle }>({});

  // 1. 地図の初期化
  useLeaflet({ mapRef, leafletMapRef });

  // 2. データ更新に伴う描画ロジック
  useEffect(() => {
    if (!leafletMapRef.current) return;

    const map = leafletMapRef.current;

    // 既存レイヤーのクリア
    Object.values(layersRef.current).forEach((layer) => {
      if (layer && map.hasLayer(layer)) map.removeLayer(layer);
    });
    layersRef.current = {};

    // 円の描画
    hourlySnapshot.forEach((point) => {
      const color =
        point.peopleOccupancy > 30
          ? "#f43f5e"
          : point.peopleOccupancy > 10
          ? "#f59e0b"
          : "#10b981";
      const radius = 20 + Math.sqrt(point.peopleCount) * 10;

      const circle = L.circle([point.latitude, point.longitude], {
        color: color,
        fillColor: color,
        fillOpacity: 0.6,
        weight: 2,
        radius: Math.min(radius, 1000),
      }).addTo(map);

      // ポップアップ設定 (元のコードと同様)
      const popupContent = `<div ...>${point.locationName}...</div>`; // 中身は省略
      circle.bindPopup(popupContent);

      if (point.locationName === selectedLocation) {
        circle.setStyle({ weight: 4, color: "#4f46e5", fillOpacity: 0.85 });
      }

      layersRef.current[point.locationName] = circle;
    });
  }, [hourlySnapshot, selectedLocation, selectedHour]);

  return <div ref={mapRef} className="absolute inset-0 z-0" />;
};

export default MapView;
