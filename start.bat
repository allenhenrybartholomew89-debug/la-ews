@echo off
echo ===================================================
echo  Land Acquisition Predictive Analytics System
echo  SIH26017 — XGBoost + SHAP + Leaflet
echo ===================================================
echo.

echo [1/2] Launching Backend API Server (FastAPI)...
start "FastAPI Backend" cmd /k "cd /d %~dp0backend && ..\backend\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

echo [2/2] Launching Frontend Development Server (Vite React)...
start "Vite Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================
echo  Both services are starting in separate windows!
echo  - Frontend App:  http://localhost:5173
echo  - Backend API:   http://localhost:8000/docs
echo ===================================================
echo.
echo Press any key to close this launcher window...
pause > nul
