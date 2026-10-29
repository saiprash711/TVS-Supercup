const { TVSIntegrationService } = require('./src/lib/services/tvs-integration');

async function test() {
  const service = new TVSIntegrationService();
  console.log('Fetching activities for auction 2038...');
  const activities = await service.getAuctionActivities('2038');
  console.log(`Total activities returned: ${activities.length}`);

  const byType = {};
  for (const a of activities) {
    byType[a.activityType] = (byType[a.activityType] || 0) + 1;
  }
  console.log('Activities by type:', byType);

  const listings = activities.filter(a => a.activityType === 'SELL_LISTING');
  console.log(`SELL_LISTING count: ${listings.length}`);

  const listingDealers = {};
  for (const l of listings) {
    const d = l.dealerId;
    listingDealers[d] = (listingDealers[d] || 0) + 1;
  }
  console.log('SELL_LISTING dealer IDs:', listingDealers);
}
test().catch(console.error);
