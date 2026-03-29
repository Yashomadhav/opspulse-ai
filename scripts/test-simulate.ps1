# Test /api/simulate with full payload (including siteId, shiftName, negative throughputDecrease)
$base = "http://localhost:3000"

Write-Host "Testing /api/simulate..." -ForegroundColor Cyan

# Test 1: Default inputs (with siteId + shiftName)
$body1 = @{
    siteId = "site-1"
    shiftName = "Shift A"
    demandIncrease = 0
    absenteeismIncrease = 0
    throughputDecrease = 0
    staffingChange = 0
    processDelayIncrease = 0
} | ConvertTo-Json

$r1 = Invoke-RestMethod -Method POST -Uri "$base/api/simulate" -Body $body1 -ContentType "application/json"
if ($r1.success) {
    Write-Host "[PASS] Default inputs: projBacklog=$($r1.data.results.projectedBacklog) sla=$($r1.data.results.projectedSLA)% risk=$($r1.data.results.projectedRiskScore)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Default inputs: $($r1.error)" -ForegroundColor Red
}

# Test 2: Staffing Boost preset (throughputDecrease = -10, negative value)
$body2 = @{
    siteId = "site-1"
    shiftName = "Shift A"
    demandIncrease = 0
    absenteeismIncrease = 0
    throughputDecrease = -10
    staffingChange = 5
    processDelayIncrease = 0
} | ConvertTo-Json

$r2 = Invoke-RestMethod -Method POST -Uri "$base/api/simulate" -Body $body2 -ContentType "application/json"
if ($r2.success) {
    Write-Host "[PASS] Staffing Boost (throughputDecrease=-10): projBacklog=$($r2.data.results.projectedBacklog) sla=$($r2.data.results.projectedSLA)% risk=$($r2.data.results.projectedRiskScore)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Staffing Boost: $($r2.error)" -ForegroundColor Red
}

# Test 3: Black Friday preset
$body3 = @{
    siteId = "site-2"
    shiftName = "Shift B"
    demandIncrease = 50
    absenteeismIncrease = 15
    throughputDecrease = 10
    staffingChange = 0
    processDelayIncrease = 5
} | ConvertTo-Json

$r3 = Invoke-RestMethod -Method POST -Uri "$base/api/simulate" -Body $body3 -ContentType "application/json"
if ($r3.success) {
    Write-Host "[PASS] Black Friday: projBacklog=$($r3.data.results.projectedBacklog) sla=$($r3.data.results.projectedSLA)% risk=$($r3.data.results.projectedRiskScore) bottleneck=$($r3.data.results.expectedBottleneck)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Black Friday: $($r3.error)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Simulator fix verified!" -ForegroundColor Cyan
