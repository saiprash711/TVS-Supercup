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
  Filter, 
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
  Shield,
  Tag,
  Trophy,
  Phone,
  Mail,
  LogIn,
  Laptop,
  Smartphone,
  Globe,
  UserCheck,
  UserX,
  FileSpreadsheet
} from 'lucide-react';
import TickerMarquee from '../components/TickerMarquee';
import SwitchMode from '../components/watermelon/switch-mode';
import HistoricalAuctionsTab from './components/HistoricalAuctionsTab';
import { isTamilNaduDealer, getDealerBranch } from '@/lib/services/branch-utils';

interface AdminStats {
  totalDealers: number;
  activeDealers: number;
  totalPoints: number;
  matchParticipation: number;
  buyTransactions: number;
  sellTransactions: number;
  totalListings?: number;
  totalCommissions?: number;
  totalBids?: number;
  totalInspections?: number;
  totalWatchlist?: number;
  totalActivities?: number;
  dealersLoggedInToday?: number;
  dealersActiveWeek?: number;
  activeSessions?: number;
  portalAdoptionRate?: number;
  neverLoggedInCount?: number;
}

interface DealerLoginItem {
  id: string;
  sessionId?: string;
  dealerId: number;
  externalDealerId: string;
  displayName: string;
  dealerName?: string;
  dealerTvsCode?: string;
  city: string;
  dealerCity?: string;
  category: string;
  dealerCategory?: string;
  phone?: string;
  status: string;
  totalDealerLogins: number;
  loginAt: string;
  loginTime?: string;
  expiresAt: string;
  revokedAt?: string | null;
  isActive: boolean;
  isSessionActive?: boolean;
  ipAddress: string;
  userAgent?: string;
  device: string;
  loginType: string;
}

interface DealerLoginSummary {
  totalMatchingLogins?: number;
  totalSessions?: number;
  totalDealers: number;
  dealersWithLoginCount: number;
  totalDealersWithLogin?: number;
  uniqueDealersToday: number;
  activeToday?: number;
  uniqueDealersWeek: number;
  activeWeek?: number;
  activeSessionsCount: number;
  currentlyActiveSessions?: number;
  neverLoggedInCount: number;
  adoptionRate: number;
  recentLogins?: DealerLoginItem[];
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
  maskedName?: string;
  realName?: string;
  externalId: string;
  customerId?: string;
  customerCode?: string;
  numericCustomerId?: number | null;
  city: string;
  category?: string;
  role?: string;
  points: number;
  totalPoints?: number;
  buyerPoints?: number;
  sellerPoints?: number;
  buysCount?: number;
  bidsCount?: number;
  salesCount?: number;
  listingsCount?: number;
  dealerId: number;
  buyerRank?: number;
  sellerRank?: number;
  overallRank?: number;
}

interface FleetDealer {
  id: number;
  externalId: string;
  displayName: string;
  maskedName?: string;
  city: string;
  branch?: string;
  category?: string;
  status: string;
  points: number;
  rank: number;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  loginCount?: number;
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
  customerId?: string;
  displayName: string;
  maskedName?: string;
  city: string;
  category?: string;
  role?: string;
  phone?: string;
  email?: string;
  contactName?: string;
  status: string;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  loginCount?: number;
  recentSessions?: Array<{
    id: string;
    loginAt: string;
    expiresAt: string;
    isActive: boolean;
    ipAddress: string;
    device: string;
    loginType: string;
  }>;
  scores: Array<{
    totalPoints: number;
    rank: number;
    overallRank?: number;
    buyerRank?: number;
    sellerRank?: number;
    buyerPoints?: number;
    sellerPoints?: number;
    buysCount?: number;
    salesCount?: number;
    bidsCount?: number;
    listingsCount?: number;
  }>;
  activities: Array<{
    id: number;
    activityType: string;
    points: number;
    timestamp: string;
    externalTransactionId: string;
    metadata?: Record<string, any>;
    match: { matchNumber: number; date: string; auctionId?: string } | null;
  }>;
}

interface LiveActivityItem {
  id: number;
  dealerId: number;
  dealerName: string;
  buyerName?: string;
  sellerName?: string;
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
  totalListings?: number;
  totalCommissions?: number;
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

type Tab = 'overview' | 'leaderboard' | 'liveMonitor' | 'dealers' | 'dealerLogins' | 'rules' | 'matches' | 'audit' | 'historicalAuctions';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [isEmployeeUser, setIsEmployeeUser] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardDealer[]>([]);
  const [buyersLeaderboard, setBuyersLeaderboard] = useState<LeaderboardDealer[]>([]);
  const [sellersLeaderboard, setSellersLeaderboard] = useState<LeaderboardDealer[]>([]);
  const [overallLeaderboard, setOverallLeaderboard] = useState<LeaderboardDealer[]>([]);
  const [adminLeaderboardTab, setAdminLeaderboardTab] = useState<'buyers' | 'sellers' | 'overall'>('buyers');
  const [adminLeaderboardCounts, setAdminLeaderboardCounts] = useState<{ buyers: number; sellers: number; overall: number }>({
    buyers: 0,
    sellers: 0,
    overall: 0,
  });
  const [copiedCustomerId, setCopiedCustomerId] = useState<string | null>(null);
  const [overviewLeaderboardLimit, setOverviewLeaderboardLimit] = useState(30);
  const [leaderboardCategoryFilter, setLeaderboardCategoryFilter] = useState<string>('ALL');

  // Dealer Fleet Directory & Categorization State
  const [fleetDealers, setFleetDealers] = useState<FleetDealer[]>([]);
  const [fleetLoading, setFleetLoading] = useState(false);
  const [fleetCategoryFilter, setFleetCategoryFilter] = useState<string>('ALL');
  const [fleetBranchFilter, setFleetBranchFilter] = useState<string>('ALL');
  const [fleetBranches, setFleetBranches] = useState<{ name: string; count: number }[]>([]);
  const [fleetActivityFilter, setFleetActivityFilter] = useState<'ALL' | 'ACTIVE_TODAY' | 'LOGGED_IN' | 'NEVER_LOGGED_IN'>('ALL');
  const [fleetSortBy, setFleetSortBy] = useState<'rank' | 'name' | 'points' | 'lastLogin'>('rank');
  const [fleetSearchQuery, setFleetSearchQuery] = useState('');
  const [fleetPage, setFleetPage] = useState(1);
  const [fleetPageSize, setFleetPageSize] = useState(50);
  const [fleetCategoryCounts, setFleetCategoryCounts] = useState<{ total: number; oem: number; usedCar: number; corporate: number; loggedIn?: number; neverLoggedIn?: number; activeToday?: number }>({
    total: 0,
    oem: 0,
    usedCar: 0,
    corporate: 0,
  });

  // Dealer Login & Portal Adoption State
  const [recentDealerLogins, setRecentDealerLogins] = useState<DealerLoginItem[]>([]);
  const [dealerLoginSummary, setDealerLoginSummary] = useState<DealerLoginSummary | null>(null);
  const [loginLogList, setLoginLogList] = useState<DealerLoginItem[]>([]);
  const [loginLogLoading, setLoginLogLoading] = useState(false);
  const [loginLogSearch, setLoginLogSearch] = useState('');
  const [loginLogCategory, setLoginLogCategory] = useState<string>('ALL');
  const [loginLogTimeframe, setLoginLogTimeframe] = useState<string>('ALL');
  const [loginLogSessionStatus, setLoginLogSessionStatus] = useState<string>('ALL');
  const [loginLogPage, setLoginLogPage] = useState(1);
  const [loginLogPageSize, setLoginLogPageSize] = useState(50);
  const [loginLogTotalPages, setLoginLogTotalPages] = useState(1);
  const [loginLogAutoRefresh, setLoginLogAutoRefresh] = useState(true);
  const [matchDays, setMatchDays] = useState<MatchDay[]>([]);
  const [historicalMatchesData, setHistoricalMatchesData] = useState<MatchDay[]>([]);
  const [rules, setRules] = useState<PointRuleItem[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [selectedDealer, setSelectedDealer] = useState<DealerDetail | null>(null);
  const [inspectingDealerId, setInspectingDealerId] = useState<number | null>(null);
  const [inspectorActivityFilter, setInspectorActivityFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Campaign Management State
  const [campaigns, setCampaigns] = useState<{ id: number; slug: string; name: string; startDate: string; endDate: string; status: string }[]>([]);
  const [currentCampaign, setCurrentCampaign] = useState<{ id: number; slug?: string; name: string; startDate: string; endDate: string; status: string } | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);

  // Live Monitor State
  const [liveActivities, setLiveActivities] = useState<LiveActivityItem[]>([]);
  const [liveStats, setLiveStats] = useState<LiveAuctionStats | null>(null);
  const [liveAutoRefresh, setLiveAutoRefresh] = useState(true);
  const [liveFilter, setLiveFilter] = useState<string>('ALL');
  const [liveSearchQuery, setLiveSearchQuery] = useState<string>('');
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveAuctionId, setLiveAuctionId] = useState('TVSC-2026-10-01');
  const [customAuctionInput, setCustomAuctionInput] = useState('');

  // Multi-Auction Selection for Leaderboard Processing (Super Cup >= Oct 15, 2026)
  const [selectedAuctionIds, setSelectedAuctionIds] = useState<string[]>([]);
  const [leaderboardSortOrder, setLeaderboardSortOrder] = useState<'desc' | 'asc'>('desc');
  const [leaderboardSummary, setLeaderboardSummary] = useState<{
    firstPlace?: LeaderboardDealer | null;
    lastPlace?: LeaderboardDealer | null;
    totalDealers: number;
    totalPoints: number;
    selectedAuctions?: string[];
  } | null>(null);

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

  const copyCustomerId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedCustomerId(id);
    setTimeout(() => setCopiedCustomerId(null), 2000);
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

  // Official Super Cup start boundary: October 15, 2026 IST (14-Oct 18:30 UTC)
  const SUPERCUP_START_MS = new Date('2026-10-14T18:30:00.000Z').getTime();

  // Helper to ensure an auction strictly belongs to the Super Cup (started Oct 15, 2026)
  const isSuperCupMatch = useCallback((m: { date?: any; auctionId?: any; id?: any }) => {
    if (m.date) {
      const time = new Date(m.date).getTime();
      if (!isNaN(time)) {
        return time >= SUPERCUP_START_MS;
      }
    }
    const numeric = parseInt(String(m.auctionId || m.id).replace(/\D/g, ''), 10);
    if (!isNaN(numeric) && numeric < 2038) return false;
    return true;
  }, [SUPERCUP_START_MS]);

  // Only LIVE or UPCOMING auctions should be shown (strictly Super Cup >= Oct 15)
  const activeMatches = useMemo(() => {
    const filtered = matchDays.filter(m => {
      return (m.status === 'LIVE' || m.status === 'UPCOMING') && isSuperCupMatch(m);
    });
    if (filtered.length > 0) return filtered;
    const postStart = matchDays.filter(m => isSuperCupMatch(m));
    if (postStart.length > 0) return postStart;
    return [
      { id: 89, matchNumber: 2, auctionId: '2049', date: '2026-10-22T08:30:00Z', status: 'COMPLETED' },
    ] as MatchDay[];
  }, [matchDays, isSuperCupMatch]);

  // Historical / completed auctions for browsing past match data (strictly Super Cup >= Oct 15, 2026)
  const historicalMatches = useMemo(() => {
    const fromCurrent = matchDays.filter(m => m.status === 'COMPLETED' && isSuperCupMatch(m));
    const fromHistorical = historicalMatchesData.filter(m => isSuperCupMatch(m));
    const combined = [...fromCurrent, ...fromHistorical];
    const seen = new Set<string>();
    return combined.filter(m => {
      const aId = String(m.auctionId || m.id);
      if (seen.has(aId)) return false;
      seen.add(aId);
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [matchDays, historicalMatchesData, isSuperCupMatch]);

  // All distinct Super Cup auctions available for multi-selection processing
  const allSuperCupAuctions = useMemo(() => {
    const list: { auctionId: string; matchNumber?: number; date?: string; status?: string }[] = [];
    const seen = new Set<string>();
    for (const m of [...historicalMatches, ...activeMatches]) {
      const id = String(m.auctionId || m.id).trim();
      if (id && !seen.has(id)) {
        seen.add(id);
        list.push({ auctionId: id, matchNumber: m.matchNumber, date: String(m.date), status: m.status });
      }
    }
    for (const id of selectedAuctionIds) {
      if (id && !seen.has(id)) {
        seen.add(id);
        list.push({ auctionId: id, matchNumber: undefined, date: undefined, status: 'CUSTOM' });
      }
    }
    return list;
  }, [historicalMatches, activeMatches, selectedAuctionIds]);

  const currentMatch = useMemo(() => {
    return matchDays.find(m => String(m.auctionId) === String(liveAuctionId)) ||
           activeMatches.find(m => String(m.auctionId) === String(liveAuctionId)) ||
           historicalMatches.find(m => String(m.auctionId) === String(liveAuctionId));
  }, [matchDays, activeMatches, historicalMatches, liveAuctionId]);

  const liveMatch = useMemo(() => {
    return matchDays.find(m => m.status === 'LIVE') ||
           activeMatches.find(m => m.status === 'LIVE');
  }, [matchDays, activeMatches]);

  // Helper: format strictly as DD-MM-YYYY in Indian Standard Time (Asia/Kolkata)
  const formatDateDDMMYYYY = (dateInput: Date | string | number | null | undefined): string => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const parts = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    }).formatToParts(d);
    const day = parts.find(p => p.type === 'day')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const year = parts.find(p => p.type === 'year')?.value || '';
    return `${day}-${month}-${year}`;
  };

  const formatDateTimeDDMMYYYY = (dateInput: Date | string | number | null | undefined, includeSeconds = true): string => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const dateStr = formatDateDDMMYYYY(d);
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
    return `${dateStr}, ${timeStr}`;
  };

  const formatTimeIST = (dateInput: Date | string | number | null | undefined): string => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  };

  const formatTimeAgo = (dateInput: Date | string | number | null | undefined): string => {
    if (!dateInput) return 'Never';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'Never';
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDateDDMMYYYY(d);
  };

  // Helper: compute schedule label strictly in DD-MM-YYYY format
  const getAuctionScheduleLabel = (targetAuctionId: string = liveAuctionId) => {
    const match = matchDays.find(m => String(m.auctionId) === String(targetAuctionId.trim())) ||
                  historicalMatches.find(m => String(m.auctionId) === String(targetAuctionId.trim()));
    if (match?.date) {
      const matchDate = new Date(match.date);
      const now = new Date();
      const isToday = now.toDateString() === matchDate.toDateString();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const isTomorrow = tomorrow.toDateString() === matchDate.toDateString();
      const istTime = '2:00 PM IST';
      const formattedDate = formatDateDDMMYYYY(matchDate);
      
      if (match.status === 'COMPLETED' || matchDate.getTime() < now.getTime() - 24 * 3600 * 1000) {
        return `${formattedDate} (Completed)`;
      }
      if (isToday) return `Today (${formattedDate}) at ${istTime} (LIVE)`;
      if (isTomorrow) return `Tomorrow (${formattedDate}) at ${istTime}`;
      return `${formattedDate} at ${istTime}`;
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
    const formattedFallback = formatDateDDMMYYYY(auctionDate);
    const isToday = now.toDateString() === auctionDate.toDateString();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const isTomorrow = tomorrow.toDateString() === auctionDate.toDateString();
    if (isToday) return `Today (${formattedFallback}) at 2:00 PM IST`;
    if (isTomorrow) return `Tomorrow (${formattedFallback}) at 2:00 PM IST`;
    return `${formattedFallback} at 2:00 PM IST`;
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
      setAuthenticated(Boolean(data.authenticated));
      setIsEmployeeUser(Boolean(data.isEmployee));
      return Boolean(data.authenticated);
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

  const loadData = useCallback(async (
    keepAuctionId = false,
    showFullLoader = false,
    targetCampaignId?: number,
    overrideSelectedAuctions?: string[]
  ) => {
    if (showFullLoader) setLoading(true);
    setStatsError(null);
    try {
      const activeCampaignId = targetCampaignId !== undefined ? targetCampaignId : selectedCampaignId;
      const campaignParam = activeCampaignId ? `&campaignId=${activeCampaignId}` : '';
      const auctionsToQuery = overrideSelectedAuctions !== undefined ? overrideSelectedAuctions : selectedAuctionIds;
      const auctionsQuery = auctionsToQuery && auctionsToQuery.length > 0 ? `&auctions=${encodeURIComponent(auctionsToQuery.join(','))}` : '';
      const res = await fetch(`/api/admin?action=stats${campaignParam}${auctionsQuery}`, {
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
      if (data.campaigns) {
        setCampaigns(data.campaigns);
      }
      if (data.campaign) {
        setCurrentCampaign(data.campaign);
        if (selectedCampaignId === null) {
          setSelectedCampaignId(data.campaign.id);
        }
      }
      if (data.stats) {
        setStats(data.stats);
        setLeaderboard(data.leaderboard || []);
        if (Array.isArray(data.buyers)) setBuyersLeaderboard(data.buyers);
        if (Array.isArray(data.sellers)) setSellersLeaderboard(data.sellers);
        if (Array.isArray(data.overall)) setOverallLeaderboard(data.overall);
        if (data.summary) setLeaderboardSummary(data.summary);
        if (data.counts) {
          setAdminLeaderboardCounts(data.counts);
        } else {
          setAdminLeaderboardCounts({
            buyers: data.buyers?.length || 0,
            sellers: data.sellers?.length || 0,
            overall: data.overall?.length || data.leaderboard?.length || 0,
          });
        }
        if (data.recentActivities) {
          setRecentActivities(data.recentActivities);
        }
        if (data.dealerLoginActivity) {
          if (Array.isArray(data.dealerLoginActivity.recentLogins)) {
            setRecentDealerLogins(data.dealerLoginActivity.recentLogins);
          }
          setDealerLoginSummary(data.dealerLoginActivity);
        }
        const matches: MatchDay[] = data.matchDays || [];
        setMatchDays(matches);
        if (data.historicalMatches) {
          setHistoricalMatchesData(data.historicalMatches);
        }
        if (!keepAuctionId) {
          // Default to LIVE auction first, then UPCOMING auction on initial load
          const liveOrUpcomingMatch = matches.find(m => m.status === 'LIVE') ||
                                      matches.find(m => m.status === 'UPCOMING') ||
                                      matches[0];
          if (liveOrUpcomingMatch?.auctionId) {
            setLiveAuctionId(prev => {
              if (!prev) {
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
  }, [selectedCampaignId, selectedAuctionIds]);

  const handleToggleAuctionSelection = (auctionId: string) => {
    const clean = String(auctionId).trim();
    if (!clean) return;
    setSelectedAuctionIds(prev => {
      const next = prev.includes(clean)
        ? prev.filter(id => id !== clean)
        : [...prev, clean];
      loadData(true, false, undefined, next);
      showToast(next.includes(clean) ? `Added Auction #${clean} to Leaderboard` : `Removed Auction #${clean} from Leaderboard`);
      return next;
    });
  };

  const handleSelectAllAuctions = () => {
    const allIds = allSuperCupAuctions.map(a => a.auctionId);
    setSelectedAuctionIds(allIds);
    loadData(true, false, undefined, allIds);
    showToast(`Processing Leaderboard across all ${allIds.length} Super Cup auctions`);
  };

  const handleClearAuctionSelection = () => {
    setSelectedAuctionIds([]);
    loadData(true, false, undefined, []);
    showToast('Reset Leaderboard to all-tournament cumulative standings');
  };

  const handleSwitchCampaign = async (campaignId: number) => {
    setSelectedCampaignId(campaignId);
    await loadData(false, true, campaignId);
    showToast(`Switched active view to selected campaign`);
  };

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

  const loadFleetDealers = useCallback(async () => {
    try {
      setFleetLoading(true);
      const campParam = selectedCampaignId ? `&campaignId=${selectedCampaignId}` : '';
      const res = await fetch(`/api/admin?action=dealers${campParam}`);
      if (!res.ok) throw new Error('Failed to fetch fleet dealers');
      const data = await res.json();
      if (data.dealers) {
        setFleetDealers(data.dealers);
      }
      if (data.counts) {
        setFleetCategoryCounts(data.counts);
      }
      if (data.branches) {
        setFleetBranches(data.branches);
      }
    } catch (err) {
      console.error('Failed to load fleet dealers:', err);
    } finally {
      setFleetLoading(false);
    }
  }, [selectedCampaignId]);

  const loadDealerLogins = useCallback(async (
    targetPage = loginLogPage,
    search = loginLogSearch,
    category = loginLogCategory,
    timeframe = loginLogTimeframe,
    sessionStatus = loginLogSessionStatus,
    silent = false
  ) => {
    if (!silent) setLoginLogLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('action', 'dealerLogins');
      params.set('page', String(targetPage));
      params.set('pageSize', String(loginLogPageSize));
      if (search && search.trim()) params.set('search', search.trim());
      if (category && category !== 'ALL') params.set('category', category);
      if (timeframe && timeframe !== 'ALL') params.set('timeframe', timeframe);
      if (sessionStatus && sessionStatus !== 'ALL') params.set('sessionStatus', sessionStatus);

      const res = await fetch(`/api/admin?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load dealer logins');
      const data = await res.json();
      if (data.logins) setLoginLogList(data.logins);
      if (data.summary) setDealerLoginSummary(data.summary);
      if (data.pagination) setLoginLogTotalPages(data.pagination.totalPages || 1);
    } catch (err) {
      console.error('Failed to load dealer login logs:', err);
    } finally {
      if (!silent) setLoginLogLoading(false);
    }
  }, [loginLogPage, loginLogPageSize, loginLogSearch, loginLogCategory, loginLogTimeframe, loginLogSessionStatus]);

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
      buyerName: veh.status === 'COMPLETED' ? (veh.winnerId ? `Winner Dealer #${veh.winnerId}` : '—') : '—',
      sellerName: veh.locationName ? `Fleet (${veh.locationName})` : 'TVS Fleet',
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
    if (historicalMatches.some(m => String(m.auctionId) === cleaned)) {
      setShowHistorical(true);
    }
    loadLiveActivities(false, 'ALL', '', cleaned);
    loadAuctionVehicles(cleaned, 'auto');
    showToast(`Loaded Match Auction #${cleaned} Telemetry Feed`);
  };

  const handleCustomAuctionSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customAuctionInput.trim();
    if (!clean) return;
    handleMatchSelect(clean);
    setSelectedAuctionIds(prev => {
      if (prev.includes(clean)) return prev;
      const next = [...prev, clean];
      loadData(true, false, undefined, next);
      return next;
    });
    setCustomAuctionInput('');
  };

  const loadDealerDetail = async (dealerId: number) => {
    setInspectingDealerId(dealerId);
    try {
      const campaignParam = selectedCampaignId ? `&campaignId=${selectedCampaignId}` : '';
      const res = await fetch(`/api/admin?action=dealer&id=${dealerId}${campaignParam}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.dealer) {
        setSelectedDealer(data.dealer);
        setInspectorActivityFilter('ALL');
      } else {
        showToast(data.error || 'Dealership profile not found', 'error');
      }
    } catch {
      showToast('Network error while connecting to dealership inspector', 'error');
    } finally {
      setInspectingDealerId(null);
    }
  };

  useEffect(() => {
    checkAuth().then(isAuth => {
      if (isAuth) loadData(false, true);
    });
  }, [checkAuth, loadData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedDealer) setSelectedDealer(null);
        if (selectedActivity) setSelectedActivity(null);
        if (adjustModal) setAdjustModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDealer, selectedActivity, adjustModal]);

  useEffect(() => {
    if (authenticated && activeTab === 'overview' && !stats && !loading) {
      loadData(false, true);
    }
    if (authenticated && activeTab === 'dealers' && fleetDealers.length === 0 && !fleetLoading) {
      loadFleetDealers();
    }
    if (authenticated && activeTab === 'dealerLogins') {
      loadDealerLogins(loginLogPage, loginLogSearch, loginLogCategory, loginLogTimeframe, loginLogSessionStatus);
      if (loginLogAutoRefresh) {
        const interval = setInterval(() => {
          loadDealerLogins(loginLogPage, loginLogSearch, loginLogCategory, loginLogTimeframe, loginLogSessionStatus, true);
        }, 15000);
        return () => clearInterval(interval);
      }
    }
    if (authenticated && activeTab === 'rules') loadRules();
    if (authenticated && activeTab === 'audit') loadAudit();
    if (authenticated && activeTab === 'liveMonitor') {
      const currentMatchObj = matchDays.find(m => String(m.auctionId) === String(liveAuctionId)) ||
                             historicalMatches.find(m => String(m.auctionId) === String(liveAuctionId));
      const isCompleted = currentMatchObj?.status === 'COMPLETED';

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
  }, [authenticated, activeTab, stats, loading, fleetDealers.length, fleetLoading, loginLogPage, loginLogSearch, loginLogCategory, loginLogTimeframe, loginLogSessionStatus, loginLogAutoRefresh, liveAutoRefresh, liveFilter, liveAuctionId, matchDays, loadRules, loadAudit, loadFleetDealers, loadDealerLogins, loadLiveActivities, loadAuctionVehicles, loadData]);

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

  const handleUpdateMatch = async (matchId: number, status: string, auctionId?: string) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateMatch', matchId, status, auctionId }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(auctionId !== undefined ? 'Auction ID saved!' : 'Match day status updated!');
      loadData();
    } else {
      showToast(data.error || 'Failed to update match', 'error');
    }
  };

  const handleAutoDiscoverAuction = async (matchId: number) => {
    showToast('Searching TVS Certified for auction...');
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'autoDiscoverAuction', matchId }),
      });
      const data = await res.json();
      if (data.found) {
        showToast(data.message, 'success');
        loadData();
      } else {
        showToast(data.message || 'Auction not published yet on TVS Certified.');
      }
    } catch {
      showToast('Failed to check TVS Certified', 'error');
    }
  };

  const handleExport = () => {
    setExportModalOpen(true);
  };

  const triggerExportDownload = (
    type: 'dealers' | 'activities' | 'allActivities' | 'dealerLogins' | 'auctionLeaderboard',
    format: 'xlsx' | 'csv' = 'xlsx',
    customAuctionId?: string
  ) => {
    const ext = format.toUpperCase();
    const effectiveAuctionId = (customAuctionId || liveAuctionId || '2003').trim();
    const campParam = selectedCampaignId ? `&campaignId=${selectedCampaignId}` : '';

    if (type === 'dealers') {
      const branchQuery = fleetBranchFilter && fleetBranchFilter !== 'ALL' ? `&branch=${encodeURIComponent(fleetBranchFilter)}` : '';
      const catQuery = fleetCategoryFilter && fleetCategoryFilter !== 'ALL' ? `&category=${encodeURIComponent(fleetCategoryFilter)}` : '';
      window.open(`/api/admin?action=export&type=dealers${branchQuery}${catQuery}&format=${format}`, '_blank');
      showToast(`Downloading TN Dealer Fleet Directory (${fleetBranchFilter !== 'ALL' ? fleetBranchFilter + ' - ' : ''}${ext})...`);
    } else if (type === 'dealerLogins') {
      window.open(`/api/admin?action=export&type=dealerLogins&format=${format}`, '_blank');
      showToast(`Downloading Dealer Login & Portal Adoption History (${ext})...`);
    } else if (type === 'allActivities') {
      window.open(`/api/admin?action=export&type=activities&all=true&format=${format}`, '_blank');
      showToast(`Downloading Full Live Telemetry Log (${ext})...`);
    } else if (type === 'activities') {
      window.open(`/api/admin?action=export&type=activities&auctionId=${encodeURIComponent(effectiveAuctionId)}${campParam}&format=${format}`, '_blank');
      showToast(`Downloading Auction #${effectiveAuctionId} Buyers & Sellers Ledger (${ext})...`);
    } else if (type === 'auctionLeaderboard') {
      window.open(`/api/admin?action=export&type=auctionLeaderboard&auctionId=${encodeURIComponent(effectiveAuctionId)}${campParam}&format=${format}`, '_blank');
      showToast(`Downloading Auction #${effectiveAuctionId} Standings & Points Calculation Audit (${ext})...`);
    } else {
      window.open(`/api/admin?action=export&type=auctionLeaderboard&auctionId=${encodeURIComponent(effectiveAuctionId)}${campParam}&format=${format}`, '_blank');
      showToast(`Downloading Auction #${effectiveAuctionId} Standings & Points Calculation Audit (${ext})...`);
    }
  };

  const triggerCsvDownload = (type: 'dealers' | 'activities' | 'allActivities' | 'dealerLogins' | 'auctionLeaderboard') => triggerExportDownload(type, 'csv');

  const triggerDownloadBoth = (format: 'xlsx' | 'csv' = 'xlsx') => {
    const effectiveAuctionId = (liveAuctionId || '2003').trim();
    const campParam = selectedCampaignId ? `&campaignId=${selectedCampaignId}` : '';
    window.open(`/api/admin?action=export&type=auctionLeaderboard&auctionId=${encodeURIComponent(effectiveAuctionId)}${campParam}&format=${format}`, '_blank');
    setTimeout(() => {
      window.open(`/api/admin?action=export&type=activities&auctionId=${encodeURIComponent(effectiveAuctionId)}${campParam}&format=${format}`, '_blank');
    }, 600);
    showToast(`Downloading Auction #${effectiveAuctionId} Standings & Transaction Ledger (${format.toUpperCase()})...`);
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

  // ─── Memoized Computations (Called unconditionally before early returns) ─────
  const activeAdminLeaderboard = useMemo(() => {
    if (adminLeaderboardTab === 'sellers') {
      if (sellersLeaderboard.length > 0) return sellersLeaderboard;
      return leaderboard
        .filter(d => (d.sellerPoints || 0) > 0 || d.role === 'Seller' || d.category === 'OEM Dealer')
        .sort((a, b) => (b.sellerPoints || 0) - (a.sellerPoints || 0))
        .map((d, idx) => ({ ...d, rank: idx + 1, points: d.sellerPoints || d.points, sellerRank: idx + 1 }));
    }
    if (adminLeaderboardTab === 'buyers') {
      if (buyersLeaderboard.length > 0) return buyersLeaderboard;
      return leaderboard
        .filter(d => (d.buyerPoints || 0) > 0 || d.role === 'Buyer' || d.category === 'Used Car Dealer')
        .sort((a, b) => (b.buyerPoints || 0) - (a.buyerPoints || 0))
        .map((d, idx) => ({ ...d, rank: idx + 1, points: d.buyerPoints || d.points, buyerRank: idx + 1 }));
    }
    return overallLeaderboard.length > 0 ? overallLeaderboard : leaderboard;
  }, [adminLeaderboardTab, buyersLeaderboard, sellersLeaderboard, overallLeaderboard, leaderboard]);

  const filteredLeaderboard = useMemo(() => {
    return activeAdminLeaderboard.filter(d => {
      if (adminLeaderboardTab === 'overall') {
        if (leaderboardCategoryFilter === 'OEM' && d.category !== 'OEM Dealer' && d.role !== 'Seller') return false;
        if (leaderboardCategoryFilter === 'USED' && d.category !== 'Used Car Dealer' && d.role !== 'Buyer') return false;
        if (leaderboardCategoryFilter === 'CORPORATE' && d.category !== 'Corporate / Other') return false;
      }
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      const currentRank = adminLeaderboardTab === 'sellers'
        ? (d.sellerRank ?? d.rank)
        : adminLeaderboardTab === 'buyers'
        ? (d.buyerRank ?? d.rank)
        : (d.overallRank ?? d.rank);
      return (
        d.dealerName?.toLowerCase().includes(q) ||
        (d.realName && d.realName.toLowerCase().includes(q)) ||
        d.externalId?.toLowerCase().includes(q) ||
        (d.customerId && d.customerId.toLowerCase().includes(q)) ||
        (d.customerCode && d.customerCode.toLowerCase().includes(q)) ||
        d.city?.toLowerCase().includes(q) ||
        (d.category && d.category.toLowerCase().includes(q)) ||
        String(currentRank) === q ||
        `#${currentRank}` === q
      );
    });
  }, [activeAdminLeaderboard, adminLeaderboardTab, leaderboardCategoryFilter, searchQuery]);

  const sortedAndFilteredLeaderboard = useMemo(() => {
    const list = [...filteredLeaderboard];
    if (leaderboardSortOrder === 'asc') {
      return list.reverse();
    }
    return list;
  }, [filteredLeaderboard, leaderboardSortOrder]);

  // Derive available TN branches (either from backend API or calculated locally)
  const availableBranches = useMemo(() => {
    if (fleetBranches.length > 0) return fleetBranches;
    const branchMap = new Map<string, number>();
    for (const d of fleetDealers) {
      if (!isTamilNaduDealer(d.city)) continue;
      const b = d.branch || getDealerBranch(d.city);
      branchMap.set(b, (branchMap.get(b) || 0) + 1);
    }
    return Array.from(branchMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [fleetBranches, fleetDealers]);

  const displayFleetCategoryCounts = useMemo(() => {
    if (fleetBranchFilter === 'ALL') {
      return {
        total: fleetCategoryCounts.total || 1060,
        oem: fleetCategoryCounts.oem || 87,
        usedCar: fleetCategoryCounts.usedCar || 902,
        corporate: fleetCategoryCounts.corporate || 71,
      };
    }
    const branchDealers = fleetDealers.filter(d => isTamilNaduDealer(d.city) && (d.branch || getDealerBranch(d.city)) === fleetBranchFilter);
    const counts = { total: branchDealers.length, oem: 0, usedCar: 0, corporate: 0 };
    for (const d of branchDealers) {
      if (d.category === 'OEM Dealer') counts.oem++;
      else if (d.category === 'Used Car Dealer') counts.usedCar++;
      else if (d.category === 'Corporate / Other') counts.corporate++;
    }
    return counts;
  }, [fleetBranchFilter, fleetCategoryCounts, fleetDealers]);

  const filteredFleetDealers = useMemo(() => {
    const sourceList: FleetDealer[] = fleetDealers.length > 0 ? fleetDealers : leaderboard.map(d => ({
      id: d.dealerId,
      externalId: d.externalId,
      displayName: d.dealerName,
      city: d.city,
      branch: getDealerBranch(d.city),
      category: d.category || 'Used Car Dealer',
      status: 'ACTIVE',
      points: d.points,
      rank: d.rank,
      lastLoginAt: (d as any).lastLoginAt || null,
      lastLoginIp: (d as any).lastLoginIp || null,
      loginCount: (d as any).loginCount || 0,
    }));

    // STRICT REQUIREMENT: Only dealers from Tamil Nadu (TN) are shown in Dealer Fleet
    let filtered = sourceList.filter(d => isTamilNaduDealer(d.city));

    // Filter by selected TN Branch
    if (fleetBranchFilter !== 'ALL') {
      filtered = filtered.filter(d => (d.branch || getDealerBranch(d.city)) === fleetBranchFilter);
    }

    if (fleetCategoryFilter === 'OEM') filtered = filtered.filter(d => d.category === 'OEM Dealer');
    else if (fleetCategoryFilter === 'USED') filtered = filtered.filter(d => d.category === 'Used Car Dealer');
    else if (fleetCategoryFilter === 'CORPORATE') filtered = filtered.filter(d => d.category === 'Corporate / Other');

    if (fleetActivityFilter === 'ACTIVE_TODAY') {
      filtered = filtered.filter(d => {
        if (!d.lastLoginAt) return false;
        const diff = Date.now() - new Date(d.lastLoginAt).getTime();
        return diff <= 24 * 60 * 60 * 1000;
      });
    } else if (fleetActivityFilter === 'LOGGED_IN') {
      filtered = filtered.filter(d => Boolean(d.lastLoginAt));
    } else if (fleetActivityFilter === 'NEVER_LOGGED_IN') {
      filtered = filtered.filter(d => !d.lastLoginAt);
    }

    if (fleetSearchQuery) {
      const q = fleetSearchQuery.toLowerCase();
      filtered = filtered.filter(d => {
        const branch = (d.branch || getDealerBranch(d.city)).toLowerCase();
        return (
          d.displayName.toLowerCase().includes(q) ||
          d.externalId.toLowerCase().includes(q) ||
          d.city.toLowerCase().includes(q) ||
          branch.includes(q) ||
          (d.category && d.category.toLowerCase().includes(q))
        );
      });
    }

    if (fleetSortBy === 'lastLogin') {
      filtered = [...filtered].sort((a, b) => {
        const timeA = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
        const timeB = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
        return timeB - timeA;
      });
    } else if (fleetSortBy === 'points') {
      filtered = [...filtered].sort((a, b) => (b.points || 0) - (a.points || 0));
    } else if (fleetSortBy === 'name') {
      filtered = [...filtered].sort((a, b) => a.displayName.localeCompare(b.displayName));
    }

    return filtered;
  }, [fleetDealers, leaderboard, fleetCategoryFilter, fleetBranchFilter, fleetActivityFilter, fleetSortBy, fleetSearchQuery]);

  const filteredLiveActivities = liveActivities.filter(a => {
    if (liveFilter !== 'ALL' && a.activityType !== liveFilter) return false;
    if (liveSearchQuery) {
      const q = liveSearchQuery.toLowerCase();
      return a.dealerName.toLowerCase().includes(q) ||
             (a.buyerName && a.buyerName.toLowerCase().includes(q)) ||
             (a.sellerName && a.sellerName.toLowerCase().includes(q)) ||
             a.externalDealerId.toLowerCase().includes(q) ||
             a.city.toLowerCase().includes(q) ||
             JSON.stringify(a.metadata).toLowerCase().includes(q);
    }
    return true;
  });

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
                ← Return to Dealer Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <span
                className="navbar-badge"
                style={{
                  background: isEmployeeUser ? 'rgba(16, 185, 129, 0.15)' : 'rgba(54, 78, 162, 0.12)',
                  color: isEmployeeUser ? '#10b981' : 'var(--tvs-blue)',
                  borderColor: isEmployeeUser ? 'rgba(16, 185, 129, 0.4)' : 'rgba(54, 78, 162, 0.35)',
                  fontWeight: 700,
                }}
              >
                {isEmployeeUser ? 'TVS EMPLOYEE MISSION CONTROL' : 'ADMIN MISSION CONTROL'}
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
              onClick={async () => {
                await fetch('/api/admin/auth', { method: 'DELETE' });
                await fetch('/api/auth/login', { method: 'DELETE' });
                setAuthenticated(false);
                window.location.href = '/';
              }}
              title="Logout session"
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
                  {currentCampaign?.name || 'TVS Super Cup'} • {currentCampaign ? `${formatDateDDMMYYYY(currentCampaign.startDate)} to ${formatDateDDMMYYYY(currentCampaign.endDate)}` : '2026–27 Campaign'} • Real-Time Auction Telemetry & Fleet Management
                </p>
                {campaigns.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Active Campaign:
                    </span>
                    <select
                      className="form-input"
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                        background: 'var(--surface-color)',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border-color)',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                      value={currentCampaign?.id || selectedCampaignId || ''}
                      onChange={(e) => handleSwitchCampaign(Number(e.target.value))}
                    >
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({formatDateDDMMYYYY(c.startDate)} to {formatDateDDMMYYYY(c.endDate)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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

              <button
                className={`btn btn-sm ${activeTab === 'historicalAuctions' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => {
                  setActiveTab('historicalAuctions');
                  setSelectedDealer(null);
                }}
                title="List daily & weekly historical auctions across TN, KL, and AP/TS and pull data"
                style={{
                  borderColor: 'rgba(168, 85, 247, 0.4)',
                  color: activeTab === 'historicalAuctions' ? '#ffffff' : '#c084fc',
                  background: activeTab === 'historicalAuctions' ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' : 'rgba(168, 85, 247, 0.1)',
                  gap: '6px',
                  fontWeight: 600,
                }}
              >
                <History className="w-4 h-4 text-purple-400" />
                <span>Historical Auctions</span>
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
              { key: 'dealerLogins', icon: <LogIn className="w-4 h-4 text-emerald-400" />, label: 'Dealer Login Activity' },
              { key: 'rules', icon: <Settings className="w-4 h-4" />, label: 'Scoring Rules Engine' },
              { key: 'matches', icon: <Calendar className="w-4 h-4" />, label: 'Match Schedule' },
              { key: 'audit', icon: <FileText className="w-4 h-4" />, label: 'Audit Trail' },
              { key: 'historicalAuctions', icon: <History className="w-4 h-4 text-purple-400" />, label: 'Historical Auctions' },
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
                  if (item.key === 'dealers' && fleetDealers.length === 0) {
                    loadFleetDealers();
                  }
                  if (item.key === 'dealerLogins') {
                    loadDealerLogins();
                  }
                }}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.key === 'dealerLogins' && (stats?.activeSessions || dealerLoginSummary?.activeSessionsCount) ? (
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    marginLeft: '4px',
                  }}>
                    {stats?.activeSessions || dealerLoginSummary?.activeSessionsCount} online
                  </span>
                ) : null}
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
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>+1 pt per bid</span>
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
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>+1 pt per match</span>
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
                            <div className="admin-stat-val" style={{ fontSize: '1.0rem', color: 'var(--tvs-red-light)', lineHeight: '1.3' }}>
                              {currentCampaign?.name || "Super Cup '26"}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {currentCampaign ? `${formatDateDDMMYYYY(currentCampaign.startDate)} to ${formatDateDDMMYYYY(currentCampaign.endDate)}` : `${activeMatches.length} Live & Upcoming Matches`}
                            </span>
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
                                        Auction #{m.auctionId} • {formatDateDDMMYYYY(m.date)}
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
                                      Auction #{m.auctionId} • {formatDateDDMMYYYY(m.date)}
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

                        {/* Last Logged-In Dealer Activity & Portal Adoption Telemetry Card */}
                        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-cyan)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <LogIn className="w-5 h-5 text-emerald-400" />
                                <h3 className="card-title" style={{ margin: 0 }}>
                                  Last Logged-In Dealer Activity & Portal Adoption
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
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: '#34d399',
                                  border: '1px solid rgba(16, 185, 129, 0.4)'
                                }}>
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
                                  REAL-TIME LOGINS
                                </span>
                              </div>
                              <p className="card-subtitle" style={{ marginTop: '4px' }}>
                                Real-time visibility into dealership portal logins, recent sessions, and active TVS dealer engagement
                              </p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => setActiveTab('dealerLogins')}
                                title="Open full dealer logins monitor"
                              >
                                View All Logins ({dealerLoginSummary?.totalSessions || 0}) →
                              </button>
                            </div>
                          </div>

                          {/* 4 Mini Stat Badges */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                              <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>Active Today</div>
                              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                                {dealerLoginSummary?.activeToday ?? 0}
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '6px' }}>
                                  ({Math.round(((dealerLoginSummary?.activeToday ?? 0) / Math.max(stats?.totalDealers || 1, 1)) * 100)}% of fleet)
                                </span>
                              </div>
                            </div>

                            <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                              <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>Active This Week</div>
                              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                                {dealerLoginSummary?.activeWeek ?? 0}
                              </div>
                            </div>

                            <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                              <div style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 700, textTransform: 'uppercase' }}>Adoption Rate</div>
                              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#c084fc', marginTop: '2px' }}>
                                {dealerLoginSummary?.adoptionRate ?? 0}%
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '6px' }}>
                                  ({dealerLoginSummary?.totalDealersWithLogin ?? 0} dealers)
                                </span>
                              </div>
                            </div>

                            <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                              <div style={{ fontSize: '0.72rem', color: '#fb7185', fontWeight: 700, textTransform: 'uppercase' }}>Never Logged In</div>
                              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fb7185', marginTop: '2px' }}>
                                {dealerLoginSummary?.neverLoggedInCount ?? (stats?.totalDealers ? stats.totalDealers - (dealerLoginSummary?.totalDealersWithLogin ?? 0) : 0)}
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '6px' }}>
                                  Dormant
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Recent Logged-in Dealers Table */}
                          <div style={{ overflowX: 'auto' }}>
                            <table className="admin-table" style={{ margin: 0 }}>
                              <thead>
                                <tr>
                                  <th>Dealer Legal Name</th>
                                  <th>Category</th>
                                  <th>City / Location</th>
                                  <th>Last Logged In</th>
                                  <th>Device & IP</th>
                                  <th>Session State</th>
                                  <th>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(!recentDealerLogins || recentDealerLogins.length === 0) ? (
                                  <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                      No dealer login activity recorded yet.
                                    </td>
                                  </tr>
                                ) : (
                                  recentDealerLogins.slice(0, 6).map((log) => (
                                    <tr key={log.id}>
                                      <td>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                          {log.dealerName}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                                          Code: {log.dealerTvsCode}
                                        </div>
                                      </td>
                                      <td>
                                        <span style={{
                                          fontSize: '0.72rem',
                                          fontWeight: 600,
                                          padding: '2px 8px',
                                          borderRadius: '999px',
                                          background: log.dealerCategory === 'OEM Dealer' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                                          color: log.dealerCategory === 'OEM Dealer' ? '#34d399' : '#38bdf8',
                                          border: `1px solid ${log.dealerCategory === 'OEM Dealer' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                                        }}>
                                          {log.dealerCategory || 'Used Car Dealer'}
                                        </span>
                                      </td>
                                      <td>
                                        <div style={{ fontSize: '0.82rem' }}>
                                          {log.dealerCity || 'Tamil Nadu'}
                                        </div>
                                      </td>
                                      <td>
                                        <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                                          {formatTimeAgo(log.loginTime)}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                          {formatDateDDMMYYYY(log.loginTime || log.loginAt)} {new Date(log.loginTime || log.loginAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                                        </div>
                                      </td>
                                      <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}>
                                          {log.device?.toLowerCase().includes('mobile') || log.device?.toLowerCase().includes('android') || log.device?.toLowerCase().includes('iphone') ? (
                                            <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                                          ) : (
                                            <Laptop className="w-3.5 h-3.5 text-sky-400" />
                                          )}
                                          <span>{log.device || 'Desktop'}</span>
                                        </div>
                                        <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                                          {log.ipAddress || '—'}
                                        </div>
                                      </td>
                                      <td>
                                        {log.isSessionActive ? (
                                          <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '2px 8px',
                                            borderRadius: '999px',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            background: 'rgba(16, 185, 129, 0.15)',
                                            color: '#34d399',
                                            border: '1px solid rgba(16, 185, 129, 0.35)',
                                          }}>
                                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34d399' }} />
                                            Active Session
                                          </span>
                                        ) : (
                                          <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '2px 8px',
                                            borderRadius: '999px',
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            background: 'rgba(148, 163, 184, 0.12)',
                                            color: '#94a3b8',
                                            border: '1px solid rgba(148, 163, 184, 0.25)',
                                          }}>
                                            Expired / Idle
                                          </span>
                                        )}
                                      </td>
                                      <td>
                                        <button
                                          className="btn btn-ghost btn-xs"
                                          onClick={() => loadDealerDetail(log.dealerId)}
                                          style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                                        >
                                          Inspect →
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
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
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    color: '#34d399',
                                    border: '1px solid rgba(16, 185, 129, 0.4)'
                                  }}>
                                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34d399' }} />
                                    UNMASKED • LIVE STANDINGS
                                  </span>
                                </div>
                                <p className="card-subtitle">
                                  Showing verified rankings for {leaderboard.length} TVS dealerships • Enterprise legal entity names active
                                </p>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

                            <div className="search-bar-wrap" style={{ padding: '0 16px 8px' }}>
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

                            {/* Category Filter Pills */}
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', padding: '0 16px 12px' }}>
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Filter:</span>
                              {[
                                { key: 'ALL', tab: 'overall' as const, label: 'All Dealerships' },
                                { key: 'OEM', tab: 'sellers' as const, label: 'OEM Dealers (Sellers)', color: '#34d399' },
                                { key: 'USED', tab: 'buyers' as const, label: 'Used Car Dealers (Buyers)', color: '#38bdf8' },
                              ].map(pill => {
                                const isActive = adminLeaderboardTab === pill.tab;
                                return (
                                  <button
                                    key={pill.key}
                                    className="btn btn-xs"
                                    style={{
                                      padding: '3px 9px',
                                      fontSize: '0.72rem',
                                      borderRadius: '999px',
                                      background: isActive ? (pill.color ? `${pill.color}22` : 'rgba(255,255,255,0.12)') : 'transparent',
                                      border: `1px solid ${isActive ? (pill.color || 'var(--accent-cyan)') : 'var(--border-subtle)'}`,
                                      color: isActive ? (pill.color || 'var(--accent-cyan)') : 'var(--text-secondary)',
                                      fontWeight: isActive ? 700 : 500,
                                    }}
                                    onClick={() => {
                                      setAdminLeaderboardTab(pill.tab);
                                      setLeaderboardCategoryFilter(pill.key);
                                    }}
                                  >
                                    {pill.label}
                                  </button>
                                );
                              })}
                            </div>

                            <div style={{ overflowX: 'auto', maxHeight: '520px' }}>
                              <table className="admin-table">
                                <thead>
                                  <tr>
                                    <th>Rank</th>
                                    <th>Dealership Name</th>
                                    <th>Category & Role</th>
                                    <th>External ID</th>
                                    <th>City / Hub</th>
                                    <th>Points</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredLeaderboard.slice(0, overviewLeaderboardLimit).map(d => {
                                    const currentRank = adminLeaderboardTab === 'sellers'
                                      ? (d.sellerRank ?? d.rank)
                                      : adminLeaderboardTab === 'buyers'
                                      ? (d.buyerRank ?? d.rank)
                                      : (d.overallRank ?? d.rank);
                                    return (
                                    <tr key={d.dealerId}>
                                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                                        {currentRank === 1 ? '🥇 #1' :
                                         currentRank === 2 ? '🥈 #2' :
                                         currentRank === 3 ? '🥉 #3' :
                                         `#${currentRank}`}
                                      </td>
                                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {d.dealerName}
                                      </td>
                                      <td>
                                        {d.category === 'OEM Dealer' ? (
                                          <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '2px 8px',
                                            borderRadius: '999px',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            background: 'rgba(16, 185, 129, 0.15)',
                                            color: '#34d399',
                                            border: '1px solid rgba(16, 185, 129, 0.35)',
                                            whiteSpace: 'nowrap'
                                          }}>
                                            🏢 OEM • Seller
                                          </span>
                                        ) : d.category === 'Used Car Dealer' ? (
                                          <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '2px 8px',
                                            borderRadius: '999px',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            background: 'rgba(56, 189, 248, 0.15)',
                                            color: '#38bdf8',
                                            border: '1px solid rgba(56, 189, 248, 0.35)',
                                            whiteSpace: 'nowrap'
                                          }}>
                                            🚗 Used Car • Buyer
                                          </span>
                                        ) : (
                                          <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '2px 8px',
                                            borderRadius: '999px',
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            background: 'rgba(148, 163, 184, 0.15)',
                                            color: '#94a3b8',
                                            border: '1px solid rgba(148, 163, 184, 0.3)',
                                            whiteSpace: 'nowrap'
                                          }}>
                                            {d.category || 'Other'}
                                          </span>
                                        )}
                                      </td>
                                      <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                                        {d.externalId}
                                      </td>
                                      <td>{d.city}</td>
                                      <td style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontWeight: 800,
                                        color: adminLeaderboardTab === 'sellers' ? 'var(--accent-amber)' : adminLeaderboardTab === 'buyers' ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
                                        fontSize: '0.92rem'
                                      }}>
                                        {(adminLeaderboardTab === 'sellers' ? (d.sellerPoints ?? d.points) : adminLeaderboardTab === 'buyers' ? (d.buyerPoints ?? d.points) : d.points).toLocaleString()} PTS
                                      </td>
                                      <td>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                          <button 
                                            className="btn btn-ghost btn-sm" 
                                            style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                            onClick={() => loadDealerDetail(d.dealerId)}
                                            disabled={inspectingDealerId === d.dealerId}
                                          >
                                            {inspectingDealerId === d.dealerId ? (
                                              <>
                                                <span style={{ width: '10px', height: '10px', border: '2px solid rgba(56,189,248,0.3)', borderTopColor: '#38bdf8', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
                                                <span>Loading...</span>
                                              </>
                                            ) : (
                                              'Inspect'
                                            )}
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
                                  );
                                })}
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
                                        <span title={formatDateTimeDDMMYYYY(a.timestamp)} style={{ fontFamily: 'var(--font-mono)' }}>
                                          {formatDateDDMMYYYY(a.timestamp)} • {formatTimeIST(a.timestamp)}
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
                                background: 'rgba(16, 185, 129, 0.18)',
                                border: '1px solid rgba(16, 185, 129, 0.5)',
                                padding: '3px 10px',
                                borderRadius: '999px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                color: '#34d399',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                fontFamily: 'var(--font-mono)'
                              }}>
                                <span style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: '#34d399',
                                  boxShadow: '0 0 6px #34d399'
                                }}></span>
                                UNMASKED • ADMIN MISSION CONTROL
                              </span>
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                              Official Super Cup Standings
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                              2026–27 Dealership Championship • Enterprise legal names and points unmasked for administration
                            </p>
                          </div>

                          {/* Quick Controls */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={handleRecalculate}
                              title="Recalculate leaderboard scores and ranks"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Recalculate</span>
                            </button>

                            {/* Excel Multi-Sheet Standings & Points Audit Export */}
                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={() => triggerExportDownload('auctionLeaderboard', 'xlsx')}
                              title={`Download official multi-sheet Excel spreadsheet (.xlsx) with Auction #${liveAuctionId || ''} leaderboard, points calculation formulas for each dealer, and verification data`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.8rem',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                borderColor: '#10b981',
                                color: '#ffffff',
                                fontWeight: 700,
                                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.25)',
                              }}
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span>Export Standings (Excel .xlsx)</span>
                            </button>

                            {/* Export Standings CSV */}
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => triggerExportDownload('auctionLeaderboard', 'csv')}
                              title={`Export Auction #${liveAuctionId || ''} verified leaderboard standings and dealer points calculation breakdown as CSV`}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Export Standings CSV</span>
                            </button>

                            {/* More Export Options Modal */}
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={handleExport}
                              title="Open comprehensive Super Cup export center with all audit reports"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', border: '1px solid var(--border-subtle)' }}
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              <span>Export Center</span>
                            </button>
                          </div>
                        </div>

                        {/* ── Multi-Auction Selection & Processing Bar (Super Cup >= Oct 15) ── */}
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          borderRadius: '12px',
                          padding: '16px 20px',
                          marginBottom: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <Filter className="w-4 h-4 text-sky-400" />
                                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                                  Multi-Auction Standings Processor
                                </span>
                                <span style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '999px',
                                  background: 'rgba(56, 189, 248, 0.2)',
                                  color: 'var(--accent-blue)',
                                  border: '1px solid rgba(56, 189, 248, 0.4)',
                                }}>
                                  SUPERCUP (START: OCT 15, 2026)
                                </span>
                              </div>
                              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                Multi-select auctions below to process overall rankings across all chosen match events. TVS Super Cup officially began on October 15th, 2026.
                              </p>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="btn btn-xs"
                                onClick={handleSelectAllAuctions}
                                style={{
                                  background: selectedAuctionIds.length > 0 && selectedAuctionIds.length === allSuperCupAuctions.length
                                    ? 'var(--accent-blue)'
                                    : 'rgba(56, 189, 248, 0.15)',
                                  color: selectedAuctionIds.length > 0 && selectedAuctionIds.length === allSuperCupAuctions.length
                                    ? '#fff'
                                    : 'var(--accent-blue)',
                                  border: '1px solid rgba(56, 189, 248, 0.4)',
                                  fontWeight: 700,
                                  borderRadius: '6px',
                                  padding: '4px 10px',
                                }}
                              >
                                ✓ Select All ({allSuperCupAuctions.length})
                              </button>

                              <button
                                type="button"
                                className="btn btn-xs btn-ghost"
                                onClick={handleClearAuctionSelection}
                                style={{
                                  border: '1px solid var(--border-subtle)',
                                  borderRadius: '6px',
                                  padding: '4px 10px',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                Cumulative Whole Season
                              </button>
                            </div>
                          </div>

                          {/* Interactive Auction Checkbox Chips */}
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {allSuperCupAuctions.map(auc => {
                              const isSelected = selectedAuctionIds.includes(auc.auctionId);
                              return (
                                <button
                                  key={auc.auctionId}
                                  type="button"
                                  onClick={() => handleToggleAuctionSelection(auc.auctionId)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: isSelected ? 700 : 500,
                                    background: isSelected ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                                    border: `1.5px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    transition: 'all 0.15s ease',
                                    boxShadow: isSelected ? '0 0 10px rgba(56, 189, 248, 0.25)' : 'none',
                                  }}
                                >
                                  <span style={{
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '3px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: isSelected ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.1)',
                                    color: '#fff',
                                    fontSize: '0.65rem',
                                    fontWeight: 900,
                                  }}>
                                    {isSelected ? '✓' : ''}
                                  </span>
                                  <span>
                                    {auc.matchNumber ? `Match #${auc.matchNumber}: ` : ''}Auction #{auc.auctionId}
                                  </span>
                                  {auc.date && (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                      ({formatDateDDMMYYYY(auc.date)})
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Executive First / Last Place Telemetry Summary Cards */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: '10px',
                            paddingTop: '10px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                          }}>
                            {/* First Place Leader Card */}
                            <div style={{
                              background: 'rgba(245, 158, 11, 0.08)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              borderRadius: '8px',
                              padding: '10px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                            }}>
                              <span style={{ fontSize: '1.6rem' }}>🥇</span>
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  First Place (Leader)
                                </div>
                                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                  {activeAdminLeaderboard[0] ? (activeAdminLeaderboard[0].realName || activeAdminLeaderboard[0].dealerName) : 'No entries'}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                  {activeAdminLeaderboard[0] ? `${(adminLeaderboardTab === 'buyers' ? (activeAdminLeaderboard[0].buyerPoints ?? activeAdminLeaderboard[0].points) : adminLeaderboardTab === 'sellers' ? (activeAdminLeaderboard[0].sellerPoints ?? activeAdminLeaderboard[0].points) : activeAdminLeaderboard[0].points).toLocaleString()} pts • ${activeAdminLeaderboard[0].city}` : ''}
                                </div>
                              </div>
                            </div>

                            {/* Last Place Card */}
                            <div style={{
                              background: 'rgba(239, 68, 68, 0.08)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '8px',
                              padding: '10px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                            }}>
                              <span style={{ fontSize: '1.4rem', color: '#f87171' }}>🔻</span>
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Last Place (Rank #{activeAdminLeaderboard.length})
                                </div>
                                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                  {activeAdminLeaderboard.length > 0 ? (activeAdminLeaderboard[activeAdminLeaderboard.length - 1].realName || activeAdminLeaderboard[activeAdminLeaderboard.length - 1].dealerName) : 'No entries'}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                  {activeAdminLeaderboard.length > 0 ? `${(adminLeaderboardTab === 'buyers' ? (activeAdminLeaderboard[activeAdminLeaderboard.length - 1].buyerPoints ?? activeAdminLeaderboard[activeAdminLeaderboard.length - 1].points) : adminLeaderboardTab === 'sellers' ? (activeAdminLeaderboard[activeAdminLeaderboard.length - 1].sellerPoints ?? activeAdminLeaderboard[activeAdminLeaderboard.length - 1].points) : activeAdminLeaderboard[activeAdminLeaderboard.length - 1].points).toLocaleString()} pts • ${activeAdminLeaderboard[activeAdminLeaderboard.length - 1].city}` : ''}
                                </div>
                              </div>
                            </div>

                            {/* Selection Scope Summary */}
                            <div style={{
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '8px',
                              padding: '10px 14px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                            }}>
                              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                Standings Processing Scope
                              </div>
                              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                                {selectedAuctionIds.length > 0 ? `${selectedAuctionIds.length} Selected Auctions` : 'All Super Cup Tournament'}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                {activeAdminLeaderboard.length} dealerships ranked across selection
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ── Segmented League Switcher (Buyer Leaderboard, Seller Leaderboard, Overall Standings) ── */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '12px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '12px',
                          padding: '10px 14px',
                          marginBottom: '20px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setAdminLeaderboardTab('buyers');
                                setLeaderboardCategoryFilter('USED');
                              }}
                              className="btn btn-sm"
                              style={{
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 14px',
                                background: adminLeaderboardTab === 'buyers' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid ${adminLeaderboardTab === 'buyers' ? '#10b981' : 'var(--border-subtle)'}`,
                                color: adminLeaderboardTab === 'buyers' ? '#ffffff' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                boxShadow: adminLeaderboardTab === 'buyers' ? '0 2px 10px rgba(16, 185, 129, 0.3)' : 'none'
                              }}
                            >
                              <ShoppingCart className="w-4 h-4 text-emerald-300" />
                              <span>Buyer Leaderboard</span>
                              <span style={{
                                fontSize: '0.7rem',
                                background: adminLeaderboardTab === 'buyers' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.08)',
                                padding: '2px 7px',
                                borderRadius: '999px',
                                color: '#fff'
                              }}>
                                {adminLeaderboardCounts.buyers || buyersLeaderboard.length}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setAdminLeaderboardTab('sellers');
                                setLeaderboardCategoryFilter('OEM');
                              }}
                              className="btn btn-sm"
                              style={{
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 14px',
                                background: adminLeaderboardTab === 'sellers' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid ${adminLeaderboardTab === 'sellers' ? '#f59e0b' : 'var(--border-subtle)'}`,
                                color: adminLeaderboardTab === 'sellers' ? '#000000' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                boxShadow: adminLeaderboardTab === 'sellers' ? '0 2px 10px rgba(245, 158, 11, 0.3)' : 'none'
                              }}
                            >
                              <Tag className="w-4 h-4" />
                              <span>Seller Leaderboard</span>
                              <span style={{
                                fontSize: '0.7rem',
                                background: adminLeaderboardTab === 'sellers' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)',
                                padding: '2px 7px',
                                borderRadius: '999px',
                                color: adminLeaderboardTab === 'sellers' ? '#000' : '#fff'
                              }}>
                                {adminLeaderboardCounts.sellers || sellersLeaderboard.length}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setAdminLeaderboardTab('overall');
                                setLeaderboardCategoryFilter('ALL');
                              }}
                              className="btn btn-sm"
                              style={{
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 14px',
                                background: adminLeaderboardTab === 'overall' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid ${adminLeaderboardTab === 'overall' ? '#3b82f6' : 'var(--border-subtle)'}`,
                                color: adminLeaderboardTab === 'overall' ? '#ffffff' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                boxShadow: adminLeaderboardTab === 'overall' ? '0 2px 10px rgba(59, 130, 246, 0.3)' : 'none'
                              }}
                            >
                              <Trophy className="w-4 h-4 text-blue-200" />
                              <span>Overall Standings</span>
                              <span style={{
                                fontSize: '0.7rem',
                                background: adminLeaderboardTab === 'overall' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.08)',
                                padding: '2px 7px',
                                borderRadius: '999px',
                                color: '#fff'
                              }}>
                                {adminLeaderboardCounts.overall || overallLeaderboard.length || leaderboard.length}
                              </span>
                            </button>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            <span style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: '#10b981',
                              boxShadow: '0 0 8px #10b981'
                            }}></span>
                            <span>Viewing: <strong style={{ color: 'var(--text-primary)' }}>{adminLeaderboardTab === 'buyers' ? 'Buyer Standings (Unmasked)' : adminLeaderboardTab === 'sellers' ? 'Seller Standings (Unmasked)' : 'Overall Super Cup Standings (Unmasked)'}</strong></span>
                          </div>
                        </div>

                        {/* Top 3 Championship Podium Cards */}
                        {activeAdminLeaderboard.length >= 3 && !searchQuery && (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '16px',
                            marginBottom: '24px'
                          }}>
                            {/* Gold - Rank 1 */}
                            {activeAdminLeaderboard[0] && (
                              <div className="admin-podium-card rank-1">
                                <div className="podium-watermark">🥇</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                                  <span className="podium-rank-badge">
                                    1ST PLACE • CHAMPION
                                  </span>
                                  {activeAdminLeaderboard[0].customerId && (
                                    <span className="customer-id-pill" title={`TVS Customer ID: ${activeAdminLeaderboard[0].customerId}`}>
                                      <span>{activeAdminLeaderboard[0].customerId}</span>
                                      <button
                                        type="button"
                                        className="copy-id-btn"
                                        onClick={(e) => copyCustomerId(activeAdminLeaderboard[0].customerId!, e)}
                                        title="Copy Customer ID"
                                      >
                                        {copiedCustomerId === activeAdminLeaderboard[0].customerId ? (
                                          <Check className="w-3 h-3 text-emerald-500" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    </span>
                                  )}
                                </div>
                                <h3 className="podium-dealer-title">
                                  {activeAdminLeaderboard[0].realName || activeAdminLeaderboard[0].dealerName}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                  {adminLeaderboardTab === 'buyers' ? (
                                    <span className="activity-telemetry-badge">
                                      <strong style={{ color: 'var(--accent-emerald)' }}>{activeAdminLeaderboard[0].buysCount || 0}</strong> Won • {activeAdminLeaderboard[0].bidsCount || 0} Bids
                                    </span>
                                  ) : adminLeaderboardTab === 'sellers' ? (
                                    <span className="activity-telemetry-badge">
                                      <strong style={{ color: 'var(--accent-amber)' }}>{activeAdminLeaderboard[0].salesCount || 0}</strong> Sold • {activeAdminLeaderboard[0].listingsCount || 0} Listed
                                    </span>
                                  ) : (
                                    <span className={`admin-category-badge ${activeAdminLeaderboard[0].category === 'OEM Dealer' ? 'oem' : 'used'}`}>
                                      {activeAdminLeaderboard[0].category === 'OEM Dealer' ? '🏢 OEM Dealer • Seller' : '🚗 Used Car Dealer • Buyer'}
                                    </span>
                                  )}
                                </div>
                                <div className="podium-dealer-location">
                                  📍 {activeAdminLeaderboard[0].city}
                                </div>
                                <div className="podium-score-row">
                                  <span className="podium-points-wrap podium-points-val">
                                    {(adminLeaderboardTab === 'buyers' ? (activeAdminLeaderboard[0].buyerPoints ?? activeAdminLeaderboard[0].points) : adminLeaderboardTab === 'sellers' ? (activeAdminLeaderboard[0].sellerPoints ?? activeAdminLeaderboard[0].points) : activeAdminLeaderboard[0].points).toLocaleString()}
                                    <span className="podium-points-unit">{adminLeaderboardTab === 'buyers' ? 'BUYER PTS' : adminLeaderboardTab === 'sellers' ? 'SELLER PTS' : 'PTS'}</span>
                                  </span>
                                  <button
                                    className="podium-inspect-btn"
                                    onClick={() => loadDealerDetail(activeAdminLeaderboard[0].dealerId)}
                                  >
                                    Inspect Fleet →
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Silver - Rank 2 */}
                            {activeAdminLeaderboard[1] && (
                              <div className="admin-podium-card rank-2">
                                <div className="podium-watermark">🥈</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                                  <span className="podium-rank-badge">
                                    2ND PLACE • RUNNER UP
                                  </span>
                                  {activeAdminLeaderboard[1].customerId && (
                                    <span className="customer-id-pill" title={`TVS Customer ID: ${activeAdminLeaderboard[1].customerId}`}>
                                      <span>{activeAdminLeaderboard[1].customerId}</span>
                                      <button
                                        type="button"
                                        className="copy-id-btn"
                                        onClick={(e) => copyCustomerId(activeAdminLeaderboard[1].customerId!, e)}
                                        title="Copy Customer ID"
                                      >
                                        {copiedCustomerId === activeAdminLeaderboard[1].customerId ? (
                                          <Check className="w-3 h-3 text-emerald-500" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    </span>
                                  )}
                                </div>
                                <h3 className="podium-dealer-title">
                                  {activeAdminLeaderboard[1].realName || activeAdminLeaderboard[1].dealerName}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                  {adminLeaderboardTab === 'buyers' ? (
                                    <span className="activity-telemetry-badge">
                                      <strong style={{ color: 'var(--accent-emerald)' }}>{activeAdminLeaderboard[1].buysCount || 0}</strong> Won • {activeAdminLeaderboard[1].bidsCount || 0} Bids
                                    </span>
                                  ) : adminLeaderboardTab === 'sellers' ? (
                                    <span className="activity-telemetry-badge">
                                      <strong style={{ color: 'var(--accent-amber)' }}>{activeAdminLeaderboard[1].salesCount || 0}</strong> Sold • {activeAdminLeaderboard[1].listingsCount || 0} Listed
                                    </span>
                                  ) : (
                                    <span className={`admin-category-badge ${activeAdminLeaderboard[1].category === 'OEM Dealer' ? 'oem' : 'used'}`}>
                                      {activeAdminLeaderboard[1].category === 'OEM Dealer' ? '🏢 OEM Dealer • Seller' : '🚗 Used Car Dealer • Buyer'}
                                    </span>
                                  )}
                                </div>
                                <div className="podium-dealer-location">
                                  📍 {activeAdminLeaderboard[1].city}
                                </div>
                                <div className="podium-score-row">
                                  <span className="podium-points-wrap podium-points-val">
                                    {(adminLeaderboardTab === 'buyers' ? (activeAdminLeaderboard[1].buyerPoints ?? activeAdminLeaderboard[1].points) : adminLeaderboardTab === 'sellers' ? (activeAdminLeaderboard[1].sellerPoints ?? activeAdminLeaderboard[1].points) : activeAdminLeaderboard[1].points).toLocaleString()}
                                    <span className="podium-points-unit">{adminLeaderboardTab === 'buyers' ? 'BUYER PTS' : adminLeaderboardTab === 'sellers' ? 'SELLER PTS' : 'PTS'}</span>
                                  </span>
                                  <button
                                    className="podium-inspect-btn"
                                    onClick={() => loadDealerDetail(activeAdminLeaderboard[1].dealerId)}
                                  >
                                    Inspect Fleet →
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Bronze - Rank 3 */}
                            {activeAdminLeaderboard[2] && (
                              <div className="admin-podium-card rank-3">
                                <div className="podium-watermark">🥉</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                                  <span className="podium-rank-badge">
                                    3RD PLACE • PODIUM
                                  </span>
                                  {activeAdminLeaderboard[2].customerId && (
                                    <span className="customer-id-pill" title={`TVS Customer ID: ${activeAdminLeaderboard[2].customerId}`}>
                                      <span>{activeAdminLeaderboard[2].customerId}</span>
                                      <button
                                        type="button"
                                        className="copy-id-btn"
                                        onClick={(e) => copyCustomerId(activeAdminLeaderboard[2].customerId!, e)}
                                        title="Copy Customer ID"
                                      >
                                        {copiedCustomerId === activeAdminLeaderboard[2].customerId ? (
                                          <Check className="w-3 h-3 text-emerald-500" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    </span>
                                  )}
                                </div>
                                <h3 className="podium-dealer-title">
                                  {activeAdminLeaderboard[2].realName || activeAdminLeaderboard[2].dealerName}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                  {adminLeaderboardTab === 'buyers' ? (
                                    <span className="activity-telemetry-badge">
                                      <strong style={{ color: 'var(--accent-emerald)' }}>{activeAdminLeaderboard[2].buysCount || 0}</strong> Won • {activeAdminLeaderboard[2].bidsCount || 0} Bids
                                    </span>
                                  ) : adminLeaderboardTab === 'sellers' ? (
                                    <span className="activity-telemetry-badge">
                                      <strong style={{ color: 'var(--accent-amber)' }}>{activeAdminLeaderboard[2].salesCount || 0}</strong> Sold • {activeAdminLeaderboard[2].listingsCount || 0} Listed
                                    </span>
                                  ) : (
                                    <span className={`admin-category-badge ${activeAdminLeaderboard[2].category === 'OEM Dealer' ? 'oem' : 'used'}`}>
                                      {activeAdminLeaderboard[2].category === 'OEM Dealer' ? '🏢 OEM Dealer • Seller' : '🚗 Used Car Dealer • Buyer'}
                                    </span>
                                  )}
                                </div>
                                <div className="podium-dealer-location">
                                  📍 {activeAdminLeaderboard[2].city}
                                </div>
                                <div className="podium-score-row">
                                  <span className="podium-points-wrap podium-points-val">
                                    {(adminLeaderboardTab === 'buyers' ? (activeAdminLeaderboard[2].buyerPoints ?? activeAdminLeaderboard[2].points) : adminLeaderboardTab === 'sellers' ? (activeAdminLeaderboard[2].sellerPoints ?? activeAdminLeaderboard[2].points) : activeAdminLeaderboard[2].points).toLocaleString()}
                                    <span className="podium-points-unit">{adminLeaderboardTab === 'buyers' ? 'BUYER PTS' : adminLeaderboardTab === 'sellers' ? 'SELLER PTS' : 'PTS'}</span>
                                  </span>
                                  <button
                                    className="podium-inspect-btn"
                                    onClick={() => loadDealerDetail(activeAdminLeaderboard[2].dealerId)}
                                  >
                                    Inspect Fleet →
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Search, Category Filter, and Summary Bar */}
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '16px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: '1 1 450px' }}>
                            <div className="search-input-box" style={{ flex: '1 1 240px', maxWidth: '420px' }}>
                              <Search className="w-4 h-4 search-icon-left" />
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Search by dealership legal name, TVS Customer ID, dealer code, or city..."
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

                            {/* Category Filter Buttons in Standings */}
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                              {[
                                { key: 'ALL', tab: 'overall' as const, label: 'All Categories' },
                                { key: 'OEM', tab: 'sellers' as const, label: 'OEM Dealers (Sellers)', color: '#34d399' },
                                { key: 'USED', tab: 'buyers' as const, label: 'Used Car Dealers (Buyers)', color: '#38bdf8' },
                              ].map(pill => {
                                const isActive = adminLeaderboardTab === pill.tab;
                                return (
                                  <button
                                    key={pill.key}
                                    className="btn btn-xs"
                                    style={{
                                      padding: '4px 10px',
                                      fontSize: '0.74rem',
                                      borderRadius: '999px',
                                      background: isActive ? (pill.color ? `${pill.color}22` : 'rgba(255,255,255,0.12)') : 'transparent',
                                      border: `1px solid ${isActive ? (pill.color || 'var(--accent-cyan)') : 'var(--border-subtle)'}`,
                                      color: isActive ? (pill.color || 'var(--accent-cyan)') : 'var(--text-secondary)',
                                      fontWeight: isActive ? 700 : 500,
                                    }}
                                    onClick={() => {
                                      setAdminLeaderboardTab(pill.tab);
                                      setLeaderboardCategoryFilter(pill.key);
                                    }}
                                  >
                                    {pill.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn btn-xs"
                              onClick={() => setLeaderboardSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                              style={{
                                padding: '4px 10px',
                                fontSize: '0.74rem',
                                borderRadius: '999px',
                                background: leaderboardSortOrder === 'asc' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                                border: `1px solid ${leaderboardSortOrder === 'asc' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`,
                                color: leaderboardSortOrder === 'asc' ? '#f87171' : 'var(--accent-blue)',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                              }}
                              title="Toggle between First place at top and Last place at top"
                            >
                              {leaderboardSortOrder === 'desc' ? '🏆 Sort: 1st → Last' : '🔻 Sort: Last → 1st'}
                            </button>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                              Showing <strong>{filteredLeaderboard.length}</strong> of <strong>{activeAdminLeaderboard.length}</strong> {adminLeaderboardTab === 'sellers' ? 'active OEM sellers' : adminLeaderboardTab === 'buyers' ? 'active buyers' : 'active unmasked dealerships'}
                            </div>
                          </div>
                        </div>

                        {/* Standings Table */}
                        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th style={{ width: '74px', textAlign: 'center' }}>Rank</th>
                                <th style={{ width: '170px' }}>Customer ID</th>
                                <th>Dealership Legal Name (Unmasked)</th>
                                <th style={{ width: '130px' }}>City / Hub</th>
                                <th style={{ width: '170px' }}>
                                  {adminLeaderboardTab === 'buyers' ? 'Buyer Stats' : adminLeaderboardTab === 'sellers' ? 'Seller Stats' : 'League Role'}
                                </th>
                                <th style={{ width: '160px', textAlign: 'right' }}>
                                  {adminLeaderboardTab === 'buyers' ? 'Buyer Points' : adminLeaderboardTab === 'sellers' ? 'Seller Points' : 'Championship Points'}
                                </th>
                                <th style={{ width: '150px', textAlign: 'center' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedAndFilteredLeaderboard.map((d, index) => {
                                const maxPts = activeAdminLeaderboard[0]?.points || 1;
                                const ptsVal = adminLeaderboardTab === 'buyers' ? (d.buyerPoints ?? d.points) : adminLeaderboardTab === 'sellers' ? (d.sellerPoints ?? d.points) : (d.totalPoints ?? d.points);
                                const pct = Math.min(100, Math.round((ptsVal / maxPts) * 100));
                                const currentRank = adminLeaderboardTab === 'sellers'
                                  ? (d.sellerRank ?? d.rank)
                                  : adminLeaderboardTab === 'buyers'
                                  ? (d.buyerRank ?? d.rank)
                                  : (d.overallRank ?? d.rank);
                                return (
                                  <tr key={`${adminLeaderboardTab}-${d.dealerId}-${index}`} style={{ background: index < 3 ? 'rgba(255, 255, 255, 0.02)' : 'transparent' }}>
                                    {/* Rank */}
                                    <td style={{ textAlign: 'center' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                        {currentRank === 1 ? (
                                          <span style={{ fontSize: '1.2rem' }}>🥇</span>
                                        ) : currentRank === 2 ? (
                                          <span style={{ fontSize: '1.2rem' }}>🥈</span>
                                        ) : currentRank === 3 ? (
                                          <span style={{ fontSize: '1.2rem' }}>🥉</span>
                                        ) : (
                                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            #{currentRank}
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    {/* TVS Customer ID */}
                                    <td>
                                      <span className="customer-id-pill" title={`TVS Customer ID: ${d.customerId || d.externalId}`}>
                                        <span>{d.customerId || d.externalId}</span>
                                        <button
                                          type="button"
                                          className="copy-id-btn"
                                          onClick={(e) => copyCustomerId(d.customerId || d.externalId, e)}
                                          title="Copy Customer ID"
                                        >
                                          {copiedCustomerId === (d.customerId || d.externalId) ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                                          ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                      </span>
                                    </td>

                                    {/* Dealership Name (Unmasked) & External ID */}
                                    <td>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                          <span style={{
                                            fontWeight: 700,
                                            fontSize: '0.88rem',
                                            color: 'var(--text-primary)',
                                            letterSpacing: '-0.01em'
                                          }}>
                                            {d.realName || d.dealerName}
                                          </span>
                                          {currentRank <= 3 && (
                                            <span style={{
                                              fontSize: '0.62rem',
                                              fontWeight: 800,
                                              padding: '1px 6px',
                                              borderRadius: '4px',
                                              background: currentRank === 1 ? 'rgba(245, 158, 11, 0.15)' : currentRank === 2 ? 'rgba(100, 116, 139, 0.15)' : 'rgba(217, 119, 6, 0.15)',
                                              color: currentRank === 1 ? 'var(--accent-amber)' : currentRank === 2 ? 'var(--text-secondary)' : '#d97706',
                                              border: `1px solid ${currentRank === 1 ? 'rgba(245, 158, 11, 0.4)' : currentRank === 2 ? 'rgba(100, 116, 139, 0.4)' : 'rgba(217, 119, 6, 0.4)'}`
                                            }}>
                                              {currentRank === 1 ? 'GOLD' : currentRank === 2 ? 'SILVER' : 'BRONZE'}
                                            </span>
                                          )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                                            Code: {d.externalId}
                                          </span>
                                          {d.category && <span>• {d.category}</span>}
                                        </div>
                                      </div>
                                    </td>

                                    {/* City */}
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                      {d.city || 'Tamil Nadu'}
                                    </td>

                                    {/* Telemetry / Performance Stats */}
                                    <td>
                                      {adminLeaderboardTab === 'buyers' ? (
                                        <span className="activity-telemetry-badge">
                                          <strong style={{ color: 'var(--accent-emerald)' }}>{d.buysCount || 0}</strong> Won • {d.bidsCount || 0} Bids
                                        </span>
                                      ) : adminLeaderboardTab === 'sellers' ? (
                                        <span className="activity-telemetry-badge">
                                          <strong style={{ color: 'var(--accent-amber)' }}>{d.salesCount || 0}</strong> Sold • {d.listingsCount || 0} Listed
                                        </span>
                                      ) : (
                                        <span className="activity-telemetry-badge">
                                          Role: <strong style={{ color: 'var(--text-primary)' }}>{d.role || (d.category === 'OEM Dealer' ? 'Seller' : 'Buyer')}</strong>
                                        </span>
                                      )}
                                    </td>

                                    {/* Championship Points */}
                                    <td style={{ textAlign: 'right' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                                        <span style={{
                                          fontFamily: 'var(--font-mono)',
                                          fontWeight: 800,
                                          fontSize: '0.95rem',
                                          color: adminLeaderboardTab === 'buyers' ? 'var(--accent-emerald)' : adminLeaderboardTab === 'sellers' ? 'var(--accent-amber)' : 'var(--accent-cyan)'
                                        }}>
                                          {ptsVal.toLocaleString()} PTS
                                        </span>
                                        <div style={{
                                          width: '100px',
                                          height: '4px',
                                          background: 'var(--border-subtle)',
                                          borderRadius: '2px',
                                          overflow: 'hidden'
                                        }}>
                                          <div style={{
                                            width: `${pct}%`,
                                            height: '100%',
                                            background: adminLeaderboardTab === 'buyers' ? '#10b981' : adminLeaderboardTab === 'sellers' ? '#f59e0b' : (index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : index === 2 ? '#d97706' : 'var(--accent-cyan)'),
                                            borderRadius: '2px'
                                          }} />
                                        </div>
                                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                          {adminLeaderboardTab === 'buyers' ? 'Buyer Score' : adminLeaderboardTab === 'sellers' ? 'Seller Score' : 'Total Score'}
                                        </span>
                                      </div>
                                    </td>

                                    {/* Actions */}
                                    <td style={{ textAlign: 'center' }}>
                                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                        <button
                                          className="btn btn-ghost btn-sm"
                                          style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                          onClick={() => loadDealerDetail(d.dealerId)}
                                          disabled={inspectingDealerId === d.dealerId}
                                          title="Inspect dealership profile and complete activity stream"
                                        >
                                          {inspectingDealerId === d.dealerId ? (
                                            <>
                                              <span style={{ width: '10px', height: '10px', border: '2px solid rgba(56,189,248,0.3)', borderTopColor: '#38bdf8', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
                                              <span>Loading...</span>
                                            </>
                                          ) : (
                                            'Inspect'
                                          )}
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
                                          onClick={() => setAdjustModal({ dealerId: d.dealerId, dealerName: d.realName || d.dealerName })}
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
                              <span>Open Official Leaderboard</span>
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

                        {/* ── Multi-Auction Standings Processing Ribbon (Super Cup >= Oct 15) ── */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(99, 102, 241, 0.06) 100%)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          borderRadius: '10px',
                          padding: '12px 16px',
                          marginBottom: '14px',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <Filter className="w-4 h-4 text-sky-400" />
                              <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                Multi-Auction Standings Filter
                              </span>
                              <span style={{
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '999px',
                                background: selectedAuctionIds.length > 0 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                                color: selectedAuctionIds.length > 0 ? 'var(--accent-blue)' : 'var(--text-muted)',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                              }}>
                                {selectedAuctionIds.length > 0 ? `${selectedAuctionIds.length} of ${allSuperCupAuctions.length} Auctions Processed` : 'All Super Cup Matches'}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                (Tournament start: 15-Oct-2026)
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="btn btn-xs"
                                onClick={handleSelectAllAuctions}
                                style={{
                                  background: selectedAuctionIds.length > 0 && selectedAuctionIds.length === allSuperCupAuctions.length
                                    ? 'var(--accent-blue)'
                                    : 'rgba(56, 189, 248, 0.15)',
                                  color: selectedAuctionIds.length > 0 && selectedAuctionIds.length === allSuperCupAuctions.length
                                    ? '#fff'
                                    : 'var(--accent-blue)',
                                  border: '1px solid rgba(56, 189, 248, 0.35)',
                                  fontWeight: 700,
                                  padding: '3px 8px',
                                  fontSize: '0.72rem',
                                }}
                              >
                                Select All ({allSuperCupAuctions.length})
                              </button>
                              <button
                                type="button"
                                className="btn btn-xs btn-ghost"
                                onClick={handleClearAuctionSelection}
                                style={{
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--text-muted)',
                                  padding: '3px 8px',
                                  fontSize: '0.72rem',
                                }}
                              >
                                Clear
                              </button>
                              <button
                                type="button"
                                className="btn btn-xs btn-primary"
                                onClick={() => setActiveTab('leaderboard')}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 10px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                }}
                              >
                                <Trophy className="w-3 h-3" />
                                View Processed Standings →
                              </button>
                            </div>
                          </div>

                          {/* Overall Picture Banner: Who is First and Last */}
                          {activeAdminLeaderboard.length > 0 && (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                              gap: '8px',
                              paddingTop: '8px',
                              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                            }}>
                              {/* 1st Place */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'rgba(245, 158, 11, 0.08)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                borderRadius: '6px',
                                padding: '6px 10px',
                              }}>
                                <span style={{ fontSize: '1.2rem' }}>🥇</span>
                                <div style={{ overflow: 'hidden' }}>
                                  <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--accent-gold)', textTransform: 'uppercase' }}>
                                    1st Place (Leader)
                                  </div>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                    {activeAdminLeaderboard[0]?.realName || activeAdminLeaderboard[0]?.dealerName || '—'}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {activeAdminLeaderboard[0] ? `${activeAdminLeaderboard[0].points.toLocaleString()} pts • ${activeAdminLeaderboard[0].city}` : ''}
                                  </div>
                                </div>
                              </div>

                              {/* Last Place */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '6px',
                                padding: '6px 10px',
                              }}>
                                <span style={{ fontSize: '1.1rem', color: '#f87171' }}>🔻</span>
                                <div style={{ overflow: 'hidden' }}>
                                  <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#f87171', textTransform: 'uppercase' }}>
                                    Last Place (Rank #{activeAdminLeaderboard.length})
                                  </div>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                    {activeAdminLeaderboard[activeAdminLeaderboard.length - 1]?.realName || activeAdminLeaderboard[activeAdminLeaderboard.length - 1]?.dealerName || '—'}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {activeAdminLeaderboard[activeAdminLeaderboard.length - 1] ? `${activeAdminLeaderboard[activeAdminLeaderboard.length - 1].points.toLocaleString()} pts • ${activeAdminLeaderboard[activeAdminLeaderboard.length - 1].city}` : ''}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Interactive Match Selector Cards Grid - Only LIVE or UPCOMING auctions */}
                        <div className="match-selection-grid">
                          {activeMatches.map(m => {
                            const aId = String(m.auctionId || m.id);
                            const isSelected = String(liveAuctionId) === aId;
                            const isIncluded = selectedAuctionIds.includes(aId);
                            const isLive = m.status === 'LIVE';
                            return (
                              <div 
                                key={m.id || m.auctionId}
                                className={`match-select-card ${isSelected ? 'active' : ''}`}
                                onClick={() => handleMatchSelect(m.auctionId || String(m.id))}
                                style={{
                                  borderColor: isSelected
                                    ? 'var(--accent-blue)'
                                    : isIncluded
                                    ? 'rgba(56, 189, 248, 0.65)'
                                    : 'var(--border-subtle)',
                                  background: isIncluded ? 'rgba(56, 189, 248, 0.04)' : undefined,
                                  boxShadow: isIncluded ? '0 0 10px rgba(56, 189, 248, 0.15)' : 'none',
                                }}
                              >
                                <div className="match-card-top">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span className="match-card-number">MATCH #{m.matchNumber}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleAuctionSelection(aId);
                                      }}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '2px 6px',
                                        borderRadius: '5px',
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        background: isIncluded ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                                        border: `1px solid ${isIncluded ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                                        color: isIncluded ? 'var(--accent-blue)' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                      }}
                                      title={isIncluded ? "Included in multi-auction standings (click to remove)" : "Click to include in multi-auction standings"}
                                    >
                                      <span style={{
                                        width: '11px',
                                        height: '11px',
                                        borderRadius: '2px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: isIncluded ? 'var(--accent-blue)' : 'transparent',
                                        border: `1px solid ${isIncluded ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                                        color: '#fff',
                                        fontSize: '0.55rem',
                                      }}>
                                        {isIncluded ? '✓' : ''}
                                      </span>
                                      <span>{isIncluded ? 'In Standings' : '+ Select'}</span>
                                    </button>
                                  </div>
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
                                {isIncluded && (
                                  <div style={{ 
                                    fontSize: '0.68rem', 
                                    color: 'var(--accent-blue)', 
                                    fontWeight: 700, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '4px', 
                                    marginTop: '4px' 
                                  }}>
                                    <span>✓</span>
                                    <span>INCLUDED IN MULTI-AUCTION STANDINGS</span>
                                  </div>
                                )}
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
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                              <button
                                onClick={() => setShowHistorical(!showHistorical)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '4px 2px',
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
                                  ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                  : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                }
                              </button>

                              <button
                                type="button"
                                className="btn btn-xs btn-ghost"
                                onClick={() => {
                                  const histIds = historicalMatches.map(m => String(m.auctionId || m.id));
                                  const allSelected = histIds.every(id => selectedAuctionIds.includes(id));
                                  if (allSelected) {
                                    const next = selectedAuctionIds.filter(id => !histIds.includes(id));
                                    setSelectedAuctionIds(next);
                                    loadData(true, false, undefined, next);
                                  } else {
                                    const merged = Array.from(new Set([...selectedAuctionIds, ...histIds]));
                                    setSelectedAuctionIds(merged);
                                    loadData(true, false, undefined, merged);
                                  }
                                }}
                                style={{ fontSize: '0.72rem', padding: '2px 8px', border: '1px solid var(--border-subtle)' }}
                              >
                                {historicalMatches.every(m => selectedAuctionIds.includes(String(m.auctionId || m.id)))
                                  ? 'Deselect Completed'
                                  : 'Select All Completed'
                                }
                              </button>
                            </div>

                            {showHistorical && (
                              <div className="match-selection-grid" style={{ marginTop: '8px' }}>
                                {historicalMatches.map(m => {
                                  const aId = String(m.auctionId || m.id);
                                  const isSelected = String(liveAuctionId) === aId;
                                  const isIncluded = selectedAuctionIds.includes(aId);
                                  return (
                                    <div
                                      key={m.id || m.auctionId}
                                      className={`match-select-card ${isSelected ? 'active' : ''}`}
                                      onClick={() => handleMatchSelect(m.auctionId || String(m.id))}
                                      style={{
                                        opacity: isSelected ? 1 : 0.9,
                                        borderColor: isSelected
                                          ? 'var(--accent-blue)'
                                          : isIncluded
                                          ? 'rgba(56, 189, 248, 0.65)'
                                          : 'var(--border-subtle)',
                                        background: isIncluded ? 'rgba(56, 189, 248, 0.04)' : undefined,
                                        boxShadow: isIncluded ? '0 0 10px rgba(56, 189, 248, 0.15)' : 'none',
                                      }}
                                    >
                                      <div className="match-card-top">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span className="match-card-number">MATCH #{m.matchNumber}</span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleToggleAuctionSelection(aId);
                                            }}
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              padding: '2px 6px',
                                              borderRadius: '5px',
                                              fontSize: '0.65rem',
                                              fontWeight: 700,
                                              background: isIncluded ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                                              border: `1px solid ${isIncluded ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                                              color: isIncluded ? 'var(--accent-blue)' : 'var(--text-muted)',
                                              cursor: 'pointer',
                                            }}
                                            title={isIncluded ? "Included in multi-auction standings (click to remove)" : "Click to include in multi-auction standings"}
                                          >
                                            <span style={{
                                              width: '11px',
                                              height: '11px',
                                              borderRadius: '2px',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              background: isIncluded ? 'var(--accent-blue)' : 'transparent',
                                              border: `1px solid ${isIncluded ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                                              color: '#fff',
                                              fontSize: '0.55rem',
                                            }}>
                                              {isIncluded ? '✓' : ''}
                                            </span>
                                            <span>{isIncluded ? 'In Standings' : '+ Select'}</span>
                                          </button>
                                        </div>
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
                                          {formatDateDDMMYYYY(m.date)}
                                        </span>
                                      </div>
                                      {isIncluded && (
                                        <div style={{ 
                                          fontSize: '0.68rem', 
                                          color: 'var(--accent-blue)', 
                                          fontWeight: 700, 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          gap: '4px', 
                                          marginTop: '4px' 
                                        }}>
                                          <span>✓</span>
                                          <span>INCLUDED IN MULTI-AUCTION STANDINGS</span>
                                        </div>
                                      )}
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
                              placeholder="Enter custom Auction ID (e.g. 2060, 2038)..."
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
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ height: '34px', padding: '0 12px', border: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}
                              onClick={() => {
                                const clean = customAuctionInput.trim();
                                if (!clean) return;
                                if (!selectedAuctionIds.includes(clean)) {
                                  const next = [...selectedAuctionIds, clean];
                                  setSelectedAuctionIds(next);
                                  loadData(true, false, undefined, next);
                                }
                                setCustomAuctionInput('');
                                showToast(`Added Auction #${clean} to Standings calculation`);
                              }}
                            >
                              + Add to Standings
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
                        <span className="admin-stat-label">Live Bids Placed (+1)</span>
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
                        <span className="admin-stat-label">Room Attendees (+1)</span>
                        <div className="admin-stat-val" style={{ color: 'var(--accent-gold)' }}>
                          {liveStats?.totalParticipation ?? 0}
                        </div>
                      </div>
                      <div className="admin-stat-card">
                        <span className="admin-stat-label">Vehicles Listed (+5)</span>
                        <div className="admin-stat-val" style={{ color: 'var(--accent-cyan)' }}>
                          {liveStats?.totalListings ?? 0}
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
                                  className="btn btn-sm"
                                  onClick={() => triggerExportDownload('auctionLeaderboard', 'xlsx', liveAuctionId)}
                                  title="Export full multi-sheet audit Excel workbook with leaderboard and point calculations"
                                  style={{
                                    gap: '6px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    borderColor: '#10b981',
                                    color: '#ffffff',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                                  }}
                                >
                                  <FileSpreadsheet className="w-4 h-4" />
                                  <span>Export Standings (.xlsx)</span>
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => setExportModalOpen(true)}
                                  style={{ gap: '6px', border: '1px solid var(--border-subtle)' }}
                                >
                                  <Download className="w-4 h-4 text-sky-400" />
                                  <span>Export Reports</span>
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
                              <th>Buyer Name</th>
                              <th>Seller Name</th>
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
                                <td 
                                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}
                                  title={formatDateTimeDDMMYYYY(act.timestamp)}
                                >
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginRight: '6px' }}>
                                    {formatDateDDMMYYYY(act.timestamp)}
                                  </span>
                                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {formatTimeIST(act.timestamp)}
                                  </span>
                                </td>
                                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {act.dealerName}
                                </td>
                                <td style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {act.buyerName || (act.activityType === 'BUY' || act.activityType === 'BID_PLACED' ? act.dealerName : '—')}
                                </td>
                                <td style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {act.sellerName || (act.activityType === 'SELL' || act.activityType === 'SELL_LISTING' ? act.dealerName : (act.metadata?.sellerName || act.metadata?.customerName || '—'))}
                                </td>
                                <td style={{ fontSize: '0.8rem' }}>
                                  <span style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{act.externalDealerId}</span>
                                  <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>• {act.city}</span>
                                </td>
                                <td>
                                  <span className={`badge ${
                                    act.activityType === 'BUY' ? 'badge-success' :
                                    act.activityType === 'SELL' ? 'badge-info' :
                                    act.activityType === 'SELL_LISTING' ? 'badge-primary' :
                                    act.activityType === 'SELL_COMMISSION' ? 'badge-warning' :
                                    act.activityType === 'MATCH_PARTICIPATION' ? 'badge-lime' :
                                    act.activityType === 'BID_PLACED' ? 'badge-primary' :
                                    'badge-warning'
                                  }`}>
                                    {act.activityType === 'BUY' ? '🏆 WON LOT (CONVERSION)' :
                                     act.activityType === 'SELL' ? '💰 SOLD (CONVERSION)' :
                                     act.activityType === 'SELL_LISTING' ? '📋 VEHICLE LISTED' :
                                     act.activityType === 'SELL_COMMISSION' ? '💵 COMMISSION' :
                                     act.activityType === 'BID_PLACED' ? '🔨 BID PLACED' :
                                     act.activityType === 'MATCH_PARTICIPATION' ? '👥 ROOM ATTENDEE' :
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
                                <td colSpan={10} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
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
                {activeTab === 'dealers' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Executive Fleet Categorization Metrics Strip */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: '14px',
                    }}>
                      <div 
                        className="card" 
                        style={{ 
                          padding: '16px 20px', 
                          borderLeft: '4px solid var(--accent-cyan)',
                          cursor: 'pointer',
                          background: fleetCategoryFilter === 'ALL' ? 'rgba(6, 214, 160, 0.08)' : 'var(--bg-card)'
                        }}
                        onClick={() => { setFleetCategoryFilter('ALL'); setFleetPage(1); }}
                      >
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {fleetBranchFilter === 'ALL' ? 'Tamil Nadu Fleet Enrolled' : `${fleetBranchFilter} Fleet Enrolled`}
                        </div>
                        <div style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>
                          {displayFleetCategoryCounts.total.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                          {fleetBranchFilter === 'ALL' ? 'TN Network (Excl. Out-of-State)' : `Regional Branch: ${fleetBranchFilter}`}
                        </div>
                      </div>

                      <div 
                        className="card" 
                        style={{ 
                          padding: '16px 20px', 
                          borderLeft: '4px solid #34d399', 
                          cursor: 'pointer',
                          background: fleetCategoryFilter === 'OEM' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card)'
                        }} 
                        onClick={() => { setFleetCategoryFilter('OEM'); setFleetPage(1); }}
                      >
                        <div style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          🏢 OEM Dealers • Sellers
                        </div>
                        <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#34d399', marginTop: '4px' }}>
                          {displayFleetCategoryCounts.oem.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Authorized Brand Dealerships
                        </div>
                      </div>

                      <div 
                        className="card" 
                        style={{ 
                          padding: '16px 20px', 
                          borderLeft: '4px solid #38bdf8', 
                          cursor: 'pointer',
                          background: fleetCategoryFilter === 'USED' ? 'rgba(56, 189, 248, 0.08)' : 'var(--bg-card)'
                        }} 
                        onClick={() => { setFleetCategoryFilter('USED'); setFleetPage(1); }}
                      >
                        <div style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          🚗 Used Car Dealers • Buyers
                        </div>
                        <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#38bdf8', marginTop: '4px' }}>
                          {displayFleetCategoryCounts.usedCar.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Multi-Brand Pre-Owned Traders
                        </div>
                      </div>

                      <div 
                        className="card" 
                        style={{ 
                          padding: '16px 20px', 
                          borderLeft: '4px solid #94a3b8', 
                          cursor: 'pointer',
                          background: fleetCategoryFilter === 'CORPORATE' ? 'rgba(148, 163, 184, 0.08)' : 'var(--bg-card)'
                        }} 
                        onClick={() => { setFleetCategoryFilter('CORPORATE'); setFleetPage(1); }}
                      >
                        <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          🏛️ Corporate / Internal
                        </div>
                        <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#cbd5e1', marginTop: '4px' }}>
                          {displayFleetCategoryCounts.corporate.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          TVS Outsource & Central Operations
                        </div>
                      </div>
                    </div>

                    {/* Main Directory Card */}
                    <div className="card">
                      <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <h3 className="card-title">
                            <Users className="w-5 h-5 text-sky-400" />
                            Dealer Fleet Directory & Role Oversight
                          </h3>
                          <p className="card-subtitle">
                            Classified directory with OEM Sellers vs Used Car Buyers, scores, and profile telemetry
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => loadFleetDealers()}
                            disabled={fleetLoading}
                            title="Reload fleet roster"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${fleetLoading ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                          </button>

                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => triggerExportDownload('dealers', 'csv')}
                            title="Export dealers CSV with Category & Primary Role"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export Fleet CSV</span>
                          </button>
                        </div>
                      </div>

                      {/* Search Bar & Category Filter Pills */}
                      <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="search-bar-wrap" style={{ padding: 0 }}>
                          <div className="search-input-box">
                            <Search className="w-4 h-4 search-icon-left" />
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Search dealer by name, external dealer code, or city..."
                              value={fleetSearchQuery}
                              onChange={e => {
                                setFleetSearchQuery(e.target.value);
                                setFleetPage(1);
                              }}
                            />
                            {fleetSearchQuery && (
                              <button
                                className="btn btn-ghost btn-xs"
                                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}
                                onClick={() => {
                                  setFleetSearchQuery('');
                                  setFleetPage(1);
                                }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Interactive Category & Activity Filter Pills */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                Category:
                              </span>
                              {[
                                { key: 'ALL', label: fleetBranchFilter === 'ALL' ? `All TN Dealers (${displayFleetCategoryCounts.total.toLocaleString()})` : `All in ${fleetBranchFilter} (${displayFleetCategoryCounts.total.toLocaleString()})` },
                                { key: 'OEM', label: `🏢 OEM Dealers / Sellers (${displayFleetCategoryCounts.oem.toLocaleString()})`, color: '#34d399' },
                                { key: 'USED', label: `🚗 Used Car Dealers / Buyers (${displayFleetCategoryCounts.usedCar.toLocaleString()})`, color: '#38bdf8' },
                                { key: 'CORPORATE', label: `🏛️ Corporate (${displayFleetCategoryCounts.corporate.toLocaleString()})`, color: '#94a3b8' },
                              ].map(pill => (
                                <button
                                  key={pill.key}
                                  className="btn btn-xs"
                                  style={{
                                    padding: '4px 12px',
                                    fontSize: '0.74rem',
                                    borderRadius: '999px',
                                    background: fleetCategoryFilter === pill.key ? (pill.color ? `${pill.color}22` : 'rgba(255,255,255,0.12)') : 'transparent',
                                    border: `1px solid ${fleetCategoryFilter === pill.key ? (pill.color || 'var(--accent-cyan)') : 'var(--border-subtle)'}`,
                                    color: fleetCategoryFilter === pill.key ? (pill.color || 'var(--accent-cyan)') : 'var(--text-secondary)',
                                    fontWeight: fleetCategoryFilter === pill.key ? 700 : 500,
                                  }}
                                  onClick={() => {
                                    setFleetCategoryFilter(pill.key);
                                    setFleetPage(1);
                                  }}
                                >
                                  {pill.label}
                                </button>
                              ))}
                            </div>

                            {/* Sort Selector */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                Sort:
                              </span>
                              <select
                                className="form-input"
                                style={{ padding: '3px 8px', fontSize: '0.75rem', width: 'auto' }}
                                value={fleetSortBy}
                                onChange={e => {
                                  setFleetSortBy(e.target.value as any);
                                  setFleetPage(1);
                                }}
                              >
                                <option value="points">Points (High to Low)</option>
                                <option value="lastLogin">Last Logged In (Recent First)</option>
                                <option value="name">Dealer Name (A-Z)</option>
                              </select>
                            </div>
                          </div>

                          {/* Login Activity Filter Pills */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '4px', borderTop: '1px dashed var(--border-hairline)' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                              Portal Activity:
                            </span>
                            {[
                              { key: 'ALL', label: 'All Activity' },
                              { key: 'ACTIVE_TODAY', label: `🟢 Active Today (${dealerLoginSummary?.activeToday ?? 0})`, color: '#34d399' },
                              { key: 'LOGGED_IN', label: `🔵 Logged In (${dealerLoginSummary?.totalDealersWithLogin ?? 0})`, color: '#38bdf8' },
                              { key: 'NEVER_LOGGED_IN', label: `⚠️ Never Logged In (${dealerLoginSummary?.neverLoggedInCount ?? (stats?.totalDealers ? stats.totalDealers - (dealerLoginSummary?.totalDealersWithLogin ?? 0) : 0)})`, color: '#fb7185' },
                            ].map(pill => (
                              <button
                                key={pill.key}
                                className="btn btn-xs"
                                style={{
                                  padding: '3px 10px',
                                  fontSize: '0.72rem',
                                  borderRadius: '999px',
                                  background: fleetActivityFilter === pill.key ? (pill.color ? `${pill.color}22` : 'rgba(255,255,255,0.12)') : 'transparent',
                                  border: `1px solid ${fleetActivityFilter === pill.key ? (pill.color || 'var(--accent-cyan)') : 'var(--border-subtle)'}`,
                                  color: fleetActivityFilter === pill.key ? (pill.color || 'var(--accent-cyan)') : 'var(--text-secondary)',
                                  fontWeight: fleetActivityFilter === pill.key ? 700 : 500,
                                }}
                                onClick={() => {
                                  setFleetActivityFilter(pill.key as any);
                                  setFleetPage(1);
                                }}
                              >
                                {pill.label}
                              </button>
                            ))}
                          </div>

                          {/* Branch Filter & Regional Scope (Tamil Nadu) */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            flexWrap: 'wrap',
                            paddingTop: '6px',
                            borderTop: '1px dashed var(--border-hairline)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 9px',
                                borderRadius: '999px',
                                background: 'rgba(6, 214, 160, 0.12)',
                                color: 'var(--accent-cyan)',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                border: '1px solid rgba(6, 214, 160, 0.3)'
                              }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-cyan)', display: 'inline-block' }} />
                                📍 TN Dealers Only
                              </span>

                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginLeft: '4px' }}>
                                Branch:
                              </span>

                              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                <MapPin className="w-3.5 h-3.5 text-sky-400" style={{ position: 'absolute', left: '8px', pointerEvents: 'none' }} />
                                <select
                                  className="form-input"
                                  style={{
                                    padding: '4px 12px 4px 26px',
                                    fontSize: '0.75rem',
                                    width: 'auto',
                                    minWidth: '220px',
                                    background: fleetBranchFilter !== 'ALL' ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-elevated, #1a2234)',
                                    borderColor: fleetBranchFilter !== 'ALL' ? '#38bdf8' : 'var(--border-subtle)',
                                    color: fleetBranchFilter !== 'ALL' ? '#38bdf8' : 'var(--text-primary)',
                                    fontWeight: 700,
                                    borderRadius: '6px'
                                  }}
                                  value={fleetBranchFilter}
                                  onChange={e => {
                                    setFleetBranchFilter(e.target.value);
                                    setFleetPage(1);
                                  }}
                                >
                                  <option value="ALL">All TN Branches ({fleetCategoryCounts.total || 1060})</option>
                                  {availableBranches.map(b => (
                                    <option key={b.name} value={b.name}>
                                      {b.name} ({b.count})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {fleetBranchFilter !== 'ALL' && (
                                <button
                                  className="btn btn-ghost btn-xs"
                                  style={{ fontSize: '0.72rem', color: '#fb7185', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                  onClick={() => {
                                    setFleetBranchFilter('ALL');
                                    setFleetPage(1);
                                  }}
                                >
                                  <span>Clear Branch ({fleetBranchFilter}) ✕</span>
                                </button>
                              )}
                            </div>

                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Showing <strong>{filteredFleetDealers.length}</strong> TN dealerships
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Directory Table */}
                      <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th style={{ width: '80px' }}>Rank</th>
                              <th>Dealer Legal Name</th>
                              <th>Category & Primary Role</th>
                              <th style={{ width: '120px' }}>Dealer Code</th>
                              <th style={{ width: '170px' }}>Branch & City (TN)</th>
                              <th style={{ width: '120px' }}>Total Points</th>
                              <th style={{ width: '160px' }}>Last Logged In</th>
                              <th style={{ width: '90px' }}>Status</th>
                              <th style={{ width: '130px' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fleetLoading && (
                              <tr>
                                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-400" />
                                  Loading fleet directory...
                                </td>
                              </tr>
                            )}
                            {!fleetLoading && filteredFleetDealers.slice((fleetPage - 1) * fleetPageSize, fleetPage * fleetPageSize).map(d => (
                              <tr key={d.id}>
                                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                                  {d.rank ? `#${d.rank}` : '-'}
                                </td>
                                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {d.displayName}
                                </td>
                                <td>
                                  {d.category === 'OEM Dealer' ? (
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '2px 8px',
                                      borderRadius: '999px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      background: 'rgba(16, 185, 129, 0.15)',
                                      color: '#34d399',
                                      border: '1px solid rgba(16, 185, 129, 0.35)',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      🏢 OEM Dealer • Seller
                                    </span>
                                  ) : d.category === 'Used Car Dealer' ? (
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '2px 8px',
                                      borderRadius: '999px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      background: 'rgba(56, 189, 248, 0.15)',
                                      color: '#38bdf8',
                                      border: '1px solid rgba(56, 189, 248, 0.35)',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      🚗 Used Car Dealer • Buyer
                                    </span>
                                  ) : (
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '2px 8px',
                                      borderRadius: '999px',
                                      fontSize: '0.72rem',
                                      fontWeight: 600,
                                      background: 'rgba(148, 163, 184, 0.15)',
                                      color: '#94a3b8',
                                      border: '1px solid rgba(148, 163, 184, 0.3)',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {d.category || 'Other'}
                                    </span>
                                  )}
                                </td>
                                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                  {d.externalId}
                                </td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      padding: '2px 7px',
                                      borderRadius: '4px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      background: 'rgba(56, 189, 248, 0.12)',
                                      color: '#38bdf8',
                                      border: '1px solid rgba(56, 189, 248, 0.25)',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      📍 {d.branch || getDealerBranch(d.city)}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', paddingLeft: '2px' }}>
                                    {d.city}
                                  </div>
                                </td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                                  {d.points ? `${d.points.toLocaleString()} PTS` : '0 PTS'}
                                </td>
                                <td>
                                  {d.lastLoginAt ? (
                                    <div>
                                      <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        color: (Date.now() - new Date(d.lastLoginAt).getTime()) < 24 * 60 * 60 * 1000 ? '#34d399' : 'var(--accent-cyan)'
                                      }}>
                                        <LogIn className="w-3.5 h-3.5" />
                                        <span>{formatTimeAgo(d.lastLoginAt)}</span>
                                      </div>
                                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        {formatDateDDMMYYYY(d.lastLoginAt)} • {d.loginCount || 1} {d.loginCount === 1 ? 'login' : 'logins'}
                                      </div>
                                    </div>
                                  ) : (
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '2px 8px',
                                      borderRadius: '999px',
                                      fontSize: '0.7rem',
                                      fontWeight: 600,
                                      background: 'rgba(244, 63, 94, 0.1)',
                                      color: '#fb7185',
                                      border: '1px solid rgba(244, 63, 94, 0.25)',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      <UserX className="w-3 h-3" /> Never Logged In
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                                    {d.status || 'ACTIVE'}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button 
                                      className="btn btn-primary btn-sm" 
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                      onClick={() => loadDealerDetail(d.id)}
                                      disabled={inspectingDealerId === d.id}
                                      title="Inspect full activity and vehicle history"
                                    >
                                      {inspectingDealerId === d.id ? (
                                        <>
                                          <span style={{ width: '10px', height: '10px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#ffffff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
                                          <span>Loading...</span>
                                        </>
                                      ) : (
                                        'Details'
                                      )}
                                    </button>
                                    <button 
                                      className="btn btn-ghost btn-sm" 
                                      onClick={() => setAdjustModal({ dealerId: d.id, dealerName: d.displayName })}
                                      title="Manually adjust points"
                                    >
                                      Adjust
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {!fleetLoading && filteredFleetDealers.length === 0 && (
                              <tr>
                                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                  No dealerships match &quot;{fleetSearchQuery}&quot; under &quot;{fleetCategoryFilter}&quot;
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Footer */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderTop: '1px solid var(--border-subtle)',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Showing <strong>{filteredFleetDealers.length === 0 ? 0 : (fleetPage - 1) * fleetPageSize + 1}</strong> to <strong>{Math.min(fleetPage * fleetPageSize, filteredFleetDealers.length)}</strong> of <strong>{filteredFleetDealers.length.toLocaleString()}</strong> dealerships
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            disabled={fleetPage <= 1}
                            onClick={() => setFleetPage(p => Math.max(1, p - 1))}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                          >
                            <ChevronLeft className="w-3.5 h-3.5" /> Previous
                          </button>

                          <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', padding: '0 8px', color: 'var(--text-primary)' }}>
                            Page {fleetPage} of {Math.max(1, Math.ceil(filteredFleetDealers.length / fleetPageSize))}
                          </span>

                          <button
                            className="btn btn-ghost btn-sm"
                            disabled={fleetPage * fleetPageSize >= filteredFleetDealers.length}
                            onClick={() => setFleetPage(p => p + 1)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                          >
                            Next <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── 3b. Dealer Login Activity & Portal Adoption Monitor Tab ──────── */}
                {activeTab === 'dealerLogins' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Executive KPI Metric Banner */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                      gap: '14px',
                    }}>
                      <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Logged In Today
                          </span>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>
                          {dealerLoginSummary?.activeToday ?? 0}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Dealers active in the last 24 hours
                        </div>
                      </div>

                      <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #38bdf8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Active This Week
                          </span>
                          <UserCheck className="w-4 h-4 text-sky-400" />
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#38bdf8', marginTop: '4px' }}>
                          {dealerLoginSummary?.activeWeek ?? 0}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Dealers active in past 7 days
                        </div>
                      </div>

                      <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #3b82f6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.74rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Live Active Sessions
                          </span>
                          <Globe className="w-4 h-4 text-blue-400" />
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#60a5fa', marginTop: '4px' }}>
                          {dealerLoginSummary?.currentlyActiveSessions ?? 0}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Currently authenticated browser tokens
                        </div>
                      </div>

                      <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #a855f7' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.74rem', color: '#c084fc', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Portal Adoption Rate
                          </span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
                            VERIFIED
                          </span>
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#c084fc', marginTop: '4px' }}>
                          {dealerLoginSummary?.adoptionRate ?? 0}%
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {dealerLoginSummary?.totalDealersWithLogin ?? 0} of {stats?.totalDealers ?? 1545} dealers logged in
                        </div>
                      </div>

                      <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #f43f5e' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.74rem', color: '#fb7185', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Dormant / Never Logged In
                          </span>
                          <UserX className="w-4 h-4 text-rose-400" />
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fb7185', marginTop: '4px' }}>
                          {dealerLoginSummary?.neverLoggedInCount ?? (stats?.totalDealers ? stats.totalDealers - (dealerLoginSummary?.totalDealersWithLogin ?? 0) : 0)}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Dealers needing onboarding outreach
                        </div>
                      </div>
                    </div>

                    {/* Main Logins Telemetry Card */}
                    <div className="card">
                      {/* Header */}
                      <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <LogIn className="w-5 h-5 text-emerald-400" />
                            <h3 className="card-title" style={{ margin: 0 }}>
                              Dealer Login & Portal Access Audit Stream
                            </h3>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              fontFamily: 'var(--font-mono)',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                            }}>
                              LIVE MONITORING
                            </span>
                          </div>
                          <p className="card-subtitle" style={{ marginTop: '4px' }}>
                            Comprehensive chronological log of every dealership authentication event, IP address, device footprint, and session lifecycle
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setLoginLogAutoRefresh(prev => !prev)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: loginLogAutoRefresh ? '#34d399' : 'var(--text-secondary)',
                              borderColor: loginLogAutoRefresh ? 'rgba(16, 185, 129, 0.4)' : 'transparent',
                            }}
                            title="Toggle 15s auto-refresh interval"
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: loginLogAutoRefresh ? '#34d399' : '#64748b' }} />
                            <span>Auto Refresh: {loginLogAutoRefresh ? 'ON (15s)' : 'OFF'}</span>
                          </button>

                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => loadDealerLogins(loginLogPage, loginLogSearch, loginLogCategory, loginLogTimeframe, loginLogSessionStatus)}
                            disabled={loginLogLoading}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            title="Refresh dealer login history"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${loginLogLoading ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                          </button>

                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => triggerExportDownload('dealerLogins', 'csv')}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            title="Export dealer login logs as CSV"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export CSV</span>
                          </button>

                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => triggerExportDownload('dealerLogins', 'xlsx')}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            title="Export dealer login logs as Excel (.xlsx)"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export Excel (.xlsx)</span>
                          </button>
                        </div>
                      </div>

                      {/* Filter Controls Row */}
                      <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="search-bar-wrap" style={{ padding: 0 }}>
                          <div className="search-input-box">
                            <Search className="w-4 h-4 search-icon-left" />
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Search by dealer name, TVS code, city, IP address, or device..."
                              value={loginLogSearch}
                              onChange={e => {
                                setLoginLogSearch(e.target.value);
                                setLoginLogPage(1);
                              }}
                            />
                            {loginLogSearch && (
                              <button
                                className="btn btn-ghost btn-xs"
                                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}
                                onClick={() => {
                                  setLoginLogSearch('');
                                  setLoginLogPage(1);
                                }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                          {/* Timeframe Filter Pills */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                              Time Window:
                            </span>
                            {[
                              { key: 'ALL', label: 'All Time' },
                              { key: 'TODAY', label: 'Today (24h)' },
                              { key: 'WEEK', label: 'Last 7 Days' },
                              { key: 'MONTH', label: 'Last 30 Days' },
                            ].map(pill => (
                              <button
                                key={pill.key}
                                className="btn btn-xs"
                                style={{
                                  padding: '3px 10px',
                                  fontSize: '0.72rem',
                                  borderRadius: '999px',
                                  background: loginLogTimeframe === pill.key ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                                  border: `1px solid ${loginLogTimeframe === pill.key ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                                  color: loginLogTimeframe === pill.key ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                                  fontWeight: loginLogTimeframe === pill.key ? 700 : 500,
                                }}
                                onClick={() => {
                                  setLoginLogTimeframe(pill.key);
                                  setLoginLogPage(1);
                                }}
                              >
                                {pill.label}
                              </button>
                            ))}
                          </div>

                          {/* Category Filter Pills */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                              Category:
                            </span>
                            {[
                              { key: 'ALL', label: 'All Categories' },
                              { key: 'OEM', label: '🏢 OEM Dealers' },
                              { key: 'USED', label: '🚗 Used Car Dealers' },
                            ].map(pill => (
                              <button
                                key={pill.key}
                                className="btn btn-xs"
                                style={{
                                  padding: '3px 10px',
                                  fontSize: '0.72rem',
                                  borderRadius: '999px',
                                  background: loginLogCategory === pill.key ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
                                  border: `1px solid ${loginLogCategory === pill.key ? '#34d399' : 'var(--border-subtle)'}`,
                                  color: loginLogCategory === pill.key ? '#34d399' : 'var(--text-secondary)',
                                  fontWeight: loginLogCategory === pill.key ? 700 : 500,
                                }}
                                onClick={() => {
                                  setLoginLogCategory(pill.key);
                                  setLoginLogPage(1);
                                }}
                              >
                                {pill.label}
                              </button>
                            ))}
                          </div>

                          {/* Session State Filter Pills */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                              Session:
                            </span>
                            {[
                              { key: 'ALL', label: 'All States' },
                              { key: 'ACTIVE', label: '🟢 Active Now' },
                              { key: 'EXPIRED', label: '⚪ Expired / Idle' },
                            ].map(pill => (
                              <button
                                key={pill.key}
                                className="btn btn-xs"
                                style={{
                                  padding: '3px 10px',
                                  fontSize: '0.72rem',
                                  borderRadius: '999px',
                                  background: loginLogSessionStatus === pill.key ? 'rgba(168, 85, 247, 0.18)' : 'transparent',
                                  border: `1px solid ${loginLogSessionStatus === pill.key ? '#c084fc' : 'var(--border-subtle)'}`,
                                  color: loginLogSessionStatus === pill.key ? '#c084fc' : 'var(--text-secondary)',
                                  fontWeight: loginLogSessionStatus === pill.key ? 700 : 500,
                                }}
                                onClick={() => {
                                  setLoginLogSessionStatus(pill.key);
                                  setLoginLogPage(1);
                                }}
                              >
                                {pill.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Logins Table */}
                      <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th style={{ width: '60px' }}>#</th>
                              <th>Dealer Legal Entity</th>
                              <th style={{ width: '130px' }}>Dealer Code</th>
                              <th style={{ width: '160px' }}>Category & Role</th>
                              <th style={{ width: '140px' }}>City / Location</th>
                              <th style={{ width: '200px' }}>Login Timestamp</th>
                              <th style={{ width: '180px' }}>Device & Client</th>
                              <th style={{ width: '140px' }}>IP Address</th>
                              <th style={{ width: '130px' }}>Session Status</th>
                              <th style={{ width: '110px' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loginLogLoading && (
                              <tr>
                                <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-400" />
                                  Loading dealer authentication logs...
                                </td>
                              </tr>
                            )}
                            {!loginLogLoading && loginLogList.length === 0 && (
                              <tr>
                                <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                  No dealer logins match the applied filters.
                                </td>
                              </tr>
                            )}
                            {!loginLogLoading && loginLogList.map((log, idx) => (
                              <tr key={log.id}>
                                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                  {(loginLogPage - 1) * loginLogPageSize + idx + 1}
                                </td>
                                <td>
                                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {log.dealerName}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>Auth: {log.loginType || 'SSO'}</span>
                                    <span>•</span>
                                    <span>ID #{log.dealerId}</span>
                                  </div>
                                </td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                  {log.dealerTvsCode || '—'}
                                </td>
                                <td>
                                  {log.dealerCategory === 'OEM Dealer' ? (
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '2px 8px',
                                      borderRadius: '999px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      background: 'rgba(16, 185, 129, 0.15)',
                                      color: '#34d399',
                                      border: '1px solid rgba(16, 185, 129, 0.35)',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      🏢 OEM Dealer
                                    </span>
                                  ) : (
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '2px 8px',
                                      borderRadius: '999px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      background: 'rgba(56, 189, 248, 0.15)',
                                      color: '#38bdf8',
                                      border: '1px solid rgba(56, 189, 248, 0.35)',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      🚗 Used Car Dealer
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                                    {log.dealerCity || 'Tamil Nadu'}
                                  </div>
                                </td>
                                <td>
                                  <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                                    {formatTimeAgo(log.loginTime)}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                    {formatDateDDMMYYYY(log.loginTime || log.loginAt)} {new Date(log.loginTime || log.loginAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                                  </div>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                                    {log.device?.toLowerCase().includes('mobile') || log.device?.toLowerCase().includes('android') || log.device?.toLowerCase().includes('iphone') ? (
                                      <Smartphone className="w-4 h-4 text-purple-400" />
                                    ) : (
                                      <Laptop className="w-4 h-4 text-sky-400" />
                                    )}
                                    <span style={{ fontWeight: 600 }}>{log.device || 'Desktop Browser'}</span>
                                  </div>
                                </td>
                                <td>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                    {log.ipAddress || '—'}
                                  </span>
                                </td>
                                <td>
                                  {log.isSessionActive ? (
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '2px 8px',
                                      borderRadius: '999px',
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      background: 'rgba(16, 185, 129, 0.15)',
                                      color: '#34d399',
                                      border: '1px solid rgba(16, 185, 129, 0.4)',
                                    }}>
                                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34d399' }} />
                                      Active Session
                                    </span>
                                  ) : (
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '2px 8px',
                                      borderRadius: '999px',
                                      fontSize: '0.7rem',
                                      fontWeight: 600,
                                      background: 'rgba(148, 163, 184, 0.12)',
                                      color: '#94a3b8',
                                      border: '1px solid rgba(148, 163, 184, 0.25)',
                                    }}>
                                      Expired / Idle
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => loadDealerDetail(log.dealerId)}
                                    style={{ fontSize: '0.75rem', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    title="Open full dealer inspector"
                                  >
                                    Inspect →
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Footer */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderTop: '1px solid var(--border-subtle)',
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}>
                        <div>
                          Showing page <strong>{loginLogPage}</strong> of <strong>{loginLogTotalPages}</strong> ({dealerLoginSummary?.totalSessions || 0} total login sessions)
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            disabled={loginLogPage <= 1}
                            onClick={() => {
                              const newPage = Math.max(1, loginLogPage - 1);
                              setLoginLogPage(newPage);
                              loadDealerLogins(newPage);
                            }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                          >
                            <ChevronLeft className="w-3.5 h-3.5" /> Previous
                          </button>

                          <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', padding: '0 8px', color: 'var(--text-primary)' }}>
                            Page {loginLogPage} of {loginLogTotalPages}
                          </span>

                          <button
                            className="btn btn-ghost btn-sm"
                            disabled={loginLogPage >= loginLogTotalPages}
                            onClick={() => {
                              const newPage = loginLogPage + 1;
                              setLoginLogPage(newPage);
                              loadDealerLogins(newPage);
                            }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                          >
                            Next <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
                                    r.activityType === 'SELL_LISTING' ? 'badge-primary' :
                                    r.activityType === 'SELL_COMMISSION' ? 'badge-warning' :
                                    r.activityType === 'MATCH_PARTICIPATION' ? 'badge-lime' :
                                    r.activityType === 'BID_PLACED' ? 'badge-primary' :
                                    'badge-warning'
                                  }`}>
                                    {r.activityType === 'BUY' ? 'BUY: CONVERSION (10)' :
                                     r.activityType === 'SELL' ? 'SELL: CONVERSION (10)' :
                                     r.activityType === 'SELL_LISTING' ? 'SELL: LISTING (1)' :
                                     r.activityType === 'SELL_COMMISSION' ? 'SELL: COMMISSION (0)' :
                                     r.activityType === 'MATCH_PARTICIPATION' ? 'PARTICIPATION (1)' :
                                     r.activityType === 'ALL_MATCHES_BONUS' ? 'BONUS: ALL MATCHES (5)' :
                                     r.activityType === 'BID_PLACED' ? 'BUY: BIDS (1)' :
                                     r.activityType.replace(/_/g, ' ')}
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
                            {formatDateDDMMYYYY(m.date)}
                          </div>
                          <div style={{ width: '100%', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>TVS AUCTION ID</span>
                            <button
                              type="button"
                              onClick={() => handleAutoDiscoverAuction(m.id)}
                              title="Query TVS Certified for live or scheduled auction"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--tvs-blue)',
                                fontSize: '0.68rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                padding: 0,
                              }}
                            >
                              ⚡ Auto-Fetch
                            </button>
                          </div>
                          <input
                            className="form-input"
                            style={{ marginTop: '5px', padding: '7px 9px', fontSize: '0.75rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                            defaultValue={m.auctionId || ''}
                            placeholder="Enter real TVS auction ID"
                            onBlur={(event) => {
                              const nextAuctionId = event.target.value.trim();
                              if (nextAuctionId && nextAuctionId !== m.auctionId) {
                                handleUpdateMatch(m.id, m.status, nextAuctionId);
                              }
                            }}
                          />

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
                                {formatDateTimeDDMMYYYY(log.createdAt)}
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

                {/* ── 8. Historical Auctions Data Extraction Tab ─────────────────── */}
                {activeTab === 'historicalAuctions' && (
                  <HistoricalAuctionsTab />
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
                {/* 1. Premier: Auction Standings, Points Calculation Breakdown & Verification */}
                <div style={{
                  padding: '18px',
                  background: 'rgba(16, 185, 129, 0.05)',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '0.96rem', color: 'var(--text-primary)', display: 'block' }}>
                            Auction #{liveAuctionId || '1991'} Standings & Points Calculation Audit
                          </strong>
                          <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>OFFICIAL AUDIT</span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Multi-sheet official spreadsheet: Standings for this auction, exact formula-based points calculation breakdown for each dealer, vehicle lot results, bid audit trail with deduplication verification, all-auctions comparison, and tournament scoring rules.
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '7px 16px', fontSize: '0.8rem', gap: '6px', border: '1px solid var(--border-subtle)' }}
                      onClick={() => triggerExportDownload('auctionLeaderboard', 'csv')}
                      title="Download verified auction standings and dealer points calculation breakdown as CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV (.csv)</span>
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '7px 18px', fontSize: '0.8rem', gap: '6px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#10b981', fontWeight: 700 }}
                      onClick={() => triggerExportDownload('auctionLeaderboard', 'xlsx')}
                      title="Download as Microsoft Excel Spreadsheet with 6 verification sheets (XLSX)"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Download Excel Workbook (.xlsx)</span>
                    </button>
                  </div>
                </div>

                {/* 2. Buyers & Sellers Ledger */}
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

                {/* 3. Dealer Standings & Performance Summary */}
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
                          Championship Cumulative Standings
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Tournament-wide standings across all match days with point calculation breakdown
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '6px 14px', fontSize: '0.78rem', gap: '6px', border: '1px solid var(--border-subtle)' }}
                      onClick={() => triggerExportDownload('auctionLeaderboard', 'csv')}
                      title="Download as Comma-Separated Values (CSV)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV (.csv)</span>
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '6px 16px', fontSize: '0.78rem', gap: '6px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', borderColor: '#0284c7' }}
                      onClick={() => triggerExportDownload('auctionLeaderboard', 'xlsx')}
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
                      selectedActivity.activityType === 'SELL_LISTING' ? 'badge-primary' :
                      selectedActivity.activityType === 'SELL_COMMISSION' ? 'badge-warning' :
                      selectedActivity.activityType === 'MATCH_PARTICIPATION' ? 'badge-lime' :
                      selectedActivity.activityType === 'BID_PLACED' ? 'badge-primary' :
                      'badge-warning'
                    }`} style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                      {selectedActivity.activityType === 'BUY' ? '🏆 WON LOT (CONVERSION)' :
                       selectedActivity.activityType === 'SELL' ? '💰 SOLD (CONVERSION)' :
                       selectedActivity.activityType === 'SELL_LISTING' ? '📋 VEHICLE LISTED' :
                       selectedActivity.activityType === 'SELL_COMMISSION' ? '💵 COMMISSION SETTLED' :
                       selectedActivity.activityType === 'BID_PLACED' ? '🔨 BID PLACED' :
                       selectedActivity.activityType === 'MATCH_PARTICIPATION' ? '👥 ROOM ATTENDEE' :
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
                    Captured at {formatDateTimeDDMMYYYY(selectedActivity.timestamp)}
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
                    {(selectedActivity.buyerName || selectedActivity.sellerName) && (
                      <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.78rem' }}>
                        {selectedActivity.buyerName && selectedActivity.buyerName !== '—' && (
                          <span><strong style={{ color: 'var(--text-muted)' }}>Buyer:</strong> <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedActivity.buyerName}</span></span>
                        )}
                        {selectedActivity.sellerName && selectedActivity.sellerName !== '—' && (
                          <span><strong style={{ color: 'var(--text-muted)' }}>Seller:</strong> <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedActivity.sellerName}</span></span>
                        )}
                      </div>
                    )}
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

      {/* ── Dealership Telemetry & Profile Inspector Modal ── */}
      {selectedDealer && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedDealer(null)}
          style={{
            zIndex: 1000,
            padding: '16px',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            background: 'rgba(0, 0, 0, 0.78)',
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
              maxWidth: '920px',
              width: '100%',
              maxHeight: '94vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '6px',
              boxShadow: '0 24px 64px -8px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(56, 189, 248, 0.25)',
            }}
          >
            <div
              className="inner-bezel-core"
              style={{
                padding: '24px',
                overflowY: 'auto',
                maxHeight: 'calc(94vh - 16px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span className="pulsing-radar-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                      DEALERSHIP TELEMETRY & AUDIT INSPECTOR
                    </span>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                      AUDIT VERIFIED
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {selectedDealer.displayName}
                    </h2>
                    {(() => {
                      const sRank = selectedDealer.scores[0]?.sellerRank;
                      const bRank = selectedDealer.scores[0]?.buyerRank;
                      const oRank = selectedDealer.scores[0]?.rank ?? 999;
                      if (sRank && sRank <= 3) {
                        return (
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: sRank === 1 ? 'rgba(245, 158, 11, 0.25)' : sRank === 2 ? 'rgba(148, 163, 184, 0.25)' : 'rgba(217, 119, 6, 0.25)',
                            color: sRank === 1 ? '#fbbf24' : sRank === 2 ? '#cbd5e1' : '#f59e0b',
                            border: `1px solid ${sRank === 1 ? '#f59e0b' : sRank === 2 ? '#94a3b8' : '#d97706'}`,
                          }}>
                            {sRank === 1 ? '🏆 #1 SELLER GOLD PODIUM' : sRank === 2 ? '🥈 #2 SELLER SILVER PODIUM' : '🥉 #3 SELLER BRONZE PODIUM'}
                          </span>
                        );
                      }
                      if (bRank && bRank <= 3) {
                        return (
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: bRank === 1 ? 'rgba(245, 158, 11, 0.25)' : bRank === 2 ? 'rgba(148, 163, 184, 0.25)' : 'rgba(217, 119, 6, 0.25)',
                            color: bRank === 1 ? '#fbbf24' : bRank === 2 ? '#cbd5e1' : '#f59e0b',
                            border: `1px solid ${bRank === 1 ? '#f59e0b' : bRank === 2 ? '#94a3b8' : '#d97706'}`,
                          }}>
                            {bRank === 1 ? '🏆 #1 BUYER GOLD PODIUM' : bRank === 2 ? '🥈 #2 BUYER SILVER PODIUM' : '🥉 #3 BUYER BRONZE PODIUM'}
                          </span>
                        );
                      }
                      if (oRank <= 3) {
                        return (
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: oRank === 1 ? 'rgba(245, 158, 11, 0.25)' : oRank === 2 ? 'rgba(148, 163, 184, 0.25)' : 'rgba(217, 119, 6, 0.25)',
                            color: oRank === 1 ? '#fbbf24' : oRank === 2 ? '#cbd5e1' : '#f59e0b',
                            border: `1px solid ${oRank === 1 ? '#f59e0b' : oRank === 2 ? '#94a3b8' : '#d97706'}`,
                          }}>
                            {oRank === 1 ? '🏆 GOLD PODIUM #1' : oRank === 2 ? '🥈 SILVER PODIUM #2' : '🥉 BRONZE PODIUM #3'}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Metadata Chips Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 10px',
                      borderRadius: '8px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: 'var(--accent-cyan)',
                      fontSize: '0.78rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                    }}>
                      <span>ID: {selectedDealer.customerId || selectedDealer.externalDealerId}</span>
                      <button
                        type="button"
                        className="copy-id-btn"
                        onClick={(e) => copyCustomerId(selectedDealer.customerId || selectedDealer.externalDealerId, e)}
                        title="Copy Customer ID"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        {copiedCustomerId === (selectedDealer.customerId || selectedDealer.externalDealerId) ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
                        )}
                      </button>
                    </span>

                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      Code: {selectedDealer.externalDealerId}
                    </span>

                    {selectedDealer.category === 'OEM Dealer' ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 10px',
                        borderRadius: '8px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        fontSize: '0.76rem',
                        fontWeight: 700
                      }}>
                        🏢 OEM Dealer • Seller Role
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 10px',
                        borderRadius: '8px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        fontSize: '0.76rem',
                        fontWeight: 700
                      }}>
                        🚗 Used Car Dealer • Buyer Role
                      </span>
                    )}

                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.78rem',
                    }}>
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      {selectedDealer.city || 'Tamil Nadu'}
                    </span>

                    {selectedDealer.phone && (
                      <a
                        href={`tel:${selectedDealer.phone}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 10px',
                          borderRadius: '8px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          color: '#34d399',
                          fontSize: '0.78rem',
                          textDecoration: 'none',
                          fontWeight: 600
                        }}
                        title="Click to dial"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{selectedDealer.phone}</span>
                      </a>
                    )}

                    {selectedDealer.contactName && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 10px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.78rem',
                      }}>
                        <Users className="w-3.5 h-3.5 text-purple-400" />
                        {selectedDealer.contactName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Close Button */}
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSelectedDealer(null)}
                  style={{
                    padding: '8px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)'
                  }}
                  title="Close Inspector (Esc)"
                >
                  <X className="w-5 h-5 hover:text-white" />
                </button>
              </div>

              {/* Bento Metrics Strip */}
              <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
                <div className="admin-stat-card" style={{ padding: '14px 16px', borderLeft: '4px solid var(--accent-gold)' }}>
                  <span className="admin-stat-label">Overall Rank</span>
                  <div className="admin-stat-val" style={{ color: 'var(--accent-gold)', fontSize: '1.6rem' }}>
                    #{selectedDealer.scores[0]?.overallRank || selectedDealer.scores[0]?.rank || '-'}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {selectedDealer.scores[0]?.sellerRank ? `Seller Rank: #${selectedDealer.scores[0].sellerRank}` : selectedDealer.scores[0]?.buyerRank ? `Buyer Rank: #${selectedDealer.scores[0].buyerRank}` : 'Official Standings'}
                  </span>
                </div>

                <div className="admin-stat-card" style={{ padding: '14px 16px', borderLeft: '4px solid var(--accent-cyan)' }}>
                  <span className="admin-stat-label">Total Verified Points</span>
                  <div className="admin-stat-val" style={{ color: 'var(--accent-cyan)', fontSize: '1.6rem' }}>
                    {(selectedDealer.scores[0]?.totalPoints || 0).toLocaleString()} PTS
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Accumulated Score</span>
                </div>

                <div className="admin-stat-card" style={{ padding: '14px 16px', borderLeft: '4px solid #38bdf8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="admin-stat-label">Buyer Telemetry</span>
                    {selectedDealer.scores[0]?.buyerRank ? (
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                        Rank #{selectedDealer.scores[0].buyerRank}
                      </span>
                    ) : null}
                  </div>
                  <div className="admin-stat-val" style={{ color: '#38bdf8', fontSize: '1.25rem' }}>
                    {selectedDealer.scores[0]?.buysCount || 0} Won • {selectedDealer.scores[0]?.bidsCount || 0} Bids
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Buyer Score: <strong>{selectedDealer.scores[0]?.buyerPoints ?? 0} PTS</strong>
                  </span>
                </div>

                <div className="admin-stat-card" style={{ padding: '14px 16px', borderLeft: '4px solid #34d399' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="admin-stat-label">Seller Telemetry</span>
                    {selectedDealer.scores[0]?.sellerRank ? (
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399' }}>
                        Rank #{selectedDealer.scores[0].sellerRank}
                      </span>
                    ) : null}
                  </div>
                  <div className="admin-stat-val" style={{ color: '#34d399', fontSize: '1.25rem' }}>
                    {selectedDealer.scores[0]?.salesCount || 0} Sold • {selectedDealer.scores[0]?.listingsCount || 0} Listed
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Seller Score: <strong>{selectedDealer.scores[0]?.sellerPoints ?? 0} PTS</strong>
                  </span>
                </div>

                <div className="admin-stat-card" style={{ padding: '14px 16px', borderLeft: '4px solid #a855f7' }}>
                  <span className="admin-stat-label">Activity Stream</span>
                  <div className="admin-stat-val" style={{ color: '#c084fc', fontSize: '1.6rem' }}>
                    {selectedDealer.activities.length}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Logged Events</span>
                </div>
              </div>

              {/* Portal Usage & Authentication Telemetry Card */}
              <div style={{
                padding: '16px 20px',
                borderRadius: '12px',
                background: selectedDealer.lastLoginAt ? 'rgba(16, 185, 129, 0.05)' : 'rgba(244, 63, 94, 0.05)',
                border: `1px solid ${selectedDealer.lastLoginAt ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LogIn className={`w-4 h-4 ${selectedDealer.lastLoginAt ? 'text-emerald-400' : 'text-rose-400'}`} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Dealer Portal Access & Login History
                    </span>
                    {selectedDealer.lastLoginAt ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.4)'
                      }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34d399' }} />
                        Active Portal User
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        background: 'rgba(244, 63, 94, 0.15)',
                        color: '#fb7185',
                        border: '1px solid rgba(244, 63, 94, 0.35)'
                      }}>
                        ⚠️ Never Logged In
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Total Logins: <strong style={{ color: 'var(--text-primary)' }}>{selectedDealer.loginCount || (selectedDealer.lastLoginAt ? 1 : 0)}</strong>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '12px',
                  borderRadius: '8px',
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Last Logged In At
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: selectedDealer.lastLoginAt ? 'var(--accent-cyan)' : '#fb7185', marginTop: '2px' }}>
                      {selectedDealer.lastLoginAt ? formatTimeAgo(selectedDealer.lastLoginAt) : 'Never'}
                    </div>
                    {selectedDealer.lastLoginAt && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        {formatDateDDMMYYYY(selectedDealer.lastLoginAt)} {new Date(selectedDealer.lastLoginAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Last Known IP Address
                    </div>
                    <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {selectedDealer.lastLoginIp || 'Not available'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Network Origin
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Active Web Session
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '2px' }}>
                      {selectedDealer.recentSessions && selectedDealer.recentSessions.some(s => s.isActive) ? (
                        <span style={{ color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
                          Online Now
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>
                          No Active Session
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Current Token State
                    </div>
                  </div>
                </div>

                {/* Recent Session List if available */}
                {selectedDealer.recentSessions && selectedDealer.recentSessions.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Recent Authentication Sessions ({selectedDealer.recentSessions.length}):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {selectedDealer.recentSessions.slice(0, 3).map((sess) => (
                        <div key={sess.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          flexWrap: 'wrap',
                          gap: '6px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {sess.device?.toLowerCase().includes('mobile') ? (
                              <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                            ) : (
                              <Laptop className="w-3.5 h-3.5 text-sky-400" />
                            )}
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sess.device || 'Browser'}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>({sess.ipAddress || '—'})</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)' }}>
                              {formatTimeAgo(sess.loginAt)} ({formatDateDDMMYYYY(sess.loginAt)})
                            </span>
                            {sess.isActive ? (
                              <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.68rem' }}>• ACTIVE</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>• Expired</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions & Filters Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Filter Activities:</span>
                  <button
                    className={`btn btn-xs ${inspectorActivityFilter === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setInspectorActivityFilter('ALL')}
                    style={{ fontSize: '0.72rem', padding: '3px 10px' }}
                  >
                    All ({selectedDealer.activities.length})
                  </button>
                  <button
                    className={`btn btn-xs ${inspectorActivityFilter === 'SELL_LISTING' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setInspectorActivityFilter('SELL_LISTING')}
                    style={{ fontSize: '0.72rem', padding: '3px 10px' }}
                  >
                    Listings (+5 PTS)
                  </button>
                  <button
                    className={`btn btn-xs ${inspectorActivityFilter === 'SELL_COMMISSION' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setInspectorActivityFilter('SELL_COMMISSION')}
                    style={{ fontSize: '0.72rem', padding: '3px 10px' }}
                  >
                    Commissions (+5 PTS)
                  </button>
                  <button
                    className={`btn btn-xs ${inspectorActivityFilter === 'BUY_BID' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setInspectorActivityFilter('BUY_BID')}
                    style={{ fontSize: '0.72rem', padding: '3px 10px' }}
                  >
                    Bids Placed (+1 PT)
                  </button>
                  <button
                    className={`btn btn-xs ${inspectorActivityFilter === 'BUY_MATCH_DAY' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setInspectorActivityFilter('BUY_MATCH_DAY')}
                    style={{ fontSize: '0.72rem', padding: '3px 10px' }}
                  >
                    Attendance (+1 PT)
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="btn btn-sm"
                    style={{
                      background: 'rgba(54, 78, 162, 0.15)',
                      color: 'var(--tvs-blue)',
                      border: '1px solid #c8d7ea',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onClick={() => setAdjustModal({ dealerId: selectedDealer.id, dealerName: selectedDealer.displayName })}
                  >
                    <span>± Adjust Points</span>
                  </button>
                </div>
              </div>

              {/* Activity Audit Trail Table */}
              <div style={{ overflowX: 'auto', maxHeight: '340px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
                <table className="admin-table" style={{ margin: 0 }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 2 }}>
                    <tr>
                      <th>Activity Type</th>
                      <th>Points</th>
                      <th>Auction / Match</th>
                      <th>Reference / Vehicle Details</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDealer.activities
                      .filter(a => {
                        if (inspectorActivityFilter === 'ALL') return true;
                        if (inspectorActivityFilter === 'SELL_LISTING') return a.activityType === 'SELL_LISTING';
                        if (inspectorActivityFilter === 'SELL_COMMISSION') return a.activityType === 'SELL_COMMISSION';
                        if (inspectorActivityFilter === 'BUY_BID') return a.activityType === 'BUY_BID' || a.activityType === 'BID_PLACED';
                        if (inspectorActivityFilter === 'BUY_MATCH_DAY') return a.activityType === 'BUY_MATCH_DAY' || a.activityType === 'MATCH_PARTICIPATION';
                        return a.activityType === inspectorActivityFilter;
                      })
                      .map(a => {
                        const meta = a.metadata || {};
                        return (
                          <tr key={a.id}>
                            <td>
                              <span className={`badge ${
                                a.activityType === 'SELL_LISTING' ? 'badge-info' :
                                a.activityType === 'SELL_COMMISSION' ? 'badge-success' :
                                a.activityType === 'BUY_BID' || a.activityType === 'BID_PLACED' ? 'badge-info' :
                                a.activityType === 'BUY_MATCH_DAY' || a.activityType === 'MATCH_PARTICIPATION' ? 'badge-lime' :
                                'badge-warning'
                              }`} style={{ fontSize: '0.72rem' }}>
                                {a.activityType.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: a.points > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                              +{a.points} PTS
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {a.match?.auctionId ? `Auction #${a.match.auctionId} (Match ${a.match.matchNumber})` : a.match ? `Match #${a.match.matchNumber}` : 'General Season'}
                            </td>
                            <td style={{ fontSize: '0.8rem' }}>
                              {meta.vehicleName ? (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <strong style={{ color: 'var(--text-primary)' }}>{meta.vehicleName}</strong>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                    {meta.fuelType ? `${meta.fuelType} • ` : ''}{meta.yearOfMfg ? `${meta.yearOfMfg} • ` : ''}Ref: {a.externalTransactionId}
                                  </span>
                                </div>
                              ) : meta.bidAmount ? (
                                <div>
                                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>₹{Number(meta.bidAmount).toLocaleString('en-IN')} Bid</span>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '6px' }}>Ref: {a.externalTransactionId}</span>
                                </div>
                              ) : (
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {a.externalTransactionId || '—'}
                                </span>
                              )}
                            </td>
                            <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                              {formatDateTimeDDMMYYYY(a.timestamp)}
                            </td>
                          </tr>
                        );
                      })}

                    {selectedDealer.activities.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                          No recorded activities for this dealership in the current campaign.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => setSelectedDealer(null)}
                >
                  Close
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
