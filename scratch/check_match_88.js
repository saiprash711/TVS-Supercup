const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const m88 = await prisma.matchDay.findUnique({ where: { id: 88 } });
  console.log('Match 88:', m88);

  const actSummary = await prisma.dealerActivity.groupBy({
    by: ['activityType'],
    where: { matchId: 88 },
    _count: true,
    _sum: { points: true }
  });
  console.log('Match 88 activity summary:', actSummary);
}
check().finally(() => prisma.$disconnect());
