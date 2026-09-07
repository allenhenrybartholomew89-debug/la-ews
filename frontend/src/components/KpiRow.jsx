import React from 'react';

const KpiRow = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-100 flex flex-col items-center">
        <span className="text-slate-500 text-sm font-medium mb-1">Total Monitored Projects</span>
        <span className="text-2xl font-bold text-slate-800">{metrics.total_projects || 0}</span>
      </div>
      <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-100 flex flex-col items-center">
        <span className="text-slate-500 text-sm font-medium mb-1">High-Risk Count</span>
        <span className="text-2xl font-bold text-rose-600">{metrics.high_risk || 0}</span>
      </div>
      <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-100 flex flex-col items-center">
        <span className="text-slate-500 text-sm font-medium mb-1">Avg Predicted Delay</span>
        <span className="text-2xl font-bold text-amber-500">{metrics.avg_delay ? `${metrics.avg_delay} Days` : 'N/A'}</span>
      </div>
      <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-100 flex flex-col items-center">
        <span className="text-slate-500 text-sm font-medium mb-1">Total Budget at Risk</span>
        <span className="text-2xl font-bold text-slate-800">{metrics.budget_at_risk || '₹0'}</span>
      </div>
    </div>
  );
};
export default KpiRow;
