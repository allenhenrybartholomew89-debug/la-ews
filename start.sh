#!/bin/bash
echo "==================================================="
echo " Land Acquisition Predictive Analytics System"
echo "==================================================="
echo ""

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[1/2] Starting Backend (FastAPI)..."
cd "$ROOT_DIR/backend"
./venv/Scripts/python -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

echo "[2/2] Starting Frontend (Vite)..."
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "==================================================="
echo " Both servers are running!"
echo " - Frontend App: http://localhost:5173"
echo " - Backend API:  http://localhost:8000"
echo " Press Ctrl+C to stop both."
echo "==================================================="

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
