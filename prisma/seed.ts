import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function maskName(name: string): string {
  if (!name || name.length === 0) return '*****';
  const first = name.trim().charAt(0).toUpperCase();
  return `${first}*****`;
}

async function main() {
  console.log('🏏 Initializing TVS Dealer Super Cup 2026–27...\n');

  // 1. Pre-Launch Test Campaign (01 Oct & 08 Oct 2026)
  console.log('🧪 Initializing Pre-Launch Test Campaign (01-10-2026 and 08-10-2026)...');
  const testCampaign = await prisma.campaign.upsert({
    where: { slug: 'supercup-prelaunch-test-2026' },
    update: {
      name: 'TVS Super Cup — Pre-Launch Test',
      startDate: new Date('2026-09-27T18:30:00.000Z'),
      endDate: new Date('2026-10-14T18:29:59.999Z'),
      type: 'SUPER_CUP',
      status: 'ACTIVE',
    },
    create: {
      name: 'TVS Super Cup — Pre-Launch Test',
      slug: 'supercup-prelaunch-test-2026',
      startDate: new Date('2026-09-27T18:30:00.000Z'),
      endDate: new Date('2026-10-14T18:29:59.999Z'),
      type: 'SUPER_CUP',
      status: 'ACTIVE',
    },
  });

  const testRules = [
    { activityType: 'BUY', points: 10, description: 'Points per buy transaction' },
    { activityType: 'SELL', points: 10, description: 'Points per sell transaction' },
    { activityType: 'MATCH_PARTICIPATION', points: 15, description: 'Points for participating in a test match' },
    { activityType: 'BID_PLACED', points: 2, description: 'Points per verified live auction bid' },
    { activityType: 'WATCHLIST_ADD', points: 1, description: 'Points per vehicle added to watchlist' },
    { activityType: 'VEHICLE_INSPECTED', points: 1, description: 'Points per vehicle inspection viewed' },
    { activityType: 'ALL_MATCHES_BONUS', points: 20, description: 'Test bonus for participating in both test matches' },
  ];

  for (const rule of testRules) {
    await prisma.pointRule.upsert({
      where: {
        campaignId_activityType: {
          campaignId: testCampaign.id,
          activityType: rule.activityType,
        },
      },
      update: { points: rule.points, description: rule.description, active: true },
      create: {
        campaignId: testCampaign.id,
        activityType: rule.activityType,
        points: rule.points,
        description: rule.description,
        active: true,
      },
    });
  }

  const testMatches = [
    { matchNumber: 1, auctionId: 'TVSC-2026-10-01', date: new Date('2026-10-01T08:30:00.000Z') },
    { matchNumber: 2, auctionId: 'TVSC-2026-10-08', date: new Date('2026-10-08T08:30:00.000Z') },
  ];
  for (const match of testMatches) {
    await prisma.matchDay.upsert({
      where: { campaignId_matchNumber: { campaignId: testCampaign.id, matchNumber: match.matchNumber } },
      update: { date: match.date, auctionId: match.auctionId },
      create: { campaignId: testCampaign.id, ...match, status: 'UPCOMING' },
    });
  }

  // 2. Full Live Season Campaign (Oct 2026–Jan 2027)
  console.log('🏆 Initializing TVS Certified Super Cup 2026–27...');
  const campaign = await prisma.campaign.upsert({
    where: { slug: 'supercup-2026-27' },
    update: {
      name: 'TVS Certified Super Cup 2026–27',
      startDate: new Date('2026-10-14T18:30:00.000Z'),
      endDate: new Date('2027-01-14T18:29:59.999Z'),
      type: 'SUPER_CUP',
      status: 'ACTIVE',
    },
    create: {
      name: 'TVS Certified Super Cup 2026–27',
      slug: 'supercup-2026-27',
      startDate: new Date('2026-10-14T18:30:00.000Z'),
      endDate: new Date('2027-01-14T18:29:59.999Z'),
      type: 'SUPER_CUP',
      status: 'ACTIVE',
    },
  });

  // 2. Point Rules
  const rules = [
    // SELLING
    { activityType: 'SELL_LISTING', points: 5, description: 'Selling: Points per vehicle listing' },
    { activityType: 'SELL', points: 10, description: 'Selling: Points per vehicle conversion/sold' },
    { activityType: 'SELL_COMMISSION', points: 5, description: 'Selling: Commission points allocation' },
    // BUYING
    { activityType: 'MATCH_PARTICIPATION', points: 1, description: 'Buying: Match day participation points' },
    { activityType: 'BID_PLACED', points: 1, description: 'Buying: Points per live/pre auction bid placed' },
    { activityType: 'BUY', points: 10, description: 'Buying: Points per vehicle conversion/purchased' },
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

  // 3. Four-series schedule across the campaign window.
  console.log('📅 Setting the Oct 2026–Jan 2027 four-match schedule...');
  const matchSchedule = [
    { matchNumber: 1, auctionId: 'TVSC-2026-10-15', date: new Date('2026-10-15T08:30:00Z') },
    { matchNumber: 2, auctionId: 'TVSC-2026-11-12', date: new Date('2026-11-12T08:30:00Z') },
    { matchNumber: 3, auctionId: 'TVSC-2026-12-10', date: new Date('2026-12-10T08:30:00Z') },
    { matchNumber: 4, auctionId: 'TVSC-2027-01-14', date: new Date('2027-01-14T08:30:00Z') },
  ];
  for (const match of matchSchedule) {
    await prisma.matchDay.upsert({
      where: { campaignId_matchNumber: { campaignId: campaign.id, matchNumber: match.matchNumber } },
      update: { date: match.date },
      create: { campaignId: campaign.id, ...match, status: 'UPCOMING' },
    });
  }

  // 4. Fetch and seed verified real dealers from TVS Certified
  console.log('👥 Syncing registered dealers from live TVS Certified platform...');
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const token = process.env.TVS_API_TOKEN;

  try {
    if (!token) throw new Error('TVS_API_TOKEN is not configured; skipping network dealer sync');
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

      // Initialize clean 0-point score for test campaign and live campaign
      await prisma.dealerScore.upsert({
        where: {
          dealerId_campaignId: { dealerId: dealer.id, campaignId: testCampaign.id },
        },
        update: {},
        create: { dealerId: dealer.id, campaignId: testCampaign.id, totalPoints: 0, rank: 0 },
      });

      await prisma.dealerScore.upsert({
        where: {
          dealerId_campaignId: { dealerId: dealer.id, campaignId: campaign.id },
        },
        update: {},
        create: { dealerId: dealer.id, campaignId: campaign.id, totalPoints: 0, rank: 0 },
      });
    }
  } catch (err) {
    console.warn('Could not sync from TVS Certified network (offline mode):', err);
  }

  const dealerCount = await prisma.dealer.count();
  console.log(`\n✅ Setup complete! Database ready with ${dealerCount} real TVS dealers.`);
  console.log(`\n📅 Campaign: 15 October 2026–14 January 2027 (4-match series)`);
  console.log(`   - 15 Oct, 12 Nov, 10 Dec, 14 Jan at 2:00 PM IST`);
  console.log(`\n🏆 Auction placeholders must be replaced with live TVS auction IDs before each match.\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
