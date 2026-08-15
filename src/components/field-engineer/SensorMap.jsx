import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Layers, Database, Compass, Loader2, Activity, X, AlertTriangle, Droplets, Thermometer, Beaker, Zap, MapPin } from 'lucide-react';
import api from "../../api/axiosConfig";
import 'leaflet/dist/leaflet.css';
import AddSensorForm from '../AddSensorForm';
import TelemetryForm from '../TelemetryForm';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Chatbot from './Chatbot';

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

const MapClickDetector = ({ onMapClick }) => {
  const map = useMap();
  useEffect(() => {
    const handleClick = (e) => onMapClick([e.latlng.lng, e.latlng.lat]);
    map.on('click', handleClick);
    return () => map.off('click', handleClick);
  }, [map, onMapClick]);
  return null;
};

const T = {
  en: {
    catalog: "Nodes Catalog", ops: "Node Operations", deploy: "Deploy Node", inject: "Inject Telemetry",
    noNodes: "No deployed nodes found.", deployFirst: "Deploy your first node now",
    execute: "Execute Soil Interpolation", hide: "Hide Interpolation",
    legend: "Layer Controls & Legend", clickInst: "Click anywhere on map to select deployment coordinates"
  },
  ar: {
    catalog: "كتالوج العقد", ops: "العمليات", deploy: "نشر عقدة", inject: "إدخال قراءات",
    noNodes: "لا توجد عقد منشورة.", deployFirst: "انشر أول عقدة الآن",
    execute: "تنفيذ الاستيفاء المكاني", hide: "إخفاء الاستيفاء",
    legend: "مفاتيح الخرائط والطبقات", clickInst: "اضغط على أي مكان في الخريطة لتحديد الإحداثيات"
  }
};

const SensorMap = ({ isActive, lang = 'en' }) => {
  const [activeSensor, setActiveSensor] = useState(null);
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clickedCoords, setClickedCoords] = useState(null);
  const [sidebarTab, setSidebarTab] = useState('catalog');
  const [controlSubTab, setControlSubTab] = useState('deploy');
  const [sensorDetails, setSensorDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [interpolationMaps, setInterpolationMaps] = useState(null);
  const [activeLayers, setActiveLayers] = useState({ moisture: true, temperature: true, ph: true });
  
  const [basemap, setBasemap] = useState('esri');
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);
  const basemaps = [
    { id: 'esri', name: 'ESRI Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', subdomains: 'abc' },
    { id: 'google', name: 'Google Satellite', url: 'https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', subdomains: ['mt0', 'mt1', 'mt2', 'mt3'] },
    { id: 'dark', name: 'Carto Dark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', subdomains: 'abc' },
  ];

  const t = (key) => T[lang][key] || key;

  const handleMapTap = (coords) => {
    setClickedCoords(coords);
    setSidebarTab('controls');
    setControlSubTab('deploy');
  };

  const toggleLayer = (layer) => setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));

  useEffect(() => {
    if (activeSensor) {
      setDetailsLoading(true);
      api.get(`/sensor/details/${activeSensor.id}`)
        .then(res => setSensorDetails(res.data))
        .catch(err => console.error(err))
        .finally(() => setDetailsLoading(false));
    }
  }, [activeSensor]);

  const fetchLiveLatestReadings = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/sensor/sensorswithreadingslastday`);
      const processed = res.data.map(s => {
        const reading = s.latest_reading || {};
        const moisture = reading.soil_moisture || 0;
        let status = moisture === 0 ? 'Warning' : moisture < 20 ? 'Critical' : moisture < 35 ? 'Warning' : 'Normal';
        return {
          id: s.sensor_id, name: s.name, description: s.description || 'No description provided.',
          location: s.location, salinity: (reading.temperature ? (reading.temperature * 0.15).toFixed(1) : '1.5'),
          moisture: Math.floor(moisture), ph: parseFloat(reading.soil_ph || 7.2).toFixed(1),
          temperature: reading.temperature || 24.0, status, timestamp: reading.timestamp || "No server timestamp"
        };
      });
      setSensors(processed);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { if (isActive) fetchLiveLatestReadings(); }, [isActive]);

  const toggleInterpolation = async () => {
    if (interpolationMaps) {
      setInterpolationMaps(null);
    } else {
      if (sensors.length === 0) return alert("No sensors available.");
      setLoading(true);
      const lats = sensors.map(s => s.location[1]);
      const lngs = sensors.map(s => s.location[0]);
      const minLat = Math.min(...lats) - 0.05, maxLat = Math.max(...lats) + 0.05;
      const minLng = Math.min(...lngs) - 0.05, maxLng = Math.max(...lngs) + 0.05;
      const analysisGeometry = [[minLng, minLat], [maxLng, minLat], [maxLng, maxLat], [minLng, maxLat], [minLng, minLat]];
      
      try {
        // تم التعديل هنا
        const res = await api.post(`/sensor/analytics/interpolate`, { geometry: analysisGeometry, buffer_range: 5000 });
        setInterpolationMaps(res.data.maps);
      } catch (err) { alert("Interpolation failed"); } 
      finally { setLoading(false); }
    }
  };

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 flex bg-slate-950 font-sans text-slate-100 overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-96 bg-slate-900/90 backdrop-blur-md border-x border-slate-800 h-full flex flex-col z-30 relative shadow-2xl shrink-0">
        <div className="flex border-b border-slate-800 bg-slate-950/40">
          <button onClick={() => setSidebarTab('catalog')} className={`flex-1 py-4 text-center text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${sidebarTab === 'catalog' ? 'border-b-2 border-emerald-500 text-emerald-450 bg-slate-900/10' : 'text-slate-400 hover:text-slate-200'}`}>
            <Database className="w-3.5 h-3.5" /> {t('catalog')}
          </button>
          <button onClick={() => setSidebarTab('controls')} className={`flex-1 py-4 text-center text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${sidebarTab === 'controls' ? 'border-b-2 border-emerald-500 text-emerald-450 bg-slate-900/10' : 'text-slate-400 hover:text-slate-200'}`}>
            <Compass className="w-3.5 h-3.5" /> {t('ops')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeSensor && sidebarTab === 'catalog' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-bold text-emerald-400">{activeSensor.name}</h3>
                <button onClick={() => setActiveSensor(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4"/></button>
              </div>
              {detailsLoading ? <Loader2 className="animate-spin w-6 h-6 mx-auto text-emerald-500" /> : sensorDetails && (
                <div className="space-y-4">
                  {sensorDetails.is_critical && (
                    <div className="bg-red-950/50 border border-red-500 p-3 rounded-lg flex items-center gap-2 text-red-200">
                      <AlertTriangle className="w-5 h-5"/>
                      <span className="text-xs font-bold">Critical Readings Alert</span>
                    </div>
                  )}
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sensorDetails.history}><XAxis dataKey="timestamp" hide /><YAxis hide /><Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155'}}/><Legend /><Line type="monotone" dataKey="temperature" stroke="#f97316" dot={false} /><Line type="monotone" dataKey="soil_moisture" stroke="#3b82f6" dot={false} /><Line type="monotone" dataKey="soil_ph" stroke="#2dd4bf" dot={false} /></LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {sidebarTab === 'catalog' ? (
            <div className="space-y-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-500"><Loader2 className="w-6 h-6 text-emerald-500 animate-spin" /></div>
              ) : sensors.length === 0 ? (
                <div className="text-center p-6 border border-dashed border-slate-800 rounded-xl text-slate-500 space-y-2">
                  <Activity className="w-6 h-6 mx-auto text-slate-600" />
                  <p className="text-xs font-medium">{t('noNodes')}</p>
                  <button onClick={() => { setSidebarTab('controls'); setControlSubTab('deploy'); }} className="text-[10px] text-emerald-400 font-bold underline">{t('deployFirst')}</button>
                </div>
              ) : (
                sensors.map((sensor) => {
                  const isSelected = activeSensor?.id === sensor.id;
                  const isCritical = sensor.moisture < 20;
                  const statusColor = isCritical ? 'bg-red-500' : sensor.status === 'Warning' ? 'bg-yellow-500' : 'bg-emerald-500';
                  return (
                    <div key={sensor.id} onClick={() => setActiveSensor(sensor)} className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 ${isSelected ? 'border-emerald-500/50 bg-slate-900 shadow-md ring-1 ring-emerald-500/30' : 'border-slate-800 bg-slate-900/30 hover:bg-slate-900/50 hover:border-slate-700'}`}>
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${statusColor} ${isCritical ? 'animate-ping' : ''}`}></span>
                          <p className="text-xs font-bold text-slate-200 font-mono">{sensor.name}</p>
                        </div>
                        <p className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${isCritical ? 'bg-red-950 text-red-400 border border-red-500/10' : sensor.status === 'Warning' ? 'bg-yellow-950 text-yellow-450 border border-yellow-500/10' : 'bg-emerald-950 text-emerald-450 border border-emerald-500/10'}`}>{isCritical ? 'Critical' : sensor.status}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                        <div className="bg-slate-950 p-2 rounded border border-slate-850"><p className="text-[7.5px] text-slate-500 uppercase tracking-wider">Moist</p><p className={`text-xs font-bold ${isCritical ? 'text-red-400' : 'text-slate-350'}`}>{sensor.moisture}%</p></div>
                        <div className="bg-slate-950 p-2 rounded border border-slate-850"><p className="text-[7.5px] text-slate-500 uppercase tracking-wider">Temp</p><p className="text-xs font-bold text-slate-350">{sensor.temperature}°C</p></div>
                        <div className="bg-slate-950 p-2 rounded border border-slate-850"><p className="text-[7.5px] text-slate-500 uppercase tracking-wider">pH</p><p className="text-xs font-bold text-slate-350">{sensor.ph}</p></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-4 flex flex-col items-center">
              <div className="flex w-full bg-slate-950/80 p-1 rounded-xl border border-slate-850 mb-3 text-center">
                <button onClick={() => setControlSubTab('deploy')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${controlSubTab === 'deploy' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>{t('deploy')}</button>
                <button onClick={() => setControlSubTab('telemetry')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${controlSubTab === 'telemetry' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>{t('inject')}</button>
              </div>
              {controlSubTab === 'deploy' ? <AddSensorForm initialCoordinates={clickedCoords} onSensorAdded={fetchLiveLatestReadings} onCancel={() => setClickedCoords(null)}/> : <TelemetryForm sensors={sensors} selectedSensorId={activeSensor?.id} onTelemetrySubmitted={fetchLiveLatestReadings}/>}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
          <button onClick={toggleInterpolation} className={`flex items-center justify-center gap-2 px-4 py-3 w-full rounded-xl font-bold text-xs transition-all shadow-sm border ${interpolationMaps ? 'bg-red-600 border-red-600 text-white hover:bg-red-500' : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-500'}`}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Layers className="w-4 h-4" />}
            {interpolationMaps ? t('hide') : t('execute')}
          </button>
          
          {interpolationMaps && (
            <div className="mt-4 space-y-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px]">
              <p className="font-bold text-slate-400 uppercase tracking-wider">{t('legend')}</p>
              <div className="space-y-1"><div className="flex items-center justify-between"><span className="capitalize">Moisture</span><input type="checkbox" checked={activeLayers.moisture} onChange={() => toggleLayer('moisture')} /></div><div className="h-2 w-full bg-gradient-to-r from-[#8B4513] via-[#FFFF00] to-[#006400] rounded"></div></div>
              <div className="space-y-1"><div className="flex items-center justify-between"><span className="capitalize">Temp</span><input type="checkbox" checked={activeLayers.temperature} onChange={() => toggleLayer('temperature')} /></div><div className="h-2 w-full bg-gradient-to-r from-blue-500 via-yellow-400 to-red-500 rounded"></div></div>
            </div>
          )}
        </div>
      </div>

      {/* MAP CONTAINER */}
      <div className="flex-1 h-full relative z-10">
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

        <Chatbot buttonPositionClasses="absolute bottom-[24px] right-[20px]" />

        <MapContainer center={[30.565, 30.932]} zoom={12} className="w-full h-full z-10" zoomControl={false}>
          {basemaps.map(b => (b.id === basemap && <TileLayer key={b.id} url={b.url} subdomains={b.subdomains} maxZoom={20} />))}
          <MapFlyTo activeSensor={activeSensor} />
          <MapClickDetector onMapClick={handleMapTap} />

          {interpolationMaps && (
            <>
              {activeLayers.moisture && <TileLayer url={interpolationMaps.moisture} opacity={0.6} zIndex={20} />}
              {activeLayers.temperature && <TileLayer url={interpolationMaps.temperature} opacity={0.6} zIndex={21} />}
              {activeLayers.ph && <TileLayer url={interpolationMaps.ph} opacity={0.6} zIndex={22} />}
            </>
          )}

          {!interpolationMaps && sensors.map((sensor) => {
            const isSelected = activeSensor?.id === sensor.id;
            const isCritical = sensor.moisture < 20;
            const markerColor = isCritical ? '#ef4444' : sensor.status === 'Warning' ? '#facc15' : '#10b981';
            const [lng, lat] = sensor.location;
            return (
              <CircleMarker key={sensor.id} center={[lat, lng]} radius={isSelected ? 11 : 7} pathOptions={{ color: isSelected ? '#ffffff' : markerColor, weight: isSelected ? 3 : 1.5, fillColor: markerColor, fillOpacity: isCritical ? 0.95 : 0.8 }} className={isCritical ? 'animate-pulse' : ''} eventHandlers={{ click: () => setActiveSensor(sensor) }}>
                <Popup closeButton={false} offset={[0, -10]}>
                  <div className="w-56 p-1 text-slate-100 bg-slate-950 border border-slate-800 rounded-xl text-right font-sans" dir="rtl">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2"><span className="font-bold text-emerald-450 text-xs">{sensor.name}</span></div>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between items-center"><span className="text-slate-400 font-sans flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-blue-500"/> رطوبة:</span><span className={`font-bold ${isCritical ? 'text-red-400' : 'text-slate-200'}`}>{sensor.moisture}%</span></div>
                      <div className="flex justify-between items-center"><span className="text-slate-400 font-sans flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-orange-500"/> حرارة:</span><span className="font-bold text-slate-200">{sensor.temperature}°C</span></div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
        
        <div className="absolute top-6 left-6 z-40 bg-slate-900/80 backdrop-blur-md border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg text-[10px] pointer-events-none uppercase tracking-wider font-medium" dir="ltr">
          <MapPin className="w-4 h-4 text-emerald-400 animate-bounce" />
          {t('clickInst')}
        </div>
      </div>
    </div>
  );
};

export default SensorMap;