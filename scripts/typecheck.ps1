Set-Location "C:\Users\yasho\Desktop\opspulse-ai"
Write-Host "Running TypeScript type check..." -ForegroundColor Cyan
$output = & npx tsc --noEmit 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "TypeScript: No errors found" -ForegroundColor Green
} else {
    Write-Host "TypeScript errors:" -ForegroundColor Yellow
    $output | Select-Object -First 50 | ForEach-Object { Write-Host $_ }
}
