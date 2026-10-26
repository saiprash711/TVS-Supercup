/**
 * Reconcile and Validate Auction 2038 against official TVS Completed Auctions
 * C:\Users\TC100\Downloads\Completed Auctions (1).xlsx
 */

import XLSX from 'xlsx';
import { prisma } from '../src/lib/db';
import { recalculateRankings } from '../src/lib/services/ranking-engine';

const completedFile = 'C:\\Users\\TC100\\Downloads\\Completed Auctions (1).xlsx';

const nullSellerMap: Record<string, { id: number; name: string }> = {
  'TN69AE3286': { id: 448, name: 'POPULAR VEHICLES AND SERVICES LIMITED' },
  'TN02BQ5717': { id: 448, name: 'POPULAR VEHICLES AND SERVICES LIMITED' },
  'TN85P7391':  { id: 448, name: 'POPULAR VEHICLES AND SERVICES LIMITED' },
  'TN22CJ3173': { id: 459, name: 'Shree Thiya cars' },
  'TN74K8683':  { id: 458, name: 'PRODUCTIVITY ELEMENTS PRIVATE LIMITED' },
  'TN09BF7322': { id: 451, name: 'VISHNU CARS PRIVATE LIMITED' },
};

const nameAliases: Record<string, string> = {
  'Harsha': 'Harsha Toyota',
  'NIRMAL': 'NIRMAL CARS',
  'Epic Toyota': 'EPIC Toyota',
};

async function main() {
  console.log('Loading Completed Auctions file:', completedFile);
  const wb = XLSX.readFile(completedFile);
  const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  console.log(`Loaded ${rows.length} vehicle rows from official TVS file.`);

  const match = await prisma.matchDay.findFirst({
    where: { OR: [{ auctionId: '2038' }, { id: 88 }] },
    include: { campaign: true }
  });

  if (!match) {
    console.error('Match 88 / Auction 2038 not found in DB!');
    return;
  }

  const campaignId = match.campaignId;
  const matchId = match.id;
  const auctionId = match.auctionId || '2038';
  console.log(`Target: Campaign ${campaignId}, Match ${matchId}, Auction ${auctionId}`);

  // Load all dealers
  const allDealers = await prisma.dealer.findMany();
  const byName = new Map<string, any>();
  const byExtId = new Map<string, any>();
  for (const d of allDealers) {
    byName.set(d.displayName.trim().toLowerCase(), d);
    byExtId.set(String(d.externalDealerId), d);
  }

  // Pre-fetch existing SELL_LISTING activities for this match
  const existingListings = await prisma.dealerActivity.findMany({
    where: {
      campaignId,
      activityType: 'SELL_LISTING',
      OR: [
        { matchId },
        { externalTransactionId: { contains: auctionId } }
      ]
    }
  });

  const existingByReg = new Map<string, any>();
  for (const l of existingListings) {
    try {
      const meta = typeof l.metadata === 'string' ? JSON.parse(l.metadata) : l.metadata;
      if (meta?.regNo) existingByReg.set(meta.regNo.trim(), l);
    } catch {}
  }

  let createdCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const reg = (r['Registration Number'] || '').trim();
    let sellerName = (r['Listed By'] || '').trim();
    let extId: string | null = null;

    if (!sellerName || sellerName === 'null') {
      const resolved = nullSellerMap[reg];
      if (resolved) {
        sellerName = resolved.name;
        extId = String(resolved.id);
      }
    }

    if (nameAliases[sellerName]) {
      sellerName = nameAliases[sellerName];
    }

    let dealer = byName.get(sellerName.toLowerCase());
    if (!dealer && extId) {
      dealer = byExtId.get(extId);
    }

    if (!dealer) {
      console.warn(`[SKIP] Could not resolve dealer: "${sellerName}" for reg ${reg}`);
      errorCount++;
      continue;
    }

    const txId = `LISTING-${auctionId}-${reg}`;
    const metadata = {
      vehicleName: r['Auction Name'] || 'Auction Vehicle',
      regNo: reg,
      startBidValue: r['Start Bid Value'] || 0,
      expectedPrice: r['Reserve Price'] || 0,
      winningBid: r['Winner Bid Value'] || null,
      winnerName: r['Winner Name'] || null,
      sellerName: dealer.displayName,
      sellerDealerId: dealer.externalDealerId,
      sellerCity: dealer.city,
      sellerPhone: dealer.phone,
      speedometer: r['Speedometer'] || '',
      transmission: r['Transmission'] || '',
      fuelType: r['Fuel Type'] || '',
      lotNo: i + 1,
      source: 'TVS_CERTIFIED_OFFICIAL_COMPLETED_AUCTIONS',
    };

    const existing = existingByReg.get(reg) || await prisma.dealerActivity.findFirst({
      where: {
        campaignId,
        activityType: 'SELL_LISTING',
        OR: [
          { externalTransactionId: txId },
          { externalTransactionId: `LISTING-${auctionId}-${r['Registration Number']}` }
        ]
      }
    });

    if (existing) {
      // Update dealerId and points if needed
      await prisma.dealerActivity.update({
        where: { id: existing.id },
        data: {
          dealerId: dealer.id,
          matchId,
          points: 1,
          metadata: JSON.stringify(metadata),
          timestamp: match.date || new Date(),
        }
      });
      updatedCount++;
    } else {
      await prisma.dealerActivity.create({
        data: {
          dealerId: dealer.id,
          campaignId,
          matchId,
          activityType: 'SELL_LISTING',
          points: 1,
          externalTransactionId: txId,
          metadata: JSON.stringify(metadata),
          timestamp: match.date || new Date(),
        }
      });
      createdCount++;
    }
  }

  console.log(`\nReconciliation Summary:`);
  console.log(`- Created listings: ${createdCount}`);
  console.log(`- Updated listings: ${updatedCount}`);
  console.log(`- Errors: ${errorCount}`);
  console.log(`- Total valid listings: ${createdCount + updatedCount} / ${rows.length}`);

  // Also fix buyer winner dealership for BUY activities
  console.log('\nReconciling BUY activities and winner dealerships...');
  const buyActivities = await prisma.dealerActivity.findMany({
    where: {
      campaignId,
      activityType: 'BUY',
      OR: [
        { matchId },
        { externalTransactionId: { contains: auctionId } }
      ]
    }
  });

  const rowMap = new Map<string, any>();
  for (const r of rows) {
    rowMap.set(r['Registration Number']?.trim(), r);
  }

  let buyersReconciled = 0;
  for (const b of buyActivities) {
    let meta: any = {};
    try { meta = typeof b.metadata === 'string' ? JSON.parse(b.metadata) : b.metadata; } catch {}
    const reg = (meta.regNo || '').trim();
    const r = rowMap.get(reg);
    if (!r) continue;

    const winnerName = (r['Winner Name'] || '').trim();
    if (winnerName && winnerName !== 'null') {
      const correctDealer = byName.get(winnerName.toLowerCase());
      if (correctDealer && correctDealer.id !== b.dealerId) {
        meta.winnerName = correctDealer.displayName;
        meta.winnerDealerId = correctDealer.externalDealerId;
        await prisma.dealerActivity.update({
          where: { id: b.id },
          data: {
            dealerId: correctDealer.id,
            metadata: JSON.stringify(meta)
          }
        });
        buyersReconciled++;
      }
    }
  }
  console.log(`Reconciled ${buyersReconciled} BUY activities to correct winner dealerships.`);

  // Recalculate rankings for the campaign
  console.log('\nRecalculating tournament rankings and dealer scores...');
  await recalculateRankings(campaignId);
  console.log('Rankings recalculation completed successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
