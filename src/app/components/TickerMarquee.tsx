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
  { label: 'SELLING ALLOCATIONS', value: 'LISTING = +5 PTS • CONVERSION = +10 PTS • COMMISSION = +5 PTS', badge: 'SELLING', type: 'positive' },
  { label: 'TVS CERTIFIED', value: 'OFFICIAL DEALER SUPERCUP 2026–27', badge: 'CHAMPIONSHIP', type: 'accent' },
  { label: 'BUYING ALLOCATIONS', value: 'PARTICIPATION = +1 PT • BIDS = +1 PT • CONVERSION = +10 PTS', badge: 'BUYING', type: 'positive' },
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
