import { PrismaClient } from '@prisma/client';
import staticCustomerMapping from '../src/lib/data/tvs-customer-mapping.json';

const prisma = new PrismaClient();

function maskDealerName(name: string): string {
  if (!name || name.length === 0) return '*****';
  const first = name.trim().charAt(0).toUpperCase();
  return `${first}*****`;
}

function cleanString(s: any): string {
  if (!s || typeof s !== 'string') return '';
  const trimmed = s.trim();
  if (trimmed === 'null' || trimmed === 'undefined' || trimmed === '.') return '';
  return trimmed;
}

function getCompanyName(c: any): string {
  if (!c) return '';
  return cleanString(c.companyName) || cleanString(c.legal_name) || cleanString(c.trade_name) || cleanString(c.name) || cleanString(c.company_name) || '';
}

async function main() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('🔄 Starting Dealer Company Name migration...\n');

  const token = 'a72b042f8f3a5dd5ad4e2bfaf1a87603d354392e75c3c31845a6c40beb782fb285a21ce357fc6677293768283f3ea6d9adce154ad6977e7186fab27beb27be3a3f76326d0212571cc72e3c768748eda31b8e7836ce8ab2bbe1509b73846d9a02562ccc58702d7a5a71283bc53a05cc86069ad24d7d5401871151b27bdf65ba1712d4081bd5eff14684101eb7285e2e428fbe6d15a514235f0e2e3d4d9ecc5942c37352119455c97b740142c69990aa47';

  // 1. Build customer dictionary
  const custMap = new Map<string, any>();

  // Pre-load from static mapping
  for (const [id, c] of Object.entries(staticCustomerMapping as Record<string, any>)) {
    custMap.set(String(id), c);
    if (c.code) custMap.set(String(c.code), c);
    if (c.phone) custMap.set(String(c.phone).trim(), c);
  }

  // Also fetch live /customers and /users from TVS
  const userToKey = new Map<string, string>();
  try {
    const [custRes, userRes] = await Promise.all([
      fetch('https://tvscertified.in:8036/customers', {
        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      }),
      fetch('https://tvscertified.in:8036/users', {
        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      }),
    ]);

    if (custRes.ok) {
      const cJson = await custRes.json();
      const liveCusts = cJson?.data || [];
      for (const c of liveCusts) {
        const comp = getCompanyName(c);
        const obj = { ...c, companyName: comp, phone: c.mobile_no };
        custMap.set(String(c.id), obj);
        if (c.code) custMap.set(String(c.code), obj);
        if (c.mobile_no) custMap.set(String(c.mobile_no).trim(), obj);
      }
      console.log(`✅ Loaded ${liveCusts.length} live customers from TVS Certified.`);
    }

    if (userRes.ok) {
      const uJson = await userRes.json();
      const users = uJson?.data || [];
      for (const u of users) {
        if (u.key_id != null) {
          userToKey.set(String(u.id), String(u.key_id));
        }
      }
      console.log(`✅ Loaded ${userToKey.size} user-to-key mappings from TVS Certified.`);
    }
  } catch (err: any) {
    console.warn('⚠️ Network refresh failed, proceeding with pre-populated customer mappings:', err?.message || err);
  }

  // 2. Fetch all dealers from local DB
  const dealers = await prisma.dealer.findMany();
  console.log(`\nFound ${dealers.length} dealers in local SQLite database.`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const d of dealers) {
    const rawId = d.externalDealerId;
    let cleanId = rawId.replace('USR-', '').trim();

    // Resolution priority:
    // 1. Direct customer ID
    let cust = custMap.get(cleanId);
    // 2. User key_id mapping
    if (!cust && userToKey.has(cleanId)) {
      cust = custMap.get(userToKey.get(cleanId)!);
    }
    // 3. Phone number
    if (!cust && d.phone) {
      cust = custMap.get(d.phone.trim());
    }

    const companyName = getCompanyName(cust);

    if (companyName && companyName !== d.displayName) {
      const maskedName = maskDealerName(companyName);
      const newCity = cust.city || d.city;
      const newPhone = cust.phone ? String(cust.phone).trim() : d.phone;

      await prisma.dealer.update({
        where: { id: d.id },
        data: {
          displayName: companyName,
          maskedName,
          city: newCity,
          phone: newPhone || d.phone,
        },
      });
      updatedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(`\nMigration completed:`);
  console.log(`  Dealers updated to Company Name: ${updatedCount}`);
  console.log(`  Dealers untouched (already matched or custom): ${skippedCount}`);

  // 3. Verify Auction 1978 dealers
  const auctionDealers = await prisma.dealerActivity.findMany({
    where: {
      OR: [
        { externalTransactionId: { contains: '1978' } },
        { match: { auctionId: '1978' } }
      ]
    },
    select: {
      dealer: {
        select: {
          id: true,
          externalDealerId: true,
          displayName: true,
          city: true,
          phone: true,
        }
      }
    },
    distinct: ['dealerId']
  });

  console.log(`\n📋 Auction #1978 Dealers Verification (${auctionDealers.length} participants):`);
  for (const ad of auctionDealers) {
    console.log(`  [ID: ${ad.dealer.id}] (Ext: ${ad.dealer.externalDealerId}) -> "${ad.dealer.displayName}" [${ad.dealer.city}]`);
  }

  // 4. Recalculate rankings across all active campaigns
  const campaigns = await prisma.campaign.findMany({ where: { status: 'ACTIVE' } });
  for (const camp of campaigns) {
    const dealerTotals = await prisma.dealerActivity.groupBy({
      by: ['dealerId'],
      where: { campaignId: camp.id },
      _sum: { points: true },
      orderBy: { _sum: { points: 'desc' } },
    });

    const allDbDealers = await prisma.dealer.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    const pointsMap = new Map<number, number>();
    for (const dt of dealerTotals) {
      pointsMap.set(dt.dealerId, dt._sum.points || 0);
    }
    for (const d of allDbDealers) {
      if (!pointsMap.has(d.id)) pointsMap.set(d.id, 0);
    }

    const sorted = [...pointsMap.entries()].sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < sorted.length; i++) {
      const [dealerId, totalPoints] = sorted[i];
      await prisma.dealerScore.upsert({
        where: {
          dealerId_campaignId: { dealerId, campaignId: camp.id },
        },
        update: { totalPoints, rank: i + 1 },
        create: { dealerId, campaignId: camp.id, totalPoints, rank: i + 1 },
      });
    }
    console.log(`\n🏆 Leaderboard recalculated for Campaign "${camp.name}" (${sorted.length} dealers ranked).`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
