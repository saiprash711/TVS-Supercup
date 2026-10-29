const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function find() {
  const n = await prisma.dealer.findMany({ where: { displayName: { contains: 'NIRMAL' } } });
  console.log('NIRMAL search:', n.map(x => ({ id: x.id, name: x.displayName, extId: x.externalDealerId })));
  const h = await prisma.dealer.findMany({ where: { displayName: { contains: 'Harsha' } } });
  console.log('Harsha search:', h.map(x => ({ id: x.id, name: x.displayName, extId: x.externalDealerId })));
  const hByExt = await prisma.dealer.findMany({ where: { externalDealerId: '536' } });
  console.log('Dealer with extId=536:', hByExt.map(x => ({ id: x.id, name: x.displayName, extId: x.externalDealerId })));
  const nByExt = await prisma.dealer.findMany({ where: { externalDealerId: '561' } });
  console.log('Dealer with extId=561:', nByExt.map(x => ({ id: x.id, name: x.displayName, extId: x.externalDealerId })));
}

find().finally(() => prisma.$disconnect());
