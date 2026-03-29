# GitHub + Vercel deployment script for OpsPulse AI
param(
    [string]$GitPath    = "C:\Program Files\Git\bin\git.exe",
    [string]$GhPath     = "C:\Program Files\GitHub CLI\gh.exe",
    [string]$RepoName   = "opspulse-ai",
    [string]$Username   = "Yashomadhav",
    [string]$ProjectDir = "C:\Users\yasho\Desktop\opspulse-ai"
)

Set-Location $ProjectDir

# Add Git to PATH for this session
$env:PATH = "C:\Program Files\Git\bin;C:\Program Files\Git\cmd;" + $env:PATH
$env:GIT_EXEC_PATH = "C:\Program Files\Git\mingw64\libexec\git-core"

Write-Host "=== OpsPulse AI — GitHub + Vercel Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify auth
Write-Host "-- Step 1: Verify GitHub auth --" -ForegroundColor Yellow
& $GhPath auth status
Write-Host ""

# Step 2: Create GitHub repository
Write-Host "-- Step 2: Create GitHub repository --" -ForegroundColor Yellow
& $GhPath repo create $RepoName `
    --public `
    --description "OpsPulse AI - Real-Time Operations Control Tower for Throughput, Backlog, SLA Risk and Staffing Decisions" `
    --source . `
    --remote origin `
    --push

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Repository created and code pushed!" -ForegroundColor Green
} else {
    Write-Host "[WARN] Repo may already exist. Trying to add remote and push..." -ForegroundColor DarkYellow
    
    # Remove existing remote if any
    & $GitPath remote remove origin 2>$null
    
    # Add remote
    & $GitPath remote add origin "https://github.com/$Username/$RepoName.git"
    
    # Push
    & $GitPath push -u origin main --force
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Code pushed to existing repository!" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Push failed. Check output above." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "-- Step 3: Verify repository --" -ForegroundColor Yellow
& $GhPath repo view "$Username/$RepoName" --json name,url,description,visibility 2>&1

Write-Host ""
Write-Host "=== Repository URL ===" -ForegroundColor Cyan
Write-Host "https://github.com/$Username/$RepoName" -ForegroundColor Green
Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Go to https://vercel.com/new" -ForegroundColor White
Write-Host "2. Import: github.com/$Username/$RepoName" -ForegroundColor White
Write-Host "3. Framework: Next.js (auto-detected)" -ForegroundColor White
Write-Host "4. Add environment variables:" -ForegroundColor White
Write-Host "   NEXT_PUBLIC_USE_MOCK_DATA = true" -ForegroundColor Gray
Write-Host "   NEXT_PUBLIC_APP_URL = https://your-app.vercel.app" -ForegroundColor Gray
Write-Host "   (Add Supabase vars when ready)" -ForegroundColor Gray
Write-Host "5. Click Deploy" -ForegroundColor White
Write-Host ""
