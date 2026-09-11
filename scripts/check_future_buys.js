const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const futureBuys = await prisma.dealerActivity.findMany({
    where: {
      activityType: 'BUY',
      timestamp: { gte: new Date('2026-09-10T12:00:00.000Z') }
    },
    select: { id: true, externalTransactionId: true, timestamp: true, createdAt: true }
  });

  console.log('Buys with >= 12:00 UTC timestamp:', futureBuys.length);
  for (const b of futureBuys) {
    console.log(b.id, b.externalTransactionId, b.timestamp.toISOString(), 'created:', b.createdAt.toISOString());
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
