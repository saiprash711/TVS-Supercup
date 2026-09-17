/**
 * TVS Certified Live Activity Synchronizer
 * 
 * Fetches real-time auction activities (BUY, SELL, MATCH_PARTICIPATION)
 * for a dealer from TVS Certified backend services and pipes them into
 * the Super Cup Points & Ranking Engines.
 */

import { prisma } from '@/lib/db';
import { getTVSProvider } from './tvs-integration';
import { recordActivity, checkAllMatchesBonus } from './points-engine';
import { recalculateRankings } from './ranking-engine';

export interface SyncResult {
  dealerId: number;
  externalDealerId: string;
  newActivitiesCount: number;
  newPointsAwarded: number;
  totalPoints: number;
  rank: number;
}

/**
 * Synchronize live activities for a single dealer.
 */
export async function syncDealerActivities(
  dealerId: number,
  externalDealerId: string,
  campaignId: number,
  token?: string
): Promise<SyncResult> {
  const provider = getTVSProvider();
  let newActivitiesCount = 0;
  let newPointsAwarded = 0;

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return { dealerId, externalDealerId, newActivitiesCount: 0, newPointsAwarded: 0, totalPoints: 0, rank: 0 };
    }

    // Get match days for this campaign to map auctionId to matchId
    const matchDays = await prisma.matchDay.findMany({
      where: { campaignId },
    });

    const auctionToMatchMap = new Map<string, number>();
    for (const match of matchDays) {
      if (match.auctionId) {
        auctionToMatchMap.set(match.auctionId, match.id);
      }
    }

    // Default to the current live or upcoming match if unmapped
    const liveMatch = matchDays.find(m => m.status === 'LIVE') || matchDays.find(m => m.status === 'UPCOMING') || matchDays[0];
    const targetAuctionId = liveMatch?.auctionId || '1991';

    // 1. Fetch live activities from TVS APIs strictly for this auction
    const liveActivities = await provider.getDealerActivities(externalDealerId, targetAuctionId, token);

    // 2. Record each transaction in the points engine
    for (const act of liveActivities) {
      // Validate activity date against campaign window
      if (act.timestamp) {
        const actTime = new Date(act.timestamp).getTime();
        const start = new Date(campaign.startDate).getTime();
        const end = new Date(campaign.endDate).getTime();
        if (actTime < start || actTime > end) {
          continue; // Outside active campaign window (e.g. historical past auction from 2025)
        }
      }

      // Ensure activity belongs to a scheduled match auction in the campaign
      const matchId = act.auctionId ? auctionToMatchMap.get(act.auctionId) : liveMatch?.id;
      if (!matchId) {
        continue; // Unmapped auction outside Super Cup
      }

      const recordResult = await recordActivity({
        dealerId,
        campaignId,
        matchId,
        activityType: act.activityType,
        externalTransactionId: act.transactionId,
        metadata: act.metadata,
        timestamp: act.timestamp,
      });

      if (recordResult.success && !recordResult.duplicate) {
        newActivitiesCount++;
        newPointsAwarded += recordResult.points;
      }
    }

    // 3. Check for ALL_MATCHES_BONUS
    const qualifiesBonus = await checkAllMatchesBonus(dealerId, campaignId);
    if (qualifiesBonus) {
      const bonusResult = await recordActivity({
        dealerId,
        campaignId,
        matchId: null,
        activityType: 'ALL_MATCHES_BONUS',
        externalTransactionId: `BONUS-${campaignId}-${dealerId}`,
        metadata: { campaignId, dealerId, bonusType: 'ALL_MATCHES_BONUS' },
      });

      if (bonusResult.success && !bonusResult.duplicate) {
        newActivitiesCount++;
        newPointsAwarded += bonusResult.points;
      }
    }

    // 4. Recalculate rankings if any new points were awarded
    if (newPointsAwarded > 0) {
      await recalculateRankings(campaignId);
    }
  } catch (error) {
    console.error(`Error syncing activities for dealer ${externalDealerId}:`, error);
  }

  // Get current score and rank
  const score = await prisma.dealerScore.findUnique({
    where: {
      dealerId_campaignId: { dealerId, campaignId },
    },
  });

  return {
    dealerId,
    externalDealerId,
    newActivitiesCount,
    newPointsAwarded,
    totalPoints: score?.totalPoints || 0,
    rank: score?.rank || 0,
  };
}

/**
 * Sync activities for an entire match auction (all dealers).
 */
export async function syncAuctionActivities(
  auctionId: string = '1991',
  campaignId: number,
  token?: string
): Promise<{ processed: number; pointsAwarded: number; totalActivitiesFound: number }> {
  const provider = getTVSProvider();
  let processed = 0;
  let pointsAwarded = 0;

  try {
    const activities = await provider.getAuctionActivities(auctionId, token);

    // Map dealers by externalDealerId (supporting both raw ID and USR- prefixed ID)
    const externalIds = [...new Set(activities.map(a => a.dealerId))];
    const searchIds: string[] = [];
    for (const id of externalIds) {
      searchIds.push(id);
      if (!id.startsWith('USR-')) searchIds.push(`USR-${id}`);
      else searchIds.push(id.replace('USR-', ''));
    }

    const dealers = await prisma.dealer.findMany({
      where: { externalDealerId: { in: searchIds } },
    });
    const dealerMap = new Map<string, number>();
    for (const d of dealers) {
      dealerMap.set(d.externalDealerId, d.id);
      if (d.externalDealerId.startsWith('USR-')) {
        dealerMap.set(d.externalDealerId.replace('USR-', ''), d.id);
      } else {
        dealerMap.set(`USR-${d.externalDealerId}`, d.id);
      }
    }

    const match = await prisma.matchDay.findFirst({
      where: { campaignId, auctionId },
    });

    // Pre-fetch all recorded transaction IDs for this campaign to avoid repetitive roundtrips
    const transactionIds = activities
      .map(a => a.transactionId)
      .filter((id): id is string => Boolean(id));

    const existingActivities = await prisma.dealerActivity.findMany({
      where: {
        campaignId,
        externalTransactionId: { in: transactionIds },
      },
      select: {
        dealerId: true,
        activityType: true,
        externalTransactionId: true,
      },
    });

    const existingSet = new Set(
      existingActivities.map(
        a => `${a.dealerId}:${a.activityType}:${a.externalTransactionId}`
      )
    );

    for (const act of activities) {
      let dealerId = dealerMap.get(act.dealerId);

      // If dealer is not in local DB (e.g. newly registered on TVS today), auto-provision them
      if (!dealerId) {
        try {
          const profile = await provider.getDealerProfile(act.dealerId, token);
          const displayName = profile?.dealerName || `Dealer ${act.dealerId}`;
          const maskedName = displayName.trim().charAt(0).toUpperCase() + '*****';
          const newDealer = await prisma.dealer.create({
            data: {
              externalDealerId: act.dealerId,
              displayName,
              maskedName,
              city: profile?.city || 'Tamil Nadu',
              status: 'ACTIVE',
            },
          });
          dealerId = newDealer.id;
          dealerMap.set(act.dealerId, dealerId);
          await prisma.dealerScore.upsert({
            where: { dealerId_campaignId: { dealerId, campaignId } },
            update: {},
            create: { dealerId, campaignId, totalPoints: 0, rank: 9999 },
          });
        } catch {
          const existing = await prisma.dealer.findUnique({ where: { externalDealerId: act.dealerId } });
          if (existing) {
            dealerId = existing.id;
            dealerMap.set(act.dealerId, dealerId);
          }
        }
      }

      if (!dealerId) continue;

      const dedupeKey = `${dealerId}:${act.activityType}:${act.transactionId}`;
      if (existingSet.has(dedupeKey)) continue;

      const res = await recordActivity({
        dealerId,
        campaignId,
        matchId: match?.id || null,
        activityType: act.activityType,
        externalTransactionId: act.transactionId,
        metadata: act.metadata,
        timestamp: act.timestamp,
        skipDedupeCheck: true,
      });

      if (res.success && !res.duplicate) {
        processed++;
        pointsAwarded += res.points;
        existingSet.add(dedupeKey);
      }
    }

    if (pointsAwarded > 0) {
      await recalculateRankings(campaignId);
    }

    return { processed, pointsAwarded, totalActivitiesFound: activities.length };
  } catch (error) {
    console.error(`Error syncing auction ${auctionId}:`, error);
    return { processed, pointsAwarded, totalActivitiesFound: 0 };
  }
}

/**
 * Synchronize the current live auction (e.g. tomorrow's 2 PM auction #1991)
 */
export async function syncLiveAuction(
  auctionId?: string,
  token?: string
): Promise<{ success: boolean; processed: number; pointsAwarded: number; totalActivitiesFound?: number; auctionId: string }> {
  const campaign = await prisma.campaign.findFirst({
    where: { type: 'SUPER_CUP', status: 'ACTIVE' },
    include: { matchDays: true },
    orderBy: { startDate: 'desc' },
  });

  if (!campaign) {
    return { success: false, processed: 0, pointsAwarded: 0, totalActivitiesFound: 0, auctionId: auctionId || '1991' };
  }

  const liveMatch = campaign.matchDays.find(m => m.status === 'LIVE') ||
                    campaign.matchDays.find(m => m.status === 'UPCOMING') ||
                    campaign.matchDays[0];
  const targetAuctionId = auctionId || liveMatch?.auctionId || '1991';

  const result = await syncAuctionActivities(targetAuctionId, campaign.id, token);

  return {
    success: true,
    processed: result.processed,
    pointsAwarded: result.pointsAwarded,
    totalActivitiesFound: result.totalActivitiesFound,
    auctionId: targetAuctionId,
  };
}

