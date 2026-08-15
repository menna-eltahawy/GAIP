import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Loader2, MapPin, User, Phone, Leaf, Wrench, ShieldAlert, Check, X, FileWarning, CalendarDays, ClipboardCheck, HardHat, Languages, Layers } from 'lucide-react';
import api, { resolveImageUrl } from '../../api/axiosConfig';
import Chatbot from './Chatbot'; 

const STATUS_META = {
  'decision_maker': { label: 'مُحال لصانع القرار', chip: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-500/30' },
  'solved':         { label: 'محلول', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/30' },
};

const SEVERITY_CONFIG = {
  'منخفضة': { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/30', bgClass: 'bg-emerald-500', borderClass: 'border-emerald-200 dark:border-emerald-700', shadowClass: 'shadow-[0_0_15px_rgba(16,185,129,0.7)]', pulseClass: 'bg-emerald-500/50' },
  'متوسطة': { chip: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-500/30', bgClass: 'bg-amber-500', borderClass: 'border-amber-200 dark:border-amber-700', shadowClass: 'shadow-[0_0_15px_rgba(245,158,11,0.7)]', pulseClass: 'bg-amber-500/50' },
  'حرجة':   { chip: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-500/30', bgClass: 'bg-red-500', borderClass: 'border-red-200 dark:border-red-700', shadowClass: 'shadow-[0_0_15px_rgba(239,68,68,0.7)]', pulseClass: 'bg-red-500/50' },
};

const T = {
  en: {
    modalTitle: "Complaint Details",
    complaintNum: "Complaint",
    farmer: "Farmer",
    phone: "Phone",
    problem: "Problem",
    severity: "Severity",
    desc: "Description",
    loc: "Location",
    date: "Forward Date",
    decision: "Your Decision (Optional)",
    placeholder: "Write your decision or note... (optional)",
    solveBtn: "Mark as Solved — Update Status",
    noImage: "No image attached",
    loading: "Loading details...",
    errorLoad: "Failed to load details",
    engineer: "Forwarding Engineer",
    actionByEng: "Engineer's Action:",
    waitingDecision: "Waiting for your decision...",
    'مشكلة في محاصيل': 'Crop Problem',
    'مشكلة أخرى': 'Other Problem',
    'قمح': 'Wheat',
    'ذرة': 'Corn',
    'منخفضة': 'Low',
    'متوسطة': 'Medium',
    'حرجة': 'Critical',
    'مُحال لصانع القرار': 'Forwarded to Decision Maker',
    'محلول': 'Solved',
    successMsg: "Complaint marked as solved successfully.",
    errorMsg: "Failed to save solution."
  },
  ar: {
    modalTitle: "تفاصيل البلاغ",
    complaintNum: "بلاغ",
    farmer: "المزارع",
    phone: "الهاتف",
    problem: "المشكلة",
    severity: "الخطورة",
    desc: "وصف المشكلة",
    loc: "الموقع",
    date: "تاريخ الإحالة",
    decision: "قرارك كصانع قرار (اختياري)",
    placeholder: "اكتب قرارك أو ملاحظة... (اختياري)",
    solveBtn: "تم الحل — تحديث الحالة",
    noImage: "لا توجد صورة مرفقة",
    loading: "جارٍ تحميل التفاصيل...",
    errorLoad: "تعذر تحميل تفاصيل البلاغ",
    engineer: "المهندس المحيل",
    actionByEng: "إجراء المهندس:",
    waitingDecision: "في انتظار قرار صانع القرار...",
    'مشكلة في محاصيل': 'مشكلة في محاصيل',
    'مشكلة أخرى': 'مشكلة أخرى',
    'قمح': 'قمح',
    'ذرة': 'ذرة',
    'منخفضة': 'منخفضة',
    'متوسطة': 'متوسطة',
    'حرجة': 'حرجة',
    'مُحال لصانع القرار': 'مُحال لصانع القرار',
    'محلول': 'محلول',
    successMsg: "تم تحديد البلاغ كمحلول — سيراه المزارع بحالة 'محلول'",
    errorMsg: "تعذر حفظ الحل"
  }
};

const getMarkerIcon = (severityLevel, isSelected) => {
  const config = SEVERITY_CONFIG[severityLevel] || SEVERITY_CONFIG['متوسطة'];
  const isPulse = isSelected || severityLevel === 'حرجة';
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

const Complaints = ({ isActive }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  
  const [basemap, setBasemap] = useState('esri');
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);
  const basemaps = [
    { id: 'esri', name: 'ESRI Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', subdomains: 'abc' },
    { id: 'google', name: 'Google Satellite', url: 'https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', subdomains: ['mt0', 'mt1', 'mt2', 'mt3'] },
    { id: 'osm', name: 'OpenStreetMap', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', subdomains: 'abc' },
    { id: 'dark', name: 'Carto Dark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', subdomains: 'abc' },
  ];

  const [lang, setLang] = useState('en');
  const translate = (key) => T[lang][key] || key;

  const loadComplaints = () => {
    setLoading(true);
    setLoadError(false);
    api
      .get('/Reports')
      .then((res) => {
        if(Array.isArray(res.data)) {
          setComplaints(res.data.filter((c) => c.Status === 'decision_maker'));
        } else {
          setComplaints([]);
        }
      })
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
    setNote('');
    setMsg(null);
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
    setMsg(null);
  };

  const markSolved = async () => {
    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
    setSaving(true);
    setMsg(null);
    try {
      const res = await api.post(`/Reports/${detail.Id}/solve`, {
        EngineerEmail: userInfo.email || '',
        Solution: note.trim() || (lang === 'en' ? 'Solved by Decision Maker' : 'تم الحل من صانع القرار'),
        Action: 'solved',
      });
      setDetail(res.data);
      setMsg({ type: 'success', text: translate('successMsg') });
      loadComplaints();
    } catch (e) {
      setMsg({ type: 'error', text: translate('errorMsg') });
    } finally {
      setSaving(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 flex bg-white dark:bg-slate-950 font-sans text-gray-800 dark:text-slate-100 overflow-hidden">
      
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
              icon={getMarkerIcon(c.SeverityLevel, isSelected)}
              eventHandlers={{ click: () => openDetail(c) }}
            />
          );
        })}
        <FlyToComplaint target={detail} />
      </MapContainer>

      {/* Map Basemap Switcher UI (Bottom Right next to Chatbot) */}
      <div className="absolute bottom-[20px] right-[74px] z-[500]" dir="ltr">
        <div className="relative">
          <button 
              onClick={() => setShowBasemapMenu(!showBasemapMenu)}
              className="w-[46px] h-[46px] rounded-[12px] bg-[#e2e4c8] dark:bg-slate-800 border-[2.5px] border-white/90 dark:border-slate-700 text-[#1b9a4c] dark:text-emerald-400 shadow-md flex items-center justify-center transition-transform hover:scale-105"
              title="Toggle Basemap"
          >
              <Layers className="w-5 h-5" strokeWidth={2.5} />
          </button>          
          {showBasemapMenu && (
            <div className="absolute bottom-[54px] right-0 mb-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl w-36 overflow-hidden">
              {basemaps.map(b => (
                <button 
                  key={b.id} 
                  onClick={() => { setBasemap(b.id); setShowBasemapMenu(false); }}
                  className={`w-full text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors border-b last:border-b-0 border-gray-100 dark:border-slate-800 ${
                    basemap === b.id ? 'bg-emerald-600 text-white' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chatbot rendered inside Map bounds at Bottom Right */}
      <Chatbot 
        onDataLoaded={() => {}} 
        buttonPositionClasses="absolute bottom-[20px] right-[20px]"
      />

      {/* Side panel */}
      <div className="absolute top-4 left-4 bottom-4 w-80 max-w-[85vw] bg-white/90 dark:bg-slate-950/85 backdrop-blur-md border border-gray-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl z-20" dir="ltr">
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-gray-200 dark:border-slate-800">
          <div className="bg-indigo-50 dark:bg-violet-950/50 border border-indigo-200 dark:border-violet-500/30 p-2 rounded-xl">
            <FileWarning className="w-4 h-4 text-indigo-600 dark:text-violet-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-gray-900 dark:text-slate-100">Complaints</h2>
            <p className="text-[9px] text-gray-500 dark:text-slate-500 font-bold uppercase tracking-wider">
              Directed to Decision Maker — {loading ? 'loading...' : `${complaints.length}`}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {loading && (
            <p className="text-center text-[10px] text-gray-500 dark:text-slate-500 font-bold flex items-center justify-center gap-2 py-8">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading...
            </p>
          )}
          {!loading && loadError && (
            <div className="text-center py-8 space-y-3">
              <p className="text-[10px] text-red-500 dark:text-red-400 font-bold">Connection Error — Check Backend</p>
              <button
                onClick={loadComplaints}
                className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 text-[10px] font-black"
              >
                Retry
              </button>
            </div>
          )}
          {!loading && !loadError && complaints.length === 0 && (
            <p className="text-center text-[10px] text-gray-500 dark:text-slate-500 font-bold py-10">
              No forwarded complaints available.
            </p>
          )}
          {complaints.map((c) => (
            <button
              key={c.Id}
              onClick={() => openDetail(c)}
              className={`w-full text-left bg-gray-50 dark:bg-slate-900 border rounded-2xl p-3.5 transition-all hover:border-emerald-400 dark:hover:border-slate-600 ${
                selectedId === c.Id ? 'border-indigo-400 dark:border-violet-500/50' : 'border-gray-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`w-2 h-2 rounded-full shrink-0 ${SEVERITY_CONFIG[c.SeverityLevel]?.bgClass || 'bg-slate-500'} ${c.SeverityLevel === 'حرجة' ? 'animate-pulse' : ''}`}></span>
                <span className="text-[10px] font-black text-gray-800 dark:text-slate-300 truncate">
                  {T.en[c.ProblemType] || c.ProblemType}
                  {c.CropType ? ` — ${T.en[c.CropType] || c.CropType}` : ''}
                  {c.ProblemName ? ` — ${c.ProblemName}` : ''}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-4 line-clamp-2 mb-1.5" dir="auto">{c.Description}</p>
              <p className="text-[9px] text-gray-600 dark:text-slate-500 font-bold flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />
                {c.FarmerName || c.Email} · <HardHat className="w-2.5 h-2.5" /> {c.EngineerName || 'Engineer'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Details modal */}
      {selectedId &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[1.5rem] w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2.5">
                  <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 p-2 rounded-xl">
                    <ClipboardCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-slate-100">{translate('modalTitle')}</h3>
                    <p className="text-[9px] text-gray-500 dark:text-slate-500 font-bold uppercase tracking-wider">{translate('complaintNum')} #{selectedId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold border border-gray-200 dark:border-slate-700 transition-all shadow-sm"
                  >
                    <Languages className="w-3.5 h-3.5" />
                    {lang === 'en' ? 'عربي' : 'English'}
                  </button>

                  <button onClick={closeDetail} className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-xl transition-all">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-5 overflow-y-auto min-h-0 space-y-4">
                {detailLoading && (
                  <p className="text-center text-[10px] text-gray-500 dark:text-slate-500 font-bold flex items-center justify-center gap-2 py-10">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {translate('loading')}
                  </p>
                )}

                {detail && !detailLoading && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${(STATUS_META[detail.Status] || STATUS_META['decision_maker']).chip}`}>
                        {translate(STATUS_META[detail.Status]?.label || 'مُحال لصانع القرار')}
                      </span>
                    </div>

                    {detail.Image ? (
                      <a href={resolveImageUrl(detail.Image)} target="_blank" rel="noreferrer" title="Open Image">
                        <img src={resolveImageUrl(detail.Image)} alt="Complaint" className="w-full max-h-52 object-cover rounded-2xl border border-gray-200 dark:border-slate-700 hover:ring-2 hover:ring-emerald-500/50 transition-all shadow-sm" />
                      </a>
                    ) : (
                      <div className="w-full h-36 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50 flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-slate-600">
                        <FileWarning className="w-6 h-6" />
                        <span className="text-[10px] font-bold">{translate('noImage')}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                      <div className="col-span-2 bg-gray-50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3">
                        <p className="text-[8px] text-gray-500 dark:text-slate-500 font-black uppercase mb-1.5">{translate('farmer')}</p>
                        <div className="flex items-center gap-2 text-gray-900 dark:text-slate-200 font-bold mb-1">
                          <User className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          {detail.FarmerName || '—'}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300 font-bold mt-2" dir="ltr">
                          <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          {detail.PhoneNumber || '—'}
                        </div>
                      </div>

                      <div className="col-span-2 bg-gray-50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3">
                        <p className="text-[8px] text-gray-500 dark:text-slate-500 font-black uppercase mb-1.5">{translate('engineer')}</p>
                        <div className="flex items-center gap-2 text-gray-900 dark:text-slate-200 font-bold mb-1">
                          <HardHat className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          {detail.EngineerName || '—'}
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 font-bold text-[10px] mt-1" dir="ltr">
                          {detail.EngineerEmail || '—'}
                        </div>
                        {detail.Solution && (
                          <p className="mt-2.5 text-[11px] text-gray-700 dark:text-slate-300 leading-5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-sm" dir="auto">
                            <span className="text-[9px] font-bold text-gray-500 dark:text-slate-500 block mb-1">{translate('actionByEng')}</span>
                            {detail.Solution}
                          </p>
                        )}
                      </div>

                      <div className="bg-gray-50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5">
                        <p className="text-[8px] text-gray-500 dark:text-slate-500 font-black uppercase mb-1">{translate('problem')}</p>
                        <p className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1 flex-wrap">
                          {detail.ProblemType === 'مشكلة في محاصيل' ? <Leaf className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Wrench className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                          {translate(detail.ProblemType)}
                          {detail.CropType ? ` — ${translate(detail.CropType)}` : ''}
                          {detail.ProblemName ? ` — ${detail.ProblemName}` : ''}
                        </p>
                      </div>

                      <div className="bg-gray-50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5">
                        <p className="text-[8px] text-gray-500 dark:text-slate-500 font-black uppercase mb-1">{translate('severity')}</p>
                        <span className={`text-[10px] font-black flex items-center gap-1 w-fit border px-2 py-0.5 rounded-lg ${SEVERITY_CONFIG[detail.SeverityLevel]?.chip}`}>
                          <ShieldAlert className="w-2.5 h-2.5" />
                          {translate(detail.SeverityLevel)}
                        </span>
                      </div>

                      <div className="col-span-2 bg-gray-50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5">
                        <p className="text-[8px] text-gray-500 dark:text-slate-500 font-black uppercase mb-1">{translate('desc')}</p>
                        <p className="font-bold text-gray-800 dark:text-slate-200 leading-5" dir="auto">{detail.Description}</p>
                      </div>

                      <div className="bg-gray-50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5">
                        <p className="text-[8px] text-gray-500 dark:text-slate-500 font-black uppercase mb-1 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {translate('loc')}</p>
                        <p className="font-bold text-gray-800 dark:text-slate-200 font-mono text-[10px]">{detail.Latitude.toFixed(5)}, {detail.Longitude.toFixed(5)}</p>
                      </div>

                      <div className="bg-gray-50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5">
                        <p className="text-[8px] text-gray-500 dark:text-slate-500 font-black uppercase mb-1 flex items-center gap-1"><CalendarDays className="w-2.5 h-2.5" /> {translate('date')}</p>
                        <p className="font-bold text-gray-800 dark:text-slate-200 text-[10px]">
                          {detail.Solved_At ? new Date(detail.Solved_At).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'}
                        </p>
                      </div>
                    </div>

                    {detail.Status !== 'solved' && (
                      <div className="space-y-3 bg-white dark:bg-slate-950/50 border border-gray-200 dark:border-emerald-500/20 rounded-2xl p-4 shadow-sm">
                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{translate('decision')}</p>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder={translate('placeholder')}
                          rows={2}
                          dir="auto"
                          className="w-full px-3.5 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-[12px] text-gray-800 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none shadow-inner"
                        />
                        <button
                          onClick={markSolved}
                          disabled={saving}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#1b9a4c] hover:bg-[#167c3e] disabled:opacity-50 text-white text-xs font-black transition-all shadow-md"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          {translate('solveBtn')}
                        </button>
                      </div>
                    )}

                    {msg && (
                      <div className={`px-3.5 py-2.5 rounded-xl text-[11px] font-bold border ${
                        msg.type === 'success'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                          : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-300'
                      }`}>
                        {msg.text}
                      </div>
                    )}
                  </>
                )}

                {!detail && !detailLoading && (
                  <p className="text-center text-[10px] text-red-500 dark:text-red-400 font-bold py-8">{translate('errorLoad')}</p>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default Complaints;