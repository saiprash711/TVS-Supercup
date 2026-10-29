const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const staticCustomerMapping = require('../src/lib/data/tvs-customer-mapping.json');
const completedFile = 'C:\\Users\\TC100\\Downloads\\Completed Auctions (1).xlsx';
const wb = XLSX.readFile(completedFile);
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

async function checkDealers() {
  const allDealers = await prisma.dealer.findMany();
  const byName = new Map();
  const byExtId = new Map();
  for (const d of allDealers) {
    byName.set(d.displayName.trim().toLowerCase(), d);
    byExtId.set(String(d.externalDealerId), d);
  }

  const nullIdMap = {
    'TN69AE3286': 448,
    'TN02BQ5717': 448,
    'TN85P7391': 448,
    'TN22CJ3173': 459,
    'TN74K8683': 458,
    'TN09BF7322': 451
  };

  const sellerSummary = {};

  for (const r of rows) {
    const reg = r['Registration Number'];
    let sellerName = r['Listed By'];
    let custId = null;

    if (!sellerName || sellerName === 'null') {
      custId = nullIdMap[reg];
      if (custId && staticCustomerMapping[String(custId)]) {
        sellerName = staticCustomerMapping[String(custId)].legal_name || staticCustomerMapping[String(custId)].companyName;
      }
    }

    sellerName = (sellerName || 'Unknown').trim();
    if (!sellerSummary[sellerName]) {
      sellerSummary[sellerName] = { count: 0, custId, inDb: false, dbId: null, dbName: null, extId: null };
    }
    sellerSummary[sellerName].count++;
  }

  for (const [name, info] of Object.entries(sellerSummary)) {
    const dByName = byName.get(name.toLowerCase());
    let d = dByName;
    if (!d && info.custId) {
      d = byExtId.get(String(info.custId));
    }
    if (d) {
      info.inDb = true;
      info.dbId = d.id;
      info.dbName = d.displayName;
      info.extId = d.externalDealerId;
    }
  }

  console.log('--- Dealer presence in Supercup DB ---');
  let missingCount = 0;
  for (const [name, info] of Object.entries(sellerSummary)) {
    if (info.inDb) {
      console.log(`[FOUND] ${name} (x${info.count}) -> DB ID: ${info.dbId}, extId: ${info.extId}, DB Name: "${info.dbName}"`);
    } else {
      missingCount++;
      console.log(`[MISSING] ${name} (x${info.count})`);
    }
  }
  console.log(`\nTotal dealers: ${Object.keys(sellerSummary).length}, Missing: ${missingCount}`);
}

checkDealers().catch(console.error).finally(() => prisma.$disconnect());
