#!/bin/bash
# Quick deployment script for Super Cup
# Usage: ./deploy.sh [vercel|railway|docker|vps]

set -e

DEPLOY_TARGET=${1:-"help"}

echo "═══════════════════════════════════════════════════════"
echo "  TVS Certified Super Cup - Deployment Script"
echo "═══════════════════════════════════════════════════════"
echo ""

case $DEPLOY_TARGET in
  vercel)
    echo "🚀 Deploying to Vercel..."
    echo ""
    echo "Prerequisites:"
    echo "  - Vercel account (free)"
    echo "  - GitHub repository"
    echo ""
    
    if ! command -v vercel &> /dev/null; then
      echo "Installing Vercel CLI..."
      npm install -g vercel
    fi
    
    echo "Setting up Vercel Postgres..."
    echo "⚠️  After deployment:"
    echo "    1. Go to your project → Storage → Create Database → Postgres"
    echo "    2. Copy DATABASE_URL to Environment Variables"
    echo "    3. Run: vercel env pull"
    echo "    4. Run: npm run db:push"
    echo "    5. Run: npm run db:seed"
    echo ""
    
    vercel --prod
    
    echo "✅ Deployed to Vercel!"
    echo "⚠️  Don't forget to configure Vercel Postgres and run migrations!"
    ;;
    
  railway)
    echo "🚂 Deploying to Railway..."
    echo ""
    echo "Prerequisites:"
    echo "  - Railway account"
    echo "  - GitHub repository"
    echo ""
    
    if ! command -v railway &> /dev/null; then
      echo "Installing Railway CLI..."
      npm install -g @railway/cli
    fi
    
    echo "Logging into Railway..."
    railway login
    
    echo "Linking project..."
    railway link
    
    echo "Setting environment variables..."
    railway variables set DATABASE_URL="file:./prisma/dev.db"
    
    echo "Deploying..."
    railway up
    
    echo "✅ Deployed to Railway!"
    echo "⚠️  Configure persistent volume at: railway.app → Your Project → Volumes"
    echo "    Mount path: /app/prisma"
    ;;
    
  docker)
    echo "🐳 Building Docker containers..."
    echo ""
    
    # Check if .env exists
    if [ ! -f .env ]; then
      echo "⚠️  .env file not found. Creating from template..."
      cat > .env << EOF
DATABASE_URL="file:/app/prisma/dev.db"
ADMIN_PASSWORD=supercup2026
INTERNAL_API_KEY=supercup-internal-key
AUCTION_ID=1978
SYNC_INTERVAL_MS=10000
EOF
      echo "✅ Created .env file. Please update with production values!"
    fi
    
    echo "Building images..."
    docker-compose build
    
    echo "Setting up database..."
    docker-compose run --rm web npm run db:setup
    
    echo "Starting services..."
    docker-compose up -d
    
    echo "✅ Docker deployment complete!"
    echo ""
    echo "Services running:"
    docker-compose ps
    echo ""
    echo "View logs:"
    echo "  docker-compose logs -f web"
    echo "  docker-compose logs -f sync-daemon"
    ;;
    
  vps)
    echo "🖥️  VPS Deployment Guide"
    echo ""
    echo "Run these commands on your VPS:"
    echo ""
    echo "# 1. Install dependencies"
    echo "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "sudo apt-get install -y nodejs"
    echo "sudo npm install -g pm2"
    echo ""
    echo "# 2. Clone repository"
    echo "cd /var/www"
    echo "git clone YOUR_REPO_URL supercup"
    echo "cd supercup"
    echo ""
    echo "# 3. Install and build"
    echo "npm install"
    echo "npm run build"
    echo ""
    echo "# 4. Setup database"
    echo "npm run db:setup"
    echo ""
    echo "# 5. Start with PM2"
    echo "pm2 start ecosystem.config.js"
    echo "pm2 save"
    echo "pm2 startup"
    echo ""
    echo "# 6. Setup Nginx (optional)"
    echo "sudo apt-get install -y nginx certbot python3-certbot-nginx"
    echo "sudo nano /etc/nginx/sites-available/supercup"
    echo ""
    echo "See DEPLOYMENT.md for full Nginx configuration"
    ;;
    
  *)
    echo "Usage: ./deploy.sh [vercel|railway|docker|vps]"
    echo ""
    echo "Deployment Options:"
    echo "  vercel   - Deploy to Vercel (recommended, easiest)"
    echo "  railway  - Deploy to Railway (keeps SQLite)"
    echo "  docker   - Run with Docker Compose (local/VPS)"
    echo "  vps      - Show VPS deployment instructions"
    echo ""
    echo "For detailed instructions, see DEPLOYMENT.md"
    ;;
esac
