import { RealTVSAuctionProvider } from '../src/lib/services/tvs-integration';
import { prisma } from '../src/lib/db';

async function debug() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const provider = new RealTVSAuctionProvider();

  // 1. Fetch raw vehicles from TVS API for auction 2038
  const authRes = await fetch('https://tvscertified.in:8036/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bhavaniprasad999@gmail.com', password: 'KU9JhpWDCz' }),
  });
  const token = (await authRes.json())?.data?.data?.[0]?.token;
  const headers = { 'Authorization': token, 'Content-Type': 'application/json' };

  const vehRes = await fetch('https://tvscertified.in:8036/getAuctionvehicleList?auction_id=2038', { headers });
  const vehicles = (await vehRes.json())?.data || [];
  console.log(`TVS API returned ${vehicles.length} vehicles for auction 2038.`);

  // 2. Call provider.getAuctionActivities('2038', token)
  const activities = await provider.getAuctionActivities('2038', token);
  const listings = activities.filter(a => a.activityType === 'SELL_LISTING');
  console.log(`provider.getAuctionActivities produced ${listings.length} SELL_LISTING activities.`);

  // Compare which vehicles were included vs excluded in activities
  const listedVehIds = new Set(listings.map(l => String(l.metadata?.vehicleId || l.vehicleId)));
  const missingVehicles = vehicles.filter(v => !listedVehIds.has(String(v.vehicle_id || v.id)));
  console.log(`Missing vehicles in getAuctionActivities: ${missingVehicles.length}`);

  // 3. Now check how many of these listings are in DB
  const dbListings = await prisma.dealerActivity.findMany({
    where: { activityType: 'SELL_LISTING', externalTransactionId: { contains: '2038' } },
    include: { dealer: true }
  });
  console.log(`DB has ${dbListings.length} SELL_LISTING activities for 2038.`);

  // Check why listings in activities did NOT get saved into DB!
  const dbTxIds = new Set(dbListings.map(d => d.externalTransactionId));
  const notSaved = listings.filter(l => !dbTxIds.has(l.transactionId));
  console.log(`Listings produced by provider but NOT saved in DB: ${notSaved.length}`);
  if (notSaved.length > 0) {
    console.log('Sample unsaved listings (first 5):', notSaved.slice(0, 5).map(l => ({
      txId: l.transactionId,
      dealerId: l.dealerId,
      sellerName: l.metadata?.sellerName
    })));
  }
}

debug().catch(console.error).finally(() => prisma.$disconnect());
