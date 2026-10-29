const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const campaigns = await prisma.campaign.findMany();
  console.log('Campaigns:', campaigns);

  const activities = await prisma.dealerActivity.findMany({
    where: { activityType: 'SELL_LISTING' },
    include: { dealer: true },
  });
  console.log(`Total SELL_LISTING activities: ${activities.length}`);

  // Group by dealer
  const byDealer = {};
  for (const a of activities) {
    const name = a.dealer?.displayName || a.dealerId;
    byDealer[name] = (byDealer[name] || 0) + 1;
  }
  console.log('SELL_LISTING by dealer:', byDealer);

  // Check top sellers on leaderboard
  const scores = await prisma.dealerScore.findMany({
    orderBy: { totalPoints: 'desc' },
    take: 10,
    include: { dealer: true }
  });
  console.log('Top 10 dealer scores:', scores.map(s => ({
    dealer: s.dealer.displayName,
    code: s.dealer.externalDealerId,
    totalPoints: s.totalPoints,
    breakdown: s.breakdown
  })));
}
check().finally(() => prisma.$disconnect());
