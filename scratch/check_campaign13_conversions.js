const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const c13Buys = await prisma.dealerActivity.count({
    where: { campaignId: 13, activityType: 'BUY' }
  });
  const c13Sells = await prisma.dealerActivity.count({
    where: { campaignId: 13, activityType: 'SELL' }
  });
  const c13BuysPoints = await prisma.dealerActivity.aggregate({
    where: { campaignId: 13, activityType: 'BUY' },
    _sum: { points: true }
  });
  const c13SellsPoints = await prisma.dealerActivity.aggregate({
    where: { campaignId: 13, activityType: 'SELL' },
    _sum: { points: true }
  });
  console.log(`Campaign 13 BUY activities: count=${c13Buys}, pointsSum=${c13BuysPoints._sum.points}`);
  console.log(`Campaign 13 SELL activities: count=${c13Sells}, pointsSum=${c13SellsPoints._sum.points}`);

  const sampleBuys = await prisma.dealerActivity.findMany({
    where: { campaignId: 13, activityType: 'BUY' },
    take: 3,
    select: { id: true, dealerId: true, points: true, externalTransactionId: true, metadata: true }
  });
  console.log('Sample BUY activities in Campaign 13:', sampleBuys);
}

main().catch(console.error).finally(() => prisma.$disconnect());
