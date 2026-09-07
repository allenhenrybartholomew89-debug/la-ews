import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const FEATURE_LABELS = {
  "compensation_disbursed_pct": "Compensation Disbursed (%)",
  "compensation disbursed pct": "Compensation Disbursed (%)",
  "forest_clearance_pending": "Forest Clearance Pending",
  "forest clearance pending": "Forest Clearance Pending",
  "has_legal_dispute": "Active Legal Dispute",
  "has legal dispute": "Active Legal Dispute",
  "land_area_ha": "Land Area (Hectares)",
  "land area ha": "Land Area (Hectares)",
  "affected_families": "Affected Families",
  "affected families": "Affected Families",
  "sec11_delay_days": "Sec 11 Delay (Days)",
  "sec11 delay days": "Sec 11 Delay (Days)",
  "historical_district_risk": "Historical Risk Factor",
  "historical district risk": "Historical Risk Factor",
  "project_type": "Project Type",
  "project type": "Project Type",
};

const ShapChart = ({ shapValues, recommendation }) => {
  if (!shapValues || shapValues.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        Select a prediction to view feature impact
      </div>
    );
  }

  const data = shapValues.map(s => {
    const rawName = s.feature;
    const cleanName = FEATURE_LABELS[rawName] || FEATURE_LABELS[rawName.replace(/_/g, ' ')] || rawName.replace(/_/g, ' ');
    return {
      name: cleanName,
      impact: s.impact,
      isPositive: s.impact > 0
    };
  });

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-2">Delay Drivers (SHAP)</h3>
      <div className="flex-1 w-full min-h-50">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(val) => [(val).toFixed(3), 'Impact']}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.isPositive ? '#ef4444' : '#22c55e'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {recommendation && (
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-md">
          <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Actionable Mitigation SOP</span>
          <p className="text-sm font-medium text-slate-700">{recommendation}</p>
        </div>
      )}
    </div>
  );
};

export default ShapChart;
