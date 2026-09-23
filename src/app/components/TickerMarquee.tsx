'use client';

import React from 'react';

interface TickerItem {
  label: string;
  value: string;
  badge?: string;
  type?: 'positive' | 'accent' | 'neutral' | 'live';
}

const DEFAULT_ITEMS: TickerItem[] = [
  { label: 'AUCTION PULSE', value: 'LIVE 2:00 PM THURSDAYS', badge: 'BROADCAST', type: 'live' },
  { label: 'TVS CERTIFIED', value: 'TRANSPARENT DIGITAL AUCTIONS', badge: 'OFFICIAL', type: 'accent' },
  { label: 'MARUTI SWIFT ZXI', value: '₹4,85,000 • 2m 14s', badge: 'HOT BID', type: 'positive' },
  { label: 'SUPER CUP BONUS', value: 'ALL 4 MATCHES = +20 PTS', badge: 'REWARD', type: 'accent' },
  { label: 'MAHINDRA XUV700', value: '₹13,75,000 • 3m 21s', badge: 'WINNING', type: 'positive' },
  { label: 'COMMUNITY', value: 'DRIVING A BRIGHTER TOMORROW', badge: 'VISION', type: 'neutral' },
  { label: 'HYUNDAI i20 SPORTZ', value: '₹6,70,000 • 6m 31s', badge: 'BIDDING', type: 'positive' },
  { label: 'NEXT AUCTION', value: 'MATCH #2 THURSDAY', badge: 'COUNTDOWN', type: 'live' },
  { label: 'TATA NEXON EV', value: '₹8,25,000 • 1m 08s', badge: 'HOT BID', type: 'positive' },
];

export default function TickerMarquee({ customItems }: { customItems?: TickerItem[] }) {
  const items = customItems || DEFAULT_ITEMS;

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
