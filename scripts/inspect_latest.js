const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const latestActs = await prisma.dealerActivity.findMany({
    orderBy: { id: 'desc' },
    take: 10,
    select: { id: true, activityType: true, timestamp: true, externalTransactionId: true, createdAt: true }
  });

  console.log('Latest 10 activities by ID:');
  for (const a of latestActs) {
    console.log(a.id, a.activityType, a.externalTransactionId, 'timestamp:', a.timestamp.toISOString(), 'createdAt:', a.createdAt.toISOString());
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
