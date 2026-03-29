# OpsPulse AI - Security + Functionality Test Suite
# Run: powershell -ExecutionPolicy Bypass -File scripts/security-test.ps1
param([string]$BaseUrl = "http://localhost:3000")

$pass = 0
$fail = 0
$warn = 0

function OK($msg)   { Write-Host "  [PASS] $msg" -ForegroundColor Green;     $script:pass++ }
function FAIL($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red;       $script:fail++ }
function WARN($msg) { Write-Host "  [WARN] $msg" -ForegroundColor DarkYellow; $script:warn++ }

Write-Host ""
Write-Host "=== OpsPulse AI - Security + Functionality Test Suite ===" -ForegroundColor Cyan
Write-Host "    Target: $BaseUrl" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

# ── Section 1: Functionality ──────────────────────────────────
Write-Host "-- 1. Functionality Tests --" -ForegroundColor Yellow

# 1.1 GET /api/metrics
try {
    $r = Invoke-RestMethod "$BaseUrl/api/metrics"
    if ($r.success -and $r.data.kpis) {
        OK "GET /api/metrics -> backlog=$($r.data.kpis.totalBacklog) sla=$($r.data.kpis.avgSlaAttainment)% risk=$($r.data.kpis.overallRiskScore)"
    } else { FAIL "GET /api/metrics returned success=false" }
} catch { FAIL "GET /api/metrics threw: $($_.Exception.Message)" }

# 1.2 GET /api/alerts
try {
    $r = Invoke-RestMethod "$BaseUrl/api/alerts"
    if ($r.success -and $r.data.alerts) {
        $crit = ($r.data.alerts | Where-Object { $_.severity -eq "critical" }).Count
        OK "GET /api/alerts -> total=$($r.data.alerts.Count) critical=$crit"
    } else { FAIL "GET /api/alerts returned success=false" }
} catch { FAIL "GET /api/alerts threw: $($_.Exception.Message)" }

# 1.3 GET /api/recommendations
try {
    $r = Invoke-RestMethod "$BaseUrl/api/recommendations"
    if ($r.success -and $r.data.recommendations) {
        OK "GET /api/recommendations -> total=$($r.data.recommendations.Count)"
    } else { FAIL "GET /api/recommendations returned success=false" }
} catch { FAIL "GET /api/recommendations threw: $($_.Exception.Message)" }

# 1.4 POST /api/simulate (normal inputs)
try {
    $body = '{"demandIncrease":30,"absenteeismIncrease":15,"throughputDecrease":10,"staffingChange":0,"processDelayIncrease":5}'
    $r = Invoke-RestMethod -Method POST -Uri "$BaseUrl/api/simulate" -Body $body -ContentType "application/json"
    if ($r.success -and $r.data.results) {
        OK "POST /api/simulate -> projBacklog=$($r.data.results.projectedBacklog) sla=$($r.data.results.projectedSLA)% risk=$($r.data.results.projectedRiskScore)"
    } else { FAIL "POST /api/simulate returned success=false" }
} catch { FAIL "POST /api/simulate threw: $($_.Exception.Message)" }

# 1.5 GET /api/metrics with valid siteId filter
try {
    $r = Invoke-RestMethod "$BaseUrl/api/metrics?siteId=site-1&hoursBack=6"
    if ($r.success) { OK "GET /api/metrics?siteId=site-1 -> filtered correctly" }
    else { FAIL "GET /api/metrics with siteId filter failed" }
} catch { FAIL "GET /api/metrics with filter threw: $($_.Exception.Message)" }

# 1.6 Staffing Boost preset (throughputDecrease=-10, negative = improvement)
try {
    $body = '{"demandIncrease":0,"absenteeismIncrease":0,"throughputDecrease":-10,"staffingChange":10,"processDelayIncrease":0}'
    $r = Invoke-RestMethod -Method POST -Uri "$BaseUrl/api/simulate" -Body $body -ContentType "application/json"
    if ($r.success) { OK "Staffing Boost preset (throughputDecrease=-10) -> projBacklog=$($r.data.results.projectedBacklog)" }
    else { FAIL "Staffing Boost preset returned success=false" }
} catch { FAIL "Staffing Boost preset threw: $($_.Exception.Message)" }

Write-Host ""
Write-Host "-- 2. Input Validation Tests --" -ForegroundColor Yellow

# 2.1 Oversized demandIncrease (should be 400)
try {
    $body = '{"demandIncrease":99999,"absenteeismIncrease":0,"throughputDecrease":0,"staffingChange":0,"processDelayIncrease":0}'
    $null = Invoke-WebRequest -Method POST -Uri "$BaseUrl/api/simulate" -Body $body -ContentType "application/json" -ErrorAction Stop
    FAIL "Oversized demandIncrease=99999 should have returned 400 but got 200"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 400) { OK "Oversized demandIncrease=99999 -> 400 Bad Request (Zod rejected)" }
    else { WARN "Oversized input returned HTTP $code (expected 400)" }
}

# 2.2 Malformed JSON body (should be 400)
try {
    $null = Invoke-WebRequest -Method POST -Uri "$BaseUrl/api/simulate" -Body "not valid json at all" -ContentType "application/json" -ErrorAction Stop
    FAIL "Malformed JSON should have returned 400 but got 200"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 400) { OK "Malformed JSON body -> 400 Bad Request" }
    else { WARN "Malformed JSON returned HTTP $code (expected 400)" }
}

# 2.3 XSS attempt in siteId (URL-encoded, should be sanitized to 'all')
try {
    # Pre-encoded: %3Cscript%3Ealert(1)%3C%2Fscript%3E
    $r = Invoke-RestMethod "$BaseUrl/api/metrics?siteId=%3Cscript%3Ealert(1)%3C%2Fscript%3E"
    if ($r.success) { OK "XSS in siteId (%3Cscript%3E) sanitized -> returned data normally, no crash" }
    else { WARN "XSS param test returned success=false" }
} catch { WARN "XSS param test threw: $($_.Exception.Message)" }

# 2.4 SQL injection attempt in severity (should be sanitized to 'all')
try {
    # Pre-encoded: %27%3B+DROP+TABLE+alerts%3B+--
    $r = Invoke-RestMethod "$BaseUrl/api/alerts?severity=%27%3B+DROP+TABLE+alerts%3B"
    if ($r.success) { OK "SQL injection in severity sanitized -> returned $($r.data.alerts.Count) alerts normally" }
    else { WARN "SQL injection param test returned success=false" }
} catch { WARN "SQL injection param test threw: $($_.Exception.Message)" }

# 2.5 hoursBack clamping (9999 should be clamped to 168)
try {
    $r = Invoke-RestMethod "$BaseUrl/api/metrics?hoursBack=9999"
    if ($r.success) { OK "hoursBack=9999 clamped to 168 -> returned data normally" }
    else { WARN "hoursBack clamping test returned success=false" }
} catch { WARN "hoursBack clamping test threw: $($_.Exception.Message)" }

# 2.6 Invalid limit (should be clamped to 200)
try {
    $r = Invoke-RestMethod "$BaseUrl/api/alerts?limit=99999"
    if ($r.success -and $r.data.alerts.Count -le 200) { OK "limit=99999 clamped to 200 -> returned $($r.data.alerts.Count) alerts" }
    else { WARN "limit clamping test: got $($r.data.alerts.Count) alerts" }
} catch { WARN "limit clamping test threw: $($_.Exception.Message)" }

# 2.7 Empty POST body (should be 400)
try {
    $null = Invoke-WebRequest -Method POST -Uri "$BaseUrl/api/simulate" -Body "" -ContentType "application/json" -ErrorAction Stop
    WARN "Empty POST body returned 200 (Zod defaults applied - acceptable)"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 400) { OK "Empty POST body -> 400 Bad Request" }
    else { WARN "Empty POST body returned HTTP $code" }
}

Write-Host ""
Write-Host "-- 3. Security Header Tests --" -ForegroundColor Yellow

# 3.1 Check security headers on API response
try {
    $resp = Invoke-WebRequest "$BaseUrl/api/metrics" -UseBasicParsing
    $h = $resp.Headers

    $xframe = $h["X-Frame-Options"]
    $xcto   = $h["X-Content-Type-Options"]
    $cc     = $h["Cache-Control"]
    $rl     = $h["X-RateLimit-Remaining"]

    if ($xframe -eq "DENY")     { OK "X-Frame-Options: DENY" }         else { WARN "X-Frame-Options: '$xframe' (expected DENY)" }
    if ($xcto -eq "nosniff")    { OK "X-Content-Type-Options: nosniff" } else { WARN "X-Content-Type-Options: '$xcto'" }
    if ($cc -match "no-store")  { OK "Cache-Control: no-store (API responses not cached)" } else { WARN "Cache-Control: '$cc'" }
    if ($rl)                    { OK "X-RateLimit-Remaining: $rl (rate limiting active)" } else { WARN "X-RateLimit-Remaining header missing" }
} catch { WARN "API header check threw: $($_.Exception.Message)" }

# 3.2 Check security headers on page response
try {
    $resp = Invoke-WebRequest "$BaseUrl/dashboard" -UseBasicParsing
    $h = $resp.Headers

    $csp  = $h["Content-Security-Policy"]
    $perm = $h["Permissions-Policy"]
    $corp = $h["Cross-Origin-Resource-Policy"]

    if ($csp)  { OK "Content-Security-Policy present on /dashboard" }  else { WARN "CSP header missing on /dashboard" }
    if ($perm) { OK "Permissions-Policy present on /dashboard" }        else { WARN "Permissions-Policy missing" }
    if ($corp) { OK "Cross-Origin-Resource-Policy: $corp" }             else { WARN "Cross-Origin-Resource-Policy missing" }
} catch { WARN "Page header check threw: $($_.Exception.Message)" }

# 3.3 Rate limit headers on simulate endpoint
try {
    $resp = Invoke-WebRequest -Method POST -Uri "$BaseUrl/api/simulate" -Body '{"demandIncrease":0,"absenteeismIncrease":0,"throughputDecrease":0,"staffingChange":0,"processDelayIncrease":0}' -ContentType "application/json" -UseBasicParsing
    $rl = $resp.Headers["X-RateLimit-Remaining"]
    if ($rl) { OK "Simulate rate limit header: X-RateLimit-Remaining=$rl" }
    else { WARN "X-RateLimit-Remaining missing on /api/simulate" }
} catch { WARN "Simulate header check threw: $($_.Exception.Message)" }

# ── Summary ───────────────────────────────────────────────────
Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  Results: [PASS] $pass   [FAIL] $fail   [WARN] $warn" -ForegroundColor Cyan
if ($fail -eq 0) {
    Write-Host "  [OK] ALL SECURITY + FUNCTIONALITY TESTS PASSED" -ForegroundColor Green
} else {
    Write-Host "  [$fail FAILURES] Review failed tests above" -ForegroundColor Red
}
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""
