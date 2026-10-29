const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const rows = await prisma.dealerActivity.findMany({
    where: { matchId: 88, activityType: 'SELL_LISTING' },
    include: { dealer: true }
  });
  const c = {};
  for (const r of rows) {
    const k = r.dealer?.displayName || r.dealerId;
    c[k] = (c[k] || 0) + 1;
  }
  console.log('Listings awarded in Match 88:');
  console.log(c);
}
check().finally(() => prisma.$disconnect());
