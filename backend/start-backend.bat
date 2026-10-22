@echo off
title SustainSME backend (port 8000)
cd /d "%~dp0"
echo ============================================================
echo  SustainSME backend  ->  http://127.0.0.1:8000
echo  Leave THIS window open while you use the app.
echo  Close it (or Ctrl+C) to stop the backend.
echo ============================================================
echo.
REM Use local venv (outside SharePoint sync) to avoid OneDrive file locks.
"%LOCALAPPDATA%\sustainsme-venv\Scripts\python.exe" -m uvicorn main:app --port 8000
echo.
echo Backend stopped.
pause >nul
