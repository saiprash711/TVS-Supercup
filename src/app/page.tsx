'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Radio,
  Phone,
  Mail,
  HelpCircle,
  AlertCircle,
  X
} from 'lucide-react';
import SwitchMode from './components/watermelon/switch-mode';

function BackgroundLayers({ mousePos }: { mousePos: { x: number; y: number } }) {
  return (
    <div className="login-bg-root" aria-hidden="true">
      {/* Dynamic Aurora Glow Blooms */}
      <div className="aurora-blob aurora-1" />
      <div className="aurora-blob aurora-2" />
      <div className="aurora-blob aurora-3" />
      <div className="aurora-blob aurora-4" />

      {/* Interactive Cursor Spotlight Tracking */}
      <div
        className="login-cursor-spotlight"
        style={{
          background: `radial-gradient(700px circle at ${mousePos.x}% ${mousePos.y}%, var(--spotlight-glow), transparent 75%)`,
        }}
      />

      {/* Automotive High-Speed Velocity Streaks */}
      <div className="login-speed-streaks" />

      {/* Concentric Telemetry Stadium Radar Rings */}
      <div className="login-telemetry-radar">
        <div className="radar-ring radar-ring-1" />
        <div className="radar-ring radar-ring-2" />
        <div className="radar-ring radar-ring-3" />
      </div>

      {/* Precision HUD Micro-Dot Matrix & Crosshair Blueprint */}
      <div className="login-hud-matrix" />

      {/* Subtle Atmospheric Shimmer Particles */}
      {Array.from({ length: 14 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            top: `${8 + (i * 7) % 84}%`,
            left: `${4 + (i * 11) % 92}%`,
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
            animation: `floatSlow ${18 + i * 2}s ease-in-out infinite ${i * 0.4}s`,
            opacity: 0.35 + (i % 4) * 0.1,
          }}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [dealerId, setDealerId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 35 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = Math.round((e.clientX / window.innerWidth) * 100);
      const y = Math.round((e.clientY / window.innerHeight) * 100);
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    // Check if remembered dealer ID exists
    const savedId = localStorage.getItem('supercup_remembered_dealer');
    if (savedId) {
      setDealerId(savedId);
    }

    // Check if already authenticated
    fetch('/api/auth/login')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          router.push('/dashboard');
        }
      })
      .catch(() => { })
      .finally(() => setCheckingAuth(false));
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerId.trim()) {
      setErrorMessage('Please enter your Dealer ID, Mobile, or Email.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: dealerId.trim(),
          password: password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (rememberMe) {
          localStorage.setItem('supercup_remembered_dealer', dealerId.trim());
        } else {
          localStorage.removeItem('supercup_remembered_dealer');
        }
        try {
          sessionStorage.removeItem('tvs_supercup_rules_seen_session');
        } catch {}
        router.push('/dashboard');
      } else {
        setErrorMessage(data.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('Unable to connect to authentication service. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="login-container">
        <BackgroundLayers mousePos={mousePos} />
        <div className="loading-container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="loading-spinner"></div>
          <span>Verifying secure session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      {/* ─── World-Class Ambient Background System ─── */}
      <BackgroundLayers mousePos={mousePos} />

      {/* Floating Theme Switcher */}
      <div className="login-theme-pill">
        <SwitchMode width={52} height={26} />
      </div>

      {/* Main Dual-Wing Layout Wrapper */}
      <div className="login-layout-wrapper">
        {/* Left Column: Championship Showcase & Telemetry */}
        <div className="login-showcase">
          <div className="showcase-badge">
            <span className="live-pulse-dot" />
            <Radio size={13} />
            <span>Live 2026–27 Championship</span>
          </div>

          <h1 className="showcase-title">
            TVS Dealer <span className="hero-title-accent">Super Cup</span>
          </h1>

          <p className="showcase-description">
            The official live championship for certified dealerships across India. Earn rank points on every verified auction transaction, compete on the national leaderboard, and win podium cash awards.
          </p>

          {/* Championship Highlights Grid */}
          <div className="showcase-grid">
            <div className="showcase-card">
              <div className="showcase-card-icon gold">
                <Trophy size={20} />
              </div>
              <div className="showcase-card-title">₹50,000 Cash Podium</div>
              <div className="showcase-card-sub">
                Awarded to top performing buyer and seller dealerships.
              </div>
            </div>

            <div className="showcase-card">
              <div className="showcase-card-icon cyan">
                <Radio size={20} />
              </div>
              <div className="showcase-card-title">Real-Time Scoring</div>
              <div className="showcase-card-sub">
                Instant telemetry and automated points calculation synced to every auction.
              </div>
            </div>

            <div className="showcase-card showcase-card-wide">
              <div className="showcase-card-icon blue">
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="showcase-card-title">TVS Certified Network</div>
                <div className="showcase-card-sub">
                  Official corporate portal with single sign-on security and verifiable competition standards.
                </div>
              </div>
            </div>
          </div>

          {/* Guest Link / Quick Leaderboard Jump */}
          <div className="showcase-footer-pill">
            <span>Want to inspect active rankings?</span>
            <Link href="/leaderboard" className="showcase-footer-link">
              <span>View Public Leaderboard</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Right Column: Executive Authentication Console */}
        <div className="login-auth-card">
          <div className="login-auth-bezel">
            <div className="login-auth-inner">
              {/* Header */}
              <div className="login-auth-header">
                <div className="login-brand-tag">
                  <ShieldCheck size={14} />
                  <span>Authorized Dealer Portal</span>
                </div>
                <h2 className="login-auth-title">Dealer Sign In</h2>
                <p className="login-auth-subtitle">
                  Enter your credentials to access your live dashboard and competition telemetry.
                </p>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="login-alert">
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin}>
                {/* Identifier Input */}
                <div className="form-group">
                  <label className="form-label" htmlFor="dealerId">
                    <span>Dealer ID, Mobile, or Email</span>
                  </label>
                  <div className="input-with-icon">
                    <span className="input-icon-left">
                      <User size={18} />
                    </span>
                    <input
                      id="dealerId"
                      type="text"
                      className="form-input"
                      placeholder="e.g. murali@tvs.in or 8328416428"
                      value={dealerId}
                      onChange={(e) => {
                        setDealerId(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      autoComplete="username"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="form-group">
                  <label className="form-label" htmlFor="password">
                    <span>Password</span>
                  </label>
                  <div className="input-with-icon">
                    <span className="input-icon-left">
                      <Lock size={18} />
                    </span>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Enter your account password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Assistance */}
                <div className="login-options-row">
                  <label className="login-checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ accentColor: 'var(--tvs-blue)', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="login-forgot-link"
                    onClick={() => setShowForgotModal(true)}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%' }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', margin: 0 }}></div>
                      <span>Verifying credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <span className="btn-arrow-circle">
                        <ArrowRight size={15} />
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* Security Seal */}
              <div className="login-card-divider">
                <div className="login-trust-seal">
                  <ShieldCheck size={14} style={{ color: '#6cc14f' }} />
                  <span>TVS Certified Network</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password / Support Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="modal" style={{ maxWidth: '440px', padding: 0, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--tvs-blue-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tvs-blue)' }}>
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Account Assistance</h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>TVS Certified Dealer Support</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px 28px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '20px' }}>
                Your Super Cup login uses your official <strong>TVS Certified Auction Portal</strong> credentials. If your password has expired or you need a reset, please contact the helpdesk:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <a
                  href="tel:+918925900478"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Phone size={18} style={{ color: 'var(--tvs-blue)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Phone Help Desk</div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>+91 8925900478</div>
                  </div>
                </a>

                <a
                  href="mailto:tc100@tvs.in"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Mail size={18} style={{ color: 'var(--accent-cyan)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Support Email</div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>tc100@tvs.in</div>
                  </div>
                </a>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', height: '42px', borderRadius: '10px', fontWeight: 600 }}
                onClick={() => setShowForgotModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
