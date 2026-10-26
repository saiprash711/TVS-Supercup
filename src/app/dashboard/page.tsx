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
  Calendar,
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
  Crown,
  Scale,
  ShieldCheck
} from 'lucide-react';
import ScrollVideoHero from '../components/ScrollVideoHero';
import TickerMarquee from '../components/TickerMarquee';
import SwitchMode from '../components/watermelon/switch-mode';
import LanguageToggle from '../components/LanguageToggle';
import PrizeShowcase from '../components/PrizeShowcase';
import SuperCupPointsRulesModal from '../components/SuperCupPointsRulesModal';
import TermsAndConditionsModal from '../components/TermsAndConditionsModal';
import { DealerLanguageProvider, useDealerLanguage } from '../context/DealerLanguageContext';
import { maskDealerName } from '@/lib/services/masking';

interface DashboardData {
  isEmployee?: boolean;
  dealer: { displayName?: string; maskedName: string; city: string; isEmployee?: boolean };
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

function DashboardContent() {
  const router = useRouter();
  const { t, isTamil } = useDealerLanguage();
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
    } catch { }
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

  // Format auction schedule label respecting active language
  const getNextAuctionDateLabel = (matches?: DashboardData['matchTracker'], isTa?: boolean) => {
    const now = new Date();
    const nextMatch = matches
      ?.filter(match => match.status === 'LIVE' || new Date(match.date).getTime() >= now.getTime())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

    if (nextMatch) {
      if (nextMatch.status === 'LIVE') return isTa ? 'இப்போது நேரலையில்' : 'Live now';
      return new Date(nextMatch.date).toLocaleString(isTa ? 'ta-IN' : 'en-IN', {
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
    if (isToday) return isTa ? 'இன்று மதியம் 2:00 மணி IST' : 'Today at 2:00 PM IST';
    if (isTomorrow) return isTa ? 'நாளை மதியம் 2:00 மணி IST' : 'Tomorrow at 2:00 PM IST';
    return isTa
      ? auctionDate.toLocaleDateString('ta-IN', { weekday: 'short', day: 'numeric', month: 'short' }) + ' மதியம் 2:00 மணி IST'
      : auctionDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) + ' at 2:00 PM IST';
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
        <nav className="navbar" style={{ position: 'relative', zIndex: 2 }}>
          <div className="navbar-inner">
            <div className="navbar-brand">
              <span className="navbar-logo"><span>TVS</span> SUPERCUP</span>
            </div>
            <div className="navbar-user">
              <LanguageToggle />
              <SwitchMode width={58} height={28} />
            </div>
          </div>
        </nav>
        <div className="loading-container" style={{ minHeight: '80vh', position: 'relative', zIndex: 1 }}>
          <div className="loading-spinner"></div>
          <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
            {t('navbar.connectingGateway', 'CONNECTING TO TVS TELEMETRY GATEWAY...')}
          </span>
        </div>
      </div>
    );
  }

  const { dealer, position, breakdown, matchTracker } = data;
  const isEmployee = Boolean(data.isEmployee || dealer.isEmployee);
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
              <span className="navbar-badge">
                {isTestMode ? t('navbar.testMode', 'TEST MODE') : '2026–27'}
              </span>
            </div>
          </Link>

          <ul className="navbar-nav">
            {isEmployee && (
              <li>
                <Link
                  href="/admin"
                  className="navbar-link"
                  style={{
                    color: '#10b981',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Open Admin Command Center"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Admin Mission Control</span>
                </Link>
              </li>
            )}
            <li>
              <Link href="/leaderboard" className="navbar-link">
                <Award className="w-4 h-4 text-amber-500" />
                <span>{t('navbar.leaderboard', 'Leaderboard')}</span>
              </Link>
            </li>
            <li>
              <span className="navbar-link active">
                <Layers className="w-4 h-4 text-[#364ea2]" />
                <span>{t('navbar.myDashboard', 'My Dashboard')}</span>
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
                <span>{t('navbar.pointRules', 'Point Rules')}</span>
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
                <span>{t('navbar.termsRules', 'Terms & Rules')}</span>
              </button>
            </li>
          </ul>

          <div className="navbar-user">
            {/* Language Toggle: English / Tamil for Dealer Route */}
            <LanguageToggle />
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
              <span className="hidden sm:inline">{t('navbar.logout', 'Logout')}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Real-Time Live Ticker Marquee */}
      <TickerMarquee
        customItems={[
          {
            label: isTestMode ? t('ticker.preLaunch', 'PRE-LAUNCH TEST WINDOW') : t('ticker.champStatus', 'CHAMPIONSHIP STATUS'),
            value: isTestMode ? t('ticker.preLaunchVal', 'TEST AUCTIONS 1 OCT & 8 OCT • LIVE CUP STARTS 15 OCT') : t('ticker.champActive', 'SUPER CUP 2026–27 ACTIVE'),
            badge: isTestMode ? t('ticker.testModeBadge', 'TEST MODE') : t('ticker.liveCup', 'LIVE CUP'),
            type: 'live',
          },
          {
            label: t('ticker.nextAuction', 'NEXT AUCTION WINDOW'),
            value: getNextAuctionDateLabel(matchTracker, isTamil),
            badge: t('ticker.countdown', 'COUNTDOWN'),
            type: 'live',
          },
          {
            label: t('ticker.seasonGrandPrize', 'SEASON GRAND PRIZE POOL'),
            value: t('ticker.grandPrizeVal', '₹1,00,000 FOR ENTIRE SEASON (₹50K BUYERS + ₹50K SELLERS)'),
            badge: t('ticker.podium', 'PODIUM'),
            type: 'accent',
          },
          {
            label: t('ticker.sellingAlloc', 'SELLING ALLOCATIONS'),
            value: t('ticker.sellingAllocVal', 'VEHICLE LISTING = +5 PTS • COMMISSION SETTLEMENT = +5 PTS'),
            badge: t('ticker.sellingBadge', 'SELLING'),
            type: 'positive',
          },
          {
            label: t('ticker.buyingAlloc', 'BUYING ALLOCATIONS'),
            value: t('ticker.buyingAllocVal', 'MATCH ATTENDANCE = +1 PT • BIDS = +1 PT (PER-CAR BASIS) • BONUS = +20 PTS'),
            badge: t('ticker.buyingBadge', 'BUYING'),
            type: 'positive',
          },
          {
            label: t('ticker.tvsNetwork', 'TVS CERTIFIED NETWORK'),
            value: t('ticker.tvsNetworkVal', 'TRANSPARENT DIGITAL AUCTIONS • AUDITED COMPLIANCE'),
            badge: t('ticker.verifiedBadge', 'VERIFIED'),
            type: 'neutral',
          },
        ]}
      />

      {/* TVS Employee Executive Privileges Banner */}
      {isEmployee && (
        <aside
          className="admin-leaderboard-banner"
          aria-label="TVS Employee View Notice"
          role="region"
          style={{
            maxWidth: '1280px',
            margin: '16px auto 0 auto',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%)',
            borderColor: 'rgba(16, 185, 129, 0.3)',
          }}
        >
          <div className="admin-banner-left">
            <div className="admin-shield-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="admin-banner-heading" style={{ color: '#10b981' }}>
                <span>TVS Certified Internal Employee View</span>
                <span className="admin-status-badge" style={{ background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                  👁️ FULL ADMIN PRIVILEGES
                </span>
              </div>
              <p className="admin-banner-sub">
                You are logged in with TVS executive staff clearance. You have full access to the Admin Command Center, live auction telemetry, fleet directory, and unmasked leaderboard.
              </p>
            </div>
          </div>

          <div className="admin-banner-actions">
            <Link
              href="/admin"
              className="btn btn-primary btn-sm"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderColor: '#10b981',
                color: '#fff',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>Open Admin Command Center</span>
            </Link>
            <Link
              href="/leaderboard"
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Unmasked Leaderboard</span>
            </Link>
          </div>
        </aside>
      )}

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
                <strong style={{ display: 'block', letterSpacing: '.08em', fontSize: '.84rem', color: '#b45309' }}>
                  {t('testBanner.title', 'PRE-LAUNCH TEST MODE')}
                </strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '.88rem' }}>
                  {t('testBanner.desc', 'Testing auctions: 1 Oct and 8 Oct. Test scores are isolated and will not carry into the live Super Cup.')}
                </span>
              </div>
            </div>
            <span className="badge badge-warning">
              {t('testBanner.badge', 'LIVE CAMPAIGN STARTS 15 OCT')}
            </span>
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
                <span>{t('rulesBanner.title', 'Official Scoring Rules & League Structure')}</span>
                <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '2px 8px', letterSpacing: '0.04em' }}>
                  {t('rulesBanner.activeAllocations', 'ACTIVE ALLOCATIONS')}
                </span>
              </div>
              <div className="rules-showcase-desc">
                {t('rulesBanner.desc', 'Listings (+5 pts) • Commissions (+5 pts) • Unique Car Bids (+1 pt) • Match Attendance (+1 pt) • All-Matches Bonus (+20 pts). Separate Buyer & Seller Leagues.')}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className="rules-showcase-btn"
              onClick={() => setShowRulesModal(true)}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('rulesBanner.btnRules', 'Point Rules')}</span>
            </button>
            <button
              className="rules-showcase-btn"
              onClick={() => setShowTermsModal(true)}
              style={{ background: 'rgba(54, 78, 162, 0.25)', borderColor: 'rgba(54, 78, 162, 0.5)' }}
            >
              <Scale className="w-3.5 h-3.5 text-blue-400" />
              <span>{t('rulesBanner.btnTerms', 'Terms & Rules')}</span>
            </button>
          </div>
        </div>

        {/* Executive Scroll-Driven Analyst Video Hero */}
        <ScrollVideoHero
          dealerName={dealerName}
          rank={position?.buyerPosition?.rank || position?.rank || '-'}
          points={`${breakdown?.buyerPoints || 0} ${t('hero.buyer', 'Buyer')} / ${breakdown?.sellerPoints || 0} ${t('hero.seller', 'Seller')}`}
          city={dealer.city || 'TVS Certified Hub'}
          nextAuctionLabel={getNextAuctionDateLabel(matchTracker, isTamil)}
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
                {t('standings.buyerTitle', 'BUYER LEAGUE STANDINGS (₹50,000 PRIZE POOL)')}
              </div>

              <div className="score-rank">
                <span style={{ fontSize: '0.6em', opacity: 0.7, marginRight: '4px' }}>#</span>
                {position?.buyerPosition?.rank ?? position?.rank ?? '-'}
              </div>

              <div className="score-points" style={{ color: 'var(--accent-blue)' }}>
                {(breakdown?.buyerPoints ?? 0).toLocaleString('en-IN')}
              </div>
              <div className="score-points-label">{t('standings.buyerPointsLabel', 'Buyer League Verified Points')}</div>

              {/* Gap Indicators for Buyer League */}
              <div className="gap-indicators">
                {position?.buyerPosition?.above ? (
                  <div className="gap-indicator behind">
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>
                      {t('standings.behind', '{gap} PTS BEHIND #{rank} ({dealer})', {
                        gap: position.buyerPosition.above.gap,
                        rank: position.buyerPosition.above.rank,
                        dealer: position.buyerPosition.above.dealer,
                      })}
                    </span>
                  </div>
                ) : position?.buyerPosition && position.buyerPosition.rank === 1 ? (
                  <div className="gap-indicator" style={{ color: 'var(--accent-amber)', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                    <Crown className="w-3.5 h-3.5" />
                    <span>{t('standings.leagueLeader', 'LEAGUE LEADER • RANK #1')}</span>
                  </div>
                ) : null}
                {position?.buyerPosition?.below && (
                  <div className="gap-indicator ahead">
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>
                      {t('standings.ahead', '{gap} PTS AHEAD OF #{rank} ({dealer})', {
                        gap: position.buyerPosition.below.gap,
                        rank: position.buyerPosition.below.rank,
                        dealer: position.buyerPosition.below.dealer,
                      })}
                    </span>
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
                {t('standings.sellerTitle', 'SELLER LEAGUE STANDINGS (₹50,000 PRIZE POOL)')}
              </div>

              <div className="score-rank">
                <span style={{ fontSize: '0.6em', opacity: 0.7, marginRight: '4px' }}>#</span>
                {position?.sellerPosition?.rank ?? '-'}
              </div>

              <div className="score-points" style={{ color: 'var(--accent-cyan)' }}>
                {(breakdown?.sellerPoints ?? 0).toLocaleString('en-IN')}
              </div>
              <div className="score-points-label">{t('standings.sellerPointsLabel', 'Seller League Verified Points')}</div>

              {/* Gap Indicators for Seller League */}
              <div className="gap-indicators">
                {position?.sellerPosition?.above ? (
                  <div className="gap-indicator behind">
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>
                      {t('standings.behind', '{gap} PTS BEHIND #{rank} ({dealer})', {
                        gap: position.sellerPosition.above.gap,
                        rank: position.sellerPosition.above.rank,
                        dealer: position.sellerPosition.above.dealer,
                      })}
                    </span>
                  </div>
                ) : position?.sellerPosition && position.sellerPosition.rank === 1 ? (
                  <div className="gap-indicator" style={{ color: 'var(--accent-amber)', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                    <Crown className="w-3.5 h-3.5" />
                    <span>{t('standings.leagueLeader', 'LEAGUE LEADER • RANK #1')}</span>
                  </div>
                ) : null}
                {position?.sellerPosition?.below && (
                  <div className="gap-indicator ahead">
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>
                      {t('standings.ahead', '{gap} PTS AHEAD OF #{rank} ({dealer})', {
                        gap: position.sellerPosition.below.gap,
                        rank: position.sellerPosition.below.rank,
                        dealer: position.sellerPosition.below.dealer,
                      })}
                    </span>
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
                  {t('breakdown.title', 'Activity Breakdown')}
                </h2>
                <p className="card-subtitle">{t('breakdown.subtitle', 'Verified point accruals by transaction type')}</p>
              </div>
              <span className="badge badge-success">{t('breakdown.auditVerified', 'Audit Verified')}</span>
            </div>

            <table className="breakdown-table">
              <tbody>
                {/* ── SELLING ALLOCATIONS ── */}
                <tr className="breakdown-section-header">
                  <td colSpan={3} style={{ fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-cyan)', padding: '10px 14px 6px', background: 'rgba(56, 189, 248, 0.06)' }}>
                    {t('breakdown.sellingSection', 'Selling Allocations')}
                  </td>
                </tr>
                <tr>
                  <td>
                    <Layers className="w-4 h-4 text-sky-400 mr-2" />
                    {t('breakdown.listing', 'Listing (1 pt)')}
                  </td>
                  <td>{breakdown.sellingListing?.count ?? 0} × {breakdown.sellingListing?.perUnit ?? 1} {t('breakdown.pts', 'pts')}</td>
                  <td>+{breakdown.sellingListing?.points ?? 0}</td>
                </tr>
                {(breakdown.sellingConversion?.perUnit ?? 0) > 0 && (
                  <tr>
                    <td>
                      <DollarSign className="w-4 h-4 text-emerald-400 mr-2" />
                      {t('breakdown.sellingConversion', `Conversion (${breakdown.sellingConversion?.perUnit ?? 10} pts)`, { perUnit: breakdown.sellingConversion?.perUnit ?? 10 })}
                    </td>
                    <td>{breakdown.sellingConversion?.count ?? breakdown.sellTransactions.count} × {breakdown.sellingConversion?.perUnit ?? 10} {t('breakdown.pts', 'pts')}</td>
                    <td>+{breakdown.sellingConversion?.points ?? breakdown.sellTransactions.points}</td>
                  </tr>
                )}
                {(breakdown.sellingCommission?.points ?? 0) > 0 && (
                  <tr>
                    <td>
                      <CheckCircle2 className="w-4 h-4 text-amber-400 mr-2" />
                      {t('breakdown.commission', 'Commission (5 pts)')}
                    </td>
                    <td>{breakdown.sellingCommission?.count ?? 0} × {breakdown.sellingCommission?.perUnit ?? 5} {t('breakdown.pts', 'pts')}</td>
                    <td>+{breakdown.sellingCommission?.points ?? 0}</td>
                  </tr>
                )}

                {/* ── BUYING ALLOCATIONS ── */}
                <tr className="breakdown-section-header">
                  <td colSpan={3} style={{ fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-blue)', padding: '12px 14px 6px', background: 'rgba(59, 130, 246, 0.06)' }}>
                    {t('breakdown.buyingSection', 'Buying Allocations')}
                  </td>
                </tr>
                <tr>
                  <td>
                    <Radio className="w-4 h-4 text-amber-400 mr-2" />
                    {t('breakdown.participation', 'Participation (1 pt)')}
                  </td>
                  <td>{breakdown.buyingParticipation?.count ?? breakdown.matchParticipation.count} × {breakdown.buyingParticipation?.perUnit ?? breakdown.matchParticipation.perUnit} {t('breakdown.pts', 'pts')}</td>
                  <td>+{breakdown.buyingParticipation?.points ?? breakdown.matchParticipation.points}</td>
                </tr>
                <tr>
                  <td>
                    <Gavel className="w-4 h-4 text-blue-400 mr-2" />
                    {t('breakdown.bids', 'Auction Bids (Per-Car Basis)')}
                  </td>
                  <td>
                    <span>
                      {breakdown.buyingBids?.count ?? (breakdown.bidsPlaced?.count ?? 0)} {t('breakdown.uniqueCars', 'unique cars bid on')} × {breakdown.buyingBids?.perUnit ?? (breakdown.bidsPlaced?.perUnit ?? 1)} {t('breakdown.pt', 'pt')}
                    </span>
                    {breakdown.buyingBids?.totalBids && breakdown.buyingBids.totalBids > (breakdown.buyingBids.count ?? 0) ? (
                      <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        ({breakdown.buyingBids.totalBids} {t('breakdown.totalBidsPlaced', 'total bids placed across auction')})
                      </span>
                    ) : null}
                  </td>
                  <td>+{breakdown.buyingBids?.points ?? (breakdown.bidsPlaced?.points ?? 0)}</td>
                </tr>
                <tr>
                  <td>
                    <Sparkles className="w-4 h-4 text-amber-400 mr-2" />
                    {t('breakdown.allMatchesBonus', 'All-Matches Attendance Bonus')}
                  </td>
                  <td>
                    {(breakdown.allMatchesBonus?.points ?? 0) > 0 ? (
                      <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                        {t('breakdown.awarded', 'AWARDED (+5 PTS)')}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {t('breakdown.allMatchesHint', `Participate in all ${matchCount} matches (+5 pts)`, { count: matchCount })}
                      </span>
                    )}
                  </td>
                  <td>+{(breakdown.allMatchesBonus?.points ?? 0)}</td>
                </tr>
                {(breakdown.buyingConversion?.perUnit ?? 0) > 0 && (
                  <tr>
                    <td>
                      <ShoppingCart className="w-4 h-4 text-sky-400 mr-2" />
                      {t('breakdown.buyingConversion', `Conversion (${breakdown.buyingConversion?.perUnit ?? 10} pts)`, { perUnit: breakdown.buyingConversion?.perUnit ?? 10 })}
                    </td>
                    <td>{breakdown.buyingConversion?.count ?? breakdown.buyTransactions.count} × {breakdown.buyingConversion?.perUnit ?? 10} {t('breakdown.pts', 'pts')}</td>
                    <td>+{breakdown.buyingConversion?.points ?? breakdown.buyTransactions.points}</td>
                  </tr>
                )}

                <tr className="breakdown-total" style={{ borderTop: '2px solid var(--border-subtle)' }}>
                  <td colSpan={2} style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>
                    {t('breakdown.buyerLeagueScore', 'BUYER LEAGUE SCORE')}
                  </td>
                  <td style={{ color: 'var(--accent-blue)', fontWeight: 800 }}>{(breakdown.buyerPoints ?? 0)} {t('breakdown.pts', 'PTS')}</td>
                </tr>
                <tr className="breakdown-total" style={{ borderTop: '1px dashed var(--border-subtle)' }}>
                  <td colSpan={2} style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                    {t('breakdown.sellerLeagueScore', 'SELLER LEAGUE SCORE')}
                  </td>
                  <td style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>{(breakdown.sellerPoints ?? 0)} {t('breakdown.pts', 'PTS')}</td>
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
                  {t('radar.title', 'Leaderboard Neighbor Radar')}
                </h2>
                <p className="card-subtitle">{t('radar.subtitle', 'Real-time dealer delta analysis')}</p>
              </div>
              <span className="badge badge-info">{t('radar.rankingsLive', 'Rankings Live')}</span>
            </div>

            <div className="position-comparison">
              {position?.above && (
                <>
                  <div className="position-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="position-rank">#{position.above.rank}</span>
                      <span className="position-name">{maskDealerName(position.above.dealer)}</span>
                    </div>
                    <span className="position-points">{position.above.points} {t('breakdown.pts', 'pts')}</span>
                  </div>
                  <div className="position-gap">
                    <ArrowUp className="w-3.5 h-3.5 text-rose-500" />
                    <span>
                      {t('radar.deficit', 'Deficit: {gap} points to overtake', { gap: position.above.gap })}
                    </span>
                    <ArrowUp className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                </>
              )}

              <div className="position-item current">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="position-rank">#{position?.rank}</span>
                  <span className="position-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{t('radar.you', `YOU (${dealerName})`, { dealerName })}</span>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>{t('radar.active', 'ACTIVE')}</span>
                  </span>
                </div>
                <span className="position-points" style={{ fontSize: '1.1rem' }}>
                  {position?.points} {t('breakdown.pts', 'pts')}
                </span>
              </div>

              {position?.below && (
                <>
                  <div className="position-gap">
                    <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {t('radar.lead', 'Lead: {gap} points cushion', { gap: position.below.gap })}
                    </span>
                    <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="position-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="position-rank">#{position.below.rank}</span>
                      <span className="position-name">{maskDealerName(position.below.dealer)}</span>
                    </div>
                    <span className="position-points">{position.below.points} {t('breakdown.pts', 'pts')}</span>
                  </div>
                </>
              )}
            </div>

            <div style={{ marginTop: '20px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-hairline)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {t('radar.tip', 'Climb higher by winning auction lots this Thursday.')}
                </span>
                <Link href="/leaderboard" style={{ fontSize: '0.78rem', color: 'var(--accent-blue)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 600 }}>
                  {t('radar.fullBoard', 'Full Board')} <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Match Day Schedule & Attendance Tracker */}
        <div id="match-schedule" className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <Calendar className="w-5 h-5 text-sky-400" />
                {t('match.title', 'Match Day Schedule & Attendance Tracker')}
              </h2>
              <p className="card-subtitle">
                {t('match.subtitle', `Every Thursday at 2:00 PM IST • Participate in all ${matchCount} ${isTestMode ? 'test auctions' : 'matches'} for a +20 PTS bonus`, {
                  count: matchCount,
                  series: isTestMode ? t('match.testSeries', 'test auctions') : t('match.matches', 'matches'),
                })}
              </p>
            </div>
            <span className="badge badge-primary">
              {isTestMode ? t('match.testSeries', '2-Auction Test Series') : t('match.cupSeries', 'Super Cup Weekly Series')}
            </span>
          </div>

          <div className="match-tracker">
            {matchTracker.map((match) => (
              <div
                key={match.matchNumber}
                className={`match-item ${match.participated ? 'participated' : ''} ${match.status === 'UPCOMING' ? 'upcoming' : ''}`}
              >
                <div className="match-number">{t('match.matchLabel', `Match #${match.matchNumber}`, { num: match.matchNumber })}</div>
                <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {t('match.auctionLabel', `Auction #${match.auctionId}`, { id: match.auctionId })}
                </div>
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
                  {new Date(match.date).toLocaleDateString(isTamil ? 'ta-IN' : 'en-IN', {
                    day: 'numeric',
                    month: 'short',
                    weekday: 'short'
                  })}
                </div>
                <div className={`match-status ${match.status.toLowerCase()}`}>
                  {match.status === 'COMPLETED' && match.participated ? t('match.played', 'PLAYED (+1)') :
                    match.status === 'COMPLETED' && !match.participated ? t('match.missed', 'MISSED') :
                      match.status === 'UPCOMING' ? t('match.upcoming', 'UPCOMING') :
                        match.status === 'LIVE' ? t('match.live', 'LIVE') :
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
                {t('telemetry.title', 'My Live Auction Telemetry Feed')}
              </h2>
              <p className="card-subtitle">
                {t('telemetry.subtitle', `Real-time activity captured from ${getNextAuctionDateLabel(matchTracker, isTamil)}`, {
                  nextAuction: getNextAuctionDateLabel(matchTracker, isTamil),
                })}
              </p>
            </div>
            <span className="badge badge-success" style={{ boxShadow: '0 0 12px rgba(6, 214, 160, 0.25)' }}>
              <span className="stream-indicator" style={{ marginRight: '4px' }} />
              {t('telemetry.syncBadge', 'Live Gateway Sync')}
            </span>
          </div>

          {data.recentActivities && data.recentActivities.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('telemetry.thTimestamp', 'Timestamp')}</th>
                    <th>{t('telemetry.thActivityType', 'Activity Type')}</th>
                    <th>{t('telemetry.thVehicle', 'Vehicle & Bidding Telemetry')}</th>
                    <th>{t('telemetry.thScore', 'Score Awarded')}</th>
                    <th>{t('telemetry.thVerification', 'Verification')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentActivities.map(act => (
                    <tr key={act.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td>
                        <span className={`badge ${act.activityType === 'BUY' ? 'badge-success' :
                            act.activityType === 'SELL' ? 'badge-info' :
                              act.activityType === 'SELL_LISTING' ? 'badge-primary' :
                                act.activityType === 'SELL_COMMISSION' ? 'badge-warning' :
                                  act.activityType === 'MATCH_PARTICIPATION' ? 'badge-lime' :
                                    act.activityType === 'BID_PLACED' ? 'badge-primary' :
                                      'badge-warning'
                          }`}>
                          {act.activityType === 'BUY' ? t('telemetry.won', '🏆 WON LOT (CONVERSION)') :
                            act.activityType === 'SELL' ? t('telemetry.sold', '💰 SOLD (CONVERSION)') :
                              act.activityType === 'SELL_LISTING' ? t('telemetry.listed', '📋 VEHICLE LISTED') :
                                act.activityType === 'SELL_COMMISSION' ? t('telemetry.commissionSettled', '💵 COMMISSION SETTLED') :
                                  act.activityType === 'BID_PLACED' ? t('telemetry.bidPlaced', '🔨 BID PLACED') :
                                    act.activityType === 'MATCH_PARTICIPATION' ? t('telemetry.room2pm', '🏏 2PM ROOM') :
                                      act.activityType === 'VEHICLE_INSPECTED' ? t('telemetry.inspection', '🔍 INSPECTION') :
                                        act.activityType === 'WATCHLIST_ADD' ? t('telemetry.watchlist', '⭐ WATCHLIST') :
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
                              • {t('telemetry.bid', 'Bid')}: ₹{Number(act.metadata.bidAmount).toLocaleString('en-IN')}
                            </span>
                          ) : null}
                          {act.metadata?.winningBid ? (
                            <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                              • {t('telemetry.wonVal', 'Won')}: ₹{Number(act.metadata.winningBid).toLocaleString('en-IN')}
                            </span>
                          ) : null}
                          {act.metadata?.depositAmount ? (
                            <span style={{ color: 'var(--text-muted)' }}>
                              • {t('telemetry.deposit', 'Deposit')}: ₹{Number(act.metadata.depositAmount).toLocaleString('en-IN')}
                            </span>
                          ) : null}
                          {Boolean(act.metadata?.isLeadingBid) ? (
                            <span style={{ padding: '1px 8px', borderRadius: '4px', background: 'rgba(108, 193, 79, 0.15)', color: 'var(--accent-cyan)', fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(108, 193, 79, 0.3)' }}>
                              {t('telemetry.leadingBid', '🏆 Leading Bid')}
                            </span>
                          ) : null}
                          {act.metadata?.bidRank && Number(act.metadata.bidRank) > 1 ? (
                            <span style={{ padding: '1px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', fontSize: '0.72rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                              {t('telemetry.outbid', `Outbid (#${String(act.metadata.bidRank)})`, { rank: String(act.metadata.bidRank) })}
                            </span>
                          ) : null}
                          {Boolean(act.metadata?.isPreBid) ? (
                            <span style={{ padding: '1px 8px', borderRadius: '4px', background: 'rgba(0, 135, 224, 0.12)', color: 'var(--accent-blue)', fontSize: '0.72rem', border: '1px solid rgba(0, 135, 224, 0.3)' }}>
                              {t('telemetry.preBid', '⚡ Pre-Bid')}
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
                        +{act.points} {t('breakdown.pts', 'PTS')}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> {t('telemetry.immutable', 'Immutable')}
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
                {t('telemetry.emptyTitle', 'No Live Auction Events Recorded In Current Window')}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
                {t('telemetry.emptyDesc', 'Next live session:')} <strong style={{ color: 'var(--text-primary)' }}>{getNextAuctionDateLabel(matchTracker, isTamil)}</strong>. {t('telemetry.emptyCallout', 'Place bids, win lots, or attend the 2:00 PM digital room to earn verified points instantly!')}
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
                {t('protocol.title', 'Scoring Protocol & Point Allocations')}
              </h2>
              <p className="card-subtitle">{t('protocol.subtitle', 'Verified point earning structure for the TVS Super Cup')}</p>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowRulesModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', border: '1px solid var(--border-hairline)', borderRadius: '9999px', padding: '6px 14px' }}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('protocol.fullHandbook', 'Full Rules Handbook')}</span>
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setShowRulesModal(true)}>
              <div className="stat-icon">📋</div>
              <div className="stat-value blue">+5</div>
              <div className="stat-label">{t('protocol.listing', 'Vehicle Listing (SELL)')}</div>
            </div>

            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setShowRulesModal(true)}>
              <div className="stat-icon">💳</div>
              <div className="stat-value lime">+5</div>
              <div className="stat-label">{t('protocol.commission', 'Commission Settlement (SELL)')}</div>
            </div>

            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setShowRulesModal(true)}>
              <div className="stat-icon">🔨</div>
              <div className="stat-value blue">+1</div>
              <div className="stat-label">{t('protocol.bid', 'Unique Car Bid (BUY - Per Car)')}</div>
            </div>

            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setShowRulesModal(true)}>
              <div className="stat-icon">⏱️</div>
              <div className="stat-value gold">+1</div>
              <div className="stat-label">{t('protocol.attendance', 'Match Room Attendance (BUY)')}</div>
            </div>

            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setShowRulesModal(true)}>
              <div className="stat-icon">🌟</div>
              <div className="stat-value gold">+20</div>
              <div className="stat-label">{t('protocol.bonus', 'All-Matches Bonus (BUY)')}</div>
            </div>

            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setShowRulesModal(true)}>
              <div className="stat-icon">🏆</div>
              <div className="stat-value gold">₹1.0L</div>
              <div className="stat-label">{t('protocol.seasonPrize', 'Season Prize (₹50k Buy / ₹50k Sell)')}</div>
            </div>
          </div>
        </div>

        {/* World-Class Corporate Footer */}
        <footer style={{ textAlign: 'center', padding: '48px 0 24px', borderTop: '1px solid var(--border-hairline)', marginTop: '48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
            <span>{t('footer.network', 'TVS Certified Network')}</span>
            <span>•</span>
            <span>{t('footer.cup', 'Dealer Super Cup 2026')}</span>
            <span>•</span>
            <span>{t('footer.motto', 'People • Platform • Progress')}</span>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
            {t('footer.disclaimer', 'Official TVS Certified Dealership Portal. All points and ranks are subject to automated verification.')}
          </p>
          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
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
              <span>{t('footer.termsModal', 'Official Terms & Conditions (Buyer & Seller Leagues)')}</span>
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
              {t('footer.standaloneTerms', 'Standalone Terms Page')}
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

export default function DashboardPage() {
  return (
    <DealerLanguageProvider>
      <DashboardContent />
    </DealerLanguageProvider>
  );
}
