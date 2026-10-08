import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { recalculateRankings } from '../src/lib/services/ranking-engine';

const prisma = new PrismaClient();

interface CustomerProfile {
  id: number;
  code: string;
  companyName: string;
  customerType?: string;
  category?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  email?: string;
}

async function main() {
  console.log('🚀 Starting Supercup Conversion & Activity Remediation...\n');

  // 1. Load customer mappings
  const customerMappingPath = path.join(__dirname, '../src/lib/data/tvs-customer-mapping.json');
  const customerMapping: Record<string, CustomerProfile> = JSON.parse(fs.readFileSync(customerMappingPath, 'utf8'));

  const userMappingPath = path.join(__dirname, '../src/lib/data/tvs-user-mapping.json');
  let userMapping: Record<string, string> = {};
  if (fs.existsSync(userMappingPath)) {
    userMapping = JSON.parse(fs.readFileSync(userMappingPath, 'utf8'));
  }

  // 2. Load existing dealers
  let allDealers = await prisma.dealer.findMany();
  const dealerMap = new Map<string, number>();

  function registerDealer(d: { id: number; externalDealerId: string; displayName?: string | null }) {
    dealerMap.set(d.externalDealerId, d.id);
    dealerMap.set(String(d.id), d.id);
    if (d.displayName) dealerMap.set(d.displayName, d.id);
    if (d.externalDealerId.startsWith('USR-')) {
      dealerMap.set(d.externalDealerId.replace('USR-', ''), d.id);
    } else {
      dealerMap.set(`USR-${d.externalDealerId}`, d.id);
    }
  }

  for (const d of allDealers) {
    registerDealer(d);
  }

  // Helper to ensure a dealer exists
  async function ensureDealer(rawId: string | number): Promise<number | null> {
    const strId = String(rawId).trim();
    if (!strId) return null;

    if (dealerMap.has(strId)) return dealerMap.get(strId)!;

    // Check user mapping
    const mappedKey = userMapping[strId];
    if (mappedKey && dealerMap.has(mappedKey)) return dealerMap.get(mappedKey)!;

    // Check customer mapping
    const cust = customerMapping[strId] || (mappedKey ? customerMapping[mappedKey] : null);
    const companyName = cust?.companyName || (cust?.firstName ? `${cust.firstName} ${cust.lastName || ''}`.trim() : null);

    if (companyName && dealerMap.has(companyName)) {
      return dealerMap.get(companyName)!;
    }

    // Auto-create from customer mapping if available
    const extId = strId;
    const displayName = companyName || `Dealer ${strId}`;
    const maskedName = displayName.trim().charAt(0).toUpperCase() + '*****';

    try {
      const created = await prisma.dealer.create({
        data: {
          externalDealerId: extId,
          displayName,
          maskedName,
          city: cust?.city || 'Tamil Nadu',
          phone: cust?.phone || null,
          category: cust?.category || 'Used Car Dealer',
          status: 'ACTIVE',
        },
      });
      console.log(`  ➕ Provisioned missing buyer dealership: "${displayName}" (External ID: ${extId})`);
      registerDealer(created);
      return created.id;
    } catch {
      const existing = await prisma.dealer.findFirst({
        where: {
          OR: [
            { externalDealerId: extId },
            ...(companyName ? [{ displayName: companyName }] : []),
          ],
        },
      });
      if (existing) {
        registerDealer(existing);
        return existing.id;
      }
      return null;
    }
  }

  // 3. Inspect EXCHANGE ROTN before remediation
  const exchangeRotn = await prisma.dealer.findFirst({
    where: { displayName: 'EXCHANGE ROTN' },
  });
  if (exchangeRotn) {
    const preCounts = await prisma.dealerActivity.groupBy({
      by: ['activityType'],
      where: { dealerId: exchangeRotn.id },
      _count: true,
    });
    console.log('📊 Pre-Remediation Activities for EXCHANGE ROTN:');
    preCounts.forEach(c => console.log(`   - ${c.activityType}: ${c._count}`));
    console.log();
  }

  // 4. Remediate BUY activities
  const buyActivities = await prisma.dealerActivity.findMany({
    where: { activityType: 'BUY' },
  });

  console.log(`Found ${buyActivities.length} total BUY activities to check.`);

  let buyReassigned = 0;
  let buyDuplicatesDeleted = 0;
  let buyAlreadyCorrect = 0;
  let buyCouldNotResolve = 0;

  for (const act of buyActivities) {
    let meta: Record<string, unknown> = {};
    try {
      meta = act.metadata ? (typeof act.metadata === 'string' ? JSON.parse(act.metadata) : act.metadata) : {};
    } catch {
      meta = {};
    }

    const winnerId = meta.winnerId || meta.buyerWinnerId || meta.buyerDealerId;
    if (!winnerId) {
      buyCouldNotResolve++;
      continue;
    }

    const correctDealerId = await ensureDealer(String(winnerId));
    if (!correctDealerId) {
      console.warn(`  ⚠️ Could not resolve dealer for winnerId: ${winnerId} (Txn: ${act.externalTransactionId})`);
      buyCouldNotResolve++;
      continue;
    }

    if (act.dealerId === correctDealerId) {
      buyAlreadyCorrect++;
      continue;
    }

    // Check if correct buyer already has this exact activity recorded
    const existing = await prisma.dealerActivity.findFirst({
      where: {
        dealerId: correctDealerId,
        campaignId: act.campaignId,
        activityType: 'BUY',
        externalTransactionId: act.externalTransactionId,
      },
    });

    if (existing) {
      // Correct buyer already has it; delete the bogus seller record
      await prisma.dealerActivity.delete({
        where: { id: act.id },
      });
      buyDuplicatesDeleted++;
    } else {
      // Reassign to rightful buyer
      await prisma.dealerActivity.update({
        where: { id: act.id },
        data: { dealerId: correctDealerId },
      });
      buyReassigned++;
    }
  }

  console.log(`\n✅ BUY Activities Remediation Results:`);
  console.log(`   - Already correct: ${buyAlreadyCorrect}`);
  console.log(`   - Reassigned to true winning buyers: ${buyReassigned}`);
  console.log(`   - Bogus seller duplicates removed: ${buyDuplicatesDeleted}`);
  console.log(`   - Could not resolve: ${buyCouldNotResolve}\n`);

  // 5. Remediate Pre-Bids (BID_PLACED) that were assigned to sellers
  const prebids = await prisma.dealerActivity.findMany({
    where: {
      activityType: 'BID_PLACED',
      externalTransactionId: { startsWith: 'PREBID-' },
    },
  });

  let prebidsFixed = 0;
  let prebidsDeleted = 0;

  for (const bid of prebids) {
    // Format: PREBID-{auctionId}-{vehicleId}-{bidderId}-{bidAmount}
    const parts = (bid.externalTransactionId || '').split('-');
    if (parts.length >= 4) {
      const bidderExtId = parts[parts.length - 2];
      const correctDealerId = await ensureDealer(bidderExtId);
      if (correctDealerId && bid.dealerId !== correctDealerId) {
        const existing = await prisma.dealerActivity.findFirst({
          where: {
            dealerId: correctDealerId,
            campaignId: bid.campaignId,
            activityType: 'BID_PLACED',
            externalTransactionId: bid.externalTransactionId,
          },
        });
        if (existing) {
          await prisma.dealerActivity.delete({ where: { id: bid.id } });
          prebidsDeleted++;
        } else {
          await prisma.dealerActivity.update({
            where: { id: bid.id },
            data: { dealerId: correctDealerId },
          });
          prebidsFixed++;
        }
      }
    }
  }

  console.log(`✅ Pre-bid Remediation Results:`);
  console.log(`   - Fixed pre-bids: ${prebidsFixed}`);
  console.log(`   - Duplicate pre-bids deleted: ${prebidsDeleted}\n`);

  // 6. Clean up inferred match participation records linked to reassigned/deleted transactions
  const inferredParticipations = await prisma.dealerActivity.findMany({
    where: {
      activityType: 'MATCH_PARTICIPATION',
      externalTransactionId: { startsWith: 'INFERRED-ATTEND-' },
    },
  });

  let inferredCleaned = 0;
  for (const part of inferredParticipations) {
    let meta: Record<string, unknown> = {};
    try {
      meta = part.metadata ? (typeof part.metadata === 'string' ? JSON.parse(part.metadata) : part.metadata) : {};
    } catch {
      meta = {};
    }
    const srcTxn = meta.sourceTransactionId as string;
    if (srcTxn && (srcTxn.startsWith('BUY-') || srcTxn.startsWith('PREBID-'))) {
      // Check if this dealer actually has any valid activity with this txn
      const validSrc = await prisma.dealerActivity.findFirst({
        where: {
          dealerId: part.dealerId,
          externalTransactionId: srcTxn,
        },
      });
      if (!validSrc) {
        // Delete orphaned inferred participation
        await prisma.dealerActivity.delete({ where: { id: part.id } });
        inferredCleaned++;
      }
    }
  }
  console.log(`✅ Cleaned up ${inferredCleaned} invalid inferred participation records.\n`);

  // 7. Recalculate rankings for all campaigns
  const campaigns = await prisma.campaign.findMany();
  for (const c of campaigns) {
    console.log(`🔄 Recalculating rankings and score tallies for campaign ${c.id}: ${c.name}...`);
    await recalculateRankings(c.id);
  }

  // 8. Post-Remediation Verification for EXCHANGE ROTN
  if (exchangeRotn) {
    const postCounts = await prisma.dealerActivity.groupBy({
      by: ['activityType'],
      where: { dealerId: exchangeRotn.id },
      _count: true,
    });
    console.log('\n📊 Post-Remediation Activities for EXCHANGE ROTN:');
    postCounts.forEach(c => console.log(`   - ${c.activityType}: ${c._count}`));
    const finalScore = await prisma.dealerScore.findFirst({
      where: { dealerId: exchangeRotn.id },
    });
    console.log(`   - Total Points: ${finalScore?.totalPoints ?? 0} (Rank: #${finalScore?.rank ?? '-'})`);
  }

  console.log('\n🎉 Conversion remediation complete!\n');
}

main()
  .catch(err => {
    console.error('❌ Remediation error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
