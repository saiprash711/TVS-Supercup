/**
 * TVS Certified Integration Layer
 * 
 * Provides real and mock integration with the live TVS Certified auction platform:
 * - Live Authentication: https://tvscertified.in:8036/authenticate
 * - Live Auction & Bids: https://tvscertified.in:8036
 * - Master & Inspection: https://tvscertified.in:8030
 * - Real-time Bidding: https://tvscertified.in:4300
 */

import staticUserMapping from '../data/tvs-user-mapping.json';
import staticCustomerMapping from '../data/tvs-customer-mapping.json';

export interface TVSCustomerProfile {
  id: number;
  code: string;
  companyName: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  email: string;
}

export function extractCompanyName(cust: any): string {
  if (!cust) return '';
  const clean = (s: any) => {
    if (!s || typeof s !== 'string') return '';
    const trimmed = s.trim();
    if (trimmed === 'null' || trimmed === 'undefined' || trimmed === '.') return '';
    return trimmed;
  };
  return clean(cust.companyName) || clean(cust.legal_name) || clean(cust.trade_name) || clean(cust.name) || clean(cust.company_name) || '';
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TVSDealerProfile {
  userId: string;
  dealerId: string;
  dealerName: string;
  city: string;
  phone?: string;
  email?: string;
}

export interface TVSAuthResult {
  authenticated: boolean;
  userId?: string;
  dealerId?: string;
  dealerName?: string;
  city?: string;
  token?: string;
  error?: string;
  userData?: Record<string, unknown>;
}

export interface TVSAuctionActivity {
  transactionId: string;
  dealerId: string;
  auctionId: string;
  activityType:
    | 'BUY'
    | 'SELL'
    | 'MATCH_PARTICIPATION'
    | 'BID_PLACED'
    | 'VEHICLE_INSPECTED'
    | 'WATCHLIST_ADD';
  vehicleId?: string;
  amount?: number;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

// ─── Abstract Interface ─────────────────────────────────────────────────────

export interface TVSAuctionProvider {
  /**
   * Authenticate a dealer using username and password against TVS Certified.
   */
  authenticateWithCredentials(username: string, password?: string): Promise<TVSAuthResult>;

  /**
   * Verify a TVS authentication token and return dealer identity.
   */
  verifyAuthentication(token: string): Promise<TVSAuthResult>;

  /**
   * Get dealer profile from TVS Certified system.
   */
  getDealerProfile(userId: string, token?: string): Promise<TVSDealerProfile | null>;

  /**
   * Get dealer activities for a specific auction or dealer.
   */
  getDealerActivities(dealerId: string, auctionId?: string, token?: string): Promise<TVSAuctionActivity[]>;

  /**
   * Get all activities for an auction (all dealers).
   */
  getAuctionActivities(auctionId: string, token?: string): Promise<TVSAuctionActivity[]>;

  /**
   * Get all vehicles listed for an auction.
   */
  getAuctionVehicles(auctionId?: string, token?: string): Promise<any[]>;

  /**
   * Find a TVS customer profile by company name.
   */
  findCustomerByCompanyName?(name: string): TVSCustomerProfile | null;
}

// ─── Timestamp Utilities ───────────────────────────────────────────────────

/**
 * TVS Certified returns vehicle modified/start/end timestamps in Indian Standard Time (IST),
 * but serialized with '.000Z' or 'Z' appended (e.g. '2026-09-10T14:02:37.000Z' for 2:02 PM IST).
 * Meanwhile, live bids (getLiveBids) are returned in true UTC (e.g. '2026-09-10T08:32:14.000Z').
 * To ensure bids and vehicle wins interleave correctly in chronological order,
 * we parse IST vehicle times by applying the +05:30 offset to convert to true UTC.
 */
export function parseTVSVehicleTimestamp(dateInput: any): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;

  const str = String(dateInput).trim();
  if (str.endsWith('Z')) {
    const rawNoZ = str.slice(0, -1);
    const parsedAsIST = new Date(`${rawNoZ}+05:30`);
    if (!isNaN(parsedAsIST.getTime())) {
      return parsedAsIST;
    }
  }

  if (!str.includes('+') && !str.includes('Z')) {
    const parsedAsIST = new Date(`${str}+05:30`);
    if (!isNaN(parsedAsIST.getTime())) {
      return parsedAsIST;
    }
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

// ─── Real TVS Certified Implementation ──────────────────────────────────────

export class RealTVSAuctionProvider implements TVSAuctionProvider {
  private baseUrl = 'https://tvscertified.in:8036';
  private baseUrlMaster = 'https://tvscertified.in:8030';
  private mockFallback = new MockTVSAuctionProvider();
  private cachedServiceToken: string | null = null;
  private tokenExpiry: number = 0;
  private userToKeyMap: Map<string, string> = new Map();
  private keyToUserMap: Map<string, string> = new Map();
  private userMapExpiry: number = 0;
  private userMappingPromise: Promise<void> | null = null;
  private customerMap: Map<string, TVSCustomerProfile> = new Map();
  private companyNameToCustomerMap: Map<string, TVSCustomerProfile> = new Map();
  private customerMapExpiry: number = 0;
  private customerMappingPromise: Promise<void> | null = null;
  private settledVehicleIds: Set<string | number> = new Set();

  constructor() {
    // Disable TLS reject for self-signed certificates in dev environments if needed
    if (typeof process !== 'undefined' && process.env) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
    // Pre-populate with 1,608 verified TVS dealer identity mappings instantly
    try {
      const mapping = staticUserMapping as Record<string, string>;
      for (const [uId, keyId] of Object.entries(mapping)) {
        this.userToKeyMap.set(String(uId), String(keyId));
        this.keyToUserMap.set(String(keyId), String(uId));
      }
      this.userMapExpiry = Date.now() + 1000 * 60 * 60 * 2; // 2-hour cache
    } catch {
      // Fallback to dynamic loading
    }
    // Pre-populate with 1,509 verified TVS customer & company name mappings instantly
    try {
      const custMapping = staticCustomerMapping as Record<string, TVSCustomerProfile>;
      for (const [cId, cust] of Object.entries(custMapping)) {
        this.customerMap.set(String(cId), cust);
        if (cust.code) this.customerMap.set(String(cust.code), cust);
        if (cust.phone) this.customerMap.set(String(cust.phone).trim(), cust);
        if (cust.companyName) {
          this.companyNameToCustomerMap.set(cust.companyName.trim().toLowerCase(), cust);
        }
      }
      this.customerMapExpiry = Date.now() + 1000 * 60 * 60 * 2;
    } catch {
      // Fallback
    }
  }

  invalidateToken(): void {
    this.cachedServiceToken = null;
    this.tokenExpiry = 0;
  }

  private async getValidToken(token?: string): Promise<string | null> {
    if (token) return token;
    // Check cache with 5-minute safety buffer
    if (this.cachedServiceToken && Date.now() < this.tokenExpiry - 300000) {
      return this.cachedServiceToken;
    }
    try {
      const res = await fetch(`${this.baseUrl}/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'bhavaniprasad999@gmail.com', password: 'KU9JhpWDCz' }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const json = await res.json();
        const item = json?.data?.data?.[0];
        if (item?.token) {
          this.cachedServiceToken = item.token;
          this.tokenExpiry = Date.now() + 1000 * 60 * 60; // 1 hour cache
          return this.cachedServiceToken;
        }
      }
    } catch (err) {
      console.warn('Failed to obtain TVS service token:', err);
    }
    return null;
  }

  async loadCustomerMapping(token?: string): Promise<void> {
    if (Date.now() < this.customerMapExpiry && this.customerMap.size > 0) return;

    if (this.customerMappingPromise) {
      return this.customerMappingPromise;
    }

    this.customerMappingPromise = (async () => {
      try {
        const authToken = await this.getValidToken(token);
        if (!authToken) {
          this.customerMapExpiry = Date.now() + 1000 * 60 * 5;
          return;
        }
        const res = await fetch(`${this.baseUrl}/customers`, {
          headers: { 'Authorization': authToken, 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(30000),
        });
        if (res.ok) {
          const json = await res.json();
          const customers = json?.data || [];
          for (const c of customers) {
            const compName = extractCompanyName(c);
            const prof: TVSCustomerProfile = {
              id: c.id,
              code: c.code || '',
              companyName: compName || [c.first_name, c.last_name].filter(Boolean).join(' ').trim() || `Dealer ${c.id}`,
              firstName: (c.first_name || '').trim(),
              lastName: (c.last_name || '').trim(),
              phone: c.mobile_no ? String(c.mobile_no).trim() : '',
              city: c.city || 'Tamil Nadu',
              email: c.email || '',
            };
            this.customerMap.set(String(c.id), prof);
            if (prof.code) this.customerMap.set(String(prof.code), prof);
            if (prof.phone) this.customerMap.set(String(prof.phone), prof);
            if (prof.companyName) {
              this.companyNameToCustomerMap.set(prof.companyName.trim().toLowerCase(), prof);
            }
          }
          this.customerMapExpiry = Date.now() + 1000 * 60 * 60 * 2;
        } else {
          this.customerMapExpiry = Date.now() + 1000 * 60 * 5;
        }
      } catch {
        if (this.customerMap.size > 0) {
          this.customerMapExpiry = Date.now() + 1000 * 60 * 5;
        } else {
          this.customerMapExpiry = Date.now() + 1000 * 60 * 2;
        }
      } finally {
        this.customerMappingPromise = null;
      }
    })();

    return this.customerMappingPromise;
  }

  async authenticateWithCredentials(username: string, password?: string): Promise<TVSAuthResult> {
    const trimmedUser = (username || '').trim();
    const trimmedPass = (password || '').trim();

    // 1. Call live TVS Certified authentication endpoint first
    try {
      const res = await fetch(`${this.baseUrl}/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUser, password: trimmedPass }),
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const json = await res.json();
        const item = json?.data?.data?.[0];

        if (item && !item.error && item.token && item.userData?.[0]) {
          const user = item.userData[0];
          const keyId = user.key_id ? String(user.key_id) : `USR-${user.id}`;
          
          // Match against TVS customers to retrieve official Company Name
          const cust = this.customerMap.get(String(user.key_id || '')) || 
                       (user.mobile ? this.customerMap.get(String(user.mobile).trim()) : null);
          const companyName = cust?.companyName;
          const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
          const name = companyName || fullName || user.user_name || user.name || trimmedUser;
          const city = cust?.city || user.location_name || user.valuation_city || 'Hyderabad';

          // Cache this valid token for downstream calls
          this.cachedServiceToken = item.token;
          this.tokenExpiry = Date.now() + 1000 * 60 * 60;

          return {
            authenticated: true,
            userId: String(user.id),
            dealerId: keyId,
            dealerName: name,
            city,
            token: item.token,
            userData: user,
          };
        } else if (item?.error) {
          return {
            authenticated: false,
            error: typeof item.error === 'string' ? item.error : 'Invalid TVS Certified credentials',
          };
        }
      }
    } catch (err: unknown) {
      console.warn('TVS live authentication attempt error:', err);
    }

    return { authenticated: false, error: 'Invalid TVS credentials. Please check your username and password.' };
  }

  async verifyAuthentication(token: string): Promise<TVSAuthResult> {
    if (!token) return { authenticated: false, error: 'Token missing' };

    try {
      const res = await fetch(`${this.baseUrl}/users?type=profile`, {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        const user = data?.data?.data?.[0] || data?.data?.[0];
        if (user) {
          const keyId = user.key_id ? String(user.key_id) : `USR-${user.id}`;
          const cust = this.customerMap.get(keyId) || (user.mobile ? this.customerMap.get(String(user.mobile).trim()) : null);
          const companyName = cust?.companyName || user.user_name;
          return {
            authenticated: true,
            userId: String(user.id),
            dealerId: keyId,
            dealerName: companyName,
            city: cust?.city || user.location_name || 'Tamil Nadu',
            token,
          };
        }
      }
    } catch (err) {
      console.warn('TVS verifyAuthentication error:', err);
    }

    return { authenticated: false, error: 'Invalid or expired TVS token' };
  }

  async getDealerProfile(userId: string, token?: string): Promise<TVSDealerProfile | null> {
    try {
      await this.loadUserMapping();
      await this.loadCustomerMapping(token);

      const rawId = String(userId).trim();
      const cleanId = rawId.replace('USR-', '');

      // 1. Direct customer lookup by customer ID
      let cust = this.customerMap.get(cleanId);
      // 2. If cleanId was a user ID, check if it maps to customer key_id
      if (!cust && this.userToKeyMap.has(cleanId)) {
        cust = this.customerMap.get(this.userToKeyMap.get(cleanId)!);
      }
      if (cust) {
        return {
          userId: String(cust.id),
          dealerId: String(cust.id),
          dealerName: cust.companyName || `Dealer ${userId}`,
          city: cust.city || 'Tamil Nadu',
          phone: cust.phone || '',
          email: cust.email || '',
        };
      }

      // 3. Fallback to /users endpoint
      const authToken = await this.getValidToken(token);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = authToken;

      const res = await fetch(`${this.baseUrl}/users?type=profile&userId=${encodeURIComponent(cleanId)}`, {
        headers,
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        const user = data?.data?.data?.[0] || data?.data?.[0];
        if (user) {
          const keyId = user.key_id ? String(user.key_id) : `USR-${user.id}`;
          const custFromKey = this.customerMap.get(keyId) || (user.mobile ? this.customerMap.get(String(user.mobile).trim()) : null);
          if (custFromKey) {
            return {
              userId: String(user.id),
              dealerId: keyId,
              dealerName: custFromKey.companyName,
              city: custFromKey.city || user.location_name || '',
              phone: custFromKey.phone || user.mobile_number || '',
              email: custFromKey.email || user.email || '',
            };
          }
          const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
          return {
            userId: String(user.id),
            dealerId: keyId,
            dealerName: fullName || user.user_name || `Dealer ${keyId}`,
            city: user.location_name || '',
            phone: user.mobile_number || '',
            email: user.email || '',
          };
        }
      }
    } catch (err) {
      console.error('getDealerProfile error:', err);
    }
    return this.mockFallback.getDealerProfile(userId);
  }

  async loadUserMapping(): Promise<void> {
    if (Date.now() < this.userMapExpiry && this.userToKeyMap.size > 0) return;

    if (this.userMappingPromise) {
      return this.userMappingPromise;
    }

    this.userMappingPromise = (async () => {
      try {
        const token = await this.getValidToken();
        if (!token) {
          this.userMapExpiry = Date.now() + 1000 * 60 * 5;
          return;
        }
        const res = await fetch(`${this.baseUrl}/users`, {
          headers: { 'Authorization': token, 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(30000), // 30s timeout for large 2MB payload
        });
        if (res.ok) {
          const json = await res.json();
          const users = json?.data || [];
          for (const u of users) {
            const uId = String(u.id);
            const keyId = u.key_id != null ? String(u.key_id) : uId;
            this.userToKeyMap.set(uId, keyId);
            this.keyToUserMap.set(keyId, uId);
          }
          this.userMapExpiry = Date.now() + 1000 * 60 * 60 * 2; // 2-hour cache
        } else {
          this.userMapExpiry = Date.now() + 1000 * 60 * 5;
        }
      } catch (e: any) {
        // If we already have mappings in memory, quietly back off for 5 minutes
        if (this.userToKeyMap.size > 0) {
          this.userMapExpiry = Date.now() + 1000 * 60 * 5;
        } else {
          this.userMapExpiry = Date.now() + 1000 * 60 * 2;
          console.warn('Failed to refresh TVS users mapping (retrying in 2 mins):', e?.message || e);
        }
      } finally {
        this.userMappingPromise = null;
      }
    })();

    return this.userMappingPromise;
  }

  resolveDealerKeyId(rawId: string | number): string {
    const s = String(rawId).trim();
    return this.userToKeyMap.get(s) || s;
  }

  findCustomerByCompanyName(name: string): TVSCustomerProfile | null {
    if (!name) return null;
    const clean = name.trim().toLowerCase();
    if (this.companyNameToCustomerMap.has(clean)) {
      return this.companyNameToCustomerMap.get(clean)!;
    }
    for (const [key, cust] of this.companyNameToCustomerMap.entries()) {
      if (key && (clean.startsWith(key) || key.startsWith(clean))) {
        return cust;
      }
    }
    for (const cust of this.customerMap.values()) {
      if (cust.companyName && (cust.companyName.toLowerCase().includes(clean) || clean.includes(cust.companyName.toLowerCase()))) {
        return cust;
      }
    }
    return null;
  }

  async getDealerActivities(dealerId: string, auctionId: string = '1991', token?: string): Promise<TVSAuctionActivity[]> {
    const activities: TVSAuctionActivity[] = [];
    const authToken = await this.getValidToken(token);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = authToken;

    await this.loadUserMapping();
    const resolvedKeyId = this.resolveDealerKeyId(dealerId);

    try {
      // 1. Fetch Winning / Buy Bids for this dealer using customer_id (key_id)
      const winUrl = `${this.baseUrl}/getWinningBids?customer_id=${encodeURIComponent(resolvedKeyId)}`;
      const winRes = await fetch(winUrl, { headers, signal: AbortSignal.timeout(8000) });
      if (winRes.ok) {
        const json = await winRes.json();
        const rawRows = json?.data || [];
        const rows = Array.isArray(rawRows) ? rawRows : [];
        for (const item of rows) {
          const row = item?.view_winning_bid || item;
          if (row) {
            // Filter strictly by auctionId if specified
            if (auctionId && row.auction_id && String(row.auction_id) !== String(auctionId)) {
              continue;
            }
            const rowWinner = String(row.winner_id || row.customer_id || '');
            if (!rowWinner || rowWinner === resolvedKeyId || rowWinner === dealerId) {
              const amount = Number(row.winner_bid_value || row.winning_bid_amount || row.price || 0);
              const vId = String(row.auction_vehicle_id || row.vehicle_id || row.id || '');
              const time = row.end_time ? parseTVSVehicleTimestamp(row.end_time) : (row.completed_at ? parseTVSVehicleTimestamp(row.completed_at) : (row.modified ? parseTVSVehicleTimestamp(row.modified) : new Date()));
              activities.push({
                transactionId: `BUY-${row.auction_id || auctionId}-${vId}`,
                dealerId: resolvedKeyId,
                auctionId: String(row.auction_id || auctionId),
                activityType: 'BUY',
                vehicleId: vId,
                amount,
                metadata: {
                  vehicleName: row.title || [row.make_name, row.model_name].filter(Boolean).join(' ') || 'Auction Vehicle',
                  regNo: row.registration_number,
                  winningBid: amount,
                  auctionId: row.auction_id || auctionId,
                },
                timestamp: time,
              });
            }
          }
        }
      }

      // 2. Fetch Live & Past Bids Placed by this dealer
      const bidUrl = `${this.baseUrl}/getbuyerBiddingList?customer_id=${encodeURIComponent(resolvedKeyId)}`;
      const bidRes = await fetch(bidUrl, { headers, signal: AbortSignal.timeout(8000) });
      if (bidRes.ok) {
        const json = await bidRes.json();
        const rawBids = json?.data || [];
        const bidRows = Array.isArray(rawBids) ? rawBids : [];
        for (const item of bidRows) {
          const row = item?.view_bidding_list || item;
          if (row) {
            // Filter strictly by auctionId if specified
            if (auctionId && row.auction_id && String(row.auction_id) !== String(auctionId)) {
              continue;
            }
            const bidAmount = Number(row.bid_value || row.bid_amount || 0);
            const bidTime = row.bid_time ? new Date(row.bid_time) : (row.created_at ? new Date(row.created_at) : new Date());
            activities.push({
              transactionId: `BID-${row.auction_id || auctionId}-${row.auction_vehicle_id || row.id || row.vehicle_id || 'VEH'}-${bidAmount}-${bidTime.getTime()}`,
              dealerId: resolvedKeyId,
              auctionId: String(row.auction_id || auctionId),
              activityType: 'BID_PLACED',
              vehicleId: String(row.auction_vehicle_id || row.vehicle_id || row.av_id || ''),
              amount: bidAmount,
              metadata: {
                vehicleName: row.title || [row.make_name, row.model_name].filter(Boolean).join(' ') || 'Bidded Vehicle',
                regNo: row.registration_number,
                bidAmount,
                stage: row.stage,
              },
              timestamp: bidTime,
            });
          }
        }
      }

      // 3. Fetch Sell transactions from master endpoint (with graceful fallback)
      try {
        const sellRes = await fetch(`${this.baseUrlMaster}/getAllListData?type=mobile&screen=event`, {
          headers,
          signal: AbortSignal.timeout(3000),
        });
        if (sellRes.ok) {
          const json = await sellRes.json();
          const rows = json?.data?.data || json?.data || [];
          if (Array.isArray(rows)) {
            for (const row of rows) {
              if ((String(row.customer_id) === resolvedKeyId || String(row.customer_id) === dealerId) && row.stage === 'closed') {
                if (auctionId && row.auction_id && String(row.auction_id) !== String(auctionId)) {
                  continue;
                }
                activities.push({
                  transactionId: `SELL-${row.id || Math.random()}`,
                  dealerId: resolvedKeyId,
                  auctionId: String(row.auction_id || auctionId),
                  activityType: 'SELL',
                  vehicleId: String(row.vehicle_id || row.id || ''),
                  amount: Number(row.price || 0),
                  metadata: {
                    vehicleName: row.model_name || row.vehicle_name,
                    price: row.price,
                  },
                  timestamp: row.completed_at ? new Date(row.completed_at) : new Date(),
                });
              }
            }
          }
        }
      } catch {
        // Master server optional timeout
      }

      // 4. Check Match Participation (Live Room Registration)
      const attendRes = await fetch(`${this.baseUrl}/auctionbidderregistration?auction_id=${encodeURIComponent(auctionId)}`, {
        headers,
        signal: AbortSignal.timeout(6000),
      });
      if (attendRes.ok) {
        const json = await attendRes.json();
        const rows = json?.data || [];
        if (Array.isArray(rows)) {
          const registered = rows.find((r: any) => {
            const bId = String(r.buyer_id || r.customer_id || r.key_id || r.created_by || '');
            return bId === resolvedKeyId || bId === dealerId || this.resolveDealerKeyId(bId) === resolvedKeyId;
          });
          if (registered) {
            activities.push({
              transactionId: `ATTEND-${auctionId}-${resolvedKeyId}`,
              dealerId: resolvedKeyId,
              auctionId,
              activityType: 'MATCH_PARTICIPATION',
              metadata: {
                auctionId,
                depositAmount: registered.deposit_amount,
                registeredAt: registered.created || new Date().toISOString(),
              },
              timestamp: registered.created ? new Date(registered.created) : new Date(),
            });
          }
        }
      }

      // 5. Check Watchlist / Interests
      const interestRes = await fetch(`${this.baseUrl}/getInterests?auction_id=${encodeURIComponent(auctionId)}`, {
        headers,
        signal: AbortSignal.timeout(6000),
      });
      if (interestRes.ok) {
        const json = await interestRes.json();
        const rows = json?.data || [];
        if (Array.isArray(rows)) {
          for (const row of rows) {
            const iId = String(row.customer_id || row.key_id || row.buyer_id || '');
            if (iId === resolvedKeyId || iId === dealerId || this.resolveDealerKeyId(iId) === resolvedKeyId) {
              activities.push({
                transactionId: `WATCH-${auctionId}-${row.id || row.vehicle_id || Math.random()}`,
                dealerId: resolvedKeyId,
                auctionId,
                activityType: 'WATCHLIST_ADD',
                vehicleId: String(row.vehicle_id || ''),
                metadata: {
                  auctionId,
                  regNo: row.reg_num || row.registration_number,
                },
                timestamp: row.created_at ? new Date(row.created_at) : new Date(),
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn('Error querying live TVS activities:', err);
    }

    return activities;
  }

  async getAuctionActivities(auctionId: string = '1991', token?: string): Promise<TVSAuctionActivity[]> {
    const activities: TVSAuctionActivity[] = [];
    let authToken = await this.getValidToken(token);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = authToken;

    await this.loadUserMapping();

    // Fetch vehicles, room registrations, and interests in parallel for maximum speed
    let vehicles: any[] = [];
    let attendees: any[] = [];
    let interests: any[] = [];

    try {
      const [vehRes, attendRes, interestRes] = await Promise.all([
        fetch(`${this.baseUrl}/getAuctionvehicleList?auction_id=${encodeURIComponent(auctionId)}`, {
          headers,
          signal: AbortSignal.timeout(15000),
        }).catch(err => {
          console.warn(`Error querying vehicles for auction ${auctionId}:`, err);
          return null;
        }),
        fetch(`${this.baseUrl}/auctionbidderregistration?auction_id=${encodeURIComponent(auctionId)}`, {
          headers,
          signal: AbortSignal.timeout(8000),
        }).catch(err => {
          console.warn(`Error querying attendees for auction ${auctionId}:`, err);
          return null;
        }),
        fetch(`${this.baseUrl}/getInterests?auction_id=${encodeURIComponent(auctionId)}`, {
          headers,
          signal: AbortSignal.timeout(8000),
        }).catch(err => {
          console.warn(`Error querying interests for auction ${auctionId}:`, err);
          return null;
        }),
      ]);

      // Check for auth token expiration on any response
      if (vehRes?.status === 401 || vehRes?.status === 403 || attendRes?.status === 401 || interestRes?.status === 401) {
        this.invalidateToken();
      }

      if (vehRes && vehRes.ok) {
        try {
          const json = await vehRes.json();
          vehicles = json?.data || [];
        } catch (parseErr) {
          console.warn('Failed to parse vehicle list JSON:', parseErr);
        }
      }

      if (attendRes && attendRes.ok) {
        try {
          const json = await attendRes.json();
          attendees = json?.data || [];
        } catch {}
      }

      if (interestRes && interestRes.ok) {
        try {
          const json = await interestRes.json();
          interests = json?.data || [];
        } catch {}
      }
    } catch (err) {
      console.warn(`Parallel fetch error for auction ${auctionId}:`, err);
    }

    // Build fast lookup map for all vehicles in this auction
    const vehicleMap = new Map<string, any>();
    if (Array.isArray(vehicles)) {
      for (const veh of vehicles) {
        if (veh.id != null) vehicleMap.set(String(veh.id), veh);
        if (veh.vehicle_id != null) vehicleMap.set(String(veh.vehicle_id), veh);
      }
    }

    // 1. Process Winners (BUY transactions) & Sellers (SELL transactions) directly from vehicles list
    if (Array.isArray(vehicles)) {
      for (const veh of vehicles) {
        if (veh.winner_id != null && (veh.winner_bid_value != null || veh.start_bid_value != null)) {
          const buyerDealerId = this.resolveDealerKeyId(veh.winner_id);
          const winAmount = Number(veh.winner_bid_value || veh.start_bid_value || 0);

          // Resolve Seller Dealership from customer_name or TVS customer mapping
          const rawSellerName = (veh.customer_name || '').trim();
          const sellerCustomer = rawSellerName ? this.findCustomerByCompanyName(rawSellerName) : null;
          const sellerDealerId = sellerCustomer?.code || (sellerCustomer?.id ? String(sellerCustomer.id) : (rawSellerName ? `SELLER-${rawSellerName.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30)}` : ''));
          const sellerCity = sellerCustomer?.city || veh.location_name || 'Tamil Nadu';
          const sellerPhone = sellerCustomer?.phone || '';

          // 1A. BUY Activity for winning bidder
          activities.push({
            transactionId: `BUY-${auctionId}-${veh.id || veh.vehicle_id}`,
            dealerId: buyerDealerId,
            auctionId,
            activityType: 'BUY',
            vehicleId: String(veh.vehicle_id || veh.id),
            amount: winAmount,
            metadata: {
              vehicleId: veh.vehicle_id || veh.id,
              vehicleName: veh.title || veh.make_model || 'Auction Vehicle',
              regNo: veh.registration_number,
              winningBid: winAmount,
              winnerId: veh.winner_id,
              // Full Seller Information
              sellerName: rawSellerName,
              sellerDealerId,
              sellerCustomerCode: sellerCustomer?.code || '',
              sellerCustomerId: sellerCustomer?.id || null,
              sellerCity,
              sellerPhone,
              customerName: rawSellerName,
              // Full Vehicle Specs
              fuelType: veh.fuel_type,
              transmission: veh.transmission,
              yearOfMfg: veh.year_of_mfg,
              speedometer: veh.speedometer,
              startBidValue: veh.start_bid_value,
              expectedPrice: veh.expected_price,
              imageUrl: veh.image_url,
              sequence: veh.sequence,
              lotNo: veh.sequence || veh.seq_num,
              location: veh.location_name,
            },
            timestamp: veh.modified ? parseTVSVehicleTimestamp(veh.modified) : new Date(),
          });

          // 1B. SELL Activity for seller / origin dealership
          if (rawSellerName && sellerDealerId) {
            activities.push({
              transactionId: `SELL-${auctionId}-${veh.id || veh.vehicle_id}`,
              dealerId: sellerDealerId,
              auctionId,
              activityType: 'SELL',
              vehicleId: String(veh.vehicle_id || veh.id),
              amount: winAmount,
              metadata: {
                vehicleId: veh.vehicle_id || veh.id,
                vehicleName: veh.title || veh.make_model || 'Auction Vehicle',
                regNo: veh.registration_number,
                saleAmount: winAmount,
                winningBid: winAmount,
                // Full Buyer Information
                buyerDealerId,
                buyerWinnerId: veh.winner_id,
                // Full Seller Information
                sellerName: rawSellerName,
                sellerDealerId,
                sellerCustomerCode: sellerCustomer?.code || '',
                sellerCustomerId: sellerCustomer?.id || null,
                sellerCity,
                sellerPhone,
                customerName: rawSellerName,
                // Full Vehicle Specs
                fuelType: veh.fuel_type,
                transmission: veh.transmission,
                yearOfMfg: veh.year_of_mfg,
                speedometer: veh.speedometer,
                startBidValue: veh.start_bid_value,
                expectedPrice: veh.expected_price,
                imageUrl: veh.image_url,
                sequence: veh.sequence,
                lotNo: veh.sequence || veh.seq_num,
                location: veh.location_name,
              },
              timestamp: veh.modified ? parseTVSVehicleTimestamp(veh.modified) : new Date(),
            });
          }
        }
      }
    }

    // 2. Room Attendees / Registered Bidders in this auction (MATCH_PARTICIPATION & Pre-bids)
    if (Array.isArray(attendees)) {
      for (const row of attendees) {
        const rawBidderId = row.buyer_id || row.customer_id || row.key_id || row.created_by;
        if (!rawBidderId) continue;
        const dealerId = this.resolveDealerKeyId(rawBidderId);

        const vId = row.vehicle_id != null ? String(row.vehicle_id) : '';
        const matchedVeh = vId ? vehicleMap.get(vId) : null;

        // Room registration attendance
        activities.push({
          transactionId: `ATTEND-${auctionId}-${dealerId}`,
          dealerId,
          auctionId,
          activityType: 'MATCH_PARTICIPATION',
          metadata: {
            auctionId,
            vehicleId: row.vehicle_id,
            vehicleName: matchedVeh?.title || matchedVeh?.make_model || (vId ? `Vehicle #${vId}` : undefined),
            regNo: matchedVeh?.registration_number,
            fuelType: matchedVeh?.fuel_type,
            transmission: matchedVeh?.transmission,
            yearOfMfg: matchedVeh?.year_of_mfg,
            speedometer: matchedVeh?.speedometer,
            startBidValue: matchedVeh?.start_bid_value,
            expectedPrice: matchedVeh?.expected_price,
            imageUrl: matchedVeh?.image_url,
            sequence: matchedVeh?.sequence,
            lotNo: matchedVeh?.sequence || matchedVeh?.seq_num,
            location: matchedVeh?.location_name,
            customerName: matchedVeh?.customer_name,
            depositAmount: row.deposit_amount,
            status: row.status,
          },
          timestamp: row.created ? new Date(row.created) : new Date(),
        });

        // If dealer placed a pre-bid before auction start
        if (row.pre_bid_value && Number(row.pre_bid_value) > 0) {
          const preAmount = Number(row.pre_bid_value);
          activities.push({
            transactionId: `PREBID-${auctionId}-${row.vehicle_id || 'VEH'}-${dealerId}-${preAmount}`,
            dealerId,
            auctionId,
            activityType: 'BID_PLACED',
            vehicleId: String(row.vehicle_id || ''),
            amount: preAmount,
            metadata: {
              auctionId,
              vehicleId: row.vehicle_id,
              vehicleName: matchedVeh?.title || matchedVeh?.make_model || (vId ? `Vehicle #${vId}` : undefined),
              regNo: matchedVeh?.registration_number,
              fuelType: matchedVeh?.fuel_type,
              transmission: matchedVeh?.transmission,
              yearOfMfg: matchedVeh?.year_of_mfg,
              speedometer: matchedVeh?.speedometer,
              startBidValue: matchedVeh?.start_bid_value,
              expectedPrice: matchedVeh?.expected_price,
              imageUrl: matchedVeh?.image_url,
              sequence: matchedVeh?.sequence,
              lotNo: matchedVeh?.sequence || matchedVeh?.seq_num,
              location: matchedVeh?.location_name,
              customerName: matchedVeh?.customer_name,
              bidAmount: preAmount,
              isPreBid: true,
              note: 'Pre-auction bid',
            },
            timestamp: row.pre_bid_date ? new Date(row.pre_bid_date) : (row.created ? new Date(row.created) : new Date()),
          });
        }
      }
    }

    // 3. Watchlist / Interested Dealers in this auction (WATCHLIST_ADD)
    if (Array.isArray(interests)) {
      for (const row of interests) {
        const rawId = row.customer_id || row.key_id || row.buyer_id || row.created_by;
        if (!rawId) continue;
        const dealerId = this.resolveDealerKeyId(rawId);
        const vId = row.vehicle_id != null ? String(row.vehicle_id) : '';
        const matchedVeh = vId ? vehicleMap.get(vId) : null;
        activities.push({
          transactionId: `WATCH-${auctionId}-${row.id || row.vehicle_id || dealerId}`,
          dealerId,
          auctionId,
          activityType: 'WATCHLIST_ADD',
          vehicleId: String(row.vehicle_id || ''),
          metadata: {
            auctionId,
            vehicleId: row.vehicle_id,
            vehicleName: matchedVeh?.title || matchedVeh?.make_model,
            regNo: matchedVeh?.registration_number || row.reg_num || row.registration_number,
            fuelType: matchedVeh?.fuel_type,
            transmission: matchedVeh?.transmission,
            yearOfMfg: matchedVeh?.year_of_mfg,
            speedometer: matchedVeh?.speedometer,
            imageUrl: matchedVeh?.image_url,
            sequence: matchedVeh?.sequence,
            lotNo: matchedVeh?.sequence || matchedVeh?.seq_num,
            location: matchedVeh?.location_name,
          },
          timestamp: row.created_at ? new Date(row.created_at) : new Date(),
        });
      }
    }

    // 4. Live Bids on Auction Vehicles (BID_PLACED)
    // Intelligent filtering:
    //  - Always poll vehicles actively on the auction block (stage === 'live')
    //  - Poll newly closed/awarded/finished vehicles once to capture final bids, then mark settled
    //  - Skip catalog vehicles ('listed'/'upcoming' without active bidding) to avoid 150+ redundant slow HTTP requests
    if (Array.isArray(vehicles) && vehicles.length > 0) {
      const vehiclesToQuery = vehicles.filter((veh: any) => {
        const stage = String(veh.stage || '').toLowerCase().trim();
        const isLive = stage === 'live' || stage === 'active' || stage === 'running' || stage === 'bidding';
        if (isLive) return true;
        if (this.settledVehicleIds.has(veh.id)) return false;
        const isCatalog = stage === 'listed' || stage === 'upcoming' || stage === 'pending' || stage === '';
        const hasFinished = veh.winner_id != null || (!isCatalog && stage !== '');
        const hasBids = Number(veh.current_bid || 0) > 0;
        return hasFinished || hasBids;
      });

      if (vehiclesToQuery.length > 0) {
        const batchSize = 10;
        for (let i = 0; i < vehiclesToQuery.length; i += batchSize) {
          const batch = vehiclesToQuery.slice(i, i + batchSize);
          const promises = batch.map(async (veh: any) => {
            try {
              const liveBidsRes = await fetch(
                `${this.baseUrl}/getLiveBids?auction_id=${encodeURIComponent(auctionId)}&auction_vehile_id=${veh.id}`,
                { headers, signal: AbortSignal.timeout(5000) }
              );

              if (liveBidsRes.status === 401 || liveBidsRes.status === 403) {
                this.invalidateToken();
                return;
              }

              if (liveBidsRes.ok) {
                const bidsJson = await liveBidsRes.json();
                const bList = bidsJson?.data || [];
                if (Array.isArray(bList)) {
                  for (const bItem of bList) {
                    const bid = bItem?.bidderDetails || bItem;
                    const rawBidderId = bid.bidder_id || bid.buyer_id || bid.customer_id;
                    if (!rawBidderId) continue;
                    const dealerId = this.resolveDealerKeyId(rawBidderId);
                    const bidAmount = Number(bid.bid_value || bid.bid_amount || 0);
                    const bidId = bid.id || `${bidAmount}-${bid.bid_time || ''}`;
                    const bidTime = bid.bid_time ? new Date(bid.bid_time) : (bid.created_at ? new Date(bid.created_at) : new Date());
                    const isPreBid = Boolean(bid.isprebid) || Boolean(bid.isPreBid);

                    // Align transaction ID with pre-bid format to prevent double-counting pre-bids
                    const txnId = isPreBid
                      ? `PREBID-${auctionId}-${veh.vehicle_id || veh.id}-${dealerId}-${bidAmount}`
                      : `BID-${auctionId}-${veh.id}-${bidId}`;

                    activities.push({
                      transactionId: txnId,
                      dealerId,
                      auctionId,
                      activityType: 'BID_PLACED',
                      vehicleId: String(veh.vehicle_id || veh.id),
                      amount: bidAmount,
                      metadata: {
                        vehicleId: veh.vehicle_id || veh.id,
                        vehicleName: veh.title || veh.make_model || 'Auction Vehicle',
                        regNo: veh.registration_number,
                        bidAmount,
                        bidderName: bid.bidder_name,
                        bidRank: bid.rn,
                        isLeadingBid: bid.rn === 1,
                        totalBids: bid.total_bids,
                        isPreBid,
                        fuelType: veh.fuel_type,
                        transmission: veh.transmission,
                        yearOfMfg: veh.year_of_mfg,
                        speedometer: veh.speedometer,
                        startBidValue: veh.start_bid_value,
                        imageUrl: veh.image_url,
                        sequence: veh.sequence,
                      },
                      timestamp: bidTime,
                    });
                  }
                }

                // If vehicle has ended, mark settled so we don't query it on every cycle
                const stage = String(veh.stage || '').toLowerCase().trim();
                const isLive = stage === 'live' || stage === 'active' || stage === 'running' || stage === 'bidding';
                if (!isLive && (veh.winner_id != null || (stage !== 'listed' && stage !== 'upcoming' && stage !== ''))) {
                  this.settledVehicleIds.add(veh.id);
                }
              }
            } catch {
              // Ignore single vehicle timeout
            }
          });

          await Promise.allSettled(promises);
        }
      }
    }

    return activities;
  }

  async getAuctionVehicles(auctionId: string = '2003', token?: string): Promise<any[]> {
    let authToken = await this.getValidToken(token);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = authToken;
    try {
      const res = await fetch(`${this.baseUrl}/getAuctionvehicleList?auction_id=${encodeURIComponent(auctionId)}`, {
        headers,
        signal: AbortSignal.timeout(12000),
      });
      if (res.ok) {
        const json = await res.json();
        return json?.data || [];
      }
    } catch (err) {
      console.warn(`Error querying vehicles for auction ${auctionId}:`, err);
    }
    return [];
  }
}

// ─── Mock Implementation ────────────────────────────────────────────────────

export class MockTVSAuctionProvider implements TVSAuctionProvider {
  private mockTokens: Map<string, { userId: string; dealerId: string }> = new Map();

  constructor() {
    for (let i = 1; i <= 50; i++) {
      const dealerId = `TVS-DLR-${String(i).padStart(4, '0')}`;
      this.mockTokens.set(`mock-token-${i}`, {
        userId: `USER-${i}`,
        dealerId,
      });
    }
  }

  async authenticateWithCredentials(username: string, password?: string): Promise<TVSAuthResult> {
    const trimmed = (username || '').trim();
    let num = 1;

    const match = trimmed.match(/^TVS-DLR-(\d+)$/i) || trimmed.match(/^DLR-(\d+)$/i) || trimmed.match(/^(\d{1,4})$/);
    if (match) {
      num = parseInt(match[1]);
    }

    if (num >= 1 && num <= 50 && (password === 'tvs123' || !password)) {
      const dealerId = `TVS-DLR-${String(num).padStart(4, '0')}`;
      return {
        authenticated: true,
        userId: `USER-${num}`,
        dealerId,
        dealerName: `Dealer ${num}`,
        city: 'Chennai',
        token: `mock-token-${num}`,
      };
    }

    return { authenticated: false, error: 'Invalid mock credentials' };
  }

  async verifyAuthentication(token: string): Promise<TVSAuthResult> {
    const identity = this.mockTokens.get(token);
    if (identity) {
      return {
        authenticated: true,
        userId: identity.userId,
        dealerId: identity.dealerId,
        token,
      };
    }

    const directMatch = token.match(/^TVS-DLR-(\d+)$/i);
    if (directMatch) {
      return {
        authenticated: true,
        userId: `USER-${parseInt(directMatch[1])}`,
        dealerId: token.toUpperCase(),
        token,
      };
    }

    return { authenticated: false, error: 'Invalid token' };
  }

  async getDealerProfile(userId: string): Promise<TVSDealerProfile | null> {
    const num = userId.replace('USER-', '');
    return {
      userId,
      dealerId: `TVS-DLR-${String(num).padStart(4, '0')}`,
      dealerName: `Dealer ${num}`,
      city: 'Chennai',
    };
  }

  async getDealerActivities(): Promise<TVSAuctionActivity[]> {
    return [];
  }

  async getAuctionActivities(): Promise<TVSAuctionActivity[]> {
    return [];
  }

  async getAuctionVehicles(): Promise<any[]> {
    return [];
  }

  findCustomerByCompanyName(): TVSCustomerProfile | null {
    return null;
  }
}

// ─── Provider Factory ───────────────────────────────────────────────────────

let providerInstance: TVSAuctionProvider | null = null;

export function getTVSProvider(): TVSAuctionProvider {
  if (!providerInstance) {
    providerInstance = new RealTVSAuctionProvider();
  }
  return providerInstance;
}
