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
    const { token, dealerId, identifier, username, mobile, password } = body;

    const rawIdentifier = identifier || dealerId || username || mobile || token;

    if (!rawIdentifier) {
      return NextResponse.json(
        { error: 'TVS Dealer ID or Registered Mobile number is required' },
        { status: 400 }
      );
    }

    // ── Input Sanitization ─────────────────────────────────────────────
    const authIdentifier = sanitizeDealerIdentifier(String(rawIdentifier));
    if (!authIdentifier) {
      return NextResponse.json(
        { error: 'Invalid identifier format' },
        { status: 400 }
      );
    }

    const result = await loginDealer(authIdentifier, password);
    if (!result.success || !result.session) {
      // ── Audit: Failed Login ────────────────────────────────────────
      logAudit({
        ...createAuditEntry(request, 'public', `LOGIN_FAILED: ${authIdentifier}`),
        status: 401,
      });
      const res = NextResponse.json(
        { error: result.error || 'Authentication failed' },
        { status: 401 }
      );
      applySecurityHeaders(res);
      return res;
    }

    // ── Audit: Successful Login ──────────────────────────────────────
    logAudit({
      ...createAuditEntry(request, 'dealer', `LOGIN_SUCCESS: dealer_id=${result.session.dealerId}`),
      status: 200,
    });

    const res = NextResponse.json({
      success: true,
      dealer: {
        displayName: result.session.displayName,
        maskedName: result.session.maskedName,
        city: result.session.city,
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
    dealer: {
      displayName: dealer.displayName,
      maskedName: dealer.maskedName,
      city: dealer.city,
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
