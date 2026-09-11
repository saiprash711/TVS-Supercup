import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function maskName(name: string): string {
  if (!name || name.length === 0) return '*****';
  const first = name.trim().charAt(0).toUpperCase();
  return `${first}*****`;
}

async function seedTVSDealers() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const token = 'a72b042f8f3a5dd5ad4e2bfaf1a87603d354392e75c3c31845a6c40beb782fb285a21ce357fc6677293768283f3ea6d9adce154ad6977e7186fab27beb27be3a3f76326d0212571cc72e3c768748eda31b8e7836ce8ab2bbe1509b73846d9a02562ccc58702d7a5a71283bc53a05cc86069ad24d7d5401871151b27bdf65ba1712d4081bd5eff14684101eb7285e2e428fbe6d15a514235f0e2e3d4d9ecc5942c37352119455c97b740142c69990aa47';

  console.log('Fetching all registered dealers from TVS Certified live platform...');
  const res = await fetch('https://tvscertified.in:8036/users', {
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json',
    },
  });

  const custRes = await fetch('https://tvscertified.in:8036/customers', {
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json',
    },
  });

  const json = await res.json();
  const custJson = await custRes.json();
  const allUsers = json?.data || [];
  const allCusts = custJson?.data || [];

  const custMap = new Map();
  for (const c of allCusts) {
    const clean = (s: any) => (s && typeof s === 'string' && s.trim() !== 'null' && s.trim() !== 'undefined' && s.trim() !== '.') ? s.trim() : '';
    const compName = clean(c.legal_name) || clean(c.trade_name) || clean(c.name) || clean(c.company_name);
    custMap.set(String(c.id), { ...c, companyName: compName });
    if (c.code) custMap.set(String(c.code), { ...c, companyName: compName });
    if (c.mobile_no) custMap.set(String(c.mobile_no).trim(), { ...c, companyName: compName });
  }

  console.log(`Retrieved ${allUsers.length} total user accounts and ${allCusts.length} customer profiles from TVS Certified.`);

  // Filter for buyers and dealers
  const dealers = allUsers.filter((u: any) => 
    u.user_type === 'buyer' || 
    u.role_id === 21 || 
    u.key_id != null
  );
  console.log(`Processing ${dealers.length} verified dealer accounts...`);

  // Ensure active campaign exists
  let campaign = await prisma.campaign.findFirst({
    where: { type: 'SUPER_CUP', status: 'ACTIVE' },
  });

  if (!campaign) {
    campaign = await prisma.campaign.create({
      data: {
        name: 'Dealer Super Cup — September 2026',
        slug: 'september-2026',
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-09-30'),
        type: 'SUPER_CUP',
        status: 'ACTIVE',
      },
    });
  }

  let imported = 0;
  let updated = 0;

  for (const u of dealers) {
    const externalDealerId = u.key_id ? String(u.key_id) : `USR-${u.id}`;
    const cust = custMap.get(String(u.key_id || '')) || custMap.get(String(u.id)) || (u.mobile ? custMap.get(String(u.mobile).trim()) : null);
    const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
    const displayName = cust?.companyName || fullName || u.user_name || u.email || `Dealer ${externalDealerId}`;
    const maskedName = maskName(displayName);
    const phone = u.mobile ? String(u.mobile).trim() : (cust?.mobile_no ? String(cust.mobile_no).trim() : null);
    const city = cust?.city || u.location_name || 'Hyderabad';

    try {
      const existing = await prisma.dealer.findUnique({
        where: { externalDealerId },
      });

      let dealerId: number;

      if (existing) {
        await prisma.dealer.update({
          where: { id: existing.id },
          data: {
            displayName,
            maskedName,
            phone: phone || existing.phone,
            city,
            status: u.active ? 'ACTIVE' : 'INACTIVE',
          },
        });
        dealerId = existing.id;
        updated++;
      } else {
        const created = await prisma.dealer.create({
          data: {
            externalDealerId,
            displayName,
            maskedName,
            phone,
            city,
            status: u.active ? 'ACTIVE' : 'INACTIVE',
          },
        });
        dealerId = created.id;
        imported++;
      }

      // Ensure score row exists
      await prisma.dealerScore.upsert({
        where: {
          dealerId_campaignId: { dealerId, campaignId: campaign.id },
        },
        update: {},
        create: {
          dealerId,
          campaignId: campaign.id,
          totalPoints: 0,
          rank: 0,
        },
      });
    } catch (err) {
      console.error(`Error saving dealer ${externalDealerId}:`, err);
    }
  }

  console.log(`\nImport Summary:`);
  console.log(`  Newly Added Dealers: ${imported}`);
  console.log(`  Updated Dealers:     ${updated}`);
  console.log(`  Total Active in DB:  ${await prisma.dealer.count()}`);

  // Recalculate rankings
  const dealerTotals = await prisma.dealerActivity.groupBy({
    by: ['dealerId'],
    where: { campaignId: campaign.id },
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
        dealerId_campaignId: { dealerId, campaignId: campaign.id },
      },
      update: { totalPoints, rank: i + 1 },
      create: { dealerId, campaignId: campaign.id, totalPoints, rank: i + 1 },
    });
  }

  console.log(`Rankings recalculated for ${sorted.length} dealers.`);
}

seedTVSDealers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
