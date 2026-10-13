'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import SwitchMode from '../components/watermelon/switch-mode';
import LanguageToggle from '../components/LanguageToggle';
import TickerMarquee from '../components/TickerMarquee';
import { DealerLanguageProvider, useDealerLanguage } from '../context/DealerLanguageContext';
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
  Scale,
} from 'lucide-react';
import TermsAndConditionsModal from '../components/TermsAndConditionsModal';
import { maskDealerName } from '@/lib/services/masking';

interface LeaderboardEntry {
  rank: number;
  dealer: string;
  dealerName?: string;
  maskedName?: string;
  realName?: string;
  isUnmasked?: boolean;
  isCurrentDealer?: boolean;
  externalId?: string;
  customerId?: string;
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
  dealerId?: number;
}

interface CampaignInfo {
  name: string;
  slug: string;
  isTestMode: boolean;
  startDate: string;
  endDate: string;
}

function LeaderboardContent() {
  const { t, isTamil } = useDealerLanguage();
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

  // Authenticated Dealer Profile & Position Telemetry
  const [currentDealerInfo, setCurrentDealerInfo] = useState<{
    dealerId: number;
    displayName: string;
    maskedName: string;
    city?: string;
    externalDealerId?: string;
  } | null>(null);
  const [dealerPosition, setDealerPosition] = useState<{
    rank: number;
    points: number;
    buyer?: { rank: number; points: number } | null;
    seller?: { rank: number; points: number } | null;
  } | null>(null);

  // Search & Pagination States - Default page size is 5 (Top 5 on Page 1)
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [jumpPageInput, setJumpPageInput] = useState('');

  const fetchLeaderboard = useCallback(async (forcedMaskedPreview?: boolean) => {
    try {
      const previewActive = typeof forcedMaskedPreview === 'boolean' ? forcedMaskedPreview : showMaskedPreview;
      const url = previewActive ? '/api/leaderboard?unmask=false' : '/api/leaderboard';
      const res = await fetch(url);
      const data = await res.json();
      if (data) {
        setBuyersLeaderboard(data.buyers || []);
        setSellersLeaderboard(data.sellers || []);
        setOverallLeaderboard(data.overall || []);
        setCounts({
          buyers: data.counts?.buyers || data.buyers?.length || 0,
          sellers: data.counts?.sellers || data.sellers?.length || 0,
          overall: data.counts?.overall || data.overall?.length || 0,
        });
        if (data.campaign) {
          setCampaign(data.campaign);
        }
        setIsAuthenticated(Boolean(data.authenticated || data.currentDealerId || data.currentDealer));
        setIsAdminUser(Boolean(data.isAdmin));
        if (data.currentDealer) {
          setCurrentDealerInfo(data.currentDealer);
        }
        if (data.dealerPosition) {
          setDealerPosition(data.dealerPosition);
        }
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [showMaskedPreview]);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(() => {
      fetchLeaderboard();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  const toggleMaskedPreview = () => {
    const nextPreviewState = !showMaskedPreview;
    setShowMaskedPreview(nextPreviewState);
    fetchLeaderboard(nextPreviewState);
  };

  const activeLeaderboard = useMemo(() => {
    if (activeTab === 'buyers') return buyersLeaderboard;
    if (activeTab === 'sellers') return sellersLeaderboard;
    return overallLeaderboard;
  }, [activeTab, buyersLeaderboard, sellersLeaderboard, overallLeaderboard]);

  const getDisplayName = useCallback((entry: LeaderboardEntry) => {
    if (isAdminUser && !showMaskedPreview) {
      return entry.realName || entry.dealerName || entry.dealer;
    }
    if (entry.isCurrentDealer) {
      return entry.dealerName || entry.realName || entry.dealer;
    }
    // Strict privacy: Competitor dealers are strictly masked
    return maskDealerName(entry.maskedName || entry.dealerName || entry.dealer || 'Dealer');
  }, [isAdminUser, showMaskedPreview]);

  // Client-side search filtering
  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return activeLeaderboard;
    const q = searchQuery.toLowerCase().trim();
    const rankNum = parseInt(q, 10);

    return activeLeaderboard.filter((entry) => {
      if (!isNaN(rankNum) && entry.rank === rankNum) {
        return true;
      }
      const dispName = (getDisplayName(entry) || '').toLowerCase();
      const city = (entry.city || '').toLowerCase();
      const category = (entry.category || '').toLowerCase();

      // STRICT PRIVACY: Competitor private information is NEVER searchable by participating dealers
      const canSearchPrivateDetails = isAdminUser && !showMaskedPreview;
      const isSelf = Boolean(entry.isCurrentDealer);
      const rawDealer = (canSearchPrivateDetails || isSelf) ? (entry.realName || entry.dealer || '').toLowerCase() : '';
      const custId = (canSearchPrivateDetails || isSelf) ? (entry.customerId || '').toLowerCase() : '';
      const custCode = (canSearchPrivateDetails || isSelf) ? (entry.customerCode || '').toLowerCase() : '';

      return (
        dispName.includes(q) ||
        (rawDealer && rawDealer.includes(q)) ||
        (custId && custId.includes(q)) ||
        (custCode && custCode.includes(q)) ||
        city.includes(q) ||
        category.includes(q)
      );
    });
  }, [activeLeaderboard, searchQuery, getDisplayName, isAdminUser, showMaskedPreview]);

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

  // Resolve current authenticated dealer's entry in active league
  const currentDealerEntry = useMemo(() => {
    // 1. In-list entry flagged as current dealer
    const inList = activeLeaderboard.find(
      (e) => e.isCurrentDealer || (currentDealerInfo && e.dealerId === currentDealerInfo.dealerId)
    );
    if (inList) return inList;

    // 2. If authenticated dealer has 0 points or was filtered out of active list
    if (currentDealerInfo) {
      const pos = activeTab === 'buyers' ? dealerPosition?.buyer : dealerPosition?.seller;
      return {
        rank: pos?.rank || (activeLeaderboard.length > 0 ? activeLeaderboard.length + 1 : 1),
        dealer: currentDealerInfo.displayName || currentDealerInfo.maskedName || 'Your Dealership',
        dealerName: currentDealerInfo.displayName || currentDealerInfo.maskedName,
        customerId: currentDealerInfo.externalDealerId || '',
        points: pos?.points || 0,
        isCurrentDealer: true,
        city: currentDealerInfo.city,
        category: 'Used Car Dealer',
      } as LeaderboardEntry;
    }

    return null;
  }, [activeLeaderboard, currentDealerInfo, dealerPosition, activeTab]);

  // Points target calculation for securing 1st place
  const top1Dealer = activeLeaderboard.length > 0 ? activeLeaderboard[0] : null;
  const top1Points = top1Dealer ? top1Dealer.points : 0;
  const myPoints = currentDealerEntry ? currentDealerEntry.points : 0;
  const myRank = currentDealerEntry ? currentDealerEntry.rank : null;
  const isMyFirstPlace = myRank === 1;

  // To secure 1st place, dealer needs to surpass current leader: (top1Points - myPoints + 1)
  const pointsNeededFor1st = isMyFirstPlace ? 0 : Math.max(1, (top1Points - myPoints) + 1);

  // Check if current dealer is already present in current page entries
  const isCurrentDealerInPage = useMemo(() => {
    if (!currentDealerEntry) return false;
    return paginatedEntries.some(
      (e) =>
        e.isCurrentDealer ||
        (currentDealerEntry.dealerId && e.dealerId === currentDealerEntry.dealerId) ||
        (currentDealerEntry.rank && e.rank === currentDealerEntry.rank)
    );
  }, [currentDealerEntry, paginatedEntries]);

  if (loading) {
    return (
      <div className="page-container">
        <nav className="navbar">
          <div className="navbar-inner">
            <div className="navbar-brand">
              <span className="navbar-logo">{t('leaderboard.brand', 'TVS Super Cup')}</span>
            </div>
            <div className="navbar-user">
              <LanguageToggle />
              <SwitchMode width={58} height={28} />
            </div>
          </div>
        </nav>
        <div className="loading-container" style={{ minHeight: '80vh' }}>
          <div className="loading-spinner"></div>
          <span>{t('leaderboard.loadingText', 'Loading leaderboard...')}</span>
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
            <span className="navbar-logo">{t('leaderboard.brand', 'TVS Super Cup')}</span>
            <span className="navbar-badge">{campaign?.isTestMode ? t('leaderboard.testMode', 'TEST MODE') : t('leaderboard.live', 'LIVE')}</span>
          </div>
          <ul className="navbar-nav">
            <li><span className="navbar-link active">{t('leaderboard.navStandings', 'Leaderboard')}</span></li>
            {isAuthenticated && (
              <li><Link href="/dashboard" className="navbar-link">{t('leaderboard.navDashboard', 'My Dashboard')}</Link></li>
            )}
            <li>
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="navbar-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{t('leaderboard.navTerms', 'Terms & Rules')}</span>
              </button>
            </li>
          </ul>
          <div className="navbar-user">
            <LanguageToggle />
            <SwitchMode width={58} height={28} />
            {isAuthenticated ? (
              <Link href="/dashboard" className="btn btn-primary btn-sm">{t('leaderboard.navDashboard', 'My Dashboard')}</Link>
            ) : (
              <Link href="/" className="btn btn-primary btn-sm">{t('leaderboard.signIn', 'Sign In')}</Link>
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
                  <span>{t('leaderboard.adminViewTitle', 'Admin Mission Control View')}</span>
                  <span className="admin-status-badge">
                    {showMaskedPreview ? t('leaderboard.adminMaskedBadge', '🔒 MASKED PREVIEW') : t('leaderboard.adminUnmaskedBadge', '👁️ UNMASKED (FULL VISIBILITY)')}
                  </span>
                </div>
                <p className="admin-banner-sub">
                  {showMaskedPreview
                    ? t('leaderboard.adminMaskedSub', 'Viewing leaderboard as participating dealers see it (competitor names masked).')
                    : t('leaderboard.adminUnmaskedSub', 'Full legal dealership names, TVS Customer IDs, and performance telemetry are visible to Admin.')}
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
                    <span>{t('leaderboard.switchUnmasked', 'Switch to Unmasked View')}</span>
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    <span>{t('leaderboard.previewMasked', 'Preview Dealer Masked View')}</span>
                  </>
                )}
              </button>
              <Link href="/admin" className="btn btn-primary btn-sm">
                {t('leaderboard.missionControlBtn', 'Mission Control')}
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
                  <span>{t('leaderboard.heroVerified', 'TVS Certified Network')}</span>
                </span>
                <span className="leaderboard-badge season">
                  <span className="pulsing-live-dot" />
                  <Radio className="w-3.5 h-3.5" />
                  <span>{t('leaderboard.heroPrizePool', 'Two Leaderboards • ₹1,00,000 Cash Pool')}</span>
                </span>
              </div>

              {/* Clean Executive Title */}
              <h1 className="leaderboard-hero-title">
                {t('leaderboard.heroTitle', 'DEALER')} <span className="hero-title-accent">{t('leaderboard.heroTitleAccent', 'SUPER CUP')}</span>
              </h1>

              {/* Informative Subtitle */}
              <p className="leaderboard-hero-subtitle">
                {t('leaderboard.heroSubtitle', 'Official national leaderboard for verified TVS dealerships across India. Compete in weekly high-velocity auctions and climb separate Buyer and Seller standings.')}
              </p>

              {/* High-Fidelity Telemetry Chips Bar */}
              <div className="leaderboard-telemetry-strip">
                <div className="telemetry-chip">
                  <span className="telemetry-chip-icon text-sky-500">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <span className="telemetry-chip-label">{t('leaderboard.telemetrySeason', 'Season:')}</span>
                  <span className="telemetry-chip-val">
                    {campaign
                      ? `${new Date(campaign.startDate).toLocaleDateString(isTamil ? 'ta-IN' : 'en-IN', { month: 'short', year: 'numeric' })} – ${new Date(campaign.endDate).toLocaleDateString(isTamil ? 'ta-IN' : 'en-IN', { month: 'short', year: 'numeric' })}`
                      : 'Season 2026–27'}
                  </span>
                </div>

                <div className="telemetry-chip">
                  <span className="telemetry-chip-icon text-emerald-500">
                    <Users className="w-4 h-4" />
                  </span>
                  <span className="telemetry-chip-label">
                    {activeTab === 'buyers' ? t('leaderboard.telemetryBuyers', 'Buyers:') : activeTab === 'sellers' ? t('leaderboard.telemetrySellers', 'Sellers:') : t('leaderboard.telemetryTotal', 'Total:')}
                  </span>
                  <span className="telemetry-chip-val">
                    {activeLeaderboard.length.toLocaleString('en-IN')} {t('leaderboard.telemetryActive', 'Active')}
                  </span>
                </div>

                <div className="telemetry-chip">
                  <span className="telemetry-chip-icon text-amber-500">
                    <Award className="w-4 h-4" />
                  </span>
                  <span className="telemetry-chip-label">{t('leaderboard.telemetryPodium', 'Podium:')}</span>
                  <span className="telemetry-chip-val">
                    {t('leaderboard.telemetryPoolVal', '₹50,000 League Pool')}
                  </span>
                </div>

                <div className="telemetry-chip">
                  <span className="telemetry-chip-icon text-indigo-500">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <span className="telemetry-chip-label">{t('leaderboard.telemetryScoring', 'Scoring:')}</span>
                  <span className="telemetry-chip-val">{t('leaderboard.telemetryScoringVal', 'Verified TVS Telemetry')}</span>
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
              <span>{t('leaderboard.tabBuyer', 'Buyer Leaderboard')}</span>
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
              <span>{t('leaderboard.tabSeller', 'Seller Leaderboard')}</span>
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
                    ? t('leaderboard.podiumHeaderBuyers', 'Top 3 Buyers Podium • ₹50,000 Cash Pool')
                    : t('leaderboard.podiumHeaderSellers', 'Top 3 Sellers Podium • ₹50,000 Cash Pool')}
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
                        ? (isChampion ? t('leaderboard.topBuyer1', 'Top Buyer • #1') : isRunnerUp ? t('leaderboard.podiumBuyer2', 'Podium 2nd Buyer • #2') : t('leaderboard.podiumBuyer3', 'Podium 3rd Buyer • #3'))
                        : (isChampion ? t('leaderboard.topSeller1', 'Top Seller • #1') : isRunnerUp ? t('leaderboard.podiumSeller2', 'Podium 2nd Seller • #2') : t('leaderboard.podiumSeller3', 'Podium 3rd Seller • #3'))}
                    </span>

                    <h3 className="podium-dealer-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                      <span>{getDisplayName(entry)}</span>
                      {entry.isCurrentDealer && (
                        <span className="you-pill">{t('leaderboard.you', 'YOU')}</span>
                      )}
                    </h3>

                    <div className="podium-score-wrap">
                      <span className="podium-points-value">
                        {entry.points.toLocaleString('en-IN')}
                      </span>
                      <span className="podium-points-label">
                        {activeTab === 'buyers' ? t('leaderboard.buyerPointsLabel', 'Buyer Points') : t('leaderboard.sellerPointsLabel', 'Seller Points')}
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
                    ? t('leaderboard.rankingsTitleBuyers', 'Official Buyer Rankings')
                    : t('leaderboard.rankingsTitleSellers', 'Official Seller Rankings')}
                </span>
              </h2>
              <p className="card-subtitle">
                {lastUpdated
                  ? t('leaderboard.liveSyncedAt', 'Live synced at {time}', { time: lastUpdated.toLocaleTimeString(isTamil ? 'ta-IN' : 'en-IN') })
                  : t('leaderboard.liveSyncingActive', 'Live syncing active')}
                {' '}
                {t('leaderboard.refreshNotice', '• Automated 30-second refresh • Verified Standings')}
              </p>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => fetchLeaderboard()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('leaderboard.refreshBtn', 'Refresh Standings')}</span>
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
                placeholder={t('leaderboard.searchPlaceholder', 'Search dealership name or rank #...')}
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
                {t('leaderboard.rowsPerPage', 'Rows per page:')}
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
                <option value={5}>{t('leaderboard.rows5', '5 rows (Top 5)')}</option>
                <option value={10}>{t('leaderboard.rows10', '10 rows')}</option>
                <option value={25}>{t('leaderboard.rows25', '25 rows')}</option>
                <option value={50}>{t('leaderboard.rows50', '50 rows')}</option>
                <option value={100}>{t('leaderboard.rows100', '100 rows')}</option>
                <option value={0}>{t('leaderboard.rowsAll', 'All Dealerships')}</option>
              </select>
            </div>

            {/* Counter Summary */}
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              {searchQuery ? (
                <span>
                  {t('leaderboard.foundMatching', 'Found {count} matching dealerships', { count: filteredLeaderboard.length })}
                </span>
              ) : (
                <span>
                  {t('leaderboard.showingRange', 'Showing {start}–{end} of {total} dealerships', {
                    start: startRecord,
                    end: endRecord,
                    total: activeLeaderboard.length.toLocaleString('en-IN'),
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Dealer Championship Position Spotlight & Motivational Callout Banner */}
          {currentDealerEntry && (
            <div className="dealer-position-spotlight-card" role="region" aria-label="Dealer Position Spotlight">
              <div className="spotlight-left">
                <div className={`spotlight-badge-icon ${isMyFirstPlace ? 'champion' : 'contender'}`}>
                  {isMyFirstPlace ? (
                    <Crown className="w-6 h-6 text-amber-400" />
                  ) : (
                    <TrendingUp className="w-6 h-6 text-sky-400" />
                  )}
                </div>
                <div className="spotlight-text-content">
                  <div className="spotlight-eyebrow-row">
                    <span className="spotlight-eyebrow">{t('leaderboard.myPositionEyebrow', 'MY CHAMPIONSHIP STANDING')}</span>
                    <span className="spotlight-active-dot" />
                    <span className="spotlight-status-label">{t('leaderboard.verifiedPosition', 'VERIFIED POSITION')}</span>
                  </div>
                  <h3 className="spotlight-dealer-title">
                    <span>{getDisplayName(currentDealerEntry)}</span>
                    <span className="you-pill">{t('leaderboard.you', 'YOU')}</span>
                  </h3>
                  <p className="spotlight-message">
                    {isMyFirstPlace ? (
                      t('leaderboard.championMsg', 'You are currently in 1st place! Keep bidding to defend your championship crown!')
                    ) : (
                      t('leaderboard.bidMoreToWinMsg', 'Bid more to win! You need {points} more points to secure 1st place (Leader has {top1} pts). Compete in upcoming live auctions to climb the standings!', {
                        points: pointsNeededFor1st,
                        top1: top1Points,
                      })
                    )}
                  </p>
                </div>
              </div>

              <div className="spotlight-metrics-group">
                <div className="spotlight-metric-chip">
                  <span className="metric-chip-label">{t('leaderboard.metricCurrentRank', 'CURRENT RANK')}</span>
                  <span className="metric-chip-value">#{currentDealerEntry.rank}</span>
                </div>

                <div className="spotlight-metric-chip">
                  <span className="metric-chip-label">
                    {activeTab === 'buyers' ? t('leaderboard.metricBuyerPoints', 'BUYER POINTS') : t('leaderboard.metricSellerPoints', 'SELLER POINTS')}
                  </span>
                  <span className="metric-chip-value text-sky-400">{myPoints.toLocaleString('en-IN')}</span>
                </div>

                <div className={`spotlight-metric-chip highlight-target ${isMyFirstPlace ? 'champion' : ''}`}>
                  <span className="metric-chip-label">{t('leaderboard.metricTo1stPlace', 'TO SECURE 1ST PLACE')}</span>
                  <span className="metric-chip-value highlight-value">
                    {isMyFirstPlace ? 'CHAMPION' : `+${pointsNeededFor1st} PTS`}
                  </span>
                  <span className="metric-chip-sub">
                    {isMyFirstPlace ? t('leaderboard.leadSecured', 'Lead Secured') : t('leaderboard.bidMoreBadge', 'Bid more to win!')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Table Container */}
          {paginatedEntries.length > 0 ? (
            <div className="leaderboard-table-container">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center', width: '80px' }}>{t('leaderboard.thRank', 'Rank')}</th>
                    <th>{t('leaderboard.thDealership', 'Dealership Name')}</th>
                    <th style={{ textAlign: 'right', width: '160px' }}>
                      {activeTab === 'buyers' ? t('leaderboard.thBuyerPoints', 'Buyer Points') : t('leaderboard.thSellerPoints', 'Seller Points')}
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

                        {/* Dealership Name & Category */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                {getDisplayName(entry)}
                              </span>
                              {entry.isCurrentDealer && (
                                <span className="you-pill">{t('leaderboard.you', 'YOU')}</span>
                              )}
                              {entry.rank <= 3 && (
                                <span className={`podium-standing-tag ${isTop1 ? 'rank-1' : isTop2 ? 'rank-2' : 'rank-3'}`} style={{ margin: 0, padding: '1px 7px', fontSize: '0.62rem' }}>
                                  {isTop1 ? t('leaderboard.badgeChampion', 'CHAMPION') : isTop2 ? t('leaderboard.badge2nd', '2ND PODIUM') : t('leaderboard.badge3rd', '3RD PODIUM')}
                                </span>
                              )}
                            </div>
                            {entry.isCurrentDealer && (
                              <div className="bid-more-subtext">
                                {isMyFirstPlace ? (
                                  <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
                                    👑 {t('leaderboard.championLeadingMsgShort', 'Rank #1 • Defend your championship lead!')}
                                  </span>
                                ) : (
                                  <span>
                                    <span className="flame-icon">🔥</span>
                                    {t('leaderboard.bidMoreCalloutInline', 'Need {points} pts to secure 1st place • Bid more to win!', { points: pointsNeededFor1st })}
                                  </span>
                                )}
                              </div>
                            )}
                            {entry.category && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {entry.category}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Points */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span className="points-pill">
                              {entry.points.toLocaleString('en-IN')}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {activeTab === 'buyers' ? t('leaderboard.buyerPtsSub', 'Buyer Pts') : t('leaderboard.sellerPtsSub', 'Seller Pts')}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Logged-in Dealer Position Pinned to Page 1 if not in top 5 */}
                  {currentPage === 1 && currentDealerEntry && !isCurrentDealerInPage && (
                    <>
                      <tr className="current-dealer-separator-row" key="dealer-position-separator">
                        <td colSpan={3}>
                          <div className="current-dealer-separator-wrap">
                            <span className="separator-line" />
                            <span className="separator-tag">
                              <Crown className="w-3.5 h-3.5 text-amber-500" />
                              <span>{t('leaderboard.yourStandingDivider', 'YOUR CURRENT POSITION')}</span>
                            </span>
                            <span className="separator-line" />
                          </div>
                        </td>
                      </tr>

                      <tr
                        key={`pinned-self-${currentDealerEntry.rank}-${currentDealerEntry.dealer}`}
                        className="leaderboard-row current-dealer-row pinned-dealer-row"
                      >
                        {/* Rank */}
                        <td style={{ textAlign: 'center' }}>
                          <span className="rank-cell-content rank-user-pinned">
                            {currentDealerEntry.rank}
                          </span>
                        </td>

                        {/* Dealership Name & Motivational Callout */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                {getDisplayName(currentDealerEntry)}
                              </span>
                              <span className="you-pill">{t('leaderboard.you', 'YOU')}</span>
                              <span className="pinned-position-pill">
                                {t('leaderboard.yourPosition', 'Your Position')}
                              </span>
                            </div>
                            <div className="bid-more-subtext">
                              <span className="flame-icon">🔥</span>
                              <span>
                                {t('leaderboard.bidMoreCalloutInline', 'Need {points} pts to secure 1st place • Bid more to win!', { points: pointsNeededFor1st })}
                              </span>
                            </div>
                            {currentDealerEntry.category && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {currentDealerEntry.category}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Points */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span className="points-pill current-dealer-points-pill">
                              {currentDealerEntry.points.toLocaleString('en-IN')}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {activeTab === 'buyers' ? t('leaderboard.buyerPtsSub', 'Buyer Pts') : t('leaderboard.sellerPtsSub', 'Seller Pts')}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </>
                  )}
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
                {searchQuery ? t('leaderboard.noMatchingTitle', 'No matching dealerships found') : t('leaderboard.standingsInitTitle', 'Standings Initializing')}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                {searchQuery
                  ? t('leaderboard.noMatchingMsg', 'No dealerships matched "{query}". Please check your search term or dealer rank number.', { query: searchQuery })
                  : t('leaderboard.standingsInitMsg', 'Leaderboard points calculate automatically following verified auction transactions and dealer actions.')}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSearchQuery('')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{t('leaderboard.clearSearchBtn', 'Clear Search Filter')}</span>
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
                {t('leaderboard.paginationShowing', 'Showing {start} to {end} of {total} dealerships • Page {page} of {pages}', {
                  start: startRecord,
                  end: endRecord,
                  total: filteredLeaderboard.length.toLocaleString('en-IN'),
                  page: currentPage,
                  pages: totalPages,
                })}
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
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('leaderboard.goToPage', 'Go to:')}</span>
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
                  {t('leaderboard.goBtn', 'Go')}
                </button>
              </form>
            </div>
          )}
        </section>

        {/* Corporate Footer */}
        <footer style={{ textAlign: 'center', padding: '48px 0 24px', color: 'var(--text-muted)', fontSize: '0.8rem', borderTop: '1px solid var(--border-hairline)', marginTop: '48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontSize: '0.74rem', marginBottom: '8px' }}>
            <span>{t('footer.network', 'TVS Certified Network')}</span>
            <span>•</span>
            <span>{t('footer.cup', 'Dealer Super Cup 2026')}</span>
            <span>•</span>
            <span>{t('leaderboard.live', 'LIVE')}</span>
          </div>
          <p style={{ marginTop: 'var(--space-xs)', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
            {t('leaderboard.footerAuctions', 'High-velocity dealer auctions every Thursday at 2:00 PM • Verified points synced in real-time')}
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
              <span>{t('leaderboard.footerTermsBtn', 'Official Terms & Conditions (Buyer & Seller Leagues)')}</span>
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
              {t('leaderboard.footerTermsPage', 'Standalone Terms Page')}
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

export default function LeaderboardPage() {
  return (
    <DealerLanguageProvider>
      <LeaderboardContent />
    </DealerLanguageProvider>
  );
}
