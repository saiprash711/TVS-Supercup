'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { 
  Award, 
  ShoppingCart, 
  DollarSign, 
  Gavel, 
  Search, 
  Star, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  LogOut, 
  Radio, 
  TrendingUp, 
  Clock, 
  Sparkles,
  ArrowUp,
  ArrowDown,
  Layers,
  Zap,
  ChevronRight
} from 'lucide-react';
import ScrollVideoHero from '../components/ScrollVideoHero';
import TickerMarquee from '../components/TickerMarquee';
import SwitchMode from '../components/watermelon/switch-mode';

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
        if (d) {
          setData(d);
          // Trigger celebratory confetti if dealer is in top 10
          if (d.position?.rank && d.position.rank <= 10) {
            setTimeout(() => {
              confetti({
                particleCount: 60,
                spread: 70,
                origin: { y: 0.7 },
                colors: ['#e11d48', '#38bdf8', '#06d6a0', '#f59e0b']
              });
            }, 800);
          }
        }
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [router]);

  // Helper: compute the next auction date label (auctions are every Thursday at 2 PM IST)
  const getNextAuctionDateLabel = () => {
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
    return auctionDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) + ' at 2:00 PM IST';
  };

  const handleLogout = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' });
    router.push('/');
  };

  if (loading || !data) {
    return (
      <div className="page-container">
        <div className="floating-orb orb-1"></div>
        <div className="floating-orb orb-2"></div>
        <div className="floating-orb orb-3"></div>
        <div className="grid-overlay"></div>
        <div className="loading-container" style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
          <div className="loading-spinner"></div>
          <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
            CONNECTING TO TVS TELEMETRY GATEWAY...
          </span>
        </div>
      </div>
    );
  }

  const { dealer, position, breakdown, matchTracker } = data;
  const dealerName = dealer.displayName || dealer.maskedName;

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
          <Link href="/dashboard" className="navbar-brand">
            <div className="navbar-logo-wrap">
              <span className="navbar-logo">
                <span>TVS</span> SUPERCUP
              </span>
              <span className="navbar-badge">SEP 2026</span>
            </div>
          </Link>

          <ul className="navbar-nav">
            <li>
              <Link href="/leaderboard" className="navbar-link">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Leaderboard</span>
              </Link>
            </li>
            <li>
              <span className="navbar-link active">
                <Layers className="w-4 h-4 text-rose-500" />
                <span>My Dashboard</span>
              </span>
            </li>
          </ul>

          <div className="navbar-user">
            <SwitchMode width={58} height={28} />
            <div className="navbar-user-pill">
              <div className="navbar-avatar">
                {dealerName.charAt(0).toUpperCase()}
              </div>
              <span className="navbar-username">{dealerName}</span>
            </div>
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={handleLogout}
              title="Logout of session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Real-Time Live Ticker Marquee */}
      <TickerMarquee />

      <main className="content-wrapper">
        {/* Executive Scroll-Driven Analyst Video Hero */}
        <ScrollVideoHero
          dealerName={dealerName}
          rank={position?.rank || '-'}
          points={position?.points?.toLocaleString('en-IN') || '0'}
          city={dealer.city || 'TVS Certified Hub'}
          nextAuctionLabel={getNextAuctionDateLabel()}
          tagline="A STRONGER DEALER COMMUNITY • DRIVING A BRIGHTER TOMORROW"
        />

        {/* Primary Score & Standings Matrix (Double-Bezel Architecture) */}
        <div className="card double-bezel" style={{ marginBottom: '24px' }}>
          <div className="inner-bezel-core score-display">
            <div className="score-display-bg-glow"></div>
            
            <div className="score-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              OFFICIAL SUPER CUP NATIONAL STANDINGS
            </div>

            <div className="score-rank">
              <span style={{ fontSize: '0.6em', opacity: 0.7, marginRight: '4px' }}>#</span>
              {position?.rank || '-'}
            </div>

            <div className="score-points">
              {position?.points?.toLocaleString('en-IN') || 0}
            </div>
            <div className="score-points-label">Total Verified Points</div>

            {/* Gap Indicators */}
            <div className="gap-indicators">
              {position?.above && (
                <div className="gap-indicator behind">
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>{position.above.gap} PTS BEHIND #{position.above.rank} ({position.above.dealer})</span>
                </div>
              )}
              {position?.below && (
                <div className="gap-indicator ahead">
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>{position.below.gap} PTS AHEAD OF #{position.below.rank} ({position.below.dealer})</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Activity Breakdown & Position Comparison */}
        <div className="grid-2">
          {/* Financial-Grade Activity Breakdown */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Activity Breakdown
                </h2>
                <p className="card-subtitle">Verified point accruals by transaction type</p>
              </div>
              <span className="badge badge-success">Audit Verified</span>
            </div>

            <table className="breakdown-table">
              <tbody>
                <tr>
                  <td>
                    <ShoppingCart className="w-4 h-4 text-sky-400 mr-2" />
                    Buy Transactions (Won Vehicles)
                  </td>
                  <td>{breakdown.buyTransactions.count} × {breakdown.buyTransactions.perUnit} pts</td>
                  <td>+{breakdown.buyTransactions.points}</td>
                </tr>
                <tr>
                  <td>
                    <DollarSign className="w-4 h-4 text-emerald-400 mr-2" />
                    Sell Transactions (Sold Vehicles)
                  </td>
                  <td>{breakdown.sellTransactions.count} × {breakdown.sellTransactions.perUnit} pts</td>
                  <td>+{breakdown.sellTransactions.points}</td>
                </tr>
                <tr>
                  <td>
                    <Radio className="w-4 h-4 text-amber-400 mr-2" />
                    2 PM Match Room Attendance
                  </td>
                  <td>{breakdown.matchParticipation.count} × {breakdown.matchParticipation.perUnit} pts</td>
                  <td>+{breakdown.matchParticipation.points}</td>
                </tr>
                {breakdown.bidsPlaced && (
                  <tr>
                    <td>
                      <Gavel className="w-4 h-4 text-blue-400 mr-2" />
                      Live Bids Placed in Room
                    </td>
                    <td>{breakdown.bidsPlaced.count} × {breakdown.bidsPlaced.perUnit} pts</td>
                    <td>+{breakdown.bidsPlaced.points}</td>
                  </tr>
                )}
                {breakdown.vehicleInspected && (
                  <tr>
                    <td>
                      <Search className="w-4 h-4 text-yellow-400 mr-2" />
                      Vehicle Technical Inspections
                    </td>
                    <td>{breakdown.vehicleInspected.count} × {breakdown.vehicleInspected.perUnit} pts</td>
                    <td>+{breakdown.vehicleInspected.points}</td>
                  </tr>
                )}
                {breakdown.watchlistAdd && (
                  <tr>
                    <td>
                      <Star className="w-4 h-4 text-purple-400 mr-2" />
                      Watchlist Bookmarks Added
                    </td>
                    <td>{breakdown.watchlistAdd.count} × {breakdown.watchlistAdd.perUnit} pts</td>
                    <td>+{breakdown.watchlistAdd.points}</td>
                  </tr>
                )}
                <tr>
                  <td>
                    <Sparkles className="w-4 h-4 text-rose-500 mr-2" />
                    All 4 Matches Completion Bonus
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>Completion Perk</td>
                  <td>+{breakdown.allMatchesBonus.points}</td>
                </tr>
                <tr className="breakdown-total">
                  <td>TOTAL SUPERCUP SCORE</td>
                  <td></td>
                  <td>{breakdown.totalPoints} PTS</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Position Comparison Radar */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">
                  <Award className="w-5 h-5 text-amber-400" />
                  Leaderboard Neighbor Radar
                </h2>
                <p className="card-subtitle">Real-time dealer delta analysis</p>
              </div>
              <span className="badge badge-info">Rankings Live</span>
            </div>

            <div className="position-comparison">
              {position?.above && (
                <>
                  <div className="position-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="position-rank">#{position.above.rank}</span>
                      <span className="position-name">{position.above.dealer}</span>
                    </div>
                    <span className="position-points">{position.above.points} pts</span>
                  </div>
                  <div className="position-gap">
                    <ArrowUp className="w-3.5 h-3.5 text-rose-500" />
                    <span>Deficit: {position.above.gap} points to overtake</span>
                    <ArrowUp className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                </>
              )}

              <div className="position-item current">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="position-rank">#{position?.rank}</span>
                  <span className="position-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>YOU ({dealerName})</span>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>ACTIVE</span>
                  </span>
                </div>
                <span className="position-points" style={{ fontSize: '1.1rem' }}>
                  {position?.points} pts
                </span>
              </div>

              {position?.below && (
                <>
                  <div className="position-gap">
                    <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Lead: {position.below.gap} points cushion</span>
                    <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="position-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="position-rank">#{position.below.rank}</span>
                      <span className="position-name">{position.below.dealer}</span>
                    </div>
                    <span className="position-points">{position.below.points} pts</span>
                  </div>
                </>
              )}
            </div>

            <div style={{ marginTop: '20px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-hairline)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Climb higher by winning auction lots this Thursday.
                </span>
                <Link href="/leaderboard" style={{ fontSize: '0.78rem', color: 'var(--accent-blue)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 600 }}>
                  Full Board <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Match Day Tracker Roadmap */}
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <Calendar className="w-5 h-5 text-sky-400" />
                Match Day Schedule & Attendance Tracker
              </h2>
              <p className="card-subtitle">Every Thursday at 2:00 PM IST • Participate in all 4 matches for a +20 PTS bonus</p>
            </div>
            <span className="badge badge-primary">Super Cup 4-Series</span>
          </div>

          <div className="match-tracker">
            {matchTracker.map((match) => (
              <div 
                key={match.matchNumber} 
                className={`match-item ${match.participated ? 'participated' : ''} ${match.status === 'UPCOMING' ? 'upcoming' : ''}`}
              >
                <div className="match-number">Match #{match.matchNumber}</div>
                <div className="match-icon">
                  {match.participated ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  ) : match.status === 'UPCOMING' ? (
                    <Clock className="w-7 h-7 text-sky-400" />
                  ) : match.status === 'LIVE' ? (
                    <Radio className="w-7 h-7 text-rose-500 animate-pulse" />
                  ) : (
                    <span style={{ opacity: 0.4 }}>✖</span>
                  )}
                </div>
                <div className="match-date">
                  {new Date(match.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    weekday: 'short'
                  })}
                </div>
                <div className={`match-status ${match.status.toLowerCase()}`}>
                  {match.status === 'COMPLETED' && match.participated ? 'PLAYED (+15)' :
                   match.status === 'COMPLETED' && !match.participated ? 'MISSED' :
                   match.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Auction Activity Stream Table */}
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <Zap className="w-5 h-5 text-emerald-400" />
                My Live Auction Telemetry Feed
              </h2>
              <p className="card-subtitle">
                Real-time activity captured from {getNextAuctionDateLabel()}
              </p>
            </div>
            <span className="badge badge-success" style={{ boxShadow: '0 0 12px rgba(6, 214, 160, 0.25)' }}>
              <span className="stream-indicator" style={{ marginRight: '4px' }} />
              Live Gateway Sync
            </span>
          </div>

          {data.recentActivities && data.recentActivities.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Activity Type</th>
                    <th>Vehicle & Bidding Telemetry</th>
                    <th>Score Awarded</th>
                    <th>Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentActivities.map(act => (
                    <tr key={act.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
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
                          {act.activityType === 'BUY' ? '🏆 WON LOT' :
                           act.activityType === 'SELL' ? '💰 SOLD VEHICLE' :
                           act.activityType === 'BID_PLACED' ? '🔨 BID PLACED' :
                           act.activityType === 'MATCH_PARTICIPATION' ? '🏏 2PM ROOM' :
                           act.activityType === 'VEHICLE_INSPECTED' ? '🔍 INSPECTION' :
                           act.activityType === 'WATCHLIST_ADD' ? '⭐ WATCHLIST' :
                           act.activityType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          {act.metadata?.vehicleName ? (
                            <strong style={{ color: '#ffffff' }}>{String(act.metadata.vehicleName)}</strong>
                          ) : null}
                          {act.metadata?.regNo ? (
                            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>({String(act.metadata.regNo)})</span>
                          ) : null}
                          {act.metadata?.bidAmount ? (
                            <span style={{ color: 'var(--accent-blue)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                              • Bid: ₹{Number(act.metadata.bidAmount).toLocaleString('en-IN')}
                            </span>
                          ) : null}
                          {act.metadata?.winningBid ? (
                            <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                              • Won: ₹{Number(act.metadata.winningBid).toLocaleString('en-IN')}
                            </span>
                          ) : null}
                          {act.metadata?.depositAmount ? (
                            <span style={{ color: 'var(--text-muted)' }}>• Deposit: ₹{Number(act.metadata.depositAmount).toLocaleString('en-IN')}</span>
                          ) : null}
                          {Boolean(act.metadata?.isLeadingBid) ? (
                            <span style={{ padding: '1px 8px', borderRadius: '4px', background: 'rgba(6, 214, 160, 0.15)', color: 'var(--accent-cyan)', fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(6, 214, 160, 0.3)' }}>
                              🏆 Leading Bid
                            </span>
                          ) : null}
                          {act.metadata?.bidRank && Number(act.metadata.bidRank) > 1 ? (
                            <span style={{ padding: '1px 8px', borderRadius: '4px', background: 'rgba(225, 29, 72, 0.15)', color: '#fda4af', fontSize: '0.72rem', border: '1px solid rgba(225, 29, 72, 0.3)' }}>
                              Outbid (#{String(act.metadata.bidRank)})
                            </span>
                          ) : null}
                          {Boolean(act.metadata?.isPreBid) ? (
                            <span style={{ padding: '1px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-blue)', fontSize: '0.72rem', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                              ⚡ Pre-Bid
                            </span>
                          ) : null}
                          {act.metadata?.fuelType ? (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                              • {String(act.metadata.fuelType)} {act.metadata.yearOfMfg ? `'${String(act.metadata.yearOfMfg).slice(-2)}` : ''}
                            </span>
                          ) : null}
                          {!act.metadata?.vehicleName && !act.metadata?.bidAmount && !act.metadata?.depositAmount && (
                            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{act.externalTransactionId}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                        +{act.points} PTS
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Immutable
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-subtle)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📡</div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
                No Live Auction Events Recorded In Current Window
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
                Next live session: <strong style={{ color: '#ffffff' }}>{getNextAuctionDateLabel()}</strong>. Place bids, win lots, or attend the 2:00 PM digital room to earn verified points instantly!
              </p>
            </div>
          )}
        </div>

        {/* Incentive Protocol: How to Earn Points */}
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Scoring Protocol & Earning Directives
              </h2>
              <p className="card-subtitle">Maximize your rank during every Thursday event</p>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🛒</div>
              <div className="stat-value blue">+10</div>
              <div className="stat-label">Won Vehicle (BUY)</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-value blue">+10</div>
              <div className="stat-label">Sold Vehicle (SELL)</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🏏</div>
              <div className="stat-value lime">+15</div>
              <div className="stat-label">2 PM Match Room Attendance</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🔨</div>
              <div className="stat-value blue">+2</div>
              <div className="stat-label">Live Bid Placed</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🔍</div>
              <div className="stat-value gold">+1</div>
              <div className="stat-label">Vehicle Technical Inspection</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🌟</div>
              <div className="stat-value gold">+20</div>
              <div className="stat-label">All 4 Matches Bonus</div>
            </div>
          </div>
        </div>

        {/* World-Class Corporate Footer */}
        <footer style={{ textAlign: 'center', padding: '48px 0 24px', borderTop: '1px solid var(--border-hairline)', marginTop: '48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
            <span>TVS Certified Network</span>
            <span>•</span>
            <span>Dealer Super Cup 2026</span>
            <span>•</span>
            <span>People • Platform • Progress</span>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
            Official TVS Certified Dealership Portal. All points and ranks are subject to automated verification.
          </p>
          <div style={{ marginTop: '12px' }}>
            <Link href="/leaderboard" style={{ color: 'var(--accent-blue)', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
              View Public Leaderboard →
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
