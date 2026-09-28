import { PrismaClient } from '@prisma/client';
import { getCurrentSuperCupCampaign } from '../src/lib/services/campaign';

const prisma = new PrismaClient();

function maskName(name: string): string {
  if (!name || name.length === 0) return '*****';
  const first = name.trim().charAt(0).toUpperCase();
  return `${first}*****`;
}

async function seedTVSDealers() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const token = process.env.TVS_API_TOKEN;
  if (!token) throw new Error('TVS_API_TOKEN is required to sync dealer accounts');

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
  let campaign = await getCurrentSuperCupCampaign();

  if (!campaign) {
    campaign = await prisma.campaign.create({
      data: {
        name: 'TVS Certified Super Cup 2026–27',
        slug: 'supercup-2026-27',
        startDate: new Date('2026-10-14T18:30:00.000Z'),
        endDate: new Date('2027-01-14T18:29:59.999Z'),
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
