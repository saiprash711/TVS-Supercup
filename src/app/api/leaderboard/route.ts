/**
 * GET /api/leaderboard
 * 
 * Returns the leaderboard for the active Super Cup campaign.
 * By default, public users see masked names (e.g., "R*****").
 * When requested by authenticated admins (or ?unmask=true with admin session), returns unmasked names.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/services/ranking-engine';
import { isAdmin } from '@/lib/auth';
import { getCurrentSuperCupCampaign } from '@/lib/services/campaign';

export async function GET(request: NextRequest) {
  try {
    // Get the active Super Cup campaign
    const campaign = await getCurrentSuperCupCampaign();

    if (!campaign) {
      return NextResponse.json(
        { error: 'No active Super Cup campaign' },
        { status: 404 }
      );
    }

    const admin = await isAdmin();
    const { searchParams } = new URL(request.url);
    // Only authenticated admins are allowed to unmask dealer enterprise names
    const shouldUnmask = admin && searchParams.get('unmask') !== 'false';

    const leaderboard = await getLeaderboard(campaign.id, undefined, shouldUnmask);

    return NextResponse.json({
      campaign: {
        name: campaign.name,
        slug: campaign.slug,
        isTestMode: campaign.slug === 'supercup-prelaunch-test-2026',
        startDate: campaign.startDate,
        endDate: campaign.endDate,
      },
      leaderboard,
      isAdmin: admin,
      unmasked: shouldUnmask,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Failed to load leaderboard' },
      { status: 500 }
    );
  }
}
