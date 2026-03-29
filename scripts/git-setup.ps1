# Git setup script for OpsPulse AI
param(
    [string]$GitPath = "C:\Program Files\Git\bin\git.exe"
)

Set-Location "C:\Users\yasho\Desktop\opspulse-ai"

Write-Host "=== Git Setup for OpsPulse AI ===" -ForegroundColor Cyan

# Configure git identity
& $GitPath config --global user.email "yasho@opspulse.ai"
& $GitPath config --global user.name "OpsPulse AI"
& $GitPath config --global init.defaultBranch "main"
& $GitPath config --global core.autocrlf true
Write-Host "[OK] Git identity configured" -ForegroundColor Green

# Initialize repo (safe to run even if already initialized)
& $GitPath init
Write-Host "[OK] Git initialized" -ForegroundColor Green

# Stage all files
& $GitPath add .
Write-Host "[OK] Files staged" -ForegroundColor Green

# Show what will be committed
$status = & $GitPath status --short
Write-Host "Files to commit: $($status.Count)" -ForegroundColor Yellow

# Initial commit
& $GitPath commit -m "feat: initial OpsPulse AI production build with security hardening"
Write-Host "[OK] Initial commit created" -ForegroundColor Green

# Show log
& $GitPath log --oneline -3
Write-Host "=== Git setup complete ===" -ForegroundColor Cyan
