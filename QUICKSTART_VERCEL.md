# 🚀 Quick Start - Deploy to Vercel in 10 Minutes

## Prerequisites
- Node.js installed ✅
- Vercel account (free at [vercel.com](https://vercel.com))

---

## Step 1: Deploy (2 minutes)

```powershell
cd "c:\Marketing Dashboard\supercup"

# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (choose preview first)
vercel
```

---

## Step 2: Create Database (3 minutes)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your project
3. Go to **Storage** tab
4. Click **Create Database** → **Postgres**
5. Name it: `supercup-db`
6. Choose region: **Mumbai** (or closest to you)
7. Click **Create**
8. Copy the **POSTGRES_PRISMA_URL**

---

## Step 3: Set Environment Variables (3 minutes)

```powershell
# Set DATABASE_URL (paste the POSTGRES_PRISMA_URL)
vercel env add DATABASE_URL production

# Set ADMIN_PASSWORD (choose a strong password)
vercel env add ADMIN_PASSWORD production

# Set INTERNAL_API_KEY (any random string)
vercel env add INTERNAL_API_KEY production

# Set CRON_SECRET (any random string)
vercel env add CRON_SECRET production
```

---

## Step 4: Initialize Database (2 minutes)

```powershell
# Pull environment variables
vercel env pull .env.local

# Push database schema
npx prisma generate
npx prisma db push

# Seed with dealers and campaign data
npm run db:seed
```

---

## Step 5: Deploy to Production (1 minute)

```powershell
vercel --prod
```

---

## ✅ Done! Verify It Works

### Visit Your URLs:

- Homepage: `https://your-project.vercel.app`
- Leaderboard: `https://your-project.vercel.app/leaderboard`
- Admin: `https://your-project.vercel.app/admin`

### Test Dealer Login:

- Dealer Code: `19479`
- Password: `tvs123`

### Check Cron Job:

Vercel Dashboard → Your Project → Settings → Cron Jobs

Should show active cron running every 2 minutes!

---

## 🎉 That's It!

Your application now:
- ✅ Runs on Vercel
- ✅ Uses production PostgreSQL database
- ✅ Automatically syncs Thursday auctions every 2 minutes
- ✅ Awards points in real-time
- ✅ Updates leaderboards automatically
- ✅ Works for all 4 Thursdays without manual intervention

---

## 📚 Need More Details?

See **VERCEL_DEPLOYMENT_GUIDE.md** for comprehensive instructions.

---

**Your Super Cup is live! 🏆**
