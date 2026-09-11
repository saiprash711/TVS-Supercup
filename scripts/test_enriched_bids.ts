import { RealTVSAuctionProvider } from '../src/lib/services/tvs-integration';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function main() {
  const provider = new RealTVSAuctionProvider();
  const activities = await provider.getAuctionActivities('443');
  const bids = activities.filter(a => a.activityType === 'BID_PLACED');
  const buys = activities.filter(a => a.activityType === 'BUY');

  console.log(`Bids count: ${bids.length}, Buys count: ${buys.length}`);
  if (bids.length > 0) {
    console.log('Bid Metadata:', bids[0].metadata);
  }
  if (buys.length > 0) {
    console.log('Buy Metadata:', buys[0].metadata);
  }
}

main().catch(console.error);
