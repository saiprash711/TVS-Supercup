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

      {/* Official Tie-Breaker Rule from Pitch Deck */}
      <div
        style={{
          marginTop: '24px',
          padding: '20px 24px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(250, 204, 21, 0.22)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Scale size={20} style={{ color: '#facc15' }} />
            <strong style={{ fontSize: '0.95rem', color: '#f8fafc', letterSpacing: '-0.01em' }}>
              {isTamil ? 'சமநிலை விதிமுறை (Tie-Breaker Rule)' : 'Official Tie-Breaker Rule'}
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

        <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(250, 204, 21, 0.15)', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(250, 204, 21, 0.12)', color: '#facc15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IndianRupee size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', color: '#fef08a', fontWeight: 700 }}>
              {isTamil
                ? 'இறுதி புள்ளிகள் சமமாக இருந்தால்: அதிக GMV கொண்ட டீலர் முன்னிலை பெறுவார்'
                : 'Tie-breaker: If final scores are equal, the dealer with the higher GMV ranks higher.'}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
              {isTamil
                ? 'வாங்குபவர் மற்றும் விற்பனையாளர் லீக்குகளில் இரண்டு அல்லது அதற்கு மேற்பட்ட டீலர்கள் ஒரே புள்ளிகளைப் பெற்றால், அவர்களின் மொத்த பரிவர்த்தனை மதிப்பு (GMV - Gross Merchandise Value) அடிப்படையில் தரவரிசை தீர்மானிக்கப்படும்.'
                : 'In both Buyer and Seller leagues, if two or more dealers score identical total points, the dealership with the higher Gross Merchandise Value (GMV / transaction value) will be awarded the higher podium rank.'}
            </p>
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
