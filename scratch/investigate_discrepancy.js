const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const completedFile = 'C:\\Users\\TC100\\Downloads\\Completed Auctions (1).xlsx';
const supercupFile = 'C:\\Users\\TC100\\Downloads\\tvs-supercup-auction-2038-leaderboard-points-audit-2026-10-15.xlsx';

async function investigate() {
  const wbCompleted = XLSX.readFile(completedFile);
  const wbSupercup = XLSX.readFile(supercupFile);

  const completedRows = XLSX.utils.sheet_to_json(wbCompleted.Sheets[wbCompleted.SheetNames[0]]);
  const supercupLots = XLSX.utils.sheet_to_json(wbSupercup.Sheets['Vehicle Lots & Results']);

  // 1. Missing vehicle
  const scRegs = new Set(supercupLots.map(r => r['Registration Number']?.trim()));
  const missingInSc = completedRows.filter(r => !scRegs.has(r['Registration Number']?.trim()));
  console.log('--- Missing vehicle in Supercup ---');
  console.log(missingInSc);

  // 2. Check why only 15 listings were awarded in DB
  // Why did only 15 vehicles get SELL_LISTING in match 88?
  // Let's inspect the 124 vehicles from TVS API getAuctionvehicleList?auction_id=2038
  const existingListings = await prisma.dealerActivity.findMany({
    where: { activityType: 'SELL_LISTING' },
    select: { externalTransactionId: true, dealerId: true, campaignId: true, matchId: true }
  });
  console.log('\n--- Existing SELL_LISTING in DB count:', existingListings.length);
  // Check if transactions were already in DB from prior campaigns or match 88
  const txSet = new Set();
  for (const l of existingListings) {
    txSet.add(`${l.campaignId}:${l.externalTransactionId}`);
  }

  // Check how many of the 124 vehicles have transaction IDs in txSet
  let alreadyRecordedInEarlierCampaign = 0;
  let notRecorded = 0;
  let inMatch88 = 0;

  for (const r of completedRows) {
    // In tvs-integration: transactionId was `LISTING-2038-${veh.id || veh.vehicle_id}`
    // Let's check what transaction IDs exist for 2038
  }

  // Let's search DB for any dealerActivity with externalTransactionId containing 2038
  const acts2038 = await prisma.dealerActivity.findMany({
    where: { externalTransactionId: { contains: '2038' } },
    select: { id: true, activityType: true, externalTransactionId: true, matchId: true, campaignId: true, dealerId: true }
  });
  console.log(`\nTotal activities in DB with '2038' in externalTransactionId: ${acts2038.length}`);
  const byType2038 = {};
  for (const a of acts2038) {
    byType2038[a.activityType] = (byType2038[a.activityType] || 0) + 1;
  }
  console.log('By type for 2038:', byType2038);

  // 3. Check winner 1159
  const d1159 = await prisma.dealer.findMany({
    where: {
      OR: [
        { externalDealerId: '1159' },
        { externalDealerId: 'USR-1159' },
        { id: 1159 },
        { displayName: { contains: 'THANGAPANDIAN' } },
        { displayName: { contains: 'JOTHI' } }
      ]
    }
  });
  console.log('\n--- Dealer search for 1159 / Thangapandian / Jothi ---');
  console.log(d1159);
}

investigate().finally(() => prisma.$disconnect());
