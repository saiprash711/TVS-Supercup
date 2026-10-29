import { RealTVSAuctionProvider } from '../src/lib/services/tvs-integration';
import { prisma } from '../src/lib/db';

async function test() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const provider = new RealTVSAuctionProvider();

  const authRes = await fetch('https://tvscertified.in:8036/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bhavaniprasad999@gmail.com', password: 'KU9JhpWDCz' }),
  });
  const token = (await authRes.json())?.data?.data?.[0]?.token;
  const activities = await provider.getAuctionActivities('2038', token);
  const listings = activities.filter(a => a.activityType === 'SELL_LISTING');
  console.log(`Found ${listings.length} listings from provider.`);

  const campaignId = 13;
  const matchId = 88;

  // Check the first 10 unsaved listings
  const dbListings = await prisma.dealerActivity.findMany({
    where: { activityType: 'SELL_LISTING', externalTransactionId: { contains: '2038' } },
  });
  const dbTxSet = new Set(dbListings.map(d => d.externalTransactionId));
  const unsaved = listings.filter(l => !dbTxSet.has(l.transactionId));

  console.log(`Total unsaved: ${unsaved.length}`);

  // Let's inspect why the first 5 were not saved:
  for (const l of unsaved.slice(0, 5)) {
    console.log('\nInspecting unsaved listing:', {
      txId: l.transactionId,
      dealerId: l.dealerId,
      sellerName: l.metadata?.sellerName,
      customerName: l.metadata?.customerName
    });

    // Check if this txId exists anywhere in DB
    const anyAct = await prisma.dealerActivity.findMany({
      where: { externalTransactionId: l.transactionId }
    });
    console.log('Exists anywhere in dealerActivity with this txId?', anyAct.map(a => ({
      id: a.id,
      campaignId: a.campaignId,
      matchId: a.matchId,
      dealerId: a.dealerId,
      type: a.activityType
    })));

    // Check dealer resolution
    const dealerByName = await prisma.dealer.findFirst({
      where: {
        OR: [
          { displayName: l.metadata?.sellerName },
          { externalDealerId: l.dealerId }
        ]
      }
    });
    console.log('Dealer found in DB:', dealerByName ? { id: dealerByName.id, name: dealerByName.displayName, extId: dealerByName.externalDealerId } : 'NOT FOUND');
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
