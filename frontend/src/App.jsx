import React, { useState, useEffect, useCallback, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import {
  BASELINE_PROJECTS, ROLES, fetchProjects, fetchPrediction, calcAnnualBleed, calcDailyBleed
} from './utils';
import HeaderNav from './components/HeaderNav';
import SpatialMap from './components/SpatialMap';
import ProjectDossier from './components/ProjectDossier';
import AdminIngest from './AdminIngest';
import Login from './components/Login';

function KpiCard({ dot, label, value, suffix, badge, badgeColor }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${dot}`} />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">{label}</p>
      </div>
      <div className="flex items-end justify-between">
        <div className="flex items-end gap-1.5">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{value}</span>
          {suffix && <span className="text-sm font-medium text-slate-400 mb-0.5">{suffix}</span>}
        </div>
        {badge && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${badgeColor}`}>{badge}</span>}
      </div>
    </div>
  );
}

export default function GovTechDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [activeRole, setActiveRole] = useState('central');
  const [searchQuery, setSearchQuery] = useState('');
  const [time, setTime] = useState(new Date());

  const [projects, setProjects] = useState(BASELINE_PROJECTS);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [predictionData, setPredictionData] = useState(null);

  const [filterState, setFilterState] = useState('all');
  const [filterAgency, setFilterAgency] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const [simParams, setSimParams] = useState(null);
  const [simResult, setSimResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [syncingId, setSyncingId] = useState(null);

  const handleLaunchSurvey = (id) => {
    setSyncingId(id);
    setTimeout(() => {
      alert("Success: Cadastral Survey Initiated. GPS telemetry linked to Bhu-Aadhaar registry.");
      setSyncingId(null);
    }, 1500);
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await fetchProjects();
      if (!cancelled) {
        setProjects(data);
        const firstHighRisk = data.find((p) => p.risk_level === 'High') || data[0];
        handleSelectProject(firstHighRisk);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProjects = useMemo(() => {
    let result = [...projects];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => (p.name || '').toLowerCase().includes(q) || (p.ulpin || '').includes(q)
      );
    }
    if (filterState !== 'all') {
      result = result.filter((p) => (p.state || '').toLowerCase() === filterState.toLowerCase());
    }
    if (filterAgency !== 'all') {
      result = result.filter((p) =>
        (p.project_type || '').toLowerCase().includes(filterAgency.toLowerCase())
      );
    }
    if (filterRisk !== 'all') {
      result = result.filter((p) => (p.risk_level || '').toLowerCase() === filterRisk.toLowerCase());
    }
    if (filterCategory !== 'all') {
      result = result.filter((p) => (p.category || '').toLowerCase() === filterCategory.toLowerCase());
    }
    return result;
  }, [projects, searchQuery, filterState, filterAgency, filterRisk, filterCategory]);

  const handleSelectProject = useCallback(async (proj) => {
    if (!proj) return;
    setSelectedProject(proj);
    setSimParams({ ...proj });
    setSimResult(null);
    const prediction = await fetchPrediction(proj);
    setPredictionData(prediction);
  }, []);

  useEffect(() => {
    // If the currently selected project is no longer in the filtered list,
    // automatically select the first available project in the new filtered list.
    if (filteredProjects.length > 0) {
      if (!selectedProject?.id || !filteredProjects.find(p => p.id === selectedProject?.id)) {
        handleSelectProject(filteredProjects[0]);
      }
    } else {
      setSelectedProject(null);
      setSimParams(null);
      setPredictionData(null);
      setSimResult(null);
    }
  }, [filteredProjects, selectedProject?.id, handleSelectProject]);

  const handleSimulate = useCallback(async () => {
    if (!simParams) return;
    setIsSimulating(true);
    const prediction = await fetchPrediction(simParams);
    const compensationImproved = simParams.compensation_disbursed_pct > 0.6;
    const disputeResolved = !simParams.has_legal_dispute;
    const forestCleared = !simParams.forest_clearance_pending;
    let adjustedScore = prediction.risk_score;
    if (compensationImproved) adjustedScore -= 30;
    if (disputeResolved) adjustedScore -= 15;
    if (forestCleared) adjustedScore -= 10;
    const finalScore = Math.min(95, Math.max(8, adjustedScore));
    setTimeout(() => {
      setSimResult({
        ...prediction,
        risk_score: finalScore,
        risk_level: finalScore > 70 ? 'High' : finalScore > 35 ? 'Medium' : 'Low',
        actionable_recommendation: finalScore > 70
          ? 'Risk remains critical. Prioritise compensation disbursement and resolve active LARR litigation immediately.'
          : 'Risk trajectory improving. Continue monitoring and advance to next LARR statutory phase.',
      });
      setIsSimulating(false);
    }, 600);
  }, [simParams]);

  const handleIngestProject = useCallback((newProjectPayload) => {
    const larrStageMap = { 'Sec 11': 0, 'Sec 19': 1, 'Sec 21': 2, Award: 3 };
    const compensationRate = Number(newProjectPayload.compensation) / 100;
    const computedRiskScore = Math.min(
      95,
      Math.max(
        10,
        80
          - compensationRate * 40
          - (newProjectPayload.legalDispute ? 0 : 15)
          - (newProjectPayload.forestClearance ? 0 : 10)
      )
    );
    const ingestedProject = {
      id: Date.now(),
      ulpin: newProjectPayload.ulpin,
      name: newProjectPayload.projectName,
      project_type: newProjectPayload.agency,
      category: 'Infrastructure',
      nodal_officer: 'Admin Ingest (Manual)',
      state: 'Pending JMS Survey',
      district: 'Pending LARR Notification',
      latitude: 22.5 + (Math.random() - 0.5) * 10,
      longitude: 79.0 + (Math.random() - 0.5) * 10,
      land_area_ha: Number(newProjectPayload.area) || 120,
      affected_families: Math.floor(Math.random() * 500) + 50,
      capital_cr: Math.floor(Math.random() * 1000) + 150,
      compensation_disbursed_pct: compensationRate,
      sec11_delay_days: Math.floor(Math.random() * 120) + 30,
      has_legal_dispute: newProjectPayload.legalDispute,
      forest_clearance_pending: newProjectPayload.forestClearance,
      historical_district_risk: 0.5,
      risk_score: Math.round(computedRiskScore),
      risk_level: computedRiskScore > 70 ? 'High' : computedRiskScore > 35 ? 'Medium' : 'Low',
      larr_stage: larrStageMap[newProjectPayload.larrStage] ?? 0,
    };
    setProjects((prev) => [ingestedProject, ...prev]);
  }, []);

  const roleLabels = ROLES[activeRole]?.kpiLabels || ROLES.central.kpiLabels;

  const displayTotal = filteredProjects.length || BASELINE_PROJECTS.length;
  const displayHighRisk = filteredProjects.filter((p) => p.risk_level === 'High').length;
  const displayAvgDelay = Math.round(
    filteredProjects.reduce((acc, p) => acc + (p.sec11_delay_days || 0), 0) /
      (filteredProjects.length || 1)
  );
  const displayFiscalBleed = calcAnnualBleed(filteredProjects).toFixed(1) || '142.8';

  if (!isAuthenticated) {
    return (
      <Login
        onLogin={(role) => { setActiveRole(role); setIsAuthenticated(true); }}
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans selection:bg-indigo-500/30 flex flex-col overflow-hidden transition-colors duration-200">

        <div className="h-1 w-full flex">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#138808]" />
        </div>

        <div className="relative z-50">
          <HeaderNav
            isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}
            activeView={activeView} setActiveView={setActiveView}
            activeRole={activeRole} setActiveRole={setActiveRole}
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            time={time}
          />
        </div>

        {activeRole === 'nodal' ? (
          <div className="flex flex-col lg:flex-row w-full gap-6 p-4 lg:p-0">
            <div className="w-full lg:w-1/4 bg-slate-50 dark:bg-slate-950 border-r-0 lg:border-r border-b lg:border-b-0 border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">JMS Surveys Pending</h2>
              <div className="space-y-4">
                {filteredProjects.map((p) => (
                  <div
                    key={p.id}
                    className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm cursor-pointer transition-all ${selectedProject?.id === p.id ? 'border-indigo-400 ring-1 ring-indigo-400' : ''}`}
                    onClick={() => handleSelectProject(p)}
                  >
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</div>
                    <div className="text-xs text-slate-500 mt-1">ULPIN: {p.ulpin || 'Pending Assignment'}</div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLaunchSurvey(p.id);
                      }}
                      className="mt-3 w-full bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 py-2 rounded-lg text-xs font-bold border border-indigo-200 dark:border-indigo-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                      {syncingId === p.id ? (
                        <>
                          <div className="w-3 h-3 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                          Syncing...
                        </>
                      ) : (
                        'Launch Cadastral Survey'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full lg:flex-1 flex flex-col bg-white dark:bg-slate-900 relative z-0">
              <AdminIngest isDarkMode={isDarkMode} onIngest={handleIngestProject} />
            </div>
          </div>
        ) : activeView === 'dashboard' ? (
          <>
            <div className="bg-white dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 flex gap-4 text-sm z-10 transition-colors duration-200 shadow-sm flex-wrap">
              <select value={filterState} onChange={(e) => setFilterState(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                <option value="all">All States</option>
                {[...new Set(projects.map(p => p.state).filter(Boolean))].sort().map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select value={filterAgency} onChange={(e) => setFilterAgency(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                <option value="all">All Agencies</option>
                {[...new Set(projects.map(p => p.project_type).filter(Boolean))].sort().map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                <option value="all">All Risk Levels</option>
                <option value="High">High Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="Low">Low Risk</option>
              </select>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                <option value="all">All Categories</option>
                {[...new Set(projects.map(p => p.category).filter(Boolean))].sort().map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
              <div className="w-full xl:w-[60%] flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-y-auto transition-colors duration-200">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6">
                  <KpiCard dot="bg-blue-500" label={roleLabels.total} value={displayTotal} />
                  <KpiCard dot="bg-red-500" label={roleLabels.hotspots} value={displayHighRisk} badge="High Risk" badgeColor="text-red-600 bg-red-50 dark:bg-red-500/10" />
                  <KpiCard dot="bg-orange-500" label={roleLabels.delay} value={displayAvgDelay} suffix="Days" />
                  <KpiCard dot="bg-emerald-500" label={roleLabels.fiscal} value={`₹${displayFiscalBleed}`} suffix="Cr/yr" />
                </div>
                <div className="flex-1 px-6 pb-6 min-h-[400px] flex flex-col">
                  <SpatialMap
                    projects={filteredProjects}
                    selectedProject={selectedProject}
                    onSelect={handleSelectProject}
                    isDarkMode={isDarkMode}
                    activeRole={activeRole}
                    loading={loading}
                  />
                </div>
              </div>

              <div className="w-full xl:w-[40%] bg-white dark:bg-slate-900 flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.05)] dark:shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-20 overflow-hidden transition-colors duration-200">
                <ProjectDossier
                  project={selectedProject}
                  predictionData={predictionData}
                  simParams={simParams}
                  setSimParams={setSimParams}
                  simResult={simResult}
                  isSimulating={isSimulating}
                  onSimulate={handleSimulate}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
          </>
        ) : (
          <AdminIngest isDarkMode={isDarkMode} onIngest={handleIngestProject} />
        )}

        <style dangerouslySetInnerHTML={{ __html: `
          .dark-map .leaflet-container { background: #0f172a !important; }
          .light-map .leaflet-container { background: #f8fafc !important; }
          .map-tiles-dark { filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7); }
          .map-tiles-light { filter: none; }
          .gov-popup.dark .leaflet-popup-content-wrapper { background: #0f172a !important; border: 1px solid #334155; color: #f8fafc !important; }
          .gov-popup.dark .leaflet-popup-tip { background: #0f172a !important; }
          .gov-popup:not(.dark) .leaflet-popup-content-wrapper { background: #fff !important; border: 1px solid #e2e8f0; color: #0f172a !important; }
          .gov-popup:not(.dark) .leaflet-popup-tip { background: #fff !important; }
        `}} />
      </div>
    </div>
  );
}
