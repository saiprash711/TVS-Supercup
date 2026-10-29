const XLSX = require('xlsx');
const wb = XLSX.readFile('C:/Users/TC100/Downloads/tvs-supercup-auction-2038-leaderboard-points-audit-2026-10-15-v3.xlsx');
console.log('Sheets:', wb.SheetNames);

const s1 = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
console.log('\n--- Top 12 Dealers in Sheet 1 ---');
s1.slice(0, 12).forEach(r => {
  console.log(`#${r['Auction Rank']} | ${r['Dealership Legal Name']} | Role: ${r['Primary League']} | Pts: ${r['Total Auction Points']} | BuyerPts: ${r['Buyer League Points (Auction)']} | Formula: ${r['Scoring Formula Applied']}`);
});

const s2 = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[1]]);
const murali = s2.find(r => (r['Dealership Legal Name'] || '').includes('Murali'));
console.log('\n--- Murali Cars in Sheet 2 ---');
console.log(JSON.stringify(murali, null, 2));

console.log('\n--- Top 10 Winning Buyers in Sheet 2 ---');
s2.filter(r => (r['Vehicles Won / Bought Count'] || 0) > 0)
  .sort((a, b) => b['Total Auction Points Reconciled'] - a['Total Auction Points Reconciled'])
  .slice(0, 10)
  .forEach((r, i) => {
    console.log(`#${i + 1} | ${r['Dealership Legal Name']} (${r['City']}) | Won: ${r['Vehicles Won / Bought Count']} | Pts: ${r['Total Auction Points Reconciled']} | Formula: ${r['Points Calculation Formula Applied']}`);
  });

const s3 = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[2]]);
console.log('\n--- Sheet 3 First 3 rows ---');
s3.slice(0, 3).forEach(r => {
  console.log(`Lot: ${r['Lot #']} | Reg: ${r['Registration Number']} | Buyer: ${r['Winning Buyer Dealership']} | BuyerPts: ${r['Buyer Points Awarded (1 pt / car won)']} | Seller: ${r['Seller / Origin Dealership']} | SellerPts: ${r['Seller Listing Points Awarded']}`);
});
