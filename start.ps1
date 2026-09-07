Write-Host "===================================================" -ForegroundColor Cyan
Write-Host " Land Acquisition Predictive Analytics System" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "[1/2] Launching Backend API Server (FastAPI)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ScriptDir\backend'; .\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

Write-Host "[2/2] Launching Frontend Development Server (Vite React)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ScriptDir\frontend'; npm run dev"

Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host " Both servers are starting in separate windows!" -ForegroundColor Green
Write-Host " - Frontend App:  http://localhost:5173" -ForegroundColor White
Write-Host " - Backend API:   http://localhost:8000" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Green
