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
import { getCurrentDealer } from '@/lib/auth';
import { getPositionContext } from '@/lib/services/ranking-engine';
import { getActivityBreakdown } from '@/lib/services/points-engine';
import { syncDealerActivities } from '@/lib/services/tvs-sync';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const dealer = await getCurrentDealer();
    if (!dealer) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get active campaign
    const campaign = await prisma.campaign.findFirst({
      where: { type: 'SUPER_CUP', status: 'ACTIVE' },
      orderBy: { startDate: 'desc' },
    });

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

    // Get which matches dealer participated in
    const participations = await prisma.dealerActivity.findMany({
      where: {
        dealerId: dealer.dealerId,
        campaignId: campaign.id,
        activityType: 'MATCH_PARTICIPATION',
      },
      select: { matchId: true },
    });

    const participatedMatchIds = new Set(participations.map(p => p.matchId));

    const matchTracker = matchDays.map(m => ({
      matchNumber: m.matchNumber,
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
        buyTransactions: { count: breakdown.buyCount, points: breakdown.buyPoints, perUnit: breakdown.rules['BUY'] || 10 },
        sellTransactions: { count: breakdown.sellCount, points: breakdown.sellPoints, perUnit: breakdown.rules['SELL'] || 10 },
        matchParticipation: { count: breakdown.matchParticipationCount, points: breakdown.matchParticipationPoints, perUnit: breakdown.rules['MATCH_PARTICIPATION'] || 15 },
        bidsPlaced: { count: breakdown.bidCount, points: breakdown.bidPoints, perUnit: breakdown.rules['BID_PLACED'] || 2 },
        vehicleInspected: { count: breakdown.inspectedCount, points: breakdown.inspectedPoints, perUnit: breakdown.rules['VEHICLE_INSPECTED'] || 1 },
        watchlistAdd: { count: breakdown.watchlistCount, points: breakdown.watchlistPoints, perUnit: breakdown.rules['WATCHLIST_ADD'] || 1 },
        allMatchesBonus: { points: breakdown.allMatchesBonus },
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
        startDate: campaign.startDate,
        endDate: campaign.endDate,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
