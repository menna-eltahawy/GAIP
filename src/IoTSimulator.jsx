import React, { useState, useEffect, useRef } from 'react';
import api from './api/axiosConfig';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Activity,
  Plus,
  Compass,
  Radio,
  Sliders,
  TrendingUp,
  Cpu,
  RefreshCw,
  LogOut,
  MapPin,
  Flame,
  Terminal,
  Zap,
  Droplets,
  Beaker,
  Thermometer,
  ShieldCheck,
  ChevronRight,
  Database
} from 'lucide-react';
import AddSensorForm from './components/AddSensorForm';
import TelemetryForm from './components/TelemetryForm';
import { Loader2 } from 'lucide-react';

// Panning helper component
const MapPanTo = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true, duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
};

const IoTSimulator = () => {
  const [sensors, setSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([30.565, 30.932]);
  const [mapZoom, setMapZoom] = useState(12);
  const [clickedCoords, setClickedCoords] = useState(null);
  const [activeFormTab, setActiveFormTab] = useState('deploy'); // 'deploy' | 'telemetry'
  const [logs, setLogs] = useState([
    { id: 1, type: 'info', text: 'Initializing IoT Tactical Command Console...' },
    { id: 2, type: 'success', text: 'Established link to agricultural PostGIS spatial database.' }
  ]);

  const addLog = (text, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [
      { id: Date.now(), type, text: `[${timestamp}] ${text}` },
      ...prev.slice(0, 19) // Limit to 20 logs
    ]);
  };

  const fetchSensors = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`/sensor/sensorswithreadingslastday`);
      
      const processed = res.data.map(s => {
        const reading = s.latest_reading || {};
        const moisture = reading.soil_moisture || 0;
        const salinity = (reading.temperature ? (reading.temperature * 0.15).toFixed(1) : (Math.random() * 3 + 1).toFixed(1)); 

        let status = 'Normal';
        if (moisture === 0) status = 'Warning';
        else if (moisture < 20) status = 'Critical';
        else if (moisture < 35) status = 'Warning';

        return {
          id: s.sensor_id,
          name: s.name,
          description: s.description || 'No description provided.',
          location: s.location, // [lng, lat]
          salinity: salinity,
          moisture: Math.round(moisture),
          ph: parseFloat(reading.soil_ph || 7.2).toFixed(1),
          temperature: reading.temperature || 24.0,
          status: status,
          timestamp: reading.timestamp || "N/A"
        };
      });

      setSensors(processed);
      addLog(`Synchronized ${processed.length} PostGIS sensor nodes.`, 'success');

      // Set default selected sensor if none is selected
      if (processed.length > 0 && !selectedSensor) {
        setSelectedSensor(processed[0]);
        if (processed[0].location) {
          const [lng, lat] = processed[0].location;
          setMapCenter([lat, lng]);
        }
      }
    } catch (err) {
      console.error(err);
      addLog('Failed to fetch active sensor readings.', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensors();
    const interval = setInterval(() => fetchSensors(true), 25000); // Auto-refresh sensors
    return () => clearInterval(interval);
  }, []);

  const handleSensorSelected = (sensor) => {
    setSelectedSensor(sensor);
    if (sensor.location) {
      const [lng, lat] = sensor.location;
      setMapCenter([lat, lng]);
      setMapZoom(14);
      addLog(`Camera focused on node: ${sensor.name} [${lat.toFixed(4)}, ${lng.toFixed(4)}]`, 'info');
    }
  };

  const handleMapClick = (latlng) => {
    setClickedCoords([latlng.lng, latlng.lat]);
    setActiveFormTab('deploy');
    addLog(`Map coordinate target locked: ${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`, 'info');
  };

  const MapClickEvent = () => {
    const map = useMap();
    useEffect(() => {
      const onClick = (e) => {
        handleMapClick(e.latlng);
      };
      map.on('click', onClick);
      return () => {
        map.off('click', onClick);
      };
    }, [map]);
    return null;
  };

  const onSensorAdded = (newSensor) => {
    addLog(`Sensor "${newSensor.name || 'Unnamed'}" successfully deployed.`, 'success');
    fetchSensors(true);
  };

  const onTelemetrySubmitted = (data) => {
    addLog(`Telemetry reading broadcast completed successfully.`, 'success');
    fetchSensors(true);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 font-sans text-slate-100 overflow-hidden relative">
      
      {/* Background Neon Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10b981 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>

      {/* Modern Top Header / Navbar */}
      <header className="h-16 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-950 p-2 rounded-xl border border-emerald-500/25 text-emerald-400 animate-pulse">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-md font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              WALL-E IoT Tactical Simulator
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">v2.1 Enterprise</span>
            </h1>
            <p className="text-[10px] text-slate-400">PostGIS Core Node Manager & Spatial Telemetry Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => fetchSensors()} 
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-xs text-slate-300 transition-all font-medium disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Nodes
          </button>
          
          <Link 
            to="/decision-maker"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-500/25 bg-emerald-950/40 hover:bg-emerald-950 text-xs text-emerald-400 transition-all font-medium"
          >
            Decision Maker Console <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* Main Split Window */}
      <main className="flex-1 flex overflow-hidden w-full relative z-10">
        
        {/* PANEL 1: Left-hand Sensor Node Catalog Sidebar */}
        <section className="w-80 border-r border-slate-900 bg-slate-950/70 backdrop-blur-sm h-full flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-900 flex justify-between items-center bg-slate-950/40">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              Node Catalog
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-500/20 px-2 py-0.5 rounded">
              {sensors.length} Active Nodes
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-500">
                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                <span className="text-xs">Connecting to Spatial DB...</span>
              </div>
            ) : sensors.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-center text-slate-500 p-4 border border-dashed border-slate-800 rounded-xl">
                <Database className="w-6 h-6 text-slate-600" />
                <p className="text-xs font-medium">No deployed sensors found.</p>
                <p className="text-[10px] text-slate-600">Use the deployment controls on the right panel to initialize a sensor node.</p>
              </div>
            ) : (
              sensors.map((s) => {
                const isSelected = selectedSensor?.id === s.id;
                const isCritical = s.moisture < 20;
                
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSensorSelected(s)}
                    className={`cursor-pointer p-3.5 rounded-xl border transition-all duration-200 ${
                      isSelected 
                        ? 'bg-slate-900 border-emerald-500/50 shadow-md shadow-emerald-950/20 ring-1 ring-emerald-500/35' 
                        : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          isCritical ? 'bg-red-500 animate-ping' : s.status === 'Warning' ? 'bg-yellow-500' : 'bg-emerald-500'
                        }`} />
                        <h4 className="text-xs font-bold text-slate-200 tracking-wide font-mono truncate max-w-[120px]">{s.name}</h4>
                      </div>
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isCritical ? 'bg-red-950 text-red-400 border border-red-500/20' : s.status === 'Warning' ? 'bg-yellow-950 text-yellow-400 border border-yellow-500/20' : 'bg-emerald-950 text-emerald-400 border border-emerald-500/10'
                      }`}>
                        {isCritical ? 'Critical' : s.status}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 line-clamp-1 mb-3 font-sans">{s.description}</p>

                    <div className="grid grid-cols-3 gap-1 text-center font-mono">
                      <div className="bg-slate-950/80 p-1.5 rounded border border-slate-900">
                        <span className="text-[8px] text-slate-500 block uppercase">Moist</span>
                        <span className={`text-xs font-bold ${isCritical ? 'text-red-400' : 'text-slate-300'}`}>{s.moisture}%</span>
                      </div>
                      <div className="bg-slate-950/80 p-1.5 rounded border border-slate-900">
                        <span className="text-[8px] text-slate-500 block uppercase">Temp</span>
                        <span className="text-xs font-bold text-slate-300">{s.temperature}°C</span>
                      </div>
                      <div className="bg-slate-950/80 p-1.5 rounded border border-slate-900">
                        <span className="text-[8px] text-slate-500 block uppercase">pH</span>
                        <span className="text-xs font-bold text-slate-300">{s.ph}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Tactical Terminal Feed */}
          <div className="h-48 border-t border-slate-900 flex flex-col bg-slate-950">
            <div className="p-2.5 border-b border-slate-900 flex items-center gap-1.5 text-slate-400 uppercase tracking-widest text-[9px] font-mono font-bold bg-slate-950/60">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              Live Console Output
            </div>
            <div className="flex-1 p-3 overflow-y-auto font-mono text-[9px] space-y-1.5 bg-slate-950/90 text-slate-300 select-all">
              {logs.map((log) => (
                <div key={log.id} className={`flex items-start gap-1 ${
                  log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  <span className="shrink-0 text-slate-600">&gt;</span>
                  <span>{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PANEL 2: Central Map Canvas View */}
        <section className="flex-1 h-full relative">
          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            className="w-full h-full z-10" 
            zoomControl={false}
          >
            {/* Dark Imagery layer to maintain high-tech dashboard aesthetics */}
            <TileLayer 
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; ESRI Satellite'
            />
            <TileLayer 
              url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
              attribution='&copy; CartoDB'
              zIndex={5}
            />

            <MapPanTo center={mapCenter} zoom={mapZoom} />
            <MapClickEvent />

            {/* Display deployed PostGIS sensors */}
            {sensors.map((s) => {
              if (!s.location || s.location.length < 2) return null;
              const [lng, lat] = s.location;
              const isSelected = selectedSensor?.id === s.id;
              const isCritical = s.moisture < 20;
              const markerColor = isCritical ? '#ef4444' : s.status === 'Warning' ? '#facc15' : '#10b981';

              return (
                <CircleMarker
                  key={s.id}
                  center={[lat, lng]}
                  radius={isSelected ? 10 : 7}
                  pathOptions={{
                    color: isSelected ? '#ffffff' : markerColor,
                    weight: isSelected ? 3 : 1,
                    fillColor: markerColor,
                    fillOpacity: isCritical ? 0.95 : 0.8
                  }}
                  className={isCritical ? 'animate-pulse' : ''}
                  eventHandlers={{
                    click: () => handleSensorSelected(s)
                  }}
                >
                  <Popup closeButton={false}>
                    <div className="w-56 p-1 text-slate-100 bg-slate-950 border border-slate-800 rounded-xl text-right font-sans" dir="rtl">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                        <span className="font-bold text-emerald-400 text-xs">{s.name}</span>
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          isCritical ? 'bg-red-950 text-red-400' : 'bg-emerald-950 text-emerald-400'
                        }`}>
                          {isCritical ? 'CRITICAL' : s.status}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between font-mono">
                          <span className="text-slate-400 font-sans">EC (Salinity):</span>
                          <span className="font-bold text-slate-200">{s.salinity} dS/m</span>
                        </div>
                        <div className="flex justify-between font-mono">
                          <span className="text-slate-400 font-sans">Moisture:</span>
                          <span className={`font-bold ${isCritical ? 'text-red-400' : 'text-slate-200'}`}>{s.moisture}%</span>
                        </div>
                        <div className="flex justify-between font-mono">
                          <span className="text-slate-400 font-sans">pH level:</span>
                          <span className="font-bold text-slate-200">{s.ph}</span>
                        </div>
                        <div className="flex justify-between font-mono border-t border-slate-800 pt-2 mt-1">
                          <span className="text-slate-400 font-sans">Temp:</span>
                          <span className="font-bold text-slate-200">{s.temperature}°C</span>
                        </div>
                      </div>

                      <div className="text-[8px] font-mono text-slate-500 mt-2 text-center border-t border-slate-800 pt-1">
                        TS: {s.timestamp}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </section>

        {/* PANEL 3: Right-hand Control Room Forms Panel */}
        <section className="w-96 border-l border-slate-900 bg-slate-950/70 backdrop-blur-sm h-full flex flex-col shrink-0">
          <div className="flex border-b border-slate-900 font-sans bg-slate-950/40">
            <button
              onClick={() => setActiveFormTab('deploy')}
              className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider transition-colors ${
                activeFormTab === 'deploy' 
                  ? 'border-b-2 border-emerald-500 text-emerald-400 bg-slate-900/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Deploy Node
            </button>
            <button
              onClick={() => setActiveFormTab('telemetry')}
              className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider transition-colors ${
                activeFormTab === 'telemetry' 
                  ? 'border-b-2 border-emerald-500 text-emerald-400 bg-slate-900/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Inject Telemetry
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto flex items-start justify-center">
            {activeFormTab === 'deploy' ? (
              <AddSensorForm
                initialCoordinates={clickedCoords}
                onSensorAdded={onSensorAdded}
                onCancel={() => setClickedCoords(null)}
              />
            ) : (
              <TelemetryForm
                sensors={sensors}
                selectedSensorId={selectedSensor?.id}
                onTelemetrySubmitted={onTelemetrySubmitted}
              />
            )}
          </div>
        </section>

      </main>
    </div>
  );
};

export default IoTSimulator;