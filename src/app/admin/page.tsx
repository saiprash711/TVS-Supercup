'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  Activity, 
  Users, 
  Settings, 
  Calendar, 
  FileText, 
  RefreshCw, 
  Download, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  Radio, 
  TrendingUp, 
  LogOut, 
  Maximize2, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Gavel, 
  ShoppingCart, 
  DollarSign, 
  Sparkles, 
  Clock,
  History,
  ChevronDown,
  ChevronUp, 
  Layers,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Zap,
  Award,
  AlertTriangle,
  Eye,
  EyeOff,
  Lock,
  Car,
  Fuel,
  Gauge,
  ExternalLink,
  X,
  Copy,
  Check,
  Info,
  MapPin,
  Hash,
  Shield
} from 'lucide-react';
import TickerMarquee from '../components/TickerMarquee';
import SwitchMode from '../components/watermelon/switch-mode';

interface AdminStats {
  totalDealers: number;
  activeDealers: number;
  totalPoints: number;
  matchParticipation: number;
  buyTransactions: number;
  sellTransactions: number;
  totalBids?: number;
  totalInspections?: number;
  totalWatchlist?: number;
  totalActivities?: number;
}

interface RecentActivityItem {
  id: number;
  dealerName: string;
  externalDealerId: string;
  city: string;
  activityType: string;
  points: number;
  metadata: any;
  timestamp: string;
  auctionId: string;
  matchNumber: number;
}

interface LeaderboardDealer {
  rank: number;
  dealerName: string;
  maskedName: string;
  externalId: string;
  city: string;
  points: number;
  dealerId: number;
}

interface MatchDay {
  id: number;
  matchNumber: number;
  date: string;
  status: string;
  auctionId: string;
}

interface PointRuleItem {
  id: number;
  activityType: string;
  points: number;
  description: string;
  active: boolean;
}

interface AuditEntry {
  id: number;
  adminUser: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  reason: string;
  createdAt: string;
}

interface DealerDetail {
  id: number;
  externalDealerId: string;
  displayName: string;
  maskedName: string;
  city: string;
  status: string;
  scores: Array<{ totalPoints: number; rank: number }>;
  activities: Array<{
    id: number;
    activityType: string;
    points: number;
    timestamp: string;
    externalTransactionId: string;
    match: { matchNumber: number; date: string } | null;
  }>;
}

interface LiveActivityItem {
  id: number;
  dealerId: number;
  dealerName: string;
  externalDealerId: string;
  city: string;
  activityType: string;
  points: number;
  metadata: Record<string, any>;
  timestamp: string;
  externalTransactionId?: string;
  createdAt?: string;
  matchId?: number;
}

interface LiveAuctionStats {
  totalBids: number;
  totalBuys: number;
  totalSells: number;
  totalParticipation: number;
  totalInspections: number;
  totalWatchlist: number;
  totalActivities: number;
  activeDealersCount: number;
  auctionId: string;
  auctionTitle: string;
  auctionTime: string;
  totalVehicles: number;
}

interface AuctionVehicleItem {
  id: number;
  vehicleId: string | number;
  lotNumber: number;
  sequence: number;
  title: string;
  makeModel: string;
  makeName: string;
  modelName: string;
  registrationNumber: string;
  fuelType: string;
  transmission: string;
  yearOfMfg: string | number;
  speedometer: string | number;
  startBidValue: number;
  currentBid: number;
  winnerBidValue: number | null;
  winnerId: string | number | null;
  stage: string;
  vehicleStatus: string;
  imageUrl: string;
  preBidValue: number | null;
  hasPreBid: boolean;
  locationName: string;
  status: 'COMPLETED' | 'ONGOING' | 'UPCOMING';
}

interface VehicleQueueStats {
  total: number;
  completed: number;
  ongoing: number;
  upcoming: number;
  activeLotNumber: number | null;
  isAllCompleted: boolean;
  percentComplete: number;
}

type Tab = 'overview' | 'leaderboard' | 'liveMonitor' | 'dealers' | 'rules' | 'matches' | 'audit';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardDealer[]>([]);
  const [showMaskedPreview, setShowMaskedPreview] = useState(false);
  const [overviewLeaderboardLimit, setOverviewLeaderboardLimit] = useState(30);
  const [matchDays, setMatchDays] = useState<MatchDay[]>([]);
  const [rules, setRules] = useState<PointRuleItem[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [selectedDealer, setSelectedDealer] = useState<DealerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Live Monitor State
  const [liveActivities, setLiveActivities] = useState<LiveActivityItem[]>([]);
  const [liveStats, setLiveStats] = useState<LiveAuctionStats | null>(null);
  const [liveAutoRefresh, setLiveAutoRefresh] = useState(true);
  const [liveFilter, setLiveFilter] = useState<string>('ALL');
  const [liveSearchQuery, setLiveSearchQuery] = useState<string>('');
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveAuctionId, setLiveAuctionId] = useState('2003');
  const [customAuctionInput, setCustomAuctionInput] = useState('');

  // Auction Vehicle Run Order & Upcoming Cars State
  const [vehicleQueueStats, setVehicleQueueStats] = useState<VehicleQueueStats | null>(null);
  const [ongoingCar, setOngoingCar] = useState<AuctionVehicleItem | null>(null);
  const [nextCar, setNextCar] = useState<AuctionVehicleItem | null>(null);
  const [upcomingCars, setUpcomingCars] = useState<AuctionVehicleItem[]>([]);
  const [allAuctionVehicles, setAllAuctionVehicles] = useState<AuctionVehicleItem[]>([]);
  const [vehicleQueueLoading, setVehicleQueueLoading] = useState(false);
  const [vehicleViewTab, setVehicleViewTab] = useState<'UPCOMING_5' | 'ALL' | 'COMPLETED' | 'UPCOMING'>('UPCOMING_5');
  const [vehicleSearchFilter, setVehicleSearchFilter] = useState('');
  const [manualLotOverride, setManualLotOverride] = useState<string>('auto');

  // Video Telecast State
  const [telecastPlaying, setTelecastPlaying] = useState(true);
  const [telecastMuted, setTelecastMuted] = useState(true);
  const [showFullTelecast, setShowFullTelecast] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Adjust modal state
  const [adjustModal, setAdjustModal] = useState<{ dealerId: number; dealerName: string } | null>(null);
  const [adjustPoints, setAdjustPoints] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // Export modal state
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Selected Activity Detail Modal State
  const [selectedActivity, setSelectedActivity] = useState<LiveActivityItem | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [showRawPayload, setShowRawPayload] = useState(false);
  const [showHistorical, setShowHistorical] = useState(false);

  const handleOpenActivityDetails = (act: LiveActivityItem) => {
    setSelectedActivity(act);
    setSelectedImageIndex(0);
    setCopiedPayload(false);
    setShowRawPayload(false);
  };

  const getVehicleImages = (imgData: any): string[] => {
    if (!imgData) return [];
    if (Array.isArray(imgData)) return imgData.filter(Boolean);
    if (typeof imgData === 'string') {
      const trimmed = imgData.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed.filter(Boolean);
          if (typeof parsed === 'object' && parsed !== null) {
            const list: string[] = [];
            for (const key of ['frontview', 'rearview', 'leftsideview', 'rightsideview', 'odometer', 'dashboard', 'enginecompartment']) {
              if (Array.isArray(parsed[key])) {
                list.push(...parsed[key]);
              } else if (typeof parsed[key] === 'string') {
                list.push(parsed[key]);
              }
            }
            if (list.length > 0) return list;
          }
        } catch {}
      }
      if (trimmed.startsWith('http')) return [trimmed];
    }
    return [];
  };

  // Only LIVE or UPCOMING auctions should be shown (exclude completed/old matches like 1978, 1991)
  const activeMatches = useMemo(() => {
    const filtered = matchDays.filter(m => m.status === 'LIVE' || m.status === 'UPCOMING');
    if (filtered.length > 0) return filtered;
    return [
      { id: 3, matchNumber: 3, auctionId: '2003', date: '2026-09-24T08:30:00Z', status: 'LIVE' },
    ] as MatchDay[];
  }, [matchDays]);

  // Historical / completed auctions for browsing past match data
  const historicalMatches = useMemo(() => {
    return matchDays.filter(m => m.status === 'COMPLETED').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [matchDays]);

  const currentMatch = useMemo(() => {
    return matchDays.find(m => String(m.auctionId) === String(liveAuctionId)) ||
           activeMatches.find(m => String(m.auctionId) === String(liveAuctionId));
  }, [matchDays, activeMatches, liveAuctionId]);

  const liveMatch = useMemo(() => {
    return matchDays.find(m => m.status === 'LIVE') ||
           activeMatches.find(m => m.status === 'LIVE');
  }, [matchDays, activeMatches]);

  // Helper: compute schedule label
  const getAuctionScheduleLabel = (targetAuctionId: string = liveAuctionId) => {
    const match = matchDays.find(m => String(m.auctionId) === String(targetAuctionId.trim()));
    if (match?.date) {
      const matchDate = new Date(match.date);
      const now = new Date();
      const isToday = now.toDateString() === matchDate.toDateString();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const isTomorrow = tomorrow.toDateString() === matchDate.toDateString();
      const istTime = '2:00 PM IST';
      
      if (match.status === 'COMPLETED' || matchDate.getTime() < now.getTime() - 24 * 3600 * 1000) {
        return `${matchDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' })} (Completed)`;
      }
      if (isToday) return `Today at ${istTime} (LIVE)`;
      if (isTomorrow) return `Tomorrow at ${istTime}`;
      return `${matchDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })} at ${istTime}`;
    }

    const now = new Date();
    const auctionDate = new Date(now);
    const dayOfWeek = auctionDate.getDay();
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
    if (daysUntilThursday === 0) {
      const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      if (istNow.getHours() >= 16) {
        auctionDate.setDate(auctionDate.getDate() + 7);
      }
    } else {
      auctionDate.setDate(auctionDate.getDate() + daysUntilThursday);
    }
    const isToday = now.toDateString() === auctionDate.toDateString();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const isTomorrow = tomorrow.toDateString() === auctionDate.toDateString();
    if (isToday) return 'Today at 2:00 PM IST';
    if (isTomorrow) return 'Tomorrow at 2:00 PM IST';
    return `${auctionDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at 2:00 PM IST`;
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/auth', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const data = await res.json();
      setAuthenticated(data.authenticated);
      return data.authenticated;
    } catch {
      return false;
    }
  }, []);

  const handleLogin = async () => {
    const trimmed = password.trim();
    if (!trimmed) {
      showToast('Please enter administrator password', 'error');
      return;
    }
    setLoginLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password: trimmed }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthenticated(true);
        showToast('Access granted. Welcome to Admin Command Center!', 'success');
        loadData(false, true);
      } else {
        showToast(data.error || 'Invalid administrator password', 'error');
      }
    } catch {
      showToast('Network error while connecting to authentication service.', 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const loadData = useCallback(async (keepAuctionId = false, showFullLoader = false) => {
    if (showFullLoader) setLoading(true);
    setStatsError(null);
    try {
      const res = await fetch('/api/admin?action=stats', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (res.status === 401 || res.status === 403) {
        setAuthenticated(false);
        setStatsError('Session expired or access denied. Please sign in.');
        showToast('Administrator session expired. Please sign in.', 'error');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Server returned HTTP ${res.status}`);
      }
      if (data.stats) {
        setStats(data.stats);
        setLeaderboard(data.leaderboard || []);
        if (data.recentActivities) {
          setRecentActivities(data.recentActivities);
        }
        const matches: MatchDay[] = data.matchDays || [];
        setMatchDays(matches);
        if (!keepAuctionId) {
          // Default to LIVE auction first, then UPCOMING auction — never an old completed auction
          const liveOrUpcomingMatch = matches.find(m => m.status === 'LIVE') ||
                                      matches.find(m => m.status === 'UPCOMING') ||
                                      matches[0];
          if (liveOrUpcomingMatch?.auctionId) {
            setLiveAuctionId(prev => {
              const prevMatch = matches.find(m => String(m.auctionId) === String(prev));
              if (!prev || prev === '1978' || prev === '1991' || prevMatch?.status === 'COMPLETED') {
                return liveOrUpcomingMatch.auctionId!;
              }
              return prev;
            });
          }
        }
      } else {
        setStatsError(data?.error || 'No statistics returned from server');
      }
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      const msg = err?.message || 'Failed to fetch admin overview telemetry';
      setStatsError(msg);
      showToast(msg.length < 55 ? msg : 'Failed to load overview data', 'error');
    } finally {
      if (showFullLoader) setLoading(false);
    }
  }, []);

  const loadRules = useCallback(async () => {
    const res = await fetch('/api/admin?action=rules');
    const data = await res.json();
    if (data.rules) setRules(data.rules);
  }, []);

  const loadAudit = useCallback(async () => {
    const res = await fetch('/api/admin?action=audit');
    const data = await res.json();
    if (data.logs) setAuditLog(data.logs);
  }, []);

  const loadLiveActivities = useCallback(async (
    autoSync = false,
    filter = liveFilter,
    search = liveSearchQuery,
    overrideAuctionId?: string
  ) => {
    const targetId = (overrideAuctionId !== undefined ? overrideAuctionId : liveAuctionId).trim() || '1991';
    setLiveLoading(true);
    try {
      const syncParam = autoSync ? '&sync=true' : '';
      const auctionParam = `&auctionId=${encodeURIComponent(targetId)}`;
      const filterParam = filter && filter !== 'ALL' ? `&type=${encodeURIComponent(filter)}` : '';
      const searchParam = search?.trim() ? `&search=${encodeURIComponent(search.trim())}` : '';
      const res = await fetch(`/api/admin?action=liveActivities${syncParam}${auctionParam}${filterParam}${searchParam}&take=200`);
      const data = await res.json();
      if (data.activities) {
        setLiveActivities(data.activities);
        setLiveStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load live activities:', err);
    } finally {
      setLiveLoading(false);
    }
  }, [liveAuctionId, liveFilter, liveSearchQuery]);

  const loadAuctionVehicles = useCallback(async (
    targetAuctionId?: string,
    currentLotOverride?: string
  ) => {
    const aId = (targetAuctionId || liveAuctionId || '2003').trim();
    const lotParam = currentLotOverride !== undefined ? currentLotOverride : manualLotOverride;
    setVehicleQueueLoading(true);
    try {
      const url = `/api/admin?action=auctionVehicles&auctionId=${encodeURIComponent(aId)}${lotParam !== 'auto' ? `&currentLot=${encodeURIComponent(lotParam)}` : ''}`;
      const res = await fetch(url, { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        if (data.vehicles) {
          setAllAuctionVehicles(data.vehicles);
          setVehicleQueueStats(data.stats);
          setOngoingCar(data.ongoingCar || null);
          setNextCar(data.nextCar || null);
          setUpcomingCars(data.upcomingCars || []);
        }
      }
    } catch (err) {
      console.warn('Failed to load auction vehicles queue:', err);
    } finally {
      setVehicleQueueLoading(false);
    }
  }, [liveAuctionId, manualLotOverride]);

  const handleStepLot = (newLot: number | string) => {
    const lotStr = String(newLot);
    setManualLotOverride(lotStr);
    loadAuctionVehicles(liveAuctionId, lotStr);
  };

  const handleOpenVehicleDetails = (veh: AuctionVehicleItem) => {
    const mockActivity: LiveActivityItem = {
      id: Number(veh.id || veh.vehicleId || Math.floor(Math.random() * 100000)),
      dealerId: veh.winnerId ? Number(veh.winnerId) : 0,
      dealerName: veh.status === 'COMPLETED' ? (veh.winnerId ? `Winner Dealer #${veh.winnerId}` : 'Hammered / Closed') : (veh.status === 'ONGOING' ? 'Active Lot on Block' : 'Upcoming in Queue'),
      externalDealerId: veh.winnerId ? String(veh.winnerId) : 'N/A',
      city: veh.locationName || 'Tamil Nadu',
      activityType: veh.status === 'COMPLETED' ? 'BUY' : (veh.status === 'ONGOING' ? 'BID_PLACED' : 'VEHICLE_INSPECTED'),
      points: veh.status === 'COMPLETED' ? 10 : (veh.status === 'ONGOING' ? 2 : 1),
      metadata: {
        vehicleId: veh.vehicleId || veh.id,
        vehicleName: veh.title,
        regNo: veh.registrationNumber,
        fuelType: veh.fuelType,
        transmission: veh.transmission,
        yearOfMfg: veh.yearOfMfg,
        speedometer: veh.speedometer,
        startBidValue: veh.startBidValue,
        bidAmount: veh.currentBid,
        winningBid: veh.winnerBidValue,
        imageUrl: veh.imageUrl,
        sequence: veh.sequence,
        lotNo: veh.lotNumber,
        location: veh.locationName,
        isPreBid: veh.hasPreBid,
        preBidValue: veh.preBidValue,
        stage: veh.stage,
        auctionId: liveAuctionId,
      },
      timestamp: new Date().toISOString(),
    };
    setSelectedActivity(mockActivity);
    setSelectedImageIndex(0);
    setCopiedPayload(false);
    setShowRawPayload(false);
  };

  const filteredVehiclesList = useMemo(() => {
    let list = allAuctionVehicles;
    if (vehicleViewTab === 'COMPLETED') {
      list = list.filter(v => v.status === 'COMPLETED');
    } else if (vehicleViewTab === 'UPCOMING') {
      list = list.filter(v => v.status === 'UPCOMING');
    }
    if (vehicleSearchFilter.trim()) {
      const q = vehicleSearchFilter.toLowerCase().trim();
      list = list.filter(v => 
        (v.title || '').toLowerCase().includes(q) ||
        (v.registrationNumber || '').toLowerCase().includes(q) ||
        String(v.lotNumber).includes(q) ||
        (v.fuelType || '').toLowerCase().includes(q) ||
        (v.transmission || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allAuctionVehicles, vehicleViewTab, vehicleSearchFilter]);

  const handleMatchSelect = (newAuctionId: string) => {
    const cleaned = String(newAuctionId).trim();
    if (!cleaned) return;
    setLiveAuctionId(cleaned);
    setLiveFilter('ALL'); // Reset filter to ALL so all records are visible
    setLiveSearchQuery('');
    setManualLotOverride('auto');
    loadLiveActivities(false, 'ALL', '', cleaned);
    loadAuctionVehicles(cleaned, 'auto');
    showToast(`Loaded Match Auction #${cleaned} Telemetry Feed`);
  };

  const handleCustomAuctionSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customAuctionInput.trim()) return;
    handleMatchSelect(customAuctionInput.trim());
    setCustomAuctionInput('');
  };

  const loadDealerDetail = async (dealerId: number) => {
    const res = await fetch(`/api/admin?action=dealer&id=${dealerId}`);
    const data = await res.json();
    if (data.dealer) setSelectedDealer(data.dealer);
  };

  useEffect(() => {
    checkAuth().then(isAuth => {
      if (isAuth) loadData(false, true);
    });
  }, [checkAuth, loadData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedActivity) {
        setSelectedActivity(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedActivity]);

  useEffect(() => {
    if (authenticated && activeTab === 'overview' && !stats && !loading) {
      loadData(false, true);
    }
    if (authenticated && activeTab === 'rules') loadRules();
    if (authenticated && activeTab === 'audit') loadAudit();
    if (authenticated && activeTab === 'liveMonitor') {
      const currentMatch = matchDays.find(m => String(m.auctionId) === String(liveAuctionId));
      const isCompleted = currentMatch?.status === 'COMPLETED';

      loadLiveActivities(liveAutoRefresh && !isCompleted, liveFilter, liveSearchQuery, liveAuctionId);
      loadAuctionVehicles(liveAuctionId);

      if (liveAutoRefresh && !isCompleted) {
        const interval = setInterval(() => {
          loadLiveActivities(true, liveFilter, liveSearchQuery, liveAuctionId);
          loadAuctionVehicles(liveAuctionId);
        }, 10000);
        return () => clearInterval(interval);
      }
    }
  }, [authenticated, activeTab, stats, loading, liveAutoRefresh, liveFilter, liveAuctionId, matchDays, loadRules, loadAudit, loadLiveActivities, loadAuctionVehicles, loadData]);

  const handleSyncLiveAuction = async () => {
    setSyncing(true);
    const targetId = liveAuctionId.trim() || '1991';
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'syncLiveAuction', auctionId: targetId }),
      });
      const data = await res.json();
      if (data.success) {
        const msg = data.processed > 0
          ? `⚡ Live Auction #${targetId} Synced! ${data.processed} new activities processed, ${data.pointsAwarded} points awarded.`
          : `⚡ Live Auction #${targetId} Synced! All activities up-to-date (${data.totalActivitiesFound ?? 0} total records).`;
        showToast(msg);
        loadData(true, false);
        loadLiveActivities(false, liveFilter, liveSearchQuery, targetId);
      } else {
        showToast(data.error || 'Failed to sync live auction', 'error');
      }
    } catch {
      showToast('Failed to connect to sync gateway', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleRecalculate = async () => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'recalculate', reason: 'Manual admin recalculation' }),
    });
    const data = await res.json();
    if (data.success) {
      showToast('Super Cup scores & rankings recalculated successfully!');
      loadData();
    } else {
      showToast('Recalculation failed', 'error');
    }
  };

  const handleAdjustPoints = async () => {
    if (!adjustModal || !adjustPoints || !adjustReason) return;
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'adjust',
        dealerId: adjustModal.dealerId,
        points: parseInt(adjustPoints),
        reason: adjustReason,
      }),
    });
    const data = await res.json();
    if (data.success) {
      showToast('Points adjusted and audit entry logged successfully!');
      setAdjustModal(null);
      setAdjustPoints('');
      setAdjustReason('');
      loadData();
    } else {
      showToast('Adjustment failed', 'error');
    }
  };

  const handleUpdateRule = async (ruleId: number, newPoints: number) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateRule', ruleId, newPoints }),
    });
    const data = await res.json();
    if (data.success) {
      showToast('Rule points updated!');
      loadRules();
    } else {
      showToast('Failed to update rule', 'error');
    }
  };

  const handleToggleRule = async (ruleId: number, currentActive: boolean) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateRule', ruleId, active: !currentActive }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Rule ${!currentActive ? 'enabled' : 'disabled'}!`);
      loadRules();
    } else {
      showToast('Failed to toggle rule', 'error');
    }
  };

  const handleUpdateMatch = async (matchId: number, status: string) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateMatch', matchId, status }),
    });
    const data = await res.json();
    if (data.success) {
      showToast('Match day status updated!');
      loadData();
    }
  };

  const handleExport = () => {
    setExportModalOpen(true);
  };

  const triggerExportDownload = (type: 'dealers' | 'activities' | 'allActivities', format: 'xlsx' | 'csv' = 'xlsx') => {
    const ext = format.toUpperCase();
    if (type === 'allActivities') {
      window.open(`/api/admin?action=export&type=activities&all=true&format=${format}`, '_blank');
      showToast(`Downloading Full Live Telemetry Log (${ext})...`);
    } else if (type === 'activities') {
      window.open(`/api/admin?action=export&type=activities&auctionId=${encodeURIComponent(liveAuctionId || '1991')}&format=${format}`, '_blank');
      showToast(`Downloading Auction #${liveAuctionId || '1991'} Buyers & Sellers Ledger (${ext})...`);
    } else {
      window.open(`/api/admin?action=export&type=dealers&format=${format}`, '_blank');
      showToast(`Downloading Dealer Leaderboard Summary (${ext})...`);
    }
  };

  const triggerCsvDownload = (type: 'dealers' | 'activities' | 'allActivities') => triggerExportDownload(type, 'csv');

  const triggerDownloadBoth = (format: 'xlsx' | 'csv' = 'xlsx') => {
    window.open(`/api/admin?action=export&type=activities&auctionId=${encodeURIComponent(liveAuctionId || '1991')}&format=${format}`, '_blank');
    setTimeout(() => {
      window.open(`/api/admin?action=export&type=dealers&format=${format}`, '_blank');
    }, 600);
    showToast(`Downloading Auction Transactions & Dealer Summary (${format.toUpperCase()})...`);
  };

  const toggleTelecastPlay = () => {
    if (!videoRef.current) return;
    if (telecastPlaying) {
      videoRef.current.pause();
      setTelecastPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setTelecastPlaying(true);
    }
  };

  const toggleTelecastMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setTelecastMuted(videoRef.current.muted);
  };

  // ─── Login Screen ──────────────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="login-container">
        <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 50 }}>
          <SwitchMode width={58} height={28} />
        </div>
        <div className="floating-orb orb-1"></div>
        <div className="floating-orb orb-2"></div>
        <div className="grid-overlay"></div>

        <div className="login-card double-bezel" style={{ maxWidth: '420px' }}>
          <div className="inner-bezel-core" style={{ padding: '36px 30px' }}>
            <div className="login-header">
              <div className="admin-trophy-badge" style={{ margin: '0 auto 16px', width: '56px', height: '56px', fontSize: '1.8rem' }}>
                🛡️
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(54, 78, 162, 0.12)',
                border: '1px solid rgba(54, 78, 162, 0.3)',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--tvs-blue)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: '12px'
              }}>
                Executive Security Clearance
              </div>
              <h1 className="login-title" style={{ fontSize: '1.5rem' }}>Admin Command Portal</h1>
              <p className="login-subtitle">Enter privileged credentials to access Super Cup control room</p>
            </div>

            <div className="form-group">
              <label className="form-label">Administrator Password</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <span className="input-icon-left">
                  <Lock className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter administrator password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  style={{ paddingRight: '42px' }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted, #94a3b8)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    zIndex: 5,
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              className="btn btn-primary btn-lg" 
              style={{ width: '100%', marginTop: '14px' }} 
              onClick={handleLogin}
              disabled={loginLoading}
            >
              {loginLoading ? 'Verifying Credentials...' : 'Sign In to Command Center'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link href="/" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                ← Return to Public Dealer Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Admin Command Center ─────────────────────────────────────────────
  const filteredLeaderboard = leaderboard.filter(d =>
    d.dealerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.externalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLiveActivities = liveActivities.filter(a => {
    if (liveFilter !== 'ALL' && a.activityType !== liveFilter) return false;
    if (liveSearchQuery) {
      const q = liveSearchQuery.toLowerCase();
      return a.dealerName.toLowerCase().includes(q) ||
             a.externalDealerId.toLowerCase().includes(q) ||
             a.city.toLowerCase().includes(q) ||
             JSON.stringify(a.metadata).toLowerCase().includes(q);
    }
    return true;
  });


  return (
    <div className="page-container">
      {/* Background Ambient Orbs & Grid */}
      <div className="floating-orb orb-1"></div>
      <div className="floating-orb orb-2"></div>
      <div className="floating-orb orb-3"></div>
      <div className="grid-overlay"></div>

      {/* Floating Island Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <Link href="/admin" className="navbar-brand">
            <div className="navbar-logo-wrap">
              <span className="navbar-logo">
                <span>TVS</span> SUPERCUP
              </span>
              <span className="navbar-badge" style={{ background: 'rgba(54, 78, 162, 0.12)', color: 'var(--tvs-blue)', borderColor: 'rgba(54, 78, 162, 0.35)' }}>
                ADMIN MISSION CONTROL
              </span>
            </div>
          </Link>

          <ul className="navbar-nav">
            <li>
              <Link href="/dashboard" className="navbar-link">
                <Users className="w-4 h-4 text-sky-400" />
                <span>Dealer View</span>
              </Link>
            </li>
            <li>
              <Link href="/leaderboard" className="navbar-link">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Leaderboard</span>
              </Link>
            </li>
          </ul>

          <div className="navbar-user">
            <SwitchMode width={58} height={28} />
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={() => { fetch('/api/admin/auth', { method: 'DELETE' }); setAuthenticated(false); }}
              title="Logout admin session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Real-Time Live Ticker Marquee */}
      <TickerMarquee />

      <main className="content-wrapper">
        <div className="admin-grid">
          {/* Executive Header & Quick Operations Bar */}
          <div className="admin-header-strip">
            <div className="admin-title-area">
              <div className="admin-trophy-badge">
                🏆
              </div>
              <div>
                <h1 className="admin-page-title">Super Cup Executive Command Center</h1>
                <p className="admin-page-subtitle">
                  September 2026 Campaign • Real-Time Auction Telemetry & Fleet Management
                </p>
              </div>
            </div>

            <div className="admin-actions">
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSyncLiveAuction}
                disabled={syncing}
                title="Force synchronize active TVS Certified auction data"
              >
                <Zap className="w-4 h-4" />
                <span>{syncing ? `Syncing #${liveAuctionId || '1991'}...` : `Sync Auction #${liveAuctionId || '1991'}`}</span>
              </button>

              <button 
                className="btn btn-ghost btn-sm" 
                onClick={handleRecalculate}
                title="Recalculate dealer points and ranks"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recalculate</span>
              </button>

              <button 
                className="btn btn-ghost btn-sm" 
                onClick={handleExport}
                title="Download CSV summaries"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Executive Video Telecast Card (Analyst Telemetry Monitor) */}
          <div className="card double-bezel" style={{ padding: '6px' }}>
            <div className="inner-bezel-core" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="live-ping">
                    <span className="ping-dot"></span>
                    <span className="ping-ring"></span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--tvs-blue)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      TELEMETRY FEED
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Executive Trading Desk & Analytics Stream
                    </h3>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={toggleTelecastPlay} 
                    className="control-icon-btn"
                    title={telecastPlaying ? 'Pause video' : 'Play video'}
                  >
                    {telecastPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  </button>
                  <button 
                    onClick={toggleTelecastMute} 
                    className="control-icon-btn"
                    title={telecastMuted ? 'Unmute' : 'Mute'}
                  >
                    {telecastMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <button 
                    onClick={() => setShowFullTelecast(!showFullTelecast)} 
                    className="control-icon-btn"
                    title="Toggle Expanded View"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Video Monitor Frame */}
              <div style={{
                position: 'relative',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                aspectRatio: showFullTelecast ? '16 / 9' : '24 / 9',
                minHeight: showFullTelecast ? '540px' : '320px',
                maxHeight: showFullTelecast ? '85vh' : '440px',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                background: '#000',
              }}>
                <video
                  ref={videoRef}
                  src="/analyst_dashboard.mp4"
                  poster="/scroll_banner_analyst.png"
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div className="video-scrim-bottom" style={{ height: '90px' }}></div>
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '16px',
                  right: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  zIndex: 10,
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#ffffff',
                  background: 'rgba(8, 12, 20, 0.88)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.65)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.04em',
                      background: 'rgba(16, 185, 129, 0.28)',
                      color: '#34d399',
                      border: '1.5px solid rgba(52, 211, 153, 0.65)',
                      boxShadow: '0 0 12px rgba(16, 185, 129, 0.35)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.9)',
                      whiteSpace: 'nowrap'
                    }}>
                      <span style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#34d399',
                        boxShadow: '0 0 8px #34d399',
                        display: 'inline-block'
                      }} />
                      AUCTION #{liveAuctionId} ACTIVE
                    </span>
                    <span style={{
                      color: '#ffffff',
                      fontWeight: 600,
                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.95)',
                      letterSpacing: '0.02em',
                      whiteSpace: 'nowrap'
                    }}>
                      • {getAuctionScheduleLabel(liveAuctionId)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', color: '#ffffff', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.9)', textShadow: '0 1px 3px rgba(0, 0, 0, 0.9)' }}>
                      DEALERS: <strong style={{ color: '#ffffff' }}>{stats?.activeDealers ?? 0} ACTIVE</strong>
                    </span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.9)', textShadow: '0 1px 3px rgba(0, 0, 0, 0.9)' }}>
                      POINTS POOL: <strong style={{ color: '#06d6a0', textShadow: '0 0 8px rgba(6, 214, 160, 0.5)' }}>{stats?.totalPoints?.toLocaleString() ?? 0} PTS</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Segmented Corporate Tabs */}
          <div className="admin-tabs">
            {([
              { key: 'overview', icon: <BarChart3 className="w-4 h-4" />, label: 'Overview' },
              { key: 'leaderboard', icon: <Award className="w-4 h-4 text-amber-400" />, label: 'Leaderboard (Unmasked)' },
              { key: 'liveMonitor', icon: <Radio className="w-4 h-4 text-[#6cc14f]" />, label: 'War Room (Live Monitor)' },
              { key: 'dealers', icon: <Users className="w-4 h-4" />, label: 'Dealer Fleet' },
              { key: 'rules', icon: <Settings className="w-4 h-4" />, label: 'Scoring Rules Engine' },
              { key: 'matches', icon: <Calendar className="w-4 h-4" />, label: 'Match Schedule' },
              { key: 'audit', icon: <FileText className="w-4 h-4" />, label: 'Audit Trail' },
            ] as const).map(item => (
              <button
                key={item.key}
                className={`admin-tab ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.key);
                  setSelectedDealer(null);
                  if ((item.key === 'overview' || item.key === 'leaderboard') && !stats) {
                    loadData(false, true);
                  }
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="admin-content">
            {loading && !stats ? (
              <div className="loading-container" style={{ padding: '60px 0' }}>
                <div className="loading-spinner"></div>
                <span style={{ fontFamily: 'var(--font-mono)' }}>FETCHING COMMAND SYSTEM DATA...</span>
              </div>
            ) : (
              <>
                {/* ── 1. Overview Tab ──────────────────────────────────────────────── */}
                {activeTab === 'overview' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {!stats ? (
                      /* Fallback view so Overview is NEVER blank */
                      <div className="card double-bezel" style={{ padding: '6px' }}>
                        <div className="inner-bezel-core" style={{ padding: '40px 24px', textAlign: 'center' }}>
                          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📊</div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                            Overview Telemetry Not Loaded
                          </h3>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '480px', margin: '0 auto 20px' }}>
                            {statsError || 'The overview metrics could not be retrieved from the campaign database. Click below to reload.'}
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-primary"
                              onClick={() => loadData(false, true)}
                              disabled={loading}
                            >
                              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                              <span>{loading ? 'Connecting...' : 'Reload Overview Data'}</span>
                            </button>
                            <button
                              className="btn btn-ghost"
                              onClick={() => checkAuth()}
                            >
                              Verify Session
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* 8 Key Performance Metric Tiles */}
                        <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                          <div className="admin-stat-card">
                            <span className="admin-stat-label">Total Fleet Dealers</span>
                            <div className="admin-stat-val" style={{ color: 'var(--accent-blue)' }}>
                              {stats.totalDealers.toLocaleString()}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Registered network</span>
                          </div>

                          <div className="admin-stat-card">
                            <span className="admin-stat-label">Active Transacting</span>
                            <div className="admin-stat-val" style={{ color: 'var(--accent-cyan)' }}>
                              {stats.activeDealers.toLocaleString()}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Participating dealers</span>
                          </div>

                          <div className="admin-stat-card">
                            <span className="admin-stat-label">Total Accrued Points</span>
                            <div className="admin-stat-val" style={{ color: 'var(--accent-gold)' }}>
                              {(stats.totalPoints ?? 0).toLocaleString()}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--accent-gold)' }}>PTS across campaign</span>
                          </div>

                          <div className="admin-stat-card">
                            <span className="admin-stat-label">Total Bids Placed</span>
                            <div className="admin-stat-val" style={{ color: 'var(--accent-cyan)' }}>
                              {(stats.totalBids ?? 0).toLocaleString()}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>+2 pts per bid</span>
                          </div>

                          <div className="admin-stat-card">
                            <span className="admin-stat-label">Vehicles Won (BUY)</span>
                            <div className="admin-stat-val" style={{ color: 'var(--accent-blue)' }}>
                              {(stats.buyTransactions ?? 0).toLocaleString()}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>+10 pts per car</span>
                          </div>

                          <div className="admin-stat-card">
                            <span className="admin-stat-label">Room Attendances</span>
                            <div className="admin-stat-val" style={{ color: 'var(--accent-indigo)' }}>
                              {stats.matchParticipation ?? 0}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>+15 pts per match</span>
                          </div>

                          <div className="admin-stat-card">
                            <span className="admin-stat-label">Total Activities</span>
                            <div className="admin-stat-val" style={{ color: 'var(--accent-cyan)' }}>
                              {(stats.totalActivities ?? 0).toLocaleString()}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>All telemetry events</span>
                          </div>

                          <div className="admin-stat-card" style={{ borderLeft: '3px solid var(--tvs-red)' }}>
                            <span className="admin-stat-label">Active Campaign</span>
                            <div className="admin-stat-val" style={{ fontSize: '1.15rem', color: 'var(--tvs-red-light)', lineHeight: '1.4' }}>
                              Super Cup &apos;26
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{activeMatches.length} Live &amp; Upcoming Matches</span>
                          </div>
                        </div>

                        {/* Campaign Match Days Status Bar */}
                        <div className="card double-bezel" style={{ padding: '6px' }}>
                          <div className="inner-bezel-core" style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                              <div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                  CAMPAIGN AUCTION PIPELINE
                                </span>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                  Super Cup Match Days & Telemetry Status
                                </h3>
                              </div>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => { setActiveTab('liveMonitor'); }}
                                style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)' }}
                              >
                                Open War Room Live Stream →
                              </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                              {activeMatches.map(m => {
                                const isMatchLive = m.status === 'LIVE';
                                return (
                                  <div
                                    key={m.id}
                                    style={{
                                      background: 'var(--bg-card)',
                                      border: `1px solid ${isMatchLive ? 'var(--tvs-red)' : 'var(--border-subtle)'}`,
                                      borderRadius: 'var(--radius-md)',
                                      padding: '12px 14px',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.85rem' }}>
                                          MATCH #{m.matchNumber}
                                        </span>
                                        <span className={`badge ${isMatchLive ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: '0.65rem' }}>
                                          {m.status}
                                        </span>
                                      </div>
                                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                        Auction #{m.auctionId} • {new Date(m.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' })}
                                      </div>
                                    </div>
                                    <button
                                      className="btn btn-ghost btn-sm"
                                      onClick={() => {
                                        handleMatchSelect(m.auctionId || String(m.id));
                                        setActiveTab('liveMonitor');
                                      }}
                                      title="Inspect match telemetry in War Room"
                                    >
                                      Inspect →
                                    </button>
                                  </div>
                                );
                              })}

                              {/* Historical Completed Auctions in Overview */}
                              {historicalMatches.length > 0 && historicalMatches.map(m => (
                                <div
                                  key={`hist-${m.id}`}
                                  style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '12px 14px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    opacity: 0.8,
                                  }}
                                >
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.85rem' }}>
                                        MATCH #{m.matchNumber}
                                      </span>
                                      <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(100, 116, 139, 0.15)', color: 'var(--text-muted)', border: '1px solid rgba(100, 116, 139, 0.3)' }}>
                                        COMPLETED
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                      Auction #{m.auctionId} • {new Date(m.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' })}
                                    </div>
                                  </div>
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => {
                                      handleMatchSelect(m.auctionId || String(m.id));
                                      setActiveTab('liveMonitor');
                                    }}
                                    title="View historical match data in War Room"
                                  >
                                    View Data →
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Main Dashboard: Unmasked Leaderboard & Live Telemetry Stream */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                          {/* Unmasked Leaderboard Roster */}
                          <div className="card">
                            <div className="card-header" style={{ flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                  <h3 className="card-title" style={{ margin: 0 }}>
                                    <Award className="w-5 h-5 text-amber-400" />
                                    Official Super Cup Leaderboard
                                  </h3>
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    fontFamily: 'var(--font-mono)',
                                    padding: '2px 8px',
                                    borderRadius: '9999px',
                                    background: 'rgba(6, 214, 160, 0.15)',
                                    color: 'var(--accent-cyan)',
                                    border: '1px solid rgba(6, 214, 160, 0.4)'
                                  }}>
                                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-cyan)' }} />
                                    {showMaskedPreview ? 'MASKED PREVIEW' : 'UNMASKED'}
                                  </span>
                                </div>
                                <p className="card-subtitle">
                                  Showing verified rankings for {leaderboard.length} TVS dealerships • {showMaskedPreview ? 'Public masked view preview' : 'Real dealership enterprise names active'}
                                </p>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                  className="btn btn-ghost btn-xs"
                                  style={{
                                    fontSize: '0.74rem',
                                    padding: '4px 8px',
                                    border: '1px solid var(--border-subtle)',
                                    background: showMaskedPreview ? 'rgba(255, 255, 255, 0.08)' : 'rgba(6, 214, 160, 0.12)',
                                    color: showMaskedPreview ? 'var(--text-secondary)' : 'var(--accent-cyan)',
                                  }}
                                  onClick={() => setShowMaskedPreview(!showMaskedPreview)}
                                  title={showMaskedPreview ? 'Switch to unmasked real names' : 'Preview masked public names with asterisks'}
                                >
                                  {showMaskedPreview ? '👁️ Unmask Names' : '🔒 Preview Masked'}
                                </button>

                                <button
                                  className="btn btn-ghost btn-xs"
                                  style={{ fontSize: '0.74rem', padding: '4px 8px', color: 'var(--accent-cyan)' }}
                                  onClick={() => setActiveTab('leaderboard')}
                                  title="Open full leaderboard with Top 3 Podium"
                                >
                                  Full Standings →
                                </button>
                              </div>
                            </div>

                            <div className="search-bar-wrap" style={{ padding: '0 16px 12px' }}>
                              <div className="search-input-box">
                                <Search className="w-4 h-4 search-icon-left" />
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="Filter by dealer name, ID, or city..."
                                  value={searchQuery}
                                  onChange={e => setSearchQuery(e.target.value)}
                                />
                              </div>
                            </div>

                            <div style={{ overflowX: 'auto', maxHeight: '520px' }}>
                              <table className="admin-table">
                                <thead>
                                  <tr>
                                    <th>Rank</th>
                                    <th>Dealership Name {showMaskedPreview ? '(Masked Preview)' : '(Unmasked)'}</th>
                                    <th>External ID</th>
                                    <th>City / Hub</th>
                                    <th>Points</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredLeaderboard.slice(0, overviewLeaderboardLimit).map(d => (
                                    <tr key={d.dealerId}>
                                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                                        {d.rank === 1 ? '🥇 #1' :
                                         d.rank === 2 ? '🥈 #2' :
                                         d.rank === 3 ? '🥉 #3' :
                                         `#${d.rank}`}
                                      </td>
                                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {showMaskedPreview ? d.maskedName : d.dealerName}
                                      </td>
                                      <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                                        {d.externalId}
                                      </td>
                                      <td>{d.city}</td>
                                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '0.92rem' }}>
                                        {d.points} PTS
                                      </td>
                                      <td>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                          <button 
                                            className="btn btn-ghost btn-sm" 
                                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                            onClick={() => loadDealerDetail(d.dealerId)}
                                          >
                                            Inspect
                                          </button>
                                          <button 
                                            className="btn btn-sm" 
                                            style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'rgba(54, 78, 162, 0.12)', color: 'var(--tvs-blue)', border: '1px solid #c8d7ea' }}
                                            onClick={() => setAdjustModal({ dealerId: d.dealerId, dealerName: d.dealerName })}
                                          >
                                            Adjust
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Limit Toggle Footer */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 16px',
                              borderTop: '1px solid var(--border-subtle)',
                              fontSize: '0.78rem',
                              color: 'var(--text-muted)'
                            }}>
                              <span>
                                Showing top <strong>{Math.min(overviewLeaderboardLimit, filteredLeaderboard.length)}</strong> of <strong>{filteredLeaderboard.length}</strong> dealerships
                              </span>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  className="btn btn-ghost btn-xs"
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '2px 8px',
                                    fontWeight: overviewLeaderboardLimit === 30 ? 700 : 400,
                                    color: overviewLeaderboardLimit === 30 ? 'var(--accent-cyan)' : 'var(--text-muted)'
                                  }}
                                  onClick={() => setOverviewLeaderboardLimit(30)}
                                >
                                  Top 30
                                </button>
                                <button
                                  className="btn btn-ghost btn-xs"
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '2px 8px',
                                    fontWeight: overviewLeaderboardLimit === 100 ? 700 : 400,
                                    color: overviewLeaderboardLimit === 100 ? 'var(--accent-cyan)' : 'var(--text-muted)'
                                  }}
                                  onClick={() => setOverviewLeaderboardLimit(100)}
                                >
                                  Top 100
                                </button>
                                <button
                                  className="btn btn-ghost btn-xs"
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '2px 8px',
                                    fontWeight: overviewLeaderboardLimit >= filteredLeaderboard.length ? 700 : 400,
                                    color: overviewLeaderboardLimit >= filteredLeaderboard.length ? 'var(--accent-cyan)' : 'var(--text-muted)'
                                  }}
                                  onClick={() => setOverviewLeaderboardLimit(Math.max(500, filteredLeaderboard.length))}
                                >
                                  View All ({filteredLeaderboard.length})
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Real-Time Live Activity Stream */}
                          <div className="card">
                            <div className="card-header">
                              <div>
                                <h3 className="card-title">
                                  <Activity className="w-5 h-5 text-[#364ea2]" />
                                  Latest Telemetry Events
                                </h3>
                                <p className="card-subtitle">
                                  Real-time bidding & transactions across all matches
                                </p>
                              </div>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => loadData(true, true)}
                                title="Refresh latest telemetry"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '520px', overflowY: 'auto' }}>
                              {recentActivities.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px 12px', color: 'var(--text-muted)' }}>
                                  No recent activities recorded yet
                                </div>
                              ) : (
                                recentActivities.map(a => {
                                  const isBuy = a.activityType === 'BUY';
                                  const isBid = a.activityType === 'BID_PLACED';
                                  const isPart = a.activityType === 'MATCH_PARTICIPATION';
                                  const badgeColor = isBuy ? 'var(--accent-cyan)' : isBid ? 'var(--accent-blue)' : isPart ? 'var(--accent-gold)' : 'var(--text-muted)';
                                  return (
                                    <div
                                      key={a.id}
                                      onClick={() => handleOpenActivityDetails(a as any)}
                                      style={{
                                        padding: '10px 12px',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: 'var(--radius-md)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px',
                                        cursor: 'pointer',
                                      }}
                                      className="interactive-telemetry-row"
                                      title="Click to inspect vehicle & interaction details"
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span
                                            style={{
                                              fontSize: '0.65rem',
                                              fontFamily: 'var(--font-mono)',
                                              fontWeight: 700,
                                              padding: '2px 6px',
                                              borderRadius: '4px',
                                              background: `${badgeColor}20`,
                                              color: badgeColor,
                                              border: `1px solid ${badgeColor}40`,
                                            }}
                                          >
                                            {a.activityType}
                                          </span>
                                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {a.dealerName}
                                          </span>
                                        </div>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                                          +{a.points} PTS
                                        </span>
                                      </div>

                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                        <span>
                                          {a.metadata?.vehicleName ? `${a.metadata.vehicleName} (${a.metadata.regNo || ''})` : `Auction #${a.auctionId || 'Live'}`}
                                        </span>
                                        <span>
                                          {new Date(a.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── 1.5 Dedicated Unmasked Leaderboard Tab ────────────────────────── */}
                {activeTab === 'leaderboard' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Header Strip & Executive Unmask Controls */}
                    <div className="card double-bezel" style={{ padding: '6px' }}>
                      <div className="inner-bezel-core" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                              <div className="admin-trophy-badge" style={{ width: '36px', height: '36px', fontSize: '1.2rem' }}>
                                🏆
                              </div>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: showMaskedPreview ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.18)',
                                border: `1px solid ${showMaskedPreview ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.5)'}`,
                                padding: '3px 10px',
                                borderRadius: '999px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                color: showMaskedPreview ? '#fbbf24' : '#34d399',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                fontFamily: 'var(--font-mono)'
                              }}>
                                <span style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: showMaskedPreview ? '#fbbf24' : '#34d399',
                                  boxShadow: `0 0 6px ${showMaskedPreview ? '#fbbf24' : '#34d399'}`
                                }}></span>
                                {showMaskedPreview ? 'MASKED PREVIEW (PUBLIC SIMULATION)' : 'UNMASKED (ADMIN MISSION CONTROL)'}
                              </span>
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                              Official Super Cup Standings
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                              September 2026 Dealership Championship • Enterprise legal names and points unmasked for administration
                            </p>
                          </div>

                          {/* Quick Controls */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-sm"
                              style={{
                                background: showMaskedPreview ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                                borderColor: showMaskedPreview ? '#10b981' : 'var(--border-subtle)',
                                color: showMaskedPreview ? '#34d399' : 'var(--text-primary)',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                              onClick={() => {
                                setShowMaskedPreview(!showMaskedPreview);
                                showToast(showMaskedPreview ? 'Switched to Unmasked (Admin View)' : 'Switched to Masked (Public Preview)');
                              }}
                              title="Toggle between full unmasked dealership names and public masked preview"
                            >
                              {showMaskedPreview ? (
                                <>
                                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Unmask Names (Admin)</span>
                                </>
                              ) : (
                                <>
                                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Preview Masked (Public)</span>
                                </>
                              )}
                            </button>

                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={handleRecalculate}
                              title="Recalculate leaderboard scores and ranks"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Recalculate</span>
                            </button>

                            <button
                              className="btn btn-primary btn-sm"
                              onClick={handleExport}
                              title="Export leaderboard summary CSV"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Export Standings CSV</span>
                            </button>
                          </div>
                        </div>

                        {/* Top 3 Championship Podium Cards */}
                        {leaderboard.length >= 3 && !searchQuery && (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '16px',
                            marginBottom: '24px'
                          }}>
                            {/* Gold - Rank 1 */}
                            {leaderboard[0] && (
                              <div style={{
                                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.12), rgba(15, 23, 42, 0.8))',
                                border: '1px solid rgba(234, 179, 8, 0.45)',
                                borderRadius: '12px',
                                padding: '18px 20px',
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  position: 'absolute',
                                  top: '-15px',
                                  right: '-10px',
                                  fontSize: '4.5rem',
                                  opacity: 0.12,
                                  userSelect: 'none'
                                }}>
                                  🥇
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{
                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    color: '#000',
                                    fontWeight: 900,
                                    fontSize: '0.75rem',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    letterSpacing: '0.05em'
                                  }}>
                                    1ST PLACE • CHAMPION
                                  </span>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#fbbf24' }}>
                                    #{leaderboard[0].externalId}
                                  </span>
                                </div>
                                <h3 style={{
                                  fontSize: '1.05rem',
                                  fontWeight: 800,
                                  color: 'var(--text-primary)',
                                  marginBottom: '4px',
                                  lineHeight: 1.3
                                }}>
                                  {showMaskedPreview ? leaderboard[0].maskedName : leaderboard[0].dealerName}
                                </h3>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                  📍 {leaderboard[0].city}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                  <span style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '1.4rem',
                                    fontWeight: 900,
                                    color: '#fbbf24'
                                  }}>
                                    {leaderboard[0].points.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>PTS</span>
                                  </span>
                                  <button
                                    className="btn btn-ghost btn-xs"
                                    style={{ fontSize: '0.72rem', color: '#fbbf24' }}
                                    onClick={() => loadDealerDetail(leaderboard[0].dealerId)}
                                  >
                                    Inspect Fleet →
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Silver - Rank 2 */}
                            {leaderboard[1] && (
                              <div style={{
                                background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.12), rgba(15, 23, 42, 0.8))',
                                border: '1px solid rgba(148, 163, 184, 0.4)',
                                borderRadius: '12px',
                                padding: '18px 20px',
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  position: 'absolute',
                                  top: '-15px',
                                  right: '-10px',
                                  fontSize: '4.5rem',
                                  opacity: 0.1,
                                  userSelect: 'none'
                                }}>
                                  🥈
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{
                                    background: 'linear-gradient(135deg, #94a3b8, #64748b)',
                                    color: '#000',
                                    fontWeight: 900,
                                    fontSize: '0.75rem',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    letterSpacing: '0.05em'
                                  }}>
                                    2ND PLACE • RUNNER UP
                                  </span>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#cbd5e1' }}>
                                    #{leaderboard[1].externalId}
                                  </span>
                                </div>
                                <h3 style={{
                                  fontSize: '1.05rem',
                                  fontWeight: 800,
                                  color: 'var(--text-primary)',
                                  marginBottom: '4px',
                                  lineHeight: 1.3
                                }}>
                                  {showMaskedPreview ? leaderboard[1].maskedName : leaderboard[1].dealerName}
                                </h3>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                  📍 {leaderboard[1].city}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                  <span style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '1.4rem',
                                    fontWeight: 900,
                                    color: '#cbd5e1'
                                  }}>
                                    {leaderboard[1].points.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>PTS</span>
                                  </span>
                                  <button
                                    className="btn btn-ghost btn-xs"
                                    style={{ fontSize: '0.72rem', color: '#cbd5e1' }}
                                    onClick={() => loadDealerDetail(leaderboard[1].dealerId)}
                                  >
                                    Inspect Fleet →
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Bronze - Rank 3 */}
                            {leaderboard[2] && (
                              <div style={{
                                background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.1), rgba(15, 23, 42, 0.8))',
                                border: '1px solid rgba(217, 119, 6, 0.4)',
                                borderRadius: '12px',
                                padding: '18px 20px',
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  position: 'absolute',
                                  top: '-15px',
                                  right: '-10px',
                                  fontSize: '4.5rem',
                                  opacity: 0.1,
                                  userSelect: 'none'
                                }}>
                                  🥉
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{
                                    background: 'linear-gradient(135deg, #d97706, #b45309)',
                                    color: '#fff',
                                    fontWeight: 900,
                                    fontSize: '0.75rem',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    letterSpacing: '0.05em'
                                  }}>
                                    3RD PLACE • PODIUM
                                  </span>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#f59e0b' }}>
                                    #{leaderboard[2].externalId}
                                  </span>
                                </div>
                                <h3 style={{
                                  fontSize: '1.05rem',
                                  fontWeight: 800,
                                  color: 'var(--text-primary)',
                                  marginBottom: '4px',
                                  lineHeight: 1.3
                                }}>
                                  {showMaskedPreview ? leaderboard[2].maskedName : leaderboard[2].dealerName}
                                </h3>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                  📍 {leaderboard[2].city}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                  <span style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '1.4rem',
                                    fontWeight: 900,
                                    color: '#f59e0b'
                                  }}>
                                    {leaderboard[2].points.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>PTS</span>
                                  </span>
                                  <button
                                    className="btn btn-ghost btn-xs"
                                    style={{ fontSize: '0.72rem', color: '#f59e0b' }}
                                    onClick={() => loadDealerDetail(leaderboard[2].dealerId)}
                                  >
                                    Inspect Fleet →
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Search and Summary Bar */}
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '16px'
                        }}>
                          <div style={{ flex: '1 1 320px', maxWidth: '480px' }}>
                            <div className="search-input-box">
                              <Search className="w-4 h-4 search-icon-left" />
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Search by dealership legal name, dealer code, or city..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                              />
                              {searchQuery && (
                                <button
                                  className="btn btn-ghost btn-xs"
                                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}
                                  onClick={() => setSearchQuery('')}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>

                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            Showing <strong>{filteredLeaderboard.length}</strong> active scoring dealerships
                          </div>
                        </div>

                        {/* Standings Table */}
                        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th style={{ width: '80px' }}>Rank</th>
                                <th>Dealership Legal Name {showMaskedPreview ? '(Masked Preview)' : '(Unmasked)'}</th>
                                <th style={{ width: '120px' }}>Dealer Code</th>
                                <th style={{ width: '140px' }}>City / Hub</th>
                                <th style={{ width: '160px' }}>Championship Points</th>
                                <th style={{ width: '160px' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredLeaderboard.map((d, index) => {
                                const maxPts = leaderboard[0]?.points || 1;
                                const pct = Math.min(100, Math.round((d.points / maxPts) * 100));
                                return (
                                  <tr key={d.dealerId} style={{ background: index < 3 ? 'rgba(255, 255, 255, 0.02)' : 'transparent' }}>
                                    <td>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {d.rank === 1 ? (
                                          <span style={{ fontSize: '1.1rem' }}>🥇</span>
                                        ) : d.rank === 2 ? (
                                          <span style={{ fontSize: '1.1rem' }}>🥈</span>
                                        ) : d.rank === 3 ? (
                                          <span style={{ fontSize: '1.1rem' }}>🥉</span>
                                        ) : (
                                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            #{d.rank}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span style={{
                                          fontWeight: 700,
                                          fontSize: '0.88rem',
                                          color: 'var(--text-primary)',
                                          letterSpacing: '-0.01em'
                                        }}>
                                          {showMaskedPreview ? d.maskedName : d.dealerName}
                                        </span>
                                        {!showMaskedPreview && (
                                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                            Public mask: {d.maskedName}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td>
                                      <span style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.8rem',
                                        color: 'var(--text-secondary)',
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        border: '1px solid var(--border-subtle)'
                                      }}>
                                        {d.externalId}
                                      </span>
                                    </td>
                                    <td style={{ fontSize: '0.85rem' }}>
                                      {d.city}
                                    </td>
                                    <td>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{
                                          fontFamily: 'var(--font-mono)',
                                          fontWeight: 800,
                                          fontSize: '0.95rem',
                                          color: 'var(--accent-cyan)'
                                        }}>
                                          {d.points.toLocaleString()} PTS
                                        </span>
                                        <div style={{
                                          width: '100%',
                                          height: '4px',
                                          background: 'rgba(255, 255, 255, 0.08)',
                                          borderRadius: '2px',
                                          overflow: 'hidden'
                                        }}>
                                          <div style={{
                                            width: `${pct}%`,
                                            height: '100%',
                                            background: index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : index === 2 ? '#d97706' : 'var(--accent-cyan)',
                                            borderRadius: '2px'
                                          }} />
                                        </div>
                                      </div>
                                    </td>
                                    <td>
                                      <div style={{ display: 'flex', gap: '6px' }}>
                                        <button
                                          className="btn btn-ghost btn-sm"
                                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                          onClick={() => loadDealerDetail(d.dealerId)}
                                          title="Inspect dealership profile and complete activity stream"
                                        >
                                          Inspect
                                        </button>
                                        <button
                                          className="btn btn-sm"
                                          style={{
                                            padding: '4px 8px',
                                            fontSize: '0.75rem',
                                            background: 'rgba(54, 78, 162, 0.12)',
                                            color: 'var(--tvs-blue)',
                                            border: '1px solid #c8d7ea'
                                          }}
                                          onClick={() => setAdjustModal({ dealerId: d.dealerId, dealerName: d.dealerName })}
                                          title="Manual points correction"
                                        >
                                          Adjust
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}

                              {filteredLeaderboard.length === 0 && (
                                <tr>
                                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🔍</div>
                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                      No dealerships match &ldquo;{searchQuery}&rdquo;
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                                      Try searching by another dealer code, city name, or clear the search filter.
                                    </p>
                                    <button
                                      className="btn btn-ghost btn-sm"
                                      style={{ marginTop: '12px' }}
                                      onClick={() => setSearchQuery('')}
                                    >
                                      Clear Search Filter
                                    </button>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Footer Info Notice */}
                        <div style={{
                          marginTop: '16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '10px',
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Shield className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Executive clearance verified: Full enterprise company names are unmasked for your session.</span>
                          </div>
                          <div>
                            <Link href="/leaderboard" target="_blank" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <span>Open Public Leaderboard</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── 2. Live Monitor (War Room) Tab ─────────────────────────────────── */}
                {activeTab === 'liveMonitor' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Executive Auction & Match Command Selector */}
                    <div className="card double-bezel" style={{ padding: '6px' }}>
                      <div className="inner-bezel-core" style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span className="stream-indicator"></span>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                Live TVS Certified Auction Gateway Active
                              </span>
                            </div>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                              Auction Telemetry & Match Selector
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                              Select any match below to immediately view and populate real-time bidding events, vehicle transactions, and dealer participation
                            </p>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-sm"
                              style={{
                                background: liveAutoRefresh ? 'rgba(6, 214, 160, 0.15)' : 'rgba(255,255,255,0.05)',
                                color: liveAutoRefresh ? 'var(--accent-cyan)' : 'var(--text-muted)',
                                border: `1px solid ${liveAutoRefresh ? 'rgba(6, 214, 160, 0.4)' : 'var(--border-subtle)'}`,
                              }}
                              onClick={() => setLiveAutoRefresh(!liveAutoRefresh)}
                            >
                              {liveAutoRefresh ? '🟢 Auto-Sync (10s)' : '⚪ Auto-Sync Off'}
                            </button>

                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => loadLiveActivities(false, liveFilter, liveSearchQuery, liveAuctionId)}
                              disabled={liveLoading}
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${liveLoading ? 'animate-spin' : ''}`} />
                              <span>{liveLoading ? 'Fetching...' : 'Refresh'}</span>
                            </button>

                            <button
                              className="btn btn-primary btn-sm"
                              onClick={handleSyncLiveAuction}
                              disabled={syncing}
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>{syncing ? `Syncing #${liveAuctionId}...` : `Force Sync #${liveAuctionId}`}</span>
                            </button>
                          </div>
                        </div>

                        {/* Interactive Match Selector Cards Grid - Only LIVE or UPCOMING auctions */}
                        <div className="match-selection-grid">
                          {activeMatches.map(m => {
                            const isSelected = String(liveAuctionId) === String(m.auctionId);
                            const isLive = m.status === 'LIVE';
                            return (
                              <div 
                                key={m.id || m.auctionId}
                                className={`match-select-card ${isSelected ? 'active' : ''}`}
                                onClick={() => handleMatchSelect(m.auctionId || String(m.id))}
                              >
                                <div className="match-card-top">
                                  <span className="match-card-number">MATCH #{m.matchNumber}</span>
                                  {isLive ? (
                                    <span className="match-card-badge live">
                                      <span className="live-ping" style={{ display: 'inline-flex' }}>
                                        <span className="ping-dot" />
                                        <span className="ping-ring" />
                                      </span>
                                      LIVE WAR ROOM
                                    </span>
                                  ) : (
                                    <span className="match-card-badge upcoming">
                                      <Clock className="w-3 h-3 text-sky-400" />
                                      UPCOMING
                                    </span>
                                  )}
                                </div>
                                <div className="match-card-title">
                                  {m.auctionId?.startsWith('Auction') ? m.auctionId : `Auction #${m.auctionId || m.id}`}
                                </div>
                                <div className="match-card-metrics">
                                  <span style={{ color: isLive ? 'var(--text-primary)' : 'var(--accent-blue)', fontWeight: isLive ? 700 : 500 }}>
                                    {isLive ? 'Live Gateway' : 'Scheduled Match'}
                                  </span> •{' '}
                                  <span style={{ color: isLive ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                                    {getAuctionScheduleLabel(m.auctionId)}
                                  </span>
                                </div>
                                {isSelected && (
                                  <div style={{ 
                                    fontSize: '0.72rem', 
                                    color: isLive ? 'var(--tvs-red-light)' : 'var(--accent-blue)', 
                                    fontWeight: 700, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '4px', 
                                    marginTop: '4px' 
                                  }}>
                                    <span className="stream-indicator" style={{ background: isLive ? 'var(--tvs-red)' : 'var(--accent-blue)' }} /> 
                                    {isLive ? 'ACTIVE LIVE STREAM' : 'ACTIVE UPCOMING PREVIEW'}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Historical / Completed Auctions Section */}
                        {historicalMatches.length > 0 && (
                          <div style={{ marginTop: '16px' }}>
                            <button
                              onClick={() => setShowHistorical(!showHistorical)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '8px 4px',
                                width: '100%',
                                textAlign: 'left',
                              }}
                            >
                              <History className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                              <span style={{
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                color: 'var(--text-secondary)',
                                fontFamily: 'var(--font-mono)',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                              }}>
                                Historical Auctions ({historicalMatches.length})
                              </span>
                              {showHistorical
                                ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
                                : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
                              }
                            </button>
                            {showHistorical && (
                              <div className="match-selection-grid" style={{ marginTop: '8px' }}>
                                {historicalMatches.map(m => {
                                  const isSelected = String(liveAuctionId) === String(m.auctionId);
                                  return (
                                    <div
                                      key={m.id || m.auctionId}
                                      className={`match-select-card ${isSelected ? 'active' : ''}`}
                                      onClick={() => handleMatchSelect(m.auctionId || String(m.id))}
                                      style={{
                                        opacity: isSelected ? 1 : 0.85,
                                        borderColor: isSelected ? 'var(--accent-blue)' : 'var(--border-subtle)',
                                      }}
                                    >
                                      <div className="match-card-top">
                                        <span className="match-card-number">MATCH #{m.matchNumber}</span>
                                        <span className="match-card-badge" style={{
                                          background: 'rgba(100, 116, 139, 0.15)',
                                          color: 'var(--text-muted)',
                                          border: '1px solid rgba(100, 116, 139, 0.3)',
                                          fontSize: '0.65rem',
                                          fontWeight: 700,
                                          fontFamily: 'var(--font-mono)',
                                          padding: '2px 8px',
                                          borderRadius: '999px',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                        }}>
                                          <CheckCircle2 className="w-3 h-3" />
                                          COMPLETED
                                        </span>
                                      </div>
                                      <div className="match-card-title">
                                        Auction #{m.auctionId || m.id}
                                      </div>
                                      <div className="match-card-metrics">
                                        <span style={{ color: 'var(--text-muted)' }}>Completed</span> •{' '}
                                        <span style={{ color: 'var(--text-muted)' }}>
                                          {new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                                        </span>
                                      </div>
                                      {isSelected && (
                                        <div style={{
                                          fontSize: '0.72rem',
                                          color: 'var(--accent-blue)',
                                          fontWeight: 700,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          marginTop: '4px'
                                        }}>
                                          <span className="stream-indicator" style={{ background: 'var(--accent-blue)' }} />
                                          VIEWING HISTORICAL DATA
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Custom Auction ID Entry Bar */}
                        <div className="custom-auction-bar">
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            Direct Auction Entry:
                          </span>
                          <form 
                            onSubmit={handleCustomAuctionSubmit}
                            style={{ display: 'flex', gap: '8px', flex: '1 1 240px', alignItems: 'center' }}
                          >
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Enter custom Auction ID (e.g. 1991, 2003)..."
                              value={customAuctionInput}
                              onChange={e => setCustomAuctionInput(e.target.value)}
                              style={{ padding: '6px 12px', fontSize: '0.82rem', height: '34px', maxWidth: '300px' }}
                            />
                            <button
                              type="submit"
                              className="btn btn-primary btn-sm"
                              style={{ height: '34px', padding: '0 16px' }}
                            >
                              Load Auction
                            </button>
                          </form>
                          <div style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            Active: <strong style={{ color: 'var(--text-primary)' }}>Auction #{liveAuctionId}</strong> ({liveStats?.totalActivities ?? 0} events)
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Live Metric Tiles Grid */}
                    <div className="admin-stats-grid">
                      <div className="admin-stat-card">
                        <span className="admin-stat-label">Live Bids Placed (+2)</span>
                        <div className="admin-stat-val" style={{ color: 'var(--accent-blue)' }}>
                          {liveStats?.totalBids ?? 0}
                        </div>
                      </div>
                      <div className="admin-stat-card">
                        <span className="admin-stat-label">Lots Won (+10)</span>
                        <div className="admin-stat-val" style={{ color: 'var(--accent-cyan)' }}>
                          {liveStats?.totalBuys ?? 0}
                        </div>
                      </div>
                      <div className="admin-stat-card">
                        <span className="admin-stat-label">Vehicles Sold (+10)</span>
                        <div className="admin-stat-val" style={{ color: 'var(--accent-indigo)' }}>
                          {liveStats?.totalSells ?? 0}
                        </div>
                      </div>
                      <div className="admin-stat-card">
                        <span className="admin-stat-label">Room Attendees (+15)</span>
                        <div className="admin-stat-val" style={{ color: 'var(--accent-gold)' }}>
                          {liveStats?.totalParticipation ?? 0}
                        </div>
                      </div>
                      <div className="admin-stat-card">
                        <span className="admin-stat-label">Inspections (+1)</span>
                        <div className="admin-stat-val" style={{ color: 'var(--accent-blue)' }}>
                          {(liveStats?.totalInspections ?? 0) + (liveStats?.totalWatchlist ?? 0)}
                        </div>
                      </div>
                      <div className="admin-stat-card">
                        <span className="admin-stat-label">Total Stored Records</span>
                        <div className="admin-stat-val">
                          {liveStats?.totalActivities ?? 0}
                        </div>
                      </div>
                    </div>

                    {/* ── Auction Run Order & Vehicle Pipeline (Ongoing Car & Next 5 Upcoming Cars) ── */}
                    <div className="card double-bezel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      {/* Top Header Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <Car className="w-5 h-5 text-sky-400" />
                            <h3 className="card-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                              Auction Run Order & Vehicle Pipeline
                            </h3>
                            {ongoingCar && (
                              <span className="runorder-header-badge ongoing">
                                <span className="pulsing-live-dot" />
                                LIVE LOT #{ongoingCar.lotNumber}
                              </span>
                            )}
                            {vehicleQueueStats?.isAllCompleted && (
                              <span className="badge" style={{ background: 'rgba(6, 214, 160, 0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(6, 214, 160, 0.3)', fontSize: '0.72rem', fontWeight: 700 }}>
                                <CheckCircle2 className="w-3 h-3" /> ALL LOTS COMPLETED
                              </span>
                            )}
                          </div>
                          <p className="card-subtitle" style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>
                            Real-time block progression: track the ongoing car, preview the next car, and inspect upcoming lots in sequence order for Auction #{liveAuctionId}
                          </p>
                        </div>

                        {/* Top Level Metric Chips */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', padding: '3px 9px', borderRadius: '6px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontWeight: 700 }}>
                            {vehicleQueueStats?.total ?? allAuctionVehicles.length} Total Lots
                          </span>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', padding: '3px 9px', borderRadius: '6px', background: 'rgba(6, 214, 160, 0.12)', border: '1px solid rgba(6, 214, 160, 0.3)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                            {vehicleQueueStats?.completed ?? 0} Completed
                          </span>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', padding: '3px 9px', borderRadius: '6px', background: 'rgba(225, 29, 72, 0.12)', border: '1px solid rgba(225, 29, 72, 0.3)', color: '#fb7185', fontWeight: 700 }}>
                            {ongoingCar ? `Lot #${ongoingCar.lotNumber} Ongoing` : '0 Ongoing'}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', padding: '3px 9px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', color: 'var(--accent-blue)', fontWeight: 700 }}>
                            {vehicleQueueStats?.upcoming ?? 0} Upcoming
                          </span>
                        </div>
                      </div>

                      {/* Visual Progress Bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '6px' }}>
                          <span>
                            {vehicleQueueStats?.percentComplete ?? 0}% Lots Hammered ({vehicleQueueStats?.completed ?? 0} of {vehicleQueueStats?.total ?? 0})
                          </span>
                          <span>
                            {vehicleQueueStats?.isAllCompleted ? 'Auction Session Concluded' : `${vehicleQueueStats?.upcoming ?? 0} Lots Remaining`}
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '7px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${vehicleQueueStats?.percentComplete ?? 0}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))',
                            borderRadius: '999px',
                            transition: 'width 0.4s ease',
                          }} />
                        </div>
                      </div>

                      {/* Sub-Header Control Bar: Filter Tabs & Stepper */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                        padding: '12px 14px',
                        background: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                      }}>
                        {/* View Tabs */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {[
                            { key: 'UPCOMING_5', label: `⚡ Next 5 Upcoming (${upcomingCars.length})` },
                            { key: 'ALL', label: `📋 All Vehicles (${allAuctionVehicles.length})` },
                            { key: 'UPCOMING', label: `⏳ Upcoming Only (${vehicleQueueStats?.upcoming ?? 0})` },
                            { key: 'COMPLETED', label: `✅ Completed Only (${vehicleQueueStats?.completed ?? 0})` },
                          ].map(tab => (
                            <button
                              key={tab.key}
                              className={`filter-pill ${vehicleViewTab === tab.key ? 'active' : ''}`}
                              style={{ fontSize: '0.76rem', padding: '4px 12px' }}
                              onClick={() => setVehicleViewTab(tab.key as any)}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        {/* Interactive Queue Stepper */}
                        {(() => {
                          const activeLotNum = vehicleQueueStats?.activeLotNumber || (ongoingCar?.lotNumber ?? 1);
                          const totalLots = vehicleQueueStats?.total || (allAuctionVehicles.length || 1);
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                Block Position:
                              </span>
                              <button
                                className="runorder-stepper-btn"
                                onClick={() => handleStepLot(Math.max(1, activeLotNum - 1))}
                                disabled={activeLotNum <= 1 || vehicleQueueLoading}
                                title="Step back to previous lot"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                <span>Prev Lot</span>
                              </button>

                              <select
                                className="form-input"
                                style={{ width: 'auto', padding: '3px 8px', fontSize: '0.75rem', height: '28px', fontFamily: 'var(--font-mono)' }}
                                value={manualLotOverride === 'auto' ? String(activeLotNum) : manualLotOverride}
                                onChange={e => handleStepLot(e.target.value)}
                              >
                                <option value="auto">Auto (Lot #{activeLotNum})</option>
                                <option value="completed">All Completed (End)</option>
                                {allAuctionVehicles.slice(0, 150).map(v => (
                                  <option key={v.id || v.lotNumber} value={v.lotNumber}>
                                    Lot #{v.lotNumber}: {v.title.slice(0, 22)}
                                  </option>
                                ))}
                              </select>

                              <button
                                className="runorder-stepper-btn"
                                onClick={() => handleStepLot(Math.min(totalLots, activeLotNum + 1))}
                                disabled={activeLotNum >= totalLots || vehicleQueueLoading}
                                title="Advance to next lot in queue"
                              >
                                <span>Next Lot</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>

                              {manualLotOverride !== 'auto' && (
                                <button
                                  className="runorder-stepper-btn"
                                  onClick={() => {
                                    setManualLotOverride('auto');
                                    loadAuctionVehicles(liveAuctionId, 'auto');
                                  }}
                                  title="Reset to auto-detected active lot"
                                  style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(6, 214, 160, 0.4)' }}
                                >
                                  <RefreshCw className={`w-3 h-3 ${vehicleQueueLoading ? 'animate-spin' : ''}`} />
                                  <span>Auto</span>
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* ── Mode 1: Next 5 Upcoming Hero Showcase ── */}
                      {vehicleViewTab === 'UPCOMING_5' && (
                        vehicleQueueStats?.isAllCompleted ? (
                          <div style={{
                            background: 'linear-gradient(135deg, rgba(6, 214, 160, 0.08) 0%, rgba(56, 189, 248, 0.05) 100%)',
                            border: '1px solid rgba(6, 214, 160, 0.3)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '28px 24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '12px',
                                  background: 'rgba(6, 214, 160, 0.15)',
                                  border: '1px solid rgba(6, 214, 160, 0.35)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--accent-cyan)',
                                }}>
                                  <CheckCircle2 className="w-7 h-7" />
                                </div>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                      Auction #{liveAuctionId} Concluded
                                    </h4>
                                    <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                                      ALL {vehicleQueueStats?.total || allAuctionVehicles.length} LOTS COMPLETED
                                    </span>
                                  </div>
                                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    All vehicles in this auction session have been hammered and processed. The bidding block is currently closed.
                                  </p>
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => setVehicleViewTab('ALL')}
                                  style={{ gap: '6px' }}
                                >
                                  <Car className="w-4 h-4" />
                                  <span>View All {allAuctionVehicles.length} Vehicles</span>
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => setExportModalOpen(true)}
                                  style={{ gap: '6px', border: '1px solid var(--border-subtle)' }}
                                >
                                  <Download className="w-4 h-4 text-sky-400" />
                                  <span>Export Auction Results</span>
                                </button>
                              </div>
                            </div>

                            {/* Metric summary row for concluded auction */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                              gap: '12px',
                              paddingTop: '16px',
                              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            }}>
                              <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Lots Hammered</div>
                                <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                                  {vehicleQueueStats?.completed || allAuctionVehicles.length} / {vehicleQueueStats?.total || allAuctionVehicles.length}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>100% Completion Rate</div>
                              </div>

                              <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Auction Status</div>
                                <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}>
                                  CONCLUDED
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Session Complete</div>
                              </div>

                              <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Bidding Block</div>
                                <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                                  0 Active Lots
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Session Finalized</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          {/* Spotlight: Ongoing Car (Live) vs Next Car (On Deck) */}
                          <div className="runorder-spotlight-grid">
                            {/* Card 1: 🔴 Current Ongoing Car */}
                            <div className="runorder-card ongoing">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                <span className="runorder-header-badge ongoing">
                                  <span className="pulsing-live-dot" />
                                  ONGOING CAR • LOT #{ongoingCar?.lotNumber || '-'}
                                </span>
                                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#fb7185', fontWeight: 700 }}>
                                  ACTIVE ON BLOCK
                                </span>
                              </div>

                              {ongoingCar ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  {/* Thumbnail & Title */}
                                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                    {(() => {
                                      const images = getVehicleImages(ongoingCar.imageUrl);
                                      const thumb = images[0];
                                      return (
                                        <div
                                          onClick={() => handleOpenVehicleDetails(ongoingCar)}
                                          style={{
                                            width: '110px',
                                            height: '75px',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            background: 'rgba(0, 0, 0, 0.4)',
                                            border: '1px solid rgba(225, 29, 72, 0.3)',
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                          }}
                                          title="Click to view HD gallery"
                                        >
                                          {thumb ? (
                                            <img src={thumb} alt={ongoingCar.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                          ) : (
                                            <Car className="w-8 h-8 opacity-40 text-[#364ea2]" />
                                          )}
                                        </div>
                                      );
                                    })()}

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <h4 style={{
                                        fontSize: '0.98rem',
                                        fontWeight: 800,
                                        color: 'var(--text-primary)',
                                        margin: '0 0 6px 0',
                                        lineHeight: 1.3,
                                      }}>
                                        {ongoingCar.title}
                                      </h4>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        {ongoingCar.registrationNumber && (
                                          <div className="ind-plate">
                                            <span className="ind-plate-blue">IND</span>
                                            <span>{ongoingCar.registrationNumber}</span>
                                          </div>
                                        )}
                                        <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                                          🔴 LIVE BIDDING
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Spec Chips Row */}
                                  <div className="spec-chips-row">
                                    {ongoingCar.fuelType && <span className="spec-chip">⛽ {ongoingCar.fuelType}</span>}
                                    {ongoingCar.transmission && <span className="spec-chip">⚙️ {ongoingCar.transmission}</span>}
                                    {ongoingCar.yearOfMfg && <span className="spec-chip">📅 {ongoingCar.yearOfMfg}</span>}
                                    {ongoingCar.speedometer && <span className="spec-chip">🛣️ {ongoingCar.speedometer} KM</span>}
                                  </div>

                                  {/* Pricing & Bidding Box */}
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '10px 14px',
                                    background: 'var(--bg-base)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-subtle)',
                                    marginTop: '4px',
                                  }}>
                                    <div>
                                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                                        Starting Bid
                                      </span>
                                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                        ₹{Number(ongoingCar.startBidValue || 0).toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                      <span style={{ fontSize: '0.68rem', color: '#fb7185', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', fontWeight: 700 }}>
                                        <span className="pulsing-live-dot" style={{ width: '6px', height: '6px' }} />
                                        Current Top Bid
                                      </span>
                                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.05rem', color: 'var(--accent-cyan)' }}>
                                        ₹{Number(ongoingCar.currentBid || ongoingCar.startBidValue || 0).toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Action CTA */}
                                  <button
                                    className="btn btn-primary btn-sm"
                                    style={{ width: '100%', justifyContent: 'center' }}
                                    onClick={() => handleOpenVehicleDetails(ongoingCar)}
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Inspect Ongoing Car Details & Specs</span>
                                  </button>
                                </div>
                              ) : (
                                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                  <p style={{ margin: 0, fontSize: '0.85rem' }}>
                                    All lots have completed for this auction session, or no vehicle is currently marked on the active block.
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Card 2: ⚡ Next Car on Deck */}
                            <div className="runorder-card next">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                <span className="runorder-header-badge next">
                                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                                  NEXT CAR IN LINE • LOT #{nextCar?.lotNumber || '-'}
                                </span>
                                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)', fontWeight: 700 }}>
                                  NEXT UP TO BAT
                                </span>
                              </div>

                              {nextCar ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  {/* Thumbnail & Title */}
                                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                    {(() => {
                                      const images = getVehicleImages(nextCar.imageUrl);
                                      const thumb = images[0];
                                      return (
                                        <div
                                          onClick={() => handleOpenVehicleDetails(nextCar)}
                                          style={{
                                            width: '110px',
                                            height: '75px',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            background: 'rgba(0, 0, 0, 0.4)',
                                            border: '1px solid rgba(245, 158, 11, 0.3)',
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                          }}
                                          title="Click to view HD gallery"
                                        >
                                          {thumb ? (
                                            <img src={thumb} alt={nextCar.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                          ) : (
                                            <Car className="w-8 h-8 opacity-40 text-amber-400" />
                                          )}
                                        </div>
                                      );
                                    })()}

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <h4 style={{
                                        fontSize: '0.98rem',
                                        fontWeight: 800,
                                        color: 'var(--text-primary)',
                                        margin: '0 0 6px 0',
                                        lineHeight: 1.3,
                                      }}>
                                        {nextCar.title}
                                      </h4>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        {nextCar.registrationNumber && (
                                          <div className="ind-plate">
                                            <span className="ind-plate-blue">IND</span>
                                            <span>{nextCar.registrationNumber}</span>
                                          </div>
                                        )}
                                        <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                                          ⚡ ON DECK
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Spec Chips Row */}
                                  <div className="spec-chips-row">
                                    {nextCar.fuelType && <span className="spec-chip">⛽ {nextCar.fuelType}</span>}
                                    {nextCar.transmission && <span className="spec-chip">⚙️ {nextCar.transmission}</span>}
                                    {nextCar.yearOfMfg && <span className="spec-chip">📅 {nextCar.yearOfMfg}</span>}
                                    {nextCar.speedometer && <span className="spec-chip">🛣️ {nextCar.speedometer} KM</span>}
                                  </div>

                                  {/* Pricing & Pre-Bids Box */}
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '10px 14px',
                                    background: 'var(--bg-base)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-subtle)',
                                    marginTop: '4px',
                                  }}>
                                    <div>
                                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                                        Starting Price
                                      </span>
                                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-blue)' }}>
                                        ₹{Number(nextCar.startBidValue || 0).toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                                        Pre-Bid Status
                                      </span>
                                      {nextCar.hasPreBid ? (
                                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>
                                          ⚡ ₹{Number(nextCar.preBidValue || nextCar.currentBid || 0).toLocaleString('en-IN')}
                                        </span>
                                      ) : (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                          Awaiting Pre-Bids
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action CTA */}
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ width: '100%', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}
                                    onClick={() => handleOpenVehicleDetails(nextCar)}
                                  >
                                    <Eye className="w-3.5 h-3.5 text-sky-400" />
                                    <span>Inspect Next Car Specifications</span>
                                  </button>
                                </div>
                              ) : (
                                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                  <p style={{ margin: 0, fontSize: '0.85rem' }}>
                                    Final lot is currently on the auction block. No further lots on deck.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* ── Section: The Next 5 Upcoming Cars Queue ── */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <div>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Clock className="w-4 h-4 text-sky-400" />
                                  Next 5 Upcoming Cars in Queue
                                </h4>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                                  Vehicles queued immediately next on the auction block in run-order sequence
                                </p>
                              </div>
                              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                                Showing {upcomingCars.length} of {vehicleQueueStats?.upcoming || 0} upcoming
                              </span>
                            </div>

                            {upcomingCars.length > 0 ? (
                              <div className="upcoming-queue-grid">
                                {upcomingCars.map((car, idx) => {
                                  const images = getVehicleImages(car.imageUrl);
                                  const thumb = images[0];
                                  return (
                                    <div
                                      key={car.id || car.vehicleId}
                                      className="upcoming-queue-card"
                                      onClick={() => handleOpenVehicleDetails(car)}
                                      title="Click to inspect vehicle specs & photos"
                                    >
                                      {/* Top Row: Queue Position + Lot Number */}
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                                        <span style={{
                                          fontSize: '0.68rem',
                                          fontFamily: 'var(--font-mono)',
                                          fontWeight: 800,
                                          padding: '2px 7px',
                                          borderRadius: '4px',
                                          background: idx === 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                                          color: idx === 0 ? 'var(--accent-gold)' : 'var(--accent-blue)',
                                          border: `1px solid ${idx === 0 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(56, 189, 248, 0.3)'}`,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                        }}>
                                          {idx === 0 ? <Zap className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                          {idx === 0 ? 'Next Up (#1)' : `In Queue (#${idx + 1})`}
                                        </span>
                                        <span className="lot-chip">
                                          LOT #{car.lotNumber}
                                        </span>
                                      </div>

                                      {/* Image Thumbnail */}
                                      <div style={{
                                        width: '100%',
                                        height: '110px',
                                        borderRadius: '6px',
                                        overflow: 'hidden',
                                        background: 'rgba(0, 0, 0, 0.35)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                      }}>
                                        {thumb ? (
                                          <img src={thumb} alt={car.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                                            <Car className="w-8 h-8 opacity-40 text-sky-400" />
                                            <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>TVS CERTIFIED</span>
                                          </div>
                                        )}
                                        {car.hasPreBid && (
                                          <div style={{
                                            position: 'absolute',
                                            bottom: '6px',
                                            left: '6px',
                                            background: 'rgba(15, 23, 42, 0.85)',
                                            border: '1px solid rgba(56, 189, 248, 0.5)',
                                            color: 'var(--accent-blue)',
                                            padding: '1px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.65rem',
                                            fontWeight: 800,
                                            fontFamily: 'var(--font-mono)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '3px',
                                            backdropFilter: 'blur(4px)',
                                          }}>
                                            <Zap className="w-2.5 h-2.5" />
                                            <span>PRE-BID</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Title & Registration Plate */}
                                      <div>
                                        <div style={{
                                          fontWeight: 700,
                                          fontSize: '0.85rem',
                                          color: 'var(--text-primary)',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}>
                                          {car.title}
                                        </div>
                                        <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          {car.registrationNumber && (
                                            <div className="ind-plate" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>
                                              <span className="ind-plate-blue">IND</span>
                                              <span>{car.registrationNumber}</span>
                                            </div>
                                          )}
                                          <span className="badge" style={{
                                            fontSize: '0.65rem',
                                            background: 'rgba(56, 189, 248, 0.12)',
                                            color: 'var(--accent-blue)',
                                            border: '1px solid rgba(56, 189, 248, 0.25)',
                                            padding: '1px 6px',
                                          }}>
                                            UPCOMING
                                          </span>
                                        </div>
                                      </div>

                                      {/* Spec Chips Row */}
                                      <div className="spec-chips-row">
                                        {car.fuelType && <span className="spec-chip">⛽ {car.fuelType}</span>}
                                        {car.transmission && <span className="spec-chip">⚙️ {car.transmission}</span>}
                                        {car.yearOfMfg && <span className="spec-chip">📅 {car.yearOfMfg}</span>}
                                        {car.speedometer && <span className="spec-chip">🛣️ {car.speedometer} KM</span>}
                                      </div>

                                      {/* Price & Action Row */}
                                      <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginTop: 'auto',
                                        paddingTop: '8px',
                                        borderTop: '1px solid var(--border-hairline)',
                                      }}>
                                        <div>
                                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            Starting Bid
                                          </div>
                                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.88rem', color: 'var(--accent-cyan)' }}>
                                            ₹{Number(car.startBidValue || 0).toLocaleString('en-IN')}
                                          </div>
                                        </div>
                                        <button
                                          className="btn btn-ghost btn-xs"
                                          style={{
                                            padding: '3px 8px',
                                            fontSize: '0.72rem',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            borderRadius: '4px',
                                            border: '1px solid var(--border-subtle)',
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenVehicleDetails(car);
                                          }}
                                        >
                                          <Eye className="w-3 h-3 text-sky-400" />
                                          <span>Details</span>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div style={{
                                padding: '32px 16px',
                                textAlign: 'center',
                                background: 'var(--bg-subtle)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-subtle)',
                              }}>
                                <CheckCircle2 className="w-8 h-8 text-emerald-400" style={{ margin: '0 auto 8px auto' }} />
                                <h5 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                  All lots in this auction have concluded
                                </h5>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 12px 0' }}>
                                  Use the lot scrubber above or switch to &quot;All Vehicles&quot; tab to inspect all {allAuctionVehicles.length} vehicles.
                                </p>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => setVehicleViewTab('ALL')}
                                >
                                  View Full Catalog ({allAuctionVehicles.length} Lots) →
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        )
                      )}

                      {/* ── Mode 2: Full Catalog / Searchable Run Order List ── */}
                      {vehicleViewTab !== 'UPCOMING_5' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {/* Search bar inside vehicle table */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <div className="search-input-box" style={{ flex: '1 1 280px', maxWidth: '420px' }}>
                              <Search className="w-4 h-4 search-icon-left" />
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Search by model, registration, lot #..."
                                value={vehicleSearchFilter}
                                onChange={e => setVehicleSearchFilter(e.target.value)}
                              />
                            </div>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {filteredVehiclesList.length} vehicles matching
                            </span>
                          </div>

                          <div style={{ overflowX: 'auto', maxHeight: '480px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                            <table className="admin-table">
                              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                <tr>
                                  <th>Lot #</th>
                                  <th>Status</th>
                                  <th>Vehicle Specification</th>
                                  <th>Registration</th>
                                  <th>Engine & Odo</th>
                                  <th>Starting Bid</th>
                                  <th>Top / Winning Bid</th>
                                  <th>Inspect</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredVehiclesList.map(veh => (
                                  <tr
                                    key={veh.id || veh.vehicleId}
                                    onClick={() => handleOpenVehicleDetails(veh)}
                                    className="interactive-telemetry-row"
                                    style={{
                                      background: veh.status === 'ONGOING' ? 'rgba(108, 193, 79, 0.1)' : undefined,
                                    }}
                                  >
                                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                                      <span className="lot-chip" style={{
                                        background: veh.status === 'ONGOING' ? 'rgba(108, 193, 79, 0.2)' : undefined,
                                        color: veh.status === 'ONGOING' ? '#16a34a' : undefined,
                                        borderColor: veh.status === 'ONGOING' ? 'rgba(108, 193, 79, 0.4)' : undefined,
                                      }}>
                                        #{veh.lotNumber}
                                      </span>
                                    </td>
                                    <td>
                                      <span className={`badge ${
                                        veh.status === 'ONGOING' ? 'badge-error' :
                                        veh.status === 'COMPLETED' ? 'badge-success' :
                                        'badge-primary'
                                      }`} style={{ fontSize: '0.7rem' }}>
                                        {veh.status === 'ONGOING' ? '🔴 ONGOING' :
                                         veh.status === 'COMPLETED' ? '✅ COMPLETED' :
                                         '⏳ UPCOMING'}
                                      </span>
                                    </td>
                                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Car className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                                        <span>{veh.title}</span>
                                      </div>
                                    </td>
                                    <td>
                                      {veh.registrationNumber ? (
                                        <div className="ind-plate" style={{ fontSize: '0.72rem' }}>
                                          <span className="ind-plate-blue">IND</span>
                                          <span>{veh.registrationNumber}</span>
                                        </div>
                                      ) : '-'}
                                    </td>
                                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                      {[veh.fuelType, veh.transmission, veh.yearOfMfg ? `'${String(veh.yearOfMfg).slice(-2)}` : '', veh.speedometer ? `${veh.speedometer} KM` : ''].filter(Boolean).join(' • ') || 'N/A'}
                                    </td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                                      ₹{Number(veh.startBidValue || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: veh.status === 'COMPLETED' ? 'var(--accent-cyan)' : 'var(--accent-blue)' }}>
                                      {veh.winnerBidValue
                                        ? `Won: ₹${Number(veh.winnerBidValue).toLocaleString('en-IN')}`
                                        : veh.currentBid
                                        ? `₹${Number(veh.currentBid).toLocaleString('en-IN')}`
                                        : '-'}
                                    </td>
                                    <td>
                                      <button
                                        className="btn btn-ghost btn-xs"
                                        style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenVehicleDetails(veh);
                                        }}
                                      >
                                        <Eye className="w-3 h-3 text-sky-400" />
                                        <span>Details</span>
                                      </button>
                                    </td>
                                  </tr>
                                ))}

                                {filteredVehiclesList.length === 0 && (
                                  <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                      No vehicles matched the active filter or search query.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Filter Pills & Live Search */}
                    <div className="card" style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                        <div className="filter-pills">
                          {[
                            { key: 'ALL', label: `All Activities (${liveStats?.totalActivities ?? 0})` },
                            { key: 'BID_PLACED', label: `🔨 Bids (${liveStats?.totalBids ?? 0})` },
                            { key: 'BUY', label: `🏆 Buys (${liveStats?.totalBuys ?? 0})` },
                            { key: 'SELL', label: `💰 Sells (${liveStats?.totalSells ?? 0})` },
                            { key: 'MATCH_PARTICIPATION', label: `👥 Attendees (${liveStats?.totalParticipation ?? 0})` },
                            { key: 'VEHICLE_INSPECTED', label: `🔍 Inspections (${(liveStats?.totalInspections ?? 0) + (liveStats?.totalWatchlist ?? 0)})` },
                            { key: 'WATCHLIST_ADD', label: `⭐ Watchlist (${liveStats?.totalWatchlist ?? 0})` },
                          ].map(pill => (
                            <button
                              key={pill.key}
                              className={`filter-pill ${liveFilter === pill.key ? 'active' : ''}`}
                              onClick={() => {
                                setLiveFilter(pill.key);
                                loadLiveActivities(false, pill.key, liveSearchQuery, liveAuctionId);
                              }}
                            >
                              {pill.label}
                            </button>
                          ))}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: '1 1 300px', maxWidth: '480px' }}>
                          <div className="search-input-box">
                            <Search className="w-4 h-4 search-icon-left" />
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Search dealer, vehicle, reg no..."
                              value={liveSearchQuery}
                              onChange={e => setLiveSearchQuery(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  loadLiveActivities(false, liveFilter, liveSearchQuery, liveAuctionId);
                                }
                              }}
                            />
                          </div>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => triggerCsvDownload('activities')}
                            title="Export live auction activities to CSV"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Feed CSV</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Real-Time Live Feed Table */}
                    <div className="card">
                      <div className="card-header">
                        <div>
                          <h3 className="card-title">
                            <Zap className="w-5 h-5 text-emerald-400" />
                            Chronological Telemetry Feed
                          </h3>
                          <p className="card-subtitle">
                            Displaying real-time bids, room events, and vehicle transactions
                          </p>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {filteredLiveActivities.length} interactions matching
                        </span>
                      </div>

                      <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Time</th>
                              <th>Dealer Name</th>
                              <th>External ID / City</th>
                              <th>Interaction</th>
                              <th>Vehicle & Bid Details</th>
                              <th>Awarded</th>
                              <th>Integrity</th>
                              <th>Inspect</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredLiveActivities.map(act => (
                              <tr
                                key={act.id}
                                onClick={() => handleOpenActivityDetails(act)}
                                style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                                className="interactive-telemetry-row"
                                title="Click row to inspect vehicle specification & telemetry details"
                              >
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </td>
                                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {act.dealerName}
                                </td>
                                <td style={{ fontSize: '0.8rem' }}>
                                  <span style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{act.externalDealerId}</span>
                                  <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>• {act.city}</span>
                                </td>
                                <td>
                                  <span className={`badge ${
                                    act.activityType === 'BUY' ? 'badge-success' :
                                    act.activityType === 'SELL' ? 'badge-info' :
                                    act.activityType === 'MATCH_PARTICIPATION' ? 'badge-lime' :
                                    act.activityType === 'BID_PLACED' ? 'badge-primary' :
                                    'badge-warning'
                                  }`}>
                                    {act.activityType === 'BUY' ? '🏆 WON LOT' :
                                     act.activityType === 'SELL' ? '💰 SOLD VEHICLE' :
                                     act.activityType === 'BID_PLACED' ? '🔨 BID PLACED' :
                                     act.activityType === 'MATCH_PARTICIPATION' ? '👥 ROOM ATTENDEE' :
                                     act.activityType === 'VEHICLE_INSPECTED' ? '🔍 INSPECTION' :
                                     act.activityType === 'WATCHLIST_ADD' ? '⭐ WATCHLIST' :
                                     act.activityType.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td style={{ fontSize: '0.85rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                    {act.metadata?.vehicleName ? (
                                      <strong style={{ color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <Car className="w-3.5 h-3.5 text-sky-400" />
                                        {String(act.metadata.vehicleName)}
                                      </strong>
                                    ) : act.metadata?.vehicleId ? (
                                      <span style={{ color: 'var(--accent-blue)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <Car className="w-3.5 h-3.5 text-sky-400" />
                                        Vehicle #{String(act.metadata.vehicleId)}
                                      </span>
                                    ) : null}
                                    {act.metadata?.regNo ? (
                                      <span style={{ 
                                        color: 'var(--text-primary)', 
                                        fontFamily: 'var(--font-mono)', 
                                        fontSize: '0.72rem', 
                                        fontWeight: 700, 
                                        padding: '1px 6px', 
                                        background: 'rgba(255, 255, 255, 0.08)', 
                                        borderRadius: '4px', 
                                        border: '1px solid rgba(255, 255, 255, 0.18)', 
                                        letterSpacing: '0.04em' 
                                      }}>
                                        {String(act.metadata.regNo)}
                                      </span>
                                    ) : null}
                                    {act.metadata?.bidAmount ? <span style={{ color: 'var(--accent-blue)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>• ₹{Number(act.metadata.bidAmount).toLocaleString('en-IN')}</span> : null}
                                    {act.metadata?.winningBid ? <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>• Won: ₹{Number(act.metadata.winningBid).toLocaleString('en-IN')}</span> : null}
                                    {act.metadata?.price ? <span style={{ color: 'var(--accent-indigo)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>• ₹{Number(act.metadata.price).toLocaleString('en-IN')}</span> : null}
                                    {act.metadata?.depositAmount ? <span>• Deposit: ₹{Number(act.metadata.depositAmount).toLocaleString('en-IN')}</span> : null}
                                    {Boolean(act.metadata?.isLeadingBid) ? (
                                      <span style={{ padding: '1px 6px', borderRadius: '4px', background: 'rgba(6, 214, 160, 0.15)', color: 'var(--accent-cyan)', fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(6, 214, 160, 0.3)' }}>
                                        🏆 Leading Bid
                                      </span>
                                    ) : null}
                                    {act.metadata?.bidRank && Number(act.metadata.bidRank) > 1 ? (
                                      <span style={{ padding: '1px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', fontSize: '0.72rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                        Rank #{String(act.metadata.bidRank)}
                                      </span>
                                    ) : null}
                                    {Boolean(act.metadata?.isPreBid) ? (
                                      <span style={{ padding: '1px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-blue)', fontSize: '0.72rem', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                                        ⚡ Pre-Bid
                                      </span>
                                    ) : null}
                                    {act.metadata?.fuelType ? (
                                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                        • {String(act.metadata.fuelType)} {act.metadata.yearOfMfg ? `'${String(act.metadata.yearOfMfg).slice(-2)}` : ''}
                                      </span>
                                    ) : null}
                                  </div>
                                </td>
                                <td style={{ fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                                  +{act.points} PTS
                                </td>
                                <td>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Stored
                                  </span>
                                </td>
                                <td>
                                  <button
                                    className="btn btn-ghost btn-xs"
                                    style={{
                                      padding: '3px 8px',
                                      fontSize: '0.72rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      borderRadius: '6px',
                                      border: '1px solid var(--border-subtle)',
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenActivityDetails(act);
                                    }}
                                    title="Inspect vehicle & interaction details"
                                  >
                                    <Eye className="w-3 h-3 text-sky-400" />
                                    <span>Details</span>
                                  </button>
                                </td>
                              </tr>
                            ))}

                            {filteredLiveActivities.length === 0 && (
                              <tr>
                                <td colSpan={8} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '1.8rem' }}>{liveLoading ? '🔄' : '📡'}</span>
                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                                      {liveLoading
                                        ? 'Fetching real-time interactions...'
                                        : liveFilter !== 'ALL' || liveSearchQuery
                                        ? `No ${liveFilter !== 'ALL' ? liveFilter.replace(/_/g, ' ').toLowerCase() : ''} interactions matched for Auction #${liveAuctionId}`
                                        : currentMatch?.status === 'UPCOMING'
                                        ? `Auction #${liveAuctionId} is Scheduled (Upcoming)`
                                        : `No activity interactions captured yet for Auction #${liveAuctionId}`}
                                    </div>
                                    <p style={{ fontSize: '0.82rem', maxWidth: '520px', color: 'var(--text-secondary)', margin: '0', lineHeight: 1.5 }}>
                                      {liveLoading ? (
                                        <>Connecting to real-time event pipeline...</>
                                      ) : liveFilter !== 'ALL' || liveSearchQuery ? (
                                        <>No interactions matched the active filter or search terms. Try selecting &quot;All Activities&quot; or clearing your search.</>
                                      ) : currentMatch?.status === 'UPCOMING' ? (
                                        <>This auction is scheduled for {getAuctionScheduleLabel(liveAuctionId)}. Real-time bids, room events, and vehicle transactions will stream automatically once the auction begins.</>
                                      ) : (
                                        <>Awaiting real-time dealer bids, hall participation, and vehicle awards for this live auction session.</>
                                      )}
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                      {/* Quick switch to LIVE auction if currently viewing an upcoming auction and live auction exists */}
                                      {liveMatch && String(liveMatch.auctionId) !== String(liveAuctionId) && (
                                        <button
                                          className="btn btn-primary btn-sm"
                                          onClick={() => handleMatchSelect(liveMatch.auctionId)}
                                        >
                                          <Zap className="w-3.5 h-3.5" />
                                          <span>Switch to Live War Room (Auction #{liveMatch.auctionId})</span>
                                        </button>
                                      )}
                                      {(liveFilter !== 'ALL' || liveSearchQuery) && (
                                        <button
                                          className="btn btn-ghost btn-sm"
                                          onClick={() => {
                                            setLiveFilter('ALL');
                                            setLiveSearchQuery('');
                                            loadLiveActivities(false, 'ALL', '', liveAuctionId);
                                          }}
                                        >
                                          Reset to All Activities
                                        </button>
                                      )}
                                      {currentMatch?.status === 'LIVE' && (
                                        <button
                                          className="btn btn-ghost btn-sm"
                                          onClick={() => loadLiveActivities(false, liveFilter, liveSearchQuery, liveAuctionId)}
                                          disabled={liveLoading}
                                        >
                                          <RefreshCw className={`w-3.5 h-3.5 ${liveLoading ? 'animate-spin' : ''}`} />
                                          <span>Refresh Telemetry Feed</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── 3. Dealers Fleet Management Tab ──────────────────────────────── */}
                {activeTab === 'dealers' && !selectedDealer && (
                  <div className="card">
                    <div className="card-header">
                      <div>
                        <h3 className="card-title">
                          <Users className="w-5 h-5 text-sky-400" />
                          Dealer Fleet Directory & Score Oversight
                        </h3>
                        <p className="card-subtitle">
                          Manage enrolled dealers, inspect individual transactions, and make score adjustments
                        </p>
                      </div>
                    </div>

                    <div className="search-bar-wrap">
                      <div className="search-input-box">
                        <Search className="w-4 h-4 search-icon-left" />
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Search dealer by name, ID, or city..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Dealer Name</th>
                            <th>ID</th>
                            <th>City</th>
                            <th>Total Points</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLeaderboard.map(d => (
                            <tr key={d.dealerId}>
                              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>#{d.rank}</td>
                              <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{d.dealerName}</td>
                              <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{d.externalId}</td>
                              <td>{d.city}</td>
                              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-cyan)' }}>{d.points} PTS</td>
                              <td>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button className="btn btn-primary btn-sm" onClick={() => loadDealerDetail(d.dealerId)}>
                                    Details
                                  </button>
                                  <button 
                                    className="btn btn-ghost btn-sm" 
                                    onClick={() => setAdjustModal({ dealerId: d.dealerId, dealerName: d.dealerName })}
                                  >
                                    Adjust
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Dealer Detail Subview */}
                {activeTab === 'dealers' && selectedDealer && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDealer(null)}>
                          ← Back to Directory
                        </button>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {selectedDealer.displayName}
                        </h2>
                        <span className="badge badge-info">{selectedDealer.externalDealerId}</span>
                      </div>

                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => setAdjustModal({ dealerId: selectedDealer.id, dealerName: selectedDealer.displayName })}
                      >
                        ± Adjust Points
                      </button>
                    </div>

                    <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="admin-stat-card">
                        <span className="admin-stat-label">Current Standings</span>
                        <div className="admin-stat-val" style={{ color: 'var(--accent-gold)' }}>
                          #{selectedDealer.scores[0]?.rank || '-'}
                        </div>
                      </div>
                      <div className="admin-stat-card">
                        <span className="admin-stat-label">Total Verified Points</span>
                        <div className="admin-stat-val" style={{ color: 'var(--accent-cyan)' }}>
                          {selectedDealer.scores[0]?.totalPoints || 0}
                        </div>
                      </div>
                      <div className="admin-stat-card">
                        <span className="admin-stat-label">Logged Interactions</span>
                        <div className="admin-stat-val">
                          {selectedDealer.activities.length}
                        </div>
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-header">
                        <h3 className="card-title">Activity Audit Trail</h3>
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Activity Type</th>
                              <th>Points Awarded</th>
                              <th>Match Association</th>
                              <th>Transaction Reference</th>
                              <th>Timestamp</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedDealer.activities.map(a => (
                              <tr key={a.id}>
                                <td>
                                  <span className={`badge ${
                                    a.activityType === 'BUY' ? 'badge-info' :
                                    a.activityType === 'SELL' ? 'badge-success' :
                                    a.activityType === 'MATCH_PARTICIPATION' ? 'badge-lime' :
                                    'badge-warning'
                                  }`}>
                                    {a.activityType.replace('_', ' ')}
                                  </span>
                                </td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                                  +{a.points} PTS
                                </td>
                                <td>{a.match ? `Match #${a.match.matchNumber}` : 'General Season'}</td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {a.externalTransactionId}
                                </td>
                                <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                  {new Date(a.timestamp).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── 4. Scoring Rules Engine Tab ──────────────────────────────────── */}
                {activeTab === 'rules' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="card" style={{ padding: '16px 20px', background: 'rgba(56, 189, 248, 0.05)', borderColor: 'rgba(56, 189, 248, 0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Sliders className="w-5 h-5 text-sky-400" />
                        <div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Dynamic Point Scoring Engine
                          </h4>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            Update point values or toggle rules without codebase changes. Changes apply dynamically across leaderboard evaluations.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="card">
                      <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Activity Identifier</th>
                              <th>Description & TVS Source</th>
                              <th>Points Value</th>
                              <th>Rule State</th>
                              <th>Configuration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rules.map(r => (
                              <tr key={r.id}>
                                <td>
                                  <span className={`badge ${
                                    r.activityType === 'BUY' ? 'badge-success' :
                                    r.activityType === 'SELL' ? 'badge-info' :
                                    r.activityType === 'MATCH_PARTICIPATION' ? 'badge-lime' :
                                    r.activityType === 'BID_PLACED' ? 'badge-primary' :
                                    'badge-warning'
                                  }`}>
                                    {r.activityType.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td style={{ fontSize: '0.85rem' }}>{r.description}</td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <input
                                      type="number"
                                      className="form-input"
                                      style={{ width: '80px', padding: '6px 10px', fontFamily: 'var(--font-mono)' }}
                                      defaultValue={r.points}
                                      id={`rule-${r.id}`}
                                    />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>pts</span>
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${r.active ? 'badge-success' : 'badge-warning'}`}>
                                    {r.active ? '● Active' : '○ Inactive'}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button 
                                      className="btn btn-primary btn-sm" 
                                      onClick={() => {
                                        const input = document.getElementById(`rule-${r.id}`) as HTMLInputElement;
                                        handleUpdateRule(r.id, parseInt(input.value));
                                      }}
                                    >
                                      Save
                                    </button>
                                    <button
                                      className="btn btn-ghost btn-sm"
                                      onClick={() => handleToggleRule(r.id, r.active)}
                                    >
                                      {r.active ? 'Disable' : 'Enable'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── 5. Match Schedule Configuration Tab ──────────────────────────── */}
                {activeTab === 'matches' && (
                  <div className="card">
                    <div className="card-header">
                      <div>
                        <h3 className="card-title">
                          <Calendar className="w-5 h-5 text-sky-400" />
                          Match Day Schedule & State Control
                        </h3>
                        <p className="card-subtitle">
                          Set auction identifiers, control room states, and orchestrate weekly Thursday matches
                        </p>
                      </div>
                    </div>

                    <div className="match-tracker">
                      {matchDays.map(m => (
                        <div key={m.id} className="match-item">
                          <div className="match-number">Match #{m.matchNumber}</div>
                          <div className="match-icon">
                            {m.status === 'COMPLETED' ? (
                              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                            ) : m.status === 'LIVE' ? (
                              <Radio className="w-8 h-8 text-[#6cc14f] animate-pulse" />
                            ) : (
                              <Clock className="w-8 h-8 text-sky-400" />
                            )}
                          </div>
                          <div className="match-date">
                            {new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent-blue)', marginTop: '2px' }}>
                            Auction ID: {m.auctionId}
                          </div>

                          <div style={{ marginTop: '12px', width: '100%' }}>
                            <select
                              className="form-input"
                              style={{ padding: '6px 10px', fontSize: '0.75rem', textAlign: 'center' }}
                              value={m.status}
                              onChange={(e) => handleUpdateMatch(m.id, e.target.value)}
                            >
                              <option value="UPCOMING">Upcoming</option>
                              <option value="LIVE">Live Room</option>
                              <option value="COMPLETED">Completed</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── 6. Audit Trail Tab ───────────────────────────────────────────── */}
                {activeTab === 'audit' && (
                  <div className="card">
                    <div className="card-header">
                      <div>
                        <h3 className="card-title">
                          <FileText className="w-5 h-5 text-amber-400" />
                          Governance & Security Audit Trail
                        </h3>
                        <p className="card-subtitle">
                          Immutable record of all manual adjustments and configuration updates
                        </p>
                      </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Timestamp</th>
                            <th>Administrator</th>
                            <th>Action Type</th>
                            <th>Target Entity</th>
                            <th>Reason</th>
                            <th>Payload Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLog.map(log => (
                            <tr key={log.id}>
                              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                              <td style={{ fontWeight: 600 }}>{log.adminUser}</td>
                              <td>
                                <span className={`badge ${
                                  log.action === 'POINTS_ADJUSTED' ? 'badge-warning' :
                                  log.action === 'SCORE_RECALCULATED' ? 'badge-info' :
                                  log.action === 'RULE_CHANGED' ? 'badge-lime' :
                                  'badge-success'
                                }`}>
                                  {log.action.replace('_', ' ')}
                                </span>
                              </td>
                              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                                {log.targetType} #{log.targetId}
                              </td>
                              <td>{log.reason}</td>
                              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {log.details}
                              </td>
                            </tr>
                          ))}

                          {auditLog.length === 0 && (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                No audit events recorded yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Adjust Points Modal */}
      {adjustModal && (
        <div className="modal-overlay" onClick={() => setAdjustModal(null)}>
          <div className="modal double-bezel" onClick={e => e.stopPropagation()}>
            <div className="inner-bezel-core" style={{ padding: '28px' }}>
              <h3 className="modal-title">± Adjust Points — {adjustModal.dealerName}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                All manual adjustments are signed and stored in the governance audit trail.
              </p>

              <div className="form-group">
                <label className="form-label">Points Adjustment (+ or -)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. +20 or -10"
                  value={adjustPoints}
                  onChange={e => setAdjustPoints(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mandatory Audit Reason</label>
                <textarea
                  className="form-input"
                  style={{ height: '80px', resize: 'vertical' }}
                  placeholder="State the commercial or verification reason for adjustment..."
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button className="btn btn-ghost" onClick={() => setAdjustModal(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAdjustPoints}
                  disabled={!adjustPoints || !adjustReason}
                >
                  Commit Adjustment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Reports Modal */}
      {exportModalOpen && (
        <div className="modal-overlay" onClick={() => setExportModalOpen(false)}>
          <div className="modal double-bezel" style={{ maxWidth: '640px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div className="inner-bezel-core" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 className="modal-title" style={{ margin: 0 }}>Export Super Cup Reports</h3>
                <span className="badge badge-success" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Excel & CSV Ready
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '22px' }}>
                Download official spreadsheets for audit compliance, commercial accounting, and dealership recognition with complete seller and buyer pairing.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* 1. Buyers & Sellers Ledger */}
                <div style={{
                  padding: '16px',
                  background: 'var(--bg-base)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>
                          Auction #{liveAuctionId || '1991'} Buyers & Sellers Ledger
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Bilateral pairings: Seller Dealership ➔ Vehicle ➔ Buyer Dealership ➔ Hammer Price
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '6px 14px', fontSize: '0.78rem', gap: '6px', border: '1px solid var(--border-subtle)' }}
                      onClick={() => triggerExportDownload('activities', 'csv')}
                      title="Download as Comma-Separated Values (CSV)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV (.csv)</span>
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '6px 16px', fontSize: '0.78rem', gap: '6px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#10b981' }}
                      onClick={() => triggerExportDownload('activities', 'xlsx')}
                      title="Download as Microsoft Excel Spreadsheet (XLSX)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Excel (.xlsx)</span>
                    </button>
                  </div>
                </div>

                {/* 2. Dealer Standings & Performance Summary */}
                <div style={{
                  padding: '16px',
                  background: 'var(--bg-base)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users className="w-4 h-4 text-sky-400" />
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>
                          Dealer Standings & Commercial Summary
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          All dealers: Rank, Total Points, Buy Count, Sell Count, Total Won INR, Total Sold INR
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '6px 14px', fontSize: '0.78rem', gap: '6px', border: '1px solid var(--border-subtle)' }}
                      onClick={() => triggerExportDownload('dealers', 'csv')}
                      title="Download as Comma-Separated Values (CSV)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV (.csv)</span>
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '6px 16px', fontSize: '0.78rem', gap: '6px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', borderColor: '#0284c7' }}
                      onClick={() => triggerExportDownload('dealers', 'xlsx')}
                      title="Download as Microsoft Excel Spreadsheet (XLSX)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Excel (.xlsx)</span>
                    </button>
                  </div>
                </div>

                {/* 3. Full Live Activity & Bids Telemetry */}
                <div style={{
                  padding: '16px',
                  background: 'var(--bg-base)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>
                          Full Live Telemetry & Bid Stream Log
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Granular event log: Live bids, pre-bids, room registrations, watchlist adds, sells, buys
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '6px 14px', fontSize: '0.78rem', gap: '6px', border: '1px solid var(--border-subtle)' }}
                      onClick={() => triggerExportDownload('allActivities', 'csv')}
                      title="Download as Comma-Separated Values (CSV)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV (.csv)</span>
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '6px 16px', fontSize: '0.78rem', gap: '6px', background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', borderColor: '#d97706' }}
                      onClick={() => triggerExportDownload('allActivities', 'xlsx')}
                      title="Download as Microsoft Excel Spreadsheet (XLSX)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Excel (.xlsx)</span>
                    </button>
                  </div>
                </div>

                {/* Quick Action: Download Both in Excel */}
                <button
                  className="btn btn-primary"
                  style={{ marginTop: '6px', padding: '12px', justifyContent: 'center', gap: '8px', fontWeight: 600 }}
                  onClick={() => triggerDownloadBoth('xlsx')}
                >
                  <Download className="w-4 h-4" />
                  <span>Download Both Results & Summary in Excel (.xlsx)</span>
                </button>
              </div>

              <div className="modal-actions" style={{ marginTop: '22px' }}>
                <button className="btn btn-ghost" onClick={() => setExportModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Activity & Vehicle Telemetry Detail Modal ── */}
      {selectedActivity && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedActivity(null)}
          style={{
            zIndex: 1000,
            padding: '20px',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            background: 'rgba(0, 0, 0, 0.75)',
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            className="modal double-bezel"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '820px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '6px',
            }}
          >
            <div
              className="inner-bezel-core"
              style={{
                padding: '24px',
                overflowY: 'auto',
                maxHeight: 'calc(92vh - 16px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <span className={`badge ${
                      selectedActivity.activityType === 'BUY' ? 'badge-success' :
                      selectedActivity.activityType === 'SELL' ? 'badge-info' :
                      selectedActivity.activityType === 'MATCH_PARTICIPATION' ? 'badge-lime' :
                      selectedActivity.activityType === 'BID_PLACED' ? 'badge-primary' :
                      'badge-warning'
                    }`} style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                      {selectedActivity.activityType === 'BUY' ? '🏆 WON LOT' :
                       selectedActivity.activityType === 'SELL' ? '💰 SOLD VEHICLE' :
                       selectedActivity.activityType === 'BID_PLACED' ? '🔨 BID PLACED' :
                       selectedActivity.activityType === 'MATCH_PARTICIPATION' ? '👥 ROOM ATTENDEE' :
                       selectedActivity.activityType === 'VEHICLE_INSPECTED' ? '🔍 INSPECTION' :
                       selectedActivity.activityType === 'WATCHLIST_ADD' ? '⭐ WATCHLIST' :
                       selectedActivity.activityType.replace(/_/g, ' ')}
                    </span>

                    {Boolean(selectedActivity.metadata?.isPreBid) && (
                      <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-blue)', fontSize: '0.75rem', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 600 }}>
                        ⚡ Pre-Auction Bid
                      </span>
                    )}

                    {Boolean(selectedActivity.metadata?.isLeadingBid) && (
                      <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(6, 214, 160, 0.15)', color: 'var(--accent-cyan)', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(6, 214, 160, 0.3)' }}>
                        🏆 Leading Bid
                      </span>
                    )}

                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      AUCTION #{selectedActivity.metadata?.auctionId || liveAuctionId}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedActivity.metadata?.vehicleName ? String(selectedActivity.metadata.vehicleName) : `${selectedActivity.activityType.replace(/_/g, ' ')} Interaction`}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                    Captured at {new Date(selectedActivity.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' })}
                  </p>
                </div>

                <button
                  className="btn btn-ghost btn-sm"
                  style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => setSelectedActivity(null)}
                  title="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Vehicle Showcase Card (if vehicle information is present) */}
              {(selectedActivity.metadata?.vehicleName || selectedActivity.metadata?.vehicleId || selectedActivity.metadata?.regNo) && (() => {
                const images = getVehicleImages(selectedActivity.metadata?.imageUrl);
                const activeImg = images[selectedImageIndex] || images[0];
                return (
                  <div style={{
                    background: 'var(--bg-card-subtle, rgba(255, 255, 255, 0.03))',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Car className="w-5 h-5 text-sky-400" />
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                          Vehicle Specification & Details
                        </h4>
                      </div>
                      {selectedActivity.metadata?.regNo && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#f8fafc',
                          color: '#0f172a',
                          border: '2px solid #0f172a',
                          padding: '2px 10px',
                          borderRadius: '4px',
                          fontWeight: 900,
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.85rem',
                          letterSpacing: '0.08em',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        }}>
                          <span style={{ fontSize: '0.65rem', color: '#1e3a8a', fontWeight: 900, letterSpacing: '0' }}>IND</span>
                          <span>{String(selectedActivity.metadata.regNo)}</span>
                        </div>
                      )}
                    </div>

                    {/* Image Gallery if available */}
                    {activeImg && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{
                          width: '100%',
                          height: '240px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid var(--border-subtle)',
                          position: 'relative',
                        }}>
                          <img
                            src={activeImg}
                            alt={String(selectedActivity.metadata?.vehicleName || 'Vehicle')}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </div>
                        {images.length > 1 && (
                          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                            {images.map((img, idx) => (
                              <button
                                key={idx}
                                onClick={() => setSelectedImageIndex(idx)}
                                style={{
                                  width: '56px',
                                  height: '40px',
                                  borderRadius: '4px',
                                  overflow: 'hidden',
                                  border: selectedImageIndex === idx ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                                  background: 'rgba(0,0,0,0.3)',
                                  flexShrink: 0,
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                              >
                                <img src={img} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Vehicle Details Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '12px',
                    }}>
                      <div style={{ padding: '8px 12px', background: 'var(--bg-base)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Vehicle Name / Model</span>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{String(selectedActivity.metadata?.vehicleName || 'N/A')}</strong>
                      </div>

                      <div style={{ padding: '8px 12px', background: 'var(--bg-base)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Year of Manufacture</span>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{selectedActivity.metadata?.yearOfMfg ? String(selectedActivity.metadata.yearOfMfg) : 'N/A'}</strong>
                      </div>

                      <div style={{ padding: '8px 12px', background: 'var(--bg-base)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Fuel & Transmission</span>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {[selectedActivity.metadata?.fuelType, selectedActivity.metadata?.transmission].filter(Boolean).join(' • ') || 'N/A'}
                        </strong>
                      </div>

                      <div style={{ padding: '8px 12px', background: 'var(--bg-base)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Odometer / Mileage</span>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {selectedActivity.metadata?.speedometer ? `${String(selectedActivity.metadata.speedometer)} km` : 'N/A'}
                        </strong>
                      </div>

                      <div style={{ padding: '8px 12px', background: 'var(--bg-base)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Lot / Sequence No</span>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                          {selectedActivity.metadata?.lotNo || selectedActivity.metadata?.sequence ? `Lot #${selectedActivity.metadata.lotNo || selectedActivity.metadata.sequence}` : 'N/A'}
                        </strong>
                      </div>

                      <div style={{ padding: '8px 12px', background: 'var(--bg-base)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Starting Bid / Reserve</span>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                          {selectedActivity.metadata?.startBidValue ? `₹${Number(selectedActivity.metadata.startBidValue).toLocaleString('en-IN')}` : selectedActivity.metadata?.expectedPrice ? `₹${Number(selectedActivity.metadata.expectedPrice).toLocaleString('en-IN')}` : 'N/A'}
                        </strong>
                      </div>

                      {selectedActivity.metadata?.customerName && (
                        <div style={{ gridColumn: '1 / -1', padding: '8px 12px', background: 'var(--bg-base)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Seller / Origin Dealership</span>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{String(selectedActivity.metadata.customerName)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Interaction & Commercial Summary Card */}
              <div style={{
                background: 'var(--bg-card-subtle, rgba(255, 255, 255, 0.03))',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap className="w-5 h-5 text-emerald-400" />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Telemetry & Scoring Commercial Breakdown
                  </h4>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                }}>
                  <div style={{ padding: '12px', background: 'var(--bg-base)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Super Cup Points</span>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                      +{selectedActivity.points} PTS
                    </strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                      Verified by Points Engine
                    </span>
                  </div>

                  {(selectedActivity.metadata?.bidAmount || selectedActivity.metadata?.winningBid || selectedActivity.metadata?.price) && (
                    <div style={{ padding: '12px', background: 'var(--bg-base)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                        {selectedActivity.activityType === 'BUY' ? 'Winning Hammer Value' : selectedActivity.activityType === 'SELL' ? 'Sale Price' : 'Dealer Bid Amount'}
                      </span>
                      <strong style={{ fontSize: '1.2rem', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                        ₹{Number(selectedActivity.metadata.bidAmount || selectedActivity.metadata.winningBid || selectedActivity.metadata.price || 0).toLocaleString('en-IN')}
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                        {selectedActivity.metadata?.isPreBid ? 'Pre-auction recorded bid' : 'Live floor bid'}
                      </span>
                    </div>
                  )}

                  <div style={{ padding: '12px', background: 'var(--bg-base)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Database Ledger Integrity</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Stored & Audited</strong>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                      Record #{selectedActivity.id}
                    </span>
                  </div>

                  {selectedActivity.externalTransactionId && (
                    <div style={{ gridColumn: '1 / -1', padding: '10px 12px', background: 'var(--bg-base)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>TVS External Transaction Ref</span>
                      <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {selectedActivity.externalTransactionId}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dealer Information & Fleet Quick Jump */}
              <div style={{
                background: 'var(--bg-card-subtle, rgba(255, 255, 255, 0.03))',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-blue)',
                  }}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Originating Dealer</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{selectedActivity.dealerName}</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      <span style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>ID: {selectedActivity.externalDealerId}</span>
                      <span style={{ margin: '0 6px' }}>•</span>
                      <span>{selectedActivity.city}</span>
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-ghost btn-sm"
                  style={{ gap: '6px', fontSize: '0.78rem' }}
                  onClick={() => {
                    const dId = selectedActivity.dealerId;
                    setSelectedActivity(null);
                    setActiveTab('dealers');
                    loadDealerDetail(dId);
                  }}
                >
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  <span>Inspect Dealer Fleet Record →</span>
                </button>
              </div>

              {/* Raw JSON Telemetry Inspector */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', justifyContent: 'space-between', padding: '8px 12px', fontSize: '0.78rem' }}
                  onClick={() => setShowRawPayload(!showRawPayload)}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Raw Event Payload Inspector</span>
                  </span>
                  <span>{showRawPayload ? '▲ Hide' : '▼ Expand'}</span>
                </button>

                {showRawPayload && (
                  <div style={{ marginTop: '10px', position: 'relative' }}>
                    <button
                      className="btn btn-ghost btn-xs"
                      style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 5, padding: '4px 8px', fontSize: '0.7rem', gap: '4px' }}
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(selectedActivity, null, 2));
                        setCopiedPayload(true);
                        setTimeout(() => setCopiedPayload(false), 2000);
                      }}
                    >
                      {copiedPayload ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPayload ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                    <pre style={{
                      background: 'rgba(0, 0, 0, 0.6)',
                      padding: '14px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      color: '#a5f3fc',
                      overflowX: 'auto',
                      border: '1px solid var(--border-subtle)',
                      maxHeight: '220px',
                    }}>
                      {JSON.stringify(selectedActivity, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="modal-actions" style={{ marginTop: '4px' }}>
                <button className="btn btn-primary" onClick={() => setSelectedActivity(null)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating System Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 200,
          background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(108, 193, 79, 0.95)',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: 'var(--radius-full)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem',
          fontWeight: 700,
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
