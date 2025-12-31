"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Users, 
  Map as MapIcon, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Search,
  ChevronRight,
  Info,
  Calendar as CalendarIcon,
  Filter,
  Layers,
  Navigation,
  Play,
  Pause,
  Upload,
  FileText,
  Activity,
  Maximize2
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  ReferenceLine 
} from 'recharts';

// --- モックデータの生成 (初期表示用：最新の7列構造に準拠) ---
const generateMockCsvData = () => {
  const data = [];
  const dates = ["2025-01-01", "2025-01-02"];
  const areas = [
    { id: 'jp.sendai.sample.1', name: 'ハピナ名掛丁商店街', lat: 38.261976, lng: 140.880226 },
    { id: 'jp.sendai.sample.2', name: '勾当台公園歴史のゾーン・北', lat: 38.268649, lng: 140.870504 },
  ];
  
  dates.forEach(dateStr => {
    areas.forEach(area => {
      for (let h = 0; h < 24; h++) {
        const hourStr = String(h).padStart(2, '0');
        const count = (Math.random() * 500 + 100);
        data.push({
          dateObservedFrom: `${dateStr}T${hourStr}:00:00+09:00`,
          peopleCount: parseFloat(count.toFixed(2)),
          peopleOccupancy: parseFloat((count / 20).toFixed(4)), // occupancyのスケールを実データに合わせる
          identifcation: area.id,
          locationName: area.name,
          latitude: area.lat,
          longitude: area.lng
        });
      }
    });
  });
  return data;
};

// --- サブコンポーネント: 統計カード ---
const StatCard = ({ title, value, occupancy, icon: Icon, colorClass }) => (
  <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-lg flex items-start justify-between transition-all hover:scale-[1.02] duration-300">
    <div className="flex-1 min-w-0">
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 truncate">{title}</p>
      <h3 className="text-2xl font-black text-slate-800">{value}</h3>
      <div className="flex items-center mt-3 gap-2">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-700 ease-out ${occupancy > 30 ? 'bg-rose-500' : occupancy > 10 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
            style={{ width: `${Math.min(occupancy * 2, 100)}%` }}
          ></div>
        </div>
        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">指数: {occupancy.toFixed(2)}</span>
      </div>
    </div>
    <div className={`p-3 rounded-xl ${colorClass} text-white shadow-lg ml-3 flex-shrink-0 animate-pulse-slow`}>
      <Icon size={20} />
    </div>
  </div>
);

// --- メインコンポーネント ---
const App = () => {
  const [rawData, setRawData] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [selectedDate, setSelectedDate] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileName, setFileName] = useState("loading...");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const layersRef = useRef({});

  // 1. 初期データのセットアップ
  useEffect(() => {
    const initialData = generateMockCsvData();
    setRawData(initialData);
    setSelectedDate("2025-01-01");
    setSelectedLocation("ハピナ名掛丁商店街");
    setFileName("initial_sample.csv");
  }, []);

  // 2. Leaflet地図の初期化
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initMap = () => {
      if (typeof L === 'undefined') return setTimeout(initMap, 100);
      if (!leafletMap.current && mapRef.current) {
        leafletMap.current = L.map(mapRef.current, { 
          zoomControl: false,
          attributionControl: false 
        }).setView([38.263, 140.875], 14);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19
        }).addTo(leafletMap.current);
        
        L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);
      }
    };

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = initMap;
    document.head.appendChild(script);

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // 3. データ集計
  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(rawData.map(d => d.dateObservedFrom?.split('T')[0])));
    return dates.filter(Boolean).sort();
  }, [rawData]);

  const filteredDataByDate = useMemo(() => {
    if (!selectedDate) return [];
    return rawData.filter(d => d.dateObservedFrom?.startsWith(selectedDate));
  }, [rawData, selectedDate]);

  const uniqueLocations = useMemo(() => {
    const locs = [];
    const seen = new Set();
    filteredDataByDate.forEach(d => {
      if (!seen.has(d.locationName)) {
        seen.add(d.locationName);
        locs.push({ name: d.locationName, lat: d.latitude, lng: d.longitude });
      }
    });
    return locs;
  }, [filteredDataByDate]);

  const hourlySnapshot = useMemo(() => {
    return filteredDataByDate.filter(d => {
      const date = new Date(d.dateObservedFrom);
      return !isNaN(date.getTime()) && date.getHours() === selectedHour;
    });
  }, [filteredDataByDate, selectedHour]);

  const currentFocus = useMemo(() => {
    return hourlySnapshot.find(d => d.locationName === selectedLocation) || hourlySnapshot[0] || {};
  }, [hourlySnapshot, selectedLocation]);

  const chartData = useMemo(() => {
    return filteredDataByDate
      .filter(d => d.locationName === selectedLocation)
      .map(d => ({
        time: `${new Date(d.dateObservedFrom).getHours()}:00`,
        count: d.peopleCount,
        hourValue: new Date(d.dateObservedFrom).getHours()
      }))
      .sort((a, b) => a.hourValue - b.hourValue);
  }, [filteredDataByDate, selectedLocation]);

  // 4. 地図描画
  useEffect(() => {
    if (!leafletMap.current || typeof L === 'undefined') return;

    Object.values(layersRef.current).forEach(layer => {
      if (layer && leafletMap.current.hasLayer(layer)) leafletMap.current.removeLayer(layer);
    });
    layersRef.current = {};

    hourlySnapshot.forEach(point => {
      // 指数の閾値を実データ(10〜40程度)に合わせて調整
      const color = point.peopleOccupancy > 30 ? '#f43f5e' : point.peopleOccupancy > 10 ? '#f59e0b' : '#10b981';
      const radius = 20 + (Math.sqrt(point.peopleCount) * 10); 

      try {
        const circle = L.circle([point.latitude, point.longitude], {
          color: color,
          fillColor: color,
          fillOpacity: 0.6,
          weight: 2,
          radius: Math.min(radius, 1000)
        }).addTo(leafletMap.current);

        const popupContent = `
          <div style="font-family: sans-serif; min-width: 180px; padding: 5px;">
            <b style="font-size: 14px; display: block; margin-bottom: 4px;">${point.locationName}</b>
            <span style="color: #64748b; font-size: 11px;">${selectedHour}:00 時点</span>
            <div style="margin-top: 8px; font-weight: 800; font-size: 20px; color: #1e293b;">
              ${Math.round(point.peopleCount).toLocaleString()} <small style="font-size: 11px;">人</small>
            </div>
            <div style="font-size: 10px; color: ${color}; font-weight: bold; margin-top: 4px; border-top: 1px solid #f1f5f9; padding-top: 4px;">
              混雑指数: ${point.peopleOccupancy.toFixed(3)}
            </div>
            <div style="font-size: 8px; color: #94a3b8; margin-top: 6px; white-space: normal; line-height: 1.2;">
              ID: ${point.identifcation}
            </div>
          </div>
        `;
        circle.bindPopup(popupContent);
        
        if (point.locationName === selectedLocation) {
          circle.setStyle({ weight: 4, color: '#4f46e5', fillOpacity: 0.85 });
        }

        layersRef.current[point.locationName] = circle;
      } catch (err) { console.error(err); }
    });
  }, [hourlySnapshot, selectedLocation, selectedHour]);

  // 5. 再生コントロール
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setSelectedHour(prev => (prev + 1) % 24);
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // CSVラインパース関数
  const parseCSVLine = (line) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim().replace(/^"|"$/g, ''));
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim().replace(/^"|"$/g, ''));
    return result;
  };

  // 6. CSVアップロード (最新の順序に対応)
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length < 2) return;

      const rows = lines.slice(1);
      
      const parsed = rows.map(row => {
        const cols = parseCSVLine(row);
        
        // 期待される列順 (最新ファイル):
        // [0]dateObservedFrom, [1]peopleCount, [2]peopleOccupancy, [3]identifcation, [4]locationName, [5]latitude, [6]longitude
        if (cols.length < 7) return null;

        return {
          dateObservedFrom: cols[0],
          peopleCount: parseFloat(cols[1]) || 0,
          peopleOccupancy: parseFloat(cols[2]) || 0,
          identifcation: cols[3],
          locationName: cols[4],
          latitude: parseFloat(cols[5]),
          longitude: parseFloat(cols[6]),
        };
      }).filter(r => r && !isNaN(r.latitude) && !isNaN(r.longitude));
      
      if (parsed.length > 0) {
        setRawData(parsed);
        const dates = Array.from(new Set(parsed.map(d => d.dateObservedFrom?.split('T')[0]))).filter(Boolean).sort();
        if (dates.length > 0) setSelectedDate(dates[0]);
        if (parsed[0]) {
          setSelectedLocation(parsed[0].locationName);
          if (leafletMap.current) leafletMap.current.flyTo([parsed[0].latitude, parsed[0].longitude], 14);
        }
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* ヘッダー */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-[2000] shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-200">
            <Activity size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter text-slate-800 leading-none">SENDAI FLOW</h1>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Crowd Intelligence Platform</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            <CalendarIcon size={14} className="text-slate-400" />
            <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer">
              {availableDates.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-full cursor-pointer transition-all text-xs font-bold shadow-md">
            <Upload size={14} />
            <span>CSVインポート</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
        
        <button className="md:hidden p-2 text-slate-500" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <Filter size={20} />
        </button>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 flex overflow-hidden relative">
        <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 absolute lg:relative z-[1500] w-72 h-full bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out`}>
          <div className="p-6 overflow-y-auto flex-1 space-y-8">
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <FileText size={12} /> Data Status
              </h4>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-600 truncate mb-1" title={fileName}>{fileName}</p>
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
                <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[8px]">{uniqueLocations.length} locations</span>
              </h4>
              <div className="space-y-2">
                {uniqueLocations.map(loc => (
                  <button
                    key={loc.name}
                    onClick={() => {
                      setSelectedLocation(loc.name);
                      if (leafletMap.current) leafletMap.current.panTo([loc.lat, loc.lng]);
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all border ${
                      selectedLocation === loc.name 
                        ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200 shadow-sm' 
                        : 'bg-white border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`text-xs font-bold truncate ${selectedLocation === loc.name ? 'text-indigo-700' : 'text-slate-600'}`}>
                      {loc.name}
                    </span>
                    <ChevronRight size={14} className={selectedLocation === loc.name ? 'text-indigo-400' : 'text-slate-300'} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1 flex flex-col relative bg-slate-100">
          <div className="flex-1 relative">
            <div ref={mapRef} className="absolute inset-0 z-0" />
            <div className="absolute top-6 left-6 z-[1000] w-full max-w-[320px] pointer-events-none">
              <div className="pointer-events-auto space-y-4">
                <StatCard 
                  title={selectedLocation || '地点未選択'} 
                  value={`${Math.round(currentFocus.peopleCount || 0).toLocaleString()} 人`}
                  occupancy={currentFocus.peopleOccupancy || 0}
                  icon={Users}
                  colorClass="bg-indigo-600"
                />
              </div>
            </div>

            <div className="absolute top-6 right-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl hidden lg:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b pb-2">Intensity Legend</p>
              <div className="space-y-2.5">
                {[
                  { label: '混雑 (Index > 30)', color: 'bg-rose-500' },
                  { label: '通常 (Index 10-30)', color: 'bg-amber-500' },
                  { label: '緩和 (Index < 10)', color: 'bg-emerald-500' }
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}></div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border-t border-slate-200 p-6 z-[1001] shadow-2xl">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
              <div className="lg:w-1/4 flex flex-col justify-center space-y-4 pr-0 lg:pr-8 border-r-0 lg:border-r border-slate-100">
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsPlaying(!isPlaying)} className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-all shadow-xl active:scale-95 group">
                    {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                  </button>
                  <div>
                    <span className="text-3xl font-black text-slate-800 font-mono tracking-tight">{String(selectedHour).padStart(2, '0')}:00</span>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Sequence</p>
                  </div>
                </div>
                <input type="range" min="0" max="23" value={selectedHour} onChange={(e) => setSelectedHour(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
              </div>

              <div className="flex-1 h-32 lg:h-40">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={12} className="text-indigo-600" />
                    24-Hour Flow Analysis: <span className="text-slate-700">{selectedLocation}</span>
                  </h5>
                  <div className="flex gap-4 text-[9px] font-bold text-slate-400 uppercase">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> 人数</div>
                    <div className="flex items-center gap-1.5"><div className="w-1 h-3 bg-amber-400/50"></div> 現在時刻</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 600}} interval={3}/>
                    <Tooltip contentStyle={{backgroundColor: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '11px', fontWeight: 'bold'}} formatter={(val) => [`${Math.round(val)}人`, '歩行者数']}/>
                    <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fill="url(#colorCount)" animationDuration={500} />
                    <ReferenceLine x={`${selectedHour}:00`} stroke="#fbbf24" strokeWidth={3} strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        .animate-pulse-slow { animation: pulse-slow 3s infinite ease-in-out; }
        .leaflet-container { background: #f8fafc !important; }
        .leaflet-popup-content-wrapper { border-radius: 12px !important; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1) !important; border: 1px solid #e2e8f0 !important; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 18px; width: 18px; border-radius: 50%; background: #4f46e5; cursor: pointer; box-shadow: 0 0 10px rgba(79, 70, 229, 0.4); border: 2px solid white; }
      `}} />
    </div>
  );
};

export default App;