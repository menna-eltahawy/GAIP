import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Loader2, MapPin, User, Phone, Leaf, Wrench, ShieldAlert, Check, Landmark, X, FileWarning, CalendarDays, ClipboardCheck, Layers } from 'lucide-react';
import api, { resolveImageUrl } from '../../api/axiosConfig';

// إعدادات ألوان الحالات (Status) الجذابة
const STATUS_MARKER_CONFIG = {
  'waiting': {
    bgClass: 'bg-sky-500',
    borderClass: 'border-sky-200 dark:border-sky-700',
    shadowClass: 'shadow-[0_0_15px_rgba(14,165,233,0.7)]',
    pulseClass: 'bg-sky-500/50'
  },
  'decision_maker': {
    bgClass: 'bg-violet-500',
    borderClass: 'border-violet-200 dark:border-violet-700',
    shadowClass: 'shadow-[0_0_15px_rgba(139,92,246,0.7)]',
    pulseClass: 'bg-violet-500/50'
  }
};

const SEVERITY = {
  'منخفضة': { color: '#10b981', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/30' },
  'متوسطة': { color: '#f59e0b', chip: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-500/30' },
  'حرجة':   { color: '#ef4444', chip: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-500/30' },
};

const STATUS_META = {
  'waiting':        { key: 'waiting', chip: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-500/30' },
  'decision_maker': { key: 'decisionMaker', chip: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-500/30' },
};

// قاموس الترجمة
const T = {
  en: {
    title: "Farmer Complaints",
    loading: "Loading complaints...",
    loadError: "Failed to connect to server — check backend",
    retry: "Retry",
    noComplaints: "No complaints available",
    waiting: "Waiting",
    decisionMaker: "Forwarded to Decision Maker",
    detailsTitle: "Complaint Details",
    complaintNum: "Complaint",
    noImage: "No image attached",
    farmer: "Farmer",
    phone: "Phone",
    problem: "Problem",
    severity: "Severity",
    desc: "Description",
    loc: "Location",
    date: "Date",
    solveAction: "Solve Problem",
    actionPrompt: "What actions did you take to solve this?",
    placeholder: "Write the actions taken...",
    saveSolution: "Save Solution",
    reqDecision: "Requires Decision Maker",
    successSolve: "Solution saved successfully",
    successFwd: "Forwarded to Decision Maker",
    errorSave: "Failed to save action",
    'مشكلة في محاصيل': 'Crop Problem',
    'مشكلة أخرى': 'Other Problem',
    'قمح': 'Wheat',
    'ذرة': 'Corn',
    'منخفضة': 'Low',
    'متوسطة': 'Medium',
    'حرجة': 'Critical',
  },
  ar: {
    title: "بلاغات المزارعين",
    loading: "جارٍ تحميل البلاغات...",
    loadError: "تعذر الاتصال بالخادم — تأكد من تشغيل الـ backend",
    retry: "إعادة المحاولة",
    noComplaints: "لا توجد بلاغات حالياً",
    waiting: "قيد الانتظار",
    decisionMaker: "مُحال لصانع القرار",
    detailsTitle: "تفاصيل البلاغ",
    complaintNum: "بلاغ",
    noImage: "لا توجد صورة مرفقة",
    farmer: "المزارع",
    phone: "الهاتف",
    problem: "المشكلة",
    severity: "الخطورة",
    desc: "وصف المشكلة",
    loc: "الموقع",
    date: "التاريخ",
    solveAction: "حل المشكلة",
    actionPrompt: "ما الذي قمت به لحل المشكلة؟",
    placeholder: "اكتب الإجراءات التي اتخذتها...",
    saveSolution: "حفظ الحل",
    reqDecision: "يحتاج إجراء صانع القرار",
    successSolve: "تم حفظ الحل بنجاح",
    successFwd: "تم إرسال البلاغ لصانع القرار",
    errorSave: "تعذر حفظ الحل",
    'مشكلة في محاصيل': 'مشكلة في محاصيل',
    'مشكلة أخرى': 'مشكلة أخرى',
    'قمح': 'قمح',
    'ذرة': 'ذرة',
    'منخفضة': 'منخفضة',
    'متوسطة': 'متوسطة',
    'حرجة': 'حرجة',
  }
};

const getMarkerIcon = (status, isSelected) => {
  const config = STATUS_MARKER_CONFIG[status] || STATUS_MARKER_CONFIG['waiting'];
  const isPulse = isSelected || status === 'waiting'; 
  const selectedRing = isSelected ? 'ring-2 ring-white scale-125' : '';
  const bClass = isSelected ? 'border-white' : config.borderClass;

  const html = `
    <div class="relative flex items-center justify-center w-8 h-8 group cursor-pointer">
      ${isPulse ? `<span class="absolute w-full h-full rounded-full ${config.pulseClass} animate-ping duration-1000"></span>` : ''}
      <div class="relative w-5 h-5 rounded-full ${config.bgClass} border-[2px] ${bClass} ${config.shadowClass} transition-all duration-300 flex items-center justify-center group-hover:scale-110 ${selectedRing}">
        ${isSelected ? `<div class="w-1.5 h-1.5 bg-white rounded-full shadow-sm"></div>` : ''}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'bg-transparent border-0',
    html: html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const FlyToComplaint = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target && target.Latitude && target.Longitude) {
      map.flyTo([target.Latitude, target.Longitude], 14, { duration: 0.8 });
    }
  }, [target, map]);
  return null;
};

const ComplaintsView = ({ isActive, lang = 'en' }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [solving, setSolving] = useState(false);
  const [solutionText, setSolutionText] = useState('');
  const [actionMsg, setActionMsg] = useState(null);
  const [savingAction, setSavingAction] = useState(false);

  // Basemap State
  const [basemap, setBasemap] = useState('esri');
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);
  const basemaps = [
    { id: 'esri', name: 'ESRI Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', subdomains: 'abc' },
    { id: 'google', name: 'Google Satellite', url: 'https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', subdomains: ['mt0', 'mt1', 'mt2', 'mt3'] },
    { id: 'osm', name: 'OpenStreetMap', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', subdomains: 'abc' },
    { id: 'dark', name: 'Carto Dark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', subdomains: 'abc' },
  ];

  const t = (key) => T[lang][key] || key;

  const loadComplaints = () => {
    setLoading(true);
    setLoadError(false);
    api
      .get('/Reports')
      .then((res) => setComplaints(res.data.filter((c) => c.Status !== 'solved')))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isActive) loadComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const openDetail = (c) => {
    setSelectedId(c.Id);
    setDetail(null);
    setSolutionText('');
    setActionMsg(null);
    setDetailLoading(true);
    api
      .get(`/Reports/${c.Id}`)
      .then((res) => setDetail(res.data))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
    setSolving(false);
    setActionMsg(null);
  };

  const submitAction = async (action) => {
    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
    setSavingAction(true);
    setActionMsg(null);
    try {
      const res = await api.post(`/Reports/${detail.Id}/solve`, {
        EngineerEmail: userInfo.email || '',
        Solution: solutionText,
        Action: action,
      });
      setDetail(res.data);
      setActionMsg({ type: 'success', text: action === 'solved' ? t('successSolve') : t('successFwd') });
      setSolving(false);
      loadComplaints();
    } catch (e) {
      setActionMsg({ type: 'error', text: e.response?.data?.detail || t('errorSave') });
    } finally {
      setSavingAction(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 bg-white dark:bg-slate-950 font-sans text-gray-800 dark:text-slate-100" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <MapContainer
        center={[26.8206, 30.8025]}
        zoom={6}
        className="w-full h-full z-10"
        zoomControl={false}
      >
        {basemaps.map(b => (
          b.id === basemap && (
            <TileLayer
              key={b.id}
              url={b.url}
              subdomains={b.subdomains}
              maxZoom={20}
              attribution="&copy; GeoAI Platform Basemaps"
            />
          )
        ))}
        {complaints.map((c) => {
          const isSelected = c.Id === selectedId;
          if (!c.Latitude || !c.Longitude) return null;
          return (
            <Marker
              key={c.Id}
              position={[c.Latitude, c.Longitude]}
              icon={getMarkerIcon(c.Status, isSelected)}
              eventHandlers={{ click: () => openDetail(c) }}
            />
          );
        })}
        <FlyToComplaint target={detail} />
      </MapContainer>

      {/* Basemap Switcher UI (Bottom Right) */}
      <div className="absolute bottom-[24px] right-[74px] z-[500]" dir="ltr">
        <div className="relative">
          <button 
              onClick={() => setShowBasemapMenu(!showBasemapMenu)}
              className="w-[46px] h-[46px] rounded-[12px] bg-[#e2e4c8] dark:bg-slate-800 border-[2.5px] border-white/90 dark:border-slate-700 text-[#1b9a4c] dark:text-emerald-400 shadow-md flex items-center justify-center transition-transform hover:scale-105"
              title="Toggle Basemap"
          >
              <Layers className="w-5 h-5" strokeWidth={2.5} />
          </button>          
          {showBasemapMenu && (
            <div className="absolute bottom-full mb-2 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl w-36 overflow-hidden">
              {basemaps.map(b => (
                <button 
                  key={b.id} onClick={() => { setBasemap(b.id); setShowBasemapMenu(false); }}
                  className={`w-full text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors border-b last:border-b-0 border-gray-100 dark:border-slate-800 ${basemap === b.id ? 'bg-emerald-600 text-white' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Side panel */}
      <div className={`absolute top-4 ${lang === 'ar' ? 'right-4' : 'left-4'} bottom-4 w-80 max-w-[85vw] bg-white/90 dark:bg-slate-950/85 backdrop-blur-md border border-gray-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl z-20`}>
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-gray-200 dark:border-slate-800">
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-500/30 p-2 rounded-xl">
            <FileWarning className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-gray-900 dark:text-slate-100">{t('title')}</h2>
            <p className="text-[9px] text-gray-500 dark:text-slate-500 font-bold uppercase tracking-wider">
              {loading ? t('loading') : `${complaints.length} Complaints`}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {loading && (
            <p className="text-center text-[10px] text-gray-500 dark:text-slate-500 font-bold flex items-center justify-center gap-2 py-8">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {t('loading')}
            </p>
          )}
          {!loading && loadError && (
            <div className="text-center py-8 space-y-3">
              <p className="text-[10px] text-red-500 dark:text-red-400 font-bold">{t('loadError')}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 text-[10px] font-black"
              >
                {t('retry')}
              </button>
            </div>
          )}
          {!loading && !loadError && complaints.length === 0 && (
            <p className="text-center text-[10px] text-gray-500 dark:text-slate-500 font-bold py-10">
              {t('noComplaints')}
            </p>
          )}
          {complaints.map((c) => {
            const sev = SEVERITY[c.SeverityLevel] || SEVERITY['متوسطة'];
            const st = STATUS_META[c.Status] || STATUS_META['waiting'];
            return (
              <button
                key={c.Id}
                onClick={() => openDetail(c)}
                className={`w-full ${lang === 'ar' ? 'text-right' : 'text-left'} bg-gray-50 dark:bg-slate-900 border rounded-2xl p-3.5 transition-all hover:border-gray-400 dark:hover:border-slate-600 ${
                  selectedId === c.Id ? 'border-emerald-500/50' : 'border-gray-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${st.chip}`}>
                    {t(st.key)}
                  </span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${sev.chip}`}>
                    {t(c.SeverityLevel)}
                  </span>
                  <span className="text-[10px] font-black text-gray-800 dark:text-slate-300 truncate">
                    {t(c.ProblemType)}
                    {c.CropType ? ` — ${t(c.CropType)}` : ''}
                    {c.ProblemName ? ` — ${c.ProblemName}` : ''}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-4 line-clamp-2 mb-1.5">{c.Description}</p>
                <p className="text-[9px] text-gray-600 dark:text-slate-500 font-bold flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" />
                  {c.FarmerName || c.Email}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Details + solve modal */}
      {selectedId &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2.5">
                  <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-500/30 p-2 rounded-xl">
                    <ClipboardCheck className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-slate-100">{t('detailsTitle')}</h3>
                    <p className="text-[9px] text-gray-500 dark:text-slate-500 font-bold uppercase tracking-wider">{t('complaintNum')} #{selectedId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {detail && (
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg border ${(STATUS_META[detail.Status] || STATUS_META['waiting']).chip}`}>
                      {t((STATUS_META[detail.Status] || STATUS_META['waiting']).key)}
                    </span>
                  )}
                  <button onClick={closeDetail} className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-xl transition-all">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto min-h-0 space-y-4">
                {detailLoading && (
                  <p className="text-center text-[10px] text-gray-500 dark:text-slate-500 font-bold flex items-center justify-center gap-2 py-10">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {t('loading')}
                  </p>
                )}

                {detail && !detailLoading && (
                  <>
                    {detail.Image ? (
                      <a href={resolveImageUrl(detail.Image)} target="_blank" rel="noreferrer" title="Open Image">
                        <img src={resolveImageUrl(detail.Image)} alt="Complaint" className="w-full max-h-52 object-cover rounded-2xl border border-gray-200 dark:border-slate-700 hover:ring-2 hover:ring-emerald-500/50 transition-all" />
                      </a>
                    ) : (
                      <div className="w-full h-36 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50 flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-slate-600">
                        <FileWarning className="w-6 h-6" />
                        <span className="text-[9px] font-bold">{t('noImage')}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                      <div className="bg-gray-50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5">
                        <p className="text-[8px] text-gray-500 dark:text-slate-500 font-black uppercase mb-1 flex items-center gap-1"><User className="w-2.5 h-2.5" /> {t('farmer')}</p>
                        <p className="font-bold text-gray-800 dark:text-slate-200">{detail.FarmerName || '—'}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5">
                        <p className="text-[8px] text-gray-500 dark:text-slate-500 font-black uppercase mb-1 flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {t('phone')}</p>
                        <p className="font-bold text-gray-800 dark:text-slate-200" dir="ltr">{detail.PhoneNumber || '—'}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5">
                        <p className="text-[8px] text-gray-500 dark:text-slate-500 font-black uppercase mb-1">{t('problem')}</p>
                        <p className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1">
                          {detail.ProblemType === 'مشكلة في محاصيل' ? <Leaf className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Wrench className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                          {t(detail.ProblemType)}
                          {detail.CropType ? ` — ${t(detail.CropType)}` : ''}
                          {detail.ProblemName ? ` — ${detail.ProblemName}` : ''}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5">
                        <p className="text-[8px] text-gray-500 dark:text-slate-500 font-black uppercase mb-1">{t('severity')}</p>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border w-fit flex items-center gap-1 ${(SEVERITY[detail.SeverityLevel] || SEVERITY['متوسطة']).chip}`}>
                          <ShieldAlert className="w-2.5 h-2.5 inline" />
                          {t(detail.SeverityLevel)}
                        </span>
                      </div>
                      <div className="col-span-2 bg-gray-50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5">
                        <p className="text-[8px] text-gray-500 dark:text-slate-500 font-black uppercase mb-1">{t('desc')}</p>
                        <p className="font-bold text-gray-800 dark:text-slate-200 leading-5" dir="auto">{detail.Description}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5">
                        <p className="text-[8px] text-gray-500 dark:text-slate-500 font-black uppercase mb-1 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {t('loc')}</p>
                        <p className="font-bold text-gray-800 dark:text-slate-200 font-mono text-[10px]">{detail.Latitude.toFixed(5)}, {detail.Longitude.toFixed(5)}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5">
                        <p className="text-[8px] text-gray-500 dark:text-slate-500 font-black uppercase mb-1 flex items-center gap-1"><CalendarDays className="w-2.5 h-2.5" /> {t('date')}</p>
                        <p className="font-bold text-gray-800 dark:text-slate-200 text-[10px]">{new Date(detail.Created_At).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-EG')}</p>
                      </div>
                    </div>

                    {/* Solve section */}
                    {!solving ? (
                      <button
                        onClick={() => { setSolving(true); setActionMsg(null); }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all"
                      >
                        <ClipboardCheck className="w-4 h-4" />
                        {t('solveAction')}
                      </button>
                    ) : (
                      <div className="space-y-3 bg-gray-50 dark:bg-slate-950/50 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4">
                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{t('actionPrompt')}</p>
                        <textarea
                          value={solutionText}
                          onChange={(e) => setSolutionText(e.target.value)}
                          placeholder={t('placeholder')}
                          rows={3}
                          dir="auto"
                          className="w-full px-3.5 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[12px] text-gray-800 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none shadow-inner"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => submitAction('solved')}
                            disabled={!solutionText.trim() || savingAction}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[11px] font-black transition-all shadow-sm"
                          >
                            {savingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            {t('saveSolution')}
                          </button>
                          <button
                            onClick={() => submitAction('decision_maker')}
                            disabled={!solutionText.trim() || savingAction}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-[11px] font-black transition-all shadow-sm"
                          >
                            <Landmark className="w-3.5 h-3.5" />
                            {t('reqDecision')}
                          </button>
                        </div>
                      </div>
                    )}

                    {actionMsg && (
                      <div className={`px-3.5 py-2.5 rounded-xl text-[11px] font-bold border ${
                        actionMsg.type === 'success'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300'
                      }`}>
                        {actionMsg.text}
                      </div>
                    )}
                  </>
                )}

                {!detail && !detailLoading && (
                  <p className="text-center text-[10px] text-red-500 dark:text-red-400 font-bold py-8">{t('errorLoad')}</p>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ComplaintsView;