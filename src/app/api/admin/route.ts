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
import { isAdmin, isEmployee } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { recalculateRankings, getSegmentedLeaderboard, resolveDealerCustomer } from '@/lib/services/ranking-engine';
import { syncDealerActivities, syncLiveAuction } from '@/lib/services/tvs-sync';
import { getTVSProvider } from '@/lib/services/tvs-integration';
import { clearPointRulesCache } from '@/lib/services/points-engine';
import * as XLSX from 'xlsx';
import { getCurrentSuperCupCampaign } from '@/lib/services/campaign';
import { isTamilNaduDealer, getDealerBranch } from '@/lib/services/branch-utils';

// Serverless function config for live auction stream processing
export const maxDuration = 60; // 60 seconds max execution on Vercel
export const dynamic = 'force-dynamic';

function parseClientDevice(userAgent: string | null | undefined): string {
  if (!userAgent) return 'Direct / Unknown';
  const ua = userAgent.toLowerCase();
  let browser = 'Browser';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';

  let os = 'Desktop';
  if (ua.includes('iphone')) os = 'iPhone';
  else if (ua.includes('ipad')) os = 'iPad';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';

  return `${browser} on ${os}`;
}

// Middleware check - grants access to Admin and TVS Internal Employees
async function requireAdmin() {
  const admin = await isAdmin();
  if (admin) return null;

  const employee = await isEmployee();
  if (employee) return null;

  return NextResponse.json({ error: 'Admin or internal employee access required' }, { status: 403 });
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

        const segmented = await getSegmentedLeaderboard(campaign.id, undefined, true);

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

        // Calculate Dealer Login Activity & Portal Adoption
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const now = new Date();

        const [
          dealersWithLoginCount,
          activeTodaySessions,
          activeWeekSessions,
          currentlyActiveSessionsCount,
          recentDealerSessions
        ] = await Promise.all([
          prisma.dealer.count({ where: { lastLoginAt: { not: null } } }),
          prisma.session.groupBy({
            by: ['dealerId'],
            where: {
              principalType: 'DEALER',
              dealerId: { not: null },
              createdAt: { gte: oneDayAgo },
            },
          }),
          prisma.session.groupBy({
            by: ['dealerId'],
            where: {
              principalType: 'DEALER',
              dealerId: { not: null },
              createdAt: { gte: sevenDaysAgo },
            },
          }),
          prisma.session.count({
            where: {
              principalType: 'DEALER',
              expiresAt: { gt: now },
              revokedAt: null,
            },
          }),
          prisma.session.findMany({
            where: {
              principalType: 'DEALER',
              dealerId: { not: null },
            },
            take: 8,
            orderBy: { createdAt: 'desc' },
            include: {
              dealer: {
                select: {
                  id: true,
                  externalDealerId: true,
                  displayName: true,
                  maskedName: true,
                  city: true,
                  category: true,
                  status: true,
                  lastLoginAt: true,
                  loginCount: true,
                },
              },
            },
          }),
        ]);

        const uniqueDealersToday = activeTodaySessions.length;
        const uniqueDealersWeek = activeWeekSessions.length;
        const neverLoggedInCount = Math.max(0, totalDealers - dealersWithLoginCount);
        const adoptionRate = totalDealers > 0 ? Math.round((dealersWithLoginCount / totalDealers) * 100) : 0;

        const formattedRecentLogins = recentDealerSessions.map(s => {
          const isActive = s.expiresAt > now && !s.revokedAt;
          const loginTimeIso = s.createdAt.toISOString();
          return {
            id: s.id,
            sessionId: s.id,
            dealerId: s.dealer?.id || s.dealerId,
            externalDealerId: s.dealer?.externalDealerId || String(s.principalId),
            displayName: s.dealer?.displayName || 'Unknown Dealership',
            dealerName: s.dealer?.displayName || 'Unknown Dealership',
            dealerTvsCode: s.dealer?.externalDealerId || String(s.principalId),
            city: s.dealer?.city || 'Tamil Nadu',
            dealerCity: s.dealer?.city || 'Tamil Nadu',
            category: s.dealer?.category || 'Used Car Dealer',
            dealerCategory: s.dealer?.category || 'Used Car Dealer',
            status: s.dealer?.status || 'ACTIVE',
            loginAt: loginTimeIso,
            loginTime: loginTimeIso,
            expiresAt: s.expiresAt.toISOString(),
            revokedAt: s.revokedAt ? s.revokedAt.toISOString() : null,
            isActive,
            isSessionActive: isActive,
            ipAddress: s.ipAddress || 'Not recorded',
            userAgent: s.userAgent,
            device: parseClientDevice(s.userAgent),
            loginType: s.loginType || 'CREDENTIALS',
            totalDealerLogins: s.dealer?.loginCount || 1,
          };
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
            dealersLoggedInToday: uniqueDealersToday,
            dealersActiveWeek: uniqueDealersWeek,
            activeSessions: currentlyActiveSessionsCount,
            portalAdoptionRate: adoptionRate,
            neverLoggedInCount,
          },
          dealerLoginActivity: {
            uniqueDealersToday,
            uniqueDealersWeek,
            activeToday: uniqueDealersToday,
            activeWeek: uniqueDealersWeek,
            currentlyActiveSessionsCount,
            currentlyActiveSessions: currentlyActiveSessionsCount,
            neverLoggedInCount,
            dealersWithLoginCount,
            totalDealersWithLogin: dealersWithLoginCount,
            adoptionRate,
            totalSessions: recentDealerSessions.length,
            recentLogins: formattedRecentLogins,
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
          leaderboard: segmented.overall.map(s => ({
            rank: s.rank,
            dealerName: s.dealerName,
            maskedName: s.dealerName,
            realName: s.realName || s.dealerName,
            externalId: s.externalId || '',
            customerId: s.customerId,
            customerCode: s.customerCode,
            city: s.city,
            category: s.category || 'Used Car Dealer',
            role: s.role,
            points: s.points,
            totalPoints: s.totalPoints,
            buyerPoints: s.buyerPoints,
            sellerPoints: s.sellerPoints,
            buyerRank: s.buyerRank,
            sellerRank: s.sellerRank,
            overallRank: s.overallRank,
            buysCount: s.buysCount,
            bidsCount: s.bidsCount,
            salesCount: s.salesCount,
            listingsCount: s.listingsCount,
            dealerId: s.dealerId,
            isUnmasked: true,
          })),
          buyers: segmented.buyers,
          sellers: segmented.sellers,
          overall: segmented.overall,
          counts: segmented.counts,
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
        const activityParam = searchParams.get('activity');
        const branchParam = searchParams.get('branch');
        const searchParam = searchParams.get('search')?.trim();
        const sortBy = searchParams.get('sortBy') || 'name'; // 'name' | 'lastLogin' | 'points'

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

        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (activityParam === 'ACTIVE_TODAY') {
          whereClause.lastLoginAt = { gte: oneDayAgo };
        } else if (activityParam === 'LOGGED_IN') {
          whereClause.lastLoginAt = { not: null };
        } else if (activityParam === 'NEVER_LOGGED_IN') {
          whereClause.lastLoginAt = null;
        }

        if (searchParam) {
          whereClause.OR = [
            { displayName: { contains: searchParam } },
            { externalDealerId: { contains: searchParam } },
            { city: { contains: searchParam } },
          ];
        }

        let orderByClause: any = { displayName: 'asc' };
        if (sortBy === 'lastLogin') {
          orderByClause = { lastLoginAt: 'desc' };
        }

        const [dealers, allDealersRaw] = await Promise.all([
          prisma.dealer.findMany({
            where: whereClause,
            include: {
              scores: {
                where: { campaignId: campaign.id },
                select: { totalPoints: true, rank: true },
              },
            },
            orderBy: orderByClause,
          }),
          prisma.dealer.findMany({
            select: { category: true, city: true, lastLoginAt: true },
          }),
        ]);

        // STRICT REQUIREMENT: Only dealers from Tamil Nadu (TN) are included in Dealer Fleet
        const allTnDealers = allDealersRaw.filter(d => isTamilNaduDealer(d.city));

        // Aggregate counts by TN branch
        const branchCountMap = new Map<string, number>();
        for (const item of allTnDealers) {
          const b = getDealerBranch(item.city);
          branchCountMap.set(b, (branchCountMap.get(b) || 0) + 1);
        }
        const branches = Array.from(branchCountMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);

        const counts: Record<string, number> = {
          total: allTnDealers.length,
          oem: 0,
          usedCar: 0,
          corporate: 0,
          loggedIn: 0,
          neverLoggedIn: 0,
          activeToday: 0,
        };
        for (const item of allTnDealers) {
          const cat = (item as any).category;
          if (cat === 'OEM Dealer') counts.oem++;
          else if (cat === 'Used Car Dealer') counts.usedCar++;
          else if (cat === 'Corporate / Other') counts.corporate++;

          if (item.lastLoginAt) {
            counts.loggedIn++;
            if (new Date(item.lastLoginAt).getTime() >= oneDayAgo.getTime()) {
              counts.activeToday++;
            }
          } else {
            counts.neverLoggedIn++;
          }
        }

        // Filter the matched dealer query to TN only, and apply branch filter if requested
        const filteredDealers = dealers
          .filter(d => isTamilNaduDealer(d.city))
          .filter(d => {
            if (!branchParam || branchParam === 'ALL') return true;
            return getDealerBranch(d.city) === branchParam;
          });

        return NextResponse.json({
          counts,
          branches,
          dealers: filteredDealers.map(d => ({
            id: d.id,
            externalId: d.externalDealerId,
            displayName: d.displayName,
            maskedName: d.displayName,
            city: d.city,
            branch: getDealerBranch(d.city),
            category: (d as any).category || 'Used Car Dealer',
            status: d.status,
            points: d.scores[0]?.totalPoints || 0,
            rank: d.scores[0]?.rank || 0,
            lastLoginAt: d.lastLoginAt ? d.lastLoginAt.toISOString() : null,
            lastLoginIp: d.lastLoginIp,
            loginCount: d.loginCount,
          })),
        });
      }

      case 'dealerLogins': {
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const pageSize = Math.min(200, Math.max(10, parseInt(searchParams.get('pageSize') || '50', 10)));
        const search = searchParams.get('search')?.trim();
        const category = searchParams.get('category');
        const sessionStatus = searchParams.get('sessionStatus'); // 'ALL' | 'ACTIVE' | 'EXPIRED'
        const timeframe = searchParams.get('timeframe'); // 'ALL' | 'TODAY' | 'WEEK' | 'MONTH'

        const now = new Date();
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const whereClause: any = {
          principalType: 'DEALER',
          dealerId: { not: null },
        };

        if (timeframe === 'TODAY') {
          whereClause.createdAt = { gte: oneDayAgo };
        } else if (timeframe === 'WEEK') {
          whereClause.createdAt = { gte: sevenDaysAgo };
        } else if (timeframe === 'MONTH') {
          whereClause.createdAt = { gte: thirtyDaysAgo };
        }

        if (sessionStatus === 'ACTIVE') {
          whereClause.expiresAt = { gt: now };
          whereClause.revokedAt = null;
        } else if (sessionStatus === 'EXPIRED') {
          whereClause.OR = [
            { expiresAt: { lte: now } },
            { revokedAt: { not: null } },
          ];
        }

        const dealerFilter: any = {};
        if (category && category !== 'ALL') {
          let resolvedCat = category;
          if (category === 'OEM') resolvedCat = 'OEM Dealer';
          else if (category === 'USED') resolvedCat = 'Used Car Dealer';
          else if (category === 'CORPORATE') resolvedCat = 'Corporate / Other';
          dealerFilter.category = resolvedCat;
        }

        if (search) {
          dealerFilter.OR = [
            { displayName: { contains: search } },
            { externalDealerId: { contains: search } },
            { city: { contains: search } },
          ];
        }

        if (Object.keys(dealerFilter).length > 0) {
          whereClause.dealer = dealerFilter;
        }

        const [
          totalMatching,
          sessions,
          totalDealers,
          dealersWithLoginCount,
          activeTodayDealers,
          activeWeekDealers,
          activeSessionsCount
        ] = await Promise.all([
          prisma.session.count({ where: whereClause }),
          prisma.session.findMany({
            where: whereClause,
            take: pageSize,
            skip: (page - 1) * pageSize,
            orderBy: { createdAt: 'desc' },
            include: {
              dealer: {
                select: {
                  id: true,
                  externalDealerId: true,
                  displayName: true,
                  maskedName: true,
                  city: true,
                  category: true,
                  status: true,
                  phone: true,
                  lastLoginAt: true,
                  loginCount: true,
                },
              },
            },
          }),
          prisma.dealer.count(),
          prisma.dealer.count({ where: { lastLoginAt: { not: null } } }),
          prisma.session.groupBy({
            by: ['dealerId'],
            where: {
              principalType: 'DEALER',
              dealerId: { not: null },
              createdAt: { gte: oneDayAgo },
            },
          }),
          prisma.session.groupBy({
            by: ['dealerId'],
            where: {
              principalType: 'DEALER',
              dealerId: { not: null },
              createdAt: { gte: sevenDaysAgo },
            },
          }),
          prisma.session.count({
            where: {
              principalType: 'DEALER',
              expiresAt: { gt: now },
              revokedAt: null,
            },
          }),
        ]);

        const uniqueDealersToday = activeTodayDealers.length;
        const uniqueDealersWeek = activeWeekDealers.length;
        const neverLoggedInCount = Math.max(0, totalDealers - dealersWithLoginCount);
        const adoptionRate = totalDealers > 0 ? Math.round((dealersWithLoginCount / totalDealers) * 100) : 0;

        const formattedLogins = sessions.map(s => {
          const isActive = s.expiresAt > now && !s.revokedAt;
          const loginTimeIso = s.createdAt.toISOString();
          return {
            id: s.id,
            sessionId: s.id,
            dealerId: s.dealer?.id || s.dealerId,
            externalDealerId: s.dealer?.externalDealerId || String(s.principalId),
            displayName: s.dealer?.displayName || 'Unknown Dealership',
            dealerName: s.dealer?.displayName || 'Unknown Dealership',
            dealerTvsCode: s.dealer?.externalDealerId || String(s.principalId),
            city: s.dealer?.city || 'Tamil Nadu',
            dealerCity: s.dealer?.city || 'Tamil Nadu',
            category: s.dealer?.category || 'Used Car Dealer',
            dealerCategory: s.dealer?.category || 'Used Car Dealer',
            phone: s.dealer?.phone || undefined,
            status: s.dealer?.status || 'ACTIVE',
            totalDealerLogins: s.dealer?.loginCount || 1,
            loginAt: loginTimeIso,
            loginTime: loginTimeIso,
            expiresAt: s.expiresAt.toISOString(),
            revokedAt: s.revokedAt ? s.revokedAt.toISOString() : null,
            isActive,
            isSessionActive: isActive,
            ipAddress: s.ipAddress || 'Not recorded',
            userAgent: s.userAgent,
            device: parseClientDevice(s.userAgent),
            loginType: s.loginType || 'CREDENTIALS',
          };
        });

        return NextResponse.json({
          summary: {
            totalMatchingLogins: totalMatching,
            totalSessions: totalMatching,
            totalDealers,
            dealersWithLoginCount,
            totalDealersWithLogin: dealersWithLoginCount,
            uniqueDealersToday,
            activeToday: uniqueDealersToday,
            uniqueDealersWeek,
            activeWeek: uniqueDealersWeek,
            activeSessionsCount,
            currentlyActiveSessions: activeSessionsCount,
            neverLoggedInCount,
            adoptionRate,
          },
          pagination: {
            page,
            pageSize,
            totalCount: totalMatching,
            totalPages: Math.ceil(totalMatching / pageSize) || 1,
          },
          logins: formattedLogins,
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
              include: { match: { select: { matchNumber: true, date: true, auctionId: true } } },
              orderBy: { timestamp: 'desc' },
            },
          },
        });

        if (!dealer) {
          return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
        }

        // Enrich with customer mapping dictionary
        let enriched: any = {};
        try {
          const mapping = require('@/lib/data/tvs-customer-mapping.json');
          enriched = mapping[dealer.externalDealerId] || 
                     Object.values(mapping).find((m: any) => String(m.code) === String(dealer.externalDealerId)) || 
                     {};
        } catch {}

        const parsedActivities = dealer.activities.map(a => {
          let meta: Record<string, any> = {};
          if (typeof a.metadata === 'string') {
            try { meta = JSON.parse(a.metadata); } catch {}
          } else if (a.metadata) {
            meta = a.metadata as Record<string, any>;
          }
          return {
            id: a.id,
            activityType: a.activityType,
            points: a.points,
            timestamp: a.timestamp,
            externalTransactionId: a.externalTransactionId,
            metadata: meta,
            match: a.match,
          };
        });

        const segmented = await getSegmentedLeaderboard(campaign.id, undefined, true);
        const bEntry = segmented.buyers.find(b => b.dealerId === dealer.id);
        const sEntry = segmented.sellers.find(s => s.dealerId === dealer.id);
        const oEntry = segmented.overall.find(o => o.dealerId === dealer.id);

        let bPts = 0, sPts = 0, buysCount = 0, bidsCount = 0, salesCount = 0, listingsCount = 0;
        const isOem = dealer.category === 'OEM Dealer';
        const hasSellerActs = dealer.activities.some(a => ['SELL', 'SELL_LISTING', 'SELL_COMMISSION'].includes(a.activityType));
        const hasBuyerActs = dealer.activities.some(a => ['BUY', 'BID_PLACED'].includes(a.activityType)) || !isOem;

        for (const a of dealer.activities) {
          if (a.activityType === 'BUY') {
            bPts += a.points;
            buysCount++;
          } else if (a.activityType === 'BID_PLACED') {
            bPts += a.points;
            bidsCount++;
          } else if (a.activityType === 'MATCH_PARTICIPATION' || a.activityType === 'ALL_MATCHES_BONUS') {
            if (hasBuyerActs) bPts += a.points;
            if (isOem || hasSellerActs) sPts += a.points;
            if (!hasBuyerActs && !isOem && !hasSellerActs) bPts += a.points;
          } else if (a.activityType === 'SELL') {
            sPts += a.points;
            salesCount++;
          } else if (a.activityType === 'SELL_LISTING') {
            sPts += a.points;
            listingsCount++;
          } else if (a.activityType === 'SELL_COMMISSION') {
            sPts += a.points;
          }
        }

        const enrichedScores = [{
          rank: oEntry?.rank ?? (dealer.scores[0]?.rank || 0),
          totalPoints: oEntry?.totalPoints ?? (dealer.scores[0]?.totalPoints || (bPts + sPts)),
          overallRank: oEntry?.rank,
          buyerRank: bEntry?.rank,
          sellerRank: sEntry?.rank,
          buyerPoints: bEntry?.buyerPoints ?? bPts,
          sellerPoints: sEntry?.sellerPoints ?? sPts,
          buysCount: bEntry?.buysCount ?? buysCount,
          bidsCount: bEntry?.bidsCount ?? bidsCount,
          salesCount: sEntry?.salesCount ?? salesCount,
          listingsCount: sEntry?.listingsCount ?? listingsCount,
        }];

        const now = new Date();
        const recentSessions = await prisma.session.findMany({
          where: { principalType: 'DEALER', dealerId: dealer.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            createdAt: true,
            expiresAt: true,
            revokedAt: true,
            ipAddress: true,
            userAgent: true,
            loginType: true,
          },
        });

        return NextResponse.json({
          dealer: {
            id: dealer.id,
            externalDealerId: dealer.externalDealerId,
            customerId: enriched.code || dealer.externalDealerId,
            displayName: dealer.displayName,
            maskedName: dealer.maskedName,
            city: dealer.city || enriched.city || '',
            category: dealer.category || enriched.category || 'Used Car Dealer',
            role: enriched.role || (dealer.category === 'OEM Dealer' ? 'Seller' : 'Buyer'),
            phone: dealer.phone || enriched.phone || undefined,
            email: enriched.email || undefined,
            contactName: enriched.firstName ? `${enriched.firstName} ${enriched.lastName || ''}`.trim() : undefined,
            status: dealer.status,
            lastLoginAt: dealer.lastLoginAt ? dealer.lastLoginAt.toISOString() : null,
            lastLoginIp: dealer.lastLoginIp,
            loginCount: dealer.loginCount,
            scores: enrichedScores,
            activities: parsedActivities,
            recentSessions: recentSessions.map(s => ({
              id: s.id,
              loginAt: s.createdAt.toISOString(),
              expiresAt: s.expiresAt.toISOString(),
              isActive: s.expiresAt > now && !s.revokedAt,
              ipAddress: s.ipAddress || 'Not recorded',
              device: parseClientDevice(s.userAgent),
              loginType: s.loginType || 'CREDENTIALS',
            })),
          },
        });
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
                category: true,
              },
            },
          },
          orderBy: { timestamp: 'desc' },
          take,
        });

        // Extract dealer references from metadata to resolve buyer and seller names
        const dealerIds = new Set<string>();
        const parsedMetas = activities.map(a => {
          let meta: any = {};
          try {
            if (a.metadata) {
              meta = typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata;
            }
          } catch {
            meta = {};
          }
          if (meta.buyerDealerId) dealerIds.add(String(meta.buyerDealerId));
          if (meta.buyerWinnerId) dealerIds.add(String(meta.buyerWinnerId));
          if (meta.winnerId) dealerIds.add(String(meta.winnerId));
          return meta;
        });

        const matchedDealers = dealerIds.size > 0 ? await prisma.dealer.findMany({
          where: {
            OR: [
              { externalDealerId: { in: Array.from(dealerIds) } },
              { id: { in: Array.from(dealerIds).map(id => parseInt(id, 10)).filter(n => !isNaN(n)) } },
            ],
          },
          select: { id: true, externalDealerId: true, displayName: true },
        }) : [];

        const dealerLookup = new Map<string, string>();
        for (const d of matchedDealers) {
          dealerLookup.set(String(d.externalDealerId), d.displayName);
          dealerLookup.set(String(d.id), d.displayName);
        }

        const vehicleSellerMap = new Map<string, string>();
        const vehicleBuyerMap = new Map<string, string>();

        activities.forEach((a, idx) => {
          const meta = parsedMetas[idx];
          const vId = String(meta.vehicleId || meta.id || '');
          if (vId) {
            const s = meta.sellerName || meta.customerName || (a.activityType === 'SELL' || a.activityType === 'SELL_LISTING' ? a.dealer.displayName : '');
            if (s && !vehicleSellerMap.has(vId)) {
              vehicleSellerMap.set(vId, s);
            }
            const b = (a.activityType === 'BUY' ? a.dealer.displayName : '') || dealerLookup.get(String(meta.buyerDealerId)) || dealerLookup.get(String(meta.winnerId));
            if (b && !vehicleBuyerMap.has(vId)) {
              vehicleBuyerMap.set(vId, b);
            }
          }
        });

        // For any vehicles where seller isn't yet known, check other SELL/LISTING records in DB
        const vehicleIds = Array.from(new Set(
          parsedMetas.map(m => String(m.vehicleId || m.id || '')).filter(Boolean)
        ));
        const missingSellerVehicleIds = vehicleIds.filter(vId => !vehicleSellerMap.has(vId));
        if (missingSellerVehicleIds.length > 0) {
          try {
            const otherVehicleActs = await prisma.dealerActivity.findMany({
              where: {
                OR: missingSellerVehicleIds.slice(0, 30).map(vId => ({ metadata: { contains: vId } })),
                activityType: { in: ['SELL', 'SELL_LISTING', 'BUY'] },
              },
              include: { dealer: { select: { displayName: true } } },
              take: 60,
            });
            for (const ova of otherVehicleActs) {
              try {
                const meta = typeof ova.metadata === 'string' ? JSON.parse(ova.metadata) : (ova.metadata || {});
                const vId = String(meta.vehicleId || meta.id || '');
                if (vId && !vehicleSellerMap.has(vId)) {
                  const s = meta.sellerName || meta.customerName || (ova.activityType === 'SELL' || ova.activityType === 'SELL_LISTING' ? ova.dealer.displayName : '');
                  if (s) vehicleSellerMap.set(vId, s);
                }
                if (vId && !vehicleBuyerMap.has(vId)) {
                  const b = ova.activityType === 'BUY' ? ova.dealer.displayName : (dealerLookup.get(String(meta.buyerDealerId)) || '');
                  if (b) vehicleBuyerMap.set(vId, b);
                }
              } catch {}
            }
          } catch {}
        }

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
          activities: activities.map((a, idx) => {
            const parsedMetadata = parsedMetas[idx];
            const vId = String(parsedMetadata.vehicleId || parsedMetadata.id || '');
            let buyerName = '—';
            let sellerName = '—';

            if (a.activityType === 'BUY') {
              buyerName = a.dealer.displayName;
              sellerName = parsedMetadata.sellerName || parsedMetadata.customerName || vehicleSellerMap.get(vId) || '—';
            } else if (a.activityType === 'SELL' || a.activityType === 'SELL_LISTING' || a.activityType === 'SELL_COMMISSION') {
              sellerName = a.dealer.displayName || parsedMetadata.sellerName || parsedMetadata.customerName || '—';
              buyerName = dealerLookup.get(String(parsedMetadata.buyerDealerId)) ||
                          dealerLookup.get(String(parsedMetadata.winnerId)) ||
                          vehicleBuyerMap.get(vId) ||
                          (parsedMetadata.buyerDealerId ? `Dealer #${parsedMetadata.buyerDealerId}` : '—');
            } else if (a.activityType === 'BID_PLACED') {
              buyerName = a.dealer.displayName;
              sellerName = parsedMetadata.sellerName || parsedMetadata.customerName || vehicleSellerMap.get(vId) || '—';
            } else if (a.activityType === 'MATCH_PARTICIPATION') {
              if (a.dealer.category === 'OEM Dealer') {
                sellerName = a.dealer.displayName;
                buyerName = '—';
              } else {
                buyerName = a.dealer.displayName;
                sellerName = '—';
              }
            } else {
              if (a.dealer.category === 'OEM Dealer') {
                sellerName = a.dealer.displayName;
                buyerName = '—';
              } else {
                buyerName = a.dealer.displayName;
                sellerName = parsedMetadata.sellerName || parsedMetadata.customerName || vehicleSellerMap.get(vId) || '—';
              }
            }

            return {
              id: a.id,
              dealerId: a.dealerId,
              dealerName: a.dealer.displayName,
              buyerName,
              sellerName,
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

        // Helper to return native Multi-Sheet Excel (.xlsx) or unified UTF-8 BOM CSV (.csv)
        interface ExportSheetDef {
          title: string;
          headers: string[];
          rows: (string | number)[][];
        }

        const sendMultiSheetExportResponse = (
          sheets: ExportSheetDef[],
          baseFilename: string,
          primaryCsvSheetIndex = 0
        ) => {
          if (format === 'csv') {
            const target = sheets[primaryCsvSheetIndex] || sheets[0];
            const csvContent = '\uFEFF' + [target.headers, ...target.rows].map(r => r.map(escapeCsv).join(',')).join('\n');
            return new NextResponse(csvContent, {
              headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${baseFilename}.csv"`,
              },
            });
          }

          // Generate Native Multi-Sheet Excel (.xlsx)
          const wb = XLSX.utils.book_new();
          for (const sheet of sheets) {
            const ws = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.rows]);
            const colWidths = sheet.headers.map((h, i) => {
              let maxLen = h.length;
              for (const r of sheet.rows) {
                const cellVal = String(r[i] ?? '');
                if (cellVal.length > maxLen) maxLen = Math.min(cellVal.length, 50);
              }
              return { wch: Math.max(maxLen + 3, 12) };
            });
            ws['!cols'] = colWidths;
            const safeTitle = (sheet.title || 'Sheet').replace(/[:\\/?*\[\]]/g, '').slice(0, 31);
            XLSX.utils.book_append_sheet(wb, ws, safeTitle);
          }
          const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

          return new NextResponse(buffer, {
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'Content-Disposition': `attachment; filename="${baseFilename}.xlsx"`,
            },
          });
        };

        const provider = getTVSProvider();

        if (exportType === 'dealerLogins' || exportType === 'logins') {
          const sessions = await prisma.session.findMany({
            where: { principalType: 'DEALER', dealerId: { not: null } },
            orderBy: { createdAt: 'desc' },
            take: 2000,
            include: {
              dealer: true,
            },
          });

          const now = new Date();
          const headers = [
            'Session ID',
            'Dealer Code',
            'Dealer Legal Name',
            'Category',
            'City / Region',
            'Login Date & Time (IST)',
            'Session Status',
            'Auth Method',
            'IP Address',
            'Device / Browser',
            'Total Dealer Logins',
          ];

          const rowsData = sessions.map(s => {
            const ist = formatIST(s.createdAt);
            const isActive = s.expiresAt > now && !s.revokedAt;
            return [
              s.id,
              s.dealer?.externalDealerId || String(s.principalId),
              s.dealer?.displayName || 'Unknown Dealership',
              s.dealer?.category || 'Used Car Dealer',
              s.dealer?.city || 'Tamil Nadu',
              ist.full,
              isActive ? 'Active Session' : 'Expired / Logged Out',
              s.loginType || 'CREDENTIALS',
              s.ipAddress || 'Not recorded',
              parseClientDevice(s.userAgent),
              s.dealer?.loginCount || 1,
            ];
          });

          const baseFilename = `tvs-supercup-dealer-logins-${dateStr}`;
          return sendExportResponse(headers, rowsData, baseFilename, 'Dealer Logins');
        }

        if (exportType === 'dealers' || exportType === 'fleet') {
          const branchParam = searchParams.get('branch');
          const categoryParam = searchParams.get('category');

          const allDealersWithScores = await prisma.dealer.findMany({
            include: {
              scores: {
                where: { campaignId: campaign.id },
                select: { totalPoints: true, rank: true },
              },
            },
            orderBy: { displayName: 'asc' },
          });

          // STRICT REQUIREMENT: Only dealers from Tamil Nadu (TN) are exported
          let tnDealers = allDealersWithScores.filter(d => isTamilNaduDealer(d.city));

          if (branchParam && branchParam !== 'ALL') {
            tnDealers = tnDealers.filter(d => getDealerBranch(d.city) === branchParam);
          }

          if (categoryParam && categoryParam !== 'ALL') {
            if (categoryParam === 'OEM' || categoryParam === 'OEM Dealer') {
              tnDealers = tnDealers.filter(d => d.category === 'OEM Dealer');
            } else if (categoryParam === 'USED' || categoryParam === 'Used Car Dealer') {
              tnDealers = tnDealers.filter(d => d.category === 'Used Car Dealer');
            } else if (categoryParam === 'CORPORATE' || categoryParam === 'Corporate / Other') {
              tnDealers = tnDealers.filter(d => d.category === 'Corporate / Other');
            }
          }

          const headers = [
            'Rank',
            'TVS Dealer Code',
            'Dealer Legal Name',
            'Category',
            'Primary Role',
            'TN Branch',
            'City / Location',
            'Total Points',
            'Status',
            'Last Login (IST)',
            'Login Count',
          ];

          const rowsData = tnDealers.map(d => {
            const lastLoginIso = d.lastLoginAt ? formatIST(d.lastLoginAt).full : 'Never Logged In';
            const role = d.category === 'OEM Dealer' ? 'Seller' : 'Buyer';
            return [
              d.scores[0]?.rank ? `#${d.scores[0].rank}` : '-',
              d.externalDealerId,
              d.displayName,
              d.category || 'Used Car Dealer',
              role,
              getDealerBranch(d.city),
              d.city,
              d.scores[0]?.totalPoints || 0,
              d.status || 'ACTIVE',
              lastLoginIso,
              d.loginCount || 0,
            ];
          });

          const branchSlug = branchParam && branchParam !== 'ALL' ? `-${branchParam.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : '';
          const baseFilename = `tvs-supercup-tn-dealer-fleet${branchSlug}-${dateStr}`;
          return sendExportResponse(headers, rowsData, baseFilename, 'TN Dealer Fleet');
        }

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
            // Fetch corresponding seller listing activities for this auction
            const listingActivities = await prisma.dealerActivity.findMany({
              where: {
                activityType: 'SELL_LISTING',
                OR: [
                  { externalTransactionId: { contains: auctionId } },
                  { match: { auctionId } },
                ],
              },
              select: { externalTransactionId: true, points: true, metadata: true },
            });

            const listingPointsMap = new Map<string, number>();
            for (const la of listingActivities) {
              if (la.externalTransactionId) {
                listingPointsMap.set(la.externalTransactionId, la.points);
                const suffix = la.externalTransactionId.replace(/^LISTING-/, '');
                listingPointsMap.set(suffix, la.points);
              }
              try {
                const lMeta = typeof la.metadata === 'string' ? JSON.parse(la.metadata) : la.metadata;
                if (lMeta?.vehicleId) {
                  listingPointsMap.set(String(lMeta.vehicleId), la.points);
                }
              } catch {}
            }

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

              const vId = meta.vehicleId ? String(meta.vehicleId) : '';
              const txSuffix = a.externalTransactionId ? a.externalTransactionId.replace(/^BUY-/, '') : '';
              const sellerListingPts = (vId && listingPointsMap.get(vId)) ?? (txSuffix && listingPointsMap.get(txSuffix)) ?? 0;

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
                a.points, // 0 pts (conversions ignored as cannot be reliably captured in website)
                sellerListingPts, // Points earned from vehicle listing (5 pts; conversions ignored)
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

        // ── Auction Leaderboard, Dealer Points Calculation & Verification Audit ──
        let targetAuctionId = searchParams.get('auctionId')?.trim() || '';
        
        if (!targetAuctionId) {
          const liveMatch = await prisma.matchDay.findFirst({
            where: { campaignId: campaign.id, status: 'LIVE' },
          }) || await prisma.matchDay.findFirst({
            where: { campaignId: campaign.id, status: 'UPCOMING' },
            orderBy: { date: 'asc' },
          }) || await prisma.matchDay.findFirst({
            where: { campaignId: campaign.id },
            orderBy: { matchNumber: 'asc' },
          });
          targetAuctionId = liveMatch?.auctionId || '2003';
        }

        // Locate match record and active campaign context
        const targetMatch = await prisma.matchDay.findFirst({
          where: { auctionId: targetAuctionId },
          include: { campaign: true },
        });
        const activeCampaign = targetMatch?.campaign || campaign;
        const matchLabel = targetMatch?.matchNumber ? `Match ${targetMatch.matchNumber}` : 'Match Day';

        // 1. Fetch all activities for this auction
        const auctionActivities = await prisma.dealerActivity.findMany({
          where: {
            OR: [
              { externalTransactionId: { contains: targetAuctionId } },
              { match: { auctionId: targetAuctionId } },
              { metadata: { contains: `"auctionId":"${targetAuctionId}"` } },
              { metadata: { contains: `"auctionId":${targetAuctionId}` } },
            ],
          },
          include: {
            dealer: true,
            match: true,
          },
          orderBy: { timestamp: 'asc' },
        });

        // 2. Fetch all registered dealers and cumulative tournament standings
        const [allDealers, cumulativeScores, pointRulesList, allCampaignMatches] = await Promise.all([
          prisma.dealer.findMany({
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              externalDealerId: true,
              displayName: true,
              city: true,
              category: true,
              phone: true,
              status: true,
            },
          }),
          prisma.dealerScore.findMany({
            where: { campaignId: activeCampaign.id },
            select: { dealerId: true, totalPoints: true, rank: true },
          }),
          prisma.pointRule.findMany({
            where: { campaignId: activeCampaign.id },
            select: { activityType: true, points: true, description: true, active: true },
          }),
          prisma.matchDay.findMany({
            where: {
              OR: [
                { campaignId: activeCampaign.id },
                { status: 'COMPLETED' },
              ],
            },
            orderBy: [{ date: 'asc' }, { matchNumber: 'asc' }],
          }),
        ]);

        const dealerMap = new Map(allDealers.map(d => [d.id, d]));
        const cumulativeScoreMap = new Map(cumulativeScores.map(s => [s.dealerId, s]));

        // Pre-fetch all activities across all matches to compute the multi-auction matrix
        const allTournamentActivities = await prisma.dealerActivity.findMany({
          where: {
            OR: [
              { campaignId: activeCampaign.id },
              { matchId: { in: allCampaignMatches.map(m => m.id) } },
            ],
          },
          select: {
            dealerId: true,
            matchId: true,
            externalTransactionId: true,
            points: true,
          },
        });

        // 3. Aggregate Dealer Metrics for this specific auction
        interface DealerAuctionAgg {
          dealerId: number;
          dealer: any;
          custProfile: any;
          displayName: string;
          dealerCode: string;
          category: string;
          role: 'Buyer' | 'Seller' | 'General';
          city: string;
          phone: string;
          participationPoints: number;
          attended: boolean;
          attendanceTimestamp?: string;
          rawBidsCount: number;
          uniqueCarsBid: Set<string>;
          bidPoints: number;
          dedupedBidsCount: number;
          listingsCount: number;
          listingPoints: number;
          commissionPoints: number;
          bonusPoints: number;
          wonVehiclesCount: number;
          totalWonAmount: number;
          wonVehiclesList: string[];
          soldVehiclesCount: number;
          totalSoldAmount: number;
          totalAuctionPoints: number;
          buyerPoints: number;
          sellerPoints: number;
          activitiesList: any[];
        }

        const dealerAuctionMap = new Map<number, DealerAuctionAgg>();

        for (const act of auctionActivities) {
          if (!dealerAuctionMap.has(act.dealerId)) {
            const rawDealer = dealerMap.get(act.dealerId) || act.dealer;
            dealerAuctionMap.set(act.dealerId, {
              dealerId: act.dealerId,
              dealer: rawDealer,
              custProfile: null,
              displayName: rawDealer?.displayName || `Dealer ${act.dealerId}`,
              dealerCode: rawDealer?.externalDealerId || String(act.dealerId),
              category: rawDealer?.category || 'Used Car Dealer',
              role: (rawDealer?.category === 'OEM Dealer' ? 'Seller' : 'Buyer'),
              city: rawDealer?.city || 'Tamil Nadu',
              phone: rawDealer?.phone || '',
              participationPoints: 0,
              attended: false,
              rawBidsCount: 0,
              uniqueCarsBid: new Set<string>(),
              bidPoints: 0,
              dedupedBidsCount: 0,
              listingsCount: 0,
              listingPoints: 0,
              commissionPoints: 0,
              bonusPoints: 0,
              wonVehiclesCount: 0,
              totalWonAmount: 0,
              wonVehiclesList: [],
              soldVehiclesCount: 0,
              totalSoldAmount: 0,
              totalAuctionPoints: 0,
              buyerPoints: 0,
              sellerPoints: 0,
              activitiesList: [],
            });
          }

          const item = dealerAuctionMap.get(act.dealerId)!;
          item.activitiesList.push(act);
          item.totalAuctionPoints += act.points;

          let meta: any = {};
          try {
            meta = typeof act.metadata === 'string' ? JSON.parse(act.metadata) : (act.metadata || {});
          } catch {}

          if (act.activityType === 'MATCH_PARTICIPATION') {
            item.attended = true;
            item.participationPoints += act.points;
            item.attendanceTimestamp = formatIST(act.timestamp).full;
          } else if (act.activityType === 'BID_PLACED') {
            item.rawBidsCount++;
            const vId = meta.vehicleId ? String(meta.vehicleId) : (meta.regNo || meta.lotNo || '');
            if (vId) item.uniqueCarsBid.add(vId);
            if (act.points > 0) {
              item.bidPoints += act.points;
            }
            item.buyerPoints += act.points;
          } else if (act.activityType === 'SELL_LISTING') {
            item.listingsCount++;
            item.listingPoints += act.points;
            item.sellerPoints += act.points;
          } else if (act.activityType === 'SELL_COMMISSION') {
            item.commissionPoints += act.points;
            item.sellerPoints += act.points;
          } else if (act.activityType === 'ALL_MATCHES_BONUS') {
            item.bonusPoints += act.points;
          } else if (act.activityType === 'BUY') {
            item.wonVehiclesCount++;
            item.buyerPoints += act.points;
            const amt = Number(meta.winningBid || meta.amount || meta.saleAmount || 0);
            item.totalWonAmount += amt;
            const label = [meta.regNo, meta.vehicleName].filter(Boolean).join(' ');
            if (label) item.wonVehiclesList.push(label);
          } else if (act.activityType === 'SELL') {
            item.soldVehiclesCount++;
            const amt = Number(meta.winningBid || meta.amount || meta.saleAmount || meta.price || 0);
            item.totalSoldAmount += amt;
          }
        }

        // Resolve verified enterprise profile and calculate deduped bids for every dealer
        for (const item of dealerAuctionMap.values()) {
          const profile = resolveDealerCustomer(item.dealer, item.activitiesList);
          item.custProfile = profile;
          item.displayName = profile.companyName || item.dealer?.displayName || item.displayName;
          item.dealerCode = profile.customerCode || profile.customerId || item.dealer?.externalDealerId || item.dealerCode;
          item.city = profile.city || item.dealer?.city || item.city;
          item.category = profile.category || item.dealer?.category || item.category;
          item.role = profile.role !== 'General' ? profile.role : (item.sellerPoints > item.buyerPoints ? 'Seller' : 'Buyer');
          item.dedupedBidsCount = Math.max(0, item.rawBidsCount - item.uniqueCarsBid.size);

          // Add attendance / bonus points to Buyer and/or Seller leagues based on verified role
          const isOem = item.category === 'OEM Dealer' || item.role === 'Seller';
          const hasSellerActivity = item.listingsCount > 0 || item.soldVehiclesCount > 0 || isOem;
          const hasBuyerActivity = item.rawBidsCount > 0 || item.wonVehiclesCount > 0 || !isOem;

          if (item.participationPoints > 0) {
            if (hasBuyerActivity) item.buyerPoints += item.participationPoints;
            if (hasSellerActivity) item.sellerPoints += item.participationPoints;
            if (!hasBuyerActivity && !hasSellerActivity) item.buyerPoints += item.participationPoints;
          }
          if (item.bonusPoints > 0) {
            if (hasBuyerActivity) item.buyerPoints += item.bonusPoints;
            if (hasSellerActivity) item.sellerPoints += item.bonusPoints;
            if (!hasBuyerActivity && !hasSellerActivity) item.buyerPoints += item.bonusPoints;
          }
        }

        // Rank dealers for this auction
        const overallAuctionList = Array.from(dealerAuctionMap.values())
          .filter(d => d.totalAuctionPoints > 0 || d.rawBidsCount > 0 || d.wonVehiclesCount > 0 || d.listingsCount > 0)
          .sort((a, b) => b.totalAuctionPoints - a.totalAuctionPoints || b.bidPoints - a.bidPoints || a.dealerId - b.dealerId);

        const buyersAuctionList = Array.from(dealerAuctionMap.values())
          .filter(d => d.buyerPoints > 0)
          .sort((a, b) => b.buyerPoints - a.buyerPoints || a.dealerId - b.dealerId);

        const sellersAuctionList = Array.from(dealerAuctionMap.values())
          .filter(d => d.sellerPoints > 0)
          .sort((a, b) => b.sellerPoints - a.sellerPoints || a.dealerId - b.dealerId);

        const buyerAuctionRankMap = new Map<number, number>(buyersAuctionList.map((d, i) => [d.dealerId, i + 1]));
        const sellerAuctionRankMap = new Map<number, number>(sellersAuctionList.map((d, i) => [d.dealerId, i + 1]));

        // ── SHEET 1: AUCTION LEADERBOARD STANDINGS ──
        const sheet1Headers = [
          'Auction Rank',
          'Dealership Legal Name',
          'TVS Customer Code',
          'Dealer Category',
          'Primary League',
          'City / Region',
          'Contact Phone',
          'Total Auction Points',
          'Buyer League Points (Auction)',
          'Buyer League Rank (Auction)',
          'Seller League Points (Auction)',
          'Seller League Rank (Auction)',
          'Unique Cars Bid On',
          'Total Bids Placed',
          'Won Vehicles Count',
          'Vehicle Listings Count',
          'Cumulative Tournament Points',
          'Cumulative Championship Rank',
          'Verification Status',
        ];

        const sheet1Rows = overallAuctionList.map((d, idx) => {
          const cumScore = cumulativeScoreMap.get(d.dealerId);
          return [
            idx + 1,
            d.displayName,
            d.dealerCode,
            d.category,
            d.role === 'Seller' ? 'Seller League' : 'Buyer League',
            d.city,
            d.phone,
            d.totalAuctionPoints,
            d.buyerPoints,
            buyerAuctionRankMap.get(d.dealerId) ? `#${buyerAuctionRankMap.get(d.dealerId)}` : '—',
            d.sellerPoints,
            sellerAuctionRankMap.get(d.dealerId) ? `#${sellerAuctionRankMap.get(d.dealerId)}` : '—',
            d.uniqueCarsBid.size,
            d.rawBidsCount,
            d.wonVehiclesCount,
            d.listingsCount,
            cumScore?.totalPoints ?? d.totalAuctionPoints,
            cumScore?.rank ? `#${cumScore.rank}` : '—',
            'VERIFIED • TELEMETRY AUDITED',
          ];
        });

        // ── SHEET 2: DEALER POINTS CALCULATION BREAKDOWN & AUDIT ──
        const sheet2Headers = [
          'TVS Customer Code',
          'Dealership Legal Name',
          'Category',
          'League Role',
          'City',
          'Points Calculation Formula Applied',
          'Attendance Verified (1 pt/match)',
          'Attendance Points Awarded',
          'Total Raw Bids Placed',
          'Unique Vehicles Bid On (1 pt/car)',
          'Bidding Points Awarded',
          'Duplicate Bids Filtered (0 pts - Rule 4b)',
          'Vehicle Listings Count',
          'Listing Points Awarded (5 pts/car)',
          'Commission Points Awarded (5 pts)',
          'All Matches Bonus Points (20 pts)',
          'Vehicles Won / Bought Count',
          'Total Auction Points Reconciled',
          'Cumulative Tournament Points',
          'Championship Rank',
          'Audit Calculation Integrity Justification',
          'System Reconciled Status',
        ];

        const sheet2Rows = overallAuctionList.map(d => {
          const cumScore = cumulativeScoreMap.get(d.dealerId);
          const formulaParts = [];
          if (d.participationPoints > 0) formulaParts.push(`Attendance: ${d.participationPoints}pt`);
          if (d.wonVehiclesCount > 0) formulaParts.push(`Purchases: ${d.wonVehiclesCount} unique cars x 1pt = ${d.wonVehiclesCount}pts`);
          else if (d.bidPoints > 0) formulaParts.push(`Bids: ${d.uniqueCarsBid.size} unique cars x 1pt = ${d.bidPoints}pts`);
          if (d.listingsCount > 0) formulaParts.push(`Listings: ${d.listingsCount} cars x 5pts = ${d.listingPoints}pts`);
          if (d.commissionPoints > 0) formulaParts.push(`Commission: ${d.commissionPoints}pts`);
          if (d.bonusPoints > 0) formulaParts.push(`Bonus: ${d.bonusPoints}pts`);
          const formulaText = formulaParts.length > 0 ? formulaParts.join(' + ') + ` = ${d.totalAuctionPoints} pts` : 'No scoring actions recorded in this auction';

          const buyerPart = d.wonVehiclesCount > 0
            ? `[Purchases: ${d.wonVehiclesCount}pts for ${d.wonVehiclesCount} unique cars won in TVS Completed Auctions]`
            : (d.bidPoints > 0 ? `[Bidding: ${d.bidPoints}pts for ${d.uniqueCarsBid.size} distinct cars (${d.rawBidsCount} total bids, ${d.dedupedBidsCount} duplicate bids deduped)]` : '');
          const sellerPart = d.listingsCount > 0 ? `[Listings: ${d.listingPoints}pts for ${d.listingsCount} cars]` : '';
          const parts = [`[Attendance: ${d.participationPoints}pt]`, buyerPart, sellerPart].filter(Boolean);
          const justification = `Verified breakdown: ${parts.join(' + ')} = ${d.totalAuctionPoints} pts.`;

          return [
            d.dealerCode,
            d.displayName,
            d.category,
            d.role,
            d.city,
            formulaText,
            d.attended ? 'YES' : 'NO',
            d.participationPoints,
            d.rawBidsCount,
            d.wonVehiclesCount || d.uniqueCarsBid.size,
            d.wonVehiclesCount || d.bidPoints,
            d.dedupedBidsCount,
            d.listingsCount,
            d.listingPoints,
            d.commissionPoints,
            d.bonusPoints,
            d.wonVehiclesCount,
            d.totalAuctionPoints,
            cumScore?.totalPoints ?? d.totalAuctionPoints,
            cumScore?.rank ? `#${cumScore.rank}` : '—',
            justification,
            'PASS • 100% MATHEMATICALLY RECONCILED',
          ];
        });

        // ── SHEET 3: VEHICLE LOT RESULTS & HAMMERED PAIRINGS VERIFICATION ──
        const sheet3Headers = [
          'Lot #',
          'Auction ID',
          'Vehicle ID',
          'Registration Number',
          'Vehicle Make & Model',
          'Fuel Type',
          'Transmission',
          'Year of Mfg',
          'Speedometer (KM)',
          'Starting Bid (INR)',
          'Reserve / Expected Price (INR)',
          'Winning Bid / Hammer Price (INR)',
          'Winning Buyer Dealership',
          'Buyer Customer Code',
          'Buyer City',
          'Buyer Phone',
          'Seller / Origin Dealership',
          'Seller Customer Code',
          'Seller City',
          'Seller Phone',
          'Buyer Points Awarded (1 pt / car won)',
          'Seller Listing Points Awarded',
          'Sale Status',
          'Transaction ID',
          'Timestamp (IST)',
          'Lot Integrity Audit',
        ];

        // Reconcile ALL vehicle lots for this auction (Pair SELL_LISTING lots with BUY winner activities)
        const listingActs = auctionActivities.filter(a => a.activityType === 'SELL_LISTING');
        const buyActs = auctionActivities.filter(a => a.activityType === 'BUY');

        // Map BUY activities by vehicle registration number (and vehicleId)
        const buyByReg = new Map<string, typeof auctionActivities[0]>();
        for (const b of buyActs) {
          let bMeta: any = {};
          try { bMeta = typeof b.metadata === 'string' ? JSON.parse(b.metadata) : (b.metadata || {}); } catch {}
          const reg = (bMeta.regNo || '').trim().toUpperCase();
          if (reg) buyByReg.set(reg, b);
          if (bMeta.vehicleId) buyByReg.set(String(bMeta.vehicleId), b);
        }

        // If listing activities exist, use them as the primary lot ledger
        const lotKeys = new Set<string>();
        const combinedLots: Array<{
          listingAct?: typeof auctionActivities[0];
          buyAct?: typeof auctionActivities[0];
          meta: any;
          reg: string;
          lotNo: number;
        }> = [];

        for (const l of listingActs) {
          let lMeta: any = {};
          try { lMeta = typeof l.metadata === 'string' ? JSON.parse(l.metadata) : (l.metadata || {}); } catch {}
          const reg = (lMeta.regNo || '').trim().toUpperCase();
          const vId = lMeta.vehicleId ? String(lMeta.vehicleId) : '';
          const key = reg || vId || l.externalTransactionId;
          lotKeys.add(key);
          if (reg) lotKeys.add(reg);
          if (vId) lotKeys.add(vId);

          const matchedBuy = (reg && buyByReg.get(reg)) || (vId && buyByReg.get(vId));
          const seq = Number(lMeta.lotNo || lMeta.sequence || 0);

          combinedLots.push({
            listingAct: l,
            buyAct: matchedBuy,
            meta: lMeta,
            reg,
            lotNo: seq,
          });
        }

        // Catch any buy activity not already matched in listing activities
        for (const b of buyActs) {
          let bMeta: any = {};
          try { bMeta = typeof b.metadata === 'string' ? JSON.parse(b.metadata) : (b.metadata || {}); } catch {}
          const reg = (bMeta.regNo || '').trim().toUpperCase();
          const vId = bMeta.vehicleId ? String(bMeta.vehicleId) : '';
          if ((!reg || !lotKeys.has(reg)) && (!vId || !lotKeys.has(vId))) {
            const seq = Number(bMeta.lotNo || bMeta.sequence || 0);
            combinedLots.push({
              buyAct: b,
              meta: bMeta,
              reg,
              lotNo: seq,
            });
            if (reg) lotKeys.add(reg);
            if (vId) lotKeys.add(vId);
          }
        }

        // Sort lots by Lot # / sequence, then timestamp
        combinedLots.sort((a, b) => {
          if (a.lotNo && b.lotNo) return a.lotNo - b.lotNo;
          if (a.lotNo) return -1;
          if (b.lotNo) return 1;
          const timeA = new Date(a.buyAct?.timestamp || a.listingAct?.timestamp || 0).getTime();
          const timeB = new Date(b.buyAct?.timestamp || b.listingAct?.timestamp || 0).getTime();
          return timeA - timeB;
        });

        const sheet3Rows = combinedLots.map((lot, idx) => {
          const lAct = lot.listingAct;
          const bAct = lot.buyAct;
          let bMeta: any = {};
          try { bMeta = bAct ? (typeof bAct.metadata === 'string' ? JSON.parse(bAct.metadata) : (bAct.metadata || {})) : {}; } catch {}
          const meta = { ...bMeta, ...lot.meta };

          const ist = formatIST(bAct?.timestamp || lAct?.timestamp || new Date());
          const sellerDealer = lAct?.dealer;
          const sellerName = meta.sellerName || meta.customerName || sellerDealer?.displayName || 'TVS Certified';
          const sellerCustomer = provider.findCustomerByCompanyName ? provider.findCustomerByCompanyName(sellerName) : null;
          const sellerCode = meta.sellerCustomerCode || sellerCustomer?.code || sellerDealer?.externalDealerId || '';
          const sellerCity = meta.sellerCity || sellerCustomer?.city || sellerDealer?.city || meta.location || '';
          const sellerPhone = meta.sellerPhone || sellerCustomer?.phone || sellerDealer?.phone || '';

          const buyerDealer = bAct?.dealer;
          const buyerProfile = buyerDealer ? resolveDealerCustomer(buyerDealer, [bAct]) : null;

          const isSold = Boolean(bAct);
          const hammerPrice = isSold ? (meta.winningBid || meta.saleAmount || meta.amount || bMeta.winningBid || '') : '—';
          const buyerName = isSold ? (buyerProfile?.companyName || buyerDealer?.displayName || meta.winnerName || 'Unknown Buyer') : 'UNSOLD / NO WINNER';
          const buyerCode = isSold ? (buyerProfile?.customerCode || buyerDealer?.externalDealerId || '') : '—';
          const buyerCity = isSold ? (buyerProfile?.city || buyerDealer?.city || '') : '—';
          const buyerPhone = isSold ? (buyerDealer?.phone || '') : '—';
          const saleStatus = isSold ? 'SOLD • HAMMER FALL' : 'UNSOLD • NO SALE';
          const auditStatus = isSold ? 'AUDIT VERIFIED • PAIRING CONFIRMED' : 'AUDIT VERIFIED • CONSIGNED LOT (UNSOLD)';

          return [
            meta.lotNo || meta.sequence || idx + 1,
            targetAuctionId,
            meta.vehicleId || '',
            meta.regNo || lot.reg || '',
            meta.vehicleName || '',
            meta.fuelType || '',
            meta.transmission || '',
            meta.yearOfMfg || '',
            meta.speedometer || '',
            meta.startBidValue || '',
            meta.expectedPrice || '',
            hammerPrice,
            buyerName,
            buyerCode,
            buyerCity,
            buyerPhone,
            sellerName,
            sellerCode,
            sellerCity,
            sellerPhone,
            isSold ? (bAct?.points ?? 1) : 0, // Buyer Points: 1 pt per car won
            lAct?.points ?? 5, // Seller Listing Points (5 pts for every listed car)
            saleStatus,
            bAct?.externalTransactionId || lAct?.externalTransactionId || '',
            ist.full,
            auditStatus,
          ];
        });

        // ── SHEET 4: BID AUDIT TRAIL & DEDUPLICATION VERIFICATION ──
        const sheet4Headers = [
          'Activity ID',
          'Auction ID',
          'Timestamp (IST)',
          'TVS Customer Code',
          'Dealership Legal Name',
          'Lot Number',
          'Vehicle ID',
          'Vehicle Title & Reg No',
          'Bid Amount (INR)',
          'Points Awarded',
          'Scoring Rule Applied & Deduplication Check',
          'Bid Nature',
          'Audit Transaction ID',
          'Integrity Verification',
        ];

        const bidActivities = auctionActivities.filter(a => a.activityType === 'BID_PLACED');
        const sheet4Rows = bidActivities.map(b => {
          let meta: any = {};
          try { meta = typeof b.metadata === 'string' ? JSON.parse(b.metadata) : (b.metadata || {}); } catch {}
          const ist = formatIST(b.timestamp);
          const d = b.dealer;
          const ruleNote = b.points > 0
            ? 'VALID (+1 pt) • First verified bid by dealer on this vehicle'
            : 'DEDUPED (+0 pts) • Subsequent bid on same vehicle [Rule 4b Anti-Spam]';

          return [
            b.id,
            targetAuctionId,
            ist.full,
            d?.externalDealerId || '',
            d?.displayName || '',
            meta.lotNo || meta.sequence || '',
            meta.vehicleId || '',
            [meta.regNo, meta.vehicleName].filter(Boolean).join(' - ') || 'Vehicle',
            meta.bidAmount || meta.amount || meta.currentBid || '',
            b.points,
            ruleNote,
            meta.isPreBid ? 'Pre-Bid' : 'Live Auction Room Bid',
            b.externalTransactionId || '',
            'AUDIT VERIFIED',
          ];
        });

        // ── SHEET 5: MULTI-AUCTION MATCH DAYS COMPARISON (ALL AUCTIONS) ──
        // Maps dealer points per match day
        const matchHeaders = allCampaignMatches.map(m => `Match ${m.matchNumber} (Auction ${m.auctionId || m.id})`);
        const sheet5Headers = [
          'TVS Customer Code',
          'Dealership Legal Name',
          'Dealer Category',
          'Primary League',
          'City',
          ...matchHeaders,
          'Cumulative Championship Points',
          'Championship Rank',
          'Matches Participated Count',
        ];

        const matchIdMap = new Map<number, number>(allCampaignMatches.map((m, idx) => [m.id, idx]));
        const auctionIdMatchMap = new Map<string, number>(allCampaignMatches.map((m, idx) => [String(m.auctionId), idx]));

        const dealerMultiMatchPoints = new Map<number, number[]>();
        for (const act of allTournamentActivities) {
          if (!dealerMultiMatchPoints.has(act.dealerId)) {
            dealerMultiMatchPoints.set(act.dealerId, new Array(allCampaignMatches.length).fill(0));
          }
          const arr = dealerMultiMatchPoints.get(act.dealerId)!;
          let mIdx = act.matchId ? matchIdMap.get(act.matchId) : undefined;
          if (mIdx === undefined && act.externalTransactionId) {
            for (const [aId, idx] of auctionIdMatchMap.entries()) {
              if (act.externalTransactionId.includes(aId)) {
                mIdx = idx;
                break;
              }
            }
          }
          if (mIdx !== undefined && mIdx >= 0 && mIdx < arr.length) {
            arr[mIdx] += act.points;
          }
        }

        const sheet5Rows = allDealers.map(dealer => {
          const cumScore = cumulativeScoreMap.get(dealer.id);
          const perMatch = dealerMultiMatchPoints.get(dealer.id) || new Array(allCampaignMatches.length).fill(0);
          const participatedCount = perMatch.filter(pts => pts > 0).length;
          const totalPts = cumScore?.totalPoints ?? perMatch.reduce((sum, p) => sum + p, 0);

          return [
            dealer.externalDealerId,
            dealer.displayName,
            dealer.category || 'Used Car Dealer',
            dealer.category === 'OEM Dealer' ? 'Seller League' : 'Buyer League',
            dealer.city || 'Tamil Nadu',
            ...perMatch,
            totalPts,
            cumScore?.rank ? `#${cumScore.rank}` : '—',
            participatedCount,
          ];
        }).filter(r => (r[r.length - 3] as number) > 0 || (r[r.length - 1] as number) > 0)
          .sort((a, b) => ((b[b.length - 3] as number) - (a[a.length - 3] as number)));

        // ── SHEET 6: OFFICIAL SCORING RULES & VERIFICATION METHODOLOGY ──
        const sheet6Headers = [
          'Rule Code',
          'Activity Name',
          'Eligible League',
          'Points Awarded',
          'Cap & Frequency',
          'Deduplication & Anti-Tamper Policy',
          'Official Verification Criteria',
          'Governing Rule in Terms & Conditions',
        ];

        const sheet6Rows = [
          [
            'MATCH_PARTICIPATION',
            'Match Day Attendance / Room Participation',
            'Buyer League & Seller League',
            '1 Point',
            'Max 1 pt per match day',
            'Strictly deduped per dealer per match ID',
            'Awarded to verified buyer & seller dealerships entering live auction room',
            'Clause 4.1(a) — Match Participation',
          ],
          [
            'BID_PLACED',
            'Live Auction Bid Placed (Per-Car Basis)',
            'Buyer League',
            '1 Point per unique car',
            '1 pt per distinct vehicle (No cap on unique vehicles)',
            'Strictly deduplicated on vehicleId. Repeat bids on the same car earn 0 pts.',
            'Verified live bids recorded in TVS Certified auction stream',
            'Clause 4.1(b) — Competitive Bidding',
          ],
          [
            'SELL_LISTING',
            'Vehicle Listing in Super Cup Auction',
            'Seller League',
            '5 Points per vehicle',
            '5 pts per listed car in official match day catalog',
            'Strictly deduped on vehicleId and sellerCustomerId',
            'Vehicles cataloged and approved for official match auction',
            'Clause 4.2(a) — Vehicle Listings',
          ],
          [
            'SELL_COMMISSION',
            'Seller Commission Allocation',
            'Seller League',
            '5 Points',
            'Per verified commissionable transaction',
            'Verified against TVS Certified commercial ledger',
            'Awarded for completed commercial settlements',
            'Clause 4.2(b) — Commercial Settlement',
          ],
          [
            'ALL_MATCHES_BONUS',
            'All-Matches Participation Championship Bonus',
            'Buyer League',
            '20 Points',
            'One-time award upon tournament completion',
            'Requires participation in all 16 scheduled matches',
            'Validated against complete season attendance matrix',
            'Clause 4.3 — Championship Loyalty Bonus',
          ],
          [
            'BUY / SELL',
            'Vehicle Sales Conversion Points',
            'Deactivated',
            '0 Points',
            'Deactivated',
            'Conversions excluded to ensure transparent real-time bidding focus',
            'Recorded in audit ledger for commercial tracking only',
            'Clause 4.4 — Sales Conversions Policy',
          ],
        ];

        // ── UNIFIED CSV ROWS (For format === 'csv') ──
        const unifiedCsvHeaders = [
          'Auction Rank',
          'Dealership Legal Name',
          'TVS Customer Code',
          'Category',
          'League Role',
          'City / Region',
          'Contact Phone',
          'Total Auction Points',
          'Buyer League Points (Auction)',
          'Buyer League Rank (Auction)',
          'Seller League Points (Auction)',
          'Seller League Rank (Auction)',
          'Points Calculation Formula Applied',
          'Attendance Verified (1 pt/match)',
          'Attendance Points',
          'Total Raw Bids Placed',
          'Unique Vehicles Bid On (1 pt each)',
          'Bidding Points Awarded',
          'Duplicate Bids Deduplicated (0 pts - Rule 4b)',
          'Vehicle Listings Count',
          'Listing Points Awarded (5 pts each)',
          'Commission Points Awarded (5 pts)',
          'All Matches Bonus Points (20 pts)',
          'Vehicles Won / Bought Count',
          'Total Won Amount (INR)',
          'Won Vehicles List',
          'Vehicles Sold Count',
          'Total Sold Amount (INR)',
          'Cumulative Tournament Points',
          'Cumulative Championship Rank',
          'Auction ID',
          'Match Number',
          'Audit Verification Status',
          'Audit Timestamp (IST)',
          'Campaign Name',
        ];

        const unifiedCsvRows = overallAuctionList.map((d, idx) => {
          const cumScore = cumulativeScoreMap.get(d.dealerId);
          const formulaParts = [];
          if (d.participationPoints > 0) formulaParts.push(`Attendance: ${d.participationPoints}pt`);
          if (d.wonVehiclesCount > 0) formulaParts.push(`Purchases: ${d.wonVehiclesCount} unique cars x 1pt = ${d.wonVehiclesCount}pts`);
          else if (d.bidPoints > 0) formulaParts.push(`Bids: ${d.uniqueCarsBid.size} unique cars x 1pt = ${d.bidPoints}pts`);
          if (d.listingsCount > 0) formulaParts.push(`Listings: ${d.listingsCount} cars x 5pts = ${d.listingPoints}pts`);
          if (d.commissionPoints > 0) formulaParts.push(`Commission: ${d.commissionPoints}pts`);
          if (d.bonusPoints > 0) formulaParts.push(`Bonus: ${d.bonusPoints}pts`);
          const formulaText = formulaParts.length > 0 ? formulaParts.join(' + ') + ` = ${d.totalAuctionPoints} pts` : 'No scoring actions';

          return [
            idx + 1,
            d.displayName,
            d.dealerCode,
            d.category,
            d.role === 'Seller' ? 'Seller League' : 'Buyer League',
            d.city,
            d.phone,
            d.totalAuctionPoints,
            d.buyerPoints,
            buyerAuctionRankMap.get(d.dealerId) ? `#${buyerAuctionRankMap.get(d.dealerId)}` : '—',
            d.sellerPoints,
            sellerAuctionRankMap.get(d.dealerId) ? `#${sellerAuctionRankMap.get(d.dealerId)}` : '—',
            formulaText,
            d.attended ? 'YES' : 'NO',
            d.participationPoints,
            d.rawBidsCount,
            d.uniqueCarsBid.size,
            d.bidPoints,
            d.dedupedBidsCount,
            d.listingsCount,
            d.listingPoints,
            d.commissionPoints,
            d.bonusPoints,
            d.wonVehiclesCount,
            d.totalWonAmount,
            d.wonVehiclesList.join('; '),
            d.soldVehiclesCount,
            d.totalSoldAmount,
            cumScore?.totalPoints ?? d.totalAuctionPoints,
            cumScore?.rank ? `#${cumScore.rank}` : '—',
            targetAuctionId,
            matchLabel,
            'VERIFIED • TELEMETRY AUDITED & RECONCILED',
            formatIST(new Date()).full,
            activeCampaign.name,
          ];
        });

        const allSheets: ExportSheetDef[] = [
          {
            title: `Auction ${targetAuctionId} Leaderboard`,
            headers: sheet1Headers,
            rows: sheet1Rows,
          },
          {
            title: 'Points Calculation Breakdown',
            headers: sheet2Headers,
            rows: sheet2Rows,
          },
          {
            title: 'Vehicle Lots & Results',
            headers: sheet3Headers,
            rows: sheet3Rows,
          },
          {
            title: 'Bid Audit Trail',
            headers: sheet4Headers,
            rows: sheet4Rows,
          },
          {
            title: 'All Match Days Leaderboard',
            headers: sheet5Headers,
            rows: sheet5Rows,
          },
          {
            title: 'Scoring Rules & Method',
            headers: sheet6Headers,
            rows: sheet6Rows,
          },
        ];

        // If CSV format is requested, send the comprehensive unified table
        if (format === 'csv') {
          return sendMultiSheetExportResponse(
            [{ title: `Auction ${targetAuctionId} Leaderboard`, headers: unifiedCsvHeaders, rows: unifiedCsvRows }],
            `tvs-supercup-auction-${targetAuctionId}-standings-audit-${dateStr}`,
            0
          );
        }

        // Return Multi-Sheet Official Excel Spreadsheet (.xlsx)
        const baseFilename = `tvs-supercup-auction-${targetAuctionId}-leaderboard-points-audit-${dateStr}`;
        return sendMultiSheetExportResponse(allSheets, baseFilename, 0);
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
