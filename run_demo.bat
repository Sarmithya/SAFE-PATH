@echo off
title SafeRoute - Safety Navigation Platform
echo ===========================================================================
echo         SAFEROUTE - "Navigate Safer, Not Just Faster."
echo ===========================================================================
echo.
echo [1/2] Running automated unit and integration tests...
python -m unittest discover -s tests
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Tests failed! Please check python environment.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Starting SafeRoute Backend Server and Interactive Web App (Port 5000)...
start "SafeRoute Server" cmd /k "python backend/app.py"

echo.
echo ===========================================================================
echo SafeRoute MVP is now running!
echo  - Web Application: http://127.0.0.1:5000
echo  - REST API Base:   http://127.0.0.1:5000/api
echo ===========================================================================
echo.
start http://127.0.0.1:5000
pause
