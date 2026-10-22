/**
 * TVS Certified — Historical Auctions API Route
 *
 * GET /api/admin/historical-auctions?action=list
 *   - Lists all daily and weekly auctions across TN, KL, and AP/TS branches
 *
 * GET /api/admin/historical-auctions?action=pull&auctionId=XXXX
 *   - Pulls comprehensive vehicle, winner, seller, and bidder data for a specific auction
 *
 * GET /api/admin/historical-auctions?action=export&auctionId=XXXX (or type=catalog)
 *   - Generates native Microsoft Excel (.xlsx) spreadsheet for download
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, isEmployee } from '@/lib/auth';
import { prisma } from '@/lib/db';
import * as XLSX from 'xlsx';
import staticCustomerMapping from '@/lib/data/tvs-customer-mapping.json';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface TVSLocation {
  id?: number;
  code?: string;
  state?: string;
  name?: string;
  city?: string;
  address1?: string;
}

interface TVSRawAuction {
  id: number;
  code?: string;
  title?: string;
  description?: string;
  scheduled_time?: string;
  schedule_end_time?: string;
  stage?: string;
  auction_type?: string;
  location_id?: number;
  location_name?: string;
  locations?: TVSLocation;
  min_bidders?: number;
  no_of_bidders?: number;
  active?: number;
}

export interface NormalizedAuction {
  id: string;
  code: string;
  title: string;
  branch: 'TN' | 'KL' | 'AP/TS' | 'KA' | 'OTHER';
  branchLabel: string;
  auctionType: 'DAILY' | 'WEEKLY';
  rawType: string;
  scheduledTime: string;
  scheduleEndTime?: string;
  stage: string;
  locationCity: string;
  locationId?: number;
}

// ── In-Memory Caches for Superfast Response ──────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiry = 0;

let cachedAuctionsList: NormalizedAuction[] | null = null;
let cachedAuctionsExpiry = 0;

let cachedAllVehicles: any[] | null = null;
let cachedAllVehiclesExpiry = 0;

async function getTVSServiceToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiry - 300000) {
    return cachedToken;
  }
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const res = await fetch('https://tvscertified.in:8036/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'bhavaniprasad999@gmail.com', password: 'KU9JhpWDCz' }),
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const json = await res.json();
      const token = json?.data?.data?.[0]?.token;
      if (token) {
        cachedToken = token;
        tokenExpiry = Date.now() + 1000 * 60 * 60; // 1 hour
        return token;
      }
    }
  } catch (err) {
    console.warn('Failed to obtain TVS service token in historical-auctions route:', err);
  }
  return null;
}

function resolveBranch(a: TVSRawAuction): { branch: 'TN' | 'KL' | 'AP/TS' | 'KA' | 'OTHER'; branchLabel: string } {
  const locCode = (a.locations?.code || a.locations?.state || '').toUpperCase().trim();
  const locName = (a.locations?.name || a.locations?.city || a.location_name || '').toUpperCase().trim();
  const code = (a.code || '').toUpperCase().trim();
  const title = (a.title || '').toUpperCase().trim();
  const locId = Number(a.location_id || a.locations?.id || 0);

  // 1. AP / Telangana
  if (
    locId === 7 ||
    locCode === 'AP/TS' ||
    locCode === 'AP' ||
    locCode === 'TS' ||
    code.startsWith('AP') ||
    code.startsWith('TS') ||
    locName.includes('VIJAYAWADA') ||
    title.includes('AP/TS')
  ) {
    return { branch: 'AP/TS', branchLabel: 'AP / Telangana (Vijayawada)' };
  }

  // 2. Kerala
  if (
    locId === 6 ||
    locCode === 'KL' ||
    code.startsWith('KL') ||
    locName.includes('KOCHI') ||
    locName.includes('KERALA') ||
    title.includes('KOCHI') ||
    title.includes('KL ')
  ) {
    return { branch: 'KL', branchLabel: 'Kerala (Kochi)' };
  }

  // 3. Tamil Nadu
  if (
    locId === 5 ||
    locCode === 'TN' ||
    code.startsWith('TN') ||
    locName.includes('CHENNAI') ||
    locName.includes('TAMIL') ||
    title.includes('TN ') ||
    title.includes('CHENNAI')
  ) {
    return { branch: 'TN', branchLabel: 'Tamil Nadu (Chennai)' };
  }

  // 4. Karnataka
  if (locId === 8 || locCode === 'KA' || code.startsWith('KA') || locName.includes('BENGALURU')) {
    return { branch: 'KA', branchLabel: 'Karnataka (Bengaluru)' };
  }

  return { branch: 'OTHER', branchLabel: locName || 'Other Branch' };
}

function resolveAuctionType(a: TVSRawAuction): 'DAILY' | 'WEEKLY' {
  const raw = (a.auction_type || '').toLowerCase();
  const title = (a.title || '').toLowerCase();
  if (raw === 'daily_auction' || title.includes('daily')) {
    return 'DAILY';
  }
  return 'WEEKLY';
}

function formatIST(dateInput: Date | string | number | undefined) {
  if (!dateInput) return { date: '—', time: '—', full: '—' };
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return { date: '—', time: '—', full: '—' };
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
  const time = d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return { date, time, full: `${date} ${time}` };
}

// Customer Mapping Lookup for Company Names & Contacts
const custMap = new Map<string, any>();
try {
  const rawMapping = staticCustomerMapping as Record<string, any>;
  for (const [id, c] of Object.entries(rawMapping)) {
    custMap.set(String(id), c);
    if (c.code) custMap.set(String(c.code).trim(), c);
    if (c.phone) custMap.set(String(c.phone).trim(), c);
  }
} catch {}

function resolveCustomer(idOrCode: any) {
  if (!idOrCode) return null;
  const s = String(idOrCode).trim();
  return custMap.get(s) || null;
}

async function checkIsAdmin(request: NextRequest): Promise<boolean> {
  const admin = await isAdmin();
  if (admin) return true;
  return isEmployee();
}

export async function GET(request: NextRequest) {
  const admin = await checkIsAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'list';

  try {
    const token = await getTVSServiceToken();
    if (!token) {
      return NextResponse.json({ error: 'Failed to authenticate with TVS Certified server' }, { status: 502 });
    }

    const headers = {
      'Authorization': token,
      'Content-Type': 'application/json',
    };

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: LIST ALL HISTORICAL AUCTIONS
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'list') {
      const forceRefresh = searchParams.get('refresh') === 'true';

      if (!cachedAuctionsList || forceRefresh || Date.now() > cachedAuctionsExpiry) {
        const res = await fetch('https://tvscertified.in:8036/auctions', {
          headers,
          signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
          throw new Error(`TVS Certified /auctions endpoint returned HTTP ${res.status}`);
        }

        const data = await res.json();
        const rawList: TVSRawAuction[] = data?.data || [];

        cachedAuctionsList = rawList.map(a => {
          const { branch, branchLabel } = resolveBranch(a);
          const auctionType = resolveAuctionType(a);
          return {
            id: String(a.id),
            code: a.code || `AUC-${a.id}`,
            title: (a.title || `TVS Auction #${a.id}`).trim(),
            branch,
            branchLabel,
            auctionType,
            rawType: a.auction_type || 'auction',
            scheduledTime: a.scheduled_time || '',
            scheduleEndTime: a.schedule_end_time || '',
            stage: (a.stage || 'closed').toLowerCase().trim(),
            locationCity: a.locations?.city || a.location_name || '',
            locationId: a.location_id || a.locations?.id,
          };
        });

        // Sort newest first by scheduledTime or ID
        cachedAuctionsList.sort((a, b) => {
          const timeA = a.scheduledTime ? new Date(a.scheduledTime).getTime() : 0;
          const timeB = b.scheduledTime ? new Date(b.scheduledTime).getTime() : 0;
          if (timeA !== timeB) return timeB - timeA;
          return Number(b.id) - Number(a.id);
        });

        cachedAuctionsExpiry = Date.now() + 1000 * 60 * 15; // 15 mins cache
      }

      // Compute Global Summary Counts
      const counts = {
        total: cachedAuctionsList.length,
        branches: {
          TN: { total: 0, daily: 0, weekly: 0 },
          KL: { total: 0, daily: 0, weekly: 0 },
          'AP/TS': { total: 0, daily: 0, weekly: 0 },
          KA: { total: 0, daily: 0, weekly: 0 },
          OTHER: { total: 0, daily: 0, weekly: 0 },
        },
        types: {
          DAILY: 0,
          WEEKLY: 0,
        },
      };

      for (const a of cachedAuctionsList) {
        if (counts.branches[a.branch]) {
          counts.branches[a.branch].total++;
          if (a.auctionType === 'DAILY') counts.branches[a.branch].daily++;
          else counts.branches[a.branch].weekly++;
        }
        if (a.auctionType === 'DAILY') counts.types.DAILY++;
        else counts.types.WEEKLY++;
      }

      // Filter by Branch, Type, and Search query
      const branchParam = searchParams.get('branch') || 'ALL'; // ALL, TN, KL, AP/TS
      const typeParam = searchParams.get('type') || 'ALL';     // ALL, DAILY, WEEKLY
      const query = (searchParams.get('search') || '').toLowerCase().trim();

      let filtered = cachedAuctionsList;

      if (branchParam !== 'ALL') {
        filtered = filtered.filter(a => a.branch === branchParam);
      }

      if (typeParam !== 'ALL') {
        filtered = filtered.filter(a => a.auctionType === typeParam);
      }

      if (query) {
        filtered = filtered.filter(a =>
          a.id.toLowerCase().includes(query) ||
          a.code.toLowerCase().includes(query) ||
          a.title.toLowerCase().includes(query) ||
          a.locationCity.toLowerCase().includes(query) ||
          a.branch.toLowerCase().includes(query)
        );
      }

      return NextResponse.json({
        total: filtered.length,
        counts,
        auctions: filtered,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: PULL RELEVANT DATA FOR A SPECIFIC AUCTION
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'pull') {
      const auctionId = searchParams.get('auctionId');
      if (!auctionId) {
        return NextResponse.json({ error: 'Missing auctionId parameter' }, { status: 400 });
      }

      // 1. Fetch auction vehicles and bidder registrations in parallel
      const [vehRes, regRes] = await Promise.all([
        fetch(`https://tvscertified.in:8036/getAuctionvehicleList?auction_id=${encodeURIComponent(auctionId)}`, {
          headers,
          signal: AbortSignal.timeout(18000),
        }).catch(err => {
          console.warn(`Error pulling vehicles for auction #${auctionId}:`, err);
          return null;
        }),
        fetch(`https://tvscertified.in:8036/auctionbidderregistration?auction_id=${encodeURIComponent(auctionId)}`, {
          headers,
          signal: AbortSignal.timeout(10000),
        }).catch(err => {
          console.warn(`Error pulling registered bidders for auction #${auctionId}:`, err);
          return null;
        }),
      ]);

      const rawVehicles = vehRes && vehRes.ok ? (await vehRes.json())?.data || [] : [];
      const rawRegistrations = regRes && regRes.ok ? (await regRes.json())?.data || [] : [];

      // Resolve registered DB dealers to enrich company names
      const winnerIds = new Set<string>();
      for (const v of rawVehicles) {
        if (v.winner_id != null) winnerIds.add(String(v.winner_id));
      }
      for (const r of rawRegistrations) {
        const bId = r.buyer_id || r.customer_id;
        if (bId) winnerIds.add(String(bId));
      }

      const dbDealers = await prisma.dealer.findMany({
        select: { id: true, externalDealerId: true, displayName: true, city: true, phone: true },
      });

      const dbDealerMap = new Map<string, any>();
      for (const d of dbDealers) {
        if (d.externalDealerId) dbDealerMap.set(String(d.externalDealerId), d);
        dbDealerMap.set(String(d.id), d);
      }

      // Sort vehicles by sequence / lot number
      const sortedVehicles = [...rawVehicles].sort((a: any, b: any) => {
        const seqA = Number(a.sequence ?? a.seq_num ?? a.id ?? 0);
        const seqB = Number(b.sequence ?? b.seq_num ?? b.id ?? 0);
        return seqA - seqB;
      });

      let totalSalesVolume = 0;
      let wonCount = 0;
      let unsoldCount = 0;

      const processedVehicles = sortedVehicles.map((v: any) => {
        const lotNumber = Number(v.sequence ?? v.seq_num ?? v.id ?? 0);
        const isWon = v.winner_id != null && (v.winner_bid_value != null || v.start_bid_value != null);
        const saleAmount = isWon ? Number(v.winner_bid_value || v.start_bid_value || 0) : 0;

        if (isWon) {
          wonCount++;
          totalSalesVolume += saleAmount;
        } else {
          unsoldCount++;
        }

        // Winner / Buyer details
        let winnerName = '—';
        let winnerCity = '';
        let winnerPhone = '';

        if (v.winner_id != null) {
          const wId = String(v.winner_id);
          const dbD = dbDealerMap.get(wId);
          const cust = resolveCustomer(wId);
          winnerName = cust?.companyName || dbD?.displayName || `Buyer #${wId}`;
          winnerCity = cust?.city || dbD?.city || '';
          winnerPhone = cust?.phone || dbD?.phone || '';
        }

        // Seller details
        const rawSeller = (v.customer_name || '').trim();
        const sellerCust = resolveCustomer(rawSeller) || resolveCustomer(v.created_by);
        const sellerName = sellerCust?.companyName || rawSeller || 'TVS Certified Inventory';
        const sellerCity = sellerCust?.city || v.location_name || '';
        const sellerPhone = sellerCust?.phone || '';

        const vDate = v.created || v.modified || v.start_time;
        const timeIST = formatIST(vDate);

        return {
          id: v.id,
          vehicleId: v.vehicle_id || v.id,
          lotNumber,
          title: v.title || v.make_model || 'Auction Vehicle',
          makeModel: v.make_model || v.title || '',
          registrationNumber: v.registration_number || '—',
          fuelType: v.fuel_type || '—',
          transmission: v.transmission || '—',
          yearOfMfg: v.year_of_mfg || '—',
          speedometer: v.speedometer || '—',
          startBidValue: Number(v.start_bid_value || 0),
          winningBidValue: saleAmount > 0 ? saleAmount : null,
          expectedPrice: Number(v.expected_price || 0),
          stage: v.stage || 'closed',
          status: isWon ? 'WON / SOLD' : 'UNSOLD',
          isWon,
          winnerId: v.winner_id ? String(v.winner_id) : null,
          winnerName,
          winnerCity,
          winnerPhone,
          sellerName,
          sellerCity,
          sellerPhone,
          locationName: v.location_name || '',
          imageUrl: v.image_url || '',
          dateIST: timeIST.full,
        };
      });

      // Process Registered Bidders
      let preBidCount = 0;
      const processedBidders = (Array.isArray(rawRegistrations) ? rawRegistrations : []).map((r: any) => {
        const bId = String(r.buyer_id || r.customer_id || r.key_id || '');
        const dbD = dbDealerMap.get(bId);
        const cust = resolveCustomer(bId);
        const name = cust?.companyName || dbD?.displayName || `Dealer #${bId}`;
        const phone = cust?.phone || dbD?.phone || r.mobile || '';
        const city = cust?.city || dbD?.city || '';
        const preBid = Number(r.pre_bid_value || 0);
        if (preBid > 0) preBidCount++;

        return {
          id: r.id,
          buyerId: bId,
          name,
          phone,
          city,
          depositAmount: Number(r.deposit_amount || 0),
          preBidValue: preBid > 0 ? preBid : null,
          registeredAtIST: formatIST(r.created || r.pre_bid_date).full,
          status: r.status || 'ACTIVE',
        };
      });

      // Find Auction Meta
      let auctionMeta: NormalizedAuction | null = null;
      if (cachedAuctionsList) {
        auctionMeta = cachedAuctionsList.find(a => a.id === String(auctionId)) || null;
      }

      const summary = {
        auctionId,
        title: auctionMeta?.title || `TVS Auction #${auctionId}`,
        code: auctionMeta?.code || `AUC-${auctionId}`,
        branch: auctionMeta?.branch || 'TN',
        branchLabel: auctionMeta?.branchLabel || 'Tamil Nadu',
        auctionType: auctionMeta?.auctionType || 'WEEKLY',
        scheduledDateIST: formatIST(auctionMeta?.scheduledTime).full,
        totalVehicles: processedVehicles.length,
        soldVehicles: wonCount,
        unsoldVehicles: unsoldCount,
        totalSalesVolume,
        avgSalesPrice: wonCount > 0 ? Math.round(totalSalesVolume / wonCount) : 0,
        totalRegisteredBidders: processedBidders.length,
        totalPreBids: preBidCount,
      };

      return NextResponse.json({
        summary,
        vehicles: processedVehicles,
        bidders: processedBidders,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: EXPORT AUCTION AS MICROSOFT EXCEL (.XLSX)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'export') {
      const auctionId = searchParams.get('auctionId');
      const exportType = searchParams.get('type'); // 'catalog' or specific auction

      // CASE A: Export Full Historical Auctions Master Catalog with Individual Vehicle Details
      if (exportType === 'catalog' || exportType === 'master' || !auctionId) {
        // 1. Ensure auctions list is populated
        if (!cachedAuctionsList) {
          const res = await fetch('https://tvscertified.in:8036/auctions', { headers });
          const raw = (await res.json())?.data || [];
          cachedAuctionsList = raw.map((a: any) => {
            const { branch, branchLabel } = resolveBranch(a);
            return {
              id: String(a.id),
              code: a.code || `AUC-${a.id}`,
              title: (a.title || `TVS Auction #${a.id}`).trim(),
              branch,
              branchLabel,
              auctionType: resolveAuctionType(a),
              rawType: a.auction_type || 'auction',
              scheduledTime: a.scheduled_time || '',
              stage: (a.stage || 'closed').toLowerCase().trim(),
              locationCity: a.locations?.city || a.location_name || '',
            };
          });
        }

        const auctionMap = new Map<string, NormalizedAuction>();
        const safeAuctionsList = cachedAuctionsList || [];
        for (const a of safeAuctionsList) {
          auctionMap.set(a.id, a);
        }

        // 2. Fetch all individual auction vehicles across all auctions
        if (!cachedAllVehicles || Date.now() > cachedAllVehiclesExpiry) {
          const vehRes = await fetch('https://tvscertified.in:8036/getAuctionvehicleList', {
            headers,
            signal: AbortSignal.timeout(45000),
          });
          if (!vehRes.ok) {
            throw new Error(`Failed to fetch vehicles master list: HTTP ${vehRes.status}`);
          }
          const vJson = await vehRes.json();
          cachedAllVehicles = vJson?.data || [];
          cachedAllVehiclesExpiry = Date.now() + 1000 * 60 * 60 * 2; // 2 hours cache
        }

        const allRawVehicles = cachedAllVehicles || [];

        // 3. Resolve all unique buyer/winner IDs against DB dealers safely without hitting SQLite parameter limit
        const dbDealers = await prisma.dealer.findMany({
          select: { id: true, externalDealerId: true, displayName: true, city: true, phone: true },
        });

        const dbDealerMap = new Map<string, any>();
        for (const d of dbDealers) {
          if (d.externalDealerId) dbDealerMap.set(String(d.externalDealerId), d);
          dbDealerMap.set(String(d.id), d);
        }

        // 4. Construct comprehensive 31-column dataset
        const masterHeaders = [
          'Auction ID',
          'Auction Code',
          'Auction Title',
          'Branch',
          'Branch Region',
          'Auction Type',
          'Lot #',
          'Vehicle ID',
          'Make & Model',
          'Variant',
          'Registration Number',
          'Fuel Type',
          'Transmission',
          'Year of Mfg',
          'Speedometer (KM)',
          'Ownership',
          'Starting Bid (INR)',
          'Final Bid / Sale Value (INR)',
          'Winning Bid Time (IST)',
          'Reserve / Expected Price (INR)',
          'Status (Outcome)',
          'Buyer / Winner ID',
          'Buyer Dealership Name',
          'Buyer City',
          'Buyer Contact Phone',
          'Seller Dealership / Origin',
          'Seller Contact Person',
          'Seller City',
          'Seller Contact Phone',
          'Location / Yard',
          'Auction Scheduled Date & Time (IST)',
        ];

        const allRows: (string | number)[][] = [];
        const tnRows: (string | number)[][] = [];
        const klRows: (string | number)[][] = [];
        const apRows: (string | number)[][] = [];

        for (const v of allRawVehicles) {
          const aId = String(v.auction_id || '');
          const aMeta = auctionMap.get(aId) || {
            id: aId,
            code: `AUC-${aId}`,
            title: `Auction #${aId}`,
            branch: (v.location_name || '').toLowerCase().includes('kochi') ? 'KL' : (v.location_name || '').toLowerCase().includes('vijayawada') ? 'AP/TS' : 'TN',
            branchLabel: (v.location_name || '').toLowerCase().includes('kochi') ? 'Kerala (Kochi)' : (v.location_name || '').toLowerCase().includes('vijayawada') ? 'AP / Telangana (Vijayawada)' : 'Tamil Nadu (Chennai)',
            auctionType: (v.auction_type || '').toLowerCase() === 'daily_auction' ? 'DAILY' : 'WEEKLY',
            rawType: v.auction_type || 'auction',
            scheduledTime: v.auction_scheduled_time || '',
            stage: v.stage || 'closed',
            locationCity: v.location_name || '',
          };

          const isWon = v.winner_id != null && (v.winner_bid_value != null || v.start_bid_value != null);
          const finalBid = isWon ? Number(v.winner_bid_value || v.start_bid_value || 0) : null;

          // Resolve Buyer
          let buyerName = '—';
          let buyerCity = '';
          let buyerPhone = '';
          if (v.winner_id != null) {
            const wId = String(v.winner_id);
            const dbD = dbDealerMap.get(wId);
            const bCust = resolveCustomer(wId);
            buyerName = bCust?.companyName || dbD?.displayName || `Buyer #${wId}`;
            buyerCity = bCust?.city || dbD?.city || '';
            buyerPhone = bCust?.phone || dbD?.phone || '';
          }

          // Resolve Seller
          const rawSeller = (v.customer_name || '').trim();
          const sCust = resolveCustomer(rawSeller) || resolveCustomer(v.created_by);
          const sellerName = sCust?.companyName || rawSeller || 'TVS Certified Inventory';
          const sellerCity = sCust?.city || v.location_name || '';
          const sellerPhone = sCust?.phone || '';
          const sellerContactPerson = [v.customer_first_name, v.customer_last_name].filter(Boolean).join(' ') || '—';

          const lotNum = Number(v.sequence ?? v.seq_num ?? v.id ?? 0);
          const dateIST = formatIST(aMeta.scheduledTime || v.auction_scheduled_time || v.created || v.modified).full;

          const makeModel = [v.make_name, v.model_name].filter(Boolean).join(' ') || v.make_model || v.title || 'Auction Vehicle';
          const variant = v.variant_name || v.variant_id || '—';
          const ownership = v.vehicle_owner_number ? `${v.vehicle_owner_number} Owner` : '—';
          const winningBidTime = v.winner_bid_time ? formatIST(v.winner_bid_time).full : '—';

          const row = [
            aMeta.id,
            aMeta.code,
            aMeta.title,
            aMeta.branch,
            aMeta.branchLabel,
            aMeta.auctionType === 'DAILY' ? 'Daily Auction' : 'Weekly Auction',
            lotNum,
            v.vehicle_id || v.id,
            makeModel,
            variant,
            v.registration_number || '—',
            v.fuel_type || '—',
            v.transmission || '—',
            v.year_of_mfg || '—',
            v.speedometer || '—',
            ownership,
            Number(v.start_bid_value || 0),
            finalBid !== null ? finalBid : '—',
            winningBidTime,
            Number(v.expected_price || v.reserve_price || 0),
            isWon ? 'WON / SOLD' : 'UNSOLD',
            v.winner_id ? String(v.winner_id) : '—',
            buyerName,
            buyerCity,
            buyerPhone,
            sellerName,
            sellerContactPerson,
            sellerCity,
            sellerPhone,
            v.location_name || '',
            dateIST,
          ];

          allRows.push(row);
          if (aMeta.branch === 'TN') tnRows.push(row);
          else if (aMeta.branch === 'KL') klRows.push(row);
          else if (aMeta.branch === 'AP/TS') apRows.push(row);
        }

        // Sort rows by Auction ID desc, then Lot #
        const sortRows = (rows: (string | number)[][]) => {
          rows.sort((a, b) => {
            const aId = Number(a[0]) || 0;
            const bId = Number(b[0]) || 0;
            if (bId !== aId) return bId - aId;
            return (Number(a[6]) || 0) - (Number(b[6]) || 0);
          });
        };

        sortRows(allRows);
        sortRows(tnRows);
        sortRows(klRows);
        sortRows(apRows);

        // Helper for measuring column widths
        const getColWidths = (headers: string[], rows: (string | number)[][]) => {
          return headers.map((h, i) => {
            let maxLen = h.length;
            for (let r = 0; r < Math.min(rows.length, 500); r++) {
              const val = String(rows[r][i] ?? '');
              if (val.length > maxLen) maxLen = Math.min(val.length, 45);
            }
            return { wch: maxLen + 3 };
          });
        };

        const wb = XLSX.utils.book_new();

        // Check if branch filter was requested
        const targetBranch = searchParams.get('branch'); // 'TN', 'KL', 'AP/TS', or null/ALL

        if (targetBranch === 'TN') {
          const ws = XLSX.utils.aoa_to_sheet([masterHeaders, ...tnRows]);
          ws['!cols'] = getColWidths(masterHeaders, tnRows);
          XLSX.utils.book_append_sheet(wb, ws, 'Tamil Nadu (TN) Vehicles');
        } else if (targetBranch === 'KL') {
          const ws = XLSX.utils.aoa_to_sheet([masterHeaders, ...klRows]);
          ws['!cols'] = getColWidths(masterHeaders, klRows);
          XLSX.utils.book_append_sheet(wb, ws, 'Kerala (KL) Vehicles');
        } else if (targetBranch === 'AP/TS') {
          const ws = XLSX.utils.aoa_to_sheet([masterHeaders, ...apRows]);
          ws['!cols'] = getColWidths(masterHeaders, apRows);
          XLSX.utils.book_append_sheet(wb, ws, 'AP & TS Vehicles');
        } else {
          // Master Full Workbook: All Branches + Individual Branch Tabs + Directory Summary
          const wsAll = XLSX.utils.aoa_to_sheet([masterHeaders, ...allRows]);
          wsAll['!cols'] = getColWidths(masterHeaders, allRows);
          XLSX.utils.book_append_sheet(wb, wsAll, 'All Historical Vehicles');

          const wsTN = XLSX.utils.aoa_to_sheet([masterHeaders, ...tnRows]);
          wsTN['!cols'] = getColWidths(masterHeaders, tnRows);
          XLSX.utils.book_append_sheet(wb, wsTN, 'Tamil Nadu (TN)');

          const wsKL = XLSX.utils.aoa_to_sheet([masterHeaders, ...klRows]);
          wsKL['!cols'] = getColWidths(masterHeaders, klRows);
          XLSX.utils.book_append_sheet(wb, wsKL, 'Kerala (KL)');

          const wsAP = XLSX.utils.aoa_to_sheet([masterHeaders, ...apRows]);
          wsAP['!cols'] = getColWidths(masterHeaders, apRows);
          XLSX.utils.book_append_sheet(wb, wsAP, 'AP & Telangana (AP-TS)');
        }

        // Always append Auctions Directory Summary Sheet
        const summaryHeaders = [
          'Auction ID',
          'Auction Code',
          'Title',
          'Branch',
          'Branch Region',
          'Auction Type',
          'Scheduled Date & Time (IST)',
          'Stage',
          'Location City',
        ];
        const dirAuctions = (cachedAuctionsList || []).filter(a => !targetBranch || a.branch === targetBranch);
        const summaryRows = dirAuctions.map(a => [
          a.id,
          a.code,
          a.title,
          a.branch,
          a.branchLabel,
          a.auctionType === 'DAILY' ? 'Daily Auction' : 'Weekly Auction',
          formatIST(a.scheduledTime).full,
          a.stage.toUpperCase(),
          a.locationCity,
        ]);
        const wsSum = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
        wsSum['!cols'] = summaryHeaders.map(h => ({ wch: Math.max(h.length + 3, 22) }));
        XLSX.utils.book_append_sheet(wb, wsSum, 'Auctions Directory');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        const branchTag = targetBranch ? `_${targetBranch.replace(/[^a-zA-Z0-9]/g, '_')}` : '_All_Branches';
        const filename = `TVS_Master_Historical_Auctions_Full_Details${branchTag}_${new Date().toISOString().slice(0, 10)}.xlsx`;

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      }

      // CASE B: Export Specific Auction Data (Vehicles + Bidders + Summary)
      const [vehRes, regRes] = await Promise.all([
        fetch(`https://tvscertified.in:8036/getAuctionvehicleList?auction_id=${encodeURIComponent(auctionId)}`, {
          headers,
          signal: AbortSignal.timeout(18000),
        }),
        fetch(`https://tvscertified.in:8036/auctionbidderregistration?auction_id=${encodeURIComponent(auctionId)}`, {
          headers,
          signal: AbortSignal.timeout(10000),
        }),
      ]);

      const rawVehicles = vehRes.ok ? (await vehRes.json())?.data || [] : [];
      const rawRegistrations = regRes.ok ? (await regRes.json())?.data || [] : [];

      const winnerIds = new Set<string>();
      for (const v of rawVehicles) {
        if (v.winner_id != null) winnerIds.add(String(v.winner_id));
      }
      for (const r of rawRegistrations) {
        const bId = r.buyer_id || r.customer_id;
        if (bId) winnerIds.add(String(bId));
      }

      const dbDealers = await prisma.dealer.findMany({
        select: { id: true, externalDealerId: true, displayName: true, city: true, phone: true },
      });

      const dbDealerMap = new Map<string, any>();
      for (const d of dbDealers) {
        if (d.externalDealerId) dbDealerMap.set(String(d.externalDealerId), d);
        dbDealerMap.set(String(d.id), d);
      }

      const sortedVehicles = [...rawVehicles].sort((a: any, b: any) => {
        const seqA = Number(a.sequence ?? a.seq_num ?? a.id ?? 0);
        const seqB = Number(b.sequence ?? b.seq_num ?? b.id ?? 0);
        return seqA - seqB;
      });

      let totalSalesVolume = 0;
      let wonCount = 0;
      let unsoldCount = 0;

      const vehicleHeaders = [
        'Lot #',
        'Vehicle ID',
        'Vehicle Model / Title',
        'Registration Number',
        'Fuel Type',
        'Transmission',
        'Year of Mfg',
        'Speedometer (KM)',
        'Starting Bid (INR)',
        'Winning / Sale Price (INR)',
        'Expected / Reserve Price (INR)',
        'Status',
        'Winner / Buyer ID',
        'Winner Dealership Name',
        'Winner City',
        'Winner Phone',
        'Seller Dealership / Origin',
        'Seller City',
        'Seller Phone',
        'Location',
        'Date & Time (IST)',
      ];

      const vehicleRows = sortedVehicles.map((v: any) => {
        const lotNumber = Number(v.sequence ?? v.seq_num ?? v.id ?? 0);
        const isWon = v.winner_id != null && (v.winner_bid_value != null || v.start_bid_value != null);
        const saleAmount = isWon ? Number(v.winner_bid_value || v.start_bid_value || 0) : 0;

        if (isWon) {
          wonCount++;
          totalSalesVolume += saleAmount;
        } else {
          unsoldCount++;
        }

        let winnerName = '—';
        let winnerCity = '';
        let winnerPhone = '';
        if (v.winner_id != null) {
          const wId = String(v.winner_id);
          const dbD = dbDealerMap.get(wId);
          const cust = resolveCustomer(wId);
          winnerName = cust?.companyName || dbD?.displayName || `Buyer #${wId}`;
          winnerCity = cust?.city || dbD?.city || '';
          winnerPhone = cust?.phone || dbD?.phone || '';
        }

        const rawSeller = (v.customer_name || '').trim();
        const sellerCust = resolveCustomer(rawSeller) || resolveCustomer(v.created_by);
        const sellerName = sellerCust?.companyName || rawSeller || 'TVS Certified Inventory';
        const sellerCity = sellerCust?.city || v.location_name || '';
        const sellerPhone = sellerCust?.phone || '';

        return [
          lotNumber,
          v.vehicle_id || v.id,
          v.title || v.make_model || 'Auction Vehicle',
          v.registration_number || '—',
          v.fuel_type || '—',
          v.transmission || '—',
          v.year_of_mfg || '—',
          v.speedometer || '—',
          Number(v.start_bid_value || 0),
          saleAmount > 0 ? saleAmount : '—',
          Number(v.expected_price || 0),
          isWon ? 'WON / SOLD' : 'UNSOLD',
          v.winner_id ? String(v.winner_id) : '—',
          winnerName,
          winnerCity,
          winnerPhone,
          sellerName,
          sellerCity,
          sellerPhone,
          v.location_name || '',
          formatIST(v.created || v.modified).full,
        ];
      });

      const bidderHeaders = [
        'Bidder / Buyer ID',
        'Dealership / Company Name',
        'Contact Phone',
        'City',
        'Deposit Amount (INR)',
        'Pre-Bid Amount (INR)',
        'Registered Date & Time (IST)',
        'Status',
      ];

      const bidderRows = (Array.isArray(rawRegistrations) ? rawRegistrations : []).map((r: any) => {
        const bId = String(r.buyer_id || r.customer_id || r.key_id || '');
        const dbD = dbDealerMap.get(bId);
        const cust = resolveCustomer(bId);
        const name = cust?.companyName || dbD?.displayName || `Dealer #${bId}`;
        const phone = cust?.phone || dbD?.phone || r.mobile || '';
        const city = cust?.city || dbD?.city || '';
        const preBid = Number(r.pre_bid_value || 0);

        return [
          bId,
          name,
          phone,
          city,
          Number(r.deposit_amount || 0),
          preBid > 0 ? preBid : '—',
          formatIST(r.created || r.pre_bid_date).full,
          r.status || 'ACTIVE',
        ];
      });

      let auctionMeta: NormalizedAuction | null = null;
      if (cachedAuctionsList) {
        auctionMeta = cachedAuctionsList.find(a => a.id === String(auctionId)) || null;
      }

      const summaryRows = [
        ['Auction ID', auctionId],
        ['Auction Code', auctionMeta?.code || `AUC-${auctionId}`],
        ['Auction Title', auctionMeta?.title || `TVS Auction #${auctionId}`],
        ['Branch', auctionMeta?.branch || 'TN'],
        ['Branch Region', auctionMeta?.branchLabel || 'Tamil Nadu'],
        ['Auction Type', auctionMeta?.auctionType === 'DAILY' ? 'Daily Auction' : 'Weekly Auction'],
        ['Scheduled Date & Time (IST)', formatIST(auctionMeta?.scheduledTime).full],
        ['Total Vehicles Listed', sortedVehicles.length],
        ['Vehicles Won / Sold', wonCount],
        ['Vehicles Unsold', unsoldCount],
        ['Total Sales Volume (INR)', totalSalesVolume],
        ['Average Won Vehicle Price (INR)', wonCount > 0 ? Math.round(totalSalesVolume / wonCount) : 0],
        ['Total Registered Bidders', rawRegistrations.length],
        ['Export Timestamp (IST)', formatIST(new Date()).full],
      ];

      const wb = XLSX.utils.book_new();

      // Sheet 1: Vehicles & Results
      const wsVeh = XLSX.utils.aoa_to_sheet([vehicleHeaders, ...vehicleRows]);
      wsVeh['!cols'] = vehicleHeaders.map((h, i) => {
        let max = h.length;
        for (const r of vehicleRows) {
          const val = String(r[i] ?? '');
          if (val.length > max) max = Math.min(val.length, 45);
        }
        return { wch: max + 3 };
      });
      XLSX.utils.book_append_sheet(wb, wsVeh, 'Vehicles & Results');

      // Sheet 2: Registered Bidders
      const wsBid = XLSX.utils.aoa_to_sheet([bidderHeaders, ...bidderRows]);
      wsBid['!cols'] = bidderHeaders.map(h => ({ wch: Math.max(h.length + 4, 18) }));
      XLSX.utils.book_append_sheet(wb, wsBid, 'Registered Bidders');

      // Sheet 3: Auction Summary
      const wsSum = XLSX.utils.aoa_to_sheet([['Metric / Field', 'Value'], ...summaryRows]);
      wsSum['!cols'] = [{ wch: 32 }, { wch: 45 }];
      XLSX.utils.book_append_sheet(wb, wsSum, 'Auction Summary');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const filename = `TVS_Auction_${auctionId}_${auctionMeta?.branch || 'Data'}_${new Date().toISOString().slice(0, 10)}.xlsx`;

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('Historical auctions API error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
