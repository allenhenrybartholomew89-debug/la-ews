import React, { useState } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, FileText, Database, ShieldAlert, Download, MousePointerSquareDashed, MapPin, Search } from 'lucide-react';
import { MapContainer, TileLayer, Polygon, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const CadastralMapInput = ({ cadasterPolygon, setCadasterPolygon }) => {
  useMapEvents({
    click(e) {
      setCadasterPolygon((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
    },
  });
  return cadasterPolygon.length > 0
    ? <Polygon positions={cadasterPolygon} color="#4f46e5" weight={3} fillOpacity={0.4} />
    : null;
};

const INITIAL_FORM_STATE = {
  ulpin: '', projectName: '', agency: 'NHAI', larrStage: 'Sec 11',
  area: '', compensation: 0, forestClearance: false, legalDispute: false,
};

const INITIAL_AUDIT_ENTRIES = [
  { id: 1, time: '10:42 AM', action: 'Officer ID 4822 ingested ULPIN 27150100204123 — LARR Risk Score Computed: 82%' },
  { id: 2, time: '09:15 AM', action: 'Batch pipeline processed 45 cadastral parcels for Mumbai Metro Line 3 (MMRC).' },
];

export default function AdminIngest({ isDarkMode, onIngest }) {
  const [activeTab, setActiveTab] = useState('single');
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [cadasterPolygon, setCadasterPolygon] = useState([]);
  const [bhuAadhaarVerified, setBhuAadhaarVerified] = useState(false);
  const [csvValidationRows, setCsvValidationRows] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_ENTRIES);

  const handleBhuAadhaarVerify = (e) => {
    e.preventDefault();
    if (formData.ulpin.length !== 14) {
      alert('ULPIN must be exactly 14 digits per DILRMP specification.');
      return;
    }
    setBhuAadhaarVerified(true);
    setFormData((prev) => ({
      ...prev,
      projectName: 'Verified via Bhu-Aadhaar Registry',
      area: '12.5',
    }));
  };

  const handleSubmitSingle = (e) => {
    e.preventDefault();
    const auditEntry = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      action: `Officer ingested ULPIN ${formData.ulpin} via Manual Parcel Entry — ML pipeline triggered.`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
    if (typeof onIngest === 'function') {
      onIngest(formData);
    }
    setFormData(INITIAL_FORM_STATE);
    setCadasterPolygon([]);
    setBhuAadhaarVerified(false);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setCsvValidationRows([
      { ulpin: '27150100204123', project: 'NH-44 Wardha Bypass', valid: true },
      { ulpin: '27150', project: 'NH-44 Extension', valid: false, error: 'Invalid ULPIN — must be 14 digits per DILRMP' },
      { ulpin: '27150100209999', project: 'NH-44 Phase II', valid: true },
    ]);
  };

  const handleBatchIngest = () => {
    const validEntries = csvValidationRows.filter((r) => r.valid);
    if (validEntries.length === 0) {
      alert('No valid ULPIN rows to ingest. Resolve validation errors and retry.');
      return;
    }
    const auditEntry = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      action: `Batch ingestion completed — ${validEntries.length} LARR parcels committed to database. ML pipeline triggered.`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
    setCsvValidationRows([]);
  };

  return (
    <div className="w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200">
      
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-1/5 bg-white dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col p-4 shadow-sm z-10">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 px-3 flex items-center gap-2">
          <Database size={16} /> Data Operations
        </h2>
        
        <nav className="space-y-2">
          <button onClick={() => setActiveTab('single')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'single' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
            <MapPin size={18} /> Single Parcel
          </button>
          <button onClick={() => setActiveTab('bulk')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'bulk' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
            <UploadCloud size={18} /> Bulk Upload (CSV)
          </button>
          <button onClick={() => setActiveTab('audit')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'audit' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
            <ShieldAlert size={18} /> Compliance & Audit
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="w-full lg:flex-1 p-4 lg:p-8">
        <div className="max-w-5xl mx-auto">

          {/* SINGLE PARCEL INGESTION */}
          {activeTab === 'single' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold tracking-tight">Manual Parcel Ingestion</h2>
              <p className="text-slate-500 text-sm">Register a new cadastral unit and sync with Bhu-Aadhaar registry.</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form */}
                <form onSubmit={handleSubmitSingle} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">14-Digit ULPIN (Bhu-Aadhaar)</label>
                    <div className="flex gap-2">
                      <input type="text" maxLength="14" required value={formData.ulpin} onChange={e => setFormData({...formData, ulpin: e.target.value.replace(/\D/g,'')})} className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none" placeholder="e.g. 27150100204123" />
                      <button type="button" onClick={handleBhuAadhaarVerify} className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 px-4 rounded-md text-sm font-bold flex items-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
                        <Search size={16} /> Verify
                      </button>
                    </div>
                  </div>

                  {bhuAadhaarVerified && (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded border border-emerald-200 dark:border-emerald-500/20">
                      <CheckCircle size={14} /> Bhu-Aadhaar registry record verified. Fields auto-populated.
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Project Assignment</label>
                      <input type="text" required value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Area (Hectares)</label>
                      <input type="number" required value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Current LARR Stage</label>
                      <select value={formData.larrStage} onChange={e => setFormData({...formData, larrStage: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500">
                        <option>Sec 11</option>
                        <option>Sec 19</option>
                        <option>Sec 21</option>
                        <option>Award</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Compensation Disbursed (%)</label>
                      <input type="number" max="100" min="0" value={formData.compensation} onChange={e => setFormData({...formData, compensation: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500" />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={formData.legalDispute} onChange={e => setFormData({...formData, legalDispute: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
                      Active Legal Dispute
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={formData.forestClearance} onChange={e => setFormData({...formData, forestClearance: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
                      Forest Clearance Pending
                    </label>
                  </div>

                  <button type="submit" disabled={!bhuAadhaarVerified} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow disabled:opacity-50 transition-colors">
                    Ingest &amp; Trigger ML Pipeline
                  </button>
                </form>

                {/* Cadastral Boundary Widget */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <MousePointerSquareDashed size={16} /> Draw Cadastral Boundary
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">Click on the map to place polygon vertices for precise geospatial ML analysis. Minimum 3 points.</p>
                  
                  <div className="flex-1 min-h-[300px] rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden relative">
                    <MapContainer center={[22.5, 79.0]} zoom={4} style={{ height: '100%', width: '100%' }} className={isDarkMode ? 'dark-map' : 'light-map'}>
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap"
                        className={isDarkMode ? 'map-tiles-dark' : 'map-tiles-light'}
                      />
                      <CadastralMapInput cadasterPolygon={cadasterPolygon} setCadasterPolygon={setCadasterPolygon} />
                    </MapContainer>
                    <button onClick={() => setCadasterPolygon([])} className="absolute bottom-4 right-4 z-[400] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs px-3 py-1.5 rounded shadow-sm font-bold hover:bg-slate-50 transition-colors text-slate-700">
                      Clear Map
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BULK UPLOAD */}
          {activeTab === 'bulk' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold tracking-tight">Bulk Excel/CSV Processing</h2>
              
              <div
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${dragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'}`}
              >
                <UploadCloud size={48} className="mx-auto text-slate-400 mb-4" />
                <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">Drag and drop LARR CSV export here</p>
                <p className="text-xs text-slate-500">or click to browse from your system (Max 10,000 cadastral records)</p>
              </div>

              {csvValidationRows.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                    <h3 className="font-bold text-sm">DILRMP Validation Preview</h3>
                    <button onClick={handleBatchIngest} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded shadow-sm transition-colors">
                      Batch Ingest &amp; Run LARR Pipeline
                    </button>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                        <th className="p-3">ULPIN</th>
                        <th className="p-3">Project Assignment</th>
                        <th className="p-3">Validation Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvValidationRows.map((row, i) => (
                        <tr key={i} className={`border-t border-slate-200 dark:border-slate-800 ${!row.valid ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                          <td className="p-3 font-mono">{row.ulpin}</td>
                          <td className="p-3">{row.project}</td>
                          <td className="p-3">
                            {row.valid ? (
                              <span className="text-emerald-600 flex items-center gap-1 text-xs font-bold"><CheckCircle size={14}/> Valid — ULPIN Confirmed</span>
                            ) : (
                              <span className="text-red-600 flex items-center gap-1 text-xs font-bold"><AlertCircle size={14}/> {row.error}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Compliance & Audit Trail</h2>
                  <p className="text-slate-500 text-sm mt-1">Immutable ledger of data ingress and system activity.</p>
                </div>
                <button className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors">
                  <Download size={16}/> Download PDF Receipt
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4 w-32">Timestamp</th>
                      <th className="p-4">Activity Log</th>
                      <th className="p-4 w-24 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 text-slate-500 font-mono text-xs">{log.time}</td>
                        <td className="p-4 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <FileText size={14} className="text-indigo-400" /> {log.action}
                        </td>
                        <td className="p-4 text-right text-emerald-600">
                          <CheckCircle size={16} className="inline" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
