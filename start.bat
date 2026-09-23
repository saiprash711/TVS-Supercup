@echo off
title TVS Super Cup - Executive Marketing Dashboard
cd /d "%~dp0"

echo ===============================================================
echo   TVS Certified Dealer Super Cup — Marketing Command Center
echo ===============================================================
echo.
echo   [1/2] Launching browser to http://localhost:3000...
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

echo   [2/2] Starting Next.js server...
echo   Press Ctrl+C anytime to stop the server.
echo.
npm run dev

pause
