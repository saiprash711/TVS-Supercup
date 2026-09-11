# 🚀 Deploy to Vercel RIGHT NOW - Step by Step

Vercel CLI is now installed! Follow these steps to deploy your application:

---

## Step 1: Login to Vercel

Open your terminal and run:

```powershell
cd "c:\Marketing Dashboard\supercup"
vercel login
```

This will:
- Open your browser
- Ask you to authenticate with Vercel
- Connect your terminal to your Vercel account

**Choose your login method:**
- GitHub (recommended if you have a GitHub account)
- GitLab
- Bitbucket
- Email

---

## Step 2: Deploy to Vercel (Preview First)

After logging in, run:

```powershell
vercel
```

**Answer the prompts:**

1. **Set up and deploy?** → Press `Y` (Yes)
2. **Which scope?** → Select your account
3. **Link to existing project?** → Press `N` (No)
4. **What's your project's name?** → `tvs-super-cup` (or press Enter for default)
5. **In which directory is your code located?** → `.` (press Enter)
6. **Want to modify settings?** → Press `N` (No)

Vercel will now:
- ✅ Upload your code
- ✅ Install dependencies
- ✅ Build your Next.js app
- ✅ Deploy to a preview URL

**You'll get a URL like:** `https://tvs-super-cup-abc123.vercel.app`

---

## Step 3: Create PostgreSQL Database

1. Go to **https://vercel.com/dashboard**
2. Click on your project (`tvs-super-cup`)
3. Go to **Storage** tab
4. Click **Create Database**
5. Select **Postgres**
6. Name: `supercup-db`
7. Region: **Mumbai** (or closest to India)
8. Click **Create**

**Copy the connection string:**
- Go to the database you just created
- Click on **.env.local** tab
- Copy the **POSTGRES_PRISMA_URL** value

Example:
```
postgres://default:xxx@xxx-pooler.aws-0.us-east-1.postgres.vercel-storage.com/verceldb?pgbouncer=true&connect_timeout=15
```

---

## Step 4: Set Environment Variables

Run these commands one by one:

### 4.1 Set DATABASE_URL

```powershell
vercel env add DATABASE_URL production
```

When prompted, **paste the POSTGRES_PRISMA_URL** you copied above.

### 4.2 Set ADMIN_PASSWORD

```powershell
vercel env add ADMIN_PASSWORD production
```

Enter a **strong password** (e.g., `SuperCup2026!Admin#Secure`)

### 4.3 Set INTERNAL_API_KEY

```powershell
vercel env add INTERNAL_API_KEY production
```

Enter a **random secure key** (e.g., `sc-2026-internal-xyz789abc123`)

### 4.4 Set CRON_SECRET

```powershell
vercel env add CRON_SECRET production
```

Enter a **random secret** (e.g., `cron-secret-random-xyz789`)

---

## Step 5: Initialize Database

### 5.1 Pull environment variables locally

```powershell
vercel env pull .env.local
```

### 5.2 Generate Prisma client

```powershell
npx prisma generate
```

### 5.3 Push database schema

```powershell
npx prisma db push
```

### 5.4 Seed the database

```powershell
npm run db:seed
```

This will create:
- ✅ 1,608 registered dealers
- ✅ Super Cup campaign (Sept-Oct 2026)
- ✅ 8 Match days (all Thursdays including Sept 17)
- ✅ Point rules (BUY: 10, SELL: 10, PARTICIPATION: 15)

---

## Step 6: Deploy to Production

```powershell
vercel --prod
```

This deploys your application to the **production URL**.

You'll get a URL like: `https://tvs-super-cup.vercel.app`

---

## Step 7: Verify Cron Job is Active

1. Go to **https://vercel.com/dashboard**
2. Click on your project
3. Go to **Settings** → **Cron Jobs**
4. Verify you see:
   - ✅ Path: `/api/internal/events`
   - ✅ Schedule: `*/2 * * * *` (every 2 minutes)
   - ✅ Status: **Active**

---

## Step 8: Test Your Application

### 8.1 Visit Homepage

Go to: `https://your-project.vercel.app`

You should see the TVS Super Cup login page.

### 8.2 Test Dealer Login

- **Dealer Code:** `19479`
- **Password:** `tvs123`

You should be redirected to the dealer dashboard.

### 8.3 View Leaderboard

Go to: `https://your-project.vercel.app/leaderboard`

You should see the leaderboard (all dealers at 0 points initially).

### 8.4 Test Admin Access

Go to: `https://your-project.vercel.app/admin`

Enter the **ADMIN_PASSWORD** you set earlier.

You should see the admin dashboard.

### 8.5 Test Cron Endpoint (Optional)

```powershell
$PROD_URL = "https://your-project.vercel.app"
$CRON_SECRET = "your-cron-secret"

curl -X GET "$PROD_URL/api/internal/events" `
  -H "Authorization: Bearer $CRON_SECRET"
```

You should get a JSON response with sync statistics.

---

## ✅ Success! Your Application is Live

Your TVS Super Cup application is now:

- ✅ Deployed to Vercel
- ✅ Connected to PostgreSQL database
- ✅ Seeded with 1,608 dealers
- ✅ Configured with 8 Thursday matches
- ✅ Cron job running every 2 minutes
- ✅ Ready for September 17, 2026 and all future Thursdays

---

## 🎯 What Happens Automatically

### Every 2 Minutes (24/7):
- Cron job triggers `/api/internal/events`
- Checks for active campaigns
- Detects today's live match (if Thursday)
- Syncs auction data from TVS API
- Awards points for activities
- Updates dealer rankings

### On Thursday at 2:00 PM IST:
- Auction goes live on TVS platform
- Cron detects the live match
- Activities sync every 2 minutes
- Dealers see real-time updates
- Leaderboard automatically updates

### Works for ALL Thursdays:
- ✅ September 10, 2026
- ✅ **September 17, 2026** ← Your date!
- ✅ September 24, 2026
- ✅ October 1, 2026
- ✅ October 8, 2026
- ✅ October 15, 2026
- ✅ October 22, 2026
- ✅ October 29, 2026

**No manual intervention needed!** 🎉

---

## 📊 Monitor Your Deployment

### View Logs

```powershell
vercel logs --follow
```

### View Cron Executions

1. Vercel Dashboard → Your Project
2. **Logs** tab
3. Filter by: `/api/internal/events`
4. See executions every 2 minutes

### Check Database

```powershell
npx prisma studio
```

Opens a web interface to view:
- Dealers
- Campaigns
- Match Days
- Activities
- Scores

---

## 🆘 Troubleshooting

### Issue: Can't login to Vercel
**Solution:** Make sure you have a Vercel account at https://vercel.com/signup

### Issue: Build fails
**Solution:** Run `npm run build` locally first to check for errors

### Issue: Database connection error
**Solution:** Make sure you copied the `POSTGRES_PRISMA_URL` not `POSTGRES_URL`

### Issue: Cron job not visible
**Solution:** Redeploy with `vercel --prod`

### Issue: Dealers can't login
**Solution:** Make sure you ran `npm run db:seed` after setting up the database

---

## 📞 Quick Commands Reference

```powershell
# Login
vercel login

# Deploy preview
vercel

# Deploy production
vercel --prod

# Add environment variable
vercel env add VARIABLE_NAME production

# Pull environment variables
vercel env pull .env.local

# View logs
vercel logs --follow

# Build locally
npm run build

# Initialize database
npx prisma db push
npm run db:seed

# View database
npx prisma studio
```

---

## 🎉 You're Done!

Your application is **LIVE** and will automatically handle all Thursday auctions including **September 17, 2026**!

**Your Production URL:** https://your-project.vercel.app

Share this URL with dealers and stakeholders! 🚀🏆
