const staticUserMapping = require('../src/lib/data/tvs-user-mapping.json');
const staticCustomerMapping = require('../src/lib/data/tvs-customer-mapping.json');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('staticUserMapping["1159"]:', staticUserMapping['1159']);
  console.log('staticCustomerMapping["1159"]:', staticCustomerMapping['1159']);
  console.log('staticCustomerMapping["CUST10001159"]:', staticCustomerMapping['CUST10001159']);

  // Check dealer in DB with externalDealerId = '1159'
  const d = await prisma.dealer.findFirst({ where: { externalDealerId: '1159' } });
  console.log('Dealer in DB with externalDealerId = 1159:', d);

  // Check dealer in DB with externalDealerId = staticUserMapping["1159"]
  if (staticUserMapping['1159']) {
    const dMapped = await prisma.dealer.findFirst({ where: { externalDealerId: String(staticUserMapping['1159']) } });
    console.log(`Dealer in DB with externalDealerId = ${staticUserMapping['1159']}:`, dMapped);
  }
}

check().finally(() => prisma.$disconnect());
