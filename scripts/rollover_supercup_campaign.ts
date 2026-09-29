import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CAMPAIGN_SLUG = 'supercup-2026-27';
const campaignData = {
  name: 'TVS Certified Super Cup 2026–27',
  startDate: new Date('2026-10-14T18:30:00.000Z'),
  endDate: new Date('2027-01-14T18:29:59.999Z'),
  type: 'SUPER_CUP',
  status: 'ACTIVE',
};

const rules = [
  // SELLING
  ['SELL_LISTING', 5, 'Selling: Points per vehicle listing'],
  ['SELL', 10, 'Selling: Points per vehicle conversion/sold'],
  ['SELL_COMMISSION', 5, 'Selling: Commission points allocation'],
  // BUYING
  ['MATCH_PARTICIPATION', 1, 'Buying: Points for participating in a match day'],
  ['BID_PLACED', 1, 'Buying: Points per verified live auction bid'],
  ['BUY', 10, 'Buying: Points per vehicle conversion/purchased'],
] as const;

const matches = [
  { matchNumber: 1, auctionId: 'TVSC-2026-10-15', date: new Date('2026-10-15T08:30:00.000Z') },
  { matchNumber: 2, auctionId: 'TVSC-2026-11-12', date: new Date('2026-11-12T08:30:00.000Z') },
  { matchNumber: 3, auctionId: 'TVSC-2026-12-10', date: new Date('2026-12-10T08:30:00.000Z') },
  { matchNumber: 4, auctionId: 'TVSC-2027-01-14', date: new Date('2027-01-14T08:30:00.000Z') },
];

async function main() {
  const existingCampaign = await prisma.campaign.findUnique({
    where: { slug: CAMPAIGN_SLUG },
    select: { id: true },
  });

  const campaign = await prisma.$transaction(async (tx) => {
    const activeCampaign = await tx.campaign.upsert({
      where: { slug: CAMPAIGN_SLUG },
      update: campaignData,
      create: { slug: CAMPAIGN_SLUG, ...campaignData },
    });

    for (const [activityType, points, description] of rules) {
      await tx.pointRule.upsert({
        where: { campaignId_activityType: { campaignId: activeCampaign.id, activityType } },
        update: { points, description, active: true },
        create: { campaignId: activeCampaign.id, activityType, points, description, active: true },
      });
    }

    for (const match of matches) {
      await tx.matchDay.upsert({
        where: {
          campaignId_matchNumber: {
            campaignId: activeCampaign.id,
            matchNumber: match.matchNumber,
          },
        },
        update: { date: match.date, auctionId: match.auctionId, status: 'UPCOMING' },
        create: {
          campaignId: activeCampaign.id,
          ...match,
          status: 'UPCOMING',
        },
      });
    }

    if (!existingCampaign) {
      await tx.auditLog.create({
        data: {
          adminUser: 'system',
          action: 'CAMPAIGN_ROLLOVER',
          targetType: 'CAMPAIGN',
          targetId: String(activeCampaign.id),
          details: JSON.stringify({
            slug: CAMPAIGN_SLUG,
            startDate: campaignData.startDate,
            endDate: campaignData.endDate,
            matches: matches.map(({ matchNumber, date, auctionId }) => ({ matchNumber, date, auctionId })),
          }),
          reason: 'Start the corrected Oct 2026–Jan 2027 Super Cup without carrying September test data forward',
        },
      });
    }

    return activeCampaign;
  });

  const dealers = await prisma.dealer.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  });

  for (let i = 0; i < dealers.length; i += 100) {
    const batch = dealers.slice(i, i + 100);
    await prisma.$transaction(
      batch.map(({ id: dealerId }) => prisma.dealerScore.upsert({
        where: { dealerId_campaignId: { dealerId, campaignId: campaign.id } },
        update: {},
        create: { dealerId, campaignId: campaign.id, totalPoints: 0, rank: 0 },
      }))
    );
  }

  console.log(JSON.stringify({
    campaignId: campaign.id,
    campaign: campaign.name,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    matches: matches.length,
    dealersInitialized: dealers.length,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
