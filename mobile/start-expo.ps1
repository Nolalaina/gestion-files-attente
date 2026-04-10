# Script to start Expo with proper error handling
$ErrorActionPreference = "Continue"
Set-Location "d:\Lincence 2\COURS S4\Projet trasversale\Gestion-files-attente\mobile"

# Kill any existing process on port 8081 (Metro's default port)
Write-Host "Cleaning port 8081..." -ForegroundColor Yellow
$port8081 = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
if ($port8081) {
    foreach ($conn in $port8081) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Port 8081 cleared." -ForegroundColor Green
}

# Fix for Node 18+ fetch and DNS issues on Windows
$env:NODE_OPTIONS = "--dns-result-order=ipv4first"
# $env:EXPO_OFFLINE = "1" # Commented out to allow better network discovery

Write-Host "Starting Expo server..." -ForegroundColor Green
npx expo start --clear 2>&1 | Tee-Object -FilePath "expo-output.log"
