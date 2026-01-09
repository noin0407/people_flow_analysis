import React from "react";

interface StatCardProps {
  title: string,
  value: number|number,
  occupancy: number,
  icon: React.ElementType,
  colorClass:string,
};

// --- サブコンポーネント: 統計カード ---
const StatCard : React.FC<StatCardProps>= ({ title, value, occupancy, icon: Icon, colorClass }) => (
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

export default StatCard;
