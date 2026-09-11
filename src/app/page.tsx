'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
      .catch(() => {})
      .finally(() => setCheckingAuth(false));
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerId.trim()) {
      setErrorMessage('Please enter your TVS Dealer ID or Registered Mobile number.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your TVS account password.');
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
        router.push('/dashboard');
      } else {
        setErrorMessage(data.error || 'Authentication failed. Please verify your TVS credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('Unable to connect to TVS authentication service. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };


  if (checkingAuth) {
    return (
      <div className="login-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <span>Verifying TVS session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-trophy">🏆</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 82, 204, 0.15)', border: '1px solid rgba(0, 82, 204, 0.3)', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--tvs-blue-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-sm)' }}>
            <span>🔒</span> TVS Certified Portal
          </div>
          <h1 className="login-title">
            Dealer <span className="hero-title-accent">Super Cup</span>
          </h1>
          <p className="login-subtitle">Sign in with your official TVS Dealer credentials</p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="login-alert">
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          {/* Dealer ID / Mobile / Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="dealerId">
              TVS UserName, Email, or Mobile
            </label>
            <div className="input-with-icon">
              <span className="input-icon-left">🆔</span>
              <input
                id="dealerId"
                type="text"
                className="form-input"
                placeholder="e.g. bhavaniprasad999@gmail.com or 8328416428"
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

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              TVS Password
            </label>
            <div className="input-with-icon">
              <span className="input-icon-left">🔒</span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your TVS Certified password"
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
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot Password */}
          <div className="login-remember-row">
            <label className="login-checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--tvs-blue)' }}
              />
              <span>Remember TVS Dealer ID</span>
            </label>
            <button
              type="button"
              className="login-forgot-link"
              style={{ background: 'none', border: 'none', font: 'inherit' }}
              onClick={() => setShowForgotModal(true)}
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
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
              <>🔐 Sign In to Super Cup</>
            )}
          </button>
        </form>

        {/* TVS Certified Notice */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          margin: 'var(--space-md) 0 var(--space-sm)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🔑</span> Official TVS Certified Account
          </div>
          <div>
            Sign in using your TVS Certified registered <strong>Email</strong>, <strong>Mobile</strong>, or <strong>Username</strong> with your portal password.
          </div>
        </div>

        {/* Trust badge */}
        <div className="login-trust-badge">
          <span>🛡️</span>
          <span>Official TVS Certified Single Sign-On Security</span>
        </div>

        {/* Links */}
        <div style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
          <Link
            href="/leaderboard"
            style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}
          >
            View Public Leaderboard →
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-sm)' }}>
          <Link
            href="/admin"
            style={{ fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.6 }}
          >
            Admin Access Portal
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">TVS Certified Password Assistance</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-md)' }}>
              Your Super Cup login uses your standard <strong>TVS Certified Auction Portal</strong> credentials.
            </p>
            <div style={{ background: 'var(--surface-primary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)', fontSize: '0.85rem', lineHeight: '1.6' }}>
              <p>📞 <strong>Dealer Help Desk:</strong> 1800-TVS-CERT</p>
              <p>✉️ <strong>Support Email:</strong> support@tvscertified.in</p>
              <p>🏢 Or contact your assigned TVS Area Territory Manager.</p>
              <p style={{ marginTop: '8px', color: 'var(--tvs-lime)' }}>
                <em>For demo testing, use password: <code>tvs123</code></em>
              </p>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-primary btn-sm"
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
