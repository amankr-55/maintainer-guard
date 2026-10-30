@echo off
title MaintainerGuard Server
cd /d "%~dp0"
echo ============================================================
echo Starting MaintainerGuard Web Server on Python 3.13...
echo Dashboard: http://127.0.0.1:8000
echo ============================================================
"C:\Users\ak127\AppData\Local\Programs\Python\Python313\python.exe" run.py
if %errorlevel% neq 0 (
    echo.
    echo Server stopped with error code %errorlevel%.
    pause
)
