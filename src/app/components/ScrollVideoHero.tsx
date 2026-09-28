'use client';

import React from 'react';
import {
  Trophy,
  Flame,
  Radio,
  Award,
  TrendingUp,
  Calendar,
  Zap,
  ShieldCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface ScrollVideoHeroProps {
  dealerName?: string;
  rank?: number | string;
  points?: number | string;
  city?: string;
  nextAuctionLabel?: string;
  tagline?: string;
}

export default function ScrollVideoHero({
  dealerName = 'Valued Partner',
  rank = '3',
  points = '4,820',
  city = 'Chennai Hub',
  nextAuctionLabel = 'Thursday at 2:00 PM IST',
  tagline = 'A STRONGER DEALER COMMUNITY • DRIVING A BRIGHTER TOMORROW',
}: ScrollVideoHeroProps) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="hero-cockpit-section" aria-label="Dealer Championship Cockpit">
      <div className="hero-cockpit-bezel">
        <div className="hero-cockpit-inner">
          {/* Tactical Background HUD Matrix & Radar Arcs */}
          <div className="cockpit-hud-matrix" aria-hidden="true" />
          <div className="cockpit-radar-arcs" aria-hidden="true">
            <div className="cockpit-radar-ring cockpit-radar-ring-1" />
            <div className="cockpit-radar-ring cockpit-radar-ring-2" />
          </div>

          {/* Top Telemetry Status Header */}
          <div className="cockpit-top-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div className="cockpit-status-pill">
                <span className="pulsing-live-dot" />
                <span>TELEMETRY ACTIVE</span>
              </div>
              <div className="cockpit-season-badge">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>SUPER CUP 2026–27</span>
              </div>
            </div>

            <div className="cockpit-network-pill">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>TVS Certified Network • {city}</span>
            </div>
          </div>

          {/* Central Cockpit Greeting */}
          <div className="cockpit-header-content">
            <div className="cockpit-eyebrow">
              <Flame className="w-3.5 h-3.5 text-[#364ea2]" />
              <span>EXECUTIVE COMMAND COCKPIT</span>
            </div>
            <h1 className="cockpit-title">
              Welcome to the Arena, <span className="hero-title-accent">{dealerName}</span>
            </h1>
            <p className="cockpit-subtitle">
              Compete across high-velocity 2:00 PM auctions, climb the national leaderboard, and secure your place on the season champion&apos;s podium.
            </p>
          </div>

          {/* 4-Card Bento Telemetry Matrix */}
          <div className="cockpit-bento-grid">
            {/* Card 1: National Rank */}
            <div className="cockpit-card gold">
              <div className="cockpit-card-top">
                <div className="cockpit-icon-badge gold">
                  <Trophy className="w-5 h-5" />
                </div>
                <span className="cockpit-card-tag">STANDINGS</span>
              </div>
              <div className="cockpit-card-metric gold">#{rank}</div>
              <div className="cockpit-card-sub">Official National Ranking</div>
              <div className="cockpit-card-badge gold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Podium Contender</span>
              </div>
            </div>

            {/* Card 2: Total Accumulated Points */}
            <div className="cockpit-card emerald">
              <div className="cockpit-card-top">
                <div className="cockpit-icon-badge emerald">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="cockpit-card-tag">ACCUMULATED SCORE</span>
              </div>
              <div className="cockpit-card-metric emerald">
                {points} <span style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.85 }}>PTS</span>
              </div>
              <div className="cockpit-card-sub">Audited Transaction Points</div>
              <div className="cockpit-card-badge emerald">
                <Zap className="w-3.5 h-3.5" />
                <span>+350 pts this week</span>
              </div>
            </div>

            {/* Card 3: Next Auction Window */}
            <div className="cockpit-card blue">
              <div className="cockpit-card-top">
                <div className="cockpit-icon-badge blue">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <span className="cockpit-card-tag">NEXT 2 PM WINDOW</span>
              </div>
              <div className="cockpit-card-metric" style={{ fontSize: '1.25rem', lineHeight: '1.3' }}>
                {nextAuctionLabel}
              </div>
              <div className="cockpit-card-sub">Live 2 PM Bidding Floor</div>
              <div className="cockpit-card-badge blue">
                <Calendar className="w-3.5 h-3.5" />
                <span>Attendance +15 PTS</span>
              </div>
            </div>

            {/* Card 4: Grand Prize Pool (Entire Season) */}
            <div className="cockpit-card purple">
              <div className="cockpit-card-top">
                <div className="cockpit-icon-badge purple">
                  <Award className="w-5 h-5" />
                </div>
                <span className="cockpit-card-tag">SEASON PRIZE POOL</span>
              </div>
              <div className="cockpit-card-metric">₹50,000</div>
              <div className="cockpit-card-sub">Entire Season (1st: ₹25K • 2nd: ₹15K • 3rd: ₹10K)</div>
              <div className="cockpit-card-badge purple">
                <Trophy className="w-3.5 h-3.5" />
                <span>Full Season Podium</span>
              </div>
            </div>
          </div>

          {/* Cockpit Footer Action Strip */}
          <div className="cockpit-footer-bar">
            <div className="cockpit-ticker">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>{tagline}</span>
            </div>

            <div className="cockpit-quick-links">
              <button
                type="button"
                className="cockpit-anchor-btn"
                onClick={() => scrollTo('prize-showcase')}
              >
                <span>Prize Showcase</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="cockpit-anchor-btn"
                onClick={() => scrollTo('national-standings')}
              >
                <span>Standings & Radar</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="cockpit-anchor-btn"
                onClick={() => scrollTo('match-schedule')}
              >
                <span>Match Schedule</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="cockpit-anchor-btn"
                onClick={() => scrollTo('auction-telemetry')}
              >
                <span>Live Feed</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
