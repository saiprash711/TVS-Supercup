/**
 * Ranking Engine
 * 
 * Recalculates dealer rankings for a campaign.
 * Updates the dealer_scores table which serves as a materialized view
 * for fast leaderboard queries.
 */

import { prisma } from '@/lib/db';
import { MASKING_ENABLED, maskDealerName } from './masking';

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
 * Get the leaderboard for a campaign.
 * By default, dealer names are masked unless unmasked = true or MASKING_ENABLED = false.
 */
export async function getLeaderboard(campaignId: number, limit?: number, unmasked?: boolean) {
  const scores = await prisma.dealerScore.findMany({
    where: { campaignId, totalPoints: { gt: 0 } },
    include: {
      dealer: {
        select: {
          id: true,
          externalDealerId: true,
          maskedName: true,
          displayName: true,
          city: true,
        },
      },
    },
    orderBy: { rank: 'asc' },
    take: limit,
  });

  return scores.map((s) => {
    const isUnmasked = unmasked ?? !MASKING_ENABLED;
    const realName = s.dealer.displayName || s.dealer.maskedName || `Dealer ${s.dealer.externalDealerId}`;
    // Recompute masks at the response boundary so stale or unsafe DB values are never exposed.
    const maskedName = maskDealerName(realName);

    return {
      rank: s.rank,
      dealer: isUnmasked ? realName : maskedName,
      dealerName: isUnmasked ? realName : maskedName,
      maskedName: maskedName,
      externalId: isUnmasked ? s.dealer.externalDealerId : undefined,
      city: s.dealer.city,
      points: s.totalPoints,
      dealerId: s.dealer.id,
      isUnmasked,
    };
  });
}

/**
 * Get position context for a specific dealer (who's above/below them).
 */
export async function getPositionContext(dealerId: number, campaignId: number) {
  const dealerScore = await prisma.dealerScore.findUnique({
    where: {
      dealerId_campaignId: { dealerId, campaignId },
    },
    include: {
      dealer: { select: { maskedName: true, displayName: true } },
    },
  });

  if (!dealerScore) return null;

  const rank = dealerScore.rank;
  if (rank <= 0) {
    return {
      rank: 0,
      points: dealerScore.totalPoints,
      above: null,
      below: null,
    };
  }

  // Get dealer above (rank - 1)
  const above = rank > 1
    ? await prisma.dealerScore.findFirst({
        where: { campaignId, rank: rank - 1 },
        include: { dealer: { select: { maskedName: true, displayName: true } } },
      })
    : null;

  // Get dealer below (rank + 1)
  const below = await prisma.dealerScore.findFirst({
    where: { campaignId, rank: rank + 1 },
    include: { dealer: { select: { maskedName: true, displayName: true } } },
  });

  return {
    rank: dealerScore.rank,
    points: dealerScore.totalPoints,
    above: above
      ? {
          rank: above.rank,
          dealer: MASKING_ENABLED
            ? maskDealerName(above.dealer.displayName || above.dealer.maskedName)
            : (above.dealer.displayName || above.dealer.maskedName),
          points: above.totalPoints,
          gap: above.totalPoints - dealerScore.totalPoints,
        }
      : null,
    below: below
      ? {
          rank: below.rank,
          dealer: MASKING_ENABLED
            ? maskDealerName(below.dealer.displayName || below.dealer.maskedName)
            : (below.dealer.displayName || below.dealer.maskedName),
          points: below.totalPoints,
          gap: dealerScore.totalPoints - below.totalPoints,
        }
      : null,
  };
}
