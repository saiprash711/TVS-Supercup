/**
 * Points Engine
 * 
 * Configurable scoring system that reads point rules from the database.
 * Handles:
 *  - Per-activity point calculation
 *  - ALL_MATCHES_BONUS logic
 *  - Duplicate prevention (via DB unique constraints)
 *  - Rule lookups from the point_rules table
 */

import { prisma } from '@/lib/db';

export type ActivityType =
  // SELLING
  | 'SELL_LISTING'        // Listing: 5 points
  | 'SELL_COMMISSION'     // Commission: 5 points
  // BUYING
  | 'MATCH_PARTICIPATION' // Participation: 1 point
  | 'BID_PLACED'          // Bids: 1 point
  // Legacy / Deactivated (Conversions ignored as cannot be captured reliably)
  | 'SELL'                // Conversion: 0 points (deactivated)
  | 'BUY'                 // Conversion: 0 points (deactivated)
  | 'VEHICLE_INSPECTED'
  | 'WATCHLIST_ADD'
  | 'ALL_MATCHES_BONUS';

interface PointRuleMap {
  [key: string]: number;
}

const pointRulesCache = new Map<number, { rules: PointRuleMap; expiry: number }>();

export function clearPointRulesCache(campaignId?: number) {
  if (campaignId) pointRulesCache.delete(campaignId);
  else pointRulesCache.clear();
}

/**
 * Get the active point rules for a campaign.
 */
export async function getPointRules(campaignId: number): Promise<PointRuleMap> {
  const cached = pointRulesCache.get(campaignId);
  if (cached && Date.now() < cached.expiry) {
    return cached.rules;
  }

  const rules = await prisma.pointRule.findMany({
    where: { campaignId, active: true },
  });

  const ruleMap: PointRuleMap = {};
  for (const rule of rules) {
    ruleMap[rule.activityType] = rule.points;
  }
  pointRulesCache.set(campaignId, { rules: ruleMap, expiry: Date.now() + 30000 });
  return ruleMap;
}

/**
 * Calculate points for an activity based on configured rules.
 */
export async function calculatePoints(
  campaignId: number,
  activityType: ActivityType
): Promise<number> {
  const rules = await getPointRules(campaignId);
  return rules[activityType] || 0;
}

/**
 * Record a dealer activity and award points.
 * Returns the created activity or null if duplicate.
 */
export async function recordActivity(params: {
  dealerId: number;
  campaignId: number;
  matchId: number | null;
  activityType: ActivityType;
  externalTransactionId: string;
  metadata?: string | Record<string, unknown>;
  timestamp?: Date;
  skipDedupeCheck?: boolean;
}) {
  const matchId = params.matchId ?? null;
  const externalTransactionId = params.externalTransactionId ?? null;

  // Participation is awarded at most once per dealer and match, regardless of
  // whether it came from the attendance feed or verified live-auction activity.
  if (params.activityType === 'MATCH_PARTICIPATION' && matchId !== null) {
    const existingParticipation = await prisma.dealerActivity.findFirst({
      where: {
        dealerId: params.dealerId,
        campaignId: params.campaignId,
        matchId,
        activityType: 'MATCH_PARTICIPATION',
      },
      select: { id: true },
    });
    if (existingParticipation) {
      return { success: false, duplicate: true, points: 0 };
    }
  }

  if (!params.skipDedupeCheck) {
    // Check if this activity is already recorded (prevents unnecessary unique constraint errors and Prisma error logs)
    const existing = await prisma.dealerActivity.findFirst({
      where: {
        dealerId: params.dealerId,
        campaignId: params.campaignId,
        matchId,
        activityType: params.activityType,
        externalTransactionId,
      },
      select: { id: true },
    });

    if (existing) {
      return { success: false, duplicate: true, points: 0 };
    }
  }

  let points = await calculatePoints(params.campaignId, params.activityType);

  // Per car basis for BID_PLACED: points are awarded strictly once per car
  if (params.activityType === 'BID_PLACED') {
    let vehicleId: string | number | undefined;
    if (params.metadata) {
      try {
        const meta = typeof params.metadata === 'string'
          ? JSON.parse(params.metadata)
          : params.metadata;
        vehicleId = meta?.vehicleId;
      } catch {}
    }
    if (!vehicleId && params.externalTransactionId) {
      const m = params.externalTransactionId.match(/^(?:BID|PREBID)-[^-]+-([^-]+)-/);
      if (m) vehicleId = m[1];
    }

    if (vehicleId != null) {
      const existingVehicleBid = await prisma.dealerActivity.findFirst({
        where: {
          dealerId: params.dealerId,
          campaignId: params.campaignId,
          ...(matchId !== null ? { matchId } : {}),
          activityType: 'BID_PLACED',
          points: { gt: 0 },
          OR: [
            { metadata: { contains: `"vehicleId":${vehicleId}` } },
            { metadata: { contains: `"vehicleId":"${vehicleId}"` } },
            { externalTransactionId: { contains: `-${vehicleId}-` } },
          ],
        },
        select: { id: true },
      });

      if (existingVehicleBid) {
        // Subsequent bids on the same car do not earn duplicate points
        points = 0;
      }
    }
  }

  const metadataString = typeof params.metadata === 'string'
    ? params.metadata
    : JSON.stringify(params.metadata || {});

  try {
    const activity = await prisma.dealerActivity.create({
      data: {
        dealerId: params.dealerId,
        campaignId: params.campaignId,
        matchId,
        activityType: params.activityType,
        externalTransactionId,
        points,
        metadata: metadataString,
        timestamp: params.timestamp || new Date(),
      },
    });

    return { success: true, activity, points };
  } catch (error: unknown) {
    // Unique constraint violation = duplicate activity (safeguard against concurrent race conditions)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return { success: false, duplicate: true, points: 0 };
    }
    throw error;
  }
}

/**
 * Check if a dealer qualifies for the ALL_MATCHES_BONUS.
 * Awards bonus points to buyers who participate in all scheduled match days.
 */
export async function checkAllMatchesBonus(
  dealerId: number,
  campaignId: number
): Promise<boolean> {
  // Get all scheduled match days for this campaign
  const allMatches = await prisma.matchDay.findMany({
    where: { campaignId },
    select: { id: true, status: true },
  });

  if (allMatches.length === 0) return false;

  // All matches must be completed or live
  const completedMatches = allMatches.filter(m => m.status === 'COMPLETED' || m.status === 'LIVE');
  if (completedMatches.length < allMatches.length) return false;

  // Check if dealer participated in all of them
  const participations = await prisma.dealerActivity.findMany({
    where: {
      dealerId,
      campaignId,
      activityType: 'MATCH_PARTICIPATION',
      matchId: { in: allMatches.map(m => m.id) },
    },
    select: { matchId: true },
  });

  const participatedMatchIds = new Set(participations.map(activity => activity.matchId));
  return allMatches.every(match => participatedMatchIds.has(match.id));
}

/**
 * Get activity breakdown for a dealer in a campaign.
 */
export async function getActivityBreakdown(dealerId: number, campaignId: number) {
  const rules = await getPointRules(campaignId);
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    select: { startDate: true, endDate: true },
  });
  
  const activities = await prisma.dealerActivity.findMany({
    where: {
      dealerId,
      campaignId,
      timestamp: { gte: campaign.startDate, lte: campaign.endDate },
    },
    include: { match: true },
    orderBy: { timestamp: 'desc' },
  });

  const breakdown = {
    // SELLING
    sellListingCount: 0,
    sellListingPoints: 0,
    sellConversionCount: 0,
    sellConversionPoints: 0,
    sellCommissionCount: 0,
    sellCommissionPoints: 0,
    // BUYING
    buyParticipationCount: 0,
    buyParticipationPoints: 0,
    buyBidCount: 0,
    buyBidPoints: 0,
    buyConversionCount: 0,
    buyConversionPoints: 0,
    // Backwards Compatibility Aliases
    buyCount: 0,
    buyPoints: 0,
    sellCount: 0,
    sellPoints: 0,
    matchParticipationCount: 0,
    matchParticipationPoints: 0,
    bidCount: 0,
    bidPoints: 0,
    inspectedCount: 0,
    inspectedPoints: 0,
    watchlistCount: 0,
    watchlistPoints: 0,
    allMatchesBonus: 0,
    totalPoints: 0,
    activities,
    rules,
  };

  for (const activity of activities) {
    switch (activity.activityType) {
      case 'SELL_LISTING':
        breakdown.sellListingCount++;
        breakdown.sellListingPoints += activity.points;
        break;
      case 'SELL':
        breakdown.sellConversionCount++;
        breakdown.sellConversionPoints += activity.points;
        breakdown.sellCount++;
        breakdown.sellPoints += activity.points;
        break;
      case 'SELL_COMMISSION':
        breakdown.sellCommissionCount++;
        breakdown.sellCommissionPoints += activity.points;
        break;
      case 'MATCH_PARTICIPATION':
        breakdown.buyParticipationCount++;
        breakdown.buyParticipationPoints += activity.points;
        breakdown.matchParticipationCount++;
        breakdown.matchParticipationPoints += activity.points;
        break;
      case 'BID_PLACED':
        if (activity.points > 0) {
          breakdown.buyBidCount++;
          breakdown.buyBidPoints += activity.points;
        }
        breakdown.bidCount++;
        breakdown.bidPoints += activity.points;
        break;
      case 'BUY':
        breakdown.buyConversionCount++;
        breakdown.buyConversionPoints += activity.points;
        breakdown.buyCount++;
        breakdown.buyPoints += activity.points;
        break;
      case 'VEHICLE_INSPECTED':
        breakdown.inspectedCount++;
        breakdown.inspectedPoints += activity.points;
        break;
      case 'WATCHLIST_ADD':
        breakdown.watchlistCount++;
        breakdown.watchlistPoints += activity.points;
        break;
      case 'ALL_MATCHES_BONUS':
        breakdown.allMatchesBonus += activity.points;
        break;
    }
    breakdown.totalPoints += activity.points;
  }

  return breakdown;
}
