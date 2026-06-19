# ================================
# DipOut Frontend Auto-Fix Script
# ================================

Write-Host "Starting DipOut frontend configuration..." -ForegroundColor Cyan

# 1. Set project path
$projectPath = "C:\users\jdbes\Desktop\dipout"

if (!(Test-Path $projectPath)) {
    Write-Host "ERROR: Project folder not found at $projectPath" -ForegroundColor Red
    exit
}

Write-Host "Project found at $projectPath" -ForegroundColor Green

# 2. Create .env.production
$envFile = Join-Path $projectPath ".env.production"
$backendUrl = 'VITE_API_URL="https://dipout-backend1.onrender.com"'

Set-Content -Path $envFile -Value $backendUrl -Encoding UTF8
Write-Host ".env.production created with backend URL." -ForegroundColor Green

# 3. Create _redirects file
$redirectsFile = Join-Path $projectPath "_redirects"
$redirectRule = "/*    /index.html    200"

Set-Content -Path $redirectsFile -Value $redirectRule -Encoding UTF8
Write-Host "_redirects file created." -ForegroundColor Green

# 4. Replace localhost API URLs in all JS/TS/TSX/JSX files
Write-Host "Searching for localhost API URLs..." -ForegroundColor Yellow

$files = Get-ChildItem -Path $projectPath -Recurse -Include *.js, *.jsx, *.ts, *.tsx

foreach ($file in $files) {
    (Get-Content $file.PSPath) |
        ForEach-Object { $_ -replace "http://localhost:\d+", "https://dipout-backend1.onrender.com" } |
        Set-Content $file.PSPath
}

Write-Host "Replaced all localhost API URLs with Render backend URL." -ForegroundColor Green

# 5. Git commit & push
Write-Host "Committing changes to Git..." -ForegroundColor Yellow

Set-Location $projectPath
git add .
git commit -m "Auto-update: connect frontend to Render backend"
git push

Write-Host "Changes pushed to GitHub successfully!" -ForegroundColor Green

Write-Host "DipOut frontend is now production-ready. Cloudflare will redeploy automatically." -ForegroundColor Cyan
