/**
 * GET /api/me/dashboard
 * 
 * Returns the authenticated dealer's complete dashboard data:
 * - Rank & total points
 * - Points to next rank / points ahead of next
 * - Activity breakdown
 * - Position comparison (above & below)
 * - Match participation tracker
 */

import { NextResponse } from 'next/server';
import { requireDealer } from '@/lib/auth';
import { getPositionContext } from '@/lib/services/ranking-engine';
import { getActivityBreakdown } from '@/lib/services/points-engine';
import { syncDealerActivities } from '@/lib/services/tvs-sync';
import { prisma } from '@/lib/db';
import { getCurrentSuperCupCampaign } from '@/lib/services/campaign';

export async function GET() {
  try {
    const auth = await requireDealer();
    if (!auth.authorized || !auth.dealer) {
      return NextResponse.json({ error: auth.error || 'Not authenticated' }, { status: auth.status || 401 });
    }
    const dealer = auth.dealer;

    // Get active campaign
    const campaign = await getCurrentSuperCupCampaign();

    if (!campaign) {
      return NextResponse.json({ error: 'No active campaign' }, { status: 404 });
    }

    // Sync live TVS Certified activities for this dealer
    await syncDealerActivities(dealer.dealerId, dealer.externalDealerId, campaign.id, dealer.token);

    // Get position context (rank, above, below)
    const position = await getPositionContext(dealer.dealerId, campaign.id);

    // Get activity breakdown
    const breakdown = await getActivityBreakdown(dealer.dealerId, campaign.id);

    // Get match day info
    const matchDays = await prisma.matchDay.findMany({
      where: { campaignId: campaign.id },
      orderBy: { matchNumber: 'asc' },
    });

    // A verified live bid or completed transaction proves room participation
    // even when the upstream attendance endpoint omitted the dealer.
    const participations = await prisma.dealerActivity.findMany({
      where: {
        dealerId: dealer.dealerId,
        campaignId: campaign.id,
        timestamp: { gte: campaign.startDate, lte: campaign.endDate },
        activityType: { in: ['MATCH_PARTICIPATION', 'BID_PLACED', 'BUY', 'SELL'] },
      },
      select: { matchId: true, activityType: true, metadata: true },
    });

    const participatedMatchIds = new Set(
      participations
        .filter((activity) => {
          if (activity.activityType !== 'BID_PLACED') return true;
          try {
            const metadata = activity.metadata ? JSON.parse(activity.metadata) : {};
            return metadata.isPreBid !== true;
          } catch {
            return false;
          }
        })
        .map(activity => activity.matchId)
        .filter((matchId): matchId is number => matchId !== null)
    );

    const matchTracker = matchDays.map(m => ({
      matchNumber: m.matchNumber,
      auctionId: m.auctionId || String(m.id),
      date: m.date,
      status: m.status,
      participated: participatedMatchIds.has(m.id),
    }));

    return NextResponse.json({
      dealer: {
        displayName: dealer.displayName,
        maskedName: dealer.maskedName,
        city: dealer.city,
      },
      position,
      breakdown: {
        // SELLING
        sellingListing: { count: breakdown.sellListingCount, points: breakdown.sellListingPoints, perUnit: breakdown.rules['SELL_LISTING'] ?? 5 },
        sellingConversion: { count: breakdown.sellConversionCount, points: breakdown.sellConversionPoints, perUnit: breakdown.rules['SELL'] ?? 0 },
        sellingCommission: { count: breakdown.sellCommissionCount, points: breakdown.sellCommissionPoints, perUnit: breakdown.rules['SELL_COMMISSION'] ?? 5 },
        // BUYING
        buyingParticipation: { count: breakdown.buyParticipationCount, points: breakdown.buyParticipationPoints, perUnit: breakdown.rules['MATCH_PARTICIPATION'] ?? 1 },
        buyingBids: { count: breakdown.buyBidCount, points: breakdown.buyBidPoints, perUnit: breakdown.rules['BID_PLACED'] ?? 1, totalBids: breakdown.bidCount },
        buyingConversion: { count: breakdown.buyConversionCount, points: breakdown.buyConversionPoints, perUnit: breakdown.rules['BUY'] ?? 0 },
        // Backwards Compatibility Aliases
        buyTransactions: { count: breakdown.buyCount, points: breakdown.buyPoints, perUnit: breakdown.rules['BUY'] ?? 0 },
        sellTransactions: { count: breakdown.sellCount, points: breakdown.sellPoints, perUnit: breakdown.rules['SELL'] ?? 0 },
        matchParticipation: { count: breakdown.matchParticipationCount, points: breakdown.matchParticipationPoints, perUnit: breakdown.rules['MATCH_PARTICIPATION'] || 1 },
        bidsPlaced: { count: breakdown.buyBidCount, points: breakdown.bidPoints, perUnit: breakdown.rules['BID_PLACED'] || 1 },
        vehicleInspected: { count: breakdown.inspectedCount, points: breakdown.inspectedPoints, perUnit: breakdown.rules['VEHICLE_INSPECTED'] || 0 },
        watchlistAdd: { count: breakdown.watchlistCount, points: breakdown.watchlistPoints, perUnit: breakdown.rules['WATCHLIST_ADD'] || 0 },
        allMatchesBonus: { points: breakdown.allMatchesBonus, count: breakdown.allMatchesBonus > 0 ? 1 : 0 },
        buyerPoints: (breakdown.buyParticipationPoints + breakdown.buyBidPoints + breakdown.buyConversionPoints + breakdown.allMatchesBonus),
        sellerPoints: (breakdown.sellListingPoints + breakdown.sellConversionPoints + breakdown.sellCommissionPoints),
        totalPoints: breakdown.totalPoints,
      },
      recentActivities: breakdown.activities.slice(0, 25).map(a => {
        let meta = {};
        try {
          if (a.metadata) meta = typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata;
        } catch {
          meta = {};
        }
        return {
          id: a.id,
          activityType: a.activityType,
          points: a.points,
          metadata: meta,
          externalTransactionId: a.externalTransactionId,
          timestamp: a.timestamp,
        };
      }),
      matchTracker,
      campaign: {
        name: campaign.name,
        slug: campaign.slug,
        isTestMode: campaign.slug === 'supercup-prelaunch-test-2026',
        startDate: campaign.startDate,
        endDate: campaign.endDate,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
