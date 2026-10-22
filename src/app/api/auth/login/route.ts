/**
 * POST /api/auth/login
 * GET  /api/auth/logout
 * GET  /api/auth/me
 * 
 * Authentication endpoints for dealer login/logout.
 * 
 * Security Controls:
 * - Rate limiting: 5 attempts per 15 minutes per IP
 * - Input sanitization: Strips control chars & injection patterns
 * - Audit logging: All auth attempts logged with IP, timestamp, outcome
 */

import { NextRequest, NextResponse } from 'next/server';
import { loginDealer, getCurrentDealer, logoutDealer } from '@/lib/auth';
import {
  checkRateLimit,
  RATE_LIMITS,
  getClientIp,
  sanitizeDealerIdentifier,
  createAuditEntry,
  logAudit,
  applySecurityHeaders,
} from '@/lib/security';

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  // ── Rate Limiting ──────────────────────────────────────────────────────
  const rateCheck = checkRateLimit(clientIp, RATE_LIMITS.dealerLogin());
  if (!rateCheck.allowed) {
    logAudit({
      ...createAuditEntry(request, 'public', 'RATE_LIMITED'),
      status: 429,
    });
    const res = NextResponse.json(
      { error: 'Too many login attempts. Please try again later.', retryAfter: rateCheck.retryAfterSeconds },
      { status: 429 }
    );
    res.headers.set('Retry-After', String(rateCheck.retryAfterSeconds));
    applySecurityHeaders(res);
    return res;
  }

  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { type, token, dealerId, identifier, username, mobile, password } = body;

    // Discriminated Schema: Token / SSO Login vs Credential Login
    const isTokenFlow = type === 'token' || (Boolean(token) && !password);

    let loginResult;
    let auditIdentifier = 'unknown';

    if (isTokenFlow) {
      const rawToken = token || identifier;
      if (!rawToken || typeof rawToken !== 'string') {
        return NextResponse.json({ error: 'Valid TVS session token is required' }, { status: 400 });
      }
      if (rawToken.length < 10 || rawToken.length > 4096) {
        return NextResponse.json({ error: 'Malformed token length' }, { status: 400 });
      }
      // Never truncate tokens using identifier sanitizer
      const userAgent = request.headers.get('user-agent') || undefined;
      loginResult = await loginDealer(
        { type: 'token', token: rawToken },
        undefined,
        { ipAddress: clientIp, userAgent, loginType: 'SSO' }
      );
    } else {
      // Credential Flow
      const rawId = identifier || dealerId || username || mobile;
      if (!rawId || typeof rawId !== 'string') {
        return NextResponse.json(
          { error: 'TVS Dealer ID or Registered Mobile number is required' },
          { status: 400 }
        );
      }
      if (rawId.length < 1 || rawId.length > 100) {
        return NextResponse.json({ error: 'Identifier length must be between 1 and 100 characters' }, { status: 400 });
      }
      // Reject control characters
      if (/[\x00-\x1F\x7F]/.test(rawId)) {
        return NextResponse.json({ error: 'Identifier contains invalid characters' }, { status: 400 });
      }

      if (typeof password !== 'string' || password.length === 0) {
        return NextResponse.json({ error: 'Password is required' }, { status: 400 });
      }
      if (password.length > 256) {
        return NextResponse.json({ error: 'Password exceeds maximum allowed length' }, { status: 400 });
      }

      auditIdentifier = rawId.trim();
      const userAgent = request.headers.get('user-agent') || undefined;
      // Pass password as EXACT string (do not trim silently)
      loginResult = await loginDealer(
        {
          type: 'credentials',
          identifier: rawId.trim(),
          password,
        },
        undefined,
        { ipAddress: clientIp, userAgent, loginType: 'CREDENTIALS' }
      );
    }

    if (!loginResult.success || !loginResult.session) {
      // ── Audit: Failed Login ────────────────────────────────────────
      logAudit({
        ...createAuditEntry(request, 'public', `LOGIN_FAILED: ${auditIdentifier}`),
        status: 401,
      });
      const res = NextResponse.json(
        { error: loginResult.error || 'Authentication failed' },
        { status: 401 }
      );
      applySecurityHeaders(res);
      return res;
    }

    const session = loginResult.session;

    // ── Audit: Successful Login ──────────────────────────────────────
    logAudit({
      ...createAuditEntry(request, 'dealer', `LOGIN_SUCCESS: dealer_id=${session.dealerId}`),
      status: 200,
    });

    const res = NextResponse.json({
      success: true,
      isEmployee: Boolean(session.isEmployee),
      dealer: {
        displayName: session.displayName,
        maskedName: session.maskedName,
        city: session.city,
        isEmployee: Boolean(session.isEmployee),
      },
    });
    applySecurityHeaders(res);
    return res;
  } catch (error) {
    console.error('Login error:', error);
    logAudit({
      ...createAuditEntry(request, 'public', 'LOGIN_ERROR'),
      status: 500,
    });
    return NextResponse.json(
      { error: process.env.NODE_ENV !== 'production' && error instanceof Error ? error.message : 'Login failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const dealer = await getCurrentDealer();
  if (!dealer) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    isEmployee: Boolean(dealer.isEmployee),
    dealer: {
      displayName: dealer.displayName,
      maskedName: dealer.maskedName,
      city: dealer.city,
      isEmployee: Boolean(dealer.isEmployee),
    },
  });
}

export async function DELETE(request: NextRequest) {
  const dealer = await getCurrentDealer();
  await logoutDealer();
  if (dealer) {
    logAudit({
      ...createAuditEntry(request, 'dealer', `LOGOUT: dealer_id=${dealer.dealerId}`),
      status: 200,
    });
  }
  return NextResponse.json({ success: true });
}
