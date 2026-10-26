'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Layers, 
  Gavel, 
  Radio, 
  CheckCircle2, 
  Sparkles, 
  X, 
  ArrowRight, 
  Info,
  ShieldCheck,
  TrendingUp,
  Zap,
  Target,
  Scale,
  FileText
} from 'lucide-react';
import TermsAndConditionsModal from './TermsAndConditionsModal';
import { useDealerLanguage } from '../context/DealerLanguageContext';

interface SuperCupPointsRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealerName?: string;
}

export default function SuperCupPointsRulesModal({
  isOpen,
  onClose,
  dealerName,
}: SuperCupPointsRulesModalProps) {
  const { t, isTamil } = useDealerLanguage();
  const [activeTab, setActiveTab] = useState<'all' | 'selling' | 'buying'>('all');
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dontShowAgain]);

  if (!isOpen) return null;

  const handleDismiss = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('tvs_supercup_rules_auto_dismiss', 'true');
      } catch {}
    }
    // Also track in session so it doesn't re-trigger during this browsing session
    try {
      sessionStorage.setItem('tvs_supercup_rules_seen_session', 'true');
    } catch {}
    onClose();
  };

  return (
    <div className="rules-modal-overlay" onClick={handleDismiss}>
      <div 
        className="rules-modal-container double-bezel" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-modal-title"
      >
        <div className="inner-bezel-core rules-modal-core">
          {/* Subtle Ambient Radial Glow */}
          <div className="rules-modal-glow" />

          {/* Close Action Button */}
          <button 
            className="rules-modal-close-btn"
            onClick={handleDismiss}
            aria-label="Close rules handbook"
          >
            <X className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />
          </button>

          {/* Modal Header */}
          <div className="rules-modal-header">
            <div className="rules-modal-eyebrow">
              <span className="pulsing-radar-dot" />
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('modal.rulesHandbook', 'OFFICIAL SUPERCUP 2026–27 HANDBOOK')}</span>
            </div>

            <h2 id="rules-modal-title" className="rules-modal-title">
              {t('modal.howPointsCalculated', 'How Points are Calculated')}
            </h2>

            <p className="rules-modal-subtitle">
              {isTamil ? (
                <>
                  வரவேற்கிறோம் {dealerName ? <strong className="text-white">{dealerName}</strong> : 'டீலர்'}! 
                  டிவிஎஸ் சான்றளிக்கப்பட்ட நேரடி தளம் மூலம் புள்ளிகள் <strong>தானாகவே நிகழ்நேரத்தில்</strong> கண்காணிக்கப்படுகின்றன. 
                  நீங்கள் எவ்வாறு சரிபார்க்கப்பட்ட புள்ளிகளைப் பெற்று சாம்பியன்ஷிப் முன்னிலை அட்டவணையில் முன்னேறலாம் என்பது இங்கே விவரிக்கப்பட்டுள்ளது.
                </>
              ) : (
                <>
                  Welcome {dealerName ? <strong className="text-white">{dealerName}</strong> : 'Dealer'}! 
                  Points are tracked <strong>automatically in real-time</strong> from TVS Certified live platform telemetry. 
                  Here is exactly how you earn verified points and climb the championship leaderboard.
                </>
              )}
            </p>

            {/* Interactive Filter Pills */}
            <div className="rules-tab-switcher">
              <button
                className={`rules-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('modal.tabAll', 'All Point Rules')}</span>
              </button>
              <button
                className={`rules-tab-btn ${activeTab === 'selling' ? 'active' : ''}`}
                onClick={() => setActiveTab('selling')}
              >
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>{t('modal.tabSelling', 'Selling Allocations (+1 / +10 PTS)')}</span>
              </button>
              <button
                className={`rules-tab-btn ${activeTab === 'buying' ? 'active' : ''}`}
                onClick={() => setActiveTab('buying')}
              >
                <Gavel className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('modal.tabBuying', 'Buying Allocations (+1 / +10 PTS)')}</span>
              </button>
            </div>
          </div>

          {/* Rules Bento Grid */}
          <div className="rules-bento-grid">
            {/* ── RULE 1: SELLING LISTINGS (1 PT) ── */}
            {(activeTab === 'all' || activeTab === 'selling') && (
              <div className="rule-card rule-card-selling">
                <div className="rule-card-top">
                  <div className="rule-card-badge-wrap">
                    <span className="rule-badge rule-badge-cyan">
                      <span className="rule-badge-glow" />
                      +1 POINT / CAR
                    </span>
                    <span className="rule-stream-tag selling-tag">SELLER STREAM</span>
                  </div>
                  <div className="rule-icon-box cyan-box">
                    <Layers className="w-6 h-6 text-sky-400" />
                  </div>
                </div>

                <h3 className="rule-name">Car Listings</h3>
                <p className="rule-desc">
                  Earn <strong>+1 point per car listed</strong>. List 100 cars and earn 100 points! Every verified vehicle published in the catalog earns points.
                </p>

                <div className="rule-calc-pill">
                  <Target className="w-3.5 h-3.5 text-sky-400" />
                  <span>Formula: <strong>100 Cars Listed = 100 Verified Points</strong></span>
                </div>

                <div className="rule-footer-meta">
                  <span className="meta-tag">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Auto-Captured via Inventory
                  </span>
                </div>
              </div>
            )}

            {/* ── RULE 2: SELLER EVENT PARTICIPATION (1 PT) ── */}
            {(activeTab === 'all' || activeTab === 'selling') && (
              <div className="rule-card rule-card-selling">
                <div className="rule-card-top">
                  <div className="rule-card-badge-wrap">
                    <span className="rule-badge rule-badge-cyan">
                      <span className="rule-badge-glow" />
                      +1 POINT / EVENT
                    </span>
                    <span className="rule-stream-tag selling-tag">SELLER STREAM</span>
                  </div>
                  <div className="rule-icon-box cyan-box">
                    <Radio className="w-6 h-6 text-sky-400" />
                  </div>
                </div>

                <h3 className="rule-name">Event Participation</h3>
                <p className="rule-desc">
                  Earn <strong>+1 point per event with at least 1 car listed</strong>. (Listing 100 cars in an event is still 1 point for event attendance).
                </p>

                <div className="rule-calc-pill">
                  <Target className="w-3.5 h-3.5 text-sky-400" />
                  <span>Formula: <strong>&gt;= 1 Car in Match = 1 Point</strong> (Join every match for +5 bonus)</span>
                </div>

                <div className="rule-footer-meta">
                  <span className="meta-tag">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Event Active Catalog
                  </span>
                </div>
              </div>
            )}

            {/* ── RULE 3: SELLER CONVERSION (10 PTS) ── */}
            {(activeTab === 'all' || activeTab === 'selling') && (
              <div className="rule-card rule-card-selling">
                <div className="rule-card-top">
                  <div className="rule-card-badge-wrap">
                    <span className="rule-badge rule-badge-emerald">
                      <span className="rule-badge-glow" />
                      +10 POINTS / CONVERSION
                    </span>
                    <span className="rule-stream-tag selling-tag">SELLER STREAM</span>
                  </div>
                  <div className="rule-icon-box emerald-box">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>

                <h3 className="rule-name">Sales Conversion</h3>
                <p className="rule-desc">
                  Earn <strong>+10 points per conversion</strong>, when your car is sold. Calculated manually upon verified offline completion.
                </p>

                <div className="rule-calc-pill">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Formula: <strong>1 Car Sold = 10 Points</strong></span>
                </div>

                <div className="rule-footer-meta">
                  <span className="meta-tag">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Verified Offline Settlement
                  </span>
                </div>
              </div>
            )}

            {/* ── RULE 4: BUYING BIDS (1 PT PER CAR BASIS) ── */}
            {(activeTab === 'all' || activeTab === 'buying') && (
              <div className="rule-card rule-card-buying">
                <div className="rule-card-top">
                  <div className="rule-card-badge-wrap">
                    <span className="rule-badge rule-badge-blue">
                      <span className="rule-badge-glow" />
                      +1 POINT / UNIQUE CAR
                    </span>
                    <span className="rule-stream-tag buying-tag">BUYER STREAM</span>
                  </div>
                  <div className="rule-icon-box blue-box">
                    <Gavel className="w-6 h-6 text-blue-400" />
                  </div>
                </div>

                <h3 className="rule-name">Bids Placed (Per-Car Basis)</h3>
                <p className="rule-desc">
                  Earn <strong>+1 point per unique car you bid on</strong>. 100 bids on 1 car is still 1 point. 1 bid each on 100 cars = 100 points!
                </p>

                <div className="rule-calc-pill">
                  <Target className="w-3.5 h-3.5 text-blue-400" />
                  <span>Formula: <strong>100 Unique Cars Bid On = 100 Verified Points</strong></span>
                </div>

                <div className="rule-footer-meta">
                  <span className="meta-tag">
                    <Zap className="w-3 h-3 text-blue-400" />
                    Allocated Per Unique Car
                  </span>
                </div>
              </div>
            )}

            {/* ── RULE 5: MATCH DAY PARTICIPATION (1 PT) ── */}
            {(activeTab === 'all' || activeTab === 'buying') && (
              <div className="rule-card rule-card-buying">
                <div className="rule-card-top">
                  <div className="rule-card-badge-wrap">
                    <span className="rule-badge rule-badge-amber">
                      <span className="rule-badge-glow" />
                      +1 POINT / EVENT
                    </span>
                    <span className="rule-stream-tag buying-tag">BUYER STREAM</span>
                  </div>
                  <div className="rule-icon-box amber-box">
                    <Radio className="w-6 h-6 text-amber-400" />
                  </div>
                </div>

                <h3 className="rule-name">Event Participation</h3>
                <p className="rule-desc">
                  Earn <strong>+1 point per event you take part in</strong>. Log in and participate in each scheduled Thursday auction session.
                </p>

                <div className="rule-calc-pill">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  <span>Formula: <strong>1 Match Joined = 1 Point</strong> (Join every match for +5 bonus)</span>
                </div>

                <div className="rule-footer-meta">
                  <span className="meta-tag">
                    <Radio className="w-3 h-3 text-amber-400" />
                    Automated Room Entry Record
                  </span>
                </div>
              </div>
            )}

            {/* ── RULE 6: BUYING CONVERSION (10 PTS) ── */}
            {(activeTab === 'all' || activeTab === 'buying') && (
              <div className="rule-card rule-card-buying">
                <div className="rule-card-top">
                  <div className="rule-card-badge-wrap">
                    <span className="rule-badge rule-badge-emerald">
                      <span className="rule-badge-glow" />
                      +10 POINTS / CONVERSION
                    </span>
                    <span className="rule-stream-tag buying-tag">BUYER STREAM</span>
                  </div>
                  <div className="rule-icon-box emerald-box">
                    <Trophy className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>

                <h3 className="rule-name">Purchase Conversion</h3>
                <p className="rule-desc">
                  Earn <strong>+10 points per conversion</strong>, when you win and buy a car. Calculated manually upon verified offline completion.
                </p>

                <div className="rule-calc-pill">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Formula: <strong>1 Car Won & Bought = 10 Points</strong></span>
                </div>

                <div className="rule-footer-meta">
                  <span className="meta-tag">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Verified Offline Purchase
                  </span>
                </div>
              </div>
            )}

            {/* ── RULE 7: ALL-MATCHES ATTENDANCE BONUS (+5 PTS) ── */}
            {(activeTab === 'all' || activeTab === 'buying' || activeTab === 'selling') && (
              <div className="rule-card rule-card-buying" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                <div className="rule-card-top">
                  <div className="rule-card-badge-wrap">
                    <span className="rule-badge rule-badge-emerald">
                      <span className="rule-badge-glow" />
                      +5 BONUS PTS
                    </span>
                    <span className="rule-stream-tag buying-tag">BUYER & SELLER</span>
                  </div>
                  <div className="rule-icon-box" style={{ background: 'rgba(245, 158, 11, 0.12)' }}>
                    <Sparkles className="w-6 h-6 text-amber-400" />
                  </div>
                </div>

                <h3 className="rule-name">All-Matches Loyalty Bonus</h3>
                <p className="rule-desc">
                  Dealers who <strong>join every match</strong> during the tournament earn a <strong>+5 Bonus Points</strong> reward credited upon tournament completion.
                </p>

                <div className="rule-calc-pill">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Formula: <strong>Join Every Match = +5 Bonus Points</strong></span>
                </div>

                <div className="rule-footer-meta">
                  <span className="meta-tag">
                    <Trophy className="w-3 h-3 text-amber-400" />
                    Championship Loyalty Multiplier
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Transparency & League Separation Policy */}
          <div className="rules-transparency-banner">
            <div className="transparency-icon-col">
              <Info className="w-5 h-5 text-sky-400" />
            </div>
            <div className="transparency-content">
              <h4 className="transparency-title">
                Championship Integrity & League Separation
              </h4>
              <p className="transparency-text">
                To guarantee 100% fair competition, <strong>Total Dealer Points is not combined</strong>. 
                Dealers compete and win separately in the <strong>Buyer League</strong> and <strong>Seller League</strong>. 
                Live actions are automatically tracked in real-time, while conversions (+10 pts) are verified and awarded upon completed offline delivery and settlement.
              </p>
            </div>
          </div>

          {/* Separate League Formulas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginTop: '16px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '12px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                <TrendingUp className="w-3.5 h-3.5" />
                <span>BUYER LEAGUE SCORE =</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '0.78rem' }}>
                <span className="math-pill math-blue">Unique Cars Bid On × 1</span>
                <span>+</span>
                <span className="math-pill math-amber">Event Attendance × 1</span>
                <span>+</span>
                <span className="math-pill math-green">Conversions × 10</span>
                <span>+</span>
                <span className="math-pill math-cyan">All-Matches Bonus (5)</span>
              </div>
            </div>

            <div style={{ background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '12px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                <TrendingUp className="w-3.5 h-3.5" />
                <span>SELLER LEAGUE SCORE =</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '0.78rem' }}>
                <span className="math-pill math-green">Cars Listed × 1</span>
                <span>+</span>
                <span className="math-pill math-amber">Event Participation × 1</span>
                <span>+</span>
                <span className="math-pill math-blue">Conversions × 10</span>
                <span>+</span>
                <span className="math-pill math-cyan">All-Matches Bonus (5)</span>
              </div>
            </div>
          </div>

          {/* Equal Points Tie-Breaker Rule (Higher GMV Ranks Higher) */}
          <div
            style={{
              marginTop: '16px',
              padding: '14px 18px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.06)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: 800, fontSize: '0.85rem' }}>
                <Scale className="w-4 h-4" />
                <span>{t('modal.tieBreakerTitle', 'Tie-Breaker Rule (Higher GMV Ranks Higher)')}</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {isTamil ? (
                  <>
                    இறுதி மதிப்பெண்கள் சமமாக இருந்தால், அதிக <strong>GMV (பரிவர்த்தனை மதிப்பு)</strong> கொண்ட டீலர்ஷிப் உயர்ந்த தரவரிசையைப் பெறும்.
                  </>
                ) : (
                  <>
                    If final scores are equal, the dealer with the <strong>higher GMV (transaction value)</strong> ranks higher.
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.75rem', padding: '5px 12px', borderRadius: '8px' }}
              onClick={() => setShowTerms(true)}
            >
              <FileText className="w-3.5 h-3.5 mr-1" />
              <span>{isTamil ? 'முழு விதிமுறைகள்' : 'Full Terms & Conditions'}</span>
            </button>
          </div>

          {/* Modal Footer Controls */}
          <div className="rules-modal-footer">
            <label className="rules-dont-show-label">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rules-checkbox"
              />
              <span>{t('modal.dontShowAgain', "Don't show this popup automatically on login")}</span>
            </label>

            <button 
              className="rules-modal-cta-btn group"
              onClick={handleDismiss}
            >
              <span>{t('modal.understoodBtn', "Understood, Let's Compete!")}</span>
              <div className="nested-btn-icon">
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </button>
          </div>
        </div>
      </div>

      <TermsAndConditionsModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
      />
    </div>
  );
}
