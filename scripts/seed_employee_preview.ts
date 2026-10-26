import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const EMPLOYEE_EXTERNAL_ID = 'DEMO-EMPLOYEE-2026';

export async function seedEmployeePreview() {
  console.log('Seeding employee preview account...');

  // 1. Check if previous colleague record exists or create employee record
  let dealer = await prisma.dealer.findFirst({
    where: { externalDealerId: { in: [EMPLOYEE_EXTERNAL_ID, 'DEMO-COLLEAGUE-2026'] } },
  });

  if (!dealer) {
    dealer = await prisma.dealer.create({
      data: {
        externalDealerId: EMPLOYEE_EXTERNAL_ID,
        displayName: 'TVS Certified Internal Employee',
        maskedName: 'T***** E*****',
        city: 'Chennai',
        category: 'Used Car Dealer',
        status: 'ACTIVE',
        password: null,
      },
    });
  } else {
    dealer = await prisma.dealer.update({
      where: { id: dealer.id },
      data: {
        externalDealerId: EMPLOYEE_EXTERNAL_ID,
        displayName: 'TVS Certified Internal Employee',
        maskedName: 'T***** E*****',
      },
    });
  }

  console.log('Dealer record created/updated:', dealer.id, dealer.displayName);

  // 2. Active Campaign (Campaign 13)
  const activeCamp = await prisma.campaign.findFirst({
    where: { status: 'ACTIVE' },
  }) || await prisma.campaign.findUnique({ where: { id: 13 } });

  if (!activeCamp) {
    console.error('No active campaign found.');
    return dealer;
  }

  console.log('Active campaign:', activeCamp.id, activeCamp.name);

  // 3. Match 1
  const match1 = await prisma.matchDay.findFirst({
    where: { campaignId: activeCamp.id, matchNumber: 1 },
  });
  const matchId = match1?.id || 1;
  const baseTime = match1?.date ? new Date(match1.date) : new Date(activeCamp.startDate);

  // Clean existing demo activities for this campaign
  await prisma.dealerActivity.deleteMany({
    where: { dealerId: dealer.id, campaignId: activeCamp.id },
  });

  // Create demo activities
  await prisma.dealerActivity.createMany({
    data: [
      {
        dealerId: dealer.id,
        campaignId: activeCamp.id,
        matchId,
        activityType: 'MATCH_PARTICIPATION',
        externalTransactionId: `DEMO-ATTEND-${activeCamp.id}-${dealer.id}`,
        points: 2,
        metadata: JSON.stringify({ source: 'DEMO_PREVIEW_ATTENDANCE' }),
        timestamp: baseTime,
      },
      {
        dealerId: dealer.id,
        campaignId: activeCamp.id,
        matchId,
        activityType: 'BID_PLACED',
        externalTransactionId: `DEMO-BID-1-${dealer.id}`,
        points: 1,
        metadata: JSON.stringify({ vehicleName: 'TVS Apache RTR 160', bidAmount: 85000, isPreBid: false }),
        timestamp: baseTime,
      },
      {
        dealerId: dealer.id,
        campaignId: activeCamp.id,
        matchId,
        activityType: 'BID_PLACED',
        externalTransactionId: `DEMO-BID-2-${dealer.id}`,
        points: 1,
        metadata: JSON.stringify({ vehicleName: 'Hyundai i20 Magna', bidAmount: 420000, isPreBid: false }),
        timestamp: baseTime,
      },
      {
        dealerId: dealer.id,
        campaignId: activeCamp.id,
        matchId,
        activityType: 'BUY',
        externalTransactionId: `DEMO-BUY-1-${dealer.id}`,
        points: 5,
        metadata: JSON.stringify({ vehicleName: 'Maruti Swift VXi', winningBid: 490000 }),
        timestamp: baseTime,
      },
      {
        dealerId: dealer.id,
        campaignId: activeCamp.id,
        matchId,
        activityType: 'SELL_LISTING',
        externalTransactionId: `DEMO-SELL-1-${dealer.id}`,
        points: 5,
        metadata: JSON.stringify({ vehicleName: 'Honda City ZX', expectedPrice: 650000 }),
        timestamp: baseTime,
      },
    ],
  });

  // Upsert DealerScore
  const totalPoints = 14;
  await prisma.dealerScore.upsert({
    where: { dealerId_campaignId: { dealerId: dealer.id, campaignId: activeCamp.id } },
    update: { totalPoints },
    create: { dealerId: dealer.id, campaignId: activeCamp.id, totalPoints, rank: 12 },
  });

  console.log('Seeded demo activities and score successfully for employee preview dealer', dealer.id);
  return dealer;
}

if (require.main === module) {
  seedEmployeePreview()
    .then(() => console.log('Done.'))
    .catch((err) => console.error(err))
    .finally(() => prisma.$disconnect());
}
