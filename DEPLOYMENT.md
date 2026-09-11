# TVS Certified Super Cup - Deployment Guide

## Overview

This guide will help you deploy the Super Cup application so it automatically handles weekly Thursday auctions (2 PM IST) without requiring manual intervention.

## Deployment Options

### Option 1: Vercel (Recommended - Easiest)

**Why Vercel?**
- Zero-config deployment for Next.js
- Automatic HTTPS
- Built-in CI/CD from GitHub
- Generous free tier
- Handles Thursday auctions automatically

**Steps:**

1. **Prepare the repository**
   ```bash
   cd supercup
   git init
   git add .
   git commit -m "Initial Super Cup deployment"
   ```

2. **Push to GitHub** (create a new repository first on github.com)
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/supercup.git
   git branch -M main
   git push -u origin main
   ```

3. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "Import Project"
   - Select your `supercup` repository
   - Configure environment variables:
     - `DATABASE_URL` - Use Vercel Postgres (see below)
     - `ADMIN_PASSWORD` - Your secure admin password
     - `INTERNAL_API_KEY` - Your secure API key
   - Click "Deploy"

4. **Set up Vercel Postgres**
   - In your project dashboard, go to "Storage"
   - Click "Create Database" → "Postgres"
   - Copy the `DATABASE_URL` connection string
   - Add it to your environment variables
   - Update your code to use the connection string

5. **Initial database setup**
   ```bash
   # Run locally first to set up schema
   npm run db:push
   npm run db:seed
   ```

6. **Set up automated sync for Thursday auctions**
   - Use Vercel Cron Jobs (add to `vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/internal/events",
      "schedule": "*/2 * * * *"
    }
  ]
}
```

**Pros:**
- ✅ Free for hobby projects
- ✅ Auto-scales
- ✅ No server management
- ✅ Built-in monitoring
- ✅ Handles Thursday auctions automatically

**Cons:**
- ⚠️ Serverless functions have 10s timeout on free tier (upgrade for longer)
- ⚠️ Need to replace SQLite with Postgres

---

### Option 2: Railway (Good for SQLite + Background Jobs)

**Why Railway?**
- Keeps your SQLite database
- Supports long-running background processes
- Great for the live-sync daemon

**Steps:**

1. **Prepare for deployment**
   ```bash
   cd supercup
   git init
   git add .
   git commit -m "Railway deployment"
   ```

2. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/supercup.git
   git push -u origin main
   ```

3. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects Next.js

4. **Configure environment variables**
   - In Railway dashboard, go to "Variables"
   - Add:
     - `DATABASE_URL=file:./prisma/dev.db`
     - `ADMIN_PASSWORD=your-secure-password`
     - `INTERNAL_API_KEY=your-secure-api-key`

5. **Add persistent volume for SQLite**
   - Click "Settings" → "Volumes"
   - Mount path: `/app/prisma`
   - This keeps your database across deployments

6. **Run database setup**
   ```bash
   railway run npm run db:setup
   ```

7. **Deploy the sync daemon** (separate service)
   - Add a new service in Railway
   - Use the same GitHub repo
   - Set custom start command: `npm run sync:live`
   - This runs continuously and syncs Thursday auctions

**Pros:**
- ✅ Keeps SQLite (no migration needed)
- ✅ Supports background processes
- ✅ $5/month starter plan
- ✅ Persistent storage included

**Cons:**
- ⚠️ Not free (but very affordable)
- ⚠️ Requires persistent storage setup

---

### Option 3: AWS EC2 / DigitalOcean Droplet (Full Control)

**Why VPS?**
- Complete control
- Run sync daemon 24/7
- Keep SQLite
- Production-ready

**Steps:**

1. **Provision a server**
   - AWS EC2: t3.small (2GB RAM)
   - DigitalOcean: Basic Droplet ($12/month)
   - Ubuntu 22.04 LTS

2. **SSH into server and install dependencies**
   ```bash
   ssh root@your-server-ip
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   apt-get install -y nodejs
   
   # Install PM2 for process management
   npm install -g pm2
   
   # Install Nginx for reverse proxy
   apt-get install -y nginx
   ```

3. **Clone and setup application**
   ```bash
   cd /var/www
   git clone https://github.com/YOUR_USERNAME/supercup.git
   cd supercup
   npm install
   ```

4. **Configure environment**
   ```bash
   nano .env
   ```
   Add:
   ```
   DATABASE_URL="file:./prisma/dev.db"
   ADMIN_PASSWORD=your-secure-password
   INTERNAL_API_KEY=your-secure-api-key
   NODE_ENV=production
   ```

5. **Build and setup database**
   ```bash
   npm run build
   npm run db:setup
   ```

6. **Start with PM2**
   ```bash
   # Start Next.js app
   pm2 start npm --name "supercup-web" -- start
   
   # Start sync daemon (for Thursday auctions)
   pm2 start npm --name "supercup-sync" -- run sync:live
   
   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

7. **Configure Nginx**
   ```bash
   nano /etc/nginx/sites-available/supercup
   ```
   
   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   ```bash
   ln -s /etc/nginx/sites-available/supercup /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

8. **Setup SSL with Let's Encrypt**
   ```bash
   apt-get install -y certbot python3-certbot-nginx
   certbot --nginx -d your-domain.com
   ```

**Pros:**
- ✅ Full control
- ✅ Runs 24/7 sync daemon
- ✅ Keeps SQLite
- ✅ Can handle high load

**Cons:**
- ⚠️ Requires server management
- ⚠️ Need to handle security updates
- ⚠️ More complex setup

---

## Handling Weekly Thursday Auctions

### Automatic Auction Detection

The system automatically handles new Thursday auctions through:

1. **Campaign Configuration** (Already set up)
   - Campaign runs from start_date to end_date
   - Match days defined for each Thursday at 2 PM
   - Each match has a unique `auctionId`

2. **Live Sync Daemon** (Runs continuously)
   - Polls TVS API every 10 seconds
   - Automatically detects new auction activities
   - Maps auction IDs to match days
   - Awards points in real-time

3. **No Manual Intervention Needed**
   - Sync daemon runs 24/7
   - Automatically picks up Thursday 2 PM auctions
   - Validates activities against campaign window
   - Updates leaderboard in real-time

### Adding New Thursday Auctions

If you need to add a new Thursday auction to the schedule:

```bash
# Run this script before the auction starts
npm run db:studio
```

Then in Prisma Studio:
1. Go to `MatchDay` table
2. Add new row:
   - `campaignId`: 1 (your Super Cup campaign)
   - `matchNumber`: 5 (next match number)
   - `auctionId`: "NEW_AUCTION_ID" (get from TVS)
   - `scheduledDate`: "2026-10-29T14:00:00+05:30" (next Thursday 2 PM IST)
   - `status`: "UPCOMING"

The sync daemon will automatically start tracking it!

---

## Production Checklist

### Before Going Live:

- [ ] Update `ADMIN_PASSWORD` to strong password
- [ ] Update `INTERNAL_API_KEY` to secure random string
- [ ] Change `DATABASE_URL` for production (if using Postgres)
- [ ] Test all Thursday match days are configured
- [ ] Verify dealer masking works (no full names exposed)
- [ ] Test sync daemon connects to TVS API
- [ ] Setup monitoring/alerts
- [ ] Configure backup strategy for database
- [ ] Test leaderboard updates in real-time
- [ ] Verify dealer authentication works
- [ ] Test admin dashboard access

### Monitoring Thursday Auctions:

```bash
# Check sync daemon logs
pm2 logs supercup-sync

# Check web app logs
pm2 logs supercup-web

# Monitor database size
du -sh prisma/dev.db

# Check current leaderboard
curl https://your-domain.com/api/leaderboard
```

---

## Recommended: Vercel + Railway Hybrid

For the best of both worlds:

1. **Vercel** - Host the web application (frontend + API routes)
2. **Railway** - Run the sync daemon (background job)
3. **Vercel Postgres** - Shared database

Both services connect to the same Postgres database, giving you:
- ✅ Fast, auto-scaling frontend
- ✅ 24/7 background sync
- ✅ Managed database
- ✅ No server management

---

## Database Backup Strategy

### For SQLite (Railway/VPS):
```bash
# Add to crontab for daily backups
0 2 * * * cp /var/www/supercup/prisma/dev.db /backups/dev-$(date +\%Y\%m\%d).db
```

### For Postgres (Vercel):
Vercel Postgres includes automatic backups. No action needed!

---

## Troubleshooting

### Sync daemon not capturing activities:
```bash
# Check if daemon is running
pm2 status

# Check logs for errors
pm2 logs supercup-sync --lines 100

# Restart daemon
pm2 restart supercup-sync
```

### Thursday auction not showing up:
1. Verify match day is configured in database
2. Check `auctionId` matches TVS system
3. Verify campaign is ACTIVE status
4. Check sync daemon logs for errors

### Leaderboard not updating:
1. Check if sync daemon is running
2. Verify database connection
3. Check if activities are being recorded
4. Verify ranking engine is triggered

---

## Support & Maintenance

### Weekly Tasks:
- Monitor sync daemon health
- Check database size
- Review error logs
- Verify Thursday auction started correctly

### Monthly Tasks:
- Review dealer activity patterns
- Check for duplicate transactions
- Verify point calculations
- Export audit reports

---

## Questions?

For deployment issues, check:
- Logs: `pm2 logs` or Vercel/Railway logs
- Database: `npm run db:studio`
- Verification: `npm run verify`
