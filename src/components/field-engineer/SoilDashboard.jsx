import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Loader2, Droplets, Zap, Beaker, Thermometer, AlertTriangle, X, Activity, BarChart2 } from 'lucide-react';
import api from "../../api/axiosConfig";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, CartesianGrid } from 'recharts';
import 'leaflet/dist/leaflet.css';

const MapFlyTo = ({ activeSensor }) => {
  const map = useMap();
  useEffect(() => {
    if (activeSensor && activeSensor.location) {
      const [lng, lat] = activeSensor.location;
      map.flyTo([lat, lng], 16, { animate: true, duration: 1.5 });
    }
  }, [activeSensor, map]);
  return null;
};

const T = {
  en: {
    sessions: "Sensor Sessions",
    critical: "CRITICAL",
    sensor: "Sensor:",
    fullSession: "| Full Session Analytics",
    criticalAlert: "Critical Alert",
    inspection: "Sensor requires immediate inspection.",
    globalComp: "Global Soil Analytics Comparison",
    moistureComp: "Moisture Comparison (%)",
    tempPhComp: "Temp (°C) & pH Comparison",
    critSensors: "Critical Sensors",
    noCrit: "No Critical Sensors Detected. System is stable.",
    moisture: "Moisture (%)",
    temp: "Temp (°C)",
    ph: "pH Level"
  },
  ar: {
    sessions: "جلسات الحساسات",
    critical: "حرج",
    sensor: "حساس:",
    fullSession: "| تحليلات الجلسة الكاملة",
    criticalAlert: "تنبيه حرج",
    inspection: "الحساس يتطلب فحص فوري.",
    globalComp: "مقارنة تحليلات التربة الشاملة",
    moistureComp: "مقارنة الرطوبة (%)",
    tempPhComp: "مقارنة الحرارة والـ pH",
    critSensors: "الحساسات الحرجة",
    noCrit: "لا توجد حساسات حرجة. النظام مستقر.",
    moisture: "الرطوبة (%)",
    temp: "الحرارة (°C)",
    ph: "مستوى الـ pH"
  }
};

const SoilDashboard = ({ isActive, lang = 'en' }) => {
  const [sensors, setSensors] = useState([]);
  const [activeSensor, setActiveSensor] = useState(null);
  const [sensorDetails, setSensorDetails] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);

  const t = (key) => T[lang][key] || key;

  useEffect(() => {
    fetchSensors();
  }, [isActive]);

  const fetchSensors = async (bounds) => {
    setLoading(true);
    try {
      let url = `/sensor/sensorswithreadingslastday`;
      if (bounds) {
        url += `?minLat=${bounds.getSouthWest().lat}&minLng=${bounds.getSouthWest().lng}&maxLat=${bounds.getNorthEast().lat}&maxLng=${bounds.getNorthEast().lng}`;
      }
      const res = await api.get(url);
      setSensors(res.data);
      fetchSummary(bounds);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchSummary = async (bounds) => {
    try {
      let url = `/sensor/analytics/summary`;
      if (bounds) {
        url += `?minLat=${bounds.getSouthWest().lat}&minLng=${bounds.getSouthWest().lng}&maxLat=${bounds.getNorthEast().lat}&maxLng=${bounds.getNorthEast().lng}`;
      }
      const res = await api.get(url);
      setSummaryData(res.data);
    } catch (err) { console.error(err); }
  };

  const MapBoundsHandler = ({ onBoundsChange }) => {
    const map = useMap();
    useEffect(() => {
      const handleMove = () => onBoundsChange(map.getBounds());
      map.on('moveend', handleMove);
      return () => map.off('moveend', handleMove);
    }, [map, onBoundsChange]);
    return null;
  };

  useEffect(() => {
    if (activeSensor) fetchDetails(activeSensor.sensor_id);
  }, [activeSensor]);

  const fetchDetails = async (id) => {
    try {
      const res = await api.get(`/sensor/details/${id}`);
      setSensorDetails(res.data);
    } catch (err) { console.error(err); }
  };

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 bg-slate-950 [.light_&]:bg-[#FBF5DD] p-4 flex flex-col gap-4 text-slate-100 [.light_&]:text-[#594545] transition-colors duration-300 soil-dashboard-container" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <style>{`
        .soil-dashboard-container {
          --c-primary: #fff2d8;    
          --c-secondary: #ead7bb;  
          --c-tertiary: #bca37f;   
          --c-bg: #0f172a;         
          --chart-text: #fff2d8;
          --chart-grid: rgba(234, 215, 187, 0.2);
        }
        :root.light .soil-dashboard-container, .light .soil-dashboard-container {
          --c-primary: #594545;    
          --c-secondary: #815b5b;  
          --c-tertiary: #9e7676;   
          --c-bg: #fff8ea;         
          --chart-text: #594545;
          --chart-grid: rgba(89, 69, 69, 0.2);
        }
      `}</style>

      <div className="h-32 bg-slate-900/90 [.light_&]:bg-[#fff8ea] rounded-2xl p-3 border border-slate-800 [.light_&]:border-[#D4CD9B] overflow-y-auto shadow-sm">
        <h3 className="text-xs font-bold mb-2 flex items-center gap-2 text-slate-200 [.light_&]:text-[#594545]">
          <Activity className="w-3 h-3 text-emerald-400 [.light_&]:text-[#815b5b]"/> {t('sessions')}
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {sensors.map(s => {
            const isCritical = s.latest_reading?.soil_moisture < 20 || s.latest_reading?.temperature > 40;
            return (
              <button key={s.sensor_id} onClick={() => setActiveSensor(s)}
                className={`p-2 rounded-lg border text-start transition-all text-[10px] ${
                  activeSensor?.sensor_id === s.sensor_id 
                  ? 'border-emerald-500 [.light_&]:border-[#594545] bg-emerald-500/10 [.light_&]:bg-[#594545]/10 text-emerald-400 [.light_&]:text-[#594545] font-black' 
                  : 'border-slate-800 [.light_&]:border-[#D4CD9B] bg-slate-950 [.light_&]:bg-[#FBF5DD] text-slate-300 [.light_&]:text-[#815b5b] hover:border-slate-600 [.light_&]:hover:border-[#9e7676]'
                }`}>
                <p className="font-bold truncate">{s.name}</p>
                {isCritical && <p className="text-[9px] text-red-500 font-black truncate">{t('critical')}</p>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        <div className="w-1/4 bg-slate-900 [.light_&]:bg-[#fff8ea] rounded-2xl overflow-hidden border border-slate-800 [.light_&]:border-[#D4CD9B] relative shadow-md">
          <MapContainer center={[30.565, 30.932]} zoom={10} className="w-full h-full" zoomControl={false}>
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
            {sensors.map(s => (
              <CircleMarker key={s.sensor_id} center={[s.location[1], s.location[0]]} radius={6} 
                pathOptions={{ 
                  color: (s.latest_reading?.soil_moisture < 20 || s.latest_reading?.temperature > 40) ? '#ef4444' : '#10b981',
                  fillColor: (s.latest_reading?.soil_moisture < 20 || s.latest_reading?.temperature > 40) ? '#ef4444' : '#10b981',
                  fillOpacity: 0.6
                }}
                eventHandlers={{ click: () => setActiveSensor(s) }}>
                <Popup className="custom-popup">
                    <span className="font-bold">{s.name}</span>
                </Popup>
              </CircleMarker>
            ))}
            <MapFlyTo activeSensor={activeSensor} />
            <MapBoundsHandler onBoundsChange={(b) => { fetchSensors(b); }} />
          </MapContainer>
        </div>

        <div className="flex-1 bg-slate-900/80 [.light_&]:bg-[#fff8ea]/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-800 [.light_&]:border-[#D4CD9B] overflow-y-auto shadow-md">
          {activeSensor ? (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center pb-3 border-b border-slate-850 [.light_&]:border-[#D4CD9B]">
                <h2 className="text-xl font-black text-emerald-400 [.light_&]:text-[#594545]">
                  {t('sensor')} {activeSensor.name} 
                  <span className="text-slate-400 [.light_&]:text-[#815b5b] font-normal text-lg"> {t('fullSession')}</span>
                </h2>
                <button onClick={() => setActiveSensor(null)} className="text-slate-400 hover:text-red-400 transition-colors bg-slate-950 [.light_&]:bg-[#FBF5DD] p-1.5 rounded-lg border border-slate-800 [.light_&]:border-[#D4CD9B]"><X className="w-5 h-5"/></button>
              </div>
              
              {sensorDetails?.is_critical && (
                <div className="bg-red-950/40 [.light_&]:bg-red-100 p-4 rounded-xl flex items-center gap-3 text-red-400 [.light_&]:text-red-700 border border-red-500/30 [.light_&]:border-red-400">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                  <div><p className="font-bold">{t('criticalAlert')}</p><p className="text-xs opacity-80">{t('inspection')}</p></div>
                </div>
              )}

              <div className="h-64 bg-slate-950 [.light_&]:bg-[#fff8ea] p-4 rounded-xl border border-slate-800 [.light_&]:border-[#D4CD9B]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sensorDetails?.history || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.6}/>
                    <XAxis dataKey="timestamp" stroke="var(--chart-text)" fontSize={10} tickLine={false} />
                    <YAxis stroke="var(--chart-text)" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{backgroundColor: 'var(--c-bg)', borderColor: 'var(--c-secondary)', color: 'var(--chart-text)', borderRadius: '12px'}} itemStyle={{color: 'var(--chart-text)', fontWeight: 'bold'}}/>
                    <Legend wrapperStyle={{color: 'var(--chart-text)', fontSize: '12px', fontWeight: 'bold'}}/>
                    <Line type="monotone" dataKey="temperature" name={t('temp')} stroke="var(--c-secondary)" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="soil_moisture" name={t('moisture')} stroke="var(--c-primary)" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="soil_ph" name={t('ph')} stroke="var(--c-tertiary)" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-black text-slate-100 [.light_&]:text-[#594545] flex items-center gap-2 pb-3 border-b border-slate-850 [.light_&]:border-[#D4CD9B]">
                <BarChart2 className="text-emerald-400 [.light_&]:text-[#815b5b]"/> {t('globalComp')}
              </h2>
              
              {summaryData && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="bg-slate-950 [.light_&]:bg-[#fff8ea] p-4 rounded-xl border border-slate-800 [.light_&]:border-[#D4CD9B] shadow-sm">
                    <p className="text-xs font-bold text-slate-400 [.light_&]:text-[#815b5b] uppercase tracking-wider mb-2">{t('moistureComp')}</p>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={summaryData.all_stats} margin={{top:10, right:10, left:-15, bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.6}/>
                        <XAxis dataKey="name" stroke="var(--chart-text)" fontSize={9} tickLine={false} fontWeight="bold"/>
                        <YAxis stroke="var(--chart-text)" fontSize={10} tickLine={false}/>
                        <Tooltip contentStyle={{backgroundColor: 'var(--c-bg)', borderColor: 'var(--c-secondary)', borderRadius: '12px', color: 'var(--chart-text)', fontWeight: 'bold'}} itemStyle={{color: 'var(--chart-text)'}} cursor={{fill: 'var(--chart-grid)', opacity: 0.4}}/>
                        <Bar name={t('moisture')} dataKey="latest_moisture" fill="var(--c-primary)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-slate-950 [.light_&]:bg-[#fff8ea] p-4 rounded-xl border border-slate-800 [.light_&]:border-[#D4CD9B] shadow-sm">
                    <p className="text-xs font-bold text-slate-400 [.light_&]:text-[#815b5b] uppercase tracking-wider mb-2">{t('tempPhComp')}</p>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={summaryData.all_stats} margin={{top:10, right:10, left:-15, bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.6}/>
                        <XAxis dataKey="name" stroke="var(--chart-text)" fontSize={9} tickLine={false} fontWeight="bold"/>
                        <YAxis stroke="var(--chart-text)" fontSize={10} tickLine={false}/>
                        <Tooltip contentStyle={{backgroundColor: 'var(--c-bg)', borderColor: 'var(--c-secondary)', borderRadius: '12px', color: 'var(--chart-text)', fontWeight: 'bold'}} itemStyle={{color: 'var(--chart-text)'}} cursor={{fill: 'var(--chart-grid)', opacity: 0.4}}/>
                        <Legend wrapperStyle={{color: 'var(--chart-text)', fontSize: '11px', fontWeight: 'bold'}} iconSize={8}/>
                        <Bar dataKey="latest_temp" name={t('temp')} fill="var(--c-secondary)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="latest_ph" name={t('ph')} fill="var(--c-tertiary)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="bg-red-950/30 [.light_&]:bg-red-50 border border-red-500/20 [.light_&]:border-red-300 p-4 rounded-xl col-span-full">
                    <p className="text-sm font-black text-red-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> {t('critSensors')} ({summaryData.summary.critical_count})</p>
                    <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {summaryData.summary.critical_sensors.map(s => (
                        <div key={s.sensor_id} className="bg-red-950/40 [.light_&]:bg-red-100 border border-red-500/10 [.light_&]:border-red-200 p-2 rounded-lg">
                           <p className="text-xs font-bold text-red-300 [.light_&]:text-red-700 truncate">{s.name}</p>
                           <p className="text-[10px] text-red-400/80 [.light_&]:text-red-600 mt-1">{s.latest_moisture}% Moisture</p>
                        </div>
                      ))}
                      {summaryData.summary.critical_count === 0 && (
                          <p className="text-xs font-bold text-emerald-400 [.light_&]:text-[#594545] col-span-full">{t('noCrit')}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SoilDashboard;