const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const buy = await prisma.dealerActivity.findFirst({ where: { activityType: 'BUY' } });
  console.log('BUY sample:', {
    id: buy?.id,
    dealerId: buy?.dealerId,
    points: buy?.points,
    txId: buy?.externalTransactionId,
    metadata: buy?.metadata ? JSON.parse(buy.metadata) : null,
  });

  const sell = await prisma.dealerActivity.findFirst({ where: { activityType: 'SELL' } });
  console.log('SELL sample:', {
    id: sell?.id,
    dealerId: sell?.dealerId,
    points: sell?.points,
    txId: sell?.externalTransactionId,
    metadata: sell?.metadata ? JSON.parse(sell.metadata) : null,
  });

  const listing = await prisma.dealerActivity.findFirst({ where: { activityType: 'SELL_LISTING' } });
  console.log('SELL_LISTING sample:', {
    id: listing?.id,
    dealerId: listing?.dealerId,
    points: listing?.points,
    txId: listing?.externalTransactionId,
    metadata: listing?.metadata ? JSON.parse(listing.metadata) : null,
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
