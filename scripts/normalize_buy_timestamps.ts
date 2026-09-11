import { prisma } from '../src/lib/db';

async function main() {
  console.log('--- Normalizing BUY Timestamps for Auction #1978 ---');

  const buysToFix = await prisma.dealerActivity.findMany({
    where: {
      activityType: 'BUY',
      timestamp: { gte: new Date('2026-09-10T12:00:00.000Z') },
    },
    select: { id: true, externalTransactionId: true, timestamp: true },
  });

  console.log(`Found ${buysToFix.length} BUY records with unadjusted future IST timestamps.`);

  if (buysToFix.length === 0) {
    console.log('All BUY timestamps are already normalized.');
    return;
  }

  const OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds

  let updated = 0;
  for (const buy of buysToFix) {
    const adjustedTime = new Date(buy.timestamp.getTime() - OFFSET_MS);
    await prisma.dealerActivity.update({
      where: { id: buy.id },
      data: { timestamp: adjustedTime },
    });
    updated++;
  }

  console.log(`✅ Successfully normalized ${updated} BUY timestamps from IST pseudo-UTC to real UTC.`);

  // Verify the top 5 activities across ALL types now
  const latestActivities = await prisma.dealerActivity.findMany({
    where: { externalTransactionId: { contains: '1978' } },
    orderBy: { timestamp: 'desc' },
    take: 10,
    select: {
      id: true,
      activityType: true,
      points: true,
      externalTransactionId: true,
      timestamp: true,
    },
  });

  console.log('\nTop 10 Latest Activities Across All Types (interleaved):');
  for (const a of latestActivities) {
    console.log(`  [${a.timestamp.toISOString()}] ${a.activityType.padEnd(12)} ${a.externalTransactionId}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
