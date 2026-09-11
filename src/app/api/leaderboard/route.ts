/**
 * GET /api/leaderboard
 * 
 * Returns the masked leaderboard for the active Super Cup campaign.
 * NEVER returns full dealer names — only masked names (e.g., "R*****").
 */

import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/services/ranking-engine';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Get the active Super Cup campaign
    const campaign = await prisma.campaign.findFirst({
      where: { type: 'SUPER_CUP', status: 'ACTIVE' },
      orderBy: { startDate: 'desc' },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'No active Super Cup campaign' },
        { status: 404 }
      );
    }

    const leaderboard = await getLeaderboard(campaign.id);

    return NextResponse.json({
      campaign: {
        name: campaign.name,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
      },
      leaderboard,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Failed to load leaderboard' },
      { status: 500 }
    );
  }
}
