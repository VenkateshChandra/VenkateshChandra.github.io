@echo off
title TFS Vector Hardware Bridge
echo ===================================================================
echo   TRENDS FOR SALE (TFS) - VECTOR CAN BUS BRIDGE LAUNCHER
echo ===================================================================
echo.
echo Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found in your system PATH.
    echo Please install Python 3.9+ from python.org and check "Add Python to PATH".
    pause
    exit /b 1
)

echo Checking required Python packages (python-can, websockets)...
python -c "import websockets, can" >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing missing requirements...
    pip install python-can websockets
)

echo.
echo Starting Vector Bridge daemon...
echo Keep this window open while using the CAN Analyzer in your browser.
echo ===================================================================
echo.
python "%~dp0vector_bridge.py"
pause
