@echo off
title SMEScope frontend (port 5173)
cd /d "%~dp0"
echo ============================================================
echo  SMEScope frontend  ->  http://localhost:5173
echo  Leave THIS window open while you use the app.
echo  Close it (or Ctrl+C) to stop the dev server.
echo ============================================================
echo.
REM If "npm" is not found, install Node.js (>=18) or add it to PATH.
call npm run dev
echo.
echo Frontend stopped.
pause >nul
