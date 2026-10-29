const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const counts = await prisma.dealerActivity.groupBy({
    by: ['activityType'],
    where: { campaignId: 13 },
    _count: { id: true },
    _sum: { points: true },
  });
  console.log('Campaign 13 Activity Breakdown:', counts);

  const rules = await prisma.pointRule.findMany({
    where: { campaignId: 13 },
  });
  console.log('\nCampaign 13 Point Rules:');
  for (const r of rules) {
    console.log(`  ${r.activityType}: ${r.points} pts (${r.active ? 'ACTIVE' : 'INACTIVE'})`);
  }
}

main().finally(() => prisma.$disconnect());
