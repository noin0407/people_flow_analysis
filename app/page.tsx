"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Papa from "papaparse";
import { CrowdData } from "@/types";

// Mainコンポーネントをクライアントサイドのみで読み込む
const Main = dynamic(() => import("@/components/Main"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-slate-100 flex items-center justify-center">
      分析アプリケーションを起動中...
    </div>
  ),
});

import Header from "@/components/Header";
// 前回のロジックをフックとしてインポート
import { useCrowdData } from "@/hooks/useCrowdData";

const App = () => {
  const [rawData, setRawData] = useState<CrowdData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [selectedDate, setSelectedDate] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileName, setFileName] = useState("flowdata_2025.csv");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. データ加工ロジックの呼び出し ---
  // rawDataが変わるたびに、日付リストやフィルタ済みデータを再計算します
  const {
    availableDates,
    uniqueLocations,
    hourlySnapshot,
    currentFocus,
    chartData,
    linkTraffic, // 重力モデル等で算出したリンク交通量（前回提案分）
  } = useCrowdData(rawData, selectedDate, selectedHour, selectedLocation);

  // --- 2. イニシャルデータの自動読み込み ---
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await fetch("/flowdata_2025.csv");
        const csvString = await response.text();

        Papa.parse(csvString, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsedData = results.data as CrowdData[];
            const formattedData: CrowdData[] = parsedData.map((row) => ({
              ...row,
              dateObservedFrom: String(row.dateObservedFrom || ""),
              peopleCount: Number(row.peopleCount || 0),
              latitude: Number(row.latitude),
              longitude: Number(row.longitude),
            }));

            setRawData(formattedData);

            // 初期表示の設定
            if (formattedData.length > 0) {
              const firstDate =
                formattedData[0].dateObservedFrom?.split("T")[0];
              if (firstDate) setSelectedDate(firstDate);

              const firstLocation = formattedData[0].locationName;
              if (firstLocation) setSelectedLocation(firstLocation);
            }

            setIsLoading(false);
          },
        });
      } catch (error) {
        console.error("データの読み込みに失敗しました:", error);
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // --- 3. 再生コントロール ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setSelectedHour((prev) => (prev + 1) % 24);
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-indigo-600 font-bold">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>仙台人流データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
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

      <Main
        isSidebarOpen={isSidebarOpen}
        fileName={fileName}
        rawData={rawData}
        availableDates={availableDates}
        uniqueLocations={uniqueLocations}
        selectedLocation={selectedLocation}
        selectedHour={selectedHour}
        isPlaying={isPlaying}
        hourlySnapshot={hourlySnapshot}
        currentFocus={currentFocus}
        chartData={chartData}
        linkTraffic={linkTraffic} // 追加
        setSelectedLocation={setSelectedLocation}
        setIsPlaying={setIsPlaying}
        setSelectedHour={setSelectedHour}
      />

      {/* スライダーのスタイル定義 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .leaflet-container { background: #f8fafc !important; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 18px; width: 18px; border-radius: 50%; background: #4f46e5; cursor: pointer; border: 2px solid white; box-shadow: 0 0 10px rgba(79, 70, 229, 0.4); }
      `,
        }}
      />
    </div>
  );
};

export default App;
