import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function maskName(name: string): string {
  if (!name || name.length === 0) return '*****';
  const first = name.trim().charAt(0).toUpperCase();
  return `${first}*****`;
}

async function main() {
  console.log('🏏 Initializing TVS Dealer Super Cup (September-October 2026)...\n');

  // 1. Ensure September-October 2026 Campaign exists
  let campaign = await prisma.campaign.findFirst({
    where: { type: 'SUPER_CUP' },
  });

  if (campaign) {
    campaign = await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        name: 'TVS Certified Super Cup - September-October 2026',
        slug: 'supercup-sept-oct-2026',
        startDate: new Date('2026-09-01T00:00:00Z'),
        endDate: new Date('2026-10-31T23:59:59Z'),
        type: 'SUPER_CUP',
        status: 'ACTIVE',
      },
    });
  } else {
    campaign = await prisma.campaign.create({
      data: {
        name: 'TVS Certified Super Cup - September-October 2026',
        slug: 'supercup-sept-oct-2026',
        startDate: new Date('2026-09-01T00:00:00Z'),
        endDate: new Date('2026-10-31T23:59:59Z'),
        type: 'SUPER_CUP',
        status: 'ACTIVE',
      },
    });
  }

  // 2. Point Rules
  console.log('📊 Configuring point rules...');
  const rules = [
    { activityType: 'BUY', points: 10, description: 'Points per buy transaction' },
    { activityType: 'SELL', points: 10, description: 'Points per sell transaction' },
    { activityType: 'MATCH_PARTICIPATION', points: 15, description: 'Points for participating in a match day' },
    { activityType: 'ALL_MATCHES_BONUS', points: 20, description: 'Bonus for participating in all 4 matches' },
  ];

  for (const rule of rules) {
    await prisma.pointRule.upsert({
      where: {
        campaignId_activityType: {
          campaignId: campaign.id,
          activityType: rule.activityType,
        },
      },
      update: { points: rule.points, description: rule.description, active: true },
      create: {
        campaignId: campaign.id,
        activityType: rule.activityType,
        points: rule.points,
        description: rule.description,
        active: true,
      },
    });
  }

  // 3. Match Days (All Thursdays in September and October 2026)
  console.log('📅 Setting September-October 2026 match schedule (Every Thursday at 2 PM IST)...');
  await prisma.matchDay.deleteMany({ where: { campaignId: campaign.id } });

  await prisma.matchDay.createMany({
    data: [
      {
        campaignId: campaign.id,
        matchNumber: 1,
        auctionId: '1978', // Live TVS Certified auction (TVSC Weekly Auction TN 10-Sep-2026)
        date: new Date('2026-09-10T08:30:00Z'), // 2:00 PM IST
        status: 'LIVE',
      },
      {
        campaignId: campaign.id,
        matchNumber: 2,
        auctionId: 'TVSC-SEP-17',
        date: new Date('2026-09-17T08:30:00Z'), // September 17, 2026 Thursday 2:00 PM IST
        status: 'UPCOMING',
      },
      {
        campaignId: campaign.id,
        matchNumber: 3,
        auctionId: 'TVSC-SEP-24',
        date: new Date('2026-09-24T08:30:00Z'), // September 24, 2026 Thursday 2:00 PM IST
        status: 'UPCOMING',
      },
      {
        campaignId: campaign.id,
        matchNumber: 4,
        auctionId: 'TVSC-OCT-01',
        date: new Date('2026-10-01T08:30:00Z'), // October 1, 2026 Thursday 2:00 PM IST
        status: 'UPCOMING',
      },
      {
        campaignId: campaign.id,
        matchNumber: 5,
        auctionId: 'TVSC-OCT-08',
        date: new Date('2026-10-08T08:30:00Z'), // October 8, 2026 Thursday 2:00 PM IST
        status: 'UPCOMING',
      },
      {
        campaignId: campaign.id,
        matchNumber: 6,
        auctionId: 'TVSC-OCT-15',
        date: new Date('2026-10-15T08:30:00Z'), // October 15, 2026 Thursday 2:00 PM IST
        status: 'UPCOMING',
      },
      {
        campaignId: campaign.id,
        matchNumber: 7,
        auctionId: 'TVSC-OCT-22',
        date: new Date('2026-10-22T08:30:00Z'), // October 22, 2026 Thursday 2:00 PM IST
        status: 'UPCOMING',
      },
      {
        campaignId: campaign.id,
        matchNumber: 8,
        auctionId: 'TVSC-OCT-29',
        date: new Date('2026-10-29T08:30:00Z'), // October 29, 2026 Thursday 2:00 PM IST
        status: 'UPCOMING',
      },
    ],
  });

  // 4. Fetch and seed verified real dealers from TVS Certified
  console.log('👥 Syncing registered dealers from live TVS Certified platform...');
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const token = 'a72b042f8f3a5dd5ad4e2bfaf1a87603d354392e75c3c31845a6c40beb782fb285a21ce357fc6677293768283f3ea6d9adce154ad6977e7186fab27beb27be3a3f76326d0212571cc72e3c768748eda31b8e7836ce8ab2bbe1509b73846d9a02562ccc58702d7a5a71283bc53a05cc86069ad24d7d5401871151b27bdf65ba1712d4081bd5eff14684101eb7285e2e428fbe6d15a514235f0e2e3d4d9ecc5942c37352119455c97b740142c69990aa47';

  try {
    const [userRes, custRes] = await Promise.all([
      fetch('https://tvscertified.in:8036/users', {
        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      }),
      fetch('https://tvscertified.in:8036/customers', {
        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      }),
    ]);
    const json = await userRes.json();
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

    const dealers = allUsers.filter((u: any) =>
      u.user_type === 'buyer' || u.role_id === 21 || u.key_id != null
    );

    console.log(`Retrieved ${dealers.length} verified TVS dealers.`);
    for (const u of dealers) {
      const externalDealerId = u.key_id ? String(u.key_id) : `USR-${u.id}`;
      const cust = custMap.get(String(u.key_id || '')) || custMap.get(String(u.id)) || (u.mobile ? custMap.get(String(u.mobile).trim()) : null);
      const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
      const displayName = cust?.companyName || fullName || u.user_name || u.email || `Dealer ${externalDealerId}`;
      const maskedName = maskName(displayName);
      const phone = u.mobile ? String(u.mobile).trim() : (cust?.mobile_no ? String(cust.mobile_no).trim() : null);
      const city = cust?.city || u.location_name || 'Hyderabad';

      const dealer = await prisma.dealer.upsert({
        where: { externalDealerId },
        update: {
          displayName,
          maskedName,
          phone,
          city,
          status: u.active ? 'ACTIVE' : 'INACTIVE',
        },
        create: {
          externalDealerId,
          displayName,
          maskedName,
          phone,
          city,
          status: u.active ? 'ACTIVE' : 'INACTIVE',
        },
      });

      // Initialize clean 0-point score
      await prisma.dealerScore.upsert({
        where: {
          dealerId_campaignId: { dealerId: dealer.id, campaignId: campaign.id },
        },
        update: { totalPoints: 0, rank: 0 },
        create: { dealerId: dealer.id, campaignId: campaign.id, totalPoints: 0, rank: 0 },
      });
    }
  } catch (err) {
    console.warn('Could not sync from TVS Certified network (offline mode):', err);
  }

  const dealerCount = await prisma.dealer.count();
  console.log(`\n✅ Setup complete! Database ready with ${dealerCount} real TVS dealers.`);
  console.log(`\n📅 Campaign: September-October 2026 (8 Thursdays at 2:00 PM IST)`);
  console.log(`   - September: 10, 17, 24`);
  console.log(`   - October: 1, 8, 15, 22, 29`);
  console.log(`\n🏆 All Thursdays will work automatically with the cron job!\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
