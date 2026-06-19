# ==========================================
# GLOBAL FRONTEND FINDER (C: DRIVE SCAN)
# ==========================================

Write-Host "Scanning entire C: drive for frontend folders..." -ForegroundColor Cyan

$searchRoot = "C:\"

$frontendCandidates = Get-ChildItem -Path $searchRoot -Recurse -Directory -ErrorAction SilentlyContinue | Where-Object {
    $pkg = Test-Path "$($_.FullName)\package.json"
    $vite = Test-Path "$($_.FullName)\vite.config.js"
    $index = Test-Path "$($_.FullName)\index.html"
    $src = Test-Path "$($_.FullName)\src"

    $pkg -and $src -and ($vite -or $index)
}

if ($frontendCandidates.Count -eq 0) {
    Write-Host "`n❌ No frontend folders found on C: drive." -ForegroundColor Red
    exit
}

Write-Host "`n✅ Possible frontend folders found:" -ForegroundColor Green

foreach ($folder in $frontendCandidates) {
    Write-Host "👉 $($folder.FullName)" -ForegroundColor Yellow
}

Write-Host "`nChoose the folder that contains your React/Vite code." -ForegroundColor Cyan
