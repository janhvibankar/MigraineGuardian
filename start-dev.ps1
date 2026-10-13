# MigraineGuardian — Unified Full-Stack Local Development Startup Script
# Starts and verifies:
#   1. FastAPI ML Microservice (port 8000)
#   2. Express API Gateway (port 5001)
#   3. React / Vite Frontend (port 3000)
#
# Usage (from project root):
#   powershell -ExecutionPolicy Bypass -File start-dev.ps1

$ErrorActionPreference = "Continue"
$rootDir = $PSScriptRoot

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  MigraineGuardian — Full-Stack Local Environment" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

# ── Helper: check if a TCP port is currently open ──────────────────────────
function Test-Port {
    param([int]$Port)
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", $Port)
        $tcp.Close()
        return $true
    } catch {
        return $false
    }
}

# ── Helper: wait for ML service health & verified inference ────────────────
function Wait-ForMLService {
    param(
        [int]$MaxWaitSeconds = 45,
        [string]$HealthUrl = "http://127.0.0.1:8000/health?check_inference=true"
    )
    Write-Host "  → Waiting for ML service readiness (up to ${MaxWaitSeconds}s)..." -ForegroundColor DarkYellow
    $elapsed = 0
    $interval = 2
    while ($elapsed -lt $MaxWaitSeconds) {
        Start-Sleep -Seconds $interval
        $elapsed += $interval
        try {
            $resp = Invoke-RestMethod -Uri $HealthUrl -TimeoutSec 5 -ErrorAction Stop
            if ($resp.model_loaded -eq $true) {
                Write-Host "  ✓ ML service ready — model loaded & inference verified (${elapsed}s)" -ForegroundColor Green
                return $true
            } elseif ($resp.status -eq "degraded") {
                Write-Host "  ✗ ML service responding but model DEGRADED: $($resp.model_load_error)" -ForegroundColor Red
                return $false
            }
        } catch {
            Write-Host "  ⋯ Waiting for ML service... (${elapsed}s)" -ForegroundColor DarkGray
        }
    }
    Write-Host "  ✗ ML service did not become ready within ${MaxWaitSeconds}s" -ForegroundColor Red
    return $false
}

# ── 1. FastAPI ML Service (port 8000) ──────────────────────────────────────
Write-Host ""
Write-Host "[1/3] FastAPI ML Service (http://127.0.0.1:8000)..." -ForegroundColor Yellow

if (Test-Port 8000) {
    Write-Host "  ✓ Port 8000 already in use — checking service health..." -ForegroundColor Green
    try {
        $h = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health?check_inference=true" -TimeoutSec 5
        if ($h.model_loaded) {
            Write-Host "  ✓ ML model loaded & pipeline ready." -ForegroundColor Green
        } else {
            Write-Host "  ⚠ ML service is running but model is NOT loaded: $($h.model_load_error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ⚠ Port 8000 open but health check failed. Verify process." -ForegroundColor Yellow
    }
} else {
    $mlDir = Join-Path $rootDir "ml-service"
    Write-Host "  → Launching FastAPI server..." -ForegroundColor White
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$mlDir'; Write-Host '[ML Service] Starting FastAPI on port 8000...' -ForegroundColor Cyan; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
    ) -WindowStyle Normal
    Write-Host "  ✓ FastAPI process launched in separate terminal." -ForegroundColor Green

    $mlReady = Wait-ForMLService -MaxWaitSeconds 45
    if (-not $mlReady) {
        Write-Host "  WARNING: ML service is taking longer than expected. Continuing startup." -ForegroundColor DarkYellow
    }
}

# ── 2. Express Backend (port 5001) ─────────────────────────────────────────
Write-Host ""
Write-Host "[2/3] Express Backend API Gateway (http://localhost:5001)..." -ForegroundColor Yellow

if (Test-Port 5001) {
    Write-Host "  ✓ Port 5001 already in use — backend gateway is running." -ForegroundColor Green
} else {
    $backendDir = Join-Path $rootDir "backend"
    Write-Host "  → Launching Express gateway..." -ForegroundColor White
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$backendDir'; Write-Host '[Backend] Starting Express on port 5001...' -ForegroundColor Yellow; npm start"
    ) -WindowStyle Normal
    Write-Host "  ✓ Express process launched in separate terminal." -ForegroundColor Green
    Start-Sleep -Seconds 3
}

# ── 3. React Frontend (port 3000) ──────────────────────────────────────────
Write-Host ""
Write-Host "[3/3] React / Vite Frontend (http://localhost:3000)..." -ForegroundColor Yellow

if (Test-Port 3000) {
    Write-Host "  ✓ Port 3000 already in use — frontend dev server is running." -ForegroundColor Green
} else {
    $frontendDir = Join-Path $rootDir "frontend"
    Write-Host "  → Launching React frontend..." -ForegroundColor White
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$frontendDir'; Write-Host '[Frontend] Starting Vite on port 3000...' -ForegroundColor Magenta; npm run dev"
    ) -WindowStyle Normal
    Write-Host "  ✓ React dev server launched in separate terminal." -ForegroundColor Green
}

# ── 4. Verify Gateway ML Health Proxy ──────────────────────────────────────
Write-Host ""
Write-Host "Verifying Gateway ML Proxy Health (http://localhost:5001/api/ml-health)..." -ForegroundColor DarkCyan
Start-Sleep -Seconds 2
try {
    $gwHealth = Invoke-RestMethod -Uri "http://localhost:5001/api/ml-health?check_inference=true" -TimeoutSec 10
    if ($gwHealth.status -eq "ok" -and $gwHealth.model_loaded -eq $true) {
        Write-Host "✓ Complete Gateway-to-ML connection healthy!" -ForegroundColor Green
    } else {
        Write-Host "⚠ Gateway ML proxy responded with: $($gwHealth.status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Gateway ML proxy check failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Local Environment Summary:" -ForegroundColor White
Write-Host "    Frontend:   http://localhost:3000" -ForegroundColor White
Write-Host "    Backend:    http://localhost:5001" -ForegroundColor White
Write-Host "    ML Service: http://127.0.0.1:8000" -ForegroundColor White
Write-Host "    ML Health:  http://localhost:5001/api/ml-health" -ForegroundColor White
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
