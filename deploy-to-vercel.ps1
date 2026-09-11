#!/usr/bin/env pwsh
# TVS Super Cup - Vercel Deployment Script
# This script automates the deployment process to Vercel

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  TVS Super Cup - Vercel Deployment Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
Write-Host "Checking Vercel CLI installation..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "✗ Vercel CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing Vercel CLI globally..." -ForegroundColor Yellow
    npm install -g vercel
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install Vercel CLI" -ForegroundColor Red
        Write-Host "Please install manually: npm install -g vercel" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Vercel CLI installed successfully" -ForegroundColor Green
} else {
    Write-Host "✓ Vercel CLI is installed" -ForegroundColor Green
}

Write-Host ""

# Check if user is logged in
Write-Host "Checking Vercel authentication..." -ForegroundColor Yellow
vercel whoami 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Not logged in to Vercel" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please log in to Vercel:" -ForegroundColor Yellow
    vercel login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Login failed" -ForegroundColor Red
        exit 1
    }
}

$username = vercel whoami
Write-Host "✓ Logged in as: $username" -ForegroundColor Green
Write-Host ""

# Ask deployment type
Write-Host "Select deployment type:" -ForegroundColor Yellow
Write-Host "  1. Preview deployment (test before going live)"
Write-Host "  2. Production deployment (live to production)"
Write-Host ""
$choice = Read-Host "Enter choice (1 or 2)"

if ($choice -eq "2") {
    $deployType = "--prod"
    $deployName = "Production"
} else {
    $deployType = ""
    $deployName = "Preview"
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Starting $deployName Deployment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project directory
Set-Location $PSScriptRoot

# Run deployment
Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
Write-Host ""

if ($deployType -eq "--prod") {
    vercel --prod
} else {
    vercel
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "  ✓ Deployment Successful!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host ""
    
    if ($deployType -ne "--prod") {
        Write-Host "1. Test your preview deployment" -ForegroundColor White
        Write-Host "2. If everything works, run this script again and choose Production" -ForegroundColor White
        Write-Host ""
    }
    
    Write-Host "Important: Set up environment variables in Vercel Dashboard" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Required environment variables:" -ForegroundColor White
    Write-Host "  • DATABASE_URL (from Vercel Postgres)" -ForegroundColor White
    Write-Host "  • ADMIN_PASSWORD (your secure admin password)" -ForegroundColor White
    Write-Host "  • INTERNAL_API_KEY (random secure key)" -ForegroundColor White
    Write-Host "  • CRON_SECRET (random secret for cron security)" -ForegroundColor White
    Write-Host ""
    Write-Host "To add environment variables:" -ForegroundColor Yellow
    Write-Host "  vercel env add VARIABLE_NAME production" -ForegroundColor White
    Write-Host ""
    Write-Host "For detailed instructions, see: VERCEL_DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "  ✗ Deployment Failed" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error messages above" -ForegroundColor Yellow
    Write-Host "For help, see: VERCEL_DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}
