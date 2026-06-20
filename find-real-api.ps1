Write-Host "Searching REAL frontend source files for API calls..." -ForegroundColor Cyan

$root = "C:\Users\jdbes\Desktop\dipout\src"

$files = Get-ChildItem -Path $root -Recurse -Include *.js, *.jsx, *.ts, *.tsx

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    if ($content -match "api/") {
        Write-Host "`n----------------------------------------" -ForegroundColor Yellow
        Write-Host "Found API reference in: $($file.FullName)" -ForegroundColor Green
        $content | Select-String "api/" -Context 2,2
    }
}

Write-Host "`nSearch complete." -ForegroundColor Cyan
