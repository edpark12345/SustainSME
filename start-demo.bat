@echo off
setlocal
title SMEScope demo launcher
cd /d "%~dp0"

echo ============================================================
echo   SMEScope - one-click demo launcher
echo   Starts BACKEND (port 8000) + FRONTEND (port 5173) in two
echo   windows, waits for the app, then opens your browser.
echo ============================================================
echo.

REM --- Pre-flight: the venv and node_modules are built LOCALLY ----------
REM     (they are intentionally NOT synced - a venv is not portable).
if not exist "backend\.venv\Scripts\python.exe" (
  echo [X] Backend Python venv not found at  backend\.venv
  echo     Create it locally ONCE, then run this again:
  echo.
  echo        cd backend
  echo        python -m venv .venv
  echo        .venv\Scripts\python -m pip install fastapi uvicorn pydantic openpyxl pdfplumber pypdf
  echo.
  pause
  exit /b 1
)

if not exist "app\node_modules" (
  echo [X] Frontend dependencies not found at  app\node_modules
  echo     Install them locally ONCE, then run this again:
  echo.
  echo        cd app
  echo        npm install
  echo.
  pause
  exit /b 1
)

REM --- Launch each server in its own window (they stay open) -----------
echo Starting backend  (port 8000) ...
start "" "backend\start-backend.bat"

echo Starting frontend (port 5173) ...
start "" "app\start-frontend.bat"

REM --- Wait until the frontend answers, then open the browser ----------
echo.
echo Waiting for the app to come up (first run can take ~20-40s)...
powershell -NoProfile -Command "$u='http://127.0.0.1:5173'; for($i=0;$i -lt 90;$i++){ try{ Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 2 ^| Out-Null; exit 0 }catch{ Start-Sleep -Seconds 1 } }; exit 1"

start "" "http://127.0.0.1:5173"

echo.
echo ============================================================
echo   App opening at  http://127.0.0.1:5173
echo   TWO server windows are now running - LEAVE THEM OPEN.
echo   Close them (or Ctrl+C in each) to stop the demo.
echo ============================================================
echo.
echo You can close THIS launcher window now.
pause >nul
