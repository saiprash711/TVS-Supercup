const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const listings = await prisma.dealerActivity.findMany({
    where: { matchId: 88, activityType: 'SELL_LISTING' },
    include: { dealer: true }
  });
  console.log(`Match 88 listings count: ${listings.length}`);
  for (const l of listings) {
    console.log({
      dealer: l.dealer?.displayName,
      dealerId: l.dealerId,
      externalTxId: l.externalTransactionId,
      metadata: l.metadata,
      points: l.points
    });
  }
}
check().finally(() => prisma.$disconnect());
