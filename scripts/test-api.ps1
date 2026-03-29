# Test all OpsPulse AI API endpoints
Write-Host "=== OpsPulse AI API Tests ===" -ForegroundColor Cyan

# Test /api/metrics
try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000/api/metrics" -UseBasicParsing
    $j = $r.Content | ConvertFrom-Json
    Write-Host "[PASS] /api/metrics - success=$($j.success) opsMetrics=$($j.data.opsMetrics.Count) totalBacklog=$($j.data.kpis.totalBacklog) avgSLA=$($j.data.kpis.avgSlaAttainment)" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] /api/metrics - $($_.Exception.Message)" -ForegroundColor Red
}

# Test /api/alerts
try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000/api/alerts" -UseBasicParsing
    $j = $r.Content | ConvertFrom-Json
    Write-Host "[PASS] /api/alerts - success=$($j.success) alerts=$($j.data.alerts.Count)" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] /api/alerts - $($_.Exception.Message)" -ForegroundColor Red
}

# Test /api/recommendations
try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000/api/recommendations" -UseBasicParsing
    $j = $r.Content | ConvertFrom-Json
    Write-Host "[PASS] /api/recommendations - success=$($j.success) recs=$($j.data.recommendations.Count)" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] /api/recommendations - $($_.Exception.Message)" -ForegroundColor Red
}

# Test /api/simulate (POST)
try {
    $body = '{"siteId":"site-1","shiftName":"Morning","demandIncrease":20,"absenteeismIncrease":10,"throughputDecrease":5,"staffingChange":0,"processDelayIncrease":0}'
    $r = Invoke-WebRequest -Uri "http://localhost:3000/api/simulate" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    $j = $r.Content | ConvertFrom-Json
    Write-Host "[PASS] /api/simulate - success=$($j.success) projectedBacklog=$($j.data.projectedBacklog) projectedSLA=$($j.data.projectedSLA) riskScore=$($j.data.projectedRiskScore)" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] /api/simulate - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "=== Tests Complete ===" -ForegroundColor Cyan
