Write-Host "Searching for API calls in DipOut frontend..." -ForegroundColor Cyan

$root = Get-Location

$files = Get-ChildItem -Path $root -Recurse -Include *.js, *.jsx, *.ts, *.tsx

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    if ($content -match "api/") {
        Write-Host "Found API reference in: $($file.FullName)" -ForegroundColor Yellow
        $content | Select-String "api/" -Context 2,2
    }
}

Write-Host "Search complete." -ForegroundColor Green
