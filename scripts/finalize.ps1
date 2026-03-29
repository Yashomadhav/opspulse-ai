# Finalize deployment - update README and push
$env:PATH = "C:\Program Files\Git\bin;C:\Program Files\Git\cmd;" + $env:PATH
Set-Location "C:\Users\yasho\Desktop\opspulse-ai"

# Add .vercel to gitignore if not already there
$gitignore = Get-Content .gitignore -Raw
if ($gitignore -notmatch "\.vercel") {
    Add-Content .gitignore "`n.vercel"
    Write-Host "Added .vercel to .gitignore" -ForegroundColor Green
}

# Commit and push final state
& "C:\Program Files\Git\bin\git.exe" add -A
& "C:\Program Files\Git\bin\git.exe" status
& "C:\Program Files\Git\bin\git.exe" commit -m "chore: finalize deployment config and gitignore"
& "C:\Program Files\Git\bin\git.exe" push origin main

Write-Host ""
Write-Host "=== OPSPULSE AI - FULLY DEPLOYED ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "GitHub Repository:" -ForegroundColor Yellow
Write-Host "  https://github.com/Yashomadhav/opspulse-ai" -ForegroundColor Green
Write-Host ""
Write-Host "Vercel Production URL:" -ForegroundColor Yellow
Write-Host "  https://opspulse-ai.vercel.app" -ForegroundColor Green
Write-Host ""
Write-Host "Vercel Dashboard:" -ForegroundColor Yellow
Write-Host "  https://vercel.com/yashomadhavmudgal-5307s-projects/opspulse-ai" -ForegroundColor Green
Write-Host ""
Write-Host "Local Development:" -ForegroundColor Yellow
Write-Host "  http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Pages:" -ForegroundColor Yellow
Write-Host "  /dashboard       - Executive KPI Dashboard" -ForegroundColor White
Write-Host "  /shifts          - Shift Monitoring" -ForegroundColor White
Write-Host "  /bottlenecks     - Bottleneck Analysis" -ForegroundColor White
Write-Host "  /alerts          - Live Alerts Feed" -ForegroundColor White
Write-Host "  /recommendations - AI Recommendations" -ForegroundColor White
Write-Host "  /simulator       - What-If Scenario Simulator" -ForegroundColor White
Write-Host ""
