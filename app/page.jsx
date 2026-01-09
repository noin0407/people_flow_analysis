"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";

import { useInitialData } from "@/hooks/useInitialData";

const Main = dynamic(() => import("@/components/Main"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-slate-100 flex items-center justify-center">
      Loading Application...
    </div>
  ),
});

import Header from "@/components/Header";

// --- メインコンポーネント ---
const App = () => {
  const [rawData, setRawData] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [selectedDate, setSelectedDate] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileName, setFileName] = useState("loading...");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 1. 初期データのセットアップ
  useInitialData({
    setRawData,
    setSelectedDate,
    setSelectedLocation,
    setFileName,
  });

  // 3. データ集計
  const availableDates = useMemo(() => {
    const dates = Array.from(
      new Set(rawData.map((d) => d.dateObservedFrom?.split("T")[0]))
    );
    return dates.filter(Boolean).sort();
  }, [rawData]);

  const filteredDataByDate = useMemo(() => {
    if (!selectedDate) return [];
    return rawData.filter((d) => d.dateObservedFrom?.startsWith(selectedDate));
  }, [rawData, selectedDate]);

  const uniqueLocations = useMemo(() => {
    const locs = [];
    const seen = new Set();
    filteredDataByDate.forEach((d) => {
      if (!seen.has(d.locationName)) {
        seen.add(d.locationName);
        locs.push({ name: d.locationName, lat: d.latitude, lng: d.longitude });
      }
    });
    return locs;
  }, [filteredDataByDate]);

  const hourlySnapshot = useMemo(() => {
    return filteredDataByDate.filter((d) => {
      const date = new Date(d.dateObservedFrom);
      return !isNaN(date.getTime()) && date.getHours() === selectedHour;
    });
  }, [filteredDataByDate, selectedHour]);

  const currentFocus = useMemo(() => {
    return (
      hourlySnapshot.find((d) => d.locationName === selectedLocation) ||
      hourlySnapshot[0] ||
      {}
    );
  }, [hourlySnapshot, selectedLocation]);

  const chartData = useMemo(() => {
    return filteredDataByDate
      .filter((d) => d.locationName === selectedLocation)
      .map((d) => ({
        time: `${new Date(d.dateObservedFrom).getHours()}:00`,
        count: d.peopleCount,
        hourValue: new Date(d.dateObservedFrom).getHours(),
      }))
      .sort((a, b) => a.hourValue - b.hourValue);
  }, [filteredDataByDate, selectedLocation]);

  // 5. 再生コントロール
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setSelectedHour((prev) => (prev + 1) % 24);
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* ヘッダー */}
      <Header
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        availableDates={availableDates}
        setFileName={setFileName}
        setRawData={setRawData}
        setSelectedLocation={setSelectedLocation}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* メインコンテンツ */}
      <Main
        // 1. 基本的な表示状態
        isSidebarOpen={isSidebarOpen}
        fileName={fileName}
        // 2. データ本体と集計データ (useMemoで計算したもの)
        rawData={rawData}
        availableDates={availableDates}
        uniqueLocations={uniqueLocations}
        // 3. 現在の選択状態
        selectedLocation={selectedLocation}
        selectedHour={selectedHour}
        isPlaying={isPlaying}
        // 4. 地図・統計・グラフ用のフィルタリング済みデータ
        hourlySnapshot={hourlySnapshot}
        currentFocus={currentFocus}
        chartData={chartData}
        // 5. ユーザー操作用の更新関数
        setSelectedLocation={setSelectedLocation}
        setIsPlaying={setIsPlaying}
        setSelectedHour={setSelectedHour}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        .animate-pulse-slow { animation: pulse-slow 3s infinite ease-in-out; }
        .leaflet-container { background: #f8fafc !important; }
        .leaflet-popup-content-wrapper { border-radius: 12px !important; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1) !important; border: 1px solid #e2e8f0 !important; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 18px; width: 18px; border-radius: 50%; background: #4f46e5; cursor: pointer; box-shadow: 0 0 10px rgba(79, 70, 229, 0.4); border: 2px solid white; }
      `,
        }}
      />
    </div>
  );
};

export default App;
