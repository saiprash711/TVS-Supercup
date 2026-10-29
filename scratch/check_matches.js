const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const matches = await prisma.matchDay.findMany({
    where: { campaignId: 13 },
    include: { _count: { select: { activities: true } } }
  });
  console.log('Matches for campaign 13:');
  console.log(matches.map(m => ({
    id: m.id,
    matchNumber: m.matchNumber,
    name: m.name,
    scheduledDate: m.scheduledDate,
    status: m.status,
    externalAuctionId: m.externalAuctionId,
    activitiesCount: m._count.activities
  })));
}
check().finally(() => prisma.$disconnect());
