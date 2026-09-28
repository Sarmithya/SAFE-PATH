# SafeRoute PowerShell Launcher
Write-Host "===========================================================================" -ForegroundColor Cyan
Write-Host "        SAFEROUTE - 'Navigate Safer, Not Just Faster.'" -ForegroundColor Cyan
Write-Host "===========================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Running automated unit and integration tests..." -ForegroundColor Yellow
python -m unittest discover -s tests
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Tests failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "`n[2/2] Starting SafeRoute Server and Web App (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python backend/app.py"

Start-Sleep -Seconds 2
Start-Process "http://127.0.0.1:5000"

Write-Host "`n===========================================================================" -ForegroundColor Green
Write-Host "SafeRoute MVP is now running!" -ForegroundColor Green
Write-Host " - Interactive Web App: http://127.0.0.1:5000" -ForegroundColor White
Write-Host " - REST API Endpoints:  http://127.0.0.1:5000/api" -ForegroundColor White
Write-Host "===========================================================================" -ForegroundColor Green
