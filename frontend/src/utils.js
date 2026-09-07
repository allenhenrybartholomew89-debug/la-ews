import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const FEATURE_LABELS = {
  compensation_disbursed_pct: 'Compensation Disbursement Rate',
  forest_clearance_pending: 'Forest Clearance Pendency',
  has_legal_dispute: 'Active Legal Dispute',
  land_area_ha: 'Land Area (Hectares)',
  affected_families: 'Affected Families',
  sec11_delay_days: 'Sec 11 Lapse Horizon',
  historical_district_risk: 'Historical District Risk Index',
  project_type: 'Project Category',
};

export const getRiskColor = (score) => {
  if (score > 70) return '#ef4444';
  if (score > 35) return '#f59e0b';
  return '#10b981';
};

export const getRiskBg = (score) => {
  if (score > 70) return 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400';
  if (score > 35) return 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20 text-yellow-600 dark:text-yellow-400';
  return 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400';
};

export const getRiskLabel = (score) => {
  if (score > 70) return 'High';
  if (score > 35) return 'Medium';
  return 'Low';
};

/** Daily Bleed in ₹ Lakhs */
export const calcDailyBleed = (capitalCr, delayDays) => {
  const bleed = (capitalCr * 0.02) * (Math.max(delayDays, 1) / 15);
  return Math.max(0.1, bleed);
};

/** Estimated annual fiscal bleed across all high-risk projects in ₹ Cr */
export const calcAnnualBleed = (projectList) => {
  return projectList
    .filter((p) => p.risk_score > 70)
    .reduce((acc, p) => acc + (calcDailyBleed(p.capital_cr || 0, p.sec11_delay_days || 0) * 365) / 100, 0);
};

/** Estimated cost overrun for a single project in ₹ Cr */
export const calcOverrun = (capitalCr, delayDays) => {
  const overrun = (calcDailyBleed(capitalCr, Math.max(delayDays, 1)) * Math.max(delayDays, 1)) / 10;
  return Math.max(0.01, overrun);
};

export const ROLES = {
  central: {
    label: 'Central Ministry (National)',
    subtitle: 'Pan-India Overview',
    mapCenter: [22.5, 79.0],
    mapZoom: 5,
    kpiLabels: {
      total: 'National Projects Monitored',
      hotspots: 'Critical Hotspots',
      delay: 'Avg Delay Horizon',
      fiscal: 'Annual Fiscal Bleed',
    },
  },
  collector: {
    label: 'District Collector / DM',
    subtitle: 'District: Wardha, Maharashtra',
    mapCenter: [20.74, 78.60],
    mapZoom: 10,
    kpiLabels: {
      total: 'District Projects',
      hotspots: 'Pending Sec 11 Hearings',
      delay: 'Village Dispute Count',
      fiscal: 'District Fiscal Exposure',
    },
  },
  nodal: {
    label: 'Nodal Agency / Field Surveyor',
    subtitle: 'Ground Execution',
    mapCenter: [22.5, 79.0],
    mapZoom: 5,
    kpiLabels: {
      total: 'Survey Assignments',
      hotspots: 'JMS Surveys Pending',
      delay: 'Forest Demarcation Delay',
      fiscal: 'Estimated Rework Cost',
    },
  },
};

export const BASELINE_PROJECTS = [
  {
    id: 1, ulpin: '27150100204123', project_type: 'Highway', category: 'Infrastructure',
    name: 'Delhi-Mumbai Expressway Pkg 3', nodal_officer: 'S. K. Sharma (NHAI)',
    state: 'Uttar Pradesh', district: 'Agra',
    latitude: 27.18, longitude: 78.02,
    land_area_ha: 120, affected_families: 450, capital_cr: 850,
    compensation_disbursed_pct: 0.2, sec11_delay_days: 90,
    has_legal_dispute: true, forest_clearance_pending: true,
    historical_district_risk: 0.8, risk_score: 88, risk_level: 'High',
    larr_stage: 2,
  },
  {
    id: 2, ulpin: '27150100308456', project_type: 'Railway', category: 'Transit',
    name: 'Mumbai Metro Line 3', nodal_officer: 'A. Desai (MMRC)',
    state: 'Maharashtra', district: 'Mumbai',
    latitude: 19.076, longitude: 72.877,
    land_area_ha: 45, affected_families: 1200, capital_cr: 330,
    compensation_disbursed_pct: 0.8, sec11_delay_days: 10,
    has_legal_dispute: false, forest_clearance_pending: false,
    historical_district_risk: 0.3, risk_score: 22, risk_level: 'Low',
    larr_stage: 3,
  },
  {
    id: 3, ulpin: '27150100412789', project_type: 'Airport', category: 'Aviation',
    name: 'Navi Mumbai International Airport', nodal_officer: 'P. Nair (CIDCO)',
    state: 'Maharashtra', district: 'Raigad',
    latitude: 18.99, longitude: 73.07,
    land_area_ha: 1160, affected_families: 3000, capital_cr: 1650,
    compensation_disbursed_pct: 0.5, sec11_delay_days: 45,
    has_legal_dispute: true, forest_clearance_pending: false,
    historical_district_risk: 0.6, risk_score: 75, risk_level: 'High',
    larr_stage: 1,
  },
  {
    id: 4, ulpin: '29150200156234', project_type: 'Highway', category: 'Infrastructure',
    name: 'Bangalore-Chennai Expressway Pkg 7', nodal_officer: 'R. Rao (NHAI)',
    state: 'Karnataka', district: 'Kolar',
    latitude: 13.13, longitude: 78.13,
    land_area_ha: 95, affected_families: 320, capital_cr: 420,
    compensation_disbursed_pct: 0.35, sec11_delay_days: 65,
    has_legal_dispute: true, forest_clearance_pending: true,
    historical_district_risk: 0.7, risk_score: 82, risk_level: 'High',
    larr_stage: 1,
  },
  {
    id: 5, ulpin: '21150300289012', project_type: 'Railway', category: 'Transit',
    name: 'Western Dedicated Freight Corridor', nodal_officer: 'V. Kumar (DFCCIL)',
    state: 'Rajasthan', district: 'Ajmer',
    latitude: 26.45, longitude: 74.64,
    land_area_ha: 210, affected_families: 680, capital_cr: 1200,
    compensation_disbursed_pct: 0.6, sec11_delay_days: 30,
    has_legal_dispute: false, forest_clearance_pending: true,
    historical_district_risk: 0.4, risk_score: 45, risk_level: 'Medium',
    larr_stage: 2,
  },
  {
    id: 6, ulpin: '21150400367890', project_type: 'Highway', category: 'Infrastructure',
    name: 'NH-44 Expansion (Nagpur Bypass)', nodal_officer: 'M. Patil (NHAI)',
    state: 'Maharashtra', district: 'Wardha',
    latitude: 20.74, longitude: 78.60,
    land_area_ha: 78, affected_families: 190, capital_cr: 310,
    compensation_disbursed_pct: 0.15, sec11_delay_days: 110,
    has_legal_dispute: true, forest_clearance_pending: true,
    historical_district_risk: 0.9, risk_score: 91, risk_level: 'High',
    larr_stage: 0,
  },
  {
    id: 7, ulpin: '21150500445678', project_type: 'Industrial', category: 'Infrastructure',
    name: 'Odisha JIMCO Steel Corridor', nodal_officer: 'B. Swain (IDCO)',
    state: 'Odisha', district: 'Jajpur',
    latitude: 20.85, longitude: 86.33,
    land_area_ha: 350, affected_families: 1500, capital_cr: 2200,
    compensation_disbursed_pct: 0.4, sec11_delay_days: 75,
    has_legal_dispute: true, forest_clearance_pending: false,
    historical_district_risk: 0.75, risk_score: 79, risk_level: 'High',
    larr_stage: 1,
  },
  {
    id: 8, ulpin: '09150600523456', project_type: 'Railway', category: 'Transit',
    name: 'Kanpur Metro Phase I', nodal_officer: 'A. Verma (UPMRC)',
    state: 'Uttar Pradesh', district: 'Kanpur',
    latitude: 26.45, longitude: 80.35,
    land_area_ha: 32, affected_families: 850, capital_cr: 180,
    compensation_disbursed_pct: 0.9, sec11_delay_days: 5,
    has_legal_dispute: false, forest_clearance_pending: false,
    historical_district_risk: 0.2, risk_score: 12, risk_level: 'Low',
    larr_stage: 3,
  },
];

export const GRIEVANCE_CLUSTERS = [
  { lat: 27.18, lng: 78.02, radius: 25000, intensity: 0.8 },
  { lat: 20.74, lng: 78.60, radius: 15000, intensity: 0.9 },
  { lat: 18.99, lng: 73.07, radius: 20000, intensity: 0.6 },
  { lat: 20.85, lng: 86.33, radius: 18000, intensity: 0.7 },
];

export const ENCROACHMENT_ZONES = [
  {
    projectId: 1,
    label: 'Encroachment Post-Sec 11 (Khasra 42)',
    polygon: [[27.20, 77.98], [27.22, 78.05], [27.17, 78.06], [27.15, 77.99]],
  },
  {
    projectId: 6,
    label: 'Encroachment Post-Sec 11 (Survey 118)',
    polygon: [[20.76, 78.56], [20.78, 78.63], [20.72, 78.64], [20.71, 78.57]],
  },
];

export const JUDICIAL_REGISTRY = {
  1: { caseNo: 'WP/2026/4102', court: 'High Court', status: 'Interim Injunction', detail: 'Village Khasra 42 — Stay on Sec 19 proceedings' },
  3: { caseNo: 'CS/2025/8891', court: 'District Court Raigad', status: 'Hearing Scheduled', detail: 'Landowner compensation dispute — next date 15/10/2026' },
  4: { caseNo: 'WP/2026/1187', court: 'High Court Karnataka', status: 'Notice Issued', detail: 'Forest Tribal Rights claim under FRA 2006' },
  6: { caseNo: 'WP/2026/6734', court: 'Bombay High Court (Nagpur Bench)', status: 'Interim Injunction', detail: 'Unauthorized encroachment dispute — Sec 11 challenged' },
  7: { caseNo: 'OJC/2026/2201', court: 'Orissa High Court', status: 'Pending Hearing', detail: 'Tribal R&R violation claim under LARR Sec 41' },
};

export const GATI_SHAKTI_DEPENDENCIES = [
  { fromId: 1, toId: 8, label: 'Highway delay threatens Kanpur Metro materials transit.' },
  { fromId: 6, toId: 2, label: 'NH-44 encroachment risks Metro Line 3 heavy machinery route.' },
  { fromId: 4, toId: 3, label: 'Expressway delay impacts Navi Mumbai Airport cargo logistics.' },
];

export const fetchProjects = async () => {
  try {
    const response = await axios.get(`${API_BASE}/projects`);
    if (!response.data || response.data.length === 0) throw new Error('Empty dataset');
    return response.data;
  } catch {
    return BASELINE_PROJECTS;
  }
};

export const fetchPrediction = async (project) => {
  try {
    const response = await axios.post(`${API_BASE}/predict`, project);
    return response.data;
  } catch {
    return {
      risk_score: project.risk_score,
      risk_level: project.risk_level,
      shap_values: [
        { feature: 'has_legal_dispute', impact: 2.4 },
        { feature: 'compensation_disbursed_pct', impact: 1.8 },
        { feature: 'sec11_delay_days', impact: 1.2 },
        { feature: 'forest_clearance_pending', impact: -0.5 },
        { feature: 'historical_district_risk', impact: 0.9 },
      ],
      actionable_recommendation: project.risk_score > 70
        ? 'IMMEDIATE: Escalate legal dispute to District Magistrate. Expedite compensation disbursement above 60%. File forest clearance review under Sec 19 LARR timeline.'
        : 'Continue statutory monitoring. No critical LARR interventions required at current phase.',
    };
  }
};

export const MOCK_ECOURTS_RESULTS = JUDICIAL_REGISTRY;
export const MOCK_PROJECTS = BASELINE_PROJECTS;
export const DEPENDENCIES = GATI_SHAKTI_DEPENDENCIES;
