import { RealTVSAuctionProvider } from '../src/lib/services/tvs-integration';

async function test() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const service = new RealTVSAuctionProvider();
  console.log('Fetching activities for auction 2038...');
  const activities = await service.getAuctionActivities('2038');
  console.log(`Total activities returned: ${activities.length}`);

  const byType: Record<string, number> = {};
  for (const a of activities) {
    byType[a.activityType] = (byType[a.activityType] || 0) + 1;
  }
  console.log('Activities by type:', byType);

  const listings = activities.filter(a => a.activityType === 'SELL_LISTING');
  console.log(`SELL_LISTING count: ${listings.length}`);

  const listingDealers: Record<string, number> = {};
  for (const l of listings) {
    const d = `${l.metadata?.sellerName} (${l.dealerId})`;
    listingDealers[d] = (listingDealers[d] || 0) + 1;
  }
  console.log('SELL_LISTING dealer breakdown in getAuctionActivities:');
  console.log(listingDealers);
}
test().catch(console.error);
