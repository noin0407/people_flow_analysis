import React from "react";
import { Polyline, Popup } from "react-leaflet";
import { CalculatedLinkVolume } from "@/hooks/calculateGravityModelVolumes";

interface GravityLinkLayerProps {
  volumes: CalculatedLinkVolume[];
}

// 交通量に応じて色と太さを決めるヘルパー関数
const getLinkStyle = (volume: number, maxVolume: number) => {
  // 最大値に対する割合（0.0 ~ 1.0）
  const ratio = maxVolume > 0 ? volume / maxVolume : 0;

  let color = "#3b82f6"; // 青（低）
  if (ratio > 0.7) color = "#ef4444"; // 赤（高）
  else if (ratio > 0.4) color = "#f59e0b"; // 黄（中）

  // 太さは最小3px、最大12pxの範囲で変動させる
  const weight = 3 + ratio * 9;

  return { color, weight, opacity: 0.8 };
};

const GravityLinkLayer: React.FC<GravityLinkLayerProps> = ({ volumes }) => {
  if (volumes.length === 0) return null;

  // 色塗りの基準にするため、全体の最大交通量を求める
  const maxVolume = Math.max(...volumes.map((v) => v.volume));

  return (
    <>
      {volumes.map((link, index) => {
        const style = getLinkStyle(link.volume, maxVolume);
        const positions: [number, number][] = [
          [link.fromLat, link.fromLng],
          [link.toLat, link.toLng],
        ];

        return (
          <Polyline key={index} positions={positions} pathOptions={style}>
            <Popup>
              <div>
                <p className="font-bold">推計リンク交通量</p>
                <p>スコア: {link.volume.toFixed(1)}</p>
              </div>
            </Popup>
          </Polyline>
        );
      })}
    </>
  );
};

export default GravityLinkLayer;
