// frontend/src/components/Simulator.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../utils';

const Simulator = ({ project, onSimulate }) => {
  const [params, setParams] = useState(null);

  useEffect(() => {
    if (project) {
      setParams({
        ...project
      });
    } else {
      setParams(null);
    }
  }, [project]);

  if (!params) {
    return (
      <div className="text-slate-400 text-center py-10 border border-dashed rounded-lg">
        Select a project on the map to enable simulation.
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;
    if (type === 'range') val = parseFloat(value);
    
    setParams(prev => ({
      ...prev,
      [name]: val
    }));
  };

  const handleSimulate = async () => {
    try {
      const res = await axios.post(`${API_BASE}/predict`, params);
      onSimulate(res.data);
    } catch {
      /* prediction service unavailable — handled by frontend fallback */
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Compensation Disbursed ({((params?.compensation_disbursed_pct || 0) * 100).toFixed(0)}%)</label>
        <input 
          type="range" 
          name="compensation_disbursed_pct" 
          min="0" max="1" step="0.05"
          value={params?.compensation_disbursed_pct || 0} 
          onChange={handleChange}
          className="w-full accent-indigo-600"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Active Legal Dispute</label>
        <input 
          type="checkbox" 
          name="has_legal_dispute"
          checked={params?.has_legal_dispute || false} 
          onChange={handleChange}
          className="w-4 h-4 text-indigo-600"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Forest Clearance Pending</label>
        <input 
          type="checkbox" 
          name="forest_clearance_pending"
          checked={params?.forest_clearance_pending || false} 
          onChange={handleChange}
          className="w-4 h-4 text-indigo-600"
        />
      </div>

      <button 
        onClick={handleSimulate}
        className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-md transition-colors"
      >
        Run Mitigation Simulation
      </button>
    </div>
  );
};

export default Simulator;