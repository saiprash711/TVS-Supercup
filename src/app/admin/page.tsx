'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

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

  // Adjust modal state
  const [adjustModal, setAdjustModal] = useState<{ dealerId: number; dealerName: string } | null>(null);
  const [adjustPoints, setAdjustPoints] = useState('');

  // Helper: compute the next auction date label (auctions are every Thursday at 2 PM IST)
  const getNextAuctionDateLabel = () => {
    const now = new Date();
    const auctionDate = new Date(now);
    const dayOfWeek = auctionDate.getDay(); // 0=Sun, 4=Thu
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
    if (daysUntilThursday === 0) {
      // Today is Thursday — check if it's past auction time
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
    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    return auctionDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };
  const [adjustReason, setAdjustReason] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const checkAuth = useCallback(async () => {
    const res = await fetch('/api/admin/auth');
    const data = await res.json();
    setAuthenticated(data.authenticated);
    return data.authenticated;
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
      showToast('Invalid password', 'error');
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin?action=stats');
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
        setLeaderboard(data.leaderboard || []);
        setMatchDays(data.matchDays || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
    setLoading(false);
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

  const loadLiveActivities = useCallback(async (autoSync = false, filter = liveFilter, search = liveSearchQuery) => {
    setLiveLoading(true);
    try {
      const syncParam = autoSync ? '&sync=true' : '';
      const auctionParam = `&auctionId=${encodeURIComponent(liveAuctionId.trim() || '1978')}`;
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

  const loadDealerDetail = async (dealerId: number) => {
    const res = await fetch(`/api/admin?action=dealer&id=${dealerId}`);
    const data = await res.json();
    if (data.dealer) setSelectedDealer(data.dealer);
  };

  useEffect(() => {
    checkAuth().then(isAuth => {
      if (isAuth) loadData();
    });
  }, [checkAuth, loadData]);

  useEffect(() => {
    if (authenticated && activeTab === 'rules') loadRules();
    if (authenticated && activeTab === 'audit') loadAudit();
    if (authenticated && activeTab === 'liveMonitor') {
      loadLiveActivities(liveAutoRefresh, liveFilter, liveSearchQuery);
      if (liveAutoRefresh) {
        const interval = setInterval(() => loadLiveActivities(true, liveFilter, liveSearchQuery), 10000);
        return () => clearInterval(interval);
      }
    }
  }, [authenticated, activeTab, liveAutoRefresh, liveFilter, liveAuctionId, loadRules, loadAudit, loadLiveActivities]);

  const [syncing, setSyncing] = useState(false);

  const handleSyncLiveAuction = async () => {
    setSyncing(true);
    const targetId = liveAuctionId.trim() || '1978';
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'syncLiveAuction', auctionId: targetId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`⚡ Live Auction #${targetId} Synced! ${data.processed} activities processed, ${data.pointsAwarded} points awarded.`);
        loadData();
        loadLiveActivities(false);
      } else {
        showToast(data.error || 'Failed to sync live auction', 'error');
      }
    } catch {
      showToast('Failed to connect to sync service', 'error');
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
      showToast('Rankings recalculated successfully!');
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
      showToast('Points adjusted successfully!');
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
      showToast('Match updated!');
      loadData();
    }
  };

  const [exportModalOpen, setExportModalOpen] = useState(false);

  const handleExport = () => {
    setExportModalOpen(true);
  };

  const triggerCsvDownload = (type: 'dealers' | 'activities' | 'allActivities') => {
    if (type === 'allActivities') {
      window.open('/api/admin?action=export&type=activities&all=true', '_blank');
      showToast('Downloading All Live Bids & Activities Feed CSV...');
    } else if (type === 'activities') {
      window.open('/api/admin?action=export&type=activities', '_blank');
      showToast(`Downloading Auction #${liveAuctionId || '1978'} Results (Won Vehicles) CSV...`);
    } else {
      window.open('/api/admin?action=export&type=dealers', '_blank');
      showToast('Downloading Dealer Leaderboard Summary CSV...');
    }
  };

  const triggerDownloadBoth = () => {
    window.open('/api/admin?action=export&type=activities', '_blank');
    setTimeout(() => {
      window.open('/api/admin?action=export&type=dealers', '_blank');
    }, 600);
    showToast(`Downloading Auction #${liveAuctionId || '1978'} Results & Dealer Summary CSVs...`);
  };

  // ─── Login Screen ──────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="login-container">
        <div className="login-card" style={{ maxWidth: '380px' }}>
          <div className="login-header">
            <div className="login-trophy" style={{ fontSize: '2.5rem' }}>🔒</div>
            <h1 className="login-title" style={{ fontSize: '1.3rem' }}>Admin Access</h1>
            <p className="login-subtitle">Enter admin password to continue</p>
          </div>
          <div className="form-group">
            <input
              type="password"
              className="form-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleLogin}>
            Sign In
          </button>
          <div style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
            <Link href="/" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>← Back to Super Cup</Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Admin Dashboard ──────────────────────────────────────────────
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
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand">
            <span className="navbar-logo">TVS Super Cup</span>
            <span className="navbar-badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#F87171' }}>ADMIN</span>
          </div>
          <ul className="navbar-nav">
            <li><Link href="/" className="navbar-link">Dealer View</Link></li>
            <li><Link href="/leaderboard" className="navbar-link">Leaderboard</Link></li>
          </ul>
          <div className="navbar-user">
            <button className="btn btn-ghost btn-sm" onClick={() => { fetch('/api/admin/auth', { method: 'DELETE' }); setAuthenticated(false); }}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="content-wrapper">
        <div className="admin-grid">
          {/* Sidebar */}
          <aside className="admin-sidebar">
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-md)' }}>
                Navigation
              </h3>
              {([
                { key: 'overview', icon: '📊', label: 'Overview' },
                { key: 'liveMonitor', icon: '📡', label: 'Live Monitor', badge: 'LIVE' },
                { key: 'dealers', icon: '👥', label: 'Dealers' },
                { key: 'rules', icon: '⚙️', label: 'Point Rules' },
                { key: 'matches', icon: '🗓️', label: 'Match Days' },
                { key: 'audit', icon: '📋', label: 'Audit Log' },
              ] as const).map(item => (
                <div
                  key={item.key}
                  className={`admin-nav-item ${activeTab === item.key ? 'active' : ''}`}
                  onClick={() => { setActiveTab(item.key); setSelectedDealer(null); }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {'badge' in item && (
                    <span style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#EF4444',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '999px',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                    }}>
                      {item.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-md)' }}>
              <button
                className="btn btn-primary btn-sm"
                style={{
                  width: '100%',
                  marginBottom: 'var(--space-sm)',
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  color: '#fff',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                }}
                onClick={handleSyncLiveAuction}
                disabled={syncing}
              >
                {syncing ? '⏳ Syncing Auction 1978...' : '⚡ Sync 2 PM Live Auction'}
              </button>
              <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginBottom: 'var(--space-sm)' }} onClick={handleRecalculate}>
                🔄 Recalculate
              </button>
              <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={handleExport}>
                📥 Export CSV
              </button>
            </div>
          </aside>

          {/* Content */}
          <main className="admin-content">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <span>Loading...</span>
              </div>
            ) : (
              <>
                {/* ── Overview Tab ─────────────────────────────────────── */}
                {activeTab === 'overview' && stats && (
                  <>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
                      📊 Campaign Overview
                    </h2>

                    <div className="stats-grid">
                      <div className="stat-card blue animate-in">
                        <div className="stat-icon">👥</div>
                        <div className="stat-value blue">{stats.totalDealers}</div>
                        <div className="stat-label">Total Dealers</div>
                      </div>
                      <div className="stat-card lime animate-in">
                        <div className="stat-icon">✅</div>
                        <div className="stat-value lime">{stats.activeDealers}</div>
                        <div className="stat-label">Active Dealers</div>
                      </div>
                      <div className="stat-card gold animate-in">
                        <div className="stat-icon">💰</div>
                        <div className="stat-value gold">{stats.totalPoints.toLocaleString()}</div>
                        <div className="stat-label">Total Points</div>
                      </div>
                      <div className="stat-card animate-in">
                        <div className="stat-icon">🏏</div>
                        <div className="stat-value white">{stats.matchParticipation}</div>
                        <div className="stat-label">Match Participations</div>
                      </div>
                      <div className="stat-card animate-in">
                        <div className="stat-icon">🛒</div>
                        <div className="stat-value white">{stats.buyTransactions}</div>
                        <div className="stat-label">Buy Transactions</div>
                      </div>
                      <div className="stat-card animate-in">
                        <div className="stat-icon">💰</div>
                        <div className="stat-value white">{stats.sellTransactions}</div>
                        <div className="stat-label">Sell Transactions</div>
                      </div>
                    </div>

                    {/* Leaderboard */}
                    <div className="card" style={{ marginTop: 'var(--space-md)' }}>
                      <div className="card-header">
                        <h3 className="card-title">🏆 Leaderboard (Unmasked)</h3>
                        <span className="card-subtitle">{leaderboard.length} dealers</span>
                      </div>
                      <div className="search-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                          type="text"
                          className="search-input"
                          placeholder="Search dealers..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Dealer Name</th>
                            <th>ID</th>
                            <th>City</th>
                            <th>Points</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLeaderboard.slice(0, 25).map(d => (
                            <tr key={d.dealerId}>
                              <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                                {d.rank <= 3 ? ['🥇', '🥈', '🥉'][d.rank - 1] : `#${d.rank}`}
                              </td>
                              <td style={{ fontWeight: 600 }}>{d.dealerName}</td>
                              <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{d.externalId}</td>
                              <td>{d.city}</td>
                              <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--tvs-lime)' }}>{d.points}</td>
                              <td>
                                <button className="btn btn-ghost btn-sm" onClick={() => loadDealerDetail(d.dealerId)}>View</button>
                                <button className="btn btn-sm" style={{ marginLeft: '4px', background: 'rgba(0,82,204,0.1)', color: 'var(--tvs-blue-light)', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontFamily: 'var(--font-primary)', fontSize: '0.8rem', fontWeight: 600 }} onClick={() => setAdjustModal({ dealerId: d.dealerId, dealerName: d.dealerName })}>Adjust</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* ── Live Monitor Tab ─────────────────────────────────── */}
                {activeTab === 'liveMonitor' && (
                  <>
                    {/* Header Banner */}
                    <div className="card" style={{
                      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
                      borderColor: 'rgba(59, 130, 246, 0.3)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                      marginBottom: 'var(--space-lg)',
                    }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{
                              display: 'inline-block',
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              background: '#10B981',
                              boxShadow: '0 0 10px #10B981',
                            }}></span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                              Live Stream Connected to TVS Certified
                            </span>
                          </div>
                          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
                            📡 2 PM Live Auction Monitor & Interactions
                          </h2>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                            Auction <strong>#{liveStats?.auctionId || liveAuctionId}</strong> • {liveStats?.totalVehicles ?? '—'} Activities • Chennai / TN • {getNextAuctionDateLabel()} at <strong>2:00 PM IST</strong> • All captured activities stored permanently in SQLite (<code style={{ color: '#60A5FA' }}>dev.db</code>)
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auction ID:</span>
                            <input
                              type="text"
                              value={liveAuctionId}
                              onChange={(e) => setLiveAuctionId(e.target.value)}
                              style={{
                                width: '55px',
                                background: 'transparent',
                                border: 'none',
                                color: '#60A5FA',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                outline: 'none',
                              }}
                              title="TVS Certified Auction ID"
                            />
                          </div>

                          <button
                            className="btn btn-sm"
                            style={{
                              background: liveAutoRefresh ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                              color: liveAutoRefresh ? '#10B981' : 'var(--text-muted)',
                              border: `1px solid ${liveAutoRefresh ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
                            }}
                            onClick={() => setLiveAutoRefresh(!liveAutoRefresh)}
                          >
                            {liveAutoRefresh ? '🟢 Auto-Sync ON (10s)' : '⚪ Auto-Sync PAUSED'}
                          </button>

                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => loadLiveActivities(false)}
                            disabled={liveLoading}
                            style={{ border: '1px solid var(--border-subtle)' }}
                          >
                            {liveLoading ? '🔄 Fetching...' : '🔄 Refresh View'}
                          </button>

                          <button
                            className="btn btn-primary btn-sm"
                            style={{
                              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                              color: '#fff',
                              boxShadow: '0 2px 12px rgba(37, 99, 235, 0.4)',
                              fontWeight: 700,
                            }}
                            onClick={handleSyncLiveAuction}
                            disabled={syncing}
                          >
                            {syncing ? '⏳ Syncing...' : `⚡ Sync Auction #${liveAuctionId || '1978'}`}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Metric Cards Grid */}
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', marginBottom: 'var(--space-lg)' }}>
                      <div className="stat-card blue">
                        <div className="stat-icon">🔨</div>
                        <div className="stat-value blue">{liveStats?.totalBids ?? 0}</div>
                        <div className="stat-label">Live Bids Placed (+2 pts)</div>
                      </div>

                      <div className="stat-card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                        <div className="stat-icon">🏆</div>
                        <div className="stat-value" style={{ color: '#10B981' }}>{liveStats?.totalBuys ?? 0}</div>
                        <div className="stat-label">Vehicles Won (+10 pts)</div>
                      </div>

                      <div className="stat-card" style={{ borderColor: 'rgba(139, 92, 246, 0.3)' }}>
                        <div className="stat-icon">💰</div>
                        <div className="stat-value" style={{ color: '#A78BFA' }}>{liveStats?.totalSells ?? 0}</div>
                        <div className="stat-label">Vehicles Sold (+10 pts)</div>
                      </div>

                      <div className="stat-card lime">
                        <div className="stat-icon">👥</div>
                        <div className="stat-value lime">{liveStats?.totalParticipation ?? 0}</div>
                        <div className="stat-label">Room Attendees (+15 pts)</div>
                      </div>

                      <div className="stat-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                        <div className="stat-icon">🔍</div>
                        <div className="stat-value" style={{ color: '#FBBF24' }}>
                          {(liveStats?.totalInspections ?? 0) + (liveStats?.totalWatchlist ?? 0)}
                        </div>
                        <div className="stat-label">Inspections & Watch (+1 pt)</div>
                      </div>

                      <div className="stat-card" style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
                        <div className="stat-icon">💾</div>
                        <div className="stat-value white">{liveStats?.totalActivities ?? 0}</div>
                        <div className="stat-label">Total Stored Records</div>
                      </div>
                    </div>

                    {/* Filter Pills & Search */}
                    <div className="card" style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-md)' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {[
                            { key: 'ALL', label: 'All Activities' },
                            { key: 'BID_PLACED', label: '🔨 Bids' },
                            { key: 'BUY', label: '🏆 Buys' },
                            { key: 'SELL', label: '💰 Sells' },
                            { key: 'MATCH_PARTICIPATION', label: '👥 Attendees' },
                            { key: 'VEHICLE_INSPECTED', label: '🔍 Inspections' },
                            { key: 'WATCHLIST_ADD', label: '⭐ Watchlist' },
                          ].map(pill => (
                            <button
                              key={pill.key}
                              className={`btn btn-sm ${liveFilter === pill.key ? 'btn-primary' : 'btn-ghost'}`}
                              style={{
                                fontSize: '0.8rem',
                                padding: '4px 10px',
                                ...(liveFilter !== pill.key ? { border: '1px solid var(--border-subtle)' } : {}),
                              }}
                              onClick={() => {
                                setLiveFilter(pill.key);
                                loadLiveActivities(false, pill.key, liveSearchQuery);
                              }}
                            >
                              {pill.label}
                            </button>
                          ))}
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', flex: '1 1 300px', maxWidth: '520px', justifyContent: 'flex-end' }}>
                          <div className="search-wrapper" style={{ margin: 0, minWidth: '200px', flex: '1 1 200px' }}>
                            <span className="search-icon">🔍</span>
                            <input
                              type="text"
                              className="search-input"
                              placeholder="Search dealer, vehicle, reg no..."
                              value={liveSearchQuery}
                              onChange={e => setLiveSearchQuery(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  loadLiveActivities(false, liveFilter, liveSearchQuery);
                                }
                              }}
                            />
                          </div>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ border: '1px solid var(--border-subtle)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px', height: '38px', padding: '0 12px' }}
                            onClick={() => triggerCsvDownload('activities')}
                            title="Export all live auction activities to CSV"
                          >
                            📥 Export Feed CSV
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Chronological Real-Time Table */}
                    <div className="card">
                      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 className="card-title">⚡ Real-Time Auction Interaction Feed</h3>
                          <p className="card-subtitle">Showing latest live interactions captured from TVS Certified</p>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Showing {filteredLiveActivities.length} interactions
                        </span>
                      </div>

                      <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Time</th>
                              <th>Dealer Name</th>
                              <th>ID / City</th>
                              <th>Interaction</th>
                              <th>Details & Amount</th>
                              <th>Points</th>
                              <th>Persistence</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredLiveActivities.map(act => (
                                <tr key={act.id}>
                                  <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </td>
                                  <td style={{ fontWeight: 600 }}>
                                    {act.dealerName}
                                  </td>
                                  <td style={{ fontSize: '0.8rem' }}>
                                    <span style={{ color: 'var(--tvs-blue-light)' }}>{act.externalDealerId}</span>
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
                                      {act.activityType === 'BUY' ? '🏆 WON VEHICLE' :
                                       act.activityType === 'SELL' ? '💰 SOLD VEHICLE' :
                                       act.activityType === 'BID_PLACED' ? '🔨 BID PLACED' :
                                       act.activityType === 'MATCH_PARTICIPATION' ? '👥 ATTENDED ROOM' :
                                       act.activityType === 'VEHICLE_INSPECTED' ? '🔍 INSPECTION' :
                                       act.activityType === 'WATCHLIST_ADD' ? '⭐ WATCHLIST' :
                                       act.activityType.replace(/_/g, ' ')}
                                    </span>
                                  </td>
                                  <td style={{ fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                      {act.metadata?.vehicleName ? <strong>{String(act.metadata.vehicleName)}</strong> : null}
                                      {act.metadata?.regNo ? <span style={{ color: 'var(--text-muted)' }}>({String(act.metadata.regNo)})</span> : null}
                                      {act.metadata?.bidAmount ? <span style={{ color: '#60A5FA', fontWeight: 600 }}>• ₹{Number(act.metadata.bidAmount).toLocaleString('en-IN')}</span> : null}
                                      {act.metadata?.winningBid ? <span style={{ color: '#10B981', fontWeight: 600 }}>• Won: ₹{Number(act.metadata.winningBid).toLocaleString('en-IN')}</span> : null}
                                      {act.metadata?.price ? <span style={{ color: '#A78BFA', fontWeight: 600 }}>• ₹{Number(act.metadata.price).toLocaleString('en-IN')}</span> : null}
                                      {act.metadata?.depositAmount ? <span>• Deposit: ₹{Number(act.metadata.depositAmount).toLocaleString('en-IN')}</span> : null}
                                      {Boolean(act.metadata?.isLeadingBid) ? (
                                        <span style={{ padding: '1px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.18)', color: '#10B981', fontSize: '0.72rem', fontWeight: 700 }}>
                                          🏆 Leading Bid
                                        </span>
                                      ) : null}
                                      {act.metadata?.bidRank && Number(act.metadata.bidRank) > 1 ? (
                                        <span style={{ padding: '1px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', fontSize: '0.72rem' }}>
                                          Rank #{String(act.metadata.bidRank)}
                                        </span>
                                      ) : null}
                                      {Boolean(act.metadata?.isPreBid) ? (
                                        <span style={{ padding: '1px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', fontSize: '0.72rem' }}>
                                          ⚡ Pre-Bid
                                        </span>
                                      ) : null}
                                      {act.metadata?.totalBids ? (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                          ({String(act.metadata.totalBids)} bids)
                                        </span>
                                      ) : null}
                                      {act.metadata?.fuelType ? (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                          • {String(act.metadata.fuelType)} {act.metadata.yearOfMfg ? `'${String(act.metadata.yearOfMfg).slice(-2)}` : ''}
                                        </span>
                                      ) : null}
                                      {!act.metadata?.vehicleName && !act.metadata?.bidAmount && !act.metadata?.price && !act.metadata?.depositAmount && (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Live stream event captured</span>
                                      )}
                                    </div>
                                  </td>
                                  <td style={{ fontWeight: 700, color: 'var(--tvs-lime)', whiteSpace: 'nowrap' }}>
                                    +{act.points}
                                  </td>
                                  <td>
                                    <span style={{ fontSize: '0.75rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      💾 Stored in DB
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            {filteredLiveActivities.length === 0 && (
                              <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
                                  {liveLoading ? '⏳ Loading live feed...' : `No ${liveFilter !== 'ALL' ? liveFilter.replace(/_/g, ' ').toLowerCase() : 'activity'} interactions found.`}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>

                        {liveActivities.length === 0 && (
                          <div style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-md)' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-xs)' }}>📡</div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                              Live Auction Stream Ready
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto var(--space-md)' }}>
                              Next live event: <strong>{getNextAuctionDateLabel()} at 2:00 PM IST (Auction #{liveAuctionId})</strong>. Incoming bids, buyer wins, room attendees, and vehicle inspections will stream and store here in real-time.
                            </p>
                            <button className="btn btn-primary btn-sm" onClick={handleSyncLiveAuction} disabled={syncing}>
                              {syncing ? '⏳ Syncing TVS...' : '⚡ Test Live Sync Now'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* ── Dealers Tab ──────────────────────────────────────── */}
                {activeTab === 'dealers' && !selectedDealer && (
                  <>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
                      👥 Dealer Management
                    </h2>
                    <div className="card">
                      <div className="search-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                          type="text"
                          className="search-input"
                          placeholder="Search dealers..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Dealer</th>
                            <th>ID</th>
                            <th>City</th>
                            <th>Points</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLeaderboard.map(d => (
                            <tr key={d.dealerId}>
                              <td style={{ fontWeight: 700 }}>#{d.rank}</td>
                              <td style={{ fontWeight: 600 }}>{d.dealerName}</td>
                              <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{d.externalId}</td>
                              <td>{d.city}</td>
                              <td style={{ fontWeight: 700, color: 'var(--tvs-lime)' }}>{d.points}</td>
                              <td>
                                <button className="btn btn-primary btn-sm" onClick={() => loadDealerDetail(d.dealerId)}>Details</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* ── Dealer Detail View ───────────────────────────────── */}
                {activeTab === 'dealers' && selectedDealer && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDealer(null)}>← Back</button>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700 }}>
                        {selectedDealer.displayName}
                      </h2>
                      <span className="badge badge-info">{selectedDealer.externalDealerId}</span>
                    </div>

                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="stat-card">
                        <div className="stat-value lime">#{selectedDealer.scores[0]?.rank || '-'}</div>
                        <div className="stat-label">Rank</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value gold">{selectedDealer.scores[0]?.totalPoints || 0}</div>
                        <div className="stat-label">Total Points</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value white">{selectedDealer.activities.length}</div>
                        <div className="stat-label">Activities</div>
                      </div>
                    </div>

                    <div className="card" style={{ marginTop: 'var(--space-md)' }}>
                      <div className="card-header">
                        <h3 className="card-title">Activity History</h3>
                        <button className="btn btn-sm" style={{ background: 'rgba(0,82,204,0.1)', color: 'var(--tvs-blue-light)', border: 'none', cursor: 'pointer', padding: '4px 12px', borderRadius: '6px', fontFamily: 'var(--font-primary)', fontSize: '0.8rem', fontWeight: 600 }} onClick={() => setAdjustModal({ dealerId: selectedDealer.id, dealerName: selectedDealer.displayName })}>
                          ± Adjust Points
                        </button>
                      </div>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Points</th>
                            <th>Match</th>
                            <th>Transaction ID</th>
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
                              <td style={{ fontWeight: 700, color: 'var(--tvs-lime)' }}>+{a.points}</td>
                              <td>{a.match ? `Match ${a.match.matchNumber}` : '-'}</td>
                              <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.externalTransactionId}</td>
                              <td style={{ fontSize: '0.8rem' }}>{new Date(a.timestamp).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* ── Rules Tab ────────────────────────────────────────── */}
                {activeTab === 'rules' && (
                  <>
                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>
                        ⚙️ Point Rules Configuration & Customization
                      </h2>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Customize point values or toggle any activity rule ON/OFF in real time. All dealer interactions continue to be permanently captured in the database (<code style={{ color: '#60A5FA' }}>dev.db</code>) regardless of rule settings.
                      </p>
                    </div>

                    <div className="card" style={{
                      background: 'rgba(59, 130, 246, 0.05)',
                      borderColor: 'rgba(59, 130, 246, 0.25)',
                      marginBottom: 'var(--space-md)',
                      padding: 'var(--space-md)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          <strong>Flexible Point Policy:</strong> You can alter point values or disable rules at any time without code changes. Point totals automatically calculate according to active rules.
                        </span>
                      </div>
                    </div>

                    <div className="card">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Activity Type</th>
                            <th>TVS Source / Description</th>
                            <th>Points</th>
                            <th>Status</th>
                            <th>Actions</th>
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <input
                                    type="number"
                                    className="form-input"
                                    style={{ width: '70px', padding: '4px 8px' }}
                                    defaultValue={r.points}
                                    id={`rule-${r.id}`}
                                  />
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>pts</span>
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${r.active ? 'badge-success' : 'badge-error'}`}>
                                  {r.active ? '● Active' : '○ Inactive'}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button className="btn btn-primary btn-sm" onClick={() => {
                                    const input = document.getElementById(`rule-${r.id}`) as HTMLInputElement;
                                    handleUpdateRule(r.id, parseInt(input.value));
                                  }}>
                                    Save
                                  </button>
                                  <button
                                    className={`btn btn-sm ${r.active ? 'btn-ghost' : 'btn-secondary'}`}
                                    style={{
                                      border: '1px solid var(--border-subtle)',
                                      fontSize: '0.75rem',
                                    }}
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
                  </>
                )}

                {/* ── Matches Tab ──────────────────────────────────────── */}
                {activeTab === 'matches' && (
                  <>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
                      🗓️ Match Day Configuration
                    </h2>
                    <div className="match-tracker" style={{ marginBottom: 'var(--space-lg)' }}>
                      {matchDays.map(m => (
                        <div key={m.id} className="match-item" style={{ cursor: 'default' }}>
                          <div className="match-number">Match {m.matchNumber}</div>
                          <div className="match-icon" style={{ fontSize: '2rem' }}>
                            {m.status === 'COMPLETED' ? '✅' : m.status === 'LIVE' ? '🔴' : '📅'}
                          </div>
                          <div className="match-date">
                            {new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="match-date" style={{ marginTop: '4px' }}>
                            ID: {m.auctionId}
                          </div>
                          <div style={{ marginTop: 'var(--space-sm)' }}>
                            <select
                              className="form-select"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              value={m.status}
                              onChange={(e) => handleUpdateMatch(m.id, e.target.value)}
                            >
                              <option value="UPCOMING">Upcoming</option>
                              <option value="LIVE">Live</option>
                              <option value="COMPLETED">Completed</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* ── Audit Tab ────────────────────────────────────────── */}
                {activeTab === 'audit' && (
                  <>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
                      📋 Audit Log
                    </h2>
                    <div className="card">
                      {auditLog.length === 0 ? (
                        <div className="empty-state">
                          <div className="empty-state-icon">📋</div>
                          <p>No audit entries yet</p>
                        </div>
                      ) : (
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Time</th>
                              <th>Admin</th>
                              <th>Action</th>
                              <th>Target</th>
                              <th>Reason</th>
                              <th>Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {auditLog.map(log => (
                              <tr key={log.id}>
                                <td style={{ fontSize: '0.8rem' }}>{new Date(log.createdAt).toLocaleString()}</td>
                                <td>{log.adminUser}</td>
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
                                <td>{log.targetType} #{log.targetId}</td>
                                <td>{log.reason}</td>
                                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {log.details}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Adjust Points Modal */}
      {adjustModal && (
        <div className="modal-overlay" onClick={() => setAdjustModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">± Adjust Points — {adjustModal.dealerName}</h3>
            <div className="form-group">
              <label className="form-label">Points Adjustment</label>
              <input
                type="number"
                className="form-input"
                placeholder="Enter points (positive or negative)"
                value={adjustPoints}
                onChange={e => setAdjustPoints(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Reason (Required)</label>
              <textarea
                className="form-textarea"
                placeholder="Explain the reason for this adjustment..."
                value={adjustReason}
                onChange={e => setAdjustReason(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setAdjustModal(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleAdjustPoints}
                disabled={!adjustPoints || !adjustReason}
              >
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Export CSV Modal */}
      {exportModalOpen && (
        <div className="modal-overlay" onClick={() => setExportModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '640px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <div>
                <h3 className="modal-title" style={{ margin: 0, fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📥</span> Export Super Cup Data to CSV
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                  All information is formatted with UTF-8 support for Microsoft Excel & Google Sheets.
                </p>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setExportModalOpen(false)}
                style={{ fontSize: '1.2rem', padding: '4px 8px', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {/* Option 1: Auction Results (Won Vehicles) */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-sm)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🚗</span> Auction #{liveAuctionId} Results — Won Vehicles (23 Columns)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                      Official final results for TVS Certified Auction #{liveAuctionId}: all won vehicles sorted by Lot # in chronological order. Includes winning bid amounts (₹), starting bids, car specs (model, registration number, fuel, transmission, year of mfg, speedometer KM), winning dealer phone &amp; city, points awarded, and exact IST timestamps.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>145 Won Vehicles</span>
                  <span className="badge badge-lime" style={{ fontSize: '0.72rem' }}>Accurate IST Timestamps</span>
                  <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>Lot # 1–147 Order</span>
                  <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>Winning Bids (₹)</span>
                  <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>Buyer Contacts</span>
                </div>
                <div style={{ marginTop: 'var(--space-xs)' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', background: 'linear-gradient(135deg, #059669, #10B981)', fontWeight: 600 }}
                    onClick={() => {
                      triggerCsvDownload('activities');
                    }}
                  >
                    📥 Export Auction #{liveAuctionId} Results CSV
                  </button>
                </div>
              </div>

              {/* Option 2: Dealer Leaderboard */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-sm)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📊</span> Comprehensive Dealer Leaderboard (27 Columns)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                      All registered dealers with rank, points, contact mobile, city, status, and full breakdowns of live bids count, vehicles won, total purchase spend (₹), detailed won vehicle list (model &amp; reg no), sold vehicles, room attendance, inspections, and watchlist bookmarks.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>All 1,531 Dealers</span>
                  <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>Total Spend (₹)</span>
                  <span className="badge badge-lime" style={{ fontSize: '0.72rem' }}>Won Vehicle Details</span>
                  <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>Bids &amp; Points Breakdown</span>
                </div>
                <div style={{ marginTop: 'var(--space-xs)' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}
                    onClick={() => {
                      triggerCsvDownload('dealers');
                    }}
                  >
                    📥 Export Comprehensive Dealer Summary CSV
                  </button>
                </div>
              </div>

              {/* Option 3: Full Live Bids & Activities Feed */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-sm)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>⚡</span> Complete Live Bids &amp; Activities Feed (28 Columns)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                      Every individual real-time interaction captured during Auction #{liveAuctionId}: all live bids placed, pre-bids, and won vehicles with exact IST timestamps.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>1,790+ Records</span>
                  <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>All Live Bids</span>
                  <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>All Pre-Bids</span>
                </div>
                <div style={{ marginTop: 'var(--space-xs)' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ width: '100%', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}
                    onClick={() => {
                      triggerCsvDownload('allActivities');
                    }}
                  >
                    📥 Export All Live Bids &amp; Activities Feed CSV (1,790+ Rows)
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-lg)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-md)' }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ border: '1px solid var(--border-medium)', color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={triggerDownloadBoth}
              >
                <span>📦</span> Download Both Reports (2 CSVs in 1 Click)
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setExportModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
    </div>
  );
}
