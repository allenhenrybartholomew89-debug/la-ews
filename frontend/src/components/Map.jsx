import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const Map = ({ projects, onSelectProject, selectedId }) => {
  const getRiskColor = (score) => {
    if (score > 70) return '#ef4444';   // Red - High
    if (score > 35) return '#f59e0b';   // Yellow - Medium
    return '#22c55e';                    // Green - Low
  };

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer center={[22.0, 78.5]} zoom={5} style={{ height: '100%', width: '100%', minHeight: "400px" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {projects.map(proj => (
          proj.latitude && proj.longitude && (
            <CircleMarker
              key={proj.id}
              center={[proj.latitude, proj.longitude]}
              pathOptions={{
                fillColor: getRiskColor(proj.risk_score),
                color: proj.id === selectedId ? '#1d4ed8' : getRiskColor(proj.risk_score),
                fillOpacity: 0.75,
                weight: proj.id === selectedId ? 3 : 1,
              }}
              radius={proj.id === selectedId ? 12 : 8}
              eventHandlers={{
                click: () => onSelectProject(proj)
              }}
            >
              <Popup>
                <div className="font-semibold text-sm">{proj.project_type} Project (ID: {proj.id})</div>
                <div className="text-xs text-slate-600 space-y-1 mt-1 font-medium">
                  <div>Risk: <span style={{color: getRiskColor(proj.risk_score)}} className="font-bold">{proj.risk_level} ({proj.risk_score}%)</span></div>
                  <div>Area: {proj.land_area_ha} ha</div>
                  <div>Families: {proj.affected_families}</div>
                  <div>Compensation: {(proj.compensation_disbursed_pct * 100).toFixed(0)}%</div>
                  <div>Legal Dispute: {proj.has_legal_dispute ? '⚠️ Yes' : '✅ No'}</div>
                </div>
              </Popup>
            </CircleMarker>
          )
        ))}
      </MapContainer>
    </div>
  );
};
export default Map;
