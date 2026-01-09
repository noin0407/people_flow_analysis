// hooks/calculateGravityModelVolumes.ts

export interface PointData {
  id: number | string;
  lat: number;
  lng: number;
  people: number;
}

export interface LinkDefinition {
  fromId: number | string;
  toId: number | string;
}

export interface CalculatedLinkVolume {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  volume: number;
}

// 距離計算のヘルパー
function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // 地球の半径(m)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 重力モデルによる交通量計算
 * アーケード特性に合わせて距離減衰指数 n を調整可能
 */
export const calculateGravityModelVolumes = (
  points: PointData[],
  linkDefs: LinkDefinition[],
  params: { k: number; n: number; minD: number } = { k: 100, n: 0.5, minD: 100 }
): CalculatedLinkVolume[] => {
  const results: CalculatedLinkVolume[] = [];
  const pointMap = new Map(points.map((p) => [p.id, p]));

  linkDefs.forEach((link) => {
    const from = pointMap.get(link.fromId);
    const to = pointMap.get(link.toId);

    if (from && to) {
      const d = getDistance(from.lat, from.lng, to.lat, to.lng);

      // アーケード向け調整: 距離 d に minD を足して n 乗する
      const adjustedDistance = Math.pow(d + params.minD, params.n);

      // 基本式: Q = K * (Pi * Pj) / d^n
      const volume = (params.k * (from.people * to.people)) / adjustedDistance;

      results.push({
        fromLat: from.lat,
        fromLng: from.lng,
        toLat: to.lat,
        toLng: to.lng,
        volume: volume,
      });
    }
  });

  return results;
};
