/**
 * POST /api/admin/auth
 * 
 * Admin login endpoint.
 * Protected against dealer session access.
 * 
 * Security Controls:
 * - Rate limiting: 3 attempts per 15 minutes per IP
 * - Audit logging: All admin auth attempts logged
 * - Timing-safe comparison (in auth.ts)
 */

import { NextRequest, NextResponse } from 'next/server';
import { loginAdmin, isAdmin, logoutAdmin } from '@/lib/auth';
import {
  checkRateLimit,
  RATE_LIMITS,
  getClientIp,
  createAuditEntry,
  logAudit,
  applySecurityHeaders,
} from '@/lib/security';

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  // ── Rate Limiting (stricter for admin: 3 attempts / 15 min) ────────
  const rateCheck = checkRateLimit(clientIp, RATE_LIMITS.adminLogin());
  if (!rateCheck.allowed) {
    logAudit({
      ...createAuditEntry(request, 'public', 'ADMIN_RATE_LIMITED'),
      status: 429,
    });
    const res = NextResponse.json(
      { error: 'Too many attempts. Account locked temporarily.' },
      { status: 429 }
    );
    res.headers.set('Retry-After', String(rateCheck.retryAfterSeconds));
    applySecurityHeaders(res);
    return res;
  }

  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    const success = await loginAdmin(password);
    if (!success) {
      logAudit({
        ...createAuditEntry(request, 'public', 'ADMIN_LOGIN_FAILED'),
        status: 401,
      });
      const res = NextResponse.json(
        { error: 'Invalid administrator password' },
        { status: 401 }
      );
      applySecurityHeaders(res);
      return res;
    }

    logAudit({
      ...createAuditEntry(request, 'admin', 'ADMIN_LOGIN_SUCCESS'),
      status: 200,
    });

    const res = NextResponse.json({ success: true });
    applySecurityHeaders(res);
    return res;
  } catch (error: unknown) {
    console.error('Admin auth error:', error);
    logAudit({
      ...createAuditEntry(request, 'public', 'ADMIN_AUTH_ERROR'),
      status: 500,
    });
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}

export async function GET() {
  const admin = await isAdmin();
  return NextResponse.json({ authenticated: admin });
}

export async function DELETE(request: NextRequest) {
  logAudit({
    ...createAuditEntry(request, 'admin', 'ADMIN_LOGOUT'),
    status: 200,
  });
  await logoutAdmin();
  return NextResponse.json({ success: true });
}
