import React, { useEffect, useState, useRef } from 'react';
import api from '../../api/axiosConfig';
import { MapContainer, TileLayer, Polygon, ImageOverlay, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Loader2, 
  RefreshCw, 
  Calendar, 
  Activity, 
  Table,
  Sparkles,
  Share2,
  Copy,
  ExternalLink,
  CheckCircle2,
  Languages
} from 'lucide-react';

const T = {
  en: {
    headerTitle: "Historical Statistical Comparison",
    headerDesc: "Multi-diagram spatial analysis comparing 3 years temporal changes and vegetation indexes",
    refresh: "Refresh",
    shareReport: "Share Report",
    published: "Report Published — Public Link:",
    awaitingTitle: "Awaiting Field Classification",
    awaitingDesc: "Please draw a field boundary in the Intelligence Center and click 'Calculate Crop Map' to generate historical analytics.",
    loading: "Fetching multi-year spatial grids...",
    cropStructure: "Crop Structure & Area",
    vegHealth: "Vegetation Health (NDVI)",
    changeProd: "Change & Productivity (3 Years)",
    cropQuality: "Crop Quality (NDVI)",
    agriFootprint: "Agricultural Footprint (Feddan)",
    wheat: "Wheat",
    corn: "Corn",
    nonAgri: "Non-Agri",
    excellent: "Excellent",
    moderate: "Moderate",
    poor: "Poor",
    season: "Season",
    index: "Index",
    totalF: "Total (F)",
    agri: "Agri",
    fluctuation: "Fluctuation",
    contextMap: "Context Map",
    classification: "Classification",
    health: "Health",
    noData: "NO DATA",
    promptName: "Report Name (Layer Name):",
    errorFetch: "Failed to fetch historical comparison data. Verify your python server connection.",
    errorShare: "Failed to share report: ",
  },
  ar: {
    headerTitle: "المقارنة الإحصائية التاريخية",
    headerDesc: "تحليل مكاني متعدد الرسوم البيانية لمقارنة التغيرات الزمنية ومؤشرات الغطاء النباتي لـ 3 سنوات",
    refresh: "تحديث",
    shareReport: "مشاركة التقرير",
    published: "تم نشر التقرير — الرابط العام:",
    awaitingTitle: "بانتظار تصنيف الحقول",
    awaitingDesc: "يرجى رسم حدود حقل والضغط على 'Calculate Crop Map' لتغذية هذه اللوحة التاريخية وتحليل التقلبات المقارنة.",
    loading: "جارٍ جلب البيانات الفضائية للسنوات السابقة...",
    cropStructure: "هيكل المحاصيل والمساحة",
    vegHealth: "صحة النبات (NDVI)",
    changeProd: "التغير والإنتاجية (3 سنوات)",
    cropQuality: "جودة المحاصيل (NDVI)",
    agriFootprint: "الرقعة الزراعية الكلية (فدان)",
    wheat: "قمح",
    corn: "ذرة",
    nonAgri: "غير زراعي",
    excellent: "ممتاز",
    moderate: "متوسط",
    poor: "ضعيف",
    season: "موسم",
    index: "المؤشر",
    totalF: "الكل (ف)",
    agri: "زراعي",
    fluctuation: "التذبذب",
    contextMap: "الخريطة التفاعلية",
    classification: "التصنيف",
    health: "الصحة",
    noData: "لا توجد بيانات",
    promptName: "اسم التقرير (Layer Name):",
    errorFetch: "فشل جلب بيانات المقارنة التاريخية. تحقق من اتصال الخادم.",
    errorShare: "فشل مشاركة التقرير: ",
  }
};

const PerformanceDashboard = ({ isActive, sharedMetadata }) => {
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);
  const [cropTypePreview, setCropTypePreview] = useState(null);
  const [cropHealthPreview, setCropHealthPreview] = useState(null);
  const [activeLayer, setActiveLayer] = useState('crop_type');
  const [selectedYear, setSelectedYear] = useState(null);
  const [yearTiles, setYearTiles] = useState({});

  const [shareLoading, setShareLoading] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);
  
  const [lang, setLang] = useState('en');
  const t = (key) => T[lang][key] || key;

  const lastFetchedMetadataRef = useRef(null);

  const deltaCenter = [30.565, 30.932];
  const dummyPolygon = [
    [30.5814, 30.9212],
    [30.5789, 30.9177],
    [30.5750, 30.9250],
    [30.5814, 30.9212]
  ];

  const fetchComparisonData = async () => {
    if (!sharedMetadata) return;
    
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const payload = {
        testStartDate: sharedMetadata.testStartDate,
        testEndDate: sharedMetadata.testEndDate,
        geometry: sharedMetadata.geometry
      };

      const [compareResponse, classifyResponse] = await Promise.all([
        api.post(`/api/compare`, payload, { headers }),
        api.post(`/api/classify`, payload, { headers })
      ]);

      const classifyData = classifyResponse.data;
      if (classifyData?.crop_type_thumbnail_b64) setCropTypePreview(`data:image/png;base64,${classifyData.crop_type_thumbnail_b64}`);
      if (classifyData?.crop_health_thumbnail_b64) setCropHealthPreview(`data:image/png;base64,${classifyData.crop_health_thumbnail_b64}`);

      if (compareResponse.data?.status === "success") {
        setChartData(compareResponse.data.comparison_report);
        const report = compareResponse.data.comparison_report || {};
        const tiles = {};
        Object.entries(report).forEach(([key, value]) => {
          if (value?.maps_urls) tiles[key.replace('Year_', '')] = value.maps_urls;
        });
        setYearTiles(tiles);
        const years = Object.keys(tiles);
        if (years.length > 0) {
          setSelectedYear([...years].sort((a, b) => parseInt(b) - parseInt(a))[0]);
        }
        lastFetchedMetadataRef.current = { ...sharedMetadata };
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error(err);
      setError(t('errorFetch'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isActive) return;
    if (!sharedMetadata) return;

    const paramsChanged = !lastFetchedMetadataRef.current ||
      lastFetchedMetadataRef.current.testStartDate !== sharedMetadata.testStartDate ||
      lastFetchedMetadataRef.current.testEndDate !== sharedMetadata.testEndDate ||
      JSON.stringify(lastFetchedMetadataRef.current.geometry) !== JSON.stringify(sharedMetadata.geometry);

    if (paramsChanged) {
      fetchComparisonData();
    }
  }, [isActive, sharedMetadata]);

  const MapController = ({ center, zoom, bounds }) => {
    const map = useMap();
    useEffect(() => {
      if (bounds) {
        map.fitBounds(bounds, { padding: [20, 20], maxZoom: 16, animate: true });
      } else if (center) {
        map.setView(center, zoom, { animate: true });
      }
    }, [center, zoom, bounds, map]);
    return null;
  };

  const handleShareComparison = async () => {
    if (!chartData || !sharedMetadata) return;
    const layerName = window.prompt(t('promptName'), `${sharedMetadata.testStartDate}_${sharedMetadata.testEndDate}_Comparison`);
    if (!layerName) return;

    setShareLoading(true);
    setShareLink(null);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      const geometry = sharedMetadata.geometry || [];

      const res = await api.post(`/share/compare/save`, {
        Creator_Email: userInfo.email,
        Layer_Name: layerName,
        Classification_Start_Date: sharedMetadata.testStartDate,
        Classification_End_Date: sharedMetadata.testEndDate,
        years: chartData,
        bounds: geometry.length > 0 ? [
          [Math.min(...geometry.map(p => p[1])), Math.min(...geometry.map(p => p[0]))],
          [Math.max(...geometry.map(p => p[1])), Math.max(...geometry.map(p => p[0]))]
        ] : null
      }, { headers });

      setShareLink(`https://mahmoudkhaled17.github.io/Gaip_share_comparison/?id=${res.data.Id}`);
      setShareCopied(false);
    } catch (err) {
      console.error(err);
      alert(t('errorShare') + (err.response?.data?.detail || "Unexpected error"));
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyShareLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  const getPolygonCenter = (geoCoords) => {
    if (!geoCoords || geoCoords.length === 0) return deltaCenter;
    let latSum = 0, lngSum = 0;
    geoCoords.forEach(p => {
      lngSum += p[0];
      latSum += p[1];
    });
    return [latSum / geoCoords.length, lngSum / geoCoords.length];
  };

  const hasGeometry = sharedMetadata?.geometry && sharedMetadata.geometry.length > 0;
  const currentCenter = hasGeometry ? getPolygonCenter(sharedMetadata.geometry) : deltaCenter;
  const currentZoom = hasGeometry ? 15 : 13;
  const mapBounds = hasGeometry ? [
    [Math.min(...sharedMetadata.geometry.map(p => p[1])), Math.min(...sharedMetadata.geometry.map(p => p[0]))],
    [Math.max(...sharedMetadata.geometry.map(p => p[1])), Math.max(...sharedMetadata.geometry.map(p => p[0]))]
  ] : null;

  const getProcessedData = () => {
    if (!chartData) return [];
    
    return Object.entries(chartData)
      .map(([key, value]) => {
        const year = key.replace('Year_', '');
        const wheat = value.crop_areas_feddans?.Wheat_1 || 0;
        const corn = value.crop_areas_feddans?.Corn_0 || 0;
        const nonAgri = value.crop_areas_feddans?.Non_agricultural_2 || 0;
        
        const totalArea = wheat + corn + nonAgri;
        const agriArea = wheat + corn;

        const highH = value.crop_health_feddans?.High_Quality_Green || 0;
        const medH = value.crop_health_feddans?.Medium_Quality_Yellow || 0;
        const lowH = value.crop_health_feddans?.Low_Quality_Red || 0;
        const totalVeg = highH + medH + lowH || 1;
        const healthIndex = Math.round(((highH * 100) + (medH * 60) + (lowH * 20)) / totalVeg);

        const wheatYield = wheat * 2.8;
        const cornYield = corn * 3.5;
        const totalYield = wheatYield + cornYield;

        return {
          name: year,
          wheat: parseFloat(wheat.toFixed(1)),
          corn: parseFloat(corn.toFixed(1)),
          nonAgri: parseFloat(nonAgri.toFixed(1)),
          totalArea: parseFloat(totalArea.toFixed(1)),
          agriArea: parseFloat(agriArea.toFixed(1)),
          healthIndex: healthIndex,
          highH: parseFloat(highH.toFixed(1)),
          medH: parseFloat(medH.toFixed(1)),
          lowH: parseFloat(lowH.toFixed(1)),
          wheatYield: Math.round(wheatYield),
          cornYield: Math.round(cornYield),
          totalYield: Math.round(totalYield)
        };
      })
      .sort((a, b) => parseInt(a.name) - parseInt(b.name));
  };

  const formattedChartData = getProcessedData();
  const yearList = Object.keys(yearTiles).sort((a, b) => parseInt(b) - parseInt(a));

  const calculateFluctuations = () => {
    if (formattedChartData.length === 0) return [];

    const report = [];
    for (let i = 0; i < formattedChartData.length; i++) {
      const curr = formattedChartData[i];
      let diffText = '—';
      let type = 'neutral';

      if (i > 0) {
        const prev = formattedChartData[i - 1];
        const prevYield = prev.totalYield || 1;
        const diff = ((curr.totalYield - prev.totalYield) / prevYield) * 100;
        
        diffText = diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
        type = diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral';
      }

      report.push({
        year: curr.name,
        totalArea: curr.totalArea,
        agriArea: curr.agriArea,
        wheatArea: curr.wheat,
        wheatYield: curr.wheatYield,
        cornArea: curr.corn,
        cornYield: curr.cornYield,
        nonAgriArea: curr.nonAgri,
        healthIndex: curr.healthIndex,
        highH: curr.highH,
        medH: curr.medH,
        lowH: curr.lowH,
        totalYield: curr.totalYield,
        yoyChange: diffText,
        yoyType: type
      });
    }
    return report;
  };

  const fluctuationTable = calculateFluctuations();

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 bg-[#f9fbf9] dark:bg-slate-950 font-sans text-gray-800 dark:text-slate-100 flex flex-col transition-colors duration-300 overflow-y-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      <style>{`
        :root {
          /* Dark Mode (Default) */
          --c-primary: #fff2d8;    
          --c-secondary: #ead7bb;  
          --c-tertiary: #bca37f;   
          --c-bg: #0f172a;         
          --chart-text: #fff2d8;
          --chart-grid: rgba(234, 215, 187, 0.2);
        }
        :root.light, .light {
          /* Light Mode Overrides */
          --c-primary: #113946;    
          --c-secondary: #bca37f;  
          --c-tertiary: #9e7676;   
          --c-bg: #ffffff;         
          --chart-text: #113946;
          --chart-grid: rgba(188, 163, 127, 0.4);
        }
      `}</style>

      <div className="relative z-10 px-8 pt-6 pb-4 border-b border-gray-200 dark:border-slate-800 shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="text-start">
            <h2 className="text-2xl font-black uppercase tracking-wide flex items-center gap-3" style={{ color: 'var(--chart-text)' }}>
              <Sparkles className="w-6 h-6 animate-pulse" style={{ color: 'var(--c-secondary)' }} />
              {t('headerTitle')}
            </h2>
            <p className="text-xs font-mono mt-1 opacity-80" style={{ color: 'var(--chart-text)' }}>{t('headerDesc')}</p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold border border-gray-200 dark:border-slate-700 shadow-sm transition-colors"
            >
              <Languages className="w-4 h-4" />
              {lang === 'en' ? 'عربي' : 'English'}
            </button>

            {!loading && chartData && (
              <span className="text-[13px] text-gray-400 dark:text-slate-500 font-mono tracking-wider px-2">CACHE ACTIVE</span>
            )}

            {sharedMetadata && (
              <button
                onClick={fetchComparisonData}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-all font-black text-xs shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {t('refresh')}
              </button>
            )}

            {sharedMetadata && (
              <button
                onClick={handleShareComparison}
                disabled={shareLoading || !chartData}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all font-black text-xs shadow-md hover:opacity-90"
                style={{ backgroundColor: 'var(--c-primary)', color: 'var(--c-bg)' }}
              >
                {shareLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                {t('shareReport')}
              </button>
            )}
          </div>
        </div>

        {shareLink && (
          <div className="mt-4 border rounded-2xl px-5 py-4 flex flex-col md:flex-row items-stretch md:items-center gap-3 animate-in fade-in duration-500 shadow-sm" style={{ backgroundColor: 'var(--c-tertiary)', borderColor: 'var(--c-secondary)' }}>
            <div className="flex items-center gap-2 shrink-0">
              <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: 'var(--c-bg)' }} />
              <span className="text-sm font-black" style={{ color: 'var(--c-bg)' }}>{t('published')}</span>
            </div>
            <input
              readOnly
              value={shareLink}
              onFocus={(e) => e.target.select()}
              className="flex-1 rounded-xl px-4 py-2.5 text-xs focus:outline-none font-mono min-w-0"
              style={{ backgroundColor: 'var(--c-bg)', color: 'var(--chart-text)', border: '1px solid var(--c-secondary)' }}
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyShareLink}
                className="p-2.5 rounded-xl transition-colors shadow-sm hover:opacity-80"
                title="Copy Link"
                style={{ backgroundColor: 'var(--c-secondary)', color: 'var(--c-bg)' }}
              >
                {shareCopied ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <a
                href={shareLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl transition-colors shadow-sm hover:opacity-80"
                title="Open Link"
                style={{ backgroundColor: 'var(--c-primary)', color: 'var(--c-bg)' }}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
        
        {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/30 rounded-2xl px-5 py-4 flex items-center gap-2 animate-in fade-in duration-500">
                <span className="text-sm font-black text-red-600 dark:text-red-400">{error}</span>
            </div>
        )}
      </div>

      {!sharedMetadata ? (
        <div className="flex-1 flex items-center justify-center relative z-10 p-8">
          <div className="border-[2px] border-dashed border-gray-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/30 rounded-[2rem] p-16 text-center max-w-xl flex flex-col items-center justify-center gap-5 shadow-sm">
            <Calendar className="w-14 h-14" style={{ color: 'var(--c-secondary)' }} />
            <p className="text-xl font-black" style={{ color: 'var(--chart-text)' }}>{t('awaitingTitle')}</p>
            <p className="text-sm leading-relaxed opacity-80" style={{ color: 'var(--chart-text)' }}>
              {t('awaitingDesc')}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 relative z-10 p-6 animate-in fade-in duration-400">
          {loading && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-[4px] z-30 flex items-center justify-center rounded-3xl">
              <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-8 shadow-2xl">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--c-primary)' }} />
                <span className="text-base font-black font-mono" style={{ color: 'var(--chart-text)' }}>{t('loading')}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[25%_50%_25%] gap-5 min-h-[85vh] pb-8">

        
            <div className="flex flex-col gap-5 min-h-[400px]">

              <div className="h-[220px] bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden shrink-0">
                <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-gray-100 dark:border-slate-800 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--c-primary)' }}></span>
                  <h3 className="text-[13px] font-black uppercase tracking-wider" style={{ color: 'var(--chart-text)' }}>{t('cropStructure')}</h3>
                </div>
                <div className="flex-1 flex flex-col p-2">
                  <div className="flex items-center justify-around gap-2 px-2 py-2 border-b border-gray-50 dark:border-slate-800 shrink-0">
                    <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--chart-text)' }}><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--c-primary)' }}></span> {t('wheat')}</span>
                    <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--chart-text)' }}><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--c-secondary)' }}></span> {t('corn')}</span>
                    <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--chart-text)' }}><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--c-tertiary)' }}></span> {t('nonAgri')}</span>
                  </div>
                  <div className="flex-1 w-full text-xs font-mono mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={formattedChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--chart-text)" tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                        <YAxis stroke="var(--chart-text)" tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--c-bg)', borderColor: 'var(--c-secondary)', borderRadius: '12px', color: 'var(--chart-text)', fontSize: '12px', fontWeight: 'bold' }} cursor={{fill: 'var(--chart-grid)', opacity: 0.4}} />
                        <Bar name={t('wheat')} dataKey="wheat" fill="var(--c-primary)" radius={[4, 4, 0, 0]} />
                        <Bar name={t('corn')} dataKey="corn" fill="var(--c-secondary)" radius={[4, 4, 0, 0]} />
                        <Bar name={t('nonAgri')} dataKey="nonAgri" fill="var(--c-tertiary)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-gray-100 dark:border-slate-800 shrink-0">
                  <Activity className="w-5 h-5" style={{ color: 'var(--c-primary)' }} />
                  <h3 className="text-[13px] font-black uppercase tracking-wider" style={{ color: 'var(--chart-text)' }}>{t('vegHealth')}</h3>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-[13px] font-sans border-collapse">
                    <thead className="bg-gray-50 dark:bg-slate-900 z-10 border-b border-gray-200 dark:border-slate-800">
                      <tr className="font-black text-xs uppercase tracking-wider" style={{ color: 'var(--chart-text)', opacity: 0.7 }}>
                        <th className="py-3 px-4 text-start">{t('season')}</th>
                        <th className="py-3 px-2 text-start flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--c-primary)' }}></span> {t('excellent')}</th>
                        <th className="py-3 px-2 text-start"><span className="w-2 h-2 rounded-full inline-block mx-1.5" style={{ backgroundColor: 'var(--c-secondary)' }}></span> {t('moderate')}</th>
                        <th className="py-3 px-2 text-start"><span className="w-2 h-2 rounded-full inline-block mx-1.5" style={{ backgroundColor: 'var(--c-tertiary)' }}></span> {t('poor')}</th>
                        <th className="py-3 px-4 text-center">{t('index')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fluctuationTable.length === 0 ? (
                        <tr><td colSpan="5" className="py-8 text-center font-mono text-sm text-gray-400 dark:text-slate-500">{t('noData')}</td></tr>
                      ) : (
                        fluctuationTable.map((row) => (
                          <tr key={row.year} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-3 px-4 font-extrabold text-start" style={{ color: 'var(--chart-text)' }}>S-{row.year}</td>
                            <td className="py-3 px-2 font-bold text-start" style={{ color: 'var(--c-primary)' }}>{row.highH}</td>
                            <td className="py-3 px-2 font-bold text-start" style={{ color: 'var(--c-secondary)' }}>{row.medH}</td>
                            <td className="py-3 px-2 font-bold text-start" style={{ color: 'var(--c-tertiary)' }}>{row.lowH}</td>
                            <td className="py-3 px-4 font-black text-center" style={{ color: 'var(--chart-text)' }}>{row.healthIndex}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5 min-h-[500px]">

              <div className="h-[350px] lg:h-[60%] bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm relative overflow-hidden transition-colors">
                <div className="absolute top-4 left-4 z-40 flex items-center gap-2 flex-wrap" dir="ltr">
                  <span className="backdrop-blur-sm text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm uppercase tracking-wider font-mono border" style={{ backgroundColor: 'var(--c-bg)', color: 'var(--chart-text)', borderColor: 'var(--c-secondary)' }}>
                    {t('contextMap')}
                  </span>
                  {yearList.length > 0 && (
                    <div className="flex backdrop-blur-sm rounded-lg shadow-sm overflow-hidden border" style={{ backgroundColor: 'var(--c-bg)', borderColor: 'var(--c-secondary)' }}>
                      {yearList.map((year) => (
                        <button
                          key={year}
                          onClick={() => setSelectedYear(year)}
                          className="px-3 py-1.5 text-xs font-bold transition-colors hover:opacity-80"
                          style={{
                            backgroundColor: selectedYear === year ? 'var(--c-primary)' : 'transparent',
                            color: selectedYear === year ? 'var(--c-bg)' : 'var(--chart-text)'
                          }}
                        >
                          S-{year}
                        </button>
                      ))}
                    </div>
                  )}
                  {(cropTypePreview && cropHealthPreview) || yearList.length > 0 ? (
                    <div className="flex backdrop-blur-sm rounded-lg shadow-sm overflow-hidden border ml-2" style={{ backgroundColor: 'var(--c-bg)', borderColor: 'var(--c-secondary)' }}>
                      <button onClick={() => setActiveLayer('crop_type')} className="px-3 py-1.5 text-xs font-bold transition-colors hover:opacity-80" style={{ backgroundColor: activeLayer === 'crop_type' ? 'var(--c-primary)' : 'transparent', color: activeLayer === 'crop_type' ? 'var(--c-bg)' : 'var(--chart-text)' }}>{t('classification')}</button>
                      <button onClick={() => setActiveLayer('crop_health')} className="px-3 py-1.5 text-xs font-bold transition-colors hover:opacity-80" style={{ backgroundColor: activeLayer === 'crop_health' ? 'var(--c-primary)' : 'transparent', color: activeLayer === 'crop_health' ? 'var(--c-bg)' : 'var(--chart-text)' }}>{t('health')}</button>
                    </div>
                  ) : null}
                </div>
                <MapContainer center={currentCenter} zoom={currentZoom} className="h-full w-full z-10" zoomControl={false}>
                  <MapController center={currentCenter} zoom={currentZoom} bounds={mapBounds} />
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={20} />
                  {yearTiles[selectedYear] ? (
                    <TileLayer
                      key={`${selectedYear}-${activeLayer}`}
                      url={yearTiles[selectedYear][activeLayer === 'crop_type' ? 'crop_type_tiles' : 'crop_health_tiles']}
                      opacity={0.85}
                      zIndex={14}
                      maxZoom={20}
                    />
                  ) : cropTypePreview && cropHealthPreview && hasGeometry ? (
                    <>
                      <ImageOverlay url={cropTypePreview} bounds={[
                        [Math.min(...sharedMetadata.geometry.map(p => p[1])), Math.min(...sharedMetadata.geometry.map(p => p[0]))],
                        [Math.max(...sharedMetadata.geometry.map(p => p[1])), Math.max(...sharedMetadata.geometry.map(p => p[0]))]
                      ]} opacity={activeLayer === 'crop_type' ? 0.85 : 0} zIndex={14} />
                      <ImageOverlay url={cropHealthPreview} bounds={[
                        [Math.min(...sharedMetadata.geometry.map(p => p[1])), Math.min(...sharedMetadata.geometry.map(p => p[0]))],
                        [Math.max(...sharedMetadata.geometry.map(p => p[1])), Math.max(...sharedMetadata.geometry.map(p => p[0]))]
                      ]} opacity={activeLayer === 'crop_health' ? 0.85 : 0} zIndex={14} />
                    </>
                  ) : null}
                  <Polygon 
                    positions={hasGeometry ? sharedMetadata.geometry.map(p => [p[1], p[0]]) : dummyPolygon} 
                    pathOptions={{ color: 'var(--c-secondary)', fillColor: 'transparent', weight: 3 }} 
                  />
                </MapContainer>
              </div>

              <div className="flex-1 bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-gray-100 dark:border-slate-800 shrink-0">
                  <Table className="w-5 h-5" style={{ color: 'var(--c-primary)' }} />
                  <h3 className="text-[13px] font-black uppercase tracking-wider" style={{ color: 'var(--chart-text)' }}>{t('changeProd')}</h3>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-[13px] font-sans border-collapse">
                    <thead className="bg-gray-50 dark:bg-slate-900 z-10 border-b border-gray-200 dark:border-slate-800">
                      <tr className="font-black text-xs uppercase tracking-wider" style={{ color: 'var(--chart-text)', opacity: 0.7 }}>
                        <th className="py-4 px-4 text-start">{t('season')}</th>
                        <th className="py-4 px-2 text-start">{t('totalF')}</th>
                        <th className="py-4 px-2 text-start">{t('agri')}</th>
                        <th className="py-4 px-2 text-start">{t('wheat')}</th>
                        <th className="py-4 px-2 text-start">{t('corn')}</th>
                        <th className="py-4 px-4 text-center">{t('fluctuation')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fluctuationTable.length === 0 ? (
                        <tr><td colSpan="6" className="py-8 text-center font-mono text-sm text-gray-400 dark:text-slate-500">{t('noData')}</td></tr>
                      ) : (
                        fluctuationTable.map((row) => (
                          <tr key={row.year} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-3 px-4 font-extrabold text-start" style={{ color: 'var(--chart-text)' }}>S-{row.year}</td>
                            <td className="py-3 px-2 font-black text-start" style={{ color: 'var(--chart-text)' }}>{row.totalArea}</td>
                            <td className="py-3 px-2 font-bold text-start" style={{ color: 'var(--chart-text)' }}>{row.agriArea}</td>
                            <td className="py-3 px-2 font-bold text-start" style={{ color: 'var(--c-primary)' }}>{row.wheatArea}</td>
                            <td className="py-3 px-2 font-bold text-start" style={{ color: 'var(--c-secondary)' }}>{row.cornArea}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center justify-center gap-1.5 text-xs font-black" style={{
                                color: row.yoyType === 'positive' ? 'var(--c-primary)' : row.yoyType === 'negative' ? 'var(--c-tertiary)' : 'var(--chart-text)'
                              }}>
                                {row.yoyType === 'positive' && <TrendingUp className="w-3 h-3" />}
                                {row.yoyType === 'negative' && <TrendingDown className="w-3 h-3" />}
                                {row.yoyChange}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

        
            <div className="flex flex-col gap-5 min-h-[400px]">

              <div className="h-[220px] bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col shrink-0">
                <h3 className="text-[13px] font-black uppercase tracking-wider mb-4 flex items-center gap-2 shrink-0" style={{ color: 'var(--chart-text)' }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--c-secondary)' }}></span>
                  {t('cropQuality')}
                </h3>
                <div className="flex-1 w-full text-xs font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--chart-text)" tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <YAxis stroke="var(--chart-text)" tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--c-bg)', borderColor: 'var(--c-secondary)', borderRadius: '12px', color: 'var(--chart-text)', fontSize: '12px', textAlign: 'left', fontWeight: 'bold' }} cursor={{fill: 'var(--chart-grid)', opacity: 0.4}} />
                      <Legend iconSize={8} iconType="circle" style={{ fontSize: '11px', fontWeight: 'bold' }} wrapperStyle={{ color: 'var(--chart-text)', paddingTop: '10px' }} />
                      <Bar name={t('excellent')} dataKey="highH" stackId="a" fill="var(--c-primary)" />
                      <Bar name={t('moderate')} dataKey="medH" stackId="a" fill="var(--c-secondary)" />
                      <Bar name={t('poor')} dataKey="lowH" stackId="a" fill="var(--c-tertiary)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="h-[220px] bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col shrink-0">
                <h3 className="text-[13px] font-black uppercase tracking-wider mb-4 flex items-center gap-2 shrink-0" style={{ color: 'var(--chart-text)' }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--c-primary)' }}></span>
                  {t('agriFootprint')}
                </h3>
                <div className="flex-1 w-full text-xs font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAgri" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--c-primary)" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="var(--c-primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--chart-text)" tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <YAxis stroke="var(--chart-text)" tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--c-bg)', borderColor: 'var(--c-secondary)', borderRadius: '12px', color: 'var(--chart-text)', fontSize: '12px', textAlign: 'left', fontWeight: 'bold' }} />
                      <Legend iconSize={8} iconType="circle" style={{ fontSize: '11px', fontWeight: 'bold' }} wrapperStyle={{ color: 'var(--chart-text)', paddingTop: '10px' }} />
                      <Area 
                        type="monotone" 
                        name={t('agri')} 
                        dataKey="agriArea" 
                        stroke="var(--c-primary)" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorAgri)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PerformanceDashboard;
