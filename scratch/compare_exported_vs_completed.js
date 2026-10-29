const XLSX = require('xlsx');

const completedFile = 'C:\\Users\\TC100\\Downloads\\Completed Auctions (1).xlsx';
const supercupFile = 'C:\\Users\\TC100\\Downloads\\tvs-supercup-auction-2038-leaderboard-points-audit-2026-10-15.xlsx';

const wbCompleted = XLSX.readFile(completedFile);
const wbSupercup = XLSX.readFile(supercupFile);

const completedRows = XLSX.utils.sheet_to_json(wbCompleted.Sheets[wbCompleted.SheetNames[0]]);
const supercupLots = XLSX.utils.sheet_to_json(wbSupercup.Sheets['Vehicle Lots & Results']);
const supercupPoints = XLSX.utils.sheet_to_json(wbSupercup.Sheets['Points Calculation Breakdown']);
const supercupLeaderboard = XLSX.utils.sheet_to_json(wbSupercup.Sheets['Auction 2038 Leaderboard']);

console.log('Completed Auctions rows count:', completedRows.length);
console.log('Supercup Vehicle Lots rows count:', supercupLots.length);
console.log('Supercup Leaderboard rows count:', supercupLeaderboard.length);
console.log('Supercup Points rows count:', supercupPoints.length);

// Compare vehicles by Registration Number
const compMap = new Map();
for (const r of completedRows) {
  compMap.set(r['Registration Number']?.trim(), r);
}

const scMap = new Map();
for (const r of supercupLots) {
  scMap.set(r['Registration Number']?.trim(), r);
}

console.log('\n--- Checking Registration Number alignment ---');
let inCompNotSc = 0;
let inScNotComp = 0;
for (const reg of compMap.keys()) {
  if (!scMap.has(reg)) inCompNotSc++;
}
for (const reg of scMap.keys()) {
  if (!compMap.has(reg)) inScNotComp++;
}
console.log(`In Completed but not in Supercup: ${inCompNotSc}`);
console.log(`In Supercup but not in Completed: ${inScNotComp}`);

// Compare Listed By vs Seller Dealership
console.log('\n--- Comparing Listed By in Completed vs Seller in Supercup ---');
let sellerMismatch = 0;
const sellerDiffs = [];
for (const [reg, compRow] of compMap.entries()) {
  const scRow = scMap.get(reg);
  if (!scRow) continue;
  const compListedBy = (compRow['Listed By'] || '').trim();
  const scSeller = (scRow['Seller / Origin Dealership'] || '').trim();
  const scPoints = scRow['Seller Listing Points Awarded'];

  if (compListedBy.toLowerCase() !== scSeller.toLowerCase()) {
    sellerMismatch++;
    sellerDiffs.push({
      reg,
      completedListedBy: compListedBy,
      supercupSeller: scSeller,
      supercupPoints: scPoints
    });
  }
}
console.log(`Total Seller Name Mismatches: ${sellerMismatch} out of ${completedRows.length}`);
if (sellerDiffs.length > 0) {
  console.log('Sample seller differences:', sellerDiffs.slice(0, 10));
}

// Compare Winners and prices
console.log('\n--- Comparing Winners and Prices ---');
let winnerMismatch = 0;
const winnerDiffs = [];
for (const [reg, compRow] of compMap.entries()) {
  const scRow = scMap.get(reg);
  if (!scRow) continue;
  const compWinner = (compRow['Winner Name'] || '').trim();
  const scWinner = (scRow['Winning Buyer Dealership'] || '').trim();
  const compPrice = compRow['Winner Bid Value'];
  const scPrice = scRow['Winning Bid / Hammer Price (INR)'];

  if (compWinner.toLowerCase() !== scWinner.toLowerCase()) {
    winnerMismatch++;
    winnerDiffs.push({
      reg,
      compWinner,
      scWinner,
      compPrice,
      scPrice
    });
  }
}
console.log(`Winner Mismatches: ${winnerMismatch}`);
if (winnerDiffs.length > 0) {
  console.log('Sample winner differences:', winnerDiffs.slice(0, 10));
}

// Check seller points in Supercup Leaderboard
console.log('\n--- Sellers in Supercup Leaderboard ---');
const sellersInLeaderboard = supercupLeaderboard.filter(r => (r['Vehicle Listings Count'] || 0) > 0 || (r['Seller League Points (Auction)'] || 0) > 0);
console.log(`Dealers with Seller Points/Listings in Leaderboard: ${sellersInLeaderboard.length}`);
for (const s of sellersInLeaderboard) {
  console.log({
    dealer: s['Dealership Legal Name'],
    listingsCount: s['Vehicle Listings Count'],
    sellerPoints: s['Seller League Points (Auction)'],
    totalPoints: s['Total Auction Points']
  });
}

// Count total listings in Completed Auctions file by 'Listed By'
console.log('\n--- Total Listings by Listed By in Completed Auctions (1).xlsx ---');
const compListedByCounts = {};
for (const r of completedRows) {
  const lb = (r['Listed By'] || 'BLANK / UNASSIGNED').trim();
  compListedByCounts[lb] = (compListedByCounts[lb] || 0) + 1;
}
console.log(compListedByCounts);
