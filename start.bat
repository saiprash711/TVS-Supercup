@echo off
setlocal EnableDelayedExpansion

REM ====================================================================
REM TVS CERTIFIED SUPER CUP - ADMIN COMMAND CENTER LAUNCHER
REM ====================================================================
REM Automatically verifies environment, starts the server if needed,
REM and launches the browser directly into the /admin route.
REM ====================================================================

title TVS Super Cup - Admin Command Center Launcher
cd /d "%~dp0"

set "PORT=3000"
set "URL=http://localhost:%PORT%/admin"
set "ADMIN_PASS=supercup2026"
set "ENABLE_ADMIN=true"

REM Parse command-line flags
if "%~1"=="--help" goto SHOW_HELP
if "%~1"=="-h" goto SHOW_HELP
if "%~1"=="--restart" goto FORCE_RESTART
if "%~1"=="-r" goto FORCE_RESTART

REM Support custom port if 1st argument is a number
echo %~1| findstr /r "^[0-9][0-9]*$" >nul 2>&1
if not errorlevel 1 (
    set "PORT=%~1"
    set "URL=http://localhost:%PORT%/admin"
)

cls
echo ====================================================================
echo   TVS CERTIFIED SUPER CUP - ADMIN COMMAND CENTER
echo ====================================================================
echo   Target Route  : %URL%
echo   Dealer Portal : http://localhost:%PORT%/
echo   Working Dir   : %~dp0
echo ====================================================================
echo.

REM 1. Verify Node.js is installed
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in system PATH.
    echo Please install Node.js [v18+ or v20+] from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM 2. Verify npm is installed
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed or not in system PATH.
    echo Please install Node.js/npm and restart this launcher.
    echo.
    pause
    exit /b 1
)

REM 3. Check for .env file
if not exist ".env" (
    if exist ".env.example" (
        echo [SETUP] No .env found. Initializing from .env.example...
        copy /y ".env.example" ".env" >nul
        echo [SETUP] Created .env successfully.
    )
)

REM 4. Extract ADMIN_PASSWORD from .env if present
if exist ".env" (
    for /f "usebackq tokens=1* delims==" %%A in (".env") do (
        if /i "%%A"=="ADMIN_PASSWORD" (
            set "ADMIN_PASS=%%~B"
        )
    )
)

REM 5. Check dependencies
if not exist "node_modules\" (
    echo [SETUP] Dependencies not found. Installing node_modules...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed. Please check errors above.
        pause
        exit /b 1
    )
)

REM 6. Check database file (SQLite dev.db)
if not exist "prisma\dev.db" (
    echo [SETUP] Local SQLite database not found. Generating schema...
    call npx prisma db push --schema=prisma/schema.prisma
)

REM 7. Check if port is already listening
netstat -ano | findstr /C:":%PORT% " | findstr LISTENING >nul 2>&1
if not errorlevel 1 (
    goto ALREADY_RUNNING
)

goto START_SERVER

:FORCE_RESTART
cls
echo ====================================================================
echo   TVS CERTIFIED SUPER CUP - RESTARTING SERVER
echo ====================================================================
echo.
echo [INFO] Stopping any existing process on port %PORT%...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort %PORT% -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1
ping -n 3 127.0.0.1 >nul
goto START_SERVER

:ALREADY_RUNNING
echo [STATUS] TVS Super Cup dev server is ALREADY RUNNING on port %PORT%!
echo [ACTION] Opening Admin Portal in your default browser...
echo.
start "" "%URL%"

echo ====================================================================
echo   ADMIN COMMAND CENTER READY
echo ====================================================================
echo   URL            : %URL%
echo   Admin Password : %ADMIN_PASS%
echo ====================================================================
echo.
echo Options:
echo   [Enter] Exit this launcher (server remains running)
echo   [R]     Restart dev server on port %PORT%
echo.
set "USER_CHOICE="
set /p USER_CHOICE="Enter choice [Enter=Exit / R=Restart]: "
if /i "!USER_CHOICE!"=="R" (
    goto FORCE_RESTART
)
exit /b 0

:START_SERVER
echo [STATUS] Launching dev server on port %PORT% with Admin route enabled...
echo [INFO] Browser will open automatically at %URL% once ready...
echo.
echo ====================================================================
echo   ADMIN COMMAND CENTER CREDENTIALS
echo ====================================================================
echo   URL            : %URL%
echo   Admin Password : %ADMIN_PASS%
echo ====================================================================
echo.
echo Starting Next.js Dev Server (Press Ctrl+C to stop)...
echo.

REM Trigger browser opening in background after 3 seconds
start "" cmd /c "ping -n 4 127.0.0.1 >nul & start %URL%"

REM Run the dev server
call npm run dev

if errorlevel 1 (
    echo.
    echo [ERROR] Server terminated with an error.
    pause
)

exit /b 0

:SHOW_HELP
echo TVS Super Cup - Admin Portal Launcher
echo.
echo Usage:
echo   start.bat            Starts dev server (if not running) and opens /admin
echo   start.bat [port]     Starts dev server on custom port (default: 3000)
echo   start.bat --restart  Kills any existing process on port and restarts
echo   start.bat --help     Shows this help message
echo.
pause
exit /b 0
