import { useState, useCallback } from 'react';
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

  useState(() => {
    if (!isActive) return;
    loadShared();
  }, [isActive, loadShared]);

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 bg-[#f9fbf9] dark:bg-slate-950 font-sans text-gray-800 dark:text-slate-100 flex flex-col transition-colors duration-300 overflow-y-auto" dir="ltr">
      
      <style>{`
        :root {
          --c-primary: #fff2d8;    
          --c-secondary: #ead7bb;  
          --c-tertiary: #bca37f;   
          --c-bg: #0f172a;         
          --chart-text: #fff2d8;
        }
        :root.light, .light {
          --c-primary: #113946;    
          --c-secondary: #bca37f;  
          --c-tertiary: #815b5b;   
          --c-bg: #ffffff;         
          --chart-text: #113946;
        }
      `}</style>

      {/* ─── HEADER BAR ─── */}
      <div className="relative z-10 px-8 pt-6 pb-4 border-b border-gray-200 dark:border-slate-800 shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="text-start">
            <h2 className="text-2xl font-black uppercase tracking-wide flex items-center gap-3" style={{ color: 'var(--chart-text)' }}>
              <FolderOpen className="w-7 h-7" style={{ color: 'var(--c-secondary)' }} />
              Shared Files
            </h2>
            <p className="text-xs font-mono mt-1 opacity-80" style={{ color: 'var(--chart-text)' }}>
              Access published layer comparisons and manage system roles.
            </p>
          </div>

          <button
            onClick={loadShared}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-all font-black text-xs shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 relative z-10 p-8 max-w-6xl mx-auto w-full animate-in fade-in duration-500 pb-24">
        
        {error && (
          <div className="mb-8 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/30 rounded-2xl px-5 py-4 flex items-center gap-2 shadow-sm animate-in fade-in duration-500">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
            <span className="text-sm font-black text-red-600 dark:text-red-400">{error}</span>
          </div>
        )}

        {loading && !layers.length && !comparisons.length ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--c-primary)' }} />
              <span className="text-base font-black font-mono" style={{ color: 'var(--chart-text)' }}>Loading shared data...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* ─── SHARED LAYERS SECTION ─── */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 px-2 border-b border-gray-200 dark:border-slate-800 pb-3">
                <Layers className="w-6 h-6" style={{ color: 'var(--c-primary)' }} />
                <h3 className="text-xl font-black uppercase tracking-wide" style={{ color: 'var(--chart-text)' }}>
                  Shared Layers ({layers.length})
                </h3>
              </div>

              {layers.length === 0 ? (
                <div className="bg-white/50 dark:bg-slate-900/30 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl p-12 text-center">
                  <p className="text-sm font-bold opacity-70" style={{ color: 'var(--chart-text)' }}>No shared layers available yet</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {layers.map((layer) => (
                    <div key={layer.Id} className="bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-lg font-black truncate" style={{ color: 'var(--chart-text)' }}>{layer.Layer_Name}</h4>
                          <div className="mt-4 space-y-2.5 text-sm font-medium opacity-80" style={{ color: 'var(--chart-text)' }}>
                            <p className="flex items-center gap-2.5">
                              <User className="w-4 h-4" style={{ color: 'var(--c-secondary)' }} />
                              <span>{layer.creator_name || 'Anonymous User'}</span>
                            </p>
                            <p className="flex items-center gap-2.5">
                              <CalendarDays className="w-4 h-4" style={{ color: 'var(--c-secondary)' }} />
                              <span className="font-mono text-xs">{layer.Classifcation_Start_Date} ← {layer.Classifcation_End_Date}</span>
                            </p>
                          </div>
                        </div>
                        <a
                          href={`https://mahmoudkhaled17.github.io/Gaip_share_front/?id=${layer.Id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black shrink-0 transition-all shadow-md hover:opacity-90 hover:scale-105"
                          style={{ backgroundColor: 'var(--c-primary)', color: 'var(--c-bg)' }}
                        >
                          Open
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ─── COMPARISONS SECTION ─── */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 px-2 border-b border-gray-200 dark:border-slate-800 pb-3">
                <Table2 className="w-6 h-6" style={{ color: 'var(--c-tertiary)' }} />
                <h3 className="text-xl font-black uppercase tracking-wide" style={{ color: 'var(--chart-text)' }}>
                  Seasonal Comparison Reports ({comparisons.length})
                </h3>
              </div>

              {comparisons.length === 0 ? (
                <div className="bg-white/50 dark:bg-slate-900/30 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl p-12 text-center">
                  <p className="text-sm font-bold opacity-70" style={{ color: 'var(--chart-text)' }}>No shared comparison reports available yet</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {comparisons.map((rep) => (
                    <div key={rep.Id} className="bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-lg font-black truncate" style={{ color: 'var(--chart-text)' }}>{rep.Layer_Name}</h4>
                          <div className="mt-4 space-y-2.5 text-sm font-medium opacity-80" style={{ color: 'var(--chart-text)' }}>
                            <p className="flex items-center gap-2.5">
                              <User className="w-4 h-4" style={{ color: 'var(--c-secondary)' }} />
                              <span>{rep.Creator_name || 'Anonymous User'}</span>
                            </p>
                            <p className="flex items-center gap-2.5">
                              <CalendarDays className="w-4 h-4" style={{ color: 'var(--c-secondary)' }} />
                              <span className="font-mono text-xs">{rep.Classification_Start_Date} ← {rep.Classification_End_Date}</span>
                            </p>
                            <p className="flex items-center gap-2.5">
                              <Sprout className="w-4 h-4" style={{ color: 'var(--c-secondary)' }} />
                              <span>{rep.years ? Object.keys(rep.years).length : 0} Seasons Compared</span>
                            </p>
                          </div>
                        </div>
                        <a
                          href={`https://mahmoudkhaled17.github.io/Gaip_share_comparison/?id=${rep.Id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black shrink-0 transition-all shadow-md hover:opacity-90 hover:scale-105"
                          style={{ backgroundColor: 'var(--c-primary)', color: 'var(--c-bg)' }}
                        >
                          Open
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedFiles;