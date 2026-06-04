@echo off
echo ==========================================
echo GitHub Auto Push Script for SpaceX Demo
echo ==========================================
echo.
cd /d "D:\系统测试"

:retry
echo [%date% %time%] Trying to push to GitHub...
git push origin main

if %ERRORLEVEL% == 0 (
    echo.
    echo ==========================================
    echo SUCCESS! Push completed!
    echo ==========================================
    pause
    exit /b 0
) else (
    echo.
    echo Failed. Retrying in 10 seconds...
    timeout /t 10 /nobreak >nul
    goto retry
)
