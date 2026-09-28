'use client';

import React from 'react';

export interface TickerItem {
  label: string;
  value: string;
  badge?: string;
  type?: 'positive' | 'accent' | 'neutral' | 'live';
}

const DEFAULT_ITEMS: TickerItem[] = [
  { label: 'AUCTION FLOOR', value: 'OPENS THURSDAYS AT 2:00 PM IST', badge: 'BROADCAST', type: 'live' },
  { label: 'SEASON GRAND PRIZE POOL', value: '₹1,00,000 FOR ENTIRE SEASON (₹50K BUYERS + ₹50K SELLERS)', badge: 'REWARD', type: 'accent' },
  { label: 'SCORING RULES', value: 'BUY/SELL = +10 PTS • MATCH ATTENDANCE = +15 PTS', badge: 'VERIFIED', type: 'positive' },
  { label: 'TVS CERTIFIED', value: 'OFFICIAL DEALER SUPERCUP 2026–27', badge: 'CHAMPIONSHIP', type: 'accent' },
  { label: 'LIVE BIDDING', value: 'VERIFIED IN-ROOM BIDS = +2 PTS', badge: 'MULTIPLIER', type: 'positive' },
  { label: 'SERIES BONUS', value: 'ATTEND ALL MATCHES FOR +20 PTS BONUS', badge: 'BONUS', type: 'accent' },
  { label: 'INSPECTIONS & WATCHLIST', value: 'INSPECTION = +1 PT • WATCHLIST BOOKMARK = +1 PT', badge: 'RULES', type: 'neutral' },
  { label: 'DEALER COMMUNITY', value: 'A STRONGER DEALER COMMUNITY • DRIVING A BRIGHTER TOMORROW', badge: 'VISION', type: 'neutral' },
];

export default function TickerMarquee({ customItems }: { customItems?: TickerItem[] }) {
  const items = customItems && customItems.length > 0 ? customItems : DEFAULT_ITEMS;

  return (
    <div className="ticker-wrapper" aria-hidden="true">
      <div className="ticker-track">
        {/* Double items for seamless infinite scroll */}
        {[...items, ...items].map((item, idx) => (
          <div key={idx} className="ticker-chip">
            {item.badge && (
              <span className={`ticker-badge ${item.type || 'neutral'}`}>
                {item.type === 'live' && <span className="ticker-dot-pulse" />}
                {item.badge}
              </span>
            )}
            <span className="ticker-label">{item.label}:</span>
            <span className="ticker-value">{item.value}</span>
            <span className="ticker-separator">✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}
