'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardData {
  dealer: { displayName?: string; maskedName: string; city: string };
  position: {
    rank: number;
    points: number;
    above: { rank: number; dealer: string; points: number; gap: number } | null;
    below: { rank: number; dealer: string; points: number; gap: number } | null;
  };
  breakdown: {
    buyTransactions: { count: number; points: number; perUnit: number };
    sellTransactions: { count: number; points: number; perUnit: number };
    matchParticipation: { count: number; points: number; perUnit: number };
    bidsPlaced?: { count: number; points: number; perUnit: number };
    vehicleInspected?: { count: number; points: number; perUnit: number };
    watchlistAdd?: { count: number; points: number; perUnit: number };
    allMatchesBonus: { points: number };
    totalPoints: number;
  };
  recentActivities?: Array<{
    id: number;
    activityType: string;
    points: number;
    metadata: Record<string, unknown>;
    externalTransactionId: string;
    timestamp: string;
  }>;
  matchTracker: Array<{
    matchNumber: number;
    date: string;
    status: string;
    participated: boolean;
  }>;
  campaign: { name: string; startDate: string; endDate: string };
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me/dashboard')
      .then(res => {
        if (res.status === 401) {
          router.push('/');
          return null;
        }
        return res.json();
      })
      .then(d => {
        if (d) setData(d);
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' });
    router.push('/');
  };

  if (loading || !data) {
    return (
      <div className="page-container">
        <div className="loading-container" style={{ minHeight: '100vh' }}>
          <div className="loading-spinner"></div>
          <span>Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  const { dealer, position, breakdown, matchTracker } = data;
  const dealerName = dealer.displayName || dealer.maskedName;

  return (
    <div className="page-container">
      {/* Navigation */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand">
            <span className="navbar-logo">TVS Super Cup</span>
            <span className="navbar-badge">SEP 2026</span>
          </div>
          <ul className="navbar-nav">
            <li><Link href="/leaderboard" className="navbar-link">Leaderboard</Link></li>
            <li><span className="navbar-link active">My Dashboard</span></li>
          </ul>
          <div className="navbar-user">
            <div className="navbar-avatar">{dealerName.charAt(0)}</div>
            <span className="navbar-username">{dealerName}</span>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>

      <div className="content-wrapper">
        {/* Welcome Header */}
        <div className="hero" style={{ padding: 'var(--space-2xl) 0 var(--space-lg)' }}>
          <div className="hero-badge">
            <span>👋</span> WELCOME BACK
          </div>
          <h1 className="hero-title" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
            Welcome, <span className="hero-title-accent">{dealerName}</span>
          </h1>
          <p className="hero-subtitle">{dealer.city} • Super Cup September 2026</p>
        </div>

        {/* Score Display */}
        <div className="card animate-in" style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
          <div className="score-display" style={{ padding: 'var(--space-xl) 0' }}>
            <div className="score-label">YOUR SUPER CUP POSITION</div>
            <div className="score-rank">#{position?.rank || '-'}</div>
            <div className="score-points">{position?.points || 0}</div>
            <div className="score-points-label">Total Points</div>

            {/* Gap Indicators */}
            <div className="gap-indicators">
              {position?.above && (
                <div className="gap-indicator behind">
                  ↑ {position.above.gap} POINTS BEHIND #{position.above.rank}
                </div>
              )}
              {position?.below && (
                <div className="gap-indicator ahead">
                  ↓ {position.below.gap} POINTS AHEAD OF #{position.below.rank}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid-2">
          {/* Activity Breakdown */}
          <div className="card animate-in">
            <div className="card-header">
              <div>
                <h2 className="card-title">📊 Activity Breakdown</h2>
                <p className="card-subtitle">Points earned by activity type</p>
              </div>
            </div>

            <table className="breakdown-table">
              <tbody>
                <tr>
                  <td>🛒 Buy Transactions</td>
                  <td>{breakdown.buyTransactions.count} × {breakdown.buyTransactions.perUnit}</td>
                  <td>{breakdown.buyTransactions.points}</td>
                </tr>
                <tr>
                  <td>💰 Sell Transactions</td>
                  <td>{breakdown.sellTransactions.count} × {breakdown.sellTransactions.perUnit}</td>
                  <td>{breakdown.sellTransactions.points}</td>
                </tr>
                <tr>
                  <td>🏏 Match Participation</td>
                  <td>{breakdown.matchParticipation.count} × {breakdown.matchParticipation.perUnit}</td>
                  <td>{breakdown.matchParticipation.points}</td>
                </tr>
                {breakdown.bidsPlaced && (
                  <tr>
                    <td>🔨 Live Bids Placed</td>
                    <td>{breakdown.bidsPlaced.count} × {breakdown.bidsPlaced.perUnit}</td>
                    <td>{breakdown.bidsPlaced.points}</td>
                  </tr>
                )}
                {breakdown.vehicleInspected && (
                  <tr>
                    <td>🔍 Vehicle Inspections</td>
                    <td>{breakdown.vehicleInspected.count} × {breakdown.vehicleInspected.perUnit}</td>
                    <td>{breakdown.vehicleInspected.points}</td>
                  </tr>
                )}
                {breakdown.watchlistAdd && (
                  <tr>
                    <td>⭐ Watchlist Bookmarks</td>
                    <td>{breakdown.watchlistAdd.count} × {breakdown.watchlistAdd.perUnit}</td>
                    <td>{breakdown.watchlistAdd.points}</td>
                  </tr>
                )}
                <tr>
                  <td>🌟 All 4 Matches Bonus</td>
                  <td></td>
                  <td>{breakdown.allMatchesBonus.points}</td>
                </tr>
                <tr className="breakdown-total">
                  <td>TOTAL</td>
                  <td></td>
                  <td>{breakdown.totalPoints}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Position Comparison */}
          <div className="card animate-in">
            <div className="card-header">
              <div>
                <h2 className="card-title">📍 Position Comparison</h2>
                <p className="card-subtitle">Your neighbors on the leaderboard</p>
              </div>
            </div>

            <div className="position-comparison">
              {position?.above && (
                <>
                  <div className="position-item">
                    <span className="position-rank">#{position.above.rank}</span>
                    <span className="position-name">{position.above.dealer}</span>
                    <span className="position-points">{position.above.points} pts</span>
                  </div>
                  <div className="position-gap">
                    <span className="arrow">↑</span>
                    <span className="points">{position.above.gap} points</span>
                    <span className="arrow">↑</span>
                  </div>
                </>
              )}

              <div className="position-item current">
                <span className="position-rank">#{position?.rank}</span>
                <span className="position-name">YOU</span>
                <span className="position-points">{position?.points} pts</span>
              </div>

              {position?.below && (
                <>
                  <div className="position-gap">
                    <span className="arrow">↓</span>
                    <span className="points">{position.below.gap} points</span>
                    <span className="arrow">↓</span>
                  </div>
                  <div className="position-item">
                    <span className="position-rank">#{position.below.rank}</span>
                    <span className="position-name">{position.below.dealer}</span>
                    <span className="position-points">{position.below.points} pts</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Match Day Tracker */}
        <div className="card animate-in" style={{ marginTop: 'var(--space-lg)' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">🗓️ Match Day Tracker</h2>
              <p className="card-subtitle">Thursdays at 2:00 PM • Participate in all 4 for +20 bonus points</p>
            </div>
          </div>

          <div className="match-tracker">
            {matchTracker.map((match) => (
              <div key={match.matchNumber} className={`match-item ${match.participated ? 'participated' : ''} ${match.status === 'UPCOMING' ? 'upcoming' : ''}`}>
                <div className="match-number">Match {match.matchNumber}</div>
                <div className="match-icon">
                  {match.participated ? '✅' : match.status === 'UPCOMING' ? '📅' : match.status === 'LIVE' ? '🔴' : '❌'}
                </div>
                <div className="match-date">
                  {new Date(match.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </div>
                <div className={`match-status ${match.status.toLowerCase()}`}>
                  {match.status === 'COMPLETED' && match.participated ? 'PLAYED' :
                   match.status === 'COMPLETED' && !match.participated ? 'MISSED' :
                   match.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Auction Activity Log */}
        <div className="card animate-in" style={{ marginTop: 'var(--space-lg)' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="card-title">📡 My Live Auction Activity Log</h2>
              <p className="card-subtitle">Real-time captured interactions from today's 2 PM auction (Auction #1978)</p>
            </div>
            <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>Live TVS Sync</span>
          </div>

          {data.recentActivities && data.recentActivities.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Activity</th>
                    <th>Details</th>
                    <th>Points</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentActivities.map(act => (
                    <tr key={act.id}>
                      <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
                           act.activityType === 'MATCH_PARTICIPATION' ? '🏏 ATTENDED ROOM' :
                           act.activityType === 'VEHICLE_INSPECTED' ? '🔍 INSPECTION' :
                           act.activityType === 'WATCHLIST_ADD' ? '⭐ WATCHLIST' :
                           act.activityType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                          {act.metadata?.vehicleName ? <strong>{String(act.metadata.vehicleName)}</strong> : null}
                          {act.metadata?.regNo ? <span style={{ color: 'var(--text-muted)' }}>({String(act.metadata.regNo)})</span> : null}
                          {act.metadata?.bidAmount ? <span style={{ color: '#60A5FA', fontWeight: 600 }}>• Bid: ₹{Number(act.metadata.bidAmount).toLocaleString('en-IN')}</span> : null}
                          {act.metadata?.winningBid ? <span style={{ color: '#10B981', fontWeight: 600 }}>• Won: ₹{Number(act.metadata.winningBid).toLocaleString('en-IN')}</span> : null}
                          {act.metadata?.depositAmount ? <span>• Deposit: ₹{Number(act.metadata.depositAmount).toLocaleString('en-IN')}</span> : null}
                          {Boolean(act.metadata?.isLeadingBid) ? (
                            <span style={{ padding: '1px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.18)', color: '#10B981', fontSize: '0.72rem', fontWeight: 700 }}>
                              🏆 Leading Bid
                            </span>
                          ) : null}
                          {act.metadata?.bidRank && Number(act.metadata.bidRank) > 1 ? (
                            <span style={{ padding: '1px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', fontSize: '0.72rem' }}>
                              Outbid (#{String(act.metadata.bidRank)})
                            </span>
                          ) : null}
                          {Boolean(act.metadata?.isPreBid) ? (
                            <span style={{ padding: '1px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', fontSize: '0.72rem' }}>
                              ⚡ Pre-Bid
                            </span>
                          ) : null}
                          {act.metadata?.fuelType ? (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                              • {String(act.metadata.fuelType)} {act.metadata.yearOfMfg ? `'${String(act.metadata.yearOfMfg).slice(-2)}` : ''}
                            </span>
                          ) : null}
                          {!act.metadata?.vehicleName && !act.metadata?.bidAmount && !act.metadata?.depositAmount && (
                            <span>{act.externalTransactionId}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--tvs-lime)', whiteSpace: 'nowrap' }}>
                        +{act.points} pts
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          ✓ Saved
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl) var(--space-md)', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--border-subtle)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-xs)' }}>⚡</div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                No Live Auction Activity Recorded Yet Today
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto' }}>
                Today's live event starts at <strong>2:00 PM IST (Auction #1978 — 147 vehicles)</strong>. Place bids, win vehicles, or join the auction room in TVS Certified to automatically earn points here!
              </p>
            </div>
          )}
        </div>

        {/* How to Earn Points */}
        <div className="card animate-in" style={{ marginTop: 'var(--space-lg)' }}>
          <div className="card-header">
            <h2 className="card-title">💡 How to Earn More Points</h2>
          </div>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', marginBottom: 0 }}>
            <div className="stat-card blue">
              <div className="stat-icon">🛒</div>
              <div className="stat-value blue">+10</div>
              <div className="stat-label">Won Vehicle (BUY)</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-icon">💰</div>
              <div className="stat-value blue">+10</div>
              <div className="stat-label">Sold Vehicle (SELL)</div>
            </div>
            <div className="stat-card lime">
              <div className="stat-icon">🏏</div>
              <div className="stat-value lime">+15</div>
              <div className="stat-label">2 PM Match Room</div>
            </div>
            <div className="stat-card" style={{ borderColor: 'rgba(59, 130, 246, 0.4)' }}>
              <div className="stat-icon">🔨</div>
              <div className="stat-value" style={{ color: '#60A5FA' }}>+2</div>
              <div className="stat-label">Live Bid Placed</div>
            </div>
            <div className="stat-card" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
              <div className="stat-icon">🔍</div>
              <div className="stat-value" style={{ color: '#FBBF24' }}>+1</div>
              <div className="stat-label">Vehicle Inspection</div>
            </div>
            <div className="stat-card gold">
              <div className="stat-icon">🌟</div>
              <div className="stat-value gold">+20</div>
              <div className="stat-label">All 4 Matches Bonus</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl) 0 var(--space-xl)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <p>TVS Certified Dealer Super Cup © 2026</p>
          <p style={{ marginTop: 'var(--space-xs)' }}>
            <Link href="/leaderboard" style={{ color: 'var(--text-muted)' }}>View Full Leaderboard →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
