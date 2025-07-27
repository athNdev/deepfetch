# PowerShell startup script for the advanced web resource downloader app
# This script will:
# 1. Start the CORS proxy (cors-proxy.js) on port 8082
# 2. Start the web-app (webpack dev server)
#
# Usage: Right-click and 'Run with PowerShell' or run in a PowerShell terminal from the /web-app directory

# Set working directory to the script's location (should be /web-app)
Set-Location $PSScriptRoot

Write-Host "[1/2] Starting CORS proxy on port 8082..."
Start-Job -ScriptBlock { node cors-proxy.js } | Out-Null
Start-Sleep -Seconds 2

Write-Host "[2/2] Starting web-app (webpack dev server)..."
Start-Job -ScriptBlock { npm run start } | Out-Null

Write-Host "Both CORS proxy and web-app started in background jobs."
Write-Host "- CORS proxy: http://localhost:8082/"
Write-Host "- Web app:   http://localhost:8080/"
Write-Host "To stop, use 'Get-Job | Remove-Job' or close the terminal."
