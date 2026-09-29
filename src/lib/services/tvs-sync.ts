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
import { getCurrentSuperCupCampaignWithMatches } from './campaign';

type CampaignWindow = { startDate: Date; endDate: Date };

function isWithinCampaign(timestamp: Date | string | undefined, campaign: CampaignWindow): boolean {
  if (!timestamp) return false;
  const activityTime = new Date(timestamp).getTime();
  return Number.isFinite(activityTime)
    && activityTime >= campaign.startDate.getTime()
    && activityTime <= campaign.endDate.getTime();
}

function provesLiveParticipation(activityType: string, metadata?: Record<string, unknown>): boolean {
  if (activityType === 'MATCH_PARTICIPATION') return true;
  if (activityType === 'BUY' || activityType === 'SELL') return true;
  return activityType === 'BID_PLACED' && metadata?.isPreBid !== true;
}

async function ensureMatchParticipation(params: {
  dealerId: number;
  campaignId: number;
  matchId: number;
  timestamp: Date;
  sourceTransactionId: string;
}) {
  return recordActivity({
    dealerId: params.dealerId,
    campaignId: params.campaignId,
    matchId: params.matchId,
    activityType: 'MATCH_PARTICIPATION',
    externalTransactionId: `INFERRED-ATTEND-${params.campaignId}-${params.matchId}-${params.dealerId}`,
    metadata: {
      inferred: true,
      source: 'VERIFIED_LIVE_AUCTION_ACTIVITY',
      sourceTransactionId: params.sourceTransactionId,
    },
    timestamp: params.timestamp,
  });
}

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

    // Do not poll or award anything before the campaign opens or after it closes.
    if (!isWithinCampaign(new Date(), campaign)) {
      const score = await prisma.dealerScore.findUnique({
        where: { dealerId_campaignId: { dealerId, campaignId } },
      });
      return {
        dealerId,
        externalDealerId,
        newActivitiesCount: 0,
        newPointsAwarded: 0,
        totalPoints: score?.totalPoints || 0,
        rank: score?.rank || 0,
      };
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
    let targetAuctionId = liveMatch?.auctionId || '2003';

    // If date-based placeholder, attempt auto-discovery from TVS platform
    if (/^TVSC-\d{4}-\d{2}-\d{2}$/.test(targetAuctionId)) {
      if (provider.discoverAuction && liveMatch) {
        const discovered = await provider.discoverAuction(liveMatch.date, token);
        if (discovered?.id) {
          targetAuctionId = discovered.id;
          await prisma.matchDay.update({
            where: { id: liveMatch.id },
            data: {
              auctionId: discovered.id,
              ...(discovered.stage === 'live' && liveMatch.status === 'UPCOMING' ? { status: 'LIVE' } : {}),
            },
          }).catch(() => {});
        } else {
          const score = await prisma.dealerScore.findUnique({
            where: { dealerId_campaignId: { dealerId, campaignId } },
          });
          return {
            dealerId,
            externalDealerId,
            newActivitiesCount: 0,
            newPointsAwarded: 0,
            totalPoints: score?.totalPoints || 0,
            rank: score?.rank || 0,
          };
        }
      } else {
        const score = await prisma.dealerScore.findUnique({
          where: { dealerId_campaignId: { dealerId, campaignId } },
        });
        return {
          dealerId,
          externalDealerId,
          newActivitiesCount: 0,
          newPointsAwarded: 0,
          totalPoints: score?.totalPoints || 0,
          rank: score?.rank || 0,
        };
      }
    }

    // 1. Fetch live activities from TVS APIs strictly for this auction
    const liveActivities = await provider.getDealerActivities(externalDealerId, targetAuctionId, token);

    // 2. Record each transaction in the points engine
    for (const act of liveActivities) {
      // Validate activity date against campaign window
      if (!isWithinCampaign(act.timestamp, campaign)) continue;

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

      if (act.activityType !== 'MATCH_PARTICIPATION' && provesLiveParticipation(act.activityType, act.metadata)) {
        const participation = await ensureMatchParticipation({
          dealerId,
          campaignId,
          matchId,
          timestamp: act.timestamp,
          sourceTransactionId: act.transactionId,
        });
        if (participation.success && !participation.duplicate) {
          newActivitiesCount++;
          newPointsAwarded += participation.points;
        }
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
  auctionId: string = '2003',
  campaignId: number,
  token?: string
): Promise<{ processed: number; pointsAwarded: number; totalActivitiesFound: number; auctionId?: string }> {
  const provider = getTVSProvider();
  let processed = 0;
  let pointsAwarded = 0;

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { startDate: true, endDate: true },
    });
    const match = await prisma.matchDay.findFirst({
      where: {
        campaignId,
        OR: [
          { auctionId },
          { id: !isNaN(Number(auctionId)) ? Number(auctionId) : undefined },
        ],
      },
    }) || await prisma.matchDay.findFirst({
      where: { campaignId, status: 'LIVE' },
    }) || await prisma.matchDay.findFirst({
      where: { campaignId, status: 'UPCOMING' },
      orderBy: { date: 'asc' },
    });

    if (!campaign || !match) {
      return { processed: 0, pointsAwarded: 0, totalActivitiesFound: 0, auctionId };
    }

    let targetAuctionId: string = auctionId || match.auctionId || '2003';
    // Date-based references are placeholders until an administrator maps the real TVS auction ID
    // or until the system automatically discovers the published TVS auction.
    if (/^TVSC-\d{4}-\d{2}-\d{2}$/.test(targetAuctionId)) {
      if (provider.discoverAuction) {
        const discovered = await provider.discoverAuction(match.date, token);
        if (discovered?.id) {
          targetAuctionId = discovered.id;
          await prisma.matchDay.update({
            where: { id: match.id },
            data: {
              auctionId: targetAuctionId,
              ...(discovered.stage === 'live' && match.status === 'UPCOMING' ? { status: 'LIVE' } : {}),
            },
          });
          await prisma.auditLog.create({
            data: {
              adminUser: 'system',
              action: 'AUCTION_ID_AUTO_DISCOVERED',
              targetType: 'MATCH_DAY',
              targetId: String(match.id),
              details: JSON.stringify(discovered),
              reason: `Automatically resolved TVS Auction #${targetAuctionId} (${discovered.title}) replacing placeholder ${auctionId}`,
            },
          }).catch(() => {});
        } else {
          return { processed: 0, pointsAwarded: 0, totalActivitiesFound: 0 };
        }
      } else {
        return { processed: 0, pointsAwarded: 0, totalActivitiesFound: 0 };
      }
    }

    const fetchedActivities = await provider.getAuctionActivities(targetAuctionId, token);
    const activities = fetchedActivities.filter(act => isWithinCampaign(act.timestamp, campaign));

    // Map dealers by externalDealerId (supporting both raw ID and USR- prefixed ID)
    const externalIds = [...new Set(activities.map(a => a.dealerId))];
    const searchIds: string[] = [];
    for (const id of externalIds) {
      searchIds.push(id);
      if (!id.startsWith('USR-')) searchIds.push(`USR-${id}`);
      else searchIds.push(id.replace('USR-', ''));
    }

    const sellerNames = activities
      .filter(a => a.activityType === 'SELL' || a.activityType === 'SELL_LISTING')
      .map(a => {
        const meta = (a.metadata || {}) as Record<string, unknown>;
        const name = meta.sellerName || meta.customerName;
        return typeof name === 'string' ? name : undefined;
      })
      .filter((n): n is string => Boolean(n));

    const dealers = await prisma.dealer.findMany({
      where: {
        OR: [
          { externalDealerId: { in: searchIds } },
          ...(sellerNames.length > 0 ? [{ displayName: { in: sellerNames } }] : []),
        ],
      },
    });
    const dealerMap = new Map<string, number>();
    for (const d of dealers) {
      dealerMap.set(d.externalDealerId, d.id);
      dealerMap.set(d.displayName, d.id);
      if (d.externalDealerId.startsWith('USR-')) {
        dealerMap.set(d.externalDealerId.replace('USR-', ''), d.id);
      } else {
        dealerMap.set(`USR-${d.externalDealerId}`, d.id);
      }
    }

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
      const meta = (act.metadata || {}) as Record<string, unknown>;
      const rawSellerName = meta.sellerName || meta.customerName;
      const sName = typeof rawSellerName === 'string' ? rawSellerName : undefined;
      let dealerId = dealerMap.get(act.dealerId) || (sName ? dealerMap.get(sName) : undefined);

      // If dealer is not in local DB (e.g. newly registered on TVS today), auto-provision them
      if (!dealerId) {
        try {
          const profile = await provider.getDealerProfile(act.dealerId, token);
          const metaName = meta.sellerName || meta.customerName || meta.companyName || meta.dealerName;
          const displayName: string = (profile?.dealerName && !profile.dealerName.startsWith('Dealer '))
            ? profile.dealerName
            : (metaName ? String(metaName) : (profile?.dealerName || `Dealer ${act.dealerId}`));
          const maskedName: string = displayName.trim().charAt(0).toUpperCase() + '*****';
          const newDealer = await prisma.dealer.create({
            data: {
              externalDealerId: act.dealerId,
              displayName,
              maskedName,
              city: profile?.city || (meta.sellerCity ? String(meta.sellerCity) : (meta.location ? String(meta.location) : 'Tamil Nadu')),
              phone: profile?.phone || (meta.sellerPhone ? String(meta.sellerPhone) : null),
              status: 'ACTIVE',
            },
          });
          dealerId = newDealer.id;
          dealerMap.set(act.dealerId, dealerId);
          dealerMap.set(displayName, dealerId);
          await prisma.dealerScore.upsert({
            where: { dealerId_campaignId: { dealerId, campaignId } },
            update: {},
            create: { dealerId, campaignId, totalPoints: 0, rank: 9999 },
          });
        } catch {
          const existing = await prisma.dealer.findFirst({
            where: {
              OR: [
                { externalDealerId: act.dealerId },
                ...(sName ? [{ displayName: sName }] : []),
              ],
            },
          });
          if (existing) {
            dealerId = existing.id;
            dealerMap.set(act.dealerId, dealerId);
            dealerMap.set(existing.displayName, dealerId);
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

      if (act.activityType !== 'MATCH_PARTICIPATION' && provesLiveParticipation(act.activityType, act.metadata)) {
        const participation = await ensureMatchParticipation({
          dealerId,
          campaignId,
          matchId: match.id,
          timestamp: act.timestamp,
          sourceTransactionId: act.transactionId,
        });
        if (participation.success && !participation.duplicate) {
          processed++;
          pointsAwarded += participation.points;
        }
      }
    }

    if (pointsAwarded > 0) {
      await recalculateRankings(campaignId);
    }

    return { processed, pointsAwarded, totalActivitiesFound: fetchedActivities.length, auctionId: targetAuctionId };
  } catch (error) {
    console.error(`Error syncing auction ${auctionId}:`, error);
    return { processed, pointsAwarded, totalActivitiesFound: 0, auctionId };
  }
}

/**
 * Synchronize the current live auction (e.g. tomorrow's 2 PM auction #1991)
 */
export async function syncLiveAuction(
  auctionId?: string,
  token?: string
): Promise<{ success: boolean; processed: number; pointsAwarded: number; totalActivitiesFound?: number; auctionId: string }> {
  const campaign = await getCurrentSuperCupCampaignWithMatches();

  if (!campaign) {
    return { success: false, processed: 0, pointsAwarded: 0, totalActivitiesFound: 0, auctionId: auctionId || '2003' };
  }

  const liveMatch = campaign.matchDays.find(m => m.status === 'LIVE') ||
                    campaign.matchDays.find(m => m.status === 'UPCOMING') ||
                    campaign.matchDays[0];
  const targetAuctionId = auctionId || liveMatch?.auctionId || '2003';

  const result = await syncAuctionActivities(targetAuctionId, campaign.id, token);

  return {
    success: true,
    processed: result.processed,
    pointsAwarded: result.pointsAwarded,
    totalActivitiesFound: result.totalActivitiesFound,
    auctionId: (result as any).auctionId || targetAuctionId,
  };
}

