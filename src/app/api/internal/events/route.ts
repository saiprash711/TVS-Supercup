/**
 * POST /api/internal/events
 * 
 * Internal webhook endpoint for receiving TVS auction activity events.
 * This is where the real TVS system would send events when available.
 * 
 * For now, supports manual event submission for testing.
 * 
 * GET /api/internal/events
 * 
 * Vercel Cron Job endpoint - automatically syncs live auction data from TVS API
 * Runs every 2 minutes to capture bids, buys, and participation in real-time
 */

import { NextRequest, NextResponse } from 'next/server';
import { recordActivity, type ActivityType } from '@/lib/services/points-engine';
import { recalculateRankings } from '@/lib/services/ranking-engine';
import { prisma } from '@/lib/db';
import { syncLiveAuction } from '@/lib/services/tvs-sync';
import { getCurrentSuperCupCampaign, getCurrentSuperCupCampaignWithMatches } from '@/lib/services/campaign';

// Serverless function config for longer execution time
export const maxDuration = 60; // 60 seconds max execution
export const dynamic = 'force-dynamic';

/**
 * GET handler - Vercel Cron Job
 * Triggered automatically every 2 minutes by Vercel
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a Vercel Cron request or internal request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Allow requests from Vercel Cron or with valid API key
    const internalApiKey = process.env.INTERNAL_API_KEY;
    const hasValidCronSecret = Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;
    const hasValidInternalKey = Boolean(internalApiKey) && authHeader === internalApiKey;
    if (!hasValidCronSecret && !hasValidInternalKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();
    
    // Find active campaign
    const campaign = await getCurrentSuperCupCampaignWithMatches();

    if (!campaign) {
      return NextResponse.json({ 
        error: 'No active campaign found',
        note: 'Create a SUPER_CUP campaign with ACTIVE status'
      }, { status: 404 });
    }

    // Find today's match or currently live match
    const now = new Date();
    const todayMatch = campaign.matchDays.find(match => {
      const matchDate = new Date(match.date);
      return match.status === 'LIVE' || 
             (matchDate.toDateString() === now.toDateString() && match.auctionId);
    });

    if (!todayMatch?.auctionId) {
      return NextResponse.json({
        success: true,
        message: 'No live auction today',
        campaign: campaign.name,
        nextMatch: campaign.matchDays.find(m => m.status === 'UPCOMING')?.date
      });
    }

    // Sync the live auction
    console.log(`[Cron] Syncing auction ${todayMatch.auctionId} for campaign ${campaign.name}`);
    const syncResult = await syncLiveAuction(todayMatch.auctionId);

    // Get current statistics
    const stats = await prisma.dealerActivity.groupBy({
      by: ['activityType'],
      where: { 
        campaignId: campaign.id,
        matchId: todayMatch.id
      },
      _count: true
    });

    const statsMap = Object.fromEntries(
      stats.map(s => [s.activityType, s._count])
    );

    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      campaign: campaign.name,
      match: {
        number: todayMatch.matchNumber,
        auctionId: todayMatch.auctionId,
        status: todayMatch.status
      },
      sync: {
        processed: syncResult.processed,
        pointsAwarded: syncResult.pointsAwarded,
        executionTimeMs: executionTime
      },
      stats: {
        bids: statsMap['BID_PLACED'] || 0,
        buys: statsMap['BUY'] || 0,
        participation: statsMap['MATCH_PARTICIPATION'] || 0,
        watchlist: statsMap['WATCHLIST_ADD'] || 0
      }
    });

  } catch (error: any) {
    console.error('[Cron] Sync error:', error);
    return NextResponse.json({
      error: 'Sync failed',
      message: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST handler - Manual event submission
 */
export async function POST(request: NextRequest) {
  try {
    // Simple API key check for internal endpoints
    const apiKey = request.headers.get('x-api-key');
    if (!process.env.INTERNAL_API_KEY || apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dealerId, campaignSlug, matchNumber, activityType, transactionId } = body;

    // Validate required fields
    if (!dealerId || !activityType) {
      return NextResponse.json(
        { error: 'dealerId and activityType are required' },
        { status: 400 }
      );
    }

    // Look up dealer
    const dealer = await prisma.dealer.findUnique({
      where: { externalDealerId: dealerId },
    });
    if (!dealer) {
      return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
    }

    // Get campaign
    const campaign = campaignSlug
      ? await prisma.campaign.findUnique({ where: { slug: campaignSlug } })
      : await getCurrentSuperCupCampaign();
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get match if specified
    let matchId: number | null = null;
    if (matchNumber) {
      const match = await prisma.matchDay.findUnique({
        where: { campaignId_matchNumber: { campaignId: campaign.id, matchNumber } },
      });
      if (match) matchId = match.id;
    }

    // Record activity
    const result = await recordActivity({
      dealerId: dealer.id,
      campaignId: campaign.id,
      matchId,
      activityType: activityType as ActivityType,
      externalTransactionId: transactionId || `MANUAL-${Date.now()}`,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Duplicate activity', duplicate: true },
        { status: 409 }
      );
    }

    // Recalculate rankings after new activity
    await recalculateRankings(campaign.id);

    return NextResponse.json({
      success: true,
      points: result.points,
      activityId: result.activity?.id,
    });
  } catch (error) {
    console.error('Event processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process event' },
      { status: 500 }
    );
  }
}
