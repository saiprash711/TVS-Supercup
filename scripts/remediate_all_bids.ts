import { prisma } from '../src/lib/db';
import { recalculateRankings } from '../src/lib/services/ranking-engine';

async function main() {
  console.log('--- Remediating All BID_PLACED Activities to True Owners ---');

  const dealers = await prisma.dealer.findMany({
    select: { id: true, displayName: true, externalDealerId: true }
  });

  const byName = new Map<string, typeof dealers[0]>();
  const byExtId = new Map<string, typeof dealers[0]>();

  for (const d of dealers) {
    byName.set(d.displayName.trim().toLowerCase(), d);
    byExtId.set(String(d.externalDealerId).trim(), d);
    if (d.externalDealerId.startsWith('USR-')) {
      byExtId.set(d.externalDealerId.replace('USR-', '').trim(), d);
    }
  }

  const allBids = await prisma.dealerActivity.findMany({
    where: { activityType: 'BID_PLACED' },
    select: { id: true, dealerId: true, matchId: true, campaignId: true, metadata: true }
  });

  console.log(`Analyzing ${allBids.length} BID_PLACED records...`);

  let correctedCount = 0;
  const updates: Array<{ id: number; newDealerId: number }> = [];

  for (const bid of allBids) {
    let meta: any = {};
    try {
      meta = typeof bid.metadata === 'string' ? JSON.parse(bid.metadata) : (bid.metadata || {});
    } catch {
      continue;
    }

    const bidderName = (meta.bidderName || '').trim();
    const bidderId = meta.bidderId != null ? String(meta.bidderId).trim() : '';

    let trueDealer: typeof dealers[0] | undefined;

    if (bidderName && bidderName !== 'null' && byName.has(bidderName.toLowerCase())) {
      trueDealer = byName.get(bidderName.toLowerCase());
    } else if (bidderId && byExtId.has(bidderId)) {
      trueDealer = byExtId.get(bidderId);
    }

    if (trueDealer && trueDealer.id !== bid.dealerId) {
      updates.push({ id: bid.id, newDealerId: trueDealer.id });
      correctedCount++;
    }
  }

  console.log(`Found ${correctedCount} misattributed bids to fix.`);

  // Batch update in transactions of 200
  const batchSize = 200;
  for (let i = 0; i < updates.length; i += batchSize) {
    const chunk = updates.slice(i, i + batchSize);
    await prisma.$transaction(
      chunk.map(u => prisma.dealerActivity.update({
        where: { id: u.id },
        data: { dealerId: u.newDealerId }
      }))
    );
    process.stdout.write(`Updated ${Math.min(i + batchSize, updates.length)} / ${updates.length} bids...\r`);
  }
  console.log(`\nSuccessfully updated ${correctedCount} bids!`);

  // Ensure every active bidder has MATCH_PARTICIPATION
  console.log('\nEnsuring MATCH_PARTICIPATION for all active bidders & buyers...');
  const distinctMatchBidders = await prisma.dealerActivity.groupBy({
    by: ['dealerId', 'matchId', 'campaignId'],
    where: {
      activityType: { in: ['BID_PLACED', 'BUY'] },
      matchId: { not: null }
    }
  });

  let createdAttendance = 0;
  for (const mb of distinctMatchBidders) {
    if (!mb.matchId || !mb.campaignId) continue;
    const exists = await prisma.dealerActivity.findFirst({
      where: {
        dealerId: mb.dealerId,
        matchId: mb.matchId,
        activityType: 'MATCH_PARTICIPATION'
      }
    });

    if (!exists) {
      await prisma.dealerActivity.create({
        data: {
          dealerId: mb.dealerId,
          matchId: mb.matchId,
          campaignId: mb.campaignId,
          activityType: 'MATCH_PARTICIPATION',
          points: 1,
          metadata: JSON.stringify({ verifiedAttendance: true, reason: 'Active bidder or buyer in match' }),
          timestamp: new Date()
        }
      });
      createdAttendance++;
    }
  }
  console.log(`Added ${createdAttendance} missing attendance participation records.`);

  // Recalculate rankings across all campaigns
  const campaigns = await prisma.campaign.findMany({ select: { id: true, name: true } });
  for (const camp of campaigns) {
    console.log(`Recalculating tournament rankings for campaign: ${camp.name} (id: ${camp.id})...`);
    await recalculateRankings(camp.id);
  }

  console.log('\n✅ All bid attributions and rankings successfully reconciled!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
