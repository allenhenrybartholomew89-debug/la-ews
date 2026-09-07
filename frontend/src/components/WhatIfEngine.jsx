import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { getRiskBg, calcDailyBleed, calcOverrun } from '../utils';

export default function WhatIfEngine({
  simParams,
  setSimParams,
  onSimulate,
  simResult = null,
  isSimulating = false,
  originalRiskScore,
}) {
  if (!simParams) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-all duration-200">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">What-If Simulator</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">
          Select a project on the geospatial map to enable LARR risk scenario simulation.
        </p>
      </div>
    );
  }

  const capitalCr = simParams.capital_cr ?? 0;
  const delayDays = simParams.sec11_delay_days ?? 0;
  const baselineRisk =
    originalRiskScore !== undefined && originalRiskScore !== null
      ? originalRiskScore
      : (simParams.risk_score ?? 0);

  const currentRiskScore =
    simResult?.risk_score !== undefined && simResult?.risk_score !== null
      ? Math.round(simResult.risk_score)
      : Math.round(baselineRisk);

  const currentRiskLevel =
    simResult?.risk_level ||
    (currentRiskScore > 70 ? 'High' : currentRiskScore > 35 ? 'Medium' : 'Low');

  const hasSimResult = simResult !== null && simResult !== undefined && simResult.risk_score !== undefined;

  const { origOverrun, simOverrun, overrunDiff, isSavings } = useMemo(() => {
    const orig = calcOverrun(capitalCr, delayDays * (baselineRisk / 100));
    const sim = hasSimResult ? calcOverrun(capitalCr, delayDays * (simResult.risk_score / 100)) : 0;
    return {
      origOverrun: orig,
      simOverrun: sim,
      overrunDiff: Math.abs(sim - orig),
      isSavings: sim < orig,
    };
  }, [capitalCr, delayDays, baselineRisk, hasSimResult, simResult]);

  const handleCompensationChange = (e) => {
    const value = parseFloat(e.target.value);
    setSimParams((prev) => ({ ...(prev || simParams), compensation_disbursed_pct: value }));
  };

  const handleLegalToggle = (e) => {
    setSimParams((prev) => ({ ...(prev || simParams), has_legal_dispute: e.target.checked }));
  };

  const handleForestToggle = (e) => {
    setSimParams((prev) => ({ ...(prev || simParams), forest_clearance_pending: e.target.checked }));
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-all duration-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp size={16} className="text-indigo-600 dark:text-indigo-400" />
          <span>What-If Simulator</span>
        </h3>
        {isSimulating ? (
          <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase animate-pulse flex items-center gap-1">
            <Activity size={12} /> Recalculating...
          </div>
        ) : (
          <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide border transition-all duration-200 ${getRiskBg(currentRiskScore)}`}>
            Simulated Risk: {currentRiskScore}% — {currentRiskLevel}
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div>
          <div className="flex justify-between text-xs mb-2">
            <label className="font-medium text-slate-700 dark:text-slate-300">
              Compensation Disbursed
            </label>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-500/20 text-xs">
              {((simParams.compensation_disbursed_pct ?? 0) * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={simParams.compensation_disbursed_pct ?? 0}
            onChange={handleCompensationChange}
            className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 transition-all duration-200"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 select-none">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={!!simParams.has_legal_dispute}
                onChange={handleLegalToggle}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all" />
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Active Legal Dispute</span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 select-none">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={!!simParams.forest_clearance_pending}
                onChange={handleForestToggle}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all" />
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Forest Clearance Pending</span>
          </label>
        </div>

        <button
          type="button"
          onClick={onSimulate}
          disabled={isSimulating}
          className="w-full py-2.5 mt-2 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-sm font-bold rounded-lg shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          <Activity size={16} className={isSimulating ? 'animate-spin' : ''} />
          <span>{isSimulating ? 'Running LARR Risk Model...' : 'Run AI Simulation'}</span>
        </button>

        {hasSimResult && (
          <div className="pt-1">
            {isSavings ? (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-sm transition-all duration-200">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <TrendingDown size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>📉 Projected Taxpayer Savings: ₹{overrunDiff.toFixed(2)} Cr</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1.5 pt-1.5 border-t border-emerald-200/60 dark:border-emerald-500/20">
                  <span>Baseline Overrun: ₹{origOverrun.toFixed(2)} Cr</span>
                  <span>Simulated Overrun: ₹{simOverrun.toFixed(2)} Cr</span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 shadow-sm transition-all duration-200">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <TrendingUp size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>📈 Additional Projected Holding Cost: ₹{overrunDiff.toFixed(2)} Cr</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-1.5 pt-1.5 border-t border-rose-200/60 dark:border-rose-500/20">
                  <span>Baseline Overrun: ₹{origOverrun.toFixed(2)} Cr</span>
                  <span>Simulated Overrun: ₹{simOverrun.toFixed(2)} Cr</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
