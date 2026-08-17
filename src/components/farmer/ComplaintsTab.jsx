import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FileWarning, LocateFixed, Loader2, MapPin, PlusCircle, AlertTriangle, Inbox, ShieldAlert, Leaf, Wrench, ExternalLink, CalendarDays, X, ClipboardCheck, HardHat } from 'lucide-react';
import api, { resolveImageUrl } from '../../api/axiosConfig';
import ReportModal from './ReportModal';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const DEFAULT_CENTER = [26.8206, 30.8025];

const LocationPicker = ({ position, onPick }) => {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
};

const FlyTo = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 15, { duration: 1.2 });
  }, [position, map]);
  return null;
};

const SEVERITY_COLORS = {
  'منخفضة': { dot: '#1b9a4c', border: 'border-emerald-500/30', text: 'text-emerald-400', chip: 'bg-emerald-950/40' },
  'متوسطة': { dot: '#d97706', border: 'border-amber-500/30', text: 'text-amber-400', chip: 'bg-amber-950/40' },
  'حرجة':   { dot: '#dc2626', border: 'border-red-500/30', text: 'text-red-400', chip: 'bg-red-950/40' },
};

const STATUS_META = {
  'waiting':        { label: 'قيد الانتظار', chip: 'bg-sky-950/40 border-sky-500/30 text-sky-400' },
  'solved':         { label: 'محلول', chip: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' },
  'decision_maker': { label: 'مُحال لصانع القرار', chip: 'bg-violet-950/40 border-violet-500/30 text-violet-400' },
};

const ComplaintsTab = () => {
  const [position, setPosition] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(0);
  const [myReports, setMyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setGpsError('جهازك لا يدعم تحديد الموقع الجغرافي');
      return;
    }
    setLocating(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) {
          setGpsError('تم رفض إذن تحديد الموقع — يمكنك تحديد الموقع يدوياً بالنقر على الخريطة');
        } else if (err.code === 2) {
          setGpsError('تعذر الوصول لموقعك — استخدم النقر على الخريطة للتحديد اليدوي');
        } else {
          setGpsError('انتهت مهلة تحديد الموقع — حاول مرة أخرى أو استخدم الخريطة');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
    if (!userInfo.email) return;
    let cancelled = false;
    setLoadingReports(true);
    api
      .get('/Reports')
      .then((res) => {
        if (!cancelled) {
          setMyReports(res.data.filter((r) => r.Email === userInfo.email));
        }
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoadingReports(false));
    return () => { cancelled = true; };
  }, [submitted]);

  const openImage = (imgPath) => {
    if (imgPath) window.open(resolveImageUrl(imgPath), '_blank');
  };

  const openDetail = (rep) => {
    setDetailId(rep.Id);
    setSelectedDetail(null);
    setDetailError(false);
    setDetailLoading(true);
    api
      .get(`/Reports/${rep.Id}`)
      .then((res) => setSelectedDetail(res.data))
      .catch(() => setDetailError(true))
      .finally(() => setDetailLoading(false));
  };

  const closeDetail = () => {
    setDetailId(null);
    setSelectedDetail(null);
  };

  return (
    <div className="space-y-6 animate-card">
      {/* Map with location picker */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-950/60 border border-emerald-500/30 p-2 rounded-xl">
              <MapPin className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-100">تحديد موقع الإصابة</h2>
              <p className="text-[10px] text-slate-500">
                اضغط على الخريطة أو استخدم موقع جهازك
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={useMyLocation}
              disabled={locating}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50 text-[10px] font-bold transition-all disabled:opacity-50"
            >
              {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
              {locating ? 'جارٍ تحديد الموقع...' : 'استخدام موقعي'}
            </button>
            {position && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                {position[0].toFixed(5)}, {position[1].toFixed(5)}
              </span>
            )}
          </div>
        </div>

        {gpsError && (
          <div className="flex items-center gap-2 px-5 py-2.5 bg-amber-950/30 border-b border-amber-500/20 text-amber-300 text-[10px] font-bold">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {gpsError}
          </div>
        )}

        <div className="relative z-0">
          <MapContainer center={DEFAULT_CENTER} zoom={6} className="h-72 w-full" scrollWheelZoom>
            {/* استخدام خريطة القمر الصناعي من ايزري هنا بدلاً من OpenStreetMap */}
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="&copy; ESRI Satellite"
              maxZoom={20}
            />
            <LocationPicker position={position} onPick={setPosition} />
            <FlyTo position={position} />
          </MapContainer>
        </div>
      </div>

      {/* Submit button */}
      <div className="flex items-center justify-center">
        <button
          onClick={() => position && setShowModal(true)}
          disabled={!position}
          className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-black shadow-lg shadow-emerald-900/40 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          إضافة بلاغ إصابة
        </button>
      </div>
      {!position && (
        <p className="text-center text-[10px] text-slate-500 font-bold flex items-center justify-center gap-1.5">
          <MapPin className="w-3 h-3" />
          حدد موقع الإصابة على الخريطة أو استخدم موقع جهازك
        </p>
      )}

      {submitted > 0 && (
        <div className="flex items-center gap-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-bold animate-card">
          <FileWarning className="w-4 h-4 shrink-0" />
          تم إرسال بلاغك بنجاح — سيتم مراجعته من المهندس الزراعي
        </div>
      )}

      {/* My reports */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-950/60 border border-emerald-500/30 p-2 rounded-xl">
              <Inbox className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-100">بلاغاتي</h2>
              <p className="text-[10px] text-slate-500">
                جميع البلاغات التي قمت بإرسالها
              </p>
            </div>
          </div>
          {myReports.length > 0 && (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
              {myReports.length} بلاغ
            </span>
          )}
        </div>

        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {loadingReports && (
            <p className="text-center text-[10px] text-slate-500 font-bold flex items-center justify-center gap-2 py-6">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              جارٍ تحميل البلاغات...
            </p>
          )}
          {!loadingReports && myReports.length === 0 && (
            <p className="text-center text-[10px] text-slate-500 font-bold py-8">
              لا توجد بلاغات بعد — أرسل أول بلاغ من الخريطة بالأعلى
            </p>
          )}
          {myReports.map((r) => {
            const sev = SEVERITY_COLORS[r.SeverityLevel] || SEVERITY_COLORS['متوسطة'];
            const st = STATUS_META[r.Status] || STATUS_META['waiting'];
            return (
              <div
                key={r.Id}
                onClick={() => openDetail(r)}
                className="flex gap-3 bg-slate-950/50 border border-slate-800 rounded-2xl p-3.5 hover:border-emerald-500/50 hover:bg-slate-900/60 transition-all cursor-pointer"
              >
                {r.Image ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); openImage(r.Image); }}
                    title="فتح الصورة في تبويب جديد"
                    className="shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-slate-700 bg-slate-800 hover:ring-2 hover:ring-emerald-500/50 transition-all"
                  >
                    <img src={resolveImageUrl(r.Image)} alt="بلاغ" className="w-full h-full object-cover" />
                  </button>
                ) : (
                  <div className="shrink-0 w-20 h-20 rounded-xl border border-slate-700 bg-slate-800 flex items-center justify-center">
                    <FileWarning className="w-6 h-6 text-slate-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${st.chip}`}>
                      {st.label}
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${sev.chip} ${sev.border} border ${sev.text}`}>
                      <ShieldAlert className="w-2.5 h-2.5 inline ml-1 -mt-0.5" />
                      {r.SeverityLevel}
                    </span>
                    <span className="text-[10px] font-black text-slate-300 flex items-center gap-1">
                      {r.ProblemType === 'مشكلة في محاصيل' ? <Leaf className="w-3 h-3 text-emerald-400" /> : <Wrench className="w-3 h-3 text-emerald-400" />}
                      {r.ProblemType}
                      {r.CropType ? ` — ${r.CropType}` : ''}
                      {r.ProblemName ? ` — ${r.ProblemName}` : ''}
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1 mr-auto">
                      <CalendarDays className="w-3 h-3" />
                      {new Date(r.Created_At).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-5 line-clamp-2">{r.Description}</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[9px] font-mono text-slate-600">
                      {r.Latitude.toFixed(5)}, {r.Longitude.toFixed(5)}
                    </p>
                    <span className="text-[9px] font-black text-emerald-400/70 flex items-center gap-0.5">
                      التفاصيل والاستجابة
                      <span className="text-[10px]">←</span>
                    </span>
                  </div>
                </div>
                {r.Image && (
                  <button
                    onClick={(e) => { e.stopPropagation(); openImage(r.Image); }}
                    className="shrink-0 self-start p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-all"
                    title="عرض الصورة"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {detailId !== null &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            dir="rtl"
            onClick={closeDetail}
          >
            <div
              className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
                <div className="flex items-center gap-2.5">
                  <div className="bg-emerald-950/60 border border-emerald-500/30 p-2 rounded-xl">
                    <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-100">تفاصيل البلاغ</h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Complaint #{detailId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedDetail && (
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg border ${(STATUS_META[selectedDetail.Status] || STATUS_META['waiting']).chip}`}>
                      {(STATUS_META[selectedDetail.Status] || STATUS_META['waiting']).label}
                    </span>
                  )}
                  <button onClick={closeDetail} className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto min-h-0 space-y-4">
                {detailLoading && (
                  <p className="text-center text-[10px] text-slate-500 font-bold flex items-center justify-center gap-2 py-10">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    جارٍ تحميل التفاصيل...
                  </p>
                )}

                {detailError && !detailLoading && (
                  <div className="text-center py-10 space-y-3">
                    <p className="text-[10px] text-red-400 font-bold">تعذر تحميل تفاصيل البلاغ</p>
                    <button
                      onClick={() => selectedDetail && openDetail(selectedDetail)}
                      className="px-4 py-2 rounded-xl bg-red-950 border border-red-500/30 text-red-300 text-[10px] font-black"
                    >
                      إعادة المحاولة
                    </button>
                  </div>
                )}

                {selectedDetail && !detailLoading && (
                  <>
                    {selectedDetail.Image ? (
                      <a href={resolveImageUrl(selectedDetail.Image)} target="_blank" rel="noreferrer" title="فتح الصورة في تبويب جديد">
                        <img src={resolveImageUrl(selectedDetail.Image)} alt="بلاغ" className="w-full max-h-52 object-cover rounded-2xl border border-slate-700 hover:ring-2 hover:ring-emerald-500/50 transition-all" />
                      </a>
                    ) : (
                      <div className="w-full h-36 rounded-2xl border border-slate-800 bg-slate-950/50 flex flex-col items-center justify-center gap-2 text-slate-600">
                        <FileWarning className="w-6 h-6" />
                        <span className="text-[9px] font-bold">لا توجد صورة مرفقة</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                      <div className="col-span-2 bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2.5">
                        <p className="text-[8px] text-slate-500 font-black uppercase mb-1">المشكلة</p>
                        <p className="font-bold text-slate-200 flex items-center gap-1">
                          {selectedDetail.ProblemType === 'مشكلة في محاصيل' ? <Leaf className="w-3 h-3 text-emerald-400" /> : <Wrench className="w-3 h-3 text-emerald-400" />}
                          {selectedDetail.ProblemType}
                          {selectedDetail.CropType ? ` — ${selectedDetail.CropType}` : ''}
                          {selectedDetail.ProblemName ? ` — ${selectedDetail.ProblemName}` : ''}
                        </p>
                      </div>
                      <div className="bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2.5">
                        <p className="text-[8px] text-slate-500 font-black uppercase mb-1">الخطورة</p>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${(SEVERITY_COLORS[selectedDetail.SeverityLevel] || SEVERITY_COLORS['متوسطة']).border} ${(SEVERITY_COLORS[selectedDetail.SeverityLevel] || SEVERITY_COLORS['متوسطة']).text}`}>
                          <ShieldAlert className="w-2.5 h-2.5 inline ml-1 -mt-0.5" />
                          {selectedDetail.SeverityLevel}
                        </span>
                      </div>
                      <div className="bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2.5">
                        <p className="text-[8px] text-slate-500 font-black uppercase mb-1 flex items-center gap-1"><CalendarDays className="w-2.5 h-2.5" /> تاريخ الإرسال</p>
                        <p className="font-bold text-slate-200 text-[10px]">
                          {new Date(selectedDetail.Created_At).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                      <div className="bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2.5">
                        <p className="text-[8px] text-slate-500 font-black uppercase mb-1 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> الموقع</p>
                        <p className="font-bold text-slate-200 font-mono text-[10px]">{selectedDetail.Latitude.toFixed(5)}, {selectedDetail.Longitude.toFixed(5)}</p>
                      </div>
                      <div className="col-span-2 bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2.5">
                        <p className="text-[8px] text-slate-500 font-black uppercase mb-1">وصف المشكلة</p>
                        <p className="font-bold text-slate-200 leading-5">{selectedDetail.Description}</p>
                      </div>
                    </div>

                    {/* استجابة المهندس / صانع القرار */}
                    {selectedDetail.Status === 'waiting' ? (
                      <div className="bg-sky-950/20 border border-sky-500/20 rounded-2xl p-4 text-center text-[11px] font-bold text-sky-300">
                        بلاغك قيد الانتظار — سيتم مراجعته من المهندس الزراعي
                      </div>
                    ) : (
                      <div className={`rounded-2xl border p-4 space-y-2.5 ${selectedDetail.Status === 'solved' ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-violet-950/20 border-violet-500/20'}`}>
                        <p className={`text-[10px] font-black flex items-center gap-1.5 ${selectedDetail.Status === 'solved' ? 'text-emerald-400' : 'text-violet-400'}`}>
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          {selectedDetail.Status === 'solved'
                            ? 'آخر استجابة / الحل النهائي المسجّل'
                            : 'استجابة المهندس (مُحال لصانع القرار)'}
                        </p>
                        {selectedDetail.Solution && (
                          <p className="text-[12px] text-slate-200 leading-5 bg-slate-950/40 rounded-lg px-3 py-2">
                            {selectedDetail.Solution}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-slate-300 text-[10px] font-bold">
                          <HardHat className="w-3 h-3 text-amber-300" />
                          {selectedDetail.EngineerName || '—'}
                        </div>
                        {selectedDetail.EngineerEmail && (
                          <div className="text-[9px] text-slate-500 font-mono text-left" dir="ltr">
                            {selectedDetail.EngineerEmail}
                          </div>
                        )}
                        {selectedDetail.Solved_At && (
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold">
                            <CalendarDays className="w-2.5 h-2.5" />
                            {new Date(selectedDetail.Solved_At).toLocaleString('ar-EG')}
                          </div>
                        )}
                        {selectedDetail.Status === 'decision_maker' && (
                          <p className="text-[10px] font-black text-violet-300">
                            في انتظار قرار صانع القرار...
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {showModal && (
        <ReportModal
          location={{ lat: position[0], lng: position[1] }}
          onClose={() => setShowModal(false)}
          onReportAdded={() => setSubmitted((n) => n + 1)}
        />
      )}
    </div>
  );
};

export default ComplaintsTab;