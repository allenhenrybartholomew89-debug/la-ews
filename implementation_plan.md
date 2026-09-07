# Full-Stack MVP Predictive Analytics System for Land Acquisition Delays

## User Review Required
Please review the proposed tech stack implementation details and the breakdown of features below.

## Proposed Changes

### Backend (FastAPI + ML)
The backend will reside in a new `/backend` directory.
- `backend/main.py`: FastAPI server setup with CORS, middleware, and routers (`/api/v1/projects`, `/api/v1/predict`, etc.).
- `backend/models.py`: SQLAlchemy and Pydantic models for request/response schemas.
- `backend/database.py`: SQLAlchemy SQLite local setup (can be migrated to PostGIS in the future).
- `backend/ml/train.py`: XGBoost training script with Scikit-learn preprocessing. 
- `backend/ml/predict.py`: Inference service, generating predictions and SHAP values.
- `backend/scripts/generate_data.py`: Script using Faker/Python to generate 1,000 project records with specific required correlations.
- `backend/requirements.txt`: Core Python dependencies (fastapi, uvicorn, xgboost, shap, sqlalchemy, etc).

### Frontend (React + Vite)
The frontend will reside in a new `/frontend` directory.
- `frontend/src/App.jsx`: Main dashboard layout with standard split layout.
- `frontend/src/components/KpiRow.jsx`: High-level summary metrics.
- `frontend/src/components/Map.jsx`: Leaflet map integration displaying multi-colored geospatial points for risk assessment.
- `frontend/src/components/ShapChart.jsx`: Recharts-based waterfall component for transparency.
- `frontend/src/components/Simulator.jsx`: Real-time interactive UI for 'What-if' scenarios manipulating predictions contextually.
- Tailwind configs for sleek modern layouts and responsive structures.

## Verification Plan
### Automated Tests
- Verification of data insertion correctness from `generate_data.py`.
- Validation of API endpoints (`/api/v1/predict` returning properly constructed responses with SHAP dicts).

### Manual Verification
- Execute API and UI tests by running them on available local ports.
- Experiment with the simulator component sliders and check the live gauge update dynamically fetching risk factors.
