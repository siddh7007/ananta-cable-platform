# Service Health Check Script
Write-Host "Testing Cable Platform Services..." -ForegroundColor Cyan
Write-Host ""

# Test DRC Service
Write-Host "1. DRC Service (http://localhost:8000)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -ErrorAction Stop
    Write-Host "   ✓ Status: $($response.status)" -ForegroundColor Green
    Write-Host "   Service: $($response.service)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test API Gateway
Write-Host "2. API Gateway (http://localhost:8080)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/health" -Method Get -ErrorAction Stop
    Write-Host "   ✓ Status: $($response.status)" -ForegroundColor Green
    Write-Host "   Service: $($response.service)" -ForegroundColor Gray
    Write-Host "   Version: $($response.version)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test BFF Portal (from inside the container since port mapping might be different)
Write-Host "3. BFF Portal (http://localhost:8081 -> 4001)" -ForegroundColor Yellow
try {
    $output = docker exec ananta-cable-platform-bff-portal-1 node -e "fetch('http://localhost:4001/health').then(r=>r.json()).then(d=>console.log(JSON.stringify(d)))" 2>&1 | Out-String
    if ($output -match '\{') {
        $response = $output | ConvertFrom-Json
        Write-Host "   ✓ Status: $($response.status)" -ForegroundColor Green
        Write-Host "   Service: $($response.service)" -ForegroundColor Gray
    } else {
        throw "Invalid response"
    }
} catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test Portal Frontend
Write-Host "4. Portal Frontend (http://localhost:5173)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method Get -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✓ Status: Accessible" -ForegroundColor Green
        Write-Host "   HTTP Status: $($response.StatusCode)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=======================" -ForegroundColor Cyan
Write-Host "Service Check Complete!" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
