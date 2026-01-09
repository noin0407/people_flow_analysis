"use client";

import React from "react";
import {
  Calendar as CalendarIcon,
  Filter,
  Upload,
  Activity,
} from "lucide-react";

import { handleFileUpload } from "@/hooks/handleFileUpload";
import { CrowdData } from "@/types";

interface HeaderProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  availableDates: string[];
  setFileName: (name: string) => void;
  setRawData: (data: CrowdData[]) => void;
  setSelectedLocation: (loc: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

const Header = ({
  selectedDate,
  setSelectedDate,
  availableDates,
  setFileName,
  setRawData,
  setSelectedLocation,
  isSidebarOpen,
  setIsSidebarOpen,
}: HeaderProps) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-[2000] shrink-0 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-200">
          <Activity size={20} />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tighter text-slate-800 leading-none">
            仙台中心街の人流マップ
          </h1>
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">
            Crowd Intelligence Platform
          </p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
          <CalendarIcon size={14} className="text-slate-400" />
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer"
          >
            {availableDates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-full cursor-pointer transition-all text-xs font-bold shadow-md">
          <Upload size={14} />
          <span>CSVインポート</span>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) =>
              handleFileUpload({
                event: e,
                setFileName,
                setRawData,
                setSelectedDate,
                setSelectedLocation,
              })
            }
          />
        </label>
      </div>

      <button
        className="md:hidden p-2 text-slate-500"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Filter size={20} />
      </button>
    </header>
  );
};

export default Header;
