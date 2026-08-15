import React from 'react';
import { Link } from 'react-router-dom';
import { Map, BarChart3, Target, Shield, FolderOpen, FileWarning, Compass, BookOpen } from 'lucide-react';

const TabsNav = ({ activeTab, setActiveTab }) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 px-6 flex gap-2 z-50 font-sans relative overflow-x-auto">
      <button
        onClick={() => setActiveTab('intelligence')}
        className={`flex items-center gap-2 px-6 py-3.5 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
          activeTab === 'intelligence' 
            ? 'border-b-2 border-emerald-500 [.light_&]:border-[#022A06] text-emerald-400 [.light_&]:text-[#022A06] bg-slate-950/20' 
            : 'text-slate-400 [.light_&]:text-[#022A06]/70 hover:text-slate-200 [.light_&]:hover:text-[#022A06] hover:bg-slate-850/40'
        }`}
      >
        <Map className="w-4 h-4 text-emerald-450 [.light_&]:text-[#022A06]" />
        Intelligence Center
      </button>

      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex items-center gap-2 px-6 py-3.5 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
          activeTab === 'dashboard' 
            ? 'border-b-2 border-emerald-500 [.light_&]:border-[#022A06] text-emerald-400 [.light_&]:text-[#022A06] bg-slate-950/20' 
            : 'text-slate-400 [.light_&]:text-[#022A06]/70 hover:text-slate-200 [.light_&]:hover:text-[#022A06] hover:bg-slate-850/40'
        }`}
      >
        <BarChart3 className="w-4 h-4 text-emerald-450 [.light_&]:text-[#022A06]" />
        Performance Dashboard
      </button>

      <button
        onClick={() => setActiveTab('prediction')}
        className={`flex items-center gap-2 px-6 py-3.5 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
          activeTab === 'prediction' 
            ? 'border-b-2 border-emerald-500 [.light_&]:border-[#022A06] text-emerald-400 [.light_&]:text-[#022A06] bg-slate-950/20' 
            : 'text-slate-400 [.light_&]:text-[#022A06]/70 hover:text-slate-200 [.light_&]:hover:text-[#022A06] hover:bg-slate-850/40'
        }`}
      >
        <Target className="w-4 h-4 text-emerald-450 [.light_&]:text-[#022A06]" />
        Government Projects
      </button>

      <button
        onClick={() => setActiveTab('management')}
        className={`flex items-center gap-2 px-6 py-3.5 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
          activeTab === 'management' 
            ? 'border-b-2 border-emerald-500 [.light_&]:border-[#022A06] text-emerald-400 [.light_&]:text-[#022A06] bg-slate-950/20' 
            : 'text-slate-400 [.light_&]:text-[#022A06]/70 hover:text-slate-200 [.light_&]:hover:text-[#022A06] hover:bg-slate-850/40'
        }`}
      >
        <Shield className="w-4 h-4 text-emerald-450 [.light_&]:text-[#022A06]" />
        System Controls
      </button>

      <button
        onClick={() => setActiveTab('shared')}
        className={`flex items-center gap-2 px-6 py-3.5 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
          activeTab === 'shared' 
            ? 'border-b-2 border-emerald-500 [.light_&]:border-[#022A06] text-emerald-400 [.light_&]:text-[#022A06] bg-slate-950/20' 
            : 'text-slate-400 [.light_&]:text-[#022A06]/70 hover:text-slate-200 [.light_&]:hover:text-[#022A06] hover:bg-slate-850/40'
        }`}
      >
        <FolderOpen className="w-4 h-4 text-emerald-450 [.light_&]:text-[#022A06]" />
        Shared Files
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
        Complaints
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
        Documentation
      </button>
      
      <div className="border-l border-slate-700 mx-2 h-6 self-center"></div>

      <Link 
        to="/iot-simulator"
        className="flex items-center gap-2 px-6 py-3.5 font-bold text-xs uppercase tracking-wider transition-all text-slate-400 [.light_&]:text-[#022A06]/70 hover:text-slate-200 [.light_&]:hover:text-[#022A06] hover:bg-slate-850/40 whitespace-nowrap"
      >
        <Compass className="w-4 h-4" />
        IoT Simulator
      </Link>
    </div>
  );
};

export default TabsNav;