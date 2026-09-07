import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import {
  Layers, UserCircle, Briefcase, Map as MapIcon, CheckCircle, Activity, Info,
  FileText, AlertTriangle, X, Copy, Send, Phone, Smartphone
} from 'lucide-react';
import { FEATURE_LABELS, getRiskColor, getRiskBg, calcDailyBleed, calcOverrun } from '../utils';
import ECourtsScanner from './ECourtsScanner';
import WhatIfEngine from './WhatIfEngine';

const LARR_STAGES = [
  { key: 0, label: 'Sec 11', desc: 'Notified' },
  { key: 1, label: 'Sec 19', desc: 'Declared' },
  { key: 2, label: 'Sec 21', desc: 'Claims' },
  { key: 3, label: 'Award', desc: 'Sec 30' },
];

export default function ProjectDossier({
  project, predictionData, simParams, setSimParams,
  simResult, isSimulating, onSimulate, isDarkMode, onUpdateProject
}) {
  const [showMemo, setShowMemo] = useState(false);
  const [showDispatch, setShowDispatch] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center">
        <MapIcon size={48} className="mb-4 opacity-20" />
        <p className="text-sm">Select a project on the map to view the AI dossier.</p>
      </div>
    );
  }

  const activePrediction = simResult || predictionData;
  const riskScore = activePrediction?.risk_score || project?.risk_score;
  const riskLevel = activePrediction?.risk_level || project?.risk_level;

  const shapChartData = (activePrediction?.shap_values || []).map(s => ({
    name: FEATURE_LABELS[s.feature] || s.feature.replace(/_/g, ' '),
    impact: s.impact,
    isDelay: s.impact > 0,
  }));

  const dailyBleed = calcDailyBleed(project?.capital_cr || 0, project?.sec11_delay_days || 0);
  const estOverrun = calcOverrun(project?.capital_cr || 0, project?.sec11_delay_days || 0);
  const currentStage = project?.larr_stage ?? 1;

  const handleECourtsResult = (result) => {
    if (result.caseNo && simParams) {
      setSimParams({ ...simParams, has_legal_dispute: true });
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const dispatchMessage = `LA-EWS PRIORITY ALERT: ${project?.name} (ULPIN: ${project?.ulpin || 'N/A'}) has reached ${riskScore}% delay risk. Dominant Driver: ${shapChartData[0]?.name || 'Legal dispute'}. Action required within 7 days.`;

  return (
    <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto relative">

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-[60] bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
          ✅ {toastMsg}
        </div>
      )}

      {/* DOSSIER HEADER */}
      <div>
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{project?.name}</h2>
          <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskBg(riskScore)}`}>
            {riskScore}% {riskLevel}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm mt-2">
          <span className="flex items-center gap-1.5"><Layers size={13} className="text-slate-400" /> PRJ-{String(project?.id).padStart(4, '0')}</span>
          {project?.ulpin && <span className="flex items-center gap-1.5 font-mono">ULPIN: {project?.ulpin}</span>}
          <span className="flex items-center gap-1.5"><Briefcase size={13} className="text-slate-400" /> {project?.nodal_officer || 'N/A'}</span>
          <span className="flex items-center gap-1.5"><MapIcon size={13} className="text-slate-400" /> {project?.land_area_ha} Ha</span>
          <span className="flex items-center gap-1.5"><UserCircle size={13} className="text-slate-400" /> {project?.affected_families} Families</span>
        </div>
      </div>

      {/* DAILY CAPITAL BLEED */}
      {riskScore > 70 && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-xs font-bold">
            <AlertTriangle size={14} />
            Daily Bleed: ₹{dailyBleed.toFixed(2)} L/day
          </div>
          <span className="text-xs font-bold text-red-600 dark:text-red-400">
            Est. Overrun: +₹{estOverrun.toFixed(2)} Cr
          </span>
        </div>
      )}

      {/* LARR STATUTORY MILESTONES */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">LARR Act 2013 Statutory Progress</h3>
        <div className="flex justify-between items-center relative px-2">
          <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
          <div className="absolute left-6 top-1/2 h-0.5 bg-indigo-500 -translate-y-1/2 z-0" style={{ width: `${(currentStage / 3) * 100}%`, maxWidth: 'calc(100% - 3rem)' }} />
          
          {LARR_STAGES.map((stage) => (
            <div key={stage.key} className="relative z-10 flex flex-col items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold ${stage.key <= currentStage ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                {stage.key <= currentStage ? <CheckCircle size={13} /> : stage.key + 1}
              </div>
              <span className={`text-[10px] font-bold ${stage.key <= currentStage ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>{stage.label}</span>
              <span className="text-[9px] text-slate-400">{stage.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* eCOURTS SCANNER */}
      <ECourtsScanner projectId={project?.id} onDisputeFound={handleECourtsResult} />

      {/* SHAP EXPLAINABILITY */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <Activity size={16} className="text-indigo-600 dark:text-indigo-400" /> AI Delay Drivers (SHAP)
        </h3>
        <p className="text-xs text-slate-500 mb-4">Feature impact on the calculated delay risk score.</p>
        
        <div className="h-44 w-full mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shapChartData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <XAxis type="number" hide domain={['dataMin', 'dataMax']} />
              <YAxis dataKey="name" type="category" width={170} tick={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#475569', fontWeight: 500 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                contentStyle={{ backgroundColor: isDarkMode ? '#0f172a' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', borderRadius: '8px', fontSize: '12px', color: isDarkMode ? '#f1f5f9' : '#0f172a', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                formatter={(val) => [(Number(val) || 0).toFixed(2), 'Impact']}
              />
              <ReferenceLine x={0} stroke={isDarkMode ? '#334155' : '#cbd5e1'} strokeDasharray="3 3" />
              <Bar dataKey="impact" radius={4} barSize={12}>
                {shapChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.isDelay ? '#ef4444' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5"><Info size={14} className="text-indigo-500" /> Dynamic Mitigation SOP</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{activePrediction?.actionable_recommendation || 'No critical actions required at this phase.'}</p>
        </div>
      </div>

      {/* WHAT-IF ENGINE */}
      <WhatIfEngine
        simParams={simParams}
        setSimParams={setSimParams}
        onSimulate={onSimulate}
        simResult={simResult}
        isSimulating={isSimulating}
        originalRiskScore={project.risk_score}
        isDarkMode={isDarkMode}
      />

      {/* ACTION BUTTONS */}
      <div className="flex gap-3 mt-auto pt-2">
        <button
          onClick={() => setShowMemo(true)}
          className="flex-1 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <FileText size={16} /> Auto-Draft Statutory Notice
        </button>
        <button
          onClick={() => setShowDispatch(true)}
          className="flex-1 py-3 bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/30 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-700 dark:text-red-400 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <Smartphone size={16} /> Dispatch NIC Alert
        </button>
      </div>

      {/* ESCALATION MEMO MODAL */}
      {showMemo && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><AlertTriangle size={18} className="text-red-600 dark:text-red-400" /> Generated Escalation Notice</h3>
              <button onClick={() => setShowMemo(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] bg-white dark:bg-slate-900">
              <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner">
                {`MEMORANDUM

TO: District Magistrate / Collector, ${project.district || 'Relevant District'}
CC: Nodal Officer, ${project.nodal_officer || 'Division Head'}
DATE: ${new Date().toLocaleDateString('en-IN')}

SUBJECT: HIGH RISK DELAY ESCALATION — ${project.name}
REF: ULPIN ${project.ulpin || 'N/A'} | LA-EWS Automated Telemetry Alert

Sir/Madam,

This is a system-generated escalation notice regarding the aforementioned project (Total Area: ${project.land_area_ha} Ha, Affected Families: ${project.affected_families}, Estimated Capital: ₹${project.capital_cr} Cr).

The Predictive Analytics Engine has flagged this project with a CRITICAL risk score of ${riskScore}%. Daily fiscal bleed is estimated at ₹${dailyBleed.toFixed(2)} Lakhs/day with a projected cost overrun of +₹${estOverrun.toFixed(2)} Cr.

Immediate statutory intervention is required under the LARR Act 2013.

PRIMARY DELAY DRIVERS IDENTIFIED (SHAP Attribution):
`}
                {shapChartData.map((s, i) => ` ${i + 1}. ${s.name}: Impact Score ${s.impact.toFixed(2)} (${s.isDelay ? 'DELAY DRIVER' : 'MITIGATING'})\n`).join('')}
                {`
RECOMMENDED SOP ACTION:
${activePrediction?.actionable_recommendation || 'Expedite resolution of pending items.'}

Please update the PM Gati Shakti portal upon resolution within 7 working days.

--
LA-EWS AI System
Ministry of Rural Development`}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button onClick={() => setShowMemo(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button className="px-5 py-2.5 rounded-lg text-sm font-medium bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-colors shadow-sm">
                <Copy size={16} /> Copy Text
              </button>
              <button className="px-5 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white flex items-center gap-2 transition-colors shadow-sm">
                <Send size={16} /> E-Office Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NIC MOBILE DISPATCH MODAL */}
      {showDispatch && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-red-50 dark:bg-red-500/10 px-6 py-4 border-b border-red-200 dark:border-red-500/20 flex justify-between items-center">
              <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2"><Smartphone size={18} /> NIC Priority Alert Dispatch</h3>
              <button onClick={() => setShowDispatch(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900">
              <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">SMS / WhatsApp Preview</p>
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {dispatchMessage}
              </div>
              <p className="text-xs text-slate-400 mt-3">Recipient: DM Office, {project.district || 'Relevant District'}, {project.state || ''}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button onClick={() => setShowDispatch(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button
                onClick={() => { setShowDispatch(false); showToast('Priority alert transmitted via NIC SMS Gateway to DM Office.'); }}
                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 transition-colors shadow-sm"
              >
                <Send size={16} /> Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
