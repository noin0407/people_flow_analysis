import { useMemo } from "react";
import { CrowdData } from "@/types";

// 1. リンク交通量の型を定義
export interface LinkTraffic {
  source: string;
  target: string;
  sourceCoords: number[];
  targetCoords: number[];
  value: number;
}

// 2. 戻り値の型を定義
interface UseCrowdDataReturn {
  availableDates: string[];
  uniqueLocations: { name: string; lat: number; lng: number }[];
  hourlySnapshot: CrowdData[];
  currentFocus: CrowdData; // 該当がない場合は空オブジェクトを許容
  chartData: { time: string; count: number; hourValue: number }[];
  linkTraffic: LinkTraffic[];
}

interface useCrowdDataProps {
  rawData: CrowdData[];
  selectedDate: string;
  selectedHour: number;
  selectedLocation: string;
}

export const useCrowdData = (
  rawData: CrowdData[],
  selectedDate: string,
  selectedHour: number,
  selectedLocation: string
) => {
  // 1. 利用可能な日付の抽出
  const availableDates = useMemo(() => {
    const dates = Array.from(
      new Set(rawData.map((d) => d.dateObservedFrom?.split("T")[0]))
    );
    return dates.filter(Boolean).sort();
  }, [rawData]);

  // 2. 選択された日付でフィルタ
  const filteredDataByDate = useMemo(() => {
    if (!selectedDate) return [];
    return rawData.filter((d) => d.dateObservedFrom?.startsWith(selectedDate));
  }, [rawData, selectedDate]);

  // 3. ユニークな地点リスト (エラー解消用)
  const uniqueLocations = useMemo(() => {
    const locs: { name: string; lat: number; lng: number }[] = [];
    const seen = new Set();
    filteredDataByDate.forEach((d) => {
      if (!seen.has(d.locationName)) {
        seen.add(d.locationName);
        locs.push({ name: d.locationName, lat: d.latitude, lng: d.longitude });
      }
    });
    return locs;
  }, [filteredDataByDate]);

  // 3. 特定時刻の断面データ (地点データ)
  const hourlySnapshot = useMemo(() => {
    return filteredDataByDate.filter((d) => {
      const date = new Date(d.dateObservedFrom);
      return !isNaN(date.getTime()) && date.getHours() === selectedHour;
    });
  }, [filteredDataByDate, selectedHour]);

  // 5. 現在選択中の地点データ
  const currentFocus = useMemo(() => {
    return (
      hourlySnapshot.find((d) => d.locationName === selectedLocation) ||
      hourlySnapshot[0] ||
      {}
    );
  }, [hourlySnapshot, selectedLocation]);

  // 6. グラフ用データ
  const chartData = useMemo(() => {
    if (!selectedLocation) return [];
    return filteredDataByDate
      .filter((d) => d.locationName === selectedLocation)
      .map((d) => ({
        time: `${new Date(d.dateObservedFrom).getHours()}:00`,
        count: d.peopleCount,
        hourValue: new Date(d.dateObservedFrom).getHours(),
      }))
      .sort((a, b) => a.hourValue - b.hourValue);
  }, [filteredDataByDate, selectedLocation]);

  // --- ここから拡張: リンク交通量の推計 ---

  // 4. リンク交通量の計算 (重力モデル等の適用)
  const linkTraffic = useMemo(() => {
    if (hourlySnapshot.length < 2) return [];

    const links = [];
    // 全地点ペアに対して計算（あるいは隣接リストに基づいて計算）
    for (let i = 0; i < hourlySnapshot.length; i++) {
      for (let j = i + 1; j < hourlySnapshot.length; j++) {
        const locA = hourlySnapshot[i];
        const locB = hourlySnapshot[j];

        // 距離の計算 (単純な三平方の定理 or 緯度経度)
        const distance = Math.sqrt(
          Math.pow(locA.latitude - locB.latitude, 2) +
            Math.pow(locA.longitude - locB.longitude, 2)
        );

        // 重力モデルによる交通量推計: T = k * (Pi * Pj) / d^n
        // 仙台アーケードの特性（距離が短い）を考慮し、距離の影響度を調整
        const k = 0.001; // 係数は調整が必要
        const flow =
          (k * (locA.peopleCount * locB.peopleCount)) / Math.pow(distance, 1.5);

        links.push({
          source: locA.locationName,
          target: locB.locationName,
          sourceCoords: [locA.longitude, locA.latitude],
          targetCoords: [locB.longitude, locB.latitude],
          value: flow, // これを線の太さなどで可視化
        });
      }
    }
    return links;
  }, [hourlySnapshot]);

  return {
    availableDates,
    uniqueLocations,
    hourlySnapshot,
    currentFocus,
    chartData,
    linkTraffic,
  };
};
