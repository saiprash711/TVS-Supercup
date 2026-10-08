'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  X,
  Scale,
  ShieldCheck,
  Trophy,
  IndianRupee,
  ShoppingCart,
  Store,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  Layers,
  Radio,
  Gavel,
  Gift
} from 'lucide-react';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'all' | 'buyers' | 'sellers' | 'prizes';
}

export default function TermsAndConditionsModal({
  isOpen,
  onClose,
  defaultTab = 'all'
}: TermsAndConditionsModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'buyers' | 'sellers' | 'prizes'>(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="rules-modal-overlay" onClick={onClose}>
      <div
        className="rules-modal-container double-bezel"
        style={{ maxWidth: '960px', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
      >
        <div className="inner-bezel-core rules-modal-core" style={{ padding: '28px 32px' }}>
          {/* Subtle Ambient Radial Glow */}
          <div className="rules-modal-glow" />

          {/* Close Action Button */}
          <button
            className="rules-modal-close-btn"
            onClick={onClose}
            aria-label="Close terms and conditions"
          >
            <X className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />
          </button>

          {/* Modal Header */}
          <div className="rules-modal-header" style={{ marginBottom: '20px' }}>
            <div className="rules-modal-eyebrow">
              <Scale className="w-3.5 h-3.5 text-sky-400" />
              <span>OFFICIAL TOURNAMENT REGULATIONS</span>
            </div>

            <h2 id="terms-modal-title" className="rules-modal-title" style={{ fontSize: '1.75rem' }}>
              Terms & Conditions
            </h2>

            <p className="rules-modal-subtitle" style={{ fontSize: '0.88rem' }}>
              Official rules, scoring policies, and prize distribution guidelines for the{' '}
              <strong className="text-white">TVS Certified Dealer Super Cup 2026–27</strong>.
              All participating dealerships are governed by these regulations.
            </p>

            {/* Tab Switcher */}
            <div className="rules-tab-switcher" style={{ marginTop: '16px' }}>
              <button
                className={`rules-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Overview & Eligibility</span>
              </button>
              <button
                className={`rules-tab-btn ${activeTab === 'buyers' ? 'active' : ''}`}
                onClick={() => setActiveTab('buyers')}
              >
                <ShoppingCart className="w-3.5 h-3.5 text-blue-400" />
                <span>Buyer League Rules</span>
              </button>
              <button
                className={`rules-tab-btn ${activeTab === 'sellers' ? 'active' : ''}`}
                onClick={() => setActiveTab('sellers')}
              >
                <Store className="w-3.5 h-3.5 text-sky-400" />
                <span>Seller League Rules</span>
              </button>
              <button
                className={`rules-tab-btn ${activeTab === 'prizes' ? 'active' : ''}`}
                onClick={() => setActiveTab('prizes')}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Prize Split & Ties</span>
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div
            style={{
              overflowY: 'auto',
              maxHeight: 'calc(90vh - 220px)',
              paddingRight: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* ── SECTION 1: GENERAL OVERVIEW & ELIGIBILITY ── */}
            {(activeTab === 'all' || activeTab === 'buyers' || activeTab === 'sellers') && (
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '20px 24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    1. Eligibility & League Separation
                  </h3>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7 }}>
                  <li>
                    <strong>Verified Dealerships:</strong> Participation is open exclusively to authenticated, registered automotive dealerships with active credentials on the TVS Certified digital auction platform.
                  </li>
                  <li>
                    <strong>Dual Independent Leagues:</strong> The championship operates as two separate, non-combined competitions:
                    <ul style={{ marginTop: '6px', marginBottom: '6px' }}>
                      <li><strong className="text-blue-400">Buyer League:</strong> Competitors earn Buyer Points from bidding on cars, live match attendance, and all-matches attendance bonus.</li>
                      <li><strong className="text-sky-400">Seller League:</strong> Competitors earn Seller Points from vehicle consignments/listings and verified commission settlements.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>No Total Dealer Points:</strong> Buyer points and Seller points are maintained independently. There is no combined &quot;Total Dealer Points&quot; championship or prize pool — winners and podium rankings are decided strictly within each respective league.
                  </li>
                  <li>
                    <strong>Campaign Window:</strong> Points are accrued strictly during the scheduled season matches between 15 October 2026 and 14 January 2027. Transactions outside official match auction windows will not carry into the competition tally.
                  </li>
                </ul>
              </div>
            )}

            {/* ── SECTION 2: BUYER LEAGUE SCORING & RULES ── */}
            {(activeTab === 'all' || activeTab === 'buyers') && (
              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.04)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '16px',
                  padding: '20px 24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <ShoppingCart className="w-5 h-5 text-blue-400" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    2. Buyer Terms & Scoring Allocation
                  </h3>
                  <span className="badge badge-primary" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                    BUYER LEAGUE
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: 'var(--bg-card)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border-hairline)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>
                      <Gavel className="w-4 h-4" />
                      <span>Rule 2.1 — Auction Bids: 1 Point Per Car Basis</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      Points for auction bids are strictly allocated on a <strong>per-car basis</strong>. Placing one or more verified bids on an individual vehicle lot awards <strong>1 point for that car</strong>.
                      Subsequent or repeat bids placed on the same vehicle lot do not earn additional points. To earn 10 bidding points, a buyer must participate by placing bids on 10 different vehicles.
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-card)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border-hairline)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-amber)', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>
                      <Radio className="w-4 h-4" />
                      <span>Rule 2.2 — Match Day Attendance: 1 Point Per Match</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      Earn <strong>1 point for attending and logging into</strong> each scheduled Thursday live auction match. Attendance is automatically confirmed via authenticated room entry or any verified live bidding activity.
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-card)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border-hairline)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>
                      <Trophy className="w-4 h-4" />
                      <span>Rule 2.3 — All-Matches Attendance Bonus: +20 Points</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      Buyers who maintain <strong>100% participation attendance across all scheduled tournament matches</strong> in the season qualify for a one-time <strong>+20 Bonus Points</strong> reward. The bonus is automatically verified and credited to the buyer&apos;s league score upon conclusion of the match schedule.
                    </p>
                  </div>

                  <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      <strong className="text-rose-400">Conversion Policy Note:</strong> Offline deliveries, post-auction vehicle handovers, and final sales closures are deliberately excluded from point scoring to ensure 100% transparent digital auditing through live software telemetry.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── SECTION 3: SELLER LEAGUE SCORING & RULES ── */}
            {(activeTab === 'all' || activeTab === 'sellers') && (
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.04)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '16px',
                  padding: '20px 24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Store className="w-5 h-5 text-sky-400" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    3. Seller Terms & Scoring Allocation
                  </h3>
                  <span className="badge badge-info" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                    SELLER LEAGUE
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: 'var(--bg-card)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border-hairline)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>
                      <Layers className="w-4 h-4" />
                      <span>Rule 3.1 — Vehicle Listings: 5 Points Per Consignment</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      Earn <strong>5 points for every vehicle</strong> consigned, inspected, and published for auction on TVS Certified prior to or during the scheduled match window. Vehicles must pass standard TVS inspection verification to qualify.
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-card)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border-hairline)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Rule 3.2 — Commission Settlement: 5 Points Per Clearance</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      Earn <strong>5 points per completed commission clearance</strong> and verified settlement allocation processed within the auction accounting cycle.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── SECTION 4: PRIZE POOL & EQUAL POINTS TIE-BREAKER DISTRIBUTION ── */}
            {(activeTab === 'all' || activeTab === 'prizes') && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(54, 78, 162, 0.08))',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: '16px',
                  padding: '24px 26px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    4. Prize Pool Distribution & Equal Points Tie-Breaker Rule
                  </h3>
                </div>

                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                  The TVS Certified Super Cup features a <strong>₹1,00,000 (₹1 Lakh) Total Cash Prize Pool</strong>, split evenly as <strong>₹50,000 for the Buyer League</strong> and <strong>₹50,000 for the Seller League</strong> across the top 3 podium finishers:
                </p>

                {/* Base Podium Table */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.3)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#f59e0b', fontWeight: 800 }}>1st Place Champion</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>₹25,000</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Per League</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.3)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', fontWeight: 800 }}>2nd Place Runner-Up</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>₹15,000</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Per League</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(180, 83, 9, 0.3)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#b45309', fontWeight: 800 }}>3rd Place Podium</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>₹10,000</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Per League</div>
                  </div>
                </div>

                {/* THE TIE-BREAKER CLAUSE */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '14px',
                    padding: '18px 20px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 800, fontSize: '0.92rem', marginBottom: '8px' }}>
                    <Scale className="w-4 h-4" />
                    <span>Equal Points Prize Distribution Rule (Tie-Breaker Clause)</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                    If two or more buyers or sellers finish the championship with the <strong>exact same amount of points</strong> on any podium position, the combined prize purse allocated for those tied positions will be <strong>pooled and split equally</strong> among the tied participants.
                  </p>

                  <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-subtle)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                      <strong className="text-white">Case 1: Two-Way Tie for 1st Place</strong>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                        The 1st Place (₹25,000) and 2nd Place (₹15,000) prizes are combined into a <strong>₹40,000 purse</strong> and divided equally:
                        <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, marginLeft: '6px' }}>₹20,000 each</span>.
                        The next highest scorer receives the 3rd Place prize of ₹10,000.
                      </div>
                    </div>

                    <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-subtle)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                      <strong className="text-white">Case 2: Three-Way Tie for 1st Place</strong>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                        All three podium prizes (₹25,000 + ₹15,000 + ₹10,000 = ₹50,000) are pooled together and divided equally:
                        <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, marginLeft: '6px' }}>₹16,666.67 each</span>.
                      </div>
                    </div>

                    <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-subtle)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                      <strong className="text-white">Case 3: Two-Way Tie for 2nd Place</strong>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                        The 1st Place winner receives ₹25,000 in full. The 2nd Place (₹15,000) and 3rd Place (₹10,000) prizes are combined into ₹25,000 and divided equally:
                        <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, marginLeft: '6px' }}>₹12,500 each</span>.
                      </div>
                    </div>

                    <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-subtle)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                      <strong className="text-white">Case 4: Two-Way Tie for 3rd Place</strong>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                        1st and 2nd place receive their full awards (₹25,000 and ₹15,000). The 3rd Place prize (₹10,000) is split equally:
                        <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, marginLeft: '6px' }}>₹5,000 each</span>.
                      </div>
                    </div>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  *Note: On digital leaderboard screens, secondary tie-break order for display purposes alone is arranged by (1) Total unique cars bid on / listings, then (2) Earliest timestamp of point achievement. However, <strong>actual cash prize payouts follow the equal split formula above</strong>.
                </p>
              </div>
            )}

            {/* ── SECTION 5: AUDIT, COMPLIANCE & FAIR PLAY ── */}
            {activeTab === 'all' && (
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '20px 24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    5. Audit Verification & Disqualification
                  </h3>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7 }}>
                  <li>
                    <strong>Anti-Collusion & Bot Protection:</strong> Any automated bot scripting, synthetic transaction generation, or coordinated bidding collusion will result in immediate zeroing of points and tournament disqualification.
                  </li>
                  <li>
                    <strong>KYC & Payout Method:</strong> All prize distributions will be disbursed through verified bank wire transfer (NEFT/RTGS) to the official registered dealership entity following GST and TDS compliance verification.
                  </li>
                  <li>
                    <strong>Management Discretion:</strong> TVS Certified management reserves the right of final audit inspection on all logged telemetry records prior to official winner declaration.
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Governed by TVS Certified Auction Regulations 2026–27</span>
            </div>

            <button
              className="btn btn-primary btn-sm"
              style={{ padding: '8px 20px', borderRadius: '10px' }}
              onClick={onClose}
            >
              <span>Close Regulations</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
