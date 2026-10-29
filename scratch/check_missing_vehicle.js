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

  const vehRes = await fetch('https://tvscertified.in:8036/getAuctionvehicleList?auction_id=2038', { headers });
  const vehicles = (await vehRes.json())?.data || [];

  const target = vehicles.find(v => v.registration_number === 'TN22AV4304');
  console.log('TN22AV4304 in getAuctionvehicleList?');
  console.log(target);

  // Check in DB activities
  const acts = await prisma.dealerActivity.findMany({
    where: {
      OR: [
        { externalTransactionId: { contains: 'TN22AV4304' } },
        { metadata: { contains: 'TN22AV4304' } },
        { metadata: { contains: String(target?.vehicle_id || '99999999') } },
        { metadata: { contains: String(target?.id || '99999999') } }
      ]
    }
  });
  console.log('TN22AV4304 in dealerActivity count:', acts.length);
  console.log(acts);
}

check().catch(console.error).finally(() => prisma.$disconnect());
