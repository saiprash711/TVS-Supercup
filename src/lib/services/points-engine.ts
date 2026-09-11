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
  | 'BUY'
  | 'SELL'
  | 'MATCH_PARTICIPATION'
  | 'BID_PLACED'
  | 'VEHICLE_INSPECTED'
  | 'WATCHLIST_ADD'
  | 'ALL_MATCHES_BONUS';

interface PointRuleMap {
  [key: string]: number;
}

/**
 * Get the active point rules for a campaign.
 */
export async function getPointRules(campaignId: number): Promise<PointRuleMap> {
  const rules = await prisma.pointRule.findMany({
    where: { campaignId, active: true },
  });

  const ruleMap: PointRuleMap = {};
  for (const rule of rules) {
    ruleMap[rule.activityType] = rule.points;
  }
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
}) {
  const matchId = params.matchId ?? null;
  const externalTransactionId = params.externalTransactionId ?? null;

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

  const points = await calculatePoints(params.campaignId, params.activityType);
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
 */
export async function checkAllMatchesBonus(
  dealerId: number,
  campaignId: number
): Promise<boolean> {
  // Get all completed match days for this campaign
  const completedMatches = await prisma.matchDay.findMany({
    where: {
      campaignId,
      status: { in: ['COMPLETED', 'LIVE'] },
    },
  });

  if (completedMatches.length < 4) return false;

  // Check if dealer participated in all of them
  const participations = await prisma.dealerActivity.findMany({
    where: {
      dealerId,
      campaignId,
      activityType: 'MATCH_PARTICIPATION',
      matchId: { in: completedMatches.map(m => m.id) },
    },
  });

  return participations.length >= completedMatches.length;
}

/**
 * Get activity breakdown for a dealer in a campaign.
 */
export async function getActivityBreakdown(dealerId: number, campaignId: number) {
  const rules = await getPointRules(campaignId);
  
  const activities = await prisma.dealerActivity.findMany({
    where: { dealerId, campaignId },
    include: { match: true },
    orderBy: { timestamp: 'desc' },
  });

  const breakdown = {
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
      case 'BUY':
        breakdown.buyCount++;
        breakdown.buyPoints += activity.points;
        break;
      case 'SELL':
        breakdown.sellCount++;
        breakdown.sellPoints += activity.points;
        break;
      case 'MATCH_PARTICIPATION':
        breakdown.matchParticipationCount++;
        breakdown.matchParticipationPoints += activity.points;
        break;
      case 'BID_PLACED':
        breakdown.bidCount++;
        breakdown.bidPoints += activity.points;
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
