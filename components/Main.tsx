"use client";

import React from "react";
import { useState, useMemo } from "react";

import {
  Users,
  TrendingUp,
  ChevronRight,
  Play,
  Pause,
  FileText,
} from "lucide-react";
import {
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
} from "recharts";

import MapView from "./MapView";
import StatCard from "./StatCard";
import { CrowdData } from "@/types";

import {
  CalculatedLinkVolume,
  PointData,
  calculateGravityModelVolumes,
} from "@/hooks/calculateGravityModelVolumes";
import GravityLinkLayer from "./GravityLinkLayer";
import dummyLink from "@/samples/dummyLink.json";
import { LinkTraffic } from "@/hooks/useCrowdData";

interface MainProps {
  // ステート
  isSidebarOpen: boolean;
  fileName: string;
  rawData: CrowdData[];
  availableDates: string[];
  uniqueLocations: { name: string; lat: number; lng: number }[];
  selectedLocation: string;
  selectedHour: number;
  isPlaying: boolean;
  hourlySnapshot: CrowdData[];
  currentFocus: Partial<CrowdData>;
  chartData: { time: string; count: number; hourValue: number }[];
  linkTraffic: LinkTraffic[];

  // セット関数
  setSelectedLocation: (loc: string) => void;
  setIsPlaying: (playing: boolean) => void;
  setSelectedHour: (hour: number) => void;
}

export const Main = ({
  isSidebarOpen,
  fileName,
  rawData,
  availableDates,
  uniqueLocations,
  selectedLocation,
  selectedHour,
  isPlaying,
  hourlySnapshot,
  currentFocus,
  chartData,
  setSelectedLocation,
  setIsPlaying,
  setSelectedHour,
}: MainProps) => {
  // 場所を選択した時の処理
  const handleLocationClick = (loc: {
    name: string;
    lat: number;
    lng: number;
  }) => {
    setSelectedLocation(loc.name);
    // ここで leafletMap.current.panTo を直接呼ばず、
    // selectedLocation が変わったことを MapView が検知して動くようにします。
  };

  // --- 修正箇所：useState と useEffect をこれに置き換える ---
  const linkVolumes = useMemo(() => {
    if (!hourlySnapshot || hourlySnapshot.length === 0) return [];

    const currentPoints: PointData[] = hourlySnapshot.map((d) => ({
      // ここを CSV のカラム名に厳密に合わせる
      id: d.locationName,
      lat: d.latitude,
      lng: d.longitude,
      people: d.peopleCount,
    }));

    return calculateGravityModelVolumes(
      currentPoints,
      dummyLink, // インポートした新しいリンクデータ
      { k: 100, n: 0.5, minD: 100 } // kの値は表示を見て調整してください
    );
  }, [hourlySnapshot]); // hourlySnapshot が変わった時だけ再計算される

  return (
    <main className="flex-1 flex overflow-hidden relative">
      <aside
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 absolute lg:relative z-[1500] w-72 h-full bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out`}
      >
        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <FileText size={12} /> Data Status
            </h4>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p
                className="text-xs font-bold text-slate-600 truncate mb-1"
                title={fileName}
              >
                {fileName}
              </p>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
                <span>{rawData.length.toLocaleString()} points</span>
                <span>•</span>
                <span>{availableDates.length} days</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex justify-between items-center">
              <span>Location Analysis</span>
              <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[8px]">
                {uniqueLocations.length} locations
              </span>
            </h4>
            <div className="space-y-2">
              {uniqueLocations.map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => handleLocationClick(loc)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all border ${
                    selectedLocation === loc.name
                      ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200 shadow-sm"
                      : "bg-white border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`text-xs font-bold truncate ${
                      selectedLocation === loc.name
                        ? "text-indigo-700"
                        : "text-slate-600"
                    }`}
                  >
                    {loc.name}
                  </span>
                  <ChevronRight
                    size={14}
                    className={
                      selectedLocation === loc.name
                        ? "text-indigo-400"
                        : "text-slate-300"
                    }
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <section className="flex-1 flex flex-col relative bg-slate-100">
        <div className="flex-1 relative">
          <MapView
            hourlySnapshot={hourlySnapshot}
            selectedLocation={selectedLocation}
            selectedHour={selectedHour}
            rawData={rawData}
            linkVolumes={linkVolumes}
          />
          <div className="absolute top-6 left-6 z-[1000] w-full max-w-[320px] pointer-events-none">
            <div className="pointer-events-auto space-y-4">
              <StatCard
                title={selectedLocation || "地点未選択"}
                value={Math.round(currentFocus.peopleCount || 0)}
                occupancy={currentFocus.peopleOccupancy || 0}
                icon={Users}
                colorClass="bg-indigo-600"
              />
            </div>
          </div>

          <div className="absolute top-6 right-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl hidden lg:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b pb-2">
              Intensity Legend
            </p>
            <div className="space-y-2.5">
              {[
                { label: "混雑 (Index > 30)", color: "bg-rose-500" },
                { label: "通常 (Index 10-30)", color: "bg-amber-500" },
                { label: "緩和 (Index < 10)", color: "bg-emerald-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${item.color}`}
                  ></div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border-t border-slate-200 p-6 z-[1001] shadow-2xl">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/4 flex flex-col justify-center space-y-4 pr-0 lg:pr-8 border-r-0 lg:border-r border-slate-100">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-all shadow-xl active:scale-95 group"
                >
                  {isPlaying ? (
                    <Pause size={28} fill="currentColor" />
                  ) : (
                    <Play size={28} fill="currentColor" className="ml-1" />
                  )}
                </button>
                <div>
                  <span className="text-3xl font-black text-slate-800 font-mono tracking-tight">
                    {String(selectedHour).padStart(2, "0")}:00
                  </span>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Time Sequence
                  </p>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="23"
                value={selectedHour}
                onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="flex-1 h-32 lg:h-40">
              <div className="flex justify-between items-center mb-3">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={12} className="text-indigo-600" />
                  24-Hour Flow Analysis:{" "}
                  <span className="text-slate-700">{selectedLocation}</span>
                </h5>
                <div className="flex gap-4 text-[9px] font-bold text-slate-400 uppercase">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>{" "}
                    人数
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-3 bg-amber-400/50"></div> 現在時刻
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 600 }}
                    interval={3}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      fontSize: "11px",
                      fontWeight: "bold",
                    }}
                    formatter={(value) => {
                      const numericValue = Number(value);
                      if (isNaN(numericValue)) return ["-", "歩行者数"];
                      return [
                        `${Math.round(numericValue).toLocaleString()}人`,
                        "歩行者数",
                      ];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fill="url(#colorCount)"
                    animationDuration={500}
                  />
                  <ReferenceLine
                    x={`${selectedHour}:00`}
                    stroke="#fbbf24"
                    strokeWidth={3}
                    strokeDasharray="4 4"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Main;
