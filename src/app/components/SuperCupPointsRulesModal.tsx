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
                <span>{t('modal.tabSelling', 'Selling Allocations (+5 PTS)')}</span>
              </button>
              <button
                className={`rules-tab-btn ${activeTab === 'buying' ? 'active' : ''}`}
                onClick={() => setActiveTab('buying')}
              >
                <Gavel className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('modal.tabBuying', 'Buying Allocations (+1 PT)')}</span>
              </button>
            </div>
          </div>

          {/* Rules Bento Grid */}
          <div className="rules-bento-grid">
            {/* ── RULE 1: SELLING LISTINGS (5 PTS) ── */}
            {(activeTab === 'all' || activeTab === 'selling') && (
              <div className="rule-card rule-card-selling">
                <div className="rule-card-top">
                  <div className="rule-card-badge-wrap">
                    <span className="rule-badge rule-badge-cyan">
                      <span className="rule-badge-glow" />
                      +5 POINTS
                    </span>
                    <span className="rule-stream-tag selling-tag">SELLER STREAM</span>
                  </div>
                  <div className="rule-icon-box cyan-box">
                    <Layers className="w-6 h-6 text-sky-400" />
                  </div>
                </div>

                <h3 className="rule-name">Vehicle Listings</h3>
                <p className="rule-desc">
                  Earn <strong>5 points for every vehicle</strong> you consign, inspect, and list on TVS Certified before or during auction day.
                </p>

                <div className="rule-calc-pill">
                  <Target className="w-3.5 h-3.5 text-sky-400" />
                  <span>Formula: <strong>10 Vehicles Listed = 50 Verified Points</strong></span>
                </div>

                <div className="rule-footer-meta">
                  <span className="meta-tag">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Auto-Captured via Inventory
                  </span>
                </div>
              </div>
            )}

            {/* ── RULE 2: SELLING COMMISSION (5 PTS) ── */}
            {(activeTab === 'all' || activeTab === 'selling') && (
              <div className="rule-card rule-card-selling">
                <div className="rule-card-top">
                  <div className="rule-card-badge-wrap">
                    <span className="rule-badge rule-badge-emerald">
                      <span className="rule-badge-glow" />
                      +5 POINTS
                    </span>
                    <span className="rule-stream-tag selling-tag">SELLER STREAM</span>
                  </div>
                  <div className="rule-icon-box emerald-box">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>

                <h3 className="rule-name">Commission Settlement</h3>
                <p className="rule-desc">
                  Earn <strong>5 points per completed commission clearance</strong> and verified settlement allocation.
                </p>

                <div className="rule-calc-pill">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Formula: <strong>1 Settlement = 5 Verified Points</strong></span>
                </div>

                <div className="rule-footer-meta">
                  <span className="meta-tag">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Verified Financial Allocation
                  </span>
                </div>
              </div>
            )}

            {/* ── RULE 3: BUYING BIDS (1 PT PER CAR BASIS) ── */}
            {(activeTab === 'all' || activeTab === 'buying') && (
              <div className="rule-card rule-card-buying">
                <div className="rule-card-top">
                  <div className="rule-card-badge-wrap">
                    <span className="rule-badge rule-badge-blue">
                      <span className="rule-badge-glow" />
                      +1 POINT / CAR
                    </span>
                    <span className="rule-stream-tag buying-tag">BUYER STREAM</span>
                  </div>
                  <div className="rule-icon-box blue-box">
                    <Gavel className="w-6 h-6 text-blue-400" />
                  </div>
                </div>

                <h3 className="rule-name">Auction Bids (Per-Car Basis)</h3>
                <p className="rule-desc">
                  Earn <strong>1 point per vehicle/car bid on</strong> during pre-bidding or live Thursday auctions. Points are awarded once per unique car — multiple bids on the same car lot do not yield extra points, preventing point farming.
                </p>

                <div className="rule-calc-pill">
                  <Target className="w-3.5 h-3.5 text-blue-400" />
                  <span>Formula: <strong>10 Cars Bid On = 10 Verified Points</strong></span>
                </div>

                <div className="rule-footer-meta">
                  <span className="meta-tag">
                    <Zap className="w-3 h-3 text-blue-400" />
                    Allocated Per Unique Vehicle Lot
                  </span>
                </div>
              </div>
            )}

            {/* ── RULE 4: MATCH DAY PARTICIPATION (1 PT) ── */}
            {(activeTab === 'all' || activeTab === 'buying') && (
              <div className="rule-card rule-card-buying">
                <div className="rule-card-top">
                  <div className="rule-card-badge-wrap">
                    <span className="rule-badge rule-badge-amber">
                      <span className="rule-badge-glow" />
                      +1 POINT
                    </span>
                    <span className="rule-stream-tag buying-tag">BUYER STREAM</span>
                  </div>
                  <div className="rule-icon-box amber-box">
                    <Radio className="w-6 h-6 text-amber-400" />
                  </div>
                </div>

                <h3 className="rule-name">Match Day Participation</h3>
                <p className="rule-desc">
                  Earn <strong>1 point for attending</strong> and logging into each live Thursday Super Cup auction session.
                </p>

                <div className="rule-calc-pill">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  <span>Formula: <strong>1 Match Attended = 1 Verified Point</strong> (Up to 16 Weekly Matches)</span>
                </div>

                <div className="rule-footer-meta">
                  <span className="meta-tag">
                    <Radio className="w-3 h-3 text-amber-400" />
                    Automated Room Entry Record
                  </span>
                </div>
              </div>
            )}

            {/* ── RULE 5: ALL-MATCHES ATTENDANCE BONUS (+20 PTS) ── */}
            {(activeTab === 'all' || activeTab === 'buying') && (
              <div className="rule-card rule-card-buying" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                <div className="rule-card-top">
                  <div className="rule-card-badge-wrap">
                    <span className="rule-badge rule-badge-emerald">
                      <span className="rule-badge-glow" />
                      +20 BONUS PTS
                    </span>
                    <span className="rule-stream-tag buying-tag">BUYER STREAM</span>
                  </div>
                  <div className="rule-icon-box" style={{ background: 'rgba(245, 158, 11, 0.12)' }}>
                    <Sparkles className="w-6 h-6 text-amber-400" />
                  </div>
                </div>

                <h3 className="rule-name">All-Matches Attendance Bonus</h3>
                <p className="rule-desc">
                  Buyers who participate in <strong>all scheduled tournament matches</strong> in the season earn a <strong>+20 Bonus Points</strong> reward credited to their Buyer League tally upon schedule completion.
                </p>

                <div className="rule-calc-pill">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Formula: <strong>100% Match Attendance = +20 Bonus Points</strong></span>
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
                Offline conversions are excluded because vehicle deliveries and final offline settlements happen outside digital auction software. 
                Points reward active digital contributions: <strong>listings (+5 pts)</strong>, <strong>commissions (+5 pts)</strong>, <strong>per-car bids (+1 pt)</strong>, <strong>match attendance (+1 pt)</strong>, and <strong>all-matches bonus (+20 pts)</strong>.
              </p>
            </div>
          </div>

          {/* Separate League Formulas (Total Dealer Points is NOT required) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginTop: '16px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '12px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                <TrendingUp className="w-3.5 h-3.5" />
                <span>BUYER LEAGUE SCORE =</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '0.78rem' }}>
                <span className="math-pill math-blue">Cars Bid On × 1</span>
                <span>+</span>
                <span className="math-pill math-amber">Attendance × 1</span>
                <span>+</span>
                <span className="math-pill math-green">All-Matches Bonus (20)</span>
              </div>
            </div>

            <div style={{ background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '12px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                <TrendingUp className="w-3.5 h-3.5" />
                <span>SELLER LEAGUE SCORE =</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '0.78rem' }}>
                <span className="math-pill math-green">Listings × 5</span>
                <span>+</span>
                <span className="math-pill math-cyan">Commissions × 5</span>
              </div>
            </div>
          </div>

          {/* Equal Points Tie-Breaker Prize Distribution Callout */}
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
                <span>{t('modal.tieBreakerTitle', 'Equal Points Prize Distribution (Tie-Breaker Rule)')}</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {isTamil ? (
                  <>
                    இரண்டு அல்லது அதற்கு மேற்பட்ட வாங்குபவர்கள் அல்லது விற்பனையாளர்கள் போடியத்தில் ஒரே புள்ளிகளைப் பெற்றால், அந்த இடங்களுக்கான மொத்த பரிசு சமமாகப் <strong>பிரிக்கப்படும்</strong> (எ.கா. 1வது இடத்திற்கு சமநிலை ஏற்பட்டால் ₹40,000 தலா ₹20,000 ஆகப் பிரிக்கப்படும்).
                  </>
                ) : (
                  <>
                    If two or more buyers or sellers score the exact same points on the podium, the combined prize purse for those positions is <strong>split equally</strong> (e.g. 2-way tie for 1st splits ₹40,000 = ₹20,000 each).
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
