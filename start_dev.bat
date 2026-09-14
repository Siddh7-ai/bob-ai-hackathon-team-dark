@echo off
echo ===================================================
echo   APEX HUMS - Predictive Maintenance System
echo ===================================================

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "APEX HUMS - FastAPI Backend" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting React Vite Frontend on http://127.0.0.1:5173 ...
cd frontend
start "APEX HUMS - React Frontend" cmd /k "npm run dev"
cd ..

echo.
echo Both servers are launching!
echo Backend Docs: http://127.0.0.1:8000/docs
echo Frontend UI:  http://127.0.0.1:5173/
echo ===================================================
