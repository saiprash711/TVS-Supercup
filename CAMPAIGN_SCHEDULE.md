# TVS Certified Super Cup - Campaign Schedule

## 📅 Campaign Period

**September - October 2026**
- Start: September 1, 2026
- End: October 31, 2026
- Duration: 2 months

---

## 🗓️ Match Schedule - Every Thursday at 2:00 PM IST

### September 2026 (3 Matches)

| Match | Date | Day | Time | Auction ID | Status |
|-------|------|-----|------|------------|--------|
| **#1** | **September 10, 2026** | Thursday | 2:00 PM IST | 1978 | LIVE |
| **#2** | **September 17, 2026** | Thursday | 2:00 PM IST | TVSC-SEP-17 | UPCOMING |
| **#3** | **September 24, 2026** | Thursday | 2:00 PM IST | TVSC-SEP-24 | UPCOMING |

### October 2026 (5 Matches)

| Match | Date | Day | Time | Auction ID | Status |
|-------|------|-----|------|------------|--------|
| **#4** | **October 1, 2026** | Thursday | 2:00 PM IST | TVSC-OCT-01 | UPCOMING |
| **#5** | **October 8, 2026** | Thursday | 2:00 PM IST | TVSC-OCT-08 | UPCOMING |
| **#6** | **October 15, 2026** | Thursday | 2:00 PM IST | TVSC-OCT-15 | UPCOMING |
| **#7** | **October 22, 2026** | Thursday | 2:00 PM IST | TVSC-OCT-22 | UPCOMING |
| **#8** | **October 29, 2026** | Thursday | 2:00 PM IST | TVSC-OCT-29 | UPCOMING |

---

## ✅ Confirmed: September 17, 2026 is Included!

**Yes, the application will work on September 17, 2026!** It's configured as Match #2.

---

## 🎯 Point System (Applies to All Matches)

| Activity | Points |
|----------|--------|
| **BUY Transaction** | +10 |
| **SELL Transaction** | +10 |
| **Match Participation** | +15 |
| **All Matches Bonus** | +20 |

---

## 🔄 How It Works Automatically

### Every Thursday at 2:00 PM IST:

1. **Auction starts** on TVS Certified platform
2. **Vercel Cron** runs every 2 minutes
3. **Detects live match** for today
4. **Syncs activities** (bids, buys, participation)
5. **Awards points** automatically
6. **Updates rankings** in real-time
7. **Dealers see** live updates on dashboard

### All 8 Thursdays Work Automatically:

- ✅ September 10, 2026 - Match #1
- ✅ **September 17, 2026 - Match #2** ← **Your date!**
- ✅ September 24, 2026 - Match #3
- ✅ October 1, 2026 - Match #4
- ✅ October 8, 2026 - Match #5
- ✅ October 15, 2026 - Match #6
- ✅ October 22, 2026 - Match #7
- ✅ October 29, 2026 - Match #8

**No manual intervention needed for any Thursday!** 🎉

---

## 📊 Cumulative Scoring

Points accumulate across all matches:
- Match #1 points + Match #2 points + ... + Match #8 points = Final Score
- Rankings update after each match
- Dealers compete for top positions across the entire 2-month campaign

---

## 🏆 Campaign Objectives

### For Dealers:
- Participate in weekly Thursday auctions
- Earn points through buy/sell transactions
- Climb the leaderboard
- Win recognition and rewards

### For TVS:
- Increase dealer engagement
- Drive auction participation
- Build competitive spirit
- Reward active dealers

---

## 🔧 Technical Implementation

### Database Configuration:
```typescript
// Campaign
name: 'TVS Certified Super Cup - September-October 2026'
start: September 1, 2026
end: October 31, 2026
status: ACTIVE

// 8 Match Days (Thursdays)
[
  { match: 1, date: '2026-09-10', status: 'LIVE' },
  { match: 2, date: '2026-09-17', status: 'UPCOMING' },
  { match: 3, date: '2026-09-24', status: 'UPCOMING' },
  { match: 4, date: '2026-10-01', status: 'UPCOMING' },
  { match: 5, date: '2026-10-08', status: 'UPCOMING' },
  { match: 6, date: '2026-10-15', status: 'UPCOMING' },
  { match: 7, date: '2026-10-22', status: 'UPCOMING' },
  { match: 8, date: '2026-10-29', status: 'UPCOMING' },
]
```

### Cron Job:
- Frequency: Every 2 minutes
- Endpoint: `/api/internal/events`
- Function: Automatically syncs live auction data
- Active: 24/7 (checks for today's match)

---

## 📱 What Dealers Experience

### Before September 10, 2026:
- Can log in and see leaderboard (all at 0 points)
- Dashboard shows "No activities yet"
- Campaign countdown visible

### September 10, 2026 (First Match):
- Auction goes live at 2:00 PM IST
- Points start accumulating
- Leaderboard updates every 2 minutes
- Dealers see their positions change in real-time

### September 17, 2026 (Second Match):
- Previous points carry forward
- New activities add to existing scores
- Cumulative rankings visible
- Competition intensifies

### Through October 29, 2026:
- Points continue accumulating
- Final rankings determine winners
- Complete activity history tracked

---

## 🎉 Summary

**Your application is configured to work for ALL Thursdays including September 17, 2026!**

- ✅ Total Matches: 8
- ✅ September Matches: 3 (including Sept 17)
- ✅ October Matches: 5
- ✅ Automatic sync: Every 2 minutes
- ✅ Cumulative scoring: Across all matches
- ✅ No manual work required

**Deploy to Vercel and it will handle all 8 Thursdays automatically!** 🚀🏆
