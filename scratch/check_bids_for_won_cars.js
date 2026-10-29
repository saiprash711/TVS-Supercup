const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const buyActs = await prisma.dealerActivity.findMany({
    where: {
      dealerId: { in: [4340, 4806] },
      activityType: 'BUY'
    }
  });

  console.log('Found BUY acts:', buyActs.length);
  for (const b of buyActs.slice(0, 5)) {
    const meta = JSON.parse(b.metadata || '{}');
    console.log(`BUY act ${b.id}: dealerId=${b.dealerId}, regNo=${meta.regNo}, winningBid=${meta.winningBid}, extTx=${b.externalTransactionId}`);
    
    // Check if ANY BID_PLACED activity exists in DB for this regNo or externalTransactionId
    const bidsForVehicle = await prisma.dealerActivity.findMany({
      where: {
        activityType: 'BID_PLACED',
        OR: [
          meta.regNo ? { metadata: { contains: meta.regNo } } : undefined,
          meta.vehicleId ? { metadata: { contains: String(meta.vehicleId) } } : undefined,
          { externalTransactionId: { contains: b.externalTransactionId.replace('BUY-', '') } }
        ].filter(Boolean)
      },
      select: { id: true, dealerId: true, points: true, externalTransactionId: true, metadata: true }
    });
    console.log(`  -> BID_PLACED records in DB matching this vehicle: ${bidsForVehicle.length}`);
    if (bidsForVehicle.length > 0) {
      console.log('     Dealers who bid on it in DB:', bidsForVehicle.map(x => ({ dealerId: x.dealerId, extTx: x.externalTransactionId })));
    }
  }

  // Also check total BID_PLACED activities in DB for match 88 or auction 2038
  const allBids2038 = await prisma.dealerActivity.findMany({
    where: {
      activityType: 'BID_PLACED',
      OR: [
        { externalTransactionId: { contains: '2038' } },
        { metadata: { contains: '2038' } }
      ]
    },
    select: { id: true, dealerId: true }
  });
  console.log('\nTotal BID_PLACED in DB for 2038:', allBids2038.length);
  const dealersWithBids = new Set(allBids2038.map(x => x.dealerId));
  console.log('Distinct dealers with bids for 2038 in DB:', dealersWithBids.size);
  console.log('Is 4340 in dealersWithBids?', dealersWithBids.has(4340));
  console.log('Is 4806 in dealersWithBids?', dealersWithBids.has(4806));
}

check().then(() => prisma.$disconnect());
