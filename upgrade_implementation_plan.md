# LA-EWS Multi-Role Decision Support Platform — Architectural Overhaul

## Goal
Refactor the monolithic `App.jsx` (~600 lines) into a modular, high-density, multi-role GovTech decision support platform with fiscal bleed calculations, eCourts integration, NIC mobile dispatch, dual GIS overlays, and RBAC-aware adaptive views.

---

## Proposed Changes

### Shared Utilities

#### [NEW] [utils.js](file:///d:/Marvix/Hackathon/sih26017-app/frontend/src/utils.js)
Extract all shared constants and helper functions:
- `FEATURE_LABELS` dictionary
- `getRiskColor()`, `getRiskBg()` utilities  
- `MOCK_PROJECTS` (expanded to 8+ projects with `ulpin`, `state`, `district`, `capital_cr`, `daily_bleed` fields)
- `API_BASE` constant
- Fiscal calculation helpers:
  - `calcDailyBleed(capitalCr, delayDays)` → `(capitalCr * 0.00045) * (delayDays / 30)` in ₹ Lakhs
  - `calcAnnualBleed(projects)` → aggregated ₹ Cr/year

---

### Component Architecture

#### [MODIFY] [App.jsx](file:///d:/Marvix/Hackathon/sih26017-app/frontend/src/App.jsx)
Reduce to ~120 lines — becomes a thin orchestrator:
- Top-level state: `isDarkMode`, `activeView`, `activeRole`, `selectedProject`, `projects`, `filters`, `searchQuery`
- Renders: Tricolor bar → `<HeaderNav>` → conditional `<DashboardView>` or `<AdminIngest>`
- Passes shared state as props to child components

---

#### [NEW] [HeaderNav.jsx](file:///d:/Marvix/Hackathon/sih26017-app/frontend/src/components/HeaderNav.jsx)
Top header with:
- **Left:** Emblem + title + subtitle ("MINISTRY OF RURAL DEVELOPMENT • PM GATI SHAKTI")
- **Center:** Universal `⌘K` search bar filtering by project name or 14-digit ULPIN
- **Right:** Live clock, Dark/Light toggle (Sun/Moon), View toggle (Dashboard/Admin), Role Switcher dropdown:
  - "Central Ministry (National)" — shows macro pan-India metrics
  - "District Collector / DM" — jurisdiction-locked, auto-centers map on district
  - "Nodal Agency / Field Surveyor" — ground execution focus

---

#### [NEW] [SpatialMap.jsx](file:///d:/Marvix/Hackathon/sih26017-app/frontend/src/components/SpatialMap.jsx)
60% left-pane Leaflet map with:
- Risk-coded `CircleMarker` nodes (Red/Amber/Green)
- **Layer controls** (top-right corner):
  - Base Layer: OpenStreetMap tiles
  - Layer 1: CPGRAMS Grievance Heatmap — semi-transparent radial `Circle` overlays at mock grievance cluster coordinates
  - Layer 2: Satellite Encroachment Detection — cadastral boundary `Polygon`s with `🚨 Encroachment Detected` alert chips
- Role-aware behavior:
  - "Central Ministry" → zoom 5, all India
  - "District Collector" → auto-center + bounds on district coordinates
- Clicking a marker calls `onSelect(project)` to populate the dossier

---

#### [NEW] [ProjectDossier.jsx](file:///d:/Marvix/Hackathon/sih26017-app/frontend/src/components/ProjectDossier.jsx)
40% right pane. Pre-loaded with "Delhi-Mumbai Expressway Pkg 3" (ULPIN `27150100204123`).
Contains:
- **Dossier Header:** Project name, ULPIN, nodal officer, area, families, risk badge
- **Daily Capital Bleed:** `⚠️ Daily Bleed: ₹X.XX L/day | Est. Overrun: +₹X.XX Cr`
- **Statutory Milestones:** LARR Act 2013 stepper (Sec 11 → Sec 19 → Sec 21 → Award Sec 30)
- **`<ECourtsScanner>`** sub-component (see below)
- **SHAP chart** (horizontal Recharts BarChart, human-readable labels, Red/Green cells)
- **Mitigation SOP** text block
- **`<WhatIfEngine>`** sub-component (see below)
- **Action buttons:** "Draft Escalation Memo" + "📲 Dispatch NIC Priority Alert" (visible when risk > 70%)

---

#### [NEW] [WhatIfEngine.jsx](file:///d:/Marvix/Hackathon/sih26017-app/frontend/src/components/WhatIfEngine.jsx)
Interactive simulator with:
- Compensation Disbursed % slider
- Legal Dispute / Forest Clearance toggles
- "Run AI Simulation" button
- **Fiscal differential badges** computed from the sim result vs. original:
  - Risk decreased → Green: `📉 Projected Taxpayer Savings: ₹X.XX Cr`
  - Risk increased → Red: `📈 Additional Projected Holding Cost: ₹X.XX Cr`
- Simulated Risk badge: `Simulated Risk: 14% - LOW`

---

#### [NEW] [ECourtsScanner.jsx](file:///d:/Marvix/Hackathon/sih26017-app/frontend/src/components/ECourtsScanner.jsx)
Embedded in the dossier:
- `⚡ Scan District eCourts Registry` button
- On click: 600ms animated scanning state (progress bar + text pulse)
- On complete: auto-checks the "Legal Dispute" toggle, updates SHAP bars, shows evidence badge:
  `[Case #WP/2026/4102 - High Court Interim Injunction on Village Khasra 42]`

---

#### [MODIFY] [AdminIngest.jsx](file:///d:/Marvix/Hackathon/sih26017-app/frontend/src/AdminIngest.jsx)
Minor updates only — the existing component is already well-structured:
- Accept `onIngest` callback prop to add new projects to the shared state
- Add "Verify Bhu-Aadhaar" auto-populate of village/state/area in the mock response

---

### KPI Row Updates (inside App.jsx or a KpiRow sub-component)

Replace the 4th KPI card "Budget at Risk" with:
- **Aggregate Fiscal Bleed:** `₹142.8 Cr/year` — computed using the daily bleed formula across all high-risk projects

---

### Modal Additions

#### NIC Mobile Dispatch Modal (inside ProjectDossier)
- Visible only when `risk_score > 70`
- Pre-filled SMS message: `"LA-EWS PRIORITY ALERT: [Project Name] (ULPIN: XXXX) has reached XX% delay risk. Dominant Driver: [top SHAP feature]. Action required within 7 days."`
- "Confirm Dispatch" → toast: `✅ Priority alert transmitted via NIC SMS Gateway to DM Office.`

---

## Open Questions

> [!IMPORTANT]
> **Mock Data Scope:** The expanded `MOCK_PROJECTS` array will contain 8 projects across multiple Indian states (Maharashtra, UP, Odisha, Rajasthan, Karnataka). Should I add more to reach 25 for the prototype, or keep 8 realistic ones and let the KPI cards display the hardcoded "25" as before?

> [!IMPORTANT]
> **React Router vs. State-based Navigation:** Currently the Dashboard/Admin toggle is state-driven (`activeView`). Should I introduce `react-router-dom` for proper URL routing (`/dashboard`, `/admin`), or keep the lightweight state toggle for this prototype?

---

## Verification Plan

### Manual Verification
1. `npm run dev` — confirm no white screen, no console errors
2. Verify light mode is default, dark mode toggles correctly
3. Switch roles — confirm map re-centers and KPI labels adapt
4. Click map markers — confirm dossier populates with project data
5. Click "Scan eCourts" — confirm 600ms animation → dispute toggle auto-checks
6. Run What-If simulation — confirm fiscal differential badges appear
7. Click "Draft Escalation Memo" — confirm modal with formal notice
8. Click "Dispatch NIC Priority Alert" — confirm SMS preview + toast
9. Switch to Admin Ingest — confirm 3 tabs work (Single Parcel, Bulk CSV, Audit)
10. All filter dropdowns work
