const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const buys = await prisma.dealerActivity.findMany({
    where: { campaignId: 13, activityType: 'BUY' },
    select: { externalTransactionId: true },
    take: 5
  });
  console.log('Sample BUY externalTransactionIds:', buys);

  const sells = await prisma.dealerActivity.findMany({
    where: { campaignId: 13, activityType: 'SELL' },
    select: { externalTransactionId: true },
    take: 5
  });
  console.log('Sample SELL externalTransactionIds:', sells);
}

main().catch(console.error).finally(() => prisma.$disconnect());
