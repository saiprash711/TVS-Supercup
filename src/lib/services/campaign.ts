import { prisma } from '@/lib/db';

/**
 * Select the campaign that should be visible right now.
 *
 * Multiple ACTIVE campaigns are intentional: the pre-launch test campaign is
 * current until 14 October, and the real campaign becomes current on 15
 * October. Selecting by date keeps their scores and leaderboards isolated.
 */
export async function getCurrentSuperCupCampaign(now = new Date()) {
  const commonWhere = { type: 'SUPER_CUP', status: 'ACTIVE' } as const;

  const current = await prisma.campaign.findFirst({
    where: {
      ...commonWhere,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { startDate: 'desc' },
  });
  if (current) return current;

  const upcoming = await prisma.campaign.findFirst({
    where: { ...commonWhere, startDate: { gt: now } },
    orderBy: { startDate: 'asc' },
  });
  if (upcoming) return upcoming;

  return prisma.campaign.findFirst({
    where: commonWhere,
    orderBy: { endDate: 'desc' },
  });
}

export async function getCurrentSuperCupCampaignWithMatches(now = new Date()) {
  const campaign = await getCurrentSuperCupCampaign(now);
  if (!campaign) return null;

  return prisma.campaign.findUnique({
    where: { id: campaign.id },
    include: { matchDays: { orderBy: { matchNumber: 'asc' } } },
  });
}
