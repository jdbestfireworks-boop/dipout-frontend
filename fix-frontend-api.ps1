Write-Host "Fixing DipOut frontend API paths..." -ForegroundColor Cyan

# Set the root folder to the current directory
$root = Get-Location

# Scan all JS, JSX, TS, TSX files
$files = Get-ChildItem -Path $root -Recurse -Include *.js, *.jsx, *.ts, *.tsx

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    if ($content -match "/api/apps/auth/") {
        Write-Host "Fixing: $($file.FullName)" -ForegroundColor Yellow

        # Replace wrong API path with correct one
        $fixed = $content -replace "/api/apps/auth/", "/api/auth/"

        Set-Content -Path $file.FullName -Value $fixed
    }
}

Write-Host "Frontend API paths fixed successfully!" -ForegroundColor Green
