# 🏆 TVS Certified Super Cup - Marketing Dashboard

A Next.js application for managing the TVS Certified Dealer Super Cup campaign with real-time leaderboards, automatic Thursday auction syncing, and comprehensive points tracking.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/saiprash711/TVS-Supercup)

---

## 🚀 Features

### For Dealers
- 🔐 Secure dealer login with masked identity
- 📊 Real-time dashboard showing position and points
- 📈 Live leaderboard updates during auctions
- 📝 Complete activity history tracking
- 🏅 Rankings across all 4 Thursday matches

### For Admins
- 👨‍💼 Admin dashboard with password protection
- 📤 Export functionality for reports
- 📊 Complete campaign analytics
- 🔍 Activity monitoring and verification

### Automatic Features
- ⏰ **Automatic Thursday auction sync** (every 2 minutes)
- 🎯 Real-time points calculation (BUY: 10pts, SELL: 10pts, PARTICIPATION: 15pts)
- 📊 Automatic ranking updates
- 🔄 Cumulative scoring across all matches
- 🛡️ Duplicate activity prevention
- 🔒 Dealer name masking for privacy

---

## 🎯 Campaign Details

**TVS Certified Super Cup - October 2026**

- **Match #1**: Thursday, October 3, 2026 at 2:00 PM IST
- **Match #2**: Thursday, October 10, 2026 at 2:00 PM IST
- **Match #3**: Thursday, October 17, 2026 at 2:00 PM IST
- **Match #4**: Thursday, October 24, 2026 at 2:00 PM IST

**Participating Dealers**: 1,608 registered TVS dealers

**Point System**:
- Vehicle BUY: +10 points
- Vehicle SELL: +10 points
- Match Participation: +15 points

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16.3.4 with App Router
- **Database**: PostgreSQL (Vercel Postgres) / SQLite (local dev)
- **ORM**: Prisma
- **Styling**: CSS Modules
- **Deployment**: Vercel with Cron Jobs
- **TypeScript**: Full type safety

---

## 📦 Quick Start

### Prerequisites
- Node.js 20+ installed
- npm or yarn
- Vercel account (for deployment)

### Local Development

```bash
# Clone the repository
git clone https://github.com/saiprash711/TVS-Supercup.git
cd TVS-Supercup

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize database
npx prisma db push
npm run db:seed

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Test Login
- **Dealer Code**: `19479`
- **Password**: `tvs123`

---

## 🚀 Deploy to Vercel

### Easy Deployment (Recommended)

```powershell
# Run the automated deployment script
.\deploy-to-vercel.ps1
```

### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Post-Deployment Setup

1. **Create Vercel Postgres Database**
   - Go to Vercel Dashboard → Storage → Create Database → Postgres
   - Copy the `POSTGRES_PRISMA_URL`

2. **Set Environment Variables**
   ```bash
   vercel env add DATABASE_URL production
   vercel env add ADMIN_PASSWORD production
   vercel env add INTERNAL_API_KEY production
   vercel env add CRON_SECRET production
   ```

3. **Initialize Database**
   ```bash
   vercel env pull .env.local
   npx prisma db push
   npm run db:seed
   ```

📚 **See [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) for detailed instructions**

---

## 📋 Environment Variables

```env
# Database (Vercel Postgres connection string)
DATABASE_URL="postgresql://..."

# Admin password for /admin dashboard
ADMIN_PASSWORD="your-secure-password"

# Internal API key for webhook endpoints
INTERNAL_API_KEY="your-random-key"

# Cron secret for securing cron endpoint
CRON_SECRET="your-cron-secret"
```

---

## 🔄 How Automatic Thursday Syncing Works

### Every 2 Minutes (24/7):
1. Vercel Cron triggers `/api/internal/events`
2. Function checks for active campaigns
3. Detects today's live match (if Thursday)
4. Fetches auction data from TVS API
5. Validates and records new activities
6. Awards points based on rules
7. Updates dealer rankings
8. Returns execution statistics

### On Thursday at 2:00 PM IST:
- Auction starts on TVS platform
- Cron job captures activities every 2 minutes
- Points awarded in real-time
- Leaderboard updates automatically
- Dealers see their positions update live

**No manual intervention required!** ✨

---

## 📊 API Endpoints

### Public Endpoints
- `GET /` - Homepage with dealer login
- `GET /leaderboard` - Public leaderboard
- `POST /api/auth/login` - Dealer authentication
- `GET /api/leaderboard` - Leaderboard API

### Authenticated Endpoints
- `GET /dashboard` - Dealer dashboard (requires auth)
- `GET /api/me/dashboard` - Dealer stats API
- `GET /api/me/activities` - Dealer activity history

### Admin Endpoints
- `GET /admin` - Admin dashboard (password protected)
- `POST /api/admin/auth` - Admin authentication
- `GET /api/admin` - Admin data export

### Internal Endpoints
- `GET /api/internal/events` - Cron job handler (automatic sync)
- `POST /api/internal/events` - Manual event submission

---

## 📁 Project Structure

```
supercup/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Dealer dashboard
│   │   ├── leaderboard/       # Public leaderboard
│   │   └── admin/             # Admin panel
│   └── lib/
│       ├── services/          # Business logic
│       │   ├── points-engine.ts      # Point calculation
│       │   ├── ranking-engine.ts     # Ranking system
│       │   ├── tvs-integration.ts    # TVS API client
│       │   └── tvs-sync.ts           # Auction sync logic
│       ├── data/              # Static data (dealer mappings)
│       ├── auth.ts            # Authentication utilities
│       └── db.ts              # Prisma client
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data (dealers, campaign)
├── scripts/                   # Utility scripts
├── public/                    # Static assets
└── vercel.json                # Vercel configuration (cron jobs)
```

---

## 🧪 Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server

# Database
npm run db:push          # Push schema to database
npm run db:seed          # Seed database with data
npm run db:setup         # Push + seed
npm run db:studio        # Open Prisma Studio

# Verification
npm run verify           # Check deployment readiness
npm run sync:live        # Run live sync daemon (local)
```

---

## 📖 Documentation

- **[VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)** - Complete Vercel deployment guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Pre-deployment checklist
- **[QUICKSTART_VERCEL.md](./QUICKSTART_VERCEL.md)** - 10-minute deployment guide
- **[THURSDAY_AUCTION_FLOW.md](./THURSDAY_AUCTION_FLOW.md)** - How auctions work automatically
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Alternative deployment options

---

## 🔒 Security Features

- ✅ Dealer authentication with secure passwords
- ✅ Admin panel with password protection
- ✅ Dealer name masking in public views
- ✅ API key protection for internal endpoints
- ✅ Cron secret for webhook security
- ✅ Environment variable protection
- ✅ Input validation and sanitization

---

## 🐛 Troubleshooting

### Cron Job Not Running
- Check Vercel Dashboard → Settings → Cron Jobs
- Verify `CRON_SECRET` is set in environment variables
- Redeploy the application

### Database Connection Errors
- Ensure `DATABASE_URL` uses `POSTGRES_PRISMA_URL`
- Check connection pooling is enabled (`pgbouncer=true`)
- Verify database is created in Vercel

### No Activities Being Captured
- Check campaign status is `ACTIVE`
- Verify match has `auctionId` set
- Ensure match status is `LIVE` on Thursday
- Check logs: `vercel logs --follow`

### Dealers Can't Login
- Ensure database was seeded: `npm run db:seed`
- Check dealer exists in database: `npx prisma studio`
- Verify dealer status is `ACTIVE`
- Default password is `tvs123`

---

## 📊 Monitoring

### View Logs
```bash
# Stream live logs
vercel logs --follow

# View specific deployment logs
vercel logs [deployment-url]
```

### Check Database
```bash
# Open Prisma Studio
npx prisma studio
```

### Verify Cron Status
Vercel Dashboard → Your Project → Settings → Cron Jobs

---

## 🤝 Contributing

This is a private campaign application. For any issues or suggestions, please contact the development team.

---

## 📄 License

Proprietary - TVS Certified Super Cup 2026

---

## 🎉 Success Criteria

Your deployment is successful when:
- ✅ Homepage loads without errors
- ✅ Leaderboard displays correctly
- ✅ Dealers can log in
- ✅ Admin panel is accessible
- ✅ Cron job runs every 2 minutes
- ✅ Activities sync on Thursday
- ✅ Rankings update automatically

---

## 📞 Support

For deployment issues, see the troubleshooting section in [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)

---

**Built with ❤️ for TVS Certified Dealers**

🏆 **May the best dealer win the Super Cup!** 🏆
