/**
 * GET /api/me/activities
 * 
 * Returns the authenticated dealer's activity history.
 */

import { NextResponse } from 'next/server';
import { getCurrentDealer } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getCurrentSuperCupCampaign } from '@/lib/services/campaign';

export async function GET() {
  try {
    const dealer = await getCurrentDealer();
    if (!dealer) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const campaign = await getCurrentSuperCupCampaign();

    if (!campaign) {
      return NextResponse.json({ error: 'No active campaign' }, { status: 404 });
    }

    const activities = await prisma.dealerActivity.findMany({
      where: { dealerId: dealer.dealerId, campaignId: campaign.id },
      include: {
        match: {
          select: { matchNumber: true, date: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json({
      activities: activities.map(a => ({
        id: a.id,
        activityType: a.activityType,
        points: a.points,
        matchNumber: a.match?.matchNumber || null,
        matchDate: a.match?.date || null,
        timestamp: a.timestamp,
        transactionId: a.externalTransactionId,
      })),
    });
  } catch (error) {
    console.error('Activities error:', error);
    return NextResponse.json({ error: 'Failed to load activities' }, { status: 500 });
  }
}
