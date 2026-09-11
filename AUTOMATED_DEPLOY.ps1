#!/usr/bin/env pwsh
# TVS Super Cup - Fully Automated Deployment Script
# This script handles the entire deployment process after you login once

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  TVS SUPER CUP - AUTOMATED VERCEL DEPLOYMENT" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project directory
Set-Location $PSScriptRoot

# Step 1: Check Vercel CLI
Write-Host "[1/9] Checking Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "✗ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install Vercel CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Vercel CLI installed" -ForegroundColor Green
} else {
    Write-Host "✓ Vercel CLI is installed" -ForegroundColor Green
}

Write-Host ""

# Step 2: Check if logged in
Write-Host "[2/9] Checking Vercel authentication..." -ForegroundColor Yellow
vercel whoami 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Not logged in to Vercel" -ForegroundColor Red
    Write-Host ""
    Write-Host "IMPORTANT: A browser window will open for authentication." -ForegroundColor Yellow
    Write-Host "Please complete the login process and return here." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press ENTER to open browser and login"
    
    vercel login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Login failed" -ForegroundColor Red
        exit 1
    }
}

$username = vercel whoami
Write-Host "✓ Logged in as: $username" -ForegroundColor Green
Write-Host ""

# Step 3: Deploy to preview first
Write-Host "[3/9] Deploying to Vercel (preview)..." -ForegroundColor Yellow
Write-Host "This will create a preview deployment first for testing." -ForegroundColor Gray
Write-Host ""

vercel --yes

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Preview deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Preview deployment successful" -ForegroundColor Green
Write-Host ""

# Step 4: Instructions for database setup
Write-Host "[4/9] Database Setup Required" -ForegroundColor Yellow
Write-Host ""
Write-Host "You need to create a PostgreSQL database in Vercel:" -ForegroundColor White
Write-Host "  1. Go to: https://vercel.com/dashboard" -ForegroundColor Gray
Write-Host "  2. Click on your project (tvs-super-cup or similar)" -ForegroundColor Gray
Write-Host "  3. Go to 'Storage' tab" -ForegroundColor Gray
Write-Host "  4. Click 'Create Database' → 'Postgres'" -ForegroundColor Gray
Write-Host "  5. Name: supercup-db" -ForegroundColor Gray
Write-Host "  6. Region: Mumbai (or closest to India)" -ForegroundColor Gray
Write-Host "  7. Click 'Create'" -ForegroundColor Gray
Write-Host "  8. Copy the POSTGRES_PRISMA_URL value" -ForegroundColor Gray
Write-Host ""
Write-Host "Have you created the database? (y/n)" -ForegroundColor Yellow
$dbCreated = Read-Host

if ($dbCreated -ne "y") {
    Write-Host ""
    Write-Host "Please create the database first, then run this script again." -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# Step 5: Set environment variables
Write-Host "[5/9] Setting environment variables..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Enter DATABASE_URL (the POSTGRES_PRISMA_URL you copied):" -ForegroundColor White
$DATABASE_URL = Read-Host
echo $DATABASE_URL | vercel env add DATABASE_URL production

Write-Host ""
Write-Host "Enter ADMIN_PASSWORD (for /admin dashboard):" -ForegroundColor White
Write-Host "Example: SuperCup2026!Admin#Secure" -ForegroundColor Gray
$ADMIN_PASSWORD = Read-Host -AsSecureString
$ADMIN_PASSWORD_TEXT = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($ADMIN_PASSWORD))
echo $ADMIN_PASSWORD_TEXT | vercel env add ADMIN_PASSWORD production

Write-Host ""
Write-Host "Enter INTERNAL_API_KEY (random secure key):" -ForegroundColor White
Write-Host "Example: sc-2026-internal-xyz789abc123" -ForegroundColor Gray
$INTERNAL_API_KEY = Read-Host
echo $INTERNAL_API_KEY | vercel env add INTERNAL_API_KEY production

Write-Host ""
Write-Host "Enter CRON_SECRET (random secret for cron security):" -ForegroundColor White
Write-Host "Example: cron-secret-random-xyz789" -ForegroundColor Gray
$CRON_SECRET = Read-Host
echo $CRON_SECRET | vercel env add CRON_SECRET production

Write-Host ""
Write-Host "✓ Environment variables set" -ForegroundColor Green
Write-Host ""

# Step 6: Pull environment variables locally
Write-Host "[6/9] Pulling environment variables locally..." -ForegroundColor Yellow
vercel env pull .env.local --yes

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to pull environment variables" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Environment variables pulled" -ForegroundColor Green
Write-Host ""

# Step 7: Initialize database
Write-Host "[7/9] Initializing database..." -ForegroundColor Yellow
Write-Host "  → Generating Prisma client..." -ForegroundColor Gray
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}

Write-Host "  → Pushing database schema..." -ForegroundColor Gray
npx prisma db push --accept-data-loss

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to push database schema" -ForegroundColor Red
    exit 1
}

Write-Host "  → Seeding database (1,608 dealers + 8 matches)..." -ForegroundColor Gray
npm run db:seed

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to seed database" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Database initialized successfully" -ForegroundColor Green
Write-Host ""

# Step 8: Deploy to production
Write-Host "[8/9] Deploying to production..." -ForegroundColor Yellow
vercel --prod --yes

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Production deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Production deployment successful" -ForegroundColor Green
Write-Host ""

# Step 9: Get production URL
Write-Host "[9/9] Getting production URL..." -ForegroundColor Yellow
$prodUrl = vercel ls --prod 2>&1 | Select-String -Pattern "https://" | Select-Object -First 1

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  ✓ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

if ($prodUrl) {
    Write-Host "Your application is live at:" -ForegroundColor White
    Write-Host $prodUrl -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Visit your Vercel dashboard:" -ForegroundColor White
Write-Host "   https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Verify cron job is active:" -ForegroundColor White
Write-Host "   Settings → Cron Jobs → Check '/api/internal/events'" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test your application:" -ForegroundColor White
Write-Host "   - Homepage: [your-url]" -ForegroundColor Gray
Write-Host "   - Login with dealer code: 19479, password: tvs123" -ForegroundColor Gray
Write-Host "   - Leaderboard: [your-url]/leaderboard" -ForegroundColor Gray
Write-Host "   - Admin: [your-url]/admin (use ADMIN_PASSWORD)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Monitor logs:" -ForegroundColor White
Write-Host "   vercel logs --follow" -ForegroundColor Gray
Write-Host ""

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  ALL THURSDAYS CONFIGURED (Including Sept 17, 2026):" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  ✓ September 10, 2026 - Match #1 (LIVE)" -ForegroundColor White
Write-Host "  ✓ September 17, 2026 - Match #2" -ForegroundColor White
Write-Host "  ✓ September 24, 2026 - Match #3" -ForegroundColor White
Write-Host "  ✓ October 1, 2026 - Match #4" -ForegroundColor White
Write-Host "  ✓ October 8, 2026 - Match #5" -ForegroundColor White
Write-Host "  ✓ October 15, 2026 - Match #6" -ForegroundColor White
Write-Host "  ✓ October 22, 2026 - Match #7" -ForegroundColor White
Write-Host "  ✓ October 29, 2026 - Match #8" -ForegroundColor White
Write-Host ""
Write-Host "  Cron job runs every 2 minutes automatically!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🎉 Your TVS Super Cup is now LIVE! 🏆" -ForegroundColor Green
