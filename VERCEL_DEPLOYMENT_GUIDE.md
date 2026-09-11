# TVS Certified Super Cup - Vercel Deployment Guide

## 🚀 Deploy to Vercel with CLI - Complete Guide

This guide will walk you through deploying the Super Cup application to Vercel with automatic Thursday auction processing.

---

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally
   ```powershell
   npm install -g vercel
   ```
3. **Vercel Login**: Authenticate
   ```powershell
   vercel login
   ```

---

## Step 1: Initialize Git Repository (if not already done)

```powershell
cd "c:\Marketing Dashboard\supercup"

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - TVS Super Cup application"
```

---

## Step 2: Deploy to Vercel

### Option A: Interactive Deployment (Recommended for First Time)

```powershell
# Navigate to project directory
cd "c:\Marketing Dashboard\supercup"

# Start deployment
vercel
```

When prompted, answer:
- **Set up and deploy?** → `Y` (Yes)
- **Which scope?** → Select your account
- **Link to existing project?** → `N` (No)
- **Project name?** → `tvs-super-cup` (or your preferred name)
- **In which directory is your code located?** → `.` (current directory)
- **Want to modify settings?** → `N` (No, settings are in vercel.json)

The CLI will:
1. Upload your code
2. Install dependencies
3. Build the Next.js application
4. Deploy to a preview URL

### Option B: One-Command Deployment

```powershell
vercel --name tvs-super-cup --yes
```

---

## Step 3: Set Up Vercel Postgres Database

### Create Database via Vercel Dashboard:

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project (`tvs-super-cup`)
3. Go to **Storage** tab
4. Click **Create Database**
5. Select **Postgres**
6. Choose a name: `supercup-db`
7. Select region: **Choose closest to your users** (e.g., Mumbai for India)
8. Click **Create**

### Link Database to Project:

Vercel automatically creates these environment variables:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL` ← **Use this one**
- `POSTGRES_URL_NON_POOLING`

---

## Step 4: Configure Environment Variables

### Set Required Environment Variables:

```powershell
# Set DATABASE_URL (use Prisma connection string)
vercel env add DATABASE_URL production

# When prompted, paste the POSTGRES_PRISMA_URL from your database settings
# Example: postgresql://user:pass@aws-0-region.postgres.vercel-storage.com/verceldb?pgbouncer=true&connect_timeout=15

# Set ADMIN_PASSWORD
vercel env add ADMIN_PASSWORD production
# When prompted, enter a strong password (e.g., SuperCup2026!Secure)

# Set INTERNAL_API_KEY
vercel env add INTERNAL_API_KEY production
# When prompted, enter a random secure key (e.g., sc-2026-internal-abc123xyz)

# Set CRON_SECRET (for securing cron endpoint)
vercel env add CRON_SECRET production
# When prompted, enter a random secret (e.g., cron-secret-xyz789)
```

### Also Set for Preview & Development:

```powershell
# For preview deployments
vercel env add DATABASE_URL preview
vercel env add ADMIN_PASSWORD preview
vercel env add INTERNAL_API_KEY preview
vercel env add CRON_SECRET preview

# For local development (optional)
vercel env add DATABASE_URL development
vercel env add ADMIN_PASSWORD development
vercel env add INTERNAL_API_KEY development
vercel env add CRON_SECRET development
```

---

## Step 5: Initialize Database Schema

### Pull Environment Variables Locally:

```powershell
vercel env pull .env.local
```

### Generate Prisma Client:

```powershell
npx prisma generate
```

### Push Schema to Production Database:

```powershell
# Update .env.local to use production DATABASE_URL
# Then run:
npx prisma db push
```

### Seed the Database:

```powershell
npm run db:seed
```

This will create:
- All registered dealers (1,608 dealers)
- Super Cup campaign (October 2026)
- 4 Match days (Thursdays at 2 PM IST)
- Point rules (BUY: 10pts, SELL: 10pts, PARTICIPATION: 15pts)

---

## Step 6: Deploy to Production

```powershell
# Deploy to production
vercel --prod
```

Your application is now live! 🎉

---

## Step 7: Verify Cron Job is Working

### Check Cron Configuration:

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** → **Cron Jobs**
4. Verify you see:
   - **Path**: `/api/internal/events`
   - **Schedule**: `*/2 * * * *` (every 2 minutes)
   - **Status**: Active

### Test Cron Endpoint Manually:

```powershell
# Get your production URL (e.g., https://tvs-super-cup.vercel.app)
$PROD_URL = "https://your-project.vercel.app"
$CRON_SECRET = "your-cron-secret"

# Test the cron endpoint
curl -X GET "$PROD_URL/api/internal/events" `
  -H "Authorization: Bearer $CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "timestamp": "2026-10-03T08:30:00.000Z",
  "campaign": "TVS Certified Super Cup - October 2026",
  "match": {
    "number": 1,
    "auctionId": "1978",
    "status": "LIVE"
  },
  "sync": {
    "processed": 15,
    "pointsAwarded": 150,
    "executionTimeMs": 1234
  },
  "stats": {
    "bids": 45,
    "buys": 8,
    "participation": 25,
    "watchlist": 12
  }
}
```

---

## Step 8: Access Your Application

### Main URLs:

- **Homepage**: `https://your-project.vercel.app`
- **Dealer Dashboard**: `https://your-project.vercel.app/dashboard`
- **Leaderboard**: `https://your-project.vercel.app/leaderboard`
- **Admin Panel**: `https://your-project.vercel.app/admin`

### Test Dealer Login:

1. Go to homepage
2. Enter dealer code: `19479` (example)
3. Enter password: `tvs123` (default)
4. You should see the dealer dashboard

### Test Admin Access:

1. Go to `/admin`
2. Enter the `ADMIN_PASSWORD` you set
3. You should see the admin dashboard with export options

---

## How Thursday Auctions Work Automatically

### The Automatic Flow:

```
Every 2 minutes (24/7):
  ↓
Vercel Cron triggers GET /api/internal/events
  ↓
Function checks for active campaign
  ↓
Finds today's match (if Thursday and LIVE status)
  ↓
Calls TVS API to fetch latest auction data
  ↓
Validates and records new activities
  ↓
Awards points (BUY: 10, SELL: 10, PARTICIPATION: 15)
  ↓
Updates dealer rankings
  ↓
Returns statistics
```

### On Thursday at 2:00 PM IST:

1. **Before auction**: Cron runs but finds no activities
2. **Auction starts**: Dealers begin bidding on TVS platform
3. **Cron detects**: New bids, buys, and participation appear
4. **Real-time sync**: Every 2 minutes, new activities are captured
5. **Leaderboard updates**: Rankings automatically recalculate
6. **Dealers see**: Updated positions on their dashboards
7. **After auction**: Cron continues running, ready for next Thursday

### No Manual Intervention Required:

- ✅ Automatically detects live auctions
- ✅ Syncs activities in real-time
- ✅ Awards points based on rules
- ✅ Updates rankings
- ✅ Works for all 4 Thursdays
- ✅ Accumulates points across matches

---

## Monitoring and Maintenance

### View Deployment Logs:

```powershell
vercel logs https://your-project.vercel.app --follow
```

### View Cron Job Logs:

1. Go to Vercel Dashboard → Your Project
2. Click on **Logs** tab
3. Filter by function: `/api/internal/events`
4. You'll see sync activity every 2 minutes

### Check Database:

```powershell
# Pull production env vars
vercel env pull .env.local

# Open Prisma Studio
npx prisma studio
```

This opens a web interface to view:
- Dealers
- Campaigns
- Match Days
- Activities
- Scores
- Rankings

---

## Troubleshooting

### Issue: Cron not running

**Solution:**
1. Check Settings → Cron Jobs in Vercel dashboard
2. Ensure `CRON_SECRET` is set in environment variables
3. Redeploy: `vercel --prod`

### Issue: Database connection errors

**Solution:**
1. Verify `DATABASE_URL` is set correctly
2. Use `POSTGRES_PRISMA_URL` not `POSTGRES_URL`
3. Check connection pooling is enabled (`pgbouncer=true`)

### Issue: No activities being captured

**Solution:**
1. Check if campaign status is `ACTIVE`
2. Verify match day has `auctionId` set
3. Check match status is `LIVE` on Thursday
4. View logs: `vercel logs`

### Issue: Dealers can't log in

**Solution:**
1. Ensure database was seeded
2. Check dealer exists: `npx prisma studio`
3. Verify dealer status is `ACTIVE`
4. Default password is `tvs123`

---

## Updating Match Days for New Thursdays

If you need to add more Thursdays or update auction IDs:

### Via Prisma Studio:

```powershell
npx prisma studio
```

1. Open `MatchDay` table
2. Edit existing matches or add new ones
3. Set `auctionId` to the TVS auction ID
4. Set `date` to Thursday 2:00 PM IST
5. Set `status` to `UPCOMING`

### Via SQL:

```sql
-- Update auction ID for Match #1
UPDATE "match_days" 
SET auction_id = '1978', status = 'LIVE'
WHERE match_number = 1;

-- Add a new Thursday match
INSERT INTO "match_days" (campaign_id, match_number, auction_id, date, status)
VALUES (1, 5, '1979', '2026-11-05 14:00:00+05:30', 'UPCOMING');
```

---

## Scaling and Performance

### Current Configuration:

- **Cron Frequency**: Every 2 minutes
- **Function Timeout**: 60 seconds
- **Database**: Vercel Postgres (pooled connections)
- **Expected Load**: 100+ dealers, 200-300 activities per auction

### If You Need More Frequency:

Change cron schedule in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/internal/events",
      "schedule": "* * * * *"  // Every 1 minute
    }
  ]
}
```

Then redeploy: `vercel --prod`

### If You Need Longer Execution:

Upgrade to Vercel Pro plan for:
- 5 minute function timeout
- More frequent cron jobs
- Advanced analytics

---

## Cost Estimate

### Vercel Free Tier (Hobby):

- ✅ **100 GB bandwidth/month**: More than enough
- ✅ **Unlimited deployments**: Perfect for updates
- ✅ **Cron jobs**: 2x/minute = ~90K invocations/month
- ✅ **Function executions**: ~100K/month included
- ⚠️ **60s timeout**: Should be sufficient

### Vercel Postgres:

- ✅ **Free tier**: 256 MB storage, 60 hours compute/month
- ⚠️ **May need upgrade**: ~$20/month for production usage

### Estimated Total Cost:

- **Hobby project**: $0/month (if within limits)
- **Production**: ~$20-40/month with Postgres upgrade

---

## Security Checklist

- [x] `ADMIN_PASSWORD` is strong and secure
- [x] `INTERNAL_API_KEY` is random and not exposed
- [x] `CRON_SECRET` protects the cron endpoint
- [x] Database uses connection pooling
- [x] Dealer names are masked in public views
- [x] Authentication required for dealer dashboards
- [x] Admin panel requires password
- [x] Environment variables not committed to git

---

## Quick Reference Commands

```powershell
# Deploy to production
vercel --prod

# View logs
vercel logs --follow

# Add environment variable
vercel env add VARIABLE_NAME production

# Pull environment variables
vercel env pull .env.local

# Remove deployment
vercel remove project-name

# Check project info
vercel project ls

# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Open database UI
npx prisma studio
```

---

## Support

### Vercel Documentation:
- [Vercel CLI](https://vercel.com/docs/cli)
- [Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)

### Project Documentation:
- `README.md` - Project overview
- `DEPLOYMENT.md` - Alternative deployment options
- `THURSDAY_AUCTION_FLOW.md` - How auctions work

---

## Success! 🎉

Your Super Cup application is now:
- ✅ Deployed to Vercel
- ✅ Using production PostgreSQL database
- ✅ Automatically syncing Thursday auctions every 2 minutes
- ✅ Updating leaderboards in real-time
- ✅ Accessible to all dealers
- ✅ Ready for October 2026 campaign

**No manual intervention needed on Thursdays - everything runs automatically!**
