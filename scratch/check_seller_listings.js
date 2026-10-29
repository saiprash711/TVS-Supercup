const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const listings = await prisma.dealerActivity.findMany({
    where: { campaignId: 13, activityType: 'SELL_LISTING' },
    select: { id: true, dealerId: true, matchId: true, points: true }
  });
  console.log(`Total SELL_LISTING in Campaign 13: ${listings.length}`);
  const matchIds = [...new Set(listings.map(l => l.matchId))];
  console.log('Matches with listings:', matchIds);

  for (const mId of matchIds) {
    const sellersInMatch = [...new Set(listings.filter(l => l.matchId === mId).map(l => l.dealerId))];
    console.log(`Match ${mId}: ${sellersInMatch.length} distinct sellers, ${listings.filter(l => l.matchId === mId).length} listings`);

    // Check how many of these sellers already have MATCH_PARTICIPATION in this match
    const participations = await prisma.dealerActivity.findMany({
      where: { campaignId: 13, matchId: mId, activityType: 'MATCH_PARTICIPATION', dealerId: { in: sellersInMatch } }
    });
    console.log(`  Sellers already having MATCH_PARTICIPATION: ${participations.length} / ${sellersInMatch.length}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
