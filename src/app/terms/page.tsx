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

export default function TermsPage() {
  return (
    <div className="page-container">
      {/* Navigation */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand">
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="navbar-logo">TVS Super Cup</span>
            </Link>
            <span className="navbar-badge">OFFICIAL TERMS</span>
          </div>
          <ul className="navbar-nav">
            <li>
              <Link href="/leaderboard" className="navbar-link">
                Leaderboard
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="navbar-link">
                Dashboard
              </Link>
            </li>
            <li>
              <span className="navbar-link active">Terms & Conditions</span>
            </li>
          </ul>
          <div className="navbar-user">
            <SwitchMode width={58} height={28} />
            <Link href="/leaderboard" className="btn btn-outline btn-sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>Back to Standings</span>
            </Link>
          </div>
        </div>
      </nav>

      <TickerMarquee
        customItems={[
          {
            label: 'TOURNAMENT REGULATIONS',
            value: 'OFFICIAL 2026–27 TERMS & CONDITIONS • GOVERNED BY TVS CERTIFIED',
            badge: 'OFFICIAL',
            type: 'neutral',
          },
          {
            label: 'BUYER ALLOCATIONS',
            value: 'BIDS PER CAR BASIS (+1 PT) • MATCH ATTENDANCE (+1 PT) • ALL-MATCHES BONUS (+20 PTS)',
            badge: 'BUYING',
            type: 'positive',
          },
          {
            label: 'SELLER ALLOCATIONS',
            value: 'VEHICLE LISTINGS (+5 PTS) • COMMISSION SETTLEMENT (+5 PTS)',
            badge: 'SELLING',
            type: 'positive',
          },
          {
            label: 'EQUAL POINTS POLICY',
            value: 'TIED PODIUM PLACES SPLIT COMBINED PRIZE POOL EQUALLY',
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
            <span>TVS Certified Dealer Super Cup 2026–27</span>
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Official Terms & Conditions
          </h1>

          <p style={{ maxWidth: '680px', margin: '0 auto', color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
            Comprehensive rules, scoring formulas, league divisions, and prize distribution policies.
            Transparent, audited, and telemetry-verified competition across all registered dealerships.
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
              <span>Season: 15 Oct 2026 – 14 Jan 2027</span>
            </div>
            <span>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IndianRupee className="w-4 h-4 text-amber-400" />
              <span>Prize Purse: ₹1,00,000 (₹1 Lakh)</span>
            </div>
            <span>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Audited Compliance</span>
            </div>
          </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* ── 1. LEAGUE ARCHITECTURE & INDEPENDENT RANKING ── */}
          <section className="card" style={{ padding: '28px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                1. Championship Structure & League Separation
              </h2>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '16px' }}>
              The TVS Certified Super Cup operates under a <strong>dual-league tournament format</strong>.
              Dealerships compete in two separate streams based on their platform activities:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '14px', padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)', fontWeight: 800, marginBottom: '8px' }}>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Buyer League</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Ranked strictly by <strong>Buyer Points</strong> earned from bidding on unique cars, attending live auction sessions, and earning the All-Matches Attendance Bonus.
                </p>
              </div>

              <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '14px', padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontWeight: 800, marginBottom: '8px' }}>
                  <Store className="w-4 h-4" />
                  <span>Seller League</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Ranked strictly by <strong>Seller Points</strong> earned from publishing vehicle auction consignments and verified commission settlements.
                </p>
              </div>
            </div>

            <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-hairline)', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong className="text-white">Crucial Regulation — No Total Dealer Points:</strong>
              <br />
              Buyer points and Seller points are not combined. Awards, cash prizes, and leaderboard standings are awarded strictly inside the separate Buyer League and Seller League. Total dealer score is not used to determine any tournament winners.
            </div>
          </section>

          {/* ── 2. BUYER LEAGUE SCORING & PER CAR BIDDING ── */}
          <section className="card" style={{ padding: '28px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <ShoppingCart className="w-5 h-5 text-blue-400" />
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                2. Buyer Terms & Scoring Allocation
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '18px 20px', borderRadius: '14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-hairline)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '6px' }}>
                  <Gavel className="w-4 h-4" />
                  <span>Auction Bids (Per-Car Basis): 1 Point Per Unique Vehicle</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  Bidding points are strictly awarded on a <strong>per-car basis</strong>. Placing one or more bids on a vehicle lot awards exactly <strong>1 point for that car</strong>.
                  Multiple bids or increments on the same vehicle lot do not yield additional points. This policy prevents point farming on single lots and rewards active multi-lot bidding participation.
                </p>
              </div>

              <div style={{ padding: '18px 20px', borderRadius: '14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-hairline)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-amber)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '6px' }}>
                  <Radio className="w-4 h-4" />
                  <span>Match Day Participation: 1 Point Per Thursday Match</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  Buyers earn <strong>1 point for attending and logging into</strong> each scheduled Thursday live auction match. Attendance is automatically captured via digital entrance telemetry or active bidding.
                </p>
              </div>

              <div style={{ padding: '18px 20px', borderRadius: '14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-hairline)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '6px' }}>
                  <Sparkles className="w-4 h-4" />
                  <span>All-Matches Attendance Bonus: +20 Points</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  Buyers who participate in <strong>100% of the tournament matches</strong> across the campaign window receive a <strong>+20 Bonus Points</strong> credit added to their final Buyer League tally.
                </p>
              </div>
            </div>
          </section>

          {/* ── 3. SELLER LEAGUE SCORING ── */}
          <section className="card" style={{ padding: '28px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Store className="w-5 h-5 text-sky-400" />
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                3. Seller Terms & Scoring Allocation
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '18px 20px', borderRadius: '14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-hairline)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '6px' }}>
                  <Layers className="w-4 h-4" />
                  <span>Vehicle Listings: 5 Points Per Vehicle Consigned</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  Sellers earn <strong>5 points for every vehicle</strong> consigned, inspected, and listed on the TVS Certified digital auction catalog.
                </p>
              </div>

              <div style={{ padding: '18px 20px', borderRadius: '14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-hairline)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '6px' }}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Commission Settlement: 5 Points Per Settlement</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  Sellers earn <strong>5 points per completed commission clearance</strong> and verified settlement allocation processed within the auction accounting cycle.
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
                4. Prize Pool Distribution & Equal Points Tie-Breaker Clause
              </h2>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '20px' }}>
              The championship features a guaranteed <strong>₹1,00,000 Total Prize Purse</strong>, structured as:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--bg-card)', padding: '18px 20px', borderRadius: '14px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <div style={{ color: 'var(--accent-blue)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Buyer League Purse (₹50,000)
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  • 1st Place Champion: <strong>₹25,000</strong><br />
                  • 2nd Place Runner-Up: <strong>₹15,000</strong><br />
                  • 3rd Place Third: <strong>₹10,000</strong>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '18px 20px', borderRadius: '14px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                <div style={{ color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Seller League Purse (₹50,000)
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  • 1st Place Champion: <strong>₹25,000</strong><br />
                  • 2nd Place Runner-Up: <strong>₹15,000</strong><br />
                  • 3rd Place Third: <strong>₹10,000</strong>
                </div>
              </div>
            </div>

            {/* Tie-breaker detailed breakdown */}
            <div style={{ background: 'var(--bg-card)', padding: '22px 24px', borderRadius: '14px', border: '1px solid rgba(245, 158, 11, 0.35)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 800, fontSize: '1rem', marginBottom: '10px' }}>
                <Scale className="w-5 h-5" />
                <span>Equal Points Prize Distribution Rule (Tie-Breaker Policy)</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                If two or more buyers or sellers finish with the <strong>exact same amount of points</strong> in a podium position, the prize money for the tied positions is <strong>combined and split equally</strong> among all tied dealerships.
              </p>

              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-subtle)', fontSize: '0.84rem' }}>
                  <strong className="text-white">Example A: Two Dealers Tie for 1st Place</strong>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                    The 1st Place prize (₹25,000) and 2nd Place prize (₹15,000) are pooled together (total ₹40,000) and divided equally:
                    <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, marginLeft: '6px' }}>₹20,000 to each dealer</span>.
                    The next highest scorer receives the 3rd Place prize (₹10,000).
                  </div>
                </div>

                <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-subtle)', fontSize: '0.84rem' }}>
                  <strong className="text-white">Example B: Three Dealers Tie for 1st Place</strong>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                    All three podium prizes (₹25,000 + ₹15,000 + ₹10,000 = ₹50,000) are pooled and divided equally:
                    <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, marginLeft: '6px' }}>₹16,666.67 to each dealer</span>.
                  </div>
                </div>

                <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-subtle)', fontSize: '0.84rem' }}>
                  <strong className="text-white">Example C: Two Dealers Tie for 2nd Place</strong>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                    The 1st Place winner receives ₹25,000. The 2nd Place (₹15,000) and 3rd Place (₹10,000) prizes are pooled (₹25,000) and split equally:
                    <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, marginLeft: '6px' }}>₹12,500 to each dealer</span>.
                  </div>
                </div>

                <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-subtle)', fontSize: '0.84rem' }}>
                  <strong className="text-white">Example D: Two Dealers Tie for 3rd Place</strong>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                    1st and 2nd receive their full prizes (₹25,000 and ₹15,000). The 3rd Place prize (₹10,000) is split equally:
                    <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, marginLeft: '6px' }}>₹5,000 to each dealer</span>.
                  </div>
                </div>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              *Digital podium display ordering utilizes secondary metrics (unique cars bid on/listings count, followed by earliest timestamp of point achievement), but <strong>actual cash prizes are disbursed in equal splits as specified above</strong>.
            </p>
          </section>

          {/* ── 5. FAIR PLAY & AUDITING ── */}
          <section className="card" style={{ padding: '28px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                5. Fair Play, Verification & Compliance
              </h2>
            </div>

            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.75 }}>
              <li>
                <strong>Automated Audit Verification:</strong> Every point accrued is audited via TVS Certified live platform telemetry logs. Unverified or synthetic activities will be discarded.
              </li>
              <li>
                <strong>Disqualification:</strong> Collusive bidding, automated bots, fake listings, or fraudulent attempts to manipulate points will result in immediate zeroing of points and permanent tournament expulsion.
              </li>
              <li>
                <strong>Disbursement:</strong> Cash prize payouts will be transferred directly to the verified corporate bank account of the registered dealership following standard KYC and tax deduction (TDS) compliance within 14 business days of final audit approval.
              </li>
            </ul>
          </section>
        </div>

        {/* Back Actions */}
        <div style={{ marginTop: '40px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <Link href="/leaderboard" className="btn btn-primary btn-lg">
            <span>View Live Leaderboard</span>
          </Link>
          <Link href="/dashboard" className="btn btn-outline btn-lg">
            <span>Go to My Dashboard</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
