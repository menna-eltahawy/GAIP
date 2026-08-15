import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { MapPin, Plus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const AddSensorForm = ({ initialCoordinates, onSensorAdded, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (initialCoordinates) {
      setLatitude(initialCoordinates[1]?.toFixed(6) || '');
      setLongitude(initialCoordinates[0]?.toFixed(6) || '');
    }
  }, [initialCoordinates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !latitude || !longitude) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const latVal = parseFloat(latitude);
    const lngVal = parseFloat(longitude);

    if (isNaN(latVal) || latVal < -90 || latVal > 90) {
      setError('Invalid latitude. Must be between -90 and 90.');
      setLoading(false);
      return;
    }

    if (isNaN(lngVal) || lngVal < -180 || lngVal > 180) {
      setError('Invalid longitude. Must be between -180 and 180.');
      setLoading(false);
      return;
    }

    const payload = {
      name,
      description,
      location: [lngVal, latVal] 
    };

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      let response;
      try {
        response = await api.post(`/sensor/addsensor`, payload, { headers });
      } catch (err) {
        response = await api.post(`/sensor`, payload, { headers });
      }

      setSuccess(true);
      setName('');
      setDescription('');
      setLatitude('');
      setLongitude('');
      
      if (onSensorAdded) {
        onSensorAdded(response.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to deploy the sensor. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl font-sans text-slate-100 max-w-md w-full relative">
      <div className="flex items-center gap-2.5 mb-4 border-b border-slate-800 pb-3">
        <div className="bg-emerald-950 p-2 rounded-xl border border-emerald-500/20 text-emerald-400">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">PostGIS Sensor Deployment</h3>
          <p className="text-[10px] text-slate-400 font-mono">Deploy telemetry node into geographic coordinates</p>
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
          <span>Sensor node registered successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="sensor-name" className="block text-[10px] font-bold text-slate-400 uppercase">Node Name *</label>
          <input
            id="sensor-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="e.g. Delta-North-Sensor-01"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="sensor-description" className="block text-[10px] font-bold text-slate-400 uppercase">Description</label>
          <textarea
            id="sensor-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            placeholder="Describe the soil profile or crop types in proximity..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3 font-mono">
          <div className="space-y-1">
            <label htmlFor="sensor-latitude" className="block text-[10px] font-bold text-slate-400 uppercase font-sans">Latitude *</label>
            <input
              id="sensor-latitude"
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="e.g. 30.565203"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="sensor-longitude" className="block text-[10px] font-bold text-slate-400 uppercase font-sans">Longitude *</label>
            <input
              id="sensor-longitude"
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="e.g. 30.932401"
            />
          </div>
        </div>

        <div className="text-[10px] text-slate-400 italic">
          Tip: You can also tap anywhere on the live canvas map to instantly populate the coordinate inputs above.
        </div>

        <div className="flex gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-colors border border-slate-700"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/20"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Deploy Node
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddSensorForm;