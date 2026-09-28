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
  Eye,
  Lock,
  ArrowLeft,
  X,
} from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  dealer: string;
  dealerName?: string;
  maskedName?: string;
  externalId?: string;
  city?: string;
  points: number;
}

interface CampaignInfo {
  name: string;
  slug: string;
  isTestMode: boolean;
  startDate: string;
  endDate: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [campaign, setCampaign] = useState<CampaignInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [showMaskedNames, setShowMaskedNames] = useState(false);

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [jumpPageInput, setJumpPageInput] = useState('');

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
        setCampaign(data.campaign);
        if (data.isAdmin !== undefined) {
          setIsAdminUser(Boolean(data.isAdmin));
        }
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();

    // Check dealer auth
    fetch('/api/auth/login')
      .then(res => res.json())
      .then(data => setIsAuthenticated(data.authenticated))
      .catch(() => {});

    // Check admin auth
    fetch('/api/admin/auth')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setIsAdminUser(true);
        }
      })
      .catch(() => {});

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  const getDisplayName = useCallback((entry: LeaderboardEntry) => {
    if (isAdminUser && !showMaskedNames) {
      return entry.dealerName || entry.dealer;
    }
    return entry.maskedName || entry.dealer;
  }, [isAdminUser, showMaskedNames]);

  // Filtered leaderboard based on search query
  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return leaderboard;
    const q = searchQuery.trim().toLowerCase();
    const rankNum = q.startsWith('#') ? parseInt(q.slice(1), 10) : parseInt(q, 10);

    return leaderboard.filter((entry) => {
      // Check rank match if exact number
      if (!isNaN(rankNum) && entry.rank === rankNum) {
        return true;
      }
      const dispName = getDisplayName(entry).toLowerCase();
      const rawDealer = entry.dealer.toLowerCase();
      const realName = (entry.dealerName || '').toLowerCase();
      const extId = (entry.externalId || '').toLowerCase();
      const city = (entry.city || '').toLowerCase();
      return dispName.includes(q) || rawDealer.includes(q) || realName.includes(q) || extId.includes(q) || city.includes(q);
    });
  }, [leaderboard, searchQuery, getDisplayName]);

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
            {isAdminUser && (
              <Link href="/admin" className="navbar-badge" style={{ background: 'rgba(6, 214, 160, 0.2)', color: 'var(--accent-cyan)', borderColor: 'rgba(6, 214, 160, 0.4)', textDecoration: 'none' }}>
                ADMIN MISSION CONTROL
              </Link>
            )}
          </div>
          <ul className="navbar-nav">
            <li><span className="navbar-link active">Leaderboard</span></li>
            {isAuthenticated && (
              <li><Link href="/dashboard" className="navbar-link">My Dashboard</Link></li>
            )}
            {isAdminUser && (
              <li>
                <Link href="/admin" className="navbar-link" style={{ color: 'var(--accent-cyan)' }}>
                  Admin Portal →
                </Link>
              </li>
            )}
          </ul>
          <div className="navbar-user">
            <SwitchMode width={58} height={28} />
            {isAdminUser ? (
              <Link href="/admin" className="btn btn-primary btn-sm" style={{ background: 'var(--accent-cyan)', color: '#090d16', border: 'none' }}>
                Admin Portal
              </Link>
            ) : isAuthenticated ? (
              <Link href="/dashboard" className="btn btn-primary btn-sm">My Dashboard</Link>
            ) : (
              <Link href="/" className="btn btn-primary btn-sm">Sign In</Link>
            )}
          </div>
        </div>
      </nav>
      <TickerMarquee />

      <div className="content-wrapper">
        {/* Admin Unmasked Leaderboard Notification Strip */}
        {isAdminUser && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'linear-gradient(90deg, rgba(6, 214, 160, 0.14), rgba(15, 23, 42, 0.75))',
            border: '1px solid rgba(6, 214, 160, 0.45)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 20px',
            marginBottom: 'var(--space-xl)',
            boxShadow: '0 4px 20px rgba(6, 214, 160, 0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(6, 214, 160, 0.2)',
                border: '1px solid rgba(6, 214, 160, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Admin Mission Control • Unmasked Leaderboard</span>
                  <span style={{ fontSize: '0.68rem', background: 'rgba(6, 214, 160, 0.25)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(6, 214, 160, 0.4)' }}>
                    {showMaskedNames ? 'MASKED PREVIEW' : 'REAL DEALER NAMES ACTIVE'}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {showMaskedNames 
                    ? 'Showing public masked view with asterisks (as seen by participating dealers).'
                    : 'Showing verified, unmasked TVS dealership and enterprise legal entity names.'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="btn btn-sm"
                style={{
                  background: showMaskedNames ? 'rgba(255, 255, 255, 0.08)' : 'rgba(6, 214, 160, 0.2)',
                  color: showMaskedNames ? 'var(--text-secondary)' : 'var(--accent-cyan)',
                  border: `1px solid ${showMaskedNames ? 'var(--border-subtle)' : 'rgba(6, 214, 160, 0.5)'}`,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={() => setShowMaskedNames(!showMaskedNames)}
                title={showMaskedNames ? 'Display unmasked names' : 'Display masked names preview'}
              >
                {showMaskedNames ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Unmask Dealer Names</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Preview Public Masked View</span>
                  </>
                )}
              </button>
              <Link href="/admin" className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </Link>
            </div>
          </div>
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
                  <span>Championship Live Standings</span>
                </span>
              </div>

              {/* Clean Executive Title */}
              <h1 className="leaderboard-hero-title">
                DEALER <span className="hero-title-accent">SUPER CUP</span>
              </h1>

              {/* Informative Subtitle */}
              <p className="leaderboard-hero-subtitle">
                Official national leaderboard for verified TVS dealerships across India. Compete in weekly high-velocity auctions, earn points on verified bids and inspections, and secure your place on the season podium.
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
                  <span className="telemetry-chip-label">Dealers:</span>
                  <span className="telemetry-chip-val">
                    {leaderboard.length > 0 ? `${leaderboard.length.toLocaleString('en-IN')} Competing` : 'Standings Synchronizing'}
                  </span>
                </div>

                <div className="telemetry-chip">
                  <span className="telemetry-chip-icon text-amber-500">
                    <Award className="w-4 h-4" />
                  </span>
                  <span className="telemetry-chip-label">Podium:</span>
                  <span className="telemetry-chip-val">₹50,000 Cash Pool</span>
                </div>

                <div className="telemetry-chip">
                  <span className="telemetry-chip-icon text-indigo-500">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <span className="telemetry-chip-label">Scoring:</span>
                  <span className="telemetry-chip-val">Automated Telemetry</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Top 3 Championship Podium */}
        {leaderboard.length > 0 && (
          <section className="podium-container" aria-label="Championship Podium">
            <div className="podium-section-header">
              <div className="podium-section-eyebrow">
                <Crown className="w-3.5 h-3.5" />
                <span>Season Leaders Podium</span>
              </div>
            </div>

            <div className="podium-grid">
              {leaderboard.slice(0, 3).map((entry) => {
                const isChampion = entry.rank === 1;
                const isRunnerUp = entry.rank === 2;

                return (
                  <div
                    key={`podium-${entry.rank}-${entry.dealer}`}
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
                      {isChampion ? 'Season Leader • #1' : isRunnerUp ? 'Podium 2nd • #2' : 'Podium 3rd • #3'}
                    </span>

                    <h3 className="podium-dealer-name">
                      {getDisplayName(entry)}
                    </h3>

                    <div className="podium-score-wrap">
                      <span className="podium-points-value">
                        {entry.points.toLocaleString('en-IN')}
                      </span>
                      <span className="podium-points-label">Total Points</span>
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
                <span>Official National Rankings</span>
              </h2>
              <p className="card-subtitle">
                {lastUpdated ? `Live synced at ${lastUpdated.toLocaleTimeString('en-IN')}` : 'Live syncing active'}
                {' '}• Automated 30-second refresh
              </p>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={fetchLeaderboard}
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
                placeholder="Search dealership name, city or rank # (e.g. Bhavani, #5)..."
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
                  Showing <strong>{startRecord}–{endRecord}</strong> of <strong>{leaderboard.length.toLocaleString('en-IN')}</strong> dealerships
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
                    <th style={{ textAlign: 'center', width: '84px' }}>Rank</th>
                    <th>{isAdminUser && !showMaskedNames ? 'Dealership Legal Entity (Unmasked)' : 'Dealership Name'}</th>
                    {isAdminUser && !showMaskedNames && <th>External ID / Location</th>}
                    <th style={{ textAlign: 'right', width: '130px' }}>Total Points</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEntries.map((entry, idx) => {
                    const isTop1 = entry.rank === 1;
                    const isTop2 = entry.rank === 2;
                    const isTop3 = entry.rank === 3;

                    return (
                      <tr key={`${entry.rank}-${entry.dealer}-${idx}`} className="leaderboard-row">
                        <td style={{ textAlign: 'center' }}>
                          <span className={`rank-cell-content ${isTop1 ? 'rank-1' : isTop2 ? 'rank-2' : isTop3 ? 'rank-3' : ''}`}>
                            {entry.rank}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                              {getDisplayName(entry)}
                            </span>
                            {entry.rank <= 3 && (
                              <span className={`podium-standing-tag ${isTop1 ? 'rank-1' : isTop2 ? 'rank-2' : 'rank-3'}`} style={{ margin: 0, padding: '1px 7px', fontSize: '0.62rem' }}>
                                {isTop1 ? 'CHAMPION' : isTop2 ? '2ND PODIUM' : '3RD PODIUM'}
                              </span>
                            )}
                          </div>
                        </td>
                        {isAdminUser && !showMaskedNames && (
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', fontWeight: 600 }}>{entry.externalId || '-'}</span>
                            {entry.city ? <span style={{ marginLeft: '4px' }}>• {entry.city}</span> : ''}
                          </td>
                        )}
                        <td style={{ textAlign: 'right' }}>
                          <span className="points-pill">
                            {entry.points.toLocaleString('en-IN')}
                          </span>
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
                  ? `No dealerships matched "${searchQuery}". Please check your search term or dealer rank number.`
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
        </footer>
      </div>
    </div>
  );
}
