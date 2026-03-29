# OpsPulse AI — API Verification Script
# Auto-detects port (3000 or 3001)
$ports = @(3000, 3001)
$base = $null

foreach ($port in $ports) {
    try {
        $test = Invoke-WebRequest "http://localhost:$port" -TimeoutSec 2 -ErrorAction Stop
        $base = "http://localhost:$port"
        break
    } catch { }
}

if (-not $base) {
    Write-Host "ERROR: No dev server found on ports 3000 or 3001" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== OpsPulse AI API Verification ===" -ForegroundColor Cyan
Write-Host "Server: $base" -ForegroundColor Gray

# Test /api/metrics
try {
    $r1 = Invoke-RestMethod "$base/api/metrics"
    $status = if ($r1.success) { "PASS" } else { "FAIL" }
    $color = if ($r1.success) { "Green" } else { "Red" }
    Write-Host "/api/metrics        [$status] opsMetrics=$($r1.data.opsMetrics.Count) backlog=$($r1.data.kpis.totalBacklog) sla=$($r1.data.kpis.avgSlaAttainment)%" -ForegroundColor $color
} catch {
    Write-Host "/api/metrics        [FAIL] $_" -ForegroundColor Red
}

# Test /api/alerts
try {
    $r2 = Invoke-RestMethod "$base/api/alerts"
    $status = if ($r2.success) { "PASS" } else { "FAIL" }
    $color = if ($r2.success) { "Green" } else { "Red" }
    Write-Host "/api/alerts         [$status] alerts=$($r2.data.alerts.Count)" -ForegroundColor $color
} catch {
    Write-Host "/api/alerts         [FAIL] $_" -ForegroundColor Red
}

# Test /api/recommendations
try {
    $r3 = Invoke-RestMethod "$base/api/recommendations"
    $status = if ($r3.success) { "PASS" } else { "FAIL" }
    $color = if ($r3.success) { "Green" } else { "Red" }
    Write-Host "/api/recommendations[$status] recs=$($r3.data.recommendations.Count)" -ForegroundColor $color
} catch {
    Write-Host "/api/recommendations[FAIL] $_" -ForegroundColor Red
}

# Test /api/simulate POST
try {
    $body = @{
        demandIncrease = 20
        absenteeismIncrease = 10
        throughputDecrease = 5
        staffingChange = 0
        processDelayIncrease = 0
    } | ConvertTo-Json
    $r4 = Invoke-RestMethod -Method POST -Uri "$base/api/simulate" -Body $body -ContentType "application/json"
    $status = if ($r4.success) { "PASS" } else { "FAIL" }
    $color = if ($r4.success) { "Green" } else { "Red" }
    $res = $r4.data.results
    Write-Host "/api/simulate       [$status] projBacklog=$($res.projectedBacklog) projSLA=$($res.projectedSLA)% risk=$($res.projectedRiskScore)" -ForegroundColor $color
} catch {
    Write-Host "/api/simulate       [FAIL] $_" -ForegroundColor Red
}

Write-Host "`n=== Verification Complete ===" -ForegroundColor Cyan
