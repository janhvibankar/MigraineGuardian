# MigraineGuardian — Start ML Service Only
# Starts the FastAPI ML prediction service on port 8000 with environment & model checks.
#
# Usage (from project root):
#   powershell -ExecutionPolicy Bypass -File start-ml.ps1

$rootDir = $PSScriptRoot
$mlDir = Join-Path $rootDir "ml-service"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host " MigraineGuardian ML Service (FastAPI / XAI / SHAP)" -ForegroundColor Cyan
Write-Host " Service URL: http://127.0.0.1:8000" -ForegroundColor White
Write-Host " Health URL:  http://127.0.0.1:8000/health" -ForegroundColor White
Write-Host "=======================================================" -ForegroundColor Cyan

# Check if port 8000 is already in use
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("127.0.0.1", 8000)
    $tcp.Close()
    Write-Host "⚠ Port 8000 is already in use by another process." -ForegroundColor Yellow
    Write-Host "Testing health of existing process..." -ForegroundColor DarkYellow
    try {
        $resp = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health?check_inference=true" -TimeoutSec 5
        if ($resp.model_loaded -eq $true) {
            Write-Host "✓ ML service is already running and model is loaded." -ForegroundColor Green
            exit 0
        } else {
            Write-Host "✗ Existing process responded but model is degraded: $($resp.model_load_error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ Port 8000 occupied but not responding to health check. Please free port 8000." -ForegroundColor Red
        exit 1
    }
} catch {
    # Port is free, proceed
}

Set-Location $mlDir
Write-Host "→ Starting FastAPI server..." -ForegroundColor Cyan
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
