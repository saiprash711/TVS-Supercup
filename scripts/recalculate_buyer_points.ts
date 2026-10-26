import { prisma } from '../src/lib/db';
import { recalculateRankings } from '../src/lib/services/ranking-engine';

async function main() {
  const match = await prisma.matchDay.findFirst({
    where: { OR: [{ auctionId: '2038' }, { id: 88 }] },
    include: { campaign: true }
  });

  if (!match) {
    console.error('Match not found!');
    return;
  }

  const campaignId = match.campaignId;
  const matchId = match.id;

  // 1. Update point rule for BUY in campaign 13 to 1 pt
  await prisma.pointRule.updateMany({
    where: { campaignId, activityType: 'BUY' },
    data: { points: 1, active: true, description: 'Buying: Points per unique vehicle purchased/won' }
  });

  // 2. Update BID_PLACED point rule to 0 pts (deduped to won conversions)
  await prisma.pointRule.updateMany({
    where: { campaignId, activityType: 'BID_PLACED' },
    data: { points: 0, active: false, description: 'Buying: Bids placed (deduped to verified purchases)' }
  });

  // 3. Update all 123 BUY activities for match 88 to have points: 1
  await prisma.dealerActivity.updateMany({
    where: { matchId, activityType: 'BUY' },
    data: { points: 1 }
  });

  // 4. Update all BID_PLACED activities for match 88 to have points: 0
  await prisma.dealerActivity.updateMany({
    where: { matchId, activityType: 'BID_PLACED' },
    data: { points: 0 }
  });

  // 5. Ensure each winning buyer has MATCH_PARTICIPATION (1 pt)
  const buyActivities = await prisma.dealerActivity.findMany({
    where: { matchId, activityType: 'BUY' },
    select: { dealerId: true }
  });
  const winningDealerIds = [...new Set(buyActivities.map(b => b.dealerId))];

  for (const dId of winningDealerIds) {
    const existingAttend = await prisma.dealerActivity.findFirst({
      where: { matchId, dealerId: dId, activityType: 'MATCH_PARTICIPATION' }
    });
    if (!existingAttend) {
      await prisma.dealerActivity.create({
        data: {
          dealerId: dId,
          campaignId,
          matchId,
          activityType: 'MATCH_PARTICIPATION',
          points: 1,
          externalTransactionId: `INFERRED-ATTEND-${campaignId}-${matchId}-${dId}`,
          metadata: JSON.stringify({ inferred: true, source: 'VERIFIED_BUYER_CONVERSION' }),
          timestamp: match.date || new Date(),
        }
      });
    }
  }

  // 6. Recalculate rankings
  await recalculateRankings(campaignId);

  const scores = await prisma.dealerScore.findMany({
    where: { campaignId },
    include: { dealer: true },
    orderBy: { totalPoints: 'desc' },
    take: 25
  });

  console.log('--- TOP 25 DEALERS AFTER BUYER RECALCULATION ---');
  for (const s of scores) {
    console.log(
      `#${String(s.rank).padStart(2)} ${s.dealer.displayName.padEnd(35)} ` +
      `Category: ${(s.dealer.category || '').padEnd(16)} ` +
      `Total Pts: ${String(s.totalPoints).padStart(3)}`
    );
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
