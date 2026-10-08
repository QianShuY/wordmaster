@echo off
setlocal
cd /d "%~dp0"
title WordMaster

REM use bundled runtime if present, otherwise system Node
set "NODE=%~dp0runtime\node.exe"
if not exist "%NODE%" set "NODE=node"

REM Reuse an already running local server instead of starting a second copy.
call :server_ready
if not errorlevel 1 goto open_browser

if "%NODE%"=="node" (
  node --version >nul 2>nul
  if errorlevel 1 (
    echo [ERROR] Node.js not found. Install Node.js LTS from https://nodejs.org/zh-cn then run this file again.
    echo.
    pause
    exit /b 1
  )
)

REM install dependencies only if missing (package ships with node_modules)
if not exist node_modules (
  echo First run: installing dependencies, needs internet...
  call npm install
)
if not exist node_modules (
  echo [ERROR] Dependencies missing. Please re-extract the full package or check your network.
  echo.
  pause
  exit /b 1
)

REM Start the server in its own window, wait until it answers, then open the UI.
start "WordMaster Server" "%NODE%" "%~dp0app\main.js"
for /l %%i in (1,1,25) do (
  call :server_ready
  if not errorlevel 1 goto open_browser
  timeout /t 1 /nobreak >nul
)

echo [ERROR] WordMaster did not start on port 3456. Check the server window for details.
pause
exit /b 1

:open_browser
start "" "http://localhost:3456"
exit /b 0

:server_ready
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; try { $r=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3456/' -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } } catch { }; exit 1" >nul 2>&1
exit /b %errorlevel%
