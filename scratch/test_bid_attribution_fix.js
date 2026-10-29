const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const customerMapping = require('../src/lib/data/tvs-customer-mapping.json');

async function test() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const authRes = await fetch('https://tvscertified.in:8036/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bhavaniprasad999@gmail.com', password: 'KU9JhpWDCz' }),
  });
  const token = (await authRes.json())?.data?.data?.[0]?.token;
  const headers = { 'Authorization': token, 'Content-Type': 'application/json' };

  // Fetch all vehicles for auction 2038
  const vehRes = await fetch('https://tvscertified.in:8036/getAuctionVehicles?auction_id=2038', { headers });
  const vehicles = (await vehRes.json())?.data || [];
  console.log(`Loaded ${vehicles.length} vehicles for auction 2038.`);

  // Load all dealers from DB
  const dealers = await prisma.dealer.findMany();
  const dealerByName = new Map();
  const dealerByExtId = new Map();
  for (const d of dealers) {
    dealerByName.set(d.displayName.trim().toLowerCase(), d);
    dealerByExtId.set(String(d.externalDealerId), d);
  }

  // Count bids for each dealer when resolving properly
  const dealerBids = new Map(); // dealerId -> count

  for (let i = 0; i < Math.min(vehicles.length, 30); i++) {
    const v = vehicles[i];
    const bidsRes = await fetch(`https://tvscertified.in:8036/getLiveBids?auction_id=2038&auction_vehile_id=${v.id}`, { headers });
    const bList = (await bidsRes.json())?.data || [];
    for (const bItem of bList) {
      const bid = bItem?.bidderDetails || bItem;
      const bName = (bid.bidder_name || '').trim();
      const bId = String(bid.bidder_id || '');

      let matchedDealer = null;
      if (bName && bName !== 'null' && dealerByName.has(bName.toLowerCase())) {
        matchedDealer = dealerByName.get(bName.toLowerCase());
      } else if (bId && dealerByExtId.has(bId)) {
        matchedDealer = dealerByExtId.get(bId);
      }

      if (matchedDealer) {
        dealerBids.set(matchedDealer.displayName, (dealerBids.get(matchedDealer.displayName) || 0) + 1);
      }
    }
  }

  console.log('\nSample Dealer bid counts across first 30 vehicles:');
  const sorted = [...dealerBids.entries()].sort((a, b) => b[1] - a[1]);
  sorted.slice(0, 15).forEach(([name, count]) => {
    console.log(`  - ${name}: ${count} bids`);
  });

  console.log('\nCheck specific winners:');
  console.log('ESHWARI CAARS bids:', dealerBids.get('ESHWARI CAARS') || 0);
  console.log('THANGAPANDIAN CARS bids:', dealerBids.get('THANGAPANDIAN CARS') || 0);

  await prisma.$disconnect();
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
