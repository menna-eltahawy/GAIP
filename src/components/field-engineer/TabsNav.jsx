import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, BarChart4, FileWarning, Compass, BookOpen } from 'lucide-react';

const TabsNav = ({ activeTab, setActiveTab, lang }) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 px-6 flex gap-2 z-40 font-sans overflow-x-auto">
      <button
        onClick={() => setActiveTab('sensors')}
        className={`flex items-center gap-2 px-6 py-3.5 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
          activeTab === 'sensors' 
            ? 'border-b-2 border-emerald-500 [.light_&]:border-[#022A06] text-emerald-400 [.light_&]:text-[#022A06] bg-slate-950/20' 
            : 'text-slate-400 [.light_&]:text-[#022A06]/70 hover:text-slate-200 [.light_&]:hover:text-[#022A06] hover:bg-slate-850/40'
        }`}
      >
        <Radio className="w-4 h-4 text-emerald-450 [.light_&]:text-[#022A06]" />
        {lang === 'en' ? 'Sensor Network & Ops' : 'شبكة الحساسات والعمليات'}
      </button>

      <button
        onClick={() => setActiveTab('soil-dashboard')}
        className={`flex items-center gap-2 px-6 py-3.5 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
          activeTab === 'soil-dashboard' 
            ? 'border-b-2 border-emerald-500 [.light_&]:border-[#022A06] text-emerald-400 [.light_&]:text-[#022A06] bg-slate-950/20' 
            : 'text-slate-400 [.light_&]:text-[#022A06]/70 hover:text-slate-200 [.light_&]:hover:text-[#022A06] hover:bg-slate-850/40'
        }`}
      >
        <BarChart4 className="w-4 h-4 text-emerald-450 [.light_&]:text-[#022A06]" />
        {lang === 'en' ? 'Soil Analytics' : 'تحليلات التربة'}
      </button>

      <button
        onClick={() => setActiveTab('complaints')}
        className={`flex items-center gap-2 px-6 py-3.5 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
          activeTab === 'complaints' 
            ? 'border-b-2 border-violet-500 [.light_&]:border-[#022A06] text-violet-400 [.light_&]:text-[#022A06] bg-slate-950/20' 
            : 'text-slate-400 [.light_&]:text-[#022A06]/70 hover:text-slate-200 [.light_&]:hover:text-[#022A06] hover:bg-slate-850/40'
        }`}
      >
        <FileWarning className="w-4 h-4 text-violet-450 [.light_&]:text-[#022A06]" />
        {lang === 'en' ? 'Farmer Complaints' : 'بلاغات المزارعين'}
      </button>

      <button
        onClick={() => setActiveTab('docs')}
        className={`flex items-center gap-2 px-6 py-3.5 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
          activeTab === 'docs' 
            ? 'border-b-2 border-emerald-500 [.light_&]:border-[#022A06] text-emerald-400 [.light_&]:text-[#022A06] bg-slate-950/20' 
            : 'text-slate-400 [.light_&]:text-[#022A06]/70 hover:text-slate-200 [.light_&]:hover:text-[#022A06] hover:bg-slate-850/40'
        }`}
      >
        <BookOpen className="w-4 h-4 text-emerald-450 [.light_&]:text-[#022A06]" />
        {lang === 'en' ? 'Documentation' : 'دليل الاستخدام'}
      </button>

      <div className="border-l border-slate-700 mx-2 h-6 self-center"></div>

      <Link 
        to="/iot-simulator"
        className="flex items-center gap-2 px-6 py-3.5 font-bold text-xs uppercase tracking-wider transition-all text-slate-400 [.light_&]:text-[#022A06]/70 hover:text-slate-200 [.light_&]:hover:text-[#022A06] hover:bg-slate-850/40 whitespace-nowrap"
      >
        <Compass className="w-4 h-4" />
        {lang === 'en' ? 'IoT Simulator' : 'محاكي إنترنت الأشياء'}
      </Link>
    </div>
  );
};

export default TabsNav;