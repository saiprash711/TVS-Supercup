const XLSX = require('xlsx');

const completedFile = 'C:\\Users\\TC100\\Downloads\\Completed Auctions (1).xlsx';
const wb = XLSX.readFile(completedFile);
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

const staticCustomerMapping = require('../src/lib/data/tvs-customer-mapping.json');

async function test() {
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

  const compMap = new Map();
  for (const r of rows) {
    compMap.set(r['Registration Number'], r);
  }

  let matchCustIdCount = 0;
  let mismatchCount = 0;
  const mismatches = [];

  for (const v of vehicles) {
    if (v.winner_id == null) continue;
    const reg = v.registration_number;
    const compRow = compMap.get(reg);
    const expectedWinnerName = (compRow?.['Winner Name'] || '').trim().toLowerCase();
    
    // Check if v.winner_id directly in customer mapping
    const custProfile = staticCustomerMapping[String(v.winner_id)];
    const custName = (custProfile?.companyName || custProfile?.legal_name || custProfile?.trade_name || '').trim().toLowerCase();

    if (expectedWinnerName && custName && (expectedWinnerName === custName || expectedWinnerName.includes(custName) || custName.includes(expectedWinnerName))) {
      matchCustIdCount++;
    } else {
      mismatchCount++;
      mismatches.push({
        reg,
        winner_id: v.winner_id,
        expectedWinnerName,
        custProfileName: custProfile?.companyName,
      });
    }
  }

  console.log(`Direct winner_id = customer_id matches: ${matchCustIdCount}`);
  console.log(`Mismatches: ${mismatchCount}`);
  if (mismatches.length > 0) {
    console.log('Sample mismatches (first 10):', mismatches.slice(0, 10));
  }
}

test().catch(console.error);
