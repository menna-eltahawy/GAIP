import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Activity, Beaker, Droplets, Thermometer, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const TelemetryForm = ({ sensors = [], onTelemetrySubmitted, selectedSensorId }) => {
  const [sensorId, setSensorId] = useState(selectedSensorId || '');
  const [temperature, setTemperature] = useState('24.5');
  const [ph, setPh] = useState('7.2');
  const [moisture, setMoisture] = useState('35');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (selectedSensorId) {
      setSensorId(selectedSensorId);
    } else if (sensors.length > 0 && !sensorId) {
      setSensorId(sensors[0].id);
    }
  }, [selectedSensorId, sensors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sensorId) {
      setError('Please select an active sensor node.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const tempVal = parseFloat(temperature);
    const phVal = parseFloat(ph);
    const moistureVal = parseFloat(moisture);

    if (isNaN(tempVal) || tempVal < -20 || tempVal > 60) {
      setError('Temperature must be between -20°C and 60°C.');
      setLoading(false);
      return;
    }

    if (isNaN(phVal) || phVal < 0 || phVal > 14) {
      setError('pH level must be between 0.0 and 14.0.');
      setLoading(false);
      return;
    }

    if (isNaN(moistureVal) || moistureVal < 0 || moistureVal > 100) {
      setError('Moisture percentage must be between 0% and 100%.');
      setLoading(false);
      return;
    }

    const payload = {
      sensor_id: sensorId,
      soil_moisture: moistureVal,
      soil_ph: phVal,
      temperature: tempVal
    };

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      let response;
      try {
        response = await api.post(`/sensor/reading`, payload, { headers });
      } catch (err) {
        try {
          response = await api.post(`/sensor/telemetry`, payload, { headers });
        } catch (err2) {
          response = await api.post(`/sensor/addreading`, payload, { headers });
        }
      }

      setSuccess(true);
      if (onTelemetrySubmitted) {
        onTelemetrySubmitted(response.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to submit telemetry. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl font-sans text-slate-100 max-w-md w-full">
      <div className="flex items-center gap-2.5 mb-4 border-b border-slate-800 pb-3">
        <div className="bg-emerald-950 p-2 rounded-xl border border-emerald-500/20 text-emerald-400">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Sensor Telemetry Controls</h3>
          <p className="text-[10px] text-slate-400 font-mono">Inject real-time telemetry readings manually</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-950/50 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs mb-4">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Telemetry injection broadcasted successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="telemetry-sensor" className="block text-[10px] font-bold text-slate-400 uppercase">Target Sensor Node *</label>
          <select
            id="telemetry-sensor"
            required
            value={sensorId}
            onChange={(e) => setSensorId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="" disabled>Select active node...</option>
            {sensors.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-950">
                {s.name} ({s.location ? `${s.location[1].toFixed(3)}, ${s.location[0].toFixed(3)}` : 'No Location'})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label htmlFor="telemetry-moisture" className="block text-[10px] font-bold text-slate-400 uppercase">Soil Moisture (%) *</label>
            {parseFloat(moisture) < 20 && (
              <span className="text-[9px] text-red-400 animate-pulse font-bold">⚠️ Critical Moisture Bounds</span>
            )}
          </div>
          <div className="relative">
            <Droplets className="absolute left-4 top-3 w-4 h-4 text-slate-500" />
            <input
              id="telemetry-moisture"
              type="number"
              required
              step="1"
              min="0"
              max="100"
              value={moisture}
              onChange={(e) => setMoisture(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              placeholder="e.g. 35"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="telemetry-temp" className="block text-[10px] font-bold text-slate-400 uppercase">Soil Temperature (°C) *</label>
          <div className="relative">
            <Thermometer className="absolute left-4 top-3 w-4 h-4 text-slate-500" />
            <input
              id="telemetry-temp"
              type="number"
              required
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              placeholder="e.g. 24.5"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="telemetry-ph" className="block text-[10px] font-bold text-slate-400 uppercase">Soil pH Level *</label>
          <div className="relative">
            <Beaker className="absolute left-4 top-3 w-4 h-4 text-slate-500" />
            <input
              id="telemetry-ph"
              type="number"
              required
              step="0.1"
              min="0"
              max="14"
              value={ph}
              onChange={(e) => setPh(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              placeholder="e.g. 7.2"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !sensorId}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/20"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            'Broadcast Telemetry'
          )}
        </button>
      </form>
    </div>
  );
};

export default TelemetryForm;