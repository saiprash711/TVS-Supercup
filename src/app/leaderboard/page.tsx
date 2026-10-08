'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import SwitchMode from '../components/watermelon/switch-mode';
import TickerMarquee from '../components/TickerMarquee';
import {
  Trophy,
  ShieldCheck,
  Radio,
  Calendar,
  Users,
  Award,
  Sparkles,
  Crown,
  Medal,
  Search,
  RefreshCw,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  ShoppingCart,
  Tag,
  Copy,
  Check,
  FileText,
  Scale,
} from 'lucide-react';
import TermsAndConditionsModal from '../components/TermsAndConditionsModal';

interface LeaderboardEntry {
  rank: number;
  dealer: string;
  dealerName?: string;
  maskedName?: string;
  realName?: string;
  isUnmasked?: boolean;
  isCurrentDealer?: boolean;
  externalId?: string;
  customerId: string;
  customerCode?: string;
  numericCustomerId?: number | null;
  city?: string;
  points: number;
  totalPoints?: number;
  buyerPoints?: number;
  sellerPoints?: number;
  role?: string;
  category?: string;
  buysCount?: number;
  bidsCount?: number;
  salesCount?: number;
  listingsCount?: number;
}

interface CampaignInfo {
  name: string;
  slug: string;
  isTestMode: boolean;
  startDate: string;
  endDate: string;
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'buyers' | 'sellers'>('buyers');
  const [buyersLeaderboard, setBuyersLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [sellersLeaderboard, setSellersLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [overallLeaderboard, setOverallLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showTerms, setShowTerms] = useState(false);
  const [counts, setCounts] = useState<{ buyers: number; sellers: number; overall: number }>({
    buyers: 0,
    sellers: 0,
    overall: 0,
  });

  const [campaign, setCampaign] = useState<CampaignInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [showMaskedPreview, setShowMaskedPreview] = useState(false);
  const [currentDealerId, setCurrentDealerId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [jumpPageInput, setJumpPageInput] = useState('');

  const fetchLeaderboard = useCallback(async (forcedMaskedPreview?: boolean) => {
    try {
      const previewActive = typeof forcedMaskedPreview === 'boolean' ? forcedMaskedPreview : showMaskedPreview;
      const url = previewActive ? '/api/leaderboard?unmask=false' : '/api/leaderboard';
      const res = await fetch(url);
      const data = await res.json();
      if (data) {
        if (Array.isArray(data.buyers)) setBuyersLeaderboard(data.buyers);
        if (Array.isArray(data.sellers)) setSellersLeaderboard(data.sellers);
        if (Array.isArray(data.overall)) setOverallLeaderboard(data.overall);
        else if (Array.isArray(data.leaderboard)) setOverallLeaderboard(data.leaderboard);

        if (data.counts) {
          setCounts(data.counts);
        } else {
          setCounts({
            buyers: data.buyers?.length || 0,
            sellers: data.sellers?.length || 0,
            overall: data.overall?.length || data.leaderboard?.length || 0,
          });
        }

        if (typeof data.isAdmin === 'boolean') {
          setIsAdminUser(data.isAdmin);
        }
        if (data.currentDealerId) {
          setCurrentDealerId(data.currentDealerId);
        }

        setCampaign(data.campaign);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, [showMaskedPreview]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await fetchLeaderboard();
      if (!mounted) return;
      try {
        const [authRes, adminRes] = await Promise.all([
          fetch('/api/auth/login'),
          fetch('/api/admin/auth'),
        ]);
        const authData = await authRes.json();
        const adminData = await adminRes.json();
        if (mounted) {
          setIsAuthenticated(Boolean(authData.authenticated));
          if (adminData.authenticated) {
            setIsAdminUser(true);
          }
        }
      } catch {}
    })();

    const interval = setInterval(() => {
      fetchLeaderboard();
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchLeaderboard]);

  const toggleMaskedPreview = () => {
    const nextVal = !showMaskedPreview;
    setShowMaskedPreview(nextVal);
    fetchLeaderboard(nextVal);
  };

  const copyCustomerId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getDisplayName = useCallback((entry: LeaderboardEntry) => {
    if (isAdminUser && !showMaskedPreview) {
      return entry.realName || entry.dealerName || entry.dealer;
    }
    if (entry.isCurrentDealer) {
      return entry.realName || entry.dealerName || entry.dealer;
    }
    return entry.maskedName || entry.dealer;
  }, [isAdminUser, showMaskedPreview]);

  const activeLeaderboard = useMemo(() => {
    if (activeTab === 'sellers') return sellersLeaderboard;
    return buyersLeaderboard;
  }, [activeTab, buyersLeaderboard, sellersLeaderboard]);

  // Filtered leaderboard based on search query (matches name, Customer ID, city, rank)
  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return activeLeaderboard;
    const q = searchQuery.trim().toLowerCase();
    const rankNum = q.startsWith('#') ? parseInt(q.slice(1), 10) : parseInt(q, 10);

    return activeLeaderboard.filter((entry) => {
      // Check rank match if exact number
      if (!isNaN(rankNum) && entry.rank === rankNum) {
        return true;
      }
      const dispName = (getDisplayName(entry) || '').toLowerCase();
      const rawDealer = (entry.realName || entry.dealer || '').toLowerCase();
      const custId = (entry.customerId || '').toLowerCase();
      const custCode = (entry.customerCode || '').toLowerCase();
      const city = (entry.city || '').toLowerCase();
      const category = (entry.category || '').toLowerCase();

      return (
        dispName.includes(q) ||
        rawDealer.includes(q) ||
        custId.includes(q) ||
        custCode.includes(q) ||
        city.includes(q) ||
        category.includes(q)
      );
    });
  }, [activeLeaderboard, searchQuery, getDisplayName]);

  // Pagination calculations
  const effectivePageSize = pageSize === 0 ? filteredLeaderboard.length : pageSize;
  const totalPages = Math.max(1, Math.ceil(filteredLeaderboard.length / (effectivePageSize || 1)));

  const paginatedEntries = useMemo(() => {
    if (pageSize === 0) return filteredLeaderboard;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredLeaderboard.slice(startIndex, startIndex + pageSize);
  }, [filteredLeaderboard, currentPage, pageSize]);

  const startRecord = filteredLeaderboard.length === 0 ? 0 : (currentPage - 1) * effectivePageSize + 1;
  const endRecord = Math.min(currentPage * effectivePageSize, filteredLeaderboard.length);

  // Smart page numbers array for pagination bar
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setJumpPageInput('');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container" style={{ minHeight: '100vh' }}>
          <div className="loading-spinner"></div>
          <span>Loading leaderboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Navigation */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand">
            <span className="navbar-logo">TVS Super Cup</span>
            <span className="navbar-badge">{campaign?.isTestMode ? 'TEST MODE' : 'LIVE'}</span>
          </div>
          <ul className="navbar-nav">
            <li><span className="navbar-link active">Leaderboard</span></li>
            {isAuthenticated && (
              <li><Link href="/dashboard" className="navbar-link">My Dashboard</Link></li>
            )}
            <li>
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="navbar-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Terms & Rules</span>
              </button>
            </li>
          </ul>
          <div className="navbar-user">
            <SwitchMode width={58} height={28} />
            {isAuthenticated ? (
              <Link href="/dashboard" className="btn btn-primary btn-sm">My Dashboard</Link>
            ) : (
              <Link href="/" className="btn btn-primary btn-sm">Sign In</Link>
            )}
          </div>
        </div>
      </nav>
      <TickerMarquee />

      <div className="content-wrapper">
        {/* Admin Mission Control Indicator Banner */}
        {isAdminUser && (
          <aside
            className="admin-leaderboard-banner"
            aria-label="Admin Visibility Notice"
            role="region"
          >
            <div className="admin-banner-left">
              <div className="admin-shield-icon">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="admin-banner-heading">
                  <span>Admin Mission Control View</span>
                  <span className="admin-status-badge">
                    {showMaskedPreview ? '🔒 MASKED PREVIEW' : '👁️ UNMASKED (FULL VISIBILITY)'}
                  </span>
                </div>
                <p className="admin-banner-sub">
                  {showMaskedPreview
                    ? 'Viewing leaderboard as participating dealers see it (competitor names masked, TVS Customer IDs visible).'
                    : 'Full legal dealership names, TVS Customer IDs, and performance telemetry are visible to Admin.'}
                </p>
              </div>
            </div>

            <div className="admin-banner-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm admin-preview-toggle-btn"
                onClick={toggleMaskedPreview}
              >
                {showMaskedPreview ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Switch to Unmasked View</span>
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    <span>Preview Dealer Masked View</span>
                  </>
                )}
              </button>
              <Link href="/admin" className="btn btn-primary btn-sm">
                Mission Control
              </Link>
            </div>
          </aside>
        )}

        {/* Championship Executive Hero Bezel */}
        <section className="leaderboard-hero-wrapper" aria-label="Dealer Super Cup Championship Header">
          <div className="leaderboard-hero-ambient" aria-hidden="true" />
          <div className="leaderboard-hero-card">
            <div className="leaderboard-hero-grid-pattern" aria-hidden="true" />
            
            <div className="leaderboard-hero-content">
              {/* Gold Trophy Crest with radiant aura */}
              <div className="leaderboard-trophy-crest" title="TVS Dealer Super Cup">
                <Trophy className="w-8 h-8 text-amber-500" />
              </div>

              {/* Status and Network Eyebrow Badges */}
              <div className="leaderboard-badge-group">
                <span className="leaderboard-badge verified">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>TVS Certified Network</span>
                </span>
                <span className="leaderboard-badge season">
                  <span className="pulsing-live-dot" />
                  <Radio className="w-3.5 h-3.5" />
                  <span>Two Leaderboards • ₹1,00,000 Cash Pool</span>
                </span>
              </div>

              {/* Clean Executive Title */}
              <h1 className="leaderboard-hero-title">
                DEALER <span className="hero-title-accent">SUPER CUP</span>
              </h1>

              {/* Informative Subtitle */}
              <p className="leaderboard-hero-subtitle">
                Official national leaderboard for verified TVS dealerships across India. Compete in weekly high-velocity auctions, climb separate Buyer and Seller standings, and track every dealer by verified TVS Customer ID.
              </p>

              {/* High-Fidelity Telemetry Chips Bar */}
              <div className="leaderboard-telemetry-strip">
                <div className="telemetry-chip">
                  <span className="telemetry-chip-icon text-sky-500">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <span className="telemetry-chip-label">Season:</span>
                  <span className="telemetry-chip-val">
                    {campaign
                      ? `${new Date(campaign.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} – ${new Date(campaign.endDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`
                      : 'Season 2026–27'}
                  </span>
                </div>

                <div className="telemetry-chip">
                  <span className="telemetry-chip-icon text-emerald-500">
                    <Users className="w-4 h-4" />
                  </span>
                  <span className="telemetry-chip-label">
                    {activeTab === 'buyers' ? 'Buyers:' : activeTab === 'sellers' ? 'Sellers:' : 'Total:'}
                  </span>
                  <span className="telemetry-chip-val">
                    {activeLeaderboard.length.toLocaleString('en-IN')} Active
                  </span>
                </div>

                <div className="telemetry-chip">
                  <span className="telemetry-chip-icon text-amber-500">
                    <Award className="w-4 h-4" />
                  </span>
                  <span className="telemetry-chip-label">Podium:</span>
                  <span className="telemetry-chip-val">
                    ₹50,000 League Pool
                  </span>
                </div>

                <div className="telemetry-chip">
                  <span className="telemetry-chip-icon text-indigo-500">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <span className="telemetry-chip-label">Scoring:</span>
                  <span className="telemetry-chip-val">Verified TVS Telemetry</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Segmented Leaderboard Tabs ─────────────────────────────────── */}
        <section aria-label="Leaderboard Category Selection" style={{ maxWidth: '920px', margin: '0 auto' }}>
          <div className="leaderboard-tabs-bar" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'buyers'}
              className={`leaderboard-tab-btn ${activeTab === 'buyers' ? 'active buyer' : ''}`}
              onClick={() => {
                setActiveTab('buyers');
                setCurrentPage(1);
              }}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Buyer Leaderboard</span>
              <span className="tab-badge">{counts.buyers || buyersLeaderboard.length}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'sellers'}
              className={`leaderboard-tab-btn ${activeTab === 'sellers' ? 'active seller' : ''}`}
              onClick={() => {
                setActiveTab('sellers');
                setCurrentPage(1);
              }}
            >
              <Tag className="w-4 h-4" />
              <span>Seller Leaderboard</span>
              <span className="tab-badge">{counts.sellers || sellersLeaderboard.length}</span>
            </button>
          </div>
        </section>

        {/* Top 3 Championship Podium (Dynamic per League) */}
        {activeLeaderboard.length > 0 && (
          <section className="podium-container" aria-label="Championship Podium">
            <div className="podium-section-header">
              <div className="podium-section-eyebrow">
                <Crown className="w-3.5 h-3.5" />
                <span>
                  {activeTab === 'buyers'
                    ? 'Top 3 Buyers Podium • ₹50,000 Cash Pool'
                    : 'Top 3 Sellers Podium • ₹50,000 Cash Pool'}
                </span>
              </div>
            </div>

            <div className="podium-grid">
              {activeLeaderboard.slice(0, 3).map((entry) => {
                const isChampion = entry.rank === 1;
                const isRunnerUp = entry.rank === 2;

                return (
                  <div
                    key={`podium-${activeTab}-${entry.rank}-${entry.dealer}`}
                    className={`podium-card rank-${entry.rank}`}
                  >
                    {/* Medal Medallion */}
                    <div className="podium-medal-badge">
                      {isChampion ? (
                        <Crown className="w-6 h-6" />
                      ) : isRunnerUp ? (
                        <Medal className="w-6 h-6" />
                      ) : (
                        <Award className="w-6 h-6" />
                      )}
                    </div>

                    <span className="podium-standing-tag">
                      {activeTab === 'buyers'
                        ? (isChampion ? 'Top Buyer • #1' : isRunnerUp ? 'Podium 2nd Buyer • #2' : 'Podium 3rd Buyer • #3')
                        : (isChampion ? 'Top Seller • #1' : isRunnerUp ? 'Podium 2nd Seller • #2' : 'Podium 3rd Seller • #3')}
                    </span>

                    <h3 className="podium-dealer-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>{getDisplayName(entry)}</span>
                      {entry.isCurrentDealer && (
                        <span className="you-pill">YOU</span>
                      )}
                    </h3>

                    {/* TVS Customer ID Badge */}
                    <div className="podium-customer-badge" title={`TVS Customer ID: ${entry.customerId}`}>
                      <span>ID:</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{entry.customerId}</span>
                      <button
                        type="button"
                        className="copy-id-btn"
                        onClick={(e) => copyCustomerId(entry.customerId, e)}
                        title="Copy Customer ID"
                      >
                        {copiedId === entry.customerId ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {/* League Specific Performance Telemetry */}
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {activeTab === 'buyers' ? (
                        <span>{entry.buysCount || 0} Lots Won • {entry.bidsCount || 0} Cars Bid</span>
                      ) : (
                        <span>{entry.salesCount || 0} Lots Sold • {entry.listingsCount || 0} Listed</span>
                      )}
                    </div>

                    <div className="podium-score-wrap">
                      <span className="podium-points-value">
                        {entry.points.toLocaleString('en-IN')}
                      </span>
                      <span className="podium-points-label">
                        {activeTab === 'buyers' ? 'Buyer Points' : 'Seller Points'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Full Leaderboard Standings Card */}
        <section className="card" aria-label="Official Dealer Rankings">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: 'var(--space-md)', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 className="card-title">
                <TrendingUp className="w-5 h-5 text-[#364ea2] dark:text-[#38bdf8]" />
                <span>
                  {activeTab === 'buyers'
                    ? 'Official Buyer Rankings'
                    : 'Official Seller Rankings'}
                </span>
              </h2>
              <p className="card-subtitle">
                {lastUpdated ? `Live synced at ${lastUpdated.toLocaleTimeString('en-IN')}` : 'Live syncing active'}
                {' '}• Automated 30-second refresh • TVS Customer ID Verified
              </p>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => fetchLeaderboard()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Standings</span>
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="leaderboard-toolbar">
            {/* Search Input Box */}
            <div className="search-input-wrapper">
              <Search className="search-icon-left w-4 h-4" />
              <input
                type="text"
                className="form-input"
                placeholder="Search dealership name, Customer ID (e.g. CUST10001255), city or rank #..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  paddingLeft: '38px',
                  paddingRight: searchQuery ? '36px' : '14px',
                  height: '42px',
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-full)',
                  width: '100%',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="clear-search-btn"
                  title="Clear search query"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Rows Per Page Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="pageSize" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                Rows per page:
              </label>
              <select
                id="pageSize"
                className="form-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
                style={{
                  height: '40px',
                  padding: '0 14px',
                  width: 'auto',
                  fontSize: '0.85rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <option value={10}>10 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
                <option value={0}>All Dealerships</option>
              </select>
            </div>

            {/* Counter Summary */}
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              {searchQuery ? (
                <span>
                  Found <strong>{filteredLeaderboard.length}</strong> matching dealerships
                </span>
              ) : (
                <span>
                  Showing <strong>{startRecord}–{endRecord}</strong> of <strong>{activeLeaderboard.length.toLocaleString('en-IN')}</strong> dealerships
                </span>
              )}
            </div>
          </div>

          {/* Table Container */}
          {paginatedEntries.length > 0 ? (
            <div className="leaderboard-table-container">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center', width: '74px' }}>Rank</th>
                    <th style={{ width: '170px' }}>Customer ID</th>
                    <th>Dealership Name</th>
                    <th style={{ width: '130px' }}>City</th>
                    <th style={{ width: '170px' }}>
                      {activeTab === 'buyers' ? 'Buyer Stats' : 'Seller Stats'}
                    </th>
                    <th style={{ textAlign: 'right', width: '130px' }}>
                      {activeTab === 'buyers' ? 'Buyer Points' : 'Seller Points'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEntries.map((entry, idx) => {
                    const isTop1 = entry.rank === 1;
                    const isTop2 = entry.rank === 2;
                    const isTop3 = entry.rank === 3;

                    return (
                      <tr
                        key={`${activeTab}-${entry.rank}-${entry.dealer}-${idx}`}
                        className={`leaderboard-row ${entry.isCurrentDealer ? 'current-dealer-row' : ''}`}
                      >
                        {/* Rank */}
                        <td style={{ textAlign: 'center' }}>
                          <span className={`rank-cell-content ${isTop1 ? 'rank-1' : isTop2 ? 'rank-2' : isTop3 ? 'rank-3' : ''}`}>
                            {entry.rank}
                          </span>
                        </td>

                        {/* Verified TVS Customer ID */}
                        <td>
                          <span className="customer-id-pill" title={`TVS Customer ID: ${entry.customerId}`}>
                            <span>{entry.customerId}</span>
                            <button
                              type="button"
                              className="copy-id-btn"
                              onClick={(e) => copyCustomerId(entry.customerId, e)}
                              title="Copy Customer ID"
                            >
                              {copiedId === entry.customerId ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </span>
                        </td>

                        {/* Dealership Name & Category */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                {getDisplayName(entry)}
                              </span>
                              {entry.isCurrentDealer && (
                                <span className="you-pill">YOU</span>
                              )}
                              {entry.rank <= 3 && (
                                <span className={`podium-standing-tag ${isTop1 ? 'rank-1' : isTop2 ? 'rank-2' : 'rank-3'}`} style={{ margin: 0, padding: '1px 7px', fontSize: '0.62rem' }}>
                                  {isTop1 ? 'CHAMPION' : isTop2 ? '2ND PODIUM' : '3RD PODIUM'}
                                </span>
                              )}
                            </div>
                            {entry.category && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {entry.category}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* City */}
                        <td>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {entry.city || 'Tamil Nadu'}
                          </span>
                        </td>

                        {/* Activity Performance */}
                        <td>
                          {activeTab === 'buyers' ? (
                            <span className="activity-telemetry-badge">
                              <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>{entry.buysCount || 0}</span> Won • {entry.bidsCount || 0} Cars Bid
                            </span>
                          ) : (
                            <span className="activity-telemetry-badge">
                              <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>{entry.salesCount || 0}</span> Sold • {entry.listingsCount || 0} Listed
                            </span>
                          )}
                        </td>

                        {/* Points */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span className="points-pill">
                              {entry.points.toLocaleString('en-IN')}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {activeTab === 'buyers' ? 'Buyer Pts' : 'Seller Pts'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-subtle)',
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(54, 78, 162, 0.1)',
                border: '1px solid rgba(54, 78, 162, 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                color: 'var(--tvs-blue)',
              }}>
                <Search className="w-6 h-6" />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                {searchQuery ? 'No matching dealerships found' : 'Standings Initializing'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                {searchQuery
                  ? `No dealerships matched "${searchQuery}". Please check your search term, Customer ID, or dealer rank number.`
                  : 'Leaderboard points calculate automatically following verified auction transactions and dealer actions.'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSearchQuery('')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Search Filter</span>
                </button>
              )}
            </div>
          )}

          {/* Pagination Navigation Bar */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              marginTop: 'var(--space-xl)',
              paddingTop: 'var(--space-md)',
              borderTop: '1px solid var(--border-subtle)',
            }}>
              {/* Pagination Info */}
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Showing <strong>{startRecord}</strong> to <strong>{endRecord}</strong> of{' '}
                <strong>{filteredLeaderboard.length.toLocaleString('en-IN')}</strong> dealerships • Page{' '}
                <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </div>

              {/* Page Number Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                {/* First Page */}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  style={{ minWidth: '34px', padding: '4px 8px', opacity: currentPage === 1 ? 0.4 : 1 }}
                  title="First Page"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>

                {/* Previous Page */}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  style={{ minWidth: '34px', padding: '4px 8px', opacity: currentPage === 1 ? 0.4 : 1 }}
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Number Pills */}
                {getPageNumbers().map((p, index) => {
                  if (typeof p === 'string') {
                    return (
                      <span key={`ellipsis-${index}`} style={{ padding: '0 6px', color: 'var(--text-muted)' }}>
                        ...
                      </span>
                    );
                  }
                  const isCurrent = p === currentPage;
                  return (
                    <button
                      key={`page-${p}`}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      style={{
                        minWidth: '34px',
                        height: '32px',
                        borderRadius: 'var(--radius-sm)',
                        border: isCurrent ? '1px solid var(--tvs-blue-light)' : '1px solid var(--border-subtle)',
                        background: isCurrent ? 'var(--tvs-blue)' : 'rgba(255, 255, 255, 0.03)',
                        color: isCurrent ? '#fff' : 'var(--text-secondary)',
                        fontWeight: isCurrent ? 700 : 500,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {p}
                    </button>
                  );
                })}

                {/* Next Page */}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  style={{ minWidth: '34px', padding: '4px 8px', opacity: currentPage === totalPages ? 0.4 : 1 }}
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {/* Last Page */}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{ minWidth: '34px', padding: '4px 8px', opacity: currentPage === totalPages ? 0.4 : 1 }}
                  title="Last Page"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Jump to Page Box */}
              <form onSubmit={handleJumpPage} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Go to:</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={jumpPageInput}
                  onChange={(e) => setJumpPageInput(e.target.value)}
                  placeholder={String(currentPage)}
                  style={{
                    width: '56px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    textAlign: 'center',
                    fontSize: '0.82rem',
                  }}
                />
                <button
                  type="submit"
                  className="btn btn-ghost btn-sm"
                  style={{ height: '32px', padding: '0 8px', fontSize: '0.78rem' }}
                >
                  Go
                </button>
              </form>
            </div>
          )}
        </section>

        {/* Corporate Footer */}
        <footer style={{ textAlign: 'center', padding: '48px 0 24px', color: 'var(--text-muted)', fontSize: '0.8rem', borderTop: '1px solid var(--border-hairline)', marginTop: '48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontSize: '0.74rem', marginBottom: '8px' }}>
            <span>TVS Certified Network</span>
            <span>•</span>
            <span>Dealer Super Cup 2026–27</span>
            <span>•</span>
            <span>Live Standings</span>
          </div>
          <p style={{ marginTop: 'var(--space-xs)', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
            High-velocity dealer auctions every Thursday at 2:00 PM • Verified points synced in real-time
          </p>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontSize: '0.78rem',
                textDecoration: 'underline',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 600,
              }}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Official Terms & Conditions (Buyer & Seller Leagues)</span>
            </button>
            <span style={{ color: 'var(--border-subtle)' }}>•</span>
            <Link
              href="/terms"
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                textDecoration: 'underline',
              }}
            >
              Standalone Terms Page
            </Link>
          </div>
        </footer>
      </div>

      {/* Official Terms & Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        defaultTab={activeTab}
      />
    </div>
  );
}
