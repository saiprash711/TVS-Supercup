'use client';

import React from 'react';
import Link from 'next/link';
import {
  Scale,
  ShieldCheck,
  Trophy,
  ShoppingCart,
  Store,
  Gavel,
  Radio,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  IndianRupee,
  Sparkles
} from 'lucide-react';
import TickerMarquee from '../components/TickerMarquee';
import SwitchMode from '../components/watermelon/switch-mode';
import LanguageToggle from '../components/LanguageToggle';
import { DealerLanguageProvider, useDealerLanguage } from '../context/DealerLanguageContext';

function TermsContent() {
  const { t } = useDealerLanguage();

  return (
    <div className="page-container">
      {/* Navigation */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand">
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="navbar-logo">{t('navbar.brand', 'TVS Super Cup')}</span>
            </Link>
            <span className="navbar-badge">{t('terms.officialTermsBadge', 'OFFICIAL TERMS')}</span>
          </div>
          <ul className="navbar-nav">
            <li>
              <Link href="/" className="navbar-link">
                {t('terms.navHome', 'Home')}
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="navbar-link">
                {t('terms.navDashboard', 'Dashboard')}
              </Link>
            </li>
            <li>
              <span className="navbar-link active">{t('terms.navTerms', 'Terms & Conditions')}</span>
            </li>
          </ul>
          <div className="navbar-user">
            <LanguageToggle />
            <SwitchMode width={58} height={28} />
            <Link href="/" className="btn btn-outline btn-sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>{t('terms.backToLogin', 'Dealer Sign In')}</span>
            </Link>
          </div>
        </div>
      </nav>

      <TickerMarquee
        customItems={[
          {
            label: t('ticker.champStatus', 'TOURNAMENT REGULATIONS'),
            value: t('termsModal.subtitle', 'OFFICIAL 2026–27 TERMS & CONDITIONS • GOVERNED BY TVS CERTIFIED'),
            badge: 'OFFICIAL',
            type: 'neutral',
          },
          {
            label: t('ticker.buyingAlloc', 'BUYER ALLOCATIONS'),
            value: t('ticker.buyingAllocVal', 'BIDS PER CAR BASIS (+1 PT) • MATCH ATTENDANCE (+1 PT) • ALL-MATCHES BONUS (+20 PTS)'),
            badge: 'BUYING',
            type: 'positive',
          },
          {
            label: t('ticker.sellingAlloc', 'SELLER ALLOCATIONS'),
            value: t('ticker.sellingAllocVal', 'VEHICLE LISTINGS (+5 PTS) • COMMISSION SETTLEMENT (+5 PTS)'),
            badge: 'SELLING',
            type: 'positive',
          },
          {
            label: t('ticker.podium', 'EQUAL POINTS POLICY'),
            value: t('terms.sec4TieSplitDesc', 'TIED PODIUM PLACES SPLIT COMBINED PRIZE POOL EQUALLY'),
            badge: 'PRIZES',
            type: 'accent',
          },
        ]}
      />

      <main className="content-wrapper" style={{ maxWidth: '980px', margin: '0 auto', padding: '32px 20px 80px' }}>
        {/* Hero Header */}
        <header style={{ marginBottom: '36px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontSize: '0.8rem',
              color: 'var(--accent-cyan)',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '14px',
            }}
          >
            <Scale className="w-4 h-4" />
            <span>{t('terms.heroEyebrow', 'TVS Certified Dealer Super Cup 2026–27')}</span>
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
            {t('terms.heroTitle', 'Official Terms & Conditions')}
          </h1>

          <p style={{ maxWidth: '680px', margin: '0 auto', color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
            {t('terms.heroSubtitle', 'Comprehensive rules, scoring formulas, league divisions, and prize distribution policies. Transparent, audited, and telemetry-verified competition across all registered dealerships.')}
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              marginTop: '18px',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>{t('terms.seasonDates', 'Season: 15 Oct 2026 – 31 Jan 2027')}</span>
            </div>
            <span>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IndianRupee className="w-4 h-4 text-amber-400" />
              <span>{t('terms.prizePurse', 'Prize Purse: ₹1,00,000 (₹1 Lakh)')}</span>
            </div>
            <span>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t('terms.auditedCompliance', 'Audited Compliance')}</span>
            </div>
          </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* ── 1. LEAGUE ARCHITECTURE & INDEPENDENT RANKING ── */}
          <section className="card" style={{ padding: '28px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {t('terms.sec1Title', '1. Championship Structure & League Separation')}
              </h2>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '16px' }}>
              {t('terms.sec1Intro', 'The TVS Certified Super Cup operates under a dual-league tournament format. Dealerships compete in two separate streams based on their platform activities:')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '14px', padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)', fontWeight: 800, marginBottom: '8px' }}>
                  <ShoppingCart className="w-4 h-4" />
                  <span>{t('terms.sec1BuyerLeague', 'Buyer League')}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {t('terms.sec1BuyerDesc', 'Ranked strictly by Buyer Points earned from bidding on unique cars, attending live auction sessions, and earning the All-Matches Attendance Bonus.')}
                </p>
              </div>

              <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '14px', padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontWeight: 800, marginBottom: '8px' }}>
                  <Store className="w-4 h-4" />
                  <span>{t('terms.sec1SellerLeague', 'Seller League')}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {t('terms.sec1SellerDesc', 'Ranked strictly by Seller Points earned from publishing vehicle auction consignments and verified commission settlements.')}
                </p>
              </div>
            </div>

            <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-hairline)', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong className="text-white">{t('terms.sec1CrucialRule', 'Crucial Regulation — No Total Dealer Points:')}</strong>
              <br />
              {t('terms.sec1CrucialDesc', 'Buyer points and Seller points are not combined. Awards, cash prizes, and leaderboard standings are awarded strictly inside the separate Buyer League and Seller League. Total dealer score is not used to determine any tournament winners.')}
            </div>
          </section>

          {/* ── 2. BUYER LEAGUE SCORING & PER CAR BIDDING ── */}
          <section className="card" style={{ padding: '28px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <ShoppingCart className="w-5 h-5 text-blue-400" />
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {t('terms.sec2Title', '2. Buyer Terms & Scoring Allocation')}
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '18px 20px', borderRadius: '14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-hairline)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '6px' }}>
                  <Gavel className="w-4 h-4" />
                  <span>{t('terms.sec2BidsTitle', 'Auction Bids (Per-Car Basis): 1 Point Per Unique Vehicle')}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  {t('terms.sec2BidsDesc', 'Bidding points are strictly awarded on a per-car basis. Placing one or more bids on a vehicle lot awards exactly 1 point for that car. Multiple bids or increments on the same vehicle lot do not yield additional points. This policy prevents point farming on single lots and rewards active multi-lot bidding participation.')}
                </p>
              </div>

              <div style={{ padding: '18px 20px', borderRadius: '14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-hairline)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-amber)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '6px' }}>
                  <Radio className="w-4 h-4" />
                  <span>{t('terms.sec2AttendanceTitle', 'Match Day Participation: 1 Point Per Thursday Match')}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  {t('terms.sec2AttendanceDesc', 'Logging in and actively participating in an official Thursday 2:00 PM auction session earns 1 attendance point per match day.')}
                </p>
              </div>

              <div style={{ padding: '18px 20px', borderRadius: '14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-hairline)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '6px' }}>
                  <Sparkles className="w-4 h-4" />
                  <span>{t('terms.sec2BonusTitle', 'All-Matches Attendance Bonus: +20 Points')}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  {t('terms.sec2BonusDesc', 'Dealers who maintain flawless attendance and participate in all 14 official Thursday matches throughout the campaign unlock a massive 20-point loyalty bonus at season conclusion.')}
                </p>
              </div>
            </div>
          </section>

          {/* ── 3. SELLER LEAGUE SCORING ── */}
          <section className="card" style={{ padding: '28px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Store className="w-5 h-5 text-sky-400" />
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {t('terms.sec3Title', '3. Seller Terms & Scoring Allocation')}
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '18px 20px', borderRadius: '14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-hairline)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '6px' }}>
                  <Layers className="w-4 h-4" />
                  <span>{t('terms.sec3ListingsTitle', 'Vehicle Listings: 5 Points Per Published Vehicle')}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  {t('terms.sec3ListingsDesc', 'Earn 5 points for every inspected and verified vehicle lot listed into the TVS Certified auction network.')}
                </p>
              </div>

              <div style={{ padding: '18px 20px', borderRadius: '14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-hairline)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '6px' }}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('terms.sec3SettlementTitle', 'Commission Settlements: 5 Points Per Settled Transaction')}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  {t('terms.sec3SettlementDesc', 'Earn 5 points for every successfully closed and settled vehicle transaction following auction conclusion.')}
                </p>
              </div>
            </div>
          </section>

          {/* ── 4. PRIZE POOL & TIE-BREAKER CLAUSE ── */}
          <section
            className="card"
            style={{
              padding: '28px 32px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(54, 78, 162, 0.08))',
              border: '1px solid rgba(245, 158, 11, 0.35)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {t('terms.sec4Title', '4. Grand Finale Awards & Cash Distribution')}
              </h2>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '20px' }}>
              {t('prize.seasonTotal', '₹1,00,000 Total Cash Awards')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--bg-card)', padding: '18px 20px', borderRadius: '14px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <div style={{ color: 'var(--accent-blue)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                  {t('terms.sec4BuyerPodium', 'Buyer League Podium (₹50,000 Total)')}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  • {t('terms.sec41stPlace', '1st Place Champion: ₹25,000 Cash Purse + Trophy')}<br />
                  • {t('terms.sec42ndPlace', '2nd Place Runner-Up: ₹15,000 Cash Purse + Silver Plaque')}<br />
                  • {t('terms.sec43rdPlace', '3rd Place 2nd Runner-Up: ₹10,000 Cash Purse + Bronze Plaque')}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '18px 20px', borderRadius: '14px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                <div style={{ color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                  {t('terms.sec4SellerPodium', 'Seller League Podium (₹50,000 Total)')}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  • {t('terms.sec41stPlace', '1st Place Champion: ₹25,000 Cash Purse + Trophy')}<br />
                  • {t('terms.sec42ndPlace', '2nd Place Runner-Up: ₹15,000 Cash Purse + Silver Plaque')}<br />
                  • {t('terms.sec43rdPlace', '3rd Place 2nd Runner-Up: ₹10,000 Cash Purse + Bronze Plaque')}
                </div>
              </div>
            </div>

            {/* Tie-breaker detailed breakdown */}
            <div style={{ background: 'var(--bg-card)', padding: '22px 24px', borderRadius: '14px', border: '1px solid rgba(245, 158, 11, 0.35)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 800, fontSize: '1rem', marginBottom: '10px' }}>
                <Scale className="w-5 h-5" />
                <span>{t('terms.sec4TieSplit', 'Equal Points Tie-Breaker Policy (Split Purse):')}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {t('terms.sec4TieSplitDesc', 'If two or more dealerships tie on total league points for any podium spot, the combined cash purse of the tied spots is divided equally between the tied dealers. No subjective tie-breakers are used.')}
              </p>
            </div>
          </section>

          {/* ── 5. FAIR PLAY & AUDITING ── */}
          <section className="card" style={{ padding: '28px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {t('terms.sec5Title', '5. Compliance, Disputes & Governance')}
              </h2>
            </div>

            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.75 }}>
              {t('terms.sec5Desc', 'All telemetry records, bids, and listings are logged by TVS Certified auction systems. In case of discrepancies, the audit trail of the central auction engine shall be final and binding. In case of any conflicts or disputes, the matter shall be subjected to the exclusive jurisdiction and authority of the TVS Certified Madhavaram Office, Chennai.')}
            </p>
          </section>
        </div>

        {/* Back Actions */}
        <div style={{ marginTop: '40px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link href="/" className="btn btn-primary btn-lg">
            <span>{t('terms.backToLogin', 'Dealer Sign In')}</span>
          </Link>
          <Link href="/dashboard" className="btn btn-outline btn-lg">
            <span>{t('terms.navDashboard', 'Dealer Dashboard')}</span>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function TermsPage() {
  return (
    <DealerLanguageProvider>
      <TermsContent />
    </DealerLanguageProvider>
  );
}
