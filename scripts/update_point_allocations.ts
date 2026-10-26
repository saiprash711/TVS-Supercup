import { PrismaClient } from '@prisma/client';
import { recalculateRankings } from '../src/lib/services/ranking-engine';

const prisma = new PrismaClient();

/**
 * Confirmed Point Allocation Rules from TVS Certified Dealer Super Cup Pitch Deck:
 * 
 * BUYER POINTS:
 * +1 Per event you take part in. Join every match for a +5 bonus.
 * +1 Per unique car you bid on. 100 bids on one car = 1 pt; 1 bid each on 100 cars = 100 pts.
 * +10 Per conversion, when you win and buy a car (calculated manually).
 * 
 * SELLER POINTS:
 * +1 Per event with at least 1 car listed. Listing 100 cars is still 1 pt. Join every match for a +5 bonus.
 * +1 Per car listed. List 100 cars and earn 100 pts.
 * +10 Per conversion, when your car is sold (calculated manually).
 * 
 * TIE-BREAKER:
 * If final scores are equal, the dealer with the higher GMV (transaction value) ranks higher.
 */

const ACTIVE_RULES = [
  { activityType: 'SELL_LISTING', points: 1, description: 'Selling: Points per car listed (1 pt per car)' },
  { activityType: 'SELL', points: 10, description: 'Selling: Points per conversion when your car is sold (manual calculation)' },
  { activityType: 'MATCH_PARTICIPATION', points: 1, description: 'Participation: 1 point per event taken part in / with at least 1 car listed' },
  { activityType: 'BID_PLACED', points: 1, description: 'Buying: Points per unique car bid on (1 pt per car)' },
  { activityType: 'BUY', points: 10, description: 'Buying: Points per conversion when you win and buy a car (manual calculation)' },
  { activityType: 'ALL_MATCHES_BONUS', points: 5, description: 'Bonus: +5 bonus points for participating in every match' },
];

const DEACTIVATED_RULES = [
  'SELL_COMMISSION',
  'WATCHLIST_ADD',
  'VEHICLE_INSPECTED',
];

async function main() {
  console.log('🔄 Updating point allocation rules to match confirmed TVS Dealer Super Cup Pitch Deck...');

  const campaigns = await prisma.campaign.findMany();
  console.log(`Found ${campaigns.length} campaigns:`, campaigns.map(c => `${c.id}: ${c.slug}`));

  for (const campaign of campaigns) {
    console.log(`\n--- Campaign ${campaign.id}: ${campaign.name} (${campaign.slug}) ---`);

    // 1. Upsert active rules as per latest confirmed pitch deck
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

    // 2. Deactivate obsolete rules (commission is not in pitch deck, replaced by +10 conversion)
    for (const obsolete of DEACTIVATED_RULES) {
      await prisma.pointRule.upsert({
        where: {
          campaignId_activityType: {
            campaignId: campaign.id,
            activityType: obsolete,
          },
        },
        update: {
          points: 0,
          active: false,
        },
        create: {
          campaignId: campaign.id,
          activityType: obsolete,
          points: 0,
          description: `${obsolete} (Deactivated)`,
          active: false,
        },
      });
      console.log(`  ✗ Rule ${obsolete}: deactivated (0 pts)`);
    }

    // 3. Update existing activities in this campaign:
    // SELL_LISTING: 5 -> 1 point per car listed
    const listingUpdate = await prisma.dealerActivity.updateMany({
      where: {
        campaignId: campaign.id,
        activityType: 'SELL_LISTING',
        points: { gt: 1 },
      },
      data: { points: 1 },
    });
    if (listingUpdate.count > 0) {
      console.log(`  Updated ${listingUpdate.count} SELL_LISTING activities from 5 pts to 1 pt`);
    }

    // ALL_MATCHES_BONUS: 20 -> 5 points
    const bonusUpdate = await prisma.dealerActivity.updateMany({
      where: {
        campaignId: campaign.id,
        activityType: 'ALL_MATCHES_BONUS',
        points: { gt: 5 },
      },
      data: { points: 5 },
    });
    if (bonusUpdate.count > 0) {
      console.log(`  Updated ${bonusUpdate.count} ALL_MATCHES_BONUS activities to 5 pts`);
    }

    // MATCH_PARTICIPATION: Ensure 1 pt
    await prisma.dealerActivity.updateMany({
      where: {
        campaignId: campaign.id,
        activityType: 'MATCH_PARTICIPATION',
        points: { not: 1 },
      },
      data: { points: 1 },
    });

    // Zero out obsolete activity types
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

    // Ensure Seller Event Participation:
    // "+1 Per event with at least 1 car listed. Listing 100 cars is still 1 pt."
    const listings = await prisma.dealerActivity.findMany({
      where: { campaignId: campaign.id, activityType: 'SELL_LISTING' },
      select: { dealerId: true, matchId: true, timestamp: true },
    });
    let addedSellerAttendance = 0;
    const seenSellerMatch = new Set<string>();
    for (const l of listings) {
      if (!l.matchId) continue;
      const key = `${l.dealerId}:${l.matchId}`;
      if (seenSellerMatch.has(key)) continue;
      seenSellerMatch.add(key);

      const existingPart = await prisma.dealerActivity.findFirst({
        where: {
          campaignId: campaign.id,
          dealerId: l.dealerId,
          matchId: l.matchId,
          activityType: 'MATCH_PARTICIPATION',
        },
      });
      if (!existingPart) {
        await prisma.dealerActivity.create({
          data: {
            dealerId: l.dealerId,
            campaignId: campaign.id,
            matchId: l.matchId,
            activityType: 'MATCH_PARTICIPATION',
            externalTransactionId: `SELLER-ATTEND-${campaign.id}-${l.matchId}-${l.dealerId}`,
            points: 1,
            metadata: JSON.stringify({
              inferred: true,
              source: 'SELLER_LISTING_EVENT_PARTICIPATION',
            }),
            timestamp: l.timestamp,
          },
        });
        addedSellerAttendance++;
      }
    }
    if (addedSellerAttendance > 0) {
      console.log(`  Awarded event participation (+1 pt) to ${addedSellerAttendance} sellers with active listings.`);
    }

    // 4. Recalculate rankings for the campaign
    const rankingSummary = await recalculateRankings(campaign.id);
    console.log(`  Recalculated rankings for ${rankingSummary.totalDealers} dealers. Top score: ${rankingSummary.topScore}`);
  }

  console.log('\n✅ Point allocation migration completed successfully as per pitch deck!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
