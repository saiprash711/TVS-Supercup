'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Layers,
  ChevronRight,
  Zap,
  Award,
  AlertTriangle
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
  metadata: Record<string, unknown>;
  timestamp: string;
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

type Tab = 'overview' | 'liveMonitor' | 'dealers' | 'rules' | 'matches' | 'audit';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardDealer[]>([]);
  const [matchDays, setMatchDays] = useState<MatchDay[]>([]);
  const [rules, setRules] = useState<PointRuleItem[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [selectedDealer, setSelectedDealer] = useState<DealerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Live Monitor State
  const [liveActivities, setLiveActivities] = useState<LiveActivityItem[]>([]);
  const [liveStats, setLiveStats] = useState<LiveAuctionStats | null>(null);
  const [liveAutoRefresh, setLiveAutoRefresh] = useState(true);
  const [liveFilter, setLiveFilter] = useState<string>('ALL');
  const [liveSearchQuery, setLiveSearchQuery] = useState<string>('');
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveAuctionId, setLiveAuctionId] = useState('1978');
  const [customAuctionInput, setCustomAuctionInput] = useState('');
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
      const res = await fetch('/api/admin/auth');
      const data = await res.json();
      setAuthenticated(data.authenticated);
      return data.authenticated;
    } catch {
      return false;
    }
  }, []);

  const handleLogin = async () => {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (data.success) {
      setAuthenticated(true);
      loadData();
    } else {
      showToast('Invalid administrator password', 'error');
    }
  };

  const loadData = useCallback(async (keepAuctionId = false, showFullLoader = false) => {
    if (showFullLoader) setLoading(true);
    try {
      const res = await fetch('/api/admin?action=stats');
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
        setLeaderboard(data.leaderboard || []);
        const matches: MatchDay[] = data.matchDays || [];
        setMatchDays(matches);
        if (!keepAuctionId) {
          // If Match 1 (#1978) has the 1,796 records, default to it so user immediately sees populated telemetry
          const matchWithData = matches.find(m => m.auctionId === '1978') ||
                                matches.find(m => m.status === 'LIVE') ||
                                matches[0];
          if (matchWithData?.auctionId) {
            setLiveAuctionId(prev => (prev ? prev : matchWithData.auctionId!));
          }
        }
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
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
    const targetId = (overrideAuctionId !== undefined ? overrideAuctionId : liveAuctionId).trim() || '1978';
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

  const handleMatchSelect = (newAuctionId: string) => {
    const cleaned = String(newAuctionId).trim();
    if (!cleaned) return;
    setLiveAuctionId(cleaned);
    setLiveFilter('ALL'); // Reset filter to ALL so all records are visible
    setLiveSearchQuery('');
    loadLiveActivities(false, 'ALL', '', cleaned);
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
    if (authenticated && activeTab === 'rules') loadRules();
    if (authenticated && activeTab === 'audit') loadAudit();
    if (authenticated && activeTab === 'liveMonitor') {
      const currentMatch = matchDays.find(m => String(m.auctionId) === String(liveAuctionId));
      const isCompleted = currentMatch?.status === 'COMPLETED';

      loadLiveActivities(liveAutoRefresh && !isCompleted, liveFilter, liveSearchQuery, liveAuctionId);
      if (liveAutoRefresh && !isCompleted) {
        const interval = setInterval(() => {
          loadLiveActivities(true, liveFilter, liveSearchQuery, liveAuctionId);
        }, 10000);
        return () => clearInterval(interval);
      }
    }
  }, [authenticated, activeTab, liveAutoRefresh, liveFilter, liveAuctionId, matchDays, loadRules, loadAudit, loadLiveActivities]);

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

  const triggerCsvDownload = (type: 'dealers' | 'activities' | 'allActivities') => {
    if (type === 'allActivities') {
      window.open('/api/admin?action=export&type=activities&all=true', '_blank');
      showToast('Downloading All Live Bids & Activities Feed CSV...');
    } else if (type === 'activities') {
      window.open(`/api/admin?action=export&type=activities&auctionId=${encodeURIComponent(liveAuctionId || '1991')}`, '_blank');
      showToast(`Downloading Auction #${liveAuctionId || '1991'} Results CSV...`);
    } else {
      window.open('/api/admin?action=export&type=dealers', '_blank');
      showToast('Downloading Dealer Leaderboard Summary CSV...');
    }
  };

  const triggerDownloadBoth = () => {
    window.open(`/api/admin?action=export&type=activities&auctionId=${encodeURIComponent(liveAuctionId || '1991')}`, '_blank');
    setTimeout(() => {
      window.open('/api/admin?action=export&type=dealers', '_blank');
    }, 600);
    showToast(`Downloading Auction #${liveAuctionId || '1991'} Results & Dealer Summary CSVs...`);
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
                background: 'rgba(225, 29, 72, 0.15)',
                border: '1px solid rgba(225, 29, 72, 0.35)',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--tvs-red-light)',
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
              <div className="input-with-icon">
                <span className="input-icon-left">🔒</span>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter administrator password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  autoFocus
                />
              </div>
            </div>

            <button 
              className="btn btn-primary btn-lg" 
              style={{ width: '100%', marginTop: '8px' }} 
              onClick={handleLogin}
            >
              Sign In to Command Center
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
              <span className="navbar-badge" style={{ background: 'rgba(225, 29, 72, 0.2)', color: 'var(--tvs-red-light)', borderColor: 'rgba(225, 29, 72, 0.4)' }}>
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
                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--tvs-red-light)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
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
                <div className="video-scrim-bottom" style={{ height: '80px' }}></div>
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '16px',
                  right: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  zIndex: 5,
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-success">AUCTION #{liveAuctionId} ACTIVE</span>
                    <span style={{ color: 'var(--text-secondary)' }}>• {getAuctionScheduleLabel(liveAuctionId)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <span>DEALERS: <strong>{stats?.activeDealers ?? 0} ACTIVE</strong></span>
                    <span>POINTS POOL: <strong style={{ color: 'var(--accent-cyan)' }}>{stats?.totalPoints?.toLocaleString() ?? 0} PTS</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Segmented Corporate Tabs */}
          <div className="admin-tabs">
            {([
              { key: 'overview', icon: <BarChart3 className="w-4 h-4" />, label: 'Overview' },
              { key: 'liveMonitor', icon: <Radio className="w-4 h-4 text-rose-500" />, label: 'War Room (Live Monitor)' },
              { key: 'dealers', icon: <Users className="w-4 h-4" />, label: 'Dealer Fleet' },
              { key: 'rules', icon: <Settings className="w-4 h-4" />, label: 'Scoring Rules Engine' },
              { key: 'matches', icon: <Calendar className="w-4 h-4" />, label: 'Match Schedule' },
              { key: 'audit', icon: <FileText className="w-4 h-4" />, label: 'Audit Trail' },
            ] as const).map(item => (
              <button
                key={item.key}
                className={`admin-tab ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => { setActiveTab(item.key); setSelectedDealer(null); }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="admin-content">
            {loading ? (
              <div className="loading-container" style={{ padding: '60px 0' }}>
                <div className="loading-spinner"></div>
                <span style={{ fontFamily: 'var(--font-mono)' }}>FETCHING COMMAND SYSTEM DATA...</span>
              </div>
            ) : (
              <>
                {/* ── 1. Overview Tab ──────────────────────────────────────────────── */}
                {activeTab === 'overview' && stats && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* 6 Key Performance Metric Tiles */}
                    <div className="admin-stats-grid">
                      <div className="admin-stat-card">
                        <span className="admin-stat-label">Total Fleet Dealers</span>
                        <div className="admin-stat-val" style={{ color: 'var(--accent-blue)' }}>
                          {stats.totalDealers}
                        </div>
                      </div>
                      <div className="admin-stat-card">
                        <span className="admin-stat-label">Active Transacting</span>
                        <div className="admin-stat-val" style={{ color: 'var(--accent-cyan)' }}>
                          {stats.activeDealers}
                        </div>
                      </div>
                      <div className="admin-stat-card">
                        <span className="admin-stat-label">Total Accrued Points</span>
                        <div className="admin-stat-val" style={{ color: 'var(--accent-gold)' }}>
                          {stats.totalPoints.toLocaleString()}
                        </div>
                      </div>
                      <div className="admin-stat-card">
                        <span className="admin-stat-label">Room Attendances</span>
                        <div className="admin-stat-val">
                          {stats.matchParticipation}
                        </div>
                      </div>
                      <div className="admin-stat-card">
                        <span className="admin-stat-label">Vehicles Bought (BUY)</span>
                        <div className="admin-stat-val" style={{ color: 'var(--accent-blue)' }}>
                          {stats.buyTransactions}
                        </div>
                      </div>
                      <div className="admin-stat-card">
                        <span className="admin-stat-label">Vehicles Sold (SELL)</span>
                        <div className="admin-stat-val" style={{ color: 'var(--accent-cyan)' }}>
                          {stats.sellTransactions}
                        </div>
                      </div>
                    </div>

                    {/* Unmasked Leaderboard Roster */}
                    <div className="card">
                      <div className="card-header">
                        <div>
                          <h3 className="card-title">
                            <Award className="w-5 h-5 text-amber-400" />
                            Official Super Cup Leaderboard (Unmasked Fleet)
                          </h3>
                          <p className="card-subtitle">
                            Viewing verified rankings for {leaderboard.length} TVS dealerships
                          </p>
                        </div>
                      </div>

                      <div className="search-bar-wrap">
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

                      <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Rank</th>
                              <th>Dealership Name</th>
                              <th>External ID</th>
                              <th>City / Hub</th>
                              <th>Super Cup Points</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredLeaderboard.slice(0, 30).map(d => (
                              <tr key={d.dealerId}>
                                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                                  {d.rank === 1 ? '🥇 #1' :
                                   d.rank === 2 ? '🥈 #2' :
                                   d.rank === 3 ? '🥉 #3' :
                                   `#${d.rank}`}
                                </td>
                                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {d.dealerName}
                                </td>
                                <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                                  {d.externalId}
                                </td>
                                <td>{d.city}</td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>
                                  {d.points} PTS
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button 
                                      className="btn btn-ghost btn-sm" 
                                      onClick={() => loadDealerDetail(d.dealerId)}
                                    >
                                      Inspect
                                    </button>
                                    <button 
                                      className="btn btn-sm" 
                                      style={{ background: 'rgba(225, 29, 72, 0.15)', color: 'var(--tvs-red-light)', border: '1px solid rgba(225, 29, 72, 0.3)' }}
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

                        {/* Interactive Match Selector Cards Grid */}
                        <div className="match-selection-grid">
                          {/* Match 1 Card */}
                          <div 
                            className={`match-select-card ${String(liveAuctionId) === '1978' ? 'active' : ''}`}
                            onClick={() => handleMatchSelect('1978')}
                          >
                            <div className="match-card-top">
                              <span className="match-card-number">MATCH #1</span>
                              <span className="match-card-badge completed">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                1,796 Events Stored
                              </span>
                            </div>
                            <div className="match-card-title">
                              Auction #1978
                            </div>
                            <div className="match-card-metrics">
                              <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>145 Won</span> • 
                              <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>1,650 Bids</span> • 
                              <span style={{ color: 'var(--text-muted)' }}>Sep 10 Completed</span>
                            </div>
                            {String(liveAuctionId) === '1978' && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                <span className="stream-indicator" /> ACTIVE MONITORING FEED
                              </div>
                            )}
                          </div>

                          {/* Match 2 Card */}
                          <div 
                            className={`match-select-card ${String(liveAuctionId) === '1991' ? 'active' : ''}`}
                            onClick={() => handleMatchSelect('1991')}
                          >
                            <div className="match-card-top">
                              <span className="match-card-number">MATCH #2</span>
                              <span className="match-card-badge live">
                                <span className="live-ping" style={{ display: 'inline-flex' }}>
                                  <span className="ping-dot" />
                                  <span className="ping-ring" />
                                </span>
                                LIVE WAR ROOM
                              </span>
                            </div>
                            <div className="match-card-title">
                              Auction #1991
                            </div>
                            <div className="match-card-metrics">
                              <span style={{ color: 'var(--text-primary)' }}>Live Gateway</span> • 
                              <span style={{ color: 'var(--accent-gold)' }}>Sep 17 (Tomorrow 2 PM)</span>
                            </div>
                            {String(liveAuctionId) === '1991' && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--tvs-red-light)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                <span className="stream-indicator" style={{ background: 'var(--tvs-red)' }} /> ACTIVE LIVE STREAM
                              </div>
                            )}
                          </div>

                          {/* Match 3 Card */}
                          <div 
                            className={`match-select-card ${String(liveAuctionId) === 'TVSC-SEP-24' ? 'active' : ''}`}
                            onClick={() => handleMatchSelect('TVSC-SEP-24')}
                          >
                            <div className="match-card-top">
                              <span className="match-card-number">MATCH #3</span>
                              <span className="match-card-badge upcoming">
                                <Clock className="w-3 h-3 text-sky-400" />
                                UPCOMING
                              </span>
                            </div>
                            <div className="match-card-title">
                              TVSC-SEP-24
                            </div>
                            <div className="match-card-metrics">
                              <span style={{ color: 'var(--accent-blue)' }}>Next Thursday</span> • 
                              <span style={{ color: 'var(--text-muted)' }}>Sep 24 at 2:00 PM IST</span>
                            </div>
                            {String(liveAuctionId) === 'TVSC-SEP-24' && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--accent-blue)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                <span className="stream-indicator" style={{ background: 'var(--accent-blue)' }} /> ACTIVE UPCOMING PREVIEW
                              </div>
                            )}
                          </div>

                          {/* Dynamic Match Days if any extra are found */}
                          {matchDays
                            .filter(m => !['1978', '1991', 'TVSC-SEP-24'].includes(String(m.auctionId)))
                            .map(m => (
                              <div 
                                key={m.id}
                                className={`match-select-card ${String(liveAuctionId) === String(m.auctionId) ? 'active' : ''}`}
                                onClick={() => handleMatchSelect(m.auctionId || String(m.id))}
                              >
                                <div className="match-card-top">
                                  <span className="match-card-number">MATCH #{m.matchNumber}</span>
                                  <span className={`match-card-badge ${m.status.toLowerCase()}`}>
                                    {m.status}
                                  </span>
                                </div>
                                <div className="match-card-title">
                                  Auction #{m.auctionId || m.id}
                                </div>
                                <div className="match-card-metrics">
                                  <span>{new Date(m.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                                </div>
                              </div>
                            ))}
                        </div>

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
                              placeholder="Enter custom Auction ID (e.g. 1978, 1991)..."
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
                            </tr>
                          </thead>
                          <tbody>
                            {filteredLiveActivities.map(act => (
                              <tr key={act.id}>
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
                                    {act.metadata?.vehicleName ? <strong style={{ color: 'var(--text-primary)' }}>{String(act.metadata.vehicleName)}</strong> : null}
                                    {act.metadata?.regNo ? <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>({String(act.metadata.regNo)})</span> : null}
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
                                      <span style={{ padding: '1px 6px', borderRadius: '4px', background: 'rgba(225, 29, 72, 0.15)', color: '#fda4af', fontSize: '0.72rem', border: '1px solid rgba(225, 29, 72, 0.3)' }}>
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
                              </tr>
                            ))}

                            {filteredLiveActivities.length === 0 && (
                              <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '1.8rem' }}>📡</span>
                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                                      {liveLoading ? 'Fetching real-time interactions...' : `No ${liveFilter !== 'ALL' ? liveFilter.replace(/_/g, ' ').toLowerCase() : 'activity'} interactions captured for Auction #${liveAuctionId}`}
                                    </div>
                                    <p style={{ fontSize: '0.82rem', maxWidth: '480px', color: 'var(--text-secondary)', margin: '0' }}>
                                      {String(liveAuctionId) !== '1978' ? (
                                        <>Match #1 (Auction #1978) contains 1,796 verified event records. Click below to load its full telemetry feed.</>
                                      ) : (
                                        <>No interactions matched the active filter or search. Try selecting &quot;All Activities&quot; or clear the search query.</>
                                      )}
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                      {String(liveAuctionId) !== '1978' && (
                                        <button
                                          className="btn btn-primary btn-sm"
                                          onClick={() => handleMatchSelect('1978')}
                                        >
                                          <Zap className="w-3.5 h-3.5" />
                                          <span>Load Match #1 (Auction #1978 — 1,796 Events)</span>
                                        </button>
                                      )}
                                      {liveFilter !== 'ALL' && (
                                        <button
                                          className="btn btn-ghost btn-sm"
                                          onClick={() => {
                                            setLiveFilter('ALL');
                                            loadLiveActivities(false, 'ALL', liveSearchQuery, liveAuctionId);
                                          }}
                                        >
                                          Reset to All Activities
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
                              <Radio className="w-8 h-8 text-rose-500 animate-pulse" />
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

      {/* Export CSV Reports Modal */}
      {exportModalOpen && (
        <div className="modal-overlay" onClick={() => setExportModalOpen(false)}>
          <div className="modal double-bezel" onClick={e => e.stopPropagation()}>
            <div className="inner-bezel-core" style={{ padding: '28px' }}>
              <h3 className="modal-title">Export Verified Super Cup Reports</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                Download official CSV extracts for accounting, executive audits, and dealership announcements.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  className="btn btn-ghost"
                  style={{ justifyContent: 'space-between', padding: '12px 18px', border: '1px solid var(--border-subtle)' }}
                  onClick={() => triggerCsvDownload('dealers')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>Dealer Standings & Points Summary</span>
                  </div>
                  <Download className="w-4 h-4" />
                </button>

                <button
                  className="btn btn-ghost"
                  style={{ justifyContent: 'space-between', padding: '12px 18px', border: '1px solid var(--border-subtle)' }}
                  onClick={() => triggerCsvDownload('activities')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>Auction #{liveAuctionId || '1991'} Results (Won Vehicles)</span>
                  </div>
                  <Download className="w-4 h-4" />
                </button>

                <button
                  className="btn btn-ghost"
                  style={{ justifyContent: 'space-between', padding: '12px 18px', border: '1px solid var(--border-subtle)' }}
                  onClick={() => triggerCsvDownload('allActivities')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span>Full Live Activity & Bids Telemetry Log</span>
                  </div>
                  <Download className="w-4 h-4" />
                </button>

                <button
                  className="btn btn-primary"
                  style={{ marginTop: '8px' }}
                  onClick={triggerDownloadBoth}
                >
                  Download Both Summary & Auction Results
                </button>
              </div>

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button className="btn btn-ghost" onClick={() => setExportModalOpen(false)}>
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
          background: toast.type === 'error' ? 'rgba(225, 29, 72, 0.95)' : 'rgba(6, 214, 160, 0.95)',
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
