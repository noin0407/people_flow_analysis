import { useEffect, RefObject, MutableRefObject } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIconRetina from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIconRetina.src,
  shadowUrl: markerShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface UseLeafletProps {
  mapRef: RefObject<HTMLDivElement | null>;
  leafletMapRef: MutableRefObject<L.Map | null>;
}

export const useLeaflet = ({
  mapRef,
  leafletMapRef,
}: UseLeafletProps): void => {
  useEffect(() => {
    // 1. 地図の初期化（既に初期化されている場合はスキップ）
    if (!leafletMapRef.current && mapRef.current) {
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([38.263, 140.875], 14); // 仙台市周辺

      // 2. タイルレイヤーの追加 (CartoDB Voyager)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        }
      ).addTo(map);

      // 3. ズームコントロールの追加
      L.control.zoom({ position: "bottomright" }).addTo(map);

      leafletMapRef.current = map;
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [mapRef, leafletMapRef]);
};
