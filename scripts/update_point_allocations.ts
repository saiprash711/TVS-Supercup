import { PrismaClient } from '@prisma/client';
import { recalculateRankings } from '../src/lib/services/ranking-engine';

const prisma = new PrismaClient();

const ACTIVE_RULES = [
  { activityType: 'SELL_LISTING', points: 5, description: 'Selling: Points per vehicle listing' },
  { activityType: 'SELL', points: 10, description: 'Selling: Points per vehicle conversion/sold' },
  { activityType: 'SELL_COMMISSION', points: 5, description: 'Selling: Commission points allocation' },
  { activityType: 'MATCH_PARTICIPATION', points: 1, description: 'Buying: Match day participation points' },
  { activityType: 'BID_PLACED', points: 1, description: 'Buying: Points per live/pre auction bid placed' },
  { activityType: 'BUY', points: 10, description: 'Buying: Points per vehicle conversion/purchased' },
];

const DEACTIVATED_RULES = ['WATCHLIST_ADD', 'VEHICLE_INSPECTED', 'ALL_MATCHES_BONUS'];

async function main() {
  console.log('🔄 Updating point allocation rules in database...');

  const campaigns = await prisma.campaign.findMany();
  console.log(`Found ${campaigns.length} campaigns:`, campaigns.map(c => `${c.id}: ${c.slug}`));

  for (const campaign of campaigns) {
    console.log(`\n--- Campaign ${campaign.id}: ${campaign.name} (${campaign.slug}) ---`);

    // 1. Upsert active rules
    for (const rule of ACTIVE_RULES) {
      await prisma.pointRule.upsert({
        where: {
          campaignId_activityType: {
            campaignId: campaign.id,
            activityType: rule.activityType,
          },
        },
        update: {
          points: rule.points,
          description: rule.description,
          active: true,
        },
        create: {
          campaignId: campaign.id,
          activityType: rule.activityType,
          points: rule.points,
          description: rule.description,
          active: true,
        },
      });
      console.log(`  ✓ Rule ${rule.activityType}: ${rule.points} pts (ACTIVE)`);
    }

    // 2. Deactivate obsolete rules
    for (const obsolete of DEACTIVATED_RULES) {
      await prisma.pointRule.updateMany({
        where: {
          campaignId: campaign.id,
          activityType: obsolete,
        },
        data: {
          points: 0,
          active: false,
        },
      });
      console.log(`  ✗ Rule ${obsolete}: deactivated (0 pts)`);
    }

    // 3. Update existing activities in this campaign to align with new point scale
    // MATCH_PARTICIPATION: 15 -> 1
    const pUpdate = await prisma.dealerActivity.updateMany({
      where: {
        campaignId: campaign.id,
        activityType: 'MATCH_PARTICIPATION',
        points: { gt: 1 },
      },
      data: { points: 1 },
    });
    if (pUpdate.count > 0) {
      console.log(`  Updated ${pUpdate.count} MATCH_PARTICIPATION activities to 1 pt`);
    }

    // BID_PLACED: 2 -> 1
    const bUpdate = await prisma.dealerActivity.updateMany({
      where: {
        campaignId: campaign.id,
        activityType: 'BID_PLACED',
        points: { gt: 1 },
      },
      data: { points: 1 },
    });
    if (bUpdate.count > 0) {
      console.log(`  Updated ${bUpdate.count} BID_PLACED activities to 1 pt`);
    }

    // Deactivated types -> 0 pts
    for (const obsolete of DEACTIVATED_RULES) {
      const oUpdate = await prisma.dealerActivity.updateMany({
        where: {
          campaignId: campaign.id,
          activityType: obsolete,
          points: { gt: 0 },
        },
        data: { points: 0 },
      });
      if (oUpdate.count > 0) {
        console.log(`  Zeroed out ${oUpdate.count} ${obsolete} activities`);
      }
    }

    // 4. Recalculate rankings for the campaign
    const rankingSummary = await recalculateRankings(campaign.id);
    console.log(`  Recalculated rankings for ${rankingSummary.totalDealers} dealers.`);
  }

  console.log('\n✅ Point allocation migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
