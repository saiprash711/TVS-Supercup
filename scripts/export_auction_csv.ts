import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { getCurrentSuperCupCampaign } from '../src/lib/services/campaign';

const prisma = new PrismaClient();

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatIST(dateInput: Date | string | number) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return { date: '', time: '', full: '' };
  const full = d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const date = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
  const time = d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
  return { date, time, full, iso: d.toISOString() };
}

async function main() {
  const auctionId = '1978';
  console.log(`Generating updated CSV for Auction #${auctionId}...`);

  const campaign = await getCurrentSuperCupCampaign();

  const match = await prisma.matchDay.findFirst({
    where: { auctionId },
  });

  const activities = await prisma.dealerActivity.findMany({
    where: {
      OR: [
        ...(match ? [{ matchId: match.id }] : []),
        { externalTransactionId: { contains: auctionId } },
      ],
    },
    include: {
      dealer: true,
      match: true,
      campaign: true,
    },
    orderBy: {
      timestamp: 'desc',
    },
  });

  console.log(`Found ${activities.length} activities for Auction #${auctionId}.`);

  const headers = [
    'Activity ID',
    'Date & Time (UTC)',
    'Date & Time (IST)',
    'Auction ID',
    'Match Number',
    'Transaction ID',
    'Dealer ID',
    'Company Name',
    'Dealer Phone',
    'City',
    'Activity Type',
    'Points Awarded',
    'Amount / Bid Value (INR)',
    'Vehicle ID',
    'Vehicle Name',
    'Registration Number',
    'Fuel Type',
    'Transmission',
    'Year of Mfg',
    'Speedometer',
    'Start Bid Value (INR)',
    'Winning Bid (INR)',
    'Bid Rank',
    'Is Leading Bid',
    'Is Pre-Bid',
    'Total Bids on Vehicle',
    'Deposit Amount (INR)',
    'Campaign Name',
  ];

  const rows = [headers.map(escapeCsv).join(',')];

  for (const a of activities) {
    let meta: any = {};
    try {
      meta = typeof a.metadata === 'string' ? JSON.parse(a.metadata) : (a.metadata || {});
    } catch {
      meta = {};
    }

    const ist = formatIST(a.timestamp);

    rows.push([
      escapeCsv(a.id),
      escapeCsv(ist.iso),
      escapeCsv(ist.full),
      escapeCsv(auctionId),
      escapeCsv(a.match?.matchNumber ? `Match ${a.match.matchNumber}` : 'Match 1'),
      escapeCsv(a.externalTransactionId || ''),
      escapeCsv(a.dealer?.externalDealerId || ''),
      escapeCsv(a.dealer?.displayName || ''),
      escapeCsv(a.dealer?.phone || ''),
      escapeCsv(a.dealer?.city || ''),
      escapeCsv(a.activityType),
      escapeCsv(a.points),
      escapeCsv(meta.bidAmount || meta.winningBid || meta.price || ''),
      escapeCsv(meta.vehicleId || ''),
      escapeCsv(meta.vehicleName || ''),
      escapeCsv(meta.regNo || ''),
      escapeCsv(meta.fuelType || ''),
      escapeCsv(meta.transmission || ''),
      escapeCsv(meta.yearOfMfg || ''),
      escapeCsv(meta.speedometer || ''),
      escapeCsv(meta.startBidValue || ''),
      escapeCsv(meta.winningBid || ''),
      escapeCsv(meta.bidRank || ''),
      escapeCsv(meta.isLeadingBid != null ? (meta.isLeadingBid ? 'YES' : 'NO') : ''),
      escapeCsv(meta.isPreBid != null ? (meta.isPreBid ? 'YES' : 'NO') : ''),
      escapeCsv(meta.totalBids || ''),
      escapeCsv(meta.depositAmount || ''),
      escapeCsv(a.campaign?.name || campaign?.name || 'Dealer Super Cup — September 2026'),
    ].join(','));
  }

  // \uFEFF UTF-8 BOM ensures Excel on Windows renders UTF-8 properly
  const csvContent = '\uFEFF' + rows.join('\n');
  const targetPath = path.resolve(__dirname, '..', '..', 'supercup-auction-activities-2026-09-10.csv');
  const fallbackPath = path.resolve(__dirname, '..', '..', 'supercup-auction-activities-2026-09-10-company-names.csv');

  try {
    fs.writeFileSync(targetPath, csvContent, 'utf-8');
    console.log(`✅ Successfully exported updated CSV with Company Names to: ${targetPath}`);
  } catch (err: any) {
    if (err.code === 'EBUSY') {
      console.warn(`⚠️ Target file ${targetPath} is currently locked (likely open in Excel).`);
      fs.writeFileSync(fallbackPath, csvContent, 'utf-8');
      console.log(`✅ Saved updated CSV with Company Names to: ${fallbackPath}`);
    } else {
      throw err;
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
