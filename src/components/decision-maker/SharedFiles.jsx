import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw, Layers, Table2, CalendarDays, User, ExternalLink, Sprout, AlertTriangle, FolderOpen } from 'lucide-react';

const SUPABASE_URL = "https://xxsiixjjbsngllmsednu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_jjacI92CPEC94G6pzfs--Q_QC4ubj0j";

const fetchTable = async (table) => {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?select=*&order=Id.desc&limit=50`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
      },
    }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const SharedFiles = ({ isActive }) => {
  const [layers, setLayers] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadShared = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [layersRes, comparisonsRes] = await Promise.all([
        fetchTable('SharedOnelayer'),
        fetchTable('SharedComparison'),
      ]);
      setLayers(layersRes || []);
      setComparisons(comparisonsRes || []);
    } catch (e) {
      console.error(e);
      setError("Failed to load shared data, check your internet connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    loadShared();
  }, [isActive, loadShared]);

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 bg-slate-950 font-sans text-slate-200 overflow-y-auto" dir="ltr">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-black text-slate-100 uppercase tracking-wide">Shared Files</h2>
          </div>
          <button
            onClick={loadShared}
            disabled={loading}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:border-emerald-500/40 hover:text-emerald-400 px-3 py-2 rounded-xl text-[11px] font-bold transition-all disabled:opacity-40 self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-950/40 border border-red-500/30 rounded-2xl p-4 text-xs text-red-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {loading && !layers.length && !comparisons.length ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-sm font-bold">Loading shared data...</p>
          </div>
        ) : (
          <>
            <section className="space-y-3 animate-card">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider">Shared Layers ({layers.length})</h3>
              </div>

              {layers.length === 0 ? (
                <p className="text-[11px] text-slate-600 py-6 text-center font-mono">No shared layers available yet</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {layers.map((layer) => (
                    <div key={layer.Id} className="bg-slate-900/60 border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-4 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-100 truncate">{layer.Layer_Name}</p>
                          <div className="mt-2 space-y-1 text-[10px] text-slate-500 font-mono">
                            <p className="flex items-center gap-1.5">
                              <User className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>{layer.creator_name || 'Anonymous User'}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <CalendarDays className="w-3 h-3 text-cyan-400 shrink-0" />
                              {layer.Classifcation_Start_Date} ← {layer.Classifcation_End_Date}
                            </p>
                          </div>
                        </div>
                        <a
                          href={`https://mahmoudkhaled17.github.io/Gaip_share_front/?id=${layer.Id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-[10px] font-black shrink-0 transition-all"
                        >
                          Open
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3 animate-card" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                <Table2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider">Seasonal Comparison Reports ({comparisons.length})</h3>
              </div>

              {comparisons.length === 0 ? (
                <p className="text-[11px] text-slate-600 py-6 text-center font-mono">No shared comparison reports available yet</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {comparisons.map((rep) => (
                    <div key={rep.Id} className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/30 rounded-2xl p-4 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-100 truncate">{rep.Layer_Name}</p>
                          <div className="mt-2 space-y-1 text-[10px] text-slate-500 font-mono">
                            <p className="flex items-center gap-1.5">
                              <User className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>{rep.Creator_name || 'Anonymous User'}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <CalendarDays className="w-3 h-3 text-cyan-400 shrink-0" />
                              {rep.Classification_Start_Date} ← {rep.Classification_End_Date}
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Sprout className="w-3 h-3 text-amber-400 shrink-0" />
                              {rep.years ? Object.keys(rep.years).length : 0} Seasons
                            </p>
                          </div>
                        </div>
                        <a
                          href={`https://mahmoudkhaled17.github.io/Gaip_share_comparison/?id=${rep.Id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl text-[10px] font-black shrink-0 transition-all"
                        >
                          Open
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default SharedFiles;