import React, { useState, forwardRef, useImperativeHandle } from 'react';
import api from '../../api/axiosConfig'; 
import MapSection from '../MapSection';
import Chatbot from './Chatbot';
import { Search, Loader2, CheckCircle2, Wheat, Sprout, Activity, Percent, FileDown, Share2, Copy, ExternalLink, TrendingUp } from 'lucide-react';

const IntelligenceCenter = forwardRef(({ isActive, onAnalysisComplete }, ref) => {
  const [startDate, setStartDate] = useState("2025-03-01");
  const [endDate, setEndDate] = useState("2025-03-28");
  const [loading, setLoading] = useState(false);
  const [geometry, setGeometry] = useState(null);
  const [analyzedGeometry, setAnalyzedGeometry] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(400); 
  
  const [results, setResults] = useState(null);
  const [vectorData, setVectorData] = useState({ crop: null, health: null });
  
  const [selectedCropCategories, setSelectedCropCategories] = useState(['Wheat', 'Corn', 'Non-Agricultural']);
  const [selectedHealthStatuses, setSelectedHealthStatuses] = useState(['Good Health', 'Median Health', 'Bad Health']);
  
  const [cropTileUrl, setCropTileUrl] = useState(null);
  const [healthTileUrl, setHealthTileUrl] = useState(null);
  const [cropTypePreview, setCropTypePreview] = useState(null);
  const [cropHealthPreview, setCropHealthPreview] = useState(null);
  
  const [cropVectorVisible, setCropVectorVisible] = useState(true);
  const [healthVectorVisible, setHealthVectorVisible] = useState(true);

  const [activeLayer, setActiveLayer] = useState('crop_type');
  const [rasterOpacity, setRasterOpacity] = useState(0.75);
  
  const [mapCenter, setMapCenter] = useState([30.565, 30.932]);
  const [mapZoom, setMapZoom] = useState(13);

  const handleChatbotData = (data) => {
    const { metadata, cropTileUrl, healthTileUrl, cropAreas, cropHealth, cropTypePreview, cropHealthPreview } = data;

    if (metadata?.geometry) {
      setGeometry(metadata.geometry);
    }

    if (cropAreas && cropHealth) {
      setResults({ crop_areas_feddans: cropAreas, crop_health_feddans: cropHealth });
    }

    if (cropTileUrl) setCropTileUrl(cropTileUrl);
    if (healthTileUrl) setHealthTileUrl(healthTileUrl);
    if (cropTypePreview) setCropTypePreview(cropTypePreview);
    if (cropHealthPreview) setCropHealthPreview(cropHealthPreview);

    if (metadata?.geometry?.length > 0) {
      let latSum = 0, lngSum = 0;
      metadata.geometry.forEach(p => { lngSum += p[0]; latSum += p[1]; });
      setMapCenter([latSum / metadata.geometry.length, lngSum / metadata.geometry.length]);
      setMapZoom(14);
      setAnalyzedGeometry([...metadata.geometry]);
    }

    if (onAnalysisComplete && metadata) {
      onAnalysisComplete(metadata);
    }
  };

  useImperativeHandle(ref, () => ({
    loadChatbotResults: handleChatbotData
  }));

  const handleGeometryCreated = (coords) => {
    setGeometry(coords);
  };

  const clearVectors = () => {
    setVectorData({ crop: null, health: null });
    setCropVectorVisible(false);
    setHealthVectorVisible(false);
  };

  const handleAnalyze = async () => {
    if (!geometry) {
      alert("Please draw an analysis boundary (polygon) on the map first!");
      return;
    }
    setLoading(true);
    setResults(null);
    setVectorData({ crop: null, health: null });
    
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const payload = { testStartDate: startDate, testEndDate: endDate, geometry: geometry };

    try {
      const classifyResponse = await api.post(`/api/classify`, payload, { headers });
      const { crop_areas_feddans, crop_health_feddans, maps_urls, passed_metadata, crop_type_thumbnail_b64, crop_health_thumbnail_b64 } = classifyResponse.data;
      
      setResults({ crop_areas_feddans, crop_health_feddans });
      if (maps_urls) {
        setCropTileUrl(maps_urls.crop_type_tiles || null);
        setHealthTileUrl(maps_urls.crop_health_tiles || null);
      }
      if (crop_type_thumbnail_b64) setCropTypePreview(`data:image/png;base64,${crop_type_thumbnail_b64}`);
      if (crop_health_thumbnail_b64) setCropHealthPreview(`data:image/png;base64,${crop_health_thumbnail_b64}`);
      if (geometry && geometry.length > 0) {
        setAnalyzedGeometry([...geometry]);
      }
      if (onAnalysisComplete && passed_metadata) {
        onAnalysisComplete(passed_metadata);
      }
      
      if (geometry && geometry.length > 0) {
        let latSum = 0, lngSum = 0;
        geometry.forEach(p => { lngSum += p[0]; latSum += p[1]; });
        setMapCenter([latSum / geometry.length, lngSum / geometry.length]);
        setMapZoom(14);
      }
    } catch (err) {
      console.error(err);
      alert("GeoAI Classification Pipeline execution failed. Please verify python server status.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVectors = async () => {
    if (!geometry) {
      alert("Please draw an analysis boundary (polygon) on the map first!");
      return;
    }
    setLoading(true);
    
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const payload = { testStartDate: startDate, testEndDate: endDate, geometry: geometry };

    try {
        const vectorResponse = await api.post(`/api/analysis/generate_vectors`, payload, { headers });
        const { crop_classification_geojson, vegetation_health_geojson } = vectorResponse.data;
        setVectorData({ crop: crop_classification_geojson, health: vegetation_health_geojson });
        setCropVectorVisible(true);
        setHealthVectorVisible(true);
    } catch (vectorErr) {
        console.error("Vector generation failed:", vectorErr);
        alert("Vector generation failed.");
    } finally {
        setLoading(false);
    }
  };

  const [reportLoading, setReportLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);

  const handleShareLayer = async () => {
    if (!results) return;
    const layerName = window.prompt("Layer Name:", `${startDate}_${endDate}_CropAnalysis`);
    if (!layerName) return;

    setShareLoading(true);
    setShareLink(null);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');

      const res = await api.post(`/share/save`, {
        Creator_Email: userInfo.email,
        Layer_Name: layerName,
        Classifcation_Start_Date: startDate,
        Classifcation_End_Date: endDate,
        crop_areas_feddans: results.crop_areas_feddans,
        crop_health_feddans: results.crop_health_feddans,
        crop_type_tiles_url: cropTileUrl || "",
        crop_health_tiles_url: healthTileUrl || "",
        bounds: geometry ? [
          [Math.min(...geometry.map(p => p[1])), Math.min(...geometry.map(p => p[0]))],
          [Math.max(...geometry.map(p => p[1])), Math.max(...geometry.map(p => p[0]))]
        ] : null
      }, { headers });

      setShareLink(`https://mahmoudkhaled17.github.io/Gaip_share_front/?id=${res.data.Id}`);
      setShareCopied(false);
    } catch (err) {
      console.error(err);
      alert("Layer share failed: " + (err.response?.data?.detail || "Unexpected Error"));
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

  const handleDownloadReport = async () => {
    if (!results) return;
    setReportLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await api.post(`/api/report/generate`, {
        testStartDate: startDate,
        testEndDate: endDate,
        geometry: geometry,
        crop_areas: results.crop_areas_feddans,
        crop_health: results.crop_health_feddans,
        map_image_base64: cropTypePreview?.replace('data:image/png;base64,', '')
      }, { headers, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `crop_report_${startDate}_${endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF report failed:", err);
      alert("Failed to generate PDF Report");
    } finally {
      setReportLoading(false);
    }
  };

  const startResize = (mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    const startWidth = sidebarWidth;
    const startX = mouseDownEvent.clientX;

    const doDrag = (mouseMoveEvent) => {
      const deltaX = startX - mouseMoveEvent.clientX; 
      const newWidth = startWidth - deltaX; 
      if (newWidth > 320 && newWidth < 700) {
        setSidebarWidth(newWidth);
      }
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  const computeClassificationMetrics = () => {
    if (!results) return null;
    const wheat = results.crop_areas_feddans?.Wheat_1 || 0;
    const corn = results.crop_areas_feddans?.Corn_0 || 0;
    const nonAgri = results.crop_areas_feddans?.Non_agricultural_2 || 0;
    const total = wheat + corn + nonAgri || 1;
    const wheatPct = ((wheat / total) * 100).toFixed(1);
    const cornPct = ((corn / total) * 100).toFixed(1);
    const nonAgriPct = ((nonAgri / total) * 100).toFixed(1);
    const highH = results.crop_health_feddans?.High_Quality_Green || 0;
    const medH = results.crop_health_feddans?.Medium_Quality_Yellow || 0;
    const lowH = results.crop_health_feddans?.Low_Quality_Red || 0;
    const totalH = highH + medH + lowH || 1;
    const healthIndex = Math.round(((highH * 100) + (medH * 60) + (lowH * 20)) / totalH);
    const dominantCrop = wheat >= corn ? 'Wheat' : 'Corn';
    return { wheat, corn, nonAgri, total, wheatPct, cornPct, nonAgriPct, highH, medH, lowH, totalH, healthIndex, dominantCrop };
  };

  const metrics = computeClassificationMetrics();

  const getGrowthStage = (cropType, dateStr) => {
    if (!cropType || !dateStr) return "N/A";
    const end = new Date(dateStr);
    let plantingDate;

    if (cropType === 'Wheat') {
      const year = end.getMonth() >= 10 ? end.getFullYear() : end.getFullYear() - 1;
      plantingDate = new Date(`${year}-11-01`);
    } else if (cropType === 'Corn') {
      plantingDate = new Date(`${end.getFullYear()}-05-01`);
    } else {
      return "N/A";
    }

    const diffDays = Math.floor((end - plantingDate) / (1000 * 60 * 60 * 24));

    if (cropType === 'Wheat') {
      if (diffDays < 40) return "Seedling";
      if (diffDays < 90) return "Vegetative";
      return "Maturation";
    } else {
      if (diffDays < 30) return "Seedling";
      if (diffDays < 70) return "Vegetative";
      return "Maturation";
    }
  };

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 flex bg-slate-950 font-sans text-slate-100 overflow-hidden" dir="ltr">
      <div className="flex-1 h-full relative z-10">
          <MapSection
            center={mapCenter}
            zoom={mapZoom}
            onGeometryCreated={handleGeometryCreated}
            cropTileUrl={cropTileUrl}
            healthTileUrl={healthTileUrl}
            cropOpacity={rasterOpacity}
            healthOpacity={rasterOpacity}
            onCropOpacityChange={setRasterOpacity}
            onHealthOpacityChange={setRasterOpacity}
            activeLayer={activeLayer}
            onLayerChange={setActiveLayer}
            polygonGeometry={geometry}
            cropGeoJSON={vectorData.crop}
            healthGeoJSON={vectorData.health}
            cropVectorVisible={cropVectorVisible}
            healthVectorVisible={healthVectorVisible}
            onCropVectorVisibleChange={setCropVectorVisible}
            onHealthVectorVisibleChange={setHealthVectorVisible}
            onClearVectors={clearVectors}
            selectedCropCategories={selectedCropCategories}
            onSelectedCropCategoriesChange={setSelectedCropCategories}
            selectedHealthStatuses={selectedHealthStatuses}
            onSelectedHealthStatusesChange={setSelectedHealthStatuses}
            onGenerateVectors={handleGenerateVectors}
            vectorDataLoaded={!!vectorData.crop || !!vectorData.health}
            cropTypePreview={cropTypePreview}
            cropHealthPreview={cropHealthPreview}
            previewBounds={analyzedGeometry ? [
              [Math.min(...analyzedGeometry.map(p => p[1])), Math.min(...analyzedGeometry.map(p => p[0]))],
              [Math.max(...analyzedGeometry.map(p => p[1])), Math.max(...analyzedGeometry.map(p => p[0]))]
            ] : null}
          />

        {!geometry && (
          <div className="absolute top-[12px] left-14 z-[400] bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 text-white rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl max-w-md pointer-events-none">
            <div className="bg-emerald-500/10 border border-emerald-500/40 p-2 rounded-xl text-emerald-400 animate-pulse">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-emerald-400">GeoAI Boundary Required</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Click the polygon drawing tool on the map to define field bounds.</p>
            </div>
          </div>
        )}

        <Chatbot onDataLoaded={handleChatbotData} />

      </div>
      
      <div 
        style={{ width: `${sidebarWidth}px` }}
        className="border-l border-slate-900 bg-slate-950/95 backdrop-blur-lg h-full flex flex-col shrink-0 text-left overflow-y-auto relative z-50 pointer-events-auto" 
      >
        <div 
          onMouseDown={startResize}
          className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-emerald-500/50 bg-slate-800 transition-colors z-50"
        />

        <div className="p-8 border-b border-slate-900 bg-slate-950/60 pl-8">
          <h2 className="text-xl font-black text-slate-100 uppercase tracking-wide mb-1 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            GeoAI Classification Console
          </h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Agricultural Real-Time Telemetry Control</p>
        </div>

      
        <div className="p-6 border-b border-slate-900 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-slate-300">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors font-mono pointer-events-auto" 
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">End Date</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors font-mono pointer-events-auto" 
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleAnalyze} 
            disabled={loading} 
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/80 text-white font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 pointer-events-auto"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                <span>Processing Pipeline...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Calculate Crop Map</span>
              </>
            )}
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {metrics ? (
            <div className="space-y-6 animate-in fade-in duration-500">
              
              <div className="space-y-4">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2">
                  🌾 Seasonal Production Indicators
                </h3>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-xl flex flex-col justify-between hover:border-emerald-500/20 transition-all text-left relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-sans">TOTAL AREA</span>
                    <div className="flex items-baseline justify-start gap-2 mt-2">
                      <span className="text-4xl font-black text-slate-100 tracking-tight font-mono">
                        {Math.round(metrics.total)}
                      </span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">feddan</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-xl flex flex-col justify-between hover:border-amber-500/20 transition-all text-left relative overflow-hidden">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-sans">CROP TYPE</span>
                      <div className="mt-2 flex items-center gap-2">
                        {metrics.dominantCrop === 'Wheat' ? (
                          <Wheat className="w-4 h-4 text-amber-500 shrink-0" />
                        ) : (
                          <Sprout className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <span className="text-lg font-black text-slate-100 tracking-wide">
                          {metrics.dominantCrop}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-xl flex flex-col justify-between hover:border-cyan-500/20 transition-all text-left relative overflow-hidden">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-sans">GROWTH STAGE</span>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-base font-black text-cyan-400 tracking-wide truncate">
                          {getGrowthStage(metrics.dominantCrop, endDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Vegetation Health (NDVI)
                </h3>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Overall Vitality</span>
                    <span className={`text-sm font-black font-mono px-2 py-0.5 rounded-md ${
                      metrics.healthIndex > 75 ? 'text-emerald-400 bg-emerald-950/50 border border-emerald-500/20' : 
                      metrics.healthIndex > 45 ? 'text-yellow-400 bg-yellow-950/50 border border-yellow-500/20' : 
                      'text-red-400 bg-red-950/50 border border-red-500/20'
                    }`}>
                      {metrics.healthIndex}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        metrics.healthIndex > 75 ? 'bg-gradient-to-r from-teal-400 to-emerald-500' :
                        metrics.healthIndex > 45 ? 'bg-gradient-to-r from-amber-400 to-yellow-500' :
                        'bg-gradient-to-r from-orange-400 to-red-500'
                      }`}
                      style={{ width: `${metrics.healthIndex}%` }}
                    />
                  </div>

                  <div className="space-y-2 text-[10px] font-mono border-t border-slate-800 pt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">🟢 High Quality:</span>
                      <span className="text-slate-200 font-bold">{metrics.highH.toFixed(1)} f ({((metrics.highH / metrics.totalH) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">🟡 Medium Quality:</span>
                      <span className="text-slate-200 font-bold">{metrics.medH.toFixed(1)} f ({((metrics.medH / metrics.totalH) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">🔴 Low Quality:</span>
                      <span className="text-slate-200 font-bold">{metrics.lowH.toFixed(1)} f ({((metrics.lowH / metrics.totalH) * 100).toFixed(0)}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-indigo-400" />
                  Area Distribution
                </h3>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden flex">
                    <div style={{ width: `${metrics.wheatPct}%` }} className="bg-emerald-500 h-full" />
                    <div style={{ width: `${metrics.cornPct}%` }} className="bg-amber-500 h-full" />
                    <div style={{ width: `${metrics.nonAgriPct}%` }} className="bg-slate-700 h-full" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                    <div className="space-y-1 text-center border-r border-slate-800">
                      <span className="text-emerald-400 font-black text-xs block">{metrics.wheatPct}%</span>
                      <span className="text-slate-500 font-sans uppercase">Wheat</span>
                    </div>
                    <div className="space-y-1 text-center border-r border-slate-800">
                      <span className="text-amber-400 font-black text-xs block">{metrics.cornPct}%</span>
                      <span className="text-slate-500 font-sans uppercase">Corn</span>
                    </div>
                    <div className="space-y-1 text-center font-sans uppercase">
                      <span className="text-slate-400 font-mono font-black text-xs block">{metrics.nonAgriPct}%</span>
                      <span className="text-slate-500">Non-Agri</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                    onClick={handleDownloadReport}
                    disabled={reportLoading}
                    className="w-full bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-400 font-bold py-2.5 rounded-xl text-[10px] transition-all flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-40 pointer-events-auto"
                >
                    {reportLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    ) : (
                    <FileDown className="w-3.5 h-3.5" />
                    )}
                    <span>PDF Report</span>
                </button>

                <button
                    onClick={handleShareLayer}
                    disabled={shareLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/80 text-white font-bold py-2.5 rounded-xl text-[10px] transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-950/20 pointer-events-auto"
                >
                    {shareLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-200" />
                    ) : (
                    <Share2 className="w-3.5 h-3.5" />
                    )}
                    <span>Share Layer</span>
                </button>
              </div>

              {shareLink && (
                <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-3 space-y-2.5 animate-in fade-in duration-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Layer Published</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      readOnly
                      value={shareLink}
                      onFocus={(e) => e.target.select()}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[9px] text-slate-300 focus:outline-none font-mono min-w-0 pointer-events-auto"
                    />
                    <button
                      onClick={handleCopyShareLink}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-lg transition-colors shrink-0 pointer-events-auto"
                      title="Copy Link"
                    >
                      {shareCopied ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={shareLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors shrink-0 pointer-events-auto"
                      title="Open Link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="h-48 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 text-center p-6">
              <TrendingUp className="w-6 h-6 text-slate-600 mb-2" />
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Awaiting GeoAI Boundary</p>
              <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">Draw a polygon on the satellite map and click Calculate Crop Map to commence telemetry pipeline.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default IntelligenceCenter;
