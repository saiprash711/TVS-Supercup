# Pre-Deployment Checklist for Vercel

## ✅ Configuration Files Ready

- [x] `prisma/schema.prisma` - Updated to use PostgreSQL
- [x] `vercel.json` - Configured with cron job (every 2 minutes)
- [x] `.vercelignore` - Excludes unnecessary files
- [x] `src/app/api/internal/events/route.ts` - Serverless cron handler
- [x] Build tested successfully

## 📋 Pre-Deployment Steps

### 1. Install Vercel CLI (if not installed)

```powershell
npm install -g vercel
```

### 2. Login to Vercel

```powershell
vercel login
```

### 3. Deploy Using the Script

**Easy way:**
```powershell
.\deploy-to-vercel.ps1
```

**Manual way:**
```powershell
# Preview deployment (recommended first)
vercel

# Production deployment
vercel --prod
```

## 🗄️ Database Setup (After First Deployment)

### 1. Create Vercel Postgres Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Storage** → **Create Database** → **Postgres**
4. Name: `supercup-db`
5. Region: Choose closest to users (e.g., Mumbai for India)
6. Click **Create**

### 2. Get Database Connection String

From the database dashboard, copy the **POSTGRES_PRISMA_URL**

Example:
```
postgresql://user:pass@aws-0-region.postgres.vercel-storage.com/verceldb?pgbouncer=true&connect_timeout=15
```

## 🔐 Environment Variables Setup

### Set these in Vercel (required):

```powershell
# Set DATABASE_URL
vercel env add DATABASE_URL production
# Paste the POSTGRES_PRISMA_URL when prompted

# Set ADMIN_PASSWORD (use a strong password!)
vercel env add ADMIN_PASSWORD production
# Example: SuperCup2026!Secure#Admin

# Set INTERNAL_API_KEY (random secure key)
vercel env add INTERNAL_API_KEY production
# Example: sc-2026-internal-xyz789abc123

# Set CRON_SECRET (for cron job security)
vercel env add CRON_SECRET production
# Example: cron-secret-random-xyz789
```

### Also add for preview environments:

```powershell
vercel env add DATABASE_URL preview
vercel env add ADMIN_PASSWORD preview
vercel env add INTERNAL_API_KEY preview
vercel env add CRON_SECRET preview
```

## 🗃️ Initialize Database

### Pull environment variables locally:

```powershell
vercel env pull .env.local
```

### Push schema to database:

```powershell
npx prisma generate
npx prisma db push
```

### Seed the database:

```powershell
npm run db:seed
```

This creates:
- ✅ 1,608 registered dealers
- ✅ Super Cup campaign (October 2026)
- ✅ 4 Match days (Thursdays at 2 PM IST)
- ✅ Point rules (BUY: 10pts, SELL: 10pts, PARTICIPATION: 15pts)

## 🎯 Verify Deployment

### 1. Check Cron Job

Visit: Vercel Dashboard → Your Project → Settings → Cron Jobs

Should see:
- **Path**: `/api/internal/events`
- **Schedule**: `*/2 * * * *`
- **Status**: Active ✅

### 2. Test Endpoints

```powershell
$PROD_URL = "https://your-project.vercel.app"

# Test homepage
curl $PROD_URL

# Test leaderboard
curl "$PROD_URL/api/leaderboard"

# Test cron endpoint (requires CRON_SECRET)
curl -X GET "$PROD_URL/api/internal/events" `
  -H "Authorization: Bearer your-cron-secret"
```

### 3. Test Dealer Login

1. Go to: `https://your-project.vercel.app`
2. Enter dealer code: `19479`
3. Enter password: `tvs123`
4. Should redirect to dashboard ✅

### 4. Test Admin Access

1. Go to: `https://your-project.vercel.app/admin`
2. Enter your ADMIN_PASSWORD
3. Should see admin dashboard ✅

## 📊 Monitoring

### View Logs:

```powershell
vercel logs --follow
```

### View Cron Executions:

1. Vercel Dashboard → Your Project
2. Click **Logs** tab
3. Filter by: `/api/internal/events`
4. Should see executions every 2 minutes

### Check Database:

```powershell
npx prisma studio
```

## 🔧 Match Day Configuration

### Verify Match Days are Set Up:

Open Prisma Studio: `npx prisma studio`

Check `MatchDay` table has:
- Match #1: October 3, 2026, 2:00 PM IST, auction ID: `1978`
- Match #2: October 10, 2026, 2:00 PM IST, auction ID: TBD
- Match #3: October 17, 2026, 2:00 PM IST, auction ID: TBD
- Match #4: October 24, 2026, 2:00 PM IST, auction ID: TBD

### Update Auction IDs if Needed:

```sql
UPDATE "match_days" 
SET auction_id = '1978', status = 'LIVE'
WHERE match_number = 1;
```

## 🚀 Go Live Steps

1. ✅ Deploy to production: `vercel --prod`
2. ✅ Create Vercel Postgres database
3. ✅ Set all environment variables
4. ✅ Initialize database schema
5. ✅ Seed database with dealers and campaign
6. ✅ Verify cron job is active
7. ✅ Test dealer login
8. ✅ Test admin access
9. ✅ Monitor logs for first cron execution
10. ✅ Update match days with correct auction IDs

## ✨ What Happens Automatically

### Every 2 Minutes (24/7):
- Cron job triggers `/api/internal/events`
- Checks for active campaign
- Finds today's live match (if Thursday)
- Syncs auction data from TVS API
- Awards points for new activities
- Updates dealer rankings
- Returns execution statistics

### On Thursday at 2:00 PM IST:
- Auction starts on TVS platform
- Dealers begin bidding
- Cron job detects new activities
- Points are awarded in real-time
- Leaderboard updates automatically
- Dealers see their positions update

### No Manual Work Required:
- ✅ Automatic auction detection
- ✅ Real-time activity sync
- ✅ Automatic point calculation
- ✅ Automatic ranking updates
- ✅ Works for all 4 Thursdays
- ✅ Cumulative scoring across matches

## 📞 Support

### If something goes wrong:

1. **Check logs**: `vercel logs --follow`
2. **Check environment variables**: Vercel Dashboard → Settings → Environment Variables
3. **Check database connection**: `npx prisma studio`
4. **Check cron status**: Vercel Dashboard → Settings → Cron Jobs
5. **Review guide**: `VERCEL_DEPLOYMENT_GUIDE.md`

### Common Issues:

| Issue | Solution |
|-------|----------|
| Cron not running | Verify CRON_SECRET is set, redeploy |
| Database errors | Check DATABASE_URL uses POSTGRES_PRISMA_URL |
| No activities captured | Verify match status is LIVE, check auction ID |
| Dealers can't login | Ensure database was seeded |
| Build fails | Run `npm run build` locally first |

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ Homepage loads without errors
- ✅ Leaderboard displays (empty at first)
- ✅ Dealers can log in with their codes
- ✅ Admin panel is accessible
- ✅ Cron job shows in Vercel dashboard
- ✅ Logs show sync attempts every 2 minutes
- ✅ Database contains seeded data
- ✅ No console errors in browser

## 📝 Post-Deployment

### Share with stakeholders:

**Production URL**: `https://your-project.vercel.app`

**Access Information**:
- Dealers: Use their dealer code + password `tvs123`
- Admin: Use admin panel at `/admin` with ADMIN_PASSWORD

**Campaign Schedule**:
- Match #1: Thursday, October 3, 2026, 2:00 PM IST
- Match #2: Thursday, October 10, 2026, 2:00 PM IST
- Match #3: Thursday, October 17, 2026, 2:00 PM IST
- Match #4: Thursday, October 24, 2026, 2:00 PM IST

---

**Everything is ready! Follow the steps above to deploy to Vercel with automatic Thursday auction processing.** 🚀
