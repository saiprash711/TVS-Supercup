const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const staticCustomerMapping = require('../src/lib/data/tvs-customer-mapping.json');

const completedFile = 'C:\\Users\\TC100\\Downloads\\Completed Auctions (1).xlsx';
const wb = XLSX.readFile(completedFile);
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

console.log(`Read ${rows.length} rows from Completed Auctions (1).xlsx`);

// Mapping for the 6 rows with 'null' Listed By based on their verified legal_name in TVS customers table
const nullSellerMap = {
  'TN69AE3286': { id: 448, name: 'POPULAR VEHICLES AND SERVICES LIMITED' },
  'TN02BQ5717': { id: 448, name: 'POPULAR VEHICLES AND SERVICES LIMITED' },
  'TN85P7391':  { id: 448, name: 'POPULAR VEHICLES AND SERVICES LIMITED' },
  'TN22CJ3173': { id: 459, name: 'Shree Thiya cars' },
  'TN74K8683':  { id: 458, name: 'PRODUCTIVITY ELEMENTS PRIVATE LIMITED' },
  'TN09BF7322': { id: 451, name: 'VISHNU CARS PRIVATE LIMITED' },
};

// Aliases for dealers whose name in Excel slightly differs from DB
const nameAliases = {
  'Harsha': 'Harsha Toyota',
  'NIRMAL': 'NIRMAL CARS',
  'Epic Toyota': 'EPIC Toyota',
};

async function testReconciliation() {
  const allDealers = await prisma.dealer.findMany();
  const dealerByName = new Map();
  const dealerByExtId = new Map();
  for (const d of allDealers) {
    dealerByName.set(d.displayName.trim().toLowerCase(), d);
    dealerByExtId.set(String(d.externalDealerId), d);
  }

  const listingSummary = {};

  for (const r of rows) {
    const reg = (r['Registration Number'] || '').trim();
    let sellerName = (r['Listed By'] || '').trim();
    let extId = null;

    if (!sellerName || sellerName === 'null') {
      const resolved = nullSellerMap[reg];
      if (resolved) {
        sellerName = resolved.name;
        extId = String(resolved.id);
      }
    }

    if (nameAliases[sellerName]) {
      sellerName = nameAliases[sellerName];
    }

    // Find in DB
    let dealer = dealerByName.get(sellerName.toLowerCase());
    if (!dealer && extId) {
      dealer = dealerByExtId.get(extId);
    }

    if (!dealer) {
      console.warn(`Could not resolve dealer: "${sellerName}" for reg ${reg}`);
      continue;
    }

    if (!listingSummary[dealer.displayName]) {
      listingSummary[dealer.displayName] = {
        dealerId: dealer.id,
        dealerCode: dealer.externalDealerId,
        count: 0,
        points: 0,
        vehicles: []
      };
    }

    listingSummary[dealer.displayName].count++;
    listingSummary[dealer.displayName].points += 5;
    listingSummary[dealer.displayName].vehicles.push(reg);
  }

  console.log('\n--- Reconciled Seller Listings ---');
  let totalVehicles = 0;
  let totalPoints = 0;
  const sorted = Object.entries(listingSummary).sort((a, b) => b[1].count - a[1].count);
  for (const [name, data] of sorted) {
    totalVehicles += data.count;
    totalPoints += data.points;
    console.log(`${name} (Code: ${data.dealerCode}, ID: ${data.dealerId}): ${data.count} vehicles x 5 pts = ${data.points} pts`);
  }

  console.log(`\nTOTAL VEHICLES RECONCILED: ${totalVehicles} / ${rows.length}`);
  console.log(`TOTAL SELLER LISTING POINTS: ${totalPoints} pts`);
}

testReconciliation().catch(console.error).finally(() => prisma.$disconnect());
