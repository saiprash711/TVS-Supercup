const XLSX = require('xlsx');

const completedFile = 'C:\\Users\\TC100\\Downloads\\Completed Auctions (1).xlsx';
const wb = XLSX.readFile(completedFile);
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

console.log(`Total rows in Completed Auctions: ${rows.length}`);

// Group by Listed By
const sellerListings = {};
for (const r of rows) {
  const seller = (r['Listed By'] || 'UNASSIGNED / NULL').trim();
  if (!sellerListings[seller]) {
    sellerListings[seller] = {
      count: 0,
      points: 0,
      vehicles: [],
      soldCount: 0,
      unsoldCount: 0
    };
  }
  sellerListings[seller].count++;
  sellerListings[seller].points += 5; // 5 pts per listing
  sellerListings[seller].vehicles.push(r['Registration Number']);
  if (r['Winner Name'] && r['Winner Bid Value']) {
    sellerListings[seller].soldCount++;
  } else {
    sellerListings[seller].unsoldCount++;
  }
}

console.log('\n--- Seller Listings & Points from Completed Auctions (1).xlsx ---');
const sortedSellers = Object.entries(sellerListings).sort((a, b) => b[1].count - a[1].count);
for (const [seller, data] of sortedSellers) {
  console.log(`${seller}: ${data.count} listings => ${data.points} pts (${data.soldCount} sold, ${data.unsoldCount} unsold)`);
}

// Group by Winner Name (Buyers)
const buyerWins = {};
for (const r of rows) {
  if (r['Winner Name'] && r['Winner Bid Value']) {
    const winner = r['Winner Name'].trim();
    if (!buyerWins[winner]) {
      buyerWins[winner] = { count: 0, totalAmount: 0, vehicles: [] };
    }
    buyerWins[winner].count++;
    buyerWins[winner].totalAmount += Number(r['Winner Bid Value'] || 0);
    buyerWins[winner].vehicles.push({
      reg: r['Registration Number'],
      price: r['Winner Bid Value'],
      seller: r['Listed By']
    });
  }
}

console.log('\n--- Buyers (Winners) from Completed Auctions (1).xlsx ---');
const sortedBuyers = Object.entries(buyerWins).sort((a, b) => b[1].count - a[1].count);
for (const [buyer, data] of sortedBuyers) {
  console.log(`${buyer}: ${data.count} cars won, total Rs. ${data.totalAmount.toLocaleString('en-IN')}`);
}

// Unsold vehicles
const unsold = rows.filter(r => !r['Winner Name'] || !r['Winner Bid Value']);
console.log(`\nUnsold vehicles count: ${unsold.length}`);
for (const u of unsold) {
  console.log(`- ${u['Registration Number']} (Listed By: ${u['Listed By'] || 'NULL'})`);
}
