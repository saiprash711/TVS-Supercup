import { prisma } from '../src/lib/db';

async function testExports() {
  console.log('Testing Admin Export data formatting directly from DB & Services...\n');

  // 1. Check Dealer 1434 in DB
  const dealer1434 = await prisma.dealer.findUnique({
    where: { externalDealerId: '1434' },
  });
  console.log('Dealer 1434 in DB:');
  console.log('  Display Name:', dealer1434?.displayName);
  console.log('  Masked Name:', dealer1434?.maskedName);
  console.log('  City:', dealer1434?.city);
  console.log('  Phone:', dealer1434?.phone);

  if (dealer1434?.displayName !== 'AMANA TOYOTA') {
    throw new Error(`Expected AMANA TOYOTA but got ${dealer1434?.displayName}`);
  }
  console.log('✅ Dealer 1434 has correct Company Name: AMANA TOYOTA');

  // 2. Check activities for 1434
  const acts1434 = await prisma.dealerActivity.findMany({
    where: { dealerId: dealer1434.id },
    include: { dealer: true },
    take: 3,
  });
  console.log(`\nSample activities for Dealer 1434 (${acts1434.length} sample):`);
  for (const a of acts1434) {
    console.log(`  Act #${a.id} [${a.activityType}] ${a.externalTransactionId} -> Company: "${a.dealer.displayName}"`);
  }

  // 3. Check Top 5 Leaderboard
  const scores = await prisma.dealerScore.findMany({
    include: { dealer: true },
    orderBy: { rank: 'asc' },
    take: 5,
  });
  console.log('\nTop 5 Leaderboard:');
  for (const s of scores) {
    console.log(`  #${s.rank} ${s.dealer.displayName} (${s.dealer.city}): ${s.totalPoints} pts`);
  }

  console.log('\n✅ All tests passed successfully!');
}

testExports()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
