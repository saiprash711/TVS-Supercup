import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CAMPAIGN_SLUG = 'supercup-prelaunch-test-2026';
const campaignData = {
  name: 'TVS Super Cup — Pre-Launch Test',
  startDate: new Date('2026-09-27T18:30:00.000Z'),
  endDate: new Date('2026-10-14T18:29:59.999Z'),
  type: 'SUPER_CUP',
  status: 'ACTIVE',
};

const rules = [
  // SELLING
  ['SELL_LISTING', 5, 'Selling: Points per vehicle listing', true],
  ['SELL_COMMISSION', 5, 'Selling: Commission points allocation', true],
  ['SELL', 0, 'Selling: Conversion (deactivated / not captured in website)', false],
  // BUYING
  ['MATCH_PARTICIPATION', 1, 'Buying: Test match participation points', true],
  ['BID_PLACED', 1, 'Buying: Points per verified live auction bid', true],
  ['BUY', 0, 'Buying: Conversion (deactivated / not captured in website)', false],
] as const;

const matches = [
  { matchNumber: 1, auctionId: 'TVSC-2026-10-01', date: new Date('2026-10-01T08:30:00.000Z') },
  { matchNumber: 2, auctionId: 'TVSC-2026-10-08', date: new Date('2026-10-08T08:30:00.000Z') },
];

async function main() {
  const existed = await prisma.campaign.findUnique({
    where: { slug: CAMPAIGN_SLUG },
    select: { id: true },
  });

  const campaign = await prisma.$transaction(async (tx) => {
    const result = await tx.campaign.upsert({
      where: { slug: CAMPAIGN_SLUG },
      update: campaignData,
      create: { slug: CAMPAIGN_SLUG, ...campaignData },
    });

    for (const [activityType, points, description, active] of rules) {
      await tx.pointRule.upsert({
        where: { campaignId_activityType: { campaignId: result.id, activityType } },
        update: { points, description, active },
        create: { campaignId: result.id, activityType, points, description, active },
      });
    }

    for (const match of matches) {
      await tx.matchDay.upsert({
        where: { campaignId_matchNumber: { campaignId: result.id, matchNumber: match.matchNumber } },
        update: { date: match.date, auctionId: match.auctionId, status: 'UPCOMING' },
        create: { campaignId: result.id, ...match, status: 'UPCOMING' },
      });
    }

    if (!existed) {
      await tx.auditLog.create({
        data: {
          adminUser: 'system',
          action: 'PRELAUNCH_TEST_CAMPAIGN_CREATED',
          targetType: 'CAMPAIGN',
          targetId: String(result.id),
          details: JSON.stringify({ slug: CAMPAIGN_SLUG, matches }),
          reason: 'Isolate 1 October and 8 October testing from the live campaign starting 15 October',
        },
      });
    }

    return result;
  });

  const dealers = await prisma.dealer.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  });

  for (let index = 0; index < dealers.length; index += 100) {
    const batch = dealers.slice(index, index + 100);
    await prisma.$transaction(batch.map(({ id: dealerId }) => prisma.dealerScore.upsert({
      where: { dealerId_campaignId: { dealerId, campaignId: campaign.id } },
      update: {},
      create: { dealerId, campaignId: campaign.id, totalPoints: 0, rank: 0 },
    })));
  }

  console.log(JSON.stringify({
    campaignId: campaign.id,
    campaign: campaign.name,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    matches,
    dealersInitialized: dealers.length,
    note: 'Replace both TVSC date placeholders with real TVS auction IDs before testing.',
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
