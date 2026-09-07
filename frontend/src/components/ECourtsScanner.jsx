import React, { useState, useEffect, useRef } from 'react';
import { Zap, AlertTriangle, Scale } from 'lucide-react';
import { JUDICIAL_REGISTRY } from '../utils';

export default function ECourtsScanner({ projectId, onDisputeFound }) {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    setScanResult(null);
    setScanning(false);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [projectId]);

  const handleScan = () => {
    setScanning(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const result = JUDICIAL_REGISTRY[projectId] || JUDICIAL_REGISTRY[Number(projectId)];
      const outcome = result || { caseNo: null, status: 'No Active Litigation Found' };
      setScanResult(outcome);
      setScanning(false);
      if (result && typeof onDisputeFound === 'function') {
        onDisputeFound(result);
      }
    }, 1200);
  };

  const formatCaseBadge = (res) => {
    if (!res || !res.caseNo) return '';
    const context = res.detail ? res.detail.split(/[—–-]/)[0].trim() : '';
    return `[Case #${res.caseNo} — ${res.court || ''} ${res.status}${context ? ` on ${context}` : ''}]`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
          ⚡ eCourts Judicial Verification
        </h4>
      </div>

      <button
        type="button"
        onClick={handleScan}
        disabled={scanning}
        className="w-full flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm cursor-pointer"
      >
        <Zap className="w-3.5 h-3.5 text-amber-300" />
        <span>{scanning ? 'Querying Registry...' : 'Scan District eCourts Registry'}</span>
      </button>

      {scanning && (
        <div className="mt-3 space-y-2">
          <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="w-full h-full bg-indigo-500 animate-pulse" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 animate-pulse text-center">
            Querying district & high court judicial dockets...
          </p>
        </div>
      )}

      {!scanning && scanResult && (
        scanResult.caseNo ? (
          <div className="mt-3 p-3 rounded-lg border border-amber-300 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs transition-all duration-200">
            <div className="flex items-start gap-2.5">
              <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-rose-700 dark:text-rose-300 font-mono break-words">
                  {formatCaseBadge(scanResult)}
                </div>
                {scanResult.detail && (
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-800 dark:text-amber-300/90 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{scanResult.detail}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3 p-3 rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <span className="font-bold">✓</span>
            <span>{scanResult.status}</span>
          </div>
        )
      )}
    </div>
  );
}
