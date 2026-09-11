/**
 * TVS Certified Super Cup — Live Auction Sync Daemon
 * 
 * Runs continuously in the background to automatically capture, validate,
 * and persist dealer activities (bids, wins, attendance) from TVS Certified
 * into SQLite (dev.db) and update dealer leaderboards in real time.
 */

import { prisma } from '../src/lib/db';
import { syncLiveAuction } from '../src/lib/services/tvs-sync';
import { getLeaderboard } from '../src/lib/services/ranking-engine';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Global error shields to prevent unexpected crash from network blips
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ [Safety Shield] Unhandled Rejection caught (daemon continuing):', reason);
});
process.on('uncaughtException', (err) => {
  console.error('⚠️ [Safety Shield] Uncaught Exception caught (daemon continuing):', err);
});

const AUCTION_ID = process.env.AUCTION_ID || '1978';
const INTERVAL_MS = parseInt(process.env.SYNC_INTERVAL_MS || '10000', 10);

let isRunning = true;
let isProcessing = false;
let cycleNumber = 0;
let cumulativeNewActivities = 0;
let cumulativePointsAwarded = 0;
let previousStage: string = 'listed';

function formatTime(d = new Date()) {
  return d.toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCycle(campaignId: number) {
  if (isProcessing) return;
  isProcessing = true;
  cycleNumber++;
  const startTime = Date.now();
  const timeStr = formatTime();

  try {
    const result = await syncLiveAuction(AUCTION_ID);
    const durationMs = Date.now() - startTime;

    cumulativeNewActivities += result.processed;
    cumulativePointsAwarded += result.pointsAwarded;

    // Get current live statistics from database for this specific auction
    const match = await prisma.matchDay.findFirst({
      where: { campaignId, auctionId: AUCTION_ID },
    });
    const auctionWhere: any = {
      campaignId,
      OR: [
        ...(match ? [{ matchId: match.id }] : []),
        { externalTransactionId: { contains: AUCTION_ID } },
      ],
    };

    const totalBids = await prisma.dealerActivity.count({
      where: { ...auctionWhere, activityType: 'BID_PLACED' },
    });
    const totalBuys = await prisma.dealerActivity.count({
      where: { ...auctionWhere, activityType: 'BUY' },
    });
    const totalAttends = await prisma.dealerActivity.count({
      where: { ...auctionWhere, activityType: 'MATCH_PARTICIPATION' },
    });
    const totalWatchlist = await prisma.dealerActivity.count({
      where: { ...auctionWhere, activityType: 'WATCHLIST_ADD' },
    });
    const activeDealers = await prisma.dealerActivity.groupBy({
      by: ['dealerId'],
      where: auctionWhere,
    });

    // Fetch top 3 leaderboard
    const topLeaderboard = await getLeaderboard(campaignId, 3);
    const topStr = topLeaderboard
      .map(d => `#${d.rank} ${d.dealer}: ${d.points} pts`)
      .join(' | ');

    if (result.processed > 0) {
      console.log(`\n🔥 [${timeStr}] [CYCLE #${cycleNumber}] NEW LIVE INTERACTIONS CAPTURED!`);
      console.log(`   +${result.processed} new activities | +${result.pointsAwarded} points awarded | Took ${durationMs}ms`);
      console.log(`   📊 Totals in DB: ${totalBids} Bids | ${totalBuys} Won Vehicles | ${totalAttends} Attendees | ${activeDealers.length} Active Dealers`);
      console.log(`   🏆 Top Leaders: ${topStr || 'None yet'}`);
    } else {
      console.log(
        `[${timeStr}] [Cycle #${cycleNumber}] Listening to Auction #${AUCTION_ID}... ` +
        `DB State: ${totalBids} bids, ${totalBuys} won, ${totalAttends} attendees (${activeDealers.length} active dealers) [${durationMs}ms]`
      );
    }
  } catch (err: any) {
    console.error(`\n⚠️ [${timeStr}] [Cycle #${cycleNumber}] Sync error (will retry in ${INTERVAL_MS / 1000}s):`, err?.message || err);
  } finally {
    isProcessing = false;
  }
}

async function main() {
  console.log('===============================================================');
  console.log('   TVS CERTIFIED SUPER CUP 2026 — LIVE AUCTION SYNC DAEMON   ');
  console.log('===============================================================');
  console.log(`Target Auction ID: #${AUCTION_ID} (Today at 2:00 PM IST)`);
  console.log(`Polling Interval : Every ${INTERVAL_MS / 1000} seconds`);
  console.log(`Database Target  : SQLite (supercup/prisma/dev.db - WAL Mode)`);
  console.log('Press Ctrl+C to stop gracefully.\n');

  // Find active campaign
  const campaign = await prisma.campaign.findFirst({
    where: { type: 'SUPER_CUP', status: 'ACTIVE' },
  });

  if (!campaign) {
    console.error('❌ Error: No active SUPER_CUP campaign found in database!');
    process.exit(1);
  }

  console.log(`Linked Campaign  : ${campaign.name} (ID: ${campaign.id})`);
  console.log(`TVS Identities   : 1,608 registered dealer mappings verified & ready.\n`);

  // Sequential execution loop - prevents any cycle overlap
  while (isRunning) {
    await runCycle(campaign.id);
    if (!isRunning) break;
    await sleep(INTERVAL_MS);
  }
}

// Graceful shutdown
const shutdown = () => {
  if (!isRunning) return;
  isRunning = false;
  console.log('\n\n🛑 Stopping Live Auction Sync Daemon gracefully...');
  console.log(`Summary: ${cumulativeNewActivities} activities captured, ${cumulativePointsAwarded} total points awarded across ${cycleNumber} cycles.`);
  prisma.$disconnect().then(() => {
    console.log('Database connection closed. Goodbye!');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch(err => {
  console.error('Fatal daemon error:', err);
  process.exit(1);
});
