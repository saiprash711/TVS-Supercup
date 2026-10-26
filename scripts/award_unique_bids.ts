import { PrismaClient } from '@prisma/client';
import { recalculateRankings } from '../src/lib/services/ranking-engine';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Reconciling BID_PLACED activities to 1 point per unique car bid as per confirmed Pitch Deck...');

  const campaigns = await prisma.campaign.findMany({
    where: {
      status: { in: ['ACTIVE', 'UPCOMING', 'COMPLETED'] },
    },
  });

  for (const campaign of campaigns) {
    const bids = await prisma.dealerActivity.findMany({
      where: {
        campaignId: campaign.id,
        activityType: 'BID_PLACED',
      },
      orderBy: { timestamp: 'asc' },
    });

    if (bids.length === 0) continue;

    console.log(`\nCampaign ${campaign.id} (${campaign.slug}): Found ${bids.length} BID_PLACED records`);

    const seenDealerCar = new Set<string>();
    const toAwardOnePt: number[] = [];
    const toSetZeroPt: number[] = [];

    for (const b of bids) {
      let vId: string | undefined;
      try {
        const meta = typeof b.metadata === 'string' ? JSON.parse(b.metadata) : b.metadata;
        vId = meta?.vehicleId ? String(meta.vehicleId) : undefined;
      } catch {}

      if (!vId && b.externalTransactionId) {
        const m = b.externalTransactionId.match(/^(?:BID|PREBID)-[^-]+-([^-]+)-/);
        if (m) vId = m[1];
      }

      const key = `${b.dealerId}:${vId || b.id}`;
      if (!seenDealerCar.has(key)) {
        seenDealerCar.add(key);
        if (b.points !== 1) {
          toAwardOnePt.push(b.id);
        }
      } else {
        if (b.points !== 0) {
          toSetZeroPt.push(b.id);
        }
      }
    }

    console.log(`- Unique car first bids to award 1 pt: ${toAwardOnePt.length}`);
    console.log(`- Duplicate car bids to set 0 pt: ${toSetZeroPt.length}`);

    // Update in batches
    if (toAwardOnePt.length > 0) {
      await prisma.dealerActivity.updateMany({
        where: { id: { in: toAwardOnePt } },
        data: { points: 1 },
      });
      console.log(`✅ Awarded 1 point to ${toAwardOnePt.length} unique car bids.`);
    }

    if (toSetZeroPt.length > 0) {
      await prisma.dealerActivity.updateMany({
        where: { id: { in: toSetZeroPt } },
        data: { points: 0 },
      });
      console.log(`✅ Set 0 points for ${toSetZeroPt.length} duplicate car bids.`);
    }

    // Recalculate rankings
    console.log(`Recalculating rankings for Campaign ${campaign.id}...`);
    await recalculateRankings(campaign.id);

    const topScores = await prisma.dealerScore.findMany({
      where: { campaignId: campaign.id },
      orderBy: { rank: 'asc' },
      take: 5,
      include: { dealer: { select: { displayName: true, externalDealerId: true } } },
    });

    console.log(`Top 5 Dealers in Campaign ${campaign.id}:`);
    for (const s of topScores) {
      console.log(`  #${s.rank}: ${s.dealer.displayName} (${s.dealer.externalDealerId}) — ${s.totalPoints} pts`);
    }
  }

  console.log('\n🎉 Finished reconciling bidding points to Pitch Deck specification!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
