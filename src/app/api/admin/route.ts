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
import * as XLSX from 'xlsx';
import { getCurrentSuperCupCampaign } from '@/lib/services/campaign';

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
    const requestedCampaign = searchParams.get('campaignId') || searchParams.get('campaign') || searchParams.get('campaignSlug');
    let campaign = null;

    if (requestedCampaign) {
      const numericId = parseInt(requestedCampaign, 10);
      if (!isNaN(numericId)) {
        campaign = await prisma.campaign.findUnique({ where: { id: numericId } });
      }
      if (!campaign) {
        campaign = await prisma.campaign.findUnique({ where: { slug: requestedCampaign } });
      }
    }

    if (!campaign) {
      campaign = await getCurrentSuperCupCampaign();
    }

    if (!campaign) {
      campaign = await prisma.campaign.findFirst({
        where: { type: 'SUPER_CUP' },
        orderBy: { startDate: 'desc' },
      }) || await prisma.campaign.findFirst({
        orderBy: { startDate: 'desc' },
      });
    }

    if (!campaign) {
      return NextResponse.json({ error: 'No active campaign found in database' }, { status: 404 });
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
        const totalListings = countMap['SELL_LISTING'] || 0;
        const totalCommissions = countMap['SELL_COMMISSION'] || 0;
        const matchParticipation = countMap['MATCH_PARTICIPATION'] || 0;
        const totalInspections = countMap['VEHICLE_INSPECTED'] || 0;
        const totalWatchlist = countMap['WATCHLIST_ADD'] || 0;

        const matchDays = await prisma.matchDay.findMany({
          where: { campaignId: campaign.id },
          orderBy: { matchNumber: 'asc' },
        });

        const historicalMatches = await prisma.matchDay.findMany({
          where: { status: 'COMPLETED' },
          orderBy: { date: 'desc' },
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        });

        const leaderboard = await prisma.dealerScore.findMany({
          where: { campaignId: campaign.id },
          include: { dealer: true },
          orderBy: { rank: 'asc' },
          take: 250,
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
            totalListings,
            totalCommissions,
            totalBids,
            totalInspections,
            totalWatchlist,
            totalActivities,
          },
          matchDays,
          historicalMatches,
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
          leaderboard: leaderboard.map(s => {
            const displayName = s.dealer.displayName || `Dealer ${s.dealer.externalDealerId}`;
            return {
              rank: s.rank,
              dealerName: displayName,
              maskedName: displayName,
              externalId: s.dealer.externalDealerId,
              city: s.dealer.city,
              category: (s.dealer as any).category || 'Used Car Dealer',
              points: s.totalPoints,
              dealerId: s.dealer.id,
            };
          }),
          campaign: {
            id: campaign.id,
            slug: campaign.slug,
            name: campaign.name,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
            status: campaign.status,
          },
          campaigns: (await prisma.campaign.findMany({
            where: { type: 'SUPER_CUP' },
            orderBy: { startDate: 'asc' },
            select: {
              id: true,
              slug: true,
              name: true,
              startDate: true,
              endDate: true,
              status: true,
            },
          })),
        });
      }

      case 'dealers': {
        const categoryParam = searchParams.get('category');
        const whereClause: any = {};
        if (categoryParam && categoryParam !== 'ALL') {
          if (categoryParam === 'OEM' || categoryParam === 'OEM Dealer') {
            whereClause.category = 'OEM Dealer';
          } else if (categoryParam === 'USED' || categoryParam === 'Used Car Dealer') {
            whereClause.category = 'Used Car Dealer';
          } else if (categoryParam === 'CORPORATE' || categoryParam === 'Corporate / Other') {
            whereClause.category = 'Corporate / Other';
          } else {
            whereClause.category = categoryParam;
          }
        }

        const [dealers, allDealers] = await Promise.all([
          prisma.dealer.findMany({
            where: whereClause,
            include: {
              scores: {
                where: { campaignId: campaign.id },
                select: { totalPoints: true, rank: true },
              },
            },
            orderBy: { displayName: 'asc' },
          }),
          prisma.dealer.findMany({
            select: { category: true },
          }),
        ]);

        const counts: Record<string, number> = {
          total: allDealers.length,
          oem: 0,
          usedCar: 0,
          corporate: 0,
        };
        for (const item of allDealers) {
          const cat = (item as any).category;
          if (cat === 'OEM Dealer') counts.oem++;
          else if (cat === 'Used Car Dealer') counts.usedCar++;
          else if (cat === 'Corporate / Other') counts.corporate++;
        }

        return NextResponse.json({
          counts,
          dealers: dealers.map(d => ({
            id: d.id,
            externalId: d.externalDealerId,
            displayName: d.displayName,
            maskedName: d.displayName,
            city: d.city,
            category: (d as any).category || 'Used Car Dealer',
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

      case 'auctionVehicles': {
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

        const currentLotParam = searchParams.get('currentLot'); // e.g. "95", "123", "completed", "auto"

        try {
          const provider = getTVSProvider();
          let rawVehicles = await provider.getAuctionVehicles(auctionId);

          // If no vehicles returned (e.g. future scheduled auction), fallback to standard inventory template
          if (!rawVehicles || rawVehicles.length === 0) {
            rawVehicles = await provider.getAuctionVehicles('2003');
            if (rawVehicles && rawVehicles.length > 0) {
              rawVehicles = rawVehicles.map(v => ({
                ...v,
                stage: 'upcoming',
                winner_id: null,
                winner_bid_value: null,
                current_bid: null,
              }));
            }
          }

          // Sort strictly by sequence number
          const sorted = [...(rawVehicles || [])].sort((a: any, b: any) => {
            const seqA = Number(a.sequence ?? a.seq_num ?? a.id ?? 0);
            const seqB = Number(b.sequence ?? b.seq_num ?? b.id ?? 0);
            return seqA - seqB;
          });

          const total = sorted.length;

          // Check match day status across campaigns (don't restrict to current campaign so historical auctions work)
          const match = await prisma.matchDay.findFirst({
            where: { auctionId },
          });

          // Fetch recent activity metadata to know if any vehicles have live bids/pre-bids or winners in DB
          const recentActs = await prisma.dealerActivity.findMany({
            where: {
              OR: [
                ...(match ? [{ matchId: match.id }] : []),
                { externalTransactionId: { contains: auctionId } },
              ],
            },
            select: { activityType: true, metadata: true, points: true, timestamp: true },
          });

          const vehicleActivityMap = new Map<string, any>();
          for (const a of recentActs) {
            try {
              const meta = typeof a.metadata === 'string' ? JSON.parse(a.metadata) : (a.metadata || {});
              const vId = String(meta.vehicleId || meta.id || '');
              if (vId && !vehicleActivityMap.has(vId)) {
                vehicleActivityMap.set(vId, {
                  activityType: a.activityType,
                  winningBid: meta.winningBid,
                  bidAmount: meta.bidAmount,
                  isPreBid: meta.isPreBid,
                  isLeadingBid: meta.isLeadingBid,
                });
              }
            } catch {}
          }

          // Determine active sequence
          let activeSeq: number | null = null;
          let isAllCompleted = false;

          if (currentLotParam && currentLotParam !== 'auto') {
            if (currentLotParam === 'completed' || currentLotParam === 'all_completed') {
              isAllCompleted = true;
              activeSeq = null;
            } else {
              const parsedLot = parseInt(currentLotParam);
              if (!isNaN(parsedLot) && parsedLot >= 1 && parsedLot <= total) {
                activeSeq = parsedLot;
              }
            }
          }

          if (activeSeq === null && !isAllCompleted) {
            // Auto detection:
            // 1. Look for explicit stage 'live'
            const liveVeh = sorted.find((v: any) => {
              const st = String(v.stage || '').toLowerCase();
              return st === 'live' || st === 'running' || st === 'bidding' || st === 'active';
            });
            if (liveVeh) {
              activeSeq = Number(liveVeh.sequence ?? liveVeh.seq_num ?? 1);
            } else if (match?.status === 'UPCOMING') {
              activeSeq = 1;
            } else if (match?.status === 'COMPLETED') {
              // Historical completed auction
              isAllCompleted = true;
              activeSeq = null;
            } else {
              // Check if any vehicle is still unclosed
              const firstUnclosed = sorted.find((v: any) => {
                const st = String(v.stage || '').toLowerCase();
                return v.winner_id == null && st !== 'closed' && st !== 'completed';
              });
              if (firstUnclosed) {
                activeSeq = Number(firstUnclosed.sequence ?? firstUnclosed.seq_num ?? 1);
              } else {
                // All vehicles in this auction session are concluded/hammered
                isAllCompleted = true;
                activeSeq = null;
              }
            }
          }

          // If all lots are concluded, ensure matchDay record is marked COMPLETED
          if (isAllCompleted && match && match.status !== 'COMPLETED') {
            await prisma.matchDay.update({
              where: { id: match.id },
              data: { status: 'COMPLETED' },
            }).catch(() => {});
          }

          // Enrich vehicles with standard status
          const enrichedVehicles = sorted.map((v: any) => {
            const seqNum = Number(v.sequence ?? v.seq_num ?? v.id ?? 0);
            const actInfo = vehicleActivityMap.get(String(v.vehicle_id || v.id)) || {};
            
            let status: 'COMPLETED' | 'ONGOING' | 'UPCOMING' = 'UPCOMING';
            if (isAllCompleted) {
              status = 'COMPLETED';
            } else if (activeSeq !== null) {
              if (seqNum < activeSeq) {
                status = 'COMPLETED';
              } else if (seqNum === activeSeq) {
                status = 'ONGOING';
              } else {
                status = 'UPCOMING';
              }
            }

            return {
              id: v.id,
              vehicleId: v.vehicle_id || v.id,
              lotNumber: seqNum,
              sequence: seqNum,
              title: v.title || v.make_model || 'Auction Vehicle',
              makeModel: v.make_model || v.title || '',
              makeName: v.make_name || '',
              modelName: v.model_name || '',
              registrationNumber: v.registration_number || '',
              fuelType: v.fuel_type || '',
              transmission: v.transmission || '',
              yearOfMfg: v.year_of_mfg || '',
              speedometer: v.speedometer || '',
              startBidValue: Number(v.start_bid_value || 0),
              currentBid: Number(v.current_bid || actInfo.bidAmount || v.start_bid_value || 0),
              winnerBidValue: v.winner_bid_value ? Number(v.winner_bid_value) : (actInfo.winningBid ? Number(actInfo.winningBid) : null),
              winnerId: v.winner_id || null,
              stage: v.stage || '',
              vehicleStatus: v.vehicle_status || '',
              imageUrl: v.image_url || '',
              preBidValue: v.pre_bid_value ? Number(v.pre_bid_value) : null,
              hasPreBid: Boolean(v.pre_bid_value || actInfo.isPreBid),
              locationName: v.location_name || '',
              status, // COMPLETED, ONGOING, UPCOMING
            };
          });

          const completedList = enrichedVehicles.filter(v => v.status === 'COMPLETED');
          const ongoingCar = enrichedVehicles.find(v => v.status === 'ONGOING') || null;
          const upcomingList = enrichedVehicles.filter(v => v.status === 'UPCOMING');
          const nextCar = upcomingList[0] || null;
          const upcoming5 = upcomingList.slice(0, 5);

          return NextResponse.json({
            auctionId,
            matchStatus: isAllCompleted ? 'COMPLETED' : (match?.status || 'LIVE'),
            stats: {
              total,
              completed: completedList.length,
              ongoing: ongoingCar ? 1 : 0,
              upcoming: upcomingList.length,
              activeLotNumber: activeSeq,
              isAllCompleted,
              percentComplete: total > 0 ? Math.round((completedList.length / total) * 100) : 0,
            },
            ongoingCar,
            nextCar,
            upcomingCars: upcoming5,
            vehicles: enrichedVehicles,
          });
        } catch (err: any) {
          console.error('Error fetching auction vehicles:', err);
          return NextResponse.json({ error: err?.message || 'Failed to fetch auction vehicles' }, { status: 500 });
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
        // Find match across any campaign so historical matches and their activities work
        const match = await prisma.matchDay.findFirst({
          where: { auctionId: syncAuctionId },
          orderBy: { date: 'desc' },
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
          OR: [
            ...(match ? [{ matchId: match.id }] : []),
            { match: { auctionId: syncAuctionId } },
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
        const totalListings = countMap['SELL_LISTING'] || 0;
        const totalCommissions = countMap['SELL_COMMISSION'] || 0;
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
            totalListings,
            totalCommissions,
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
              const parts = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' }).formatToParts(auctionDate);
              const day = parts.find(p => p.type === 'day')?.value || '';
              const month = parts.find(p => p.type === 'month')?.value || '';
              const year = parts.find(p => p.type === 'year')?.value || '';
              const formattedDate = `${day}-${month}-${year}`;
              const dateLabel = isToday ? `Today (${formattedDate})` : isTomorrow ? `Tomorrow (${formattedDate})` : formattedDate;
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
        const format = (searchParams.get('format') || 'xlsx').toLowerCase();
        const dateStr = new Date().toISOString().split('T')[0];

        const escapeCsv = (val: any) => {
          if (val === null || val === undefined) return '""';
          const s = String(val).replace(/"/g, '""');
          return `"${s}"`;
        };

        const formatIST = (dateInput: Date | string | number) => {
          const d = new Date(dateInput);
          if (isNaN(d.getTime())) return { date: '', time: '', full: '' };
          const parts = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }).formatToParts(d);
          const day = parts.find(p => p.type === 'day')?.value || '';
          const month = parts.find(p => p.type === 'month')?.value || '';
          const year = parts.find(p => p.type === 'year')?.value || '';
          const date = `${day}-${month}-${year}`;
          const time = d.toLocaleTimeString('en-US', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          });
          return { date, time, full: `${date} ${time}` };
        };

        // Helper to return either native Excel (.xlsx) or UTF-8 BOM CSV (.csv)
        const sendExportResponse = (
          headers: string[],
          rowsData: (string | number)[][],
          baseFilename: string,
          sheetTitle: string
        ) => {
          if (format === 'csv') {
            const csvContent = '\uFEFF' + [headers, ...rowsData].map(r => r.map(escapeCsv).join(',')).join('\n');
            return new NextResponse(csvContent, {
              headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${baseFilename}.csv"`,
              },
            });
          }

          // Generate Native Excel (.xlsx)
          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.aoa_to_sheet([headers, ...rowsData]);
          const colWidths = headers.map((h, i) => {
            let maxLen = h.length;
            for (const r of rowsData) {
              const cellVal = String(r[i] ?? '');
              if (cellVal.length > maxLen) maxLen = Math.min(cellVal.length, 45);
            }
            return { wch: maxLen + 3 };
          });
          ws['!cols'] = colWidths;
          XLSX.utils.book_append_sheet(wb, ws, sheetTitle.slice(0, 31));
          const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

          return new NextResponse(buffer, {
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'Content-Disposition': `attachment; filename="${baseFilename}.xlsx"`,
            },
          });
        };

        const provider = getTVSProvider();

        if (exportType === 'activities' || exportType === 'transactions') {
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
            OR: [
              { externalTransactionId: { contains: auctionId } },
              { match: { auctionId } },
            ],
          };

          // By default (or for transactions), export the paired Auction Results (vehicles won / sold)
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

          if (!isAll) {
            // Bilateral Auction Transactions pairing Seller and Buyer side-by-side
            const headers = [
              'Lot #',
              'Auction ID',
              'Match Number',
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
              'Starting Bid (INR)',
              'Reserve / Expected Price (INR)',
              'Winning Bid / Sale Price (INR)',
              'Seller / Origin Dealership',
              'Seller Customer Code',
              'Seller City',
              'Seller Phone',
              'Buyer / Winner Dealership',
              'Buyer Dealer ID',
              'Buyer City',
              'Buyer Phone',
              'Buyer Points',
              'Seller Points',
              'Transaction ID',
              'Status',
              'Campaign Name',
            ];

            const rowsData = activities.map(a => {
              let meta: any = {};
              try {
                meta = typeof a.metadata === 'string' ? JSON.parse(a.metadata) : (a.metadata || {});
              } catch {
                meta = {};
              }

              const ist = formatIST(a.timestamp);
              const sellerName = meta.sellerName || meta.customerName || 'TVS Certified';
              const sellerCustomer = provider.findCustomerByCompanyName ? provider.findCustomerByCompanyName(sellerName) : null;
              const sellerCode = meta.sellerCustomerCode || sellerCustomer?.code || '';
              const sellerCity = meta.sellerCity || sellerCustomer?.city || meta.location || '';
              const sellerPhone = meta.sellerPhone || sellerCustomer?.phone || '';

              return [
                meta.lotNo || meta.sequence || '',
                auctionId,
                a.match?.matchNumber ? `Match ${a.match.matchNumber}` : 'Match 1',
                ist.date,
                ist.time,
                ist.full,
                meta.vehicleId || '',
                meta.vehicleName || '',
                meta.regNo || '',
                meta.fuelType || '',
                meta.transmission || '',
                meta.yearOfMfg || '',
                meta.speedometer || '',
                meta.startBidValue || '',
                meta.expectedPrice || '',
                meta.winningBid || meta.saleAmount || meta.amount || '',
                sellerName,
                sellerCode,
                sellerCity,
                sellerPhone,
                a.dealer?.displayName || '',
                a.dealer?.externalDealerId || meta.winnerId || '',
                a.dealer?.city || '',
                a.dealer?.phone || '',
                a.points,
                10, // Seller awarded 10 points
                a.externalTransactionId || '',
                'SOLD',
                campaign.name,
              ];
            });

            const baseFilename = `supercup-auction-${auctionId}-transactions-${dateStr}`;
            return sendExportResponse(headers, rowsData, baseFilename, `Auction ${auctionId} Transactions`);
          } else {
            // Full Telemetry Stream (bids, pre-bids, participation, buys, sells)
            const headers = [
              'Activity ID',
              'Auction ID',
              'Match Number',
              'Date (IST)',
              'Time (IST)',
              'Date & Time (IST)',
              'Activity Type',
              'Transaction ID',
              'Dealer ID',
              'Company Name',
              'Dealer Phone',
              'City',
              'Seller / Origin Dealership',
              'Seller City',
              'Buyer / Winner Dealership',
              'Buyer City',
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
              'Campaign Name',
            ];

            const rowsData = activities.map(a => {
              let meta: any = {};
              try {
                meta = typeof a.metadata === 'string' ? JSON.parse(a.metadata) : (a.metadata || {});
              } catch {
                meta = {};
              }

              const ist = formatIST(a.timestamp);
              const sellerName = meta.sellerName || meta.customerName || (a.activityType === 'SELL' ? a.dealer?.displayName : '');
              const sellerCity = meta.sellerCity || (a.activityType === 'SELL' ? a.dealer?.city : meta.location) || '';
              const buyerName = meta.buyerDealerId ? (a.activityType === 'BUY' ? a.dealer?.displayName : '') : (a.activityType === 'BUY' ? a.dealer?.displayName : '');
              const buyerCity = a.activityType === 'BUY' ? a.dealer?.city : '';

              return [
                a.id,
                auctionId,
                a.match?.matchNumber ? `Match ${a.match.matchNumber}` : 'Match 1',
                ist.date,
                ist.time,
                ist.full,
                a.activityType,
                a.externalTransactionId || '',
                a.dealer?.externalDealerId || '',
                a.dealer?.displayName || '',
                a.dealer?.phone || '',
                a.dealer?.city || '',
                sellerName,
                sellerCity,
                buyerName,
                buyerCity,
                a.points,
                meta.bidAmount || meta.winningBid || meta.saleAmount || meta.price || '',
                meta.winningBid || meta.saleAmount || '',
                meta.vehicleId || '',
                meta.vehicleName || '',
                meta.regNo || '',
                meta.fuelType || '',
                meta.transmission || '',
                meta.yearOfMfg || '',
                meta.speedometer || '',
                meta.startBidValue || '',
                meta.bidRank || '',
                meta.isLeadingBid ? 'YES' : 'NO',
                meta.isPreBid ? 'YES' : 'NO',
                meta.totalBids || '',
                campaign.name,
              ];
            });

            const baseFilename = `supercup-auction-${auctionId}-telemetry-${dateStr}`;
            return sendExportResponse(headers, rowsData, baseFilename, `Auction ${auctionId} Telemetry`);
          }
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
          'Dealer Category',
          'Primary Role',
          'Phone Number',
          'City',
          'Account Status',
          'Total Points',
          'Live Bids Count',
          'Live Bids Points',
          'Vehicles Won / Bought Count',
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

        const rowsData = scores.map(s => {
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
            totalSoldAmount += Number(meta?.saleAmount || meta?.price || meta?.winningBid || meta?.amount || 0);
          }

          const timestamps = acts.map(a => new Date(a.timestamp).getTime()).filter(t => !isNaN(t));
          const firstTime = timestamps.length > 0 ? formatIST(Math.min(...timestamps)).full : '';
          const lastTime = timestamps.length > 0 ? formatIST(Math.max(...timestamps)).full : '';

          return [
            s.rank || '',
            d.displayName,
            d.externalDealerId,
            (d as any).category || 'Used Car Dealer',
            (d as any).category === 'OEM Dealer' ? 'Seller' : ((d as any).category === 'Used Car Dealer' ? 'Buyer' : 'General'),
            d.phone || '',
            d.city || '',
            d.status || 'ACTIVE',
            s.totalPoints,
            bids.length,
            bids.reduce((sum, a) => sum + a.points, 0),
            buys.length,
            buys.reduce((sum, a) => sum + a.points, 0),
            totalWonAmount,
            wonVehicles.join('; '),
            sells.length,
            sells.reduce((sum, a) => sum + a.points, 0),
            totalSoldAmount,
            attends.length,
            attends.reduce((sum, a) => sum + a.points, 0),
            inspects.length,
            inspects.reduce((sum, a) => sum + a.points, 0),
            watch.length,
            watch.reduce((sum, a) => sum + a.points, 0),
            bonus.reduce((sum, a) => sum + a.points, 0),
            acts.length,
            firstTime,
            lastTime,
            campaign.name,
          ];
        });

        const baseFilename = `supercup-dealer-leaderboard-${dateStr}`;
        return sendExportResponse(headers, rowsData, baseFilename, 'Dealer Leaderboard');
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { action } = body;

    const requestedCampaign = body.campaignId || body.campaignSlug || body.campaign;
    let campaign = null;

    if (requestedCampaign) {
      const numericId = parseInt(String(requestedCampaign), 10);
      if (!isNaN(numericId)) {
        campaign = await prisma.campaign.findUnique({ where: { id: numericId } });
      }
      if (!campaign) {
        campaign = await prisma.campaign.findUnique({ where: { slug: String(requestedCampaign) } });
      }
    }

    if (!campaign) {
      campaign = await getCurrentSuperCupCampaign();
    }

    if (!campaign) {
      campaign = await prisma.campaign.findFirst({
        where: { type: 'SUPER_CUP' },
        orderBy: { startDate: 'desc' },
      }) || await prisma.campaign.findFirst({
        orderBy: { startDate: 'desc' },
      });
    }

    if (!campaign) {
      return NextResponse.json({ error: 'No active campaign found in database' }, { status: 404 });
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
        const { dealerId, points, reason, activityType } = body;
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
            activityType: activityType || (points > 0 ? 'BUY' : 'SELL'),
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

        const validStatuses = ['UPCOMING', 'LIVE', 'COMPLETED'];
        if (status && !validStatuses.includes(status)) {
          return NextResponse.json({ error: 'Invalid match status' }, { status: 400 });
        }

        const currentMatch = await prisma.matchDay.findUnique({ where: { id: parseInt(matchId) } });
        if (!currentMatch || currentMatch.campaignId !== campaign.id) {
          return NextResponse.json({ error: 'Match does not belong to the current campaign' }, { status: 404 });
        }

        let resolvedAuctionId = auctionId !== undefined
          ? String(auctionId).trim()
          : currentMatch.auctionId || '';
        if (!resolvedAuctionId) {
          return NextResponse.json({ error: 'A TVS auction ID is required' }, { status: 400 });
        }

        // If trying to go LIVE with a placeholder, attempt TVS auto-discovery first
        if (status === 'LIVE' && /^TVSC-\d{4}-\d{2}-\d{2}$/.test(resolvedAuctionId)) {
          const provider = getTVSProvider();
          if (provider.discoverAuction) {
            const discovered = await provider.discoverAuction(currentMatch.date);
            if (discovered?.id) {
              resolvedAuctionId = discovered.id;
            }
          }
          if (/^TVSC-\d{4}-\d{2}-\d{2}$/.test(resolvedAuctionId)) {
            return NextResponse.json({
              error: 'TVS has not published this auction yet. You can enter the auction ID manually or click Auto-Fetch once published.',
            }, { status: 400 });
          }
        }

        const updateData: { status?: string; auctionId?: string } = {};
        if (status) updateData.status = status;
        if (auctionId !== undefined || resolvedAuctionId !== currentMatch.auctionId) {
          updateData.auctionId = resolvedAuctionId;
        }

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

        return NextResponse.json({ success: true, auctionId: resolvedAuctionId });
      }

      case 'autoDiscoverAuction': {
        const { matchId } = body;
        const match = matchId
          ? await prisma.matchDay.findUnique({ where: { id: parseInt(matchId) } })
          : await prisma.matchDay.findFirst({
              where: { campaignId: campaign.id, status: 'UPCOMING' },
              orderBy: { date: 'asc' },
            });

        if (!match) {
          return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }

        const provider = getTVSProvider();
        if (!provider.discoverAuction) {
          return NextResponse.json({ error: 'Auto-discovery not supported by provider' }, { status: 400 });
        }

        const discovered = await provider.discoverAuction(match.date);
        if (!discovered?.id) {
          return NextResponse.json({
            found: false,
            message: `No active or scheduled TVS auction found yet for ${match.date.toISOString().slice(0, 10)}. TVS publishes auctions 24-48h prior.`,
          });
        }

        // Update matchDay with discovered auction
        const updated = await prisma.matchDay.update({
          where: { id: match.id },
          data: {
            auctionId: discovered.id,
            ...(discovered.stage === 'live' && match.status === 'UPCOMING' ? { status: 'LIVE' } : {}),
          },
        });

        await prisma.auditLog.create({
          data: {
            adminUser: 'admin',
            action: 'AUCTION_ID_AUTO_DISCOVERED',
            targetType: 'MATCH_DAY',
            targetId: String(match.id),
            details: JSON.stringify(discovered),
            reason: `Admin auto-discovery: linked Auction #${discovered.id} (${discovered.title})`,
          },
        });

        return NextResponse.json({
          found: true,
          discovered,
          match: updated,
          message: `Successfully linked TVS Auction #${discovered.id} (${discovered.title})!`,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Admin POST error:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
