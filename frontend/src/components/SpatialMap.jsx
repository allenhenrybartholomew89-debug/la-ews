// SpatialMap.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Circle,
  Polygon,
  Polyline,
  Tooltip,
  LayersControl,
  LayerGroup,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getRiskColor, ROLES, GRIEVANCE_CLUSTERS, ENCROACHMENT_ZONES, DEPENDENCIES } from '../utils';
import { Layers, AlertTriangle } from 'lucide-react';

function MapViewController({ center, zoom, selectedProject }) {
  const map = useMap();

  useEffect(() => {
    if (selectedProject?.latitude != null && selectedProject?.longitude != null) {
      map.setView([selectedProject.latitude, selectedProject.longitude], Math.max(map.getZoom(), 8), {
        animate: true,
      });
    } else if (center && zoom) {
      map.setView(center, zoom, {
        animate: true,
      });
    }
  }, [center, zoom, selectedProject, map]);

  return null;
}

function MobileMapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    const container = map.getContainer();
    if (container) resizeObserver.observe(container);
    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [map]);
  return null;
}

export default function SpatialMap({
  projects = [],
  selectedProject = null,
  onSelect = () => {},
  isDarkMode = false,
  activeRole = 'central',
  loading = false,
}) {
  const [showLegend, setShowLegend] = useState(true);
  const roleConfig = ROLES[activeRole] || ROLES.central || { mapCenter: [22.5, 79.0], mapZoom: 5 };
  const mapCenter = roleConfig.mapCenter || [22.5, 79.0];
  const mapZoom = roleConfig.mapZoom || 5;

  const validProjects = useMemo(() => {
    return projects.filter((p) => p && typeof p.latitude === 'number' && typeof p.longitude === 'number');
  }, [projects]);

  const dependencyLines = useMemo(() => {
    return DEPENDENCIES.map(dep => {
      const p1 = validProjects.find(p => p.id === dep.fromId);
      const p2 = validProjects.find(p => p.id === dep.toId);
      if (p1 && p2) {
        return {
          id: `${p1.id}-${p2.id}`,
          positions: [[p1.latitude, p1.longitude], [p2.latitude, p2.longitude]],
          label: dep.label
        };
      }
      return null;
    }).filter(Boolean);
  }, [validProjects]);

  return (
    <div className="w-full h-[60vh] md:h-full min-h-[400px] relative z-0 flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/50 shadow-md">
      {loading ? (
        <div className="w-full h-full min-h-[400px] bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-emerald-600 dark:border-emerald-500" />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Loading geospatial data...
          </span>
        </div>
      ) : (
        <>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%', minHeight: '400px' }}
            className={isDarkMode ? 'dark-map' : 'light-map'}
          >
            <MobileMapResizer />
            <MapViewController
              center={mapCenter}
              zoom={mapZoom}
              selectedProject={selectedProject}
            />

            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Esri World Street Map">
                <TileLayer
                  attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                  className={isDarkMode ? 'map-tiles-dark' : 'map-tiles-light'}
                />
              </LayersControl.BaseLayer>

              <LayersControl.Overlay checked name="CPGRAMS Grievance Heatmap">
                <LayerGroup>
                  {GRIEVANCE_CLUSTERS.map((cluster, idx) => (
                    <Circle
                      key={`grievance-cluster-${idx}`}
                      center={[cluster.lat, cluster.lng]}
                      radius={cluster.radius}
                      pathOptions={{
                        fillColor: '#ef4444',
                        fillOpacity: (cluster.intensity || 0.5) * 0.3,
                        stroke: false,
                      }}
                    >
                      <Popup className={isDarkMode ? 'gov-popup dark' : 'gov-popup'}>
                        <div className="p-1 text-xs">
                          <div className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>CPGRAMS Grievance Hotspot</span>
                          </div>
                          <div className="mt-1 text-slate-700 dark:text-slate-300">
                            Intensity: <span className="font-bold">{Math.round((cluster.intensity || 0) * 100)}%</span>
                          </div>
                          <div className="text-slate-500 dark:text-slate-400">
                            Radius: {(cluster.radius / 1000).toFixed(0)} km
                          </div>
                        </div>
                      </Popup>
                    </Circle>
                  ))}
                </LayerGroup>
              </LayersControl.Overlay>

              <LayersControl.Overlay checked name="Encroachment Detection">
                <LayerGroup>
                  {ENCROACHMENT_ZONES.map((zone, idx) => (
                    <Polygon
                      key={`encroachment-zone-${idx}`}
                      positions={zone.polygon}
                      pathOptions={{
                        color: '#ef4444',
                        weight: 2,
                        dashArray: '6, 6',
                        fillColor: '#ef4444',
                        fillOpacity: 0.25,
                      }}
                    >
                      <Popup className={isDarkMode ? 'gov-popup dark' : 'gov-popup'}>
                        <div className="p-1 text-xs">
                          <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>🚨 Encroachment Detected Post-Sec 11 Notice</span>
                          </div>
                          <div className="mt-1.5 font-semibold text-slate-800 dark:text-slate-200">
                            {zone.label}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                            Target Project ID: #{zone.projectId}
                          </div>
                        </div>
                      </Popup>
                    </Polygon>
                  ))}
                </LayerGroup>
              </LayersControl.Overlay>

              <LayersControl.Overlay name="Gati Shakti Network Graph">
                <LayerGroup>
                  {dependencyLines.map((line) => (
                    <Polyline
                      key={line.id}
                      positions={line.positions}
                      pathOptions={{ color: '#ef4444', weight: 2, dashArray: '5, 10' }}
                    >
                      <Tooltip sticky className={isDarkMode ? 'gov-popup dark' : 'gov-popup'}>
                        <div className="font-bold text-red-600 flex items-center gap-1"><AlertTriangle size={14}/> Dependency Alert</div>
                        <div className="text-xs mt-1">{line.label}</div>
                      </Tooltip>
                    </Polyline>
                  ))}
                </LayerGroup>
              </LayersControl.Overlay>
            </LayersControl>

            {projects.map((proj) => {
              if (proj.latitude == null || proj.longitude == null) return null;
              const isSelected = selectedProject?.id === proj.id;
              const riskColor = getRiskColor(proj.risk_score);

              return (
               <CircleMarker
                  key={proj.id}
                  center={[proj.latitude, proj.longitude]}
                  pathOptions={{
                    fillColor: riskColor,
                    color: isSelected ? (isDarkMode ? '#ffffff' : '#0f172a') : riskColor,
                    fillOpacity: isSelected ? 0.95 : 0.65,
                    weight: isSelected ? 3.5 : 1.5,
                  }}
                  radius={isSelected ? 11 : 7}
                  eventHandlers={{
                    click: () => onSelect(proj),
                  }}
                >
                  <Popup className={isDarkMode ? 'gov-popup dark' : 'gov-popup'}>
                    <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-1.5 rounded min-w-[190px]">
                      <div className="font-bold border-b border-slate-200 dark:border-slate-700 pb-1 mb-1.5 text-sm text-slate-900 dark:text-white">
                        {proj.name || `${proj.project_type || 'Infrastructure'} Project`}
                      </div>
                      <div className="text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Risk Score:</span>
                          <span style={{ color: riskColor }} className="font-bold">
                            {proj.risk_score}% ({proj.risk_level || (proj.risk_score > 70 ? 'High' : proj.risk_score > 35 ? 'Medium' : 'Low')})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Land Area:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {proj.land_area_ha} Ha
                          </span>
                        </div>
                        {proj.district && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400">District:</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {proj.district}{proj.state ? `, ${proj.state}` : ''}
                            </span>
                          </div>
                        )}
                        {proj.sec11_delay_days !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Sec 11 Delay:</span>
                            <span className={`font-semibold ${proj.sec11_delay_days > 60 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                              {proj.sec11_delay_days} days
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>

          <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs shadow-md transition-all duration-200 pointer-events-auto">
            <button
              type="button"
              onClick={() => setShowLegend((prev) => !prev)}
              className="flex items-center justify-between w-full gap-2 font-semibold text-slate-800 dark:text-slate-100 hover:opacity-80 transition-opacity"
            >
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>GIS Intelligence Layer</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {showLegend ? 'Hide' : 'Show'}
              </span>
            </button>
            {showLegend && (
              <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> High (&gt;70)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Med (35-70)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Low (&lt;35)
                </span>
              </div>
            )}
          </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          .dark-map .leaflet-container { background: #0f172a !important; }
          .light-map .leaflet-container { background: #f8fafc !important; }
          
          .map-tiles-dark { filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7); }
          .map-tiles-light { filter: none; }
          
          .gov-popup.dark .leaflet-popup-content-wrapper { background: #0f172a !important; border: 1px solid #334155; color: #f8fafc !important; border-radius: 0.5rem; }
          .gov-popup.dark .leaflet-popup-tip { background: #0f172a !important; border: 1px solid #334155; }
          
          .gov-popup:not(.dark) .leaflet-popup-content-wrapper { background: #ffffff !important; border: 1px solid #e2e8f0; color: #0f172a !important; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .gov-popup:not(.dark) .leaflet-popup-tip { background: #ffffff !important; border: 1px solid #e2e8f0; }

          .dark-map .leaflet-bar a { background-color: #0f172a !important; color: #f1f5f9 !important; border-bottom: 1px solid #334155 !important; }
          .dark-map .leaflet-bar a:hover { background-color: #1e293b !important; }
          .dark-map .leaflet-control-layers { background-color: #0f172a !important; color: #f1f5f9 !important; border: 1px solid #334155 !important; border-radius: 0.5rem !important; }
          .light-map .leaflet-control-layers { background-color: #ffffff !important; color: #0f172a !important; border: 1px solid #e2e8f0 !important; border-radius: 0.5rem !important; }
        `,
      }} />
    </div>
  );
}