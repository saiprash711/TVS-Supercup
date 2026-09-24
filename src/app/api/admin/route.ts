/**
 * Admin API Routes
 * 
 * GET  /api/admin/stats      — Dashboard statistics
 * GET  /api/admin/dealers     — Full dealer list
 * POST /api/admin/recalculate — Recalculate rankings
 * POST /api/admin/adjust      — Manual point adjustment
 * GET  /api/admin/audit       — Audit log
 * GET  /api/admin/export      — CSV export
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { recalculateRankings } from '@/lib/services/ranking-engine';
import { syncDealerActivities, syncLiveAuction } from '@/lib/services/tvs-sync';
import { getTVSProvider } from '@/lib/services/tvs-integration';
import { clearPointRulesCache } from '@/lib/services/points-engine';

// Serverless function config for live auction stream processing
export const maxDuration = 60; // 60 seconds max execution on Vercel
export const dynamic = 'force-dynamic';

// Middleware check
async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'stats';

  try {
    const campaign = await prisma.campaign.findFirst({
      where: { type: 'SUPER_CUP', status: 'ACTIVE' },
      orderBy: { startDate: 'desc' },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'No active campaign' }, { status: 404 });
    }

    switch (action) {
      case 'stats': {
        const totalDealers = await prisma.dealer.count();
        const activeDealers = await prisma.dealer.count({ where: { status: 'ACTIVE' } });

        const totalPointsResult = await prisma.dealerScore.aggregate({
          where: { campaignId: campaign.id },
          _sum: { totalPoints: true },
        });

        // Group by activityType to get exact counts across all activities
        const activityCounts = await prisma.dealerActivity.groupBy({
          by: ['activityType'],
          where: { campaignId: campaign.id },
          _count: true,
        });

        const countMap: Record<string, number> = {};
        let totalActivities = 0;
        for (const item of activityCounts) {
          countMap[item.activityType] = item._count;
          totalActivities += item._count;
        }

        const totalBids = countMap['BID_PLACED'] || 0;
        const buyTransactions = countMap['BUY'] || 0;
        const sellTransactions = countMap['SELL'] || 0;
        const matchParticipation = countMap['MATCH_PARTICIPATION'] || 0;
        const totalInspections = countMap['VEHICLE_INSPECTED'] || 0;
        const totalWatchlist = countMap['WATCHLIST_ADD'] || 0;

        const matchDays = await prisma.matchDay.findMany({
          where: { campaignId: campaign.id },
          orderBy: { matchNumber: 'asc' },
        });

        const leaderboard = await prisma.dealerScore.findMany({
          where: { campaignId: campaign.id },
          include: { dealer: true },
          orderBy: { rank: 'asc' },
          take: 50,
        });

        // Recent real-time activities for Overview telemetry stream
        const recentActivities = await prisma.dealerActivity.findMany({
          where: { campaignId: campaign.id },
          include: {
            dealer: {
              select: {
                id: true,
                displayName: true,
                externalDealerId: true,
                city: true,
              },
            },
            match: {
              select: {
                matchNumber: true,
                auctionId: true,
              },
            },
          },
          orderBy: { timestamp: 'desc' },
          take: 10,
        });

        return NextResponse.json({
          stats: {
            totalDealers,
            activeDealers,
            totalPoints: totalPointsResult._sum.totalPoints || 0,
            matchParticipation,
            buyTransactions,
            sellTransactions,
            totalBids,
            totalInspections,
            totalWatchlist,
            totalActivities,
          },
          matchDays,
          recentActivities: recentActivities.map(a => {
            let meta: any = {};
            try {
              meta = typeof a.metadata === 'string' ? JSON.parse(a.metadata) : (a.metadata || {});
            } catch {
              meta = {};
            }
            return {
              id: a.id,
              dealerName: a.dealer.displayName,
              externalDealerId: a.dealer.externalDealerId,
              city: a.dealer.city,
              activityType: a.activityType,
              points: a.points,
              metadata: meta,
              timestamp: a.timestamp,
              auctionId: a.match?.auctionId || '',
              matchNumber: a.match?.matchNumber || 1,
            };
          }),
          leaderboard: leaderboard.map(s => ({
            rank: s.rank,
            dealerName: s.dealer.displayName,
            maskedName: s.dealer.displayName,
            externalId: s.dealer.externalDealerId,
            city: s.dealer.city,
            points: s.totalPoints,
            dealerId: s.dealer.id,
          })),
          campaign: {
            id: campaign.id,
            name: campaign.name,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
            status: campaign.status,
          },
        });
      }

      case 'dealers': {
        const dealers = await prisma.dealer.findMany({
          include: {
            scores: {
              where: { campaignId: campaign.id },
              select: { totalPoints: true, rank: true },
            },
          },
          orderBy: { displayName: 'asc' },
        });

        return NextResponse.json({
          dealers: dealers.map(d => ({
            id: d.id,
            externalId: d.externalDealerId,
            displayName: d.displayName,
            maskedName: d.displayName,
            city: d.city,
            status: d.status,
            points: d.scores[0]?.totalPoints || 0,
            rank: d.scores[0]?.rank || 0,
          })),
        });
      }

      case 'dealer': {
        const dealerId = searchParams.get('id');
        if (!dealerId) {
          return NextResponse.json({ error: 'Dealer ID required' }, { status: 400 });
        }

        const dealer = await prisma.dealer.findUnique({
          where: { id: parseInt(dealerId) },
          include: {
            scores: { where: { campaignId: campaign.id } },
            activities: {
              where: { campaignId: campaign.id },
              include: { match: { select: { matchNumber: true, date: true } } },
              orderBy: { timestamp: 'desc' },
            },
          },
        });

        if (!dealer) {
          return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
        }

        return NextResponse.json({ dealer });
      }

      case 'vehicleDetails': {
        const vehicleId = searchParams.get('vehicleId');
        const auctionId = searchParams.get('auctionId') || '2003';
        if (!vehicleId) {
          return NextResponse.json({ error: 'vehicleId required' }, { status: 400 });
        }
        try {
          const provider = getTVSProvider();
          const vehicles = await provider.getAuctionVehicles(auctionId);
          const match = (vehicles || []).find(v => String(v.vehicle_id) === String(vehicleId) || String(v.id) === String(vehicleId));
          return NextResponse.json({ vehicle: match || null });
        } catch (err) {
          console.warn('Vehicle details fetch error:', err);
          return NextResponse.json({ vehicle: null, error: String(err) });
        }
      }

      case 'liveActivities': {
        const shouldSync = searchParams.get('sync') === 'true';
        let syncAuctionId = searchParams.get('auctionId');
        if (!syncAuctionId) {
          const liveMatch = await prisma.matchDay.findFirst({
            where: { campaignId: campaign.id, status: 'LIVE' },
          }) || await prisma.matchDay.findFirst({
            where: { campaignId: campaign.id, status: 'UPCOMING' },
            orderBy: { date: 'asc' },
          });
          syncAuctionId = liveMatch?.auctionId || '2003';
        }
        const match = await prisma.matchDay.findFirst({
          where: { campaignId: campaign.id, auctionId: syncAuctionId },
        });

        // Only auto-sync if explicitly requested AND match is not already completed
        if (shouldSync && (!match || match.status !== 'COMPLETED')) {
          try {
            await syncLiveAuction(syncAuctionId);
          } catch (err) {
            console.warn('Live activities sync error:', err);
          }
        }

        const auctionFilter: any = {
          campaignId: campaign.id,
          OR: [
            ...(match ? [{ matchId: match.id }] : []),
            { externalTransactionId: { contains: syncAuctionId } },
          ],
        };

        const filterType = searchParams.get('type') || searchParams.get('filter');
        const search = searchParams.get('search')?.trim();
        const take = Math.min(parseInt(searchParams.get('take') || '200'), 500);

        const andConditions: any[] = [auctionFilter];
        if (filterType && filterType !== 'ALL') {
          andConditions.push({ activityType: filterType });
        }
        if (search) {
          andConditions.push({
            OR: [
              { dealer: { displayName: { contains: search } } },
              { dealer: { externalDealerId: { contains: search } } },
              { dealer: { city: { contains: search } } },
              { metadata: { contains: search } },
              { externalTransactionId: { contains: search } },
            ],
          });
        }

        const activities = await prisma.dealerActivity.findMany({
          where: andConditions.length === 1 ? andConditions[0] : { AND: andConditions },
          include: {
            dealer: {
              select: {
                id: true,
                displayName: true,
                externalDealerId: true,
                city: true,
              },
            },
          },
          orderBy: { timestamp: 'desc' },
          take,
        });

        const [activityCounts, activeDealersCount] = await Promise.all([
          prisma.dealerActivity.groupBy({
            by: ['activityType'],
            where: auctionFilter,
            _count: true,
          }),
          prisma.dealerActivity.groupBy({
            by: ['dealerId'],
            where: auctionFilter,
          }),
        ]);

        const countMap: Record<string, number> = {};
        let totalActivities = 0;
        for (const item of activityCounts) {
          countMap[item.activityType] = item._count;
          totalActivities += item._count;
        }

        const totalBids = countMap['BID_PLACED'] || 0;
        const totalBuys = countMap['BUY'] || 0;
        const totalSells = countMap['SELL'] || 0;
        const totalParticipation = countMap['MATCH_PARTICIPATION'] || 0;
        const totalInspections = countMap['VEHICLE_INSPECTED'] || 0;
        const totalWatchlist = countMap['WATCHLIST_ADD'] || 0;

        return NextResponse.json({
          activities: activities.map(a => {
            let parsedMetadata = {};
            try {
              if (a.metadata) {
                parsedMetadata = typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata;
              }
            } catch {
              parsedMetadata = {};
            }
            return {
              id: a.id,
              dealerId: a.dealerId,
              dealerName: a.dealer.displayName,
              externalDealerId: a.dealer.externalDealerId,
              city: a.dealer.city,
              activityType: a.activityType,
              points: a.points,
              metadata: parsedMetadata,
              timestamp: a.timestamp,
              externalTransactionId: a.externalTransactionId,
              createdAt: a.createdAt,
              matchId: a.matchId,
            };
          }),
          stats: {
            totalBids,
            totalBuys,
            totalSells,
            totalParticipation,
            totalInspections,
            totalWatchlist,
            totalActivities,
            activeDealersCount: activeDealersCount.length,
            auctionId: syncAuctionId,
            auctionTitle: `TVS Certified Auction #${syncAuctionId}`,
            auctionTime: (() => {
              // Use the match day date if available, otherwise compute next Thursday
              const now = new Date();
              let auctionDate: Date;
              if (match?.date) {
                auctionDate = new Date(match.date);
              } else {
                // Compute next Thursday (or today if today is Thursday)
                auctionDate = new Date(now);
                const dayOfWeek = auctionDate.getDay(); // 0=Sun, 4=Thu
                const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
                if (daysUntilThursday === 0) {
                  // Today is Thursday, check if auction time (2 PM IST) has passed
                  const istHour = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getHours();
                  if (istHour >= 16) {
                    // After 4 PM IST, show next Thursday
                    auctionDate.setDate(auctionDate.getDate() + 7);
                  }
                } else {
                  auctionDate.setDate(auctionDate.getDate() + daysUntilThursday);
                }
              }
              const isToday = now.toDateString() === auctionDate.toDateString();
              const isTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toDateString() === auctionDate.toDateString();
              const dateLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : auctionDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
              return `2:00 PM IST (${dateLabel})`;
            })(),
            totalVehicles: totalActivities > 0 ? totalActivities : 0,
          },
        });
      }

      case 'rules': {
        const rules = await prisma.pointRule.findMany({
          where: { campaignId: campaign.id },
          orderBy: { activityType: 'asc' },
        });
        return NextResponse.json({ rules, campaignId: campaign.id });
      }

      case 'matches': {
        const matches = await prisma.matchDay.findMany({
          where: { campaignId: campaign.id },
          orderBy: { matchNumber: 'asc' },
        });
        return NextResponse.json({ matches, campaignId: campaign.id });
      }

      case 'audit': {
        const logs = await prisma.auditLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 100,
        });
        return NextResponse.json({ logs });
      }

      case 'export': {
        const exportType = searchParams.get('type') || 'dealers';
        const dateStr = new Date().toISOString().split('T')[0];

        const escapeCsv = (val: any) => {
          if (val === null || val === undefined) return '""';
          const s = String(val).replace(/"/g, '""');
          return `"${s}"`;
        };

        // Helper for accurate, unambiguous IST datetime formatting in Excel
        const formatIST = (dateInput: Date | string | number) => {
          const d = new Date(dateInput);
          if (isNaN(d.getTime())) return { date: '', time: '', full: '' };
          const date = d.toLocaleDateString('en-GB', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }).replace(/ /g, '-');
          const time = d.toLocaleTimeString('en-US', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          });
          return { date, time, full: `${date} ${time}` };
        };

        if (exportType === 'activities') {
          let auctionId = searchParams.get('auctionId');
          if (!auctionId) {
            const liveMatch = await prisma.matchDay.findFirst({
              where: { campaignId: campaign.id, status: 'LIVE' },
            }) || await prisma.matchDay.findFirst({
              where: { campaignId: campaign.id, status: 'UPCOMING' },
              orderBy: { date: 'asc' },
            });
            auctionId = liveMatch?.auctionId || '2003';
          }
          const isAll = searchParams.get('all') === 'true';

          const whereClause: any = {
            campaignId: campaign.id,
            OR: [
              { externalTransactionId: { contains: auctionId } },
              { match: { auctionId } },
            ],
          };

          // By default, export only the Auction Results (vehicles won / sold)
          if (!isAll) {
            whereClause.activityType = 'BUY';
          }

          const activities = await prisma.dealerActivity.findMany({
            where: whereClause,
            include: { dealer: true, match: true },
            orderBy: { timestamp: 'asc' },
          });

          // Sort by vehicle sequence/lot number if available, then timestamp
          activities.sort((a, b) => {
            let seqA = 0;
            let seqB = 0;
            try { seqA = JSON.parse(a.metadata || '{}').sequence || 0; } catch {}
            try { seqB = JSON.parse(b.metadata || '{}').sequence || 0; } catch {}
            if (seqA && seqB) return seqA - seqB;
            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          });

          const headers = !isAll ? [
            'Lot #',
            'Auction ID',
            'Date (IST)',
            'Time (IST)',
            'Date & Time (IST)',
            'Vehicle ID',
            'Vehicle Name',
            'Registration Number',
            'Fuel Type',
            'Transmission',
            'Year of Mfg',
            'Speedometer (KM)',
            'Start Bid Value (INR)',
            'Winning Bid Amount (INR)',
            'Winner Dealer ID',
            'Winner Company Name',
            'Dealer Phone',
            'Dealer City',
            'Points Awarded',
            'Activity Type',
            'Transaction ID',
            'Match Number',
            'Campaign Name',
          ] : [
            'Activity ID',
            'Auction ID',
            'Date (IST)',
            'Time (IST)',
            'Date & Time (IST)',
            'Activity Type',
            'Transaction ID',
            'Dealer ID',
            'Company Name',
            'Dealer Phone',
            'City',
            'Points Awarded',
            'Amount / Bid Value (INR)',
            'Winning Bid (INR)',
            'Vehicle ID',
            'Vehicle Name',
            'Registration Number',
            'Fuel Type',
            'Transmission',
            'Year of Mfg',
            'Speedometer (KM)',
            'Start Bid Value (INR)',
            'Bid Rank',
            'Is Leading Bid',
            'Is Pre-Bid',
            'Total Bids on Vehicle',
            'Match Number',
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

            if (!isAll) {
              rows.push([
                escapeCsv(meta.sequence || ''),
                escapeCsv(auctionId),
                escapeCsv(ist.date),
                escapeCsv(ist.time),
                escapeCsv(ist.full),
                escapeCsv(meta.vehicleId || ''),
                escapeCsv(meta.vehicleName || ''),
                escapeCsv(meta.regNo || ''),
                escapeCsv(meta.fuelType || ''),
                escapeCsv(meta.transmission || ''),
                escapeCsv(meta.yearOfMfg || ''),
                escapeCsv(meta.speedometer || ''),
                escapeCsv(meta.startBidValue || ''),
                escapeCsv(meta.winningBid || meta.amount || ''),
                escapeCsv(a.dealer?.externalDealerId || meta.winnerId || ''),
                escapeCsv(a.dealer?.displayName || ''),
                escapeCsv(a.dealer?.phone || ''),
                escapeCsv(a.dealer?.city || ''),
                escapeCsv(a.points),
                escapeCsv(a.activityType),
                escapeCsv(a.externalTransactionId || ''),
                escapeCsv(a.match?.matchNumber ? `Match ${a.match.matchNumber}` : 'Match 1'),
                escapeCsv(campaign.name),
              ].join(','));
            } else {
              rows.push([
                escapeCsv(a.id),
                escapeCsv(auctionId),
                escapeCsv(ist.date),
                escapeCsv(ist.time),
                escapeCsv(ist.full),
                escapeCsv(a.activityType),
                escapeCsv(a.externalTransactionId || ''),
                escapeCsv(a.dealer?.externalDealerId || ''),
                escapeCsv(a.dealer?.displayName || ''),
                escapeCsv(a.dealer?.phone || ''),
                escapeCsv(a.dealer?.city || ''),
                escapeCsv(a.points),
                escapeCsv(meta.bidAmount || meta.winningBid || meta.price || ''),
                escapeCsv(meta.winningBid || ''),
                escapeCsv(meta.vehicleId || ''),
                escapeCsv(meta.vehicleName || ''),
                escapeCsv(meta.regNo || ''),
                escapeCsv(meta.fuelType || ''),
                escapeCsv(meta.transmission || ''),
                escapeCsv(meta.yearOfMfg || ''),
                escapeCsv(meta.speedometer || ''),
                escapeCsv(meta.startBidValue || ''),
                escapeCsv(meta.bidRank || ''),
                escapeCsv(meta.isLeadingBid ? 'YES' : 'NO'),
                escapeCsv(meta.isPreBid ? 'YES' : 'NO'),
                escapeCsv(meta.totalBids || ''),
                escapeCsv(a.match?.matchNumber ? `Match ${a.match.matchNumber}` : 'Match 1'),
                escapeCsv(campaign.name),
              ].join(','));
            }
          }

          const filename = isAll
            ? `supercup-auction-all-activities-${dateStr}.csv`
            : `supercup-auction-activities-${dateStr}.csv`;

          // \uFEFF UTF-8 BOM ensures Excel on Windows renders UTF-8 correctly
          return new NextResponse('\uFEFF' + rows.join('\n'), {
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="${filename}"`,
            },
          });
        }

        // Default: Comprehensive Dealer Leaderboard & Performance Summary
        const scores = await prisma.dealerScore.findMany({
          where: { campaignId: campaign.id },
          include: {
            dealer: {
              include: {
                activities: {
                  where: { campaignId: campaign.id },
                  select: {
                    activityType: true,
                    points: true,
                    metadata: true,
                    timestamp: true,
                  },
                },
              },
            },
          },
          orderBy: { rank: 'asc' },
        });

        const headers = [
          'Rank',
          'Company Name',
          'Dealer ID',
          'Phone Number',
          'City',
          'Account Status',
          'Total Points',
          'Live Bids Count',
          'Live Bids Points',
          'Vehicles Won Count',
          'Vehicles Won Points',
          'Total Won Amount (INR)',
          'Won Vehicles List',
          'Vehicles Sold Count',
          'Vehicles Sold Points',
          'Total Sold Amount (INR)',
          'Room Attendances Count',
          'Room Attendance Points',
          'Vehicle Inspections Count',
          'Vehicle Inspections Points',
          'Watchlist Bookmarks Count',
          'Watchlist Points',
          'All Matches Bonus Points',
          'Total Activities Count',
          'First Activity Time',
          'Last Activity Time',
          'Campaign Name',
        ];

        const rows = [headers.map(escapeCsv).join(',')];

        for (const s of scores) {
          const d = s.dealer;
          const acts = d.activities || [];
          const bids = acts.filter(a => a.activityType === 'BID_PLACED');
          const buys = acts.filter(a => a.activityType === 'BUY');
          const sells = acts.filter(a => a.activityType === 'SELL');
          const attends = acts.filter(a => a.activityType === 'MATCH_PARTICIPATION');
          const inspects = acts.filter(a => a.activityType === 'VEHICLE_INSPECTED');
          const watch = acts.filter(a => a.activityType === 'WATCHLIST_ADD');
          const bonus = acts.filter(a => a.activityType === 'ALL_MATCHES_BONUS');

          let totalWonAmount = 0;
          const wonVehicles: string[] = [];
          for (const b of buys) {
            let meta: any = {};
            try {
              meta = typeof b.metadata === 'string' ? JSON.parse(b.metadata) : (b.metadata || {});
            } catch {
              meta = {};
            }
            totalWonAmount += Number(meta?.winningBid || meta?.amount || 0);
            const label = [meta?.regNo, meta?.vehicleName].filter(Boolean).join(' ');
            if (label) wonVehicles.push(label);
          }

          let totalSoldAmount = 0;
          for (const sel of sells) {
            let meta: any = {};
            try {
              meta = typeof sel.metadata === 'string' ? JSON.parse(sel.metadata) : (sel.metadata || {});
            } catch {
              meta = {};
            }
            totalSoldAmount += Number(meta?.price || meta?.amount || 0);
          }

          const timestamps = acts.map(a => new Date(a.timestamp).getTime()).filter(t => !isNaN(t));
          const firstTime = timestamps.length > 0 ? formatIST(Math.min(...timestamps)).full : '';
          const lastTime = timestamps.length > 0 ? formatIST(Math.max(...timestamps)).full : '';

          rows.push([
            escapeCsv(s.rank || ''),
            escapeCsv(d.displayName),
            escapeCsv(d.externalDealerId),
            escapeCsv(d.phone || ''),
            escapeCsv(d.city || ''),
            escapeCsv(d.status || 'ACTIVE'),
            escapeCsv(s.totalPoints),
            escapeCsv(bids.length),
            escapeCsv(bids.reduce((sum, a) => sum + a.points, 0)),
            escapeCsv(buys.length),
            escapeCsv(buys.reduce((sum, a) => sum + a.points, 0)),
            escapeCsv(totalWonAmount),
            escapeCsv(wonVehicles.join('; ')),
            escapeCsv(sells.length),
            escapeCsv(sells.reduce((sum, a) => sum + a.points, 0)),
            escapeCsv(totalSoldAmount),
            escapeCsv(attends.length),
            escapeCsv(attends.reduce((sum, a) => sum + a.points, 0)),
            escapeCsv(inspects.length),
            escapeCsv(inspects.reduce((sum, a) => sum + a.points, 0)),
            escapeCsv(watch.length),
            escapeCsv(watch.reduce((sum, a) => sum + a.points, 0)),
            escapeCsv(bonus.reduce((sum, a) => sum + a.points, 0)),
            escapeCsv(acts.length),
            escapeCsv(firstTime),
            escapeCsv(lastTime),
            escapeCsv(campaign.name),
          ].join(','));
        }

        return new NextResponse('\uFEFF' + rows.join('\n'), {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="supercup-dealer-leaderboard-${dateStr}.csv"`,
          },
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { action } = body;

    const campaign = await prisma.campaign.findFirst({
      where: { type: 'SUPER_CUP', status: 'ACTIVE' },
      orderBy: { startDate: 'desc' },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'No active campaign' }, { status: 404 });
    }

    switch (action) {
      case 'syncTvsLive': {
        const allDealers = await prisma.dealer.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true, externalDealerId: true },
        });

        let totalNewActivities = 0;
        let totalPointsAwarded = 0;

        for (const d of allDealers) {
          const res = await syncDealerActivities(d.id, d.externalDealerId, campaign.id);
          totalNewActivities += res.newActivitiesCount;
          totalPointsAwarded += res.newPointsAwarded;
        }

        await prisma.auditLog.create({
          data: {
            adminUser: 'admin',
            action: 'LIVE_AUCTION_SYNCED',
            targetType: 'CAMPAIGN',
            targetId: String(campaign.id),
            details: JSON.stringify({
              auctionId: body.auctionId || '2003',
              dealersSynced: allDealers.length,
              totalNewActivities,
              totalPointsAwarded,
            }),
            reason: body.reason || `Synced live auction ${body.auctionId || '2003'} transactions`,
          },
        });

        return NextResponse.json({
          success: true,
          dealersSynced: allDealers.length,
          totalNewActivities,
          totalPointsAwarded,
        });
      }

      case 'syncLiveAuction': {
        const auctionId = body.auctionId || '2003';
        const result = await syncLiveAuction(auctionId);

        await prisma.auditLog.create({
          data: {
            adminUser: 'admin',
            action: 'LIVE_AUCTION_STREAM_SYNCED',
            targetType: 'AUCTION',
            targetId: String(auctionId),
            details: JSON.stringify(result),
            reason: body.reason || `Synced real-time live auction #${auctionId} stream`,
          },
        });

        return NextResponse.json({ ...result });
      }

      case 'recalculate': {
        const result = await recalculateRankings(campaign.id);

        await prisma.auditLog.create({
          data: {
            adminUser: 'admin',
            action: 'SCORE_RECALCULATED',
            targetType: 'CAMPAIGN',
            targetId: String(campaign.id),
            details: JSON.stringify(result),
            reason: body.reason || 'Manual recalculation',
          },
        });

        return NextResponse.json({ success: true, result });
      }

      case 'adjust': {
        const { dealerId, points, reason } = body;
        if (!dealerId || points === undefined || !reason) {
          return NextResponse.json(
            { error: 'dealerId, points, and reason are required' },
            { status: 400 }
          );
        }

        // Get current score
        const currentScore = await prisma.dealerScore.findUnique({
          where: { dealerId_campaignId: { dealerId: parseInt(dealerId), campaignId: campaign.id } },
        });

        // Create manual activity
        await prisma.dealerActivity.create({
          data: {
            dealerId: parseInt(dealerId),
            campaignId: campaign.id,
            matchId: null,
            activityType: points > 0 ? 'BUY' : 'SELL',
            externalTransactionId: `ADMIN-ADJ-${Date.now()}`,
            points: parseInt(points),
            metadata: JSON.stringify({ reason, adjustedBy: 'admin', timestamp: new Date().toISOString() }),
            timestamp: new Date(),
          },
        });

        // Recalculate
        await recalculateRankings(campaign.id);

        // Audit log
        await prisma.auditLog.create({
          data: {
            adminUser: 'admin',
            action: 'POINTS_ADJUSTED',
            targetType: 'DEALER',
            targetId: String(dealerId),
            details: JSON.stringify({
              previousPoints: currentScore?.totalPoints || 0,
              adjustment: points,
              newPoints: (currentScore?.totalPoints || 0) + parseInt(points),
            }),
            reason,
          },
        });

        return NextResponse.json({ success: true });
      }

      case 'updateRule': {
        const { ruleId, newPoints, active } = body;
        if (!ruleId || (newPoints === undefined && active === undefined)) {
          return NextResponse.json({ error: 'ruleId and newPoints or active required' }, { status: 400 });
        }

        const oldRule = await prisma.pointRule.findUnique({ where: { id: parseInt(ruleId) } });
        const updateData: { points?: number; active?: boolean } = {};
        if (newPoints !== undefined) updateData.points = parseInt(newPoints);
        if (active !== undefined) updateData.active = Boolean(active);

        await prisma.pointRule.update({
          where: { id: parseInt(ruleId) },
          data: updateData,
        });

        clearPointRulesCache(campaign.id);

        await prisma.auditLog.create({
          data: {
            adminUser: 'admin',
            action: 'RULE_CHANGED',
            targetType: 'RULE',
            targetId: String(ruleId),
            details: JSON.stringify({
              activityType: oldRule?.activityType,
              oldPoints: oldRule?.points,
              oldActive: oldRule?.active,
              ...updateData,
            }),
            reason: body.reason || 'Point rule updated',
          },
        });

        return NextResponse.json({ success: true });
      }

      case 'updateMatch': {
        const { matchId, status, auctionId } = body;
        if (!matchId) {
          return NextResponse.json({ error: 'matchId required' }, { status: 400 });
        }

        const updateData: any = {};
        if (status) updateData.status = status;
        if (auctionId !== undefined) updateData.auctionId = String(auctionId).trim();

        await prisma.matchDay.update({
          where: { id: parseInt(matchId) },
          data: updateData,
        });

        await prisma.auditLog.create({
          data: {
            adminUser: 'admin',
            action: 'MATCH_UPDATED',
            targetType: 'MATCH',
            targetId: String(matchId),
            details: JSON.stringify(updateData),
            reason: body.reason || 'Match updated',
          },
        });

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin POST error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
