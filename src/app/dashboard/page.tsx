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
  ChevronRight,
  Trophy,
  Info,
  Crown,
  Scale
} from 'lucide-react';
import ScrollVideoHero from '../components/ScrollVideoHero';
import TickerMarquee from '../components/TickerMarquee';
import SwitchMode from '../components/watermelon/switch-mode';
import PrizeShowcase from '../components/PrizeShowcase';
import SuperCupPointsRulesModal from '../components/SuperCupPointsRulesModal';
import TermsAndConditionsModal from '../components/TermsAndConditionsModal';

interface DashboardData {
  dealer: { displayName?: string; maskedName: string; city: string };
  position: {
    rank: number;
    points: number;
    above: { rank: number; dealer: string; points: number; gap: number } | null;
    below: { rank: number; dealer: string; points: number; gap: number } | null;
    buyerPosition?: {
      rank: number;
      points: number;
      above: { rank: number; dealer: string; points: number; gap: number } | null;
      below: { rank: number; dealer: string; points: number; gap: number } | null;
    } | null;
    sellerPosition?: {
      rank: number;
      points: number;
      above: { rank: number; dealer: string; points: number; gap: number } | null;
      below: { rank: number; dealer: string; points: number; gap: number } | null;
    } | null;
  };
  breakdown: {
    buyerPoints?: number;
    sellerPoints?: number;
    // SELLING
    sellingListing?: { count: number; points: number; perUnit: number };
    sellingConversion?: { count: number; points: number; perUnit: number };
    sellingCommission?: { count: number; points: number; perUnit: number };
    // BUYING
    buyingParticipation?: { count: number; points: number; perUnit: number };
    buyingBids?: { count: number; totalBids?: number; points: number; perUnit: number };
    buyingConversion?: { count: number; points: number; perUnit: number };
    // Backwards Compatibility Aliases
    buyTransactions: { count: number; points: number; perUnit: number };
    sellTransactions: { count: number; points: number; perUnit: number };
    matchParticipation: { count: number; points: number; perUnit: number };
    bidsPlaced?: { count: number; points: number; perUnit: number };
    vehicleInspected?: { count: number; points: number; perUnit: number };
    watchlistAdd?: { count: number; points: number; perUnit: number };
    allMatchesBonus?: { points: number; awarded?: boolean };
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
    auctionId: string;
    date: string;
    status: string;
    participated: boolean;
  }>;
  campaign: { name: string; slug: string; isTestMode: boolean; startDate: string; endDate: string };
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Auto-display Points Rules Handbook upon dealer login / first visit
  useEffect(() => {
    try {
      const autoDismiss = localStorage.getItem('tvs_supercup_rules_auto_dismiss');
      const seenSession = sessionStorage.getItem('tvs_supercup_rules_seen_session');
      if (!autoDismiss && !seenSession) {
        const timer = setTimeout(() => {
          setShowRulesModal(true);
        }, 750);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

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
                colors: ['#364ea2', '#6cc14f', '#0087e0', '#facc15']
              });
            }, 800);
          }
        }
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [router]);

  // Use the configured campaign schedule rather than assuming every Thursday.
  const getNextAuctionDateLabel = (matches?: DashboardData['matchTracker']) => {
    const now = new Date();
    const nextMatch = matches
      ?.filter(match => match.status === 'LIVE' || new Date(match.date).getTime() >= now.getTime())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

    if (nextMatch) {
      if (nextMatch.status === 'LIVE') return 'Live now';
      return new Date(nextMatch.date).toLocaleString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
        timeZoneName: 'short',
      });
    }

    // Fallback for an empty schedule.
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
  const isTestMode = data.campaign.isTestMode;
  const matchCount = matchTracker.length;

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
              <span className="navbar-badge">{isTestMode ? 'TEST MODE' : '2026–27'}</span>
            </div>
          </Link>

          <ul className="navbar-nav">
            <li>
              <Link href="/leaderboard" className="navbar-link">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Leaderboard</span>
              </Link>
            </li>
            <li>
              <span className="navbar-link active">
                <Layers className="w-4 h-4 text-[#364ea2]" />
                <span>My Dashboard</span>
              </span>
            </li>
            <li>
              <button 
                onClick={() => setShowRulesModal(true)} 
                className="rules-nav-pill-btn"
                title="View Official Super Cup Points & Scoring Handbook"
              >
                <span className="rules-badge-pulse-indicator" />
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Point Rules</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setShowTermsModal(true)} 
                className="navbar-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                title="View Official Terms & Conditions for Buyers and Sellers"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Terms & Rules</span>
              </button>
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
      <TickerMarquee
        customItems={[
          {
            label: isTestMode ? 'PRE-LAUNCH TEST WINDOW' : 'CHAMPIONSHIP STATUS',
            value: isTestMode ? 'TEST AUCTIONS 1 OCT & 8 OCT • LIVE CUP STARTS 15 OCT' : 'SUPER CUP 2026–27 ACTIVE',
            badge: isTestMode ? 'TEST MODE' : 'LIVE CUP',
            type: 'live',
          },
          {
            label: 'NEXT AUCTION WINDOW',
            value: getNextAuctionDateLabel(matchTracker),
            badge: 'COUNTDOWN',
            type: 'live',
          },
          {
            label: 'SEASON GRAND PRIZE POOL',
            value: '₹1,00,000 FOR ENTIRE SEASON (₹50K BUYERS + ₹50K SELLERS)',
            badge: 'PODIUM',
            type: 'accent',
          },
          {
            label: 'SELLING ALLOCATIONS',
            value: 'VEHICLE LISTING = +5 PTS • COMMISSION SETTLEMENT = +5 PTS',
            badge: 'SELLING',
            type: 'positive',
          },
          {
            label: 'BUYING ALLOCATIONS',
            value: 'MATCH ATTENDANCE = +1 PT • BIDS = +1 PT (PER-CAR BASIS) • BONUS = +20 PTS',
            badge: 'BUYING',
            type: 'positive',
          },
          {
            label: 'TVS CERTIFIED NETWORK',
            value: 'TRANSPARENT DIGITAL AUCTIONS • AUDITED COMPLIANCE',
            badge: 'VERIFIED',
            type: 'neutral',
          },
        ]}
      />

      <main className="content-wrapper">
        {isTestMode && (
          <section
            role="status"
            style={{
              marginBottom: '20px', padding: '18px 22px', borderRadius: '18px',
              border: '1px solid rgba(245, 158, 11, 0.42)',
              background: 'linear-gradient(110deg, rgba(245,158,11,0.16), rgba(54,78,162,0.1), rgba(108,193,79,0.1))',
              boxShadow: '0 16px 42px rgba(54, 78, 162, 0.12)', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between', gap: '18px', flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#f59e0b', color: '#111827', display: 'grid', placeItems: 'center', boxShadow: '0 0 24px rgba(245,158,11,.35)' }}>
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <strong style={{ display: 'block', letterSpacing: '.08em', fontSize: '.84rem', color: '#b45309' }}>PRE-LAUNCH TEST MODE</strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '.88rem' }}>
                  Testing auctions: 1 Oct and 8 Oct. Test scores are isolated and will not carry into the live Super Cup.
                </span>
              </div>
            </div>
            <span className="badge badge-warning">LIVE CAMPAIGN STARTS 15 OCT</span>
          </section>
        )}

        {/* Interactive Points Rules Spotlight Banner */}
        <div className="rules-showcase-banner">
          <div className="rules-showcase-left">
            <div className="rules-showcase-icon">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="rules-showcase-title">
                <span>Official Scoring Rules & League Structure</span>
                <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '2px 8px', letterSpacing: '0.04em' }}>ACTIVE ALLOCATIONS</span>
              </div>
              <div className="rules-showcase-desc">
                Listings (+5 pts) • Commissions (+5 pts) • Unique Car Bids (+1 pt) • Match Attendance (+1 pt) • All-Matches Bonus (+20 pts). Separate Buyer & Seller Leagues.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              className="rules-showcase-btn"
              onClick={() => setShowRulesModal(true)}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Point Rules</span>
            </button>
            <button 
              className="rules-showcase-btn"
              onClick={() => setShowTermsModal(true)}
              style={{ background: 'rgba(54, 78, 162, 0.25)', borderColor: 'rgba(54, 78, 162, 0.5)' }}
            >
              <Scale className="w-3.5 h-3.5 text-blue-400" />
              <span>Terms & Rules</span>
            </button>
          </div>
        </div>

        {/* Executive Scroll-Driven Analyst Video Hero */}
        <ScrollVideoHero
          dealerName={dealerName}
          rank={position?.buyerPosition?.rank || position?.rank || '-'}
          points={`${breakdown?.buyerPoints || 0} Buyer / ${breakdown?.sellerPoints || 0} Seller`}
          city={dealer.city || 'TVS Certified Hub'}
          nextAuctionLabel={getNextAuctionDateLabel(matchTracker)}
          tagline="A STRONGER DEALER COMMUNITY • DRIVING A BRIGHTER TOMORROW"
        />

        <div id="prize-showcase">
          <PrizeShowcase />
        </div>

        {/* Dual League Standings Matrix (Separate Buyer & Seller Leagues) */}
        <div id="national-standings" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {/* Buyer League Card */}
          <div className="card double-bezel">
            <div className="inner-bezel-core score-display" style={{ borderColor: 'rgba(59, 130, 246, 0.35)' }}>
              <div className="score-display-bg-glow" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)' }}></div>
              
              <div className="score-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)' }}>
                <ShoppingCart className="w-4 h-4" />
                BUYER LEAGUE STANDINGS (₹50,000 PRIZE POOL)
              </div>

              <div className="score-rank">
                <span style={{ fontSize: '0.6em', opacity: 0.7, marginRight: '4px' }}>#</span>
                {position?.buyerPosition?.rank ?? position?.rank ?? '-'}
              </div>

              <div className="score-points" style={{ color: 'var(--accent-blue)' }}>
                {(breakdown?.buyerPoints ?? 0).toLocaleString('en-IN')}
              </div>
              <div className="score-points-label">Buyer League Verified Points</div>

              {/* Gap Indicators for Buyer League */}
              <div className="gap-indicators">
                {position?.buyerPosition?.above ? (
                  <div className="gap-indicator behind">
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>{position.buyerPosition.above.gap} PTS BEHIND #{position.buyerPosition.above.rank} ({position.buyerPosition.above.dealer})</span>
                  </div>
                ) : position?.buyerPosition && position.buyerPosition.rank === 1 ? (
                  <div className="gap-indicator" style={{ color: 'var(--accent-amber)', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                    <Crown className="w-3.5 h-3.5" />
                    <span>LEAGUE LEADER • RANK #1</span>
                  </div>
                ) : null}
                {position?.buyerPosition?.below && (
                  <div className="gap-indicator ahead">
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>{position.buyerPosition.below.gap} PTS AHEAD OF #{position.buyerPosition.below.rank} ({position.buyerPosition.below.dealer})</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Seller League Card */}
          <div className="card double-bezel">
            <div className="inner-bezel-core score-display" style={{ borderColor: 'rgba(56, 189, 248, 0.35)' }}>
              <div className="score-display-bg-glow" style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)' }}></div>
              
              <div className="score-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)' }}>
                <Layers className="w-4 h-4" />
                SELLER LEAGUE STANDINGS (₹50,000 PRIZE POOL)
              </div>

              <div className="score-rank">
                <span style={{ fontSize: '0.6em', opacity: 0.7, marginRight: '4px' }}>#</span>
                {position?.sellerPosition?.rank ?? '-'}
              </div>

              <div className="score-points" style={{ color: 'var(--accent-cyan)' }}>
                {(breakdown?.sellerPoints ?? 0).toLocaleString('en-IN')}
              </div>
              <div className="score-points-label">Seller League Verified Points</div>

              {/* Gap Indicators for Seller League */}
              <div className="gap-indicators">
                {position?.sellerPosition?.above ? (
                  <div className="gap-indicator behind">
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>{position.sellerPosition.above.gap} PTS BEHIND #{position.sellerPosition.above.rank} ({position.sellerPosition.above.dealer})</span>
                  </div>
                ) : position?.sellerPosition && position.sellerPosition.rank === 1 ? (
                  <div className="gap-indicator" style={{ color: 'var(--accent-amber)', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                    <Crown className="w-3.5 h-3.5" />
                    <span>LEAGUE LEADER • RANK #1</span>
                  </div>
                ) : null}
                {position?.sellerPosition?.below && (
                  <div className="gap-indicator ahead">
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>{position.sellerPosition.below.gap} PTS AHEAD OF #{position.sellerPosition.below.rank} ({position.sellerPosition.below.dealer})</span>
                  </div>
                )}
              </div>
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
                {/* ── SELLING ALLOCATIONS ── */}
                <tr className="breakdown-section-header">
                  <td colSpan={3} style={{ fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-cyan)', padding: '10px 14px 6px', background: 'rgba(56, 189, 248, 0.06)' }}>
                    Selling Allocations
                  </td>
                </tr>
                <tr>
                  <td>
                    <Layers className="w-4 h-4 text-sky-400 mr-2" />
                    Listing (5 pts)
                  </td>
                  <td>{breakdown.sellingListing?.count ?? 0} × {breakdown.sellingListing?.perUnit ?? 5} pts</td>
                  <td>+{breakdown.sellingListing?.points ?? 0}</td>
                </tr>
                {(breakdown.sellingConversion?.perUnit ?? 0) > 0 && (
                  <tr>
                    <td>
                      <DollarSign className="w-4 h-4 text-emerald-400 mr-2" />
                      Conversion ({breakdown.sellingConversion?.perUnit} pts)
                    </td>
                    <td>{breakdown.sellingConversion?.count ?? breakdown.sellTransactions.count} × {breakdown.sellingConversion?.perUnit} pts</td>
                    <td>+{breakdown.sellingConversion?.points ?? breakdown.sellTransactions.points}</td>
                  </tr>
                )}
                <tr>
                  <td>
                    <CheckCircle2 className="w-4 h-4 text-amber-400 mr-2" />
                    Commission (5 pts)
                  </td>
                  <td>{breakdown.sellingCommission?.count ?? 0} × {breakdown.sellingCommission?.perUnit ?? 5} pts</td>
                  <td>+{breakdown.sellingCommission?.points ?? 0}</td>
                </tr>

                {/* ── BUYING ALLOCATIONS ── */}
                <tr className="breakdown-section-header">
                  <td colSpan={3} style={{ fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-blue)', padding: '12px 14px 6px', background: 'rgba(59, 130, 246, 0.06)' }}>
                    Buying Allocations
                  </td>
                </tr>
                <tr>
                  <td>
                    <Radio className="w-4 h-4 text-amber-400 mr-2" />
                    Participation (1 pt)
                  </td>
                  <td>{breakdown.buyingParticipation?.count ?? breakdown.matchParticipation.count} × {breakdown.buyingParticipation?.perUnit ?? breakdown.matchParticipation.perUnit} pts</td>
                  <td>+{breakdown.buyingParticipation?.points ?? breakdown.matchParticipation.points}</td>
                </tr>
                <tr>
                  <td>
                    <Gavel className="w-4 h-4 text-blue-400 mr-2" />
                    Auction Bids (Per-Car Basis)
                  </td>
                  <td>
                    <span>{breakdown.buyingBids?.count ?? (breakdown.bidsPlaced?.count ?? 0)} unique cars bid on × {breakdown.buyingBids?.perUnit ?? (breakdown.bidsPlaced?.perUnit ?? 1)} pt</span>
                    {breakdown.buyingBids?.totalBids && breakdown.buyingBids.totalBids > (breakdown.buyingBids.count ?? 0) ? (
                      <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        ({breakdown.buyingBids.totalBids} total bids placed across auction)
                      </span>
                    ) : null}
                  </td>
                  <td>+{breakdown.buyingBids?.points ?? (breakdown.bidsPlaced?.points ?? 0)}</td>
                </tr>
                <tr>
                  <td>
                    <Sparkles className="w-4 h-4 text-amber-400 mr-2" />
                    All-Matches Attendance Bonus
                  </td>
                  <td>
                    {(breakdown.allMatchesBonus?.points ?? 0) > 0 ? (
                      <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>AWARDED (+20 PTS)</span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Participate in all 4 matches (+20 pts)</span>
                    )}
                  </td>
                  <td>+{(breakdown.allMatchesBonus?.points ?? 0)}</td>
                </tr>
                {(breakdown.buyingConversion?.perUnit ?? 0) > 0 && (
                  <tr>
                    <td>
                      <ShoppingCart className="w-4 h-4 text-sky-400 mr-2" />
                      Conversion ({breakdown.buyingConversion?.perUnit} pts)
                    </td>
                    <td>{breakdown.buyingConversion?.count ?? breakdown.buyTransactions.count} × {breakdown.buyingConversion?.perUnit} pts</td>
                    <td>+{breakdown.buyingConversion?.points ?? breakdown.buyTransactions.points}</td>
                  </tr>
                )}

                <tr className="breakdown-total" style={{ borderTop: '2px solid var(--border-subtle)' }}>
                  <td colSpan={2} style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>BUYER LEAGUE SCORE</td>
                  <td style={{ color: 'var(--accent-blue)', fontWeight: 800 }}>{(breakdown.buyerPoints ?? 0)} PTS</td>
                </tr>
                <tr className="breakdown-total" style={{ borderTop: '1px dashed var(--border-subtle)' }}>
                  <td colSpan={2} style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>SELLER LEAGUE SCORE</td>
                  <td style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>{(breakdown.sellerPoints ?? 0)} PTS</td>
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
        <div id="match-schedule" className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <Calendar className="w-5 h-5 text-sky-400" />
                Match Day Schedule & Attendance Tracker
              </h2>
              <p className="card-subtitle">Every Thursday at 2:00 PM IST • Participate in all {matchCount} {isTestMode ? 'test auctions' : 'matches'} for a +20 PTS bonus</p>
            </div>
            <span className="badge badge-primary">{isTestMode ? '2-Auction Test Series' : 'Super Cup 4-Series'}</span>
          </div>

          <div className="match-tracker">
            {matchTracker.map((match) => (
              <div 
                key={match.matchNumber} 
                className={`match-item ${match.participated ? 'participated' : ''} ${match.status === 'UPCOMING' ? 'upcoming' : ''}`}
              >
                <div className="match-number">Match #{match.matchNumber}</div>
                <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '2px' }}>Auction #{match.auctionId}</div>
                <div className="match-icon">
                  {match.participated ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  ) : match.status === 'UPCOMING' ? (
                    <Clock className="w-7 h-7 text-sky-400" />
                  ) : match.status === 'LIVE' ? (
                    <Radio className="w-7 h-7 text-[#6cc14f] animate-pulse" />
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
                  {match.status === 'COMPLETED' && match.participated ? 'PLAYED (+1)' :
                   match.status === 'COMPLETED' && !match.participated ? 'MISSED' :
                   match.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Auction Activity Stream Table */}
        <div id="auction-telemetry" className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <Zap className="w-5 h-5 text-emerald-400" />
                My Live Auction Telemetry Feed
              </h2>
              <p className="card-subtitle">
                Real-time activity captured from {getNextAuctionDateLabel(matchTracker)}
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
                          act.activityType === 'SELL_LISTING' ? 'badge-primary' :
                          act.activityType === 'SELL_COMMISSION' ? 'badge-warning' :
                          act.activityType === 'MATCH_PARTICIPATION' ? 'badge-lime' :
                          act.activityType === 'BID_PLACED' ? 'badge-primary' :
                          'badge-warning'
                        }`}>
                          {act.activityType === 'BUY' ? '🏆 WON LOT (CONVERSION)' :
                           act.activityType === 'SELL' ? '💰 SOLD (CONVERSION)' :
                           act.activityType === 'SELL_LISTING' ? '📋 VEHICLE LISTED' :
                           act.activityType === 'SELL_COMMISSION' ? '💵 COMMISSION SETTLED' :
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
                            <strong style={{ color: 'var(--text-primary)' }}>{String(act.metadata.vehicleName)}</strong>
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
                            <span style={{ padding: '1px 8px', borderRadius: '4px', background: 'rgba(108, 193, 79, 0.15)', color: 'var(--accent-cyan)', fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(108, 193, 79, 0.3)' }}>
                              🏆 Leading Bid
                            </span>
                          ) : null}
                          {act.metadata?.bidRank && Number(act.metadata.bidRank) > 1 ? (
                            <span style={{ padding: '1px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', fontSize: '0.72rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                              Outbid (#{String(act.metadata.bidRank)})
                            </span>
                          ) : null}
                          {Boolean(act.metadata?.isPreBid) ? (
                            <span style={{ padding: '1px 8px', borderRadius: '4px', background: 'rgba(0, 135, 224, 0.12)', color: 'var(--accent-blue)', fontSize: '0.72rem', border: '1px solid rgba(0, 135, 224, 0.3)' }}>
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
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(54, 78, 162, 0.03)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-subtle)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📡</div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                No Live Auction Events Recorded In Current Window
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
                Next live session: <strong style={{ color: 'var(--text-primary)' }}>{getNextAuctionDateLabel(matchTracker)}</strong>. Place bids, win lots, or attend the 2:00 PM digital room to earn verified points instantly!
              </p>
            </div>
          )}
        </div>

        {/* Incentive Protocol: How to Earn Points */}
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 className="card-title">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Scoring Protocol & Point Allocations
              </h2>
              <p className="card-subtitle">Verified point earning structure for the TVS Super Cup</p>
            </div>
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => setShowRulesModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', border: '1px solid var(--border-hairline)', borderRadius: '9999px', padding: '6px 14px' }}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Full Rules Handbook</span>
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setShowRulesModal(true)}>
              <div className="stat-icon">📋</div>
              <div className="stat-value blue">+5</div>
              <div className="stat-label">Vehicle Listing (SELL)</div>
            </div>

            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setShowRulesModal(true)}>
              <div className="stat-icon">💳</div>
              <div className="stat-value lime">+5</div>
              <div className="stat-label">Commission Settlement (SELL)</div>
            </div>

            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setShowRulesModal(true)}>
              <div className="stat-icon">🔨</div>
              <div className="stat-value blue">+1</div>
              <div className="stat-label">Unique Car Bid (BUY - Per Car)</div>
            </div>

            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setShowRulesModal(true)}>
              <div className="stat-icon">⏱️</div>
              <div className="stat-value gold">+1</div>
              <div className="stat-label">Match Room Attendance (BUY)</div>
            </div>

            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setShowRulesModal(true)}>
              <div className="stat-icon">🌟</div>
              <div className="stat-value gold">+20</div>
              <div className="stat-label">All-Matches Bonus (BUY)</div>
            </div>

            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setShowRulesModal(true)}>
              <div className="stat-icon">🏆</div>
              <div className="stat-value gold">₹1.0L</div>
              <div className="stat-label">Season Prize (₹50k Buy / ₹50k Sell)</div>
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
          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/leaderboard" style={{ color: 'var(--accent-blue)', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
              View Public Leaderboard →
            </Link>
            <span style={{ color: 'var(--border-subtle)' }}>•</span>
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontSize: '0.8rem',
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
                fontSize: '0.8rem',
                textDecoration: 'underline',
              }}
            >
              Standalone Terms Page
            </Link>
          </div>
        </footer>
      </main>

      {/* Super Cup Points Rules & Transparency Animated Modal */}
      <SuperCupPointsRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        dealerName={dealerName}
      />

      {/* Super Cup Official Terms & Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
    </div>
  );
}
