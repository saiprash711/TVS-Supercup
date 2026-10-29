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

  const campaign = await prisma.campaign.findUnique({ where: { id: 13 } });
  console.log('Campaign 13 start:', campaign.startDate);
  console.log('Campaign 13 end:', campaign.endDate);

  let passed = 0;
  let failed = 0;
  const sampleFailed = [];

  for (const v of vehicles) {
    const createdStr = v.created;
    const modifiedStr = v.modified;
    // How tvs-integration parses timestamp:
    // veh.created ? parseTVSVehicleTimestamp(veh.created) : (veh.modified ? parseTVSVehicleTimestamp(veh.modified) : new Date())
    const ts = new Date(createdStr || modifiedStr || Date.now());
    const isWithin = ts >= campaign.startDate && ts <= campaign.endDate;
    if (isWithin) {
      passed++;
    } else {
      failed++;
      if (sampleFailed.length < 5) {
        sampleFailed.push({
          reg: v.registration_number,
          created: v.created,
          modified: v.modified,
          parsedTs: ts.toISOString()
        });
      }
    }
  }

  console.log(`Timestamp check against Campaign 13 dates:`);
  console.log(`Passed (within campaign): ${passed}`);
  console.log(`Failed (outside campaign): ${failed}`);
  console.log('Sample failed:', sampleFailed);
}

check().catch(console.error).finally(() => prisma.$disconnect());
