import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CAMPAIGN_SLUG = 'supercup-2026-27';
const campaignData = {
  name: 'TVS Certified Super Cup 2026–27',
  startDate: new Date('2026-10-14T18:30:00.000Z'),
  endDate: new Date('2027-01-31T18:29:59.999Z'),
  type: 'SUPER_CUP',
  status: 'ACTIVE',
};

const rules = [
  // SELLING
  ['SELL_LISTING', 1, 'Selling: Points per vehicle listing (+1 pt per car listed)', true],
  ['SELL', 10, 'Selling: Conversion (+10 pts per car sold)', true],
  ['SELL_COMMISSION', 0, 'Selling: Commission points allocation (superseded by conversion)', false],
  // BUYING & GENERAL
  ['MATCH_PARTICIPATION', 1, 'Points for participating in a match day / event with >=1 car listed', true],
  ['ALL_MATCHES_BONUS', 5, 'Bonus points for joining/consigning in every match (+5 pts)', true],
  ['BID_PLACED', 1, 'Buying: Points per unique car bid (+1 pt per unique car)', true],
  ['BUY', 10, 'Buying: Conversion (+10 pts per car won and bought)', true],
] as const;

const matches = [
  { matchNumber: 1, auctionId: 'TVSC-2026-10-15', date: new Date('2026-10-15T08:30:00.000Z') },
  { matchNumber: 2, auctionId: 'TVSC-2026-10-22', date: new Date('2026-10-22T08:30:00.000Z') },
  { matchNumber: 3, auctionId: 'TVSC-2026-10-29', date: new Date('2026-10-29T08:30:00.000Z') },
  { matchNumber: 4, auctionId: 'TVSC-2026-11-05', date: new Date('2026-11-05T08:30:00.000Z') },
  { matchNumber: 5, auctionId: 'TVSC-2026-11-12', date: new Date('2026-11-12T08:30:00.000Z') },
  { matchNumber: 6, auctionId: 'TVSC-2026-11-19', date: new Date('2026-11-19T08:30:00.000Z') },
  { matchNumber: 7, auctionId: 'TVSC-2026-11-26', date: new Date('2026-11-26T08:30:00.000Z') },
  { matchNumber: 8, auctionId: 'TVSC-2026-12-03', date: new Date('2026-12-03T08:30:00.000Z') },
  { matchNumber: 9, auctionId: 'TVSC-2026-12-10', date: new Date('2026-12-10T08:30:00.000Z') },
  { matchNumber: 10, auctionId: 'TVSC-2026-12-17', date: new Date('2026-12-17T08:30:00.000Z') },
  { matchNumber: 11, auctionId: 'TVSC-2026-12-24', date: new Date('2026-12-24T08:30:00.000Z') },
  { matchNumber: 12, auctionId: 'TVSC-2026-12-31', date: new Date('2026-12-31T08:30:00.000Z') },
  { matchNumber: 13, auctionId: 'TVSC-2027-01-07', date: new Date('2027-01-07T08:30:00.000Z') },
  { matchNumber: 14, auctionId: 'TVSC-2027-01-14', date: new Date('2027-01-14T08:30:00.000Z') },
  { matchNumber: 15, auctionId: 'TVSC-2027-01-21', date: new Date('2027-01-21T08:30:00.000Z') },
  { matchNumber: 16, auctionId: 'TVSC-2027-01-28', date: new Date('2027-01-28T08:30:00.000Z') },
];

async function main() {
  await prisma.campaign.updateMany({
    where: {
      slug: { in: ['supercup-sept-oct-2026', 'september-2026', 'supercup-prelaunch-test-2026'] },
      status: 'ACTIVE',
    },
    data: { status: 'COMPLETED' },
  });

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

    for (const [activityType, points, description, active] of rules) {
      await tx.pointRule.upsert({
        where: { campaignId_activityType: { campaignId: activeCampaign.id, activityType } },
        update: { points, description, active },
        create: { campaignId: activeCampaign.id, activityType, points, description, active },
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
