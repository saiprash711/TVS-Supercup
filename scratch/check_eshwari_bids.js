const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const authRes = await fetch('https://tvscertified.in:8036/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bhavaniprasad999@gmail.com', password: 'KU9JhpWDCz' }),
  });
  const token = (await authRes.json())?.data?.data?.[0]?.token;
  const headers = { 'Authorization': token, 'Content-Type': 'application/json' };

  // Get vehicles won by Eshwari Caars (dealer 4806)
  const eshwariBuys = await prisma.dealerActivity.findMany({
    where: { dealerId: 4806, activityType: 'BUY' }
  });

  for (const b of eshwariBuys.slice(0, 3)) {
    const meta = JSON.parse(b.metadata || '{}');
    const avId = b.externalTransactionId.replace('BUY-2038-', '');
    console.log(`\nVehicle avId: ${avId}, reg: ${meta.regNo}`);
    const bidsRes = await fetch(`https://tvscertified.in:8036/getLiveBids?auction_id=2038&auction_vehile_id=${avId}`, { headers });
    const bidsJson = await bidsRes.json();
    console.log('  Live bids rows:', bidsJson?.data?.length);
    if (bidsJson?.data?.length > 0) {
      for (const item of bidsJson.data) {
        const bd = item.bidderDetails || item;
        console.log(`    bidder_id: ${bd.bidder_id}, bidder_name: "${bd.bidder_name}", amount: ${bd.bid_value}`);
      }
    }
  }
}

check().then(() => prisma.$disconnect());
