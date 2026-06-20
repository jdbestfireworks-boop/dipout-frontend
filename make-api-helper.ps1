Write-Host "Creating DipOut API helper (src\lib\api.js)..." -ForegroundColor Cyan

$projectRoot = "C:\Users\jdbes\Desktop\dipout"
$libDir = Join-Path $projectRoot "src\lib"
$apiFile = Join-Path $libDir "api.js"

if (-not (Test-Path $libDir)) {
    New-Item -ItemType Directory -Path $libDir | Out-Null
}

$apiJs = @"
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? "https://dipout-kaq5.onrender.com"
    : "http://localhost:3000");

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default api;
"@

Set-Content -Path $apiFile -Value $apiJs -Encoding UTF8

Write-Host "Created: $apiFile" -ForegroundColor Green
Write-Host "Now you can import 'api' from 'src/lib/api.js' in your React code." -ForegroundColor Yellow
