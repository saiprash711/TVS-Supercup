/**
 * GET /api/leaderboard
 * 
 * Returns the segmented leaderboards for the active Super Cup campaign:
 * - buyers: Dealers competing on buyer points (bids, wins/conversions, participation)
 * - sellers: Dealers competing on seller points (listings, conversions)
 * - overall: Combined national championship standings
 * 
 * Visibility & Masking Rules:
 * - Admin Login: Fully VISIBLE and UNMASKED (legal entity names, external IDs, customer IDs).
 * - Dealer Specific Login: Competitor dealer names are MASKED (e.g. "R*****"), while the
 *   authenticated dealer's own dealership is identified and highlighted.
 * - Public: All dealer names are MASKED.
 */

import { NextResponse } from 'next/server';
import { getSegmentedLeaderboard, getPositionContext } from '@/lib/services/ranking-engine';
import { getCurrentSuperCupCampaign } from '@/lib/services/campaign';
import { isAdmin, getCurrentDealer, isEmployeeDealer } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || searchParams.get('type') || undefined;

    // Get the active Super Cup campaign
    const campaign = await getCurrentSuperCupCampaign();

    if (!campaign) {
      return NextResponse.json(
        { error: 'No active Super Cup campaign' },
        { status: 404 }
      );
    }

    const admin = await isAdmin();
    const currentDealer = await getCurrentDealer();
    const isEmployee = isEmployeeDealer(currentDealer);

    // Leaderboard data is restricted to authenticated users only
    if (!admin && !currentDealer) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // In admin and internal employee login: full unmasked dealer names are visible!
    // For competitor dealer specific login: competitor dealer names are masked.
    const isPrivileged = admin || isEmployee;
    const shouldUnmask = isPrivileged && searchParams.get('unmask') !== 'false';

    const segmented = await getSegmentedLeaderboard(
      campaign.id,
      undefined,
      shouldUnmask,
      isEmployee ? undefined : currentDealer?.dealerId
    );

    let activeLeaderboard = segmented.buyers;
    if (category === 'seller' || category === 'sellers') {
      activeLeaderboard = segmented.sellers;
    } else if (category === 'buyer' || category === 'buyers') {
      activeLeaderboard = segmented.buyers;
    }

    // Get authenticated dealer's position context (only for real dealers, not employees)
    const dealerPosition = (currentDealer && !isEmployee)
      ? await getPositionContext(currentDealer.dealerId, campaign.id)
      : null;

    return NextResponse.json({
      campaign: {
        name: campaign.name,
        slug: campaign.slug,
        isTestMode: campaign.slug === 'supercup-prelaunch-test-2026',
        startDate: campaign.startDate,
        endDate: campaign.endDate,
      },
      leaderboard: activeLeaderboard,
      buyers: segmented.buyers,
      sellers: segmented.sellers,
      overall: segmented.overall,
      counts: segmented.counts,
      isAdmin: admin,
      isEmployee: Boolean(isEmployee),
      authenticated: Boolean(currentDealer || admin),
      unmasked: shouldUnmask,
      currentDealerId: isEmployee ? null : currentDealer?.dealerId,
      currentDealer: currentDealer ? {
        dealerId: currentDealer.dealerId,
        displayName: currentDealer.displayName,
        maskedName: currentDealer.maskedName,
        city: currentDealer.city,
        externalDealerId: currentDealer.externalDealerId,
        isEmployee: Boolean(isEmployee),
      } : null,
      dealerPosition,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Failed to load leaderboard' },
      { status: 500 }
    );
  }
}
