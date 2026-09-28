'use client';

import type { CSSProperties } from 'react';
import { CalendarDays, Crown, IndianRupee, ShoppingCart, Sparkles, Store, Trophy } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import styles from './PrizeShowcase.module.css';

const podium = [
  { place: '1st', amount: '25,000', label: 'Champion', tone: 'gold' },
  { place: '2nd', amount: '15,000', label: 'Runner-up', tone: 'silver' },
  { place: '3rd', amount: '10,000', label: 'Third place', tone: 'bronze' },
] as const;

function PrizeLeague({ title, eyebrow, type }: {
  title: string;
  eyebrow: string;
  type: 'buyer' | 'seller';
}) {
  const Icon = type === 'buyer' ? ShoppingCart : Store;
  const reduceMotion = useReducedMotion();

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
          <span>Prize pool</span>
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
              <strong>{prize.place} prize</strong>
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
            Super Cup 2026–27 rewards
          </span>
          <h2 id="prize-showcase-title">The road to <span>₹1,00,000</span></h2>
          <p>Two leaderboards. Six winners. One season to make every transaction count.</p>
          <div className={styles.campaignDates} aria-label="Campaign period: 15 October 2026 to 14 January 2027">
            <CalendarDays size={17} strokeWidth={1.8} aria-hidden="true" />
            <span>Campaign period</span>
            <strong>15 OCT 2026</strong>
            <span className={styles.dateLine} aria-hidden="true" />
            <strong>14 JAN 2027</strong>
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
            <span>Total prize pool</span>
            <strong>₹1 LAKH</strong>
          </div>
        </motion.div>
      </header>

      <div className={styles.leagueGrid}>
        <PrizeLeague title="Buyers’ podium" eyebrow="Win through buying" type="buyer" />
        <PrizeLeague title="Sellers’ podium" eyebrow="Win through selling" type="seller" />
      </div>

      <footer className={styles.footerNote}>
        <span className={styles.liveDot} aria-hidden="true" />
        <strong>₹50,000 for buyers</strong>
        <span className={styles.divider} aria-hidden="true" />
        <strong>₹50,000 for sellers</strong>
        <span className={styles.footerFill} />
        <span>Final standings determine the winners</span>
      </footer>
    </motion.section>
  );
}
