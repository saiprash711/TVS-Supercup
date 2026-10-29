const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const buysByMatch = await prisma.dealerActivity.groupBy({
    by: ['matchId', 'points'],
    where: { campaignId: 13, activityType: 'BUY' },
    _count: true,
  });
  console.log('Campaign 13 BUY activities by match:');
  console.table(buysByMatch);

  const sellsByMatch = await prisma.dealerActivity.groupBy({
    by: ['matchId', 'points'],
    where: { campaignId: 13, activityType: 'SELL' },
    _count: true,
  });
  console.log('Campaign 13 SELL activities by match:');
  console.table(sellsByMatch);
}

main().catch(console.error).finally(() => prisma.$disconnect());
