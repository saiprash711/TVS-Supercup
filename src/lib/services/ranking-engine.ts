/**
 * Ranking Engine
 * 
 * Recalculates dealer rankings for a campaign.
 * Updates the dealer_scores table which serves as a materialized view
 * for fast leaderboard queries.
 * Provides segmented leaderboards for Buyers and Sellers with verified Customer IDs.
 */

import { prisma } from '@/lib/db';
import { MASKING_ENABLED, maskDealerName } from './masking';
import staticUserMapping from '../data/tvs-user-mapping.json';
import staticCustomerMapping from '../data/tvs-customer-mapping.json';

interface CustomerProfile {
  id: number;
  code: string;
  companyName: string;
  customerType?: string;
  category?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  email?: string;
}

// Pre-build index maps for O(1) customer resolution
const customerMap = new Map<string, CustomerProfile>();
const companyNameToCustomerMap = new Map<string, CustomerProfile>();

for (const [id, c] of Object.entries(staticCustomerMapping as Record<string, CustomerProfile>)) {
  customerMap.set(String(id), c);
  if (c.code) customerMap.set(String(c.code).trim(), c);
  if (c.phone) customerMap.set(String(c.phone).trim(), c);
  if (c.companyName) {
    companyNameToCustomerMap.set(c.companyName.trim().toLowerCase(), c);
  }
}

const userToKey = new Map<string, string>();
for (const [uId, keyId] of Object.entries(staticUserMapping as Record<string, string>)) {
  userToKey.set(String(uId), String(keyId));
}

/**
 * Resolves verified TVS customer profile information for a dealer.
 */
export function resolveDealerCustomer(
  dealer: { externalDealerId: string; displayName?: string; phone?: string | null; category?: string },
  activities?: Array<{ metadata?: string | null; activityType?: string }>
) {
  const ext = (dealer.externalDealerId || '').trim();
  const cleanExt = ext.replace(/^USR-/, '').replace(/^SELLER-/, '').trim();
  const cleanName = (dealer.displayName && dealer.displayName !== 'null') ? dealer.displayName.trim().toLowerCase() : '';
  const isGenericPlaceholderName = !cleanName || cleanName.startsWith('dealer ') || cleanName === 'dealer';

  let cust: CustomerProfile | undefined;

  // 1. Seller activity metadata lookup (HIGHEST PRIORITY & 100% AUTHORITATIVE FOR SELLERS)
  // When a dealer has seller activities (SELL, SELL_LISTING, SELL_COMMISSION),
  // the vehicle payload directly contains the seller's verified sellerCustomerCode & sellerCustomerId.
  if (activities && activities.length > 0) {
    const sellerActs = activities.filter(a =>
      a.activityType ? ['SELL', 'SELL_LISTING', 'SELL_COMMISSION'].includes(a.activityType) : false
    );
    for (const a of sellerActs) {
      if (!a.metadata) continue;
      try {
        const meta = typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata;
        if (meta) {
          if (meta.sellerCustomerCode && customerMap.has(meta.sellerCustomerCode)) {
            cust = customerMap.get(meta.sellerCustomerCode);
            break;
          }
          if (meta.sellerCustomerId && customerMap.has(String(meta.sellerCustomerId))) {
            cust = customerMap.get(String(meta.sellerCustomerId));
            break;
          }
        }
      } catch {}
    }
  }

  // 2. Exact Company Name lookup (official company name from TVS Certified, if not a generic placeholder)
  if (!cust && cleanName && !isGenericPlaceholderName) {
    if (companyNameToCustomerMap.has(cleanName)) {
      cust = companyNameToCustomerMap.get(cleanName);
    }
  }

  // 3. Direct externalDealerId lookup (e.g. "470", "CUST10001255")
  if (!cust) {
    const candidateCust = customerMap.get(ext) || customerMap.get(cleanExt);
    if (candidateCust) {
      // Validate that externalDealerId does not conflict with a known distinct company name
      if (
        isGenericPlaceholderName ||
        !candidateCust.companyName ||
        cleanName === candidateCust.companyName.toLowerCase() ||
        candidateCust.companyName.toLowerCase().includes(cleanName) ||
        cleanName.includes(candidateCust.companyName.toLowerCase())
      ) {
        cust = candidateCust;
      }
    }
  }

  // 4. User mapping lookup (if externalDealerId was a user ID)
  if (!cust && userToKey.has(cleanExt)) {
    const key = userToKey.get(cleanExt)!;
    cust = customerMap.get(key);
  }

  // 5. Phone number lookup
  if (!cust && dealer.phone) {
    const cleanPhone = dealer.phone.trim();
    if (cleanPhone) cust = customerMap.get(cleanPhone);
  }

  // 6. Distinctive Company Name prefix lookup (fallback, only for non-generic names)
  if (!cust && cleanName && !isGenericPlaceholderName && cleanName.length >= 6) {
    for (const [cName, c] of companyNameToCustomerMap.entries()) {
      if (cName && cName.length >= 6 && (cleanName.startsWith(cName) || cName.startsWith(cleanName))) {
        cust = c;
        break;
      }
    }
  }

  const customerCode = cust?.code || (dealer.externalDealerId.startsWith('CUST') ? dealer.externalDealerId : '');
  const numericId = cust?.id || (!isNaN(Number(cleanExt)) ? Number(cleanExt) : null);
  const customerId = customerCode || (numericId ? `CUST${numericId}` : (dealer.externalDealerId || 'N/A'));

  return {
    customerId,
    customerCode: customerCode || customerId,
    numericCustomerId: numericId,
    role: (cust?.role as 'Buyer' | 'Seller' | 'General') || 'General',
    category: cust?.category || dealer.category || 'Used Car Dealer',
    companyName: cust?.companyName || dealer.displayName || '',
    city: cust?.city || '',
  };
}

export interface LeaderboardEntry {
  rank: number;
  dealer: string;
  dealerName: string;
  maskedName: string;
  realName?: string;
  externalId?: string;
  customerId?: string;
  customerCode?: string;
  numericCustomerId?: number | null;
  city: string;
  points: number;
  totalPoints: number;
  buyerPoints: number;
  sellerPoints: number;
  role: 'Buyer' | 'Seller' | 'General';
  category: string;
  dealerId: number;
  isUnmasked: boolean;
  isCurrentDealer?: boolean;
  buysCount: number;
  bidsCount: number;
  salesCount: number;
  listingsCount: number;
  buyerRank?: number;
  sellerRank?: number;
  overallRank?: number;
}

export interface SegmentedLeaderboardResult {
  buyers: LeaderboardEntry[];
  sellers: LeaderboardEntry[];
  overall: LeaderboardEntry[];
  counts: {
    buyers: number;
    sellers: number;
    overall: number;
  };
}

/**
 * Recalculate all dealer scores and rankings for a campaign.
 * This aggregates all dealer_activities and updates dealer_scores.
 */
export async function recalculateRankings(campaignId: number) {
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    select: { startDate: true, endDate: true },
  });

  const isPostgres = Boolean(
    process.env.DATABASE_URL?.startsWith('postgres') ||
    process.env.POSTGRES_URL?.startsWith('postgres')
  );

  if (isPostgres) {
    try {
      // 1 single atomic SQL query in PostgreSQL: computes total points and rank, upserts all dealer_scores
      await prisma.$executeRawUnsafe(`
        WITH point_totals AS (
          SELECT 
            d.id AS dealer_id,
            COALESCE(SUM(da.points), 0)::int AS total_points,
            CASE
              WHEN COALESCE(SUM(da.points), 0) <= 0 THEN 0
              ELSE ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(da.points), 0) DESC, d.id ASC)::int
            END AS rank
          FROM dealers d
          LEFT JOIN dealer_activities da 
            ON da.dealer_id = d.id
            AND da.campaign_id = $1
            AND da.timestamp >= $2
            AND da.timestamp <= $3
          WHERE d.status = 'ACTIVE'
          GROUP BY d.id
        )
        INSERT INTO dealer_scores (dealer_id, campaign_id, total_points, rank, updated_at)
        SELECT 
          pt.dealer_id,
          $1,
          pt.total_points,
          pt.rank,
          NOW()
        FROM point_totals pt
        ON CONFLICT (dealer_id, campaign_id)
        DO UPDATE SET
          total_points = EXCLUDED.total_points,
          rank = EXCLUDED.rank,
          updated_at = NOW();
      `, campaignId, campaign.startDate, campaign.endDate);

      const top = await prisma.dealerScore.findFirst({
        where: { campaignId },
        orderBy: { rank: 'asc' },
        select: { totalPoints: true },
      });

      return {
        totalDealers: await prisma.dealer.count({ where: { status: 'ACTIVE' } }),
        topScore: top?.totalPoints || 0,
        updatedAt: new Date(),
      };
    } catch (sqlErr) {
      console.warn('Postgres atomic ranking recalculation error, falling back to batched execution:', sqlErr);
    }
  }

  // Fallback for SQLite / dev
  const dealerTotals = await prisma.dealerActivity.groupBy({
    by: ['dealerId'],
    where: {
      campaignId,
      timestamp: { gte: campaign.startDate, lte: campaign.endDate },
    },
    _sum: { points: true },
    orderBy: { _sum: { points: 'desc' } },
  });

  const allDealers = await prisma.dealer.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  });

  const pointsMap = new Map<number, number>();
  for (const dt of dealerTotals) {
    pointsMap.set(dt.dealerId, dt._sum.points || 0);
  }

  for (const dealer of allDealers) {
    if (!pointsMap.has(dealer.id)) {
      pointsMap.set(dealer.id, 0);
    }
  }

  const sorted = [...pointsMap.entries()].sort((a, b) => b[1] - a[1]);

  const batchSize = 100;
  for (let i = 0; i < sorted.length; i += batchSize) {
    const batch = sorted.slice(i, i + batchSize);
    await prisma.$transaction(
      batch.map(([dealerId, totalPoints], idx) =>
        prisma.dealerScore.upsert({
          where: {
            dealerId_campaignId: { dealerId, campaignId },
          },
          update: {
            totalPoints,
            rank: totalPoints > 0 ? i + idx + 1 : 0,
          },
          create: {
            dealerId,
            campaignId,
            totalPoints,
            rank: totalPoints > 0 ? i + idx + 1 : 0,
          },
        })
      )
    );
  }

  return {
    totalDealers: sorted.length,
    topScore: sorted[0]?.[1] || 0,
    updatedAt: new Date(),
  };
}

/**
 * Get segmented leaderboards for a campaign:
 * - buyers: Dealers ranked by their Buyer points (Won lots, bids, participation)
 * - sellers: Dealers ranked by their Seller points (Vehicle sales, listings)
 * - overall: Combined championship standings
 *
 * For all dealers across all leagues, TVS Customer IDs are fetched and resolved.
 */
export async function getSegmentedLeaderboard(
  campaignId: number,
  limit?: number,
  unmasked?: boolean,
  currentDealerId?: number
): Promise<SegmentedLeaderboardResult> {
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    select: { startDate: true, endDate: true },
  });

  const dealers = await prisma.dealer.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      externalDealerId: true,
      maskedName: true,
      displayName: true,
      city: true,
      phone: true,
      category: true,
    },
  });
  const dealerMap = new Map(dealers.map(d => [d.id, d]));

  const activities = await prisma.dealerActivity.findMany({
    where: {
      campaignId,
      timestamp: { gte: campaign.startDate, lte: campaign.endDate },
    },
    select: {
      dealerId: true,
      activityType: true,
      points: true,
      metadata: true,
    },
  });

  const scores = await prisma.dealerScore.findMany({
    where: { campaignId, totalPoints: { gt: 0 } },
    select: { dealerId: true, totalPoints: true, rank: true },
  });
  const scoreMap = new Map(scores.map(s => [s.dealerId, s]));

  // Aggregate points and activity telemetry per dealer
  const aggMap = new Map<number, {
    buyerPoints: number;
    sellerPoints: number;
    totalPoints: number;
    buysCount: number;
    bidsCount: number;
    salesCount: number;
    listingsCount: number;
    activities: Array<{ metadata?: string | null }>;
  }>();

  for (const a of activities) {
    if (!aggMap.has(a.dealerId)) {
      aggMap.set(a.dealerId, {
        buyerPoints: 0,
        sellerPoints: 0,
        totalPoints: 0,
        buysCount: 0,
        bidsCount: 0,
        salesCount: 0,
        listingsCount: 0,
        activities: [],
      });
    }
    const item = aggMap.get(a.dealerId)!;
    item.totalPoints += a.points;
    item.activities.push(a);

    if (a.activityType === 'BUY') {
      item.buyerPoints += a.points;
      item.buysCount++;
    } else if (a.activityType === 'BID_PLACED') {
      item.buyerPoints += a.points;
      item.bidsCount++;
    } else if (a.activityType === 'MATCH_PARTICIPATION' || a.activityType === 'ALL_MATCHES_BONUS') {
      item.buyerPoints += a.points;
    } else if (a.activityType === 'SELL') {
      item.sellerPoints += a.points;
      item.salesCount++;
    } else if (a.activityType === 'SELL_LISTING') {
      item.sellerPoints += a.points;
      item.listingsCount++;
    } else if (a.activityType === 'SELL_COMMISSION') {
      item.sellerPoints += a.points;
    }
  }

  // Include any dealers present in dealer_scores that may not have active activity records
  for (const s of scores) {
    if (!aggMap.has(s.dealerId)) {
      aggMap.set(s.dealerId, {
        buyerPoints: 0,
        sellerPoints: 0,
        totalPoints: s.totalPoints,
        buysCount: 0,
        bidsCount: 0,
        salesCount: 0,
        listingsCount: 0,
        activities: [],
      });
    }
  }

  const isUnmasked = unmasked ?? !MASKING_ENABLED;

  const validEntries: Array<Omit<LeaderboardEntry, 'rank' | 'points'>> = [];

  for (const [dealerId, agg] of aggMap.entries()) {
    const dealer = dealerMap.get(dealerId);
    if (!dealer || dealer.displayName === 'null' || dealer.externalDealerId === 'SELLER-null') {
      continue;
    }

    const custInfo = resolveDealerCustomer(dealer, agg.activities);
    const realName = dealer.displayName || custInfo.companyName || `Dealer ${dealer.externalDealerId}`;
    const maskedName = maskDealerName(realName);

    // If unmasked (admin mode), everything is visible.
    // If dealer specific login, competitor dealers are strictly masked, while own dealer is visible.
    const isSelf = Boolean(currentDealerId && dealer.id === currentDealerId);
    const isEntryUnmasked = isUnmasked || isSelf;
    const displayName = isEntryUnmasked ? realName : maskedName;

    const finalRole = custInfo.role !== 'General'
      ? custInfo.role
      : (agg.sellerPoints > agg.buyerPoints ? 'Seller' : 'Buyer');

    // Use materialized totalPoints if higher or equal, else aggregated
    const totalPts = Math.max(agg.totalPoints, scoreMap.get(dealerId)?.totalPoints || 0);

    validEntries.push({
      dealerId: dealer.id,
      dealer: displayName,
      dealerName: displayName,
      maskedName,
      realName: isEntryUnmasked ? realName : undefined,
      externalId: isEntryUnmasked ? dealer.externalDealerId : undefined,
      customerId: isEntryUnmasked ? custInfo.customerId : undefined,
      customerCode: isEntryUnmasked ? custInfo.customerCode : undefined,
      numericCustomerId: isEntryUnmasked ? custInfo.numericCustomerId : null,
      city: isEntryUnmasked ? (custInfo.city || dealer.city || 'Tamil Nadu') : (dealer.city || 'Tamil Nadu'),
      role: finalRole,
      category: custInfo.category,
      totalPoints: totalPts,
      buyerPoints: agg.buyerPoints,
      sellerPoints: agg.sellerPoints,
      buysCount: agg.buysCount,
      bidsCount: agg.bidsCount,
      salesCount: agg.salesCount,
      listingsCount: agg.listingsCount,
      isUnmasked: isEntryUnmasked,
      isCurrentDealer: isSelf,
    });
  }

  // 1. Overall Standings
  const overallSorted = [...validEntries]
    .filter(e => e.totalPoints > 0)
    .sort((a, b) => b.totalPoints - a.totalPoints || a.dealerId - b.dealerId);

  // 2. Buyer Leaderboard (strictly ranked by Buyer points earned from cars bid on, participation, and bonus)
  const buyersSorted = [...validEntries]
    .filter(e => e.buyerPoints > 0)
    .sort((a, b) => b.buyerPoints - a.buyerPoints || a.dealerId - b.dealerId);

  // 3. Seller Leaderboard (strictly ranked by Seller points earned from vehicle listings and commission)
  const sellersSorted = [...validEntries]
    .filter(e => e.sellerPoints > 0)
    .sort((a, b) => b.sellerPoints - a.sellerPoints || a.dealerId - b.dealerId);

  // Compute ranking lookup maps across categories
  const buyerRankMap = new Map<number, number>(buyersSorted.map((e, idx) => [e.dealerId, idx + 1]));
  const sellerRankMap = new Map<number, number>(sellersSorted.map((e, idx) => [e.dealerId, idx + 1]));
  const overallRankMap = new Map<number, number>(overallSorted.map((e, idx) => [e.dealerId, idx + 1]));

  const overall: LeaderboardEntry[] = overallSorted.map((e, idx) => ({
    ...e,
    rank: idx + 1,
    points: e.totalPoints,
    overallRank: idx + 1,
    buyerRank: buyerRankMap.get(e.dealerId),
    sellerRank: sellerRankMap.get(e.dealerId),
  }));

  const buyers: LeaderboardEntry[] = buyersSorted.map((e, idx) => ({
    ...e,
    rank: idx + 1,
    points: e.buyerPoints,
    buyerRank: idx + 1,
    sellerRank: sellerRankMap.get(e.dealerId),
    overallRank: overallRankMap.get(e.dealerId),
  }));

  const sellers: LeaderboardEntry[] = sellersSorted.map((e, idx) => ({
    ...e,
    rank: idx + 1,
    points: e.sellerPoints,
    sellerRank: idx + 1,
    buyerRank: buyerRankMap.get(e.dealerId),
    overallRank: overallRankMap.get(e.dealerId),
  }));

  return {
    buyers: limit ? buyers.slice(0, limit) : buyers,
    sellers: limit ? sellers.slice(0, limit) : sellers,
    overall: limit ? overall.slice(0, limit) : overall,
    counts: {
      buyers: buyers.length,
      sellers: sellers.length,
      overall: overall.length,
    },
  };
}

/**
 * Get the leaderboard for a campaign.
 * By default, dealer names are masked unless unmasked = true or MASKING_ENABLED = false.
 * Supports filtering by category: 'all' | 'buyer' | 'seller'.
 */
export async function getLeaderboard(
  campaignId: number,
  limit?: number,
  unmasked?: boolean,
  category?: 'all' | 'buyer' | 'seller',
  currentDealerId?: number
): Promise<LeaderboardEntry[]> {
  const segmented = await getSegmentedLeaderboard(campaignId, limit, unmasked, currentDealerId);
  if (category === 'buyer') return segmented.buyers;
  if (category === 'seller') return segmented.sellers;
  return segmented.buyers.length > 0 ? segmented.buyers : segmented.overall;
}

/**
 * Get position context for a specific dealer across Buyer and Seller Leagues.
 */
export async function getPositionContext(dealerId: number, campaignId: number) {
  const segmented = await getSegmentedLeaderboard(campaignId, undefined, false, dealerId);
  
  // Find buyer position
  const bIdx = segmented.buyers.findIndex(e => e.dealerId === dealerId);
  const buyerEntry = bIdx >= 0 ? segmented.buyers[bIdx] : null;
  const buyerAbove = bIdx > 0 ? segmented.buyers[bIdx - 1] : null;
  const buyerBelow = bIdx >= 0 && bIdx < segmented.buyers.length - 1 ? segmented.buyers[bIdx + 1] : null;

  const buyerPosition = buyerEntry ? {
    rank: buyerEntry.rank,
    points: buyerEntry.points,
    above: buyerAbove ? {
      rank: buyerAbove.rank,
      dealer: maskDealerName(buyerAbove.dealer),
      points: buyerAbove.points,
      gap: buyerAbove.points - buyerEntry.points,
    } : null,
    below: buyerBelow ? {
      rank: buyerBelow.rank,
      dealer: maskDealerName(buyerBelow.dealer),
      points: buyerBelow.points,
      gap: buyerEntry.points - buyerBelow.points,
    } : null,
  } : null;

  // Find seller position
  const sIdx = segmented.sellers.findIndex(e => e.dealerId === dealerId);
  const sellerEntry = sIdx >= 0 ? segmented.sellers[sIdx] : null;
  const sellerAbove = sIdx > 0 ? segmented.sellers[sIdx - 1] : null;
  const sellerBelow = sIdx >= 0 && sIdx < segmented.sellers.length - 1 ? segmented.sellers[sIdx + 1] : null;

  const sellerPosition = sellerEntry ? {
    rank: sellerEntry.rank,
    points: sellerEntry.points,
    above: sellerAbove ? {
      rank: sellerAbove.rank,
      dealer: maskDealerName(sellerAbove.dealer),
      points: sellerAbove.points,
      gap: sellerAbove.points - sellerEntry.points,
    } : null,
    below: sellerBelow ? {
      rank: sellerBelow.rank,
      dealer: maskDealerName(sellerBelow.dealer),
      points: sellerBelow.points,
      gap: sellerEntry.points - sellerBelow.points,
    } : null,
  } : null;

  // Primary position: prioritizes Buyer or Seller league based on active points
  const primary = (buyerPosition && buyerPosition.points >= (sellerPosition?.points || 0))
    ? buyerPosition
    : (sellerPosition || buyerPosition);

  return {
    rank: primary?.rank || 0,
    points: primary?.points || 0,
    above: primary?.above || null,
    below: primary?.below || null,
    buyer: buyerPosition,
    seller: sellerPosition,
  };
}
