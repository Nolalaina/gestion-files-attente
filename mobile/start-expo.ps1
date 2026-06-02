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
$env:EXPO_OFFLINE = "1" 
$env:EXPO_NO_TELEMETRY = "1"

# Force LAN IP for Expo
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "172.20.10.4"

Write-Host "Starting Expo server in OFFLINE mode..." -ForegroundColor Green
npx expo start --offline --clear 2>&1 | Tee-Object -FilePath "expo-output.log"
