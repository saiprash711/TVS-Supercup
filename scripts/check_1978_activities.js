const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const acts = await prisma.dealerActivity.findMany({
    select: { id: true, externalTransactionId: true, timestamp: true, metadata: true, matchId: true }
  });

  console.log('Total activities in DB:', acts.length);
  const prefixes = {};
  for (const a of acts) {
    const p = a.externalTransactionId ? a.externalTransactionId.split('-').slice(0, 2).join('-') : 'null';
    prefixes[p] = (prefixes[p] || 0) + 1;
  }
  console.log('By transaction prefix:', prefixes);

  // Check dates and times
  const sample1978 = acts.filter(a => a.externalTransactionId && a.externalTransactionId.includes('1978')).slice(0, 5);
  console.log('\nSample 1978 activity timestamps:');
  for (const a of sample1978) {
    const d = new Date(a.timestamp);
    console.log(a.id, a.externalTransactionId, 'ISO:', d.toISOString(), 'IST String:', d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
