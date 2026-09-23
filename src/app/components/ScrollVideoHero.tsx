'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Flame,
  Radio,
  Award,
  TrendingUp,
  Calendar,
  ChevronDown,
  Zap,
  Target,
  BarChart3,
  Users,
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
  city = 'National Network',
  nextAuctionLabel = 'Thursday at 2:00 PM IST',
  tagline = 'A STRONGER DEALER COMMUNITY • DRIVING A BRIGHTER TOMORROW',
}: ScrollVideoHeroProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isPastSection, setIsPastSection] = useState(false);
  const rafRef = useRef<number>(0);

  // Smooth scroll-driven progress calculation
  const handleScroll = useCallback(() => {
    if (!sectionRef.current) return;

    const rect = sectionRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const totalHeight = rect.height;
    const scrolled = Math.max(0, -rect.top);
    const progress = Math.min(1, Math.max(0, scrolled / (totalHeight - windowHeight * 0.3)));
    setScrollProgress(progress);

    // Hide fixed layers once scrolled completely past the section
    setIsPastSection(rect.bottom < windowHeight * 0.1);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(handleScroll);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [handleScroll]);

  // Entry animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollToContent = () => {
    if (sectionRef.current) {
      const bottom = sectionRef.current.getBoundingClientRect().bottom + window.scrollY;
      window.scrollTo({ top: bottom - 40, behavior: 'smooth' });
    }
  };

  // Parallax interpolation values
  const p = scrollProgress;
  const heroOpacity = Math.max(0, 1 - p * 2.5);
  const heroScale = 1 + p * 0.15;
  const heroY = p * -80;
  const overlayOpacity = Math.min(0.7, p * 1.2);

  // Layer 2 (Community banner) — appears at 20% scroll
  const layer2Progress = Math.max(0, Math.min(1, (p - 0.2) / 0.35));
  const layer2Opacity = layer2Progress;
  const layer2Y = 60 - layer2Progress * 60;
  const layer2Scale = 0.92 + layer2Progress * 0.08;

  // HUD cards stagger
  const hudReveal = Math.max(0, Math.min(1, (p - 0.05) / 0.3));

  // Stats counters reveal
  const statsReveal = Math.max(0, Math.min(1, (p - 0.35) / 0.25));

  // Final CTA section
  const ctaReveal = Math.max(0, Math.min(1, (p - 0.55) / 0.25));

  return (
    <section ref={sectionRef} className="scroll-hero-section">
      {/* ═══ LAYER 0: Ambient Particle Grid Background ═══ */}
      <div className="scroll-hero-ambient" style={{ display: isPastSection ? 'none' : undefined }}>
        <div className="particle-field">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="ambient-particle"
              style={{
                top: `${(i * 17) % 100}%`,
                left: `${(i * 23) % 100}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${8 + (i % 5) * 2}s`,
                width: `${1 + (i % 3)}px`,
                height: `${1 + (i % 3)}px`,
              }}
            />
          ))}
        </div>
      </div>

      {/* ═══ LAYER 1: Primary Hero — Analyst Financial Dashboard ═══ */}
      <div
        className="scroll-hero-layer scroll-hero-layer--primary"
        style={{
          opacity: heroOpacity,
          transform: `translateY(${heroY}px) scale(${heroScale})`,
          display: isPastSection ? 'none' : undefined,
        }}
      >
        <div className="scroll-hero-image-frame">
          <img
            src="/scroll_banner_analyst.png"
            alt="TVS Certified Live Auction Analyst Dashboard"
            className="scroll-hero-image"
            loading="eager"
          />
          <div className="scrim-top" />
          <div className="scrim-bottom" />
          <div className="scrim-vignette" />
          <div
            className="scrim-dark-overlay"
            style={{ opacity: overlayOpacity }}
          />
        </div>

        {/* Corporate Status Header Badges */}
        <div
          className="scroll-hero-header"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: `translateY(${isVisible ? 0 : -20}px)`,
          }}
        >
          <div className="broadcast-live-pill">
            <span className="live-ping">
              <span className="ping-dot" />
              <span className="ping-ring" />
            </span>
            <Radio className="w-3.5 h-3.5 text-rose-500" />
            <span className="broadcast-text">TVS TELEMETRY LIVE</span>
            <span className="broadcast-divider">•</span>
            <span className="broadcast-campaign">SEP 2026 CAMPAIGN</span>
          </div>
          <div className="shield-badge">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>TVS Certified Network</span>
          </div>
        </div>

        {/* Central Hero Copy */}
        <div
          className="scroll-hero-center-content"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: `translateY(${isVisible ? 0 : 40}px)`,
          }}
        >
          <div className="hero-tag-strip">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>DEALER SUPERCUP 2026</span>
          </div>
          <h1 className="scroll-hero-title">
            Executive Marketing
            <span className="title-gradient-glow"> Command Center</span>
          </h1>
          <p className="scroll-hero-subtitle">
            {dealerName} • {city} • Performance Analytics & Live Auction Stream
          </p>
          <p className="scroll-hero-tagline">{tagline}</p>
        </div>
      </div>

      {/* ═══ LAYER 2: Community Banner Parallax Reveal ═══ */}
      <div
        className="scroll-hero-layer scroll-hero-layer--secondary"
        style={{
          opacity: layer2Opacity,
          transform: `translateY(${layer2Y}px) scale(${layer2Scale})`,
          display: isPastSection ? 'none' : undefined,
        }}
      >
        <div className="scroll-hero-image-frame scroll-hero-image-frame--community">
          <img
            src="/scroll_banner_community.png"
            alt="TVS Dealer Community"
            className="scroll-hero-image"
            loading="eager"
          />
          <div className="scrim-top" />
          <div className="scrim-bottom" />
          <div className="scrim-vignette" />
        </div>

        {/* Community Layer Text */}
        <div
          className="scroll-hero-community-text"
          style={{
            opacity: layer2Progress > 0.3 ? Math.min(1, (layer2Progress - 0.3) / 0.4) : 0,
            transform: `translateY(${
              layer2Progress > 0.3 ? Math.max(0, 30 - ((layer2Progress - 0.3) / 0.4) * 30) : 30
            }px)`,
          }}
        >
          <h2 className="community-headline">
            A Stronger <span className="text-gradient-warm">Dealer Community</span>
          </h2>
          <p className="community-subline">
            Driving a Brighter Tomorrow — Compete, Transact, Earn, Lead
          </p>
        </div>
      </div>

      {/* ═══ LAYER 3: Floating HUD Telemetry Cards ═══ */}
      <div
        className="scroll-hero-hud-layer"
        style={{
          opacity: hudReveal,
          pointerEvents: hudReveal > 0.5 ? 'auto' : 'none',
          display: isPastSection ? 'none' : undefined,
        }}
      >
        <div className="hud-card-grid">
          <div
            className="hud-metric-card hud-metric--gold"
            style={{
              opacity: Math.min(1, hudReveal * 2),
              transform: `translateY(${Math.max(0, 40 - hudReveal * 80)}px) scale(${
                0.9 + Math.min(0.1, hudReveal * 0.2)
              })`,
            }}
          >
            <div className="hud-metric-icon">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div className="hud-metric-content">
              <div className="hud-metric-label">NATIONAL RANK</div>
              <div className="hud-metric-value hud-metric-value--gold">#{rank}</div>
            </div>
            <div className="hud-metric-glow hud-metric-glow--gold" />
          </div>

          <div
            className="hud-metric-card hud-metric--cyan"
            style={{
              opacity: Math.min(1, Math.max(0, hudReveal * 2 - 0.3)),
              transform: `translateY(${Math.max(0, 50 - hudReveal * 100)}px) scale(${
                0.9 + Math.min(0.1, hudReveal * 0.2)
              })`,
            }}
          >
            <div className="hud-metric-icon">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="hud-metric-content">
              <div className="hud-metric-label">TOTAL ACCUMULATED</div>
              <div className="hud-metric-value hud-metric-value--cyan">
                {points} <span className="pts-suffix">PTS</span>
              </div>
            </div>
            <div className="hud-metric-glow hud-metric-glow--cyan" />
          </div>

          <div
            className="hud-metric-card hud-metric--blue"
            style={{
              opacity: Math.min(1, Math.max(0, hudReveal * 2 - 0.6)),
              transform: `translateY(${Math.max(0, 60 - hudReveal * 120)}px) scale(${
                0.9 + Math.min(0.1, hudReveal * 0.2)
              })`,
            }}
          >
            <div className="hud-metric-icon">
              <Calendar className="w-5 h-5 text-sky-400" />
            </div>
            <div className="hud-metric-content">
              <div className="hud-metric-label">NEXT 2 PM AUCTION</div>
              <div className="hud-metric-value hud-metric-value--blue">{nextAuctionLabel}</div>
            </div>
            <div className="hud-metric-glow hud-metric-glow--blue" />
          </div>
        </div>
      </div>

      {/* ═══ LAYER 4: Animated Stats Counter Bar ═══ */}
      <div
        className="scroll-hero-stats-bar"
        style={{
          opacity: statsReveal,
          transform: `translateY(${Math.max(0, 30 - statsReveal * 30)}px)`,
          display: isPastSection ? 'none' : undefined,
        }}
      >
        <div className="stats-bar-inner">
          <div className="stats-bar-item">
            <BarChart3 className="w-4 h-4 text-sky-400" />
            <span className="stats-bar-number">{points}</span>
            <span className="stats-bar-label">Points Scored</span>
          </div>
          <div className="stats-bar-divider" />
          <div className="stats-bar-item">
            <Target className="w-4 h-4 text-amber-400" />
            <span className="stats-bar-number">#{rank}</span>
            <span className="stats-bar-label">National Rank</span>
          </div>
          <div className="stats-bar-divider" />
          <div className="stats-bar-item">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="stats-bar-number">{city}</span>
            <span className="stats-bar-label">Dealership Hub</span>
          </div>
          <div className="stats-bar-divider" />
          <div className="stats-bar-item">
            <Zap className="w-4 h-4 text-rose-500" />
            <span className="stats-bar-number">LIVE</span>
            <span className="stats-bar-label">Telemetry Stream</span>
          </div>
        </div>
      </div>

      {/* ═══ LAYER 5: Scroll CTA ═══ */}
      <div
        className="scroll-hero-cta"
        style={{
          opacity: ctaReveal > 0 ? Math.max(0.3, 1 - ctaReveal) : 0.8,
          display: isPastSection ? 'none' : undefined,
        }}
      >
        <button
          onClick={scrollToContent}
          className="scroll-cta-button"
          aria-label="Scroll down to explore analytics"
        >
          <span className="scroll-cta-text">SCROLL TO EXPLORE ANALYTICS</span>
          <ChevronDown className="w-4 h-4 scroll-cta-chevron" />
        </button>
      </div>

      {/* ═══ SCROLL PROGRESS INDICATOR ═══ */}
      <div className="scroll-progress-track" style={{ display: isPastSection ? 'none' : undefined }}>
        <div
          className="scroll-progress-fill"
          style={{ height: `${p * 100}%` }}
        />
      </div>
    </section>
  );
}
