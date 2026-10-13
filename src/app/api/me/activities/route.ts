/**
 * GET /api/me/activities
 * 
 * Returns the authenticated dealer's activity history.
 */

import { NextResponse } from 'next/server';
import { requireDealer } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getCurrentSuperCupCampaign } from '@/lib/services/campaign';

export async function GET() {
  try {
    const auth = await requireDealer();
    if (!auth.authorized || !auth.dealer) {
      return NextResponse.json({ error: auth.error || 'Not authenticated' }, { status: auth.status || 401 });
    }
    const dealer = auth.dealer;

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
