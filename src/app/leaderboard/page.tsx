'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import SwitchMode from '../components/watermelon/switch-mode';

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

  // Reset to page 1 whenever search query or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

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

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return { color: '#FFD700' };
      case 2: return { color: '#C0C0C0' };
      case 3: return { color: '#CD7F32' };
      default: return { color: 'var(--text-muted)' };
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
            <span className="navbar-badge">LIVE</span>
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
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(6, 214, 160, 0.2)',
                border: '1px solid rgba(6, 214, 160, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
              }}>
                🛡️
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
                }}
                onClick={() => setShowMaskedNames(!showMaskedNames)}
                title={showMaskedNames ? 'Display unmasked names' : 'Display masked names preview'}
              >
                {showMaskedNames ? '👁️ Unmask Dealer Names' : '🔒 Preview Public Masked View'}
              </button>
              <Link href="/admin" className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem' }}>
                ← Admin Console
              </Link>
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="hero">
          <div className="hero-trophy">🏆</div>
          <div className="hero-badge">
            <span>🏏</span> TVS CERTIFIED
          </div>
          <h1 className="hero-title">
            DEALER <span className="hero-title-accent">SUPER CUP</span>
          </h1>
          <p className="hero-subtitle">
            {campaign ? `${new Date(campaign.startDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}` : 'SEPTEMBER 2026'}
            {' '}• {leaderboard.length} Dealers Competing
          </p>
        </div>

        {/* Top 3 Podium (Always displays Overall Top 3) */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', maxWidth: '720px', margin: '0 auto var(--space-2xl)' }}>
          {leaderboard.slice(0, 3).map((entry, idx) => (
            <div key={idx} className={`stat-card animate-in ${idx === 0 ? 'gold' : idx === 1 ? '' : ''}`} style={{
              textAlign: 'center',
              borderColor: idx === 0 ? 'rgba(255, 215, 0, 0.4)' : idx === 1 ? 'rgba(192, 192, 192, 0.25)' : 'rgba(205, 127, 50, 0.25)',
              order: idx === 0 ? 2 : idx === 1 ? 1 : 3,
              transform: idx === 0 ? 'scale(1.05)' : 'none',
              boxShadow: idx === 0 ? '0 8px 24px rgba(255, 215, 0, 0.15)' : 'none',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-xs)' }}>
                {getMedalEmoji(entry.rank)}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', marginBottom: 'var(--space-xs)', ...getRankStyle(entry.rank) }}>
                #{entry.rank}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 'var(--space-sm)', minHeight: '2.4em', display: 'flex', alignItems: 'center', justifyContent: 'center', wordBreak: 'break-word', padding: '0 4px', color: 'var(--text-primary)' }}>
                {getDisplayName(entry)}
              </div>
              <div className="stat-value lime" style={{ fontSize: '1.5rem' }}>
                {entry.points}
              </div>
              <div className="stat-label">POINTS</div>
            </div>
          ))}
        </div>

        {/* Full Leaderboard Card with Search & Pagination */}
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: 'var(--space-md)', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📊</span> Full Rankings
              </h2>
              <p className="card-subtitle">
                {lastUpdated && `Updated ${lastUpdated.toLocaleTimeString()}`}
                {' '}• Auto-refreshes every 30s
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={fetchLeaderboard}>
              🔄 Refresh
            </button>
          </div>

          {/* Search Bar & Page Controls Row */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: 'var(--space-lg)',
          }}>
            {/* Search Input Box */}
            <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '240px' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6, fontSize: '0.9rem' }}>
                🔍
              </span>
              <input
                type="text"
                className="form-input"
                placeholder="Search dealer name or rank # (e.g. Bhavani, #5)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: '36px',
                  paddingRight: searchQuery ? '32px' : '12px',
                  height: '40px',
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '2px 6px',
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Rows Per Page Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="pageSize" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                Rows:
              </label>
              <select
                id="pageSize"
                className="form-select"
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
                style={{
                  height: '40px',
                  padding: '0 12px',
                  width: 'auto',
                  fontSize: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={0}>All (1,531)</option>
              </select>
            </div>

            {/* Results Counter Summary */}
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              {searchQuery ? (
                <span>
                  Found <strong>{filteredLeaderboard.length}</strong> matching dealers
                </span>
              ) : (
                <span>
                  Showing <strong>{startRecord}–{endRecord}</strong> of <strong>{leaderboard.length}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Leaderboard Table */}
          {paginatedEntries.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="leaderboard-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center', width: '90px' }}>Rank</th>
                    <th>{isAdminUser && !showMaskedNames ? 'Dealership Name (Unmasked)' : 'Dealer Name'}</th>
                    {isAdminUser && !showMaskedNames && <th>External ID / City</th>}
                    <th style={{ textAlign: 'right', width: '120px' }}>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEntries.map((entry, idx) => (
                    <tr key={`${entry.rank}-${entry.dealer}-${idx}`} className="leaderboard-row">
                      <td className="rank-cell" style={getRankStyle(entry.rank)}>
                        {getMedalEmoji(entry.rank) ? (
                          <span className="rank-medal" title={`Rank #${entry.rank}`}>
                            {getMedalEmoji(entry.rank)}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.95rem' }}>#{entry.rank}</span>
                        )}
                      </td>
                      <td className="dealer-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{getDisplayName(entry)}</span>
                          {entry.rank <= 3 && (
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: entry.rank === 1 ? 'rgba(255, 215, 0, 0.2)' : entry.rank === 2 ? 'rgba(192, 192, 192, 0.2)' : 'rgba(205, 127, 50, 0.2)',
                              color: entry.rank === 1 ? '#FFD700' : entry.rank === 2 ? '#C0C0C0' : '#CD7F32',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                            }}>
                              TOP {entry.rank}
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
                      <td className="points-cell">{entry.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-2xl) var(--space-md)',
              background: 'rgba(255, 255, 255, 0.01)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-subtle)',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔍</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
                No dealers found
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 'var(--space-md)' }}>
                No results matched &quot;<strong>{searchQuery}</strong>&quot;. Check for typos or try searching by another name or rank.
              </p>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </button>
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
                <strong>{filteredLeaderboard.length}</strong> dealers • Page{' '}
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
                  «
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
                  ‹
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
                  ›
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
                  »
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
                    background: 'var(--surface-secondary)',
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
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl) 0 var(--space-xl)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <p>TVS Certified Dealer Super Cup © 2026</p>
          <p style={{ marginTop: 'var(--space-xs)' }}>
            Auctions every Thursday at 2:00 PM • Points updated in real-time
          </p>
        </div>
      </div>
    </div>
  );
}
