# Super Cup - Quick Start Deployment

## 🚀 Fastest Way to Deploy (5 minutes)

### Option 1: Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   cd supercup
   git init
   git add .
   git commit -m "Deploy Super Cup"
   git remote add origin https://github.com/YOUR_USERNAME/supercup.git
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Click "Deploy" (no configuration needed!)

3. **Setup Database** (after first deploy)
   - Project Dashboard → Storage → Create → Postgres
   - Copy `DATABASE_URL` → Environment Variables
   - In your terminal:
     ```bash
     npx vercel env pull
     npm run db:push
     npm run db:seed
     ```

4. **Done!** 
   - Your app is live at `https://your-project.vercel.app`
   - Thursday auctions will work automatically via cron jobs

---

### Option 2: Docker (Run Anywhere)

1. **Start Everything**
   ```bash
   cd supercup
   docker-compose up -d
   ```

2. **Setup Database**
   ```bash
   docker-compose exec web npm run db:setup
   ```

3. **Done!**
   - Web app: http://localhost:3000
   - Sync daemon running in background
   - Database persisted in `./prisma/`

---

## 🔧 Environment Variables

Create `.env.production` with:

```env
# Required
DATABASE_URL="your-database-connection-string"
ADMIN_PASSWORD="your-secure-password"
INTERNAL_API_KEY="your-secure-api-key"

# Optional
AUCTION_ID="1978"
SYNC_INTERVAL_MS="10000"
```

---

## 📅 Thursday Auctions - Automatic!

The system automatically handles weekly Thursday auctions:

✅ **No manual intervention needed**
- Sync daemon runs 24/7
- Detects new auction activities
- Updates leaderboard in real-time
- Awards points automatically

✅ **Works for all upcoming Thursdays**
- Pre-configured in database (`MatchDay` table)
- Maps auction IDs to matches
- Validates against campaign dates

### Adding a New Thursday Auction

Only needed if TVS creates a new auction ID:

```bash
npm run db:studio
```

Then add a new `MatchDay` record:
- Campaign: Super Cup 2026
- Auction ID: (from TVS)
- Date: Next Thursday 2 PM IST
- Status: UPCOMING

---

## 🔍 Verify Deployment

```bash
# Check if sync is working
npm run verify

# View logs (Docker)
docker-compose logs -f

# View logs (Vercel)
vercel logs

# Test API
curl https://your-app.com/api/leaderboard
```

---

## ⚠️ Production Checklist

Before going live:

- [ ] Change `ADMIN_PASSWORD` to strong password
- [ ] Change `INTERNAL_API_KEY` to random secure string  
- [ ] Verify all Thursday matches configured
- [ ] Test leaderboard updates
- [ ] Test dealer authentication
- [ ] Setup database backups
- [ ] Configure monitoring

---

## 🆘 Troubleshooting

**Leaderboard not updating?**
- Check sync daemon is running
- Check logs for errors
- Verify auction ID is correct

**Database connection error?**
- Verify `DATABASE_URL` is set
- Check database is accessible
- Run `npm run db:push` to sync schema

**Thursday auction not detected?**
- Check `MatchDay` table has entry
- Verify `auctionId` matches TVS
- Check campaign is ACTIVE status

---

## 📚 Full Documentation

For detailed deployment options, see [DEPLOYMENT.md](./DEPLOYMENT.md)

For system architecture, see [README.md](./README.md)
