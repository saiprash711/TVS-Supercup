# TVS Certified Dealer Super Cup

A real-time dealer engagement and loyalty platform for TVS Certified's October 2026 Super Cup campaign.

## 🎯 What This Does

This application turns TVS Certified auction activities into a competitive leaderboard where dealers earn points for:
- **Buy transactions** (+10 points)
- **Sell transactions** (+10 points)  
- **Match participation** (+15 points)
- **All 4 matches bonus** (+20 points)

**Key Features:**
- ✅ Real-time leaderboard with masked dealer names (privacy)
- ✅ Personal dealer dashboard with rank, points, and activities
- ✅ Admin dashboard for monitoring and management
- ✅ **Automatic Thursday auction synchronization** (no manual work!)
- ✅ Duplicate prevention and audit trails
- ✅ Configurable point rules

---

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Setup database
npm run db:setup

# Start development server
npm run dev

# Start live sync daemon (in another terminal)
npm run sync:live
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📦 Deployment (Choose One)

### Option 1: Vercel (Recommended - 5 minutes, Free)
```bash
.\deploy.ps1 vercel
```

### Option 2: Docker (Run Anywhere)
```bash
.\deploy.ps1 docker
```

### Option 3: VPS/Server
```bash
.\deploy.ps1 vps
```

**See [QUICKSTART.md](./QUICKSTART.md) for detailed instructions.**

---

## 🗓️ Thursday Auctions - Automatic!

**Important:** Once deployed, your app **automatically handles all Thursday auctions** without any manual intervention!

### How It Works:
1. **Sync daemon runs 24/7** (background process)
2. **Polls TVS API every 10 seconds** for new activities
3. **Detects auction activities** (bids, buys, participation)
4. **Awards points automatically** based on rules
5. **Updates leaderboard in real-time**

### Pre-Configured Matches:
- **Match 1**: Thursday, Oct 3, 2:00 PM (Auction #1978)
- **Match 2**: Thursday, Oct 10, 2:00 PM (Auction #1979)
- **Match 3**: Thursday, Oct 17, 2:00 PM (Auction #1980)
- **Match 4**: Thursday, Oct 24, 2:00 PM (Auction #1981)

**You deploy once. It works for all Thursdays!**

See [THURSDAY_AUCTION_FLOW.md](./THURSDAY_AUCTION_FLOW.md) for detailed flow.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [QUICKSTART.md](./QUICKSTART.md) | Deploy in 5 minutes |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Detailed deployment guide (all platforms) |
| [THURSDAY_AUCTION_FLOW.md](./THURSDAY_AUCTION_FLOW.md) | How Thursday auctions work automatically |
| [PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md) | Production readiness checklist |
| [../DEPLOYMENT_SUMMARY.md](../DEPLOYMENT_SUMMARY.md) | Executive summary |

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: SQLite (dev) / PostgreSQL (production)
- **ORM**: Prisma
- **Deployment**: Vercel / Railway / Docker / VPS

---

## 📋 Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm start               # Start production server

# Database
npm run db:push         # Push schema changes
npm run db:seed         # Seed sample data
npm run db:setup        # Push + seed (initial setup)
npm run db:studio       # Open Prisma Studio

# Sync & Monitoring
npm run sync:live       # Start live auction sync daemon
npm run verify          # Verify system readiness

# Linting
npm run lint            # Run ESLint
```

---

## 🔐 Environment Variables

Create `.env` file:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# Admin password for /admin dashboard
ADMIN_PASSWORD="your-secure-password"

# Internal API key for /api/internal/* endpoints
INTERNAL_API_KEY="your-secure-api-key"

# Optional: Auction configuration
AUCTION_ID="1978"
SYNC_INTERVAL_MS="10000"
```

⚠️ **Before production**: Change default passwords and API keys!

---

## 🏗️ Project Structure

```
supercup/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Admin dashboard
│   │   ├── dashboard/         # Dealer dashboard
│   │   ├── leaderboard/       # Public leaderboard
│   │   └── api/               # API routes
│   └── lib/
│       ├── services/          # Business logic
│       │   ├── points-engine.ts
│       │   ├── ranking-engine.ts
│       │   └── tvs-sync.ts    # Live auction sync
│       └── db.ts              # Prisma client
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Seed data
│   └── dev.db                 # SQLite database (dev)
├── scripts/
│   └── live-sync-daemon.ts    # Background sync process
└── docs/
    ├── QUICKSTART.md
    ├── DEPLOYMENT.md
    └── THURSDAY_AUCTION_FLOW.md
```

---

## 🎮 Key Features

### For Dealers
- View real-time masked leaderboard
- See personal rank and points
- Track activity breakdown
- See points needed to climb ranks
- View competitors above/below

### For Admins
- Monitor all dealers
- View live activity feed
- Export auction data
- Recalculate rankings
- Audit point awards

### For System
- Auto-detect new dealers
- Prevent duplicate points
- Validate campaign dates
- Map auction IDs to matches
- Handle errors gracefully

---

## 🔍 Monitoring

### Check Sync Status
```bash
# View sync daemon logs
npm run sync:live

# Check database
npm run db:studio

# Verify system readiness
npm run verify

# Test APIs
curl http://localhost:3000/api/leaderboard
curl http://localhost:3000/api/me/dashboard
```

### Production Monitoring
```bash
# Vercel
vercel logs

# Docker
docker-compose logs -f

# VPS/PM2
pm2 logs supercup-sync
pm2 logs supercup-web
```

---

## ⚠️ Important Notes

### Privacy
- Dealer names are masked server-side (e.g., "R*****")
- Full names never sent to browser
- Only dealer can see their own full details

### Security
- Admin routes protected by password
- Internal APIs require API key
- No TVS passwords stored locally
- All activities validated before points awarded

### Data Integrity
- Duplicate transactions prevented
- Campaign date validation
- Transaction IDs tracked
- Complete audit trail maintained

---

## 🆘 Troubleshooting

### Sync daemon not working?
```bash
# Check logs for errors
npm run sync:live

# Verify auction ID is correct
npm run db:studio
# → MatchDay table → check auctionId

# Verify campaign is active
# → Campaign table → status should be "ACTIVE"
```

### Leaderboard not updating?
1. Check sync daemon is running
2. Verify database connection
3. Check TVS API connectivity
4. Review error logs

### Need to add new Thursday?
```bash
npm run db:studio
# → MatchDay table
# → Add new record with:
#    - campaignId: 1
#    - matchNumber: 5
#    - auctionId: "NEW_ID"
#    - scheduledDate: next Thursday 2PM IST
#    - status: "UPCOMING"
```

---

## 📞 Support

For deployment issues:
1. Check [QUICKSTART.md](./QUICKSTART.md)
2. Review [DEPLOYMENT.md](./DEPLOYMENT.md)
3. See [THURSDAY_AUCTION_FLOW.md](./THURSDAY_AUCTION_FLOW.md)
4. Run `npm run verify` for diagnostics

---

## 🎯 Next Steps

1. **Before deployment**: Complete [PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md)
2. **Deploy**: Choose deployment method from [QUICKSTART.md](./QUICKSTART.md)
3. **Monitor**: Watch first Thursday auction closely
4. **Scale**: System ready for November loyalty tiers & December recognition

---

## 📄 License

Proprietary - TVS Certified Internal Use Only
