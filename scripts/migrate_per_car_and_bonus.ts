import { PrismaClient } from '@prisma/client';
import { recalculateRankings } from '../src/lib/services/ranking-engine';

const prisma = new PrismaClient();

async function main() {
  console.log('🏁 Starting migration: Per-car bid point allocation & Buyer all-matches bonus...');

  // 1. Ensure ALL_MATCHES_BONUS is active with 20 points across all campaigns
  const campaigns = await prisma.campaign.findMany();
  for (const c of campaigns) {
    await prisma.pointRule.upsert({
      where: {
        campaignId_activityType: {
          campaignId: c.id,
          activityType: 'ALL_MATCHES_BONUS',
        },
      },
      update: {
        points: 20,
        description: 'Buying: Bonus points for participating in all scheduled match days',
        active: true,
      },
      create: {
        campaignId: c.id,
        activityType: 'ALL_MATCHES_BONUS',
        points: 20,
        description: 'Buying: Bonus points for participating in all scheduled match days',
        active: true,
      },
    });

    // Also update BID_PLACED description to clarify per-car basis
    await prisma.pointRule.updateMany({
      where: {
        campaignId: c.id,
        activityType: 'BID_PLACED',
      },
      data: {
        points: 1,
        description: 'Buying: Points per unique car bid on (per-car basis)',
        active: true,
      },
    });

    console.log(`✓ Campaign ${c.id} (${c.name}): point rules updated (ALL_MATCHES_BONUS = 20 pts, BID_PLACED = 1 pt/car).`);
  }

  // 2. Normalize existing BID_PLACED activities to per-car basis
  // For each campaign and dealer, keep points=1 only on the earliest bid per vehicle lot per match.
  // Set points=0 on repeat bids on the same car.
  console.log('\n🚗 Updating existing bids to per-car basis across all campaigns...');
  const allBids = await prisma.dealerActivity.findMany({
    where: { activityType: 'BID_PLACED' },
    orderBy: { timestamp: 'asc' },
    select: {
      id: true,
      dealerId: true,
      campaignId: true,
      matchId: true,
      points: true,
      metadata: true,
      externalTransactionId: true,
    },
  });

  const seenVehicleBids = new Set<string>();
  const idsToZero: number[] = [];
  const idsToKeepOne: number[] = [];

  for (const bid of allBids) {
    let vehicleId: string | number | undefined;
    if (bid.metadata) {
      try {
        const meta = JSON.parse(bid.metadata);
        vehicleId = meta.vehicleId;
      } catch {}
    }
    if (!vehicleId && bid.externalTransactionId) {
      const m = bid.externalTransactionId.match(/^(?:BID|PREBID)-[^-]+-([^-]+)-/);
      if (m) vehicleId = m[1];
    }
    const vKey = `${bid.campaignId}:${bid.dealerId}:${bid.matchId || 0}:${vehicleId || bid.id}`;

    if (seenVehicleBids.has(vKey)) {
      if (bid.points !== 0) {
        idsToZero.push(bid.id);
      }
    } else {
      seenVehicleBids.add(vKey);
      if (bid.points !== 1) {
        idsToKeepOne.push(bid.id);
      }
    }
  }

  console.log(`Found ${allBids.length} total bids.`);
  console.log(`  - Unique vehicle lots bid on: ${seenVehicleBids.size}`);
  console.log(`  - Repeat bids to set to 0 pts: ${idsToZero.length}`);

  if (idsToZero.length > 0) {
    // Batch update in chunks of 500
    for (let i = 0; i < idsToZero.length; i += 500) {
      const chunk = idsToZero.slice(i, i + 500);
      await prisma.dealerActivity.updateMany({
        where: { id: { in: chunk } },
        data: { points: 0 },
      });
    }
    console.log(`  ✓ Successfully updated ${idsToZero.length} repeat bids to 0 points.`);
  }

  if (idsToKeepOne.length > 0) {
    for (let i = 0; i < idsToKeepOne.length; i += 500) {
      const chunk = idsToKeepOne.slice(i, i + 500);
      await prisma.dealerActivity.updateMany({
        where: { id: { in: chunk } },
        data: { points: 1 },
      });
    }
    console.log(`  ✓ Successfully ensured ${idsToKeepOne.length} initial vehicle bids have 1 point.`);
  }

  // 3. Recalculate rankings for all campaigns
  console.log('\n📊 Recalculating dealer scores and ranks...');
  for (const c of campaigns) {
    const res = await recalculateRankings(c.id);
    console.log(`  ✓ Campaign ${c.id}: recalculation done. Total active dealers: ${res.totalDealers}, top score: ${res.topScore}`);
  }

  console.log('\n✅ Migration completed successfully!');
}

main()
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
