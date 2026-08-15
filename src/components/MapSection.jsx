import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, useMap, GeoJSON, ImageOverlay } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Eye, EyeOff, Layers } from 'lucide-react';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const drawStyle = {
  color: '#10b981', 
  fillColor: '#10b981',
  fillOpacity: 0.2,
  weight: 2
};

const DrawHandler = ({ onGeometryCreated }) => {
  const map = useMap();
  const drawnItems = useRef(new L.FeatureGroup());

  useEffect(() => {
    map.addLayer(drawnItems.current);

    const drawControl = new L.Control.Draw({
      draw: {
        polygon: {
          allowIntersection: false,
          shapeOptions: drawStyle
        },
        rectangle: false, circle: false, circlemarker: false, marker: false, polyline: false,
      },
      edit: {
        featureGroup: drawnItems.current,
        remove: true
      }
    });

    map.addControl(drawControl);

    const handleCreated = (e) => {
      drawnItems.current.clearLayers();
      const layer = e.layer;
      drawnItems.current.addLayer(layer);

      const latlngs = layer.getLatLngs()[0];
      const coords = latlngs.map(p => [p.lng, p.lat]);
      coords.push(coords[0]);
      onGeometryCreated(coords);
    };

    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.DELETED, () => drawnItems.current.clearLayers());

    return () => {
      map.removeControl(drawControl);
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.DELETED);
    };
  }, [map, onGeometryCreated]);

  return null;
};

const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { animate: true, duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
};

const CompareSlider = ({ leftTileUrl, rightTileUrl, position }) => {
  const map = useMap();
  const posRef = useRef(position);
  const updateRef = useRef(null);

  useEffect(() => {
    posRef.current = position;
    if (updateRef.current) updateRef.current();
  }, [position]);

  useEffect(() => {
    if (!leftTileUrl || !rightTileUrl) return;

    const leftLayer = L.tileLayer(leftTileUrl);
    const rightLayer = L.tileLayer(rightTileUrl);

    map.addLayer(leftLayer);
    map.addLayer(rightLayer);

    const updateClip = () => {
      const size = map.getSize();
      const x = Math.round((posRef.current / 100) * size.x);
      try {
        if (leftLayer._container) leftLayer._container.style.clip = `rect(0,${x}px,${size.y}px,0)`;
        if (rightLayer._container) rightLayer._container.style.clip = `rect(0,${size.x}px,${size.y}px,${x}px)`;
      } catch (e) {
        console.warn('CompareSlider clip error:', e);
      }
    };

    let attempts = 0;
    const t = setInterval(() => {
      if (leftLayer._container && rightLayer._container || attempts++ > 20) {
        clearInterval(t);
        updateRef.current = updateClip;
        updateClip();
        map.on('move zoom resize', updateClip);
      }
    }, 100);

    return () => {
      clearInterval(t);
      map.off('move zoom resize', updateClip);
      updateRef.current = null;
      try {
        if (leftLayer._container) leftLayer._container.style.clip = '';
        if (rightLayer._container) rightLayer._container.style.clip = '';
      } catch (e) {}
      map.removeLayer(leftLayer);
      map.removeLayer(rightLayer);
    };
  }, [map, leftTileUrl, rightTileUrl]);

  return null;
};

const SwipeHandle = ({ position, onPositionChange, activeLayer, onLayerChange, leftLabel, rightLabel }) => {
  const containerRef = useRef(null);
  const draggingRef = useRef(false);

  const getPosFromMouse = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    onPositionChange?.(Math.max(0, Math.min(100, x)));
  };

  const onPointerDown = (e) => {
    draggingRef.current = true;
    getPosFromMouse(e.clientX);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    getPosFromMouse(e.clientX);
    e.preventDefault();
  };

  const onPointerUp = () => {
    draggingRef.current = false;
  };

  useEffect(() => {
    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('mouseup', onPointerUp);
    document.addEventListener('touchmove', onPointerMove);
    document.addEventListener('touchend', onPointerUp);
    return () => {
      document.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('mouseup', onPointerUp);
      document.removeEventListener('touchmove', onPointerMove);
      document.removeEventListener('touchend', onPointerUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[600] select-none pointer-events-none"
      onMouseDown={(e) => {
        if (!draggingRef.current && (e.target === containerRef.current || e.target.closest('[data-swipe-area]'))) {
          onPointerDown(e.nativeEvent);
        }
      }}
    >
      <div
        data-swipe-area
        className="absolute top-0 bottom-0 pointer-events-auto cursor-ew-resize"
        style={{ left: `${position}%`, transform: 'translateX(-50%)', touchAction: 'none' }}
        onMouseDown={onPointerDown}
        onTouchStart={(e) => { draggingRef.current = true; getPosFromMouse(e.touches[0].clientX); }}
      >
        <div className="absolute inset-0 bg-white/80 shadow-lg" style={{ width: '3px', left: '-1px' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-slate-700">
          <div className="flex items-center gap-0.5 text-slate-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 pointer-events-auto" dir="ltr">
        <div className="bg-slate-900/80 backdrop-blur-md border border-emerald-700/50 rounded-lg px-3 py-1.5 shadow-lg">
          <p className="text-[9px] text-emerald-400 font-bold uppercase">{leftLabel || ''} ←</p>
        </div>
      </div>
      <div className="absolute top-4 left-4 pointer-events-auto" dir="ltr">
        <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-700/50 rounded-lg px-3 py-1.5 shadow-lg">
          <p className="text-[9px] text-cyan-400 font-bold uppercase">→ {rightLabel || ''}</p>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg px-3 py-1.5 shadow-xl flex items-center gap-2" dir="ltr">
        <button
          onClick={() => onLayerChange?.(activeLayer === 'crop_type' ? 'crop_health' : 'crop_type')}
          className={`text-[10px] px-2 py-0.5 rounded font-medium uppercase tracking-wider ${
            activeLayer === 'crop_type' ? 'bg-emerald-700 text-white' : 'bg-cyan-700 text-white'
          }`}
        >
          {activeLayer === 'crop_type' ? 'Classification' : 'Health Index'}
        </button>
      </div>
    </div>
  );
};

const MapSection = ({
  center = [30.565, 30.932],
  zoom = 12,
  onGeometryCreated,
  cropTileUrl,
  healthTileUrl,
  cropOpacity = 0.7,
  healthOpacity = 0.7,
  onCropOpacityChange,
  onHealthOpacityChange,
  cropVisible = true,
  healthVisible = true,
  onCropVisibleChange,
  onHealthVisibleChange,
  activeLayer = 'crop_type',
  onLayerChange,
  showDrawControls = true,
  polygonGeometry = null,
  cropGeoJSON = null,
  healthGeoJSON = null,
  cropVectorVisible = true,
  healthVectorVisible = true,
  onCropVectorVisibleChange,
  onHealthVectorVisibleChange,
  onClearVectors,
  selectedCropCategories,
  onSelectedCropCategoriesChange,
  selectedHealthStatuses,
  onSelectedHealthStatusesChange,
  onGenerateVectors,
  vectorDataLoaded,
  thumbnailOverlay,
  thumbnailBounds,
  cropTypePreview,
  cropHealthPreview,
  previewBounds,
  compareMode,
  compareLeftTileUrl,
  compareRightTileUrl,
  compareSliderPos,
  onCompareSliderChange,
  compareLeftLabel,
  compareRightLabel,
  compareLoading,
  basemapPositionClasses = "absolute bottom-[20px] right-[74px] z-[500]",
  basemapMenuClasses = "absolute bottom-[54px] right-0 mb-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl w-36 overflow-hidden",
  children
}) => {
  
  const [basemap, setBasemap] = useState('esri');
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);

  const basemaps = [
    { id: 'esri', name: 'ESRI Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', subdomains: 'abc' },
    { id: 'google', name: 'Google Satellite', url: 'https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', subdomains: ['mt0', 'mt1', 'mt2', 'mt3'] },
    { id: 'osm', name: 'OpenStreetMap', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', subdomains: 'abc' },
    { id: 'dark', name: 'Carto Dark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', subdomains: 'abc' },
  ];

  const filterGeoJSON = (data, field, values) => {
    if (!data) return null;
    return {
      ...data,
      features: data.features.filter(f => values.includes(f.properties[field]))
    };
  };

  const filteredCropGeoJSON = filterGeoJSON(cropGeoJSON, 'category', selectedCropCategories);
  const filteredHealthGeoJSON = filterGeoJSON(healthGeoJSON, 'health_status', selectedHealthStatuses);

  const isVectorMode = (cropGeoJSON || healthGeoJSON) && (cropVectorVisible || healthVectorVisible);
  const showCompare = compareMode && compareLeftTileUrl && compareRightTileUrl;

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950">
      
      {/* Map Basemap Switcher UI */}
      <div className={basemapPositionClasses} dir="ltr">
        <div className="relative">
          <button 
              onClick={() => setShowBasemapMenu(!showBasemapMenu)}
              className="w-[46px] h-[46px] rounded-[12px] bg-[#e2e4c8] dark:bg-slate-800 border-[2.5px] border-white/90 dark:border-slate-700 text-[#1b9a4c] dark:text-emerald-400 shadow-md flex items-center justify-center transition-transform hover:scale-105"
              title="Toggle Basemap"
          >
              <Layers className="w-5 h-5" strokeWidth={2.5} />
          </button>          
          {showBasemapMenu && (
            <div className={basemapMenuClasses}>
              {basemaps.map(b => (
                <button 
                  key={b.id} 
                  onClick={() => { setBasemap(b.id); setShowBasemapMenu(false); }}
                  className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
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

      <MapContainer
        center={center}
        zoom={zoom}
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

        {showCompare && (
          <CompareSlider
            leftTileUrl={compareLeftTileUrl}
            rightTileUrl={compareRightTileUrl}
            position={compareSliderPos ?? 50}
          />
        )}

        {!showCompare && !isVectorMode && cropTypePreview && cropHealthPreview && previewBounds && (
          <>
            <ImageOverlay url={cropTypePreview} bounds={previewBounds} opacity={activeLayer === 'crop_type' ? 1 - cropOpacity : 0} zIndex={15} />
            <ImageOverlay url={cropHealthPreview} bounds={previewBounds} opacity={activeLayer === 'crop_health' ? 1 - healthOpacity : 0} zIndex={15} />
          </>
        )}

        {!showCompare && !isVectorMode && !(cropTypePreview && cropHealthPreview && previewBounds) && thumbnailOverlay && thumbnailBounds && (
          <ImageOverlay url={thumbnailOverlay} bounds={thumbnailBounds} opacity={0.85} zIndex={14} />
        )}

        {!showCompare && !isVectorMode && !(cropTypePreview && cropHealthPreview && previewBounds) && (activeLayer === 'crop_type' ? cropTileUrl : healthTileUrl) && (
          <TileLayer
            key={activeLayer}
            url={activeLayer === 'crop_type' ? cropTileUrl : healthTileUrl}
            opacity={1 - (activeLayer === 'crop_type' ? cropOpacity : healthOpacity)}
            zIndex={15}
            maxZoom={20}
          />
        )}

        {cropGeoJSON && cropVectorVisible && (
          <GeoJSON
            key={`crop-${JSON.stringify(selectedCropCategories)}`}
            data={filteredCropGeoJSON}
            style={feature => ({ color: feature.properties.color, weight: 1, fillOpacity: 0.5 })}
          />
        )}
        {healthGeoJSON && healthVectorVisible && (
          <GeoJSON
            key={`health-${JSON.stringify(selectedHealthStatuses)}`}
            data={filteredHealthGeoJSON}
            style={feature => ({ color: feature.properties.color, weight: 1, fillOpacity: 0.5 })}
          />
        )}

        {polygonGeometry && polygonGeometry.length > 0 && (
          <Polygon
            positions={polygonGeometry.map(p => [p[1], p[0]])}
            pathOptions={{
              color: '#10b981',
              fillColor: 'transparent',
              weight: 2.5
            }}
          />
        )}

        {showDrawControls && <DrawHandler onGeometryCreated={onGeometryCreated} />}
        <MapController center={center} zoom={zoom} />
        {children}
      </MapContainer>

      {showCompare && (
        <SwipeHandle
          position={compareSliderPos ?? 50}
          onPositionChange={onCompareSliderChange}
          activeLayer={activeLayer}
          onLayerChange={onLayerChange}
          leftLabel={compareLeftLabel}
          rightLabel={compareRightLabel}
        />
      )}

      {compareLoading && (
        <div className="absolute inset-0 z-[700] bg-slate-950/60 flex items-center justify-center">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl px-6 py-4 shadow-xl flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-medium text-slate-300">Loading Comparison...</span>
          </div>
        </div>
      )}

      {!showCompare && (cropTileUrl || healthTileUrl) && (
        <div className="absolute bottom-6 left-6 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white rounded-xl p-4 w-60 shadow-2xl font-sans text-left" dir="ltr">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-2 border-b border-slate-800 pb-1">Raster Controls</h3>
          <div className="space-y-1">
            {cropTileUrl && (
              <label className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                activeLayer === 'crop_type' ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700' : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}>
                <span className="text-[10px] font-medium uppercase">Classification</span>
                <input type="radio" name="raster-layer" checked={activeLayer === 'crop_type'} onChange={() => onLayerChange?.('crop_type')} className="sr-only" />
                <div className={`w-2.5 h-2.5 rounded-full border-2 ${activeLayer === 'crop_type' ? 'border-emerald-400 bg-emerald-400' : 'border-slate-600'}`} />
              </label>
            )}
            {activeLayer === 'crop_type' && cropTileUrl && (
              <div className="px-2 mb-1">
                <input type="range" min="0" max="1" step="0.05" value={cropOpacity} onChange={(e) => onCropOpacityChange?.(parseFloat(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg cursor-pointer" />
              </div>
            )}
            {healthTileUrl && (
              <label className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                activeLayer === 'crop_health' ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-700' : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}>
                <span className="text-[10px] font-medium uppercase">Health Index (NDVI)</span>
                <input type="radio" name="raster-layer" checked={activeLayer === 'crop_health'} onChange={() => onLayerChange?.('crop_health')} className="sr-only" />
                <div className={`w-2.5 h-2.5 rounded-full border-2 ${activeLayer === 'crop_health' ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'}`} />
              </label>
            )}
            {activeLayer === 'crop_health' && healthTileUrl && (
              <div className="px-2 mb-1">
                <input type="range" min="0" max="1" step="0.05" value={healthOpacity} onChange={(e) => onHealthOpacityChange?.(parseFloat(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg cursor-pointer" />
              </div>
            )}
          </div>
          {!vectorDataLoaded && (
            <button onClick={onGenerateVectors} className="w-full mt-3 bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] py-1.5 rounded uppercase font-bold tracking-wider">Vectorize</button>
          )}
        </div>
      )}

      {vectorDataLoaded && (cropGeoJSON || healthGeoJSON) && (
        <div className="absolute bottom-6 right-6 z-[400] bg-slate-900/90 backdrop-blur-md border border-emerald-500/20 text-white rounded-xl p-4 w-72 shadow-2xl font-sans text-left" dir="ltr">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-1">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Vector Controls</h3>
            <button onClick={onClearVectors} className="text-[9px] bg-red-950/50 text-red-400 px-2 py-0.5 rounded hover:bg-red-900 uppercase font-bold tracking-wider">Clear</button>
          </div>
          <div className="space-y-3">
            {cropGeoJSON && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold">
                  <span className="text-emerald-300">Classification</span>
                  <button onClick={() => onCropVectorVisibleChange(!cropVectorVisible)}>{cropVectorVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-slate-600" />}</button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {['Wheat', 'Corn', 'Non-Agricultural'].map(cat => (
                    <button key={cat} onClick={() => onSelectedCropCategoriesChange(selectedCropCategories.includes(cat) ? selectedCropCategories.filter(c => c !== cat) : [...selectedCropCategories, cat])} className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${selectedCropCategories.includes(cat) ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {healthGeoJSON && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold">
                  <span className="text-cyan-300">Health Status</span>
                  <button onClick={() => onHealthVectorVisibleChange(!healthVectorVisible)}>{healthVectorVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-slate-600" />}</button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {['Good Health', 'Median Health', 'Bad Health'].map(status => (
                    <button key={status} onClick={() => onSelectedHealthStatusesChange(selectedHealthStatuses.includes(status) ? selectedHealthStatuses.filter(s => s !== status) : [...selectedHealthStatuses, status])} className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${selectedHealthStatuses.includes(status) ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default MapSection;