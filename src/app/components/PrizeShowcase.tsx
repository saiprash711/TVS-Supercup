'use client';

import { useState, type CSSProperties } from 'react';
import { CalendarDays, Crown, IndianRupee, ShoppingCart, Sparkles, Store, Trophy, Scale, FileText, ChevronRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import styles from './PrizeShowcase.module.css';
import TermsAndConditionsModal from './TermsAndConditionsModal';
import { useDealerLanguage } from '../context/DealerLanguageContext';

const podiumEn = [
  { place: '1st', amount: '25,000', label: 'Champion', tone: 'gold' },
  { place: '2nd', amount: '15,000', label: 'Runner-up', tone: 'silver' },
  { place: '3rd', amount: '10,000', label: 'Third place', tone: 'bronze' },
] as const;

const podiumTa = [
  { place: '1வது', amount: '25,000', label: 'சாம்பியன்', tone: 'gold' },
  { place: '2வது', amount: '15,000', label: 'இரண்டாம் இடம்', tone: 'silver' },
  { place: '3வது', amount: '10,000', label: 'மூன்றாம் இடம்', tone: 'bronze' },
] as const;

function PrizeLeague({ title, eyebrow, type, isTamil }: {
  title: string;
  eyebrow: string;
  type: 'buyer' | 'seller';
  isTamil?: boolean;
}) {
  const Icon = type === 'buyer' ? ShoppingCart : Store;
  const reduceMotion = useReducedMotion();
  const podium = isTamil ? podiumTa : podiumEn;

  return (
    <motion.article
      className={`${styles.league} ${styles[type]}`}
      initial={reduceMotion ? false : { opacity: 0, y: 30, scale: 0.975 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, delay: type === 'buyer' ? 0.1 : 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.leagueGlow} aria-hidden="true" />
      <header className={styles.leagueHeader}>
        <div className={styles.iconTile}>
          <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <div>
          <span className={styles.leagueEyebrow}>{eyebrow}</span>
          <h3>{title}</h3>
        </div>
        <div className={styles.leagueTotal}>
          <span>{isTamil ? 'பரிசுத் தொகை' : 'Prize pool'}</span>
          <strong>₹50K</strong>
        </div>
      </header>

      <div className={styles.prizeList}>
        {podium.map((prize, index) => (
          <motion.div
            className={`${styles.prizeRow} ${styles[prize.tone]}`}
            key={prize.place}
            style={{ '--row-delay': `${360 + index * 110}ms` } as CSSProperties}
            initial={reduceMotion ? false : { opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.52, delay: 0.26 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.rankMarker}>
              {index === 0 ? <Crown size={17} aria-hidden="true" /> : <span>{index + 1}</span>}
            </div>
            <div className={styles.placeCopy}>
              <strong>{isTamil ? `${prize.place} பரிசு` : `${prize.place} prize`}</strong>
              <span>{prize.label}</span>
            </div>
            <div className={styles.amount}>
              <IndianRupee size={17} strokeWidth={2.2} aria-hidden="true" />
              <strong>{prize.amount}</strong>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.article>
  );
}

export default function PrizeShowcase() {
  const reduceMotion = useReducedMotion();
  const [showTerms, setShowTerms] = useState(false);
  const { t, isTamil } = useDealerLanguage();

  return (
    <motion.section
      className={styles.shell}
      aria-labelledby="prize-showcase-title"
      initial={reduceMotion ? false : { opacity: 0, y: 38, clipPath: 'inset(0 0 18% 0 round 28px)' }}
      whileInView={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0 round 28px)' }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.82, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.ambientGlow} aria-hidden="true" />
      <div className={styles.gridTexture} aria-hidden="true" />

      <header className={styles.heroHeader}>
        <div className={styles.titleBlock}>
          <span className={styles.kicker}>
            <Sparkles size={14} aria-hidden="true" />
            {isTamil ? 'சூப்பர்கப் 2026–27 பரிசுகள்' : 'Super Cup 2026–27 rewards'}
          </span>
          <h2 id="prize-showcase-title">
            {isTamil ? 'இலக்கு ' : 'The road to '}
            <span>₹1,00,000</span>
          </h2>
          <p>
            {isTamil 
              ? 'இரண்டு லீக் முன்னிலை அட்டவணைகள். ஆறு வெற்றியாளர்கள். ஒவ்வொரு பரிவர்த்தனையும் மதிப்புமிக்க ஒரு பருவம்.' 
              : 'Two leaderboards. Six winners. One season to make every transaction count.'}
          </p>
          <div className={styles.campaignDates} aria-label="Campaign period: 15 October 2026 to 31 January 2027">
            <CalendarDays size={17} strokeWidth={1.8} aria-hidden="true" />
            <span>{isTamil ? 'பிரச்சாரக் காலம்' : 'Campaign period'}</span>
            <strong>15 OCT 2026</strong>
            <span className={styles.dateLine} aria-hidden="true" />
            <strong>31 JAN 2027</strong>
          </div>
        </div>

        <motion.div
          className={styles.poolMedallion}
          aria-label="Total prize pool: one lakh rupees"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.62, rotate: -16 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ type: 'spring', stiffness: 170, damping: 16, delay: 0.18 }}
        >
          <div className={styles.medallionRing} aria-hidden="true" />
          <div className={styles.medallionCore}>
            <Trophy size={24} strokeWidth={1.7} aria-hidden="true" />
            <span>{isTamil ? 'மொத்தப் பரிசு' : 'Total prize pool'}</span>
            <strong>₹1 LAKH</strong>
          </div>
        </motion.div>
      </header>

      <div className={styles.leagueGrid}>
        <PrizeLeague
          title={isTamil ? 'வாங்குபவர் போடியம்' : 'Buyers’ podium'}
          eyebrow={isTamil ? 'வாங்குதல் மூலம் வெற்றி' : 'Win through buying'}
          type="buyer"
          isTamil={isTamil}
        />
        <PrizeLeague
          title={isTamil ? 'விற்பனையாளர் போடியம்' : 'Sellers’ podium'}
          eyebrow={isTamil ? 'விற்பனை மூலம் வெற்றி' : 'Win through selling'}
          type="seller"
          isTamil={isTamil}
        />
      </div>

      {/* Tie-Breaker & Equal Points Distribution Policy */}
      <div
        style={{
          marginTop: '24px',
          padding: '20px 24px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(250, 204, 21, 0.22)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={18} style={{ color: '#facc15' }} />
            <strong style={{ fontSize: '0.92rem', color: '#f8fafc', letterSpacing: '-0.01em' }}>
              {isTamil ? 'சம புள்ளிகள் பரிசுப் பகிர்வு விதிமுறை (சமநிலை கொள்கை)' : 'Equal Points Prize Distribution Rule (Tie-Breaker Policy)'}
            </strong>
          </div>
          <button
            type="button"
            onClick={() => setShowTerms(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(250, 204, 21, 0.1)',
              border: '1px solid rgba(250, 204, 21, 0.3)',
              color: '#fef08a',
              fontSize: '0.78rem',
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <FileText size={13} />
            <span>{isTamil ? 'முழு விதிமுறைகள் & நிபந்தனைகள்' : 'Full Terms & Conditions'}</span>
            <ChevronRight size={13} />
          </button>
        </div>

        <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6 }}>
          {isTamil
            ? 'இரண்டு அல்லது அதற்கு மேற்பட்ட வாங்குபவர்கள் அல்லது விற்பனையாளர்கள் போடியத்தில் ஒரே புள்ளிகளைப் பெற்றால், அந்த இடங்களுக்கான மொத்த பரிசுத் தொகை சமமாகப் பிரிக்கப்பட்டு வழங்கப்படும்:'
            : 'If two or more buyers or sellers score the exact same points in a podium position, the combined prize purse for those tied positions is pooled and distributed equally among the tied dealerships:'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
          <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: '#facc15', fontWeight: 700, textTransform: 'uppercase' }}>
              {isTamil ? '1வது இடத்திற்கு 2 பேர் சமநிலை' : '2-Way Tie for 1st'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '2px' }}>
              1st (₹25k) + 2nd (₹15k) = ₹40k<br />
              <strong style={{ color: '#4ade80' }}>{isTamil ? 'தலா ₹20,000' : '₹20,000 each'}</strong> • {isTamil ? 'அடுத்தவர் ₹10,000' : 'Next gets ₹10,000'}
            </div>
          </div>

          <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase' }}>
              {isTamil ? '2வது இடத்திற்கு 2 பேர் சமநிலை' : '2-Way Tie for 2nd'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '2px' }}>
              2nd (₹15k) + 3rd (₹10k) = ₹25k<br />
              <strong style={{ color: '#4ade80' }}>{isTamil ? 'தலா ₹12,500' : '₹12,500 each'}</strong> • {isTamil ? '1வது இடம் ₹25,000' : '1st gets ₹25,000'}
            </div>
          </div>

          <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: '#fb923c', fontWeight: 700, textTransform: 'uppercase' }}>
              {isTamil ? '3வது இடத்திற்கு 2 பேர் சமநிலை' : '2-Way Tie for 3rd'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '2px' }}>
              {isTamil ? '3வது பரிசு (₹10,000) சமமாகப் பிரிக்கப்படுகிறது' : '3rd Place (₹10,000) split equally'}<br />
              <strong style={{ color: '#4ade80' }}>{isTamil ? 'தலா ₹5,000' : '₹5,000 each'}</strong> • {isTamil ? '1 & 2 முழு தொகை' : '1st & 2nd full'}
            </div>
          </div>

          <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: '#e879f9', fontWeight: 700, textTransform: 'uppercase' }}>
              {isTamil ? '1வது இடத்திற்கு 3 பேர் சமநிலை' : '3-Way Tie for 1st'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '2px' }}>
              {isTamil ? 'அனைத்து 3 பரிசுகளும் (₹50k) சேர்க்கப்படுகிறது' : 'All 3 prizes (₹50k total) pooled'}<br />
              <strong style={{ color: '#4ade80' }}>{isTamil ? 'தலா ₹16,666.67' : '₹16,666.67 each'}</strong>
            </div>
          </div>
        </div>
      </div>

      <footer className={styles.footerNote}>
        <span className={styles.liveDot} aria-hidden="true" />
        <strong>{isTamil ? 'வாங்குபவர்களுக்கு ₹50,000' : '₹50,000 for buyers'}</strong>
        <span className={styles.divider} aria-hidden="true" />
        <strong>{isTamil ? 'விற்பனையாளர்களுக்கு ₹50,000' : '₹50,000 for sellers'}</strong>
        <span className={styles.footerFill} />
        <span>{isTamil ? 'தனித்தனி லீக் தரவரிசைகள் வெற்றியாளர்களைத் தீர்மானிக்கின்றன • மொத்த டீலர் புள்ளிகள் சேர்க்கப்படவில்லை' : 'Separate league standings determine the winners • Total dealer points not combined'}</span>
      </footer>

      <TermsAndConditionsModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        defaultTab="prizes"
      />
    </motion.section>
  );
}
