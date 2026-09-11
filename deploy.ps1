# Super Cup Deployment Script (PowerShell)
# Usage: .\deploy.ps1 [vercel|railway|docker|vps]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('vercel', 'railway', 'docker', 'vps', 'help')]
    [string]$Target = 'help'
)

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  TVS Certified Super Cup - Deployment Script" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

switch ($Target) {
    'vercel' {
        Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Green
        Write-Host ""
        Write-Host "Prerequisites:" -ForegroundColor Yellow
        Write-Host "  - Vercel account (free)"
        Write-Host "  - GitHub repository"
        Write-Host ""
        
        # Check if Vercel CLI is installed
        $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
        if (-not $vercelInstalled) {
            Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
            npm install -g vercel
        }
        
        Write-Host "Setting up Vercel Postgres..." -ForegroundColor Yellow
        Write-Host "⚠️  After deployment:" -ForegroundColor Red
        Write-Host "    1. Go to your project → Storage → Create Database → Postgres"
        Write-Host "    2. Copy DATABASE_URL to Environment Variables"
        Write-Host "    3. Run: vercel env pull"
        Write-Host "    4. Run: npm run db:push"
        Write-Host "    5. Run: npm run db:seed"
        Write-Host ""
        
        vercel --prod
        
        Write-Host "✅ Deployed to Vercel!" -ForegroundColor Green
        Write-Host "⚠️  Don't forget to configure Vercel Postgres and run migrations!" -ForegroundColor Red
    }
    
    'railway' {
        Write-Host "🚂 Deploying to Railway..." -ForegroundColor Green
        Write-Host ""
        Write-Host "Prerequisites:" -ForegroundColor Yellow
        Write-Host "  - Railway account"
        Write-Host "  - GitHub repository"
        Write-Host ""
        
        # Check if Railway CLI is installed
        $railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue
        if (-not $railwayInstalled) {
            Write-Host "Installing Railway CLI..." -ForegroundColor Yellow
            npm install -g @railway/cli
        }
        
        Write-Host "Logging into Railway..." -ForegroundColor Yellow
        railway login
        
        Write-Host "Linking project..." -ForegroundColor Yellow
        railway link
        
        Write-Host "Setting environment variables..." -ForegroundColor Yellow
        railway variables set DATABASE_URL="file:./prisma/dev.db"
        
        Write-Host "Deploying..." -ForegroundColor Yellow
        railway up
        
        Write-Host "✅ Deployed to Railway!" -ForegroundColor Green
        Write-Host "⚠️  Configure persistent volume at: railway.app → Your Project → Volumes" -ForegroundColor Red
        Write-Host "    Mount path: /app/prisma"
    }
    
    'docker' {
        Write-Host "🐳 Building Docker containers..." -ForegroundColor Green
        Write-Host ""
        
        # Check if Docker is installed
        $dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
        if (-not $dockerInstalled) {
            Write-Host "❌ Docker is not installed!" -ForegroundColor Red
            Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
            exit 1
        }
        
        # Check if .env exists
        if (-not (Test-Path .env)) {
            Write-Host "⚠️  .env file not found. Creating from template..." -ForegroundColor Yellow
            @"
DATABASE_URL="file:/app/prisma/dev.db"
ADMIN_PASSWORD=supercup2026
INTERNAL_API_KEY=supercup-internal-key
AUCTION_ID=1978
SYNC_INTERVAL_MS=10000
"@ | Out-File -FilePath .env -Encoding utf8
            Write-Host "✅ Created .env file. Please update with production values!" -ForegroundColor Green
        }
        
        Write-Host "Building images..." -ForegroundColor Yellow
        docker-compose build
        
        Write-Host "Setting up database..." -ForegroundColor Yellow
        docker-compose run --rm web npm run db:setup
        
        Write-Host "Starting services..." -ForegroundColor Yellow
        docker-compose up -d
        
        Write-Host "✅ Docker deployment complete!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Services running:" -ForegroundColor Cyan
        docker-compose ps
        Write-Host ""
        Write-Host "View logs:" -ForegroundColor Cyan
        Write-Host "  docker-compose logs -f web"
        Write-Host "  docker-compose logs -f sync-daemon"
    }
    
    'vps' {
        Write-Host "🖥️  VPS Deployment Guide" -ForegroundColor Green
        Write-Host ""
        Write-Host "Run these commands on your Ubuntu VPS:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "# 1. Install dependencies"
        Write-Host "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
        Write-Host "sudo apt-get install -y nodejs"
        Write-Host "sudo npm install -g pm2"
        Write-Host ""
        Write-Host "# 2. Clone repository"
        Write-Host "cd /var/www"
        Write-Host "git clone YOUR_REPO_URL supercup"
        Write-Host "cd supercup"
        Write-Host ""
        Write-Host "# 3. Install and build"
        Write-Host "npm install"
        Write-Host "npm run build"
        Write-Host ""
        Write-Host "# 4. Setup database"
        Write-Host "npm run db:setup"
        Write-Host ""
        Write-Host "# 5. Start with PM2"
        Write-Host "pm2 start ecosystem.config.js"
        Write-Host "pm2 save"
        Write-Host "pm2 startup"
        Write-Host ""
        Write-Host "# 6. Setup Nginx (optional)"
        Write-Host "sudo apt-get install -y nginx certbot python3-certbot-nginx"
        Write-Host "sudo nano /etc/nginx/sites-available/supercup"
        Write-Host ""
        Write-Host "See DEPLOYMENT.md for full Nginx configuration"
    }
    
    default {
        Write-Host "Usage: .\deploy.ps1 [vercel|railway|docker|vps]" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Deployment Options:" -ForegroundColor Cyan
        Write-Host "  vercel   - Deploy to Vercel (recommended, easiest)"
        Write-Host "  railway  - Deploy to Railway (keeps SQLite)"
        Write-Host "  docker   - Run with Docker Compose (local/VPS)"
        Write-Host "  vps      - Show VPS deployment instructions"
        Write-Host ""
        Write-Host "For detailed instructions, see DEPLOYMENT.md"
    }
}
