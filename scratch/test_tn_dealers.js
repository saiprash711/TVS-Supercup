const { PrismaClient } = require('@prisma/client');
const { isTamilNaduDealer, getDealerBranch } = require('../src/lib/services/branch-utils');

const prisma = new PrismaClient();

async function main() {
  const allDealers = await prisma.dealer.findMany({
    select: { id: true, externalDealerId: true, displayName: true, city: true, category: true }
  });

  const total = allDealers.length;
  const tnDealers = allDealers.filter(d => isTamilNaduDealer(d.city));
  const nonTn = allDealers.filter(d => !isTamilNaduDealer(d.city));

  console.log(`Total dealers in DB: ${total}`);
  console.log(`Tamil Nadu dealers: ${tnDealers.length}`);
  console.log(`Non-TN dealers filtered out: ${nonTn.length}`);

  const catCounts = { oem: 0, used: 0, corp: 0, other: 0 };
  for (const d of tnDealers) {
    if (d.category === 'OEM Dealer') catCounts.oem++;
    else if (d.category === 'Used Car Dealer') catCounts.used++;
    else if (d.category === 'Corporate / Other') catCounts.corp++;
    else catCounts.other++;
  }
  console.log('\nTN Category counts:', catCounts);

  // Count by branch
  const branchMap = {};
  for (const d of tnDealers) {
    const branch = getDealerBranch(d.city);
    branchMap[branch] = (branchMap[branch] || 0) + 1;
  }

  const sortedBranches = Object.entries(branchMap).sort((a, b) => b[1] - a[1]);
  console.log('\nTop 15 TN Branches:');
  sortedBranches.slice(0, 15).forEach(([name, count]) => {
    console.log(`  - ${name}: ${count} dealers`);
  });

  // Sample check: Coimbatore dealers
  const coimbatoreDealers = tnDealers.filter(d => getDealerBranch(d.city) === 'Coimbatore');
  console.log(`\nCoimbatore sample (${coimbatoreDealers.length} total):`);
  coimbatoreDealers.slice(0, 3).forEach(d => console.log(`  [${d.externalDealerId}] ${d.displayName} (${d.city})`));

  // Check some non-TN samples
  console.log('\nNon-TN filtered sample:');
  nonTn.slice(0, 5).forEach(d => console.log(`  [${d.externalDealerId}] ${d.displayName} (${d.city})`));

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
