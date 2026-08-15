import { useState, useEffect } from 'react';
import api, { API_BASE } from '../../api/axiosConfig';
import MapSection from '../MapSection';
import Chatbot from './Chatbot';
import { Loader2, Calendar, Plus, Save, GitCompare } from 'lucide-react';

const PredictionDashboard = ({ isActive, sharedMetadata }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);
  const [projectGeometry, setProjectGeometry] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [cropTileUrl, setCropTileUrl] = useState(null);
  const [healthTileUrl, setHealthTileUrl] = useState(null);
  const [cropTypePreview, setCropTypePreview] = useState(null);
  const [cropHealthPreview, setCropHealthPreview] = useState(null);
  const [areas, setAreas] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showNewRecord, setShowNewRecord] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentRasters, setCurrentRasters] = useState(null);
  const [saving, setSaving] = useState(false);

  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [drawnPolygon, setDrawnPolygon] = useState(null);
  const [addingProject, setAddingProject] = useState(false);

  const [mapCenter, setMapCenter] = useState([26.8, 30.8]);
  const [mapZoom, setMapZoom] = useState(6);
  const [activeLayer, setActiveLayer] = useState('crop_type');
  const [rasterOpacity, setRasterOpacity] = useState(0.7);

  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState([]);
  const [compareData, setCompareData] = useState(null);
  const [compareSliderPos, setCompareSliderPos] = useState(50);

  useEffect(() => {
    if (!isActive) return;
    api.get(`/GovernmentProjects/all_projects`)
      .then(res => setProjects(res.data))
      .catch(console.error);
  }, [isActive]);

  const handleProjectClick = async (project) => {
    setSelectedProject(project);
    setSelectedAnalysis(null);
    setCropTileUrl(null);
    setHealthTileUrl(null);
    setCropTypePreview(null);
    setCropHealthPreview(null);
    setAreas(null);
    setCurrentRasters(null);
    setShowNewRecord(false);
    setShowAddProject(false);
    setCompareMode(false);
    setCompareSelection([]);
    setCompareData(null);
    try {
      const [detailsRes, geoRes] = await Promise.all([
        api.get(`/GovernmentProjects/project_details/${project.id}`),
        api.get(`/GovernmentProjects/project_geo/${project.id}`)
      ]);
      setSelectedProjectDetails(detailsRes.data);
      setProjectGeometry(geoRes.data.geometry);
      if (geoRes.data.geometry?.length > 0) {
        const lats = geoRes.data.geometry.map(p => p[1]);
        const lngs = geoRes.data.geometry.map(p => p[0]);
        setMapCenter([(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2]);
        setMapZoom(10);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnalysisClick = async (analysisId) => {
    setSelectedAnalysis(analysisId);
    setShowNewRecord(false);
    setCurrentRasters(null);
    setCropTypePreview(null);
    setCropHealthPreview(null);
    setLoading(true);
    try {
      const res = await api.get(`/project_analysis/get_analysis/${analysisId}`);
      const data = res.data;
      if (data.raster_saved) {
        setCropTileUrl(`${API_BASE}/project_analysis/analysis_tiles/${analysisId}/crop_type/{z}/{x}/{y}.png`);
        setHealthTileUrl(`${API_BASE}/project_analysis/analysis_tiles/${analysisId}/crop_health/{z}/{x}/{y}.png`);
      } else if (data.crop_type_tiles_url) {
        setCropTileUrl(data.crop_type_tiles_url);
        setHealthTileUrl(data.crop_health_tiles_url || data.crop_type_tiles_url);
      }
      setActiveLayer('crop_type');
      setAreas(data.crop_areas_feddans);
      setHealth(data.crop_health_feddans);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (compareSelection.length === 2) {
      setLoading(true);
      setCompareData(null);
      api.get(`/project_analysis/compare_analyses`, {
        params: { analysis_id_1: compareSelection[0], analysis_id_2: compareSelection[1] }
      })
        .then(res => {
          setCompareData(res.data);
          setCompareSliderPos(50);
        })
        .catch(err => {
          console.error(err);
          alert("Failed to load comparison data");
        })
        .finally(() => setLoading(false));
    }
  }, [compareSelection]);

  const handleCalculate = async () => {
    if (!startDate || !endDate || !selectedProject) return;
    setLoading(true);
    try {
      const res = await api.post(`/project_analysis/gee_analysis`, {
        project_id: selectedProject.id,
        test_start_date: startDate,
        test_end_date: endDate,
      });
      const data = res.data;
      setCropTileUrl(data.maps_urls?.crop_type_tiles);
      setHealthTileUrl(data.maps_urls?.crop_health_tiles);
      if (data.crop_type_thumbnail_b64) setCropTypePreview(`data:image/png;base64,${data.crop_type_thumbnail_b64}`);
      if (data.crop_health_thumbnail_b64) setCropHealthPreview(`data:image/png;base64,${data.crop_health_thumbnail_b64}`);
      setAreas(data.crop_areas_feddans);
      setHealth(data.crop_health_feddans);
      setCurrentRasters(data);
    } catch (err) {
      console.error(err);
      alert("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentRasters || !selectedProject || !startDate || !endDate) return;
    setSaving(true);
    try {
      await api.post(`/project_analysis/save_analysis`, {
        project_id: selectedProject.id,
        test_start_date: startDate,
        test_end_date: endDate,
        crop_areas_feddans: currentRasters.crop_areas_feddans,
        crop_health_feddans: currentRasters.crop_health_feddans,
        crop_type_raster_url: currentRasters.raster_download_urls?.crop_type ?? null,
        crop_health_raster_url: currentRasters.raster_download_urls?.crop_health ?? null,
        crop_type_tiles_url: currentRasters.maps_urls.crop_type_tiles,
        crop_health_tiles_url: currentRasters.maps_urls.crop_health_tiles,
        analysis_id: currentRasters.analysis_id ?? null,
      });
      setCurrentRasters(null);
      setShowNewRecord(false);
      if (selectedProject) handleProjectClick(selectedProject);
      alert("Saved successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleAddProjectDraw = (coords) => {
    setDrawnPolygon(coords);
  };

  const handleAddProjectSave = async () => {
    if (!drawnPolygon || !newProjectName) return;
    setAddingProject(true);
    try {
      await api.post(`/GovernmentProjects/add_project`, {
        name: newProjectName,
        description: newProjectDesc,
        geo: drawnPolygon,
      });
      setShowAddProject(false);
      setNewProjectName('');
      setNewProjectDesc('');
      setDrawnPolygon(null);
      const res = await api.get(`/GovernmentProjects/all_projects`);
      setProjects(res.data);
      alert("Project added successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to add project");
    } finally {
      setAddingProject(false);
    }
  };

  const handleChatbotData = (data) => {
    const { metadata, cropTileUrl, healthTileUrl, cropAreas, cropHealth, cropTypePreview, cropHealthPreview } = data;
    if (cropTileUrl) setCropTileUrl(cropTileUrl);
    if (healthTileUrl) setHealthTileUrl(healthTileUrl);
    if (cropTypePreview) setCropTypePreview(cropTypePreview);
    if (cropHealthPreview) setCropHealthPreview(cropHealthPreview);
    if (cropAreas) setAreas(cropAreas);
    if (cropHealth) setHealth(cropHealth);
    if (metadata?.geometry) setProjectGeometry(metadata.geometry);
  };

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 flex bg-slate-950 font-sans text-slate-200" dir="ltr">
      
      {/* 1. Sidebar - Moved to the left (first child in flex container) */}
      <div className="w-96 border-r border-slate-800 bg-slate-950 overflow-y-auto flex flex-col z-20">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-black text-emerald-400">Government Projects</h2>
          <button onClick={() => {
            setShowAddProject(!showAddProject);
            setSelectedProject(null);
            setShowNewRecord(false);
            setCropTileUrl(null);
            setHealthTileUrl(null);
            setCropTypePreview(null);
            setCropHealthPreview(null);
            setCompareMode(false);
            setCompareSelection([]);
            setCompareData(null);
          }} className="bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1">
            <Plus className="w-3 h-3" />
            Add Project
          </button>
        </div>

        {/* Add Project Form */}
        {showAddProject && (
          <div className="p-3 border-b border-slate-800 bg-slate-900/50 space-y-2 text-[10px]">
            <p className="text-cyan-400 text-[11px] font-bold mb-1">Draw project boundaries on the map</p>
            <input value={newProjectName} onChange={e => setNewProjectName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200" placeholder="Project Name" />
            <textarea value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200" placeholder="Project Description" rows={2} />
            <button onClick={handleAddProjectSave} disabled={addingProject || !drawnPolygon || !newProjectName}
              className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-700 py-1.5 rounded-lg flex items-center justify-center gap-1">
              {addingProject ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save Project
            </button>
          </div>
        )}

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {projects.map(p => (
            <div key={p.id}>
              <button
                onClick={() => handleProjectClick(p)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  selectedProject?.id === p.id
                    ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-transparent'
                }`}
              >
                {p.name}
              </button>

              {selectedProject?.id === p.id && selectedProjectDetails && (
                <div className="ml-3 mt-1 space-y-1 border-l-2 border-emerald-800 pl-3">
                  {selectedProjectDetails.description && (
                    <p className="text-[10px] text-slate-400 leading-relaxed pb-1">{selectedProjectDetails.description}</p>
                  )}

                  {selectedProjectDetails.analysis_date?.map(a => {
                    const isSelected = compareSelection.includes(a.id);
                    const isNormalSelected = selectedAnalysis === a.id;
                    return (
                      <button
                        key={a.id}
                        onClick={() => {
                          if (compareMode) {
                            setCompareSelection(prev => {
                              if (prev.includes(a.id)) {
                                setCompareData(null);
                                return prev.filter(id => id !== a.id);
                              }
                              if (prev.length >= 2) return [prev[1], a.id];
                              return [...prev, a.id];
                            });
                          } else {
                            handleAnalysisClick(a.id);
                          }
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-[10px] transition-colors flex items-center gap-2 ${
                          compareMode
                            ? isSelected
                              ? 'bg-purple-900/40 text-purple-300 border border-purple-700'
                              : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 border border-dashed border-slate-600'
                            : isNormalSelected
                              ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-700'
                              : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 border border-transparent'
                        }`}
                      >
                        {compareMode ? (
                          <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-purple-400 bg-purple-500' : 'border-slate-500'
                          }`}>
                            {isSelected && <span className="text-[8px] text-white font-bold">{compareSelection.indexOf(a.id) + 1}</span>}
                          </span>
                        ) : (
                          <Calendar className="w-3 h-3 shrink-0" />
                        )}
                        {a.test_start_date} → {a.test_end_date}
                      </button>
                    );
                  })}

                  <div className="flex gap-1">
                    <button
                      onClick={() => { setShowNewRecord(!showNewRecord); setSelectedAnalysis(null); setCropTileUrl(null); setHealthTileUrl(null); setCropTypePreview(null); setCropHealthPreview(null); setCurrentRasters(null); setCompareMode(false); setCompareSelection([]); setCompareData(null); }}
                      className="flex-1 text-left px-2 py-1.5 rounded-lg text-[10px] bg-emerald-900/30 text-emerald-400 hover:bg-emerald-800/40 border border-dashed border-emerald-700 flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      New Analysis
                    </button>
                    <button
                      onClick={() => {
                        if (compareMode) {
                          setCompareMode(false);
                          setCompareSelection([]);
                          setCompareData(null);
                          if (selectedAnalysis) handleAnalysisClick(selectedAnalysis);
                        } else {
                          setCompareMode(true);
                          setCompareSelection([]);
                          setCompareData(null);
                          setShowNewRecord(false);
                          setSelectedAnalysis(null);
                          setCropTileUrl(null);
                          setHealthTileUrl(null);
                          setCropTypePreview(null);
                          setCropHealthPreview(null);
                          setCurrentRasters(null);
                        }
                      }}
                      className={`flex-1 text-left px-2 py-1.5 rounded-lg text-[10px] border flex items-center justify-center gap-1 ${
                        compareMode
                          ? 'bg-purple-900/40 text-purple-400 border border-purple-700'
                          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 border border-dashed border-slate-600'
                      }`}
                    >
                      <GitCompare className="w-3 h-3" />
                      {compareMode ? 'Cancel Compare' : 'Compare'}
                    </button>
                  </div>

                  {showNewRecord && (
                    <div className="bg-slate-900 p-2 rounded-lg space-y-2 text-[10px]">
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200" />
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200" />
                      <button onClick={handleCalculate} disabled={loading}
                        className="w-full bg-cyan-700 hover:bg-cyan-600 py-1.5 rounded-lg flex items-center justify-center gap-1">
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Analyze</span>}
                      </button>
                      {currentRasters && (
                        <button onClick={handleSave} disabled={saving}
                          className="w-full bg-emerald-700 hover:bg-emerald-600 py-1.5 rounded-lg flex items-center justify-center gap-1">
                          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          Save Analysis
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Results Summary - Single */}
        {areas && !compareData && (
          <div className="border-t border-slate-800 p-3 text-[10px] space-y-1 bg-slate-900/50">
            <p className="text-emerald-400 font-bold mb-1">Areas:</p>
            <p className="text-slate-400">🌾 Wheat: {areas.Wheat_1} feddan</p>
            <p className="text-slate-400">🌽 Corn: {areas.Corn_0} feddan</p>
            <p className="text-slate-400">🏢 Non-Agri: {areas.Non_agricultural_2} feddan</p>
          </div>
        )}

        {/* Results Summary - Compare */}
        {compareData && (
          <div className="border-t border-slate-800 p-3 text-[10px] bg-slate-900/50">
            <p className="text-purple-400 font-bold mb-2">Areas - Comparison:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left px-2 py-1 text-slate-500">Crop</th>
                    <th className="text-center px-2 py-1 text-emerald-400 border-x border-slate-700">
                      {compareData.analysis_1.test_start_date} → {compareData.analysis_1.test_end_date}
                    </th>
                    <th className="text-center px-2 py-1 text-cyan-400">
                      {compareData.analysis_2.test_start_date} → {compareData.analysis_2.test_end_date}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: '🌾 Wheat', key: 'Wheat_1' },
                    { label: '🌽 Corn', key: 'Corn_0' },
                    { label: '🏢 Non-Agri', key: 'Non_agricultural_2' },
                  ].map(row => (
                    <tr key={row.key} className="border-b border-slate-800/50">
                      <td className="text-left px-2 py-1 text-slate-300">{row.label}</td>
                      <td className="text-center px-2 py-1 text-slate-400 border-x border-slate-800/50">
                        {compareData.analysis_1.crop_areas_feddans[row.key]} fed
                      </td>
                      <td className="text-center px-2 py-1 text-slate-400">
                        {compareData.analysis_2.crop_areas_feddans[row.key]} fed
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Health Results - Single */}
        {health && !compareData && (
          <div className="border-t border-slate-800 p-3 text-[10px] space-y-1 bg-slate-900/50">
            <p className="text-cyan-400 font-bold mb-1">Vegetation Health:</p>
            <p className="text-slate-400">🔴 Poor: {health.Low_Quality_Red} feddan</p>
            <p className="text-slate-400">🟡 Moderate: {health.Medium_Quality_Yellow} feddan</p>
            <p className="text-slate-400">🟢 Good: {health.High_Quality_Green} feddan</p>
          </div>
        )}

        {/* Health Results - Compare */}
        {compareData && (
          <div className="border-t border-slate-800 p-3 text-[10px] bg-slate-900/50">
            <p className="text-purple-400 font-bold mb-2">Health - Comparison:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left px-2 py-1 text-slate-500">Status</th>
                    <th className="text-center px-2 py-1 text-emerald-400 border-x border-slate-700">
                      {compareData.analysis_1.test_start_date} → {compareData.analysis_1.test_end_date}
                    </th>
                    <th className="text-center px-2 py-1 text-cyan-400">
                      {compareData.analysis_2.test_start_date} → {compareData.analysis_2.test_end_date}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: '🔴 Poor', key: 'Low_Quality_Red' },
                    { label: '🟡 Moderate', key: 'Medium_Quality_Yellow' },
                    { label: '🟢 Good', key: 'High_Quality_Green' },
                  ].map(row => (
                    <tr key={row.key} className="border-b border-slate-800/50">
                      <td className="text-left px-2 py-1 text-slate-300">{row.label}</td>
                      <td className="text-center px-2 py-1 text-slate-400 border-x border-slate-800/50">
                        {compareData.analysis_1.crop_health_feddans[row.key]} fed
                      </td>
                      <td className="text-center px-2 py-1 text-slate-400">
                        {compareData.analysis_2.crop_health_feddans[row.key]} fed
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 2. Map - Moved to the right (second child in flex container) */}
      <div className="flex-1 h-full relative z-10">
        <MapSection
          center={mapCenter}
          zoom={mapZoom}
          showDrawControls={showAddProject}
          onGeometryCreated={handleAddProjectDraw}
          polygonGeometry={showAddProject ? drawnPolygon : projectGeometry}
          cropTileUrl={showAddProject ? null : cropTileUrl}
          healthTileUrl={showAddProject ? null : healthTileUrl}
          activeLayer={activeLayer}
          onLayerChange={setActiveLayer}
          cropOpacity={rasterOpacity}
          healthOpacity={rasterOpacity}
          onCropOpacityChange={setRasterOpacity}
          onHealthOpacityChange={setRasterOpacity}
          cropTypePreview={showAddProject ? null : cropTypePreview}
          cropHealthPreview={showAddProject ? null : cropHealthPreview}
          previewBounds={(!showAddProject && projectGeometry && projectGeometry.length > 0) ? [
            [Math.min(...projectGeometry.map(p => p[1])), Math.min(...projectGeometry.map(p => p[0]))],
            [Math.max(...projectGeometry.map(p => p[1])), Math.max(...projectGeometry.map(p => p[0]))]
          ] : null}
          compareMode={!!compareData}
          compareLeftTileUrl={compareData ? (
            compareData.analysis_1.raster_saved
              ? `${API_BASE}/project_analysis/analysis_tiles/${compareData.analysis_1.id}/${activeLayer}/{z}/{x}/{y}.png`
              : (compareData.analysis_1[activeLayer === 'crop_type' ? 'crop_type_tiles_url' : 'crop_health_tiles_url'] || null)
          ) : null}
          compareRightTileUrl={compareData ? (
            compareData.analysis_2.raster_saved
              ? `${API_BASE}/project_analysis/analysis_tiles/${compareData.analysis_2.id}/${activeLayer}/{z}/{x}/{y}.png`
              : (compareData.analysis_2[activeLayer === 'crop_type' ? 'crop_type_tiles_url' : 'crop_health_tiles_url'] || null)
          ) : null}
          compareSliderPos={compareSliderPos}
          onCompareSliderChange={setCompareSliderPos}
          compareLeftLabel={compareData ? `${compareData.analysis_1.test_start_date} → ${compareData.analysis_1.test_end_date}` : null}
          compareRightLabel={compareData ? `${compareData.analysis_2.test_start_date} → ${compareData.analysis_2.test_end_date}` : null}
          compareLoading={loading && compareSelection.length === 2}
        />
        
        {/* Chatbot positioned bottom right correctly utilizing MapSection defaults implicitly */}
        <Chatbot onDataLoaded={handleChatbotData} />
      </div>

    </div>
  );
};

export default PredictionDashboard;