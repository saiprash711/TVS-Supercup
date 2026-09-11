# Pre-Deployment Checklist

Use this checklist before deploying to production to ensure everything is ready for the Thursday auctions.

## ✅ Environment Configuration

- [ ] **Change ADMIN_PASSWORD** from default `supercup2026` to a strong password
- [ ] **Change INTERNAL_API_KEY** from default to a secure random string (use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] **Set DATABASE_URL** to production database (Postgres for Vercel, or keep SQLite for Docker/VPS)
- [ ] **Backup .env file** securely (do NOT commit to git)

## ✅ Database Setup

- [ ] **Verify campaign dates** in database:
  ```sql
  SELECT * FROM Campaign WHERE type = 'SUPER_CUP';
  ```
  - Start date: October 1, 2026 (or earlier)
  - End date: October 31, 2026 (or later)
  - Status: ACTIVE

- [ ] **Verify all 4 Thursday match days** are configured:
  ```sql
  SELECT * FROM MatchDay ORDER BY scheduledDate;
  ```
  - Match 1: Thursday, Oct 3, 2026 @ 2:00 PM
  - Match 2: Thursday, Oct 10, 2026 @ 2:00 PM
  - Match 3: Thursday, Oct 17, 2026 @ 2:00 PM
  - Match 4: Thursday, Oct 24, 2026 @ 2:00 PM

- [ ] **Verify auction IDs** match TVS Certified system:
  - Check with TVS team for correct auction IDs
  - Update MatchDay.auctionId if needed

- [ ] **Verify point rules** are configured:
  ```sql
  SELECT * FROM PointRule WHERE campaignId = 1;
  ```
  - BUY: 10 points
  - SELL: 10 points
  - MATCH_PARTICIPATION: 15 points
  - ALL_MATCHES_BONUS: 20 points

- [ ] **Verify dealers are seeded** (at least a few for testing):
  ```sql
  SELECT COUNT(*) FROM Dealer;
  ```

## ✅ Security

- [ ] **Test dealer name masking** - Full names should NEVER appear in API responses
  ```bash
  curl https://your-app.com/api/leaderboard
  # Should see: R*****, A*****, not "Ramesh Motors"
  ```

- [ ] **Test admin authentication** - Only with correct password
  ```bash
  curl -X POST https://your-app.com/api/admin/auth \
    -H "Content-Type: application/json" \
    -d '{"password":"wrong-password"}'
  # Should return 401 Unauthorized
  ```

- [ ] **Test internal API key** - Protected endpoints require valid key
  ```bash
  curl https://your-app.com/api/internal/events
  # Should return 401 without API key
  ```

- [ ] **Verify .env is in .gitignore** (should already be there)

## ✅ TVS Integration

- [ ] **Verify TVS API connectivity**:
  ```bash
  npm run verify
  ```

- [ ] **Test TVS authentication** (if using SSO)

- [ ] **Verify dealer ID mapping** works:
  - TVS User ID → Customer ID → Dealer ID
  - Check sample dealer can login

- [ ] **Test activity fetching** from TVS:
  ```typescript
  // Should return activities without errors
  getTVSProvider().getDealerActivities('SAMPLE_DEALER_ID', '1978')
  ```

## ✅ Functionality Testing

- [ ] **Test leaderboard API**:
  ```bash
  curl https://your-app.com/api/leaderboard
  ```
  - Returns array of dealers
  - Names are masked
  - Sorted by rank

- [ ] **Test dealer dashboard** (with authentication):
  - Shows dealer's own data
  - Shows rank, points, activity breakdown
  - Shows competitors above/below

- [ ] **Test admin dashboard**:
  - Login with admin password
  - View all dealers
  - View activities
  - Export data works

- [ ] **Test activity recording**:
  ```bash
  # Manually trigger sync
  curl -X POST https://your-app.com/api/internal/events \
    -H "x-api-key: YOUR_INTERNAL_API_KEY"
  ```
  - New activities are recorded
  - Points are awarded
  - No duplicate points for same transaction

## ✅ Sync Daemon (For Thursday Auctions)

- [ ] **Verify sync daemon starts without errors**:
  ```bash
  npm run sync:live
  # Should show "TVS CERTIFIED SUPER CUP 2026 — LIVE AUCTION SYNC DAEMON"
  ```

- [ ] **Test sync interval** (default: 10 seconds)
  - Watch logs for sync cycles
  - Should poll TVS API every 10 seconds

- [ ] **Test error recovery**:
  - Daemon continues after network errors
  - No crashes from API timeouts

- [ ] **Verify database updates** during sync:
  - New activities appear in DealerActivity table
  - Points are awarded in DealerScore table
  - Rankings are updated

## ✅ Deployment-Specific Checks

### If Using Vercel:
- [ ] Vercel Postgres database created and connected
- [ ] Environment variables set in Vercel dashboard
- [ ] Cron job configured (vercel.json)
- [ ] Build succeeds without errors
- [ ] Migrations run successfully

### If Using Docker:
- [ ] Docker containers build successfully
- [ ] Volumes mounted for database persistence
- [ ] Both containers (web + sync) start without errors
- [ ] Database persists across container restarts

### If Using VPS:
- [ ] PM2 starts both processes (web + sync)
- [ ] PM2 saves configuration
- [ ] PM2 startup on system boot configured
- [ ] Nginx configured (if using)
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Firewall allows port 80/443

## ✅ Monitoring & Logs

- [ ] **Setup log monitoring**:
  - Vercel: Check logs in dashboard
  - Docker: `docker-compose logs -f`
  - VPS: `pm2 logs`

- [ ] **Setup uptime monitoring** (optional):
  - Use UptimeRobot or similar
  - Monitor https://your-app.com/api/leaderboard
  - Alert if down for > 5 minutes

- [ ] **Setup error alerts** (optional):
  - Sentry or similar for error tracking
  - Email alerts for critical failures

## ✅ Database Backup

- [ ] **Setup automated backups**:
  - Vercel Postgres: Automatic (verify in settings)
  - Docker/VPS: Daily cron job to backup SQLite
  - Test restore procedure

- [ ] **Manual backup before launch**:
  ```bash
  # For SQLite
  cp prisma/dev.db prisma/dev-backup-$(date +%Y%m%d).db
  
  # For Postgres
  pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
  ```

## ✅ Performance

- [ ] **Test with load** (optional but recommended):
  - Simulate 100+ dealers viewing leaderboard
  - Verify response time < 1 second
  - Check database query performance

- [ ] **Check database indexes** (for Postgres):
  ```sql
  -- Indexes should exist on:
  -- DealerScore(campaignId, rank)
  -- DealerActivity(dealerId, campaignId)
  -- DealerActivity(externalTransactionId)
  ```

## ✅ Documentation

- [ ] **Document production URLs**:
  - Main app: https://_______________
  - Admin dashboard: https://_______________/admin
  - API base: https://_______________/api

- [ ] **Document credentials** (securely):
  - Admin password: _______________
  - Database connection: _______________
  - Internal API key: _______________

- [ ] **Share access with team** (if applicable)

## ✅ Launch Day Preparation

- [ ] **Schedule deployment** for off-hours (not Thursday 2 PM!)

- [ ] **Notify dealers** about new dashboard:
  - Send login instructions
  - Explain how to view leaderboard
  - Provide support contact

- [ ] **Monitor first Thursday auction**:
  - Watch sync logs closely
  - Verify activities are captured
  - Check leaderboard updates correctly
  - Be ready to fix issues quickly

- [ ] **Have rollback plan**:
  - Know how to revert deployment
  - Have database backup ready
  - Document rollback steps

## ✅ Post-Launch

- [ ] **Monitor first few hours** closely

- [ ] **Check after first Thursday auction**:
  - All activities captured?
  - Points awarded correctly?
  - Dealers can see their ranks?

- [ ] **Gather feedback** from dealers

- [ ] **Review logs** for any errors

- [ ] **Optimize** if needed based on usage patterns

---

## Quick Commands

```bash
# Check everything is ready
npm run verify

# View database
npm run db:studio

# Test sync manually
npm run sync:live

# Build for production
npm run build

# Deploy (choose one)
.\deploy.ps1 vercel
.\deploy.ps1 docker
.\deploy.ps1 vps
```

---

## Need Help?

- **Detailed deployment guide**: See DEPLOYMENT.md
- **Quick start**: See QUICKSTART.md
- **System overview**: See README.md
- **Prompt reference**: See ../Prompt.md
